<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { switchColors, switchSizes } from "./reborn-switch.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({
  inheritAttrs: false,
});

export interface SwitchProps {
  modelValue?: boolean;
  defaultValue?: boolean;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: typeof switchSizes[number];
  color?: typeof switchColors[number];
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    input: ClassValue;
    track: ClassValue;
    thumb: ClassValue;
    label: ClassValue;
  }>;
}

const props = withDefaults(defineProps<SwitchProps>(), {
  disabled: false,
  loading: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const attrs = useAttrs();

const localValue = ref(props.defaultValue ?? false);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  };
});

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function updateValue(nextValue: boolean) {
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
}

function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  updateValue(target.checked);
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
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled || props.loading">
    <input v-bind="inputAttrs" type="checkbox" :checked="currentValue" :disabled="props.disabled || props.loading"
      :class="ui.input()" @change="handleChange" />

    <span :class="ui.track()" :data-loading="props.loading">
      <span :class="ui.thumb()">
        <slot name="thumb" :checked="currentValue" :loading="props.loading">
          <Icon v-if="props.loading" name="lucide:loader-2" class="size-full p-0.5 animate-spin text-gray-400" />
        </slot>
      </span>
    </span>

    <span v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </span>
  </label>
</template>
