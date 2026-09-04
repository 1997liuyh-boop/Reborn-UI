<script setup lang="ts">
import RebornHeader from "~/components/reborn/ui/reborn-header/RebornHeader.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  title: "Reborn UI",
  toggleSide: "right",
  sticky: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      { label: "站点标题", key: "title", component: "input" as const, defaultValue: "Reborn UI" },
      {
        label: "侧边栏方向",
        key: "toggleSide",
        component: "select" as const,
        defaultValue: "right",
        props: {
          options: [
            { label: "右侧展开", value: "right" },
            { label: "左侧展开", value: "left" },
          ],
        },
      },
      { label: "滚动吸顶", key: "sticky", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const headerCode = computed(() => {
  const s = state.value;
  const props: string[] = [`title="${s.title}"`, 'to="/"'];

  if (s.toggleSide !== "right") props.push(`toggle-side="${s.toggleSide}"`);
  if (s.sticky) props.push("sticky");

  return `<RebornHeader\n  ${props.join("\n  ")}\n>\n  <nav>…</nav>\n  <template #right>…</template>\n  <template #content="{ close }">…</template>\n</RebornHeader>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

/** 中间区域的导航项 */
const links = [
  { label: "入门指南", to: "#" },
  { label: "组件列表", to: "#" },
  { label: "设计规范", to: "#" },
  { label: "GitHub", to: "https://github.com/1997liuyh-boop/Reborn-UI" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="headerCode" component-name="RebornHeader" title="交互演练场"
      description="在下方可滚动的宿主区域内滚动内容，即可观察吸顶行为；窄屏时右上角会出现侧边栏开关。">
      <!-- 宿主区域：仅描边不填充，模拟一个独立的滚动视口 -->
      <div class="border-default rounded-ui-sm relative h-[420px] w-full overflow-y-auto border">
        <RebornHeader :title="state.title" to="/" :toggle-side="state.toggleSide" :sticky="state.sticky">
          <!-- 中间导航：默认插槽 -->
          <nav class="flex items-center gap-8">
            <NuxtLink v-for="link in links" :key="link.label" :to="link.to"
              class="text-muted hover:text-highlighted text-sm font-medium transition-colors">
              {{ link.label }}
              <Icon v-if="link.label === 'GitHub'" name="lucide:external-link" class="ml-1 inline size-3 opacity-50" />
            </NuxtLink>
          </nav>

          <!-- 右侧操作区 -->
          <template #right>
            <div class="flex items-center gap-2">
              <RebornButton size="sm" color="success" variant="circle">
                <Icon name="lucide:search" />
              </RebornButton>
              <RebornButton size="sm" color="secondary" variant="circle">
                <Icon name="lucide:moon" />
              </RebornButton>
              <RebornButton size="sm" class="hidden sm:flex" label="立即体验" />
            </div>
          </template>

          <!-- 移动端侧边栏内容，作用域参数 close 用于关闭弹层 -->
          <template #content="{ close }">
            <div class="flex flex-col gap-4">
              <div class="border-default border-b px-2 py-4">
                <p class="text-dimmed px-2 text-xs font-semibold tracking-wider uppercase">
                  导航页面
                </p>
                <nav class="mt-4 flex flex-col gap-1">
                  <NuxtLink v-for="link in links" :key="link.label" :to="link.to"
                    class="text-default hover:text-highlighted rounded-ui-sm px-3 py-2 text-base font-medium transition-colors"
                    @click="close">
                    {{ link.label }}
                  </NuxtLink>
                </nav>
              </div>

              <div class="px-2">
                <RebornButton block label="登录账户" @click="close" />
              </div>
            </div>
          </template>
        </RebornHeader>

        <!-- 占位内容：制造足够的滚动高度以观察吸顶 -->
        <div class="flex flex-col gap-4 p-6">
          <p class="text-muted text-sm">
            向下滚动这块区域，{{ state.sticky ? "顶栏将保持吸顶" : "顶栏会随内容一起滚走" }}。
          </p>
          <div v-for="i in 6" :key="i" class="border-default rounded-ui-sm h-32 shrink-0 border border-dashed" />
        </div>
      </div>
    </Playground>

    <DemoSection title="插槽结构" description="顶栏分为左、中、右三个区域，默认插槽填充中间导航，#right 承载操作按钮，#content 则是窄屏侧边栏的内容。">
      <DemoNote tone="dimmed">
        <code>toggle-side</code> 决定侧边栏从哪一侧滑出；<code>auto-close</code> 控制点击内部链接后是否自动收起；
        <code>before-toggle</code> 可返回 <code>false</code> 阻止本次开合，适合做未保存提示。
      </DemoNote>
    </DemoSection>
  </div>
</template>
