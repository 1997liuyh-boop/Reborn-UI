/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { chromium } from 'playwright-core';
import { themeColors } from '../../app/utils/themeColor';
import { semanticColors, semanticRoles } from '../../scripts/design/rules';

// 实底文字统一取 gray-1（两种模式下的纸面色：浅色为白、深色为近黑），与 6/5/7 阶背景成对使用。
// 这是有意的取舍：浅色模式下多数语义色上的白字低于 4.5:1，见 docs/authoring/design-system.md。
it('真实主题 CSS 在所有预设与明暗模式保持 6/5/7 色阶，实心文字统一取 gray-1', async () => {
  const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
  assert.ok(existsSync(executablePath), '缺少 Chromium，请先运行 pnpm exec playwright-core install chromium');
  const compiler = await compile("@import './app/assets/css/main.css';@import './app/assets/theme/theme-presets.css';", { base: resolve('.'), onDependency() {} });
  const palettes = { primary: 'brand', secondary: 'secondary', success: 'green', info: 'blue', warning: 'orange', error: 'red', neutral: 'gray' };
  const candidates = [
    ...semanticColors.flatMap(color => semanticRoles.map(role => `bg-${color}${role}`)),
    ...Object.values(palettes).flatMap(color => Array.from({ length: 10 }, (_, index) => `bg-${color}-${index + 1}`)),
    'bg-gray-1',
  ];
  const css = compiler.build(candidates);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style><div id="probe"></div>`);
    // tsx 为浏览器闭包中的局部函数保留名称；页面提供同等的无副作用辅助函数。
    await page.addScriptTag({ content: 'globalThis.__name = value => value;' });
    for (const preset of themeColors.map(color => color.preset)) {
      for (const dark of [false, true]) {
        const actual = await page.evaluate(({ preset, dark, colors, roles, palettes }) => {
          document.documentElement.classList.toggle('dark', dark);
          document.documentElement.dataset.themeColor = preset;
          const probe = document.getElementById('probe')!;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d')!;
          const colorValue = (name: string) => {
            const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
            if (!value) return null;
            // 使用浏览器解析最终颜色，覆盖 var() 继承和主题选择器优先级。
            probe.className = `bg-${name}`;
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = getComputedStyle(probe).backgroundColor;
            context.fillRect(0, 0, 1, 1);
            return Array.from(context.getImageData(0, 0, 1, 1).data);
          };
          const paper = colorValue('gray-1');
          return colors.map(color => ({
            color,
            paper,
            roles: Object.fromEntries(roles.map(role => [role, colorValue(`${color}${role}`)])),
            palette: Object.fromEntries([1, 2, 5, 6, 7].map(step => [step, colorValue(`${palettes[color]}-${step}`)])),
          }));
        }, { preset, dark, colors: [...semanticColors], roles: [...semanticRoles], palettes });
        for (const item of actual) {
          const label = `${preset}/${dark ? 'dark' : 'light'}/${item.color}`;
          for (const role of semanticRoles) assert.ok(item.roles[role], `${label}${role} 必须有实际颜色`);
          for (const [role, step] of [['', 6], ['-hover', 5], ['-active', 7], ['-soft', 1], ['-border', 2]] as const) assert.deepEqual(item.roles[role], item.palette[step], `${label}${role} 应使用第 ${step} 阶`);
          for (const state of ['', '-hover', '-active'] as const) {
            assert.equal(item.roles[state]![3], 255, `${label}${state} 应为不透明颜色`);
            assert.deepEqual(item.roles[`${state}-foreground`], item.paper, `${label}${state} 前景应为 gray-1`);
          }
        }
      }
    }
  }
  finally {
    await browser.close();
  }
});
