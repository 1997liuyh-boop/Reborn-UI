/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器，不引入额外依赖 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { getArcGeometry, getArcPath, getColorRanges, getGradientStops, getStepRanges, normalizePercent, normalizeSteps } from '../../app/components/reborn/ui/reborn-progress/reborn-progress.utils';

it('百分比与步骤数限制到有效范围', () => {
  assert.deepEqual([-1, 0, 42.5, 100, 150, Number.NaN, Infinity].map(normalizePercent), [0, 0, 42.5, 100, 100, 0, 0]);
  assert.deepEqual([-1, 0, 3.9, Number.NaN, Infinity, 2000].map(normalizeSteps), [0, 0, 3, 0, 0, 1000]);
});

it('颜色区间排序、去重并填补剩余区间，不修改输入', () => {
  const segments = [{ percentage: 70, color: 'green' }, { percentage: 30, color: 'red' }, { percentage: 30, color: 'orange' }];
  assert.deepEqual(getColorRanges(segments, 'blue'), [
    { from: 0, to: 30, color: 'orange' }, { from: 30, to: 70, color: 'green' }, { from: 70, to: 100, color: 'blue' },
  ]);
  assert.equal(segments[0].percentage, 70);
  assert.deepEqual(getColorRanges([{ percentage: Number.NaN, color: 'red' }], 'blue'), [{ from: 0, to: 100, color: 'blue' }]);
});

it('渐变色标支持乱序、边界钳制与空值', () => {
  assert.deepEqual(getGradientStops({ stops: [{ offset: 110, color: 'blue' }, { offset: -5, color: 'red' }] }), [{ offset: 0, color: 'red' }, { offset: 100, color: 'blue' }]);
  assert.deepEqual(getGradientStops('red'), []);
  assert.deepEqual(getGradientStops(['red']), []);
  assert.deepEqual(getGradientStops({ stops: [{ offset: Number.NaN, color: 'red' }] }), []);
});

it('普通圆环和步骤圆环遵循指定外径及厚度', () => {
  for (const [size, diameter, strokeWidth, stepWidth] of [['sm', 48, 4, 6], ['md', 76, 6, 8], ['lg', 114, 6, 16]] as const) {
    assert.equal(getArcGeometry('circle', size, false).diameter, diameter);
    assert.equal(getArcGeometry('circle', size, false).strokeWidth, strokeWidth);
    assert.equal(getArcGeometry('dashboard', size, true).strokeWidth, stepWidth);
  }
  assert.equal(getArcGeometry('circle', 'md', false).sweep, 360);
  assert.equal(getArcGeometry('dashboard', 'md', false).sweep, 270);
});

it('步骤等分、环形间距精确为 2px，过密时无负长度', () => {
  const geometry = getArcGeometry('circle', 'md', true);
  const ranges = getStepRanges(5, geometry);
  assert.equal(ranges.length, 5);
  const actualGap = (ranges[1].from - ranges[0].to) / 100 * geometry.length;
  assert.ok(Math.abs(actualGap - 2) < 1e-9);
  assert.ok(getStepRanges(1000, geometry).every(range => range.to > range.from));
  assert.deepEqual(getStepRanges(0), [{ from: 0, to: 100 }]);
});

it('完整圆使用两段弧避免首尾同点导致不渲染，零长度不绘制', () => {
  const geometry = getArcGeometry('circle', 'md', false);
  assert.equal((getArcPath(geometry, 0, 100).match(/ A /g) || []).length, 2);
  assert.equal(getArcPath(geometry, 30, 30), '');
  assert.ok(!getArcPath(getArcGeometry('dashboard', 'sm', true), 0, 100).includes('NaN'));
});

it('单色标渐变退化为相同颜色的两个端点', () => {
  assert.deepEqual(getGradientStops({ stops: [{ offset: 40, color: 'red' }] }), [{ offset: 0, color: 'red' }, { offset: 100, color: 'red' }]);
});
