<script lang="ts" setup>
import { onMounted, onUnmounted, useId, useTemplateRef } from "vue";

interface Props {
  class?: string;
  texts: string[];
  morphTime?: number;
  coolDownTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  morphTime: 1.5,
  coolDownTime: 0.5,
});
const TEXT_CLASSES = "absolute inset-x-0 top-0 m-auto inline-block w-full";

let textIndex = 0;
let morph = 0;
let coolDown = 0;
let time = 0;
const filterId = `morphing-text-${useId()}`;

const text1Ref = useTemplateRef<HTMLSpanElement>("text1Ref");
const text2Ref = useTemplateRef<HTMLSpanElement>("text2Ref");

function setStyles(fraction: number) {
  if (!text1Ref.value || !text2Ref.value || !props.texts.length) return;

  text2Ref.value.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  text2Ref.value.style.opacity = `${fraction ** 0.4 * 100}%`;

  const invertedFraction = 1 - fraction;
  text1Ref.value.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
  text1Ref.value.style.opacity = `${invertedFraction ** 0.4 * 100}%`;

  text1Ref.value.textContent = props.texts[textIndex % props.texts.length] ?? "";
  text2Ref.value.textContent = props.texts[(textIndex + 1) % props.texts.length] ?? "";
}

function doMorph() {
  morph -= coolDown;
  coolDown = 0;

  let fraction = morph / props.morphTime;

  if (fraction > 1) {
    coolDown = props.coolDownTime;
    fraction = 1;
  }

  setStyles(fraction);

  if (fraction === 1) {
    textIndex++;
  }
}

function doCoolDown() {
  morph = 0;

  if (text1Ref.value && text2Ref.value) {
    text2Ref.value.style.filter = "none";
    text2Ref.value.style.opacity = "100%";
    text1Ref.value.style.filter = "none";
    text1Ref.value.style.opacity = "0%";
  }
}

let animationFrameId: number = 0;
function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const newTime = performance.now();
  const dt = (newTime - time) / 1000;
  time = newTime;

  coolDown -= dt;

  if (coolDown <= 0) {
    doMorph();
  } else {
    doCoolDown();
  }
}

onMounted(() => {
  time = performance.now();
  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <div
    class="relative mx-auto h-16 w-full max-w-screen-md text-center font-sans text-[40pt] leading-none font-bold md:h-24 lg:text-[6rem]"
    :class="[props.class]"
    :style="{ filter: `url(#${filterId}) blur(0.6px)` }"
  >
    <span ref="text1Ref" :class="[TEXT_CLASSES]" />
    <span ref="text2Ref" :class="[TEXT_CLASSES]" />

    <svg class="fixed size-0" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter :id="filterId">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  </div>
</template>
