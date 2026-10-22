/**
 * 农历换算：月、日与干支年取自浏览器内置的 Intl 中国历法（zh-CN-u-ca-chinese），不引入第三方库；
 * 节日按农历月日查表，节气用「寿星通式」按年计算（仅覆盖 2000–2099 年）。
 * 环境不支持中国历法时 getLunar 返回 undefined，组件随之不显示农历。
 */

/** 单日的农历信息 */
export interface CalendarLunar {
  /** 农历年的干支，如「丙午」 */
  yearName: string;
  /** 生肖，如「马」 */
  zodiac: string;
  /** 农历月 1~12 */
  month: number;
  /** 是否闰月 */
  leap: boolean;
  /** 月名：正月…冬月、腊月，闰月带「闰」 */
  monthName: string;
  /** 农历日 1~30 */
  day: number;
  /** 日名：初一…三十 */
  dayName: string;
  /** 农历节日，如「中秋」「除夕」 */
  festival?: string;
  /** 二十四节气，如「寒露」 */
  term?: string;
  /** 格子里展示的文字：节日 > 节气 > 初一显示月名 > 日名 */
  text: string;
}

const MONTH_NAMES = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/** 农历节日，键为「月-日」；闰月不过节 */
const FESTIVALS: Record<string, string> = {
  "1-1": "春节",
  "1-15": "元宵",
  "2-2": "龙抬头",
  "5-5": "端午",
  "7-7": "七夕",
  "7-15": "中元",
  "8-15": "中秋",
  "9-9": "重阳",
  "12-8": "腊八",
};

/** 二十四节气，从小寒起，两两落在 1~12 月 */
const TERMS = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"];
/** 寿星通式 21 世纪的 C 值，与 TERMS 一一对应 */
const TERM_C = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94];
/** 通式在 21 世纪的已知例外：「年份-节气序号」→ 日期修正 */
const TERM_FIX: Record<string, number> = {
  "2019-0": -1,
  "2082-1": 1,
  "2026-3": -1,
  "2084-5": 1,
  "2008-9": 1,
  "2016-12": 1,
  "2002-14": 1,
  "2089-19": 1,
  "2089-20": 1,
  "2021-23": -1,
};

/** 农历日名：初一…初十、十一…二十、廿一…廿九、三十 */
export function lunarDayName(day: number): string {
  if (day === 10)
    return "初十";
  if (day === 20)
    return "二十";
  if (day === 30)
    return "三十";
  const prefix = ["初", "十", "廿", "三"][Math.floor(day / 10)];
  return `${prefix}${DIGITS[day % 10]}`;
}

/** 农历月名，闰月带「闰」 */
export function lunarMonthName(month: number, leap = false): string {
  return `${leap ? "闰" : ""}${MONTH_NAMES[month - 1]}月`;
}

const termCache = new Map<number, Map<string, string>>();

/** 某年的节气表：键为「公历月-日」（月从 1 起）；2000–2099 之外返回空表 */
export function solarTerms(year: number): Map<string, string> {
  let terms = termCache.get(year);
  if (terms)
    return terms;
  terms = new Map();
  if (year >= 2000 && year <= 2099) {
    const y = year - 2000;
    TERMS.forEach((name, index) => {
      // 1、2 月的四个节气在闰日之前，闰年修正按上一年计
      const leapFix = Math.floor((index < 4 ? y - 1 : y) / 4);
      const day = Math.floor(y * 0.2422 + TERM_C[index]!) - leapFix + (TERM_FIX[`${year}-${index}`] ?? 0);
      terms!.set(`${Math.floor(index / 2) + 1}-${day}`, name);
    });
  }
  termCache.set(year, terms);
  return terms;
}

let numericFormat: Intl.DateTimeFormat | null | undefined;
let yearFormat: Intl.DateTimeFormat | undefined;

/** 惰性创建格式化器；运行环境的 ICU 不含中国历法时记为 null，之后直接跳过 */
function formatters() {
  if (numericFormat === undefined) {
    try {
      const format = new Intl.DateTimeFormat("en-u-ca-chinese", { timeZone: "UTC", month: "numeric", day: "numeric" });
      numericFormat = format.resolvedOptions().calendar === "chinese" ? format : null;
      yearFormat = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { timeZone: "UTC", year: "numeric" });
    }
    catch {
      numericFormat = null;
    }
  }
  return numericFormat ? { numeric: numericFormat, year: yearFormat! } : null;
}

/** 只换算月、日与年份，不带节日，供除夕判断复用 */
function baseLunar(day: Date) {
  const format = formatters();
  if (!format)
    return;
  // 公历日期按 UTC 正午换算，结果与运行环境的时区无关
  const instant = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), 12);
  const parts = Object.fromEntries(format.numeric.formatToParts(instant).map(part => [part.type, part.value]));
  const month = Number.parseInt(parts.month ?? "", 10);
  const date = Number.parseInt(parts.day ?? "", 10);
  if (!month || !date)
    return;
  return { month, day: date, leap: /bis/.test(parts.month ?? ""), instant };
}

const lunarCache = new Map<string, CalendarLunar | null>();

/** 公历日（本地零点的 Date）对应的农历信息；不支持中国历法时返回 undefined */
export function getLunar(day: Date): CalendarLunar | undefined {
  const key = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
  const cached = lunarCache.get(key);
  if (cached !== undefined)
    return cached ?? undefined;
  const base = baseLunar(day);
  if (!base) {
    lunarCache.set(key, null);
    return;
  }
  const yearParts = Object.fromEntries(formatters()!.year.formatToParts(base.instant).map(part => [part.type, part.value]));
  const relatedYear = Number(yearParts.relatedYear);
  const next = baseLunar(new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1));
  const festival = base.leap
    ? undefined
    : next?.month === 1 && next.day === 1 && !next.leap ? "除夕" : FESTIVALS[`${base.month}-${base.day}`];
  const term = solarTerms(day.getFullYear()).get(`${day.getMonth() + 1}-${day.getDate()}`);
  const monthName = lunarMonthName(base.month, base.leap);
  const dayName = lunarDayName(base.day);
  const lunar: CalendarLunar = {
    yearName: yearParts.yearName ?? "",
    zodiac: Number.isFinite(relatedYear) ? ZODIAC[(((relatedYear - 4) % 12) + 12) % 12]! : "",
    month: base.month,
    leap: base.leap,
    monthName,
    day: base.day,
    dayName,
    festival,
    term,
    text: festival ?? term ?? (base.day === 1 ? monthName : dayName),
  };
  lunarCache.set(key, lunar);
  return lunar;
}
