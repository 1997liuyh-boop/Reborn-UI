/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
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

/**
 * 回归：Dropdown 的箭头。
 * 1. 12 个方向都只渲染一个箭头节点，收起后立即重开也不会叠出第二个；
 * 2. 箭头尖端与触发器之间留有间隙：此前带箭头的默认间距只有 8px，而 12px 方块旋转 45° 后
 *    伸出面板 6√2 ≈ 8.49px，尖端压进触发器，左右方向尤其明显；
 * 3. 展开时触发器被同一次渲染里插入的兄弟节点挤动（演练场在 popup-visible-change 里显示回显文字，
 *    居中布局把按钮顶上去 48px），面板与箭头不能停在挤动前的位置：此前要等 300ms 入场动画结束才归位，
 *    向上展开时面板与箭头整块压在按钮上，与按钮自带的下拉图标叠成两个箭头。
 */

const executablePath = chromium.executablePath();
let fixture: Promise<{ script: string; css: string }>;

/** 带箭头时保持 12px 默认间距，曲线尖端与触发器留有空隙 */
const ARROW_OFFSET = 12;
/** 箭头尖端与触发器之间至少保留的间隙（px） */
const MIN_TIP_GAP = 2;

const PLACEMENTS = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
] as const;

async function buildFixture() {
  const result = await build({
    stdin: {
      contents: `
        import Dropdown from '~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue';
        import {createApp,h,nextTick,reactive,shallowRef} from 'vue';
        const state=reactive({placement:'bottom',log:''});
        const dropdown=shallowRef(null);
        const options=[{label:'新建文件',value:'new'},{label:'编辑内容',value:'edit'},{label:'分享链接',value:'share'}];
        const box=(el)=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
        const panelEl=()=>document.querySelector('[role=menu]')?.closest('.rb-transition')??null;
        const snapshot=()=>{const panel=panelEl();return {
          noted:!!document.querySelector('#note'),trigger:box(document.querySelector('#trigger')),
          panel:panel?box(panel):null,arrows:[...document.querySelectorAll('[data-floating-arrow]')].map(box)};};
        window.arrowFixture={state,flush:nextTick,snapshot,
          open:()=>dropdown.value.open(),close:()=>dropdown.value.close(),
          settled:()=>{const panel=panelEl();return !!panel&&panel.style.height===''&&panel.style.opacity==='';},
          closed:()=>!panelEl(),
          // 展开后取下一帧：此时同一次渲染里的 DOM 变动与入场钩子都已执行完，入场动画才刚开始
          openFirstFrame:()=>{dropdown.value.open();return new Promise(done=>requestAnimationFrame(()=>done(snapshot())));},
        };
        createApp({render:()=>h('main',{class:'flex h-[600px] flex-col items-center justify-center gap-4'},[
          h(Dropdown,{ref:dropdown,options,placement:state.placement,showArrow:true,autoAdjustOverflow:false,closeOn:'click',
            onPopupVisibleChange:(visible)=>{state.log=visible?'展开':'收起';}},
            {default:()=>h('button',{id:'trigger',class:'h-8 w-24'},'下拉菜单')}),
          state.log?h('p',{id:'note',class:'h-20'},'popup-visible-change：'+state.log):null,
        ])}).mount('#app');
      `,
      resolveDir: resolve('.'), sourcefile: 'dropdown-arrow-fixture.ts', loader: 'ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false,
    alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [{ name: 'dropdown-arrow', setup(builder) {
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
  const scanner = new Scanner({ sources: [{ base: resolve("app/lib"), pattern: "floating-arrow.ts", negated: false }, ...['reborn-select-trigger', 'reborn-transition', 'reborn-dropdown'].map(name => ({ base: resolve(`app/components/reborn/ui/${name}`), pattern: '**/*', negated: false }))] });
  return { script: result.outputFiles[0]!.text, css: compiler.build([...scanner.scan(), 'flex', 'h-[600px]', 'flex-col', 'items-center', 'justify-center', 'gap-4', 'h-8', 'w-24', 'h-20']) };
}

async function withDropdown(run: (page: Page) => Promise<void>) {
  fixture ??= buildFixture();
  const { script, css } = await fixture;
  const server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
  });
  let browser;
  try {
    await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
    const address = server.address(); assert.ok(address && typeof address !== 'string');
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.locator('#trigger').waitFor();
    await run(page);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  }
}

interface Box { left: number; top: number; right: number; bottom: number }
interface Snapshot { noted: boolean; trigger: Box; panel: Box | null; arrows: Box[] }

/**
 * 页面内的取样函数都放在夹具脚本里（window.arrowFixture），这里只调用：
 * tsx 编译测试文件时会给具名函数注入 __name 辅助调用，原样传进 page.evaluate 会在页面里报未定义。
 */
function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => (window as any).arrowFixture.snapshot());
}

/** 展开并等入场动画播完（面板的行内高度与透明度都已还原即 after-enter 已执行） */
async function openSettled(page: Page) {
  await page.evaluate(() => (window as any).arrowFixture.open());
  await page.waitForFunction(() => (window as any).arrowFixture.settled());
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
}

/** 收起并等退场动画结束、面板与箭头都已移除 */
async function closeSettled(page: Page) {
  await page.evaluate(() => (window as any).arrowFixture.close());
  await page.waitForFunction(() => (window as any).arrowFixture.closed());
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).arrowFixture.state, value);
    await (window as any).arrowFixture.flush();
  }, value);
}

/** 箭头尖端到触发器的间隙：按弹出一侧取箭头外接框朝向触发器的那条边 */
function tipGap(side: string, arrow: Box, trigger: Box) {
  if (side === 'top') return trigger.top - arrow.bottom;
  if (side === 'bottom') return arrow.top - trigger.bottom;
  if (side === 'left') return trigger.left - arrow.right;
  return arrow.left - trigger.right;
}

/** 箭头根部到面板边缘的距离：向内覆盖 1px 描边以消除接缝 */
function arrowToPanelEdge(side: string, arrow: Box, panel: Box) {
  if (side === 'top') return Math.abs(arrow.top - panel.bottom);
  if (side === 'bottom') return Math.abs(arrow.bottom - panel.top);
  if (side === 'left') return Math.abs(arrow.left - panel.right);
  return Math.abs(arrow.right - panel.left);
}

it('12 个方向都只有一个箭头，尖端不压到触发器且骑在面板边上', { skip: !existsSync(executablePath) }, async () => {
  await withDropdown(async (page) => {
    for (const placement of PLACEMENTS) {
      const side = placement.split('-')[0]!;
      await configure(page, { placement });
      await openSettled(page);
      const shot = await snapshot(page);
      assert.equal(shot.arrows.length, 1, `${placement}：应只有一个箭头，实际 ${shot.arrows.length} 个`);
      assert.ok(shot.panel, `${placement}：面板应已展开`);
      const arrow = shot.arrows[0]!;
      const vertical = side === 'top' || side === 'bottom';
      assert.ok(Math.abs((arrow.right - arrow.left) - (vertical ? 17.5 : 7)) < 0.1, '箭头宽度');
      assert.ok(Math.abs((arrow.bottom - arrow.top) - (vertical ? 7 : 17.5)) < 0.1, '箭头高度');
      const gap = tipGap(side, arrow, shot.trigger);
      assert.ok(gap >= MIN_TIP_GAP, `${placement}：箭头尖端与触发器间隙 ${gap.toFixed(2)}px，应不小于 ${MIN_TIP_GAP}px`);
      assert.ok(arrowToPanelEdge(side, arrow, shot.panel!) <= 1, `${placement}：箭头根部应贴住面板边缘`);
      await closeSettled(page);
      const closed = await snapshot(page);
      assert.equal(closed.arrows.length, 0, `${placement}：收起后箭头应移除`);
    }
  });
});

it('向上展开的箭头与面板连成一体，阴影不渗入面板内部', { skip: !existsSync(executablePath) }, async () => {
  await withDropdown(async (page) => {
    for (const placement of ['top', 'top-start', 'top-end']) {
      await configure(page, { placement });
      await openSettled(page);
      const shot = await snapshot(page);
      assert.ok(shot.panel);
      const arrow = shot.arrows[0]!;
      const x = (arrow.left + arrow.right) / 2;
      const y = shot.panel.bottom;
      // 内侧两点避开文字和描边；外侧一点落在箭头实心区域，防止裁剪方向写反后箭头消失。
      const points = [{ x: x - 12, y: y - 4 }, { x: x + 12, y: y - 4 }, { x, y: y + 4 }];
      const screenshot = await page.screenshot();
      const colors = await page.evaluate(async ({ url, points }) => {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return points.map(point => Array.from(context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data));
      }, { url: `data:image/png;base64,${screenshot.toString('base64')}`, points });
      assert.deepEqual(colors, points.map(() => [255, 255, 255, 255]), `${placement}：箭头应保留实心底色，内侧不能叠入阴影`);
      await closeSettled(page);
    }
  });
});

it('收起途中立即重开，仍只保留一个箭头', { skip: !existsSync(executablePath) }, async () => {
  await withDropdown(async (page) => {
    for (const placement of ['top', 'top-end', 'left', 'right-start'] as const) {
      await configure(page, { placement });
      await openSettled(page);
      // 关闭后同一帧内重开：退场中的旧节点必须被移除，不能与新箭头并存
      await page.evaluate(async () => {
        (window as any).arrowFixture.close();
        await (window as any).arrowFixture.flush();
        await new Promise(done => setTimeout(done, 60));
      });
      await openSettled(page);
      const shot = await snapshot(page);
      assert.equal(shot.arrows.length, 1, `${placement}：重开后应只有一个箭头，实际 ${shot.arrows.length} 个`);
      await closeSettled(page);
    }
  });
});

it('展开时触发器被同一次渲染挤动，首帧的面板与箭头就贴着触发器的新位置', { skip: !existsSync(executablePath) }, async () => {
  await withDropdown(async (page) => {
    for (const placement of ['top', 'top-end', 'bottom', 'left', 'right'] as const) {
      const side = placement.split('-')[0]!;
      // 回显文字只在展开那次渲染里出现，先清掉，让每轮展开都把触发器挤上去
      await configure(page, { placement, log: '' });
      const shot = await page.evaluate((): Promise<Snapshot> => (window as any).arrowFixture.openFirstFrame());
      assert.equal(shot.arrows.length, 1, `${placement}：首帧应只有一个箭头`);
      assert.ok(shot.noted, '回显文字应与展开处于同一次渲染');
      assert.ok(shot.panel, `${placement}：首帧应已有面板`);
      const { trigger } = shot;
      const panel = shot.panel!;
      const arrow = shot.arrows[0]!;
      const arrowCenterY = (arrow.top + arrow.bottom) / 2;
      const triggerCenterY = (trigger.top + trigger.bottom) / 2;
      if (side === 'top') assert.ok(Math.abs(panel.bottom - (trigger.top - ARROW_OFFSET)) <= 1, `${placement}：面板底边应在触发器上方 ${ARROW_OFFSET}px，实际 ${JSON.stringify({ panel, trigger })}`);
      if (side === 'bottom') assert.ok(Math.abs(panel.top - (trigger.bottom + ARROW_OFFSET)) <= 1, `${placement}：面板顶边应在触发器下方 ${ARROW_OFFSET}px，实际 ${JSON.stringify({ panel, trigger })}`);
      if (side === 'left' || side === 'right') assert.ok(Math.abs(arrowCenterY - triggerCenterY) <= 1, `${placement}：箭头应对准触发器中线，实际偏差 ${(arrowCenterY - triggerCenterY).toFixed(2)}px`);
      assert.ok(tipGap(side, arrow, trigger) >= MIN_TIP_GAP, `${placement}：首帧箭头不应压到触发器`);
      await openSettled(page);
      await closeSettled(page);
    }
  });
});
