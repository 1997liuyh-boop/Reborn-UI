/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();

it('加载指令的 outline 使用短弧与底圈，ring 保持长弧且属性切换生效', { skip: !existsSync(executablePath) }, async () => {
  const result = await build({
    stdin: {
      contents: `import {vLoading} from '~/directives/loading';
        import {createApp,h,nextTick,reactive,withDirectives} from 'vue';
        const state=reactive({type:'outline'});
        window.loadingFixture={state,flush:nextTick};
        createApp({render:()=>h('main',{},['outline','ring'].map(id=>withDirectives(h('div',{
          id,'reborn-loading-type':id==='outline'?state.type:'ring',
          'reborn-loading-color':'#4060ff','reborn-loading-size':'24px',
          style:{width:'120px',height:'120px'}
        }),[[vLoading,true]])))}).mount('#app');`,
      resolveDir: resolve('.'), sourcefile: 'loading-directive-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'loading-directive-fixture', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-loading'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
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
    await page.locator('#outline .rb-loading path').waitFor();
    const outlineLength = await page.locator('#outline .rb-loading path').evaluate((path: SVGPathElement) => path.getTotalLength());
    const ringLength = await page.locator('#ring .rb-loading path').evaluate((path: SVGPathElement) => path.getTotalLength());
    assert.ok(outlineLength < ringLength / 2, `outline 短弧应与 ring 长弧明显不同，实际 ${outlineLength} / ${ringLength}`);
    assert.equal(await page.locator('#outline .rb-loading circle').count(), 1, 'outline 保留完整底圈');
    assert.equal(await page.locator('#ring .rb-loading circle').count(), 0, 'ring 不显示底圈');
    for (const id of ['outline', 'ring']) {
      assert.equal(await page.locator(`#${id} .rb-loading path`).evaluate(path => getComputedStyle(path).stroke), 'rgb(64, 96, 255)');
      const bounds = (await page.locator(`#${id} .rb-loading`).boundingBox())!;
      assert.equal(bounds.width, 24);
      assert.equal(bounds.height, 24);
    }
    await page.evaluate(async () => {
      (window as any).loadingFixture.state.type = 'ring';
      await (window as any).loadingFixture.flush();
    });
    await page.waitForFunction(() => document.querySelector('#outline .rb-loading circle') === null);
    assert.equal(await page.locator('#outline .rb-loading path').evaluate((path: SVGPathElement) => path.getTotalLength()), ringLength);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
