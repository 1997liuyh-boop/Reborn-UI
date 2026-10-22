/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import { getLunar, lunarDayName, lunarMonthName, solarTerms } from '../../app/components/reborn/ui/reborn-calendar/reborn-calendar.lunar';

/** 取某公历日的农历信息，测试里写起来短一些 */
const lunar = (y: number, m: number, d: number) => getLunar(new Date(y, m - 1, d))!;

it('农历日名与月名', () => {
  assert.deepEqual([1, 9, 10, 11, 19, 20, 21, 29, 30].map(lunarDayName), ['初一', '初九', '初十', '十一', '十九', '二十', '廿一', '廿九', '三十']);
  assert.equal(lunarMonthName(1), '正月');
  assert.equal(lunarMonthName(11), '冬月');
  assert.equal(lunarMonthName(12), '腊月');
  assert.equal(lunarMonthName(6, true), '闰六月');
});

it('公历转农历：月日、干支年与生肖', () => {
  const day = lunar(2026, 10, 20);
  assert.equal(`${day.monthName}${day.dayName}`, '九月十一');
  assert.equal(`${day.yearName}${day.zodiac}`, '丙午马');
  assert.equal(day.text, '十一');
  // 农历年在春节切换，春节前一天仍属上一年
  const eve = lunar(2026, 2, 16);
  assert.equal(`${eve.yearName}${eve.zodiac}`, '乙巳蛇');
});

it('节日优先于日名，除夕取春节前一天，闰月不过节', () => {
  const expected: [number, number, number, string][] = [
    [2026, 2, 16, '除夕'],
    [2026, 2, 17, '春节'],
    [2026, 3, 3, '元宵'],
    [2026, 6, 19, '端午'],
    [2026, 8, 19, '七夕'],
    [2026, 9, 25, '中秋'],
    [2026, 10, 18, '重阳'],
    [2027, 1, 15, '腊八'],
  ];
  for (const [y, m, d, name] of expected) {
    assert.equal(lunar(y, m, d).festival, name, `${y}-${m}-${d}`);
    assert.equal(lunar(y, m, d).text, name);
  }
  // 2025 年闰六月：初一显示月名，闰六月十五不算中元
  const leap = lunar(2025, 7, 25);
  assert.deepEqual([leap.month, leap.leap, leap.text], [6, true, '闰六月']);
  assert.equal(lunar(2025, 8, 8).festival, undefined);
});

it('二十四节气按寿星通式计算，含已知例外年份', () => {
  const terms2026 = [...solarTerms(2026)].map(([date, name]) => `${name}${date}`).join(' ');
  assert.equal(terms2026, '小寒1-5 大寒1-20 立春2-4 雨水2-18 惊蛰3-5 春分3-20 清明4-5 谷雨4-20 立夏5-5 小满5-21 芒种6-5 夏至6-21 小暑7-7 大暑7-23 立秋8-7 处暑8-23 白露9-7 秋分9-23 寒露10-8 霜降10-23 立冬11-7 小雪11-22 大雪12-7 冬至12-22');
  assert.equal(solarTerms(2024).get('2-4'), '立春', '闰年 1、2 月的节气按上一年做闰年修正');
  assert.equal(solarTerms(2025).get('2-3'), '立春');
  assert.equal(solarTerms(2021).get('12-21'), '冬至', '2021 年冬至例外 -1');
  assert.equal(solarTerms(2008).get('5-21'), '小满', '2008 年小满例外 +1');
  assert.equal(solarTerms(1999).size, 0, '超出 2000–2099 不计算');
  // 节气排在节日之后、日名之前
  assert.equal(lunar(2026, 10, 8).text, '寒露');
  assert.equal(lunar(2026, 10, 8).term, '寒露');
});
