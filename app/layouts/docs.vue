<script lang="ts" setup>
const route = useRoute();
const isRoot = isRootPage();

/**
 * 后台管理式全宽外壳：非 root 文档页在 body 上挂 layout-admin-shell，
 * 将 --ui-container 覆盖为 100%（见 base.css）——AppHeader /
 * 正文容器全部随变量放开到全宽，无需逐个改容器；root 落地页维持居中版式。
 */
useHead({
    bodyAttrs: {
        class: computed(() => (isRoot.value ? "" : "layout-admin-shell")),
    },
});

/**
 * 三栏布局（2xl+）：左菜单固定 220px，正文吃满剩余宽度。
 * lg~2xl 维持原 10 列分数栅格（右侧移动端面板 <2xl 不显示，行为与改版前一致）。
 * Tailwind 按断点升序输出，2xl 类在 lg 类之后声明，媒体查询同时命中时 2xl 生效。
 */
const threeColUi = {
    // 侧栏略加宽至 248px，贴近 Arco ~260px 的文档导航密度
    root: "2xl:grid-cols-[248px_minmax(0,1fr)]",
    left: "2xl:col-span-1",
    center: "2xl:col-span-1 min-w-0",
} as const;

/**
 * 右侧移动端面板为 fixed 定位（贴视口右缘 420px 宽），不参与文档流；
 * 当前页有 demo 时正文加 2xl:pr-[420px] 避让，间隙由容器自身 px-8 提供。
 * 用 padding 而非 margin：正文包装器是 UContainer 的第一个子元素，
 * 会命中带 `&:first-child { margin-inline-end: 0 }` 的工具类（伪类特异性更高），
 * margin-right 会被清零。
 * hasDemos 在 SSR 期即由 ComponentPlayground 注册（useState 随 payload 下发），
 * 服务端与客户端首帧一致，不产生水合差异。
 */
const { hasDemos } = useUniDemoPanel();
</script>

<template>
  <UMain class="relative -mt-16 pt-16">
    <div class="dark:pattern-background-d pattern-background-l absolute inset-0 z-[-1]" />
    <!-- 分类导航已并入主顶栏右侧（对齐 Arco header），不再渲染二级 AppHeaderNav -->
    <UContainer>
      <div
        class="min-w-0 transition-[padding] duration-200"
        :class="hasDemos ? '2xl:pr-[420px]' : undefined"
      >
        <!-- <UPage :key="route.fullPath"> -->
        <UPage
          :key="route.path"
          :ui="isRoot ? undefined : threeColUi"
        >
          <template
            v-if="!isRoot"
            #left
          >
            <UPageAside>
              <DocsAsideLeftTop />
              <DocsAsideLeftBody />
            </UPageAside>
          </template>
          <slot />
        </UPage>
      </div>

      <!-- 右侧移动端 demo 面板：fixed 常驻右缘，置于 :key 之外，路由切换时 iframe 复用 -->
      <DocsMobilePanel />
    </UContainer>
  </UMain>
</template>
