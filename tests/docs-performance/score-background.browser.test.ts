/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = process.env.STEPS_BROWSER_PATH || chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

/** 编译真实背景组件，用几何属性访问记录检测挂载期的强制布局入口。 */
before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `
        import {createApp,h} from 'vue';
        import Background from './app/components/docs/DocsScoreBackground.vue';
        let app;
        window.scoreFixture={
          mount(){
            const reads=[];
            const descriptors=['clientWidth','clientHeight'].map(name=>[name,Object.getOwnPropertyDescriptor(Element.prototype,name)]);
            for(const[name,descriptor]of descriptors){
              Object.defineProperty(Element.prototype,name,{configurable:true,get(){reads.push(name);return descriptor.get.call(this)}});
            }
            try{
              app=createApp({render:()=>h('main',null,[
                ...Array.from({length:100},(_,index)=>h('p',null,'文档内容'+index)),
                h(Background),
              ])});
              app.mount('#app');
              return reads;
            }finally{
              for(const[name,descriptor]of descriptors)Object.defineProperty(Element.prototype,name,descriptor);
            }
          },
          unmount(){app.unmount()},
        };
      `,
      resolveDir: resolve('.'), loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    plugins: [{ name: 'score-browser', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : 'text/html');
    // 仅保留背景的固定铺满几何，测试不依赖文档站和开发服务器。
    response.end(request.url === '/app.js' ? result.outputFiles[0]!.text : '<!doctype html><html><head><style>[data-docs-score]{position:fixed;inset:0;color:rgb(17,24,39)}canvas{width:100%;height:100%}</style></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

async function withBackground(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.waitForFunction(() => Boolean((window as any).scoreFixture));
    await run(page);
    assert.deepEqual(errors, [], '初始化、尺寸变化和卸载不应产生异常');
  } finally {
    await page.close();
  }
}

it('文档背景挂载时不通过同步几何读取强制布局，浏览器布局后仍初始化画布', { skip: !browserAvailable }, async () => {
  await withBackground(async (page) => {
    const reads = await page.evaluate(() => (window as any).scoreFixture.mount());
    assert.deepEqual(reads, [], 'onMounted 不应读取 clientWidth/clientHeight');
    await page.waitForFunction(() => document.querySelector('canvas')?.width === 1200);
    const size = await page.locator('canvas').evaluate((element: HTMLCanvasElement) => ({ width: element.width, height: element.height }));
    assert.deepEqual(size, { width: 1200, height: 900 });
  });
});

it('异步尺寸观察继续响应视口变化，卸载后释放观察', { skip: !browserAvailable }, async () => {
  await withBackground(async (page) => {
    await page.evaluate(() => (window as any).scoreFixture.mount());
    await page.waitForFunction(() => document.querySelector('canvas')?.width === 1200);
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForFunction(() => document.querySelector('canvas')?.width === 800 && document.querySelector('canvas')?.height === 600);
    await page.evaluate(() => (window as any).scoreFixture.unmount());
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    assert.equal(await page.locator('canvas').count(), 0);
  });
});

