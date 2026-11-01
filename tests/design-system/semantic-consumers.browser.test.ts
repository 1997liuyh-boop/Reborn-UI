/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

it('控件实际配色跟随语义角色、局部主题覆盖及实底配对前景', async () => {
  // 打包真实 config 和合并器，避免在测试中复制组件配色实现。
  const bundle = await build({
    stdin: {
      contents: `
        import { tv } from './app/lib/tv';
        import steps from './app/components/reborn/ui/reborn-steps/reborn-steps.config';
        import carousel from './app/components/reborn/ui/reborn-carousel/reborn-carousel.config';
        import radio from './app/components/reborn/ui/reborn-radio/reborn-radio.config';
        import switchTheme from './app/components/reborn/ui/reborn-switch/reborn-switch.config';
        import slider from './app/components/reborn/ui/reborn-slider/reborn-slider.config';
        import tree from './app/components/reborn/ui/reborn-tree/reborn-tree.config';
        import fab from './app/components/reborn/ui/reborn-fab/reborn-fab.config';
        import guide, { guideButtonUi } from './app/components/reborn/ui/reborn-guide/reborn-guide.config';
        import timeline, { TIMELINE_PRESET_COLORS } from './app/components/reborn/ui/reborn-timeline/reborn-timeline.config';
        import datePanel from './app/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config';
        export const themes = { steps, carousel: tv(carousel), radio: tv(radio), switchTheme: tv(switchTheme), slider: tv(slider), tree: tv(tree), fab: tv(fab), guide: tv(guide), timeline: tv(timeline), datePanel: tv(datePanel) };
        export { guideButtonUi, TIMELINE_PRESET_COLORS };
      `,
      resolveDir: resolve('.'), loader: 'ts',
    },
    alias: { '~': resolve('app') }, bundle: true, write: false, format: 'esm', platform: 'node',
  });
  const { themes, guideButtonUi, TIMELINE_PRESET_COLORS } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0]!.text).toString('base64')}`);
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'];
  const samples = colors.map(color => {
    const steps = themes.steps({ color, status: 'process' });
    const carousel = themes.carousel({ color, indicatorType: 'button' });
    const radio = themes.radio({ color, variant: 'button', appearance: 'filled', checked: true });
    const switchTheme = themes.switchTheme({ color, active: true });
    const fab = themes.fab({ color });
    const guide = themes.guide({ color, active: true });
    const timeline = themes.timeline({ variant: 'solid' });
    // data-pair：背景与前景都须等于参照；data-fg：文字色等于参照前景；data-bg-fg：以参照前景作底色（指示点、反相按钮）。
    return `<section data-color="${color}">
      <i data-ref="background" class="bg-${color}"></i><i data-ref="foreground" class="text-${color}-foreground"></i>
      <div class="${steps.item()}"><span data-pair="steps" class="${steps.marker()}">1</span></div>
      <div class="${carousel.indicators()}"><span data-pair="carousel" class="${carousel.indicatorActive()}">1</span></div>
      <span data-part="radio-background" class="${radio.slider()}"></span><span data-part="radio-foreground" class="${radio.root()}">单选</span>
      <span data-part="switch-background" class="${switchTheme.activeTrack()}"></span><span data-part="switch-foreground" class="${switchTheme.inlineActive()}">开</span>
      <span data-part="slider-background" class="${themes.slider({ color }).thumb()}"></span>
      <span data-tree="indicator" class="${themes.tree({ color }).dropIndicator()}"></span>
      <span data-pair="fab-trigger" class="${fab.trigger()}"><i data-fg="fab-icon" class="${fab.icon()}">+</i></span>
      <span data-pair="fab-capsule" class="${fab.capsuleWrapper()}">胶囊</span>
      <div data-pair="guide-box" class="${guide.guideBox({ class: 'static' })}">
        <span data-fg="guide-title" class="${guide.guideTitle()}">标题</span><span data-fg="guide-body" class="${guide.guideBody()}">正文</span>
        <span data-fg="guide-close" class="${guide.closeButton()}">×</span><span data-bg-fg="guide-dot" class="${guide.indicatorDot()}"></span>
        <span data-fg="guide-prev" class="${guideButtonUi.prev.base}">上一步</span><span data-bg-fg="guide-next" class="${guideButtonUi.next.base}">下一步</span>
        <span data-fg="guide-skip" class="${guideButtonUi.skip.base}">跳过</span>
      </div>
      <span data-pair="timeline-dot" class="${timeline.dot({ class: TIMELINE_PRESET_COLORS[color] })}"></span>
      <span data-pair="date-panel" class="${themes.datePanel({ color, activeType: 'fill' }).dayActive()}">8</span>
    </section>`;
  }).join('');
  const compiler = await compile("@import './app/assets/css/main.css';", { base: resolve('.'), onDependency() {} });
  const css = compiler.build([...new Set([...samples.matchAll(/class="([^"]*)"/g)].flatMap(match => match[1]!.split(/\s+/)))]);
  const browser = await chromium.launch({ executablePath: process.env.GUIDE_BROWSER_PATH || chromium.executablePath(), headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<style>${css}
* { transition: none !important; animation: none !important; }</style><main>${samples}</main>`);
    await page.addScriptTag({ content: 'globalThis.__name = value => value;' });
    for (const dark of [false, true]) {
      for (const custom of [false, true]) {
        const results = await page.evaluate(({ dark, custom }) => {
          document.documentElement.classList.toggle('dark', dark);
          const main = document.querySelector('main')!;
          main.style.cssText = custom ? '--color-primary: rgb(18, 52, 86); --color-primary-foreground: rgb(255, 255, 255)' : '';
          return [...document.querySelectorAll('section')].map(section => {
            const style = (selector: string) => getComputedStyle(section.querySelector(selector)!);
            const background = style('[data-ref=background]').backgroundColor;
            const foreground = style('[data-ref=foreground]').color;
            const pairs = [...section.querySelectorAll('[data-pair]')].map(element => ({ name: element.getAttribute('data-pair'), background: getComputedStyle(element).backgroundColor, foreground: getComputedStyle(element).color }));
            const foregrounds = [...section.querySelectorAll('[data-fg]')].map(element => ({ name: element.getAttribute('data-fg'), color: getComputedStyle(element).color }));
            const inverted = [...section.querySelectorAll('[data-bg-fg]')].map(element => ({ name: element.getAttribute('data-bg-fg'), background: getComputedStyle(element).backgroundColor }));
            // 指示线没有前景；neutral 例外取正文色 gray-9，用同一节点切到 gray-9 读出参照值。
            const indicator = section.querySelector<HTMLElement>('[data-tree=indicator]')!;
            const tree = getComputedStyle(indicator).backgroundColor;
            const probe = document.createElement('i');
            probe.className = 'bg-gray-9';
            section.append(probe);
            const gray9 = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return { color: section.dataset.color, background, foreground, pairs, foregrounds, inverted, tree, gray9, parts: Object.fromEntries(['radio', 'switch', 'slider'].map(name => [name, {
              background: style(`[data-part=${name}-background]`).backgroundColor,
              foreground: ['radio', 'switch'].includes(name) ? style(`[data-part=${name}-foreground]`).color : null,
            }])) };
          });
        }, { dark, custom });
        for (const result of results) {
          const label = `${result.color}/${dark ? 'dark' : 'light'}/${custom ? 'custom' : 'default'}`;
          if (custom && result.color === 'primary') assert.equal(result.background, 'rgb(18, 52, 86)', '局部主色覆盖必须实际生效');
          for (const pair of result.pairs) {
            assert.equal(pair.background, result.background, `${label}/${pair.name} 背景`);
            assert.equal(pair.foreground, result.foreground, `${label}/${pair.name} 前景`);
          }
          for (const item of result.foregrounds) assert.equal(item.color, result.foreground, `${label}/${item.name} 前景`);
          for (const item of result.inverted) assert.equal(item.background, result.foreground, `${label}/${item.name} 反相底色`);
          for (const [name, part] of Object.entries(result.parts)) {
            assert.equal(part.background, result.background, `${label}/${name} 背景`);
            if (part.foreground) assert.equal(part.foreground, result.foreground, `${label}/${name} 前景`);
          }
          assert.equal(result.tree, result.color === 'neutral' ? result.gray9 : result.background, `${label}/tree 指示线`);
        }
      }
    }
  }
  finally { await browser.close(); }
});
