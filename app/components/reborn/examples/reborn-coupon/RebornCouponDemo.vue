<script setup lang="ts">
import RebornCoupon from "~/components/reborn/ui/reborn-coupon/RebornCoupon.vue";

const state = ref<Record<string, any>>({
    type: "perforated",
    width: 904,
    height: 124,
    radius: 12,
    direction: "vertical",
    position: "start",
    offset: 120,
    corner: 20,
    gap: 2,
    split: "dotted",
    size: 2,
    splitColor: "#ffffff",
    lineWidth: 8,
    lineHeight: 2,
    background: "linear-gradient(135deg, #ff7e5f, #feb47b)",
    hoverable: true
});

const validCornerTypes = ["ticket", "combined"] as const;

const showCornerControl = computed(() =>
    validCornerTypes.includes(state.value.type as typeof validCornerTypes[number])
);

const showDashedLineSizeControls = computed(() =>
    state.value.type === "perforated" && state.value.split === "dashed"
);

const couponProps = computed(() => ({
    ...state.value,
    size: showDashedLineSizeControls.value
        ? [state.value.lineWidth, state.value.lineHeight]
        : state.value.size,
}));

const controls = computed(() => [
    {
        title: "基础配置",
        children: [
            {
                label: "组件类型",
                key: "type",
                component: "select" as const,
                defaultValue: "perforated",
                props: {
                    options: [
                        { label: "缺口 (Notch)", value: "notch" },
                        { label: "票据 (Ticket)", value: "ticket" },
                        { label: "邮票 (Stamp)", value: "stamp" },
                        { label: "虚线 (Perforated)", value: "perforated" },
                        { label: "组合 (Combined)", value: "combined" },
                    ],
                },
            },
            {
                label: "背景样式",
                key: "background",
                component: "select" as const,
                defaultValue: "linear-gradient(135deg, #ff7e5f, #feb47b)",
                props: {
                    options: [
                        { label: "落日余晖 (Amber)", value: "linear-gradient(135deg, #ff7e5f, #feb47b)" },
                        { label: "极光森林 (Green)", value: "linear-gradient(135deg, #43e97b, #38f9d7)" },
                        { label: "深海蓝调 (Blue)", value: "linear-gradient(135deg, #4facfe, #00f2fe)" },
                        { label: "优雅黑紫 (Purple)", value: "linear-gradient(135deg, #667eea, #764ba2)" },
                        { label: "暗夜刀锋 (Dark)", value: "linear-gradient(135deg, #232526, #414345)" },
                        { label: "极简白 (White)", value: "#f8fafc" },
                    ],
                },
            },
            {
                label: "宽度",
                key: "width",
                component: "slider" as const,
                defaultValue: 904,
                props: {
                    min: 100,
                    max: 1200,
                    step: 1,
                }
            },
            {
                label: "高度",
                key: "height",
                component: "slider" as const,
                defaultValue: 124,
                props: {
                    min: 100,
                    max: 1200,
                    step: 1,
                }
            },
        ],
    },
    {
        title: "布局与对齐",
        children: [
            {
                label: "布局方向",
                key: "direction",
                component: "select" as const,
                defaultValue: "vertical",
                props: {
                    options: [
                        { label: "水平 (Horizontal)", value: "horizontal" },
                        { label: "垂直 (Vertical)", value: "vertical" },
                    ],
                },
            },
            {
                label: "位置策略",
                key: "position",
                component: "select" as const,
                defaultValue: "start",
                props: {
                    options: [
                        { label: "顶部/左侧 (Start)", value: "start" },
                        { label: "居中 (Center)", value: "center" },
                        { label: "底部/右侧 (End)", value: "end" },
                    ],
                },
            },
            {
                label: "对齐偏移 (px)",
                key: "offset",
                component: "slider" as const,
                defaultValue: 120,
                props: { min: 0, max: 600 },
            },
        ],
    },
    {
        title: "装饰细节",
        children: [
            {
                label: "缺口半径 (px)",
                key: "radius",
                component: "slider" as const,
                defaultValue: 12,
                props: { min: 0, max: 30 },
            },
            ...(showCornerControl.value
                ? [{
                    label: "切角大小 (px)",
                    key: "corner",
                    component: "slider" as const,
                    defaultValue: 20,
                    props: { min: 0, max: 100 },
                }]
                : []),
            {
                label: "间距/密度 (px)",
                key: "gap",
                component: "slider" as const,
                defaultValue: 2,
                props: { min: 1, max: 60 },
            },
            ...(!showDashedLineSizeControls.value
                ? [{
                    label: "点径/线粗 (px)",
                    key: "size",
                    component: "slider" as const,
                    defaultValue: 2,
                    props: { min: 1, max: 20 },
                }]
                : []),
            ...(showDashedLineSizeControls.value
                ? [
                    {
                        label: "线段宽度 (px)",
                        key: "lineWidth",
                        component: "slider" as const,
                        defaultValue: 8,
                        props: { min: 2, max: 60 },
                    },
                    {
                        label: "线段高度 (px)",
                        key: "lineHeight",
                        component: "slider" as const,
                        defaultValue: 2,
                        props: { min: 1, max: 20 },
                    },
                ]
                : []),
            {
                label: "分割线类型",
                key: "split",
                component: "select" as const,
                defaultValue: "dotted",
                props: {
                    options: [
                        { label: "点状 (Dotted)", value: "dotted" },
                        { label: "断续线 (Dashed)", value: "dashed" },
                    ],
                },
            },
            {
                label: "分割线颜色",
                key: "splitColor",
                component: "color-picker" as const,
                defaultValue: "#ffffff",
                props: {
                    placeholder: "#ffffff / rgba(255,255,255,.9)",
                },
            },
        ],
    },
]);

const activeCode = computed(() => {
    const lines = [
        "<RebornCoupon",
        `  type="${state.value.type}"`,
        `  :width="${state.value.width}"`,
        `  :height="${state.value.height}"`,
        `  :radius="${state.value.radius}"`,
        `  direction="${state.value.direction}"`,
        `  position="${state.value.position}"`,
        `  :offset="${state.value.offset}"`,
        `  :gap="${state.value.gap}"`,
        `  split="${state.value.split}"`,
        state.value.splitColor ? `  split-color="${state.value.splitColor}"` : null,
        showCornerControl.value ? `  :corner="${state.value.corner}"` : null,
        showDashedLineSizeControls.value
            ? `  :size="[${state.value.lineWidth}, ${state.value.lineHeight}]"`
            : `  :size="${state.value.size}"`,
        state.value.hoverable ? "  hoverable" : null,
        "/>",
    ].filter(Boolean);

    return lines.join("\n");
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="activeCode"
      component-name="RebornCoupon"
      title="交互演练场"
      description="优惠券的裁切形态由 type 决定，缺口位置由 direction / position / offset 三者共同控制；背景通过内联样式直接传入，组件只负责裁形。"
    >
      <!-- 优惠券本身即被演示的对象，其表面与背景属于组件效果，不视为额外嵌套 -->
      <RebornCoupon
        v-bind="couponProps"
        class="transition duration-300"
        :style="{
          background: state.background,
          color: state.background === '#f8fafc' ? '#1e293b' : 'white',
        }"
      >
        <template #left>
          <div class="flex h-full flex-col items-center justify-center">
            <span class="text-4xl font-extrabold tracking-tighter">¥100</span>
            <span class="text-sm font-bold tracking-wider uppercase opacity-70">满 ¥1000 可用</span>
          </div>
        </template>
        <template #right>
          <div class="flex h-full flex-col justify-center px-6 py-2">
            <div class="flex flex-wrap gap-2">
              <span class="rounded-ui-2xs border-current/40 border px-2 py-0.5 text-sm font-bold tracking-wider">
                NEW
              </span>
              <span class="rounded-ui-2xs border-current/40 border px-2 py-0.5 text-sm font-bold tracking-wider">
                新人专享
              </span>
            </div>
            <div>
              <h3 class="text-xl font-black">全球时尚购物周礼券</h3>
              <p class="text-xs font-medium opacity-80">全平台自营品类通用，不包含电子产品</p>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm font-medium opacity-60">有效期至：2026.12.31</span>
              <button
                class="border-current px-5 py-1.5 text-xs font-bold transition-transform rounded-full border hover:scale-105 active:scale-95"
              >
                立即领取
              </button>
            </div>
          </div>
        </template>
      </RebornCoupon>
    </Playground>

    <DemoSection
      title="响应式尺寸"
      description="sm / md / lg / xl / xxl 五个断点各自接收一组 width、height、offset，组件会按当前视口宽度自动切换，无需手写媒体查询。"
    >
      <DemoBlock layout="stack">
        <RebornCoupon
          v-for="item in 2"
          :key="item"
          type="perforated"
          :radius="8"
          :size="[1, 4]"
          split="dashed"
          direction="vertical"
          :gap="4"
          split-color="#575859"
          :sm="{ width: 300, height: 74, offset: 178 }"
          :md="{ width: 400, height: 74, offset: 278 }"
          :lg="{ width: 400, height: 81, offset: 278 }"
          :xl="{ width: 500, height: 90, offset: 363 }"
          :xxl="{ width: 444, height: 90, offset: 307 }"
          :ui="{ right: 'flex items-center justify-center' }"
          class="bg-elevated rounded-ui-sm"
        >
          <template #left>
            <div class="flex h-full items-center justify-center gap-x-5">
              <div class="flex flex-col items-center gap-y-2">
                <NuxtImg
                  src="https://www.rakufun.com/images/sites/Mercari.png"
                  class="mobile:size-[24px] tablet:size-[32px]"
                />
                <p class="text-default text-base">Mercari</p>
              </div>
              <div>
                <p>
                  <b class="text-default tablet:text-[30px] text-xl leading-[30px]">5000</b>
                  <sub>日元</sub>
                </p>
                <p class="text-muted tablet:text-base text-sm">滿 {{ 1000 * item }} 日圓可用</p>
              </div>
            </div>
          </template>
          <template #right>
            <RebornButton label="立即领取" />
          </template>
        </RebornCoupon>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
