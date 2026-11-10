<script setup lang="ts">
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";

/**
 * 站在开源项目之上：Reborn UI 依赖、移植与参考的开源项目，按用途分组的 Logo 墙（浅色底）。
 *
 * 名单依据仓库 package.json、安装文档里的依赖，以及组件页 credits 里写明的移植来源
 * （社区组件主要移植自 Magic UI 与 Aceternity UI，个别参考 Inspira UI、Uiverse）。
 * Logo 是彩色字标（logos 图形 + 名称），没有官方图形的只放名称，文件在 public/showcase/payathon-assets/stack/。
 * 每个 Logo 链到项目官网，新标签页打开。
 */

interface WallLogo {
  /** 字标文件名（不含 -color 与扩展名） */
  id: string;
  name: string;
  /** 字标宽高比（viewBox 宽 ÷ 高 200） */
  ratio: number;
  url: string;
}

interface WallGroup {
  id: string;
  title: string;
  logos: WallLogo[];
}

const GROUPS: WallGroup[] = [
  {
    id: "framework",
    title: "框架与构建",
    logos: [
      { id: "vue", name: "Vue", ratio: 2.18, url: "https://vuejs.org/" },
      { id: "nuxt", name: "Nuxt", ratio: 2.505, url: "https://nuxt.com/" },
      { id: "uniapp", name: "uni-app", ratio: 2.37, url: "https://uniapp.dcloud.net.cn/" },
      { id: "vite", name: "Vite", ratio: 2.225, url: "https://vite.dev/" },
      { id: "pnpm", name: "pnpm", ratio: 2.81, url: "https://pnpm.io/" },
    ],
  },
  {
    id: "styling",
    title: "样式、类型与工具",
    logos: [
      { id: "tailwindcss", name: "Tailwind CSS", ratio: 4.795, url: "https://tailwindcss.com/" },
      { id: "typescript", name: "TypeScript", ratio: 4.18, url: "https://www.typescriptlang.org/" },
      { id: "vueuse", name: "VueUse", ratio: 3.28, url: "https://vueuse.org/" },
      { id: "iconify", name: "Iconify", ratio: 3.07, url: "https://iconify.design/" },
      { id: "zod", name: "Zod", ratio: 2.22, url: "https://zod.dev/" },
    ],
  },
  {
    id: "motion",
    title: "动效与图形",
    logos: [
      { id: "motion-v", name: "motion-v", ratio: 2.79, url: "https://motion.dev/docs/vue" },
      { id: "gsap", name: "GSAP", ratio: 2.69, url: "https://gsap.com/" },
      { id: "threejs", name: "three.js", ratio: 3.22, url: "https://threejs.org/" },
    ],
  },
  {
    id: "sources",
    title: "社区组件来源",
    logos: [
      { id: "magic-ui", name: "Magic UI", ratio: 2.695, url: "https://magicui.design/" },
      { id: "aceternity-ui", name: "Aceternity UI", ratio: 3.925, url: "https://ui.aceternity.com/" },
      { id: "inspira-ui", name: "Inspira UI", ratio: 2.88, url: "https://inspira-ui.com/" },
      { id: "uiverse", name: "Uiverse", ratio: 2.225, url: "https://uiverse.io/" },
    ],
  },
];

/** Logo 格子的内容区（168×72 减去内边距） */
const CELL_WIDTH = 136;
const CELL_HEIGHT = 48;
/** 字标在格子里的目标显示高度：长短不一的字标按它统一视觉大小 */
const TARGET_HEIGHT = 34;

/** object-fit: contain 下字标的自然显示高度，换算成让它显示为目标高度的缩放值 */
function logoScale(ratio: number): number {
  const fitted = Math.min(CELL_HEIGHT, CELL_WIDTH / ratio);
  return Math.round(Math.min(1.1, TARGET_HEIGHT / fitted) * 100) / 100;
}
</script>

<template>
  <section id="partners" class="event-section partner-wall" aria-labelledby="partners-title">
    <div class="partner-wall-layout">
      <header class="event-section-head">
        <p class="event-english-title">
          <PayathonWord text="BUILT WITH" :size="2" />
        </p>
        <h2 id="partners-title">站在开源项目之上</h2>
        <p>Reborn UI 依赖、移植与参考的开源项目，点 Logo 前往项目官网。</p>
      </header>
      <div class="partner-wall-groups">
        <section
          v-for="group in GROUPS"
          :key="group.id"
          class="partner-wall-group"
          :class="`partner-wall-group--${group.id}`"
          :aria-labelledby="`partner-group-${group.id}`"
        >
          <h3 :id="`partner-group-${group.id}`">
            {{ group.title }}
          </h3>
          <ul class="partner-wall-grid">
            <li
              v-for="logo in group.logos"
              :key="logo.id"
              class="partner-wall-item"
              :data-partner="logo.id"
              :style="{ '--partner-logo-scale': logoScale(logo.ratio) }"
            >
              <a
                class="partner-wall-logo partner-wall-logo--link"
                :href="logo.url"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`访问 ${logo.name} 官网（在新标签页打开）`"
              ><img
                :style="{ '--partner-logo-scale': logoScale(logo.ratio) }"
                :src="`/showcase/payathon-assets/stack/${logo.id}-color.svg`"
                alt
                :width="Math.round(200 * logo.ratio)"
                height="200"
                loading="lazy"
                decoding="async"
              ></a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </section>
</template>
