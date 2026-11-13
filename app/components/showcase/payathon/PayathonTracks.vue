<script setup lang="ts">
import type { HomeComponent, HomePlatform } from "~/lib/payathon/home-catalog";
import type { ComponentSeries } from "~/utils/componentsCatalog";
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import PayathonWord from "~/components/showcase/payathon/PayathonWord.vue";
import { EMPTY_HOME_CATALOG, HOME_CATALOG_KEY } from "~/lib/payathon/home-catalog";
import { mountPrizeCounter } from "~/lib/payathon/page-effects";
import { mountRewardMedals } from "~/lib/payathon/reward-medals";
import { mountTrackAccordion } from "~/lib/payathon/track-accordion";
import { CATEGORY_ORDER } from "~/utils/componentsCatalog";

/**
 * 组件总量与分组：组件数滚动计数、两个系列与三种适用端的奖牌卡片（可拖拽的奖牌 + 刮开看数量），
 * 以及按场景分成五组的透视跑道与详情折叠。
 *
 * 版式取自页面模板（含 data-astro-cid-* 样式作用域属性），交互在挂载后由 app/lib/payathon 下的模块驱动；
 * 所有数字、分类与代表组件都从首页注入的组件目录实时算出，不写死。
 * data-track 只是配色键：在本组件的样式里映射到模板的五种车道色。
 */

const catalog = inject(HOME_CATALOG_KEY, computed(() => EMPTY_HOME_CATALOG));

/* ── 代表组件 ───────────────────────────────────────────────────── */

/** 挑代表组件时优先这些常用组件（按 slug），都不在时按路径顺序取 */
const PREFERRED_SLUGS = [
  "reborn-button",
  "reborn-input",
  "reborn-table",
  "reborn-dialog",
  "reborn-tabs",
  "reborn-select",
  "reborn-form",
  "reborn-layout",
  "reborn-image",
  "reborn-toast",
  "reborn-timeline",
  "reborn-pagination",
  "reborn-tabbar",
  "reborn-popup",
  "reborn-typewriter",
  "hyper-text",
  "meteors",
  "animated-list",
  "3d-card",
  "iphone-mockup",
  "shimmer-button",
  "dock",
];

function slugOf(item: HomeComponent): string {
  return item.path.split("/").pop() ?? "";
}

/** 从一组组件里挑出 count 个代表，返回英文名 */
function pickNames(items: HomeComponent[], count: number): string[] {
  const rank = (item: HomeComponent) => {
    const index = PREFERRED_SLUGS.indexOf(slugOf(item));
    return index < 0 ? PREFERRED_SLUGS.length : index;
  };
  return [...items]
    .sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))
    .slice(0, count)
    .map((item) => item.name || item.title);
}

/* ── 奖牌卡片：两个系列 + 三种适用端 ─────────────────────────────── */

interface MedalRow {
  /** 行标题：分类名或适用端 */
  label: string;
  /** 刮开后露出的数量 */
  count: number;
  /** 代表组件英文名 */
  sample: string;
  metal: "gold" | "silver" | "bronze";
  mark: string;
}

interface MedalCard {
  /** 配色键 */
  key: string;
  family: string;
  species: "shark" | "manta";
  /** 卡片左上角的小字 */
  small: string;
  /** 大标题两行 */
  words: [string, string];
  /** 读屏用的卡片名 */
  name: string;
  main: boolean;
  rows: MedalRow[];
}

const METALS = ["gold", "silver", "bronze"] as const;

/** 分类在 CATEGORY_ORDER 里的位置，数量相同时按它排序 */
function categoryRank(name: string): number {
  const index = CATEGORY_ORDER.indexOf(name);
  return index < 0 ? CATEGORY_ORDER.length : index;
}

/** 某个系列里组件最多的三个分类 */
function topCategories(series: ComponentSeries): MedalRow[] {
  const groups = new Map<string, HomeComponent[]>();
  for (const item of catalog.value.components) {
    if (item.series !== series) continue;
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || categoryRank(a[0]) - categoryRank(b[0]))
    .slice(0, 3)
    .map(([label, items], index) => ({
      label,
      count: items.length,
      sample: pickNames(items, 1)[0] ?? "",
      metal: METALS[index] ?? "bronze",
      mark: String(index + 1),
    }));
}

/** 某种适用端的统计行 */
function platformRow(platform: HomePlatform, label: string): MedalRow {
  const items = catalog.value.components.filter((item) => item.platform === platform);
  return { label, count: items.length, sample: pickNames(items, 1)[0] ?? "", metal: "gold", mark: "✦" };
}

const seriesCards = computed<MedalCard[]>(() => [
  {
    key: "series-reborn",
    family: "系列",
    species: "shark",
    small: "自研系列",
    words: ["Reborn", "自研组件"],
    name: "Reborn 自研组件",
    main: true,
    rows: topCategories("reborn"),
  },
  {
    key: "series-community",
    family: "系列",
    species: "shark",
    small: "社区移植",
    words: ["Ported", "社区移植"],
    name: "社区移植组件",
    main: true,
    rows: topCategories("community"),
  },
]);

const platformCards = computed<MedalCard[]>(() => [
  {
    key: "platform-both",
    family: "适用端",
    species: "manta",
    small: "双端通用",
    words: ["Web", "UniApp"],
    name: "双端通用",
    main: false,
    rows: [platformRow("both", "双端通用")],
  },
  {
    key: "platform-web",
    family: "适用端",
    species: "manta",
    small: "仅 Web",
    words: ["Web", "单端"],
    name: "仅 Web",
    main: false,
    rows: [platformRow("web", "仅 Web")],
  },
  {
    key: "platform-uniapp",
    family: "适用端",
    species: "manta",
    small: "仅 UniApp",
    words: ["UniApp", "单端"],
    name: "仅 UniApp",
    main: false,
    rows: [platformRow("uniapp", "仅 UniApp")],
  },
]);

/* ── 跑道：五组场景 ─────────────────────────────────────────────── */

interface GroupDefinition {
  key: string;
  title: string;
  categories: string[];
  description: string;
}

const GROUPS: GroupDefinition[] = [
  {
    key: "group-base",
    title: "基础与布局",
    categories: ["按钮", "通用", "布局"],
    description: "按钮、徽章、图片、遮罩与布局容器，搭页面骨架时最先用到的一组。",
  },
  {
    key: "group-nav",
    title: "导航与反馈",
    categories: ["导航", "反馈"],
    description: "标签页、分页、步骤条、锚点，以及对话框、抽屉、轻提示等反馈组件。",
  },
  {
    key: "group-form",
    title: "表单与输入",
    categories: ["表单与输入"],
    description: "输入框、选择器、日期时间、开关、评分与表单容器。",
  },
  {
    key: "group-data",
    title: "数据展示",
    categories: ["数据展示", "卡片", "设备模型"],
    description: "表格、树、时间线、头像、统计与各类卡片，承载列表和详情里的内容。",
  },
  {
    key: "group-motion",
    title: "动效与特效",
    categories: ["文字动画", "特效"],
    description: "文字动画与背景特效，大多移植自社区开源项目。",
  },
];

/** 车道在跑道上的初始几何（挂载后由跑道模块按视口重算） */
const LANE_STYLES = [
  "--lane-index: 0; --lane-left: 0%; --lane-top-left: 15%; --lane-top-right: 29%; --lane-right: 20%",
  "--lane-index: 1; --lane-left: 20%; --lane-top-left: 29%; --lane-top-right: 43%; --lane-right: 40%",
  "--lane-index: 2; --lane-left: 40%; --lane-top-left: 43%; --lane-top-right: 57%; --lane-right: 60%",
  "--lane-index: 3; --lane-left: 60%; --lane-top-left: 57%; --lane-top-right: 71%; --lane-right: 80%",
  "--lane-index: 4; --lane-left: 80%; --lane-top-left: 71%; --lane-top-right: 85%; --lane-right: 100%",
];

/** 车道梯形与中线虚线的初始路径（同上，挂载后重算） */
const LANE_PATHS = [
  "M0 460 L150 0 H290 L200 460",
  "M200 460 L290 0 H430 L400 460",
  "M400 460 L430 0 H570 L600 460",
  "M600 460 L570 0 H710 L800 460",
  "M800 460 L710 0 H850 L1000 460",
];
const LANE_DASHES = [
  "M215.2 18.400000000000002 L214.0624 22.7608 M211.40748672154047 32.93796756742827 L210.22437656219893 37.47322317823741 M205.86173692937624 54.19667510405778 L204.61207777252875 58.98703520530647 M199.38079182805168 79.04029799246855 L198.0533613299883 84.12878156837817 M192.2064991805128 106.5417531413676 L190.79297717067897 111.96025417906401 M184.46819168609818 136.20526520329025 L182.9618099863314 141.97972838572971 M176.24854047113115 167.7139281939972 L174.64352295678475 173.86649533232514 M167.60574183155086 200.8446563123883 L165.8970107335295 207.39479218813696 M158.58335984569317 235.43045392484285 L156.76636016384148 242.395619371941 M149.21543282425037 271.3408408403736 L147.28601801814136 278.736930930458",
  "M357.6 18.400000000000002 L357.0312 22.7608 M355.7037433607702 32.93796756742827 L355.11218828109946 37.47322317823741 M352.9308684646881 54.19667510405778 L352.3060388862644 58.98703520530647 M349.6903959140258 79.04029799246855 L349.02668066499416 84.12878156837817 M346.1032495902564 106.5417531413676 L345.39648858533945 111.96025417906401 M342.2340958430491 136.20526520329025 L341.48090499316567 141.97972838572971 M338.1242702355656 167.7139281939972 L337.3217614783924 173.86649533232514 M333.80287091577543 200.8446563123883 L332.9485053667647 207.39479218813696 M329.2916799228466 235.43045392484285 L328.3831800819207 242.395619371941 M324.60771641212517 271.3408408403736 L323.6430090090707 278.736930930458",
  "M500 18.400000000000002 L500 22.7608 M500 32.93796756742827 L500 37.47322317823741 M500 54.19667510405778 L500 58.98703520530647 M500 79.04029799246855 L500 84.12878156837817 M500 106.5417531413676 L500 111.96025417906401 M500 136.20526520329025 L500 141.97972838572971 M500 167.7139281939972 L500 173.86649533232514 M500 200.8446563123883 L500 207.39479218813696 M500 235.43045392484285 L500 242.395619371941 M500 271.3408408403736 L500 278.736930930458",
  "M642.4 18.400000000000002 L642.9688 22.7608 M644.2962566392298 32.93796756742827 L644.8878117189005 37.47322317823741 M647.0691315353118 54.19667510405778 L647.6939611137357 58.98703520530647 M650.3096040859741 79.04029799246855 L650.9733193350058 84.12878156837817 M653.8967504097436 106.5417531413676 L654.6035114146605 111.96025417906401 M657.7659041569509 136.20526520329025 L658.5190950068343 141.97972838572971 M661.8757297644344 167.7139281939972 L662.6782385216077 173.86649533232514 M666.1971290842246 200.8446563123883 L667.0514946332353 207.39479218813696 M670.7083200771534 235.43045392484285 L671.6168199180793 242.395619371941 M675.3922835878748 271.3408408403736 L676.3569909909293 278.736930930458",
  "M784.8 18.400000000000002 L785.9376 22.7608 M788.5925132784596 32.93796756742827 L789.7756234378011 37.47322317823741 M794.1382630706238 54.19667510405778 L795.3879222274712 58.98703520530647 M800.6192081719483 79.04029799246855 L801.9466386700117 84.12878156837817 M807.7935008194872 106.5417531413676 L809.2070228293211 111.96025417906401 M815.5318083139018 136.20526520329025 L817.0381900136687 141.97972838572971 M823.7514595288688 167.7139281939972 L825.3564770432152 173.86649533232514 M832.3942581684491 200.8446563123883 L834.1029892664706 207.39479218813696 M841.4166401543068 235.43045392484285 L843.2336398361585 242.395619371941 M850.7845671757497 271.3408408403736 L852.7139819818586 278.736930930458",
];

interface RunwayGroup extends GroupDefinition {
  count: number;
  /** 实际有组件的分类 */
  presentCategories: string[];
  /** 适用端标签，如「双端 15」 */
  platforms: string[];
  samples: string[];
}

const PLATFORM_LABELS: Array<[HomePlatform, string]> = [
  ["both", "双端"],
  ["web", "仅 Web"],
  ["uniapp", "仅 UniApp"],
];

const runwayGroups = computed<RunwayGroup[]>(() =>
  GROUPS.map((group) => {
    const items = catalog.value.components.filter((item) => group.categories.includes(item.category));
    const counts: Record<HomePlatform, number> = { both: 0, web: 0, uniapp: 0 };
    for (const item of items) counts[item.platform] += 1;
    return {
      ...group,
      count: items.length,
      presentCategories: group.categories.filter((name) => items.some((item) => item.category === name)),
      platforms: PLATFORM_LABELS.filter(([key]) => counts[key] > 0).map(([key, label]) => `${label} ${counts[key]}`),
      samples: pickNames(items, 3),
    };
  }),
);

/* ── 顶部计数 ───────────────────────────────────────────────────── */

const total = computed(() => catalog.value.total);
const totalLabel = computed(() => new Intl.NumberFormat("en-US").format(total.value));

/* ── 交互挂载 ───────────────────────────────────────────────────── */

const rootRef = useTemplateRef<HTMLElement>("root");
const cleanups: Array<() => void> = [];

onMounted(() => {
  const root = rootRef.value;
  if (!root) return;
  const awards = root.querySelector<HTMLElement>("#awards");
  const runway = root.querySelector<HTMLElement>(".track-runway[data-track-accordion]");
  cleanups.push(mountPrizeCounter(root));
  if (awards) cleanups.push(mountRewardMedals(awards));
  if (runway) cleanups.push(mountTrackAccordion(runway));
});

onBeforeUnmount(() => {
  cleanups.splice(0).reverse().forEach((fn) => fn());
});

/** 配色键 → 车道色 */
const TRACK_COLORS: Record<string, string> = {
  "series-reborn": "[--track-color:var(--payathon-track-vibe)]!",
  "group-base": "[--track-color:var(--payathon-track-vibe)]!",
  "series-community": "[--track-color:var(--payathon-track-skill)]!",
  "group-nav": "[--track-color:var(--payathon-track-skill)]!",
  "platform-both": "[--track-color:var(--payathon-track-machine)]!",
  "group-form": "[--track-color:var(--payathon-track-machine)]!",
  "platform-web": "[--track-color:var(--payathon-track-token)]!",
  "group-data": "[--track-color:var(--payathon-track-token)]!",
  "platform-uniapp": "[--track-color:var(--payathon-track-agent)]!",
  "group-motion": "[--track-color:var(--payathon-track-agent)]!",
};

/** 光晕相位错开 */
const GLOW_PHASES: Record<string, string> = {
  "series-reborn": "[--glow-phase:0s]!",
  "series-community": "[--glow-phase:-4.8s]!",
  "platform-both": "[--glow-phase:-3.6s]!",
  "platform-web": "[--glow-phase:-2.4s]!",
  "platform-uniapp": "[--glow-phase:-1.2s]!",
};
</script>

<template>
  <section id="tracks" ref="root" class="event-section" aria-labelledby="tracks-title" data-astro-cid-45h6wvi2="">
    <section id="awards" aria-labelledby="awards-title" data-astro-cid-45h6wvi2="">
      <div class="rewards-layout" data-astro-cid-45h6wvi2="">
        <div data-astro-cid-45h6wvi2="">
          <header class="event-section-head" data-astro-cid-45h6wvi2="">
            <p class="event-english-title" data-astro-cid-45h6wvi2="">
              <PayathonWord text="COMPONENTS" :size="3" />
            </p>
            <h2 id="awards-title" data-astro-cid-45h6wvi2="">组件按需取用，源码归你</h2>
            <p class="reward-total" data-astro-cid-45h6wvi2="">
              <strong
                class="prize-counter"
                :aria-label="`${totalLabel} 个组件`"
                :data-prize-label="totalLabel"
                data-astro-cid-45h6wvi2=""
              ><span :data-prize-count="total" data-prize-prefix="" aria-hidden="true" data-astro-cid-45h6wvi2="">{{ totalLabel }}</span></strong>
              <span data-astro-cid-45h6wvi2="">个组件</span>
            </p>
            <p data-astro-cid-45h6wvi2="">
              覆盖 {{ catalog.categories.length }} 个分类，其中 {{ catalog.platforms.both }} 个 Web 与 UniApp 双端通用。
            </p>
          </header>
        </div>
        <div class="reward-details" data-astro-cid-45h6wvi2="">
          <section class="reward-medals" aria-label="按系列与适用端统计的组件数量">
            <article class="reward-summary">
              <div class="reward-summary-copy">
                <h3>
                  两个系列<span class="reward-summary-bars" aria-hidden="true">
                    <span class="reward-summary-bar" :class="TRACK_COLORS['series-reborn']" data-track="series-reborn" style="--bar-delay: 0s" /><span class="reward-summary-bar" :class="TRACK_COLORS['series-community']" data-track="series-community" style="--bar-delay: -0.7s" />
                  </span>
                </h3>
                <p>自研组件按 Web 与 UniApp 同名同构设计；社区移植以动效与展示为主</p>
              </div>
            </article>
            <div
              v-for="card in seriesCards"
              :key="card.key"
              class="reward-medal-track reward-medal-track--main"
              :class="[TRACK_COLORS[card.key], GLOW_PHASES[card.key]]"
              :data-track="card.key"
              :data-reward-family="card.family"
              :data-reward-species="card.species"
            >
              <span class="reward-medal-glow" aria-hidden="true" />
              <header class="reward-medal-heading">
                <small>{{ card.small }}</small>
                <h3 :aria-label="card.name"><span>{{ card.words[0] }}</span><span>{{ card.words[1] }}</span></h3>
              </header>
              <div class="reward-medal-list">
                <div
                  v-for="row in card.rows"
                  :key="row.label"
                  class="reward-medal-item"
                  role="group"
                  :aria-label="`${card.name}，${row.label}，${row.count} 个组件，代表组件 ${row.sample}`"
                >
                  <div class="reward-medal-visual">
                    <button
                      type="button"
                      class="reward-medal-stage"
                      :data-medal-metal="row.metal"
                      :data-medal-mark="row.mark"
                      :aria-label="`拖动${card.name}${row.label}奖牌；方向键摆动，Escape 复位`"
                    />
                  </div>
                </div>
              </div>
              <div class="reward-medal-prizes" data-reward-scratch>
                <template v-for="(row, index) in card.rows" :key="row.label">
                  <span v-if="index > 0" class="reward-medal-separator" aria-hidden="true" />
                  <div class="reward-medal-prize">
                    <p class="reward-medal-name">{{ row.label }} <span class="reward-medal-count">{{ row.sample }} 等</span></p>
                    <p class="reward-medal-amount"><strong>{{ row.count }} 个</strong></p>
                  </div>
                </template>
              </div>
            </div>
            <article class="reward-summary">
              <div class="reward-summary-copy">
                <h3>
                  三种适用端<span class="reward-summary-bars" aria-hidden="true">
                    <span class="reward-summary-bar" :class="TRACK_COLORS['platform-both']" data-track="platform-both" style="--bar-delay: 0s" /><span class="reward-summary-bar" :class="TRACK_COLORS['platform-web']" data-track="platform-web" style="--bar-delay: -0.7s" /><span class="reward-summary-bar" :class="TRACK_COLORS['platform-uniapp']" data-track="platform-uniapp" style="--bar-delay: -1.4s" />
                  </span>
                </h3>
                <p>每个组件页都标明适用端，文档顶栏的平台开关按它筛选组件列表。</p>
              </div>
            </article>
            <div
              v-for="card in platformCards"
              :key="card.key"
              class="reward-medal-track"
              :class="[TRACK_COLORS[card.key], GLOW_PHASES[card.key]]"
              :data-track="card.key"
              :data-reward-family="card.family"
              :data-reward-species="card.species"
            >
              <span class="reward-medal-glow" aria-hidden="true" />
              <header class="reward-medal-heading">
                <small>{{ card.small }}</small>
                <h3 :aria-label="card.name"><span>{{ card.words[0] }}</span><span>{{ card.words[1] }}</span></h3>
              </header>
              <div class="reward-medal-list">
                <div
                  v-for="row in card.rows"
                  :key="row.label"
                  class="reward-medal-item"
                  role="group"
                  :aria-label="`${row.label}，${row.count} 个组件，代表组件 ${row.sample}`"
                >
                  <div class="reward-medal-visual">
                    <button
                      type="button"
                      class="reward-medal-stage"
                      :data-medal-metal="row.metal"
                      :data-medal-mark="row.mark"
                      :aria-label="`拖动${row.label}奖牌；方向键摆动，Escape 复位`"
                    />
                  </div>
                  <div class="reward-medal-prize" data-reward-scratch>
                    <p class="reward-medal-name">{{ row.label }} <span class="reward-medal-count">{{ row.sample }} 等</span></p>
                    <p class="reward-medal-amount"><strong>{{ row.count }} 个</strong></p>
                  </div>
                </div>
              </div>
            </div>
            <dialog
              class="reward-medal-egg"
              data-medal-egg
              aria-labelledby="medal-egg-title"
              aria-describedby="medal-egg-description"
            >
              <div class="reward-medal-egg-content">
                <div class="reward-medal-egg-stage" data-medal-egg-stage aria-hidden="true" />
                <h2 id="medal-egg-title" tabindex="-1" autofocus>奖牌拿不走</h2>
                <p id="medal-egg-description">组件可以：源码按 MIT 协议开源，用 CLI 装进你的项目。</p>
                <div class="reward-medal-egg-actions">
                  <!-- 去掉链接下划线 -->
                  <NuxtLink class="payathon-button no-underline!" to="/getting-started" data-medal-egg-start data-astro-cid-dmurru2v="">
                    <span>马上开始</span>
                  </NuxtLink>
                  <button type="button" class="reward-medal-egg-close" data-medal-egg-close>好吧，放回去</button>
                </div>
              </div>
            </dialog>
          </section>
          <div class="reward-notes" data-astro-cid-45h6wvi2="">
            <p data-astro-cid-45h6wvi2="">*数量按文档站的组件页实时统计，组件增减后这里随之更新</p>
            <p data-astro-cid-45h6wvi2="">
              *双端通用指 Web 与 UniApp 各有一份同名组件，API 尽量对齐，差异写在组件文档的「两端差异对照」一节
            </p>
            <p data-astro-cid-45h6wvi2="">*社区移植组件来自 Magic UI、Aceternity UI 等开源项目，来源见各组件页的 credits</p>
            <p data-astro-cid-45h6wvi2="">*每个组件都能单独安装：npx reborn-ui@latest add &lt;组件名&gt;</p>
          </div>
        </div>
      </div>
    </section>
    <div class="event-subsection" data-astro-cid-45h6wvi2="">
      <header id="choose-track" class="event-section-head" data-astro-cid-45h6wvi2="">
        <p class="event-english-title" data-astro-cid-45h6wvi2="">
          <PayathonWord text="FIND YOUR COMPONENT" :size="2" />
        </p>
        <h2 id="tracks-title" data-astro-cid-45h6wvi2="">按场景找组件</h2>
        <p data-astro-cid-45h6wvi2="">{{ catalog.categories.length }} 个分类归成五组，点开查看适用端与代表组件</p>
        <output
          class="runway-score"
          data-rhythm-score
          aria-live="polite"
          aria-atomic="true"
          hidden
          data-astro-cid-45h6wvi2=""
        >score: 0</output>
      </header>
      <div class="track-runway-wrap">
        <div class="track-runway" data-track-accordion data-active="0">
          <div class="runway-surface" aria-hidden="true">
            <svg viewBox="0 0 1000 460" preserveAspectRatio="none">
              <g
                v-for="(group, index) in runwayGroups"
                :key="group.key"
                :class="TRACK_COLORS[group.key]"
                :data-track="group.key"
                :data-lane="index"
                :data-track-group="index < 2 ? 'main' : 'special'"
              >
                <path class="runway-lane" :d="LANE_PATHS[index]" />
                <path class="runway-dashes" :d="LANE_DASHES[index]" />
              </g>
            </svg>
          </div>
          <article
            v-for="(group, index) in runwayGroups"
            :key="group.key"
            class="track-panel"
            :class="TRACK_COLORS[group.key]"
            :data-track="group.key"
            :data-track-group="index < 2 ? 'main' : 'special'"
            :style="LANE_STYLES[index]"
            :data-expanded="index === 0 ? 'true' : 'false'"
          >
            <h3 class="track-panel-heading">
              <button
                :id="`track-toggle-${index}`"
                type="button"
                class="track-toggle"
                :aria-expanded="index === 0 ? 'true' : 'false'"
                :aria-controls="`track-detail-${index}`"
              >
                <span>{{ group.title }}</span><span class="track-toggle-hint">{{ group.count }} 个</span><span class="track-toggle-mark" aria-hidden="true">{{ index === 0 ? "−" : "+" }}</span><span class="runway-scan" aria-hidden="true" />
              </button>
            </h3>
            <div
              :id="`track-detail-${index}`"
              class="track-detail"
              role="region"
              :aria-labelledby="`track-toggle-${index}`"
              :aria-hidden="index === 0 ? 'false' : 'true'"
              :inert="index !== 0 || undefined"
            >
              <div class="track-detail-content">
                <header class="track-detail-head">
                  <h4 class="track-detail-title">{{ group.title }}</h4>
                  <p>{{ group.description }}</p>
                </header>
                <p class="track-group-description">包含分类：{{ group.presentCategories.join(" · ") }}</p>
                <div class="track-actions">
                  <NuxtLink class="track-entry" data-arrow-marquee to="/components">
                    <span>浏览组件</span><span class="arrow-window" aria-hidden="true">
                      <span class="arrow-strip">
                        <svg
                          v-for="copy in 2"
                          :key="copy"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-arrow-right"
                          focusable="false"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    </span>
                  </NuxtLink>
                  <NuxtLink class="track-product-link" data-arrow-marquee to="/getting-started/installation">
                    <span>安装指南</span><span class="arrow-window" aria-hidden="true">
                      <span class="arrow-strip">
                        <svg
                          v-for="copy in 2"
                          :key="copy"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class="lucide lucide-arrow-right"
                          focusable="false"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    </span>
                  </NuxtLink>
                </div>
              </div>
              <dl class="track-road-sign track-road-sign--left">
                <dt>适用端</dt>
                <dd>
                  <span v-for="label in group.platforms" :key="label" class="track-delivery-option">{{ label }}</span>
                </dd>
              </dl>
              <dl class="track-road-sign track-road-sign--right">
                <dt>代表组件</dt>
                <dd>
                  <span v-for="name in group.samples" :key="name" class="track-delivery-option">{{ name }}</span>
                </dd>
              </dl>
            </div>
          </article>
        </div>
        <div
          class="runway-rhythm"
          data-runway-rhythm
          role="group"
          aria-label="节拍小游戏：节拍块到达按键时按数字 1 至 5，也可以点击按键"
        >
          <canvas class="runway-beats" aria-hidden="true" />
          <button
            v-for="(group, index) in runwayGroups"
            :key="group.key"
            type="button"
            class="runway-key"
            :class="TRACK_COLORS[group.key]"
            :data-rhythm-key="index"
            :data-track="group.key"
            :aria-label="`按键 ${index + 1}，${group.title}`"
          >
            <kbd>{{ index + 1 }}</kbd><span class="runway-judgement" aria-hidden="true"><span data-grade="perfect" hidden><PayathonWord text="PERFECT" :size="3" /> </span><span data-grade="good" hidden><PayathonWord text="GOOD" :size="3" /> </span></span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

