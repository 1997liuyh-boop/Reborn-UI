<script setup lang="ts">
import type { HomeComponentRow } from "~/lib/payathon/home-catalog";
import PayathonAsciiTransition from "~/components/showcase/payathon/PayathonAsciiTransition.vue";
import PayathonBenefits from "~/components/showcase/payathon/PayathonBenefits.vue";
import PayathonClosing from "~/components/showcase/payathon/PayathonClosing.vue";
import PayathonContents from "~/components/showcase/payathon/PayathonContents.vue";
import PayathonFooterCard from "~/components/showcase/payathon/PayathonFooterCard.vue";
import PayathonGuide from "~/components/showcase/payathon/PayathonGuide.vue";
import PayathonHero from "~/components/showcase/payathon/PayathonHero.vue";
import PayathonLeaderboard from "~/components/showcase/payathon/PayathonLeaderboard.vue";
import PayathonPartners from "~/components/showcase/payathon/PayathonPartners.vue";
import PayathonRacePartners from "~/components/showcase/payathon/PayathonRacePartners.vue";
import PayathonSelection from "~/components/showcase/payathon/PayathonSelection.vue";
import PayathonShowcase from "~/components/showcase/payathon/PayathonShowcase.vue";
import PayathonSiteHeader from "~/components/showcase/payathon/PayathonSiteHeader.vue";
import PayathonSprite from "~/components/showcase/payathon/PayathonSprite.vue";
import PayathonTideFooter from "~/components/showcase/payathon/PayathonTideFooter.vue";
import PayathonTracks from "~/components/showcase/payathon/PayathonTracks.vue";
import PayathonValue from "~/components/showcase/payathon/PayathonValue.vue";
import { mountCommunityShowcase } from "~/lib/payathon/community-showcase";
import { mountContents } from "~/lib/payathon/contents";
import { buildHomeCatalog, HOME_CATALOG_KEY } from "~/lib/payathon/home-catalog";
import { mountInteractiveGlyphsAll } from "~/lib/payathon/interactive-glyphs";
import { mountScrollReveal } from "~/lib/payathon/page-effects";
import "~/components/showcase/payathon/payathon.css";

/**
 * Reborn UI 首页
 *
 * 版式与动效沿用一张黑客松活动页的视觉模板（组件与模块名里的 payathon 即这套模板的名字）：
 * 每个区块是一个组件，交互由 app/lib/payathon 下的模块在挂载时启动、卸载时释放。
 * 文案、数据与链接全部是 Reborn UI 自己的：组件数、分类等由下面的目录查询实时得出，不写死。
 */

definePageMeta({
  layout: false,
  header: false,
  footer: false,
  // 站点全局的回到顶部按钮会叠在左侧目录上，首页不挂
  backTop: false,
  // 整页是深色设计（权益区自带浅色底），锁定暗色
  colorMode: "dark",
});

const SEO_TITLE = "Reborn UI — 跨端 Vue 组件库";
const SEO_DESCRIPTION = "面向 Web 与 UniApp 的 Vue 组件库，使用 TypeScript 与 Tailwind CSS，支持按需安装组件源码与自由定制。";

useSeoMeta({
  title: SEO_TITLE,
  ogTitle: SEO_TITLE,
  description: SEO_DESCRIPTION,
  ogDescription: SEO_DESCRIPTION,
});

defineOgImageComponent("Docs", {
  headline: "Reborn UI",
});

/* ── 组件目录：组件数、分类、组件卡片都从这里取 ──────────────────── */

const { data: componentRows } = await useAsyncData("home-components", () =>
  queryCollection("docs")
    .where("path", "LIKE", "/components/%")
    .select("path", "title", "description", "category", "platform", "series")
    .all(),
);
const catalog = computed(() => buildHomeCatalog((componentRows.value ?? []) as HomeComponentRow[]));
provide(HOME_CATALOG_KEY, catalog);

/** 每次访问随机挑一个强调色；用 useState 保证服务端与客户端选到同一个 */
const ACCENTS = ["#60b5ff", "#ffe29b", "#bd9bff", "#9baaff", "#ff9c83", "#ff97c6", "#ffb06f", "#ffd18b", "#f8d581", "#ffa17a", "#7faaff", "#efd0a0"];
const paletteIndex = useState("payathon-palette", () => Math.floor(Math.random() * ACCENTS.length));
const accent = computed(() => ACCENTS[paletteIndex.value] ?? ACCENTS[0]);

/* ── 跨区块的页面级交互 ─────────────────────────────────────────── */

const pageRef = useTemplateRef<HTMLElement>("page");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const page = pageRef.value;
  if (!page) return;
  cleanups.push(
    // 左侧目录：滚动高亮、程序坞放大、浅色区反色
    mountContents(page),
    // 各区块标题、卡片滚进视口时淡入
    mountScrollReveal(page),
    // 组件墙与（隐藏的）榜单：两者跨两个区块，所以在页面级挂载
    mountCommunityShowcase(page),
    // 英文小标题的指针色散
    mountInteractiveGlyphsAll(page.querySelectorAll(".event-english-title")),
  );
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});
</script>

<template>
  <div
    id="payathon-page"
    ref="page"
    lang="zh-CN"
    data-theme="dark"
    data-theme-lock="dark"
    data-astro-cid-45h6wvi2
    :data-payathon-palette="paletteIndex"
    :style="{ '--payathon-accent': accent, 'colorScheme': 'dark' }"
  >
    <PayathonSiteHeader />
    <PayathonSprite />
    <main id="top" data-astro-cid-45h6wvi2>
      <PayathonHero />
      <PayathonRacePartners />
      <PayathonContents />
      <PayathonValue />
      <PayathonTracks />
      <PayathonShowcase />
      <PayathonLeaderboard />
      <PayathonGuide />
      <PayathonSelection />
      <PayathonAsciiTransition />
      <PayathonBenefits />
      <PayathonPartners />
      <PayathonAsciiTransition exit />
      <PayathonClosing />
    </main>
    <PayathonTideFooter />
    <PayathonFooterCard />
  </div>
</template>
