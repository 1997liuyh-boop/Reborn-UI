<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, ref, useAttrs, watch } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import { useFormInject } from "@/composables/useFieldGroup";
import theme, { switchColors, switchSizes } from "./reborn-switch.config";

defineOptions({
  name: "reborn-switch",
  inheritAttrs: false,
});

const b = tv(theme as any);

export interface SwitchProps {
  modelValue?: boolean;
  defaultValue?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
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
    activeLabel: ClassValue;
    inactiveLabel: ClassValue;
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

const { disabled: formDisabled, size: formSize, isError } = useFormInject(props);

const isDisabled = computed(() => formDisabled.value || props.disabled || props.loading);

const localValue = ref(props.defaultValue ?? false);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = (b as any)({
    size: formSize.value || props.size,
    color: props.color,
    checked: currentValue.value,
    error: isError.value,
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class, uiOverrides.value.input) }),
    track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    activeLabel: (opts?: { class?: any }) => styles.activeLabel({ class: cn(opts?.class, uiOverrides.value.activeLabel) }),
    inactiveLabel: (opts?: { class?: any }) => styles.inactiveLabel({ class: cn(opts?.class, uiOverrides.value.inactiveLabel) }),
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
    :data-disabled="isDisabled" style="-webkit-tap-highlight-color: transparent;">

    <view v-if="props.inactiveLabel || $slots.inactiveLabel" :class="ui.inactiveLabel()">
      <slot name="inactiveLabel">{{ props.inactiveLabel }}</slot>
    </view>

    <view :class="ui.track()" :data-loading="props.loading">
      <view :class="ui.thumb()">
        <slot name="thumb" :checked="currentValue" :loading="props.loading">
          <view v-if="props.loading" class="i-lucide-loader-2 animate-spin text-gray-400 w-3 h-3" />
        </slot>
      </view>
    </view>

    <view v-if="props.activeLabel || $slots.activeLabel" :class="ui.activeLabel()">
      <slot name="activeLabel">{{ props.activeLabel }}</slot>
    </view>

  </view>
</template>

<style scoped></style>
