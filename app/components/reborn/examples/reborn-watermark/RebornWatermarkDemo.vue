<script setup lang="ts">
import RebornWatermark from "~/components/reborn/ui/reborn-watermark/RebornWatermark.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  content: "Reborn UI Premium",
  rotate: -22,
  gapX: 100,
  gapY: 100,
  fontSize: 16,
  color: "rgba(0, 0, 0, 0.15)",
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "内容",
    children: [
      {
        label: "水印文本",
        key: "content",
        component: "input" as const,
        defaultValue: "Reborn UI Premium",
        props: { placeholder: "输入水印文字" },
      },
      {
        label: "文本颜色",
        key: "color",
        component: "input" as const,
        defaultValue: "rgba(0, 0, 0, 0.15)",
        props: { placeholder: "rgba(0,0,0,0.15)" },
      },
    ],
  },
  {
    title: "排布",
    children: [
      {
        label: "旋转角度 (°)",
        key: "rotate",
        component: "slider" as const,
        defaultValue: -22,
        props: { min: -180, max: 180, step: 1 },
      },
      {
        label: "横向间距 (px)",
        key: "gapX",
        component: "slider" as const,
        defaultValue: 100,
        props: { min: 0, max: 300, step: 5 },
      },
      {
        label: "纵向间距 (px)",
        key: "gapY",
        component: "slider" as const,
        defaultValue: 100,
        props: { min: 0, max: 300, step: 5 },
      },
      {
        label: "字体大小 (px)",
        key: "fontSize",
        component: "slider" as const,
        defaultValue: 16,
        props: { min: 10, max: 48, step: 1 },
      },
    ],
  },
];

/** 水印字体配置，由演练场状态派生 */
const font = computed(() => ({
  color: state.value.color,
  fontSize: state.value.fontSize,
  fontWeight: "600",
}));

/** 水印间距，组件要求 [横向, 纵向] 元组 */
const gap = computed(() => [state.value.gapX, state.value.gapY] as [number, number]);

/** 演练场右上角展示的等价代码 */
const watermarkCode = computed(() => {
  const s = state.value;
  return `<RebornWatermark
  content="${s.content}"
  :rotate="${s.rotate}"
  :gap="[${s.gapX}, ${s.gapY}]"
  :font="{ color: '${s.color}', fontSize: ${s.fontSize}, fontWeight: '600' }"
>
  <!-- 被保护的内容 -->
</RebornWatermark>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

/** 薪资单明细行 */
const payrollRows = [
  { label: "基本工资", amount: "¥ 22,000.00", accent: false },
  { label: "绩效奖金", amount: "¥ 6,000.00", accent: false },
  { label: "全勤补助", amount: "+ ¥ 450.00", accent: true },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="watermarkCode"
      component-name="RebornWatermark"
      title="交互演练场"
      description="调节文本、角度与间距，实时观察水印在文档上的铺陈效果。"
    >
      <RebornWatermark
        class="w-full"
        :content="state.content"
        :rotate="state.rotate"
        :gap="gap"
        :font="font"
        :z-index="9"
      >
        <!-- 被水印覆盖的文档本体：只描边不填充，画布已是唯一表面 -->
        <div class="border-default rounded-ui-md mx-auto flex w-full max-w-2xl flex-col gap-10 border p-6 md:p-10">
          <div class="flex items-start justify-between gap-6">
            <div class="flex flex-col gap-2">
              <Icon
                name="lucide:file-text"
                class="text-primary size-7"
              />
              <h4 class="text-highlighted mt-2 text-2xl font-bold">薪资确认单</h4>
              <p class="text-dimmed text-sm">编号: INV-2024-00129</p>
            </div>
            <div class="text-right">
              <p class="text-primary text-3xl font-black">¥ 28,450.00</p>
              <p class="text-dimmed mt-1 text-sm italic">已通过系统审核</p>
            </div>
          </div>

          <div class="border-default grid grid-cols-1 gap-8 border-y py-8 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <span class="text-dimmed text-[10px] font-bold tracking-widest uppercase">接收人</span>
              <p class="text-highlighted font-semibold">张三 (Zhang San)</p>
              <p class="text-muted text-sm">产品设计部 / 资深 UI 设计师</p>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-dimmed text-[10px] font-bold tracking-widest uppercase">发放日期</span>
              <p class="text-highlighted font-semibold">2024 年 4 月 25 日</p>
              <p class="text-muted text-sm">结算周期: 2024/03/01 - 2024/03/31</p>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div
              v-for="row in payrollRows"
              :key="row.label"
              class="flex justify-between text-sm"
            >
              <span class="text-muted">{{ row.label }}</span>
              <span :class="['font-mono', row.accent ? 'text-success' : 'text-default']">{{ row.amount }}</span>
            </div>
            <div class="border-default flex justify-between border-t pt-4 text-sm font-bold">
              <span class="text-highlighted">实发金额 (NET)</span>
              <span class="text-primary text-lg">¥ 28,450.00</span>
            </div>
          </div>

          <DemoNote tone="dimmed">
            声明: 本文件包含敏感财务信息，仅供个人查阅。任何未经授权的泄露、分发或复制行为均可能触犯公司信息安全政策。
          </DemoNote>
        </div>
      </RebornWatermark>
    </Playground>

    <DemoSection
      title="图片水印"
      description="传入 image 并指定 width / height，即可用品牌 Logo 替代文字水印，适合作品集与素材站。"
    >
      <RebornWatermark
        :width="130"
        :height="30"
        image="https://element-plus.org/images/element-plus-logo.svg"
        :gap="[100, 100]"
      >
        <!-- 水印宿主：只描边不填充 -->
        <div class="border-default rounded-ui-md flex h-[300px] items-center justify-center border">
          <Icon
            name="lucide:image"
            class="text-dimmed size-12"
          />
        </div>
      </RebornWatermark>
    </DemoSection>

    <DemoSection
      title="多行安全标识"
      description="content 传入数组即可逐行渲染，常用于叠加账号、IP、时间戳等可追溯信息。"
    >
      <RebornWatermark
        :content="['内部机密 (SECRET)', 'ID: 8829-1102', 'IP: 192.168.1.102']"
        :font="{ fontSize: 12, color: 'rgba(239, 68, 68, 0.12)' }"
        :gap="[120, 120]"
      >
        <div class="border-default rounded-ui-md text-dimmed flex h-[300px] items-center justify-center border italic">
          敏感资产保护区域
        </div>
      </RebornWatermark>
    </DemoSection>
  </div>
</template>
