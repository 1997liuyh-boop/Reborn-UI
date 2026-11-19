/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

it('关闭控件三态颜色与级联按压、展开及多选间距在真实 CSS 中生效', async () => {
  const configs = ['badge', 'alert', 'dialog', 'drawer', 'guide', 'field-trigger', 'select', 'date-picker', 'tabs', 'image'];
  const bundle = await build({ stdin: {
    contents: `import {tv} from './app/lib/tv';
      ${configs.map((name, index) => `import ${name === 'alert' ? '{ alertTheme as c1 }' : `c${index}`} from './app/components/reborn/ui/reborn-${name}/reborn-${name}.config';`).join('\n')}
      import cascader from './app/components/reborn/ui/reborn-cascader/reborn-cascader.config';
      import {messageTheme} from './app/components/reborn/ui/reborn-toast/reborn-toast.config';
      import {notificationTheme} from './app/components/reborn/ui/reborn-notification/reborn-notification.config';
      export const themes = [${configs.map((_, index) => `tv(c${index})`).join(',')},messageTheme,notificationTheme];
      export const cascade=tv(cascader);`,
    resolveDir: resolve('.'), loader: 'ts',
  }, alias: { '~': resolve('app') }, bundle: true, write: false, format: 'esm', platform: 'node' });
  const { themes, cascade } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0]!.text).toString('base64')}`);
  const keys = ['closeButton', 'closeButton', 'close', 'close', 'closeButton', 'clearBtn', 'clearBtn', 'clearBtn', 'tabClose', 'previewClose', 'close', 'close'];
  let samples = '<i id="gray1" class="text-gray-1"></i><i id="gray6" class="text-gray-6"></i><i id="gray8" class="text-gray-8"></i><i id="gray9" class="text-gray-9"></i>';
  for (const [index, theme] of themes.entries()) {
    for (const color of ['primary', 'neutral']) {
      const ui = theme({ color, variant: 'filled', clearable: true, size: 'md' });
      // 清空按钮的默认隐藏和绝对定位不影响颜色合同；测试中放进可点击的普通流。
      samples += `<button data-close="${index}-${color}" class="${ui[keys[index]]({ class: 'static inline-flex size-8' })}"><span class="${index === 1 ? ui.closeIcon() : ''}">×</span></button>`;
    }
  }
  for (const color of ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral']) {
    const palette = { primary: 'brand', secondary: 'secondary', success: 'green', info: 'blue', warning: 'orange', error: 'red', neutral: 'gray' }[color];
    const ui = cascade({ color, disabled: false });
    samples += `<div class="group" tabindex="0"><div data-cascade="${color}" data-state="closed" class="${ui.trigger()}">级联</div></div><i data-pressed="${color}" class="border-${palette}-7"></i><i data-open="${color}" class="border-${color}"></i>`;
  }
  for (const size of ['sm', 'md', 'lg']) {
    for (const variant of ['outlined', 'filled', 'underlined', 'borderless']) {
      const ui = cascade({ size, variant, multiple: true, wrapTags: true, disabled: false });
      samples += `<div data-padding="${size}-${variant}" class="${ui.trigger()}">多选</div>`;
    }
  }
  const compiler = await compile("@import './app/assets/css/main.css';", { base: resolve('.'), onDependency() {} });
  const css = compiler.build([...new Set([...samples.matchAll(/class="([^"]*)"/g)].flatMap(match => match[1]!.split(/\s+/)))]);
  const browser = await chromium.launch({ executablePath: process.env.GUIDE_BROWSER_PATH || chromium.executablePath(), headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css} * {transition:none!important;animation:none!important}</style>${samples}`);
    await page.addScriptTag({ content: 'globalThis.__name = value => value;' });
    for (const dark of [false, true]) {
      await page.evaluate(value => document.documentElement.classList.toggle('dark', value), dark);
      const refs = await page.evaluate(() => Object.fromEntries([1, 6, 8, 9].map(value => [value, getComputedStyle(document.querySelector(`#gray${value}`)!).color])));
      for (const button of await page.locator('[data-close]').all()) {
        await page.mouse.move(0, 0);
        const color = () => button.locator('span').evaluate(el => getComputedStyle(el).color);
        const preview = (await button.getAttribute('data-close'))?.startsWith('9-');
        assert.equal(await color(), refs[preview ? 1 : 6]);
        await button.hover();
        assert.equal(await color(), refs[preview ? 1 : 8]);
        await page.mouse.down();
        assert.equal(await color(), refs[preview ? 1 : 9]);
        await page.mouse.up();
      }
      for (const trigger of await page.locator('[data-cascade]').all()) {
        await trigger.evaluate(el => el.setAttribute('data-state', 'closed'));
        const key = await trigger.getAttribute('data-cascade');
        await trigger.hover();
        await page.mouse.down();
        assert.equal(await trigger.evaluate(el => getComputedStyle(el).borderColor), await page.locator(`[data-pressed="${key}"]`).evaluate(el => getComputedStyle(el).borderColor));
        await page.mouse.up();
        await trigger.evaluate(el => el.setAttribute('data-state', 'open'));
        assert.equal(await trigger.evaluate(el => getComputedStyle(el).borderColor), await page.locator(`[data-open="${key}"]`).evaluate(el => getComputedStyle(el).borderColor));
        assert.match(await trigger.evaluate(el => getComputedStyle(el).boxShadow), /2px/);
      }
      for (const item of await page.locator('[data-padding]').all()) {
        assert.deepEqual(await item.evaluate(el => { const s = getComputedStyle(el); return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]; }), ['4px', '12px', '4px', '4px']);
      }
    }
  }
  finally { await browser.close(); }
});
