<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue';
import { fabColors, fabVariants } from "~/components/reborn/ui/reborn-fab/reborn-fab.config";
import RebornFab from "~/components/reborn/ui/reborn-fab/RebornFab.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 配色选项，直接取自组件配置以保证与实现同步 */
const colorOptions = fabColors.map((c) => ({ label: c, value: c }));

/** UI 变体选项 */
const variantOptions = fabVariants.map((v) => ({ label: v, value: v }));

const directionOptions = [
  { label: "上方", value: "top" },
  { label: "下方", value: "bottom" },
  { label: "左侧", value: "left" },
  { label: "右侧", value: "right" },
];

const positionOptions = [
  { label: "左上 (left-top)", value: "left-top" },
  { label: "右上 (right-top)", value: "right-top" },
  { label: "左下 (left-bottom)", value: "left-bottom" },
  { label: "右下 (right-bottom)", value: "right-bottom" },
];

const triggerOptions = [
  { label: "Click 点击", value: "click" },
  { label: "Hover 悬浮", value: "hover" },
];

const state = ref<Record<string, any>>({
  isActive: false,
  draggable: true,
  color: "primary",
  variant: "float",
  direction: "top",
  position: "right-bottom",
  trigger: "click",
  customCoord: true,
  useTriggerSlot: false,
  expandable: true,
  attract: true,
  peekOnScroll: true,
  disabled: false,
  inactiveIcon: "lucide:plus",
  activeIcon: "lucide:plus",
  divider: true,
  radius: 80,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "核心配置",
    children: [
      {
        label: "UI 变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "float",
        props: { options: variantOptions },
      },
      {
        label: "主题色调",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: colorOptions },
      },
      {
        label: "未展开图标",
        key: "inactiveIcon",
        component: "input" as const,
        defaultValue: "lucide:plus",
        hide: (_: any, s: Record<string, any>) => s.useTriggerSlot,
      },
      {
        label: "展开后图标",
        key: "activeIcon",
        component: "input" as const,
        defaultValue: "lucide:plus",
        hide: (_: any, s: Record<string, any>) => s.useTriggerSlot,
      },
      {
        label: "分割线（仅 capsule）",
        key: "divider",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: any, s: Record<string, any>) => s.useTriggerSlot || s.variant !== "capsule",
      },
      {
        label: "环形半径（仅 circle，px）",
        key: "radius",
        component: "slider" as const,
        defaultValue: 80,
        props: { min: 40, max: 160, step: 4 },
        hide: (_: any, s: Record<string, any>) => s.useTriggerSlot || s.variant !== "circle",
      },
    ],
  },
  {
    title: "状态",
    children: [{ label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false }],
  },
  {
    title: "行为",
    children: [
      { label: "允许拖拽", key: "draggable", component: "checkbox" as const, defaultValue: false },
      { label: "开启展开", key: "expandable", component: "checkbox" as const, defaultValue: true },
      { label: "自动吸边", key: "attract", component: "checkbox" as const, defaultValue: true },
      {
        label: "滚动半隐藏",
        key: "peekOnScroll",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "交互与位置",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "click",
        props: { options: triggerOptions },
      },
      {
        label: "预设位置",
        key: "position",
        component: "select" as const,
        defaultValue: "right-bottom",
        props: { options: positionOptions },
      },
      {
        label: "展开方向",
        key: "direction",
        component: "select" as const,
        defaultValue: "top",
        props: { options: directionOptions },
      },
    ],
  },
  {
    title: "插槽与坐标",
    children: [
      {
        label: "使用自定义触发器插槽",
        key: "useTriggerSlot",
        component: "checkbox" as const,
        defaultValue: false,
      },
      { label: "指定初始坐标", key: "customCoord", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前参数，变体专属的 prop 只在对应变体下出现 */
const fabCode = computed(() => {
  const s = state.value;

  // 自定义触发器示例固定为不可展开，图标与展开方向都不参与
  if (s.useTriggerSlot) {
    const props: string[] = [
      `color="${s.color}"`,
      'position="right-bottom"',
      `trigger="${s.trigger}"`,
      `:disabled="${s.disabled}"`,
      `:draggable="${s.draggable}"`,
      ':expandable="false"',
      `:attract="${s.attract}"`,
      `:peek-on-scroll="${s.peekOnScroll}"`,
      '@click="onClick"',
    ];
    return `<RebornFab\n  ${props.join("\n  ")}\n>\n  <template #trigger>\n    <!-- 自定义触发器 -->\n  </template>\n</RebornFab>`;
  }

  const props: string[] = [
    'v-model="isActive"',
    `variant="${s.variant}"`,
    `color="${s.color}"`,
    `position="${s.position}"`,
    `direction="${s.direction}"`,
    `trigger="${s.trigger}"`,
    `inactive-icon="${s.inactiveIcon}"`,
    `active-icon="${s.activeIcon}"`,
    `:disabled="${s.disabled}"`,
    `:draggable="${s.draggable}"`,
    `:expandable="${s.expandable}"`,
    `:attract="${s.attract}"`,
    `:peek-on-scroll="${s.peekOnScroll}"`,
  ];
  if (s.variant === "capsule") props.push(`:divider="${s.divider}"`);
  if (s.variant === "circle") props.push(`:radius="${s.radius}"`);

  return `<RebornFab\n  ${props.join("\n  ")}\n>\n  <!-- 展开后的操作项 -->\n</RebornFab>`;
});

/** 最近一次点击的操作项，替代 console 输出 */
const lastAction = shallowRef("");

function handleAction(name: string) {
  lastAction.value = name;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="fabCode"
      component-name="RebornFab"
      title="交互演练场"
      description="拖动预览区的悬浮按钮可体验自动吸边；松手后组件会自动选择最优的展开方向。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <template v-if="!state.useTriggerSlot">
          <!-- 悬浮模式：展开为一列/一行图标按钮 -->
          <RebornFab
            v-if="state.variant === 'float'"
            v-model="state.isActive"
            :color="state.color"
            variant="float"
            :disabled="state.disabled"
            :inactive-icon="state.inactiveIcon"
            :active-icon="state.activeIcon"
            :draggable="state.draggable"
            :attract="state.attract"
            :peek-on-scroll="state.peekOnScroll"
            :direction="state.direction"
            :position="state.position"
            :trigger="state.trigger"
            :top="state.customCoord ? '40vh' : undefined"
            :expandable="state.expandable"
            :gap="{ top: 32, bottom: 32, left: 32, right: 32 }"
            :z-index="500"
          >
            <div
              v-for="i in 5"
              :key="i"
              class="bg-success text-success-foreground flex size-12 cursor-pointer items-center justify-center rounded-full transition-all hover:scale-110 hover:rotate-12 active:scale-95"
              @click="handleAction(`悬浮按钮 ${i}`)"
            >
              <Icon
                name="lucide:star"
                class="size-6"
              />
            </div>
          </RebornFab>

          <!-- 胶囊模式：展开为带分隔线的胶囊条 -->
          <RebornFab
            v-else-if="state.variant === 'capsule'"
            v-model="state.isActive"
            :color="state.color"
            variant="capsule"
            :disabled="state.disabled"
            :inactive-icon="state.inactiveIcon"
            :active-icon="state.activeIcon"
            :draggable="state.draggable"
            :attract="state.attract"
            :peek-on-scroll="state.peekOnScroll"
            :direction="state.direction"
            :position="state.position"
            :trigger="state.trigger"
            :top="state.customCoord ? '65vh' : undefined"
            :expandable="state.expandable"
            :divider="state.divider"
            :gap="{ top: 32, bottom: 32, left: 32, right: 32 }"
            :z-index="500"
          >
            <Icon
              v-for="item in 3"
              :key="item"
              name="lucide:share-2"
              class="size-6"
              @click="handleAction(`胶囊按钮 ${item}`)"
            />
          </RebornFab>

          <!-- 环形模式：展开为扇形排列 -->
          <RebornFab
            v-else-if="state.variant === 'circle'"
            v-model="state.isActive"
            :color="state.color"
            variant="circle"
            :disabled="state.disabled"
            :inactive-icon="state.inactiveIcon"
            :active-icon="state.activeIcon"
            :radius="state.radius"
            :draggable="state.draggable"
            :attract="state.attract"
            :peek-on-scroll="state.peekOnScroll"
            :direction="state.direction"
            :position="state.position"
            :trigger="state.trigger"
            :top="state.customCoord ? '20vh' : undefined"
            :expandable="state.expandable"
            :gap="{ top: 32, bottom: 32, left: 32, right: 32 }"
            :z-index="500"
          >
            <div
              v-for="i in 5"
              :key="i"
              class="bg-info text-info-foreground flex size-10 cursor-pointer items-center justify-center rounded-full text-sm font-bold transition-all hover:scale-110 active:scale-95"
              @click="handleAction(`环形按钮 ${i}`)"
            >
              {{ i }}
            </div>
          </RebornFab>
        </template>

        <!-- #trigger 插槽：完全接管触发器的外观 -->
        <RebornFab
          v-else
          position="right-bottom"
          :disabled="state.disabled"
          :draggable="state.draggable"
          :expandable="false"
          :attract="state.attract"
          :peek-on-scroll="state.peekOnScroll"
          :trigger="state.trigger"
          :bottom="state.customCoord ? 150 : undefined"
          :color="state.color"
          :z-index="500"
          @click="handleAction('自定义触发器')"
        >
          <template #trigger>
            <div
              class="from-primary to-info group text-inverted flex cursor-pointer items-center gap-3 rounded-full bg-linear-to-r py-2.5 pr-5 pl-3 transition-all active:scale-95"
            >
              <Icon
                name="lucide:heart"
                class="size-6 fill-current transition-transform group-hover:scale-110"
              />
              <div class="flex flex-col">
                <span class="text-xs leading-tight tracking-tighter opacity-80">Like This</span>
                <span class="text-sm leading-tight font-bold">点个赞吧</span>
              </div>
            </div>
          </template>
        </RebornFab>

        <DemoNote
          v-if="lastAction"
          tone="dimmed"
        >
          最后点击：<code>{{ lastAction }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="拖拽与吸附"
      description="draggable 开启后按钮可自由拖动，attract 则在释放时自动贴合最近的窗口边缘。"
    >
      <DemoNote tone="dimmed">
        <code>gap</code> 决定吸边后与四条边缘的安全距离；<code>peek-on-scroll</code>
        会在页面滚动时把按钮半隐藏到边缘之外，停止滚动后自动复位。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="展开方向"
      description="direction 指定期望的展开方向；当按钮已吸附到边缘时，组件会自动改为向内侧展开以避免溢出。"
    >
      <DemoNote tone="dimmed">
        例如吸附在左边缘时强制向右展开，吸附在顶部边缘时强制向下展开。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义触发器"
      description="通过 #trigger 插槽可完全替换触发器结构，用于渲染带文字的胶囊按钮等复杂形态。"
    >
      <DemoNote tone="dimmed">
        在演练场的「参数修改」里打开「使用自定义触发器插槽」即可查看效果。
      </DemoNote>
    </DemoSection>
  </div>
</template>
