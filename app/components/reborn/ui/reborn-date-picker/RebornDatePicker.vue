<script setup lang="ts">
import type { ClassValue } from "clsx";
import type {
  DatePickerCell,
  DatePickerType,
  ViewType,
} from "../reborn-date-picker-panel/reborn-date-picker-panel.config";
import type { DatePickerPanelProps } from "../reborn-date-picker-panel/RebornDatePickerPanel.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type {
  datePickerColors,
  DatePickerFieldUI,
  datePickerSizes,
  datePickerVariants,
} from "./reborn-date-picker.config";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { computed, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import { DATE_PANEL_NESTED_OVERLAY_CLASS } from "../reborn-date-picker-panel/reborn-date-picker-panel.config";
import RebornDatePickerPanel from "../reborn-date-picker-panel/RebornDatePickerPanel.vue";
import RebornLoading from "../reborn-loading/RebornLoading.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";
import theme from "./reborn-date-picker.config";

dayjs.extend(customParseFormat);
// 季度的展示格式 YYYY-[Q]Q 依赖 Q 令牌，Q 由 advancedFormat 提供
dayjs.extend(advancedFormat);

const b = tv(theme);

defineOptions({ inheritAttrs: false });

/**
 * 日期选择器属性定义。
 * 触发器相关的属性与 RebornSelect 同名同义；面板相关的属性原样透传给 RebornDatePickerPanel。
 */
export interface DatePickerProps {
  /* ---------------- 面板透传 ---------------- */

  /** 选择器类型，与 RebornDatePickerPanel 相同：date / datetime / week / year / month 及其多选、范围变体 */
  type?: DatePickerType;
  /** 可选范围开始时间，早于它的日期不可选 */
  start?: DatePickerPanelProps["start"];
  /** 可选范围结束时间，晚于它的日期不可选 */
  end?: DatePickerPanelProps["end"];
  /** 逐项判定是否禁用，返回 true 即不可选；unit 标识判定粒度（date / week / month / quarter / year） */
  disabledMethod?: DatePickerPanelProps["disabledMethod"];
  /** 返回需禁用的小时数组，仅 datetime / datetimerange 生效 */
  disabledHours?: DatePickerPanelProps["disabledHours"];
  /** 返回需禁用的分钟数组，仅 datetime / datetimerange 生效 */
  disabledMinutes?: DatePickerPanelProps["disabledMinutes"];
  /** 返回需禁用的秒数组，仅 datetime / datetimerange 生效 */
  disabledSeconds?: DatePickerPanelProps["disabledSeconds"];
  /** 返回需禁用的毫秒数组，仅 datetime / datetimerange 生效 */
  disabledMilliseconds?: DatePickerPanelProps["disabledMilliseconds"];
  /** 面板选中态表现：fill 背景 / fillRound 背景正圆 / outline 描边加文字 / text 仅文字 */
  activeType?: DatePickerPanelProps["activeType"];
  /** 绑定值格式（dayjs 令牌）；为空时绑定值为 Date 对象 */
  valueFormat?: string;
  /** 面板左侧的快捷选项 */
  shortcuts?: DatePickerPanelProps["shortcuts"];
  /** 日期视图左侧显示 ISO 周数（week 类型不生效） */
  showWeekNumber?: boolean;
  /** 范围选择时取消两个面板之间的联动，左右面板各自翻页 */
  unlinkPanels?: boolean;
  /** 范围选择时只显示一个面板 */
  singlePanel?: boolean;
  /** 面板底部显示「今天」栏：点击选中当前时间所在的日 / 周 / 月 / 季度 / 年，文案随类型变为今天、此刻、本周、本月、本季度、今年 */
  showToday?: boolean;

  /* ---------------- 触发器（与 RebornSelect 对齐） ---------------- */

  /** 触发器内展示文本的格式（dayjs 令牌），只影响展示、不影响绑定值；缺省时按 type 取默认格式 */
  format?: string;
  /** 占位符文本；缺省时按 type 给出，如「请选择日期」「请选择月份」 */
  placeholder?: string;
  /** 范围类型开始一栏的占位文本；缺省时按 type 给出，如「开始日期」「开始月份」 */
  startPlaceholder?: string;
  /** 范围类型结束一栏的占位文本；缺省时按 type 给出，如「结束日期」「结束月份」 */
  endPlaceholder?: string;
  /** 范围类型（含 week）起止之间的分隔符 */
  rangeSeparator?: string;
  /** 多选类型把超出的标签合并为一段 “+N” 文字 */
  collapseTags?: boolean;
  /** 折叠文字悬停时以气泡展示被折叠的具体日期（需先开启 collapseTags） */
  collapseTagsTooltip?: boolean;
  /** 折叠前最多展示的标签个数，仅在 collapseTags 开启时生效 */
  maxCollapseTags?: number;
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 是否显示清空按钮 */
  clearable?: boolean;
  /** 加载中：触发器箭头替换为转圈图标并隐藏清空按钮；日期面板照常可操作 */
  loading?: boolean;
  /** 尺寸规格，同时下发给日期面板 */
  size?: (typeof datePickerSizes)[number];
  /** 颜色，决定触发器聚焦 / 展开描边色，同时下发给日期面板决定选中色 */
  color?: (typeof datePickerColors)[number];
  /** 形态变体：描边 / 填充 / 无边框 / 下划线 */
  variant?: (typeof datePickerVariants)[number];
  /** 自定义类名 */
  class?: any;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /** 箭头图标名 */
  icon?: string;
  /**
   * 关闭下拉的时机（透传给 RebornSelectTrigger）：
   * - 'click'：在触发器外完成一次点击后才收起（默认）
   * - 'mousedown'：外部按下即收——面板外按下左键 / 右键 / 中键立即收起，
   *   面板外的页面滚动同样收起；面板内部的滚动不受影响
   */
  closeOn?: SelectTriggerProps["closeOn"];
  /**
   * 浮层是否传送到 body（默认 true）。
   * 关掉后浮层留在触发器内，会随父容器一起滚动、也一起被 overflow 裁剪。
   */
  portal?: SelectTriggerProps["portal"];
  /** 下拉框是否自动调整位置：下方空间不足且上方更宽裕时向上展开；关闭后固定向下 */
  autoAdjustOverflow?: SelectTriggerProps["autoAdjustOverflow"];
  /** 触发器 UI 配置：触发器盒子与浮层的键混写在一起，组件内部自动拆分下发 */
  triggerUi?: SelectTriggerProps["ui"] & DatePickerFieldUI;
  /** 日期面板的 UI 配置，原样透传给 RebornDatePickerPanel 的 ui */
  panelUi?: DatePickerPanelProps["ui"];
  /** 下拉浮层内部与多选标签的 UI 微调配置 */
  ui?: Partial<{
    panel: ClassValue;
    dropdownHeader: ClassValue;
    dropdownFooter: ClassValue;
    tagList: ClassValue;
    tag: ClassValue;
    tagLabel: ClassValue;
    tagClose: ClassValue;
    tagCloseIcon: ClassValue;
    collapseTag: ClassValue;
  }>;
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  type: "date",
  start: "1970-01-01",
  end: "2099-12-31",
  activeType: "fill",
  valueFormat: "",
  shortcuts: () => [],
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
  format: "",
  rangeSeparator: "至",
  collapseTags: false,
  collapseTagsTooltip: false,
  maxCollapseTags: 1,
  disabled: false,
  clearable: true,
  loading: false,
  size: "md",
  color: "primary",
  variant: "outlined",
  showArrow: true,
  arrowAnimation: true,
  icon: "lucide:calendar",
  closeOn: "click",
  portal: true,
  autoAdjustOverflow: true,
});

/**
 * 事件发送器：前四个与 RebornSelect 同名同义，后两个由日期面板原样转发
 */
const emit = defineEmits<{
  /** 绑定值提交时触发（清空也会触发） */
  (e: "change", value: any): void;
  /** 多选类型下移除单个标签，回传被移除的值 */
  (e: "remove-tag", value: any): void;
  /** 点击清空按钮 */
  (e: "clear"): void;
  /** 下拉框展开 / 收起 */
  (e: "visible-change", visible: boolean): void;
  /** 范围类型点选日期时触发：第一次点选只有开始日期，结束日期为 null */
  (e: "calendar-change", value: [Date, Date | null]): void;
  /** 面板翻页、切换视图或下钻时触发，参数含义与 RebornDatePickerPanel 相同 */
  (e: "panel-change", date: Date | [Date, Date], mode: "month" | "year", view: ViewType): void;
}>();

/** 触发器内容插槽（cover / default）的作用域参数 */
interface TriggerSlotProps {
  /** 当前值格式化后的展示文本，多选以「、」连接，范围以分隔符连接 */
  displayText: string;
  /** 实际生效的占位文本 */
  placeholder: string;
  /** 下拉框是否展开 */
  isOpen: boolean;
  /** 样式函数表，可复用组件内置的触发器类名（键名即主题 slots，写死键名才能在插槽里直接调用而不必判空） */
  ui: Record<keyof typeof theme.slots, (opts?: { class?: any }) => string>;
}

defineSlots<{
  /** 完全接管触发器内部（连同尾部图标区） */
  cover?: (props: TriggerSlotProps) => any;
  /** 自定义触发器的文本区，尾部图标区保留 */
  default?: (props: TriggerSlotProps) => any;
  /** 面板上方的页头 */
  header?: () => any;
  /** 面板下方的页脚 */
  footer?: () => any;
  /** 自定义单元格内容，对应 RebornDatePickerPanel 的 default 插槽 */
  cell?: (props: DatePickerCell) => any;
  /** 上个月图标 */
  "prev-month"?: () => any;
  /** 下个月图标 */
  "next-month"?: () => any;
  /** 上一年图标 */
  "prev-year"?: () => any;
  /** 下一年图标 */
  "next-year"?: () => any;
}>();

/**
 * 绑定值（v-model）：形态随 type 变化——单值类型为单个日期，多选与范围类型（含 week）为数组；
 * 元素是 Date 对象还是字符串由 valueFormat 决定。未传入时回落为 null，与单值清空后的取值一致。
 */
const model = defineModel<any>({ default: null });

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

/** 下拉框是否展开 */
const isOpen = ref(false);

/**
 * 面板上的草稿值。
 * 范围类型点完开始日期、还没点结束日期时，这个半成品只能留在面板里，不能写回 v-model——
 * 否则外部会收到 ["2024-01-01", ""] 这种不完整的值。提交时机见 onPanelUpdate / onPanelChange。
 */
const draft = ref<any>(model.value);
watch(model, (v) => {
  draft.value = v;
});

/* ---------------- 类型判定（与面板内部的划分一致） ---------------- */

/** 多选类型：点一次切换一项，面板不关闭 */
const isMultiple = computed(() =>
  ["dates", "months", "years", "quarters"].includes(props.type),
);
/** 双面板范围类型：触发器显示开始 / 结束两栏 */
const isDual = computed(() =>
  ["daterange", "datetimerange", "monthrange", "quarterrange", "yearrange"].includes(props.type),
);
/** 按周选择：绑定值是这一周的 [周日, 周六] */
const isWeek = computed(() => props.type === "week");
/** 带时间的类型：面板内要调时分秒，选完日期不能立即关闭 */
const hasTime = computed(() => ["datetime", "datetimerange"].includes(props.type));
/** 绑定值是否为数组 */
const isArrayValue = computed(() => isMultiple.value || isDual.value || isWeek.value);

/* ---------------- 展示文本 ---------------- */

/** 展示格式：显式 format 优先，否则按类型取默认值 */
const displayFormat = computed(() => {
  if (props.format) return props.format;
  const t = props.type;
  if (t.startsWith("year")) return "YYYY";
  if (t.startsWith("month")) return "YYYY-MM";
  if (t.startsWith("quarter")) return "YYYY-[Q]Q";
  if (t.startsWith("datetime")) return "YYYY-MM-DD HH:mm:ss";
  return "YYYY-MM-DD";
});

/** 按类型推导的占位文本：[单值占位, 开始占位, 结束占位] */
const placeholderByType = computed<[string, string, string]>(() => {
  const t = props.type;
  if (t.startsWith("year")) return ["请选择年份", "开始年份", "结束年份"];
  if (t.startsWith("month")) return ["请选择月份", "开始月份", "结束月份"];
  if (t.startsWith("quarter")) return ["请选择季度", "开始季度", "结束季度"];
  if (t === "week") return ["请选择周", "开始日期", "结束日期"];
  if (t.startsWith("datetime")) return ["请选择日期时间", "开始时间", "结束时间"];
  return ["请选择日期", "开始日期", "结束日期"];
});
const placeholderText = computed(() => props.placeholder ?? placeholderByType.value[0]);
const startPlaceholderText = computed(
  () => props.startPlaceholder ?? placeholderByType.value[1],
);
const endPlaceholderText = computed(() => props.endPlaceholder ?? placeholderByType.value[2]);

/** 季度的起始日期：第 q 季度从 (q-1)*3 月 1 号开始 */
function quarterStartDate(year: number, q: number): Date {
  return new Date(year, (q - 1) * 3, 1);
}

/**
 * 把绑定值里的单个元素解析为 Date，规则与面板内部相同：
 * Date 原样返回；带 Q 令牌的 valueFormat 手动取年份与季号（customParseFormat 不认 Q）；其余交给 dayjs。
 */
function parseValue(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (props.valueFormat && props.valueFormat.includes("Q")) {
    const m = String(v).match(/(\d{4})\D*([1-4])/);
    if (m) return quarterStartDate(Number(m[1]), Number(m[2]));
  }
  const d = props.valueFormat ? dayjs(v, props.valueFormat) : dayjs(v);
  return d.isValid() ? d.toDate() : null;
}

/** 单个元素的展示文本；解析失败时原样转字符串，避免值被静默吞掉 */
function formatItem(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  const d = parseValue(v);
  return d ? dayjs(d).format(displayFormat.value) : String(v);
}

/** 范围类型（含 week）的起止两段文本 */
const rangeTexts = computed<[string, string]>(() => {
  const v = Array.isArray(model.value) ? model.value : [];
  return [formatItem(v[0]), formatItem(v[1])];
});

/** 多选类型的标签列表，index 用于按位移除（同一日期不会重复出现，但 key 仍带上 index 兜底） */
const tags = computed(() => {
  if (!isMultiple.value || !Array.isArray(model.value)) return [];
  return model.value.map((value: any, index: number) => ({
    index,
    value,
    label: formatItem(value),
  }));
});

/** 当前值的展示文本，同时作为 cover / default 插槽的 displayText */
const displayText = computed(() => {
  if (isMultiple.value) return tags.value.map((t: { label: string }) => t.label).join("、");
  if (isDual.value || isWeek.value) {
    const [s, e] = rangeTexts.value;
    return s || e ? `${s} ${props.rangeSeparator} ${e}` : "";
  }
  return formatItem(model.value);
});

/** 值是否非空：数组要求至少一个元素有值，单值排除 null / undefined / 空串 */
function hasValue(v: any): boolean {
  if (Array.isArray(v)) return v.some(Boolean);
  return v !== null && v !== undefined && v !== "";
}

const showClearButton = computed(() => {
  if (props.loading) return false;
  return props.clearable && hasValue(model.value);
});

/** 多选标签换行：多选且未开启 collapse-tags 时逐行铺开 */
const wrapTags = computed(
  () => isMultiple.value && !props.collapseTags && tags.value.length > 0,
);

/** 实际展示的标签（开启 collapse-tags 时只保留前 maxCollapseTags 个） */
const visibleTags = computed(() => {
  if (!props.collapseTags) return tags.value;
  return tags.value.slice(0, Math.max(0, props.maxCollapseTags));
});

/** 被折叠掉的标签，用于 “+N” 标签与其悬停气泡 */
const collapsedTags = computed(() =>
  props.collapseTags ? tags.value.slice(Math.max(0, props.maxCollapseTags)) : [],
);

/** 折叠气泡里的文案 */
const collapsedText = computed(() =>
  collapsedTags.value.map((t: { label: string }) => t.label).join("、"),
);

/* ---------------- 样式 ---------------- */

const splitUi = computed(() => splitTriggerUi(props.triggerUi));
/**
 * 浮层配置。宽度改为贴合日期面板：覆盖传送模式的 min-w-[触发器宽度] 与行内模式的 w-full，
 * 否则触发器比面板宽时右侧留出大片空白，比面板窄时面板被挤压。
 */
const overlayUi = computed(() => ({
  ...splitUi.value.overlay,
  dropdown: cn("w-max min-w-0", splitUi.value.overlay.dropdown),
}));
const fieldUi = computed(() => splitUi.value.field as DatePickerFieldUI);
const uiOverrides = computed(() => props.ui || {});

/**
 * 生成符合 UI 规范的样式映射表。
 * 触发器盒子（trigger / triggerText / …）的覆盖来自 triggerUi，
 * 浮层内部与标签的覆盖来自 ui，日期面板内部的覆盖来自 panelUi，三条通道互不干扰。
 */
const ui = computed(() => {
  const styles = b({
    size: fieldGroupSize.value || props.size,
    color: props.color,
    variant: props.variant,
    multiple: isMultiple.value,
    wrapTags: wrapTags.value,
    // 箭头旋转受 arrowAnimation 控制；展开态的描边色走 data-state，不依赖该变体
    open: isOpen.value && props.arrowAnimation,
    clearable: showClearButton.value,
    disabled: isDisabled.value,
    error: isError.value,
  });
  const field = fieldUi.value;
  return {
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, field.trigger) }),
    triggerText: (opts?: { class?: any }) =>
      styles.triggerText({ class: cn(opts?.class, field.triggerText) }),
    triggerIconWrapper: (opts?: { class?: any }) =>
      styles.triggerIconWrapper({ class: cn(opts?.class, field.triggerIconWrapper) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, field.placeholder) }),
    clearBtn: (opts?: { class?: any }) =>
      styles.clearBtn({ class: cn(opts?.class, field.clearBtn) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, field.arrow) }),
    triggerLoadingIcon: (opts?: { class?: any }) =>
      styles.triggerLoadingIcon({ class: cn(opts?.class, field.triggerLoadingIcon) }),
    rangeWrapper: (opts?: { class?: any }) =>
      styles.rangeWrapper({ class: cn(opts?.class, field.rangeWrapper) }),
    rangeText: (opts?: { class?: any }) =>
      styles.rangeText({ class: cn(opts?.class, field.rangeText) }),
    rangeSeparator: (opts?: { class?: any }) =>
      styles.rangeSeparator({ class: cn(opts?.class, field.rangeSeparator) }),
    panel: (opts?: { class?: any }) =>
      styles.panel({ class: cn(opts?.class, uiOverrides.value.panel) }),
    dropdownHeader: (opts?: { class?: any }) =>
      styles.dropdownHeader({ class: cn(opts?.class, uiOverrides.value.dropdownHeader) }),
    dropdownFooter: (opts?: { class?: any }) =>
      styles.dropdownFooter({ class: cn(opts?.class, uiOverrides.value.dropdownFooter) }),
    tagList: (opts?: { class?: any }) =>
      styles.tagList({ class: cn(opts?.class, uiOverrides.value.tagList) }),
    tag: (opts?: { class?: any }) =>
      styles.tag({ class: cn(opts?.class, uiOverrides.value.tag) }),
    tagLabel: (opts?: { class?: any }) =>
      styles.tagLabel({ class: cn(opts?.class, uiOverrides.value.tagLabel) }),
    tagClose: (opts?: { class?: any }) =>
      styles.tagClose({ class: cn(opts?.class, uiOverrides.value.tagClose) }),
    tagCloseIcon: (opts?: { class?: any }) =>
      styles.tagCloseIcon({ class: cn(opts?.class, uiOverrides.value.tagCloseIcon) }),
    collapseTag: (opts?: { class?: any }) =>
      styles.collapseTag({ class: cn(opts?.class, uiOverrides.value.collapseTag) }),
  };
});

/* ---------------- 交互 ---------------- */

/** 两个绑定值是否等价：Date 按时间戳比，数组逐项比，其余按字符串比 */
function isSameValue(a: any, b: any): boolean {
  const key = (v: any): string => {
    if (Array.isArray(v)) return v.map(key).join("|");
    if (v instanceof Date) return String(v.getTime());
    return v === null || v === undefined ? "" : String(v);
  };
  return key(a) === key(b);
}

/** 把值写回 v-model 并抛出 change */
function commit(val: any) {
  model.value = val;
  emit("change", val);
  validate("change");
}

/**
 * 面板值变化（对应面板的 update:modelValue）。
 * - 多选类型：面板只抛 update 不抛 change，每点一项直接提交，面板保持展开以便继续勾选
 * - 带时间的类型：调时分秒也只抛 update，值完整（范围类型起止都有）即提交，且与当前值相同时不重复抛 change，
 *   避免滚动时间列时 change 连续触发；面板不自动关闭，点外部收起
 * - 其余类型：只记草稿，等面板抛 change 再提交
 */
function onPanelUpdate(val: any) {
  draft.value = val;
  if (isMultiple.value) {
    commit(val);
    return;
  }
  if (hasTime.value) {
    const complete = isDual.value
      ? Array.isArray(val) && !!val[0] && !!val[1]
      : hasValue(val);
    if (complete && !isSameValue(val, model.value)) commit(val);
  }
}

/**
 * 面板完成一次选择（对应面板的 change）：单值、范围、按周三类在这里提交并收起。
 * 多选与带时间的类型已在 onPanelUpdate 中提交，这里忽略，否则会重复抛 change。
 */
function onPanelChange(val: any) {
  if (isMultiple.value || hasTime.value) return;
  commit(val);
  isOpen.value = false;
}

/**
 * 多选类型下移除单个标签
 */
function removeTag(index: number, e: Event) {
  e.stopPropagation();
  if (isDisabled.value) return;
  const source: any[] = Array.isArray(model.value) ? model.value : [];
  const removed = source[index];
  const newValue = source.filter((_, i) => i !== index);
  model.value = newValue;
  emit("remove-tag", removed);
  emit("change", newValue);
  validate("change");
}

// 展开时用当前绑定值重置草稿，丢弃上一次没有选完的范围半成品
watch(isOpen, (open) => {
  if (open) draft.value = model.value;
  emit("visible-change", open);
});

/**
 * 切换下拉框展开状态
 */
function toggle() {
  if (isDisabled.value) return;
  isOpen.value = !isOpen.value;
}

/**
 * 清空绑定值：多选与范围类型（含 week）回到空数组，单值类型回到 null
 */
function clear(e?: Event) {
  e?.stopPropagation();
  const newValue = isArrayValue.value ? [] : null;
  model.value = newValue;
  emit("clear");
  emit("change", newValue);
  validate("change");
}

/**
 * 触发器外部事件（由 RebornSelectTrigger 按 closeOn 时机上报）关闭下拉框。
 * 带时间的类型会在面板里再弹出时间选择浮层，它同样传送到 body、不在本浮层之内；
 * 在它上面的点击 / 滚动必须放行，否则一调时间整个日期面板就被收起。
 */
function onOutsideClose(event?: Event) {
  const target = event?.target;
  if (target instanceof Element && target.closest(`.${DATE_PANEL_NESTED_OVERLAY_CLASS}`)) return;
  if (isOpen.value) {
    isOpen.value = false;
    validate("blur");
  }
}

/**
 * 键盘交互：收起时 ↓ / Enter / 空格展开，展开时 Esc 收起
 */
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    isOpen.value = false;
  }
}

defineExpose({
  /** 清空绑定值，触发 clear 与 change */
  clear,
});
</script>

<template>
  <RebornSelectTrigger
    :class="props.class"
    :is-open="isOpen"
    :disabled="isDisabled"
    :size="fieldGroupSize || size"
    :ui="overlayUi"
    :close-on="closeOn"
    :portal="portal"
    :auto-adjust-overflow="autoAdjustOverflow"
    @keydown="onKeydown"
    @close="onOutsideClose"
  >
    <template #trigger>
      <div
        :class="ui.trigger()"
        :data-state="isOpen ? 'open' : 'closed'"
        @click="toggle"
      >
        <slot
          v-if="$slots.cover"
          name="cover"
          :display-text="displayText"
          :placeholder="placeholderText"
          :is-open="isOpen"
          :ui="ui"
        />
        <template v-else>
          <slot
            :display-text="displayText"
            :placeholder="placeholderText"
            :is-open="isOpen"
            :ui="ui"
          >
            <!-- 多选类型：标签列表 -->
            <div
              v-if="isMultiple && tags.length"
              :class="ui.tagList()"
            >
              <RebornBadge
                v-for="item in visibleTags"
                :key="`${item.index}-${item.label}`"
                :label="item.label"
                color="neutral"
                variant="subtle"
                size="sm"
                :closable="!isDisabled"
                close-icon="lucide:x"
                :ui="{
                  root: 'min-w-0 shrink-0 max-w-full',
                  base: ui.tag(),
                  label: ui.tagLabel(),
                  closeButton: ui.tagClose(),
                  closeIcon: ui.tagCloseIcon(),
                }"
                @close="removeTag(item.index, $event)"
              />
              <RebornTooltip
                v-if="collapsedTags.length && collapseTagsTooltip"
                :content="collapsedText"
              >
                <RebornBadge
                  :label="`+${collapsedTags.length}`"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  :ui="{
                    root: 'min-w-0 shrink-0',
                    base: ui.tag({ class: ui.collapseTag() }),
                    label: ui.tagLabel(),
                  }"
                />
              </RebornTooltip>
              <RebornBadge
                v-else-if="collapsedTags.length"
                :label="`+${collapsedTags.length}`"
                color="neutral"
                variant="subtle"
                size="sm"
                :ui="{
                  root: 'min-w-0 shrink-0',
                  base: ui.tag({ class: ui.collapseTag() }),
                  label: ui.tagLabel(),
                }"
              />
            </div>
            <!-- 双面板范围类型：开始 / 结束两栏，未选的一栏显示对应占位 -->
            <div
              v-else-if="isDual"
              :class="ui.rangeWrapper()"
            >
              <span :class="ui.rangeText({ class: rangeTexts[0] ? undefined : ui.placeholder() })">
                {{ rangeTexts[0] || startPlaceholderText }}
              </span>
              <span :class="ui.rangeSeparator()">{{ rangeSeparator }}</span>
              <span :class="ui.rangeText({ class: rangeTexts[1] ? undefined : ui.placeholder() })">
                {{ rangeTexts[1] || endPlaceholderText }}
              </span>
            </div>
            <span
              v-else-if="displayText"
              :class="ui.triggerText()"
            >{{ displayText }}</span>
            <span
              v-else
              :class="ui.placeholder()"
            >{{ placeholderText }}</span>
          </slot>
          <div
            v-if="showArrow || showClearButton || loading"
            :class="ui.triggerIconWrapper()"
          >
            <RebornLoading
              v-if="loading"
              type="ring"
              color="currentColor"
              size="100%"
              :class="ui.triggerLoadingIcon()"
            />
            <Icon
              v-else-if="showArrow"
              :name="icon"
              :class="ui.arrow()"
            />
            <span
              v-if="showClearButton"
              :class="ui.clearBtn({ class: showArrow ? undefined : 'static flex' })"
              @click.stop="clear"
            >
              <Icon
                name="lucide:x"
                class="size-full"
              />
            </span>
          </div>
        </template>
      </div>
    </template>

    <template #content>
      <div
        v-if="$slots.header"
        :class="ui.dropdownHeader()"
      >
        <slot name="header" />
      </div>
      <div :class="ui.panel()">
        <RebornDatePickerPanel
          :model-value="draft"
          :type="type"
          :start="start"
          :end="end"
          :disabled-method="disabledMethod"
          :disabled-hours="disabledHours"
          :disabled-minutes="disabledMinutes"
          :disabled-seconds="disabledSeconds"
          :disabled-milliseconds="disabledMilliseconds"
          :active-type="activeType"
          :value-format="valueFormat"
          :shortcuts="shortcuts"
          :show-week-number="showWeekNumber"
          :unlink-panels="unlinkPanels"
          :single-panel="singlePanel"
          :show-today="showToday"
          :size="fieldGroupSize || size"
          :color="color"
          :border="false"
          :ui="panelUi"
          @update:model-value="onPanelUpdate"
          @change="onPanelChange"
          @calendar-change="emit('calendar-change', $event)"
          @panel-change="(date, mode, view) => emit('panel-change', date, mode, view)"
        >
          <template
            v-if="$slots.cell"
            #default="cell"
          >
            <slot
              name="cell"
              v-bind="cell"
            />
          </template>
          <template
            v-if="$slots['prev-month']"
            #prev-month
          >
            <slot name="prev-month" />
          </template>
          <template
            v-if="$slots['next-month']"
            #next-month
          >
            <slot name="next-month" />
          </template>
          <template
            v-if="$slots['prev-year']"
            #prev-year
          >
            <slot name="prev-year" />
          </template>
          <template
            v-if="$slots['next-year']"
            #next-year
          >
            <slot name="next-year" />
          </template>
        </RebornDatePickerPanel>
      </div>
      <div
        v-if="$slots.footer"
        :class="ui.dropdownFooter()"
      >
        <slot name="footer" />
      </div>
    </template>
  </RebornSelectTrigger>
</template>
