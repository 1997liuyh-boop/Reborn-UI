/**
 * 首页「提交日历」的数据：近 20 周里每天的提交数，以及这些提交首次进入的版本。
 *
 * 取自仓库的 git 标签与提交记录（作者日期），截至 1.1.5（2026-11-10）：
 * 依次对 1.0.0、1.0.0..1.1.0、1.1.0..1.1.1 …… 1.1.4..1.1.5 运行
 * `git log <范围> --format=%ad --date=short`，按天累计。发新版后按同样的方法重新生成这份数据。
 *
 * 阶段名沿用日历样式里的四种配色钩子（registration 蓝 / submission 橙 / selection 紫 / final 绿），
 * 在这里分别代表四段发版窗口，文案见 RELEASE_PHASES。
 */

/** 日历配色钩子，对应样式里 data-phases 的四个取值 */
export type ReleasePhase = "registration" | "submission" | "selection" | "final";

export interface ReleasePhaseNote {
  phase: ReleasePhase;
  /** 悬浮提示里也用这个标题 */
  title: string;
  /** 窗口起止（月.日） */
  range: string;
  /** 两行说明 */
  lines: [string, string];
}

/** 四段发版窗口；提交数是整个窗口的总数（1.0.0 从 2026-01-07 的第一次提交算起） */
export const RELEASE_PHASES: readonly ReleasePhaseNote[] = [
  { phase: "registration", title: "首个版本 1.0.0", range: "01.07–10.23", lines: ["321 次提交攒出第一版", "10.23 发布 1.0.0"] },
  { phase: "submission", title: "审查整改 1.1.0", range: "10.23–10.26", lines: ["按 Vue 最佳实践整改组件", "10.26 发布 1.1.0"] },
  { phase: "selection", title: "交互打磨 1.1.1–1.1.2", range: "10.26–10.29", lines: ["TreeSelect 支持异步搜索", "10.29 连发两个修订版"] },
  { phase: "final", title: "主题统一 1.1.3–1.1.5", range: "10.30–11.10", lines: ["浮层箭头与语义色配对统一", "11.10 发布 1.1.5"] },
];

/** 日历第一天（周一）与周数：每列一周、每行一天，从周一排到周日 */
export const CALENDAR_START = "2026-06-29";
export const CALENDAR_WEEKS = 20;

/** 有提交的日子：[日期, 提交数, 所属阶段（空格分隔，一天可能跨两个版本）] */
export const CALENDAR_COMMITS: ReadonlyArray<readonly [string, number, string]> = [
  ["2026-06-29", 1, "registration"],
  ["2026-07-21", 4, "registration"],
  ["2026-07-23", 1, "registration"],
  ["2026-08-13", 4, "registration"],
  ["2026-08-14", 2, "registration"],
  ["2026-08-18", 4, "registration"],
  ["2026-08-19", 8, "registration"],
  ["2026-08-20", 1, "registration"],
  ["2026-08-21", 7, "registration"],
  ["2026-08-22", 2, "registration"],
  ["2026-08-24", 8, "registration"],
  ["2026-08-25", 1, "registration"],
  ["2026-08-26", 10, "registration"],
  ["2026-08-27", 5, "registration"],
  ["2026-08-28", 1, "registration"],
  ["2026-08-31", 2, "registration"],
  ["2026-09-01", 6, "registration"],
  ["2026-09-04", 5, "registration"],
  ["2026-09-08", 2, "registration"],
  ["2026-09-10", 1, "registration"],
  ["2026-09-11", 3, "registration"],
  ["2026-09-13", 4, "registration"],
  ["2026-09-14", 4, "registration"],
  ["2026-09-16", 3, "registration"],
  ["2026-09-17", 2, "registration"],
  ["2026-09-18", 1, "registration"],
  ["2026-09-21", 3, "registration"],
  ["2026-09-22", 1, "registration"],
  ["2026-09-24", 5, "registration"],
  ["2026-09-28", 1, "registration"],
  ["2026-09-29", 1, "registration"],
  ["2026-09-30", 1, "registration"],
  ["2026-10-14", 1, "registration"],
  ["2026-10-16", 2, "registration"],
  ["2026-10-19", 1, "registration"],
  ["2026-10-22", 1, "registration"],
  ["2026-10-23", 4, "registration submission"],
  ["2026-10-26", 3, "submission selection"],
  ["2026-10-27", 1, "selection"],
  ["2026-10-29", 2, "selection"],
  ["2026-10-30", 1, "final"],
  ["2026-10-31", 2, "final"],
  ["2026-11-01", 1, "final"],
  ["2026-11-03", 1, "final"],
  ["2026-11-04", 5, "final"],
  ["2026-11-09", 7, "final"],
  ["2026-11-10", 1, "final"],
];

export interface CalendarCell {
  /** 第几列（周），从 1 起 */
  column: number;
  /** 第几行（周一为 1） */
  row: number;
  date: string;
  /** 当天没有提交时为 0，渲染成不可交互的暗格 */
  commits: number;
  phases: string;
}

/** 展开成 20×7 的格子，按列（周）优先排列，键盘左右跨一周、上下跨一天 */
export function buildCalendarCells(): CalendarCell[] {
  const commits = new Map(CALENDAR_COMMITS.map(([date, count, phases]) => [date, { count, phases }]));
  const start = Date.parse(`${CALENDAR_START}T00:00:00Z`);
  const cells: CalendarCell[] = [];
  for (let index = 0; index < CALENDAR_WEEKS * 7; index++) {
    const date = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
    const hit = commits.get(date);
    cells.push({
      column: Math.floor(index / 7) + 1,
      row: (index % 7) + 1,
      date,
      commits: hit?.count ?? 0,
      phases: hit?.phases ?? "",
    });
  }
  return cells;
}

/** 月份标签：每月 1 日所在的那一列 */
export function buildCalendarMonths(): Array<{ column: number; label: string }> {
  const start = Date.parse(`${CALENDAR_START}T00:00:00Z`);
  const months: Array<{ column: number; label: string }> = [];
  for (let index = 0; index < CALENDAR_WEEKS * 7; index++) {
    const day = new Date(start + index * 86_400_000);
    if (day.getUTCDate() !== 1) continue;
    months.push({ column: Math.floor(index / 7) + 1, label: `${day.getUTCMonth() + 1}月` });
  }
  return months;
}
