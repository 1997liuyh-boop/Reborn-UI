<script setup lang="ts">
/* eslint vue/custom-event-name-casing: off -- 保留既有公开事件名 */
/**
 * RebornCascader 级联选择器
 *
 * 触发器、下拉浮层、多选标签三部分的样式全部取自 reborn-select，下拉内容换成 RebornCascaderPanel：
 * 多列之间用 1px 的 gray-2 竖线分隔，不再各自成卡片。
 */
import type { SelectTriggerProps } from "../reborn-select-trigger/RebornSelectTrigger.vue";
import type { cascaderColors, CascaderFieldNames, CascaderFieldUI, CascaderOption, CascaderOptionValue, cascaderSizes, CascaderUI, CascaderValue, cascaderVariants, VirtualListProps } from "./reborn-cascader.config";
import type { CascaderNode } from "./reborn-cascader.tree";
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onBeforeUpdate, provide, shallowRef, useTemplateRef, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornBadge from "../reborn-badge/RebornBadge.vue";
import RebornCheckbox from "../reborn-checkbox/RebornCheckbox.vue";
import RebornLoading from "../reborn-loading/RebornLoading.vue";
import { splitTriggerUi } from "../reborn-select-trigger/reborn-select-trigger.config";
import RebornSelectTrigger from "../reborn-select-trigger/RebornSelectTrigger.vue";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";
import theme from "./reborn-cascader.config";
import { CASCADER_TREE_KEY, useCascaderState } from "./reborn-cascader.context";
import { findNodeByValue, getCheckState, valueToKey } from "./reborn-cascader.tree";
import RebornCascaderPanel from "./RebornCascaderPanel.vue";

/** 下拉浮层的触发器属性，透传给 RebornSelectTrigger */
export type CascaderTriggerProps = Partial<
  Pick<
    SelectTriggerProps,
    "side" | "align" | "offset" | "arrow" | "closeOn" | "portal" | "autoAdjustOverflow"
  >
>;

export interface CascaderProps {
  /** 绑定值是否为路径：开启后单选绑定值数组、多选绑定值数组的数组 */
  pathMode?: boolean;
  /** 是否为多选状态（多选模式默认开启搜索） */
  multiple?: boolean;
  /** 默认值（非受控状态），仅在未绑定 v-model 时生效 */
  defaultValue?: CascaderValue;
  /** 级联选择器的选项 */
  options?: CascaderOption[];
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否为错误状态 */
  error?: boolean;
  /** 选择框的大小 */
  size?: (typeof cascaderSizes)[number];
  /** 是否允许搜索。不传时单选为 false、多选为 true */
  allowSearch?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 输入框的默认值（非受控状态） */
  defaultInputValue?: string;
  /** 展开下一级的触发方式 */
  expandTrigger?: "click" | "hover";
  /** 是否默认显示下拉框（非受控状态） */
  defaultPopupVisible?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 自定义选项过滤方法，返回 true 表示保留该选项 */
  filterOption?: (inputValue: string, option: CascaderOption) => boolean;
  /** 弹出框的挂载容器 */
  popupContainer?: string | HTMLElement;
  /** 多选模式下，最多显示的标签数量。0 表示不限制 */
  maxTagCount?: number;
  /** 格式化展示内容，入参是从根到该选项的整条路径 */
  formatLabel?: (options: CascaderOption[]) => string;
  /** 下拉菜单的触发器属性 */
  triggerProps?: CascaderTriggerProps;
  /** 是否开启严格选择模式：单选可选中任意层级，多选父子勾选互不影响 */
  checkStrictly?: boolean;
  /** 数据懒加载函数，传入时开启懒加载功能 */
  loadMore?: (option: CascaderOption, done: (children?: CascaderOption[]) => void) => void;
  /** 是否为加载中状态 */
  loading?: boolean;
  /** 搜索下拉菜单中的选项是否仅展示标签（关闭时展示整条路径） */
  searchOptionOnlyLabel?: boolean;
  /** 触发 search 事件的延迟时间（毫秒） */
  searchDelay?: number;
  /** 自定义 CascaderOption 中的字段 */
  fieldNames?: CascaderFieldNames;
  /** 用于确定选项键值的属性名 */
  valueKey?: string;
  /** 自定义不存在选项的值的展示 */
  fallback?: boolean | ((value: CascaderOptionValue | CascaderOptionValue[]) => string);
  /** 是否展开子菜单：激活某一项后沿它的第一个可用子项继续展开，直到叶子 */
  expandChild?: boolean;
  /** 传递虚拟列表属性，传入此参数以开启虚拟滚动 */
  virtualListProps?: VirtualListProps;
  /** 标签内容不换行 */
  tagNowrap?: boolean;
  /** 配色，决定聚焦描边、选中底色与勾选框颜色 */
  color?: (typeof cascaderColors)[number];
  /** 形态变体：描边 / 填充 / 无边框 / 下划线 */
  variant?: (typeof cascaderVariants)[number];
  /** 自定义类名 */
  class?: any;
  /** 触发器 UI 配置：触发器盒子与浮层的键混写在一起，组件内部自动拆分下发 */
  triggerUi?: SelectTriggerProps["ui"] & CascaderFieldUI;
  /** 下拉面板与多选标签的 UI 微调配置 */
  ui?: CascaderUI;
}

const props = withDefaults(defineProps<CascaderProps>(), {
  pathMode: false,
  multiple: false,
  defaultValue: undefined,
  options: () => [],
  disabled: false,
  error: false,
  size: "md",
  // 不给默认值：单选 false、多选 true 的规则要靠「有没有传」来区分
  allowSearch: undefined,
  allowClear: false,
  defaultInputValue: "",
  expandTrigger: "click",
  defaultPopupVisible: false,
  placeholder: "请选择",
  maxTagCount: 0,
  checkStrictly: false,
  loading: false,
  searchOptionOnlyLabel: false,
  searchDelay: 500,
  valueKey: "value",
  fallback: true,
  expandChild: false,
  tagNowrap: false,
  color: "primary",
  variant: "outlined",
});

const emit = defineEmits<{
  /** 选中值改变时触发 */
  (e: "change", value: CascaderValue): void;
  /** 输入值改变时触发 */
  (e: "input-value-change", value: string): void;
  /** 点击清除按钮时触发 */
  (e: "clear"): void;
  /** 用户搜索时触发，按 search-delay 防抖 */
  (e: "search", value: string): void;
  /** 下拉框的显示状态改变时触发 */
  (e: "popup-visible-change", visible: boolean): void;
  /** 获得焦点时触发 */
  (e: "focus", ev: FocusEvent): void;
  /** 失去焦点时触发 */
  (e: "blur", ev: FocusEvent): void;
}>();

/*
 * 三个双向绑定：绑定值（v-model）、输入框的值（v-model:input-value）、是否显示下拉框（v-model:popup-visible）。
 * defineModel 只负责声明属性与 update 事件，读写都不经它的本地缓存：只传值时 useModel 会改写缓存；非受控时写进去的值
 * 还会成为受控后「同值不派发」的去重基准，吞掉父级要收的事件。读取按严格受控取父级原始值，写入直接派发事件。
 */
defineModel<CascaderValue>({ default: undefined });
defineModel<string | undefined>("inputValue", { default: undefined });
defineModel<boolean | undefined>("popupVisible", { default: undefined });

const b = tv(theme);
const instance = getCurrentInstance()!;
/** 父级是否在 vnode 上写了该属性（含 kebab 写法）：据此区分「未绑定」与「显式绑定 undefined」 */
function isBound(name: string) {
  const vnodeProps = instance.vnode.props ?? {};
  const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  return Object.hasOwn(vnodeProps, name) || Object.hasOwn(vnodeProps, kebab);
}
/**
 * 三个 v-model 各自的受控判定。是否显式绑定也必须响应父级更新（包括未绑定切到 undefined），
 * 但只存布尔结果：shallowRef 写入相同的值不会触发依赖，下游的 currentValue 与回显计算只在受控状态真的变化时重算。
 */
const bound = {
  modelValue: shallowRef(isBound("modelValue")),
  inputValue: shallowRef(isBound("inputValue")),
  popupVisible: shallowRef(isBound("popupVisible")),
};
onBeforeUpdate(() => {
  bound.modelValue.value = isBound("modelValue");
  bound.inputValue.value = isBound("inputValue");
  bound.popupVisible.value = isBound("popupVisible");
});
function isControlled(name: keyof typeof bound = "modelValue") {
  return bound[name].value;
}

/** 三份非受控状态：未绑定对应 v-model 时由它们承载 */
const innerValue = shallowRef<CascaderValue>(props.defaultValue);
const innerInputValue = shallowRef(props.defaultInputValue);
const innerPopupVisible = shallowRef(props.defaultPopupVisible);

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);
const currentSize = computed(() => fieldGroupSize.value || props.size);

/**
 * 受控时只认父级传入的原始值（instance.props），不读 defineModel 的本地缓存：
 * 只传值不接 update 事件时 useModel 会改写本地缓存，读它就成了「只读绑定点了照样变」。
 * 统一按严格受控处理，父级不接收（不回写）就保持父值，与 Badge / Overlay / Menu 及 UniApp 端一致。
 */
const currentValue = computed<CascaderValue>(() =>
  isControlled() ? instance.props.modelValue as CascaderValue : innerValue.value,
);
const inputValue = computed(() =>
  isControlled("inputValue") ? (instance.props.inputValue as string | undefined) ?? "" : innerInputValue.value,
);
const isOpen = computed({
  get: () => isControlled("popupVisible") ? !!instance.props.popupVisible : innerPopupVisible.value,
  set: (visible: boolean) => {
    if (!isControlled("popupVisible")) innerPopupVisible.value = visible;
    instance.emit("update:popupVisible", visible);
  },
});

/** 多选默认开启搜索，单选默认关闭 */
const searchEnabled = computed(() => props.allowSearch ?? props.multiple);
/** 是否处于搜索输入态：允许搜索且下拉已展开 */
const isSearching = computed(() => searchEnabled.value && isOpen.value);
/** 是否用搜索结果顶掉级联面板：输入框有内容时才切换 */
const isSearchMode = computed(() => isSearching.value && inputValue.value.trim() !== "");

const panelRef = useTemplateRef<InstanceType<typeof RebornCascaderPanel>>("panelRef");
const triggerRef = useTemplateRef<InstanceType<typeof RebornSelectTrigger>>("triggerRef");
const searchInputRef = useTemplateRef<HTMLInputElement>("searchInputRef");

/* ---------------- 选项与展示 ---------------- */

/** 与面板同一套配置建出的选项树，用于回填标签文本与搜索 */
const treeContext = useCascaderState(props);
provide(CASCADER_TREE_KEY, treeContext);
const { tree } = treeContext;

/** 当前值折算出的条目数组：单选最多一条，多选逐条 */
const valueEntries = computed<(CascaderOptionValue | CascaderOptionValue[])[]>(() => {
  const value = currentValue.value;
  if (value === undefined || value === null || value === "") return [];
  if (props.multiple) return Array.isArray(value) ? [...value] : [value];
  if (props.pathMode) return Array.isArray(value) ? [value as CascaderOptionValue[]] : [value];
  return [value as CascaderOptionValue];
});

/** 对象值没法直接显示，退回它的 value-key 属性 */
function stringifyValue(value: unknown) {
  if (value && typeof value === "object") {
    return String((value as Record<string, any>)[props.valueKey] ?? "");
  }
  return String(value ?? "");
}

/** 命中节点的展示文本：给了 format-label 就交给它，否则把整条路径拼起来 */
function labelOf(node: CascaderNode) {
  if (props.formatLabel) return props.formatLabel(node.path.map((item) => item.raw));
  return node.pathLabel.join(" / ");
}

/** 选项里不存在的值如何展示；返回 null 表示丢弃不显示 */
function fallbackLabel(entry: CascaderOptionValue | CascaderOptionValue[]) {
  if (props.fallback === false) return null;
  if (typeof props.fallback === "function") return props.fallback(entry);
  return Array.isArray(entry)
    ? entry.map((item) => stringifyValue(item)).join(" / ")
    : stringifyValue(entry);
}

/**
 * 触发器上要展示的条目。
 * 值在选项里找不到时（典型场景是懒加载还没把那一层取回来）交给 fallback 兜底，
 * 否则回显会整条消失，用户以为自己没选过。
 */
const displayEntries = computed(() => {
  const list: {
    key: string;
    label: string;
    raw: CascaderOption | null;
    value: CascaderOptionValue | CascaderOptionValue[];
    tagProps?: Record<string, any>;
  }[] = [];

  for (const entry of valueEntries.value) {
    const node = findNodeByValue(tree.value, entry, props.pathMode, props.valueKey);
    if (node) {
      list.push({
        key: node.key,
        label: labelOf(node),
        raw: node.raw,
        value: entry,
        tagProps: node.tagProps,
      });
      continue;
    }

    const text = fallbackLabel(entry);
    if (text === null) continue;
    list.push({
      key: valueToKey(entry, props.pathMode, props.valueKey),
      label: text,
      raw: null,
      value: entry,
    });
  }

  return list;
});

/** 单选时触发器上的文本 */
const displayText = computed(() => (props.multiple ? "" : displayEntries.value[0]?.label ?? ""));

/** max-tag-count 之内的标签 */
const visibleTags = computed(() =>
  props.maxTagCount > 0 ? displayEntries.value.slice(0, props.maxTagCount) : displayEntries.value,
);
/** 超出 max-tag-count 被折叠的标签 */
const collapsedTags = computed(() =>
  props.maxTagCount > 0 ? displayEntries.value.slice(props.maxTagCount) : [],
);
const collapsedText = computed(() => collapsedTags.value.map((item) => item.label).join("、"));

/* ---------------- 搜索 ---------------- */

/** 可被搜索命中的节点：严格模式下任意层级都能选，否则只有叶子 */
const searchableNodes = computed(() =>
  props.checkStrictly ? tree.value.flat : tree.value.flat.filter((node) => node.isLeaf),
);

/** 搜索结果行文本：默认展示整条路径，开启 search-option-only-label 后只展示自身标签 */
function searchLabelOf(node: CascaderNode) {
  return props.searchOptionOnlyLabel ? node.label : node.pathLabel.join(" / ");
}

const searchResults = computed(() => {
  const keyword = inputValue.value.trim();
  if (!keyword) return [];

  const match = props.filterOption;
  const lower = keyword.toLowerCase();
  return searchableNodes.value.filter((node) =>
    match ? match(keyword, node.raw) : searchLabelOf(node).toLowerCase().includes(lower),
  );
});

/** 勾选集合，只用于给搜索结果行画勾选框；面板自己另有一份 */
const checkedKeys = computed(() => {
  const set = new Set<string>();
  if (!props.multiple) return set;

  for (const entry of valueEntries.value) {
    const node = findNodeByValue(tree.value, entry, props.pathMode, props.valueKey);
    if (!node) continue;
    if (props.checkStrictly) set.add(node.key);
    else for (const key of node.leafKeys) set.add(key);
  }
  return set;
});

/** 搜索结果行的勾选状态 */
function searchStateOf(node: CascaderNode) {
  if (!props.multiple) {
    const current = displayEntries.value[0];
    return { checked: current?.key === node.key, indeterminate: false };
  }
  if (props.checkStrictly) {
    return { checked: checkedKeys.value.has(node.key), indeterminate: false };
  }
  return getCheckState(node, checkedKeys.value);
}

const searchScrollTop = shallowRef(0);
const searchListRef = useTemplateRef<HTMLElement>("searchListRef");
const searchHeight = shallowRef(240);
const searchRows = computed(() => {
  const nodes = searchResults.value;
  const height = Math.max(1, props.virtualListProps?.height ?? 33);
  const buffer = props.virtualListProps?.buffer ?? 4;
  const virtual = !!props.virtualListProps && nodes.length > (props.virtualListProps.threshold ?? 0);
  const start = virtual ? Math.max(0, Math.floor(searchScrollTop.value / height) - buffer) : 0;
  const end = virtual ? start + Math.ceil(searchHeight.value / height) + buffer * 2 : nodes.length;
  return { virtual, height, totalHeight: nodes.length * height, offset: start * height,
    rows: nodes.slice(start, end).map(node => ({ node, ...searchStateOf(node) })) };
});
function onSearchScroll(event: Event) {
  const element = event.target as HTMLElement;
  searchScrollTop.value = element.scrollTop;
  searchHeight.value = element.clientHeight || 240;
}
watch(searchResults, () => {
  // 数据窗口与真实滚动位置一同复位，避免窗口回到首批而视口仍停在底部。
  searchScrollTop.value = 0;
  if (searchListRef.value) searchListRef.value.scrollTop = 0;
}, { flush: "post" });
let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** 写回输入框的值。受控与非受控两份状态同时更新 */
function setInputValue(value: string) {
  if (inputValue.value === value) return;
  if (!isControlled("inputValue")) innerInputValue.value = value;
  instance.emit("update:inputValue", value);
  emit("input-value-change", value);
}

/**
 * 搜索框输入。本地过滤立即生效，search 事件按 search-delay 防抖：
 * 远程搜索接的是这个事件，逐字符发请求只会把接口打满。
 */
function onSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  setInputValue(value);

  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => emit("search", value), props.searchDelay);
}

/* ---------------- 值的写回 ---------------- */

function updateValue(value: CascaderValue) {
  if (!isControlled()) innerValue.value = value;
  instance.emit("update:modelValue", value);
  emit("change", value);
  validate("change");
}

/** 面板改了值：直接透传，面板已按 path-mode / check-strictly 算好形态 */
function onPanelChange(value: CascaderValue) {
  updateValue(value);
}

/**
 * 面板完成一次选中动作。
 * 单选收起浮层——但严格模式下点中的若是非叶子节点，说明用户还要继续往下走，此时不收。
 * 多选保持展开，只把搜索关键词清掉，方便接着搜下一个。
 */
function onPanelSelect(value: CascaderOptionValue | CascaderOptionValue[]) {
  const node = findNodeByValue(tree.value, value, props.pathMode, props.valueKey);

  if (!props.multiple && (!props.checkStrictly || node?.isLeaf !== false)) {
    isOpen.value = false;
    return;
  }

  if (searchEnabled.value) {
    setInputValue("");
    nextTick(() => searchInputRef.value?.focus());
  }
}

/** 点击搜索结果行：交给面板统一处理选中，避免两处各写一套联动规则 */
function onSearchPick(node: CascaderNode) {
  if (node.disabled || isDisabled.value) return;
  panelRef.value?.pick(node.key);
}

/** 多选模式下移除单个标签 */
function removeTag(key: string, event: Event) {
  event.stopPropagation();
  if (isDisabled.value) return;

  const next = displayEntries.value
    .filter((item) => item.key !== key)
    .map((item) => item.value);
  updateValue(next as CascaderValue);
}

const showClearButton = computed(() => {
  if (props.loading || isDisabled.value) return false;
  return props.allowClear && displayEntries.value.length > 0;
});

function clear(event: Event) {
  event.stopPropagation();
  if (isDisabled.value) return;
  clearTimeout(searchTimer);
  updateValue(props.multiple ? [] : undefined);
  setInputValue("");
  emit("clear");
}

/* ---------------- 展开与焦点 ---------------- */

/**
 * 切换下拉。搜索态下点击触发器只把焦点还给输入框、不收起：
 * 此时触发器本身就是输入框，按落点决定收不收会让用户遇到「同样点一下，有时收有时不收」。
 */
function toggle() {
  if (isDisabled.value) return;
  if (isOpen.value && searchEnabled.value) {
    searchInputRef.value?.focus();
    return;
  }
  isOpen.value = !isOpen.value;
}

function onOutsideClose() {
  if (isOpen.value) isOpen.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (isDisabled.value) return;

  if (!isOpen.value) {
    if (event.key === "ArrowDown" || event.key === "Enter") {
      event.preventDefault();
      isOpen.value = true;
    }
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    isOpen.value = false;
  }
}

/**
 * 焦点事件经 RebornSelectTrigger 透传到它的根节点（模板上的 @focusin / @focusout）。
 * 用 focusin / focusout 而不是 focus / blur：它们会冒泡，才能覆盖到内部的搜索输入框；
 * 焦点在根节点内部移动时不派发，避免在触发器与搜索框之间切换时误报失焦。
 */
function onFocusIn(event: FocusEvent) {
  const root = triggerRef.value?.$el as HTMLElement | undefined;
  if (root?.contains(event.relatedTarget as Node)) return;
  emit("focus", event);
}

function onFocusOut(event: FocusEvent) {
  const root = triggerRef.value?.$el as HTMLElement | undefined;
  if (root?.contains(event.relatedTarget as Node)) return;
  emit("blur", event);
  validate("blur");
}

onBeforeUnmount(() => clearTimeout(searchTimer));

watch(isOpen, async (visible) => {
  emit("popup-visible-change", visible);

  if (visible) {
    await nextTick();
    // 每次展开都把展开路径对回当前选中项，而不是停在上一次翻到一半的位置
    panelRef.value?.syncActivePath();
    if (searchEnabled.value) searchInputRef.value?.focus();
    return;
  }

  clearTimeout(searchTimer);
  // 收起时清掉关键词，下次展开是干净的初始态；此处不再抛 search，避免多一次无谓的远程请求
  setInputValue("");
});

watch(isDisabled, (disabled) => {
  if (disabled) isOpen.value = false;
});

/* ---------------- 样式 ---------------- */

/** 浮层部分给 RebornSelectTrigger，触发器盒子部分留给本组件自己渲染 */
const splitUi = computed(() => splitTriggerUi(props.triggerUi));
/**
 * 浮层宽度跟着面板走。
 * RebornSelectTrigger 默认给浮层兜了 min-width: 触发器宽度——那是为「下拉列表与选择框等宽」准备的，
 * 级联的宽度由列数决定：表单里的触发器往往占满整行，不解除这条下限，
 * 三列面板右边会拖出一大片空浮层。空态没有列宽可用，改为与触发器等宽；
 * 行内浮层未设置宽度变量时回退为容器宽度。调用方的 dropdown 覆盖仍排在最后。
 */
const isEmptyPanel = computed(() => !props.loading && (
  isSearchMode.value ? searchResults.value.length === 0 : tree.value.flat.length === 0
));
const overlayUi = computed(() => ({
  ...splitUi.value.overlay,
  dropdown: cn("min-w-0", isEmptyPanel.value && "w-[var(--rb-trigger-width,100%)]", splitUi.value.overlay.dropdown),
}));
const fieldUi = computed(() => splitUi.value.field as CascaderFieldUI);
const uiOverrides = computed(() => props.ui || {});

/**
 * 多选有标签时逐行铺开，触发器高度随之增长。
 * max-tag-count 只限制「显示几个标签」，不代表一行一定装得下：
 * 前 N 个标签加上折叠的 “+N” 超宽时同样要换行，否则尾部的标签与 “+N” 会被整体裁掉。
 */
const wrapTags = computed(() => props.multiple && displayEntries.value.length > 0);

const ui = computed(() => {
  const styles = b({
    size: currentSize.value,
    color: props.color,
    variant: props.variant,
    multiple: props.multiple,
    wrapTags: wrapTags.value,
    tagNowrap: props.tagNowrap,
    open: isOpen.value,
    clearable: showClearButton.value,
    disabled: isDisabled.value,
    error: isError.value || props.error,
    loading: props.loading,
  });
  const field = fieldUi.value;

  return {
    trigger: (opts?: { class?: any }) => styles.trigger({ class: cn(opts?.class, field.trigger) }),
    triggerText: (opts?: { class?: any }) =>
      styles.triggerText({ class: cn(opts?.class, field.triggerText) }),
    triggerIconWrapper: (opts?: { class?: any }) =>
      styles.triggerIconWrapper({ class: cn(opts?.class, field.triggerIconWrapper) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, field.placeholder) }),
    clearBtn: (opts?: { class?: any }) =>
      styles.clearBtn({ class: cn(opts?.class, field.clearBtn) }),
    arrow: (opts?: { class?: any }) => styles.arrow({ class: cn(opts?.class, field.arrow) }),
    searchInput: (opts?: { class?: any }) =>
      styles.searchInput({ class: cn(opts?.class, field.searchInput) }),
    triggerLoadingIcon: (opts?: { class?: any }) =>
      styles.triggerLoadingIcon({ class: cn(opts?.class, field.triggerLoadingIcon) }),
    searchIcon: (opts?: { class?: any }) => styles.searchIcon({ class: opts?.class }),
    prefix: (opts?: { class?: any }) =>
      styles.prefix({ class: cn(opts?.class, uiOverrides.value.prefix) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    searchList: (opts?: { class?: any }) =>
      styles.searchList({ class: cn(opts?.class, uiOverrides.value.searchList) }),
    optionList: (opts?: { class?: any }) =>
      styles.optionList({ class: cn(opts?.class, uiOverrides.value.optionList) }),
    option: (opts?: { class?: any; active?: boolean }) =>
      styles.option({ active: opts?.active, class: cn(opts?.class, uiOverrides.value.option) }),
    optionContent: (opts?: { class?: any }) =>
      styles.optionContent({ class: cn(opts?.class, uiOverrides.value.optionContent) }),
    optionLabel: (opts?: { class?: any }) =>
      styles.optionLabel({ class: cn(opts?.class, uiOverrides.value.optionLabel) }),
    optionActive: (opts?: { class?: any }) =>
      styles.optionActive({ class: cn(opts?.class, uiOverrides.value.optionActive) }),
    optionCheckbox: (opts?: { class?: any }) =>
      styles.optionCheckbox({ class: cn(opts?.class, uiOverrides.value.optionCheckbox) }),
    empty: (opts?: { class?: any }) =>
      styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
    loading: (opts?: { class?: any }) =>
      styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
    loadingIcon: (opts?: { class?: any }) =>
      styles.loadingIcon({ class: cn(opts?.class, uiOverrides.value.loadingIcon) }),
    tagList: (opts?: { class?: any }) =>
      styles.tagList({ class: cn(opts?.class, uiOverrides.value.tagList) }),
    tag: (opts?: { class?: any }) => styles.tag({ class: cn(opts?.class, uiOverrides.value.tag) }),
    tagLabel: (opts?: { class?: any }) =>
      styles.tagLabel({ class: cn(opts?.class, uiOverrides.value.tagLabel) }),
    tagClose: (opts?: { class?: any }) =>
      styles.tagClose({ class: cn(opts?.class, uiOverrides.value.tagClose) }),
    tagCloseIcon: (opts?: { class?: any }) =>
      styles.tagCloseIcon({ class: cn(opts?.class, uiOverrides.value.tagCloseIcon) }),
    collapseTag: (opts?: { class?: any }) =>
      styles.collapseTag({ class: cn(opts?.class, uiOverrides.value.collapseTag) }),
    tagSearch: (opts?: { class?: any }) =>
      styles.tagSearch({ class: cn(opts?.class, uiOverrides.value.tagSearch) }),
    tagSearchMirror: (opts?: { class?: any }) =>
      styles.tagSearchMirror({ class: cn(opts?.class, uiOverrides.value.tagSearchMirror) }),
    tagSearchInput: (opts?: { class?: any }) =>
      styles.tagSearchInput({ class: cn(opts?.class, uiOverrides.value.tagSearchInput) }),
  };
});

/** 传给面板的值：绝不能是 undefined，否则面板会回落到它自己的非受控状态 */
const panelValue = computed<CascaderValue>(
  () => currentValue.value ?? (props.multiple ? [] : ""),
);

/**
 * 浮层的挂载容器与展开方式，triggerProps 里的键优先。
 * closeOn 默认 mousedown，与 RebornSelectTrigger 的默认值保持一致：
 * 按下即收起，不必等到松开，拖拽选中文本时也不会因 click 落在外部而误判。
 */
const triggerOptions = computed(() => ({
  portal: true,
  autoAdjustOverflow: true,
  closeOn: "mousedown" as const,
  ...(props.triggerProps || {}),
}));

/** 搜索框的占位文案：单选沿用已选文本，多选已有标签占位就不再重复提示 */
const searchPlaceholder = computed(() => {
  if (props.multiple) return displayEntries.value.length ? "" : props.placeholder;
  return displayText.value || props.placeholder;
});

defineExpose({
  /** 展开下拉面板（禁用状态下无效） */
  open: () => {
    if (!isDisabled.value) isOpen.value = true;
  },
  /** 收起下拉面板 */
  close: () => {
    isOpen.value = false;
  },
  /** 让触发器获得焦点 */
  focus: () => (triggerRef.value?.$el as HTMLElement | undefined)?.focus(),
  /** 让触发器失去焦点 */
  blur: () => (triggerRef.value?.$el as HTMLElement | undefined)?.blur(),
});
</script>

<template>
  <RebornSelectTrigger
    ref="triggerRef"
    :class="props.class"
    :is-open="isOpen"
    :disabled="isDisabled"
    :size="currentSize"
    :ui="overlayUi"
    :container="popupContainer ?? 'body'"
    :portal="triggerOptions.portal"
    :close-on="triggerOptions.closeOn"
    :side="triggerOptions.side"
    :align="triggerOptions.align"
    :offset="triggerOptions.offset"
    :arrow="triggerOptions.arrow"
    :auto-adjust-overflow="triggerOptions.autoAdjustOverflow"
    @keydown="onKeydown"
    @close="onOutsideClose"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <template #trigger>
      <!-- 触发器盒子：样式与 reborn-select 同源，多选时装标签、搜索时装输入框 -->
      <div :class="ui.trigger()" :data-state="isOpen ? 'open' : 'closed'" @click="toggle">
        <span v-if="$slots.prefix" :class="ui.prefix()">
          <slot name="prefix" />
        </span>

        <!-- 多选：已选路径以 RebornBadge 呈现，超出 max-tag-count 的部分折叠为 “+N” -->
        <div v-if="multiple && displayEntries.length" :class="ui.tagList()">
          <RebornBadge
            v-for="item in visibleTags"
            :key="item.key"
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
            v-bind="item.tagProps"
            @close="removeTag(item.key, $event)"
          >
            <slot name="label" :data="item.raw">{{ item.label }}</slot>
          </RebornBadge>

          <!--
            tooltip 的包裹层默认是行内元素，会按行高撑出比 “+N” 标签高一截的盒子，
            让 “+N” 所在那一行比其他行更高；改成 flex 后包裹层与标签等高
          -->
          <RebornTooltip v-if="collapsedTags.length" :content="collapsedText" class="flex shrink-0">
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

          <!--
            多选搜索位：跟在标签末尾、随标签换行一起流动。收起时也占住这个位置（空壳），展开时才放入输入框，
            开合前后标签排布完全一致，触发器高度不跳变
          -->
          <span v-if="searchEnabled" :class="ui.tagSearch()">
            <!-- 隐形镜像：按关键词撑开搜索位宽度，超出本行余量时整格换行；末尾的不换行空格给光标留位 -->
            <span aria-hidden="true" :class="ui.tagSearchMirror()">
              {{ isSearching ? inputValue : "" }}&nbsp;
            </span>
            <input
              v-if="isSearching"
              ref="searchInputRef"
              type="text"
              :value="inputValue"
              :placeholder="searchPlaceholder"
              :class="ui.searchInput({ class: ui.tagSearchInput() })"
              @input="onSearchInput"
            >
          </span>
        </div>

        <!-- 单选搜索态：输入框顶掉展示文本，已选文本降级为 placeholder 继续提示 -->
        <input
          v-else-if="isSearching"
          ref="searchInputRef"
          type="text"
          :value="inputValue"
          :placeholder="searchPlaceholder"
          :class="ui.searchInput()"
          @input="onSearchInput"
        >

        <span v-else-if="displayEntries.length" :class="ui.triggerText()">
          <slot name="label" :data="displayEntries[0]?.raw ?? null">{{ displayText }}</slot>
        </span>
        <span v-else :class="ui.placeholder()">{{ placeholder }}</span>

        <!-- 尾部图标区：箭头 / 搜索图标 / 加载指示器共用一格，清空按钮悬停时盖上来 -->
        <div :class="ui.triggerIconWrapper()">
          <slot v-if="loading" name="loading-icon">
            <!-- size 必须给 100%：RebornLoading 会把 size 写成行内宽高，行内样式压过 class 上的尺寸 -->
            <RebornLoading type="ring" color="currentColor" size="100%" :class="ui.triggerLoadingIcon()" />
          </slot>
          <slot v-else-if="isSearching" name="search-icon">
            <Icon name="lucide:search" :class="ui.searchIcon()" />
          </slot>
          <slot v-else name="arrow-icon">
            <Icon name="lucide:chevron-down" :class="ui.arrow()" />
          </slot>

          <span v-if="showClearButton" :class="ui.clearBtn()" @click.stop="clear">
            <Icon name="lucide:x" class="size-full" />
          </span>
        </div>
      </div>
    </template>

    <template #content>
      <div :class="ui.dropdown()">
        <div v-if="loading" :class="ui.loading()">
          <Icon name="lucide:loader-2" :class="ui.loadingIcon()" />
          <span>加载中...</span>
        </div>

        <template v-else>
          <!-- 搜索结果：把命中的选项拍平成一列，行样式与面板一致 -->
          <div v-if="isSearchMode" ref="searchListRef" :class="ui.searchList()" @scroll="onSearchScroll">
            <div
              v-if="searchResults.length"
              :class="searchRows.virtual ? 'relative shrink-0' : undefined"
              :style="searchRows.virtual ? { height: `${searchRows.totalHeight}px` } : undefined"
            >
              <div
                :class="searchRows.virtual ? 'absolute inset-x-0 top-0 flex flex-col gap-0' : ui.optionList()"
                :style="searchRows.virtual ? { transform: `translateY(${searchRows.offset}px)`, gap: '0px' } : undefined"
              >
                <div
                  v-for="{ node, checked, indeterminate } in searchRows.rows"
                  :key="node.key"
                  :class="[ui.option({ active: checked }), checked ? ui.optionActive() : '', searchRows.virtual && 'm-0 box-border shrink-0']"
                  :style="searchRows.virtual ? { height: `${searchRows.height}px`, boxSizing: 'border-box' } : undefined"
                  :data-disabled="node.disabled ? 'true' : 'false'"
                  @click="onSearchPick(node)"
                >
                  <slot
                    name="option"
                    :data="node.raw"
                    :level="node.level"
                    :checked="checked"
                    :indeterminate="indeterminate"
                  >
                    <div :class="ui.optionContent()">
                      <!-- 搜索结果没有「展开下一级」这回事，勾选交回整行，勾选框只负责显示 -->
                      <!-- 严格模式下勾选框与面板同步改成圆形，两处形状不一致会像是两个组件 -->
                      <span v-if="multiple" :class="ui.optionCheckbox({ class: 'pointer-events-none' })">
                        <RebornCheckbox
                          size="sm"
                          :color="color"
                          :model-value="checked"
                          :indeterminate="indeterminate"
                          :disabled="node.disabled"
                          :ui="checkStrictly ? { control: 'rounded-full' } : undefined"
                        />
                      </span>
                      <span :class="ui.optionLabel()">{{ searchLabelOf(node) }}</span>
                    </div>
                  </slot>
                </div>
              </div>
            </div>
            <div v-else :class="ui.empty()">
              <slot name="empty">无匹配结果</slot>
            </div>
          </div>

          <!-- 级联面板常驻挂载：搜索时只是被盖住，回到面板才不会丢掉展开路径 -->
          <RebornCascaderPanel
            v-show="!isSearchMode"
            ref="panelRef"
            :model-value="panelValue"
            :options="options"
            :path-mode="pathMode"
            :multiple="multiple"
            :expand-trigger="expandTrigger"
            :check-strictly="checkStrictly"
            :load-more="loadMore"
            :field-names="fieldNames"
            :value-key="valueKey"
            :expand-child="expandChild"
            :size="currentSize"
            :color="color"
            :bordered="false"
            :disabled="isDisabled"
            :virtual-list-props="virtualListProps"
            :ui="uiOverrides"
            @change="onPanelChange"
            @select="onPanelSelect"
          >
            <template v-if="$slots.option" #option="scope">
              <slot
                name="option"
                :data="scope.data"
                :level="scope.level"
                :checked="scope.checked"
                :indeterminate="scope.indeterminate"
              />
            </template>
            <template #empty>
              <slot name="empty">暂无数据</slot>
            </template>
          </RebornCascaderPanel>
        </template>
      </div>
    </template>
  </RebornSelectTrigger>
</template>
