<script setup lang="ts">
import { computed, ref, useAttrs, watch, inject } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { checkboxColors, checkboxSizes } from "./reborn-checkbox.config";
import { useFormInject } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";

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
  (e: "change", value: boolean | CheckboxValue[]): void;
}>();

const attrs = useAttrs();

const checkboxGroup = inject<any>("RebornCheckboxGroup", null);
const isGroup = computed(() => !!checkboxGroup);

const {
  disabled: fieldGroupDisabled,
  size: fieldGroupSize,
  isError,
  validate
} = useFormInject(props);

const localValue = ref<boolean | CheckboxValue[]>(props.defaultValue ?? false);
const currentValue = computed(() => {
  if (isGroup.value) {
    return checkboxGroup.modelValue.value;
  }
  return (props.modelValue !== undefined ? props.modelValue : localValue.value)
});
const optionValue = computed<CheckboxValue>(() => props.value ?? props.label ?? "");

const isChecked = computed(() => {
  if (Array.isArray(currentValue.value)) {
    return currentValue.value.includes(optionValue.value);
  }

  return Boolean(currentValue.value);
});

const isDisabled = computed(() => {
  if (isGroup.value) {
    return checkboxGroup.disabled.value || props.disabled;
  }
  return fieldGroupDisabled.value || props.disabled
});

const computedSize = computed(() => {
  if (isGroup.value && checkboxGroup.size?.value) {
    return checkboxGroup.size.value;
  }
  return fieldGroupSize.value || props.size;
});

const computedColor = computed(() => {
  if (isGroup.value && checkboxGroup.color?.value) {
    return checkboxGroup.color.value;
  }
  return props.color;
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: computedSize.value,
    color: computedColor.value,
    error: isError.value || (isGroup.value && checkboxGroup.isError?.value),
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
  emit("change", nextValue);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const checked = target.checked;

  if (isGroup.value) {
    checkboxGroup.updateValue(optionValue.value);
    return;
  }

  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value);
    if (checked) {
      next.add(optionValue.value);
    } else {
      next.delete(optionValue.value);
    }
    updateValue(Array.from(next));
    validate("change");
    return;
  }

  updateValue(checked);
  validate("change");
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
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="isDisabled">
    <input v-bind="inputAttrs" type="checkbox" :value="optionValue" :checked="isChecked" :disabled="isDisabled"
      :class="ui.input()" @change="handleChange" />

    <span :class="ui.control()">
      <slot name="icon" :checked="isChecked">
        <Icon name="lucide:check" :class="ui.icon()" />
      </slot>
    </span>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>

