<script setup lang="ts">
/** 演练场当前色值 */
const color = ref("#3b82f6");

const state = ref<Record<string, any>>({
  size: "md",
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "尺寸与状态",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: [
            { label: "XS", value: "xs" },
            { label: "SM", value: "sm" },
            { label: "MD", value: "md" },
            { label: "LG", value: "lg" },
          ],
        },
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const pickerCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="color"'];

  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.disabled) props.push("disabled");

  return `<RebornColorPicker\n  ${props.join("\n  ")}\n/>`;
});

/** 尺寸对照演示 */
const sizeColors = ref<Record<string, string>>({
  xs: "#ef4444",
  sm: "#f59e0b",
  md: "#22c55e",
  lg: "#3b82f6",
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="pickerCode"
      component-name="RebornColorPicker"
      title="交互演练场"
      description="点击色块弹出取色面板，v-model 绑定十六进制字符串；面板由 RebornPopover 承载，无需额外容器。"
    >
      <div class="flex flex-col items-center gap-3">
        <RebornColorPicker
          v-model="color"
          :size="state.size"
          :disabled="state.disabled"
        />
        <DemoNote tone="dimmed">
          当前色值：<code>{{ color }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="尺寸对照"
      description="size 支持 xs / sm / md / lg 四档，与 RebornButton 的触发器尺寸保持一致。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <div
          v-for="s in ['xs', 'sm', 'md', 'lg']"
          :key="s"
          class="flex flex-col items-center gap-2"
        >
          <RebornColorPicker
            v-model="sizeColors[s]"
            :size="s as 'xs' | 'sm' | 'md' | 'lg'"
          />
          <span class="text-dimmed text-xs font-medium">{{ s }}</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
