/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict';
import { it } from 'node:test';
import {
  buildMonthCells,
  buildRangeCells,
  calculateValidatedDateRange,
  dayInZone,
  formatDay,
  formatRangeTitle,
  formatValue,
  groupEvents,
  isValidTimeZone,
  msUntilNextDay,
  parseValue,
  resolveRange,
  setYearMonth,
  shiftMonth,
  toDay,
  zonedMidnight,
} from '../../app/components/reborn/ui/reborn-calendar/reborn-calendar.utils';

/** 区间段转成可读字符串，便于整体断言 */
const segmentText = (segments: [Date, Date][]) => segments.map(([a, b]) => `${formatDay(a)}~${formatDay(b)}`);

it('月视图从 1 号所在周的周日排到月末所在周的周六，行数随月份变化', () => {
  // 2026 年 10 月 1 日是周四，31 日是周六：9-27 ~ 10-31，5 行
  const october = buildMonthCells(new Date(2026, 9, 20));
  assert.equal(october.length, 35);
  assert.equal(october[0]!.day, '2026-09-27');
  assert.equal(october[0]!.type, 'prev-month');
  assert.equal(october[4]!.day, '2026-10-01');
  assert.equal(october[4]!.type, 'current-month');
  assert.equal(october.at(-1)!.day, '2026-10-31');

  // 2015 年 2 月 1 日周日、28 日周六：正好 4 行，没有补位
  const february = buildMonthCells(new Date(2015, 1, 10));
  assert.equal(february.length, 28);
  assert.ok(february.every(cell => cell.type === 'current-month'));

  // 2026 年 8 月 1 日周六、31 日周一：6 行，末尾补到 9-5
  const august = buildMonthCells(new Date(2026, 7, 1));
  assert.equal(august.length, 42);
  assert.equal(august.at(-1)!.day, '2026-09-05');
  assert.equal(august.at(-1)!.type, 'next-month');
});

it('跨年的上下月补位按年月判定，不只比月份', () => {
  const january = buildMonthCells(new Date(2027, 0, 15));
  assert.equal(january[0]!.day, '2026-12-27');
  assert.equal(january[0]!.type, 'prev-month');
  const december = buildMonthCells(new Date(2026, 11, 15));
  assert.equal(december.at(-1)!.day, '2027-01-02');
  assert.equal(december.at(-1)!.type, 'next-month');
});

it('换年换月时日不变，目标月没有这一天就收到月末', () => {
  assert.equal(formatDay(setYearMonth(new Date(2026, 0, 31), 2026, 1)), '2026-02-28');
  assert.equal(formatDay(setYearMonth(new Date(2024, 1, 29), 2025, 1)), '2025-02-28');
  assert.equal(formatDay(shiftMonth(new Date(2026, 2, 31), -1)), '2026-02-28');
  assert.equal(formatDay(shiftMonth(new Date(2026, 11, 15), 1)), '2027-01-15');
  assert.equal(formatDay(shiftMonth(new Date(2026, 9, 20), -12)), '2025-10-20');
});

it('同月区间补成整周后只有一段', () => {
  assert.deepEqual(segmentText(calculateValidatedDateRange(new Date(2026, 9, 4), new Date(2026, 9, 17))), ['2026-10-04~2026-10-17']);
  // 开始不是周日、结束不是周六时向外补齐
  assert.deepEqual(segmentText(calculateValidatedDateRange(new Date(2026, 9, 7), new Date(2026, 9, 14))), ['2026-10-04~2026-10-17']);
});

it('相邻两月的区间按月拆两段，首段补位行与次段不重复', () => {
  // 10-31 是周六，次段从 11-1 开始
  assert.deepEqual(
    segmentText(calculateValidatedDateRange(new Date(2026, 9, 25), new Date(2026, 10, 14))),
    ['2026-10-25~2026-10-31', '2026-11-01~2026-11-14'],
  );
  // 2026-09-30 是周三，与 10-1 同周：首段补位已含 10-1 ~ 10-3，次段从 10-4 开始
  const segments = calculateValidatedDateRange(new Date(2026, 8, 20), new Date(2026, 9, 17));
  assert.deepEqual(segmentText(segments), ['2026-09-20~2026-09-30', '2026-10-04~2026-10-17']);
  const days = buildRangeCells(segments).map(cell => cell.day);
  assert.equal(days.length, 28);
  assert.equal(new Set(days).size, 28);
  assert.equal(days[11], '2026-10-01');
});

it('次段被首段补位行完全覆盖时不产生空段', () => {
  // 11-29 周日 ~ 12-5 周六：一整周已由首段补位画完
  assert.deepEqual(
    segmentText(calculateValidatedDateRange(new Date(2026, 10, 29), new Date(2026, 11, 5))),
    ['2026-11-29~2026-11-30'],
  );
  assert.equal(buildRangeCells(calculateValidatedDateRange(new Date(2026, 10, 29), new Date(2026, 11, 5))).length, 7);
});

it('补周后横跨三个月时拆三段并保持连续', () => {
  // 2021-01-30 周六 ~ 2021-02-28 周日：补周后是 1-24 ~ 3-6；2-28 那一周的补位已画到 3-6，第三段被丢掉
  const segments = calculateValidatedDateRange(new Date(2021, 0, 30), new Date(2021, 1, 28));
  assert.deepEqual(segmentText(segments), ['2021-01-24~2021-01-31', '2021-02-07~2021-02-28']);
  // 2026-12-01 周二 ~ 2027-01-15 周五：补周后是 11-29 ~ 1-16，三段都有内容，共 7 周
  const three = calculateValidatedDateRange(new Date(2026, 11, 1), new Date(2027, 0, 15));
  assert.deepEqual(segmentText(three), ['2026-11-29~2026-11-30', '2026-12-06~2026-12-31', '2027-01-03~2027-01-16']);
  const threeDays = buildRangeCells(three).map(cell => cell.day);
  assert.equal(threeDays.length, 49);
  assert.equal(new Set(threeDays).size, 49);
  const days = buildRangeCells(segments).map(cell => cell.day);
  assert.equal(days[0], '2021-01-24');
  assert.equal(days.at(-1), '2021-03-06');
  assert.equal(new Set(days).size, days.length);
  for (let i = 1; i < days.length; i++)
    assert.equal(toDay(days[i])!.getTime() - toDay(days[i - 1])!.getTime() > 0, true);
});

it('区间单元格的 type 相对所在段的月份判定', () => {
  const cells = buildRangeCells(calculateValidatedDateRange(new Date(2026, 9, 25), new Date(2026, 10, 14)));
  assert.equal(cells[0]!.type, 'current-month');
  assert.equal(cells.find(cell => cell.day === '2026-11-01')!.type, 'current-month');
});

it('range 校验：非法、颠倒、跨度超过相邻月都返回空段并给出原因', () => {
  assert.deepEqual(resolveRange(undefined), { segments: [], error: null });
  assert.equal(resolveRange([new Date(2026, 9, 1)]).error, 'invalid');
  assert.equal(resolveRange([new Date(2026, 9, 1), 'not-a-date']).error, 'invalid');
  assert.equal(resolveRange([new Date(2026, 9, 10), new Date(2026, 9, 1)]).error, 'reversed');
  assert.equal(resolveRange([new Date(2026, 8, 30), new Date(2026, 10, 1)]).error, 'too-long');
  const ok = resolveRange([new Date(2026, 9, 25), new Date(2026, 10, 14)]);
  assert.equal(ok.error, null);
  assert.equal(ok.segments.length, 2);
});

it('事项按天、按月分组，保持传入顺序并跳过无法解析的日期', () => {
  const events = [
    { date: '2026-10-20', title: 'A' },
    { date: new Date(2026, 9, 20, 18, 30), title: 'B' },
    { date: 'bad', title: 'C' },
    { date: '2026-10-21', title: 'D' },
  ];
  const byDay = groupEvents(events, formatDay);
  assert.deepEqual(byDay.get('2026-10-20')!.map(e => e.title), ['A', 'B']);
  assert.deepEqual(byDay.get('2026-10-21')!.map(e => e.title), ['D']);
  assert.equal(byDay.size, 2);
});

it('字符串日期按本地时区解析为当天零点', () => {
  const day = toDay('2026-10-20')!;
  assert.equal(day.getFullYear(), 2026);
  assert.equal(day.getMonth(), 9);
  assert.equal(day.getDate(), 20);
  assert.equal(day.getHours(), 0);
  assert.equal(toDay(''), null);
  assert.equal(toDay(null), null);
});

it('区间标题同月写一个月份，跨月写起止月份', () => {
  assert.equal(formatRangeTitle(calculateValidatedDateRange(new Date(2026, 9, 4), new Date(2026, 9, 17))), '2026 年 10 月');
  assert.equal(
    formatRangeTitle(calculateValidatedDateRange(new Date(2026, 9, 25), new Date(2026, 10, 14))),
    '2026 年 10 月 - 2026 年 11 月',
  );
});

it('带偏移的时刻按指定时区落日，不带偏移的字符串与时区无关', () => {
  // 同一时刻：纽约还是 19 日晚上，上海已是 20 日
  const instant = '2026-10-20T02:00:00Z';
  assert.equal(formatDay(toDay(instant, 'America/New_York')!), '2026-10-19');
  assert.equal(formatDay(toDay(instant, 'Asia/Shanghai')!), '2026-10-20');
  assert.equal(formatDay(toDay(new Date(instant), 'America/New_York')!), '2026-10-19');
  assert.equal(formatDay(toDay(Date.parse(instant), 'Asia/Tokyo')!), '2026-10-20');
  assert.equal(formatDay(toDay('2026-10-20T08:00:00+08:00', 'America/New_York')!), '2026-10-19');
  // 墙上日期 / 时间不受时区影响
  assert.equal(formatDay(toDay('2026-10-20', 'America/New_York')!), '2026-10-20');
  assert.equal(formatDay(toDay('2026-10-20 23:30', 'Pacific/Kiritimati')!), '2026-10-20');
  assert.equal(formatDay(toDay('2026-10-20T23:30:00', 'America/New_York')!), '2026-10-20');
});

it('日历日还原成时区零点的时刻，往返不偏移一天', () => {
  const day = new Date(2026, 9, 20);
  assert.equal(zonedMidnight(day, 'Asia/Shanghai').toISOString(), '2026-10-19T16:00:00.000Z');
  assert.equal(zonedMidnight(day, 'America/New_York').toISOString(), '2026-10-20T04:00:00.000Z');
  assert.equal(zonedMidnight(day, 'UTC').toISOString(), '2026-10-20T00:00:00.000Z');
  // 夏令时切换日：纽约 2026-03-08 凌晨两点拨快，零点仍是 -05:00；11-01 拨回前零点是 -04:00
  assert.equal(zonedMidnight(new Date(2026, 2, 8), 'America/New_York').toISOString(), '2026-03-08T05:00:00.000Z');
  assert.equal(zonedMidnight(new Date(2026, 10, 1), 'America/New_York').toISOString(), '2026-11-01T04:00:00.000Z');
  for (const zone of ['Asia/Shanghai', 'America/New_York', 'Pacific/Kiritimati', 'Pacific/Pago_Pago']) {
    assert.equal(formatDay(dayInZone(zonedMidnight(day, zone), zone)), '2026-10-20', zone);
  }
  // 不传时区即本地零点，与原有行为一致
  assert.equal(zonedMidnight(day).getTime(), new Date(2026, 9, 20).getTime());
});

it('距离时区下一个零点的毫秒数', () => {
  const now = new Date('2026-10-20T15:30:00Z');
  assert.equal(msUntilNextDay('Asia/Shanghai', now), 30 * 60 * 1000, '上海 23:30，半小时后跨天');
  assert.equal(msUntilNextDay('UTC', now), 8.5 * 3600 * 1000);
  assert.ok(msUntilNextDay('Asia/Shanghai', new Date('2026-10-20T15:59:59.900Z')) >= 1000, '至少一秒，避免定时器连发');
});

it('valueFormat 收发字符串，严格按格式解析，失败退回通用规则', () => {
  const day = new Date(2026, 9, 5);
  assert.equal(formatValue(day, 'YYYY-MM-DD'), '2026-10-05');
  assert.equal(formatValue(day, 'YYYY/MM/DD'), '2026/10/05');
  assert.equal(formatDay(parseValue('05.10.2026', 'DD.MM.YYYY')!), '2026-10-05');
  assert.equal(formatDay(parseValue('2026-10-05', 'DD.MM.YYYY')!), '2026-10-05', '格式不符时按通用规则');
  assert.equal(parseValue('不是日期', 'YYYY-MM-DD'), null);
  assert.equal(formatDay(parseValue(new Date('2026-10-20T02:00:00Z'), undefined, 'America/New_York')!), '2026-10-19');
});

it('时区名校验，事项与区间都按时区落日', () => {
  assert.equal(isValidTimeZone('Asia/Shanghai'), true);
  assert.equal(isValidTimeZone('Mars/Olympus'), false);
  const groups = groupEvents([{ date: '2026-10-20T02:00:00Z', title: 'A' }, { date: '2026-10-20', title: 'B' }], formatDay, 'America/New_York');
  assert.deepEqual(groups.get('2026-10-19')!.map(e => e.title), ['A']);
  assert.deepEqual(groups.get('2026-10-20')!.map(e => e.title), ['B']);
  // 纽约 10-11 凌晨两点（UTC）仍是 10-10，补周后从 10-04 开始
  const range = resolveRange([new Date('2026-10-11T02:00:00Z'), new Date('2026-10-17T12:00:00Z')], 'America/New_York');
  assert.equal(formatDay(range.segments[0]![0]), '2026-10-04');
  assert.equal(formatDay(range.segments[0]![1]), '2026-10-17');
});
