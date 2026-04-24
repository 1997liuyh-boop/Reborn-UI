<script setup lang="ts">
import { computed, ref } from "vue";
import RebornContextMenu, {
  type RebornContextMenuItem,
} from "~/components/reborn/ui/reborn-context-menu/RebornContextMenu.vue";

const latestAction = ref("等待操作");

const state = ref({
  size: "md" as "sm" | "md" | "lg",
  modal: false,
  disabled: false,
});

const controls = [
  {
    title: "基础配置",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: [
            { label: "SM", value: "sm" },
            { label: "MD", value: "md" },
            { label: "LG", value: "lg" },
          ],
        },
      },
      {
        label: "禁用触发区",
        key: "disabled",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "模态遮罩",
        key: "modal",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];

const playgroundCode = computed(() => {
  const attrs = [
    `:items="items"`,
    `size="${state.value.size}"`,
  ];

  if (state.value.modal) attrs.push("modal");
  if (state.value.disabled) attrs.push("disabled");

  return `<RebornContextMenu ${attrs.join(" ")}>\n  <div class="context-target">右键打开菜单</div>\n</RebornContextMenu>`;
});

const items = computed<RebornContextMenuItem[][]>(() => [
  [
    {
      label: "快速发布",
      description: "同步推送到预览环境",
      icon: "lucide:rocket",
      kbds: ["Cmd", "P"],
      color: "primary",
      onSelect: () => {
        latestAction.value = "已执行：快速发布";
      },
    },
    {
      label: "复制链接",
      icon: "lucide:copy",
      kbds: ["Cmd", "Shift", "C"],
      onSelect: () => {
        latestAction.value = "已执行：复制链接";
      },
    },
    {
      label: "分享到团队",
      description: "打开协同分享面板",
      icon: "lucide:users",
      children: [
        [
          {
            label: "发送到设计组",
            icon: "lucide:pen-tool",
            onSelect: () => {
              latestAction.value = "已执行：发送到设计组";
            },
          },
          {
            label: "发送到前端组",
            icon: "lucide:code-xml",
            onSelect: () => {
              latestAction.value = "已执行：发送到前端组";
            },
          },
        ],
        [
          {
            type: "separator",
          },
          {
            label: "邀请更多成员",
            icon: "lucide:user-plus",
            onSelect: () => {
              latestAction.value = "已执行：邀请更多成员";
            },
          },
        ],
      ],
    },
  ],
  [
    {
      label: "锁定布局",
      icon: "lucide:lock",
      disabled: state.value.disabled,
      onSelect: () => {
        latestAction.value = "已执行：锁定布局";
      },
    },
    {
      label: "删除模块",
      description: "该操作不可撤销",
      icon: "lucide:trash-2",
      kbds: ["Del"],
      color: "error",
      onSelect: () => {
        latestAction.value = "已执行：删除模块";
      },
    },
  ],
]);

const automationItems: RebornContextMenuItem[][] = [
  [
    {
      label: "运行 A/B 试验",
      description: "按当前实验配置推送",
      icon: "lucide:sparkles",
      color: "success",
      onSelect: () => {
        latestAction.value = "已执行：运行 A/B 试验";
      },
    },
    {
      label: "导出周报",
      icon: "lucide:file-down",
      kbds: ["Alt", "E"],
      onSelect: () => {
        latestAction.value = "已执行：导出周报";
      },
    },
  ],
  [
    {
      label: "更多自动化",
      icon: "lucide:bot",
      children: [
        [
          {
            label: "生成摘要",
            icon: "lucide:align-left",
            onSelect: () => {
              latestAction.value = "已执行：生成摘要";
            },
          },
          {
            label: "清理重复数据",
            icon: "lucide:eraser",
            onSelect: () => {
              latestAction.value = "已执行：清理重复数据";
            },
          },
        ],
      ],
    },
  ],
];

</script>

<template>
  <div
    class="min-h-screen space-y-10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(255,255,255,1))] p-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.96),_rgba(3,7,18,1))]">
    <Playground v-model="state" :controls="controls" component-name="RebornContextMenu" :code="playgroundCode"
      title="右键菜单 Playground" description="右键任意目标区域，体验分组、快捷键、危险操作与子菜单展开。">
      <template #left>
        <div
          class="overflow-hidden rounded-[30px] border border-gray-200/70 bg-white/90 p-6 shadow-[0_24px_72px_-36px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs uppercase tracking-[0.26em] text-gray-400">Action Console</div>
              <div class="mt-2 text-2xl font-bold text-gray-950 dark:text-white">操作回执</div>
            </div>
            <div
              class="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              Live Feed
            </div>
          </div>

          <div
            class="mt-6 rounded-[24px] bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,1))] p-5 text-sm leading-7 text-green-300 shadow-inner">
            <div class="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-green-400/80">
              <span class="size-2 rounded-full bg-green-400 animate-pulse" />
              Latest Event
            </div>
            <div class="mt-4 min-h-[76px] font-medium">
              {{ latestAction }}
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <div class="rounded-[22px] border border-primary/15 bg-primary/6 p-4">
              <div class="flex items-start gap-3">
                <Icon name="lucide:mouse-pointer-click" class="mt-0.5 size-5 text-primary" />
                <div>
                  <div class="font-semibold text-gray-950 dark:text-white">交互主路径</div>
                  <div class="mt-1 text-sm leading-6 text-gray-500">
                    左侧先读反馈，右侧再执行右键操作，视线会更顺。
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-[22px] border border-info/15 bg-info/6 p-4">
              <div class="flex items-start gap-3">
                <Icon name="lucide:keyboard" class="mt-0.5 size-5 text-info" />
                <div>
                  <div class="font-semibold text-gray-950 dark:text-white">快捷键提示</div>
                  <div class="mt-1 text-sm leading-6 text-gray-500">
                    `kbds` 会直接显示在菜单尾部，适合高频动作。
                  </div>
                </div>
              </div>
            </div>

            <div
              class="rounded-[20px] border border-gray-200/70 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div class="text-[11px] uppercase tracking-[0.22em] text-gray-400">Menu Depth</div>
              <div class="mt-2 text-xl font-bold text-gray-950 dark:text-white">2 Level</div>
              <div class="mt-1 text-xs text-gray-500">支持子菜单悬浮展开</div>
            </div>
            <div
              class="rounded-[20px] border border-gray-200/70 bg-gray-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div class="text-[11px] uppercase tracking-[0.22em] text-gray-400">Feedback</div>
              <div class="mt-2 text-xl font-bold text-gray-950 dark:text-white">Instant</div>
              <div class="mt-1 text-xs text-gray-500">点击叶子节点立即回执</div>
            </div>
          </div>
        </div>

      </template>

      <RebornContextMenu :items="items" :size="state.size" :modal="state.modal" :disabled="state.disabled" @select.stop>
        <div class="grid w-full gap-4">
          <div class="rounded-[24px] border border-gray-200/70 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs uppercase tracking-[0.24em] text-gray-400">Scene Focus</div>
                <div class="mt-2 text-xl font-bold text-gray-950 dark:text-white">增长实验主画布</div>
              </div>
              <Icon name="lucide:orbit" class="size-5 text-primary" />
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl bg-gray-50/90 p-4 dark:bg-white/5">
                <div class="text-[11px] uppercase tracking-[0.22em] text-gray-400">Traffic</div>
                <div class="mt-2 text-2xl font-bold text-gray-950 dark:text-white">128.4K</div>
                <div class="mt-1 text-sm text-success">+18.6%</div>
              </div>
              <div class="rounded-2xl bg-gray-50/90 p-4 dark:bg-white/5">
                <div class="text-[11px] uppercase tracking-[0.22em] text-gray-400">Conversion</div>
                <div class="mt-2 text-2xl font-bold text-gray-950 dark:text-white">7.82%</div>
                <div class="mt-1 text-sm text-primary">建议继续放量</div>
              </div>
              <div class="rounded-2xl bg-gray-50/90 p-4 dark:bg-white/5">
                <div class="text-[11px] uppercase tracking-[0.22em] text-gray-400">Status</div>
                <div class="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                  <span class="size-2 rounded-full bg-success" />
                  Running
                </div>
                <div class="mt-1 text-sm text-gray-500">右键查看更多操作</div>
              </div>
            </div>
          </div>

          <div
            class="rounded-[24px] border border-gray-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.88))] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
            <div class="text-xs uppercase tracking-[0.24em] text-gray-400">Suggested Actions</div>
            <div class="mt-4 space-y-3">
              <div
                class="flex items-center justify-between rounded-2xl border border-gray-200/70 bg-white/85 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <div class="font-semibold text-gray-950 dark:text-white">快速发布</div>
                  <div class="text-xs text-gray-500">同步推送到预览环境</div>
                </div>
                <div class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Cmd P</div>
              </div>
              <div
                class="flex items-center justify-between rounded-2xl border border-gray-200/70 bg-white/85 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <div>
                  <div class="font-semibold text-gray-950 dark:text-white">分享到团队</div>
                  <div class="text-xs text-gray-500">内含设计组与前端组子菜单</div>
                </div>
                <Icon name="lucide:arrow-up-right" class="size-4 text-gray-400" />
              </div>
              <div class="flex items-center justify-between rounded-2xl border border-error/15 bg-error/6 px-4 py-3">
                <div>
                  <div class="font-semibold text-error">删除模块</div>
                  <div class="text-xs text-gray-500">高风险动作放在视觉底部</div>
                </div>
                <div class="rounded-full bg-error/12 px-2.5 py-1 text-xs font-semibold text-error">Del</div>
              </div>
            </div>
          </div>
        </div>
      </RebornContextMenu>
    </Playground>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <RebornContextMenu :items="automationItems" size="sm">
        <div
          class="group relative overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_-30px_rgba(14,165,233,0.4)] dark:border-white/10 dark:bg-white/5">
          <div
            class="absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.08),transparent_45%,rgba(56,189,248,0.04))]" />
          <div class="relative space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold uppercase tracking-[0.24em] text-info">Automation Board</div>
              <Icon name="lucide:workflow" class="size-5 text-info" />
            </div>
            <div class="text-2xl font-bold text-gray-950 dark:text-white">增长实验自动化</div>
            <p class="text-sm leading-7 text-gray-600 dark:text-gray-300">
              用更轻量的尺寸承载二级操作。适合表格行、资源卡片和工作流节点。
            </p>
          </div>
        </div>
      </RebornContextMenu>

      <RebornContextMenu :size="state.size">
        <template #default>
          <div
            class="overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/85 p-6 dark:border-white/10 dark:bg-white/6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold uppercase tracking-[0.24em] text-warning">Custom Content</div>
                <div class="mt-2 text-2xl font-bold text-gray-950 dark:text-white">自定义内容插槽</div>
              </div>
              <Icon name="lucide:palette" class="size-5 text-warning" />
            </div>
            <p class="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
              如果不传 `items`，你也可以直接使用 `#content` 自定义菜单面板。
            </p>
          </div>
        </template>

        <template #content="{ close }">
          <div class="w-[280px] space-y-4">
            <div class="rounded-2xl bg-linear-to-r from-warning/15 via-orange-400/12 to-primary/10 p-4">
              <div class="text-xs uppercase tracking-[0.24em] text-warning">Quick Palette</div>
              <div class="mt-2 text-lg font-bold text-gray-950 dark:text-white">场景型快捷面板</div>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-300">适合插入颜色、状态或轻量业务卡片。</div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <button v-for="tone in ['Ocean', 'Glow', 'Sand']" :key="tone"
                class="rounded-2xl border border-gray-200/70 px-3 py-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/6 dark:border-white/10 dark:hover:bg-white/8"
                @click="latestAction = `已切换主题：${tone}`; close()">
                {{ tone }}
              </button>
            </div>
          </div>
        </template>
      </RebornContextMenu>
    </div>
  </div>
</template>
