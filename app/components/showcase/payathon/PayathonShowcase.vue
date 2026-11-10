<script setup lang="ts">
import type { HomeComponent, HomePlatform } from "~/lib/payathon/home-catalog";
import { computed, inject } from "vue";
import { EMPTY_HOME_CATALOG, HOME_CATALOG_KEY } from "~/lib/payathon/home-catalog";
import PayathonWord from "./PayathonWord.vue";

/**
 * 组件一览（SHOWCASE）：从组件目录里挑 9 个组件做成卡片墙，点卡片进入对应的组件文档。
 *
 * 卡片在这里按目录数据服务端渲染，标题、分类、描述、适用端都取自组件文档的 frontmatter；
 * 气泡、跑马灯、按行入场与移动端轮播由 app/lib/payathon/community-showcase.ts 在页面挂载后接管。
 * 卡片结构与类名沿用原卡片模板，以命中原有样式；色调按分类映射，见底部样式。
 */

/** 卡面色调：沿用原卡片的五种配色 */
type CardTone = "neutral" | "blue" | "green" | "violet" | "orange";

/**
 * 优先展示的组件：全部是 Reborn 自研，双端通用的放前面，每个分类一张，避免同类扎堆。
 * 文档改名或删除时会自动跳过，空位按「自研优先、双端优先、换分类」的规则从目录里补齐。
 */
const FEATURED_PATHS = [
  "/components/button/reborn-button",
  "/components/navigation/reborn-tabs",
  "/components/input-and-forms/reborn-date-picker",
  "/components/miscellaneous/reborn-toast",
  "/components/miscellaneous/reborn-qrcode",
  "/components/miscellaneous/reborn-text",
  "/components/navigation/reborn-affix",
  "/components/special-effects/reborn-depth-image",
  "/components/text-animations/reborn-typewriter",
];

/** 卡片数量：三列正好三行 */
const CARD_LIMIT = 9;

/** 分类 → 卡面色调；未列出的分类用中性色 */
const CATEGORY_TONES: Partial<Record<string, CardTone>> = {
  按钮: "neutral",
  通用: "neutral",
  设备模型: "neutral",
  布局: "blue",
  导航: "blue",
  表单与输入: "green",
  卡片: "green",
  数据展示: "violet",
  文字动画: "violet",
  反馈: "orange",
  特效: "orange",
};

/** 卡片底部的适用端文案 */
const PLATFORM_TEXT: Record<HomePlatform, string> = {
  web: "Web",
  uniapp: "UniApp",
  both: "双端通用",
};

const catalog = inject(HOME_CATALOG_KEY, computed(() => EMPTY_HOME_CATALOG));

/** 自研优先、双端优先的排序权重，越小越靠前 */
function featureRank(item: HomeComponent): number {
  return (item.series === "reborn" ? 0 : 2) + (item.platform === "both" ? 0 : 1);
}

/** 按 FEATURED_PATHS 取卡片，不足时从目录补齐：先补没出现过的分类，再按权重补满 */
function pickFeatured(all: HomeComponent[]): HomeComponent[] {
  const byPath = new Map(all.map(item => [item.path, item]));
  const picked = FEATURED_PATHS.map(path => byPath.get(path)).filter((item): item is HomeComponent => !!item);
  const rest = all
    .filter(item => !picked.includes(item))
    .sort((a, b) => featureRank(a) - featureRank(b) || a.path.localeCompare(b.path));
  const usedCategories = new Set(picked.map(item => item.category));
  for (const item of rest) {
    if (picked.length >= CARD_LIMIT) break;
    if (usedCategories.has(item.category)) continue;
    picked.push(item);
    usedCategories.add(item.category);
  }
  for (const item of rest) {
    if (picked.length >= CARD_LIMIT) break;
    if (!picked.includes(item)) picked.push(item);
  }
  return picked.slice(0, CARD_LIMIT);
}

const cards = computed(() =>
  pickFeatured(catalog.value.components).map(item => ({
    ...item,
    // 图标位沿用原卡片「无图标时用标题首字」的默认样式，这里取英文名首字母
    initial: Array.from(item.name || item.label || "R")[0] ?? "R",
    tone: CATEGORY_TONES[item.category] ?? "neutral",
    slug: item.path.split("/").pop() ?? "",
    platformText: PLATFORM_TEXT[item.platform],
  })),
);

const total = computed(() => catalog.value.total);
</script>

<template>
  <section id="showcase" class="event-section payathon-community-section" aria-labelledby="showcase-title">
    <div class="showcase-layout">
      <header class="event-section-head showcase-header">
        <div class="showcase-title">
          <p class="event-english-title">
            <PayathonWord text="SHOWCASE" :size="2" />
          </p>
          <h2 id="showcase-title">组件一览</h2>
        </div>
        <div class="showcase-actions">
          <NuxtLink class="payathon-button" to="/getting-started" data-astro-cid-dmurru2v="">
            马上开始
          </NuxtLink><NuxtLink class="showcase-more" to="/components">
            全部组件
          </NuxtLink>
        </div>
      </header>
      <div class="showcase-note-wrap">
        <p class="showcase-note">
          <span v-if="cards.length">从 {{ total }} 个组件里挑了 {{ cards.length }} 个，卡片内容取自组件文档；点击卡片<strong>进入文档</strong>，查看 API 与<strong>可交互示例</strong>。</span>
          <span v-else>组件目录暂时没有读到，可以直接打开<strong>全部组件</strong>浏览。</span>
        </p>
      </div>
      <div class="communityUi payathon-work-gallery" data-payathon-works>
        <div class="payathon-work-field">
          <div class="payathon-work-fringe payathon-work-fringe--top" aria-hidden="true">
            <span class="work-fringe-corner-left" /><span /><span /><span /><span class="work-fringe-corner-right" />
          </div>
          <div class="productGrid" data-work-grid>
            <div v-for="card in cards" :key="card.path" class="payathon-work-slot">
              <span class="payathon-work-skeleton" aria-hidden="true" />
              <NuxtLink
                class="payathon-work-card"
                :to="card.path"
                data-tone="gray"
                :data-category-tone="card.tone"
                :data-work-seed="card.path"
              >
                <h3 class="payathon-work-title" :title="card.title">
                  <span class="payathon-work-title-viewport"><span class="payathon-work-title-text">{{ card.title }}</span></span>
                </h3>
                <div class="payathon-work-media">
                  <div class="payathon-work-art">
                    <span class="productIcon isDefault" aria-hidden="true">{{ card.initial }}</span>
                  </div>
                </div>
                <div class="payathon-work-body">
                  <span class="payathon-work-track">{{ card.category }}</span>
                  <p>{{ card.description }}</p>
                  <div class="payathon-work-metrics">
                    <span class="payathon-work-metric" :aria-label="`适用端：${card.platformText}`" :title="`适用端：${card.platformText}`">
                      <svg
                        v-if="card.platform !== 'uniapp'"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      ><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                      <svg
                        v-if="card.platform !== 'web'"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      ><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></svg>
                      <span>{{ card.platformText }}</span>
                    </span>
                  </div>
                </div>
                <svg class="payathon-work-watermark" viewBox="0 0 1000 28" aria-hidden="true">
                  <text x="0" y="22">REBORN UI</text>
                  <text x="1000" y="22" text-anchor="end">{{ card.slug }}</text>
                </svg>
              </NuxtLink>
            </div>
            <!-- 两张占位卡：入场脚本按列数只保留补齐最后一行所需的数量 -->
            <template v-if="cards.length">
              <div class="payathon-work-slot is-placeholder" aria-hidden="true">
                <span class="payathon-work-skeleton" aria-hidden="true" />
              </div>
              <div class="payathon-work-slot is-placeholder" aria-hidden="true">
                <span class="payathon-work-skeleton" aria-hidden="true" />
              </div>
            </template>
          </div>
          <div class="payathon-work-fringe payathon-work-fringe--bottom" aria-hidden="true">
            <span class="work-fringe-corner-left" /><span /><span /><span /><span class="work-fringe-corner-right" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
/* 卡面色调：数值与原卡片五条赛道的配色一致，改按分类挂在 data-category-tone 上 */
#payathon-page .payathon-work-card[data-category-tone="neutral"] {
  --work-track-rgb: 212 213 208;
  --work-card-bg: #151514;
}
#payathon-page .payathon-work-card[data-category-tone="blue"] {
  --work-track-rgb: 128 183 255;
  --work-card-bg: #111419;
}
#payathon-page .payathon-work-card[data-category-tone="green"] {
  --work-track-rgb: 169 230 182;
  --work-card-bg: #121715;
}
#payathon-page .payathon-work-card[data-category-tone="violet"] {
  --work-track-rgb: 181 160 255;
  --work-card-bg: #151318;
}
#payathon-page .payathon-work-card[data-category-tone="orange"] {
  --work-track-rgb: 255 161 126;
  --work-card-bg: #191412;
}

/*
 * 原「立即报名」是 button，这里换成链接：去掉链接默认的下划线；
 * 区块里「.event-section a」会把链接染成强调色，实底按钮要压回原按钮的深色字
 */
#payathon-page .showcase-actions a {
  text-decoration: none;
}
#payathon-page .showcase-actions a.payathon-button {
  color: #10141b;
}

/* 双端通用时并排两个图标 */
#payathon-page .payathon-work-metric svg + svg {
  margin-left: -2px;
}
</style>
