/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
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
      height: 240, fixedHeader: true, showHeader: true, data: [{ id: 1, name: '测试行' }],
      columns: [{ prop: 'name', label: '姓名', fixed: 'left', width: 120 }, { prop: 'id', label: '编号', width: 900 }],
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
      clientWidth: { value: 400 }, scrollWidth: { value: 1020 },
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
