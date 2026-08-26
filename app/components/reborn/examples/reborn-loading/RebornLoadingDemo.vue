<script setup lang="ts">
import {
  LoadingColors,
  LoadingTypes,
} from "~/components/reborn/ui/reborn-loading/reborn-loading.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  type: "ring",
  color: "primary",
  size: "40px",
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "动画与配色",
    children: [
      {
        label: "动画类型",
        key: "type",
        component: "select" as const,
        defaultValue: "ring",
        props: { options: LoadingTypes.map((t) => ({ label: t, value: t })) },
      },
      {
        label: "颜色风格",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: LoadingColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "尺寸（支持 px / rem / em）",
        key: "size",
        component: "input" as const,
        defaultValue: "40px",
      },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const loadingCode = computed(() => {
  const s = state.value;
  const props: string[] = [`type="${s.type}"`];

  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.size !== "40px") props.push(`size="${s.size}"`);

  return `<RebornLoading\n  ${props.join("\n  ")}\n/>`;
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="loadingCode"
      component-name="RebornLoading"
      title="交互演练场"
      description="size 直接作为 CSS 尺寸使用，因此可传任意合法长度单位；color 除预设语义色外也接受任意色值。"
    >
      <RebornLoading
        :type="state.type"
        :color="state.color"
        :size="state.size"
      />
    </Playground>

    <DemoSection
      title="全部动画类型"
      description="每种类型的绘制方式不同，密集列表建议使用体量更小的 spinner 或 dots。"
    >
      <DemoBlock
        layout="grid"
        align="center"
      >
        <div
          v-for="t in LoadingTypes"
          :key="t"
          class="flex flex-col items-center justify-center gap-3 py-4"
        >
          <RebornLoading
            :type="t"
            color="primary"
            size="32px"
          />
          <span class="text-dimmed text-xs font-medium">{{ t }}</span>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="预设颜色"
      description="color 支持语义色板；传入十六进制或 rgb 字符串则直接作为动画主色。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <div
          v-for="c in LoadingColors"
          :key="c"
          class="flex flex-col items-center gap-2"
        >
          <RebornLoading
            type="spinner"
            :color="c"
            size="28px"
          />
          <span class="text-dimmed text-xs font-medium">{{ c }}</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
