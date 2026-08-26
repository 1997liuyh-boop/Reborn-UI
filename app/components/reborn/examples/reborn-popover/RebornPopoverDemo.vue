<script setup lang="ts">
import { ref } from "vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref({
  side: "bottom" as "top" | "bottom" | "left" | "right",
  align: "center" as "start" | "center" | "end",
  mode: "click" as "click" | "hover",
  arrow: true,
  modal: false,
  dismissible: true,
  sideOffset: 12,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "位置与对齐",
    children: [
      {
        label: "显示方位",
        key: "side",
        component: "select" as const,
        defaultValue: "bottom",
        props: {
          options: [
            { label: "Top (顶部)", value: "top" },
            { label: "Bottom (底部)", value: "bottom" },
            { label: "Left (左侧)", value: "left" },
            { label: "Right (右侧)", value: "right" },
          ],
        },
      },
      {
        label: "对齐方式",
        key: "align",
        component: "select" as const,
        defaultValue: "center",
        props: {
          options: [
            { label: "Start (对齐起点)", value: "start" },
            { label: "Center (居中)", value: "center" },
            { label: "End (对齐终点)", value: "end" },
          ],
        },
      },
      {
        label: "偏移距离",
        key: "sideOffset",
        component: "slider" as const,
        defaultValue: 12,
        props: { min: 0, max: 40, step: 1 },
      },
    ],
  },
  {
    title: "交互行为",
    children: [
      {
        label: "触发模式",
        key: "mode",
        component: "select" as const,
        defaultValue: "click",
        props: {
          options: [
            { label: "Click (点击)", value: "click" },
            { label: "Hover (悬停)", value: "hover" },
          ],
        },
      },
      { label: "显示箭头", key: "arrow", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "高级配置",
    children: [
      { label: "模态模式 (Modal)", key: "modal", component: "checkbox" as const, defaultValue: false },
      { label: "点击外部关闭", key: "dismissible", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

// ─── 场景演示数据 ───────────────────────────────────────────────

const profile = {
  name: "Antigravity AI",
  role: "Senior Code Architect",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100",
  followers: "12.5k",
  following: "482",
  bio: "专注构建具有生命力的 UI 系统，用代码探索设计的边界。",
};

const colors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

const selectedColor = ref(colors[0]);

const actions = [
  { icon: "lucide:edit-3", label: "编辑项目", color: "text-primary" },
  { icon: "lucide:share-2", label: "分享链接", color: "text-info" },
  { icon: "lucide:copy", label: "复制 ID", color: "text-muted" },
  { icon: "lucide:trash-2", label: "删除记录", color: "text-error" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornPopover"
      title="交互演练场"
      description="调节方位、对齐与触发方式，实时观察浮层的定位与出入场动画。"
    >
      <RebornPopover
        :mode="state.mode"
        :content="{ side: state.side, align: state.align, sideOffset: state.sideOffset }"
        :arrow="state.arrow"
        :modal="state.modal"
        :dismissible="state.dismissible"
      >
        <RebornButton
          size="lg"
          :variant="state.mode === 'hover' ? 'soft' : 'solid'"
          :label="state.mode === 'hover' ? '悬浮体验' : '点击触发'"
          class="min-w-[140px]"
        />

        <!-- 浮层自带表面样式（bg + border + rounded），内容区不再叠盒子 -->
        <template #content>
          <div class="w-64 space-y-3">
            <div class="text-primary flex items-center gap-2 font-bold">
              <Icon
                name="lucide:settings-2"
                class="size-5"
              />
              <span>实时配置预览</span>
            </div>
            <p class="text-muted text-sm leading-relaxed">
              当前定位：<code>{{ state.side }} - {{ state.align }}</code>
            </p>
            <div class="flex flex-wrap gap-2">
              <RebornBadge
                v-if="state.arrow"
                label="Arrow"
                size="xs"
                variant="soft"
                color="info"
              />
              <RebornBadge
                v-if="state.modal"
                label="Modal"
                size="xs"
                variant="soft"
                color="warning"
              />
              <RebornBadge
                v-if="!state.dismissible"
                label="Locked"
                size="xs"
                variant="soft"
                color="error"
              />
            </div>
          </div>
        </template>
      </RebornPopover>
    </Playground>

    <DemoSection
      title="典型场景"
      description="浮层内容完全由 #content 插槽决定，可承载资料卡、调色盘、操作菜单等复合交互。"
    >
      <DemoBlock layout="grid" align="center">
        <!-- 场景一：个人资料卡 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">个人资料卡 · 点击头像</span>
          <RebornPopover
            :content="{ side: 'top', align: 'center', sideOffset: 16 }"
            arrow
          >
            <img
              :src="profile.avatar"
              class="border-default size-20 cursor-pointer rounded-full border object-cover transition-transform duration-300 hover:scale-105 active:scale-95"
            >

            <template #content>
              <div class="w-72 space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <img
                    :src="profile.avatar"
                    class="rounded-ui-md size-16 object-cover"
                  >
                  <div class="flex gap-2">
                    <RebornButton
                      size="sm"
                      variant="soft"
                      color="neutral"
                      label="Message"
                    />
                    <RebornButton
                      size="sm"
                      color="primary"
                      label="Follow"
                    />
                  </div>
                </div>
                <div>
                  <h4 class="text-highlighted text-lg font-bold">{{ profile.name }}</h4>
                  <p class="text-muted text-sm">{{ profile.role }}</p>
                </div>
                <p class="text-muted text-sm leading-relaxed">{{ profile.bio }}</p>
                <div class="divide-default flex gap-6 divide-x">
                  <div>
                    <div class="text-highlighted text-lg font-bold">{{ profile.followers }}</div>
                    <div class="text-dimmed text-xs">Followers</div>
                  </div>
                  <div class="pl-6">
                    <div class="text-highlighted text-lg font-bold">{{ profile.following }}</div>
                    <div class="text-dimmed text-xs">Following</div>
                  </div>
                </div>
              </div>
            </template>
          </RebornPopover>
        </div>

        <!-- 场景二：轻量调色盘 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">轻量调色盘 · 点击色块</span>
          <RebornPopover
            :content="{ side: 'bottom', align: 'center', sideOffset: 12 }"
            arrow
          >
            <div
              class="border-default hover:border-primary flex cursor-pointer items-center gap-3 rounded-full border p-2 pr-4 transition-colors"
            >
              <span
                class="size-8 rounded-full"
                :style="{ backgroundColor: selectedColor }"
              />
              <span class="font-mono text-sm font-medium tracking-tighter uppercase">{{ selectedColor }}</span>
              <Icon
                name="lucide:chevron-down"
                class="text-dimmed ml-auto size-4"
              />
            </div>

            <template #content>
              <div class="w-44 space-y-3">
                <div class="text-dimmed text-xs font-bold tracking-wider uppercase">Select accent</div>
                <div class="grid grid-cols-4 gap-2">
                  <button
                    v-for="c in colors"
                    :key="c"
                    type="button"
                    class="rounded-ui-2xs size-8 transition-transform hover:scale-110 active:scale-90"
                    :class="{ 'ring-primary ring-2 ring-offset-2': selectedColor === c }"
                    :style="{ backgroundColor: c }"
                    @click="selectedColor = c"
                  />
                </div>
                <RebornButton
                  class="w-full"
                  size="sm"
                  variant="soft"
                  color="primary"
                  label="Confirm accent"
                />
              </div>
            </template>
          </RebornPopover>
        </div>

        <!-- 场景三：悬停操作菜单 -->
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">操作菜单 · <code>mode="hover"</code></span>
          <RebornPopover
            :content="{ side: 'right', align: 'start', sideOffset: 12 }"
            arrow
            mode="hover"
          >
            <RebornButton
              color="neutral"
              variant="circle"
              size="lg"
            >
              <template #leading>
                <Icon
                  name="lucide:more-vertical"
                  class="size-6"
                />
              </template>
            </RebornButton>

            <template #content>
              <div class="divide-default flex w-44 flex-col divide-y">
                <div class="flex flex-col">
                  <button
                    v-for="action in actions"
                    :key="action.label"
                    type="button"
                    class="rounded-ui-2xs group hover:bg-primary/5 flex w-full items-center gap-3 px-2 py-2 text-left text-sm transition-colors"
                  >
                    <Icon
                      :name="action.icon"
                      :class="['size-4 transition-transform group-hover:scale-110', action.color]"
                    />
                    <span class="text-muted font-medium">{{ action.label }}</span>
                  </button>
                </div>
                <button
                  type="button"
                  class="rounded-ui-2xs text-dimmed hover:bg-primary/5 mt-1 flex w-full items-center gap-3 px-2 py-2 text-left text-sm transition-colors"
                >
                  <Icon
                    name="lucide:info"
                    class="size-4"
                  />
                  <span>查看详情</span>
                </button>
              </div>
            </template>
          </RebornPopover>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
