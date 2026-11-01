/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 真实浏览器读取最终字号与颜色，捕获未定义变量和内联默认色压过 ui 的问题。 */
before(async () => {
  const result = await build({
    stdin: { contents: `
      import Checkbox from '~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue';
      import NoticeBar from '~/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue';
      import Chip from '~/components/reborn/ui/reborn-chip/RebornChip.vue';
      import BackTop from '~/components/reborn/ui/reborn-back-top/RebornBackTop.vue';
      import {createApp,h} from 'vue';
      const app=createApp({render:()=>h('main',{style:'font-size:30px'},[
        ...['sm','md','lg'].map(size=>h(Checkbox,{size,label:size,'data-size':size})),
        h(NoticeBar,{text:'默认',customClass:'notice-default',scrollable:false}),
        h(NoticeBar,{text:'覆盖',customClass:'notice-ui',scrollable:false,ui:{root:'bg-red-6 text-white'}}),
        h(NoticeBar,{text:'显式颜色',customClass:'notice-explicit',scrollable:false,color:'rgb(1, 2, 3)',background:'rgb(4, 5, 6)'}),
        h(NoticeBar,{text:'样式优先',customClass:'notice-style',scrollable:false,color:'red',background:'blue',customStyle:'color:rgb(7, 8, 9);background-color:rgb(10, 11, 12)'}),
        h(Chip,{class:'fixture-chip',text:'9'}),
        h(BackTop,{class:'fixture-back-top',size:'xs',scrollTop:400,scrollHeight:1000,icon:'lucide:arrow-up',showProgress:true}),
        h(BackTop,{class:'fixture-back-top-text',size:'xs',scrollTop:400,scrollHeight:1000}),
        h(Checkbox,{class:'fixture-filled',variant:'filled',modelValue:true,label:'前景'}),
        h(Checkbox,{class:'fixture-disabled',variant:'filled',modelValue:true,disabled:true,label:'禁用'})
      ])});
      app.component('Icon',{props:['name'],render(){return h('svg',{'data-icon':this.name,style:'width:1em;height:1em'})}});
      app.mount('#app');
    `, resolveDir: resolve('.'), loader: 'ts' },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: '组件浏览器编译', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, ({ path }) => {
        const { descriptor } = parse(readFileSync(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const sources = ['reborn-checkbox', 'reborn-notice-bar', 'reborn-chip', 'reborn-back-top'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false }));
  const css = compiler.build([...new Scanner({ sources }).scan(), 'bg-red-6', 'text-white']);
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? result.outputFiles[0]!.text : request.url === '/style.css' ? css : '<!doctype html><link rel="stylesheet" href="/style.css"><div id="app"></div><script type="module" src="/app.js"></script>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

it('Checkbox 三档标签使用 12/14/16px 字号和配套行高', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.locator('label').first().waitFor();
    const sizes = await page.locator('label').evaluateAll(labels => labels.slice(0, 3).map(label => {
      const node = Array.from(label.querySelectorAll('span')).find(span => ['sm', 'md', 'lg'].includes(span.textContent ?? ''))!;
      const style = getComputedStyle(node);
      return [style.fontSize, style.lineHeight];
    }));
    assert.deepEqual(sizes, [['12px', '20px'], ['14px', '22px'], ['16px', '24px']]);
  } finally { await page.close(); }
});

it('填充前景跟随语义主题，BackTop xs 的图标和文字均使用 12px', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.locator('.fixture-chip').waitFor({ state: 'attached' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '20px';
      document.documentElement.style.setProperty('--color-primary-foreground', 'rgb(11, 22, 33)');
      document.documentElement.style.setProperty('--color-gray-4', 'rgb(44, 45, 46)');
    });
    await page.waitForTimeout(250);
    const color = (selector: string) => page.locator(selector).evaluate(node => getComputedStyle(node).color);
    assert.equal(await color('.fixture-chip > div > div'), 'rgb(11, 22, 33)', 'Chip');
    assert.equal(await color('.fixture-filled [data-icon]'), 'rgb(11, 22, 33)', 'Checkbox');
    assert.equal(await color('.fixture-disabled [data-icon]'), 'rgb(44, 45, 46)', 'Checkbox disabled');
    assert.equal(await color('.fixture-back-top [data-icon]'), 'rgb(11, 22, 33)', 'BackTop');
    assert.equal(await page.locator('.fixture-back-top [data-icon]').evaluate(node => getComputedStyle(node).width), '12px');
    assert.equal(await page.locator('.fixture-back-top-text span').evaluate(node => getComputedStyle(node).fontSize), '12px');
    assert.match(await page.locator('.fixture-back-top path').first().evaluate(node => getComputedStyle(node).stroke), /\/ 0\.25\)$/);
    assert.equal(await page.locator('.fixture-back-top path').last().evaluate(node => getComputedStyle(node).stroke), 'rgb(11, 22, 33)');
  } finally { await page.close(); }
});

it('NoticeBar 默认颜色跟随令牌，ui 可覆盖，显式颜色与 customStyle 依次优先', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.locator('.notice-default').waitFor();
    const read = (selector: string) => page.locator(selector).evaluate(node => {
      const style = getComputedStyle(node);
      return [style.color, style.backgroundColor];
    });
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--color-gray-2', 'rgb(20, 21, 22)');
      document.documentElement.style.setProperty('--color-gray-8', 'rgb(80, 81, 82)');
      document.documentElement.style.setProperty('--color-red-6', 'rgb(60, 61, 62)');
    });
    assert.deepEqual(await read('.notice-default'), ['rgb(80, 81, 82)', 'rgb(20, 21, 22)']);
    assert.deepEqual(await read('.notice-ui'), ['rgb(255, 255, 255)', 'rgb(60, 61, 62)']);
    assert.deepEqual(await read('.notice-explicit'), ['rgb(1, 2, 3)', 'rgb(4, 5, 6)']);
    assert.deepEqual(await read('.notice-style'), ['rgb(7, 8, 9)', 'rgb(10, 11, 12)']);
  } finally { await page.close(); }
});
