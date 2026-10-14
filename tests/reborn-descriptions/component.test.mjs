/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterEach, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { runInThisContext } from 'node:vm';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { compileScript, parse } = require('@vue/compiler-sfc');
const { build } = require('esbuild');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><head><style>.reborn-descriptions { padding: 0; border: 0 solid transparent; }</style></head><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
HTMLElement.prototype.getBoundingClientRect = () => ({ width: 900, height: 48, top: 0, left: 0, right: 900, bottom: 48 });
const observers = new Set();
class TestResizeObserver {
  constructor(callback) { this.callback = callback; }
  observe(target) { this.target = target; observers.add(this); }
  disconnect() { observers.delete(this); }
}
globalThis.ResizeObserver = dom.window.ResizeObserver = TestResizeObserver;
const { createApp, h, Fragment, shallowRef, nextTick } = await import(pathToFileURL(require.resolve('vue')).href);

async function compileComponent(filename) {
  const result = await build({
    entryPoints: [path.resolve('app/components/reborn/ui/reborn-descriptions', filename)], bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external',
    plugins: [{ name: '测试编译Vue', setup(builder) {
      builder.onResolve({ filter: /^~\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
      builder.onLoad({ filter: /\.vue$/ }, args => {
        const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
        assert.deepEqual(errors, []);
        return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
      });
    } }],
  });
  const module = { exports: {} };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
  return module.exports.default;
}
const Descriptions = await compileComponent('RebornDescriptions.vue');
const Item = await compileComponent('RebornDescriptionsItem.vue');
const mounted = [];
function mount(initial = {}, slots) {
  const props = shallowRef(initial);
  const container = document.createElement('div'); document.body.append(container);
  const app = createApp({ setup: () => () => h(Descriptions, props.value, slots) });
  app.mount(container);
  mounted.push(() => { app.unmount(); container.remove(); });
  return { props, container };
}
const tick = async () => { await nextTick(); await nextTick(); };
const field = (name, options = {}) => ({ label: `标签${name}`, value: name, contentClass: `cell-${name}`, ...options });
const cell = (p, name) => p.container.querySelector(`.cell-${name}`).closest('td');

// 按浏览器原生表格的逐格放置规则还原网格，断言跨行跨列没有交叠、溢出或空洞。
function grid(p, columns) {
  const tableRows = [...p.container.querySelectorAll('tbody > tr')];
  const cells = Array.from({ length: tableRows.length }, () => []);
  for (const [rowIndex, row] of tableRows.entries()) {
    let cursor = 0;
    for (const td of row.children) {
      while (cells[rowIndex][cursor]) cursor++;
      for (let y = rowIndex; y < rowIndex + td.rowSpan; y++) {
        assert.ok(cells[y], '跨行范围必须有实际 tr');
        for (let x = cursor; x < cursor + td.colSpan; x++) {
          assert.ok(x < columns, '单元格不应超出表格列数');
          assert.equal(cells[y][x], undefined, '单元格不能重叠');
          cells[y][x] = td;
        }
      }
      cursor += td.colSpan;
    }
  }
  for (const row of cells) {
    assert.equal(row.length, columns);
    assert.ok(Array.from({ length: columns }, (_, index) => row[index]).every(Boolean), '每行均有完整占位');
  }
  return cells;
}
afterEach(() => { mounted.splice(0).forEach(cleanup => cleanup()); });

it('items 水平跨行，后续项避开占用列且跨行项底边正确', async () => {
  const p = mount({ bordered: true, column: 2, items: [field('A', { rowspan: 2 }), field('B'), field('C'), field('D', { span: 2 })] }); await tick();
  const cells = grid(p, 4);
  assert.equal(cells.length, 3);
  assert.equal(cell(p, 'A').rowSpan, 2);
  assert.equal(cells[1][1], cell(p, 'A'));
  assert.equal(cells[1][3], cell(p, 'C'));
  assert.equal(cell(p, 'D').colSpan, 3);
  assert.ok(cell(p, 'A').classList.contains('border-b'));
  assert.equal(cell(p, 'D').classList.contains('border-b'), false);
});

it('子组件插槽与 Fragment 支持 rowspan，内容和标签插槽均保留', async () => {
  const p = mount({ bordered: true, column: 2 }, { default: () => h(Fragment, [
    h(Item, { rowspan: 2, contentClass: 'cell-A' }, { label: () => h('em', '自定义标签'), default: () => h('strong', 'A') }),
    h(Fragment, [h(Item, { label: '上午' }, () => 'B'), h(Item, { label: '下午' }, () => 'C')]),
  ]) }); await tick();
  const cells = grid(p, 4);
  assert.equal(cells.length, 2);
  assert.equal(cell(p, 'A').rowSpan, 2);
  assert.equal(p.container.querySelector('em').textContent, '自定义标签');
  assert.equal(p.container.querySelector('strong').textContent, 'A');
});

it('交错跨行与多列合并保留空洞，filled 不越过占用列', async () => {
  const items = [field('A', { rowspan: 3 }), field('B'), field('C', { rowspan: 2 }), field('D', { span: 2, rowspan: 2 }), field('E', { span: 'filled' }), field('F')];
  for (const layout of ['horizontal', 'vertical']) {
    for (const bordered of [true, false]) {
      const p = mount({ bordered, layout, column: 3, items }); await tick();
      const cells = grid(p, layout === 'horizontal' && bordered ? 6 : 3);
      assert.ok(cells.length >= 4);
      assert.equal(cell(p, 'D').rowSpan, layout === 'vertical' ? 3 : 2);
      assert.equal(cell(p, 'D').colSpan, layout === 'horizontal' && bordered ? 3 : 2);
      assert.ok(p.container.textContent.includes('F'));
      assert.ok([...p.container.querySelectorAll('td')].every(td => td.textContent.trim() !== '：'), '空占位不能显示孤立冒号');
    }
  }
});

it('末列被跨行项占用时，数组末项仍有右侧边线', async () => {
  const p = mount({ bordered: true, column: 2, items: [field('A'), field('B', { rowspan: 3 }), field('C'), field('D')] }); await tick();
  const cells = grid(p, 4);
  assert.equal(cells.length, 3);
  assert.equal(cell(p, 'C').classList.contains('border-r'), true);
  assert.equal(cell(p, 'D').classList.contains('border-r'), true);
  assert.equal(cell(p, 'B').classList.contains('border-r'), false);
  assert.equal(cell(p, 'B').classList.contains('border-b'), false);
});

it('垂直布局标签不跨行，内容跨越后续标签行和内容行', async () => {
  const p = mount({ bordered: true, layout: 'vertical', column: 2, items: [field('A', { rowspan: 2 }), field('B'), field('C')] }); await tick();
  const cells = grid(p, 2);
  assert.equal(cells.length, 4);
  assert.equal(cells[0][0].rowSpan, 1);
  assert.equal(cell(p, 'A').rowSpan, 3);
  assert.equal(cells[2][0], cell(p, 'A'));
  assert.equal(cells[3][0], cell(p, 'A'));
  assert.equal(cells[3][1], cell(p, 'C'));
});

it('响应式列数改变后重新排列跨行，不保留旧占位', async () => {
  const p = mount({ bordered: true, column: { xs: 1, sm: 2 }, items: [field('A', { rowspan: 2 }), field('B'), field('C')] }); await tick();
  assert.equal(grid(p, 4).length, 2);
  const root = p.container.querySelector('.reborn-descriptions');
  const resize = width => { for (const observer of observers) if (observer.target === root) observer.callback([{ contentRect: { width } }]); };
  resize(360); await tick();
  assert.equal(grid(p, 2).length, 4);
  assert.equal(cell(p, 'A').rowSpan, 2);
  resize(900); await tick();
  assert.equal(grid(p, 4).length, 2);
});

it('无 rowspan 的原布局保留 span、filled 和末项补齐', async () => {
  const items = [field('A'), field('B', { span: 2 }), field('C'), field('D', { span: 'filled' }), field('E')];
  for (const layout of ['horizontal', 'vertical']) {
    for (const bordered of [true, false]) {
      const p = mount({ bordered, layout, column: 3, items }); await tick();
      const cells = grid(p, layout === 'horizontal' && bordered ? 6 : 3);
      assert.equal(cells.length, layout === 'vertical' ? 6 : 3);
      assert.equal(cell(p, 'E').colSpan, layout === 'horizontal' && bordered ? 5 : 3);
      assert.equal(p.container.querySelector('[rowspan]'), null);
      assert.equal(cell(p, 'D').colSpan, layout === 'horizontal' && bordered ? 3 : 2);
    }
  }
});

it('rowspan 的无效值归一为 1，小数向下取整，并保留末尾空行', async () => {
  for (const rowspan of [-4, 0, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const p = mount({ column: 1, items: [field('A', { rowspan })] }); await tick();
    assert.equal(grid(p, 1).length, 1);
    assert.equal(cell(p, 'A').rowSpan, 1);
  }
  const p = mount({ bordered: true, column: 1, items: [field('A', { rowspan: 3.8 })] }); await tick();
  assert.equal(grid(p, 2).length, 3);
  assert.equal(cell(p, 'A').rowSpan, 3);
});

it('多组跨行跨列组合在四种布局下均无重叠', async () => {
  for (let variant = 0; variant < 12; variant++) {
    const items = Array.from({ length: 7 }, (_, index) => field(`X${index}`, { span: (index + variant) % 5 === 0 ? 'filled' : (index + variant) % 3 + 1, rowspan: (index * 3 + variant) % 4 + 1 }));
    for (const layout of ['horizontal', 'vertical']) {
      for (const bordered of [true, false]) {
        const p = mount({ column: 4, layout, bordered, items }); await tick();
        grid(p, layout === 'horizontal' && bordered ? 8 : 4);
      }
    }
  }
});

it('直接或响应式 column 的非有限值回退为 3，非有限 span 回退为 1', async () => {
  for (const column of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, { xs: Number.NaN }, { xs: 1, sm: Number.POSITIVE_INFINITY }]) {
    const p = mount({ bordered: true, column, items: [field('A', { span: Number.NaN }), field('B', { span: Number.POSITIVE_INFINITY }), field('C')] }); await tick();
    assert.equal(grid(p, 6).length, 1);
    assert.equal(cell(p, 'A').colSpan, 1);
    assert.equal(cell(p, 'B').colSpan, 1);
  }
});
