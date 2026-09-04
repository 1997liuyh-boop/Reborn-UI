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

/** 划词菜单：onSelect 的第二个参数带有当前选中的文字 */
const selectionItems: RebornContextMenuItem[] = [
  {
    label: "复制",
    icon: "lucide:copy",
    onSelect: (_event, context) => {
      latestAction.value = `已复制：${context.selectionText}`;
    },
  },
  {
    label: "搜索",
    icon: "lucide:search",
    onSelect: (_event, context) => {
      latestAction.value = `已搜索：${context.selectionText}`;
    },
  },
  {
    label: "高亮标记",
    icon: "lucide:highlighter",
    color: "warning",
    onSelect: (_event, context) => {
      latestAction.value = `已高亮：${context.selectionText}`;
    },
  },
];

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
  <div class="flex w-full flex-col">
    <!-- 交互演练场：Playground 自带标题栏 -->
    <Playground v-model="state" :controls="controls" component-name="RebornContextMenu" :code="playgroundCode"
      title="右键菜单 Playground" description="右键任意目标区域，体验分组、快捷键、危险操作与子菜单展开">
      <template #left>
        <div class="flex w-full flex-col gap-4">
          <div class="flex items-center justify-between">
            <h4 class="text-highlighted text-sm font-semibold">操作回执</h4>
            <span class="bg-success/10 text-success rounded-full px-3 py-1 text-xs font-semibold">Live Feed</span>
          </div>

          <!-- 回执面板本身就是被演示的反馈载体，属规范里唯一允许的那层浅填充 -->
          <div class="bg-elevated rounded-ui-sm flex min-h-24 flex-col gap-3 p-4">
            <div class="text-dimmed flex items-center gap-2 text-[11px] tracking-[0.24em] uppercase">
              <span class="bg-success size-2 animate-pulse rounded-full" />
              Latest Event
            </div>
            <p class="text-default text-sm font-medium">{{ latestAction }}</p>
          </div>

          <ul class="divide-default divide-y">
            <li class="flex items-start gap-3 py-3">
              <Icon name="lucide:mouse-pointer-click" class="text-primary mt-0.5 size-4 shrink-0" />
              <div class="flex flex-col gap-0.5">
                <span class="text-default text-sm font-medium">交互主路径</span>
                <DemoNote class="text-xs">左侧先读反馈，右侧再执行右键操作，视线会更顺。</DemoNote>
              </div>
            </li>
            <li class="flex items-start gap-3 py-3">
              <Icon name="lucide:keyboard" class="text-info mt-0.5 size-4 shrink-0" />
              <div class="flex flex-col gap-0.5">
                <span class="text-default text-sm font-medium">快捷键提示</span>
                <DemoNote class="text-xs"><code>kbds</code> 会直接显示在菜单尾部，适合高频动作。</DemoNote>
              </div>
            </li>
            <li class="flex items-start gap-3 py-3">
              <Icon name="lucide:layers" class="text-muted mt-0.5 size-4 shrink-0" />
              <div class="flex flex-col gap-0.5">
                <span class="text-default text-sm font-medium">两级菜单</span>
                <DemoNote class="text-xs">子菜单悬浮展开，点击叶子节点立即回执。</DemoNote>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <RebornContextMenu :items="items" :size="state.size" :modal="state.modal" :disabled="state.disabled">
        <!-- 右键触发区：只描边不填充，让它可辨认又不形成第二层表面 -->
        <div class="border-default rounded-ui-base flex w-full flex-col gap-5 border border-dashed p-5">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <span class="text-dimmed text-[11px] tracking-[0.24em] uppercase">Scene Focus</span>
              <span class="text-highlighted text-lg font-bold">增长实验主画布</span>
            </div>
            <Icon name="lucide:orbit" class="text-primary size-5" />
          </div>

          <div class="divide-default grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x">
            <div class="flex flex-col gap-1 sm:pr-4">
              <span class="text-dimmed text-[11px] tracking-[0.22em] uppercase">Traffic</span>
              <span class="text-highlighted text-xl font-bold">128.4K</span>
              <span class="text-success text-sm">+18.6%</span>
            </div>
            <div class="flex flex-col gap-1 sm:px-4">
              <span class="text-dimmed text-[11px] tracking-[0.22em] uppercase">Conversion</span>
              <span class="text-highlighted text-xl font-bold">7.82%</span>
              <span class="text-primary text-sm">建议继续放量</span>
            </div>
            <div class="flex flex-col gap-1 sm:pl-4">
              <span class="text-dimmed text-[11px] tracking-[0.22em] uppercase">Status</span>
              <span class="text-highlighted flex items-center gap-2 text-xl font-bold">
                <span class="bg-success size-2 rounded-full" />
                Running
              </span>
              <span class="text-muted text-sm">右键查看更多操作</span>
            </div>
          </div>

          <div class="divide-default flex flex-col divide-y">
            <div class="flex items-center justify-between gap-4 py-3">
              <div class="flex flex-col">
                <span class="text-default text-sm font-semibold">快速发布</span>
                <DemoNote tone="dimmed" class="text-xs">同步推送到预览环境</DemoNote>
              </div>
              <span class="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">Cmd P</span>
            </div>
            <div class="flex items-center justify-between gap-4 py-3">
              <div class="flex flex-col">
                <span class="text-default text-sm font-semibold">分享到团队</span>
                <DemoNote tone="dimmed" class="text-xs">内含设计组与前端组子菜单</DemoNote>
              </div>
              <Icon name="lucide:arrow-up-right" class="text-dimmed size-4" />
            </div>
            <div class="flex items-center justify-between gap-4 py-3">
              <div class="flex flex-col">
                <span class="text-error text-sm font-semibold">删除模块</span>
                <DemoNote tone="dimmed" class="text-xs">高风险动作放在视觉底部</DemoNote>
              </div>
              <span class="bg-error/10 text-error rounded-full px-2.5 py-1 text-xs font-semibold">Del</span>
            </div>
          </div>
        </div>
      </RebornContextMenu>
    </Playground>

    <DemoSection title="划词菜单"
      description="trigger=selection 与浏览器 Selection API 组合：在触发区内选中一段文字，菜单在选区上方居中弹出；onSelect / select 事件的 context.selectionText 为选中的文字，换一段选区会先收起再在新位置展开。">
      <DemoBlock layout="stack">
        <RebornContextMenu v-slot="{ selectionText }" :items="selectionItems" trigger="selection">
          <div class="flex flex-col gap-3">
            <p class="border-default text-default rounded-ui-base border border-dashed p-5 text-sm leading-7 select-text">
              增长实验主画布支持在同一页面内对多个流量分组做 A/B 对比。选中这段文字里的任意片段，
              例如「流量分组」或「A/B 对比」，松开鼠标后会在选区上方弹出操作菜单；点击菜单项时选区不会被清掉，
              回调里可以直接拿到选中的文字用于复制、搜索或标记。
            </p>
            <DemoNote tone="dimmed">当前选区：{{ selectionText || "（尚未选择文字）" }}</DemoNote>
          </div>
        </RebornContextMenu>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="更多用法" description="小尺寸菜单适配二级操作；不传 items 时用 #content 完全自定义菜单面板。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <RebornContextMenu :items="automationItems" size="sm">
          <div class="border-default rounded-ui-base flex flex-col gap-3 border border-dashed p-6">
            <div class="flex items-center justify-between">
              <span class="text-info text-xs font-semibold tracking-[0.24em] uppercase">Automation Board</span>
              <Icon name="lucide:workflow" class="text-info size-5" />
            </div>
            <span class="text-highlighted text-lg font-bold">增长实验自动化</span>
            <DemoNote class="text-sm">用更轻量的尺寸承载二级操作。适合表格行、资源卡片和工作流节点。</DemoNote>
          </div>
        </RebornContextMenu>

        <RebornContextMenu :size="state.size">
          <template #default>
            <div class="border-default rounded-ui-base flex flex-col gap-3 border border-dashed p-6">
              <div class="flex items-center justify-between">
                <span class="text-warning text-xs font-semibold tracking-[0.24em] uppercase">Custom Content</span>
                <Icon name="lucide:palette" class="text-warning size-5" />
              </div>
              <span class="text-highlighted text-lg font-bold">自定义内容插槽</span>
              <DemoNote class="text-sm">如果不传 <code>items</code>，你也可以直接使用 <code>#content</code> 自定义菜单面板。</DemoNote>
            </div>
          </template>

          <template #content="{ close }">
            <div class="flex w-[280px] flex-col gap-4">
              <div class="flex flex-col gap-1">
                <span class="text-warning text-xs tracking-[0.24em] uppercase">Quick Palette</span>
                <span class="text-highlighted text-base font-bold">场景型快捷面板</span>
                <DemoNote class="text-sm">适合插入颜色、状态或轻量业务卡片。</DemoNote>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <button v-for="tone in ['Ocean', 'Glow', 'Sand']" :key="tone"
                  class="border-default rounded-ui-sm hover:border-primary/40 hover:text-primary cursor-pointer border px-3 py-3 text-sm font-semibold transition"
                  @click="latestAction = `已切换主题：${tone}`; close()">
                  {{ tone }}
                </button>
              </div>
            </div>
          </template>
        </RebornContextMenu>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
