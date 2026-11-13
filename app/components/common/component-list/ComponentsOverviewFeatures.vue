<script setup lang="ts">
/**
 * 组件总览次屏的三张特性卡片：一侧是放着真实组件的示例窗口，一侧是文案
 * 配色由主色推导，变量定义在 ComponentsList
 */
import type { ThemeColorName } from "~/utils/themeColor";
import HyperText from "~/components/reborn/ui/hyper-text/HyperText.vue";
import NumberTicker from "~/components/reborn/ui/number-ticker/NumberTicker.vue";
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornProgress from "~/components/reborn/ui/reborn-progress/RebornProgress.vue";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import ShimmerButton from "~/components/reborn/ui/shimmer-button/ShimmerButton.vue";
import { vFlyIn } from "~/lib/flyIn";
import { onceNearViewport } from "~/lib/nearViewport";
import { themeColors } from "~/utils/themeColor";

interface Props {
  /** 双端通用组件数 */
  bothCount: number | string;
  /** 社区移植组件数 */
  communityCount: number;
}

defineProps<Props>();

interface Feature {
  id: "dual" | "theme" | "community";
  /** 插画面配色 */
  tone: "soft" | "dark" | "dawn";
  /** 插画面放右侧 */
  flip?: boolean;
  label: string;
  title: string;
  description: string;
  /** 文案下方的等宽标签：对应的 frontmatter 字段或样式变量 */
  meta: string;
}

const FEATURES: Feature[] = [
  {
    id: "dual",
    tone: "soft",
    label: "双端同构",
    title: "同一个组件名，Web 和 UniApp 都能用",
    description: "Reborn 自研组件在两端同名同构，Props 与事件尽量保持一致。把下方目录的平台开关切到 UniApp，总览只列出该端可用的组件。",
    meta: "platform: both",
  },
  {
    id: "theme",
    tone: "dark",
    flip: true,
    label: "主题令牌",
    title: "改一个主色，组件跟着一起换",
    description: "按钮、徽标、进度条取的是同一条主色色阶。点示例窗口里的色块只改这一小块；顶栏「工具」里的主题色作用于全站。",
    meta: "--color-primary",
  },
  {
    id: "community",
    tone: "dawn",
    label: "社区移植",
    title: "动效与展示组件，出处逐个写明",
    description: "移植自 Magic UI、Aceternity UI 等开源项目的动效与展示组件，统一接到本库的主题变量上，来源见各组件页的 credits。",
    meta: "series: community",
  },
];

/* ── 双端同构：表单示例的状态 ───────────────────────────────────── */

const email = shallowRef("hello@reborn-ui.com");
const remember = shallowRef(true);
const notify = shallowRef(true);
const volume = shallowRef(60);

/* ── 主题令牌：只作用于示例窗口的主色 ───────────────────────────── */

const siteColor = useThemeColor();
/** 示例窗口的主色，未选时跟随全站 */
const previewColor = shallowRef<ThemeColorName | null>(null);
const activeColor = computed(
  () => themeColors.find((color) => color.name === (previewColor.value ?? siteColor.value)) ?? themeColors[0]!,
);
const progress = shallowRef(64);

/* ── 社区移植：接近视口再挂载 ───────────────────────────────────── */

/** 社区示例接近视口才挂载，动画在可见时播放 */
const communityRef = useTemplateRef<HTMLElement | HTMLElement[]>("community");
const communityReady = shallowRef(false);
let stopWatching: (() => void) | undefined;

onMounted(() => {
  // ref 在 v-for 里，取到的是数组
  const target = communityRef.value;
  const element = Array.isArray(target) ? target[0] : target;
  if (!element) return;
  stopWatching = onceNearViewport(element, () => (communityReady.value = true));
});

onBeforeUnmount(() => stopWatching?.());

/* ── 样式类 ─────────────────────────────────────────────────────────── */

/*
 * 较长的渐变定义成 ComponentsList 上的 --ov-art-* / --ov-glow-* 变量。
 * 断点写成 max-[N+1]，与原 max-width: N 等价。
 */

/** 三种配色；线条浓度各给一份，不写默认值，避免同名任意属性类互相覆盖 */
const ART_LIGHT = "[--fx-line:var(--ov-fx-line)] [--fx-mark:var(--ov-fx-mark)] [--fx-sheet:var(--ov-fx-sheet)]";
const FRAG_SHADOW_LIGHT = "shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gray-10)_6%,transparent),0_2px_4px_color-mix(in_srgb,var(--ov-shade)_6%,transparent),0_34px_60px_-26px_color-mix(in_srgb,var(--ov-shade)_50%,transparent)]";
const TONES: Record<Feature["tone"], { art: string; bg: string; glow: string; frag: string }> = {
  soft: { art: ART_LIGHT, bg: "bg-(image:--ov-art-soft) after:opacity-12", glow: "bg-(image:--ov-glow-light)", frag: FRAG_SHADOW_LIGHT },
  dawn: { art: ART_LIGHT, bg: "bg-(image:--ov-art-dawn) after:opacity-12", glow: "bg-(image:--ov-glow-light)", frag: FRAG_SHADOW_LIGHT },
  dark: {
    art: "[--fx-line:rgb(255_255_255/0.14)] [--fx-mark:color-mix(in_oklab,var(--ov-hot)_80%,transparent)] [--fx-sheet:0.16]",
    bg: "bg-(image:--ov-art-dark) after:opacity-20",
    glow: "bg-(image:--ov-glow-dark)",
    frag: "shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_2px_6px_rgb(0_0_0/0.2),0_40px_70px_-28px_rgb(0_0_0/0.7)]",
  },
};

/** 同心圆 */
const RING_CLASS = "top-1/2 left-1/2 rounded-full shadow-[inset_0_0_0_1px_var(--fx-line)]";

/** 四条边线 */
const LINES = [
  "top-(--fx-y) right-0 left-0 h-px",
  "bottom-(--fx-y) right-0 left-0 h-px",
  "top-0 bottom-0 left-(--fx-x) w-px",
  "top-0 right-(--fx-x) bottom-0 w-px",
];

/** 十字准星 */
const MARK_CLASS = "-mt-1.5 -ml-1.5 size-[13px] before:absolute before:top-0 before:left-1.5 before:h-[13px] before:w-px before:bg-(--fx-mark) before:content-[''] after:absolute after:top-1.5 after:left-0 after:h-px after:w-[13px] after:bg-(--fx-mark) after:content-['']";
const MARKS = [
  "top-(--fx-y) left-(--fx-x)",
  "top-(--fx-y) left-[calc(100%_-_var(--fx-x)_-_1px)]",
  "top-[calc(100%_-_var(--fx-y)_-_1px)] left-(--fx-x)",
  "top-[calc(100%_-_var(--fx-y)_-_1px)] left-[calc(100%_-_var(--fx-x)_-_1px)]",
];

/** 窗口身后的纸片 */
const SHEET_CLASS = "absolute inset-0 block rounded-2xl bg-gray-1 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gray-10)_4%,transparent)]";

/** 示例窗口 */
const FRAG_CLASS = "relative z-1 overflow-hidden rounded-2xl bg-gray-1 text-[13.5px] tracking-[-0.005em] text-(--ov-text)";
/** 窗口标题栏与底栏 */
const FRAG_BAR = "flex h-[38px] items-center justify-between gap-2.5 border-b border-(--ov-hair) px-3.5 text-[12px] text-(--ov-text-3) [&_code]:rounded-[5px] [&_code]:bg-(--ov-sunk) [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-(family-name:--ov-mono) [&_code]:text-[11.5px] [&_code]:text-(--ov-text-2)";
const FRAG_FOOT = "flex h-10 items-center justify-between gap-2.5 border-t border-(--ov-hair) bg-[color-mix(in_oklab,var(--color-gray-10)_2.5%,var(--color-gray-1))] px-3.5 text-[12px] text-(--ov-text-2)";
const FRAG_OK = "inline-flex items-center gap-1.5 font-semibold text-success-active";
</script>

<template>
  <div class="grid gap-7 max-[821px]:gap-5">
    <!-- 特性卡片：入场与悬停的过渡合在一条 transition 里 -->
    <article
      v-for="feature in FEATURES" :key="feature.id" v-fly-in
      class="ov-feature fly-in grid min-h-[468px] rounded-[28px] bg-(--ov-surface) p-1.5 shadow-(--ov-shadow-card)
        pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-(--ov-shadow-lift)
        motion-safe:[&.is-flown]:[transition:opacity_0.9s_var(--ov-ease-expo)_var(--fly-delay,0ms),transform_0.9s_var(--ov-ease-expo)_var(--fly-delay,0ms),translate_0.32s_var(--ov-ease-quart),box-shadow_0.32s_var(--ov-ease-quart)]
        motion-reduce:hover:translate-none max-[821px]:min-h-0 max-[821px]:grid-cols-1 max-[821px]:rounded-3xl"
      :class="feature.flip ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.14fr)]' : 'grid-cols-[minmax(0,1.14fr)_minmax(0,1fr)]'"
    >
      <!-- 插画面 -->
      <div
        class="relative isolate grid place-items-center overflow-hidden rounded-[22px] px-11 py-16
          [--fx-x:30px] [--fx-y:26px]
          max-[961px]:px-8 max-[961px]:py-14
          max-[821px]:rounded-[19px] max-[821px]:px-7 max-[821px]:pt-12 max-[821px]:pb-[60px] max-[821px]:[--fx-x:16px] max-[821px]:[--fx-y:16px]
          max-[481px]:px-3.5 max-[481px]:pt-10 max-[481px]:pb-[52px] max-[481px]:[--fx-x:10px] max-[481px]:[--fx-y:12px]"
        :class="[TONES[feature.tone].art, { 'order-2 max-[821px]:order-0': feature.flip }]"
      >
        <!-- 装饰层 -->
        <div class="pointer-events-none absolute inset-0 z-0 *:absolute *:block" aria-hidden="true">
          <div
            class="inset-0 after:absolute after:inset-0 after:bg-(image:--ov-grain) after:mix-blend-overlay after:content-['']"
            :class="TONES[feature.tone].bg"
          />
          <div
            class="top-1/2 left-1/2 -mt-[310px] -ml-[310px] size-[620px] rounded-full max-[481px]:-mt-[220px] max-[481px]:-ml-[220px] max-[481px]:size-[440px]"
            :class="TONES[feature.tone].glow"
          />
          <i :class="RING_CLASS" class="-mt-[105px] -ml-[105px] size-[210px] max-[481px]:-mt-[85px] max-[481px]:-ml-[85px] max-[481px]:size-[170px]" />
          <i :class="RING_CLASS" class="-mt-[186px] -ml-[186px] size-[372px] max-[481px]:-mt-[150px] max-[481px]:-ml-[150px] max-[481px]:size-[300px]" />
          <i v-for="line in LINES" :key="line" class="bg-(--fx-line)" :class="line" />
          <i v-for="mark in MARKS" :key="mark" :class="[MARK_CLASS, mark]" />
        </div>

        <div class="relative z-1 w-full max-w-[396px]">
          <!-- 身后纸片 -->
          <i :class="SHEET_CLASS" class="translate-y-7 scale-[0.88] opacity-[calc(var(--fx-sheet)*0.5)]" aria-hidden="true" />
          <i :class="SHEET_CLASS" class="translate-y-3.5 scale-[0.94] opacity-(--fx-sheet)" aria-hidden="true" />

          <!-- 双端同构：五个组件都是 platform: both -->
          <div v-if="feature.id === 'dual'" class="ov-frag" :class="[FRAG_CLASS, TONES[feature.tone].frag]">
            <div :class="FRAG_BAR">
              <span>登录表单</span>
              <span class="flex items-center gap-1.5"><code>Web</code><code>UniApp</code></span>
            </div>
            <div class="flex flex-col gap-4 p-4">
              <RebornInput v-model="email" variant="outlined" clearable prefix-icon="lucide:mail" aria-label="邮箱" />
              <div class="flex items-center justify-between gap-3">
                <RebornCheckbox v-model="remember" label="记住我" />
                <label class="flex items-center gap-2 text-gray-8">
                  消息提醒
                  <RebornSwitch v-model="notify" aria-label="消息提醒" />
                </label>
              </div>
              <div class="flex items-center gap-3">
                <span class="shrink-0 text-gray-8">音量</span>
                <RebornSlider v-model="volume" class="min-w-0 flex-1" aria-label="音量" />
                <span class="w-7 shrink-0 text-right tabular-nums text-gray-8">{{ volume }}</span>
              </div>
              <RebornButton color="primary" class="w-full">
                登录
              </RebornButton>
            </div>
            <div :class="FRAG_FOOT">
              <span :class="FRAG_OK"><Icon name="lucide:check" class="size-3.5" />5 个组件均为双端通用</span>
              <span>共 {{ bothCount }} 个双端组件</span>
            </div>
          </div>

          <!-- 主题令牌：窗口自己挂 data-theme-color，主题预设只在这棵子树里生效 -->
          <div
            v-else-if="feature.id === 'theme'" class="ov-frag" :class="[FRAG_CLASS, TONES[feature.tone].frag]"
            :data-theme-color="activeColor.preset"
          >
            <div :class="FRAG_BAR">
              <span>主题预览</span>
              <span class="flex items-center gap-2" role="group" aria-label="示例窗口的主色">
                <!-- 示例窗口的主色色块 -->
                <button
                  v-for="color in themeColors" :key="color.name" type="button" :data-theme-color="color.preset"
                  class="ov-frag-swatch size-3.5 cursor-pointer rounded-[999px] bg-primary transition-transform duration-200 ease-(--ov-ease)
                    hover:scale-[1.15] aria-pressed:shadow-[0_0_0_2px_var(--color-gray-1),0_0_0_3.5px_var(--color-gray-9)]
                    focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
                  :title="color.label" :aria-label="`示例改为${color.label}`"
                  :aria-pressed="activeColor.name === color.name" @click="previewColor = color.name"
                />
              </span>
            </div>
            <div class="flex flex-col gap-4 p-4">
              <div class="flex flex-wrap items-center gap-2">
                <RebornButton color="primary">
                  主要按钮
                </RebornButton>
                <RebornButton color="primary" variant="soft">
                  柔和
                </RebornButton>
                <RebornButton color="primary" variant="outlined">
                  描边
                </RebornButton>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <RebornBadge label="filled" color="primary" variant="filled" />
                <RebornBadge label="soft" color="primary" variant="soft" />
                <RebornBadge label="outlined" color="primary" variant="outlined" />
                <RebornBadge label="subtle" color="primary" variant="subtle" />
              </div>
              <RebornProgress :percent="progress" aria-label="示例进度" />
              <RebornSlider v-model="progress" aria-label="调整示例进度" />
            </div>
            <div :class="FRAG_FOOT">
              <span :class="FRAG_OK"><Icon name="lucide:check" class="size-3.5" />只改这一块的主色</span>
              <span>{{ activeColor.label }}</span>
            </div>
          </div>

          <!-- 社区移植：乱码还原、数字滚动、微光按钮 -->
          <div v-else ref="community" class="ov-frag" :class="[FRAG_CLASS, TONES[feature.tone].frag]">
            <div :class="FRAG_BAR">
              <span>社区移植</span>
              <code>credits</code>
            </div>
            <!-- 定高，挂载前后不跳动 -->
            <div class="flex h-[236px] flex-col items-center justify-center gap-3 p-4">
              <ClientOnly>
                <template v-if="communityReady">
                  <HyperText text="Reborn UI" class="text-2xl font-bold text-gray-10" :duration="900" animate-on-load />
                  <div class="flex items-baseline gap-2">
                    <!-- 组件自带 dark:text-white，需加 ! -->
                    <NumberTicker
                      v-if="communityCount" :value="communityCount" :decimal-places="0"
                      class="text-5xl font-semibold tabular-nums text-primary!"
                    />
                    <span class="text-gray-8">个社区移植组件</span>
                  </div>
                  <ShimmerButton shimmer-size="2px" class="mt-1">
                    <span class="text-sm font-medium tracking-tight text-white">Shimmer Button</span>
                  </ShimmerButton>
                </template>
              </ClientOnly>
            </div>
            <div :class="FRAG_FOOT">
              <span>Magic UI · Aceternity UI</span>
              <span>来源见各组件页</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 文案 -->
      <div
        class="flex flex-col justify-center py-12 max-[961px]:px-9 max-[961px]:py-10 max-[821px]:px-[22px] max-[821px]:pt-[26px] max-[821px]:pb-7"
        :class="feature.flip ? 'pr-12 pl-[52px]' : 'pr-[52px] pl-12'"
      >
        <span class="mb-3 block text-[14.5px] font-semibold tracking-[-0.01em] text-(--ov-label)">{{ feature.label }}</span>
        <h3 class="max-w-[12em] text-[clamp(24px,2.5vw,30px)] leading-[1.28] font-semibold tracking-[-0.02em] text-balance text-(--ov-text)">
          {{ feature.title }}
        </h3>
        <p class="mt-3.5 max-w-[26em] text-[16px] leading-[1.72] text-pretty text-(--ov-text-2)">
          {{ feature.description }}
        </p>
        <code
          class="mt-[26px] inline-flex h-[30px] items-center self-start rounded-[9px] bg-(--ov-sunk) px-[11px] font-(family-name:--ov-mono) text-[12.5px] text-(--ov-text-2)
            shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-gray-10)_4%,transparent)] max-[821px]:mt-5"
        >{{ feature.meta }}</code>
      </div>
    </article>
  </div>
</template>
