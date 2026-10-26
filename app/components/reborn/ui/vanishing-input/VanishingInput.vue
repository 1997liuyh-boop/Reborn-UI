<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";

interface Props {
  /** 轮换显示的占位文本 */
  placeholders?: string[];
  /** 挂载后是否自动聚焦输入框；聚焦时不滚动页面 */
  autofocus?: boolean;
}

interface PixelData {
  x: number;
  y: number;
  color: string;
}

interface AnimatedPixel extends PixelData {
  r: number;
}

const props = withDefaults(defineProps<Props>(), {
  placeholders: () => ["Placeholder 1", "Placeholder 2", "Placeholder 3"],
  autofocus: false,
});
const emit = defineEmits<{
  /** 按回车或点击提交按钮时触发，参数为提交时的文本 */
  submit: [value: string];
  /** 输入值变化时触发，参数为模拟的事件对象；动画期间不触发 */
  change: [event: { target: { value: string } }];
}>();
const vanishingText = defineModel<string>({
  default: "",
});
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
const inputRef = useTemplateRef<HTMLInputElement>("inputRef");

const currentPlaceholder = shallowRef(0);
const animating = shallowRef(false);

// 定时器句柄与像素数据只给逻辑和 canvas 绘制用、不参与渲染：用普通变量，
// 放在深层 ref 里时，消散动画每帧逐个像素经过响应式代理读写，文本越长越容易掉帧
let placeholderTimer: number | null = null;
let animationFrame: number | null = null;
let refocusTimer: ReturnType<typeof setTimeout> | null = null;
let pixels: AnimatedPixel[] = [];

onMounted(() => {
  if (!props.autofocus || !inputRef.value) return;
  // 不滚动页面：组件不在首屏时，挂载聚焦会把页面滚过去
  inputRef.value.focus({ preventScroll: true });
});

function stopPlaceholderTimer(): void {
  if (placeholderTimer !== null) {
    clearInterval(placeholderTimer);
    placeholderTimer = null;
  }
}

function changePlaceholder(): void {
  // 先清除已有的定时器：连续收到 visible 时不会叠加出多个 interval
  stopPlaceholderTimer();
  placeholderTimer = window.setInterval(() => {
    currentPlaceholder.value = (currentPlaceholder.value + 1) % props.placeholders.length;
  }, 3000);
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    changePlaceholder();
  } else {
    stopPlaceholderTimer();
  }
}

function draw(): void {
  if (!inputRef.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const computedStyles = getComputedStyle(inputRef.value);

  canvas.width = 800;
  canvas.height = 800;
  ctx.clearRect(0, 0, 800, 800);

  const fontSize = Number.parseFloat(computedStyles.getPropertyValue("font-size"));
  ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
  ctx.fillStyle = "#FFF";
  ctx.fillText(vanishingText.value, 16, 40);

  const imageData = ctx.getImageData(0, 0, 800, 800);
  const pixelData = imageData.data;
  const newData: AnimatedPixel[] = [];

  for (let t = 0; t < 800; t++) {
    const i = 4 * t * 800;
    for (let n = 0; n < 800; n++) {
      const e = i + 4 * n;
      if (pixelData[e] !== 0 && pixelData[e + 1] !== 0 && pixelData[e + 2] !== 0) {
        newData.push({
          x: n,
          y: t,
          r: 1,
          color: `rgba(${pixelData[e]}, ${pixelData[e + 1]}, ${pixelData[e + 2]}, ${pixelData[e + 3]})`,
        });
      }
    }
  }
  pixels = newData;
}

function animate(start: number = 0): void {
  animationFrame = requestAnimationFrame(() => {
    animationFrame = null;
    const newArr: AnimatedPixel[] = [];
    for (const current of pixels) {
      if (current.x < start) {
        newArr.push(current);
      } else {
        if (current.r <= 0) {
          current.r = 0;
          continue;
        }
        current.x += Math.random() > 0.5 ? 1 : -1;
        current.y += Math.random() > 0.5 ? 1 : -1;
        current.r -= 0.05 * Math.random();
        newArr.push(current);
      }
    }
    pixels = newArr;
    const ctx = canvasRef.value?.getContext("2d");
    if (ctx) {
      ctx.clearRect(start, 0, 800, 800);
      for (const { x, y, r, color } of pixels) {
        if (x > start) {
          ctx.beginPath();
          ctx.rect(x, y, r, r);
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.stroke();
        }
      }
    }
    if (pixels.length > 0) {
      animate(start - 8);
    } else {
      vanishingText.value = "";
      animating.value = false;
      refocusTimer = setTimeout(() => {
        refocusTimer = null;
        // 动画结束后把焦点还给输入框
        inputRef.value?.focus();
      }, 100);
    }
  });
}

function handleKeyDown(e: KeyboardEvent): void {
  if (vanishingText.value === "") return;
  if (e.key === "Enter" && !animating.value) {
    vanishAndSubmit();
  }
}

/** 求像素最大横坐标：用循环而不是 Math.max(...arr)，数万个像素展开成参数可能栈溢出 */
function maxPixelX(list: AnimatedPixel[]): number {
  let max = Number.NEGATIVE_INFINITY;
  for (const { x } of list) {
    if (x > max) max = x;
  }
  return max;
}

function vanishAndSubmit(): void {
  animating.value = true;
  draw();
  if (vanishingText.value) {
    animate(maxPixelX(pixels));
    emit("submit", vanishingText.value);
  }
}

function handleSubmit(): void {
  vanishAndSubmit();
}

// 输入值变化时派发 change（动画期间不派发）
watch(vanishingText, (newVal: string) => {
  if (!animating.value) {
    emit("change", { target: { value: newVal } });
  }
});

onMounted(() => {
  changePlaceholder();
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  stopPlaceholderTimer();
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
  if (refocusTimer !== null) {
    clearTimeout(refocusTimer);
    refocusTimer = null;
  }
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <form
    class="relative mx-auto h-12 w-full max-w-xl overflow-hidden rounded-full bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200 dark:bg-zinc-800"
    :class="[vanishingText && 'bg-gray-50']"
    @submit.prevent="handleSubmit"
  >
    <!-- 消散动画的画布 -->
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute top-[20%] left-2 origin-top-left scale-50 pr-20 text-base invert sm:left-8 dark:invert-0"
      :class="[animating ? 'opacity-100' : 'opacity-0']"
    />

    <!-- 文本输入框 -->
    <input
      ref="inputRef"
      v-model="vanishingText"
      :disabled="animating"
      type="text"
      class="relative z-50 size-full rounded-full border-none bg-transparent pr-20 pl-4 text-sm text-black focus:ring-0 focus:outline-none sm:pl-10 sm:text-base dark:text-white"
      :class="{ 'text-transparent dark:text-transparent': animating }"
      @keydown.enter="handleKeyDown"
    >

    <!-- 提交按钮 -->
    <button
      :disabled="!vanishingText"
      type="submit"
      class="absolute top-1/2 right-2 z-50 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black transition duration-200 disabled:bg-gray-100 dark:bg-zinc-900 dark:disabled:bg-zinc-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4 text-gray-300"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path
          d="M5 12l14 0"
          :style="{
            strokeDasharray: '50%',
            strokeDashoffset: vanishingText ? '0' : '50%',
            transition: 'stroke-dashoffset 0.3s linear',
          }"
        />
        <path d="M13 18l6 -6" />
        <path d="M13 6l6 6" />
      </svg>
    </button>

    <!-- 轮换的占位文本 -->
    <div class="pointer-events-none absolute inset-0 flex items-center rounded-full">
      <Transition
        v-show="!vanishingText"
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        leave-active-class="transition duration-300 ease-in"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <p
          :key="currentPlaceholder"
          class="w-[calc(100%-2rem)] truncate pl-4 text-left text-sm font-normal text-neutral-500 sm:pl-10 sm:text-base dark:text-zinc-500"
        >
          {{ placeholders[currentPlaceholder] }}
        </p>
      </Transition>
    </div>
  </form>
</template>
