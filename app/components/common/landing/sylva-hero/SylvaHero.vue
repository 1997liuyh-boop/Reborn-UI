<script setup lang="ts">
import type { PageTypographyProps } from "~/lib/landing-pages/pageTypography";
import { ReuiLaunchDoodle } from "~/components/reborn/ui/reui-launch";
import { createFrameSlot } from "~/lib/landing-pages/frameSlot";
import { usePageTypography } from "~/lib/landing-pages/pageTypography";
import { SYLVA_TYPOGRAPHY } from "~/lib/landing-pages/sylvaHero.recipe";
import LandingPageFrame from "./LandingPageFrame.vue";

// 移植自 ThreeUI 的 SylvaHero（Living Green 变体）：苔藓根系场景、白花、蕨类、
// 漂浮花粉、落下的蝴蝶与液态金属按钮，整页由 public/landing-pages/inner-green-3d.html 承载。
// 文案已改为 Reborn UI 的介绍，页面内的链接与按钮通过 href / data-href 交给 Nuxt 路由跳转；
// 更新日志卡片的图片位由 ReuiLaunchDoodle 填充，经 Teleport 挂进页面里的 shadow root。

interface SylvaHeroProps extends PageTypographyProps {
  /** 场景变体；其余三种派生变体依赖的场景源码未随源码包提供，这里只提供 living-green */
  variant?: "living-green";
}

const props = defineProps<SylvaHeroProps>();

const SOURCE_URL = "/landing-pages/inner-green-3d.html";
const TITLE = "Reborn UI — 跨端 Vue 组件库";
// 留出花粉迸发与按钮按压的反馈时间再跳转
const NAVIGATE_DELAY = 260;

const customization = usePageTypography(SYLVA_TYPOGRAPHY, () => ({
  headingFont: props.headingFont,
  bodyFont: props.bodyFont,
  headingWeight: props.headingWeight,
  bodyWeight: props.bodyWeight,
  primaryColor: props.primaryColor,
  headingSize: props.headingSize,
  bodySize: props.bodySize,
  headingLetterSpacing: props.headingLetterSpacing,
}));

const route = useRoute();
let navigateTimer: ReturnType<typeof setTimeout> | undefined;

// 页面里的导航项会自行阻止默认行为（切换选中态并迸发花粉），
// 所以跳转统一在这里接管：站内路径走 Nuxt 路由，修饰键点击在新标签页打开；
// 外部链接（各技术栈官网）由父页面打开新标签页，否则弹出的窗口会继承 iframe 的沙箱限制
function bindNavigation(frame: HTMLIFrameElement) {
  const frameDocument = frame.contentDocument;
  if (!frameDocument || frameDocument.documentElement.dataset.rebornNavigation) return;
  frameDocument.documentElement.dataset.rebornNavigation = "bound";

  frameDocument.addEventListener("click", (event) => {
    const target = (event.target as Element | null)?.closest<HTMLElement>("[data-href], a[href]");
    const href = target?.dataset.href ?? target?.getAttribute("href");
    if (href && /^https?:\/\//.test(href)) {
      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (!href?.startsWith("/")) return;
    event.preventDefault();
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      window.open(href, "_blank", "noopener");
      return;
    }
    if (href === route.path) return;
    clearTimeout(navigateTimer);
    navigateTimer = setTimeout(() => navigateTo(href), NAVIGATE_DELAY);
  });
}

onBeforeUnmount(() => clearTimeout(navigateTimer));

// 页面每次加载都是新文档，挂载点随之重建，Teleport 会把 Doodle 移到新的挂载点
const doodleSlot = shallowRef<HTMLElement | null>(null);

function handleFrameLoad(frame: HTMLIFrameElement) {
  bindNavigation(frame);
  doodleSlot.value = createFrameSlot(frame, "[data-reborn-slot=\"launch-doodle\"]");
}
</script>

<template>
  <LandingPageFrame
    :key="variant ?? 'living-green'"
    :source-url="SOURCE_URL"
    :title="TITLE"
    :customization="customization"
    @load="handleFrameLoad"
  />
  <!-- 铺满图片框：同时给定宽高，组件自带的 aspect 比例不再生效，画面在框内居中 -->
  <Teleport v-if="doodleSlot" :to="doodleSlot">
    <ReuiLaunchDoodle
      text="RE"
      screen-text="UI"
      screen-effect="crt"
      :compact="true"
      :expanded="false"
      class="h-full! rounded-none!"
    />
  </Teleport>
</template>
