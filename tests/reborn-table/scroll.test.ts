/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { TableColumn } from '../../app/components/reborn/ui/reborn-table/table.types';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rmdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

it('真实滚动组件支持立即双轴定位、联合平滑滚动及实际表头高度测量', async (t) => {
  const dom = new JSDOM('<div id="app"></div>');
  const previous = new Map<string, PropertyDescriptor | undefined>();
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  function frame(time = performance.now()) {
    const tasks = [...frames.values()];
    frames.clear();
    tasks.forEach(task => task(time));
  }
  const globals = {
    window: dom.window, document: dom.window.document, Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement, SVGElement: dom.window.SVGElement,
    // 保留真实滚动逻辑，帧时钟由测试显式推进，可断言中间值而非只看终点。
    requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id: number) => { frames.delete(id); },
  };
  for (const [key, value] of Object.entries(globals)) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  const folder = await mkdtemp(resolve('tests/reborn-table/.runtime-'));
  const output = resolve(folder, 'scroll.mjs');
  let unmount: (() => void) | undefined;
  try {
    await build({
      entryPoints: [resolve('app/components/reborn/ui/reborn-table/RebornTable.vue')], outfile: output,
      bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
      plugins: [{ name: 'table-scroll-test', setup(builder) {
        builder.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
        builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
          const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
          return { contents: compileScript(descriptor, { id: 'table-scroll-test', inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts' };
        });
      } }],
    });
    // Vue 首次加载时读取 document，必须在浏览器环境准备后导入。
    const { createApp, h, nextTick, reactive, ref } = await import('vue');
    const Table = (await import(pathToFileURL(output).href)).default;
    const table = ref();
    const props = reactive({
      height: 240, fixedHeader: true, showHeader: true, showSummary: false, data: [{ id: 1, name: '测试行' }],
      columns: [{ prop: 'name', label: '姓名', fixed: 'left', width: 120 }, { prop: 'id', label: '编号', width: 800 }, { prop: 'amount', label: '金额', fixed: 'right', width: 100 }] as TableColumn[],
    });
    const app = createApp({ render: () => h(Table, { ...props, ref: table }) });
    app.mount(dom.window.document.querySelector('#app')!);
    unmount = () => app.unmount();
    await nextTick();
    const wrap = dom.window.document.querySelector<HTMLElement>('.reborn-scrollbar__wrap')!;
    await t.test('固定列的层级隔离在内容区，不能覆盖同级滚动条', () => {
      assert.ok(wrap.classList.contains('isolate'));
    });
    // jsdom 不做布局，仅提供确定的几何；偏移仍由真实 RebornScrollbar 写入。
    Object.defineProperties(wrap, {
      clientHeight: { value: 240 }, scrollHeight: { value: 900 },
      clientWidth: { value: 400, configurable: true }, scrollWidth: { value: 1020 },
    });
    await t.test('固定区域只在遮住滚动内容时显示外侧阴影，布局变化后同步清除', async () => {
      const edges = (side: string) => [...dom.window.document.querySelectorAll<HTMLElement>(`[data-fixed-edge="${side}"]`)];
      const scroll = async (left: number) => {
        wrap.scrollLeft = left;
        wrap.dispatchEvent(new dom.window.Event('scroll'));
        await nextTick();
      };
      const visible = (side: string, expected: boolean) => {
        assert.equal(edges(side).length, 2, '表头与表体均须保留固定边缘');
        for (const cell of edges(side)) assert.equal(cell.classList.contains('after:opacity-100'), expected);
      };
      await scroll(0);
      visible('left', false);
      visible('right', true);
      await scroll(100);
      visible('left', true);
      visible('right', true);
      await scroll(620);
      visible('left', true);
      visible('right', false);
      Object.defineProperty(wrap, 'clientWidth', { value: 1020, configurable: true });
      wrap.scrollLeft = 0;
      table.value.doLayout();
      frame();
      await nextTick();
      visible('left', false);
      visible('right', false);
      Object.defineProperty(wrap, 'clientWidth', { value: 400, configurable: true });
    });
    await t.test('滚动条随滚动重绘时不重建表格内容，跨过固定列边界才重绘一次', async () => {
      // cellClassName 每渲染一个数据格调用一次，用它统计表格内容的渲染次数。
      let renders = 0;
      props.cellClassName = () => { renders++; return ''; };
      await nextTick();
      const scroll = async (top: number, left: number) => {
        wrap.scrollTop = top;
        wrap.scrollLeft = left;
        wrap.dispatchEvent(new dom.window.Event('scroll'));
        await nextTick();
      };
      try {
        await scroll(0, 100);
        const baseline = renders;
        // 纵向与横向都在固定列阴影边界内移动：滑块重绘，表格不动
        for (const [top, left] of [[40, 120], [80, 160], [120, 200], [160, 240]]) await scroll(top!, left!);
        const thumb = dom.window.document.querySelector<HTMLElement>('.reborn-scrollbar__bar--vertical .reborn-scrollbar__thumb')!;
        assert.match(thumb.style.transform, /translateY\((?!0px)/, '滚动条本身仍在跟随滚动');
        assert.equal(renders, baseline, '滚动不应重建任何单元格');
        // 回到最左侧，左固定列阴影需要熄灭，此时表格内容只重绘一次
        await scroll(160, 0);
        assert.equal(renders, baseline + 3, '跨过边界只重绘一次（单行三列）');
      } finally {
        props.cellClassName = undefined as unknown as () => string;
        await scroll(0, 0);
      }
    });
    await t.test('多列固定及分组表头只在整块区域的内缘绘制阴影', async () => {
      const original = props.columns;
      try {
        props.columns = [
          { label: '人员', fixed: 'left', children: [{ prop: 'id', width: 60 }, { prop: 'name', width: 120 }] },
          { prop: 'description', width: 600 },
          { prop: 'amount', fixed: 'right', width: 120 },
          { prop: 'actions', fixed: 'right', width: 120 },
        ];
        await nextTick();
        const left = [...dom.window.document.querySelectorAll('[data-fixed-edge="left"]')];
        const right = [...dom.window.document.querySelectorAll<HTMLElement>('[data-fixed-edge="right"]')];
        assert.equal(left.length, 3, '左侧父表头、最后一个子表头与表体末列各绘制一次');
        assert.equal(right.length, 2, '右侧仅第一固定列的表头和表体绘制');
        assert.ok(left.filter(cell => cell.tagName === 'TD').every(cell => cell.textContent === '测试行'));
        assert.ok(right.every(cell => cell.style.right === '120px'), '阴影属于靠近内容的金额列，不属于最外侧操作列');
        props.showSummary = true;
        await nextTick();
        const summaryEdges = dom.window.document.querySelectorAll('tfoot [data-fixed-edge]');
        assert.equal(summaryEdges.length, 2, '合计行沿用左右固定区边缘');
        assert.equal(summaryEdges[0]!.getAttribute('data-fixed-edge'), 'left');
        assert.equal(summaryEdges[1]!.getAttribute('data-fixed-edge'), 'right');
      } finally {
        props.columns = original;
        props.showSummary = false;
        await nextTick();
      }
    });
    wrap.scrollTop = 150;
    wrap.scrollLeft = 100;
    table.value.setScrollTop(0);
    table.value.setScrollLeft(0);
    assert.deepEqual([wrap.scrollTop, wrap.scrollLeft], [0, 0]);
    table.value.setScrollLeft(80);
    table.value.setScrollTop(120);
    assert.deepEqual([wrap.scrollTop, wrap.scrollLeft], [120, 80]);

    await t.test('scrollTo 一次调用同步动画两轴，默认调用仍立即落位', async () => {
      assert.equal(typeof table.value.scrollTo, 'function');
      const start = performance.now();
      const completion = table.value.scrollTo({ top: 0, left: 0, behavior: 'smooth', duration: 400 });
      assert.deepEqual([wrap.scrollTop, wrap.scrollLeft], [120, 80]);
      frame(start + 200);
      assert.ok(wrap.scrollTop > 0 && wrap.scrollTop < 120);
      assert.ok(wrap.scrollLeft > 0 && wrap.scrollLeft < 80);
      frame(start + 500);
      await completion;
      assert.deepEqual([wrap.scrollTop, wrap.scrollLeft], [0, 0]);
      await table.value.scrollTo({ top: 50, left: 30 });
      assert.deepEqual([wrap.scrollTop, wrap.scrollLeft], [50, 30]);
    });

    await t.test('固定轨道采用测量后的表头高度，非固定与无表头恢复到顶部', async () => {
      const row = dom.window.document.querySelector('thead tr')!;
      row.getBoundingClientRect = () => ({ height: 64 } as DOMRect);
      table.value.doLayout();
      frame();
      await nextTick();
      const vertical = dom.window.document.querySelector<HTMLElement>('.reborn-scrollbar__bar--vertical')!;
      assert.equal(Number.parseFloat(vertical.style.top), 64);
      props.fixedHeader = false;
      await nextTick();
      // 零偏移移除内联覆盖，恢复滚动条 CSS 中原有的圆角安全内缩。
      assert.equal(vertical.style.top, '');
      props.fixedHeader = true;
      props.showHeader = false;
      await nextTick();
      assert.equal(vertical.style.top, '');
    });
  } finally {
    unmount?.();
    dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    await unlink(output).catch(() => {});
    await rmdir(folder);
  }
});
