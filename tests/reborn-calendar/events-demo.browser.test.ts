/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = process.env.CALENDAR_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 日历、右键菜单、对话框、输入框及按钮均使用真实源码，只替换联网图标。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `import Demo from '~/components/reborn/examples/reborn-calendar/RebornCalendarEventsDemo.vue';import {createApp,h} from 'vue';const app=createApp(Demo);app.component('Icon',props=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'}));app.mount('#app');`,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'calendar-events-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'calendar-events-browser', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'calendar-icons' }));
      builder.onLoad({ filter: /.*/, namespace: 'calendar-icons' }, () => ({ contents: `import {h} from 'vue';export const Icon=props=>h('svg',{'data-icon':props.name,viewBox:'0 0 24 24'});`, loader: 'js', resolveDir: resolve('.') }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        const script = compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        });
        // 模拟 Nuxt 对组合式函数的自动导入，保留真实表单上下文逻辑。
        const autoImports = script.content.includes('useFormInject(') && !script.imports.useFormInject ? `import {useFormInject} from '~/composables/useFieldGroup';` : '';
        return { contents: autoImports + script.content, loader: 'ts' };
      });
    } }],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';@import './app/assets/theme/motion.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [
    { base: resolve('app/components/reborn/ui'), pattern: '**/*', negated: false },
    { base: resolve('app/components/reborn/examples/reborn-calendar'), pattern: '**/*', negated: false },
  ] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="margin:24px;min-height:2000px"><div id="app" style="max-width:960px"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function withDemo(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  try {
    await page.clock.install({ time: new Date('2026-10-20T04:00:00Z') });
    await page.goto(url);
    await page.locator('[data-event-day="2026-10-20"]').waitFor().catch(async (error) => {
      throw new Error(`${error.message}\n运行时异常：${errors.join('；')}\n页面文本：${await page.locator('body').textContent()}`);
    });
    await page.clock.resume();
    await run(page);
    assert.deepEqual(errors, [], '真实组件组合不应抛出运行时异常');
  } finally { await page.close(); }
}

async function openMenu(page: Page, day: string) {
  await page.locator(`[data-event-day="${day}"]`).click({ button: 'right' });
  await page.getByRole('menu').getByRole('button', { name: '添加事项', exact: true }).waitFor();
  await page.getByRole('menu').evaluate(element => new Promise<void>((done) => {
    requestAnimationFrame(() => requestAnimationFrame(async () => {
      await Promise.all(element.parentElement!.getAnimations().map(animation => animation.finished));
      done();
    }));
  }));
}

async function closeDialog(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
}

it('右键补位日期不翻月，弹窗按目标日期添加并过滤空白输入，连续添加支持同名事项', { skip: !browserAvailable }, async () => {
  await withDemo(async (page) => {
    await openMenu(page, '2026-09-30');
    assert.equal(await page.getByRole('menu').getByRole('button', { name: '删除事项', exact: true }).isDisabled(), true, '无事项日期禁止删除');
    await page.getByRole('menu').getByRole('button', { name: '添加事项', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '2026年9月30日事项添加', exact: true });
    await dialog.waitFor();
    assert.equal(await page.locator('[data-event-day="2026-10-20"]').count(), 1, '右键补位格后仍停留十月');
    const input = dialog.getByRole('textbox', { name: '事项内容', exact: true });
    const add = dialog.getByRole('button', { name: '添加', exact: true });
    assert.equal(await add.isDisabled(), true, '空输入不能添加');
    await input.fill('   ');
    assert.equal(await add.isDisabled(), true, '纯空白不能添加');
    await input.fill('  同名事项  ');
    await add.click();
    assert.equal(await input.inputValue(), '', '成功添加后清空输入，可继续添加');
    await input.fill('同名事项');
    await input.press('Enter');
    assert.equal(await dialog.getByText('同名事项', { exact: true }).count(), 2, '同一天可保留两条同名事项');
    assert.equal(await page.locator('[data-event-day="2026-09-30"] li').count(), 2, '月视图同步显示两条事项');
    assert.equal(await page.locator('[role="status"]').textContent(), '已为 2026-09-30 添加：同名事项', '事项文本去除首尾空白');
    await page.screenshot({ path: resolve('node_modules/.cache/calendar-add-dialog-review.png') });
    await closeDialog(page);
  });
});

it('按稳定标识删除同名事项中的一条，其他事项保留，年视图显示完整日期前缀', { skip: !browserAvailable }, async () => {
  await withDemo(async (page) => {
    await openMenu(page, '2026-10-20');
    await page.getByRole('menu').getByRole('button', { name: '添加事项', exact: true }).click();
    const input = page.getByRole('dialog').getByRole('textbox', { name: '事项内容', exact: true });
    for (let index = 0; index < 2; index++) {
      await input.fill('同名事项');
      await page.getByRole('dialog').getByRole('button', { name: '添加', exact: true }).click();
    }
    await closeDialog(page);
    await openMenu(page, '2026-10-20');
    await page.getByRole('menu').getByRole('button', { name: '删除事项', exact: true }).click();
    await page.getByRole('dialog', { name: '2026年10月20日事项删除', exact: true }).waitFor();
    const deletes = page.getByRole('dialog').getByRole('button', { name: '删除同名事项', exact: true });
    assert.equal(await deletes.count(), 2);
    await deletes.first().click();
    assert.equal(await deletes.count(), 1, '只删除选定 id，不按标题批量删除');
    assert.equal(await page.getByRole('dialog').getByText('团队例会', { exact: true }).count(), 1, '保留当天原有事项');
    assert.equal(await page.getByRole('dialog').getByText('整理本周计划', { exact: true }).count(), 1, '保留其他原有事项');
    await closeDialog(page);
    await page.getByRole('button', { name: '年', exact: true }).click();
    assert.equal(await page.getByText('2026-10-20：同名事项', { exact: true }).count(), 1, '年视图展示剩余同名事项及日期前缀');
    assert.equal(await page.getByText('2026-10-20：团队例会', { exact: true }).count(), 1);
    await page.screenshot({ path: resolve('node_modules/.cache/calendar-year-events-review.png') });
  });
});

it('关闭右键菜单与编辑弹窗后恢复页面滚动，保留打开前的滚动位置', { skip: !browserAvailable }, async () => {
  await withDemo(async (page) => {
    await page.evaluate(() => window.scrollTo(0, 120));
    const original = await page.evaluate(() => ({ html: document.documentElement.style.overflow, body: document.body.style.overflow, top: window.scrollY }));
    await openMenu(page, '2026-10-20');
    await page.keyboard.press('Escape');
    await page.getByRole('menu').waitFor({ state: 'detached' });
    await openMenu(page, '2026-10-20');
    await page.getByRole('menu').getByRole('button', { name: '添加事项', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    const locked = await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).overflow, body: getComputedStyle(document.body).overflow }));
    assert.ok(locked.html === 'hidden' || locked.body === 'hidden', '弹窗打开时锁定背景滚动');
    await closeDialog(page);
    await page.waitForFunction(value => document.body.style.overflow === value, original.body);
    const restored = await page.evaluate(() => ({ html: document.documentElement.style.overflow, body: document.body.style.overflow, top: window.scrollY }));
    assert.deepEqual(restored, original, '关闭后恢复原来的 overflow 与滚动位置');
    await page.mouse.move(1100, 700);
    await page.mouse.wheel(0, 200);
    await page.waitForFunction(value => window.scrollY > value, original.top);
  });
});
