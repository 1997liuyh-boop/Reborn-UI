/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, compileStyle, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();

it('base 普通图标保留六阶底色，加载图标无背景，所有变体的 outline 加载中心稳定', { skip: !existsSync(executablePath) }, async () => {
  const componentCss: string[] = [];
  const result = await build({
    stdin: {
      contents: `
        import Toast from '~/components/reborn/ui/reborn-toast/RebornToast.vue';
        import {addMessage} from '~/components/reborn/ui/reborn-toast/reborn-toast.config';
        import {createApp,h} from 'vue';
        const app=createApp({render:()=>h(Toast)});
        app.component('Icon',{props:['name'],render(){return h('i',{'data-icon':this.name})}});
        app.mount('#app');
        for(const type of ['info','success','warning','error']) {
          addMessage({type,content:type,duration:0});
        }
        for(const variant of ['base','filled','outlined','soft','subtle']) {
          addMessage({type:'loading',variant,content:variant,duration:0,className:'loading-'+variant});
        }
      `,
      resolveDir: resolve('.'), sourcefile: 'toast-appearance-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'toast-appearance', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        // 保留加载组件的真实动画规则，独立夹具无需作用域后缀。
        for (const style of descriptor.styles) {
          componentCss.push(compileStyle({ source: style.content, filename: path, id: path, scoped: false }).code);
        }
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: ['reborn-toast', 'reborn-loading'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  const css = compiler.build(scanner.scan()) + componentCss.join('\n');
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? result.outputFiles[0]!.text : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('.rb-loading circle').first().waitFor();
    await page.waitForTimeout(350);
    for (const dark of [false, true]) {
      await page.evaluate(value => document.documentElement.classList.toggle('dark', value), dark);
      const colors = await page.locator('.reborn-message').evaluateAll(elements => elements.slice(0, 4).map((element, index) => {
        const token = ['blue', 'green', 'orange', 'red'][index];
        const probe = document.createElement('span');
        probe.style.backgroundColor = `var(--color-${token}-6)`;
        element.append(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { actual: getComputedStyle(element.firstElementChild!).backgroundColor, expected };
      }));
      for (const color of colors) assert.equal(color.actual, color.expected);
      const baseLoading = await page.locator('.loading-base').evaluate(element => {
        const wrapper = element.firstElementChild!;
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-primary)';
        element.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return {
          background: getComputedStyle(wrapper).backgroundColor,
          stroke: getComputedStyle(wrapper.querySelector('path')!).stroke,
          panel: getComputedStyle(element).backgroundColor,
          expected,
        };
      });
      assert.equal(baseLoading.background, 'rgba(0, 0, 0, 0)');
      assert.equal(baseLoading.stroke, baseLoading.expected, '透明背景上的加载弧线使用语义色');
      assert.notEqual(baseLoading.panel, 'rgba(0, 0, 0, 0)', '消息面板保留背景');
    }
    assert.equal(await page.locator('[data-icon="lucide:check"]').count(), 1);
    assert.equal(await page.locator('.rb-loading').count(), 5);
    assert.equal(await page.locator('.animate-spin').count(), 0);
    for (const variant of ['base', 'filled', 'outlined', 'soft', 'subtle']) {
      const loading = page.locator(`.loading-${variant} .rb-loading`);
      const bounds = (await loading.boundingBox())!;
      const size = variant === 'base' ? 14 : 16;
      assert.equal(bounds.width, size);
      assert.equal(bounds.height, size);
      const samples = await loading.evaluate(async (element) => {
        const indicator = element.querySelector('.rb-loading-indicator')!;
        const animation = indicator.getAnimations()[0]!;
        const output = [];
        for (let i = 0; i < 20; i++) {
          await new Promise(requestAnimationFrame);
          const rect = element.getBoundingClientRect();
          // 相对消息面板采样，避免把面板整体入场位移算作图标抖动。
          const panel = element.closest('.reborn-message')!.getBoundingClientRect();
          const ring = element.querySelector('circle')!.getBoundingClientRect();
          const style = getComputedStyle(indicator);
          output.push({ x: rect.x - panel.x, y: rect.y - panel.y, cx: ring.x + ring.width / 2 - panel.x, cy: ring.y + ring.height / 2 - panel.y,
            origin: style.transformOrigin, easing: style.animationTimingFunction, time: Number(animation.currentTime) });
        }
        return output;
      });
      for (const sample of samples) {
        assert.equal(sample.origin, `${size / 2}px ${size / 2}px`);
        assert.equal(sample.easing, 'linear');
        assert.ok(Math.abs(sample.x - samples[0]!.x) < 0.01 && Math.abs(sample.y - samples[0]!.y) < 0.01, `${variant} 加载盒子位置稳定`);
        assert.ok(Math.abs(sample.cx - samples[0]!.cx) < 0.01 && Math.abs(sample.cy - samples[0]!.cy) < 0.01, '底圈中心稳定');
      }
      assert.ok(samples.at(-1)!.time > samples[0]!.time + 200, '动画连续播放且没有重置');
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
