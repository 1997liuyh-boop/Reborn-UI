<script setup lang="ts">
import type { ColorPickerValue } from "~/components/content/reborn/ui/color-picker";

/** 当前色值：组件同时输出 hex / hsl / hsla / rgb / rgba 五种格式 */
const color = ref<ColorPickerValue>({
  hex: "#A35fFF",
  hsl: { h: 265.5, s: 100, l: 67, a: 1 },
  hsla: { h: 265.5, s: 100, l: 67, a: 1 },
  rgb: { r: 163, g: 95, b: 255, a: 1 },
  rgba: { r: 163, g: 95, b: 255, a: 1 },
});

function setColor(newColor: ColorPickerValue) {
  color.value = newColor;
}

/** 触发器上的实心色块背景 */
const swatchStyle = computed(() => ({
  backgroundColor: `rgba(${color.value.rgb.r}, ${color.value.rgb.g}, ${color.value.rgb.b}, ${color.value.rgb.a})`,
}));

/** 便于阅读的取整输出 */
const readableValue = computed(() => {
  const { hex, hsl, rgb } = color.value;

  return {
    hex,
    hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l) },
    hsla: { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l), a: hsl.a },
    rgb: { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b) },
    rgba: { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), a: rgb.a },
  };
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="默认插槽即触发器，面板自带表面样式；swatches 提供一排快捷色，value-change 在拖拽过程中持续触发。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <ColorPicker
          :value="color.hsl"
          type="hsla"
          :swatches="['#AEDEAE', '#FFD3B6', '#FFB6B9', '#FFC0CB', '#FFD1DC']"
          @value-change="setColor"
        >
          <RebornButton
            variant="outlined"
            color="neutral"
            label="选择颜色"
          >
            <template #leading>
              <span
                class="border-default rounded-ui-2xs size-4 border"
                :style="swatchStyle"
              />
            </template>
            <template #trailing>
              <Icon name="lucide:chevron-down" />
            </template>
          </RebornButton>
        </ColorPicker>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="输出格式"
      description="每次变更都会回传完整的色值对象，可按业务需要取用其中任意一种表示。"
    >
      <pre class="border-default rounded-ui-sm text-muted max-h-96 overflow-auto border p-4 font-mono text-xs leading-relaxed">{{ JSON.stringify(readableValue, null, 2) }}</pre>
    </DemoSection>
  </div>
</template>
