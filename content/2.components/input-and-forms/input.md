---
title: 输入框
description: 用于带鼠标径向渐变悬停高亮效果的单行文本输入组件。
category: 表单与输入
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="InputDemo.vue" config="InputConfig" componentId="input" :componentFiles='["IInput.vue"]'}

#credits

- 构建于 ShadCN Vue Input 组件之上，并扩展以适配现代 UI/UX 需求。
- 移植自 [Aceternity UI 的 Signup Form Input 组件](https://ui.aceternity.com/components/signup-form)。

::

## 简介

IInput 是仅 Web 端的营销风格单行输入框（组件名 `IInput`，与跨端的 `reborn-input` 不是同一组件）：外层容器监听鼠标位置，以 CSS 径向渐变在边框处渲染跟随鼠标移动的高亮光圈，悬停进入时展开、离开时收起。除少量样式与取值 props 外，其余原生属性经 `$attrs` 透传给内部 `input`。

适用场景：

- 登录、注册等营销感较强的表单需要悬停高亮输入框时。
- Web 落地页表单想要跟随鼠标的径向边框效果时。

不适用场景：

- 常规业务表单或跨端场景，改用 `reborn-input`。
- 需要占位文字消失动画的搜索框，改用 `vanishing-input`。
- 多行文本输入，改用 `reborn-textarea`。

## 用法

### 基础用法

`v-model` 绑定输入值；不绑定时也可用 `defaultValue` 设置初始值（非受控）。原生属性（`placeholder`、`type`、`disabled` 等）直接透传给内部 `input`。

```vue
<script setup lang="ts">
import { ref } from "vue";
import IInput from "~/components/reborn/ui/input/IInput.vue";

const email = ref("");
</script>

<template>
  <IInput
    v-model="email"
    type="email"
    placeholder="you@example.com"
    container-class="w-full max-w-sm"
  />
</template>
```

### 自定义样式

样式分两层：`class` 作用于输入框本体，`containerClass` 作用于渐变高亮的外层容器——宽度等布局类通常设在 `containerClass` 上。

```vue
<template>
  <IInput
    placeholder="Hover over me"
    container-class="w-full max-w-md"
    class="h-12 text-base"
  />
</template>
```

## API

### Props

| 属性名           | 类型                    | 默认值 | 描述                                                 |
| :--------------- | :---------------------- | :----- | :--------------------------------------------------- |
| `modelValue`     | `string / number`       | `-`    | 输入框绑定值（v-model）。                            |
| `defaultValue`   | `string / number`       | `-`    | 非受控模式下的初始值，未绑定 v-model 时生效。        |
| `class`          | `HTMLAttributes['class']` | `-`  | 输入框本体的额外 CSS 类。                            |
| `containerClass` | `HTMLAttributes['class']` | `-`  | 外层渐变容器的额外 CSS 类，宽度等布局类通常设在此。  |

### Emits

| 事件名              | 回调参数                   | 描述                               |
| :------------------ | :------------------------- | :--------------------------------- |
| `update:modelValue` | `(value: string / number)` | 输入值变化时触发（v-model 同步）。 |

## 注意事项

- 仅 Web 端可用，依赖 `@vueuse/core`（useVModel）。
- 组件名为 `IInput`（文件 IInput.vue），与跨端的 `reborn-input` 不是同一组件。
- 样式分两层：`class` 作用于输入框本体，`containerClass` 作用于外层渐变容器，宽度等布局类应设在 `containerClass` 上。
- 高亮颜色取自 CSS 变量 `--blue-500`，径向渐变半径固定 100px；项目中需定义该变量才能看到高亮效果，且悬停效果仅在鼠标设备上生效，触屏无效果。
- 除 4 个声明 props 外的原生属性经 `$attrs` 透传给内部 `input`（如 `type`、`disabled`、`autocomplete`）。
