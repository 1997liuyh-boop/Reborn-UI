<script setup lang="ts">
import { TransitionPresets, useElementVisibility, useTransition } from "@vueuse/core";
import { computed, shallowRef, useTemplateRef, watch } from "vue";

type TransitionsPresetsKeys = keyof typeof TransitionPresets;

interface NumberTickerProps {
  value?: number;
  direction?: "up" | "down";
  duration?: number;
  delay?: number;
  decimalPlaces?: number;
  class?: string;
  transition?: TransitionsPresetsKeys;
}

const props = withDefaults(defineProps<NumberTickerProps>(), {
  value: 0,
  direction: "up",
  delay: 0,
  duration: 1000,
  decimalPlaces: 2,
  transition: "easeOutCubic",
});
const spanRef = useTemplateRef<HTMLSpanElement>("spanRef");

const transitionValue = shallowRef(props.direction === "down" ? props.value : 0);

const transitionOutput = useTransition(transitionValue, {
  delay: computed(() => props.delay),
  duration: computed(() => props.duration),
  transition: computed(() => TransitionPresets[props.transition]),
});

const formatter = computed(() => new Intl.NumberFormat("en-US", {
    minimumFractionDigits: props.decimalPlaces,
    maximumFractionDigits: props.decimalPlaces,
  }));
const output = computed(() => formatter.value.format(Number(transitionOutput.value.toFixed(props.decimalPlaces))));

const isInView = useElementVisibility(spanRef, {
  threshold: 0,
});

const hasBeenInView = shallowRef(false);

watch(
  isInView,
  (isVisible) => {
    if (isVisible && !hasBeenInView.value) {
      hasBeenInView.value = true;
      transitionValue.value = props.direction === "down" ? 0 : props.value;
    }
  },
  { immediate: true },
);

watch(
  () => props.value,
  (newVal) => {
    if (hasBeenInView.value) {
      transitionValue.value = props.direction === "down" ? 0 : newVal;
    }
  },
);
</script>

<template>
  <span
    ref="spanRef"
    class="inline-block tracking-wider text-black tabular-nums dark:text-white"
    :class="[props.class]"
  >
    {{ output }}
  </span>
</template>
