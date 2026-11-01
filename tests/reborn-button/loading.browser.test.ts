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

it('按钮三档加载布局与 Button、Badge、Alert 的普通 ui 覆盖生效', { skip: !existsSync(executablePath) }, async () => {
  const result = await build({
    stdin: {
      contents: `import Button from '~/components/reborn/ui/reborn-button/RebornButton.vue';
        import Badge from '~/components/reborn/ui/reborn-badge/RebornBadge.vue';
        import Alert from '~/components/reborn/ui/reborn-alert/RebornAlert.vue';
        import {createApp,h,nextTick,reactive} from 'vue';
        const state=reactive({loading:true});window.buttonFixture={state,flush:nextTick};
        const icon=()=>h('svg',{viewBox:'0 0 24 24',class:'size-4'});
        createApp({render:()=>h('main',{},[...['sm','md','lg'].flatMap(size=>[
          ...['filled','outlined','soft','subtle','text'].map(variant=>h('div',{style:{display:'flex',alignItems:'stretch',height:'80px'}},[
            h(Button,{id:'circle-'+variant+'-'+size,size,circle:true,loading:state.loading,variant},{default:icon,leading:icon,trailing:icon})
          ])),
          h(Button,{id:'regular-'+size,size,loading:state.loading,label:'保存中'}),
          h(Button,{id:'override-'+size,size,round:true,label:'覆盖',ui:{base:'rounded-lg gap-3',label:'leading-8'}}),
          h(Button,{id:'slot-'+size,size},{default:({ui})=>h('span',{class:ui.label({class:'leading-7'})},'插槽')})
        ]),
          h('div',{id:'badge-fixture'},[h(Badge,{circle:true,label:'1',ui:{base:'rounded-lg h-12 w-12'}})]),
          h('div',{id:'alert-fixture'},[h(Alert,{variant:'round',banner:true,showIcon:false,title:'公告',ui:{root:'rounded-lg'}})])
        ])}).mount('#app');`,
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
  const scanner = new Scanner({ sources: ['reborn-button', 'reborn-loading', 'reborn-badge', 'reborn-alert'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false })) });
  const css = compiler.build([...scanner.scan(), 'rounded-lg', 'gap-3', 'leading-8', 'leading-7', 'h-12', 'w-12']);
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
      const gap = size === 'sm' ? 6 : 8;
      assert.ok(Math.abs(label.x - icon.x - icon.width - gap) <= 0.5, `${size} 图文间距应为 ${gap}px`);
      assert.equal(await regular.textContent(), '保存中');
      assert.equal(await regular.locator('.rb-loading-layer').evaluate(layer => getComputedStyle(layer).color), await regular.evaluate(button => getComputedStyle(button).color));
      const overrides = await page.locator(`#override-${size}`).evaluate(button => ({
        radius: getComputedStyle(button).borderRadius,
        gap: getComputedStyle(button.firstElementChild!).gap,
        lineHeight: getComputedStyle(button.querySelector('span')!).lineHeight,
      }));
      assert.deepEqual(overrides, { radius: '8px', gap: '12px', lineHeight: '32px' });
      assert.equal(await page.locator(`#slot-${size} span`).evaluate(label => getComputedStyle(label).lineHeight), '28px');
    }
    assert.ok(await page.locator('#badge-fixture span').count(), await page.locator('#badge-fixture').innerHTML());
    assert.deepEqual(await page.locator('#badge-fixture span').first().evaluate(badge => {
      const style = getComputedStyle(badge);
      return { radius: style.borderRadius, height: style.height, width: style.width };
    }), { radius: '8px', height: '48px', width: '48px' });
    assert.equal(await page.locator('#alert-fixture [role="alert"]').evaluate(alert => getComputedStyle(alert).borderRadius), '8px');
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
