---
title: 验证码输入
description: 用于短信验证码、OTP 等固定位数分格输入的双端组件。
category: 表单与输入
tags: [css, tailwind, otp, input, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornInputOtpDemo.vue" config="RebornInputOtpConfig" componentId="reborn-input-otp" :componentFiles='["RebornInputOtp.vue", "reborn-input-otp.config.ts"]' :uniappFiles='["RebornInputOtp.vue", "reborn-input-otp.config.ts"]'}
::

## 简介

验证码输入将一个隐藏的真实输入框渲染为 `length` 个分格，逐位回显输入内容并在当前位显示闪烁光标；输满指定位数时触发 `done` 事件并自动收起焦点/键盘，适合「输完即提交」的验证码流程。web 端输入框带 `autocomplete="one-time-code"`，支持系统短信验证码自动填充。web 与 uniapp 双端可用。

适用场景：

- 登录、注册时输入短信/邮箱验证码。
- 支付密码等固定位数的分格输入。
- 输入满位后需要自动触发提交（`done` 事件）时。

不适用场景：

- 普通文本输入，改用 `reborn-input`。
- 数值步进增减，改用 `reborn-input-number`。

## 用法

### 基础用法

`v-model` 绑定输入值（字符串），`length` 控制位数（默认 4）；输满位数时触发 `done`，可在回调中直接提交。

```vue
<script setup lang="ts">
import { ref } from "vue";

const code = ref("");

function onDone(value: string) {
  // 输满位数，直接提交验证
  console.log("submit:", value);
}
</script>

<template>
  <RebornInputOtp v-model="code" :length="6" @done="onDone" />
</template>
```

### 自动聚焦与禁用

`autofocus` 让组件挂载后自动聚焦唤起键盘；`disabled` 禁用整组输入。

```vue
<template>
  <RebornInputOtp v-model="code" autofocus />
  <RebornInputOtp v-model="code" disabled />
</template>
```

### 尺寸与颜色

`size` 支持 `sm` / `md` / `lg`；`color` 控制聚焦格子的高亮颜色。

```vue
<template>
  <RebornInputOtp v-model="code" size="lg" color="success" />
</template>
```

### 自定义样式（ui）

组件无插槽，格子外观通过 `ui` 对象按键位覆盖类名；根节点类名 web 端用 `class`、uniapp 端用 `customClass` 追加。

```vue
<template>
  <RebornInputOtp
    v-model="code"
    :ui="{
      item: 'rounded-full border-gray-200 bg-gray-100',
      value: 'font-bold text-primary',
    }"
  />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 输入值。 |
| `length` | `number` | `4` | 验证码位数。 |
| `autofocus` | `boolean` | `false` | 是否自动聚焦。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `inputType` | `"text" \| "number" \| "digit"` | `"number"` | 输入类型；number 时自动过滤非数字字符。digit 仅 uniapp 端支持。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |
| `class` | `any` | `-` | 仅 web。追加到根节点的自定义类名。 |
| `customClass` | `any` | `-` | 仅 uniapp。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 细粒度样式覆盖对象，支持 `root` / `inner` / `list` / `item` / `value` / `cursor`，详见下表。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `string` | 输入值变化。 |
| `done` | `string` | 输入完成（达到指定位数），并自动收起焦点/键盘。 |
| `focus` | `FocusEvent` | 输入框获焦。 |
| `blur` | `FocusEvent` | 输入框失焦。 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器。 |
| `inner` | 隐藏的真实输入框所在容器。 |
| `list` | 分格列表容器。 |
| `item` | 单个格子，可控制大小、圆角、边框等。 |
| `value` | 格子内回显的字符。 |
| `cursor` | 当前位的闪烁光标。 |

## 注意事项

- web、uniapp 双端可用。
- `length` 默认 4 位；输满指定位数触发 `done` 事件并自动失焦（uniapp 端调用 `uni.hideKeyboard()`）。
- `inputType` 默认 `number`（自动过滤非数字并唤起数字键盘）；web 端支持 `text` / `number`，uniapp 端额外支持 `digit`。
- 无插槽，格子样式通过 `ui` / `size` / `color` 配置；根节点类名 web 端用 `class`、uniapp 端用 `customClass`。
- web 端真实输入框隐藏在格子后方并带 `autocomplete="one-time-code"`，支持短信验证码自动填充；点击任意格子会聚焦该输入框。
