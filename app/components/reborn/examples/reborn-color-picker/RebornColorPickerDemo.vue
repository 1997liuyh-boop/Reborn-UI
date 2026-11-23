<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection, Playground } from "#components";
import { computed, ref, shallowRef } from "vue";
import { colorPickerSizes } from "~/components/reborn/ui/reborn-color-picker/reborn-color-picker.config";
import RebornColorPicker from "~/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue";
import { placements } from "~/lib/placement";

/** 演练场当前色值 */

const color = shallowRef("#3b82f6");
/** change 只在一次取色结束且颜色变化时提交。 */
const lastChange = shallowRef("暂无");
function onColorChange(value: string) {
  lastChange.value = value;
}

const state = shallowRef<Record<string, any>>({
  size: "md",
  placement: "bottom",
  sideOffset: 8,
  disabled: false,
});

const sizeOptions = colorPickerSizes.map((s) => ({ label: s.toUpperCase(), value: s }));
const placementOptions = placements.map((p) => ({ label: p, value: p }));

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
        props: { options: sizeOptions },
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "面板位置",
    children: [
      {
        label: "面板方位（放不下时翻到对侧）",
        key: "placement",
        component: "select" as const,
        defaultValue: "bottom",
        props: { options: placementOptions },
      },
      {
        label: "面板间距（px）",
        key: "sideOffset",
        component: "input-number" as const,
        defaultValue: 8,
        props: { min: 0, max: 40, step: 2 },
      },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const pickerCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="color"'];

  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.placement !== "bottom") props.push(`placement="${s.placement}"`);
  if (s.sideOffset !== 8) props.push(`:side-offset="${s.sideOffset}"`);
  if (s.disabled) props.push("disabled");

  return `<RebornColorPicker\n  ${props.join("\n  ")}\n/>`;
});

/** 尺寸对照演示 */
const sizeColors = ref<Record<string, string>>({
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
          :placement="state.placement"
          :side-offset="state.sideOffset"
          :disabled="state.disabled"
          @change="onColorChange"
        />
        <DemoNote tone="dimmed">
          当前色值：<code>{{ color }}</code>；最近提交：<code>{{ lastChange }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="尺寸对照" description="size 支持 sm / md / lg 三档，与 RebornButton 的触发器尺寸保持一致。">
      <DemoBlock layout="row" align="center">
        <div v-for="s in colorPickerSizes" :key="s" class="flex flex-col items-center gap-2">
          <RebornColorPicker v-model="sizeColors[s]" :size="s" />
          <span class="text-dimmed text-xs font-medium">{{ s }}</span>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
