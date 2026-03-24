<script setup lang="ts">
import { computed, ref, toRef, useAttrs, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { inputNumberColors, inputNumberSizes, inputNumberShapes } from "./reborn-input-number.config";
import { useFieldGroup } from "~/composables/useFieldGroup";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface InputNumberProps {
  modelValue?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: typeof inputNumberSizes[number];
  color?: typeof inputNumberColors[number];
  shape?: typeof inputNumberShapes[number];
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    button: ClassValue;
    input: ClassValue;
    divider: ClassValue;
    icon: ClassValue;
  }>;
}

const props = withDefaults(defineProps<InputNumberProps>(), {
  disabled: false,
  step: 1,
  size: "md",
  color: "primary",
  shape: "circle",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const attrs = useAttrs();

const localValue = ref(props.defaultValue ?? props.min ?? 0);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const { orientation, size: fieldGroupSize } = useFieldGroup(props);

const size = toRef(props, "size");

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: (fieldGroupSize.value || size.value) as any,
    color: props.color,
    shape: props.shape,
    fieldGroup: orientation.value,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    button: (opts?: { class?: any }) => styles.button({ class: cn(opts?.class, uiOverrides.value.button) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class, uiOverrides.value.divider) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

const isDecrementDisabled = computed(() =>
  props.disabled || (props.min !== undefined && currentValue.value <= props.min),
);

const isIncrementDisabled = computed(() =>
  props.disabled || (props.max !== undefined && currentValue.value >= props.max),
);

function clampValue(value: number) {
  let nextValue = value;
  if (props.min !== undefined) {
    nextValue = Math.max(nextValue, props.min);
  }
  if (props.max !== undefined) {
    nextValue = Math.min(nextValue, props.max);
  }
  return nextValue;
}

function updateValue(value: number) {
  const nextValue = clampValue(value);
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const parsed = Number(target.value);

  if (Number.isNaN(parsed)) {
    return;
  }

  updateValue(parsed);
}

function increase() {
  if (isIncrementDisabled.value) return;
  updateValue(currentValue.value + props.step);
}

function decrease() {
  if (isDecrementDisabled.value) return;
  updateValue(currentValue.value - props.step);
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
  <div :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled">
    <button type="button" :class="ui.button()" :disabled="isDecrementDisabled" @click="decrease">
      <slot name="decrement" :icon-class="ui.icon()">
        <Icon name="lucide:minus" :class="ui.icon()" />
      </slot>
    </button>

    <span :class="ui.divider()" aria-hidden="true" />

    <input v-bind="inputAttrs" type="number" inputmode="decimal" :min="props.min" :max="props.max" :step="props.step"
      :value="currentValue" :disabled="props.disabled" :class="ui.input()" @input="handleInput" />

    <span :class="ui.divider()" aria-hidden="true" />

    <button type="button" :class="ui.button()" :disabled="isIncrementDisabled" @click="increase">
      <slot name="increment" :icon-class="ui.icon()">
        <Icon name="lucide:plus" :class="ui.icon()" />
      </slot>
    </button>
  </div>
</template>
