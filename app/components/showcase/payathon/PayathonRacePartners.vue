<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountInteractiveGlyphs } from "~/lib/payathon/interactive-glyphs";
import { mountRacePartners } from "~/lib/payathon/race-partners";

/**
 * 技术栈：Reborn UI 组件与文档站实际用到的框架和库，以 Logo 跑马灯展示。
 * 上方是控制滚动方向与速度的刻度拨盘（可拖动），指针靠近 Logo 时出现色散。
 *
 * Logo 是白色单色字标（simple-icons 图形 + 名称），由 D:/tmp 下的生成脚本写到 public/showcase/payathon-assets/stack/；
 * 没有官方图形的（uni-app、motion-v）只放名称。名单依据仓库 package.json 与安装文档里的依赖。
 * 交互在挂载后由 app/lib/payathon/race-partners.ts 驱动。
 */

interface StackLogo {
  /** 文件名（不含扩展名） */
  id: string;
  /** 读屏用的名称 */
  name: string;
  /** 字标宽高比（viewBox 宽 ÷ 高 200） */
  ratio: number;
}

/** 字标统一高 200，宽度随名称长度变化 */
const LOGO_HEIGHT = 200;

const STACK: StackLogo[] = [
  { id: "vue", name: "Vue", ratio: 2.18 },
  { id: "nuxt", name: "Nuxt", ratio: 2.505 },
  { id: "uniapp", name: "uni-app", ratio: 2.37 },
  { id: "vite", name: "Vite", ratio: 2.225 },
  { id: "typescript", name: "TypeScript", ratio: 4.18 },
  { id: "tailwindcss", name: "Tailwind CSS", ratio: 4.795 },
  { id: "vueuse", name: "VueUse", ratio: 3.28 },
  { id: "motion-v", name: "motion-v", ratio: 2.79 },
  { id: "gsap", name: "GSAP", ratio: 2.69 },
  { id: "threejs", name: "three.js", ratio: 3.22 },
  { id: "iconify", name: "Iconify", ratio: 3.07 },
  { id: "zod", name: "Zod", ratio: 2.22 },
  { id: "pnpm", name: "pnpm", ratio: 2.81 },
];

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  cleanups.push(mountRacePartners(root));
  const strip = root.querySelector<HTMLElement>(".race-partners-window");
  if (strip) cleanups.push(mountInteractiveGlyphs(strip));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <section id="race-partners" ref="root" class="race-partners" aria-labelledby="race-partners-title">
    <div class="race-partners-heading">
      <h2 id="race-partners-title">技术栈</h2>
      <label class="race-partners-speed" hidden>
        <span class="race-partners-error" role="status" aria-live="polite" />
        <span class="race-partners-scale" aria-hidden="true">
          <span class="race-partners-scale-labels"><span>3×</span><span>0</span><span>3×</span></span>
          <span class="race-partners-scale-track"><span class="race-partners-scale-position" /></span>
        </span>
        <span class="race-partners-wheel">
          <span class="race-partners-wheel-ribs" aria-hidden="true" />
          <span class="race-partners-wheel-glint" aria-hidden="true" />
          <canvas class="race-partners-smoke" width="400" height="400" aria-hidden="true" />
          <svg class="race-partners-sparks" viewBox="0 0 180 30" aria-hidden="true">
            <path d="M8 18 30 9 25 20 54 5 48 17 77 11 70 24 105 6 98 19 127 12 121 24 152 8 146 19 172 13" />
            <path d="m54 5 7 12-8 9m74-14 11 5-3 10" />
          </svg>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.1"
            value="-1.5"
            aria-label="Logo 滚动方向与速度"
            aria-valuetext="向左 1.5 倍速"
          >
        </span>
      </label>
    </div>
    <div class="race-partners-window">
      <div class="race-partners-track">
        <!-- 两份相同的列表首尾相接，跑马灯平移一整份的宽度后无缝回到起点；第二份只给视觉，不进读屏 -->
        <ul
          v-for="copy in [false, true]"
          :key="String(copy)"
          class="race-partners-list"
          :aria-hidden="copy ? 'true' : undefined"
          :data-copy="copy ? '' : undefined"
        >
          <li
            v-for="logo in STACK"
            :key="logo.id"
            :style="{ '--race-logo-scale': 0.92, '--race-logo-ratio': logo.ratio }"
          >
            <img
              :src="`/showcase/payathon-assets/stack/${logo.id}.svg`"
              :alt="copy ? '' : logo.name"
              :width="Math.round(LOGO_HEIGHT * logo.ratio)"
              :height="LOGO_HEIGHT"
              loading="lazy"
              decoding="async"
            >
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
