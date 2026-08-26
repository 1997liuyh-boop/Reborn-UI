<script setup lang="ts">
import { backTopColors, backTopSizes } from "~/components/reborn/ui/reborn-back-top/reborn-back-top.config";

/** 演练场绑定值 */
const state = ref<Record<string, any>>({
  color: "primary",
  size: "md",
  threshold: 300,
  bottom: 20,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: backTopColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: backTopSizes.map((s) => ({ label: s, value: s })) },
      },
    ],
  },
  {
    title: "位置与时机",
    children: [
      {
        label: "显示阈值 (px)",
        key: "threshold",
        component: "slider" as const,
        defaultValue: 300,
        props: { min: 0, max: 1000, step: 50 },
      },
      {
        label: "距底部 (px)",
        key: "bottom",
        component: "slider" as const,
        defaultValue: 20,
        props: { min: 20, max: 200, step: 10 },
      },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const backTopCode = computed(
  () =>
    `<RebornBackTop\n  color="${state.value.color}"\n  size="${state.value.size}"\n  :threshold="${state.value.threshold}"\n  :bottom="${state.value.bottom}"\n/>`,
);

/** 用于把页面撑高的占位行，便于触发滚动 */
const rows = Array.from({ length: 12 }, (_, i) => `占位内容 ${i + 1}`);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="backTopCode"
      component-name="RebornBackTop"
      title="交互演练场"
      description="组件监听窗口滚动，滚动距离超过 threshold 后从右侧滑入；按钮固定在视口右下角，请向下滚动本页查看效果。"
    >
      <!-- 组件本身是固定定位的浮层，这里只用描边标出占位区域，避免再叠一层背景 -->
      <div class="border-default rounded-ui-md w-full border">
        <div class="divide-default divide-y">
          <p
            v-for="row in rows"
            :key="row"
            class="text-muted px-4 py-3 text-sm"
          >
            {{ row }}
          </p>
        </div>
      </div>

      <RebornBackTop
        :color="state.color"
        :size="state.size"
        :threshold="state.threshold"
        :bottom="state.bottom"
      />
    </Playground>

    <DemoSection
      title="自定义内容"
      description="默认插槽会完全替换内置的圆形按钮，此时 color 与 size 不再生效，样式全部由插槽内容决定。"
    >
      <DemoBlock layout="stack">
        <DemoNote>
          下方的方形「TOP」按钮即自定义内容，位于距底部 100px 处，同样需要滚动后才出现。
        </DemoNote>

        <RebornBackTop
          :bottom="100"
          :ui="{ wrapper: 'z-50' }"
        >
          <div class="bg-success rounded-ui-sm flex size-12 cursor-pointer items-center justify-center text-xs font-bold text-white">
            TOP
          </div>
        </RebornBackTop>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
