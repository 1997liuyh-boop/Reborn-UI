<script setup lang="ts">
import { ref } from "vue";
import RebornPopover from "~/components/reborn/ui/reborn-popover/RebornPopover.vue";

// --- Playground State ---
const state = ref({
  side: "bottom" as "top" | "bottom" | "left" | "right",
  align: "center" as "start" | "center" | "end",
  mode: "click" as "click" | "hover",
  arrow: true,
  modal: false,
  dismissible: true,
  sideOffset: 12,
});

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
      {
        label: "显示箭头",
        key: "arrow",
        component: "checkbox" as const,
        defaultValue: true,
      },
    ],
  },
  {
    title: "高级配置",
    children: [
      {
        label: "模态模式 (Modal)",
        key: "modal",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "点击外部关闭",
        key: "dismissible",
        component: "checkbox" as const,
        defaultValue: true,
      },
    ],
  },
];

// --- Showcase Data ---
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
  "#f97316", "#eab308", "#22c55e", "#06b6d4"
];

const selectedColor = ref(colors[0]);

const actions = [
  { icon: "lucide:edit-3", label: "编辑项目", color: "text-primary" },
  { icon: "lucide:share-2", label: "分享链接", color: "text-info" },
  { icon: "lucide:copy", label: "复制 ID", color: "text-neutral" },
  { icon: "lucide:trash-2", label: "删除记录", color: "text-error" },
];

</script>

<template>
  <div class="min-h-screen space-y-12 bg-gray-50/50 p-8 dark:bg-gray-950/50">
    <!-- Playground Section -->
    <Playground v-model="state" :controls="controls" component-name="RebornPopover" title="核心交互 Playground"
      description="调节组件属性，实时观察多向定位与复合动画效果。">
      <div class="flex items-center justify-center py-12">
        <RebornPopover :mode="state.mode"
          :content="{ side: state.side, align: state.align, sideOffset: state.sideOffset }" :arrow="state.arrow"
          :modal="state.modal" :dismissible="state.dismissible">
          <RebornButton size="lg" :variant="state.mode === 'hover' ? 'soft' : 'solid'"
            class="min-w-[140px] shadow-lg shadow-primary/20">
            {{ state.mode === 'hover' ? '悬浮体验' : '点击触发' }}
          </RebornButton>

          <template #content>
            <div
              class="w-72 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <div class="bg-primary/5 p-4">
                <div class="flex items-center gap-2 text-primary">
                  <Icon name="lucide:settings-2" class="size-5" />
                  <span class="font-bold">实时配置预览</span>
                </div>
              </div>
              <div class="space-y-3 p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                <p>当前定位：<code
                    class="rounded bg-gray-100 px-1 dark:bg-gray-800">{{ state.side }} - {{ state.align }}</code></p>
                <div class="flex flex-wrap gap-2 pt-2">
                  <RebornBadge v-if="state.arrow" label="Arrow" size="xs" variant="soft" color="info" />
                  <RebornBadge v-if="state.modal" label="Modal" size="xs" variant="soft" color="warning" />
                  <RebornBadge v-if="!state.dismissible" label="Locked" size="xs" variant="soft" color="error" />
                </div>
              </div>
            </div>
          </template>
        </RebornPopover>
      </div>
    </Playground>

    <!-- Showcases -->
    <div class="space-y-8">
      <div class="flex items-center gap-3">
        <div class="h-8 w-1.5 rounded-full bg-primary" />
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
          高级业务场景
        </h3>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">

        <!-- Showcase: User Profile -->
        <div
          class="group relative rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-gray-800 dark:bg-white/5">
          <div class="flex h-full flex-col items-center justify-center space-y-6 p-8">
            <div class="text-center">
              <div class="text-sm font-semibold uppercase tracking-widest text-primary/60">个人资料卡片</div>
              <div class="mt-2 text-xs text-gray-500">点击头像查看详细信息</div>
            </div>

            <RebornPopover :content="{ side: 'top', align: 'center', sideOffset: 16 }" arrow>
              <div class="relative cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95">
                <div
                  class="absolute -inset-2 animate-pulse rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40" />
                <img :src="profile.avatar"
                  class="relative size-24 rounded-full border-4 border-white object-cover shadow-xl dark:border-gray-800" />
              </div>

              <template #content>
                <div class="w-80 overflow-hidden rounded-2xl bg-white shadow-3xl dark:bg-gray-900">
                  <div class="h-20 bg-linear-to-r from-primary to-info" />
                  <div class="px-6 pb-6 mt-[-40px]">
                    <div class="flex items-end justify-between">
                      <img :src="profile.avatar"
                        class="size-20 rounded-2xl border-4 border-white object-cover dark:border-gray-900" />
                      <div class="flex gap-2">
                        <RebornButton size="sm" round variant="soft" color="neutral">Message</RebornButton>
                        <RebornButton size="sm" round color="primary">Follow</RebornButton>
                      </div>
                    </div>
                    <div class="mt-4">
                      <h4 class="text-xl font-bold">{{ profile.name }}</h4>
                      <p class="text-sm text-gray-500">{{ profile.role }}</p>
                    </div>
                    <p class="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-medium">
                      {{ profile.bio }}
                    </p>
                    <div class="mt-6 flex gap-6 divide-x divide-gray-100 dark:divide-gray-800">
                      <div>
                        <div class="text-lg font-bold">{{ profile.followers }}</div>
                        <div class="text-xs text-gray-400">Followers</div>
                      </div>
                      <div class="pl-6">
                        <div class="text-lg font-bold">{{ profile.following }}</div>
                        <div class="text-xs text-gray-400">Following</div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </RebornPopover>
          </div>
        </div>

        <!-- Showcase: Color Picker Grid -->
        <div
          class="group relative rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-gray-800 dark:bg-white/5">
          <div class="flex h-full flex-col items-center justify-center space-y-6 p-8">
            <div class="text-center">
              <div class="text-sm font-semibold uppercase tracking-widest text-primary/60">颜色选取交互</div>
              <div class="mt-2 text-xs text-gray-500">模拟轻量级调色盘</div>
            </div>

            <RebornPopover :content="{ side: 'bottom', align: 'center', sideOffset: 12 }" arrow>
              <div
                class="flex items-center gap-3 rounded-full border border-gray-200 bg-white p-2 pr-4 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-white/5 cursor-pointer">
                <div class="size-8 rounded-full shadow-inner shadow-black/10"
                  :style="{ backgroundColor: selectedColor }" />
                <span class="font-mono text-sm font-medium uppercase tracking-tighter">{{ selectedColor }}</span>
                <Icon name="lucide:chevron-down" class="ml-auto size-4 text-gray-400" />
              </div>

              <template #content>
                <div class="w-48 p-4">
                  <div class="mb-3 text-xs font-bold text-gray-400">SELECT ACCENT</div>
                  <div class="grid grid-cols-4 gap-3">
                    <button v-for="c in colors" :key="c"
                      class="size-8 rounded-lg transition-transform hover:scale-110 active:scale-90"
                      :class="{ 'ring-2 ring-primary ring-offset-2': selectedColor === c }"
                      :style="{ backgroundColor: c }" @click="selectedColor = c" />
                  </div>
                  <RebornButton class="mt-4 w-full" size="sm" variant="soft" color="primary">Confirm Accent
                  </RebornButton>
                </div>
              </template>
            </RebornPopover>
          </div>
        </div>

        <!-- Showcase: Action Menu -->
        <div
          class="group relative rounded-3xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-xl dark:border-gray-800 dark:bg-white/5">
          <div class="flex h-full flex-col items-center justify-center space-y-6 p-8">
            <div class="text-center">
              <div class="text-sm font-semibold uppercase tracking-widest text-primary/60">功能操作列表</div>
              <div class="mt-2 text-xs text-gray-500">适合导航与右键菜单模拟</div>
            </div>

            <RebornPopover :content="{ side: 'right', align: 'start', sideOffset: 12 }" arrow mode="hover">
              <button
                class="flex size-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-all hover:bg-primary/10 hover:text-primary dark:bg-white/5">
                <Icon name="lucide:more-vertical" class="size-7" />
              </button>

              <template #content>
                <div
                  class="w-48 overflow-hidden rounded-xl bg-white py-1 shadow-2xl dark:bg-gray-900 border dark:border-gray-800">
                  <button v-for="action in actions" :key="action.label"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-primary/5 group">
                    <Icon :name="action.icon"
                      :class="['size-4 transition-transform group-hover:scale-110', action.color]" />
                    <span class="font-medium text-gray-700 dark:text-gray-300">{{ action.label }}</span>
                  </button>
                  <div class="mx-2 my-1 border-t border-gray-100 dark:border-gray-800" />
                  <button
                    class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
                    <Icon name="lucide:info" class="size-4" />
                    <span>查看详情</span>
                  </button>
                </div>
              </template>
            </RebornPopover>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
