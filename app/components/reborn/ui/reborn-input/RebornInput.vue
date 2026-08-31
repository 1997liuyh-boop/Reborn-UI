<script setup lang="ts">
import type {
  inputColors,
  inputResizes,
  inputShapes,
  inputSizes,
  inputVariants,
} from "./reborn-input.config";
import { computed, nextTick, onMounted, ref, toRef, useAttrs, useSlots, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-input.config";

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<InputProps>(), {
  type: "text",
  size: "md",
  color: "primary",
  variant: "outlined",
  shape: "square",
  disabled: false,
  readonly: false,
  showWordLimit: false,
  wordLimitPosition: "inside",
  clearable: false,
  clearIcon: "lucide:x-circle",
  showPassword: false,
  password: false,
  rows: 2,
  autosize: false,
  autocomplete: "off",
  autofocus: false,
  validateEvent: true,
  separator: true,
  as: "input",
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 输入值变化时触发（v-model 同步） */
  (e: "update:modelValue", value: string | number): void;
  /** 输入值变化时触发，回调为当前值（输入法合成期间不触发） */
  (e: "input", value: string | number): void;
  /** 失焦或按下 Enter 且值相对聚焦时发生变化后触发 */
  (e: "change", value: string | number): void;
  /** 输入框获得焦点时触发 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点时触发 */
  (e: "blur", event: FocusEvent): void;
  /** 点击清除按钮清空内容后触发 */
  (e: "clear"): void;
  /** 按下键时触发 */
  (e: "keydown", event: KeyboardEvent): void;
  /** 鼠标进入输入框时触发 */
  (e: "mouseenter", event: MouseEvent): void;
  /** 鼠标离开输入框时触发 */
  (e: "mouseleave", event: MouseEvent): void;
  /** 输入法合成开始时触发 */
  (e: "compositionstart", event: CompositionEvent): void;
  /** 输入法合成改变时触发 */
  (e: "compositionupdate", event: CompositionEvent): void;
  /** 输入法合成完成时触发 */
  (e: "compositionend", event: CompositionEvent): void;
}>();

const b = tv(theme);

/** 按内部结构键覆盖节点类名；旧键（wrapper/input/leading/trailing…）全部保留 */
export interface InputUi {
  root?: string;
  group?: string;
  prepend?: string;
  append?: string;
  wrapper?: string;
  input?: string;
  leading?: string;
  iconBox?: string;
  icon?: string;
  trailing?: string;
  clear?: string;
  password?: string;
  separator?: string;
  count?: string;
}

/** autosize 的对象形式：限定自适应的最小 / 最大行数 */
export interface InputAutosize {
  minRows?: number;
  maxRows?: number;
}

export interface InputProps {
  /** 输入框绑定值（v-model） */
  modelValue?: string | number;
  /** v-model 修饰符（trim 失焦去首尾空格 / number 转数字），由 Vue 自动注入 */
  modelModifiers?: { trim?: boolean; number?: boolean };
  /** 非受控模式下的初始值，未绑定 modelValue 时生效 */
  defaultValue?: string | number;
  /** 输入类型（原生 type）；传 'textarea' 渲染为多行文本域 */
  type?: string;
  /** 尺寸：sm/md/lg，影响高度、内边距与字号（sm/md 14px、lg 16px） */
  size?: (typeof inputSizes)[number];
  /** 聚焦时描边 / 下划线 / 分割线的高亮颜色 */
  color?: (typeof inputColors)[number];
  /**
   * 形态变体：
   * outlined 底色描边／filled 灰底填充（默认，聚焦转 bg-gray-1 + 描边）／
   * borderless 无边框／underlined 仅下划线（圆角强制为 0，此时 shape 不再生效）。
   */
  variant?: (typeof inputVariants)[number];
  /** 外形轮廓：circle 为胶囊圆角，square 按尺寸取圆角令牌（4/6/8px） */
  shape?: (typeof inputShapes)[number];
  placeholder?: string;
  disabled?: boolean;
  /** 原生 readonly：只读 */
  readonly?: boolean;
  /** 原生 maxlength；设置 count-graphemes 后不再下发给原生属性 */
  maxlength?: string | number;
  /** 原生 minlength */
  minlength?: string | number;
  /** 是否显示字数统计，仅 type 为 'text' 或 'textarea' 时生效 */
  showWordLimit?: boolean;
  /** 字数统计位置：inside 在输入框内（默认），outside 在输入框下方 */
  wordLimitPosition?: "inside" | "outside";
  /** 自定义字素计数函数；设置后绕过原生 maxlength/minlength 约束，只做统计展示 */
  countGraphemes?: (value: string) => number;
  /** 是否显示清除按钮：有内容且非禁用/只读时出现，点击清空并重新聚焦 */
  clearable?: boolean;
  /** 自定义清除图标名 */
  clearIcon?: string;
  /** 展示值格式化，仅 type="text" 时生效；需与 parser 配对使用 */
  formatter?: (value: string | number) => string;
  /** 从格式化文本中提取值，仅 type="text" 时生效；与 formatter 配对使用 */
  parser?: (text: string) => string;
  /** 是否显示切换密码图标（内容掩码显示，可切换明文） */
  showPassword?: boolean;
  /** 旧属性名，等价于 showPassword，保留以兼容既有用法 */
  password?: boolean;
  /** 自定义前缀图标名（#prefix 插槽优先） */
  prefixIcon?: string;
  /** 自定义后缀图标名（#suffix 插槽优先） */
  suffixIcon?: string;
  /** 输入框行数，仅 textarea 模式有效 */
  rows?: number;
  /** textarea 高度是否自适应；可传 { minRows, maxRows } 限定范围 */
  autosize?: boolean | InputAutosize;
  /** 控制 textarea 是否能被用户缩放（CSS resize） */
  resize?: (typeof inputResizes)[number];
  /** 原生 autocomplete */
  autocomplete?: string;
  /** 原生 name */
  name?: string;
  /** 原生 form */
  form?: string;
  /** 原生 max */
  max?: string | number;
  /** 原生 min */
  min?: string | number;
  /** 原生 step */
  step?: string | number;
  /** 原生 autofocus：挂载后自动聚焦 */
  autofocus?: boolean;
  /** 等价于原生 aria-label */
  ariaLabel?: string;
  /** 旧属性名，等价于 ariaLabel，保留以兼容既有用法 */
  label?: string;
  /** 原生 tabindex */
  tabindex?: string | number;
  /** 原生 inputmode */
  inputmode?: string;
  /** 原生 id */
  id?: string;
  /** 输入时是否触发所在表单项的校验 */
  validateEvent?: boolean;
  /** input / textarea 元素的内联 style */
  inputStyle?: string | Record<string, any>;
  /** 是否在清除按钮、密码开关与后缀之间显示竖分割线 */
  separator?: boolean;
  /** 旧属性：渲染为 input 还是 textarea；等价于 type="textarea"，保留以兼容既有用法 */
  as?: "input" | "textarea";
  class?: any;
  ui?: InputUi;
}

const attrs = useAttrs();
const slots = useSlots();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const localValue = ref(props.defaultValue ?? "");

// 聚焦状态
const isFocus = ref(false);
/** 是否处于输入法合成中；合成期间不同步 v-model */
const isComposing = ref(false);
/** 密码是否以明文展示 */
const passwordVisible = ref(false);
/** 聚焦时的快照值，用于判定 change 事件 */
const focusedValue = ref<string>("");

const inputValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : localValue.value,
);
/** 是否渲染为多行 textarea：type="textarea" 或旧属性 as="textarea" */
const isMultiline = computed(() => props.type === "textarea" || props.as === "textarea");
const isFilled = computed(() => `${inputValue.value ?? ""}`.length > 0);
/** 是否启用密码掩码（新旧属性任一开启即生效） */
const isPasswordMode = computed(() => props.showPassword || props.password);

const showClear = computed(() => {
  return props.clearable && !isMultiline.value && !props.disabled && !props.readonly && `${inputValue.value}` !== "";
});

// ─── 字数统计 ───────────────────────────────────────────────────

/** 当前字数：优先用 countGraphemes 自定义计数 */
const currentCount = computed(() => {
  const text = String(inputValue.value ?? "");
  return props.countGraphemes ? props.countGraphemes(text) : text.length;
});

/** 是否展示字数统计：需开启 showWordLimit、设置 maxlength，且 type 为 text/textarea */
const showLimit = computed(
  () =>
    props.showWordLimit
    && props.maxlength !== undefined
    && (props.type === "text" || isMultiline.value),
);

/** 下发给原生的 maxlength / minlength；countGraphemes 存在时绕过原生约束 */
const nativeMaxlength = computed(() => (props.countGraphemes ? undefined : props.maxlength));
const nativeMinlength = computed(() => (props.countGraphemes ? undefined : props.minlength));

// ─── 样式 ───────────────────────────────────────────────────────

const {
  orientation,
  size: fieldGroupSize,
  disabled: fieldGroupDisabled,
  isError,
  validate,
} = useFormInject(props);

const size = toRef(props, "size");
const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    color: props.color,
    variant: props.variant,
    shape: props.shape,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
    error: isError.value,
    hasPrepend: !isMultiline.value && !!slots.prepend,
    hasAppend: !isMultiline.value && !!slots.append,
  });

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
    group: (opts?: { class?: any }) => styles.group({ class: cn(opts?.class, uiOverrides.value.group) }),
    prepend: (opts?: { class?: any }) => styles.prepend({ class: cn(opts?.class, uiOverrides.value.prepend) }),
    append: (opts?: { class?: any }) => styles.append({ class: cn(opts?.class, uiOverrides.value.append) }),
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, props.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    leading: (opts?: { class?: any }) => styles.leading({ class: cn(opts?.class, uiOverrides.value.leading) }),
    iconBox: (opts?: { class?: any }) => styles.iconBox({ class: cn(opts?.class, uiOverrides.value.iconBox) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    trailing: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.trailing) }),
    clear: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.clear) }),
    password: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.password) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
    count: (opts?: { class?: any }) => styles.count({ class: cn(opts?.class, uiOverrides.value.count) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

// ─── 展示值与格式化 ─────────────────────────────────────────────

/** formatter / parser 仅在单行 type="text" 下生效 */
const useFormatter = computed(() => !!props.formatter && props.type === "text" && !isMultiline.value);

/** 输入框实际渲染的文本 */
const displayValue = computed(() => {
  const value = inputValue.value ?? "";
  return useFormatter.value ? props.formatter!(value) : value;
});

/** 原生 type：textarea 不传；密码掩码态强制 password */
const nativeType = computed(() => {
  if (isMultiline.value) return undefined;
  if (isPasswordMode.value && !passwordVisible.value) return "password";
  if (isPasswordMode.value) return "text";
  return props.type;
});

// ─── textarea 高度自适应 ────────────────────────────────────────

/** autosize 计算出的 textarea 内联样式 */
const textareaStyle = ref<Record<string, string>>({});

/**
 * 重新计算 textarea 高度：先归零再取 scrollHeight，
 * autosize 传对象时按行高换算 minRows / maxRows 边界。
 */
function resizeTextarea() {
  const el = inputRef.value as HTMLTextAreaElement | null;
  if (!isMultiline.value || !props.autosize || !el) return;

  const style = window.getComputedStyle(el);
  const lineHeight = Number.parseFloat(style.lineHeight) || 20;
  const extra
    = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
    + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);

  // 先重置高度，否则 scrollHeight 只增不减
  textareaStyle.value = { height: "auto" };
  el.style.height = "auto";

  let height = el.scrollHeight;
  if (typeof props.autosize === "object") {
    const { minRows, maxRows } = props.autosize;
    if (minRows) height = Math.max(height, minRows * lineHeight + extra);
    if (maxRows) height = Math.min(height, maxRows * lineHeight + extra);
  }
  textareaStyle.value = { height: `${height}px` };
  el.style.height = `${height}px`;
}

/** input / textarea 元素的最终内联样式 */
const mergedInputStyle = computed(() => [
  props.inputStyle,
  isMultiline.value && props.autosize ? textareaStyle.value : undefined,
  isMultiline.value && props.resize ? { resize: props.resize } : undefined,
]);

// ─── 事件处理 ───────────────────────────────────────────────────

/** 提交新值：非受控时落本地，同步 v-model 并抛 input */
function setValue(value: string | number) {
  if (props.modelValue === undefined) {
    localValue.value = value;
  }
  emit("update:modelValue", value);
  emit("input", value);
  if (props.validateEvent) validate("change");
}

function handleInput(event: Event) {
  // 输入法合成期间不同步，等 compositionend 统一提交
  if (isComposing.value) return;

  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  let value: string | number = target.value;

  if (useFormatter.value && props.parser) {
    value = props.parser(value);
  }
  if (props.modelModifiers?.number) {
    const parsed = Number.parseFloat(String(value));
    if (!Number.isNaN(parsed)) value = parsed;
  }

  setValue(value);

  // 格式化后的展示文本可能与 DOM 当前文本不一致（如自动补分隔符），下一帧回写
  if (useFormatter.value) {
    nextTick(() => {
      if (inputRef.value && inputRef.value.value !== displayValue.value) {
        inputRef.value.value = String(displayValue.value);
      }
    });
  }
}

function onCompositionStart(event: CompositionEvent) {
  isComposing.value = true;
  emit("compositionstart", event);
}

function onCompositionUpdate(event: CompositionEvent) {
  emit("compositionupdate", event);
}

function onCompositionEnd(event: CompositionEvent) {
  emit("compositionend", event);
  if (isComposing.value) {
    isComposing.value = false;
    handleInput(event);
  }
}

function onFocus(event: FocusEvent) {
  isFocus.value = true;
  focusedValue.value = String(inputValue.value ?? "");
  emit("focus", event);
}

/** 值相对聚焦快照发生变化时抛出 change（失焦与 Enter 共用） */
function emitChangeIfNeeded() {
  const current = String(inputValue.value ?? "");
  if (current !== focusedValue.value) {
    focusedValue.value = current;
    emit("change", inputValue.value ?? "");
  }
}

function onBlur(event: FocusEvent) {
  isFocus.value = false;

  // trim 修饰符：失焦时去除首尾空格
  if (props.modelModifiers?.trim) {
    const trimmed = String(inputValue.value ?? "").trim();
    if (trimmed !== String(inputValue.value ?? "")) {
      setValue(props.modelModifiers?.number && !Number.isNaN(Number.parseFloat(trimmed)) ? Number.parseFloat(trimmed) : trimmed);
    }
  }

  emitChangeIfNeeded();
  emit("blur", event);
  if (props.validateEvent) validate("blur");
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && !isComposing.value) {
    emitChangeIfNeeded();
  }
  emit("keydown", event);
}

function clear() {
  if (props.modelValue === undefined) {
    localValue.value = "";
  }
  emit("update:modelValue", "");
  emit("input", "");
  emit("change", "");
  emit("clear");
  if (props.validateEvent) validate("change");
  nextTick(() => inputRef.value?.focus());
}

function togglePassword() {
  passwordVisible.value = !passwordVisible.value;
}

/** 选中输入框中的全部文字 */
function select() {
  inputRef.value?.select();
}

watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value ?? "";
  },
);

// 内容变化后重算 textarea 高度
watch(inputValue, () => nextTick(resizeTextarea));
watch(() => props.autosize, () => nextTick(resizeTextarea));

onMounted(() => {
  if (props.autofocus) inputRef.value?.focus();
  resizeTextarea();
});

defineExpose({
  /** 内部原生 input/textarea 元素引用 */
  ref: inputRef,
  inputRef, // 旧名，保留以兼容既有用法
  /** 单行模式下的原生 input 元素 */
  input: computed(() => (isMultiline.value ? null : inputRef.value)),
  /** 多行模式下的原生 textarea 元素 */
  textarea: computed(() => (isMultiline.value ? inputRef.value : null)),
  /** 使输入框获得焦点 */
  focus: () => inputRef.value?.focus(),
  /** 使输入框失去焦点 */
  blur: () => inputRef.value?.blur(),
  /** 选中输入框中的文字 */
  select,
  /** 清空输入内容并触发 update:modelValue 与 clear 事件 */
  clear,
  /** 重新计算 textarea 高度（autosize 时） */
  resizeTextarea,
  /** autosize 计算出的 textarea 样式 */
  textareaStyle,
  /** 是否处于输入法合成状态 */
  isComposing,
  /** 密码是否以明文展示 */
  passwordVisible,
});
</script>

<template>
  <div :class="ui.root()">
    <div :class="ui.group()">
      <!-- 前置块：仅单行模式渲染，与输入框连体 -->
      <div v-if="$slots.prepend && !isMultiline" :class="ui.prepend()">
        <slot name="prepend" />
      </div>

      <div :class="ui.wrapper()" :data-disabled="isDisabled" :data-filled="isFilled" @click="inputRef?.focus()"
        @mouseenter="emit('mouseenter', $event)" @mouseleave="emit('mouseleave', $event)">
        <!-- 前缀：#prefix（新名）优先，#leading（旧名）兼容，其次 prefix-icon -->
        <span v-if="($slots.prefix || $slots.leading || prefixIcon) && !isMultiline"
          :class="ui.leading({ class: 'mr-1' })" @click.stop>
          <slot name="prefix" :ui="ui">
            <slot name="leading" :ui="ui">
              <Icon v-if="prefixIcon" :name="prefixIcon" :class="ui.icon()" />
            </slot>
          </slot>
        </span>

        <component :is="isMultiline ? 'textarea' : 'input'" :id="props.id" ref="inputRef" v-bind="inputAttrs"
          :type="nativeType" :rows="isMultiline ? props.rows : undefined" :disabled="isDisabled"
          :readonly="props.readonly" :placeholder="props.placeholder" :value="displayValue" :maxlength="nativeMaxlength"
          :minlength="nativeMinlength" :autocomplete="props.autocomplete" :name="props.name" :form="props.form"
          :max="props.max" :min="props.min" :step="props.step" :autofocus="props.autofocus"
          :aria-label="props.ariaLabel || props.label" :tabindex="props.tabindex" :inputmode="(props.inputmode as any)"
          :style="mergedInputStyle" :class="ui.input()" @input="handleInput" @focus="onFocus" @blur="onBlur"
          @keydown="onKeydown" @compositionstart="onCompositionStart" @compositionupdate="onCompositionUpdate"
          @compositionend="onCompositionEnd" />

        <!-- textarea 的字数统计悬浮在右下角 -->
        <span v-if="isMultiline && showLimit && wordLimitPosition === 'inside'" :class="ui.count()">
          {{ currentCount }} / {{ props.maxlength }}
        </span>

        <div v-if="!isMultiline" :class="ui.iconBox()" @click.stop>
          <Transition name="fade">
            <div v-if="showClear" :class="ui.clear()" @click.stop="clear">
              <Icon :name="props.clearIcon" :class="ui.icon()" />
            </div>
          </Transition>

          <div v-if="separator && showClear && (isPasswordMode || $slots.trailing || $slots.suffix || suffixIcon)"
            :class="ui.separator()" />

          <!-- 密码明文/密文切换；#password-icon 作用域插槽可自定义图标 -->
          <div v-if="isPasswordMode" :class="ui.password()" @click.stop="togglePassword">
            <slot name="password-icon" :visible="passwordVisible">
              <Icon :name="passwordVisible ? 'lucide:eye-off' : 'lucide:eye'" :class="ui.icon()" />
            </slot>
          </div>

          <!-- 单行的字数统计 -->
          <span v-if="showLimit && wordLimitPosition === 'inside'" :class="ui.count()">
            {{ currentCount }} / {{ props.maxlength }}
          </span>

          <div v-if="separator && ($slots.trailing || $slots.suffix || suffixIcon) && (!showClear || isPasswordMode)"
            :class="ui.separator()" />

          <!-- 后缀：#suffix（新名）优先，#trailing（旧名）兼容，其次 suffix-icon -->
          <div v-if="$slots.suffix || $slots.trailing || suffixIcon" :class="ui.trailing()">
            <slot name="suffix" :ui="ui">
              <slot name="trailing" :ui="ui">
                <Icon v-if="suffixIcon" :name="suffixIcon" :class="ui.icon()" />
              </slot>
            </slot>
          </div>
        </div>
      </div>

      <!-- 后置块：仅单行模式渲染，与输入框连体 -->
      <div v-if="$slots.append && !isMultiline" :class="ui.append()">
        <slot name="append" />
      </div>
    </div>

    <!-- 外置字数统计：输入框下方右对齐 -->
    <span v-if="showLimit && wordLimitPosition === 'outside'" :class="ui.count({ class: 'self-end' })">
      {{ currentCount }} / {{ props.maxlength }}
    </span>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
