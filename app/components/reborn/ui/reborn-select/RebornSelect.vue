<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { selectColors, selectSizes, selectVariants } from "./reborn-select.config";
import type { SelectFieldUI } from "./reborn-select.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";
import RebornLoading from "../reborn-loading/RebornLoading.vue";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

/**
 * 下拉选择选项定义
 */
export interface SelectOption {
  /** 选项展示文本 */
  label: string;
  /** 选项实际值 */
  value: any;
  /** 是否禁用该选项 */
  disabled?: boolean;
  /** 其他自定义属性 */
  [key: string]: any;
}

/**
 * 下拉选择属性定义
 */
export interface SelectProps {
  /** 选中值 */
  modelValue?: any;
  /** 是否开启多选模式，开启后 v-model 的值为选中值组成的数组 */
  multiple?: boolean;
  /** 多选时把超出的标签合并为一段 “+N” 文字 */
  collapseTags?: boolean;
  /** 折叠文字悬停时以气泡展示被折叠的具体选项（需先开启 collapseTags） */
  collapseTagsTooltip?: boolean;
  /** 折叠前最多展示的标签个数，仅在 collapseTags 开启时生效 */
  maxCollapseTags?: number;
  /** 多选时最多可选个数，0 为不限制 */
  multipleLimit?: number;
  /** 数据源选项 */
  options?: SelectOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 是否禁用组件 */
  disabled?: boolean;
  /** 是否显示清空按钮 */
  clearable?: boolean;
  /** 加载中：触发器箭头替换为转圈图标，下拉面板改为加载中占位 */
  loading?: boolean;
  /** 是否允许在触发器内输入关键词搜索选项 */
  allowSearch?: boolean;
  /**
   * 选项过滤规则，需配合 allowSearch 使用：
   * - `true`：按选项 label 做不区分大小写的包含匹配（默认）
   * - `false`：关闭本地过滤，列表完全由外部 options 决定，用于远程搜索
   * - 函数：自定义匹配规则，返回 true 表示保留该选项
   */
  filterOption?: boolean | ((inputValue: string, option: SelectOption) => boolean);
  /**
   * 大数据量下开启虚拟滚动 + 虚拟列表：
   * 只渲染可视区域内的选项，DOM 数量与数据量解耦，上万条也能秒开。
   * 代价是每一项的高度必须恒定，由 virtualItemHeight 给出。
   */
  virtual?: boolean;
  /**
   * 虚拟列表单项占位高度（px，含项与项之间的 4px 间距），默认 33 —— 正是 md 尺寸下选项的实测步长。
   * 若通过 ui.option 改了选项的字号 / 内边距，必须同步改这里，否则滚动条与内容会错位。
   */
  virtualItemHeight?: number;
  /** 虚拟列表上下各多渲染几项，用于抵消快速滚动时的白屏，默认 4 */
  virtualBuffer?: number;
  /** 尺寸规格 */
  size?: (typeof selectSizes)[number];
  /** 颜色 */
  color?: (typeof selectColors)[number];
  /** 形态变体：描边 / 填充 / 无边框 / 下划线 */
  variant?: (typeof selectVariants)[number];
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
   *   面板外的页面滚动同样收起；面板内部的列表滚动不受影响
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
  triggerUi?: SelectTriggerProps["ui"] & SelectFieldUI;
  /** 下拉列表内部组件的 UI 微调配置 */
  ui?: Partial<{
    option: ClassValue;
    optionContent: ClassValue;
    optionLabel: ClassValue;
    optionActive: ClassValue;
    optionActiveIcon: ClassValue;
    optionHighlight: ClassValue;
    empty: ClassValue;
    dropdown: ClassValue;
    dropdownHeader: ClassValue;
    dropdownFooter: ClassValue;
    loading: ClassValue;
    loadingIcon: ClassValue;
    optionList: ClassValue;
    virtualPhantom: ClassValue;
    virtualWindow: ClassValue;
    tagList: ClassValue;
    tag: ClassValue;
    tagLabel: ClassValue;
    tagClose: ClassValue;
    tagCloseIcon: ClassValue;
    collapseTag: ClassValue;
  }>;
}

const props = withDefaults(defineProps<SelectProps>(), {
  modelValue: null,
  multiple: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  maxCollapseTags: 1,
  multipleLimit: 0,
  options: () => [],
  placeholder: "请选择",
  disabled: false,
  clearable: true,
  loading: false,
  allowSearch: false,
  filterOption: true,
  virtual: false,
  virtualItemHeight: 33,
  virtualBuffer: 4,
  size: "md",
  color: "primary",
  variant: "outlined",
  showArrow: true,
  arrowAnimation: true,
  icon: "lucide:chevron-down",
  closeOn: "click",
  portal: true,
  autoAdjustOverflow: true,
});

/**
 * 事件发送器
 */
const emit = defineEmits<{
  /** 绑定值更新事件 */
  (e: "update:modelValue", value: any): void;
  /** 选择变动事件 */
  (e: "change", value: any): void;
  /** 多选模式下移除单个标签，回传被移除的值 */
  (e: "remove-tag", value: any): void;
  /** 点击清空按钮 */
  (e: "clear"): void;
  /** 下拉框展开 / 收起 */
  (e: "visible-change", visible: boolean): void;
  /** 下拉菜单选项列表滚动，回传原生滚动事件，可用于无限滚动 / 懒加载 */
  (e: "dropdown-scroll", event: Event): void;
  /** 搜索关键词变化（allowSearch 开启时），配合 filter-option=false 可做远程搜索 */
  (e: "search", value: string): void;
}>();

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

/** 下拉框是否展开 */
const isOpen = ref(false);
/** 当前高亮（焦点）选项的索引 */
const highlightIndex = ref(-1);
/** 选项列表滚动容器 */
const listRef = ref<HTMLElement | null>(null);
/** 展开动画结束后才响应鼠标高亮 */
const dropdownReady = ref(false);
/** 搜索关键词（allowSearch 开启时由触发器内的输入框维护） */
const searchValue = ref("");
/** 触发器内的搜索输入框 */
const searchInputRef = ref<HTMLInputElement | null>(null);

/** 当前是否处于搜索输入态：开启 allowSearch 且下拉已展开 */
const isSearching = computed(() => props.allowSearch && isOpen.value);

/**
 * 是否展示清空按钮。
 * 它同时决定 clearable 变体（箭头悬停淡出 / 清空按钮盖上来），因此必须先于 ui 声明。
 * 加载中时不出清空按钮：它与转圈图标共用尾部那一格，同时出现会互相遮挡。
 */
const showClearButton = computed(() => {
  if (props.loading) return false;
  const isEmpty =
    props.modelValue === null || props.modelValue === undefined || props.modelValue === "";
  return props.clearable && (props.multiple ? props.modelValue?.length > 0 : !isEmpty);
});

/**
 * 当前已选中的选项对象列表。
 * 必须先于 ui 声明：它同时决定 wrapTags 变体（多选标签是否换行铺开）。
 */
const selectedOptions = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.options.filter((o) => props.modelValue.includes(o.value));
  }
  const opt = props.options.find((o) => o.value === props.modelValue);
  return opt ? [opt] : [];
});

/**
 * 多选标签是否换行全部展示。
 * 未开启 collapse-tags 时标签不再单行裁剪，而是逐行铺开、触发器高度随之增长；
 * 尚无已选项时保持固定高度，避免空态比其他档位高出 1px。
 */
const wrapTags = computed(
  () => props.multiple && !props.collapseTags && selectedOptions.value.length > 0,
);

/**
 * 实际渲染到下拉列表里的选项。
 * 未开启 allowSearch、关键词为空、或显式 filter-option=false（远程搜索，列表由外部数据源决定）时，
 * 原样透出 options；filterOption 为函数时用它自定义匹配，否则按 label 做不区分大小写的包含匹配。
 */
const filteredOptions = computed(() => {
  const keyword = searchValue.value.trim();
  if (!props.allowSearch || !keyword || props.filterOption === false) return props.options;

  if (typeof props.filterOption === "function") {
    const match = props.filterOption;
    return props.options.filter((option) => match(keyword, option));
  }

  const lower = keyword.toLowerCase();
  return props.options.filter((option) =>
    String(option.label ?? "").toLowerCase().includes(lower),
  );
});

/* ---------------- 虚拟滚动 ---------------- */

/** 列表容器当前的滚动距离，虚拟模式下由 scroll 事件驱动窗口位移 */
const scrollTop = ref(0);
/** 列表容器的可视高度，展开后实测；拿不到时退回 max-h-60 的 240px */
const viewportHeight = ref(240);

/** 虚拟列表的占位总高度：数据量 × 单项步长，撑出真实滚动条 */
const virtualTotalHeight = computed(() => filteredOptions.value.length * props.virtualItemHeight);

/**
 * 当前应当渲染的选项区间 [start, end)。
 * 上下各多留 virtualBuffer 项，快速拖动滚动条时才不会先看到一片空白再补齐。
 */
const virtualRange = computed(() => {
  const total = filteredOptions.value.length;
  if (!props.virtual) return { start: 0, end: total };

  const h = props.virtualItemHeight;
  const buffer = props.virtualBuffer;
  const start = Math.max(0, Math.floor(scrollTop.value / h) - buffer);
  const visibleCount = Math.ceil(viewportHeight.value / h) + buffer * 2;
  return { start, end: Math.min(total, start + visibleCount) };
});

/**
 * 真正进入 v-for 的行数据。
 * 一律带上真实索引：高亮、锚点、滚动定位都以 filteredOptions 的下标为准，
 * 虚拟模式下 DOM 顺序与数据下标不再一一对应，不能再用 v-for 的局部 index。
 */
const renderRows = computed(() => {
  const list = filteredOptions.value;
  if (!props.virtual) return list.map((option, index) => ({ option, index }));

  const { start, end } = virtualRange.value;
  return list.slice(start, end).map((option, i) => ({ option, index: start + i }));
});

/** 可视窗口相对占位层的偏移量：始终对齐到整项，避免半项抖动 */
const virtualOffset = computed(() => virtualRange.value.start * props.virtualItemHeight);

/** 重新实测列表容器高度，展开动画结束、以及每次滚动时都要校准一次 */
function measureViewport() {
  const h = listRef.value?.clientHeight;
  if (h) viewportHeight.value = h;
}

/** 空列表兜底文案：搜索无结果与本来就没有数据是两种语义 */
const emptyText = computed(() =>
  props.allowSearch && searchValue.value.trim() ? "无匹配结果" : "暂无数据",
);

/**
 * 搜索框的占位文案。
 * 单选时沿用已选文本，保证输入框顶掉展示文本后用户仍知道当前选的是什么；
 * 多选时已有标签占位，再显示占位符会让触发器过于拥挤。
 */
const searchPlaceholder = computed(() => {
  if (props.multiple) return selectedOptions.value.length ? "" : props.placeholder;
  return displayText.value || props.placeholder;
});

/** 外部传入的 UI 配置：浮层部分给 RebornSelectTrigger，触发器盒子部分留给本组件自己渲染 */
const splitUi = computed(() => splitTriggerUi(props.triggerUi));
const overlayUi = computed(() => splitUi.value.overlay);
const fieldUi = computed(() => splitUi.value.field as SelectFieldUI);
const uiOverrides = computed(() => props.ui || {});

/**
 * 生成符合 UI 规范的样式映射表。
 * 触发器盒子（trigger / triggerText / …）的覆盖来自 triggerUi，
 * 下拉列表与标签的覆盖来自 ui，两条通道互不干扰。
 */
const ui = computed(() => {
  const styles = b({
    size: fieldGroupSize.value || props.size,
    color: props.color,
    variant: props.variant,
    multiple: props.multiple,
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
    searchInput: (opts?: { class?: any }) =>
      styles.searchInput({ class: cn(opts?.class, field.searchInput) }),
    triggerLoadingIcon: (opts?: { class?: any }) =>
      styles.triggerLoadingIcon({ class: cn(opts?.class, field.triggerLoadingIcon) }),
    option: (opts?: { class?: any; active?: boolean }) =>
      styles.option({
        // active 决定未选中态的文字色是否产出；传 undefined 时回落到 defaultVariants 的 false
        active: opts?.active,
        class: cn(opts?.class, uiOverrides.value.option),
      }),
    optionContent: (opts?: { class?: any }) =>
      styles.optionContent({ class: cn(opts?.class, uiOverrides.value.optionContent) }),
    optionLabel: (opts?: { class?: any }) =>
      styles.optionLabel({ class: cn(opts?.class, uiOverrides.value.optionLabel) }),
    optionActive: (opts?: { class?: any }) =>
      styles.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
    optionActiveIcon: (opts?: { class?: any }) =>
      styles.optionActiveIcon({ class: cn(opts?.class, uiOverrides.value.optionActiveIcon) }),
    optionHighlight: (opts?: { class?: any }) =>
      styles.optionHighlight({ class: cn(opts?.class, uiOverrides.value.optionHighlight) }),
    empty: (opts?: { class?: any }) =>
      styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    dropdownHeader: (opts?: { class?: any }) =>
      styles.dropdownHeader({ class: cn(opts?.class, uiOverrides.value.dropdownHeader) }),
    dropdownFooter: (opts?: { class?: any }) =>
      styles.dropdownFooter({ class: cn(opts?.class, uiOverrides.value.dropdownFooter) }),
    loading: (opts?: { class?: any }) =>
      styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
    loadingIcon: (opts?: { class?: any }) =>
      styles.loadingIcon({ class: cn(opts?.class, uiOverrides.value.loadingIcon) }),
    optionList: (opts?: { class?: any }) =>
      styles.optionList({ class: cn(opts?.class, uiOverrides.value.optionList) }),
    virtualPhantom: (opts?: { class?: any }) =>
      styles.virtualPhantom({ class: cn(opts?.class, uiOverrides.value.virtualPhantom) }),
    virtualWindow: (opts?: { class?: any }) =>
      styles.virtualWindow({ class: cn(opts?.class, uiOverrides.value.virtualWindow) }),
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

/**
 * 校验某个值是否处于选中状态
 */
const isSelected = (value: any) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(value);
  }
  return value === props.modelValue;
};

/**
 * 拼装显示在触发器上的标签文本
 */
const displayText = computed(() => selectedOptions.value.map((o) => o.label).join(", ") || "");

/** 多选模式下真正渲染成标签的选项：开启 collapseTags 后只保留前 maxCollapseTags 个 */
const visibleTags = computed(() => {
  if (!props.collapseTags) return selectedOptions.value;
  return selectedOptions.value.slice(0, Math.max(0, props.maxCollapseTags));
});

/** 被折叠掉的选项，用于 “+N” 标签与其悬停气泡 */
const collapsedTags = computed(() =>
  props.collapseTags ? selectedOptions.value.slice(Math.max(0, props.maxCollapseTags)) : [],
);

/** 折叠气泡里的文案 */
const collapsedText = computed(() => collapsedTags.value.map((o) => o.label).join("、"));

/**
 * 多选模式下移除单个标签
 */
function removeTag(value: any, e: Event) {
  e.stopPropagation();
  if (isDisabled.value) return;
  const newValue = (Array.isArray(props.modelValue) ? props.modelValue : []).filter(
    (item: any) => item !== value,
  );
  emit("update:modelValue", newValue);
  emit("remove-tag", value);
  emit("change", newValue);
  validate("change");
}

/**
 * 展开状态变化对外广播，对齐 Element Plus 的 visible-change。
 * 顺带接管搜索框的生命周期：展开后把焦点交给输入框，收起时清掉上一次的关键词，
 * 保证下次展开是干净的初始态（此处不再抛 search 事件，避免关闭动作触发一次多余的远程请求）。
 */
watch(isOpen, async (visible) => {
  emit("visible-change", visible);
  // 收起时把虚拟窗口归零，下次展开由 scrollToActive 重新定位（必须在 allowSearch 的早退之前）
  if (!visible && props.virtual) scrollTop.value = 0;
  if (!props.allowSearch) return;

  if (visible) {
    await nextTick();
    searchInputRef.value?.focus();
  } else {
    searchValue.value = "";
  }
});

/**
 * 搜索框输入。关键词变化后列表会重排，高亮索引必须跟着回到首项，
 * 否则回车会命中一个已经被过滤掉的位置。
 */
function onSearchInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  searchValue.value = value;
  highlightIndex.value = filteredOptions.value.length ? 0 : -1;
  // 列表已换了一批数据，虚拟窗口必须回到顶部，否则滚动位置停在旧数据的偏移上
  if (props.virtual) {
    scrollTop.value = 0;
    if (listRef.value) listRef.value.scrollTop = 0;
  }
  emit("search", value);
}

/** 下拉列表滚动。虚拟模式下先更新窗口位置，再把原生事件原样透出，调用方可据此做无限滚动 / 懒加载 */
function onDropdownScroll(e: Event) {
  if (props.virtual) {
    scrollTop.value = (e.target as HTMLElement).scrollTop;
    measureViewport();
  }
  emit("dropdown-scroll", e);
}

/**
 * 获取锚点位置（用于开启下拉时默认定位到已选项）。
 * 索引一律基于实际渲染的 filteredOptions，与列表 DOM 顺序严格对应，
 * 否则开启搜索后高亮与滚动定位会整体错位。
 */
function getAnchorIndex() {
  const list = filteredOptions.value;

  if (props.multiple && Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    const anchorValue = props.modelValue[0];
    return list.findIndex((o) => o.value === anchorValue);
  }

  if (!props.multiple && props.modelValue !== null) {
    return list.findIndex((o) => o.value === props.modelValue);
  }

  return -1;
}

/**
 * 切换下拉列表的展开与收起。
 *
 * 搜索态（allowSearch 且已展开）下点击触发器只把焦点还给输入框、不做收起：
 * 此时触发器本身就是一个输入框，落点可能是输入框、标签、箭头中的任意一个，
 * 若按落点决定收不收，用户会遇到「同样点一下，有时收起有时不收」的抽奖式体验。
 * 收起统一交给外部点击、Esc、单选选中与清空按钮，行为与 Ant Design 的可搜索 Select 一致。
 */
function toggle() {
  if (isDisabled.value) return;

  if (isOpen.value && props.allowSearch) {
    searchInputRef.value?.focus();
    return;
  }

  const opening = !isOpen.value;
  dropdownReady.value = false;
  if (opening) highlightIndex.value = getAnchorIndex();
  isOpen.value = opening;
}

/** 展开动画一开始列表就已可见，此后才允许鼠标接管高亮，避免展开瞬间指针位置抢走锚点 */
function onDropdownEnter() {
  dropdownReady.value = true;
  // 此刻列表才有真实高度，虚拟窗口的容量以这一次实测为准
  if (props.virtual) measureViewport();
}

function onOptionMouseEnter(index: number) {
  if (!dropdownReady.value) return;
  highlightIndex.value = index;
}

function moveHighlight(delta: number) {
  const next = Math.min(
    Math.max(highlightIndex.value + delta, 0),
    filteredOptions.value.length - 1,
  );
  if (next === highlightIndex.value) return;
  highlightIndex.value = next;
  nextTick(() => scrollToActive(false));
}

/**
 * 执行选择操作
 */
function selectOption(option: SelectOption) {
  if (option.disabled) return;

  if (props.multiple) {
    const newValue = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = newValue.indexOf(option.value);
    if (index > -1) {
      newValue.splice(index, 1);
      emit("remove-tag", option.value);
    } else {
      // 达到 multiple-limit 上限后不再接受新增，已选项仍可取消
      if (props.multipleLimit > 0 && newValue.length >= props.multipleLimit) return;
      newValue.push(option.value);
    }
    emit("update:modelValue", newValue);
    emit("change", newValue);
    validate("change");
    // 多选选中后清掉关键词、把焦点还给输入框，方便连续搜索多个选项
    if (props.allowSearch) {
      searchValue.value = "";
      highlightIndex.value = -1;
      nextTick(() => searchInputRef.value?.focus());
    }
  } else {
    emit("update:modelValue", option.value);
    emit("change", option.value);
    validate("change");
    isOpen.value = false;
  }
}

/**
 * 清空所有已选项
 */
function clear(e: Event) {
  e.stopPropagation();
  const newValue = props.multiple ? [] : null;
  emit("update:modelValue", newValue);
  emit("clear");
  emit("change", newValue);
  validate("change");
}

/**
 * 触发器外部事件（由 RebornSelectTrigger 按 closeOn 时机上报）关闭下拉列表
 */
function onOutsideClose() {
  if (isOpen.value) {
    isOpen.value = false;
    validate("blur");
  }
}

/** 选中当前高亮项（回车 / 空格共用） */
function confirmHighlight() {
  const list = filteredOptions.value;
  if (highlightIndex.value < 0 || highlightIndex.value >= list.length) return;
  const opt = list[highlightIndex.value];
  if (opt) selectOption(opt);
}

/**
 * 键盘快捷键支持：上下切换选项、确认选择、关闭
 */
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
    return;
  }

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      moveHighlight(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      moveHighlight(-1);
      break;
    case " ":
      // 搜索输入态下空格是正常字符，不能被当作「确认选中」吞掉
      if (isSearching.value) break;
      e.preventDefault();
      confirmHighlight();
      break;
    case "Enter":
      e.preventDefault();
      confirmHighlight();
      break;
    case "Escape":
      e.preventDefault();
      isOpen.value = false;
      break;
  }
}

/**
 * 滚动逻辑：将目标选项滚动至可视区域
 * @param instant 是否立即发生滚动（无平滑动画），常用于开启瞬时的初始定位
 */
function scrollToActive(instant = false) {
  const container = listRef.value;
  if (!container || highlightIndex.value < 0) return;

  // 虚拟模式下 DOM 里只有窗口内的那几项，children 下标与选项下标不再一一对应，
  // 所以位置只能靠「下标 × 步长」算，另外要把容器的上内边距（即占位层的 offsetTop）算进去
  if (props.virtual) {
    const h = props.virtualItemHeight;
    const view = container.clientHeight || 240;
    const padTop = (container.children[0] as HTMLElement | undefined)?.offsetTop ?? 0;
    const itemTop = padTop + highlightIndex.value * h;

    let target: number;
    if (instant) {
      // 展开瞬间：把目标项摆到可视区中间，用户一眼就能看到锚点
      target = itemTop - view / 2 + h / 2;
    } else {
      // 键盘移动：只在越界时滚动最小距离，等价于原生的 block: "nearest"
      const current = container.scrollTop;
      if (itemTop < current) target = itemTop;
      else if (itemTop + h > current + view) target = itemTop + h - view;
      else return;
    }

    const maxScrollTop = Math.max(0, container.scrollHeight - view);
    container.scrollTop = Math.min(Math.max(0, target), maxScrollTop);
    scrollTop.value = container.scrollTop;
    return;
  }

  // 选项被占位层 / 窗口层包了一层，不能再按 children 下标找，改用 data-index 定位
  const el = container.querySelector<HTMLElement>(`[data-index="${highlightIndex.value}"]`);
  if (!el) return;

  if (instant) {
    const viewportHeight = container.clientHeight || 240;
    const targetTop = el.offsetTop - viewportHeight / 2 + el.offsetHeight / 2;
    const maxScrollTop = Math.max(0, container.scrollHeight - viewportHeight);
    container.scrollTop = Math.min(Math.max(0, targetTop), maxScrollTop);
  } else {
    el.scrollIntoView({ block: "nearest" });
  }
}

</script>

<template>
  <RebornSelectTrigger :class="props.class" :is-open="isOpen" :disabled="isDisabled" :size="fieldGroupSize || size"
    :ui="overlayUi" :scroll-to-active="scrollToActive" :close-on="closeOn" :portal="portal"
    :auto-adjust-overflow="autoAdjustOverflow" @keydown="onKeydown"
    @enter="onDropdownEnter" @close="onOutsideClose">
    <template #trigger>
      <!-- 触发器盒子：样式由本组件的 theme 直接给出，不再借道 RebornFieldTrigger -->
      <div :class="ui.trigger()" :data-state="isOpen ? 'open' : 'closed'" @click="toggle">
        <!-- cover：整体接管触发器内容，连清空按钮与箭头一并交由调用方绘制 -->
        <slot name="cover" v-if="$slots.cover" :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen"
          :ui="ui" />

        <template v-else>
          <slot :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="ui">
            <!-- 多选：已选项以 RebornBadge 呈现，超出部分按 collapse-tags 折叠为 “+N” -->
            <div v-if="multiple && selectedOptions.length" :class="ui.tagList()">
              <RebornBadge v-for="item in visibleTags" :key="String(item.value)" :label="item.label" color="neutral"
                variant="subtle" size="sm" :closable="!isDisabled" close-icon="lucide:x" :ui="{
                  root: 'min-w-0 shrink-0 max-w-full',
                  base: ui.tag(),
                  label: ui.tagLabel(),
                  closeButton: ui.tagClose(),
                  closeIcon: ui.tagCloseIcon(),
                }" @close="removeTag(item.value, $event)" />

              <RebornTooltip v-if="collapsedTags.length && collapseTagsTooltip" :content="collapsedText">
                <RebornBadge :label="`+${collapsedTags.length}`" color="neutral" variant="subtle" size="sm" :ui="{
                  root: 'min-w-0 shrink-0',
                  base: ui.tag({ class: ui.collapseTag() }),
                  label: ui.tagLabel(),
                }" />
              </RebornTooltip>
              <RebornBadge v-else-if="collapsedTags.length" :label="`+${collapsedTags.length}`" color="neutral"
                variant="subtle" size="sm" :ui="{
                  root: 'min-w-0 shrink-0',
                  base: ui.tag({ class: ui.collapseTag() }),
                  label: ui.tagLabel(),
                }" />

              <!-- 多选搜索态：输入框跟在标签末尾，随标签换行一起流动 -->
              <!-- 点击不再拦截：交给触发器的 toggle 统一处理（搜索态只回焦点、不收起） -->
              <input v-if="isSearching" ref="searchInputRef" type="text" :value="searchValue"
                :placeholder="searchPlaceholder" :class="ui.searchInput()" @input="onSearchInput" />
            </div>

            <!-- 单选搜索态：输入框顶掉展示文本，已选文本降级为 placeholder 继续提示 -->
            <input v-else-if="isSearching" ref="searchInputRef" type="text" :value="searchValue"
              :placeholder="searchPlaceholder" :class="ui.searchInput()" @input="onSearchInput" />

            <span v-else-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
            <span v-else :class="ui.placeholder()">{{ placeholder }}</span>
          </slot>

          <!-- 尾部图标区：箭头与清空按钮重叠在同一格子里，悬停时交替显隐，宽度恒定不抖动 -->
          <div v-if="showArrow || showClearButton || loading" :class="ui.triggerIconWrapper()">
            <!-- 加载中优先占据整格：RebornLoading 替代箭头，此时清空按钮已被 showClearButton 关掉 -->
            <!-- size 必须给 100%：RebornLoading 会把 size 写成行内宽高，行内样式压过 class 上的尺寸 -->
            <RebornLoading v-if="loading" type="ring" color="currentColor" size="100%"
              :class="ui.triggerLoadingIcon()" />
            <Icon v-else-if="showArrow" :name="icon" :class="ui.arrow()" />
            <span v-if="showClearButton" :class="ui.clearBtn({ class: showArrow ? undefined : 'static flex' })"
              @click.stop="clear">
              <Icon name="lucide:x" class="size-full" />
            </span>
          </div>
        </template>
      </div>
    </template>

    <template #content>
      <!-- 页头 / 页脚与滚动列表是兄弟节点，列表滚动时二者固定不动 -->
      <div v-if="$slots.header" :class="ui.dropdownHeader()">
        <slot name="header" />
      </div>

      <!-- 原生 scroll 事件不冒泡，监听必须挂在真正滚动的这一层上 -->
      <div ref="listRef" :class="ui.dropdown()" @scroll="onDropdownScroll">
        <div v-if="loading" :class="ui.loading()">
          <Icon name="lucide:loader-2" :class="ui.loadingIcon()" />
          <span>加载中...</span>
        </div>

        <template v-else>
          <!--
            占位层 + 窗口层：
            虚拟模式下占位层按「总条数 × 步长」撑出真实滚动条，窗口层绝对定位并按偏移量平移，
            DOM 里只保留可视区那十几行；非虚拟模式下两层不带任何样式，纯粹是透明的结构层。
          -->
          <div :class="virtual ? ui.virtualPhantom() : undefined"
            :style="virtual ? { height: `${virtualTotalHeight}px` } : undefined">
            <div :class="[ui.optionList(), virtual ? ui.virtualWindow() : '']"
              :style="virtual ? { transform: `translateY(${virtualOffset}px)` } : undefined">
              <!-- 选中态优先于高亮态：两者都是 bg-*，数组绑定不过 tailwind-merge，同时挂上只能靠 CSS 顺序定胜负 -->
              <!-- 文字色不在此列：未选中的 gray-6 已收进 option 的 active 变体，选中时根本不产出，不会与 optionActive 抢色 -->
              <!-- 下标一律取 row.index（filteredOptions 中的真实下标）：虚拟模式下 DOM 顺序不等于数据顺序 -->
              <div v-for="row in renderRows" :key="row.index" :data-index="row.index" :class="[
                ui.option({ active: isSelected(row.option.value) }),
                isSelected(row.option.value) ? ui.optionActive() : '',
                highlightIndex === row.index && !isSelected(row.option.value) ? ui.optionHighlight() : '',
              ]" :style="virtual ? { height: `${virtualItemHeight - 4}px` } : undefined"
                :data-disabled="row.option.disabled ? 'true' : 'false'" @click="selectOption(row.option)"
                @mouseenter="onOptionMouseEnter(row.index)">
                <slot name="option" :option="row.option" :active="isSelected(row.option.value)">
                  <div :class="ui.optionContent()">
                    <span :class="ui.optionLabel()">{{ row.option.label }}</span>
                    <Icon v-if="multiple && isSelected(row.option.value)" name="lucide:check"
                      :class="ui.optionActiveIcon()" />
                  </div>
                </slot>
              </div>
            </div>
          </div>

          <div v-if="filteredOptions.length === 0" :class="ui.empty()">
            {{ emptyText }}
          </div>
        </template>
      </div>

      <div v-if="$slots.footer" :class="ui.dropdownFooter()">
        <slot name="footer" />
      </div>
    </template>
  </RebornSelectTrigger>
</template>
