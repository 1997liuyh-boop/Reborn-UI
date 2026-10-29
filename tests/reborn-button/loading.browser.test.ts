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

it('圆形按钮三档加载图标保持双向居中，普通按钮保留文字与间距', { skip: !existsSync(executablePath) }, async () => {
  const result = await build({
    stdin: {
      contents: `import Button from '~/components/reborn/ui/reborn-button/RebornButton.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({loading:true});window.buttonFixture={state,flush:nextTick};
        const icon=()=>h('svg',{viewBox:'0 0 24 24',class:'size-4'});
        createApp({render:()=>h('main',{},['sm','md','lg'].flatMap(size=>[
          ...['filled','outlined','soft','subtle','text'].map(variant=>h('div',{style:{display:'flex',alignItems:'stretch',height:'80px'}},[
            h(Button,{id:'circle-'+variant+'-'+size,size,circle:true,loading:state.loading,variant},{default:icon,leading:icon,trailing:icon})
          ])),
          h(Button,{id:'regular-'+size,size,loading:state.loading,label:'保存中'})
        ]))}).mount('#app');`,
      resolveDir: resolve('.'), sourcefile: 'button-loading-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'button-loading-fixture', setup(builder) {
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
  const scanner = new Scanner({ sources: ['reborn-button', 'reborn-loading'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
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
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#circle-filled-lg').waitFor();
    // 前后图标在退出加载态后恢复，重新加载时只保留一个居中的指示器。
    for (const loading of [false, true]) {
      await page.evaluate(async (loading) => {
        (window as any).buttonFixture.state.loading = loading;
        await (window as any).buttonFixture.flush();
      }, loading);
      assert.equal(await page.locator('#circle-filled-md svg').count(), loading ? 2 : 3);
    }
    for (const size of ['sm', 'md', 'lg']) {
      for (const variant of ['filled', 'outlined', 'soft', 'subtle', 'text']) {
        const button = page.locator(`#circle-${variant}-${size}`);
        const bounds = (await button.boundingBox())!;
        for (const selector of ['.rb-loading', '.rb-loading .rb-loading-indicator']) {
          const icon = (await button.locator(selector).boundingBox())!;
          assert.ok(Math.abs(icon.x + icon.width / 2 - bounds.x - bounds.width / 2) <= 0.5, `${variant} ${size} ${selector} 水平偏移 ${JSON.stringify({ bounds, icon })}`);
          assert.ok(Math.abs(icon.y + icon.height / 2 - bounds.y - bounds.height / 2) <= 0.5, `${variant} ${size} ${selector} 垂直偏移 ${JSON.stringify({ bounds, icon })}`);
        }
        assert.equal(await button.isDisabled(), true);
      }
      const regular = page.locator(`#regular-${size}`);
      const icon = (await regular.locator('.rb-loading').boundingBox())!;
      const label = (await regular.locator('span').boundingBox())!;
      assert.ok(label.x - icon.x - icon.width >= 7.5, '普通按钮保留加载图标与文案之间的间隔');
      assert.equal(await regular.textContent(), '保存中');
    }
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
