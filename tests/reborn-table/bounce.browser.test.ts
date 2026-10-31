/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
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
      contents: `import Table from '~/components/reborn/ui/reborn-table/RebornTable.vue';
        import Scrollbar from '~/components/reborn/ui/scrollbar/RebornScrollbar.vue';
        import {createApp,h,reactive,nextTick} from 'vue';
        const state=reactive({fixedHeader:true,showHeader:true,visible:true});
        const data=Array.from({length:20},(_,id)=>({id,name:'测试行 '+id,amount:id*10}));
        const columns=[{label:'人员信息',children:[{prop:'id',label:'编号',width:80,fixed:'left'},
          {prop:'name',label:'姓名',width:500}]},{prop:'amount',label:'金额',width:100,fixed:'right'}];
        createApp({render:()=>h('main',{},[
          state.visible?h(Table,{...state,data,columns,height:240,ariaLabel:'固定表头回弹测试',style:{width:'420px'}}):null,
          h(Scrollbar,{id:'ordinary',style:{width:'420px',height:'100px'}},()=>h('div',{style:{height:'500px'}},'普通滚动区域'))
        ])}).mount('#app');window.tableFixture={state,flush:nextTick};`,
      resolveDir: resolve('.'), sourcefile: 'table-bounce-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    outdir: resolve('node_modules/.cache/table-bounce-fixture'),
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'table-bounce', setup(builder) {
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, inlineTemplate: true,
          fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts', resolveDir: dirname(path) };
      });
    } }],
  });
  const compiler = await compile("@import 'tailwindcss';@import './app/assets/theme/base.css';@import './app/assets/theme/typography.css';@import './app/components/reborn/ui/scrollbar/scrollbar.css';", { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui'), pattern: '**/*', negated: false }] });
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
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 }, reducedMotion: 'no-preference' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url);
    await page.locator('[data-reborn-table] th').first().waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
}

for (const theme of ['light', 'dark']) {
  for (const merged of [false, true]) {
    it(`${theme} 主题${merged ? '合并' : '普通'}固定列悬停时遮住横向滚动内容`, { skip: !browserAvailable }, () => withPage(async (page) => {
      await page.evaluate(async ({ theme, merged }) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        const fixture = (window as any).tableFixture;
        if (merged) {
          fixture.state.spanMethod = ({ $index, columnIndex }: { $index: number; columnIndex: number }) =>
            columnIndex === 0 && $index < 2 ? ($index === 0 ? [2, 1] : [0, 0]) : [1, 1];
          await fixture.flush();
        }
        const table = document.querySelector('[data-reborn-table]')!;
        // 长文本横穿左右固定区，便于确认它没有透过固定列背景。
        table.querySelectorAll('tbody td').forEach((cell) => {
          if (getComputedStyle(cell).position !== 'sticky') cell.firstElementChild!.textContent = '横向滚动内容'.repeat(30);
        });
        table.querySelector('.reborn-scrollbar__wrap')!.scrollLeft = 180;
      }, { theme, merged });
      const rows = page.locator('[data-reborn-table] tbody tr');
      await rows.nth(merged ? 1 : 0).hover();
      const fixed = page.locator('[data-reborn-table] tbody tr').first().locator('td[style*="sticky"]');
      assert.equal(await fixed.count(), 2, '同时验证左右固定区');
      for (let index = 0; index < 2; index++) {
        const cell = fixed.nth(index);
        const alpha = await cell.evaluate((element) => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d')!;
          context.fillStyle = getComputedStyle(element).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          return context.getImageData(0, 0, 1, 1).data[3];
        });
        assert.equal(alpha, 255, '固定列背景必须不透明，不能透出滚动文字');
        const before = await cell.screenshot();
        await page.locator('[data-reborn-table] tbody td').evaluateAll((cells) => {
          cells.forEach((cell) => {
            if (getComputedStyle(cell).position !== 'sticky') (cell.firstElementChild as HTMLElement).style.opacity = '0';
          });
        });
        assert.deepEqual(await cell.screenshot(), before, '隐藏底下的滚动文字不应改变固定列画面');
        await page.locator('[data-reborn-table] tbody td').evaluateAll((cells) => {
          cells.forEach(cell => (cell.firstElementChild as HTMLElement).style.removeProperty('opacity'));
        });
      }
    }));
  }
}

for (const edge of ['start', 'end'] as const) {
  it(`滚动到${edge === 'start' ? '顶部' : '底部'}时仅表体回弹，多级固定表头保持原位`, { skip: !browserAvailable }, () => withPage(async (page) => {
    const wrap = page.locator('[data-reborn-table] .reborn-scrollbar__wrap');
    await wrap.evaluate((el, edge) => { el.scrollTop = edge === 'start' ? 0 : el.scrollHeight; }, edge);
    const snapshot = () => wrap.evaluate(el => ({
      headers: [...el.querySelectorAll('th')].map(th => th.getBoundingClientRect().top),
      body: el.querySelector('tbody')!.getBoundingClientRect().top,
      top: el.scrollTop, max: el.scrollHeight - el.clientHeight,
    }));
    const before = await snapshot();
    // 保留真实 wheel 处理和 WAAPI，只暂停到峰值以精确比较布局位置。
    await wrap.evaluate((el, edge) => {
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: edge === 'start' ? -400 : 400, bubbles: true }));
      for (const animation of el.getAnimations({ subtree: true })) {
        animation.pause();
        animation.currentTime = 96;
      }
    }, edge);
    const during = await snapshot();
    assert.deepEqual(during.headers, before.headers, '固定表头不能跟着边缘回弹移动');
    assert.ok(Math.abs(during.body - before.body - (edge === 'start' ? 2 : -2)) < 0.05, '表体保留 2px 视觉反馈');
    assert.equal(during.top, before.top, '回弹不改变实际滚动位置');
    await wrap.evaluate(el => el.getAnimations({ subtree: true }).forEach(animation => animation.finish()));
    await page.waitForFunction(() => !document.querySelector('[data-reborn-table] .reborn-scrollbar__wrap')!.getAnimations({ subtree: true }).length);
    assert.deepEqual(await snapshot(), before, '回弹结束后几何、滚动位置与最大距离均恢复');
  }));
}

it('普通滚动区维持原有回弹，减少动态效果时表格不播放回弹', { skip: !browserAvailable }, () => withPage(async (page) => {
  const ordinary = page.locator('#ordinary .reborn-scrollbar__wrap');
  const target = await ordinary.evaluate(el => {
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    const animation = el.getAnimations()[0];
    return animation && (animation.effect as KeyframeEffect).target === el;
  });
  assert.equal(target, true, '未指定回弹目标的滚动区保持原行为');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const count = await page.locator('[data-reborn-table] .reborn-scrollbar__wrap').evaluate(el => {
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    return el.getAnimations({ subtree: true }).length;
  });
  assert.equal(count, 0);
}));

it('回弹过程中取消固定表头或卸载表格，会清理旧目标的动画', { skip: !browserAvailable }, () => withPage(async (page) => {
  const wrap = page.locator('[data-reborn-table] .reborn-scrollbar__wrap');
  await wrap.evaluate(el => {
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    const animation = el.querySelector('tbody')!.getAnimations()[0]!;
    animation.pause();
    (window as any).activeTableBounce = animation;
  });
  await page.evaluate(async () => {
    const fixture = (window as any).tableFixture;
    fixture.state.fixedHeader = false;
    await fixture.flush();
  });
  assert.equal(await page.evaluate(() => (window as any).activeTableBounce.playState), 'idle');
  await page.evaluate(async () => {
    const fixture = (window as any).tableFixture;
    fixture.state.fixedHeader = true;
    await fixture.flush();
  });
  await wrap.evaluate(el => {
    // 离开再回到边缘，允许同一手势再次反馈。
    el.scrollTop = 10;
    el.dispatchEvent(new Event('scroll'));
    el.scrollTop = 0;
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true }));
    const animation = el.querySelector('tbody')!.getAnimations()[0]!;
    animation.pause();
    (window as any).activeTableBounce = animation;
  });
  assert.equal(await page.evaluate(() => (window as any).activeTableBounce?.playState), 'paused');
  await page.evaluate(async () => {
    const fixture = (window as any).tableFixture;
    fixture.state.visible = false;
    await fixture.flush();
  });
  assert.equal(await page.evaluate(() => (window as any).activeTableBounce.playState), 'idle');
}));
