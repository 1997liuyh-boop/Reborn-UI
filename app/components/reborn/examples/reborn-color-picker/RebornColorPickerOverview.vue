<script setup lang="ts">
import { shallowRef } from "vue";
import RebornColorPickerPanel from "~/components/reborn/ui/reborn-color-picker/RebornColorPickerPanel.vue";

/**
 * 总览卡片缩略：取色面板的饱和度画布、预览色块与色相 / 透明度滑块
 *
 * 真实的取色面板由 RebornPopover 弹出，缩略图直接挂载面板组件；
 * 完整面板含格式切换、输入框和 48 格预设色，高约 360px，这里用 ui 隐去输入区与预设区、压扁画布、缩小预览色块。
 * 根节点的 space-y 会给隐藏区块前的最后一个可见块留下底部外边距，改用 flex 的 gap 排布。
 * 色值取明度约 80% 的蓝色，让画布上的取色圆点完整落在画布内，不被顶边裁掉。
 */

const color = shallowRef("#3d74cc");

const ui = {
  root: "flex w-[200px] flex-col gap-2.5 space-y-0 p-2.5",
  saturation: "aspect-[3/1]",
  preview: "size-8",
  inputs: "hidden",
  presets: "hidden",
};
</script>

<template>
  <RebornColorPickerPanel v-model="color" :ui="ui" />
</template>
