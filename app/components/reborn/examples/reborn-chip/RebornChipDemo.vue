<script setup lang="ts">
import { computed, ref } from "vue";
import { chipColors, chipPositions, chipSizes, chipVariants } from "~/components/reborn/ui/reborn-chip/reborn-chip.config";
import RebornChip from "~/components/reborn/ui/reborn-chip/RebornChip.vue";

/**
 * 角标锚点占位样式：只描边不填充。
 * 角标必须挂在一个宿主元素上才看得出定位效果，这里用虚线框表示"任意宿主"，
 * 既说明了演示语义，又不会在画布上再叠一层背景。
 */
const anchorClass = "border-default rounded-lg border border-dashed";

/** 渲染文本节点的变体，用于在矩阵里区分「圆点类」与「文字类」 */
const textVariants: string[] = ["textDot", "textOutline"];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  variant: "textDot",
  color: "primary",
  size: "md",
  text: "9",
  position: "top-right",
  inset: false,
  show: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础属性",
    children: [
      {
        label: "视觉变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "textDot",
        props: { options: chipVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "颜色主题",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          // Playground 的 select 走 RebornSelect，选项字段是 options（不是 items）
          options: chipColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
        },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: chipSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "标签文本（仅 textDot / textOutline 显示）",
        key: "text",
        component: "input" as const,
        defaultValue: "9",
      },
    ],
  },
  {
    title: "布局与状态",
    children: [
      {
        label: "显示位置",
        key: "position",
        component: "select" as const,
        defaultValue: "top-right",
        props: { options: chipPositions.map((p) => ({ label: p, value: p })) },
      },
      {
        label: "内嵌模式",
        key: "inset",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "显示状态",
        key: "show",
        component: "checkbox" as const,
        defaultValue: true,
      },
    ],
  },
];

/** 演练场右上角的传参明细：完整列出当前所有参数（含默认值） */
const chipCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    `variant="${s.variant}"`,
    `color="${s.color}"`,
    `size="${s.size}"`,
    `text="${s.text}"`,
    `position="${s.position}"`,
    `:inset="${s.inset}"`,
    `:show="${s.show}"`,
  ];
  return `<RebornChip\n  ${props.join("\n  ")}\n>\n  <Icon name="lucide:bell" />\n</RebornChip>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 显隐控制演示：组件内部不会改写 show，由外部按钮切换 */
const hasUnread = ref(true);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="chipCode"
      component-name="RebornChip"
      title="交互演练场"
      description="调节左侧参数，实时查看角标在不同变体、语义色、尺寸与吸附位置下的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex flex-col items-center gap-6">
        <RebornChip
          :variant="state.variant"
          :color="state.color"
          :size="state.size"
          :text="state.text"
          :position="state.position"
          :inset="state.inset"
          :show="state.show"
        >
          <div :class="anchorClass" class="text-dimmed flex size-24 items-center justify-center">
            <Icon name="lucide:bell" class="size-8" />
          </div>
        </RebornChip>
        <DemoNote v-if="!textVariants.includes(state.variant)" tone="dimmed">
          {{ state.variant }} 是纯图形角标，最大外径只有 16px，放不下文字，所以标签文本不显示。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        把宿主元素放进默认插槽，角标默认吸附在右上角。不传 <code>variant</code> 时按 <code>text</code> 自动选择：传了文本是
        <code>textDot</code> 计数角标，不传是 <code>solid</code> 纯圆点。
      </template>
      <DemoBlock layout="row" align="center" class="gap-10">
        <RebornChip text="9">
          <div :class="anchorClass" class="text-dimmed flex size-12 items-center justify-center">
            <Icon name="lucide:bell" class="size-6" />
          </div>
        </RebornChip>

        <RebornChip text="99+" size="lg">
          <div :class="anchorClass" class="text-dimmed flex size-12 items-center justify-center">
            <Icon name="lucide:mail" class="size-6" />
          </div>
        </RebornChip>

        <RebornChip>
          <div :class="anchorClass" class="text-dimmed flex size-12 items-center justify-center">
            <Icon name="lucide:message-circle" class="size-6" />
          </div>
        </RebornChip>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="变体：圆点、圆环与文字角标">
      <template #description>
        <code>variant</code> 有四种取值：<code>solid</code> 实心圆点、<code>outline</code> 空心圆环只表达「有状态」；
        <code>textDot</code> 实心、<code>textOutline</code> 描边两种会渲染 <code>text</code>。描边类变体垫了纸面色底，
        宿主内容不会透过圆环空洞或衬在文字下面。
      </template>
      <DemoBlock layout="row" align="end" class="gap-10">
        <div v-for="v in chipVariants" :key="v" class="flex flex-col items-center gap-4">
          <RebornChip :variant="v" color="error" text="8">
            <div :class="anchorClass" class="size-12" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">{{ v }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="颜色：7 种语义色">
      <template #description>
        <code>color</code> 统一取色阶的 6 阶：<code>solid</code> / <code>textDot</code> 用作底色，<code>outline</code> /
        <code>textOutline</code> 用作描边与文字色，默认 <code>primary</code>。按提醒的紧急程度选色，例如未读与告警用 <code>error</code>。
      </template>
      <DemoBlock layout="stack">
        <div class="w-full overflow-x-auto">
          <div class="grid min-w-max grid-cols-[7rem_repeat(7,4.5rem)] items-center gap-y-8">
            <span />
            <span v-for="c in chipColors" :key="c" class="text-dimmed text-center text-xs font-medium">{{ c }}</span>
            <template v-for="v in chipVariants" :key="v">
              <span class="text-dimmed text-xs font-medium">{{ v }}</span>
              <div v-for="c in chipColors" :key="c" class="flex justify-center">
                <RebornChip :variant="v" :color="c" text="8">
                  <div :class="anchorClass" class="size-10" />
                </RebornChip>
              </div>
            </template>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸：三档">
      <template #description>
        <code>size</code> 只有 <code>sm</code> / <code>md</code> / <code>lg</code> 三档，具体像素随变体不同：圆点直径 4 / 5 / 6px，圆环外径 8 / 12 /
        16px，文字角标高 16 / 20 / 24px、字号比高度小 4px。文字超过一个字符时角标横向撑成胶囊，高度不变。
      </template>
      <DemoBlock layout="stack">
        <div class="w-full overflow-x-auto">
          <div class="grid min-w-max grid-cols-[7rem_repeat(3,6rem)] items-center gap-y-8">
            <span />
            <span v-for="s in chipSizes" :key="s" class="text-dimmed text-center text-xs font-medium">{{ s }}</span>
            <template v-for="v in chipVariants" :key="v">
              <span class="text-dimmed text-xs font-medium">{{ v }}</span>
              <div v-for="s in chipSizes" :key="s" class="flex justify-center">
                <RebornChip :variant="v" :size="s" color="error" :text="textVariants.includes(v) ? '99+' : undefined">
                  <div :class="anchorClass" class="size-12" />
                </RebornChip>
              </div>
            </template>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="位置与内嵌：position 与 inset">
      <template #description>
        <code>position</code> 选择四角之一；默认角标中心压在宿主角上（向外平移半个自身），<code>inset</code> 取消平移，让角标整个落在宿主内部。
      </template>
      <DemoBlock layout="row" align="center" class="gap-10">
        <div v-for="p in chipPositions" :key="p" class="flex flex-col items-center gap-3">
          <RebornChip :position="p" color="error" text="3">
            <div :class="anchorClass" class="size-12" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">{{ p }}</span>
        </div>

        <div v-for="p in chipPositions" :key="`inset-${p}`" class="flex flex-col items-center gap-3">
          <RebornChip :position="p" color="success" size="lg" inset>
            <div :class="anchorClass" class="size-12" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">{{ p }} · inset</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="显隐控制：v-model:show">
      <template #description>
        <code>show</code> 为 <code>false</code> 时不渲染角标节点，宿主内容不受影响；组件自身没有关闭交互，显隐完全由外部赋值驱动。
      </template>
      <DemoBlock layout="row" align="center" class="gap-10">
        <RebornChip v-model:show="hasUnread" text="3" color="error">
          <div :class="anchorClass" class="text-dimmed flex size-12 items-center justify-center">
            <Icon name="lucide:inbox" class="size-6" />
          </div>
        </RebornChip>
        <RebornButton size="sm" color="neutral" variant="outlined" @click="hasUnread = !hasUnread">
          {{ hasUnread ? '标为已读' : '模拟新消息' }}
        </RebornButton>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="组合场景：在线状态、未读圆点与促销标" description="角标叠在头像、图标按钮与操作按钮上，分别表达在线状态、有未读和活动标记。">
      <DemoBlock layout="row" align="center" class="gap-10">
        <div class="flex flex-col items-center gap-3">
          <!-- 头像在线状态：inset 让圆环嵌入圆形边缘内部 -->
          <RebornChip variant="outline" color="success" size="md" inset position="bottom-right">
            <UAvatar src="https://github.com/benjamincanac.png" size="xl" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">在线状态 · <code>outline</code> + <code>inset</code></span>
        </div>

        <div class="flex flex-col items-center gap-3">
          <!-- 未读小红点：不传 text 自动取 solid -->
          <RebornChip color="error" size="lg">
            <RebornButton color="neutral" variant="circle" size="lg">
              <template #leading>
                <Icon name="lucide:mail" class="size-6" />
              </template>
            </RebornButton>
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">未读圆点 · <code>solid</code></span>
        </div>

        <div class="flex flex-col items-center gap-3">
          <RebornChip variant="textOutline" color="warning" text="SALE" size="sm">
            <RebornButton label="立即解锁" color="neutral" variant="filled" />
          </RebornChip>
          <span class="text-dimmed text-xs font-medium">按钮促销标 · <code>textOutline</code></span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
