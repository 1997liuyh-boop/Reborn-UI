<script setup lang="ts">
import { onKeyStroke, useIntervalFn, useSwipe } from "@vueuse/core";
import { computed, shallowRef, useTemplateRef, watch } from "vue";

interface Props {
  /** 图片地址列表，全部预加载完成后才开始切换 */
  images?: string[];
  /** 隐藏覆盖层（默认插槽所在层） */
  hideOverlay?: boolean;
  /** 覆盖层追加的类名 */
  overlayClass?: string;
  /** 图片元素的类名 */
  imageClass?: string;
  /** 进场起始类名 */
  enterFromClass?: string;
  /** 进场过渡类名 */
  enterActiveClass?: string;
  /** 离场过渡类名 */
  leaveActiveClass?: string;
  /** 自动播放：true 为 5000 毫秒，数字或数字字符串为间隔毫秒，false 关闭 */
  autoplay?: boolean | number | string;
  /** 切换方向，决定离场的位移方向 */
  direction?: "vertical" | "horizontal";
  /** 容器的 CSS perspective */
  perspective?: string;
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  hideOverlay: false,
  overlayClass: "",
  imageClass: "bg-cover bg-center bg-no-repeat",
  enterFromClass: "scale-0 origin-center",
  enterActiveClass: "transition-transform duration-300 ease-in-out",
  leaveActiveClass: "transition-transform duration-300 ease-in-out",
  autoplay: false,
  direction: "vertical",
  perspective: "1000px",
});

const sliderRef = useTemplateRef<HTMLElement>("sliderRef");
const currentDirection = shallowRef<"up" | "down" | "left" | "right">("up");
const currentIndex = defineModel<number>({ default: 0 });

function setCurrentDirection(dir: "prev" | "next") {
  if (props.direction === "horizontal") {
    currentDirection.value = dir === "next" ? "left" : "right";
  } else {
    currentDirection.value = dir === "next" ? "up" : "down";
  }
}

// 自动播放
const autoplayInterval = computed(() => {
  if (props.autoplay === false) return 0;
  else if (props.autoplay === true) return 5000;
  else if (typeof props.autoplay === "string") {
    return +props.autoplay;
  } else return props.autoplay;
});

const { pause, resume, isActive } = useIntervalFn(() => {
  onNext();
}, autoplayInterval);

// 图片预加载
const isLoading = shallowRef(true);
const isTransitioning = shallowRef(false);
const loadedImages = shallowRef<string[]>([]);
const currentImage = computed(() => loadedImages.value[currentIndex.value]);

function loadImage(src: string) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(src);
    image.onerror = () => reject(src);
  });
}

// 列表变化时重新加载；只在客户端执行（服务端没有 Image），过期的加载结果直接丢弃。
// 用 allSettled 只保留加载成功的图片，个别图片失败不会让组件一直停在加载态
watch(
  () => props.images,
  (images, _oldImages, onCleanup) => {
    if (!import.meta.client) return;
    let stale = false;
    onCleanup(() => {
      stale = true;
    });
    isLoading.value = true;
    Promise.allSettled(images.map(loadImage)).then((results) => {
      if (stale) return;
      loadedImages.value = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
        .map(result => result.value);
      // 新列表变短时把当前下标夹回范围内
      if (currentIndex.value >= loadedImages.value.length) currentIndex.value = 0;
      isLoading.value = false;
    });
  },
  { immediate: true },
);

// 导航
function onPrev() {
  const total = loadedImages.value.length;
  if (isLoading.value || isTransitioning.value || !total) {
    return false;
  }
  setCurrentDirection("prev");
  currentIndex.value = (currentIndex.value - 1 + total) % total;
}

function onNext() {
  const total = loadedImages.value.length;
  if (isLoading.value || isTransitioning.value || !total) {
    return false;
  }
  setCurrentDirection("next");
  currentIndex.value = (currentIndex.value + 1) % total;
}

onKeyStroke(
  ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
  (ev) => {
    ev.preventDefault();
    if (isLoading.value || isTransitioning.value) {
      return false;
    }
    pause();
    if (["ArrowUp", "ArrowLeft"].includes(ev.key)) {
      onPrev();
    } else {
      onNext();
    }
  },
  {
    target: sliderRef,
  },
);

const { direction: swipingDirection, isSwiping } = useSwipe(sliderRef, {
  passive: false,
});
watch(swipingDirection, (dir) => {
  switch (dir) {
    case "up":
    case "left":
      return onPrev();
    case "down":
    case "right":
      return onNext();
  }
});

watch(isSwiping, setSwiping);

function setSwiping(v: boolean) {
  if (v) {
    pause();
    return;
  }

  resume();
}

watch(isLoading, (v) => {
  if (v) pause();
  else resume();
});

// 过渡
function lockViewport() {
  isTransitioning.value = true;
}

function unlockViewport() {
  isTransitioning.value = false;
  if (isActive.value === false && autoplayInterval.value) {
    resume();
  }
}
const transitionProps = computed(() => {
  const bind = {
    enterActiveClass: props.enterActiveClass,
    leaveActiveClass: props.leaveActiveClass,
    enterFromClass: props.enterFromClass,
    leaveToClass: "",
    onBeforeLeave: lockViewport,
    onAfterEnter: unlockViewport,
  };

  switch (currentDirection.value) {
    case "up":
      bind.leaveToClass = "-translate-y-full";
      break;
    case "down":
      bind.leaveToClass = "translate-y-full";
      break;
    case "left":
      bind.leaveToClass = "-translate-x-full";
      break;
    case "right":
      bind.leaveToClass = "translate-x-full";
      break;
  }

  return bind;
});
</script>

<template>
  <div
    ref="sliderRef"
    tabindex="0"
    class="relative flex size-full items-center justify-center overflow-hidden transition-colors focus:ring-1 focus:outline-none"
    :style="{
      perspective: props.perspective,
    }"
  >
    <Transition
      mode="out-in"
      v-bind="transitionProps"
    >
      <div
        :key="currentImage"
        class=""
      >
        <img
          :src="currentImage"
          :class="props.imageClass"
        >
      </div>
    </Transition>
    <div
      v-if="hideOverlay !== true"
      class="absolute inset-0"
      :class="[props.overlayClass]"
    >
      <!-- Transition 只能包裹单个根节点，插槽可能有多个根，外面套一层撑满覆盖层的容器 -->
      <Transition
        appear
        enter-active-class="transition-all duration-300 delay-300 ease-in-out"
        enter-from-class="opacity-0 -translate-y-10"
      >
        <div
          v-if="!isLoading"
          class="size-full"
        >
          <slot :current-index="currentIndex" />
        </div>
      </Transition>
    </div>
  </div>
</template>
