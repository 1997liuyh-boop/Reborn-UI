/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { loadAppModule } from '../composables/harness';

const { computed, shallowRef } = await import('vue');
const { useDatePickerNavigation } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-date-picker-panel/useDatePickerNavigation')>('app/components/reborn/ui/reborn-date-picker-panel/useDatePickerNavigation.ts');
const { useDatePickerRange } = await loadAppModule<typeof import('../../app/components/reborn/ui/reborn-date-picker-panel/useDatePickerRange')>('app/components/reborn/ui/reborn-date-picker-panel/useDatePickerRange.ts');

function createNav(type = 'daterange', unlinked = true) {
  const changes: unknown[][] = [];
  const nav = useDatePickerNavigation({
    type: () => type as any,
    disabled: () => false,
    showDual: computed(() => true),
    isUnlinked: computed(() => unlinked),
    onPanelChange: (...args) => changes.push(args),
  });
  return { nav, changes };
}

it('导航状态对外只读，只能经动作改写', () => {
  const { nav } = createNav();
  nav.focus(new Date(2026, 2, 15));
  const original = console.warn;
  console.warn = () => {};
  try { (nav.leftYear as any).value = 1999; } finally { console.warn = original; }
  assert.equal(nav.leftYear.value, 2026);
  assert.equal(nav.leftMonth.value, 2);
  assert.equal(nav.leftPage.value, 2020);
});

it('取消联动时下钻右侧到左侧之前，左侧被推到紧邻位置并通报一次 panel-change', () => {
  const { nav, changes } = createNav();
  nav.focus(new Date(2026, 5, 1));
  nav.syncRight(null);
  assert.deepEqual([nav.rightYear.value, nav.rightMonth.value], [2026, 6]);
  nav.switchView('month');
  changes.length = 0;
  nav.drillMonth('right', 2026, 3);
  assert.equal(nav.view.value, 'date');
  assert.deepEqual([nav.rightYear.value, nav.rightMonth.value], [2026, 2]);
  assert.deepEqual([nav.leftYear.value, nav.leftMonth.value], [2026, 1], '左侧严格早于右侧');
  assert.equal(changes.length, 1);
});

it('取消联动时左侧不能翻过右侧，联动时右侧由左侧推算', () => {
  const { nav } = createNav();
  nav.focus(new Date(2026, 0, 1));
  nav.syncRight(null);
  nav.navigate('left', 1, 'page');
  assert.deepEqual([nav.leftYear.value, nav.leftMonth.value], [2026, 0], '紧邻时左侧前进被拦下');
  assert.equal(nav.headers.value[0]!.disableNext, true);
  const linked = createNav('monthrange', false).nav;
  linked.focus(new Date(2026, 4, 1));
  assert.deepEqual([linked.rightYear.value, linked.rightMonth.value], [2027, 4]);
  linked.navigate('right', 1, 'page');
  assert.deepEqual([linked.leftYear.value, linked.rightYear.value], [2028, 2029], '联动时右侧按钮整屏平移两年');
});

it('范围端点对外只读；点选交换起止，周范围吸附整周，悬停只在只选了起点时预览', () => {
  const type = shallowRef('daterange');
  const range = useDatePickerRange({ type: () => type.value as any, isRange: computed(() => true), disabled: () => false });
  const original = console.warn;
  console.warn = () => {};
  try { (range.start as any).value = new Date(); } finally { console.warn = original; }
  assert.equal(range.start.value, null);
  range.pick(new Date(2026, 0, 10), 'left');
  range.setHover(new Date(2026, 0, 12));
  assert.equal(range.previewEnd.value?.getDate(), 12);
  range.pick(new Date(2026, 0, 5), 'left');
  assert.deepEqual([range.start.value?.getDate(), range.end.value?.getDate()], [5, 10]);
  assert.equal(range.previewEnd.value?.getDate(), 10, '有终点后预览取终点');
  type.value = 'weekrange';
  range.reset();
  range.pick(new Date(2026, 0, 14), 'left');
  range.pick(new Date(2026, 0, 21), 'left');
  assert.deepEqual([range.start.value?.getDate(), range.end.value?.getDate()], [11, 24], '起点吸附周日、终点吸附周六');
});
