<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { onClickOutside, useEventListener } from "@vueuse/core";
import { AnimatePresence, Motion } from "motion-v";
import { inject, onBeforeUnmount, shallowRef, useTemplateRef, watch } from "vue";
import { useGlobalScrollLock } from "~/composables/useGlobalScrollLock";
import { CarouselKey } from "./AppleCarouselContext";

interface Card {
  src: string;
  title: string;
  category: string;
}

interface Props {
  card: Card;
  index: number;
  layout?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  layout: false,
});

const open = shallowRef(false);
const containerRef = useTemplateRef<ComponentPublicInstance>("containerRef");
const carouselContext = inject(CarouselKey);

if (!carouselContext) {
  throw new Error("Card must be used within a Carousel");
}

const { onCardClose } = carouselContext;

// 只在本卡片打开时响应 Esc；不传目标时默认监听 window，服务端渲染安全，卸载时自动移除
useEventListener("keydown", (event: KeyboardEvent) => {
  if (open.value && event.key === "Escape") {
    handleClose();
  }
});

// 打开时锁定页面滚动：与其他浮层共用引用计数锁，卸载时一并释放，不直接改 body.style
const scrollLock = useGlobalScrollLock();

watch(open, (value) => {
  if (value) scrollLock.acquire();
  else scrollLock.release();
});

onBeforeUnmount(() => scrollLock.release());

onClickOutside(containerRef, () => handleClose());

function handleOpen() {
  open.value = true;
}

// 关闭幂等：未打开时不再通知轮播滚动
function handleClose() {
  if (!open.value) return;
  open.value = false;
  onCardClose(props.index);
}
</script>

<template>
  <!-- Nuxt 的服务端渲染只支持传送到 #teleports，传送到 body 会水合失败 -->
  <Teleport to="#teleports">
    <AnimatePresence>
      <div
        v-if="open"
        class="fixed inset-0 z-50 h-screen overflow-auto"
      >
        <Motion
          as="div"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          class="fixed inset-0 size-full bg-black/80 backdrop-blur-lg"
        />
        <Motion
          ref="containerRef"
          as="div"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :layout-id="layout ? `card-${card.title}` : undefined"
          class="relative z-[60] mx-auto my-10 h-fit max-w-5xl rounded-3xl bg-white p-4 font-sans md:p-10 dark:bg-neutral-900"
        >
          <button
            class="sticky top-4 right-0 ml-auto flex size-8 items-center justify-center rounded-full bg-black dark:bg-white"
            @click="handleClose"
          >
            <Icon
              name="tabler:x"
              class="size-6 text-neutral-100 dark:text-neutral-900"
            />
          </button>
          <Motion
            as="div"
            :layout-id="layout ? `category-${card.title}` : undefined"
            class="text-base font-medium text-black dark:text-white"
          >
            {{ card.category }}
          </Motion>
          <Motion
            as="div"
            :layout-id="layout ? `title-${card.title}` : undefined"
            class="mt-4 text-2xl font-semibold text-neutral-700 md:text-5xl dark:text-white"
          >
            {{ card.title }}
          </Motion>
          <div class="py-10">
            <slot />
          </div>
        </Motion>
      </div>
    </AnimatePresence>
  </Teleport>

  <Motion
    :layout-id="layout ? `card-${card.title}` : undefined"
    class="relative z-10 flex h-80 w-56 flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 md:h-[40rem] md:w-96 dark:bg-neutral-900"
    @click="handleOpen"
  >
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-gradient-to-b from-black/50 via-transparent to-transparent"
    />
    <div class="relative z-40 p-8">
      <Motion
        :layout-id="layout ? `category-${card.title}` : undefined"
        class="text-left font-sans text-sm font-medium text-white md:text-base"
      >
        {{ card.category }}
      </Motion>
      <Motion
        :layout-id="layout ? `title-${card.title}` : undefined"
        class="mt-2 max-w-xs text-left font-sans text-xl font-semibold [text-wrap:balance] text-white md:text-3xl"
      >
        {{ card.title }}
      </Motion>
    </div>
    <AppleBlurImage
      :src="card.src"
      :alt="card.title"
      class="absolute inset-0 z-10 object-cover"
      :fill="true"
    />
  </Motion>
</template>
