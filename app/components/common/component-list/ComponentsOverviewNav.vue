<script setup lang="ts">
/**
 * 组件总览的悬浮导航：字标 + 分区链接 + 「工具」面板（主题色、明暗模式、AI）
 * 色调由 useOverviewNavTone 决定：首屏深色区为深底白字，滚进浅色区后为白底深字
 */
import { themeColors } from "~/utils/themeColor";

/** 分区链接 */
const NAV_LINKS = [
  { label: "入门", to: "/getting-started" },
  { label: "组件", to: "/components" },
  { label: "日志", to: "/changelogs" },
  { label: "Hook", to: "/composables" },
] as const;

const route = useRoute();
const tone = useOverviewNavTone();

function isCurrent(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`);
}

/* ── 工具面板 ───────────────────────────────────────────────────── */

const rootRef = useTemplateRef<HTMLElement>("root");
const open = shallowRef(false);

function close() {
  open.value = false;
}

/** 点击导航外部时收起面板 */
function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return;
  if (!rootRef.value?.contains(event.target as Node)) close();
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close();
}

// 路由变化后收起面板
watch(() => route.fullPath, close);

/* ── 主题色 ─────────────────────────────────────────────────────── */

/** 当前主题色 */
const themeColor = useThemeColor();

/* ── 明暗模式 ───────────────────────────────────────────────────── */

const colorMode = useColorMode();
/** 挂载后才标记选中的明暗模式，避免水合不一致 */
const mounted = shallowRef(false);

const COLOR_MODES = [
  { value: "light", label: "浅色", icon: "lucide:sun" },
  { value: "dark", label: "深色", icon: "lucide:moon" },
] as const;

function isModeActive(value: string) {
  return mounted.value && colorMode.value === value;
}

/* ── AI ─────────────────────────────────────────────────────────── */

const { isEnabled: isAssistantEnabled, open: openAssistant } = useAssistant();

/** 开启 AI 助手时打开抽屉，否则跳转演练场 */
function onAiClick(event: MouseEvent) {
  close();
  if (!isAssistantEnabled.value) return;
  event.preventDefault();
  openAssistant();
}

onMounted(() => {
  mounted.value = true;
  document.addEventListener("pointerdown", onDocumentPointerDown);
  document.addEventListener("keydown", onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown);
  document.removeEventListener("keydown", onDocumentKeydown);
});

/* ── 样式类 ─────────────────────────────────────────────────────────── */

/*
 * 浅色调只在浅色模式下生效；服务端渲染时色调恒为 dark。
 * 断点写成 max-[N+1]，与原 max-width: N 等价。
 */
const lightTone = computed(() => tone.value === "light" && colorMode.value !== "dark");

/** 两种色调的前景色、焦点色与底色显隐 */
const TONE = {
  dark: "[--nav-fg:rgb(255_255_255/0.86)] [--nav-fg-strong:#fff] [--nav-focus:rgb(255_255_255/0.7)] after:opacity-0",
  light: "[--nav-fg:rgb(18_20_26/0.72)] [--nav-fg-strong:#12141a] [--nav-focus:#12141a] before:opacity-0 after:opacity-100",
} as const;

/** 「工具」按钮 */
const TOOLS = {
  dark: "bg-white text-[#12141a] shadow-[inset_0_0_6px_1px_color-mix(in_oklab,var(--color-primary)_22%,transparent),0_4px_12px_-4px_rgb(8_10_16/0.35)] hover:bg-[color-mix(in_oklab,var(--color-primary)_6%,white)]",
  light: "bg-[#12141a] text-white shadow-none hover:bg-[#2a2d36]",
} as const;

/** 颜色过渡 */
const NAV_TRANSITION = "[transition:color_0.3s,background-color_0.3s,box-shadow_0.3s] motion-reduce:transition-none";

/** 焦点环：胶囊里跟随色调，面板里用主色 */
const NAV_FOCUS = "focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--nav-focus)";
const PANEL_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary";

/** 面板里的一行设置 */
const PANEL_ROW = "flex h-11 items-center justify-between gap-3 pr-2 pl-3";
</script>

<template>
  <!-- 两层底色画在 ::before / ::after 上，切换色调时交叉淡入淡出 -->
  <nav
    ref="root" aria-label="主导航" :data-tone="tone"
    class="ov-nav fixed top-[18px] left-1/2 z-50 grid h-[50px] w-[min(720px,100%_-_32px)] -translate-x-1/2 grid-cols-[1fr_auto_1fr] items-center gap-x-5
      rounded-2xl py-0 pr-[7px] pl-[14px] text-[15px] tracking-[-0.01em] whitespace-nowrap backdrop-blur-[14px] backdrop-saturate-140
      [--nav-ease:cubic-bezier(0.2,0.8,0.2,1)]
      before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:bg-[rgb(8_10_16/0.38)]
      before:bg-[linear-gradient(rgb(255_255_255/0.1),rgb(255_255_255/0.1))] before:shadow-[inset_0_1px_rgb(255_255_255/0.08)]
      before:transition-opacity before:duration-[350ms] before:ease-[ease] before:content-['']
      after:pointer-events-none after:absolute after:inset-0 after:-z-1 after:rounded-[inherit] after:bg-[rgb(255_255_255/0.74)]
      after:shadow-[0_0_0_1px_rgb(10_14_24/0.06),0_8px_24px_-14px_rgb(10_20_50/0.3)]
      after:transition-opacity after:duration-[350ms] after:ease-[ease] after:content-['']
      motion-reduce:before:transition-none motion-reduce:after:transition-none
      max-[641px]:top-3 max-[641px]:grid-cols-[1fr_auto] max-[641px]:pl-3"
    :class="lightTone ? TONE.light : TONE.dark"
  >
    <!-- 字标 -->
    <NuxtLink
      to="/" aria-label="Reborn UI 首页"
      class="flex w-fit items-center text-(--nav-fg-strong) [&_span]:h-auto [&_span]:text-inherit [&_svg]:h-[22px]"
      :class="[NAV_TRANSITION, NAV_FOCUS]"
    >
      <AppHeaderLogo />
    </NuxtLink>

    <!-- 分区链接，悬停与当前页显示下划线 -->
    <div class="flex gap-6 max-[641px]:hidden">
      <NuxtLink
        v-for="link in NAV_LINKS" :key="link.to" :to="link.to"
        :aria-current="isCurrent(link.to) ? 'page' : undefined"
        class="relative text-(--nav-fg) hover:text-(--nav-fg-strong)
          after:absolute after:right-0 after:bottom-[-5px] after:left-0 after:h-px after:origin-right after:scale-x-0 after:bg-current
          after:transition-transform after:duration-200 after:ease-(--nav-ease) after:content-['']
          hover:after:origin-left hover:after:scale-x-100 hover:after:duration-[140ms]
          aria-[current=page]:after:origin-left aria-[current=page]:after:scale-x-100 aria-[current=page]:after:duration-[140ms]"
        :class="[NAV_TRANSITION, NAV_FOCUS]"
      >
        {{ link.label }}
      </NuxtLink>
    </div>

    <div class="flex items-center justify-self-end">
      <button
        type="button" :aria-expanded="open" aria-controls="ov-nav-panel"
        class="ov-nav-tools inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-[11px] px-[13px] text-[14px] font-medium"
        :class="[NAV_TRANSITION, NAV_FOCUS, lightTone ? TOOLS.light : TOOLS.dark]"
        @click="open = !open"
      >
        <Icon name="lucide:wrench" class="size-[15px]" />
        工具
      </button>
    </div>

    <!-- 工具面板，收起时 inert -->
    <div
      id="ov-nav-panel" :data-open="open" :inert="open ? undefined : true"
      class="ov-nav-panel absolute top-[calc(100%_+_8px)] right-0 w-[264px] rounded-2xl bg-gray-1 p-1.5 text-gray-10
        shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gray-10)_8%,transparent),0_1px_2px_rgb(8_10_16/0.05),0_24px_44px_-26px_rgb(10_20_50/0.34)]
        transition-[opacity,translate] ease-[ease] motion-reduce:transition-none max-[641px]:left-0 max-[641px]:w-auto"
      :class="open ? 'pointer-events-auto translate-y-0 opacity-100 duration-200' : 'pointer-events-none -translate-y-1.5 opacity-0 duration-[120ms]'"
    >
      <!-- 窄屏下的分区链接 -->
      <div class="hidden max-[641px]:mb-1.5 max-[641px]:grid max-[641px]:pb-1.5 max-[641px]:shadow-[0_1px_color-mix(in_oklab,var(--color-gray-10)_7%,transparent)]">
        <NuxtLink
          v-for="link in NAV_LINKS" :key="link.to" :to="link.to"
          :aria-current="isCurrent(link.to) ? 'page' : undefined"
          class="flex h-11 items-center justify-between rounded-[11px] px-3 text-[15px] font-medium text-gray-10
            active:bg-[color-mix(in_oklab,var(--color-gray-10)_5%,transparent)] aria-[current=page]:bg-[color-mix(in_oklab,var(--color-gray-10)_5%,transparent)]"
          :class="[NAV_TRANSITION, PANEL_FOCUS]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>

      <div :class="PANEL_ROW">
        <span class="text-[14px] text-gray-8">主题色</span>
        <div class="flex items-center gap-2" role="group" aria-label="主题色">
          <!-- 主题色色块 -->
          <button
            v-for="color in themeColors" :key="color.name" type="button" :data-theme-color="color.preset"
            class="ov-swatch size-5 cursor-pointer rounded-[999px] bg-primary hover:scale-[1.12]
              aria-pressed:shadow-[0_0_0_2px_var(--color-gray-1),0_0_0_4px_var(--color-gray-10)]
              focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
            :class="NAV_TRANSITION" :title="color.label" :aria-label="`切换为${color.label}`"
            :aria-pressed="themeColor === color.name" @click="themeColor = color.name"
          />
        </div>
      </div>

      <div :class="PANEL_ROW">
        <span class="text-[14px] text-gray-8">外观</span>
        <!-- 明暗模式 -->
        <div class="ov-mode flex gap-0.5 rounded-[10px] bg-[color-mix(in_oklab,var(--color-gray-10)_6%,transparent)] p-0.5" role="group" aria-label="明暗模式">
          <button
            v-for="mode in COLOR_MODES" :key="mode.value" type="button" :aria-pressed="isModeActive(mode.value)"
            class="inline-flex h-7 cursor-pointer items-center gap-[5px] rounded-lg px-2.5 text-[13px] text-gray-7 hover:text-gray-10
              aria-pressed:bg-gray-1 aria-pressed:text-gray-10
              aria-pressed:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-gray-10)_8%,transparent),0_1px_2px_rgb(8_10_16/0.08)]"
            :class="[NAV_TRANSITION, PANEL_FOCUS]"
            @click="colorMode.preference = mode.value"
          >
            <Icon :name="mode.icon" class="size-3.5" />
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- AI 入口 -->
      <a
        href="/playground"
        class="mt-1.5 flex h-[46px] items-center justify-between rounded-[11px] rounded-t-none px-3 pt-0.5 text-[15px] font-medium text-gray-10
          shadow-[0_-1px_color-mix(in_oklab,var(--color-gray-10)_7%,transparent)] hover:bg-[color-mix(in_oklab,var(--color-gray-10)_5%,transparent)]"
        :class="[NAV_TRANSITION, PANEL_FOCUS]"
        @click="onAiClick"
      >
        <span class="flex items-center gap-2">
          <Icon name="lucide:sparkles" class="size-4" />
          {{ isAssistantEnabled ? "问 AI" : "在线演练场" }}
        </span>
        <Icon name="lucide:arrow-up-right" class="size-4 opacity-40" />
      </a>
    </div>
  </nav>
</template>
