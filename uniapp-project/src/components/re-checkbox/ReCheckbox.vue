<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";
import theme, { checkboxColors, checkboxSizes } from "./re-checkbox.config";
import { tv } from "@/lib/tv";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export type CheckboxValue = string | number;

export interface CheckboxProps {
  modelValue?: boolean | CheckboxValue[];
  defaultValue?: boolean | CheckboxValue[];
  value?: CheckboxValue;
  label?: string;
  disabled?: boolean;
  size?: typeof checkboxSizes[number];
  color?: typeof checkboxColors[number];
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    control: ClassValue;
    icon: ClassValue;
    label: ClassValue;
  }>;
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  disabled: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean | CheckboxValue[]): void;
}>();

const attrs = useAttrs();

const localValue = ref<boolean | CheckboxValue[]>(props.defaultValue ?? false);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));
const optionValue = computed<CheckboxValue>(() => props.value ?? props.label ?? "");

const isChecked = computed(() => {
  if (Array.isArray(currentValue.value)) {
    return currentValue.value.includes(optionValue.value);
  }

  return Boolean(currentValue.value);
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    control: (opts?: { class?: any }) => styles.control({ class: cn(opts?.class, uiOverrides.value.control) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function updateValue(nextValue: boolean | CheckboxValue[]) {
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
}

function toggle() {
  if (props.disabled) return;

  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value);
    if (next.has(optionValue.value)) {
      next.delete(optionValue.value);
    } else {
      next.add(optionValue.value);
    }
    updateValue(Array.from(next));
  } else {
    updateValue(!isChecked.value);
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);
</script>

<template>
  <view :class="[ui.wrapper({ class: props.class }), isChecked && 'is-checked', props.disabled && 'is-disabled']"
    :data-disabled="props.disabled" @tap="toggle">
    <view :class="ui.control()">
      <slot name="icon" :checked="isChecked">
        <view class="i-lucide-check" :class="ui.icon()" />
      </slot>
    </view>

    <view v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </view>
  </view>
</template>
