import type { Ref } from 'vue';
import type { DatePickerType } from './reborn-date-picker-panel.config';
import type { PanelSide } from './useDatePickerNavigation';
import { computed, readonly, shallowRef } from 'vue';
import { weekEndOf, weekStartOf } from './reborn-date-picker.utils';

export interface DatePickerRangeOptions {
  type: () => DatePickerType;
  /** 是否为范围类型（含 week） */
  isRange: Readonly<Ref<boolean>>;
  disabled: () => boolean;
}

/**
 * 范围选择的端点与悬停预览：年 / 月 / 季度 / 日期四种粒度共用一套点选规则。
 * 端点对外只读，点选、整体设定、清空、悬停都走动作；组装绑定值与派发事件由面板统一完成。
 */
export function useDatePickerRange(options: DatePickerRangeOptions) {
  const { type, isRange, disabled } = options;
  const start = shallowRef<Date | null>(null);
  const end = shallowRef<Date | null>(null);
  const hover = shallowRef<Date | null>(null);

  /** 范围带的另一端：已选终点优先，只选了起点时取悬停格；week 一次点选即成整周，不做预览 */
  const previewEnd = computed(() => end.value ?? (isRange.value && type() !== 'week' && start.value ? hover.value : null));

  /**
   * 点选一个端点。左侧（或单面板）先点起点、再点终点，终点早于起点时两端交换；
   * 已有完整范围时重新从起点开始。点右侧面板总是落到终点，缺起点时以此刻补上。
   * 周范围：起点吸附到所在周的周日、终点吸附到所在周的周六，绑定值始终覆盖完整的周。
   */
  function pick(date: Date, side: PanelSide) {
    if (side === 'right') {
      start.value ??= new Date();
      end.value = date;
      if (end.value < start.value) [start.value, end.value] = [end.value, start.value];
    } else if (!start.value || end.value) {
      start.value = date;
      end.value = null;
    } else if (date < start.value) {
      end.value = start.value;
      start.value = date;
    } else {
      end.value = date;
    }
    if (type() === 'weekrange' && start.value) {
      start.value = weekStartOf(start.value);
      if (end.value) end.value = weekEndOf(end.value);
    }
  }

  /** 直接采用给定的两端（绑定值、快捷选项、今天、整周），不做起止交换 */
  function setRange(nextStart: Date | null, nextEnd: Date | null) {
    start.value = nextStart;
    end.value = nextEnd;
  }

  /** 清空两端与悬停预览 */
  function reset() {
    start.value = null;
    end.value = null;
    hover.value = null;
  }

  /** 记录范围预览的悬停格；传 null（移出网格 / 悬停到禁用格）即收起预览 */
  function setHover(date: Date | null) {
    if (disabled() || !isRange.value) return;
    hover.value = date;
  }

  /** 切换视图时收起预览 */
  function clearHover() {
    hover.value = null;
  }

  return { start: readonly(start), end: readonly(end), previewEnd, pick, setRange, reset, setHover, clearHover };
}
