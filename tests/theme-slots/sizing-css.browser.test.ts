/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { chromium } from 'playwright-core';
import paginationTheme from '../../app/components/reborn/ui/reborn-pagination/reborn-pagination.config';
import switchTheme from '../../app/components/reborn/ui/reborn-switch/reborn-switch.config';
import { tv } from '../../app/lib/tv';
import { cn } from '../../app/lib/utils';

const executablePath = process.env.GUIDE_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);

it('原生尺寸随根字号缩放，支持外部覆盖并保留特殊几何关系', { skip: !browserAvailable }, async () => {
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';`, {
    base: resolve('.'), onDependency() {},
  });
  const fixtures = [
    { name: 'avatar', className: 'size-6', dimension: 'height', small: 24, large: 30 },
    { name: 'button-height', className: 'h-8', dimension: 'height', small: 32, large: 40 },
    { name: 'button-width', className: 'w-8', dimension: 'width', small: 32, large: 40 },
    { name: 'badge-small', className: 'size-4.5', dimension: 'height', small: 18, large: 22.5 },
    { name: 'input-icon', className: 'size-3', dimension: 'height', small: 12, large: 15 },
    { name: 'alert-icon', className: 'h-5', dimension: 'height', small: 20, large: 25 },
    { name: 'otp', className: 'h-10', dimension: 'height', small: 40, large: 50 },
    { name: 'tooltip', className: 'max-w-80', dimension: 'maxWidth', small: 320, large: 400 },
    { name: 'table-sm', className: 'h-9', dimension: 'height', small: 36, large: 45 },
    { name: 'table-md', className: 'h-12', dimension: 'height', small: 48, large: 60 },
    { name: 'table-lg', className: 'h-14', dimension: 'height', small: 56, large: 70 },
    { name: 'table-line', className: 'h-px', dimension: 'height', small: 1, large: 1 },
    { name: 'time-list', className: 'h-time-picker-panel-list-height', dimension: 'height', small: 174, large: 174 },
    { name: 'time-item', className: 'h-time-picker-panel-item', dimension: 'height', small: 29, large: 29 },
    { name: 'time-line', className: 'h-px', dimension: 'height', small: 1, large: 1 },
    { name: 'override-size', className: cn('size-6', 'size-10'), dimension: 'height', small: 40, large: 50 },
    { name: 'override-pixel', className: cn('h-8', 'h-[42px]'), dimension: 'height', small: 42, large: 42 },
    { name: 'override-special', className: cn('h-time-picker-panel-item', 'h-8'), dimension: 'height', small: 32, large: 40 },
    { name: 'override-slot', className: tv({ slots: { root: 'h-6' } })().root({ class: 'h-12' }), dimension: 'height', small: 48, large: 60 },
  ];
  const pagination = (['sm', 'md', 'lg'] as const).map((size, index) => {
    const styles = tv(paginationTheme)({ size });
    return { size, height: 24 + index * 8, button: styles.button(), ellipsis: styles.ellipsis(), input: styles.input() };
  });
  const switches = (['sm', 'md', 'lg'] as const).flatMap((size, index) =>
    (['circle', 'line'] as const).flatMap(type => [false, true].map(active => {
      const styles = tv(switchTheme)({ size, type, active });
      return { name: `switch-${size}-${type}-${active}`, height: 16 + index * 8, type, active, track: styles.track(), thumb: styles.thumb() };
    })),
  );
  const css = compiler.build([
    ...fixtures.flatMap(item => item.className.split(/\s+/)),
    ...pagination.flatMap(item => [item.button, item.ellipsis, item.input].flatMap(value => value.split(/\s+/))),
    ...switches.flatMap(item => [item.track, item.thumb].flatMap(value => value.split(/\s+/))),
  ]);
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}</style>${fixtures.map(item => `<div id="${item.name}" class="${item.className}"></div>`).join('')}${pagination.map(item => `
      <div id="pagination-${item.size}" class="${item.button}"></div>
      <div id="ellipsis-${item.size}" class="${item.ellipsis}"></div>
      <div id="pagination-input-${item.size}" class="${item.input}"></div>
    `).join('')}${switches.map(item => `<div id="${item.name}" class="${item.track}"><div class="${item.thumb}"></div></div>`).join('')}`);
    // 只测静态几何；切换动效、按压规则及减少动态效果设置由开关动画测试覆盖。
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // 原生刻度随根字号缩放，1px 细线和时间列的 29px / 174px 几何关系保持固定。
    for (const [fontSize, expected] of [[16, 'small'], [20, 'large']] as const) {
      await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px`; }, fontSize);
      const actual = await page.evaluate(items => items.map(item => ({
        name: item.name,
        value: Number.parseFloat(getComputedStyle(document.getElementById(item.name)!)[item.dimension]),
      })), fixtures);
      assert.deepEqual(actual, fixtures.map(item => ({ name: item.name, value: item[expected] })));
      const pagerSizes = await page.evaluate(items => items.map(item => {
        const button = getComputedStyle(document.getElementById(`pagination-${item.size}`)!);
        const ellipsis = getComputedStyle(document.getElementById(`ellipsis-${item.size}`)!);
        const input = getComputedStyle(document.getElementById(`pagination-input-${item.size}`)!);
        return {
          height: Number.parseFloat(button.height), minWidth: Number.parseFloat(button.minWidth),
          ellipsisHeight: Number.parseFloat(ellipsis.height), ellipsisMinWidth: Number.parseFloat(ellipsis.minWidth),
          inputWidth: Number.parseFloat(input.width),
        };
      }), pagination);
      assert.deepEqual(pagerSizes, pagination.map(item => {
        const height = item.height * fontSize / 16;
        return { height, minWidth: height, ellipsisHeight: height, ellipsisMinWidth: height, inputWidth: height * 3 };
      }));
      assert.equal(actual.find(item => item.name === 'time-list')!.value / actual.find(item => item.name === 'time-item')!.value, 6);
      const switchSizes = await page.evaluate(items => items.map(item => {
        const track = document.getElementById(item.name)!;
        const trackRect = track.getBoundingClientRect();
        const thumbRect = track.firstElementChild!.getBoundingClientRect();
        return {
          diameter: thumbRect.height, width: thumbRect.width,
          edge: item.active ? trackRect.right - thumbRect.right : thumbRect.left - trackRect.left,
          vertical: item.type === 'line'
            ? thumbRect.top + thumbRect.height / 2 - trackRect.top - trackRect.height / 2
            : thumbRect.top - trackRect.top,
        };
      }), switches);
      assert.deepEqual(switchSizes, switches.map(item => {
        const diameter = item.height * fontSize / 16 - 4;
        return { diameter, width: diameter, edge: 2, vertical: item.type === 'line' ? 0 : 2 };
      }));
    }
  } finally {
    await browser.close();
  }
});
