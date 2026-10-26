---
title: 输入框
description: 用于带鼠标径向渐变悬停高亮效果的单行文本输入组件。
category: 表单与输入
platform: web
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="InputDemo.vue" config="InputConfig" componentId="input" :componentFiles='["IInput.vue"]'}
::

## 简介

IInput 是仅 Web 的鼠标跟随高亮输入框，与跨端的 RebornInput 分别提供不同的视觉与业务能力。

`modelValue` 绑定内容，`defaultValue` 提供非受控初值；外层按鼠标位置绘制径向渐变光圈，进入时展开、离开时收起。

`class` 控制输入框本体，`containerClass` 控制光圈容器；其余原生属性经 attrs 传给内部 input，适合登录或展示页的短文本录入。

### 何时使用

- Web 表单需要鼠标跟随高亮——用 `modelValue` 绑定输入内容。
- 仅需一次初始化的输入——用 `defaultValue` 设置非受控初值。
- 需要分别调整输入本体与光圈容器——用 `class` / `containerClass` 分层设置样式。

### 何时不使用

- 常规业务表单或跨端输入——改用 `reborn-input`。
- 需要多行编辑——改用 `reborn-textarea`。

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
| `modelValue` | `string \| number \| null` | `-` | 输入框绑定值（v-model）；显式 `undefined` / `null` 显示为空。 |
| `defaultValue` | `string / number`       | `-`    | 非受控模式下的初始值，未绑定 v-model 时生效。        |
| `class` | `HTMLAttributes['class']` | `-`  | 输入框本体的额外 CSS 类。                            |
| `containerClass` | `HTMLAttributes['class']` | `-`  | 外层渐变容器的额外 CSS 类，宽度等布局类通常设在此。  |

### Emits

| 事件名              | 回调参数                   | 描述                               |
| :------------------ | :------------------------- | :--------------------------------- |
| `update:modelValue` | `(value: string \| number \| null \| undefined)` | 输入值变化时触发（v-model 同步）；原生输入框产生的值为字符串。 |

### 来源

- 构建于 ShadCN Vue Input 组件之上，并扩展以适配现代 UI/UX 需求。
- 移植自 [Aceternity UI 的 Signup Form Input 组件](https://ui.aceternity.com/components/signup-form)。

## 注意事项

- **显式空值会清空输入框。** 绑定 `modelValue` 后，`undefined` / `null` 都显示为空；仅未绑定时使用 `defaultValue` 和组件内部交互值。

- **未绑定模型时使用内部状态**。仅 Web 端可用。双向绑定用 `defineModel` 声明，受控判定交给共享的 `useControlledModel`：未绑定 `v-model` 时以 `defaultValue` 为初值、由组件内部保存；一旦绑定（包括显式传 `undefined`）就只显示父级的值，输入只派发 `update:modelValue`。
- **不要混淆两套输入组件**。组件名为 `IInput`（文件 IInput.vue），与跨端的 `reborn-input` 不是同一组件。
- **布局类应设在外层容器**。样式分两层：`class` 作用于输入框本体，`containerClass` 作用于外层渐变容器，宽度等布局类应设在 `containerClass` 上。
- **悬停高亮依赖颜色变量与鼠标**。高亮颜色取自 CSS 变量 `--blue-500`，径向渐变半径固定 100px；项目中需定义该变量才能看到高亮效果，且悬停效果仅在鼠标设备上生效，触屏无效果。
- **原生属性会透传**。除 4 个声明 props 外的原生属性经 `$attrs` 透传给内部 `input`（如 `type`、`disabled`、`autocomplete`）。
