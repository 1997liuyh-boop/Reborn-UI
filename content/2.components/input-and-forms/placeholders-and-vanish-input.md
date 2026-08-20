---
title: 占位符滚动与消失输入框
description: 用于占位符轮换滚动、提交时文字呈消失动画的单行输入组件。
category: 表单与输入
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="VanishingInputDemo.vue" config="VanishingInputConfig" componentId="vanishing-input" :componentFiles='["VanishingInput.vue"]'}

#credits

- 感谢 [M Atif](https://github.com/atif0075) 移植该组件。
- 移植自 [Aceternity UI 的 Placeholders And Vanish Input](https://ui.aceternity.com/components/placeholders-and-vanish-input)。

::

## 简介

VanishingInput 是一个带动效的单行输入框：`placeholders` 数组中的占位文本每 3 秒轮换一次（上下滑动过渡），按回车或点击右侧按钮提交时，输入文字会被绘制到画布上并播放粒子飘散的「消失」动画，随后自动清空绑定值并重新聚焦。适合作为 AI 问答、搜索等入口的氛围型输入框。

适用场景：

- AI 问答、搜索入口需要轮换展示示例问题占位符时。
- 落地页互动输入框需要提交动效增强反馈。

不适用场景：

- 常规表单输入，改用 `reborn-input`（同时支持 Web 与 UniApp）。
- 需要目录选择、历史记录、图片搜索的高级搜索框，改用 `reborn-search-box`。
- 需要发光视觉的装饰性搜索输入，改用 `halo-search`。

## 用法

### 基础用法

`v-model` 绑定输入值，`placeholders` 传入轮换的占位文本数组；提交时触发 `submit` 事件（参数为提交时的文本），动画结束后绑定值被自动清空。

```vue
<script setup lang="ts">
import { ref } from "vue";

const text = ref("");
const placeholders = [
  "今天想搜点什么？",
  "试试输入一个问题…",
  "按回车看看消失动画",
];
</script>

<template>
  <VanishingInput
    v-model="text"
    :placeholders="placeholders"
    @submit="(val) => console.log('提交:', val)"
  />
</template>
```

### 监听输入变化

输入过程中触发 `change` 事件，参数是 `{ target: { value } }` 形式的模拟事件对象（对齐原生 input 事件的取值方式）；消失动画播放期间不会触发 `change`。

```vue
<template>
  <VanishingInput
    v-model="text"
    @change="(e) => console.log('当前值:', e.target.value)"
  />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 输入框绑定值，支持 `v-model`；提交动画结束后自动清空。 |
| `placeholders` | `string[]` | `["Placeholder 1", "Placeholder 2", "Placeholder 3"]` | 占位文本数组，每 3 秒轮换显示，仅在输入为空时可见。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 绑定值变化时触发（`v-model` 同步）。 |
| `change` | `({ target: { value: string } })` | 输入值变化时触发，参数为模拟的事件对象；动画期间不触发。 |
| `submit` | `(value: string)` | 按回车或点击提交按钮时触发，参数为提交时的文本；随后播放消失动画。 |

## 注意事项

- 仅 Web 端可用；消失动画依赖 canvas 与 `requestAnimationFrame`，组件卸载时会自动清理定时器与动画帧。
- 输入为空时不会提交：回车被忽略，右侧提交按钮处于禁用态。
- 提交后由组件自动清空 `modelValue` 并重新聚焦，业务侧无需（也不应）在 `submit` 里手动清空，否则动画取的文本可能为空。
- 动画播放期间输入框被禁用且文字透明，`change` 事件暂停触发。
- 占位符轮换在标签页不可见时自动暂停、可见后恢复；组件挂载时会自动聚焦输入框，注意页面中多个自动聚焦元素的抢焦点问题。
