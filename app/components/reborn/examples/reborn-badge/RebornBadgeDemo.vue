<script setup lang="ts">
import {
  badgeColors,
  badgeSizes,
  badgeVariants,
} from "~/components/reborn/ui/reborn-badge/reborn-badge.config";
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  label: "乐一番",
  color: "primary",
  variant: "filled",
  size: "md",
  closable: false,
  square: false,
  round: false,
  show: true,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容与外观",
    children: [
      { label: "标签文本", key: "label", component: "input" as const, defaultValue: "乐一番" },
      {
        label: "预设色彩",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: badgeColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "视觉风格",
        key: "variant",
        component: "select" as const,
        defaultValue: "filled",
        props: { options: badgeVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: badgeSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
    ],
  },
  {
    title: "状态控制",
    children: [
      { label: "可关闭", key: "closable", component: "checkbox" as const, defaultValue: false },
      { label: "正方形", key: "square", component: "checkbox" as const, defaultValue: false },
      { label: "圆角（round）", key: "round", component: "checkbox" as const, defaultValue: false },
      { label: "显示（v-model:show）", key: "show", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const badgeCode = computed(() => {
  const s = state.value;
  const props: string[] = [`label="${s.label}"`];

  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.variant !== "filled") props.push(`variant="${s.variant}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.closable) props.push("closable");
  if (s.square) props.push("square");
  if (s.round) props.push("round");

  return `<RebornBadge\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 可选中标签演示数据：四种视觉风格各一个 */
const checkTags = ref(
  badgeVariants.map((v, i) => ({
    label: ["热销", "新品", "包邮", "自营"][i] ?? v,
    variant: v as (typeof badgeVariants)[number],
    checked: i === 0,
  })),
);

/** 最近一次 change 事件回显 */
const lastChanged = ref("");

function handleCheckChange(index: number, checked: boolean) {
  const item = checkTags.value[index];
  if (item) lastChanged.value = `${item.label} → ${checked}`;
}

/** 最近一次关闭事件，替代 console 输出 */
const lastClosed = ref("");

function handleClose(label: string) {
  lastClosed.value = label;
}

/**
 * 关闭前的异步校验：返回 false 可阻止本次关闭
 */
function beforeCloseVerify(): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(window.confirm("确定要删除这个标签吗？"));
    }, 500);
  });
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="badgeCode" component-name="RebornBadge" title="交互演练场"
      description="组合色彩、风格与尺寸；勾选「可关闭」后点击叉号会通过 v-model:show 收起徽标。">
      <RebornBadge v-model:show="state.show" :label="state.label" :color="state.color" :variant="state.variant"
        :size="state.size" :closable="state.closable" :square="state.square" :round="state.round" />
    </Playground>

    <DemoSection title="变体矩阵" description="四种视觉风格 × 七种预设色彩，filled 用于强调，outlined 与 subtle 更适合密集列表。">
      <DemoBlock layout="stack">
        <div v-for="v in badgeVariants" :key="v" class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">
            {{ v }} · <code>variant</code>
          </span>
          <div class="flex flex-wrap items-center gap-3">
            <RebornBadge v-for="c in badgeColors" :key="c" :variant="v" :color="c" size="sm" :label="c" />
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="圆角标签" description="round 与按钮组件的圆角形态一致，把徽标变为全圆角胶囊，四种视觉风格均可叠加。">
      <DemoBlock layout="row" align="center">
        <RebornBadge v-for="v in badgeVariants" :key="v" :variant="v" color="primary" round :label="v" />
        <RebornBadge color="success" variant="soft" round closable label="可关闭胶囊" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="可选中标签"
      description="开启 check 后即为类复选框的 Check Tag：点击切换 v-model:checked 并触发 change，未选中时退为灰阶；disabled 可禁用交互。">
      <DemoBlock layout="row" align="center">
        <RebornBadge v-for="(item, index) in checkTags" :key="item.label" v-model:checked="item.checked" check
          :variant="item.variant" color="primary" :label="`${item.variant} · ${item.label}`"
          @change="handleCheckChange(index, $event)" />
        <RebornBadge check disabled variant="soft" color="primary" label="disabled" />
      </DemoBlock>

      <DemoNote tone="dimmed">
        <template v-if="lastChanged">
          最近变更：<code>{{ lastChanged }}</code>
        </template>
        <template v-else> 点击任意标签即可在此看到 <code>change</code> 事件回显。 </template>
      </DemoNote>
    </DemoSection>

    <DemoSection title="图标集成" description="leading 与 trailing 插槽用于放置图标；配合 square 可做成纯图标的方形徽标。">
      <DemoBlock layout="row" align="center">
        <RebornBadge color="primary" variant="soft">
          <template #leading>
            <Icon name="lucide:star" class="size-3.5 fill-current" />
          </template>
          Star
        </RebornBadge>

        <RebornBadge color="success" variant="outlined">
          <template #trailing>
            <Icon name="lucide:check-circle" class="size-3.5" />
          </template>
          Completed
        </RebornBadge>

        <RebornBadge color="error" variant="filled" size="lg" square>
          <template #default="{ ui }">
            <Icon name="lucide:heart" :class="ui.label()" />
          </template>
        </RebornBadge>

        <RebornBadge color="neutral" variant="subtle" size="sm">
          <template #leading>
            <Icon name="lucide:settings" class="size-3" />
          </template>
          Settings
        </RebornBadge>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="关闭交互" description="closable 开启内置关闭按钮；before-close 返回 false 或 Promise<false> 可拦截本次关闭。">
      <DemoBlock layout="row" align="center">
        <RebornBadge color="info" variant="soft" label="可关闭标签" closable @close="handleClose('可关闭标签')" />

        <RebornBadge color="warning" variant="subtle" closable>
          <template #close="{ close }">
            <span class="bg-warning/20 hover:bg-warning/40 rounded-ui-2xs ms-2 cursor-pointer px-1 text-[10px]"
              @click="close">
              HIDE
            </span>
          </template>
          自定义关闭
        </RebornBadge>

        <RebornBadge color="success" variant="filled" label="异步确认关闭" closable :before-close="beforeCloseVerify"
          @close="handleClose('异步确认关闭')" />
      </DemoBlock>

      <DemoNote tone="dimmed">
        <template v-if="lastClosed">
          最近关闭：<code>{{ lastClosed }}</code>
        </template>
        <template v-else> 关闭任意一个徽标即可在此看到 <code>close</code> 事件回显。 </template>
      </DemoNote>
    </DemoSection>

    <DemoSection title="插槽扩展" description="leading 插槽可承载头像、等级角标等任意结构，配合 ui 与 class 微调内边距。">
      <DemoBlock layout="row" align="center">
        <RebornBadge color="neutral" variant="outlined" class="px-1 py-0">
          <template #leading>
            <div
              class="bg-primary text-inverted flex size-6 items-center justify-center rounded-full text-[10px] font-bold">
              A
            </div>
          </template>
          <span class="ms-1">Avatar Support</span>
        </RebornBadge>

        <RebornBadge color="neutral" variant="outlined" label="新品・未开封" size="lg" class="pl-0"
          :ui="{ label: 'text-sm' }">
          <template #leading>
            <div
              class="flex h-full flex-col items-center justify-center bg-linear-to-b from-[#919191] to-[#3C3C3C] px-1 text-white">
              <p class="text-[8px]">N</p>
              <span class="text-[4px]">RANK</span>
            </div>
          </template>
        </RebornBadge>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
