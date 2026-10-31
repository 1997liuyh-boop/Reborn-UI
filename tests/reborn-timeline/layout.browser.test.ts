/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
      contents: `import {RebornTimeline as Timeline,RebornTimelineItem as Item} from '~/components/reborn/ui/reborn-timeline';
        import {createApp,h,reactive,nextTick} from 'vue';
        const state=reactive({width:720});
        const ui={axis:'test-axis',body:'test-body',content:'test-content',timestamp:'test-timestamp'};
        const fixtures=[];
        for(const mode of ['items','slots'])for(const side of ['left','right'])for(const placement of ['top','bottom','left','right']){
          const items=[0,1].map(key=>({key,labelPosition:side,placement,timestamp:'09:00',content:'处理完成'}));
          fixtures.push(()=>h(Timeline,{id:mode+'-'+side+'-'+placement,ui,style:{width:state.width+'px'},
            ...(mode==='items'?{items}:{})},mode==='slots'?()=>items.map(item=>h(Item,item)):undefined));
        }
        const mixed=[{key:1,labelPosition:'left',placement:'left',content:'左侧事件',timestamp:'09:00'},
          {key:2,labelPosition:'right',placement:'right',content:'右侧事件',timestamp:'10:00'}];
        createApp({render:()=>h('main',{},[...fixtures.map(render=>render()),
          h(Timeline,{id:'mixed',ui,items:mixed,style:{width:state.width+'px'}})])}).mount('#app');
        window.timelineFixture={state,flush:nextTick};`,
      resolveDir: resolve('.'), sourcefile: 'timeline-layout-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    outdir: resolve('node_modules/.cache/timeline-layout-fixture'),
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'timeline-layout', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, { id: path, inlineTemplate: true }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/base.css';@import './app/assets/theme/typography.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-timeline'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('#items-left-top li').first().waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

for (const side of ['left', 'right']) {
  for (const placement of ['top', 'bottom', 'left', 'right']) {
    it(`内容在 ${side}、时间在 ${placement} 时围绕轴线紧邻排列`, { skip: !browserAvailable }, () => withPage(async (page) => {
      for (const width of [340, 720]) {
        await page.evaluate(async (width) => {
          const fixture = (window as any).timelineFixture;
          fixture.state.width = width;
          await fixture.flush();
        }, width);
        for (const mode of ['items', 'slots']) {
          const layout = await page.locator(`#${mode}-${side}-${placement}`).evaluate((root) => {
            const row = root.querySelector('li')!;
            const content = document.createRange();
            content.selectNodeContents(row.querySelector('.test-content')!);
            const time = document.createRange();
            time.selectNodeContents(row.querySelector('.test-timestamp')!);
            return { root: root.getBoundingClientRect().toJSON(), axis: row.querySelector('.test-axis')!.getBoundingClientRect().toJSON(), content: content.getBoundingClientRect().toJSON(), time: time.getBoundingClientRect().toJSON() };
          });
          const { root, axis, content, time } = layout;
          const axisCenter = axis.left + axis.width / 2;
          assert.ok(axisCenter - root.left < root.width / 2, '单侧内容按实际宽度布局，不能把轴线推到父容器右端');
          if (side === 'left') assert.ok(content.right < axisCenter, '左侧内容必须位于轴线左边');
          else assert.ok(content.left > axisCenter, '右侧内容必须位于轴线右边');
          if (placement === 'top') assert.ok(time.bottom <= content.top, '时间在内容上方');
          else if (placement === 'bottom') assert.ok(time.top >= content.bottom, '时间在内容下方');
          else if (placement === side) {
            const gap = side === 'left' ? content.left - time.right : time.left - content.right;
            assert.ok(Math.abs(gap - 12) < 1, `同侧时间与内容保留 12px 间距，实际为 ${gap}px`);
          } else if (placement === 'left') assert.ok(time.right < axisCenter, '对侧时间位于轴线左边');
          else assert.ok(time.left > axisCenter, '对侧时间位于轴线右边');
        }
      }
    }));
  }
}

it('左右交替时轴线居中，同侧时间仍紧邻各自内容', { skip: !browserAvailable }, () => withPage(async (page) => {
  const layout = await page.locator('#mixed').evaluate(root => ({
    root: root.getBoundingClientRect().toJSON(),
    rows: [...root.querySelectorAll('li')].map((row) => {
      const content = document.createRange();
      content.selectNodeContents(row.querySelector('.test-content')!);
      const time = document.createRange();
      time.selectNodeContents(row.querySelector('.test-timestamp')!);
      return { axis: row.querySelector('.test-axis')!.getBoundingClientRect().toJSON(), content: content.getBoundingClientRect().toJSON(), time: time.getBoundingClientRect().toJSON() };
    }),
  }));
  const center = layout.root.left + layout.root.width / 2;
  for (const [index, { axis, content, time }] of layout.rows.entries()) {
    assert.ok(Math.abs(axis.left + axis.width / 2 - center) < 1, '交替布局共用居中的轴线');
    const gap = index === 0 ? content.left - time.right : time.left - content.right;
    assert.ok(Math.abs(gap - 12) < 1, '左右两侧的时间戳均紧邻内容，不能拉到父容器两端');
  }
}));
