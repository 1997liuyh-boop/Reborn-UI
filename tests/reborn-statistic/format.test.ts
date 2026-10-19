/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { formatCountdown } from '../../app/components/reborn/ui/reborn-countdown/reborn-countdown.utils';
import { formatStatistic } from '../../app/components/reborn/ui/reborn-statistic/reborn-statistic.utils';

it('统计数值支持分组、四舍五入和自定义分隔符', () => {
  assert.equal(formatStatistic(1234567.895, 2), '1,234,567.90');
  assert.equal(formatStatistic(-12345.6, 3, ',', '.'), '-12.345,600');
  assert.equal(formatStatistic(1234567.8, 1, '·', ''), '1234567·8');
  assert.equal(formatStatistic(0.1, 4), '0.1000');
  assert.equal(formatStatistic(1e21), '1,000,000,000,000,000,000,000');
});

it('异常数字和精度不会造成渲染异常', () => {
  assert.equal(formatStatistic(Number.NaN), '0');
  assert.equal(formatStatistic(Infinity), '0');
  assert.equal(formatStatistic(12.5, -1), '13');
  assert.equal(formatStatistic(1, Infinity), '1');
  assert.equal(formatStatistic(1, 1000), `1.${'0'.repeat(20)}`);
});

it('倒计时未展示的大单位累计进较小单位，展示后按单位拆分', () => {
  const remaining = 2 * 86400000 + 3 * 3600000 + 4 * 60000 + 5006;
  assert.equal(formatCountdown(remaining, 'HH:mm:ss'), '51:04:05');
  assert.equal(formatCountdown(remaining, 'DD [天] HH:mm:ss.SSS'), '02 天 03:04:05.006');
  assert.equal(formatCountdown(remaining, 'mm:ss'), '3064:05');
  assert.equal(formatCountdown(remaining, 'D[天] H[时] m[分] s[秒]'), '2天 3时 4分 5秒');
});

it('倒计时按剩余毫秒取整，字面量、重复单位与终点格式稳定', () => {
  assert.equal(formatCountdown(1999, 'ss.SSS'), '01.999');
  assert.equal(formatCountdown(65000, '[HH:mm:ss] mm:ss / mm'), 'HH:mm:ss 01:05 / 01');
  assert.equal(formatCountdown(-10), '00:00:00');
  assert.equal(formatCountdown(Number.NaN), '00:00:00');
  assert.equal(formatCountdown(1000, ''), '');
});
