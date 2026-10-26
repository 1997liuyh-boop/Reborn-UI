---
title: 占位符滚动与消失输入框
description: 用于占位符轮换滚动、提交时文字呈消失动画的单行输入组件。
category: 表单与输入
platform: web
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="VanishingInputDemo.vue" config="VanishingInputConfig" componentId="vanishing-input" :componentFiles='["VanishingInput.vue"]'}
::

## 简介

VanishingInput 是仅 Web 的单行输入组件，轮换占位提示并在提交时播放文字消散动画。

`placeholders` 每 3 秒轮换一次，`modelValue` 同步文本；回车或提交按钮会派发当前文本，并用画布播放粒子动画。

`autofocus` 控制挂载后聚焦；动画结束后清空绑定值并把焦点还给输入框，`change` 和 `submit` 分别提供输入与提交反馈。

### 何时使用

- 问答入口需轮换示例问题——用 `placeholders` 提供提示列表。
- 需要获取提交内容并在动画结束后清空——用 `modelValue` 绑定文本。
- 独立输入页面需要挂载后聚焦——开启 `autofocus`。

### 何时不使用

- 提交后需要保留输入内容——改用 `reborn-input`。
- 需要完整搜索历史与目录选择——改用 `reborn-search-box`。

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
| `autofocus` | `boolean` | `false` | 挂载后是否自动聚焦输入框；聚焦时不滚动页面。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 绑定值变化时触发（`v-model` 同步）。 |
| `change` | `({ target: { value: string } })` | 输入值变化时触发，参数为模拟的事件对象；动画期间不触发。 |
| `submit` | `(value: string)` | 按回车或点击提交按钮时触发，参数为提交时的文本；随后播放消失动画。 |

### 来源

- 感谢 [M Atif](https://github.com/atif0075) 移植该组件。
- 移植自 [Aceternity UI 的 Placeholders And Vanish Input](https://ui.aceternity.com/components/placeholders-and-vanish-input)。

## 注意事项

- **动画依赖浏览器能力**。仅 Web 端可用；消失动画依赖 canvas 与 `requestAnimationFrame`，组件卸载时会自动清理定时器与动画帧。
- **空文本不能提交**。输入为空时不会提交：回车被忽略，右侧提交按钮处于禁用态。
- **不要提前清空提交文本**。提交后由组件自动清空 `modelValue` 并重新聚焦，业务侧无需（也不应）在 `submit` 里手动清空，否则动画取的文本可能为空。
- **动画期间不能继续输入**。动画播放期间输入框被禁用且文字透明，`change` 事件暂停触发。
- **后台标签页暂停轮换**。占位符轮换在标签页不可见时自动暂停、可见后恢复。
- **默认不自动聚焦**。挂载即聚焦会抢走页面焦点，组件不在首屏时还会把页面滚过去；需要时传 `autofocus`，此时以 `preventScroll` 聚焦、不滚动页面。页面里有多个自动聚焦元素时只有最后挂载的那个生效。
