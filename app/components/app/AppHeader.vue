<script setup lang="ts">
import type { ContentNavigationItem } from "@nuxt/content";
import { mapContentNavigation } from "@nuxt/ui/utils/content";
import { useResizeObserver, useWindowScroll, useWindowSize } from "@vueuse/core";

const appConfig = useAppConfig();
const site = useSiteConfig();
const route = useRoute();

// AI 助手开关:由 Docus assistant 模块提供,构建期存在 AI_GATEWAY_API_KEY 时启用
const { isEnabled: isAssistantEnabled } = useAssistant();

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");

/**
 * 顶部分类显示文案：保持英文混排
 * 入门指南 / Components / Changelogs / Composables
 */
const SECTION_LABELS: Record<string, string> = {
  "/getting-started": "入门指南",
  "/components": "Components",
  "/changelogs": "Changelogs",
  "/composables": "Composables",
};

/**
 * 顶部分类导航（对齐 Arco header）：
 * 分类链放在右侧工具区左侧；原先独立的 AppHeaderNav 二级栏已取消。
 */
const sectionItems = computed(() =>
  mapContentNavigation(
    navigation?.value?.map((item) => ({ ...item, children: undefined })) ?? [],
  )?.map((item) => {
    const to = String(item.to ?? "");
    return {
      ...item,
      label: SECTION_LABELS[to] ?? item.label,
      active: route.path.startsWith(to),
    };
  }) ?? [],
);

/**
 * 平台开关只在组件分区出现：它筛选的是组件列表与组件预览，
 * 入门指南 / 更新日志等页面没有可筛选的对象，不展示以免误导。
 */
const showPlatformSwitch = computed(() => route.path.startsWith("/components"));

/**
 * 阅读进度：顶栏底部的浪带按「当前滚动距离 / 可滚动总距离」从左向右铺开，滚到底时铺满；浪头上有一艘船跟着走。
 * 口径与全局 RebornBackTop 的进度环一致，两者同步走完。
 * 文档高度不是响应式的：图片、懒加载内容撑高页面后要重新测量，否则会提前算成「已到底」。
 */
const { y: scrollY } = useWindowScroll();
const { height: viewportHeight } = useWindowSize();
const docHeight = ref(0);
// 观察目标延后到 onMounted 赋值：SSR 阶段没有 document
const docEl = shallowRef<HTMLElement | null>(null);

const measureDoc = () => {
  docHeight.value = document.documentElement.scrollHeight;
};

useResizeObserver(docEl, measureDoc);

onMounted(() => {
  measureDoc();
  docEl.value = document.documentElement;
});

/**
 * 进度取值 0 ~ 1。内容不足一屏时没有可滚动距离，保持 0、不出浪带也不出船。
 * 水合时 docHeight 尚未测量（为 0），这里必然返回 0，与 SSR 输出一致，不会产生 style 水合不匹配。
 */
const readProgress = computed(() => {
  const range = docHeight.value - viewportHeight.value;
  if (range <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY.value / range));
});

/**
 * 浪只在滚动时翻涌：滚动停下 900ms 后暂停动画。
 * 一直动的话，读者停下来看正文时顶栏还在晃，分散注意力，也白白占着合成线程。
 * 暂停用 animation-play-state，浪和船停在当下的相位，再滚动时从原处接着动，不会跳回起点。
 */
const isWaving = ref(false);
let calmTimer: ReturnType<typeof setTimeout> | undefined;

watch(scrollY, () => {
  isWaving.value = true;
  clearTimeout(calmTimer);
  calmTimer = setTimeout(() => {
    isWaving.value = false;
  }, 900);
});

onBeforeUnmount(() => clearTimeout(calmTimer));

/**
 * 浪带按进度从右侧裁掉未读部分；不用 scaleX，否则浪形会跟着被横向压扁。
 * 有进度时至少铺 24px：船的左侧被夹在 24px（见 shipStyle），水面得托得住它，否则进度刚起步时船悬在空处。
 */
const seaStyle = computed(() => ({
  clipPath:
    readProgress.value > 0
      ? `inset(0 calc(100% - max(24px, ${readProgress.value * 100}%)) 0 0)`
      : "inset(0 100% 0 0)",
}));

/**
 * 船头对齐浪带的前沿（船身整体在已读的水面上）。
 * 左侧夹到 24px（约一个船身）：进度刚起步时前沿离左缘太近，船会被挤出屏幕。
 */
const shipStyle = computed(() => ({
  // 右侧上限留 2px：船身摇摆旋转 ±5° 后外接框会伸出约 1.5px，贴满 100% 会在滚到底时撑出 1px 横向滚动条
  left: `clamp(24px, ${readProgress.value * 100}%, calc(100% - 2px))`,
  opacity: readProgress.value > 0 ? 1 : 0,
}));

const links = computed(() =>
  appConfig.github && appConfig.github.url
    ? [
      {
        icon: "i-simple-icons-github",
        to: appConfig.github.url,
        target: "_blank",
        "aria-label": "GitHub",
      },
    ]
    : [],
);
</script>

<template>
  <UHeader :ui="{ center: 'flex-1', left: 'flex-0!' }" to="/" :title="appConfig.header?.title || site.name"
    mode="drawer">
    <!--
      阅读进度：浪带 + 船，都挂在顶栏根节点内（根节点 sticky 定位，是它们的包含块；z-50 自成层叠上下文）。
      层级从下到上：导航内容 → 船（z-10）→ 浪带（z-20）。
      浪带盖在船上，半透明的浪罩住船身下沿，船才像吃水浮在浪里，而不是摆在浪尖上；
      浪带只占底部 8px，那里没有按钮，放到内容之上不挡任何东西。
      船的桅杆会伸到按钮所在的高度，所以也放在内容之上，否则会被实心的搜索框挡住一截。两者都不拦截点击。
    -->
    <template #top>
      <div
        aria-hidden="true"
        class="reading-sea pointer-events-none absolute inset-x-0 bottom-0 z-20 h-2"
        :class="{ 'is-waving': isWaving }"
        :style="seaStyle"
      >
        <!-- 两层浪：后浪更淡、更长、反向流动，叠出起伏的层次 -->
        <div class="reading-wave reading-wave--back bg-primary/25" />
        <div class="reading-wave reading-wave--front bg-primary/50" />
      </div>

      <div
        aria-hidden="true"
        class="reading-ship pointer-events-none absolute z-10 text-primary"
        :class="{ 'is-waving': isWaving }"
        :style="shipStyle"
      >
        <!-- 船头朝右（前进方向）：主帆、前帆、桅杆、船身，单色跟随 text-primary -->
        <svg class="reading-ship-body block h-[17px] w-5" viewBox="0 0 24 20" fill="currentColor">
          <path d="M12.6 1.5 L20.5 12.5 H12.6 Z" opacity=".8" />
          <path d="M10.6 4.5 L4.5 12.5 H10.6 Z" opacity=".6" />
          <rect x="10.8" y="1" width="1.6" height="12.5" rx=".8" />
          <path d="M1 13.5 H23 L19 19 H4.5 Z" />
        </svg>
      </div>
    </template>

    <AppHeaderCenter />

    <template #title>
      <!-- 纯色内联 SVG，跟随 text-default / 明暗主题 -->
      <AppHeaderLogo />
    </template>

    <template #right>
      <!-- 桌面端：组件分区的 Web / UniApp 平台开关，置于分类导航之前 -->
      <template v-if="showPlatformSwitch">
        <DocsPlatformSwitch class="hidden lg:flex" />
        <USeparator orientation="vertical" class="mx-1 hidden h-5 lg:block" />
      </template>

      <!-- 桌面端：分类导航贴近右侧工具区（Ask AI / 主题 / GitHub） -->
      <nav v-if="sectionItems.length" class="mr-1 hidden items-center gap-0.5 lg:flex" aria-label="文档分类">
        <UButton v-for="item in sectionItems" :key="String(item.to)" :to="item.to" :label="item.label" color="neutral"
          variant="ghost" size="sm" class="px-2.5 font-medium" :class="item.active
            ? 'text-primary bg-primary/8 hover:bg-primary/12 hover:text-primary'
            : 'text-muted hover:text-default'" />
      </nav>

      <USeparator v-if="sectionItems.length" orientation="vertical" class="mx-1 hidden h-5 lg:block" />

      <AppHeaderCTA />

      <template v-if="isAssistantEnabled">
        <AssistantChat />
      </template>

      <UContentSearchButton class="lg:hidden" />

      <ClientOnly>
        <AppThemePicker />
        <UColorModeButton />

        <template #fallback>
          <div class="flex items-center gap-2">
            <div class="h-8 w-8 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
            <div class="h-8 w-8 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </template>
      </ClientOnly>

      <template v-if="links?.length">
        <UButton v-for="(link, index) of links" :key="index" v-bind="{ color: 'neutral', variant: 'ghost', ...link }" />
      </template>
    </template>

    <template #toggle="{ open, toggle }">
      <IconMenuToggle :open="open" class="lg:hidden" @click="toggle" />
    </template>

    <template #body>
      <!-- 移动端抽屉：平台开关 + 分类导航置顶，下面是按平台裁剪后的内容树 -->
      <div v-if="showPlatformSwitch" class="mb-4 lg:hidden">
        <DocsPlatformSwitch block />
      </div>
      <div v-if="sectionItems.length" class="mb-4 flex flex-wrap gap-1 border-b border-default/40 pb-4 lg:hidden">
        <UButton v-for="item in sectionItems" :key="`m-${String(item.to)}`" :to="item.to" :label="item.label"
          color="neutral" variant="soft" size="sm" :class="item.active ? 'text-primary' : undefined" />
      </div>
      <AppHeaderBody />
    </template>
  </UHeader>
</template>

<style scoped>
/*
 * 浪形用 mask 而不是 SVG 背景图：mask 只取形状，颜色交给 bg-primary/* 工具类，主题色切换时自动跟随。
 * 每层宽度比浪带多出一个浪长，向一侧平移一个浪长后与起点完全重合，循环无缝。
 *
 * 浪带必须 overflow: hidden：多出的那个浪长会伸出视口右缘。clip-path 只裁绘制、不裁布局，
 * 伸出去的部分照样计入页面可滚动宽度，整页会多出一截横向滚动条。
 */
.reading-sea {
  overflow: hidden;
  transition: clip-path 400ms ease-out;
}

.reading-wave {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-play-state: paused;
}

/* 前浪：浪长 48px，波峰离浪带顶 2px */
.reading-wave--front {
  width: calc(100% + 48px);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 8'%3E%3Cpath d='M0 4Q12 0 24 4T48 4V8H0Z'/%3E%3C/svg%3E") repeat-x 0 0 / 48px 100%;
  animation-name: reading-wave-front;
  animation-duration: 1.8s;
}

/* 后浪：浪长 64px，波峰比前浪高半个像素（离浪带顶 1.5px），从前浪后面露出来；反向流动 */
.reading-wave--back {
  width: calc(100% + 64px);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 8'%3E%3Cpath d='M0 3Q16 0 32 3T64 3V8H0Z'/%3E%3C/svg%3E") repeat-x 0 0 / 64px 100%;
  animation-name: reading-wave-back;
  animation-duration: 2.6s;
}

@keyframes reading-wave-front {
  to {
    transform: translateX(-48px);
  }
}

@keyframes reading-wave-back {
  from {
    transform: translateX(-64px);
  }
  to {
    transform: translateX(0);
  }
}

/*
 * 船贴在浪上：前浪的平均水位线离浪带底 4px（波峰 6px、波谷 2px），
 * bottom: 2px 让船底（SVG 内船身下方约留白 1px）沉到水位线下 1px 左右——
 * 浪谷经过时船身全露出来，浪峰经过时下沿被浪罩住，随起伏动画一起看就是浮在浪里。
 * 横向位置随进度走，过渡比滚动慢一拍（400ms，与浪带裁切同步），船是「跟着浪慢慢挪」而不是跳格。
 * translateX(-100%) 让船头而不是船身中心对齐浪带前沿。
 */
.reading-ship {
  bottom: 2px;
  transform: translateX(-100%);
  transition:
    left 400ms ease-out,
    opacity 300ms ease-out;
}

/*
 * 起伏周期与前浪一致（1.8s 走过一个浪长）：船停在原地、浪从船下流过，
 * 每过一个浪头船就被托起、前倾一次。绕船底中心旋转，像压在水面上摇。
 */
.reading-ship-body {
  transform-origin: 50% 100%;
  animation: reading-ship-bob 1.8s ease-in-out infinite;
  animation-play-state: paused;
}

@keyframes reading-ship-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-2px) rotate(5deg);
  }
}

.reading-sea.is-waving .reading-wave,
.reading-ship.is-waving .reading-ship-body {
  animation-play-state: running;
}

@media (prefers-reduced-motion: reduce) {
  .reading-sea,
  .reading-ship {
    transition: none;
  }

  .reading-wave,
  .reading-ship-body {
    animation: none;
  }
}
</style>
