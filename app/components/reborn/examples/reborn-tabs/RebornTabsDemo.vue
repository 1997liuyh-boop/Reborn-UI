<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "~/components/reborn/ui/reborn-tabs";
import { tabsTypes, tabsVariants, tabsSizes, tabsOrientations } from "~/components/reborn/ui/reborn-tabs/reborn-tabs.config";
import type { TabsProps } from "~/components/reborn/ui/reborn-tabs/TabsRoot.vue";

/** 演练场绑定值 */
const state = ref({
  type: "line" as TabsProps["type"],
  variant: "primary" as TabsProps["variant"],
  size: "md" as TabsProps["size"],
  orientation: "horizontal" as TabsProps["orientation"],
  sticky: false,
  shrink: false,
  swipeable: false,
  scrollspy: false,
});

const playgroundIndex = ref(0);
const scrollIndex = ref(0);
const customIndicatorIndex = ref(0);
const lastClick = ref("");
const manyTabs = Array.from({ length: 20 }, (_, i) => `标签 ${i + 1}`);

function onTabClick(val: number) {
  lastClick.value = `标签 ${val + 1}`;
}

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "类型",
        key: "type",
        component: "select" as const,
        defaultValue: "line",
        props: { options: tabsTypes.map((t) => ({ label: t, value: t })) },
      },
      {
        label: "风格",
        key: "variant",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: tabsVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: tabsSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "方向",
        key: "orientation",
        component: "select" as const,
        defaultValue: "horizontal",
        props: { options: tabsOrientations.map((o) => ({ label: o, value: o })) },
      },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "吸顶", key: "sticky", component: "checkbox" as const, defaultValue: false },
      { label: "收缩", key: "shrink", component: "checkbox" as const, defaultValue: false },
      { label: "滚动监听", key: "scrollspy", component: "checkbox" as const, defaultValue: false },
      { label: "滑动切换", key: "swipeable", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornTabs"
      title="交互演练场"
      description="切换类型、风格、尺寸与方向；吸顶 / 滚动监听需要在下方可滚动容器里验证。"
    >
      <TabsRoot
        v-model:active="playgroundIndex"
        :type="state.type"
        :variant="state.variant"
        :size="state.size"
        :orientation="state.orientation"
        :shrink="state.shrink"
        @click-tab="onTabClick"
        class="w-full"
      >
        <TabsList>
          <TabsTrigger :index="0">账户</TabsTrigger>
          <TabsTrigger :index="1">密码</TabsTrigger>
          <TabsTrigger :index="2">设置</TabsTrigger>
          <TabsTrigger
            :index="3"
            disabled
          >
            账单
          </TabsTrigger>
        </TabsList>
        <TabsContent :index="0">
          <p class="text-muted mt-3 text-sm">账户信息</p>
        </TabsContent>
        <TabsContent :index="1">
          <p class="text-muted mt-3 text-sm">修改密码</p>
        </TabsContent>
        <TabsContent :index="2">
          <p class="text-muted mt-3 text-sm">用户设置</p>
        </TabsContent>
        <TabsContent :index="3">
          <p class="text-muted mt-3 text-sm">账单详情</p>
        </TabsContent>
      </TabsRoot>
    </Playground>

    <DemoSection
      title="可滚动容器"
      description="吸顶、滚动监听需要一段可滚动内容才说得清；inset 是规范允许的那一层演示体。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="flex h-[420px] min-h-0 flex-col overflow-hidden">
          <TabsRoot
            v-model:active="scrollIndex"
            :type="state.type"
            :variant="state.variant"
            :size="state.size"
            :orientation="state.orientation"
            :sticky="state.sticky"
            :shrink="state.shrink"
            :scrollspy="state.scrollspy"
            :swipeable="state.swipeable"
            @click-tab="onTabClick"
            class="flex min-h-0 flex-1 flex-col"
          >
            <TabsList>
              <TabsTrigger
                v-for="(tab, index) in manyTabs"
                :key="tab"
                :index="index"
              >
                {{ tab }}
              </TabsTrigger>
            </TabsList>
            <div class="min-h-0 flex-1 overflow-y-auto">
              <TabsContent
                v-for="(tab, index) in manyTabs"
                :key="tab"
                :index="index"
              >
                <div class="min-h-[360px] py-4">
                  <p class="text-highlighted text-sm font-medium">{{ tab }} 内容</p>
                  <p class="text-muted mt-2 text-sm">
                    当前展示 {{ tab }}。{{ state.sticky ? "向下滚动可观察吸顶。" : "" }}
                  </p>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
        <DemoNote
          v-if="lastClick"
          tone="dimmed"
        >
          最近点击：{{ lastClick }} · 当前索引 {{ scrollIndex }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义指示器"
      description="#indicator 插槽拿到 style，可完全接管下划线外观。"
    >
      <DemoBlock layout="stack">
        <TabsRoot
          v-model:active="customIndicatorIndex"
          type="line"
        >
          <TabsList>
            <TabsTrigger :index="0">首页</TabsTrigger>
            <TabsTrigger :index="1">产品</TabsTrigger>
            <TabsTrigger :index="2">关于</TabsTrigger>
            <template #indicator="{ style }">
              <span
                :style="style"
                class="absolute bottom-0 left-0 h-0.5 rounded-full bg-linear-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
                aria-hidden="true"
              />
            </template>
          </TabsList>
          <TabsContent :index="0">
            <p class="text-muted mt-3 text-sm">首页内容</p>
          </TabsContent>
          <TabsContent :index="1">
            <p class="text-muted mt-3 text-sm">产品列表</p>
          </TabsContent>
          <TabsContent :index="2">
            <p class="text-muted mt-3 text-sm">关于我们</p>
          </TabsContent>
        </TabsRoot>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
