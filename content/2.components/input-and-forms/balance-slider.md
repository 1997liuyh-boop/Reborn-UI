---
title: 平衡滑块
description: 用于在左右两侧间拖动分配比例的双色平衡滑块展示组件。
category: 表单与输入
tags: [css, tailwind, input]
---

::ComponentViewer{demoFile="BalanceSliderDemo.vue" config="BalanceSliderConfig" componentId="balance-slider" :componentFiles='["BalanceSlider.vue"]'}

#credits

- 灵感与移植来自 [Jhey 的 CSS 版 Balance Slider](https://x.com/jh3yy/status/1748809599598399792?s=46)。
- 原始概念由 [Malay Vasa](https://x.com/MalayVasa/status/1748726374079381930) 提出。

::

## 简介

平衡滑块是一个偏展示型的对比交互区块：左右两条色带按当前值（0-100）分配宽度，拖动中央把手时两侧提示文案实时显示各自占比，并在进入 `minShiftLimit` 与 `maxShiftLimit` 之间的区间时触发上移展开动画。它没有事件、插槽和 `v-model`，只能通过 `initialValue` 设定初始位置，适合落地页等强视觉场景而非表单取值。仅 web 端可用。

适用场景：

- 展示两个选项之间的比例倾向（如示例中的 COFFEE / MILK）。
- 落地页需要可拖动的双边对比交互区块。
- 需要自定义左右背景色与提示文案的比例展示。

不适用场景：

- 表单中需要取值提交的数值滑块，改用 `reborn-slider`。
- 需要监听滑动值变化的场景：该组件未定义任何事件，取不到当前值。

## 用法

### 基础用法

`leftContent` / `rightContent` 设置两侧提示文案，`initialValue` 设定初始占比（0-100，仅初始化时生效）。

```vue
<template>
  <div class="w-full p-4">
    <BalanceSlider
      left-content="COFFEE"
      right-content="MILK"
      :initial-value="60"
    />
  </div>
</template>
```

### 自定义颜色与圆角

`leftColor` / `rightColor` 控制两侧色带底色（六位十六进制），`indicatorColor` 控制中央指示器颜色，`borderRadius` 控制色带圆角（px）。可结合暗色模式动态切换。

```vue
<script lang="ts" setup>
import { useColorMode } from "@vueuse/core";
import { computed } from "vue";

const isDark = computed(() => useColorMode().value === "dark");
const rightColor = computed(() => (isDark.value ? "#FFFFFF" : "#000000"));
</script>

<template>
  <BalanceSlider
    left-color="#e68a00"
    :right-color="rightColor"
    indicator-color="#FFFFFF"
    :border-radius="12"
  />
</template>
```

## API

### Props

| 属性名           | 类型     | 默认值      | 描述                                     |
| ---------------- | -------- | ----------- | ---------------------------------------- |
| `initialValue`   | `number` | `50`        | 滑块的初始位置（0-100），仅初始化时生效。 |
| `leftColor`      | `string` | `"#e68a00"` | 滑块左侧的背景色（六位十六进制）。       |
| `rightColor`     | `string` | `"#ffffff"` | 滑块右侧的背景色（六位十六进制）。       |
| `minShiftLimit`  | `number` | `40`        | 启动位移动画的最小阈值。                 |
| `maxShiftLimit`  | `number` | `68`        | 关闭位移动画的最大阈值。                 |
| `leftContent`    | `string` | `"LEFT"`    | 左侧提示中显示的文本。                   |
| `rightContent`   | `string` | `"RIGHT"`   | 右侧提示中显示的文本。                   |
| `indicatorColor` | `string` | `"#FFFFFF"` | 滑块中央指示器的颜色。                   |
| `borderRadius`   | `number` | `8`         | 左右两块色带的圆角半径，单位 px。        |

## 注意事项

- 仅 web 端可用。
- 无事件、无插槽、无 `v-model`，仅能通过 `initialValue`（0-100）设置初始位置，无法向外读取用户拖动后的值。
- `minShiftLimit` / `maxShiftLimit`（默认 40 / 68）控制位移展开动画的启停阈值，而非取值范围。
- 颜色属性内部按 `#RRGGBB` 六位十六进制解析后转 HSL，不支持 `#FFF` 三位简写或 CSS 颜色名。
- 组件宽度撑满父容器，需要自行用外层元素控制展示宽度。
