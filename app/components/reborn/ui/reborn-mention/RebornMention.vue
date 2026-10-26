<script setup lang="ts">
import type { CSSProperties, StyleValue } from "vue";
import type { InputUi } from "../reborn-input/RebornInput.vue";
import type { mentionPlacements, MentionUI } from "./reborn-mention.config";
import type { MentionContext } from "./reborn-mention.utils";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { computed, nextTick, shallowRef, useAttrs, useSlots, useTemplateRef, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { getArrowCenter, resolveFloatingPosition } from "~/lib/floating";
import { cn } from "~/lib/utils";
import RebornInput from "../reborn-input/RebornInput.vue";
import { mentionTheme } from "./reborn-mention.config";
import { getCaretCoordinates, getMentionContext, insertMention, removeWholeMention } from "./reborn-mention.utils";

/** 提及选项：value 是插入输入框的文本，label 是下拉框里展示的文本（缺省取 value） */
export interface MentionOption {
  value?: string;
  label?: string;
  disabled?: boolean;
  [key: string]: any;
}

/** options 的字段映射：后端数据字段名不叫 value / label / disabled 时用它对齐 */
export interface MentionOptionProps {
  value?: string;
  label?: string;
  disabled?: string;
}

export interface MentionProps {
  /**
   * 提及选项列表
   * @defaultValue []
   */
  options?: MentionOption[];
  /**
   * options 的字段映射
   * @defaultValue { value: 'value', label: 'label', disabled: 'disabled' }
   */
  props?: MentionOptionProps;
  /**
   * 触发下拉框的前缀字符，每个只能是 1 个字符；传数组时任一字符都能触发
   * @defaultValue '@'
   */
  prefix?: string | string[];
  /**
   * 拆分符：选中后自动补在提及之后，也是判定「提及已结束」的字符，只能是 1 个字符
   * @defaultValue ' '
   */
  split?: string;
  /** 自定义筛选逻辑，返回 true 保留该选项；传 false 关闭本地筛选（远程搜索时由 search 事件回填 options） */
  filterOption?: false | ((pattern: string, option: MentionOption) => boolean);
  /**
   * 下拉面板的展开方向，放不下时自动翻到另一侧
   * @defaultValue 'bottom'
   */
  placement?: (typeof mentionPlacements)[number];
  /**
   * 下拉面板是否带指向光标的箭头
   * @defaultValue false
   */
  showArrow?: boolean;
  /**
   * 下拉面板与输入框之间在默认间距之上的额外偏移，单位 px
   * @defaultValue 0
   */
  offset?: number;
  /**
   * 退格时是否把整个提及（前缀 + 选项值 + 拆分符）一次删除；只对 options 里存在的值生效
   * @defaultValue false
   */
  whole?: boolean;
  /** 自定义「是否整体删除」的判断，传入后即使不开 whole 也按它的返回值整体删除 */
  checkIsWhole?: (pattern: string, prefix: string) => boolean;
  /**
   * 下拉面板是否处于加载状态；加载中即使没有选项也会展开面板
   * @defaultValue false
   */
  loading?: boolean;
  /** 追加到下拉面板外壳的类名 */
  popperClass?: string | Record<string, boolean>;
  /** 下拉面板外壳的行内样式 */
  popperStyle?: string | CSSProperties;
  /** 追加到根容器的类名 */
  class?: any;
  /** 按结构键覆盖下拉面板各节点的样式 */
  ui?: MentionUI;
  /** 透传给内部 RebornInput 的 ui，覆盖输入框各节点的样式 */
  inputUi?: InputUi;
}

defineOptions({
  name: "RebornMention",
  // 其余属性（type、placeholder、size、disabled、事件监听…）全部透传给内部的 RebornInput
  inheritAttrs: false,
});

const props = withDefaults(defineProps<MentionProps>(), {
  options: () => [],
  props: () => ({}),
  prefix: "@",
  split: " ",
  // 类型里含 false，Vue 会把它当布尔属性：不写默认值时未传会被强转成 false（即「不筛选」），必须显式给 undefined
  filterOption: undefined,
  placement: "bottom",
  showArrow: false,
  offset: 0,
  whole: false,
  loading: false,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 光标进入一个提及（输入前缀或在检索词里移动光标）时触发，远程搜索在这里请求数据 */
  search: [pattern: string, prefix: string];
  /** 选中选项、选项值已插入输入框后触发 */
  select: [option: MentionOption, prefix: string];
  /** 退格整体删除了一个提及后触发 */
  wholeRemove: [pattern: string, prefix: string];
  /** 输入值变化时触发，包括选中选项与整体删除引起的变化 */
  input: [value: string];
}>();

/** 输入框的值 */
const model = defineModel<string>({ default: "" });
/**
 * 键入、失焦与错误态由内部 RebornInput 接入表单；选中候选、整体删除是本组件直接改写的值，
 * 不经过输入框的 input 事件，需要自己按表单的 trigger 配置触发字段校验
 */
const { validate } = useFormInject();

const attrs = useAttrs();
const rootStyle = computed(() => attrs.style as StyleValue);

if (import.meta.dev) {
  const prefixes = Array.isArray(props.prefix) ? props.prefix : [props.prefix];
  if (prefixes.some(item => item.length !== 1))
    console.warn("[RebornMention] prefix 的每一项都必须是 1 个字符");
  if (props.split.length !== 1)
    console.warn("[RebornMention] split 必须是 1 个字符");
}

/**
 * 透传给 RebornInput 的属性：style 留给根容器。
 * 在模板里调用、每次渲染求值：attrs 代理只在读取具体键时追踪，放进 computed 时初始为空就没有任何依赖，之后新增的属性永远转交不过去
 */
function inputAttrs() {
  const { style: _style, ...rest } = attrs;
  return rest;
}

const slots = useSlots();
/** 下拉面板自己的插槽，其余插槽都属于输入框 */
const DROPDOWN_SLOTS = new Set(["label", "loading", "header", "footer"]);
/** 输入框插槽名：在模板里调用、每次渲染取当次的插槽；slots 不是响应式对象，放进 computed 会一直缓存首次结果 */
function inputSlotNames() {
  return Object.keys(slots).filter(name => !DROPDOWN_SLOTS.has(name));
}

const inputRef = useTemplateRef<InstanceType<typeof RebornInput>>("inputRef");
const rootRef = useTemplateRef<HTMLElement>("rootRef");
const dropdownRef = useTemplateRef<HTMLElement>("dropdownRef");
const listRef = useTemplateRef<HTMLElement>("listRef");

/** 内部原生 input / textarea 元素 */
function getInputEl(): HTMLInputElement | HTMLTextAreaElement | null {
  return (inputRef.value?.ref as HTMLInputElement | HTMLTextAreaElement | null | undefined) ?? null;
}

// ─── 选项 ───────────────────────────────────────────────────────

const fieldNames = computed(() => ({ value: "value", label: "label", disabled: "disabled", ...props.props }));
const getValue = (option: MentionOption) => String(option[fieldNames.value.value] ?? "");
const getLabel = (option: MentionOption) => String(option[fieldNames.value.label] ?? getValue(option));
const isDisabled = (option: MentionOption) => Boolean(option[fieldNames.value.disabled]);

const prefixList = computed(() => (Array.isArray(props.prefix) ? props.prefix : [props.prefix]));

/** 光标所在的提及上下文；为 undefined 时说明光标不在任何提及里 */
const mentionCtx = shallowRef<MentionContext>();
/** 光标是否停在检索词里；Esc 收起后置 false，直到下一次输入或移动光标 */
const searching = shallowRef(false);
const isFocus = shallowRef(false);

/** 默认筛选：选项文本包含检索词，不区分大小写 */
function defaultFilter(pattern: string, option: MentionOption) {
  return getLabel(option).toLowerCase().includes(pattern.toLowerCase());
}

const filteredOptions = computed(() => {
  if (props.filterOption === false)
    return props.options;
  const pattern = mentionCtx.value?.pattern ?? "";
  const filter = props.filterOption ?? defaultFilter;
  return props.options.filter(option => filter(pattern, option));
});

/** 面板只在有内容可看时展开：没有选项又不在加载，就不弹一个空框 */
const dropdownVisible = computed(
  () => isFocus.value && searching.value && (filteredOptions.value.length > 0 || props.loading),
);

/** 当前指向的选项下标（filteredOptions 中的位置），-1 表示没有 */
const hoveringIndex = shallowRef(-1);

function firstEnabledIndex() {
  return filteredOptions.value.findIndex(option => !isDisabled(option));
}

// 列表内容变化时回到第一个可选项，Enter 总能选中一个看得见的选项
watch([filteredOptions, dropdownVisible], () => {
  hoveringIndex.value = dropdownVisible.value ? firstEnabledIndex() : -1;
});

/** 键盘上下移动指向，跳过禁用项，到头后从另一端继续 */
function moveHovering(step: 1 | -1) {
  const list = filteredOptions.value;
  if (!list.some(option => !isDisabled(option)))
    return;
  let index = hoveringIndex.value;
  do {
    index = (index + step + list.length) % list.length;
  } while (isDisabled(list[index]!));
  hoveringIndex.value = index;
  nextTick(() => {
    listRef.value?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  });
}

// ─── 上下文同步 ─────────────────────────────────────────────────

/** 按光标位置重新计算提及上下文；光标停在检索词里时展开面板并派发 search */
function syncContext() {
  const el = getInputEl();
  if (!el || el.selectionEnd === null) {
    mentionCtx.value = undefined;
    searching.value = false;
    return;
  }
  const ctx = getMentionContext(el.value, el.selectionEnd, prefixList.value, props.split);
  mentionCtx.value = ctx;
  searching.value = Boolean(ctx && ctx.splitIndex === -1);
  if (searching.value)
    emit("search", ctx!.pattern, ctx!.prefix);
}

/** 写回新值并把光标放到 selection；受控绑定下 model 要等父组件回写，派发与光标都用本地的新值 */
function commitValue(value: string, selection: number) {
  model.value = value;
  emit("input", value);
  validate("change");
  nextTick(() => {
    const el = getInputEl();
    if (!el)
      return;
    el.setSelectionRange(selection, selection);
    el.focus();
    syncContext();
  });
}

function handleInput(value: string | number) {
  emit("input", String(value));
  syncContext();
}

function handleSelect(option: MentionOption) {
  const el = getInputEl();
  const ctx = mentionCtx.value;
  if (!el || !ctx || isDisabled(option))
    return;
  const result = insertMention(el.value, ctx, getValue(option), props.split);
  commitValue(result.value, result.selection);
  emit("select", option, ctx.prefix);
}

/** 退格整体删除：whole 只认 options 里存在的值，checkIsWhole 由调用方自己判断 */
function tryRemoveWhole(event: KeyboardEvent) {
  if (!props.whole && !props.checkIsWhole)
    return;
  const el = getInputEl();
  // 有选区时按浏览器默认行为删选区，不做整体删除
  if (!el || el.selectionStart !== el.selectionEnd || el.selectionEnd === null)
    return;
  const ctx = getMentionContext(el.value, el.selectionEnd, prefixList.value, props.split);
  if (!ctx)
    return;
  const isWhole = props.checkIsWhole
    ? props.checkIsWhole(ctx.pattern, ctx.prefix)
    : props.options.some(option => getValue(option) === ctx.pattern);
  const result = isWhole ? removeWholeMention(el.value, ctx) : undefined;
  if (!result)
    return;
  event.preventDefault();
  commitValue(result.value, result.selection);
  emit("wholeRemove", ctx.pattern, ctx.prefix);
}

function handleKeydown(event: KeyboardEvent) {
  // 输入法合成中的按键属于候选词选择，不能当成列表导航
  if (event.isComposing)
    return;

  if (dropdownVisible.value) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveHovering(event.key === "ArrowDown" ? 1 : -1);
      return;
    }
    if (event.key === "Enter") {
      const option = filteredOptions.value[hoveringIndex.value];
      if (option && !props.loading) {
        // 阻止 textarea 换行、表单提交
        event.preventDefault();
        handleSelect(option);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      searching.value = false;
      return;
    }
  }

  if (event.key === "Backspace")
    tryRemoveWhole(event);
}

/** 只有移动光标的按键需要重算上下文；字符键已经由 input 事件处理，这里再算会重复派发 search */
const CARET_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

function handleKeyup(event: KeyboardEvent) {
  if (CARET_KEYS.has(event.key))
    syncContext();
}

function handleFocus() {
  isFocus.value = true;
}

function handleBlur() {
  isFocus.value = false;
}

// ─── 面板定位 ───────────────────────────────────────────────────

/** 面板与输入框的默认间距；带箭头时让出箭头伸出面板的 6px */
const BASE_GAP = 4;
const ARROW_GAP = 10;
/** 箭头中心距面板左端的最小内缩量：8px 圆角 + 半个箭头底边，与 RebornPopover 同一口径 */
const ARROW_INSET = 17;

const side = shallowRef<"top" | "bottom">("bottom");
const positionStyle = shallowRef<CSSProperties>({});
const arrowStyle = shallowRef<CSSProperties>({});

/**
 * 面板与输入框等宽并左对齐；箭头仍指向前缀字符，输入检索词时不会横向移动面板。
 * 纵向单行输入框取整个输入框盒子的上下沿，textarea 取前缀所在那一行的上下沿。
 */
function updatePosition() {
  const el = getInputEl();
  const panel = dropdownRef.value;
  const root = rootRef.value;
  const ctx = mentionCtx.value;
  if (!el || !panel || !root || !ctx)
    return;

  const rect = el.getBoundingClientRect();
  const inputRect = root.getBoundingClientRect();
  // 先同步宽度再测量高度，长选项换行后向上展开的位置才准确。
  const width = `${inputRect.width}px`;
  panel.style.setProperty("--rb-mention-width", width);
  const caret = getCaretCoordinates(el, ctx.prefixIndex);
  const x = rect.left + caret.left - el.scrollLeft;
  const box = el.nodeName === "INPUT"
    ? (el.parentElement ?? el).getBoundingClientRect()
    : { top: rect.top + caret.top - el.scrollTop, bottom: rect.top + caret.top - el.scrollTop + caret.height };

  const triggerRect = {
    top: box.top,
    bottom: box.bottom,
    left: inputRect.left,
    right: inputRect.right,
    width: inputRect.width,
    height: box.bottom - box.top,
  };
  const size = { width: panel.offsetWidth, height: panel.offsetHeight };
  const result = resolveFloatingPosition({
    triggerRect,
    size,
    side: props.placement,
    align: "start",
    offset: (props.showArrow ? ARROW_GAP : BASE_GAP) + props.offset,
  });

  side.value = result.side as "top" | "bottom";
  positionStyle.value = { "--rb-mention-width": width, left: `${result.position.left}px`, top: `${result.position.top}px` };

  if (props.showArrow) {
    const center = getArrowCenter({
      panelStart: result.position.left,
      panelExtent: size.width,
      triggerStart: x,
      triggerExtent: 0,
      align: "center",
      inset: ARROW_INSET,
    });
    // 12px 方块旋转后对角线约 17px，压进面板 6px，另一半露在外面指向光标
    arrowStyle.value = side.value === "bottom"
      ? { left: `${center - 6}px`, top: "-6.5px" }
      : { left: `${center - 6}px`, bottom: "-6.5px" };
  }
}

// 展开、内容变化（高度变了，向上展开时位置要跟着变）都要重新定位；post 在 DOM 更新后、绘制前执行，不会闪一帧
watch(
  [dropdownVisible, () => filteredOptions.value.length, () => props.loading, mentionCtx],
  () => {
    if (dropdownVisible.value)
      updatePosition();
  },
  { flush: "post" },
);

// 面板是 fixed 定位，页面或任一祖先滚动、窗口缩放都会让它和输入框错位
useEventListener(window, "scroll", () => dropdownVisible.value && updatePosition(), { capture: true, passive: true });
useEventListener(window, "resize", () => dropdownVisible.value && updatePosition(), { passive: true });
// 父容器布局变化时也同步宽度，无需等待窗口触发 resize。
useResizeObserver(rootRef, () => dropdownVisible.value && updatePosition());

// ─── 样式 ───────────────────────────────────────────────────────

const ui = computed(() => {
  const s = mentionTheme({ side: side.value });
  const o = props.ui;
  return {
    root: () => s.root({ class: cn(o.root, props.class) }),
    dropdown: () => s.dropdown({ class: cn(o.dropdown, props.popperClass) }),
    header: () => s.header({ class: o.header }),
    list: () => s.list({ class: o.list }),
    option: (active: boolean, disabled: boolean) =>
      cn(s.option({ class: o.option }), active && s.optionActive({ class: o.optionActive }), disabled && s.optionDisabled({ class: o.optionDisabled })),
    optionLabel: () => s.optionLabel({ class: o.optionLabel }),
    footer: () => s.footer({ class: o.footer }),
    loading: () => s.loading({ class: o.loading }),
    loadingIcon: () => s.loadingIcon({ class: o.loadingIcon }),
    arrow: () => s.arrow({ class: o.arrow }),
  };
});

defineExpose({
  /** 内部 RebornInput 组件实例，可调用其 focus / blur / select 等方法 */
  input: inputRef,
  /** 下拉面板元素（未展开时为 null） */
  dropdown: dropdownRef,
  /** 下拉面板是否展开 */
  dropdownVisible,
});
</script>

<template>
  <div ref="rootRef" :class="ui.root()" :style="rootStyle">
    <RebornInput
      ref="inputRef" v-bind="inputAttrs()" :model-value="model" :ui="inputUi" role="combobox"
      aria-autocomplete="list" :aria-expanded="dropdownVisible" @update:model-value="model = String($event ?? '')"
      @input="handleInput" @keydown="handleKeydown" @keyup="handleKeyup" @click="syncContext" @focus="handleFocus"
      @blur="handleBlur"
    >
      <!-- 输入框插槽（prefix / suffix / prepend / append / password-icon）原样转交 RebornInput -->
      <template v-for="name in inputSlotNames()" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope ?? {}" />
      </template>
    </RebornInput>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0 scale-95"
      >
        <!-- mousedown.prevent：点选项时输入框不失焦，面板不会在 click 之前就被 blur 收起 -->
        <div
          v-if="dropdownVisible" ref="dropdownRef" :class="ui.dropdown()" :style="[popperStyle, positionStyle]"
          :data-side="side" role="listbox" @mousedown.prevent
        >
          <div v-if="showArrow" :class="ui.arrow()" :style="arrowStyle" />

          <div v-if="$slots.header" :class="ui.header()">
            <slot name="header" />
          </div>

          <div v-if="loading" :class="ui.loading()">
            <slot name="loading">
              <Icon name="lucide:loader-2" :class="ui.loadingIcon()" />
              <span>加载中...</span>
            </slot>
          </div>

          <div v-else ref="listRef" :class="ui.list()">
            <div
              v-for="(item, index) in filteredOptions" :key="`${index}-${getValue(item)}`" :data-index="index" role="option"
              :aria-selected="index === hoveringIndex" :aria-disabled="isDisabled(item)"
              :class="ui.option(index === hoveringIndex, isDisabled(item))" @mouseenter="!isDisabled(item) && (hoveringIndex = index)"
              @click="handleSelect(item)"
            >
              <slot name="label" :item="item" :index="index">
                <span :class="ui.optionLabel()">{{ getLabel(item) }}</span>
              </slot>
            </div>
          </div>

          <div v-if="$slots.footer" :class="ui.footer()">
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
