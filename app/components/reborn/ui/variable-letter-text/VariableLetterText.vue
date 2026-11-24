<script setup lang="ts">
import type { Transition } from "motion-v";
import type { HTMLAttributes } from "vue";
import { stagger, useAnimate, useReducedMotion } from "motion-v";
import { computed, watch } from "vue";
import { cn } from "~/lib/utils";

type StaggerOrigin = "first" | "last" | "center" | number;

export interface VariableLetterTextProps {
  label: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  transition?: Transition;
  staggerDuration?: number;
  staggerFrom?: StaggerOrigin;
  class?: HTMLAttributes["class"];
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<VariableLetterTextProps>(), {
  fromFontVariationSettings: "'wght' 400",
  toFontVariationSettings: "'wght' 900",
  transition: () => ({ type: "spring", duration: 0.7 }),
  staggerDuration: 0.03,
  staggerFrom: "first",
});

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const [scope, animate] = useAnimate<HTMLSpanElement>();
const reducedMotion = useReducedMotion();
const segmenter = typeof Intl.Segmenter === "function" ? new Intl.Segmenter() : undefined;
const letters = computed(() => segmenter
  ? Array.from(segmenter.segment(props.label), ({ segment }) => segment)
  : Array.from(props.label));
let hovered = false;
let animation: ReturnType<typeof animate> | undefined;

function updateLetters() {
  // 快速移入移出时先停止上一轮，避免尚未开始的字符动画写回旧状态。
  animation?.stop();
  const elements = scope.value?.querySelectorAll<HTMLSpanElement>("[data-variable-letter]");
  if (!elements?.length) return;

  if (reducedMotion.value) {
    for (const letter of elements) letter.style.fontVariationSettings = props.fromFontVariationSettings;
    return;
  }

  animation = animate(elements, {
    fontVariationSettings: hovered ? props.toFontVariationSettings : props.fromFontVariationSettings,
  }, {
    ...props.transition,
    delay: stagger(props.staggerDuration, { from: props.staggerFrom }),
  });
}

function setHovered(value: boolean) {
  if (hovered === value) return;
  hovered = value;
  updateLetters();
}

watch([
  letters,
  () => props.fromFontVariationSettings,
  () => props.toFontVariationSettings,
  reducedMotion,
], updateLetters, { flush: "post" });
</script>

<template>
  <span
    ref="scope"
    v-bind="$attrs"
    :class="cn('inline-block', props.class)"
    :data-text="props.label"
    @click="emit('click', $event)"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)"
  >
    <span class="sr-only">{{ props.label }}</span>
    <span
      v-for="(letter, index) in letters"
      :key="`${index}-${letter}`"
      class="inline-block whitespace-pre"
      data-variable-letter
      :style="{ fontVariationSettings: props.fromFontVariationSettings }"
      aria-hidden="true"
      v-text="letter"
    />
  </span>
</template>
