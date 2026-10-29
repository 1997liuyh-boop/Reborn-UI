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
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
const { createApp, h, shallowRef, nextTick } = await import(pathToFileURL(require.resolve('vue')).href);
globalThis.useFormInject = () => ({ disabled: shallowRef(false), size: shallowRef(null), isError: shallowRef(false), validate() {} });

const result = await build({
  entryPoints: [path.resolve('app/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue')],
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
  plugins: [{ name: '测试编译Vue', setup(builder) {
    builder.onResolve({ filter: /^[@~]\// }, args => ({ path: path.resolve('app', `${args.path.slice(2)}.ts`) }));
    builder.onLoad({ filter: /\.vue$/ }, args => {
      if (args.path.endsWith('RebornSelectTrigger.vue')) {
        return { contents: `import { defineComponent, h } from 'vue'; export default defineComponent({ props: ['isOpen','ui'], setup: (props,{slots}) => () => h('div', [slots.trigger?.(), props.isOpen ? h('div', { 'data-overlay': '', class: props.ui.dropdown }, slots.content?.()) : null]) });`, loader: 'js' };
      }
      if (!/reborn-date-picker(?:-panel)?[/\\]/.test(args.path)) {
        return { contents: `import { defineComponent, h } from 'vue'; export default defineComponent({ setup: (props,{slots}) => () => h('div', slots.default?.({toggle() {}})) });`, loader: 'js' };
      }
      const { descriptor, errors } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
      assert.deepEqual(errors, []);
      return { contents: compileScript(descriptor, { id: args.path, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') } }).content, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  } }],
});
const module = { exports: {} };
runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0].text}\n})`)(module, module.exports, require);
const Picker = module.exports.default;
const mounted = [];
afterEach(() => mounted.splice(0).forEach(fn => fn()));
const tick = async () => { await nextTick(); await nextTick(); };
function mount(initial = {}) {
  const props = shallowRef(initial);
  const updates = [];
  const changes = [];
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({ setup: () => () => h(Picker, { ...props.value, 'onUpdate:modelValue': value => {
    updates.push(value);
    props.value = { ...props.value, modelValue: value };
  }, onChange: value => changes.push(value) }, { cell: cell => h('span', { 'data-day': `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}` }, cell.text) }) });
  app.component('Icon', props => h('i', { 'data-icon': props.name }));
  app.mount(root);
  mounted.push(() => { app.unmount(); root.remove(); });
  return { root, props, updates, changes };
}
async function inputDate(input, value) {
  assert.ok(input, '提供日期输入框');
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick();
}
async function enter(input) {
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await tick();
}
function cell(p, date) { return p.root.querySelector(`[data-day="${date}"]`).parentElement; }

it('输入有效日期，回车确认；无 valueFormat 时提交 Date', async () => {
  const p = mount();
  await inputDate(p.root.querySelector('input'), '2026-02-28');
  assert.equal(p.updates.length, 0);
  await enter(p.root.querySelector('input'));
  assert.ok(p.updates[0] instanceof Date);
  assert.equal(p.updates[0].getMonth(), 1);
  assert.equal(p.updates[0].getDate(), 28);
  assert.equal(p.changes.length, 1);
});

it('完整输入立即切换已展开的面板年月，失焦后无需重新展开', async () => {
  const p = mount({ modelValue: '2026-01-05', valueFormat: 'YYYY-MM-DD' });
  p.root.querySelector('[data-state]').click(); await tick();
  const input = p.root.querySelector('input');
  await inputDate(input, '2025-10-10');
  assert.ok(p.root.querySelector('[data-day="2025-10-10"]'), '输入后应立即显示 2025 年 10 月');
  assert.ok(cell(p, '2025-10-10').classList.contains('bg-primary'));
  assert.equal(p.updates.length, 0, '键入时只同步面板，不提交绑定值');
  input.dispatchEvent(new window.FocusEvent('blur')); await tick();
  assert.deepEqual(p.updates, ['2025-10-10']);
  assert.equal(p.root.querySelector('[data-state]').dataset.state, 'open');
  assert.ok(p.root.querySelector('[data-day="2025-10-10"]'));
});

it('输入开启面板时保留输入月份，自定义绑定格式与 Escape 取消仍有效', async () => {
  const p = mount({ modelValue: '20260105', valueFormat: 'YYYYMMDD', format: 'YYYY/MM/DD' });
  const input = p.root.querySelector('input');
  await inputDate(input, '2025-10-10');
  assert.ok(p.root.querySelector('[data-day="2025-10-10"]'), '展开监听不能覆盖输入草稿');
  await inputDate(input, '2024-06-12');
  assert.ok(p.root.querySelector('[data-day="2024-06-12"]'), '连续修改也应切换面板');
  assert.equal(p.updates.length, 0);
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick();
  assert.equal(input.value, '2026/01/05');
  p.root.querySelector('[data-state]').click(); await tick();
  assert.ok(p.root.querySelector('[data-day="2026-01-05"]'));
});

it('输入越界或规则禁用的日期，确认后清空原值且不重复提交', async () => {
  for (const value of ['2025-10-10', '2027-01-01', '2026-01-04']) {
    for (const confirm of ['enter', 'blur']) {
      const p = mount({ modelValue: '2026-02-05', valueFormat: 'YYYY-MM-DD', start: '2026-01-01', end: '2026-12-31', disabledMethod: date => date.getDay() === 0 });
      const input = p.root.querySelector('input');
      await inputDate(input, value);
      if (confirm === 'enter') await enter(input);
      else { input.dispatchEvent(new window.FocusEvent('blur')); await tick(); }
      assert.deepEqual(p.updates, [null], `${value} / ${confirm}`);
      assert.equal(input.value, '');
      input.dispatchEvent(new window.FocusEvent('blur')); await tick();
      assert.deepEqual(p.changes, [null], '二次失焦不能重复派发 change');
    }
  }
});

it('范围输入命中禁用日期时清空两端与绑定值', async () => {
  const p = mount({ type: 'daterange', valueFormat: 'YYYY-MM-DD', modelValue: ['2026-02-05', '2026-02-10'], start: '2026-01-01' });
  const inputs = p.root.querySelectorAll('input');
  await inputDate(inputs[0], '2025-10-10');
  await enter(inputs[0]);
  assert.deepEqual(p.updates, [[]]);
  assert.deepEqual([...inputs].map(input => input.value), ['', '']);
});

it('无效日期、非标准格式、越界和禁用日期都不提交', async () => {
  for (const value of ['2026-02-31', '2026-2-03', '2026/02/03', '2025-12-31', '2026-01-04', '2027-01-01']) {
    const p = mount({ start: '2026-01-01', end: '2026-12-31', disabledMethod: date => date.getDay() === 0 });
    await inputDate(p.root.querySelector('input'), value);
    await enter(p.root.querySelector('input'));
    assert.equal(p.updates.length, 0, value);
  }
});

it('范围输入两端完整后提交，结束早于开始时自动排序', async () => {
  const p = mount({ type: 'daterange', valueFormat: 'YYYY-MM-DD' });
  const inputs = p.root.querySelectorAll('input');
  await inputDate(inputs[0], '2026-03-20');
  await inputDate(inputs[1], '2026-03-10');
  await enter(inputs[1]);
  assert.deepEqual(p.updates[0], ['2026-03-10', '2026-03-20']);
});

it('失焦提交与展示格式分离，Esc 取消草稿', async () => {
  const p = mount({ valueFormat: 'YYYYMMDD', format: 'YYYY/MM/DD', modelValue: '20260105' });
  const input = p.root.querySelector('input');
  await inputDate(input, '2026-01-08');
  input.dispatchEvent(new window.FocusEvent('blur')); await tick();
  assert.equal(p.updates[0], '20260108');
  assert.equal(input.value, '2026/01/08');
  await inputDate(input, '2026-01-10');
  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tick();
  assert.equal(p.updates.length, 1);
  assert.equal(input.value, '2026/01/08');
});

it('输入范围从开始栏切到结束栏时保留草稿；单端输入不提交', async () => {
  const p = mount({ type: 'daterange', valueFormat: 'YYYY-MM-DD' });
  const inputs = p.root.querySelectorAll('input');
  await inputDate(inputs[0], '2026-03-10');
  inputs[0].dispatchEvent(new window.FocusEvent('blur', { relatedTarget: inputs[1] })); await tick();
  assert.equal(inputs[0].value, '2026-03-10');
  assert.equal(p.updates.length, 0);
  await enter(inputs[1]);
  assert.equal(p.updates.length, 0);
  assert.equal(inputs[0].value, '');
});

it('输入后改用面板选择，只提交点击的日期', async () => {
  const p = mount({ modelValue: '2026-01-05', valueFormat: 'YYYY-MM-DD' });
  const input = p.root.querySelector('input');
  await inputDate(input, '2026-02-20');
  const choice = cell(p, '2026-02-08');
  choice.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
  input.dispatchEvent(new window.FocusEvent('blur')); await tick();
  assert.equal(p.updates.length, 0);
  choice.click(); await tick();
  assert.deepEqual(p.updates, ['2026-02-08']);
});

it('悬停只回填灰色预览，移出恢复，点击才写回模型', async () => {
  const p = mount({ modelValue: '2026-01-05', valueFormat: 'YYYY-MM-DD' });
  p.root.querySelector('[data-state]').click(); await tick();
  cell(p, '2026-01-08').dispatchEvent(new window.MouseEvent('mouseenter')); await tick();
  const input = p.root.querySelector('input');
  assert.equal(input.value, '2026-01-08');
  assert.ok(input.classList.contains('text-gray-5'));
  assert.equal(p.updates.length, 0);
  cell(p, '2026-01-08').parentElement.parentElement.dispatchEvent(new window.MouseEvent('mouseleave')); await tick();
  assert.equal(input.value, '2026-01-05');
  cell(p, '2026-01-08').click(); await tick();
  assert.equal(p.updates[0], '2026-01-08');
  assert.ok(p.root.querySelector('input').classList.contains('text-gray-9'));
});

it('范围悬停保留起点草稿，未完成区间不提交', async () => {
  const p = mount({ type: 'daterange', singlePanel: true, defaultValue: '2026-01-01', valueFormat: 'YYYY-MM-DD' });
  p.root.querySelector('[data-state]').click(); await tick();
  cell(p, '2026-01-05').click(); await tick();
  cell(p, '2026-01-08').dispatchEvent(new window.MouseEvent('mouseenter')); await tick();
  assert.deepEqual([...p.root.querySelectorAll('input')].map(el => el.value), ['2026-01-05', '2026-01-08']);
  assert.equal(p.updates.length, 0);
  cell(p, '2026-01-08').click(); await tick();
  assert.deepEqual(p.updates[0], ['2026-01-05', '2026-01-08']);
});

it('禁用日期不预览；翻页清除上个月预览，禁用组件不可输入', async () => {
  const p = mount({ modelValue: '2026-01-05', valueFormat: 'YYYY-MM-DD', disabledMethod: date => date.getDate() === 8 });
  p.root.querySelector('[data-state]').click(); await tick();
  cell(p, '2026-01-08').dispatchEvent(new window.MouseEvent('mouseenter')); await tick();
  assert.equal(p.root.querySelector('input').value, '2026-01-05');
  cell(p, '2026-01-09').dispatchEvent(new window.MouseEvent('mouseenter')); await tick();
  p.root.querySelector('[data-icon="lucide:chevron-right"]').parentElement.click(); await tick();
  assert.equal(p.root.querySelector('input').value, '2026-01-05');
  p.props.value = { ...p.props.value, disabled: true }; await tick();
  assert.equal(p.root.querySelector('input').disabled, true);
  await inputDate(p.root.querySelector('input'), '2026-02-20');
  await enter(p.root.querySelector('input'));
  assert.equal(p.updates.length, 0);
});

it('月、年与日期时间也可预览；今日高亮不覆盖今天的选中态', async () => {
  for (const [type, target, expected] of [['month', '2026-03-01', '2026-03'], ['year', '2027-01-01', '2027'], ['datetime', '2026-01-08', '2026-01-08 13:14:15']]) {
    const p = mount({ type, modelValue: type === 'datetime' ? '2026-01-05 13:14:15' : '2026-01-05', valueFormat: type === 'datetime' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD' });
    p.root.querySelector('[data-state]').click(); await tick();
    cell(p, target).dispatchEvent(new window.MouseEvent('mouseenter')); await tick();
    assert.equal(p.root.querySelector('[data-state] input.text-gray-5').value, expected, type);
    assert.equal(p.updates.length, 0);
  }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const p = mount({ modelValue: today, valueFormat: 'YYYY-MM-DD', highlightToday: true });
  p.root.querySelector('[data-state]').click(); await tick();
  assert.ok(cell(p, today).classList.contains('bg-primary'));
  assert.equal(cell(p, today).classList.contains('text-primary'), false);
});

it('全部16种类型支持标准格式输入，确认前不提交', async () => {
  const cases = [
    ['year', ['2025'], 'YYYY', '2025'],
    ['month', ['2025-10'], 'YYYY-MM', '2025-10'],
    ['quarter', ['2025-Q4'], 'YYYY-[Q]Q', '2025-Q4'],
    ['date', ['2025-10-10'], 'YYYY-MM-DD', '2025-10-10'],
    ['datetime', ['2025-10-10 13:14:15'], 'YYYY-MM-DD HH:mm:ss', '2025-10-10 13:14:15'],
    ['week', ['2025-10-10'], 'YYYY-MM-DD', ['2025-10-05', '2025-10-11']],
    ['years', ['2025,2026,2025'], 'YYYY', ['2025', '2026']],
    ['months', ['2025-10，2025-11'], 'YYYY-MM', ['2025-10', '2025-11']],
    ['quarters', ['2025-Q4;2026-Q1'], 'YYYY-[Q]Q', ['2025-Q4', '2026-Q1']],
    ['dates', ['2025-10-10,2025-10-11'], 'YYYY-MM-DD', ['2025-10-10', '2025-10-11']],
    ['yearrange', ['2026', '2025'], 'YYYY', ['2025', '2026']],
    ['monthrange', ['2025-11', '2025-10'], 'YYYY-MM', ['2025-10', '2025-11']],
    ['quarterrange', ['2026-Q1', '2025-Q4'], 'YYYY-[Q]Q', ['2025-Q4', '2026-Q1']],
    ['daterange', ['2025-10-11', '2025-10-10'], 'YYYY-MM-DD', ['2025-10-10', '2025-10-11']],
    ['datetimerange', ['2025-10-10 13:14:15', '2025-10-10 12:00:00'], 'YYYY-MM-DD HH:mm:ss', ['2025-10-10 12:00:00', '2025-10-10 13:14:15']],
    ['weekrange', ['2026-01-02', '2025-12-24'], 'YYYY-MM-DD', ['2025-12-21', '2026-01-03']],
  ];
  for (const [type, texts, valueFormat, expected] of cases) {
    const p = mount({ type, valueFormat });
    const inputs = p.root.querySelectorAll('input');
    assert.equal(inputs.length, texts.length, type);
    for (const [index, text] of texts.entries()) await inputDate(inputs[index], text);
    assert.equal(p.updates.length, 0, type);
    await enter(inputs[texts.length - 1]);
    assert.deepEqual(p.updates, [expected], type);
    assert.equal(p.changes.length, 1, type);
  }
});

it('多选保留原值并去重，输入后点击面板候选不会反向取消', async () => {
  const p = mount({ type: 'dates', valueFormat: 'YYYY-MM-DD', modelValue: ['2026-01-05'] });
  const input = p.root.querySelector('input');
  await inputDate(input, '2026-02-08');
  assert.ok(p.root.querySelector('[data-day="2026-02-08"]'), '多选输入即时定位月份');
  const choice = cell(p, '2026-02-08');
  choice.dispatchEvent(new window.MouseEvent('mousedown', { bubbles: true }));
  input.dispatchEvent(new window.FocusEvent('blur')); await tick();
  assert.equal(p.updates.length, 0);
  choice.click(); await tick();
  assert.deepEqual(p.updates[0], ['2026-01-05', '2026-02-08']);
  await inputDate(input, '2026-02-08,2026-02-09');
  input.dispatchEvent(new window.FocusEvent('blur')); await tick();
  assert.deepEqual(p.updates[1], ['2026-01-05', '2026-02-08', '2026-02-09']);
  assert.equal(input.value, '');
});

it('所有粒度严格校验，单位与边界有交集时可输入，禁用多选不删除已有值', async () => {
  for (const [type, text] of [['year', '26'], ['month', '2026-13'], ['quarter', '2026-Q5'], ['datetime', '2026-02-30 12:00:00'], ['datetime', '2026-02-01 24:00:00']]) {
    const p = mount({ type });
    await inputDate(p.root.querySelector('input'), text);
    await enter(p.root.querySelector('input'));
    assert.equal(p.updates.length, 0, type);
  }
  for (const [type, text, unit] of [['year', '2026', 'year'], ['month', '2026-02', 'month'], ['quarter', '2026-Q1', 'quarter']]) {
    const units = [];
    const p = mount({ type, start: '2026-02-15', end: '2026-02-20', disabledMethod: (date, unit) => { units.push(unit); return false; } });
    await inputDate(p.root.querySelector('input'), text);
    await enter(p.root.querySelector('input'));
    assert.equal(p.updates.length, 1, type);
    assert.ok(units.includes(unit), type);
  }
  const p = mount({ type: 'months', valueFormat: 'YYYY-MM', modelValue: ['2026-01'], disabledMethod: (date, unit) => unit === 'month' && date.getMonth() === 1 });
  await inputDate(p.root.querySelector('input'), '2026-02');
  await enter(p.root.querySelector('input'));
  assert.equal(p.updates.length, 0);
  assert.equal(p.root.querySelector('input').value, '');
});

it('日期时间手动输入遵循时分秒与毫秒禁用规则，范围按排序后的角色校验', async () => {
  for (const rule of [
    { disabledHours: () => [13] },
    { disabledMinutes: hour => hour === 13 ? [14] : [] },
    { disabledSeconds: (hour, minute) => hour === 13 && minute === 14 ? [15] : [] },
    { disabledMilliseconds: () => [0] },
  ]) {
    const p = mount({ type: 'datetime', valueFormat: 'YYYY-MM-DD HH:mm:ss', modelValue: '2026-01-05 12:00:00', ...rule });
    await inputDate(p.root.querySelector('input'), '2026-01-05 13:14:15');
    await enter(p.root.querySelector('input'));
    assert.deepEqual(p.updates, [null]);
  }
  const calls = [];
  const p = mount({ type: 'datetimerange', valueFormat: 'YYYY-MM-DD HH:mm:ss', disabledHours: (role, comparing) => { calls.push([role, comparing]); return role === 'start' ? [13] : []; } });
  const inputs = p.root.querySelectorAll('input');
  await inputDate(inputs[0], '2026-01-05 13:00:00');
  await inputDate(inputs[1], '2026-01-05 12:00:00');
  await enter(inputs[1]);
  assert.deepEqual(p.updates[0], ['2026-01-05 12:00:00', '2026-01-05 13:00:00']);
  assert.ok(calls.some(([role, comparing]) => role === 'start' && comparing === '13:00:00'));
  assert.ok(calls.some(([role, comparing]) => role === 'end' && comparing === '12:00:00'));
});

it('今日默认不高亮，开启 highlightToday 后高亮；浮层无边框并使用指定阴影', async () => {
  const p = mount();
  p.root.querySelector('[data-state]').click(); await tick();
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.equal(cell(p, key).classList.contains('text-primary'), false);
  p.props.value = { highlightToday: true }; await tick();
  assert.ok(cell(p, key).classList.contains('text-primary'));
  const overlay = p.root.querySelector('[data-overlay]');
  assert.ok(overlay.classList.contains('border-0'));
  assert.ok(overlay.classList.contains('shadow-[0_2px_13px_0_rgba(0,0,0,0.13)]'));
});

it('左右快捷侧栏均在点击时取值并提交一次，按钮不触发表单提交', async () => {
  for (const shortcutPosition of [undefined, 'left', 'right']) {
    let calls = 0;
    const p = mount({
      type: 'daterange', valueFormat: 'YYYY-MM-DD', shortcutPosition,
      shortcuts: [{ text: '最近测试区间', value: () => { calls++; return [new Date(2026, 0, 5), new Date(2026, 0, 10)]; } }],
    });
    p.root.querySelector('[data-state]').click(); await tick();
    assert.equal(calls, 0, '快捷值在点击前不计算');
    const button = [...p.root.querySelectorAll('button')].find(el => el.textContent === '最近测试区间');
    assert.ok(button, '快捷选项使用可聚焦的原生按钮');
    assert.equal(button.type, 'button');
    button.click(); await tick();
    assert.equal(calls, 1);
    assert.deepEqual(p.updates, [['2026-01-05', '2026-01-10']]);
    assert.equal(p.changes.length, 1);
    assert.equal(p.root.querySelector('[data-state]').dataset.state, 'closed');
  }
});
