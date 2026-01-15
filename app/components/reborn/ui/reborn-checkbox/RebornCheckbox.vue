<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import theme, { checkboxColors, checkboxSizes } from "./reborn-checkbox.config";
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

const ui = computed(() =>
  b({
    size: props.size,
    color: props.color,
  }),
);

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

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const checked = target.checked;

  if (Array.isArray(currentValue.value)) {
    const next = new Set(currentValue.value);
    if (checked) {
      next.add(optionValue.value);
    } else {
      next.delete(optionValue.value);
    }
    updateValue(Array.from(next));
    return;
  }

  updateValue(checked);
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
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled">
    <input
      v-bind="inputAttrs"
      type="checkbox"
      :value="optionValue"
      :checked="isChecked"
      :disabled="props.disabled"
      :class="ui.input()"
      @change="handleChange"
    />

    <span :class="ui.control()">
      <Icon name="lucide:check" :class="ui.icon()" />
    </span>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>
