<script setup lang="ts">
/**
 * DocsFooterCrowd —— 文档页底部的「路人走过」装饰
 *
 * 人群本身是 RebornCrowd 组件（special-effects / reborn-crowd），这里只负责文档页的摆放：
 * 由 frontmatter 的 footerCrowd 开启（见 DocsPage），铺满屏幕宽度、上沿渐隐、底边贴住页脚。
 */
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { onMounted, shallowRef, useTemplateRef } from "vue";
import RebornCrowd from "~/components/reborn/ui/reborn-crowd/RebornCrowd.vue";

/** 精灵图：Open Peeps 15 列 × 7 行，来源与授权见 public/images/peeps/README.md */
const sheetSrc = `${useRuntimeConfig().app.baseURL.replace(/\/$/, "")}/images/peeps/open-peeps-sheet.png`;

const placeholder = useTemplateRef<HTMLElement>("placeholder");

/**
 * 铺满屏幕宽度：外层占位留在正文栏里只负责撑高度，人群层按实测结果左移到视口左缘、宽度取视口宽度。
 *
 * 不能只靠负边距抵消容器内边距：容器在宽屏上有最大宽度（--ui-container，组件总览页为 100rem）并居中，
 * 1600px 以上两侧会空出一截。也不用 100vw：它把纵向滚动条算在内，会多出滚动条那么宽，撑出横向滚动条。
 * clientWidth 不含滚动条，正好是可见宽度。挂载前沿用正文栏宽度，此时精灵图还没加载，不会看到跳动。
 */
const bleedStyle = shallowRef<{ left: string; width: string }>();

function measureBleed() {
  const el = placeholder.value;
  if (!el) return;
  bleedStyle.value = {
    left: `${-el.getBoundingClientRect().left}px`,
    width: `${document.documentElement.clientWidth}px`,
  };
}

// 视口变化会改容器宽度与居中位置；正文栏自身变宽变窄（如右侧面板开合）由占位的尺寸变化兜住
useEventListener(() => import.meta.client ? window : undefined, "resize", measureBleed, { passive: true });
useResizeObserver(placeholder, measureBleed);
onMounted(measureBleed);
</script>

<template>
  <!--
    高度与 aarivi 一致：桌面 min(42svh, 22rem)、窄屏 min(28svh, 13rem)，人物抬头也不会顶到上沿的渐隐区。
    -mb-24 抵消 UPageBody 的 pb-24，底边贴住页脚。人群层铺满屏幕宽度的做法见 bleedStyle。
    暗色下不反相（反相后头发变白、皮肤变黑，像底片），只降到 90% 不透明度压一下白色的刺眼感。
  -->
  <div
    ref="placeholder"
    class="pointer-events-none relative -mb-24 h-[min(28svh,13rem)] select-none md:h-[min(42svh,22rem)]"
    aria-hidden="true"
  >
    <RebornCrowd
      :src="sheetSrc"
      class="absolute inset-y-0 left-0 w-full [mask-image:linear-gradient(to_bottom,transparent_0%,#000_16%)] md:[mask-image:linear-gradient(to_bottom,transparent_0%,#000_12%)] dark:opacity-90"
      :style="bleedStyle"
    />
  </div>
</template>
