<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, ref, useAttrs, watch } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { switchColors, switchSizes } from "./reborn-switch.config";

defineOptions({
  name: "reborn-switch",
  inheritAttrs: false,
});

const b = tv(theme);

export interface SwitchProps {
  modelValue?: boolean;
  defaultValue?: boolean;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: typeof switchSizes[number];
  color?: typeof switchColors[number];
  customClass?: any;
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
  (e: "change", value: boolean): void;
}>();

const attrs = useAttrs();

const localValue = ref(props.defaultValue ?? false);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    checked: currentValue.value,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
  };
});

function updateValue(nextValue: boolean) {
  if (!props.disabled && !props.loading) {
    if (props.modelValue === undefined) {
      localValue.value = nextValue;
    }
    emit("update:modelValue", nextValue);
    emit("change", nextValue);
  }
}

function onTap() {
  updateValue(!currentValue.value);
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
  <view :class="[ui.wrapper({ class: props.customClass }), 'group', currentValue && 'is-checked']" @tap="onTap"
    :data-disabled="props.disabled || props.loading">

    <view :class="ui.track()" :data-loading="props.loading">
      <view :class="ui.thumb()">
        <slot name="thumb" :checked="currentValue" :loading="props.loading">
          <view v-if="props.loading" class="i-lucide-loader-2 animate-spin text-gray-400 w-3 h-3" />
        </slot>
      </view>
    </view>

    <view v-if="props.label || $slots.default" :class="ui.label()">
      <slot>{{ props.label }}</slot>
    </view>
  </view>
</template>

<style scoped></style>
