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
 * 两栏栅格（lg+）：左菜单 + 正文。lg~2xl 按 2:8 分（与 Nuxt UI 默认的 10 列 col-span-2 / 8 观感一致），
 * 2xl+ 左列固定 248px（贴近 Arco ~260px 的文档导航密度），正文吃满剩余宽度。
 * Tailwind 按断点升序输出，2xl 类在 lg 类之后声明，媒体查询同时命中时 2xl 生效。
 *
 * 这份 ui 在折叠前后不变。折叠只改根节点的内联 grid-template-columns（见模板）：
 * 实测在这个 6000+ 元素的文档页上，正文容器换一次 class 就要整页重算样式约 100ms，
 * 而根节点改内联样式只影响它自己，代价可以忽略；列宽过渡因此也能保留。
 */
const threeColUi = {
  root: "lg:grid-cols-[minmax(0,2fr)_minmax(0,8fr)] 2xl:grid-cols-[248px_minmax(0,1fr)] transition-[grid-template-columns] duration-300",
  left: "lg:col-span-1",
  center: "lg:col-span-1 min-w-0",
} as const;

/**
 * 侧栏折叠状态：这里切栅格并放折叠按钮，DocsAsideLeftBody 把它交给 RebornMenu 的 collapse。
 * 按钮不放进 UPageAside：它是 overflow-y-auto 的滚动容器，任何探出边界的东西都会被裁掉，
 * 而按钮要骑在侧栏与正文的分隔线上，只能挂在它外面。
 */
const { collapsed: asideCollapsed, toggle: toggleAside } = useDocsAside();

/**
 * 折叠后的窄轨：RebornMenu 折叠态固定 64px 宽，左列给 5.5rem
 * （UPageAside 的 -ms-4 / ps-4 相抵，再扣掉 24px 的右内边距，内容区正好 64px），正文吃满其余宽度。
 * lg 起就生效——折叠的意义就是把宽度让给正文，lg~2xl 也一样。<lg 根节点是 flex 列，这条内联样式不起作用。
 */
const pageStyle = computed(() =>
  asideCollapsed.value ? { gridTemplateColumns: "5.5rem minmax(0, 1fr)" } : undefined,
);

/**
 * 右侧移动端面板为 fixed 定位（贴视口右缘 420px 宽），不参与文档流；
 * 面板可见（当前页有 uniapp demo 且顶栏开关处于 UniApp 档）时正文加 2xl:pr-[420px] 避让，
 * 间隙由容器自身 px-8 提供。
 * 用 padding 而非 margin：正文包装器是 UContainer 的第一个子元素，
 * 会命中带 `&:first-child { margin-inline-end: 0 }` 的工具类（伪类特异性更高），
 * margin-right 会被清零。
 * demo 注册在 SSR 期即由 ComponentPlayground 完成（useState 随 payload 下发），
 * 平台档位首屏固定为 web，水合后才恢复用户选择，服务端与客户端首帧一致。
 */
const { isPanelVisible } = useUniDemoPanel();
</script>

<template>
  <UMain class="relative -mt-16 pt-16">
    <div class="bg-gray-1 absolute inset-0 z-[-1]" />
    <!-- 分类导航已并入主顶栏右侧（对齐 Arco header），不再渲染二级 AppHeaderNav -->
    <UContainer>
      <div class="min-w-0 transition-[padding] duration-200" :class="isPanelVisible ? '2xl:pr-[420px]' : undefined">
        <!-- <UPage :key="route.fullPath"> -->
        <UPage :key="route.path" :ui="isRoot ? undefined : threeColUi" :style="isRoot ? undefined : pageStyle">
          <template v-if="!isRoot" #left>
            <!--
              #left 槽只能有一个根节点（UPage 用 Slot 把栅格类合并到它身上），所以按钮与 UPageAside 一起包在这层里。
              这层是栅格单元、高度撑满整行；按钮的 sticky 以它为范围，随页面滚动钉在
              「顶栏以下、侧栏可视区 30% 高度」处（0.7 × 顶栏高 + 30vh），h-0 不占位。
              按钮骑在右缘分隔线上：右缘对齐这层的右边（也就是 UPageAside 的 border-r），再向右平移自身一半。
              ring 是补给暗色的：暗色下 shadow-lg 几乎看不见，按钮底色又与页面同为 gray-1，没有描边就找不到它。
            -->
            <div class="relative">
              <div class="sticky top-[calc(var(--ui-header-height)*0.7+30vh)] z-20 hidden h-0 lg:block">
                <button
                  type="button"
                  class="absolute right-0 flex size-5 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-gray-1 text-primary shadow-lg ring-1 ring-gray-3 transition-colors hover:bg-primary/10"
                  :aria-label="asideCollapsed ? '展开菜单' : '收起菜单'"
                  :title="asideCollapsed ? '展开菜单' : '收起菜单'"
                  @click="toggleAside"
                >
                  <!--
                    两枚图标都渲染、用 v-show 切换，而不是按状态换 name：
                    Nuxt Icon 的 css 模式在图标首次出现时往 head 最前面插一个 style，整页样式随之重算；
                    首屏就把两枚都渲染出来，规则在 SSR 阶段随页面一起下发，切换时就没有注入。
                  -->
                  <Icon v-show="!asideCollapsed" name="line-md:arrow-align-left" class="size-3.5" />
                  <Icon v-show="asideCollapsed" name="line-md:arrow-align-right" class="size-3.5" />
                </button>
              </div>

              <!--
                右内边距固定 24px（主题默认 lg 26px、2xl 20px）：窄轨 5.5rem 扣掉它正好是菜单折叠态的 64px。
                不随折叠切换 class——侧栏是两千多个节点的祖先，换一次 class 就是一次子树样式重算。
                overflow-x 裁掉：折叠时列宽先落定、菜单再花 300ms 收窄，这段时间菜单比列宽，不裁会冒出横向滚动条。
              -->
              <UPageAside class="lg:overflow-x-hidden lg:pe-6 2xl:pr-6">
                <DocsAsideLeftTop />
                <DocsAsideLeftBody />
              </UPageAside>
            </div>
          </template>
          <slot />
        </UPage>
      </div>

      <!-- 右侧移动端 demo 面板：fixed 常驻右缘，置于 :key 之外，路由切换时 iframe 复用；仅 UniApp 档展示 -->
      <DocsMobilePanel />
    </UContainer>
  </UMain>
</template>
