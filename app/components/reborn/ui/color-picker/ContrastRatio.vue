<script setup lang="ts">
import type { HsvaColor } from "@uiw/color-convert";
import { hsvaToRgba } from "@uiw/color-convert";
import { computed } from "vue";
import RebornBadge from "../reborn-badge/RebornBadge.vue";

export interface ContrastRatioProps {
  /** 用于计算无障碍对比度的当前颜色（HSVA 对象），变化时自动重新计算 AA/AAA 达标状态 */
  color: HsvaColor;
}

const props = defineProps<ContrastRatioProps>();

const rgbaColor = computed(() => hsvaToRgba(props.color));

const shouldUseWhiteText = computed(() => {
  const rgb = rgbaColor.value;
  // 计算颜色背景的相对亮度
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const rLinear = r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  const gLinear = g <= 0.03928 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
  const bLinear = b <= 0.03928 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;

  const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;

  // 背景偏暗（亮度 < 0.5）时用白字
  return luminance < 0.5;
});

// 对比度是颜色的派生值，用 computed 计算，不再由 watcher 写入 ref
const contrastRatios = computed(() => calculateContrastRatios(props.color));

const currentContrastRatio = computed(() => {
  // 取暗色、浅色两种背景下较好的一个对比度，作为跨场景的无障碍评估
  return Math.max(contrastRatios.value.dark, contrastRatios.value.light);
});

const isAccessible = computed(() => {
  return {
    aa: currentContrastRatio.value >= 4.5,
    aaa: currentContrastRatio.value >= 7,
  };
});

function calculateContrastRatios(color: HsvaColor): { dark: number; light: number } {
  const rgb = hsvaToRgba(color);

  function toSRGB(c: number) {
    const channel = c / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }

  function alphaBlend(foreground: number, background: number, alpha: number) {
    return foreground * alpha + background * (1 - alpha);
  }

  // 与浅色背景（白色 255）做透明度混合
  const lightR = alphaBlend(rgb.r, 255, rgb.a);
  const lightG = alphaBlend(rgb.g, 255, rgb.a);
  const lightB = alphaBlend(rgb.b, 255, rgb.a);

  // 与暗色背景（深灰 32）做透明度混合
  const darkR = alphaBlend(rgb.r, 32, rgb.a);
  const darkG = alphaBlend(rgb.g, 32, rgb.a);
  const darkB = alphaBlend(rgb.b, 32, rgb.a);

  // 浅色背景混合后的亮度
  const lightRSRGB = toSRGB(lightR);
  const lightGSRGB = toSRGB(lightG);
  const lightBSRGB = toSRGB(lightB);
  const lightLuminance = 0.2126 * lightRSRGB + 0.7152 * lightGSRGB + 0.0722 * lightBSRGB;

  // 暗色背景混合后的亮度
  const darkRSRGB = toSRGB(darkR);
  const darkGSRGB = toSRGB(darkG);
  const darkBSRGB = toSRGB(darkB);
  const darkLuminance = 0.2126 * darkRSRGB + 0.7152 * darkGSRGB + 0.0722 * darkBSRGB;

  // 文字颜色的亮度（对比度的另一端）
  const whiteTextLuminance = 1.0;
  const blackTextLuminance = 0.0;

  // 文字与混合后颜色背景的对比度
  // 暗色模式：白字对暗色混合后的颜色
  const darkModeRatio =
    (Math.max(whiteTextLuminance, darkLuminance) + 0.05) /
    (Math.min(whiteTextLuminance, darkLuminance) + 0.05);
  // 浅色模式：黑字对浅色混合后的颜色
  const lightModeRatio =
    (Math.max(blackTextLuminance, lightLuminance) + 0.05) /
    (Math.min(blackTextLuminance, lightLuminance) + 0.05);

  return {
    dark: Number(darkModeRatio.toFixed(2)),
    light: Number(lightModeRatio.toFixed(2)),
  };
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 pt-2 select-none">
    <div class="flex items-center gap-4">
      <div
        class="flex size-10 items-center justify-center rounded border"
        :style="{
          backgroundColor: `rgba(${rgbaColor.r}, ${rgbaColor.g}, ${rgbaColor.b}, ${rgbaColor.a})`,
          backgroundSize: '8px 8px',
        }"
      >
        <span
          class="font-medium"
          :style="{
            color: shouldUseWhiteText ? 'white' : 'black',
          }"
          >A</span
        >
      </div>
      <div class="flex flex-col justify-between">
        <span class="text-muted-foreground text-sm text-nowrap whitespace-nowrap">
          Contrast Ratio
        </span>
        <span class="text-sm">{{ currentContrastRatio }}</span>
      </div>
    </div>
    <div class="flex items-center justify-end gap-1 *:select-none">
      <RebornBadge
        :color="isAccessible.aa ? 'primary' : 'neutral'"
        :variant="isAccessible.aa ? 'filled' : 'soft'"
        size="sm"
        class="gap-1"
      >
        <Icon
          :name="isAccessible.aa ? 'lucide:check' : 'lucide:x'"
          :size="12"
        />
        AA
      </RebornBadge>
      <RebornBadge
        :color="isAccessible.aaa ? 'primary' : 'neutral'"
        :variant="isAccessible.aaa ? 'filled' : 'soft'"
        size="sm"
        class="gap-1"
      >
        <Icon
          :name="isAccessible.aaa ? 'lucide:check' : 'lucide:x'"
          :size="12"
        />
        AAA
      </RebornBadge>
    </div>
  </div>
</template>
