<script lang="ts" setup>
import { useColorMode } from "#imports";
import NumberFlow from "@number-flow/vue";
import { useEventListener } from "@vueuse/core";
import { motion, MotionConfig } from "motion-v";
import { computed, onBeforeUnmount, onMounted, shallowRef } from "vue";

interface Props {
  class?: string;
  title?: string;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  class: "",
  title: "Progress",
  height: 44,
});

const open = shallowRef(false);

const scrollPercentage = shallowRef(0);

// 读取站点主题（Nuxt 的 @nuxtjs/color-mode，只读不写）。
// 不能用 @vueuse/core 的 useColorMode：它会按自己存储的值（默认跟随系统）改写 html 的 dark / light 类，
// 覆盖用户在站点上选的主题；放在 computed 里调用还会每次求值都泄漏一组监听
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
const borderRadius = computed(() => `${props.height / 2}px`);

function updatePageScroll() {
  const scrollable = document.body.scrollHeight - window.innerHeight;
  // 页面不可滚动时分母为 0，进度取 0，避免 NaN / Infinity 传给进度环和数字动画
  scrollPercentage.value = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
}

/** 滚动事件按帧合并：一帧内多次 scroll 只更新一次进度 */
let frame = 0;
function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updatePageScroll();
  });
}

// 不传目标时默认挂到 window 且服务端不执行；passive 不阻塞滚动，卸载时自动移除
useEventListener("scroll", onScroll, { passive: true });

onMounted(updatePageScroll);

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <MotionConfig
    :transition="{
      duration: 0.7,
      type: 'spring',
      bounce: 0.5,
    }"
  >
    <div
      class="bg-primary/90 border-radius fixed top-12 left-1/2 z-[999] -translate-x-1/2 backdrop-blur-lg"
      :class="[$props.class]" @click="() => (open = !open)"
    >
      <motion.div
        layout :initial="{
          height: props.height,
          width: 0,
        }" :animate="{
          height: open && $slots.default ? 'auto' : props.height,
          width: open && $slots.default ? 320 : 260,
        }" class="bg-natural-900 text-secondary relative cursor-pointer overflow-hidden"
      >
        <header class="gray- flex h-11 cursor-pointer items-center gap-2 px-4">
          <AnimatedCircularProgressBar
            :value="scrollPercentage * 100" :min="0" :max="100" :circle-stroke-width="10"
            class="w-6" :show-percentage="false" :duration="0.3"
            :gauge-secondary-color="isDark ? '#6b728055' : '#6b728099'"
            :gauge-primary-color="isDark ? 'black' : 'white'"
          />
          <h1 class="grow text-center font-bold text-white">{{ title }}</h1>
          <NumberFlow :value="scrollPercentage" :format="{ style: 'percent' }" locales="en-US" />
        </header>
        <!-- 插槽是否存在在渲染时判断：computed 包 slots 只算一次，插槽之后出现或消失不会更新 -->
        <motion.div
          v-if="$slots.default"
          class="mb-2 flex h-full max-h-60 flex-col gap-1 overflow-y-auto px-4 text-sm"
        >
          <slot />
        </motion.div>
      </motion.div>
    </div>
  </MotionConfig>
</template>

<style scoped>
.border-radius {
  border-radius: v-bind(borderRadius);
}
</style>
