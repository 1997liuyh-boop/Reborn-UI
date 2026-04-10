<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
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
  modelValue?: string;
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
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
}>();

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate,
} = useFormInject(props);

const isDisabled = computed(() => {
  return fieldGroupDisabled.value || props.disabled;
});

const value = ref(props.modelValue ?? "");
const isFocus = ref<boolean>(props.autofocus ?? false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

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
  value.value = target.value;
  emit("update:modelValue", target.value);
  emit("change", target.value);
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

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) {
      value.value = val;
      if (props.autoHeight && textareaRef.value) {
        nextTick(() => adjustHeight(textareaRef.value!));
      }
    }
  },
);
</script>

<template>
  <div :class="ui.root({ class: cn(props.customClass, props.ui?.root) })">
    <textarea
      ref="textareaRef"
      :class="ui.inner({ class: props.ui?.inner })"
      v-bind="$attrs"
      :value="value"
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
      :length="value.length"
      :max="maxlength"
    >
      <span :class="ui.text({ class: props.ui?.text })">{{ value.length }} / {{ maxlength }}</span>
    </slot>
  </div>
</template>
