<script setup lang="ts">
import { computed, nextTick, ref, toRef, useAttrs, useSlots, watch } from "vue";
import theme, { inputColors, inputSizes } from "./reborn-input.config";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface InputUi {
  wrapper?: string;
  input?: string;
  leading?: string;
  iconBox?: string;
  icon?: string;
  trailing?: string;
  clear?: string;
  password?: string;
  separator?: string;
}

export interface InputProps {
  /** 输入框绑定值（v-model） */
  modelValue?: string | number;
  /** 非受控模式下的初始值，未绑定 modelValue 时生效 */
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  type?: string;
  /** 尺寸：sm/md/lg，影响高度、内边距与字号 */
  size?: typeof inputSizes[number];
  /** 聚焦时边框与分割线的高亮颜色，需配合 border 开启才可见 */
  color?: typeof inputColors[number];
  /** 是否圆角：sm/md 尺寸为小圆角，lg 尺寸为全圆角胶囊 */
  rounded?: boolean;
  /** 是否显示边框；开启后聚焦时边框颜色跟随 color */
  border?: boolean;
  /** 是否为密码框：内容掩码显示，并出现明文/密文切换按钮 */
  password?: boolean;
  /** 是否显示清除按钮：有内容且非禁用/只读时出现，点击清空并重新聚焦 */
  clearable?: boolean;
  /** 是否在清除按钮、密码开关与 trailing 插槽之间显示竖分割线 */
  separator?: boolean;
  /** 挂载时是否默认处于聚焦高亮样式状态 */
  autofocus?: boolean;
  /** 渲染为单行 input 还是多行 textarea */
  as?: "input" | "textarea";
  rows?: number;
  class?: any;
  /** 按 wrapper/input/leading/trailing 等键覆盖内部节点类名 */
  ui?: InputUi;
}

const props = withDefaults(defineProps<InputProps>(), {
  disabled: false,
  readonly: false,
  type: "text",
  size: "sm",
  color: "neutral",
  rounded: true,
  border: true,
  password: false,
  clearable: false,
  separator: true,
  autofocus: false,
  as: "input",
  rows: 4,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 输入值变化时触发（v-model 同步） */
  (e: "update:modelValue", value: string | number): void;
  /** 输入框获得焦点时触发 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点时触发 */
  (e: "blur", event: FocusEvent): void;
  /** 点击清除按钮清空内容后触发 */
  (e: "clear"): void;
}>();

const attrs = useAttrs();

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null);
const slots = useSlots();
const localValue = ref(props.defaultValue ?? "");

// 聚焦状态
const isFocus = ref(props.autofocus);
const isPassword = ref(props.password);

const inputValue = computed(() =>
  props.modelValue !== undefined ? props.modelValue : localValue.value,
);
const isMultiline = computed(() => props.as === "textarea");
const isFilled = computed(() => `${inputValue.value ?? ""}`.length > 0);

const showClear = computed(() => {
  return props.clearable && !props.disabled && !props.readonly && `${inputValue.value}` !== "";
});

const {
  orientation,
  size: fieldGroupSize,
  disabled: fieldGroupDisabled,
  isError,
  validate
} = useFormInject(props);

const size = toRef(props, "size");

const uiOverrides = computed(() => props.ui || {})
const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    fieldGroup: orientation.value,
    multiline: isMultiline.value,
    rounded: props.rounded || true,
    border: props.border,
    color: props.color,
    focus: isFocus.value,
    error: isError.value,
    hasLeading: !!slots.leading,
    hasTrailing: !!slots.trailing || showClear.value || props.password,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    leading: (opts?: { class?: any }) => styles.leading({ class: cn(opts?.class, uiOverrides.value.leading) }),
    iconBox: (opts?: { class?: any }) => styles.iconBox({ class: cn(opts?.class, uiOverrides.value.iconBox) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    trailing: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.trailing) }),
    clear: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.clear) }),
    password: (opts?: { class?: any }) => styles.iconSection({ class: cn(opts?.class, uiOverrides.value.password) }),
    separator: (opts?: { class?: any }) => styles.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (props.modelValue === undefined) {
    localValue.value = target.value;
  }
  emit("update:modelValue", target.value);
  validate('change');
}

function onFocus(e: FocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  isFocus.value = false;
  emit("blur", e);
  validate('blur');
}

function clear() {
  if (props.modelValue === undefined) {
    localValue.value = "";
  }
  emit("update:modelValue", "");
  emit("clear");
  nextTick(() => inputRef.value?.focus());
}

function togglePassword() {
  isPassword.value = !isPassword.value;
}

watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value ?? "";
  },
);

defineExpose({
  inputRef, // 内部原生 input/textarea 元素引用
  focus: () => inputRef.value?.focus(), // 使输入框获得焦点
  blur: () => inputRef.value?.blur(), // 使输入框失去焦点
  clear, // 清空输入内容并触发 update:modelValue 与 clear 事件
});
</script>

<template>
  <div :class="ui.wrapper()" :data-disabled="props.disabled" :data-filled="isFilled" @click="inputRef?.focus()">
    <span v-if="$slots.leading" :class="ui.leading()" @click.stop>
      <slot name="leading" :ui="ui" />
    </span>

    <component :is="props.as" ref="inputRef" v-bind="inputAttrs"
      :type="props.as === 'textarea' ? undefined : (isPassword ? 'password' : props.type)"
      :rows="props.as === 'textarea' ? props.rows : undefined" :disabled="props.disabled" :readonly="props.readonly"
      :placeholder="props.placeholder" :value="inputValue" :class="ui.input()" @input="handleInput" @focus="onFocus"
      @blur="onBlur" />

    <div :class="ui.iconBox()" @click.stop>
      <Transition name="fade">
        <div v-if="showClear" :class="ui.clear()" @click.stop="clear">
          <Icon name="lucide:x-circle" :class="ui.icon()" />
        </div>
      </Transition>

      <div v-if="separator && showClear && (password || $slots.trailing)" :class="ui.separator()" />

      <div v-if="password" :class="ui.password()" @click.stop="togglePassword">
        <Icon :name="isPassword ? 'lucide:eye' : 'lucide:eye-off'" :class="ui.icon()" />
      </div>

      <!-- 分割线 B: 只有在有后缀，且没有密码开关（如果有密码开关，上面的分割线A或者密码和后缀间的线会处理）的情况下，且前面没有因为showClear产生的线，我们如何处理？
           最简单的避免重复线的逻辑是：
           1. clear 和 后面的元素 之间的线（由上面处理）
           2. password 和 trailing 之间的线（由于 password 是固定占位的，如果有 password 和 trailing，就始终给一条线）
           3. 如果没有 clear 也没有 password，但有 trailing，那么 trailing 前面需要一条线吗？（看设计需求，通常需要用来和输入文本分隔）
      -->
      <!-- 修正为：如果有 trailing 且 开启了分割线，并且 (没有密码开关) 或者 (有密码开关，用来分隔密码和trailing) -->
      <div v-if="separator && $slots.trailing && (!showClear || password)" :class="ui.separator()" />

      <div v-if="$slots.trailing" :class="ui.trailing()">
        <slot name="trailing" :ui="ui" />
      </div>
    </div>
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
