<script setup lang="ts">
import { computed, nextTick, shallowRef, useTemplateRef, watch } from "vue";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import theme from "./reborn-textarea.config";

type TextareaColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";
type TextareaSize = "sm" | "md" | "lg";

interface RebornTextareaProps {
  color?: TextareaColor;
  customClass?: any;
  ui?: Record<string, any>;
  size?: TextareaSize;
  border?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  showWordLimit?: boolean;
  name?: string;
  placeholder?: string;
  maxlength?: number;
  autofocus?: boolean;
  rows?: number;
  autoHeight?: boolean;
}

defineOptions({
  name: "RebornTextarea",
  inheritAttrs: false,
});

const props = withDefaults(defineProps<RebornTextareaProps>(), {
  color: "primary",
  size: "md",
  border: true,
  disabled: false,
  readonly: false,
  showWordLimit: false,
  name: "",
  placeholder: "",
  maxlength: 100,
  autofocus: false,
  rows: 4,
  autoHeight: false,
});

const emit = defineEmits<{
  /** 输入内容变化时触发，参数为最新文本 */
  (e: "change", value: string): void;
  /** 输入框获得焦点时触发 */
  (e: "focus", event: FocusEvent): void;
  /** 输入框失去焦点时触发，并执行表单 blur 校验 */
  (e: "blur", event: FocusEvent): void;
}>();

/**
 * 输入框的绑定值，支持 v-model；父级重置为 null / undefined 时按空字符串显示
 */
const model = defineModel<string | null>({ default: "" });

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => {
  return fieldGroupDisabled.value || props.disabled;
});

/** 渲染用文本：null / undefined 统一成空字符串，字数统计不会读到 null */
const text = computed(() => model.value ?? "");
// 聚焦态以真实的 focus / blur 事件为准；autofocus 不一定真的聚焦（弹窗内、页面已有焦点）
const isFocus = shallowRef(false);
const textareaRef = useTemplateRef<HTMLTextAreaElement>("textareaRef");

const b = tv(theme);

const ui = computed(() =>
  b({
    size: fieldGroupSize.value || props.size || "md",
    border: props.border ?? true,
    focused: isFocus.value,
    disabled: isDisabled.value,
    error: isError.value,
    hasCount: props.showWordLimit ?? true,
    color: props.color ?? "primary",
  }),
);

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  const next = target.value;
  model.value = next;
  // 受控绑定下赋值后同步读 model 仍是旧值，事件载荷用本地的 next
  emit("change", next);
  validate("change");

  if (props.autoHeight) {
    adjustHeight(target);
  }
}

function adjustHeight(target: HTMLTextAreaElement) {
  target.style.height = "auto";
  target.style.height = `${target.scrollHeight}px`;
}

function onFocus(e: FocusEvent) {
  isFocus.value = true;
  emit("focus", e);
}

function onBlur(e: FocusEvent) {
  isFocus.value = false;
  emit("blur", e);
  validate("blur");
}

// 外部改值（重置、回填）后按新内容重新计算自动高度
watch(model, () => {
  if (!props.autoHeight) return;
  nextTick(() => {
    if (textareaRef.value) adjustHeight(textareaRef.value);
  });
});
</script>

<template>
  <div :class="ui.root({ class: cn(props.customClass, props.ui?.root) })">
    <textarea
      ref="textareaRef"
      :class="ui.inner({ class: props.ui?.inner })"
      v-bind="$attrs"
      :value="text"
      :disabled="readonly || isDisabled"
      :readonly="readonly"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :autofocus="autofocus"
      :rows="rows ?? 4"
      :name="name"
      @input="handleInput"
      @focus="onFocus"
      @blur="onBlur"
    />

    <slot
      v-if="showWordLimit"
      name="limit"
      :length="text.length"
      :max="maxlength"
    >
      <span :class="ui.text({ class: props.ui?.text })">{{ text.length }} / {{ maxlength }}</span>
    </slot>
  </div>
</template>
