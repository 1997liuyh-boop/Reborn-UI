<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { fabColors, fabVariants } from "~/components/reborn/ui/reborn-fab/reborn-fab.config";
import RebornFab from "~/components/reborn/ui/reborn-fab/RebornFab.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────
// 悬浮按钮固定在视口上，整页只放演练场这一个实例；下面各节用「套用到演练场」切换它的配置，
// 每节各挂一个的话，页面上会同时浮着好几个按钮。

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

/** 初值与下方控件的 defaultValue 一致，点「重置配置」回到的就是首屏看到的样子 */
const state = ref<Record<string, any>>({
  isActive: false,
  draggable: false,
  color: "primary",
  variant: "float",
  direction: "top",
  position: "right-bottom",
  trigger: "click",
  customCoord: true,
  useTriggerSlot: false,
  expandable: true,
  attract: true,
  peekOnScroll: false,
  disabled: false,
  inactiveIcon: "lucide:plus",
  activeIcon: "lucide:plus",
  divider: false,
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
      { label: "滚动半隐藏", key: "peekOnScroll", component: "checkbox" as const, defaultValue: false },
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
      { label: "指定初始坐标（距顶 40vh）", key: "customCoord", component: "checkbox" as const, defaultValue: true },
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
      `position="${s.position}"`,
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
  if (s.customCoord) props.push('top="40vh"');
  if (s.variant === "capsule") props.push(`:divider="${s.divider}"`);
  if (s.variant === "circle") props.push(`:radius="${s.radius}"`);
  if (!s.expandable) props.push('@click="onClick"');

  return `<RebornFab\n  ${props.join("\n  ")}\n>\n  <!-- 展开后的操作项 -->\n</RebornFab>`;
});

/** 悬浮 / 环形变体的操作项：图标 + 读屏名称 */
const actions = [
  { name: "分享", icon: "lucide:share-2" },
  { name: "收藏", icon: "lucide:star" },
  { name: "编辑", icon: "lucide:pencil" },
  { name: "评论", icon: "lucide:message-circle" },
  { name: "回到顶部", icon: "lucide:arrow-up" },
];

/** 胶囊变体放三项，横排不至于太长 */
const capsuleActions = actions.slice(0, 3);

/** 最近一次交互，作为事件回显 */
const lastAction = shallowRef("");
const clickCount = shallowRef(0);

function handleAction(name: string) {
  lastAction.value = name;
}

/** 不可展开时主按钮直接触发 click */
function handleTriggerClick() {
  clickCount.value++;
  lastAction.value = `主按钮 click（第 ${clickCount.value} 次）`;
}

/** 各节的「套用到演练场」：只改与该能力有关的参数，其余保持演练场当前值 */
function applyPreset(preset: Record<string, any>, note: string) {
  state.value = { ...state.value, isActive: false, ...preset };
  lastAction.value = note;
}

/** 坐标描述，方便在回显里看出按钮被摆到了哪 */
const coordNote = computed(() => (state.value.customCoord ? "距顶 40vh" : `预设 ${state.value.position}`));
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="fabCode"
      component-name="RebornFab"
      title="交互演练场"
      description="悬浮按钮固定在视口上（默认在页面右侧），点「参数修改」调节后按钮实时变化；开启拖拽可拖到任意位置体验吸边。"
    >
      <div class="flex w-full flex-col items-center gap-3 text-center">
        <template v-if="!state.useTriggerSlot">
          <!-- 悬浮模式：展开为一列 / 一行图标按钮 -->
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
            :z-index="500"
            @click="handleTriggerClick"
          >
            <button
              v-for="item in actions"
              :key="item.name"
              type="button"
              :aria-label="item.name"
              :title="item.name"
              class="flex size-11 cursor-pointer items-center justify-center rounded-full bg-gray-1 text-primary shadow-md ring-1 ring-gray-3 transition-transform hover:scale-110 active:scale-95"
              @click="handleAction(item.name)"
            >
              <Icon :name="item.icon" class="size-5" />
            </button>
          </RebornFab>

          <!-- 胶囊模式：操作项嵌在胶囊里，可配分割线 -->
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
            :top="state.customCoord ? '40vh' : undefined"
            :expandable="state.expandable"
            :divider="state.divider"
            :z-index="500"
            @click="handleTriggerClick"
          >
            <button
              v-for="item in capsuleActions"
              :key="item.name"
              type="button"
              :aria-label="item.name"
              :title="item.name"
              class="flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/20"
              @click="handleAction(item.name)"
            >
              <Icon :name="item.icon" class="size-5" />
            </button>
          </RebornFab>

          <!-- 环形模式：操作项绕主按钮排开 -->
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
            :top="state.customCoord ? '40vh' : undefined"
            :expandable="state.expandable"
            :z-index="500"
            @click="handleTriggerClick"
          >
            <button
              v-for="item in actions"
              :key="item.name"
              type="button"
              :aria-label="item.name"
              :title="item.name"
              class="flex size-10 cursor-pointer items-center justify-center rounded-full bg-gray-1 text-primary shadow-md ring-1 ring-gray-3 transition-transform hover:scale-110 active:scale-95"
              @click="handleAction(item.name)"
            >
              <Icon :name="item.icon" class="size-4.5" />
            </button>
          </RebornFab>
        </template>

        <!-- #trigger 插槽：完全接管触发器的外观 -->
        <RebornFab
          v-else
          :position="state.position"
          :disabled="state.disabled"
          :draggable="state.draggable"
          :expandable="false"
          :attract="state.attract"
          :peek-on-scroll="state.peekOnScroll"
          :trigger="state.trigger"
          :top="state.customCoord ? '40vh' : undefined"
          :color="state.color"
          :z-index="500"
          @click="handleTriggerClick"
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

        <DemoNote tone="dimmed" class="font-mono text-xs">
          variant: '{{ state.useTriggerSlot ? '#trigger' : state.variant }}'，位置：{{ coordNote }}，展开：{{ state.isActive }}
        </DemoNote>
        <DemoNote v-if="lastAction" tone="dimmed">
          最近一次：<code>{{ lastAction }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="基础用法（点击直触发）"
      description="expandable 为 false 时点击主按钮直接触发 click，不展开面板；position 设定四角位置，color 控制主题色。"
    >
      <div class="flex flex-wrap items-center gap-3">
        <RebornButton
          size="sm" variant="soft"
          @click="applyPreset({ useTriggerSlot: false, variant: 'float', expandable: false }, '已切到点击直触发：点页面右侧的按钮会在这里计数')"
        >
          套用到演练场
        </RebornButton>
        <RebornButton
          size="sm" variant="outlined"
          @click="applyPreset({ useTriggerSlot: true }, '已换成 #trigger 插槽：自定义触发器同样只触发 click')"
        >
          换成自定义触发器
        </RebornButton>
      </div>
      <DemoNote tone="dimmed">
        <code>#trigger</code> 插槽可以完全替换主按钮的结构，适合带文字的胶囊入口；替换后组件仍负责定位、拖拽与 click 事件。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="展开动作面板"
      description="开启 expandable 后点按切换展开，v-model 绑定展开状态，direction 控制展开方向。"
    >
      <div class="flex flex-wrap items-center gap-3">
        <RebornButton
          v-for="dir in directionOptions"
          :key="dir.value"
          size="sm"
          :variant="state.expandable && !state.useTriggerSlot && state.variant === 'float' && state.direction === dir.value ? 'filled' : 'soft'"
          @click="applyPreset({ useTriggerSlot: false, variant: 'float', expandable: true, direction: dir.value }, `已切到向${dir.label}展开`)"
        >
          向{{ dir.label }}
        </RebornButton>
        <RebornButton
          size="sm" variant="outlined" :disabled="!state.expandable || state.useTriggerSlot"
          @click="state.isActive = !state.isActive"
        >
          {{ state.isActive ? '用 v-model 收起' : '用 v-model 展开' }}
        </RebornButton>
      </div>
      <DemoNote tone="dimmed">
        <code>v-model</code> 是展开状态的唯一来源：右边的按钮直接改绑定值，页面上的悬浮按钮跟着展开或收起。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="拖拽吸边与滚动半隐藏"
      description="draggable 开启拖拽，松手后吸附最近的左右屏幕边并按剩余空间切换展开方向；peekOnScroll 让按钮在滚动时贴边半隐藏。"
    >
      <div class="flex flex-wrap items-center gap-3">
        <RebornButton
          size="sm" variant="soft"
          @click="applyPreset({ useTriggerSlot: false, draggable: true, attract: true, peekOnScroll: true }, '已开启拖拽与滚动半隐藏：拖动按钮或滚动页面试试')"
        >
          套用到演练场
        </RebornButton>
      </div>
      <DemoNote tone="dimmed">
        吸附在左边缘时向右展开、吸附在右边缘时向左展开，避免面板伸出视口；<code>gap</code> 决定吸边后与四条边缘的安全距离，滚动停止约 1s 后按钮复位。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="变体与环形布局（Web）"
      description="variant 支持 float、capsule、circle 三种形态；circle 用 radius / startAngle / totalAngle 调整半径与角度。"
    >
      <div class="flex flex-wrap items-center gap-3">
        <RebornButton
          v-for="v in fabVariants"
          :key="v"
          size="sm"
          :variant="!state.useTriggerSlot && state.variant === v ? 'filled' : 'soft'"
          @click="applyPreset({ useTriggerSlot: false, expandable: true, variant: v, divider: v === 'capsule', direction: v === 'capsule' ? 'left' : state.direction }, `已切到 ${v} 变体`)"
        >
          {{ v }}
        </RebornButton>
      </div>
      <DemoNote tone="dimmed">
        胶囊变体的操作项嵌在同一条胶囊里，横向展开（向左 / 向右）最常用；环形变体在演练场的「参数修改」里还能拖动半径。
      </DemoNote>
    </DemoSection>
  </div>
</template>
