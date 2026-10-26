---
title: 平衡滑块
description: 用于在左右两侧间拖动分配比例的双色平衡滑块展示组件。
category: 表单与输入
platform: web
tags: [css, tailwind, input]
---

::ComponentViewer{demoFile="BalanceSliderDemo.vue" config="BalanceSliderConfig" componentId="balance-slider" :componentFiles='["BalanceSlider.vue"]'}
::

## 简介

BalanceSlider 是仅 Web 的双边比例展示控件，用两条色带和拖动把手表达 0–100 的分配。

`modelValue` 负责双向绑定，未绑定时使用 `initialValue`；`leftColor` / `rightColor` 和两侧文案分别控制视觉与含义。

`minShiftLimit` / `maxShiftLimit` 决定提示展开区间，`borderRadius` 控制圆角；组件没有插槽、不参与表单校验，需要步长或刻度时使用业务滑块。

### 何时使用

- 展示两种配料的分配比例——用 `modelValue` 绑定 0–100 的比例。
- 展示无需外部同步的初始倾向——用 `initialValue` 设置起点。
- 需要区分两个选项——用 `leftContent` / `rightContent` 配文案，`leftColor` / `rightColor` 配色。

### 何时不使用

- 数值需要步长、刻度和表单校验——改用 `reborn-slider`。
- 两侧是图片或内容的前后对照——改用 `compare`。

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

### 双向绑定

`v-model` 绑定 0-100 的数字，拖动时写回；不绑定时组件内部保存当前值。

```vue
<script lang="ts" setup>
import { shallowRef } from "vue";

const ratio = shallowRef(60);
</script>

<template>
  <BalanceSlider v-model="ratio" left-content="COFFEE" right-content="MILK" />
  <p>咖啡占比：{{ ratio }}%</p>
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
| `modelValue` | `number \| null` | - | 当前比例（0-100），配合 `v-model` 双向绑定；显式空值复位到 `initialValue`，未绑定时组件内部保存。 |
| `initialValue` | `number` | `50`        | 未绑定 `v-model` 时的初始位置（0-100），仅初始化时生效。 |
| `leftColor` | `string` | `"#e68a00"` | 滑块左侧的背景色（六位十六进制）。       |
| `rightColor` | `string` | `"#ffffff"` | 滑块右侧的背景色（六位十六进制）。       |
| `minShiftLimit` | `number` | `40`        | 启动位移动画的最小阈值。                 |
| `maxShiftLimit` | `number` | `68`        | 关闭位移动画的最大阈值。                 |
| `leftContent` | `string` | `"LEFT"`    | 左侧提示中显示的文本。                   |
| `rightContent` | `string` | `"RIGHT"`   | 右侧提示中显示的文本。                   |
| `indicatorColor` | `string` | `"#FFFFFF"` | 滑块中央指示器的颜色。                   |
| `borderRadius` | `number` | `8`         | 左右两块色带的圆角半径，单位 px。        |

### Emits

| 事件名              | 回调参数          | 描述                                   |
| ------------------- | ----------------- | -------------------------------------- |
| `update:modelValue` | `(value: number)` | 拖动滑块时触发，参数为 0-100 的数字。 |

### 来源

- 灵感与移植来自 [Jhey 的 CSS 版 Balance Slider](https://x.com/jh3yy/status/1748809599598399792?s=46)。
- 原始概念由 [Malay Vasa](https://x.com/MalayVasa/status/1748726374079381930) 提出。

## 注意事项

- **只能用于 Web 页面**。当前只有 Web 组件实现，UniApp 页面无法直接复用。
- **用 `v-model` 读取拖动结果**。绑定后以 `modelValue` 为准，显式 `undefined` / `null` 将显示比例复位到 `initialValue`，不会回显旧交互值，也不主动回写父模型；未绑定时以 `initialValue` 为初值自行保存。写回的值已转成数字，不是 range 输入原生的字符串。
- **位移阈值不是数值范围**。`minShiftLimit` / `maxShiftLimit`（默认 40 / 68）控制位移展开动画的启停阈值，而非取值范围。
- **颜色必须使用六位十六进制**。颜色属性内部按 `#RRGGBB` 六位十六进制解析后转 HSL，不支持 `#FFF` 三位简写或 CSS 颜色名。
- **宽度由父容器约束**。组件宽度撑满父容器，需要自行用外层元素控制展示宽度。
