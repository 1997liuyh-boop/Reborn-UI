import type { Ref } from 'vue';
import type { DatePickerType, ViewType } from './reborn-date-picker-panel.config';
import { computed, readonly, shallowRef } from 'vue';

export type PanelSide = 'left' | 'right';
export type PanelChangeMode = 'month' | 'year';
export type PanelChangeDate = Date | [Date, Date];

/** 头部渲染所需的单侧描述：所示年月、十年页起点，以及翻页按钮的显隐与禁用 */
export interface PanelHeader {
  side: PanelSide;
  year: number;
  month: number;
  pageStart: number;
  hidePrev: boolean;
  hideNext: boolean;
  disablePrev: boolean;
  disablePrevYear: boolean;
  disableNext: boolean;
  disableNextYear: boolean;
}

export interface DatePickerNavigationOptions {
  type: () => DatePickerType;
  disabled: () => boolean;
  /** 实际是否渲染双面板 */
  showDual: Readonly<Ref<boolean>>;
  /** 双面板是否取消联动、各自翻页 */
  isUnlinked: Readonly<Ref<boolean>>;
  /** 翻页、切换视图或下钻后通报所示时间 */
  onPanelChange: (date: PanelChangeDate, mode: PanelChangeMode, view: ViewType) => void;
}

/** 类型对应的初始视图：年 / 月 / 季度类型直接停在对应网格，其余从日期视图开始 */
export function initialViewOf(type: DatePickerType): ViewType {
  if (['year', 'years', 'yearrange'].includes(type)) return 'year';
  if (['month', 'months', 'monthrange'].includes(type)) return 'month';
  if (['quarter', 'quarters', 'quarterrange'].includes(type)) return 'quarter';
  return 'date';
}

/** 年份所在十年页的首年 */
function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

/** 年月折算成连续序号，便于比较左右面板的先后与间距 */
function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

/**
 * 面板导航：拥有当前视图、左右面板所示年月与十年页，维护「取消联动时左侧严格早于右侧」的约束。
 * 状态对外只读，翻页、切换视图、下钻、定位都走动作，约束在动作内部收口，面板不必再手动补齐。
 */
export function useDatePickerNavigation(options: DatePickerNavigationOptions) {
  const { type, disabled, showDual, isUnlinked, onPanelChange } = options;

  // 未定位前的固定基准月（1970 年 1 月），服务端与水合首帧一致；有绑定值、defaultValue 或挂载后再改为实际月份
  const leftYear = shallowRef(1970);
  const leftMonth = shallowRef(0);
  const leftPage = shallowRef(decadeOf(leftYear.value));
  // 取消联动时右面板的独立位置；联动时不读取，右侧由左侧推算
  const freeRightYear = shallowRef(leftYear.value);
  const freeRightMonth = shallowRef(leftMonth.value);
  const freeRightPage = shallowRef(leftPage.value + 10);
  const view = shallowRef<ViewType>(initialViewOf(type()));

  /** 以「年」为最小单位的范围类型：左右面板各显示一整年 */
  const isYearUnitRange = computed(() => ['monthrange', 'quarterrange'].includes(type()));

  /** 联动时右面板紧跟左面板：日期类型隔一个月，月 / 季度范围隔一年 */
  function linkedYear(): number {
    if (isYearUnitRange.value || leftMonth.value === 11) return leftYear.value + 1;
    return leftYear.value;
  }
  function linkedMonth(): number {
    if (type() === 'monthrange') return leftMonth.value;
    return leftMonth.value === 11 ? 0 : leftMonth.value + 1;
  }

  const rightYear = computed(() => (isUnlinked.value ? freeRightYear.value : linkedYear()));
  const rightMonth = computed(() => (isUnlinked.value ? freeRightMonth.value : linkedMonth()));
  const rightPage = computed(() => (isUnlinked.value ? freeRightPage.value : leftPage.value + 10));

  /**
   * 联动双面板的翻页步长倍数：两块面板一起平移一整屏，
   * 年视图 20 年、月 / 季度视图 2 年、日期视图 2 个月；
   * daterange 切到月 / 季度视图时左右同年，只平移 1 年，否则会跳过中间一年。
   * 单面板与取消联动时每次只走 1 个单位。
   */
  function linkedStep(): number {
    if (!showDual.value || isUnlinked.value) return 1;
    if ((view.value === 'month' || view.value === 'quarter') && !isYearUnitRange.value) return 1;
    return 2;
  }

  /** 左面板按月平移，自动跨年 */
  function shiftLeftMonth(delta: number) {
    const date = new Date(leftYear.value, leftMonth.value + delta, 1);
    leftYear.value = date.getFullYear();
    leftMonth.value = date.getMonth();
  }

  /** 右面板（取消联动时）按月平移，自动跨年 */
  function shiftRightMonth(delta: number) {
    const date = new Date(freeRightYear.value, freeRightMonth.value + delta, 1);
    freeRightYear.value = date.getFullYear();
    freeRightMonth.value = date.getMonth();
  }

  /**
   * 取消联动时左右面板能否再相互靠拢一步：靠拢后左侧仍须严格早于右侧。
   * unit 为 page 时按当前视图的翻页单位判断，为 year 时按跨年按钮判断（日期视图下间距须超过 12 个月）。
   */
  function canConverge(unit: 'page' | 'year' = 'page'): boolean {
    if (view.value === 'year') return leftPage.value + 10 < freeRightPage.value;
    if (isYearUnitRange.value) return leftYear.value + 1 < freeRightYear.value;
    const gap = view.value === 'date' && unit === 'page' ? 1 : 12;
    return monthIndex(leftYear.value, leftMonth.value) + gap < monthIndex(freeRightYear.value, freeRightMonth.value);
  }

  /**
   * 取消联动时保证左面板严格早于右面板：以 fixed 一侧为准，把另一侧推到紧邻位置。
   * 下钻、定位会直接改写某一侧，可能越过另一侧，这些动作改写后都会调用它。
   */
  function ensureOrder(fixed: PanelSide) {
    if (!isUnlinked.value) return;
    if (view.value === 'year') {
      if (leftPage.value < freeRightPage.value) return;
      if (fixed === 'left') freeRightPage.value = leftPage.value + 10;
      else leftPage.value = freeRightPage.value - 10;
      return;
    }
    if (isYearUnitRange.value) {
      if (leftYear.value < freeRightYear.value) return;
      if (fixed === 'left') freeRightYear.value = leftYear.value + 1;
      else leftYear.value = freeRightYear.value - 1;
      return;
    }
    if (monthIndex(leftYear.value, leftMonth.value) < monthIndex(freeRightYear.value, freeRightMonth.value)) return;
    if (fixed === 'left') {
      const date = new Date(leftYear.value, leftMonth.value + 1, 1);
      freeRightYear.value = date.getFullYear();
      freeRightMonth.value = date.getMonth();
    } else {
      const date = new Date(freeRightYear.value, freeRightMonth.value - 1, 1);
      leftYear.value = date.getFullYear();
      leftMonth.value = date.getMonth();
    }
  }

  /** 面板当前所示时间：年视图取十年页首年，其余取所示年月的 1 号 */
  function panelDate(side: PanelSide): Date {
    if (side === 'left') {
      if (view.value === 'year') return new Date(leftPage.value, 0, 1);
      return new Date(leftYear.value, leftMonth.value, 1);
    }
    if (view.value === 'year') return new Date(rightPage.value, 0, 1);
    return new Date(rightYear.value, rightMonth.value, 1);
  }

  /** 通报 panel-change：双面板回传左右两个日期，单面板回传一个 */
  function emitPanelChange(mode: PanelChangeMode) {
    const date: PanelChangeDate = showDual.value ? [panelDate('left'), panelDate('right')] : panelDate('left');
    onPanelChange(date, mode, view.value);
  }

  /**
   * 按方向平移一侧面板。unit 为 page 时按当前视图的翻页单位（十年 / 年 / 月），
   * 为 year 时固定跨一年（日期视图的双箭头）。
   */
  function movePanel(side: PanelSide, direction: 1 | -1, unit: 'page' | 'year') {
    const step = unit === 'year' || side === 'right' ? direction : linkedStep() * direction;
    const current = view.value;
    if (current === 'year') {
      if (side === 'right') freeRightPage.value += 10 * step;
      else leftPage.value += 10 * step;
    } else if (current !== 'date' || unit === 'year') {
      if (side === 'right') freeRightYear.value += step;
      else leftYear.value += step;
    } else if (side === 'right') {
      shiftRightMonth(step);
    } else {
      shiftLeftMonth(step);
    }
    emitPanelChange(current === 'date' && unit === 'page' ? 'month' : 'year');
  }

  /**
   * 头部翻页。联动时两侧一起走（右侧按钮也平移左侧，右侧随之推算）；
   * 取消联动时各走各的，朝对方靠拢的一步受「左侧严格早于右侧」约束。
   */
  function navigate(side: PanelSide, direction: 1 | -1, unit: 'page' | 'year') {
    if (disabled()) return;
    if (side === 'right' && isUnlinked.value) {
      if (direction > 0 || canConverge(unit)) movePanel('right', direction, unit);
      return;
    }
    if (direction > 0 && isUnlinked.value && !canConverge(unit)) return;
    movePanel('left', direction, unit);
  }

  /** 标题点击切换视图；切到年视图时十年页对齐到各面板所示年份，取消联动时右侧十年页须严格晚于左侧 */
  function switchView(next: ViewType) {
    if (view.value === next) return;
    if (next === 'year') {
      leftPage.value = decadeOf(leftYear.value);
      freeRightPage.value = Math.max(decadeOf(freeRightYear.value), leftPage.value + 10);
    }
    view.value = next;
    emitPanelChange(next === 'date' ? 'month' : 'year');
  }

  /** 年视图下钻到月 / 季度视图：取消联动时只改被点的那一侧 */
  function drillYear(side: PanelSide, year: number) {
    view.value = ['quarter', 'quarters', 'quarterrange'].includes(type()) ? 'quarter' : 'month';
    if (side === 'right' && isUnlinked.value) {
      freeRightYear.value = year;
      freeRightPage.value = decadeOf(year);
      ensureOrder('right');
    } else {
      // 联动的月 / 季度范围右侧恒比左侧晚一年，点右侧的年份时左侧落到前一年
      leftYear.value = side === 'right' && showDual.value && isYearUnitRange.value ? year - 1 : year;
      leftPage.value = decadeOf(leftYear.value);
      ensureOrder('left');
    }
    emitPanelChange('year');
  }

  /** 月视图下钻到日期视图（month 从 1 起）：取消联动时只改被点的那一侧 */
  function drillMonth(side: PanelSide, year: number, month: number) {
    view.value = 'date';
    if (side === 'right' && isUnlinked.value) {
      freeRightYear.value = year;
      freeRightMonth.value = month - 1;
      ensureOrder('right');
    } else {
      // 联动的日期范围右侧恒比左侧晚一个月，点右侧的月份时左侧落到前一个月
      const leftDate = new Date(year, side === 'right' && showDual.value ? month - 2 : month - 1, 1);
      leftYear.value = leftDate.getFullYear();
      leftMonth.value = leftDate.getMonth();
      ensureOrder('left');
    }
    emitPanelChange('month');
  }

  /** 左面板翻到日期所在年月，十年页不动（点补位格、单值快捷选项） */
  function showMonthOf(date: Date) {
    leftYear.value = date.getFullYear();
    leftMonth.value = date.getMonth();
  }

  /** 左面板定位到日期所在年月并对齐十年页；不传日期时只对齐十年页 */
  function focus(date: Date | null) {
    if (date) showMonthOf(date);
    leftPage.value = decadeOf(leftYear.value);
  }

  /** 右面板回到紧跟左面板的位置（联动时的相对关系） */
  function resetRightPanel() {
    freeRightYear.value = linkedYear();
    freeRightMonth.value = linkedMonth();
    freeRightPage.value = leftPage.value + 10;
  }

  // 取消联动后右面板是否已有独立位置：首次进入取消联动时需要先对齐到左侧
  let rightPanelInited = false;

  /**
   * 选中值变化后同步右面板：联动时恒紧跟左侧；
   * 取消联动时保留用户翻到的位置，仅当终点落在右面板之后才翻过去，保证选中的终点看得见。
   */
  function syncRight(end: Date | null) {
    if (!isUnlinked.value || !rightPanelInited) {
      resetRightPanel();
      rightPanelInited = isUnlinked.value;
    }
    if (isUnlinked.value && end) {
      const endYear = end.getFullYear();
      const endMonth = end.getMonth();
      const beyond = isYearUnitRange.value
        ? endYear > freeRightYear.value
        : monthIndex(endYear, endMonth) > monthIndex(freeRightYear.value, freeRightMonth.value);
      if (beyond) {
        freeRightYear.value = endYear;
        freeRightMonth.value = endMonth;
      }
      const endPage = decadeOf(endYear);
      if (endPage > freeRightPage.value) freeRightPage.value = endPage;
    }
    ensureOrder('left');
  }

  /** 丢弃右面板的独立位置后重新同步：类型、联动方式切换或回到今天时使用 */
  function realignRight(end: Date | null) {
    rightPanelInited = false;
    syncRight(end);
  }

  /**
   * 取消联动时把右面板定位到指定日期（defaultValue 的第二项）。联动时右面板恒紧跟左侧，不生效；
   * 指定日期不晚于左面板时仍以左侧为准把右面板推到紧邻位置，保证两侧不重叠。
   */
  function placeRight(date: Date) {
    if (!isUnlinked.value) return;
    freeRightYear.value = date.getFullYear();
    freeRightMonth.value = date.getMonth();
    freeRightPage.value = decadeOf(date.getFullYear());
    ensureOrder('left');
  }

  /** 视图回到类型对应的初始视图 */
  function resetView() {
    view.value = initialViewOf(type());
  }

  /** 头部描述：单面板只有左侧；联动双面板左侧只保留朝前的按钮，朝后的由右侧承担 */
  const headers = computed<PanelHeader[]>(() => {
    const unlinked = isUnlinked.value;
    const list: PanelHeader[] = [{
      side: 'left',
      year: leftYear.value,
      month: leftMonth.value,
      pageStart: leftPage.value,
      hidePrev: false,
      hideNext: showDual.value && !unlinked,
      disablePrev: false,
      disablePrevYear: false,
      disableNext: unlinked && !canConverge(),
      disableNextYear: unlinked && !canConverge('year'),
    }];
    if (showDual.value) {
      list.push({
        side: 'right',
        year: rightYear.value,
        month: rightMonth.value,
        pageStart: rightPage.value,
        hidePrev: !unlinked,
        hideNext: false,
        disablePrev: unlinked && !canConverge(),
        disablePrevYear: unlinked && !canConverge('year'),
        disableNext: false,
        disableNextYear: false,
      });
    }
    return list;
  });

  return {
    view: readonly(view),
    leftYear: readonly(leftYear),
    leftMonth: readonly(leftMonth),
    leftPage: readonly(leftPage),
    rightYear,
    rightMonth,
    rightPage,
    headers,
    navigate,
    switchView,
    drillYear,
    drillMonth,
    showMonthOf,
    focus,
    syncRight,
    realignRight,
    placeRight,
    resetView,
  };
}
