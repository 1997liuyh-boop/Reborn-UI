<script lang="ts" setup>
import { computed, onMounted, onUnmounted, useId, useTemplateRef, watch } from "vue";

const props = withDefaults(defineProps<Props>(), {
  morphTime: 1.5,
  coolDownTime: 0.5,
});

const TEXT_CLASSES = "absolute inset-x-0 top-0 m-auto inline-block w-full";

interface Props {
  class?: string;
  text: string;
  morphTime?: number;
  coolDownTime?: number;
}
const text1Ref = useTemplateRef<HTMLSpanElement>("text1Ref");
const text2Ref = useTemplateRef<HTMLSpanElement>("text2Ref");

/** 阈值滤镜的唯一 id：写死的 id 在同页多实例时会重复，第一个实例卸载或被隐藏后其他实例的引用可能失效 */
const thresholdId = `${useId()}-text-morph-threshold`;
const rootStyle = computed(() => ({ filter: `url(#${thresholdId}) blur(0.6px)` }));

// 逐帧推进的状态不参与渲染（文本与样式都直接写到 DOM），用普通变量，避免每帧经过响应式代理
let previousText = props.text;
let currentText = props.text;
let morph = 0;
let coolDown = 0;
let time = new Date();

let isAnimating = false;

let animationFrameId: number = 0;

function setStyles(fraction: number) {
  if (!text1Ref.value || !text2Ref.value) return;

  text2Ref.value.textContent = currentText;
  text1Ref.value.textContent = previousText;

  text2Ref.value.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
  text2Ref.value.style.opacity = `${fraction ** 0.4 * 100}%`;

  const invertedFraction = 1 - fraction;
  text1Ref.value.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
  text1Ref.value.style.opacity = `${invertedFraction ** 0.4 * 100}%`;
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
    previousText = currentText;
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

function animate() {
  // 先取消已排队的帧，保证任何时候只有一条循环
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(animate);

  const newTime = new Date();
  const dt = (newTime.getTime() - time.getTime()) / 1000;
  time = newTime;

  coolDown -= dt;

  if (coolDown <= 0) {
    doMorph();

    // 变形完成后停止循环
    if (coolDown > 0) {
      cancelAnimationFrame(animationFrameId);
      isAnimating = false;
    }
  } else {
    doCoolDown();
  }
}

/** 启动循环：标记进行中，防止首段动画期间文本变化时再开一条循环 */
function startAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  animate();
}

watch(
  () => props.text,
  (newText) => {
    if (newText !== currentText) {
      previousText = currentText;
      currentText = newText;
      morph = 0;
      coolDown = 0;
      time = new Date();

      startAnimation();
    }
  },
);

onMounted(() => {
  startAnimation();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  isAnimating = false;
});
</script>

<template>
  <div
    class="relative h-16 w-full max-w-screen-md text-center font-sans text-[40pt] leading-none font-bold"
    :class="[props.class]"
    :style="rootStyle"
  >
    <span
      ref="text1Ref"
      :class="[TEXT_CLASSES]"
    />
    <span
      ref="text2Ref"
      :class="[TEXT_CLASSES]"
    />

    <svg
      class="fixed size-0"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter :id="thresholdId">
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
