import type { Browser, BrowserContext, Page } from 'playwright-core';
/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { join } from 'node:path';
import { after, before, it } from 'node:test';
import { chromium } from 'playwright-core';

// 显式传入已启动的站点地址；测试不会启停开发服务，也不会调用真实 AI 或会话接口。
const baseURL = process.env.REBORN_TEST_URL;
let browser: Browser;
before(async () => { if (baseURL) browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

const source = `<script setup lang="ts">
import { message } from "~/components/reborn/ui/reborn-toast";
const submitting = ref(false);
function onFetchError() {
  message.error("网络异常，请稍后重试");
}
function onSubmit() {
  submitting.value = true;
  message.loading({ content: "提交中…", duration: 0, key: "submit" });
  setTimeout(() => {
    submitting.value = false;
    message.error({ content: "提交失败，请稍后重试", key: "submit" });
  }, 1200);
}
</script>
<template>
  <div class="flex flex-wrap items-center gap-3 p-6">
    <RebornButton color="error" variant="soft" label="模拟接口报错" @click="onFetchError" />
    <RebornButton :loading="submitting" label="提交（loading → 失败）" @click="onSubmit" />
  </div>
</template>`;
const reply = `接口失败时可以使用 Toast 消息提示。\n\n\`\`\`vue\n${source}\n\`\`\``;

async function openPlayground(page: Page, code: string) {
  await page.goto(`${baseURL}/playground#code=${Buffer.from(code).toString('base64url')}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.locator('.cm-editor').waitFor();
  await page.locator('style[data-reborn-runtime-tailwind]').waitFor({ state: 'attached' });
}

it('运行时工具类只影响预览，工具栏主题保持可读，任意新类仍生效', { skip: !baseURL }, async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    await openPlayground(page, '<template><div class="w-[137px] bg-[#123456] p-3">动态样式</div></template>');
    await page.waitForFunction(() => getComputedStyle([...document.querySelectorAll('div')].find(e => e.classList.contains('w-[137px]'))!).backgroundColor === 'rgb(18, 52, 86)');
    const styles = await page.evaluate(() => {
      const shell = document.querySelector('main')!.parentElement!;
      const button = [...document.querySelectorAll('header button')].find(e => e.textContent?.includes('格式化'))!;
      return { shell: getComputedStyle(shell).backgroundColor, body: getComputedStyle(document.body).backgroundColor,
        text: getComputedStyle(button).color, background: getComputedStyle(button).backgroundColor };
    });
    assert.equal(styles.shell, styles.body, '运行时 bg-default 不得覆盖站点的语义背景');
    assert.notEqual(styles.text, styles.background, '按钮文字与背景必须可以区分');
    if (process.env.REBORN_TEST_SCREENSHOTS) await page.screenshot({ path: join(process.env.REBORN_TEST_SCREENSHOTS, 'playground-fixed.png') });
    await page.getByRole('button', { name: 'Switch to light mode', exact: true }).click();
    await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).waitFor();
    const lightBackground = await page.locator('main').evaluate(e => ({
      shell: getComputedStyle(e.parentElement!).backgroundColor, body: getComputedStyle(document.body).backgroundColor,
    }));
    assert.equal(lightBackground.shell, lightBackground.body, '浅色主题也不能被运行时工具类覆盖');
    await page.setViewportSize({ width: 375, height: 812 });
    const fits = await page.locator('header').evaluate(e => e.scrollWidth <= e.clientWidth);
    assert.equal(fits, true, '手机工具栏不得溢出或挤掉操作按钮');
  } finally { await context.close(); }
});

it('Ask AI 的 Toast 示例可直接运行，loading 使用同一 key 更新为失败提示', { skip: !baseURL }, async () => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await openPlayground(page, source);
    await page.getByRole('button', { name: '模拟接口报错', exact: true }).click();
    assert.equal(await page.getByText('运行时错误:message is not defined', { exact: true }).count(), 0);
    await page.getByText('网络异常，请稍后重试', { exact: true }).waitFor({ timeout: 3000 });
    await page.getByRole('button', { name: '提交（loading → 失败）', exact: true }).click();
    await page.getByText('提交中…', { exact: true }).waitFor();
    await page.getByText('提交失败，请稍后重试', { exact: true }).waitFor();
    assert.equal(await page.getByText('提交中…', { exact: true }).count(), 0);
    if (process.env.REBORN_TEST_SCREENSHOTS) await page.screenshot({ path: join(process.env.REBORN_TEST_SCREENSHOTS, 'playground-fixed.png') });
  } finally { await context.close(); }
});

async function openAssistant(context: BrowserContext, markdown = reply) {
  await context.route('**/api/auth/me', route => route.fulfill({ json: { user: { id: 'copy-test', name: '复制测试' }, feishuEnabled: false } }));
  await context.route('**/api/chat/**', route => route.fulfill({ json: route.request().url().endsWith('/list')
    ? [{ id: 'copy-fixture', title: '接口错误提示', updatedAt: '2026-10-26 00:00:00' }]
    : { messages: [{ id: 'reply-copy', role: 'assistant', parts: [{ type: 'text', text: markdown }] }] } }));
  await context.addInitScript(() => sessionStorage.setItem('reborn-assistant-conversation', 'copy-fixture'));
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const authenticated = page.waitForResponse(response => response.url().endsWith('/api/auth/me'));
  await page.goto(`${baseURL}/components/miscellaneous/reborn-toast`);
  await authenticated;
  const trigger = page.locator('header button').filter({ has: page.locator('.iconify--carbon') });
  await trigger.click();
  await page.getByRole('dialog', { name: 'Ask AI' }).waitFor();
  await page.getByText('接口失败时可以使用 Toast 消息提示。', { exact: true }).waitFor().catch(async error => {
    throw new Error(`${error.message}\n浏览器错误：${errors.join('\n')}\n抽屉内容：${await page.getByRole('dialog', { name: 'Ask AI' }).textContent()}`);
  });
  return page;
}

it('Ask AI 可以复制代码和整条回复，鼠标仍能选取正文', { skip: !baseURL }, async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
  try {
    const page = await openAssistant(context);
    const dialog = page.getByRole('dialog', { name: 'Ask AI' });
    await dialog.getByRole('button', { name: '复制代码', exact: true }).click({ timeout: 3000 });
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), source);
    await dialog.getByRole('button', { name: '复制回复', exact: true }).click({ timeout: 3000 });
    assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), reply);
    if (process.env.REBORN_TEST_SCREENSHOTS) await page.screenshot({ path: join(process.env.REBORN_TEST_SCREENSHOTS, 'assistant-copy-fixed.png') });
    const paragraph = dialog.getByText('接口失败时可以使用 Toast 消息提示。', { exact: true });
    await paragraph.dblclick();
    assert.ok(await page.evaluate(() => !!window.getSelection()?.toString()), '正文应允许鼠标选择');
  } finally { await context.close(); }
});

it('Clipboard API 不可用时，抽屉焦点限制下仍能复制并恢复焦点', { skip: !baseURL }, async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
  try {
    const page = await openAssistant(context);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    const button = page.getByRole('button', { name: '复制回复', exact: true });
    await button.click({ timeout: 3000 });
    const reader = await context.newPage();
    await reader.goto(`${baseURL}/playground`);
    assert.equal((await reader.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n'), reply);
    assert.equal(await button.evaluate(e => document.activeElement === e), true);
    assert.equal(await page.locator('textarea[readonly]').count(), 0, '临时复制节点必须清理');
  } finally { await context.close(); }
});

it('xml 标记的 Vue 示例可以直接运行，代码复制保留模板字符串的结束符', { skip: !baseURL }, async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], viewport: { width: 1440, height: 1000 } });
  try {
    const javascript = 'const content = `请求失败`';
    const page = await openAssistant(context, `${reply.replace('```vue', '```xml')}\n\n\`\`\`javascript\n${javascript}\n\`\`\``);
    const dialog = page.getByRole('dialog', { name: 'Ask AI' });
    await dialog.getByRole('button', { name: '复制代码', exact: true }).nth(1).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), javascript);
    const popup = page.waitForEvent('popup');
    await dialog.getByRole('button', { name: '在 Playground 运行', exact: true }).click();
    const playground = await popup;
    await playground.getByRole('button', { name: '模拟接口报错', exact: true }).click();
    await playground.getByText('网络异常，请稍后重试', { exact: true }).waitFor();
  } finally { await context.close(); }
});

it('浏览器拒绝两种复制方式时显示失败，不误报已复制', { skip: !baseURL }, async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await openAssistant(context);
    // 使用固定脚本，避免 tsx 的函数命名辅助代码进入浏览器序列化闭包。
    await page.evaluate(`
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText() { return Promise.reject(new Error('NotAllowedError')); } } });
      document.execCommand = () => false;
    `);
    const dialog = page.getByRole('dialog', { name: 'Ask AI' });
    await dialog.getByRole('button', { name: '复制回复', exact: true }).click();
    await dialog.getByRole('status').filter({ hasText: '复制失败' }).waitFor();
    assert.equal(await dialog.getByText('已复制', { exact: true }).count(), 0);
  } finally { await context.close(); }
});
