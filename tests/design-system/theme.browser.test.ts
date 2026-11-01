/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { chromium } from 'playwright-core';
import { themeColors } from '../../app/utils/themeColor';
import { semanticColors, semanticRoles } from '../../scripts/design/rules';

it('真实主题 CSS 在所有预设与明暗模式保持 6/5/7 色阶及 4.5:1 实心文字对比度', async () => {
  const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
  assert.ok(existsSync(executablePath), '缺少 Chromium，请先运行 pnpm exec playwright-core install chromium');
  const compiler = await compile("@import './app/assets/css/main.css';", { base: resolve('.'), onDependency() {} });
  const palettes = { primary: 'brand', secondary: 'secondary', success: 'green', info: 'blue', warning: 'orange', error: 'red', neutral: 'gray' };
  const candidates = [
    ...semanticColors.flatMap(color => semanticRoles.map(role => `bg-${color}${role}`)),
    ...Object.values(palettes).flatMap(color => Array.from({ length: 10 }, (_, index) => `bg-${color}-${index + 1}`)),
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
          return colors.map(color => ({
            color,
            roles: Object.fromEntries(roles.map(role => [role, colorValue(`${color}${role}`)])),
            palette: Object.fromEntries([1, 2, 5, 6, 7].map(step => [step, colorValue(`${palettes[color]}-${step}`)])),
          }));
        }, { preset, dark, colors: [...semanticColors], roles: [...semanticRoles], palettes });
        for (const item of actual) {
          const label = `${preset}/${dark ? 'dark' : 'light'}/${item.color}`;
          for (const role of semanticRoles) assert.ok(item.roles[role], `${label}${role} 必须有实际颜色`);
          for (const [role, step] of [['', 6], ['-hover', 5], ['-active', 7], ['-soft', 1], ['-border', 2]] as const) assert.deepEqual(item.roles[role], item.palette[step], `${label}${role} 应使用第 ${step} 阶`);
          const luminance = (rgba: number[]) => rgba.slice(0, 3).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
          for (const state of ['', '-hover', '-active'] as const) {
            const background = item.roles[state]!;
            const foreground = item.roles[`${state}-foreground`]!;
            assert.equal(background[3], 255, `${label}${state} 应为不透明颜色`);
            assert.equal(foreground[3], 255, `${label}${state} 前景应为不透明颜色`);
            const values = [luminance(background), luminance(foreground)].sort((a, b) => a - b);
            const ratio = (values[1]! + 0.05) / (values[0]! + 0.05);
            assert.ok(ratio >= 4.5, `${label}${state} 实心文字对比度仅 ${ratio.toFixed(2)}:1`);
          }
        }
      }
    }
  }
  finally {
    await browser.close();
  }
});
