/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const executablePath = chromium.executablePath();
const browserAvailable = existsSync(executablePath);
let browser: Awaited<ReturnType<typeof chromium.launch>>;
let server: ReturnType<typeof createServer>;
let url = '';

before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `import Upload from '~/components/reborn/ui/reborn-upload/RebornUpload.vue';
        import Image from '~/components/reborn/ui/reborn-image/RebornImage.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const files=()=>[{name:'第一张.svg',url:'/first.svg'},{name:'第二张.svg',url:'/second.svg'},
          {name:'说明.pdf',url:'/manual.pdf'},{name:'视频.mp4',url:'/video.mp4'}];
        const state=reactive({visible:true,callbacks:[],files:files()});
        document.addEventListener('viewed',()=>{
          const image=document.querySelector('.viewer-canvas img');
          if(image) image.dataset.viewed='true';
        },true);
        const apis={};const revoked=[];const revoke=URL.revokeObjectURL.bind(URL);
        URL.revokeObjectURL=value=>{revoked.push(value);revoke(value)};
        const app=createApp({render:()=>state.visible?h('main',{},[
          ...['text','picture','picture-card'].map(listType=>h('section',{id:listType},[
            h(Upload,{ref:value=>apis[listType]=value,listType,fileList:state.files,autoUpload:false,
              'onUpdate:fileList':value=>state.files=value})])),
          h('section',{id:'disabled'},[h(Upload,{listType:'picture-card',fileList:files(),disabled:true})]),
          h('section',{id:'custom'},[h(Upload,{listType:'picture-card',fileList:files(),
            onPreview:file=>state.callbacks.push({name:file.name,uid:file.uid})})]),
          h('section',{id:'failed-image'},[h(Image,{src:'/broken.svg',preview:true})]),
          h('section',{id:'failed-no-preview'},[h(Image,{src:'/broken.svg'})]),
          h('section',{id:'mixed-images'},[h(Image,{src:'/first.svg',preview:true,
            previewList:['/first.svg','/broken.svg','/second.svg']})])
        ]):null});
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');window.uploadFixture={state,apis,revoked,flush:nextTick};`,
      resolveDir: resolve('.'), sourcefile: 'upload-preview-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    outdir: resolve('node_modules/.cache/upload-preview-fixture'),
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'upload-preview', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@plugin '@iconify/tailwind4';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan()) + result.outputFiles.find(file => file.path.endsWith('.css'))!.text;
  const script = result.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  server = createServer((request, response) => {
    const path = request.url;
    if (path === '/broken.svg') { response.writeHead(404); response.end(); return; }
    if (path?.endsWith('.svg')) {
      response.setHeader('Content-Type', 'image/svg+xml');
      response.end(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="${path === '/first.svg' ? 'red' : 'blue'}"/></svg>`);
      return;
    }
    if (path === '/manual.pdf' || path === '/video.mp4') { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', path === '/app.js' ? 'text/javascript' : path === '/style.css' ? 'text/css' : 'text/html');
    response.end(path === '/app.js' ? script : path === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  url = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ executablePath, headless: true });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function withPage(run: (page: Page) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#picture-card').waitFor();
    await run(page);
    assert.deepEqual(errors, [], '预览与清理过程不抛出运行时异常');
  } finally { await page.close(); }
}

async function waitForImage(page: Page, suffix: string) {
  await page.waitForFunction(suffix => {
    const image = document.querySelector<HTMLImageElement>('.viewer-canvas img');
    return image?.src.endsWith(suffix) && image.complete && image.naturalWidth > 0 && image.dataset.viewed === 'true';
  }, suffix);
}

for (const type of ['text', 'picture', 'picture-card']) {
  it(`${type} 默认复用图片预览器，从当前图片打开并支持切图、缩放、旋转与关闭`, { skip: !browserAvailable }, () => withPage(async (page) => {
    const section = page.locator(`#${type}`);
    await section.getByRole('button', { name: '预览 第二张.svg', exact: true }).click();
    await waitForImage(page, '/second.svg');
    assert.equal(await page.getByRole('toolbar', { name: '图片操作' }).getByRole('button').count(), 6);
    await page.getByRole('button', { name: '放大', exact: true }).click();
    await page.getByRole('button', { name: '顺时针旋转 90°', exact: true }).click();
    await page.waitForFunction(() => document.querySelector<HTMLElement>('.viewer-canvas img')?.style.transform.includes('rotate(90deg)'));
    await page.getByRole('button', { name: '下一张', exact: true }).click();
    await waitForImage(page, '/first.svg');
    assert.equal(await page.locator('.viewer-list > li').count(), 2, '分组只含图片，不含 PDF 和视频');
    await page.keyboard.press('Escape');
    await page.locator('.viewer-container').waitFor({ state: 'detached' });
    assert.equal(await page.locator('body.viewer-open').count(), 0);
    await section.getByRole('button', { name: '预览 第一张.svg', exact: true }).click();
    await waitForImage(page, '/first.svg');
  }));
}

it('图片文件名支持回车和空格预览，非图片不添加默认预览入口，禁用仍可查看图片', { skip: !browserAvailable }, () => withPage(async (page) => {
  for (const key of ['Enter', 'Space']) {
    await page.locator('#text').getByRole('button', { name: '预览 第一张.svg', exact: true }).focus();
    await page.keyboard.press(key);
    await waitForImage(page, '/first.svg');
    await page.keyboard.press('Escape');
    await page.locator('.viewer-container').waitFor({ state: 'detached' });
  }
  assert.equal(await page.locator('#picture-card').getByRole('button', { name: '预览 说明.pdf', exact: true }).count(), 0);
  assert.equal(await page.locator('#picture-card').getByRole('button', { name: '预览 视频.mp4', exact: true }).count(), 0);
  assert.equal(await page.locator('#disabled').getByRole('button', { name: /^删除/ }).count(), 0);
  await page.locator('#disabled').getByRole('button', { name: '预览 第一张.svg', exact: true }).click();
  await waitForImage(page, '/first.svg');
}));

it('自定义 onPreview 替代内置预览，图片、视频与普通文件均传递完整文件对象', { skip: !browserAvailable }, () => withPage(async (page) => {
  for (const name of ['第一张.svg', '说明.pdf', '视频.mp4']) {
    await page.locator('#custom').getByRole('button', { name: `预览 ${name}`, exact: true }).click();
  }
  const callbacks = await page.evaluate(() => (window as any).uploadFixture.state.callbacks);
  assert.deepEqual(callbacks.map((file: { name: string }) => file.name), ['第一张.svg', '说明.pdf', '视频.mp4']);
  assert.ok(callbacks.every((file: { uid: number }) => typeof file.uid === 'number'));
  assert.equal(await page.locator('.viewer-container').count(), 0);
}));

it('文字列表本地图片可预览，移除、清空与卸载会释放地址并销毁预览器', { skip: !browserAvailable }, () => withPage(async (page) => {
  await page.locator('#text input[type=file]').setInputFiles({ name: '本地.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100" height="80" fill="green"/></svg>') });
  await page.locator('#text').getByRole('button', { name: '预览 本地.svg', exact: true }).click();
  await page.locator('.viewer-canvas img').waitFor();
  const src = await page.locator('.viewer-canvas img').getAttribute('src');
  assert.ok(src?.startsWith('blob:'));
  await page.evaluate(async () => {
    const fixture = (window as any).uploadFixture;
    await fixture.apis.text.handleRemove(fixture.state.files.find((file: { name: string }) => file.name === '本地.svg'));
    await fixture.flush();
  });
  await page.locator('.viewer-container').waitFor({ state: 'detached' });
  assert.ok((await page.evaluate(() => (window as any).uploadFixture.revoked)).includes(src));
  for (const action of ['clear', 'unmount']) {
    await page.locator('#text').getByRole('button', { name: '预览 第一张.svg', exact: true }).click();
    await waitForImage(page, '/first.svg');
    await page.evaluate(async (action) => {
      const fixture = (window as any).uploadFixture;
      if (action === 'clear') fixture.apis.text.clearFiles();
      else fixture.state.visible = false;
      await fixture.flush();
    }, action);
    await page.locator('.viewer-container').waitFor({ state: 'detached' });
    assert.equal(await page.locator('body.viewer-open').count(), 0);
    if (action === 'clear') {
      await page.evaluate(async () => {
        const fixture = (window as any).uploadFixture;
        fixture.state.files = [{ name: '第一张.svg', url: '/first.svg' }];
        await fixture.flush();
      });
    }
  }
}));

async function waitForPreviewError(page: Page) {
  const placeholder = page.locator('.viewer-canvas').getByRole('img', { name: '图片加载失败', exact: true });
  await placeholder.waitFor({ state: 'visible' });
  assert.equal(await page.locator('.viewer-canvas.viewer-loading').count(), 0, '错误态结束加载动画');
  assert.equal(await page.locator('.viewer-canvas > img').isVisible(), false, '隐藏浏览器破图');
  const previewMask = await placeholder.locator('span').evaluate(icon => getComputedStyle(icon).maskImage);
  const imageMask = await page.locator('#failed-image [data-lazy=error] + div > div').evaluate(icon => getComputedStyle(icon).maskImage);
  assert.notEqual(previewMask, 'none', '图标实际生成并显示');
  assert.equal(previewMask, imageMask, '预览与原图使用相同错误图标');
}

it('错误占位可以点击预览，关闭后可重新打开，preview=false 仍不打开', { skip: !browserAvailable }, () => withPage(async (page) => {
  const failedImage = page.locator('#failed-image [data-lazy=error] + div');
  await failedImage.waitFor();
  await page.locator('#failed-no-preview [data-lazy=error] + div').click();
  assert.equal(await page.locator('.viewer-container').count(), 0);
  for (let attempt = 0; attempt < 2; attempt++) {
    await failedImage.click();
    await waitForPreviewError(page);
    await page.keyboard.press('Escape');
    await page.locator('.viewer-container').waitFor({ state: 'detached' });
    assert.equal(await page.locator('body.viewer-open').count(), 0);
  }
}));

it('多图预览切换到失败图片显示图标，返回正常图片不残留错误占位', { skip: !browserAvailable }, () => withPage(async (page) => {
  await page.locator('#mixed-images > div > img').click();
  await waitForImage(page, '/first.svg');
  await page.getByRole('button', { name: '下一张', exact: true }).click();
  await waitForPreviewError(page);
  await page.getByRole('button', { name: '下一张', exact: true }).click();
  await waitForImage(page, '/second.svg');
  assert.equal(await page.locator('.viewer-canvas').getByRole('img', { name: '图片加载失败' }).count(), 0);
  await page.getByRole('button', { name: '上一张', exact: true }).click();
  await waitForPreviewError(page);
  await page.keyboard.press('ArrowLeft');
  await waitForImage(page, '/first.svg');
}));

it('上传组件的失败图片也显示预览错误图标，卸载会清理预览器', { skip: !browserAvailable }, () => withPage(async (page) => {
  await page.evaluate(async () => {
    const fixture = (window as any).uploadFixture;
    fixture.state.files = [{ name: '损坏.svg', url: '/broken.svg' }];
    await fixture.flush();
  });
  await page.locator('#text').getByRole('button', { name: '预览 损坏.svg', exact: true }).click();
  await waitForPreviewError(page);
  await page.evaluate(async () => {
    const fixture = (window as any).uploadFixture;
    fixture.state.visible = false;
    await fixture.flush();
  });
  await page.locator('.viewer-container').waitFor({ state: 'detached' });
  assert.equal(await page.locator('body.viewer-open').count(), 0);
}));
