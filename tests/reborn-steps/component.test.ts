/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import type { VNode, VNodeChild } from 'vue';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { after, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

/** 先安装 DOM，再加载 Vue，确保挂载、重排和水合均执行真实运行时。 */
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
const previous = new Map<string, PropertyDescriptor | undefined>();
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'MutationObserver', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  const value = key.endsWith('AnimationFrame') ? dom.window[key].bind(dom.window) : dom.window[key];
  Object.defineProperty(globalThis, key, { value, configurable: true });
}
const { Comment, createApp, createSSRApp, defineAsyncComponent, Fragment, h, markRaw, nextTick, reactive } = await import('vue');
const { renderToString } = await import('@vue/server-renderer');
const folder = await mkdtemp(resolve('tests/reborn-steps/.runtime-'));
const output = resolve(folder, 'components.mjs');
const runFile = promisify(execFile);
after(async () => {
  await rm(folder, { recursive: true, force: true });
  dom.window.close();
  for (const [key, descriptor] of previous) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

/** 仅替换联网图标解析；步骤的上下文、状态和 DOM 都使用真实源码。 */
async function compileComponents(outfile: string, isProd = false) {
  await build({
    stdin: {
      contents: `export {default as Steps} from '~/components/reborn/ui/reborn-steps/RebornSteps.vue';export {default as Step} from '~/components/reborn/ui/reborn-steps/RebornStep.vue';`,
      resolveDir: resolve('.'), loader: 'ts',
    },
    outfile, bundle: true, format: 'esm', platform: 'node', packages: 'external', alias: { '~': resolve('app') },
    plugins: [{ name: 'steps-test', setup(builder) {
      builder.onResolve({ filter: /^#components$/ }, () => ({ path: 'icons', namespace: 'steps-test' }));
      builder.onLoad({ filter: /.*/, namespace: 'steps-test' }, () => ({ contents: `import {h} from 'vue';export const Icon=(props)=>h('svg',{'data-icon':props.name});`, loader: 'js', resolveDir: resolve('.') }));
      builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
        const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
        return { contents: compileScript(descriptor, {
          id: path, isProd, inlineTemplate: true, fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
        }).content, loader: 'ts' };
      });
    } }],
  });
}
await compileComponents(output);
const { Steps, Step } = await import(pathToFileURL(output).href);
const partUi = { marker: 'fixture-marker', title: 'fixture-title', description: 'fixture-description', connector: 'fixture-connector', line: 'fixture-line', icon: 'fixture-icon' };

interface SlotScope { index: number; status: string; current: boolean; progress: number | undefined; completed?: boolean; direction?: string; lineType?: string }
interface Member { key: string; title: string; description?: string; status?: string; color?: string; placement?: 'top' | 'bottom' | 'left' | 'right'; progress?: number; icon?: unknown; slots?: Record<string, (scope: SlotScope) => VNodeChild> }

/** 每次渲染重新取成员，验证有 key 的移动不会依赖重新挂载。 */
async function mount(initial: Record<string, unknown> = {}, original: Member[] = [{ key: 'a', title: '甲' }, { key: 'b', title: '乙' }, { key: 'c', title: '丙' }], decorate?: (children: VNode[]) => VNodeChild[]) {
  const root = document.createElement('div');
  document.body.append(root);
  const props = reactive(initial);
  const members = reactive(original);
  const warnings: string[] = [];
  const app = createApp({ render() {
    const children = members.map(({ slots, ...item }) => h(Step, { ui: partUi, ...item }, slots));
    return h(Steps, props, { default: () => decorate ? decorate(children) : children });
  } });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(root);
  await nextTick();
  return { root, props, members, warnings, stop: () => { app.unmount(); root.remove(); } };
}

function snapshot(root: ParentNode) {
  return Array.from(root.querySelectorAll('li[data-step-index]')).map(element => ({
    index: Number(element.getAttribute('data-step-index')),
    status: element.getAttribute('data-status'),
    current: element.getAttribute('aria-current'),
    title: element.querySelector('.fixture-title')?.textContent,
  }));
}

/** 通过进度条语义读取用户可见的当前步骤进度，避免依赖圆环的绘制方式。 */
function progressSnapshot(root: ParentNode) {
  return Array.from(root.querySelectorAll('[role="progressbar"]')).map(element => ({
    index: Number(element.closest('li[data-step-index]')?.getAttribute('data-step-index')),
    value: Number(element.getAttribute('aria-valuenow') ?? Number.NaN),
    min: Number(element.getAttribute('aria-valuemin') ?? Number.NaN),
    max: Number(element.getAttribute('aria-valuemax') ?? Number.NaN),
    label: element.getAttribute('aria-label'),
  }));
}

it('文本类型不渲染标记、图标和圆环，当前文字随索引更新并兼容外观切换', async () => {
  let iconCalls = 0;
  const members = ['甲', '乙', '丙'].map(title => ({
    key: title, title, description: '详细描述描述', progress: 50,
    slots: { icon: () => { iconCalls++; return h('span', '图标'); } },
  }));
  const view = await mount({ type: 'text', active: 1, color: 'secondary' }, members);
  const currentTitles = () => Array.from(view.root.querySelectorAll('.fixture-title'))
    .filter(element => element.classList.contains('text-(--step-color)'))
    .map(element => element.textContent);
  try {
    assert.equal(view.root.querySelectorAll('.fixture-marker').length, 0);
    assert.equal(view.root.querySelectorAll('[role="progressbar"]').length, 0);
    assert.equal(iconCalls, 0, '文本类型不调用图标插槽');
    assert.deepEqual(currentTitles(), ['乙']);
    assert.equal(view.root.querySelectorAll('.fixture-description').length, 3, '文本类型保留所有描述');
    assert.ok(view.root.querySelector('[aria-current="step"] .fixture-description')?.classList.contains('text-(--step-color)'));

    view.props.active = 2;
    await nextTick();
    assert.deepEqual(currentTitles(), ['丙']);
    assert.equal(snapshot(view.root)[2]!.current, 'step');

    view.props.type = 'default';
    await nextTick();
    assert.equal(view.root.querySelectorAll('.fixture-marker').length, 3);
    assert.equal(view.root.querySelectorAll('[role="progressbar"]').length, 1);
    assert.ok(iconCalls > 0, '恢复默认外观后继续渲染图标插槽');
    assert.deepEqual(currentTitles(), [], '默认类型不受文本着色规则影响');

    view.props.type = 'dot';
    await nextTick();
    assert.equal(view.root.querySelectorAll('.fixture-marker').length, 3);
    assert.deepEqual(currentTitles(), [], '点状类型不受文本着色规则影响');

    view.props.type = 'text';
    view.props.processStatus = 'error';
    view.members[0]!.status = 'process';
    await nextTick();
    assert.equal(view.root.querySelectorAll('.fixture-marker').length, 0);
    assert.equal(snapshot(view.root)[2]!.status, 'error');
    assert.deepEqual(currentTitles(), ['丙'], '当前文字按实际索引着色，不依赖 process 状态');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('默认从第一个步骤开始，活动项有语义标记，点击不修改活动索引', async () => {
  const updates: number[] = [];
  const view = await mount({ 'onUpdate:active': (value: number) => updates.push(value) });
  try {
    assert.deepEqual(snapshot(view.root), [
      { index: 0, status: 'process', current: 'step', title: '甲' },
      { index: 1, status: 'wait', current: null, title: '乙' },
      { index: 2, status: 'wait', current: null, title: '丙' },
    ]);
    view.root.querySelectorAll('li')[2]!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await nextTick();
    assert.deepEqual(updates, []);
    assert.equal(snapshot(view.root)[0]!.current, 'step');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('文案方位由子步骤覆盖父级，动态修改和移除后恢复继承，步骤顺序保持不变', async () => {
  const view = await mount({}, [{ key: 'a', title: '甲' }, { key: 'b', title: '乙', placement: 'left' }, { key: 'c', title: '丙' }]);
  const placements = () => Array.from(view.root.querySelectorAll('li[data-step-index]'), item => item.getAttribute('data-placement'));
  try {
    assert.deepEqual(placements(), ['right', 'left', 'right'], '默认文案位于节点右侧');
    view.props.placement = 'top';
    await nextTick();
    assert.deepEqual(placements(), ['top', 'left', 'top'], '显式子步骤方位优先于父级');
    view.members[1]!.placement = 'bottom';
    await nextTick();
    assert.deepEqual(placements(), ['top', 'bottom', 'top']);
    delete view.members[1]!.placement;
    view.props.direction = 'vertical';
    await nextTick();
    assert.deepEqual(placements(), ['top', 'top', 'top'], '切换步骤流向不改变文案方位');
    view.props.placement = 'right';
    await nextTick();
    assert.deepEqual(placements(), ['right', 'right', 'right']);
    assert.deepEqual(snapshot(view.root).map(item => item.title), ['甲', '乙', '丙'], '方位只影响布局，不改变步骤顺序');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('旧横向 alignCenter 映射下方文案，显式 placement 优先且垂直方向保持右侧默认值', async () => {
  const view = await mount({ alignCenter: true });
  const placements = () => Array.from(view.root.querySelectorAll('li[data-step-index]'), item => item.getAttribute('data-placement'));
  try {
    assert.deepEqual(placements(), ['bottom', 'bottom', 'bottom']);
    view.props.placement = 'left';
    await nextTick();
    assert.deepEqual(placements(), ['left', 'left', 'left']);
    delete view.props.placement;
    view.props.direction = 'vertical';
    await nextTick();
    assert.deepEqual(placements(), ['right', 'right', 'right']);
    view.props.placement = 'bottom';
    await nextTick();
    assert.deepEqual(placements(), ['bottom', 'bottom', 'bottom']);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('状态由活动索引和父级状态派生，子步骤显式状态优先', async () => {
  const view = await mount({ active: 1 }, [{ key: 'a', title: '甲' }, { key: 'b', title: '乙' }, { key: 'c', title: '丙', status: 'error' }]);
  try {
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'process', 'error']);
    Object.assign(view.props, { finishStatus: 'success', processStatus: 'error' });
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['success', 'error', 'error']);
    view.members[2]!.status = '';
    view.props.active = 2;
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['success', 'success', 'error']);
    view.props.active = 3;
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['success', 'success', 'success']);
    assert.ok(snapshot(view.root).every(item => item.current === null));
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('change 只在 active 变化时通知前后索引，首次渲染和成员变化不触发', async () => {
  const changes: number[][] = [];
  const view = await mount({ active: 0, onChange: (next: number, previous: number) => changes.push([next, previous]) });
  try {
    assert.deepEqual(changes, []);
    view.props.active = 1;
    await nextTick();
    view.props.active = 1;
    view.members.push({ key: 'd', title: '丁' });
    await nextTick();
    view.props.active = 0;
    await nextTick();
    assert.deepEqual(changes, [[1, 0], [0, 1]]);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('当前步骤进度按需显示，0 和 100 均保留当前状态，异常值限制在百分比范围内', async () => {
  const view = await mount({ active: 1 });
  try {
    assert.deepEqual(progressSnapshot(view.root), [], '未传进度时保留普通步骤标记');
    for (const [input, expected] of [[0, 0], [37.5, 37.5], [100, 100], [-20, 0], [150, 100], [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0]]) {
      view.members[1]!.progress = input;
      await nextTick();
      assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: expected, min: 0, max: 100, label: '乙进度' }]);
      assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'process', 'wait']);
    }
    delete view.members[1]!.progress;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), []);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('各步骤独立保存进度，切换活动索引和带 key 重排后进度仍属于对应步骤', async () => {
  const view = await mount({ active: 0 }, [
    { key: 'a', title: '甲', progress: 15 }, { key: 'b', title: '乙', progress: 65 }, { key: 'c', title: '丙', progress: 90 },
  ]);
  try {
    assert.deepEqual(progressSnapshot(view.root), [{ index: 0, value: 15, min: 0, max: 100, label: '甲进度' }]);
    view.props.active = 1;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 65, min: 0, max: 100, label: '乙进度' }]);
    view.members[2]!.progress = 35;
    await nextTick();
    assert.equal(progressSnapshot(view.root)[0]?.value, 65, '非当前步骤更新进度不影响当前圆环');
    const originalB = view.root.querySelectorAll('li')[1];
    view.members.splice(0, 2, view.members[1]!, view.members[0]!);
    view.props.active = 0;
    await nextTick();
    assert.equal(view.root.querySelectorAll('li')[0], originalB, '重排保留有 key 的步骤节点');
    assert.deepEqual(progressSnapshot(view.root), [{ index: 0, value: 65, min: 0, max: 100, label: '乙进度' }]);
    view.props.active = 1;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 15, min: 0, max: 100, label: '甲进度' }]);
    view.props.active = 2;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 2, value: 35, min: 0, max: 100, label: '丙进度' }]);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('父级旧 progress 参数不控制圆环，只有 RebornStep 的进度参数生效', async () => {
  const view = await mount({ active: 1, progress: 99 });
  try {
    assert.deepEqual(progressSnapshot(view.root), []);
    view.members[1]!.progress = 25;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 25, min: 0, max: 100, label: '乙进度' }]);
    view.props.progress = 10;
    await nextTick();
    assert.equal(progressSnapshot(view.root)[0]?.value, 25);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('步骤显式 progress 优先于整体折算，移除后恢复折算值且只影响该步骤', async () => {
  const view = await mount({ overallProgress: 50 }, [
    { key: 'a', title: '甲', progress: 10 }, { key: 'b', title: '乙', progress: 80 }, { key: 'c', title: '丙', progress: 95 },
  ]);
  try {
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 80, min: 0, max: 100, label: '乙进度' }]);
    view.members[1]!.progress = 0;
    await nextTick();
    assert.equal(progressSnapshot(view.root)[0]?.value, 0, '显式 0 也覆盖整体折算值');
    delete view.members[1]!.progress;
    await nextTick();
    assert.equal(progressSnapshot(view.root)[0]?.value, 50);
    view.props.overallProgress = 75;
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 2, value: 95, min: 0, max: 100, label: '丙进度' }]);
    delete view.members[2]!.progress;
    await nextTick();
    assert.equal(progressSnapshot(view.root)[0]?.value, 25);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('整体进度折算步骤且不回写 active 或触发 change，移除后恢复当前步骤的独立进度', async () => {
  const changes: number[][] = [];
  const updates: number[] = [];
  const view = await mount({ active: 2, overallProgress: 50,
    onChange: (next: number, previous: number) => changes.push([next, previous]),
    'onUpdate:active': (value: number) => updates.push(value) }, [
    { key: 'a', title: '甲' }, { key: 'b', title: '乙' }, { key: 'c', title: '丙', progress: 90 },
  ]);
  try {
    assert.deepEqual(snapshot(view.root).map(item => [item.status, item.current]), [['finish', null], ['process', 'step'], ['wait', null]]);
    assert.equal(progressSnapshot(view.root)[0]?.value, 50);
    view.props.overallProgress = 25;
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['process', 'wait', 'wait']);
    assert.equal(progressSnapshot(view.root)[0]?.value, 75);
    assert.equal(view.props.active, 2);
    assert.deepEqual(changes, []);
    assert.deepEqual(updates, []);
    delete view.props.overallProgress;
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'finish', 'process']);
    assert.deepEqual(progressSnapshot(view.root), [{ index: 2, value: 90, min: 0, max: 100, label: '丙进度' }]);
    assert.deepEqual(changes, []);
    assert.deepEqual(updates, []);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('整体进度的 0、100 和异常值正确显示起点或全部完成状态', async () => {
  const view = await mount({ active: 2, overallProgress: 0 });
  try {
    for (const input of [0, -20, Number.NaN, Number.POSITIVE_INFINITY]) {
      view.props.overallProgress = input;
      await nextTick();
      assert.deepEqual(snapshot(view.root).map(item => [item.status, item.current]), [['process', 'step'], ['wait', null], ['wait', null]]);
      assert.deepEqual(progressSnapshot(view.root), [{ index: 0, value: 0, min: 0, max: 100, label: '甲进度' }]);
    }
    for (const input of [100, 150]) {
      view.props.overallProgress = input;
      await nextTick();
      assert.deepEqual(snapshot(view.root).map(item => [item.status, item.current]), [['finish', null], ['finish', null], ['finish', null]]);
      assert.deepEqual(progressSnapshot(view.root), []);
    }
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('整体进度按三分之一步反复前后移动时吸附浮点边界，正常临界百分比仍保留原步骤', async () => {
  const view = await mount({ overallProgress: 100 });
  try {
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const index of [2, 1, 0]) {
        view.props.overallProgress = Math.max(0, Number(view.props.overallProgress) - 100 / 3);
        await nextTick();
        assert.deepEqual(progressSnapshot(view.root), [{ index, value: 0, min: 0, max: 100, label: `${['甲', '乙', '丙'][index]}进度` }]);
        assert.equal(snapshot(view.root)[index]?.current, 'step');
      }
      for (const index of [1, 2, 3]) {
        view.props.overallProgress = Math.min(100, Number(view.props.overallProgress) + 100 / 3);
        await nextTick();
        if (index < 3) assert.equal(progressSnapshot(view.root)[0]?.index, index);
        else assert.deepEqual(progressSnapshot(view.root), []);
      }
    }
    view.props.overallProgress = 66.6666666;
    await nextTick();
    const nearBoundary = progressSnapshot(view.root)[0]!;
    assert.equal(nearBoundary.index, 1, '明确小于边界的正常百分比不提前进入下一步');
    assert.ok(nearBoundary.value > 99.999 && nearBoundary.value < 100);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('整体进度随动态步骤数量重新折算，重排复用节点并把进度交给新的当前项', async () => {
  const changes: number[][] = [];
  const view = await mount({ overallProgress: 50, onChange: (next: number, previous: number) => changes.push([next, previous]) });
  try {
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 50, min: 0, max: 100, label: '乙进度' }]);
    view.members.push({ key: 'd', title: '丁' });
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'finish', 'process', 'wait']);
    assert.deepEqual(progressSnapshot(view.root), [{ index: 2, value: 0, min: 0, max: 100, label: '丙进度' }]);
    const originalC = view.root.querySelectorAll('li')[2];
    view.members.splice(1, 2, view.members[2]!, view.members[1]!);
    await nextTick();
    assert.equal(view.root.querySelectorAll('li')[1], originalC);
    assert.deepEqual(progressSnapshot(view.root), [{ index: 2, value: 0, min: 0, max: 100, label: '乙进度' }]);
    view.members.splice(0, 2);
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'process']);
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 0, min: 0, max: 100, label: '丁进度' }]);
    view.members.splice(0);
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), []);
    view.members.push({ key: 'e', title: '' });
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 0, value: 50, min: 0, max: 100, label: '步骤 1进度' }]);
    assert.deepEqual(changes, []);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('进度圆环尊重当前状态覆盖，保留自定义图标并支持点状模式', async () => {
  const view = await mount({ active: 1 }, [{ key: 'a', title: '甲' }, { key: 'b', title: '乙', progress: 42, slots: { icon: () => h('span', { 'data-slot-icon': true }, '猫') } }]);
  try {
    assert.equal(progressSnapshot(view.root)[0]?.value, 42);
    assert.ok(view.root.querySelector('[data-slot-icon]'));
    view.members[1]!.status = 'error';
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), []);
    assert.equal(snapshot(view.root)[1]?.status, 'error');
    view.members[1]!.status = '';
    view.props.processStatus = 'success';
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), []);
    view.props.processStatus = 'process';
    view.props.type = 'dot';
    await nextTick();
    assert.deepEqual(progressSnapshot(view.root), [{ index: 1, value: 42, min: 0, max: 100, label: '乙进度' }]);
    assert.equal(view.root.querySelector('[data-slot-icon]'), null, '点状模式仍不显示图标内容');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('Fragment、注释和空白不占步骤索引，最后一项不生成连线', async () => {
  const view = await mount({ active: 1 }, undefined, children => [h(Comment), '  ', h(Fragment, null, [children[0], h(Comment), h(Fragment, null, children.slice(1))])]);
  try {
    assert.deepEqual(snapshot(view.root).map(item => item.index), [0, 1, 2]);
    assert.deepEqual(snapshot(view.root).map(item => item.status), ['finish', 'process', 'wait']);
    const items = view.root.querySelectorAll('li[data-step-index]');
    assert.ok(items[0]!.querySelector('.fixture-connector'));
    assert.ok(items[1]!.querySelector('.fixture-connector'));
    assert.equal(items[2]!.querySelector('.fixture-connector'), null);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('箭头由 lineType 控制，可以和圆形或点状步骤组合', async () => {
  const view = await mount({ lineType: 'arrow' });
  try {
    assert.equal(view.root.querySelectorAll('.fixture-connector [data-icon="lucide:chevron-right"]').length, 2);
    view.props.type = 'dot';
    await nextTick();
    assert.equal(view.root.querySelectorAll('.fixture-connector [data-icon="lucide:chevron-right"]').length, 2);
    assert.ok(Array.from(view.root.querySelectorAll('.fixture-marker')).every(element => element.textContent === '' && element.childElementCount === 0));
    view.props.lineType = 'dashed';
    await nextTick();
    assert.equal(view.root.querySelector('.fixture-connector [data-icon="lucide:chevron-right"]'), null);
    assert.equal(view.root.querySelectorAll('.fixture-connector').length, 2);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('带 key 的步骤重排、增删和条件分支保持索引、状态与末项连线同步', async () => {
  const view = await mount({ active: 1 });
  try {
    const originalB = view.root.querySelectorAll('li')[1];
    view.members.splice(0, 2, view.members[1]!, view.members[0]!);
    await nextTick();
    assert.equal(view.root.querySelectorAll('li')[0], originalB, '重排复用原节点，不能依赖重新挂载登记索引');
    assert.deepEqual(snapshot(view.root).map(item => [item.title, item.index, item.status]), [['乙', 0, 'finish'], ['甲', 1, 'process'], ['丙', 2, 'wait']]);
    view.members.unshift({ key: 'd', title: '丁' });
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => item.title), ['丁', '乙', '甲', '丙']);
    view.members.splice(1, 1);
    view.members.pop();
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => [item.title, item.index, item.status]), [['丁', 0, 'finish'], ['甲', 1, 'process']]);
    assert.equal(view.root.querySelectorAll('.fixture-connector').length, 1);
    view.members.splice(0);
    await nextTick();
    assert.deepEqual(snapshot(view.root), []);
    view.members.push({ key: 'e', title: '戊' });
    await nextTick();
    assert.deepEqual(snapshot(view.root).map(item => [item.index, item.status]), [[0, 'finish']]);
    assert.equal(view.root.querySelector('.fixture-connector'), null);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('标题、描述和图标插槽覆盖对应内容，支持图标名与组件', async () => {
  const customIcon = markRaw({ render: () => h('svg', { 'data-custom-icon': true }) });
  const view = await mount({}, [{ key: 'a', title: '原标题', description: '原描述', icon: 'lucide:cat' }]);
  try {
    assert.equal(view.root.querySelector('svg')?.getAttribute('data-icon'), 'lucide:cat');
    view.members[0]!.icon = customIcon;
    await nextTick();
    assert.ok(view.root.querySelector('[data-custom-icon]'));
    view.members[0]!.slots = {
      title: () => h('strong', '插槽标题'),
      description: () => h('em', '插槽描述'),
      icon: () => h('span', { 'data-slot-icon': true }, '猫'),
    };
    await nextTick();
    assert.equal(view.root.querySelector('.fixture-title')?.textContent, '插槽标题');
    assert.equal(view.root.querySelector('.fixture-description')?.textContent, '插槽描述');
    assert.ok(view.root.querySelector('[data-slot-icon]'));
    assert.equal(view.root.querySelector('[data-custom-icon]'), null);
    view.props.simple = true;
    await nextTick();
    assert.equal(view.root.querySelector('.fixture-description'), null);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('四个插槽取得响应式步骤状态，连接器额外取得完成状态、方向和线型', async () => {
  const slotNames = ['icon', 'title', 'description', 'connector'];
  const slots = Object.fromEntries(slotNames.map(name => [name, (scope: SlotScope) => h('span', { 'data-scope': name }, JSON.stringify(scope))]));
  const view = await mount({ active: 0 }, [
    { key: 'a', title: '甲', progress: 20, slots }, { key: 'b', title: '乙', progress: 70, slots }, { key: 'c', title: '丙', slots },
  ]);
  const scopeOf = (index: number, name: string) => {
    const scope = JSON.parse(view.root.querySelectorAll('li')[index]!.querySelector(`[data-scope="${name}"]`)!.textContent!);
    // 条件插槽由 Vue 编译器附带 key，仅比较组件承诺的业务参数。
    delete scope.key;
    return scope;
  };
  try {
    for (const name of slotNames.slice(0, 3)) {
      assert.deepEqual(scopeOf(0, name), { index: 0, status: 'process', current: true, progress: 20 });
      assert.deepEqual(scopeOf(1, name), { index: 1, status: 'wait', current: false });
    }
    assert.deepEqual(scopeOf(0, 'connector'), { index: 0, status: 'process', current: true, progress: 20, completed: false, direction: 'horizontal', lineType: 'solid' });
    Object.assign(view.props, { active: 1, direction: 'vertical', lineType: 'arrow' });
    view.members[1]!.progress = 45;
    await nextTick();
    assert.deepEqual(scopeOf(0, 'connector'), { index: 0, status: 'finish', current: false, completed: true, direction: 'vertical', lineType: 'arrow' });
    for (const name of slotNames.slice(0, 3)) assert.deepEqual(scopeOf(1, name), { index: 1, status: 'process', current: true, progress: 45 });
    assert.deepEqual(scopeOf(1, 'connector'), { index: 1, status: 'process', current: true, progress: 45, completed: false, direction: 'vertical', lineType: 'arrow' });
    delete view.members[1]!.progress;
    Object.assign(view.props, { overallProgress: 50, lineType: 'dashed' });
    await nextTick();
    assert.deepEqual(scopeOf(1, 'connector'), { index: 1, status: 'process', current: true, progress: 50, completed: false, direction: 'vertical', lineType: 'dashed' });
    view.members[1]!.status = 'error';
    await nextTick();
    assert.equal(scopeOf(1, 'title').status, 'error');
    assert.equal(scopeOf(1, 'connector').completed, false);
    assert.equal(view.root.querySelectorAll('li')[2]!.querySelector('[data-scope="connector"]'), null, '末项不调用连接器插槽');
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('动态添加连接器插槽仅替换连线内容，移除各插槽后恢复默认内容和线型', async () => {
  const view = await mount({}, [
    { key: 'a', title: '默认标题', description: '默认描述', icon: 'lucide:cat' }, { key: 'b', title: '末项' },
  ]);
  try {
    const first = view.root.querySelector('li')!;
    const connector = first.querySelector('.fixture-connector');
    assert.equal(connector?.querySelectorAll('.fixture-line').length, 2);
    view.members[0]!.slots = {
      icon: () => h('b', { 'data-custom': 'icon' }, '自定义节点'),
      title: () => h('b', { 'data-custom': 'title' }, '自定义标题'),
      description: () => h('b', { 'data-custom': 'description' }, '自定义描述'),
      connector: () => h('i', { 'data-custom': 'connector' }, '自定义连线'),
    };
    view.members[1]!.slots = { connector: () => h('i', { 'data-custom': 'last-connector' }) };
    await nextTick();
    assert.equal(first.querySelector('.fixture-connector'), connector, '外层保留布局、样式覆盖和隐藏语义');
    assert.equal(connector?.getAttribute('aria-hidden'), 'true');
    assert.equal(connector?.querySelector('.fixture-line'), null);
    assert.equal(view.root.querySelectorAll('[data-custom]').length, 4);
    view.props.lineType = 'arrow';
    delete view.members[0]!.slots;
    await nextTick();
    assert.equal(first.querySelector('.fixture-connector'), connector);
    assert.equal(first.querySelector('.fixture-title')?.textContent, '默认标题');
    assert.equal(first.querySelector('.fixture-description')?.textContent, '默认描述');
    assert.ok(first.querySelector('[data-icon="lucide:cat"]'));
    assert.ok(connector?.querySelector('[data-icon="lucide:chevron-right"]'));
    assert.equal(view.root.querySelector('[data-custom]'), null);
    view.props.lineType = 'dashed';
    await nextTick();
    assert.equal(connector?.querySelectorAll('.fixture-line').length, 2);
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('生产编译和运行时能动态增删无 prop 的描述插槽，simple 及 prop 回退保持同步', async () => {
  const productionOutput = resolve(folder, 'production.mjs');
  const runner = resolve(folder, 'description-production.mjs');
  await compileComponents(productionOutput, true);
  // 独立进程必须先设置生产环境再加载 Vue，避免开发运行时掩盖非响应插槽缓存问题。
  await writeFile(runner, `
    import assert from 'node:assert/strict';
    import { JSDOM } from 'jsdom';
    const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>');
    for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node']) globalThis[key] = dom.window[key];
    const { createApp, h, nextTick, reactive } = await import('vue');
    const { Steps, Step } = await import(${JSON.stringify(pathToFileURL(productionOutput).href)});
    assert.equal(process.env.NODE_ENV, 'production');
    const state = reactive({ show: false, simple: false, description: '' });
    const root = document.querySelector('#app');
    const app = createApp({ render: () => h(Steps, { simple: state.simple }, { default: () => [
      h(Step, { title: '标题', description: state.description, ui: { description: 'description' } }, state.show ? { description: () => h('strong', '插槽描述') } : undefined),
    ] }) });
    app.mount(root);
    const description = () => root.querySelector('.description')?.textContent ?? null;
    try {
      assert.equal(description(), null);
      state.show = true; await nextTick();
      assert.equal(description(), '插槽描述');
      state.show = false; await nextTick();
      assert.equal(description(), null);
      state.description = '属性描述'; await nextTick();
      assert.equal(description(), '属性描述');
      state.show = true; await nextTick();
      assert.equal(description(), '插槽描述');
      state.simple = true; await nextTick();
      assert.equal(description(), null);
      state.simple = false; await nextTick();
      assert.equal(description(), '插槽描述');
      state.show = false; await nextTick();
      assert.equal(description(), '属性描述');
      state.description = ''; await nextTick();
      assert.equal(description(), null);
    } finally { app.unmount(); dom.window.close(); }
  `);
  await runFile(process.execPath, [runner], { env: { ...process.env, NODE_ENV: 'production' } });
});

it('父级颜色与尺寸响应式继承，子步骤颜色和 ui 覆盖独立生效', async () => {
  const view = await mount({ color: 'success', size: 'lg' }, [{ key: 'a', title: '甲' }, { key: 'b', title: '乙', color: 'error' }]);
  try {
    const markers = () => Array.from(view.root.querySelectorAll('.fixture-marker'));
    const items = () => Array.from(view.root.querySelectorAll('li'));
    assert.ok(items()[0]!.className.includes('--color-green-6'));
    assert.ok(items()[1]!.className.includes('--color-red-6'));
    view.props.color = 'warning';
    await nextTick();
    assert.ok(items()[0]!.className.includes('--color-orange-6'));
    assert.ok(items()[1]!.className.includes('--color-red-6'));
    assert.ok(markers().every(element => element.classList.contains('size-10')));
    view.props.size = 'sm';
    await nextTick();
    assert.ok(markers().every(element => element.classList.contains('size-6')));
    assert.deepEqual(view.warnings, []);
  } finally { view.stop(); }
});

it('完成和错误状态使用对应图标，等待步骤显示序号，点状模式不显示内容', async () => {
  const view = await mount({ active: 1 }, [{ key: 'a', title: '甲' }, { key: 'b', title: '乙', status: 'error' }, { key: 'c', title: '丙' }]);
  try {
    const markers = () => Array.from(view.root.querySelectorAll('.fixture-marker'));
    assert.equal(markers()[0]!.querySelector('svg')?.getAttribute('data-icon'), 'lucide:check');
    assert.equal(markers()[1]!.querySelector('svg')?.getAttribute('data-icon'), 'lucide:x');
    assert.equal(markers()[2]!.textContent?.trim(), '3');
    view.props.type = 'dot';
    await nextTick();
    assert.ok(markers().every(element => element.textContent === '' && element.childElementCount === 0));
  } finally { view.stop(); }
});

it('不同 Fragment 的局部同名 key 不串成员，增删后仍保留其节点', async () => {
  const state = reactive({ showFirst: true, secondTitle: '第二组' });
  const root = document.createElement('div');
  document.body.append(root);
  const warnings: string[] = [];
  const app = createApp({ render: () => h(Steps, { active: 0 }, { default: () => [
    h(Fragment, { key: 'first' }, state.showFirst ? [h(Step, { key: 'local', title: '第一组', ui: partUi })] : [h(Comment)]),
    h(Fragment, { key: 'second' }, [h(Step, { key: 'local', title: state.secondTitle, ui: partUi })]),
  ] }) });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(root);
  await nextTick();
  try {
    const second = root.querySelectorAll('li')[1];
    state.showFirst = false;
    state.secondTitle = '第二组更新';
    await nextTick();
    assert.equal(root.querySelector('li'), second);
    assert.deepEqual(snapshot(root).map(item => [item.index, item.title, item.status]), [[0, '第二组更新', 'process']]);
    assert.equal(root.querySelector('.fixture-connector'), null);
    assert.deepEqual(warnings, []);
  } finally { app.unmount(); root.remove(); }
});

it('异步包装的 Step 在客户端与服务端保留步骤索引、状态和连线', async () => {
  const ServerStep = defineAsyncComponent(async () => Step);
  const serverRoot = document.createElement('div');
  serverRoot.innerHTML = await renderToString(createSSRApp({ render: () => h(Steps, { active: 1 }, { default: () => [
    h(ServerStep, { title: '服务端异步甲', ui: partUi }), h(ServerStep, { title: '服务端异步乙', ui: partUi }),
  ] }) }));
  assert.deepEqual(snapshot(serverRoot).map(item => [item.index, item.status, item.title]), [[0, 'finish', '服务端异步甲'], [1, 'process', '服务端异步乙']]);
  const AsyncStep = defineAsyncComponent(async () => Step);
  const render = () => h(Steps, { active: 1 }, { default: () => [
    h(AsyncStep, { key: 'a', title: '异步甲', ui: partUi }),
    h(Step, { key: 'b', title: '同步乙', ui: partUi }),
    h(AsyncStep, { key: 'c', title: '异步丙', ui: partUi }),
  ] });
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({ render });
  app.mount(root);
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
  try {
    assert.deepEqual(snapshot(root).map(item => [item.index, item.status, item.title]), [[0, 'finish', '异步甲'], [1, 'process', '同步乙'], [2, 'wait', '异步丙']]);
    assert.equal(root.querySelectorAll('.fixture-connector').length, 2);
    const serverRoot = document.createElement('div');
    serverRoot.innerHTML = await renderToString(createSSRApp({ render }));
    assert.deepEqual(snapshot(serverRoot), snapshot(root));
  } finally { app.unmount(); root.remove(); }
});

it('多个步骤根隔离上下文，不把外层活动索引传给内层', async () => {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({ render: () => h('section', [
    h(Steps, { active: 0, id: 'first-steps' }, { default: () => [h(Step, { title: '外甲' }), h(Step, { title: '外乙' })] }),
    h(Steps, { active: 1, id: 'second-steps' }, { default: () => [h(Step, { title: '内甲' }), h(Step, { title: '内乙' })] }),
  ]) });
  app.mount(root);
  await nextTick();
  try {
    assert.deepEqual(snapshot(root.querySelector('#first-steps')!).map(item => item.status), ['process', 'wait']);
    assert.deepEqual(snapshot(root.querySelector('#second-steps')!).map(item => item.status), ['finish', 'process']);
  } finally { app.unmount(); root.remove(); }
});

it('无 window/document 的 SSR 首帧包含正确序号、状态和独立步骤进度，水合复用原 DOM', async () => {
  const render = () => h(Steps, { active: 1 }, { default: () => [h(Comment), h(Fragment, null, [
    h(Step, { key: 'a', title: '服务端甲', progress: 15, ui: partUi }),
    h(Step, { key: 'b', title: '服务端乙', progress: 65, ui: partUi }),
    h(Step, { key: 'c', title: '服务端丙', progress: 90, ui: partUi }),
  ])] });
  const descriptors = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let html = '';
  try {
    for (const [key] of descriptors) Reflect.deleteProperty(globalThis, key);
    html = await renderToString(createSSRApp({ render }));
  } finally {
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  }
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  assert.deepEqual(snapshot(root).map(item => [item.index, item.status]), [[0, 'finish'], [1, 'process'], [2, 'wait']]);
  assert.deepEqual(progressSnapshot(root), [{ index: 1, value: 65, min: 0, max: 100, label: '服务端乙进度' }]);
  const serverItems = Array.from(root.querySelectorAll('li'));
  const serverProgress = root.querySelector('[role="progressbar"]');
  const warnings: string[] = [];
  const app = createSSRApp({ render });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(root);
  await nextTick();
  try {
    assert.deepEqual(Array.from(root.querySelectorAll('li')), serverItems);
    assert.equal(root.querySelector('[role="progressbar"]'), serverProgress);
    assert.deepEqual(progressSnapshot(root), [{ index: 1, value: 65, min: 0, max: 100, label: '服务端乙进度' }]);
    assert.deepEqual(warnings, []);
    assert.deepEqual(snapshot(root).map(item => item.current), [null, 'step', null]);
  } finally { app.unmount(); root.remove(); }
});

it('整体进度在无 DOM 的 SSR 首帧正确折算并尊重步骤覆盖，水合保留同一圆环和步骤节点', async () => {
  const render = () => h(Steps, { active: 2, overallProgress: 50 }, { default: () => [h(Fragment, null, [
    h(Step, { key: 'a', title: '服务端甲', ui: partUi }),
    h(Step, { key: 'b', title: '服务端乙', progress: 40, ui: partUi }),
    h(Step, { key: 'c', title: '服务端丙', progress: 90, ui: partUi }),
  ])] });
  const descriptors = ['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let html = '';
  try {
    for (const [key] of descriptors) Reflect.deleteProperty(globalThis, key);
    html = await renderToString(createSSRApp({ render }));
  } finally {
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor);
  }
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.append(root);
  assert.deepEqual(snapshot(root).map(item => [item.status, item.current]), [['finish', null], ['process', 'step'], ['wait', null]]);
  assert.deepEqual(progressSnapshot(root), [{ index: 1, value: 40, min: 0, max: 100, label: '服务端乙进度' }]);
  const serverItems = Array.from(root.querySelectorAll('li'));
  const serverProgress = root.querySelector('[role="progressbar"]');
  const warnings: string[] = [];
  const app = createSSRApp({ render });
  app.config.warnHandler = message => warnings.push(message);
  app.mount(root);
  await nextTick();
  try {
    assert.deepEqual(Array.from(root.querySelectorAll('li')), serverItems);
    assert.equal(root.querySelector('[role="progressbar"]'), serverProgress);
    assert.deepEqual(progressSnapshot(root), [{ index: 1, value: 40, min: 0, max: 100, label: '服务端乙进度' }]);
    assert.deepEqual(warnings, []);
  } finally { app.unmount(); root.remove(); }
});
