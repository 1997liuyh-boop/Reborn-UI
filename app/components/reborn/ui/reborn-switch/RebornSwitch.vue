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
  modelValue?: any;
  defaultValue?: any;
  activeValue?: any;
  inactiveValue?: any;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: typeof switchSizes[number];
  color?: typeof switchColors[number];
  beforeChange?: () => boolean | Promise<boolean>;
  class?: any;
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
  activeValue: true,
  inactiveValue: false,
  disabled: false,
  loading: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "change", value: any): void;
}>();

const attrs = useAttrs();
const inputRef = ref<HTMLInputElement>();

const localValue = ref(props.defaultValue ?? props.inactiveValue);
const isChecked = computed(() => {
  const val = props.modelValue !== undefined ? props.modelValue : localValue.value;
  return val === props.activeValue;
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    active: isChecked.value,
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

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs;
  return rest;
});

function updateValue(checked: boolean) {
  const nextValue = checked ? props.activeValue : props.inactiveValue;
  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }
  emit("update:modelValue", nextValue);
  emit("change", nextValue);
}

async function handleClick(event: Event) {
  if (props.disabled || props.loading) return;

  // 阻止默认行为（防止 input 自动切换状态）
  event.preventDefault();

  const newChecked = !isChecked.value;

  if (props.beforeChange) {
    try {
      const result = await props.beforeChange();
      if (result === false) return;
    } catch (e) {
      return;
    }
  }

  updateValue(newChecked);
}

watch(
  () => props.modelValue,
  (value: any) => {
    if (value !== undefined) {
      localValue.value = value;
    }
  },
);

defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>

<template>
  <label :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled || props.loading"
    @click="handleClick">

    <span v-if="props.inactiveLabel || $slots.inactiveLabel" :class="ui.inactiveLabel()">
      <slot name="inactiveLabel">{{ props.inactiveLabel }}</slot>
    </span>

    <!-- 增加 @click.stop 防止事件冒泡造成的双重触发 -->
    <input ref="inputRef" v-bind="inputAttrs" type="checkbox" :checked="isChecked"
      :disabled="props.disabled || props.loading" :class="ui.input()" @click.stop />

    <span :class="ui.track()" :data-loading="props.loading">
      <span :class="ui.thumb()">
        <slot name="thumb" :checked="isChecked" :loading="props.loading">
          <Icon v-if="props.loading" name="lucide:loader-2" class="size-full p-0.5 animate-spin text-gray-400" />
        </slot>
      </span>
    </span>

    <span v-if="props.activeLabel || $slots.activeLabel" :class="ui.activeLabel()">
      <slot name="activeLabel">{{ props.activeLabel }}</slot>
    </span>
  </label>
</template>
