<script setup lang="ts">
import type { ClassValue } from "clsx";
import type {
  inputNumberAligns,
  inputNumberColors,
  inputNumberShapes,
  inputNumberSizes,
  inputNumberVariants,
} from "./reborn-input-number.config";
import { computed, onMounted, ref, toRef, useAttrs } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-input-number.config";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<InputNumberProps>(), {
  min: Number.MIN_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
  step: 1,
  stepStrictly: false,
  disabled: false,
  readonly: false,
  controls: true,
  hideButton: false,
  modelEvent: "change",
  validateEvent: true,
  align: "center",
  disabledScientific: false,
  inputmode: "decimal",
  tabindex: 0,
  size: "md",
  color: "primary",
  shape: "square",
  variant: "outlined",
  keyboard: true,
  changeOnWheel: false,
});

const emit = defineEmits<{
  /** 绑定值被改变时触发，回调为 (新值, 旧值) */
  (e: "change", value: number | null, oldValue: number | null): void;
  /** 输入框获得焦点时触发 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点（并完成数值修正）后触发 */
  (e: "blur", event: FocusEvent): void;
}>();

const b = tv(theme);

/** 原生 inputmode 的合法取值 */
export type InputNumberInputMode =
  | "none"
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url";

/** 调用 focus() 时焦点的落位方式 */
export type InputNumberFocusCursor = "start" | "end" | "all";

export interface InputNumberProps {
  /** 非受控模式（未绑定 v-model）下的初始值 */
  defaultValue?: number | null;
  /** 允许的最小值 */
  min?: number;
  /** 允许的最大值 */
  max?: number;
  /** 步长 */
  step?: number;
  /** 是否只能输入 step 的倍数；开启后提交时会把数值就近吸附到最近的倍数 */
  stepStrictly?: boolean;
  /**
   * 数值精度（保留的小数位数）。
   * 当 precision 小于 step 的小数位时，按 step 的小数位生效，否则步进结果会被截断。
   */
  precision?: number;
  /** 尺寸档位，对应主题令牌 --height-input-*（sm 24px / md 32px / lg 40px） */
  size?: (typeof inputNumberSizes)[number];
  /** 原生 readonly 语义：只读，既不能键入也不能通过按钮增减 */
  readonly?: boolean;
  disabled?: boolean;
  /** 是否使用增减控制按钮 */
  controls?: boolean;
  /** 是否隐藏增减按钮；与 controls=false 等效，任一成立即隐藏 */
  hideButton?: boolean;
  /**
   * 控制按钮位置：默认左右分列，'left' / 'right' 为在对应侧上下堆叠。
   * 堆叠时按钮默认隐藏，悬停或聚焦时从所在侧滑入显示，并与输入区之间以分割线隔开。
   */
  controlsPosition?: "left" | "right";
  /**
   * 绑定值的更新时机。
   * 'change'（默认）失焦或按下 Enter 时更新；'input' 键入时即时更新，
   * 此模式下键入值允许临时超出 min/max，失焦时统一修正。
   */
  modelEvent?: "change" | "input";
  /** 原生 name */
  name?: string;
  /** 原生 aria-label */
  ariaLabel?: string;
  /** 原生 placeholder */
  placeholder?: string;
  /** 原生 id */
  id?: string;
  /** 原生 inputmode，默认 decimal 以便移动端唤起数字键盘 */
  inputmode?: InputNumberInputMode;
  /** 原生 tabindex */
  tabindex?: string | number;
  /** 输入框被清空时回填的值：'min' / 'max' 取对应边界，数字取该值，null 置空 */
  valueOnClear?: number | null | "min" | "max";
  /** 是否触发所在表单项的校验 */
  validateEvent?: boolean;
  /** 输入文本对齐 */
  align?: (typeof inputNumberAligns)[number];
  /** 禁用科学计数法输入：键入的 e / E 会被剔除 */
  disabledScientific?: boolean;
  /** 展示值格式化，如 (v) => `¥ ${v}`；需与 parser 配对使用 */
  formatter?: (value: number | string) => string;
  /** 从格式化文本中解析出数值，与 formatter 配对使用 */
  parser?: (text: string) => string;
  color?: (typeof inputNumberColors)[number];
  /** 外形轮廓：circle 为胶囊圆角，square 为方角 */
  shape?: (typeof inputNumberShapes)[number];
  /**
   * 形态变体：
   * outlined 白底描边（默认）／filled 灰底填充／borderless 无边框／underlined 仅下划线。
   * underlined 会强制压平圆角，此时 shape 不再生效。
   */
  variant?: (typeof inputNumberVariants)[number];
  /**
   * 是否启用键盘增减：开启时 ↑ / ↓ 按 step 步进并阻止默认的光标跳转，
   * 关闭后方向键回归原生文本框行为（Enter 提交不受此开关影响）。
   */
  keyboard?: boolean;
  /** 是否启用鼠标滚轮增减；仅在输入框已聚焦时生效，避免误吞页面滚动 */
  changeOnWheel?: boolean;
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    button: ClassValue;
    stack: ClassValue;
    stackButton: ClassValue;
    input: ClassValue;
    divider: ClassValue;
    prefix: ClassValue;
    suffix: ClassValue;
    icon: ClassValue;
  }>;
}

/** 绑定值；未绑定 v-model 时由 defineModel 内部保存本地值 */
const model = defineModel<number | null | undefined>();

// 非受控模式打底：仅在完全未绑定时用 defaultValue 初始化
if (model.value === undefined) {
  model.value = props.defaultValue ?? null;
}

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement | null>(null);

/**
 * 键入过程中的原始文本。
 * 为 null 表示不处于键入态，显示值由绑定值推导；非 null 时原样回显，
 * 以便用户能输入 "-"、"1." 这类尚不可解析的中间状态。
 */
const userInput = ref<string | null>(null);

/** 输入框是否持有焦点；changeOnWheel 依赖它来避免误吞页面滚动 */
const isFocused = ref(false);

const {
  orientation,
  size: fieldGroupSize,
  disabled: fieldGroupDisabled,
  isError,
  validate,
} = useFormInject(props);

const size = toRef(props, "size");

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    color: props.color,
    shape: props.shape,
    variant: props.variant,
    align: props.align,
    controlsPosition: props.controlsPosition,
    fieldGroup: orientation.value,
    error: isError.value,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    button: (opts?: { class?: any }) => styles.button({ class: cn(opts?.class, uiOverrides.value.button) }),
    stack: (opts?: { class?: any }) => styles.stack({ class: cn(opts?.class, uiOverrides.value.stack) }),
    stackButton: (opts?: { class?: any }) =>
      styles.stackButton({ class: cn(opts?.class, uiOverrides.value.stackButton) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) }),
    prefix: (opts?: { class?: any }) => styles.prefix({ class: cn(opts?.class, uiOverrides.value.prefix) }),
    suffix: (opts?: { class?: any }) => styles.suffix({ class: cn(opts?.class, uiOverrides.value.suffix) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

// ─── 精度计算 ───────────────────────────────────────────────────

/** 取一个数的小数位数 */
function getDecimalPlaces(value: number | string) {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** 按指定小数位收敛浮点误差 */
function toFixedNumber(value: number, places: number) {
  return Number.parseFloat(value.toFixed(places));
}

/** step 自身的小数位数 */
const stepPlaces = computed(() => getDecimalPlaces(props.step));

/**
 * 实际生效的精度：precision 小于 step 的小数位时取 step 的小数位。
 * 未显式传 precision 时为 undefined，表示不做定长补零。
 */
const numPrecision = computed(() => {
  if (props.precision === undefined) return undefined;
  return Math.max(props.precision, stepPlaces.value);
});

// ─── 取值与规整 ─────────────────────────────────────────────────

/** 清空输入时应回填的值 */
function resolveValueOnClear(): number | null {
  const target = props.valueOnClear;
  if (target === "min") return props.min;
  if (target === "max") return props.max;
  if (typeof target === "number") return target;
  return null;
}

/**
 * 把任意输入规整为合法数值：
 * 空值取 valueOnClear，stepStrictly 吸附到步进倍数，按精度收敛，最后夹紧到 [min, max]。
 *
 * @param value 待规整的原始值，可为输入框文本
 * @param clamp 是否夹紧到 min/max。modelEvent="input" 的键入过程传 false，允许临时越界
 */
function verifyValue(value: number | string | null | undefined, clamp = true): number | null {
  if (value === null || value === undefined) return resolveValueOnClear();

  const text = typeof value === "string" ? value.trim() : value;
  if (text === "") return resolveValueOnClear();

  const parsed = Number(text);
  if (Number.isNaN(parsed)) return null;

  let next = parsed;
  if (props.stepStrictly) {
    const places = Math.max(stepPlaces.value, numPrecision.value ?? 0);
    next = toFixedNumber(Math.round(next / props.step) * props.step, places);
  }
  if (numPrecision.value !== undefined) {
    next = toFixedNumber(next, numPrecision.value);
  }
  if (clamp) {
    if (next > props.max) next = props.max;
    if (next < props.min) next = props.min;
  }
  return next;
}

/** 提交新值：写回 v-model，并在真正发生变化时抛出 change */
function setValue(value: number | null) {
  const oldValue = model.value ?? null;
  if (value === oldValue) return;
  model.value = value;
  emit("change", value, oldValue);
  if (props.validateEvent) validate("change");
}

// ─── 展示与交互状态 ─────────────────────────────────────────────

/** 输入框实际渲染的文本 */
const displayValue = computed(() => {
  if (userInput.value !== null) return userInput.value;

  const value = model.value;
  if (value === null || value === undefined) return "";

  const text = numPrecision.value !== undefined ? value.toFixed(numPrecision.value) : String(value);
  return props.formatter ? props.formatter(text) : text;
});

/** 是否渲染增减按钮：controls 与 hideButton 任一否决即隐藏 */
const showControls = computed(() => props.controls && !props.hideButton);
/** 按钮是否上下堆叠（controls-position="left" / "right"） */
const isControlsStacked = computed(() => props.controlsPosition === "left" || props.controlsPosition === "right");

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);
/** 禁用或只读时一律不允许改值 */
const isLocked = computed(() => isDisabled.value || props.readonly);

const isDecreaseDisabled = computed(() => {
  if (isLocked.value) return true;
  const value = model.value;
  return value !== null && value !== undefined && value <= props.min;
});

const isIncreaseDisabled = computed(() => {
  if (isLocked.value) return true;
  const value = model.value;
  return value !== null && value !== undefined && value >= props.max;
});

// ─── 事件处理 ───────────────────────────────────────────────────

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  let raw = target.value;

  // 禁用科学计数法：剔除 e / E 并回写 DOM，避免出现「已键入但不显示」的错位
  if (props.disabledScientific && /e/i.test(raw)) {
    raw = raw.replace(/e/gi, "");
    target.value = raw;
  }

  userInput.value = raw;

  if (props.modelEvent !== "input") return;

  const text = (props.parser ? props.parser(raw) : raw).trim();
  if (text === "") {
    setValue(resolveValueOnClear());
    return;
  }

  const parsed = Number(text);
  // "-"、"1." 等中间态暂不落库，等下一个可解析字符
  if (Number.isNaN(parsed)) return;

  // input 模式按约定不夹紧 min/max，失焦时由 commitUserInput 统一修正
  setValue(verifyValue(parsed, false));
}

/** 结束键入态：解析并规整输入文本后提交，显示值回到由绑定值推导 */
function commitUserInput() {
  if (userInput.value === null) return;

  const raw = userInput.value;
  const text = props.parser ? props.parser(raw) : raw;
  userInput.value = null;
  setValue(verifyValue(text));
}

function handleFocus(event: FocusEvent) {
  isFocused.value = true;
  emit("focus", event);
}

function handleBlur(event: FocusEvent) {
  isFocused.value = false;
  commitUserInput();
  emit("blur", event);
  if (props.validateEvent) validate("blur");
}

function handleEnter() {
  commitUserInput();
}

/**
 * 按 step 增减。先放大到整数域再还原，避免 0.1 + 0.2 这类浮点误差。
 *
 * @param delta 1 为增，-1 为减
 */
function stepBy(delta: 1 | -1) {
  if (delta === 1 ? isIncreaseDisabled.value : isDecreaseDisabled.value) return;

  const base = model.value ?? 0;
  const places = Math.max(stepPlaces.value, getDecimalPlaces(base), numPrecision.value ?? 0);
  const factor = 10 ** places;
  const next = toFixedNumber((base * factor + delta * props.step * factor) / factor, places);

  // 先退出键入态，否则显示值仍会停留在旧的输入文本上
  userInput.value = null;
  setValue(verifyValue(next));
}

/**
 * ↑ / ↓ 方向键步进。
 * keyboard 为 false 时不拦截，方向键回归原生文本框的「光标跳到首/尾」行为。
 *
 * @param delta 1 为增，-1 为减
 */
function handleArrow(delta: 1 | -1, event: KeyboardEvent) {
  if (!props.keyboard || isLocked.value) return;
  // 阻止方向键把光标弹到文本首尾
  event.preventDefault();
  stepBy(delta);
}

/**
 * 滚轮步进。仅在 changeOnWheel 开启且输入框已聚焦时接管滚动，
 * 其余情况直接放行，页面滚动不受影响。
 */
function handleWheel(event: WheelEvent) {
  if (!props.changeOnWheel || isLocked.value || !isFocused.value) return;
  if (event.deltaY === 0) return;
  event.preventDefault();
  // 向上滚（deltaY < 0）为增，向下滚为减
  stepBy(event.deltaY < 0 ? 1 : -1);
}

// 初始值可能越界或不满足精度/步进约束，挂载后同步一次（只更新 v-model，不抛 change）
onMounted(() => {
  const normalized = verifyValue(model.value);
  if (normalized !== (model.value ?? null)) {
    model.value = normalized;
  }
});

/**
 * 使输入框获得焦点，并按 cursor 决定焦点落位：
 * 'start' 光标置于文本首，'end' 置于文本尾，'all' 全选文本；不传则沿用浏览器默认。
 * 兼容两种调用形式：focus('all') 与 focus({ cursor: 'all' })。
 */
function focus(options?: InputNumberFocusCursor | { cursor?: InputNumberFocusCursor }) {
  const el = inputRef.value;
  if (!el) return;

  el.focus();

  const cursor = typeof options === "string" ? options : options?.cursor;
  if (!cursor) return;

  if (cursor === "all") {
    el.select();
    return;
  }
  const offset = cursor === "start" ? 0 : el.value.length;
  el.setSelectionRange(offset, offset);
}

defineExpose({
  inputRef, // 内部原生 input 元素引用
  focus, // 使输入框获得焦点，可指定 cursor 落位
  blur: () => inputRef.value?.blur(), // 使输入框失去焦点
});
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled" :data-readonly="props.readonly"
    @click="inputRef?.focus()">
    <!-- 左右分列布局：减按钮在最左 -->
    <template v-if="showControls && !isControlsStacked">
      <button type="button" tabindex="-1" :class="ui.button()" :disabled="isDecreaseDisabled" @click.stop="stepBy(-1)">
        <slot name="minus" :icon-class="ui.icon()">
          <!-- decrement 为旧插槽名，保留以兼容既有用法 -->
          <slot name="decrement" :icon-class="ui.icon()">
            <Icon name="lucide:minus" :class="ui.icon()" />
          </slot>
        </slot>
      </button>
      <span :class="ui.divider()" aria-hidden="true" />
    </template>

    <span v-if="$slots.prefix" :class="ui.prefix()" @click.stop>
      <slot name="prefix" />
    </span>

    <input :id="props.id" ref="inputRef" v-bind="inputAttrs" type="text" role="spinbutton" :inputmode="props.inputmode"
      :name="props.name" :aria-label="props.ariaLabel" :tabindex="props.tabindex" :placeholder="props.placeholder"
      :value="displayValue" :disabled="isDisabled" :readonly="props.readonly" :aria-valuenow="model ?? undefined"
      :aria-valuemin="props.min" :aria-valuemax="props.max" :class="ui.input()" @input="handleInput"
      @focus="handleFocus" @blur="handleBlur" @keydown.enter="handleEnter" @keydown.up="handleArrow(1, $event)"
      @keydown.down="handleArrow(-1, $event)" @wheel="handleWheel">

    <span v-if="$slots.suffix" :class="ui.suffix()" @click.stop>
      <slot name="suffix" />
    </span>

    <!-- 左右分列布局：加按钮在最右 -->
    <template v-if="showControls && !isControlsStacked">
      <span :class="ui.divider()" aria-hidden="true" />
      <button type="button" tabindex="-1" :class="ui.button()" :disabled="isIncreaseDisabled" @click.stop="stepBy(1)">
        <slot name="plus" :icon-class="ui.icon()">
          <!-- increment 为旧插槽名，保留以兼容既有用法 -->
          <slot name="increment" :icon-class="ui.icon()">
            <Icon name="lucide:plus" :class="ui.icon()" />
          </slot>
        </slot>
      </button>
    </template>

    <!-- controls-position="left" / "right"：加减按钮上下堆叠，绝对定位悬浮于对应侧，悬停/聚焦时滑入 -->
    <span v-else-if="showControls" :class="ui.stack()">
      <button type="button" tabindex="-1" :class="ui.stackButton()" :disabled="isIncreaseDisabled"
        @click.stop="stepBy(1)">
        <slot name="plus" :icon-class="ui.icon()">
          <slot name="increment" :icon-class="ui.icon()">
            <Icon name="lucide:chevron-up" :class="ui.icon()" />
          </slot>
        </slot>
      </button>
      <button type="button" tabindex="-1" :class="ui.stackButton()" :disabled="isDecreaseDisabled"
        @click.stop="stepBy(-1)">
        <slot name="minus" :icon-class="ui.icon()">
          <slot name="decrement" :icon-class="ui.icon()">
            <Icon name="lucide:chevron-down" :class="ui.icon()" />
          </slot>
        </slot>
      </button>
    </span>
  </div>
</template>