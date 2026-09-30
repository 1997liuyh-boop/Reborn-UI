<script setup lang="ts">
/**
 * DocsToc —— 文档页右栏目录（UPage 的 #right 槽）
 *
 * 由 RebornAnchor 驱动：滚动时按标题位置高亮当前章节，点击平滑滚到对应标题。
 * - lg+：与正文并排的常驻栏，随页面滚动吸顶（top 补偿单层顶栏），目录超高时自身滚动；
 * - <lg：退化为置顶的折叠条（与 UContentToc 的移动端形态一致），点标题展开目录。
 * 两个断点共用同一个 RebornAnchor 实例，只是外层显隐不同，不会重复挂两套滚动监听。
 *
 * 本组件是 #right 槽里唯一的根节点：UPage 用 reka 的 Slot 把栅格类合并到槽内根节点上，
 * 多写一个根节点，栅格类只会落到第一个身上。
 *
 * 滚动偏移分两档：
 * - 普通标题：让出顶栏 64px 再留 24px 呼吸空间；
 * - 示例卡片标题（用法小节，锚点在 ComponentTabs 的 Preview 面板里）：面板上方还压着一条
 *   吸顶 Tab 栏（nav py-2 的 16px + 胶囊 md 的 48px = 64px），要再多让出这一段，
 *   否则滚到位后标题停在 Tab 栏后面。
 * 组件自己算滚动位置，不读 CSS 的 scroll-margin-top，所以偏移只能在这里给；
 * 带 hash 直接打开页面走的是浏览器原生跳转，那一路由 base.css 里的 scroll-margin-top 兜底。
 */
import type { AnchorItem } from "~/components/reborn/ui/reborn-anchor/reborn-anchor.config";

/** 目录链接节点（@nuxt/content 的 page.body.toc.links 结构，inDemo 由 DocsPage 裁剪目录时打上） */
interface TocLinkItem {
  id: string;
  text: string;
  depth: number;
  children?: TocLinkItem[];
  /** 锚点落在 ComponentTabs 的 Preview 面板里（示例卡片标题），滚动时要多让出吸顶 Tab 栏 */
  inDemo?: boolean;
}

interface Props {
  /** 目录链接树（h2 + 嵌套 h3） */
  links: TocLinkItem[];
  /** 目录标题 */
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "本页目录",
});

/** 顶栏 64px + 24px 留白 */
const DOC_OFFSET = 88;
/** 顶栏 64px + 吸顶 Tab 栏 64px + 16px 留白 */
const DEMO_OFFSET = 144;
/**
 * 选中判定的容差：标题顶部进入「offset + bound」这条线以内即视为当前章节。
 * 组件默认 15 太紧——示例卡片要一直滚到标题快钻进吸顶 Tab 栏底下才切换高亮，
 * 读者看到的是卡片已经被遮住、目录还停在上一节。放宽到 100，
 * 标题离 Tab 栏还有约 100px 时就切换；再放宽会让 API 里几行表格的短小节被下一节抢先点亮。
 */
const ACTIVE_BOUND = 100;

/** 目录树 → RebornAnchor 的 items；h3 嵌在对应 h2 的 children 里，组件按层级缩进 */
function toAnchorItems(links: TocLinkItem[]): AnchorItem[] {
  return links.map((link) => ({
    key: link.id,
    href: `#${link.id}`,
    title: link.text,
    // 点击后把 hash 写进地址栏（replaceState，不堆历史记录），当前章节的链接可直接分享
    replace: true,
    offset: link.inDemo ? DEMO_OFFSET : DOC_OFFSET,
    children: link.children?.length ? toAnchorItems(link.children) : undefined,
  }));
}

const items = computed(() => toAnchorItems(props.links ?? []));

/** <lg 折叠条是否展开；lg+ 目录常驻，不看这个值 */
const mobileOpen = ref(false);
</script>

<template>
  <!--
    根节点即栅格单元：sticky 要能生效，元素得比行矮——max-h 把它限在一屏之内。
    <lg 的负外边距与半透明底、毛玻璃照抄 UContentToc 的移动端折叠条，lg+ 全部收回。
  -->
  <nav
    class="bg-default/75 sticky top-(--ui-header-height) z-10 -mx-4 max-h-[calc(100vh-var(--ui-header-height))] overflow-y-auto px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
  >
    <div class="border-default flex flex-col border-b border-dashed pt-4 pb-2.5 sm:pt-6 sm:pb-4.5 lg:border-0 lg:py-8">
      <!-- <lg：标题行是折叠开关 -->
      <button
        type="button"
        class="-mt-1.5 flex w-full cursor-pointer items-center gap-1.5 py-1.5 text-sm font-semibold text-gray-9 lg:hidden"
        :aria-expanded="mobileOpen"
        @click="mobileOpen = !mobileOpen"
      >
        <span class="truncate">{{ title }}</span>
        <UIcon
          name="i-lucide-chevron-down"
          class="ms-auto size-5 shrink-0 transition-transform duration-200"
          :class="mobileOpen ? 'rotate-180' : undefined"
        />
      </button>

      <!-- lg+：只是一行小标题 -->
      <p class="mb-3 hidden text-xs font-medium tracking-wide text-gray-6 lg:block">
        {{ title }}
      </p>

      <div :class="mobileOpen ? 'block pt-2 lg:pt-0' : 'hidden lg:block'">
        <RebornAnchor
          :items="items"
          type="default"
          direction="vertical"
          color="primary"
          marker="bar"
          :offset="DOC_OFFSET"
          :bound="ACTIVE_BOUND"
          :duration="300"
          :select-scroll-top="false"
        />
      </div>

      <!-- 社区链接（仅 lg+ 展示，组件自带断点） -->
      <DocsAsideRightBottom />
    </div>
  </nav>
</template>
