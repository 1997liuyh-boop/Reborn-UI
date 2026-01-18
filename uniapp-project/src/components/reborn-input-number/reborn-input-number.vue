<script setup lang="ts">
import { computed, ref, useAttrs, watch } from "vue";
import { tv } from '@/lib/tv';
import { cn } from '@/lib/utils';
import theme, { inputNumberColors, inputNumberSizes } from "./reborn-input-number.config";

defineOptions({
  name: "reborn-input-number",
  inheritAttrs: false,
});

const b = tv(theme);

export interface InputNumberProps {
  modelValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: typeof inputNumberSizes[number];
  color?: typeof inputNumberColors[number];
  class?: any;
}

const props = withDefaults(defineProps<InputNumberProps>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  size: "md",
  color: "primary",
});

const emit = defineEmits([
  "update:modelValue",
  "change"
]);

const attrs = useAttrs();

const localValue = ref(props.modelValue ?? props.min ?? 0);
const currentValue = computed(() => (props.modelValue !== undefined ? props.modelValue : localValue.value));

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color
  });

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class) }),
    button: (opts?: { class?: any }) => styles.button({ class: cn(opts?.class) }),
    input: (opts?: { class?: any }) => styles.input({ class: cn(opts?.class) }),
    divider: (opts?: { class?: any }) => styles.divider({ class: cn(opts?.class) }),
  };
});

const isDecrementDisabled = computed(() =>
  props.disabled || currentValue.value <= props.min
);

const isIncrementDisabled = computed(() =>
  props.disabled || currentValue.value >= props.max
);

function updateValue(val: number) {
  let nextValue = val;

  if (nextValue < props.min) nextValue = props.min;
  if (nextValue > props.max) nextValue = props.max;

  // Handle step precision if needed (not implementing full float precision yet)

  if (props.modelValue === undefined) {
    localValue.value = nextValue;
  }

  if (nextValue !== currentValue.value) {
    emit("update:modelValue", nextValue);
    emit("change", nextValue);
  }
}

function onInput(e: any) {
  let val = Number(e.detail.value);
  if (isNaN(val)) return;
  updateValue(val);
}

function decrease() {
  if (isDecrementDisabled.value) return;
  updateValue(currentValue.value - props.step);
}

function increase() {
  if (isIncrementDisabled.value) return;
  updateValue(currentValue.value + props.step);
}

// Long press logic
let timer: any = null;

function startDecrease() {
  if (isDecrementDisabled.value) return;
  decrease();
  timer = setInterval(() => {
    decrease();
  }, 150);
}

function startIncrease() {
  if (isIncrementDisabled.value) return;
  increase();
  timer = setInterval(() => {
    increase();
  }, 150);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) {
      localValue.value = val;
    }
  },
);
</script>

<template>
  <view :class="ui.wrapper({ class: props.class })" :data-disabled="props.disabled">
    <view :class="ui.button()" @touchstart="startDecrease" @touchend="stop" @touchcancel="stop" @tap="decrease">
      <slot name="decrement">
        <!-- Assuming generic icon class or text -->
        <text class="text-lg">-</text>
      </slot>
    </view>

    <view :class="ui.divider()" />

    <input type="number" :value="currentValue" :disabled="props.disabled" :class="ui.input()" @input="onInput"
      @blur="stop" />

    <view :class="ui.divider()" />

    <view :class="ui.button()" @touchstart="startIncrease" @touchend="stop" @touchcancel="stop" @tap="increase">
      <slot name="increment">
        <text class="text-lg">+</text>
      </slot>
    </view>
  </view>
</template>

<style scoped></style>
