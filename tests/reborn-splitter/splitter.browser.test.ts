/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { Page } from 'playwright-core';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { after, before, it } from 'node:test';
import { pathToFileURL } from 'node:url';
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

/** 编译 SFC 的 esbuild 插件：客户端渲染函数，服务端渲染器同样能直接渲染 */
const sfcPlugin = {
  name: 'splitter-sfc',
  setup(builder: any) {
    builder.onLoad({ filter: /\.vue$/ }, async ({ path }: { path: string }) => {
      const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
      const contents = compileScript(descriptor, {
        id: path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: (file: string) => readFileSync(file, 'utf8') },
      }).content;
      return { contents, loader: 'ts' };
    });
  },
};

/**
 * 三个面板：第一个 v-model:size 数字、第二个字符串 size、中间可以用 v-if 插入一个面板。
 * 另有几种特殊写法按开关插入：包在 div 里的面板、非面板组件、异步包装器解析出来的面板（模拟 Nuxt 全局异步注册）。
 * 第一个面板的 min / max 由 minA / maxA 控制；resize、collapse、change、limit 事件逐条记进 state 供断言
 */
const fixtureApp = `
  import Splitter from '~/components/reborn/ui/reborn-splitter/RebornSplitter.vue';
  import Panel from '~/components/reborn/ui/reborn-splitter/RebornSplitterPanel.vue';
  import {defineAsyncComponent,h,reactive} from 'vue';
  const Foreign={props:{size:Number},render:()=>h('span',{'data-testid':'foreign'},'非面板组件')};
  const AsyncPanel=defineAsyncComponent(()=>Promise.resolve(Panel));
  export const state=reactive({first:50,second:'30%',updates:[],extra:false,mounted:true,lazy:false,resizeEnds:0,wrapped:false,foreign:false,asyncPanel:false,
    minA:undefined,maxA:undefined,resizes:0,collapses:[],changes:[],limits:[]});
  export const App={render:()=>h('main',{style:'width:1000px;height:300px'},[state.mounted?h(Splitter,{lazy:state.lazy,onResizeEnd:()=>state.resizeEnds++,
    onResize:()=>state.resizes++,onCollapse:(index,collapsed)=>state.collapses.push([index,collapsed]),
    onChange:(sizes,index)=>state.changes.push([sizes,index]),onLimit:(index,boundary,size)=>state.limits.push([index,boundary,size])},{default:()=>[
    h(Panel,{key:'a',size:state.first,min:state.minA,max:state.maxA,'onUpdate:size':v=>{state.updates.push(['a',v]);state.first=v;},collapsible:true,'data-testid':'panel-a',style:'outline: 1px solid red'},
      {default:()=>'A','start-collapsible':({collapsed})=>h('span',{class:'fixture-start'},collapsed?'展开A':'收起A')}),
    state.extra?h(Panel,{key:'x',size:10},{default:()=>'X'}):null,
    state.asyncPanel?h(AsyncPanel,{key:'async',size:10,'data-testid':'panel-async'},{default:()=>'ASYNC'}):null,
    state.wrapped?h('div',{key:'wrapper','data-testid':'wrapper'},[h(Panel,{size:40},{default:()=>'W'})]):null,
    state.foreign?h(Foreign,{key:'foreign',size:40}):null,
    h(Panel,{key:'b',size:state.second,'onUpdate:size':v=>{state.updates.push(['b',v]);state.second=v;}},{default:()=>'B'}),
    h(Panel,{key:'c'},{default:()=>'C'}),
  ]}):null])};
`;

before(async () => {
  if (!browserAvailable) return;
  const result = await build({
    stdin: {
      contents: `${fixtureApp}
        import {createApp,nextTick} from 'vue';
        const app=createApp(App);
        app.component('Icon',props=>h('svg',{'data-icon':props.name}));
        app.mount('#app');
        window.splitterFixture={state,flush:nextTick};
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'splitter-fixture.ts',
    },
    bundle: true, platform: 'browser', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    // 按开发环境构建，组件里 import.meta.dev 包着的警告才会输出
    define: { 'import.meta.dev': 'true' },
    plugins: [sfcPlugin],
  });
  const compiler = await compile(`@import 'tailwindcss';@import './app/assets/theme/typography.css';@import './app/assets/theme/base.css';`, { base: resolve('.'), onDependency() {} });
  const scanner = new Scanner({ sources: [{ base: resolve('app/components/reborn/ui/reborn-splitter'), pattern: '**/*', negated: false }] });
  const css = compiler.build(scanner.scan());
  const script = result.outputFiles[0]!.text;
  server = createServer((request, response) => {
    response.setHeader('Content-Type', request.url === '/app.js' ? 'text/javascript' : request.url === '/style.css' ? 'text/css' : 'text/html');
    response.end(request.url === '/app.js' ? script : request.url === '/style.css' ? css : '<!doctype html><html><head><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="app"></div><script type="module" src="/app.js"></script></body></html>');
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

it('服务端首屏直接带上面板尺寸与拖拽条，不等挂载登记', async () => {
  const result = await build({
    stdin: {
      contents: `${fixtureApp}
        import {createSSRApp} from 'vue';
        import {renderToString} from 'vue/server-renderer';
        export async function render(){const app=createSSRApp(App);app.component('Icon',props=>h('svg',{'data-icon':props.name}));return renderToString(app);}
      `,
      resolveDir: resolve('.'), loader: 'ts', sourcefile: 'splitter-ssr-fixture.ts',
    },
    bundle: true, platform: 'node', format: 'esm', write: false, alias: { '~': resolve('app'), '@': resolve('app') },
    plugins: [sfcPlugin], external: ['vue', 'vue/server-renderer', '@vue/*'],
  });
  // 产物里保留 vue 的裸模块导入，写到仓库 node_modules 下才能按项目依赖解析；用完即删
  const dir = resolve('node_modules/.cache/reborn-tests');
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `splitter-ssr-${process.pid}.mjs`);
  writeFileSync(file, result.outputFiles[0]!.text);
  try {
    const loaded = await import(pathToFileURL(file).href);
    assertSsr(await loaded.render());
  }
  finally {
    rmSync(file, { force: true });
  }

  function assertSsr(html: string) {
    assert.match(html, /flex:\s*0 0 50%/, `第一个面板 50%：${html}`);
    assert.match(html, /flex:\s*0 0 30%/, '第二个面板按字符串 30% 解析');
    assert.match(html, /flex:\s*0 0 20%/, '未设尺寸的面板平分剩余');
    assert.equal((html.match(/cursor-col-resize/g) ?? []).length, 2, '首屏就有两条拖拽条');
  }
});

async function withSplitter(run: (page: Page, warnings: string[]) => Promise<void>) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 500 } });
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  try {
    await page.goto(url);
    await page.locator('[data-testid="panel-a"]').waitFor();
    await run(page, warnings);
    assert.deepEqual(errors, [], '组件不抛出运行时异常');
    assert.deepEqual(warnings.filter(text => text.includes('Extraneous')), [], '面板是单根节点，透传属性不报警告');
  } finally { await page.close(); }
}

interface FixtureState {
  first: number;
  second: string | number;
  updates: [string, any][];
  resizeEnds: number;
  resizes: number;
  collapses: [number, boolean][];
  changes: [number[], number][];
  limits: [number, 'min' | 'max', number][];
}

function fixtureState(page: Page): Promise<FixtureState> {
  return page.evaluate(() => JSON.parse(JSON.stringify((window as any).splitterFixture.state)));
}

async function configure(page: Page, value: Record<string, unknown>) {
  await page.evaluate(async (value) => {
    Object.assign((window as any).splitterFixture.state, value);
    await (window as any).splitterFixture.flush();
  }, value);
}

/** 各面板宽度占根容器的百分比 */
function panelWidths(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    const root = document.querySelector('main > div') as HTMLElement;
    return [...root.children].filter(element => (element as HTMLElement).style.flex)
      .map(element => Math.round(((element as HTMLElement).getBoundingClientRect().width / root.getBoundingClientRect().width) * 1000) / 10);
  });
}

it('挂载不发 update:size；拖拽后才发，载荷格式跟随传入值', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    assert.deepEqual((await fixtureState(page)).updates, [], '挂载时不改写父级的值');
    const widths = await panelWidths(page);
    assert.deepEqual(widths.map(Math.round), [50, 30, 20]);

    const bar = page.locator('[data-testid="panel-a"] > div').nth(1);
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, box.y + 100, { steps: 4 });
    await page.mouse.up();

    const state = await fixtureState(page);
    assert.ok(Math.abs(state.first - 60) < 1, `第一个面板约 60：${state.first}`);
    assert.match(String(state.second), /^[\d.]+%$/, `字符串入参回写字符串：${state.second}`);
    assert.ok(Math.abs(Number.parseFloat(String(state.second)) - 20) < 1);
    assert.equal(state.resizeEnds, 1);
    assert.deepEqual(await page.evaluate(() => [document.body.style.cursor, document.body.style.userSelect]), ['', '']);
  });
});

it('父级改写 size 时与相邻面板重新分配，总和保持 100%', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    // 先拖一次进入「已调整」状态，再从外部改写
    const bar = page.locator('[data-testid="panel-a"] > div').nth(1);
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 100, box.y + 100, { steps: 4 });
    await page.mouse.up();
    await configure(page, { first: 30 });
    await page.evaluate(() => new Promise(done => requestAnimationFrame(done)));
    const widths = await panelWidths(page);
    assert.ok(Math.abs(widths[0]! - 30) < 1, `第一个面板变为 30：${widths}`);
    assert.ok(Math.abs(widths.reduce((a, b) => a + b, 0) - 100) < 1, `总和 100：${widths}`);
    assert.ok(Math.abs(widths[2]! - 20) < 1, '不相邻的面板不受影响');
  });
});

it('中间插入、移除面板只动相邻面板，拖好的比例与下标保持正确', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    // 未调整过时布局完全按配置推导：插入面板后自动面板平分剩余
    await configure(page, { extra: true });
    assert.deepEqual((await panelWidths(page)).map(Math.round), [50, 10, 30, 10]);
    await configure(page, { extra: false });
    assert.deepEqual((await fixtureState(page)).updates, [], '未调整过时显式 size 的面板尺寸不变，不发 update:size');

    // 拖过之后：新面板只从相邻面板扣出份额，拖好的比例不被整体重算
    const bar = page.locator('[data-testid="panel-a"] > div').nth(1);
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + 100, { steps: 4 });
    await page.mouse.up();
    const dragged = await panelWidths(page);
    assert.ok(Math.abs(dragged[0]! - 55) < 1, `拖到约 55：${dragged}`);

    await configure(page, { extra: true });
    let widths = await panelWidths(page);
    assert.equal(widths.length, 4);
    assert.ok(Math.abs(widths.reduce((a, b) => a + b, 0) - 100) < 1, `插入后总和 100：${widths}`);
    assert.ok(Math.abs(widths[1]! - 10) < 1, `新面板按自身 size 取份额：${widths}`);
    assert.ok(Math.abs(widths[0]! - (dragged[0]! - 10)) < 1, '份额从前一个相邻面板扣出');
    assert.ok(Math.abs(widths[2]! - dragged[1]!) < 1 && Math.abs(widths[3]! - dragged[2]!) < 1, '不相邻的面板不受影响');
    assert.equal(await page.locator('main [class*="cursor-col-resize"]').count(), 3, '拖拽条随面板数量更新');

    let state = await fixtureState(page);
    assert.ok(Math.abs(state.first - widths[0]!) < 1, `被扣出份额的相邻面板补发 update:size，绑定值与实际尺寸一致：${state.first} / ${widths}`);
    assert.ok(Math.abs(Number.parseFloat(String(state.second)) - widths[2]!) < 1, `不相邻的面板绑定值不变：${state.second}`);

    await configure(page, { extra: false });
    widths = await panelWidths(page);
    assert.deepEqual(widths.map(Math.round), dragged.map(Math.round), '移除后份额补回相邻面板，拖好的比例原样恢复');
    state = await fixtureState(page);
    assert.ok(Math.abs(state.first - widths[0]!) < 1, `份额补回后绑定值同步回来：${state.first} / ${widths}`);

    // 插入后绑定值已跟上实际尺寸，父级再写回插入前的旧值也能生效（失步时模型没变、watch 不触发，改不回去）
    await configure(page, { extra: true });
    const restored = Math.round(dragged[0]!);
    await configure(page, { first: restored });
    widths = await panelWidths(page);
    assert.ok(Math.abs(widths[0]! - restored) < 1, `父级写回旧值后第一个面板恢复：${widths}`);
    assert.ok(Math.abs(widths.reduce((a, b) => a + b, 0) - 100) < 1, `总和 100：${widths}`);
  });
});

it('面板外包一层元素、默认插槽里放非面板组件时不抛错：只有直接子面板参与尺寸分配，开发环境给出警告', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page, warnings) => {
    await configure(page, { wrapped: true, foreign: true });
    assert.deepEqual((await panelWidths(page)).map(Math.round), [50, 30, 20], '包装元素与非面板组件不分配尺寸，其余面板比例不变');
    assert.equal(await page.locator('[data-testid="wrapper"]').textContent(), 'W', '包在元素里的面板降级为普通容器，内容照常渲染');
    assert.equal(await page.locator('[data-testid="wrapper"] [class*="cursor-col-resize"]').count(), 0, '降级的面板没有拖拽条');
    assert.equal(await page.locator('[data-testid="foreign"]').count(), 1, '非面板组件原样渲染');
    assert.equal(await page.locator('main [class*="cursor-col-resize"]').count(), 2, '拖拽条只按直接子面板计数');
    assert.ok(warnings.some(text => text.includes('[RebornSplitterPanel]')), `开发环境提示面板必须是直接子节点：${warnings}`);
  });
});

it('全局异步注册解析出来的面板（异步包装器）照常参与尺寸分配', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    await configure(page, { asyncPanel: true });
    await page.locator('[data-testid="panel-async"]').waitFor();
    assert.deepEqual((await panelWidths(page)).map(Math.round), [50, 10, 30, 10]);
    assert.equal(await page.locator('main [class*="cursor-col-resize"]').count(), 3);
  });
});

it('拖拽中被卸载时恢复 body 样式', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    const bar = page.locator('[data-testid="panel-a"] > div').nth(1);
    const box = (await bar.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + 100);
    assert.equal(await page.evaluate(() => document.body.style.cursor), 'col-resize');
    await configure(page, { mounted: false });
    assert.deepEqual(await page.evaluate(() => [document.body.style.cursor, document.body.style.userSelect]), ['', '']);
    await page.mouse.up();
  });
});

it('折叠插槽渲染在折叠按钮内，作用域带 collapsed；透传属性落在面板根节点', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    const panel = page.locator('[data-testid="panel-a"]');
    assert.match((await panel.getAttribute('style')) ?? '', /outline/);
    const start = panel.locator('button .fixture-start');
    assert.equal(await start.textContent(), '收起A');
    await start.click();
    assert.equal(Math.round((await panelWidths(page))[0]!), 0);
    assert.equal(await panel.locator('button .fixture-start').textContent(), '展开A');
    const updates = (await fixtureState(page)).updates;
    assert.deepEqual(updates.at(-1)?.[0], 'b', '折叠把份额让给相邻面板并通知它');
  });
});

/** 第一个面板后面那条拖拽条的中心点（拖拽后位置会变，每次拖拽前重新取） */
async function barCenter(page: Page) {
  const box = (await page.locator('[data-testid="panel-a"] > div').nth(1).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + 100 };
}

/** 百分比尺寸的近似比较：像素边界换算与指针坐标都会带来浮点尾差 */
function assertNear(actual: number | undefined, expected: number, message: string) {
  assert.ok(actual !== undefined && Math.abs(actual - expected) < 0.5, `${message}：实际 ${actual}，期望约 ${expected}`);
}

it('拖拽进入 min / max 边界时 limit 只派发一次，停在边界上不重复，离开再回到才再派发；拖拽中不派发 change', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    // 容器 1000px：数字 min 300 按像素换算为 30%，字符串 max 按百分比 70%
    await configure(page, { minA: 300, maxA: '70%' });
    const { x, y } = await barCenter(page);
    await page.mouse.move(x, y);
    await page.mouse.down();

    // 往左越过 min：多帧夹在 30% 上，只派发一次
    await page.mouse.move(x - 250, y, { steps: 5 });
    await page.mouse.move(x - 320, y, { steps: 2 });
    let state = await fixtureState(page);
    assert.equal(state.limits.length, 1, `停在 min 上不重复派发：${JSON.stringify(state.limits)}`);
    assert.deepEqual(state.limits[0]!.slice(0, 2), [0, 'min']);
    assertNear(state.limits[0]![2], 30, 'limit 载荷带当前尺寸');
    assert.ok(state.resizes > 0, '非 lazy 拖拽中实时派发 resize');
    assert.deepEqual(state.changes, [], '拖拽过程中不派发 change');

    // 往右越过 max：同样只派发一次；后一个面板没有设置边界、也没被压到 0，不派发
    await page.mouse.move(x + 300, y, { steps: 6 });
    await page.mouse.move(x + 360, y, { steps: 2 });
    state = await fixtureState(page);
    assert.equal(state.limits.length, 2, `停在 max 上不重复派发：${JSON.stringify(state.limits)}`);
    assert.deepEqual(state.limits[1]!.slice(0, 2), [0, 'max']);
    assertNear(state.limits[1]![2], 70, 'max 载荷带当前尺寸');

    // 离开 max 再回到 min：重新进入边界，再派发一次
    await page.mouse.move(x - 260, y, { steps: 6 });
    state = await fixtureState(page);
    assert.equal(state.limits.length, 3, `离开后再回到边界才再派发：${JSON.stringify(state.limits)}`);
    assert.deepEqual(state.limits[2]!.slice(0, 2), [0, 'min']);
    assert.deepEqual(state.changes, [], '整个拖拽过程都不派发 change');

    await page.mouse.up();
    state = await fixtureState(page);
    assert.equal(state.resizeEnds, 1);
    assert.equal(state.changes.length, 1, '松手后派发一次 change');
    const [sizes, index] = state.changes[0]!;
    assert.equal(index, 1, 'change 的下标是被拖动的拖拽条（后一个面板的下标）');
    assert.equal(sizes.length, 3, '载荷包含全部面板');
    assertNear(sizes[0], 30, '第一个面板停在 min');
    assertNear(sizes[1], 50, '相邻面板接住让出的份额');
    assertNear(sizes[2], 20, '不相邻的面板不变');

    // 按下时已经停在 min 上：继续往 min 方向拖不算进入，尺寸没变，松手也不派发 change
    const again = await barCenter(page);
    await page.mouse.move(again.x, again.y);
    await page.mouse.down();
    await page.mouse.move(again.x - 60, again.y, { steps: 3 });
    await page.mouse.up();
    state = await fixtureState(page);
    assert.equal(state.limits.length, 3, `按下时已在边界上不派发：${JSON.stringify(state.limits)}`);
    assert.equal(state.changes.length, 1, '尺寸没有变化的拖拽不派发 change');
    assert.equal(state.resizeEnds, 2);
  });
});

it('lazy 模式按幽灵条位置派发 limit，松手提交时才派发 change', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    await configure(page, { lazy: true, minA: '40%' });
    const { x, y } = await barCenter(page);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 200, y, { steps: 4 });
    let state = await fixtureState(page);
    assert.equal(state.limits.length, 1, `幽灵条夹在 min 上只派发一次：${JSON.stringify(state.limits)}`);
    assert.deepEqual(state.limits[0]!.slice(0, 2), [0, 'min']);
    assertNear(state.limits[0]![2], 40, 'lazy 下载荷是幽灵条位置对应的尺寸');
    assert.equal(state.resizes, 0, 'lazy 拖拽中不派发 resize');
    assert.deepEqual(state.changes, [], 'lazy 拖拽中不派发 change');
    assert.deepEqual((await panelWidths(page)).map(Math.round), [50, 30, 20], '松手前面板尺寸不变');

    await page.mouse.up();
    state = await fixtureState(page);
    assert.equal(state.changes.length, 1);
    const [sizes, index] = state.changes[0]!;
    assert.equal(index, 1);
    assertNear(sizes[0], 40, 'lazy 松手后提交到 min');
    assertNear(sizes[1], 40, '相邻面板接住让出的份额');
  });
});

it('折叠 / 展开派发带状态的 collapse 与一次 change；父级改写 size 引起相邻补偿时也派发 change', { skip: !browserAvailable }, async () => {
  await withSplitter(async (page) => {
    // 从未调整过时父级改 size 等于换一套配置，布局按配置重新推导，不派发 change（与 resize 一致）
    await configure(page, { first: 40 });
    assert.deepEqual((await panelWidths(page)).map(Math.round), [40, 30, 30]);
    let state = await fixtureState(page);
    assert.deepEqual(state.changes, []);
    assert.equal(state.resizes, 0);

    const start = page.locator('[data-testid="panel-a"] button .fixture-start');
    await start.click();
    state = await fixtureState(page);
    assert.deepEqual(state.collapses, [[0, true]], 'collapse 第二个参数为操作后是否折叠');
    assert.equal(state.changes.length, 1, `折叠后派发一次 change：${JSON.stringify(state.changes)}`);
    assert.deepEqual(state.changes[0]![0].map(Math.round), [0, 70, 30]);
    assert.equal(state.changes[0]![1], 1, '份额在面板 0 与 1 之间转移，下标取两者之间的拖拽条');
    assert.deepEqual(state.limits, [], '折叠不是拖拽，不派发 limit');

    // 折叠后展开按钮落在后一个面板的区域上，本用例只验证事件，直接派发点击，不做命中测试
    await start.dispatchEvent('click');
    state = await fixtureState(page);
    assert.deepEqual(state.collapses, [[0, true], [0, false]]);
    assert.equal(state.changes.length, 2, 'v-model:size 回写不会再触发一次 change');
    assert.deepEqual(state.changes[1]![0].map(Math.round), [40, 30, 30]);

    // 调整过之后父级改写 size：与相邻面板重新分配，派发一次 resize 与一次 change
    const resizes = state.resizes;
    await configure(page, { first: 20 });
    state = await fixtureState(page);
    assert.equal(state.resizes, resizes + 1);
    assert.equal(state.changes.length, 3, `父级改写 size 派发一次 change：${JSON.stringify(state.changes)}`);
    assert.deepEqual(state.changes[2]![0].map(Math.round), [20, 50, 30]);
    assert.equal(state.changes[2]![1], 1);

    // 写回与当前相同的值不改变布局，不派发
    await configure(page, { first: 20 });
    assert.equal((await fixtureState(page)).changes.length, 3);
  });
});
