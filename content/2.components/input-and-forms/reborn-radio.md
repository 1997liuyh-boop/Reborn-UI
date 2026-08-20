---
title: 单选框
description: 用于在一组互斥选项中选择单项的双端单选框组件。
category: 表单与输入
tags: [css, tailwind, radio, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornRadioDemo.vue" config="RebornRadioConfig" componentId="reborn-radio" :componentFiles='["RebornRadio.vue", "reborn-radio.config.ts"]' :uniappFiles='["RebornRadio.vue", "reborn-radio.config.ts"]'}
::

## 简介

Radio 是双端可用的单选框组件：每个选项通过 `value` 声明自己的值，多个选项绑定同一个 `v-model`，选中态由 `modelValue === value` 决定。也可以用 `RebornRadioGroup` 包裹，统一下发 `size` / `color` / `disabled` 等配置。支持自定义选中/未选中图标与插槽深度定制。

适用场景：

- 表单中性别、支付方式等互斥选项的单选。
- 需要自定义勾选图标（`activeIcon` 默认 `i-lucide-check`）或经典圆点外观（web 端 `variant="circle"`）。

不适用场景：

- 可同时选中多项，改用 `reborn-checkbox`。
- 单个布尔开关的即时切换，改用 `reborn-switch`。
- 选项很多（如超过 5-7 个）时，改用 `reborn-select`。

## 用法

### 基础用法

多个选项绑定同一个 `v-model`，`value` 与绑定值相等的选项呈选中态；切换时触发 `update:modelValue` 与 `change`。

```vue
<script setup lang="ts">
import { ref } from "vue";

const fruit = ref("apple");
</script>

<template>
  <RebornRadio v-model="fruit" value="apple" label="苹果" />
  <RebornRadio v-model="fruit" value="banana" label="香蕉" />
  <RebornRadio v-model="fruit" value="orange" label="橘子" disabled />
</template>
```

### 颜色与尺寸

`size` 支持 `sm` / `md` / `lg`；`color` 支持 `primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`。

```vue
<template>
  <RebornRadio v-model="v" value="1" label="小号" size="sm" />
  <RebornRadio v-model="v" value="2" label="中号" size="md" />
  <RebornRadio v-model="v" value="3" label="成功色" size="lg" color="success" />
</template>
```

### 变体与自定义图标

web 端通过 `variant` 切换外观：`simple`（默认）为勾选图标风格，`circle` 为经典圆点风格（圆环 + 实心圆点，忽略 `activeIcon`）。`activeIcon` / `inactiveIcon` 可替换选中/未选中图标；uniapp 端没有 `variant`，图标传 iconify 类名，并可用 `isRound` 控制图标容器是否为圆形。

```vue
<template>
  <!-- Web：经典圆点 -->
  <RebornRadio v-model="v" value="a" label="圆点风格" variant="circle" />

  <!-- Web：自定义图标（uniapp 写法相同，图标为 iconify 类名） -->
  <RebornRadio
    v-model="v"
    value="b"
    label="主题"
    active-icon="i-lucide-sun"
    inactive-icon="i-lucide-moon"
  />
</template>
```

### 单选框组与插槽

`RebornRadioGroup` 统一管理绑定值并下发 `size` / `color` / `disabled`（web 端还支持 `variant` / `activeIcon` 等）；`active-icon` / `inactive-icon` 插槽可完全接管图标区域，`default` 插槽自定义标签内容（作用域含 `isChecked`）。

```vue
<template>
  <RebornRadioGroup v-model="emoji" size="lg" color="warning">
    <RebornRadio v-for="e in emojis" :key="e.value" :value="e.value" :label="e.label">
      <template #active-icon>
        <text class="text-lg">{{ e.value }}</text>
      </template>
      <template #inactive-icon>
        <text class="text-lg opacity-30">{{ e.value }}</text>
      </template>
    </RebornRadio>
  </RebornRadioGroup>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `any` | - | 当前选中值，与选项 `value` 严格相等时该项呈选中态。 |
| `value` | `any` | - | 该选项的值。 |
| `label` | `string` | `""` | 选项文案；也可用 `default` 插槽自定义。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。 |
| `variant` | `"simple" \| "circle"` | `"simple"` | **仅 Web**。外观风格：`simple` 勾选图标风格；`circle` 经典圆点风格（忽略 `activeIcon`）。 |
| `activeIcon` | `string` | `"i-lucide-check"` | 选中态图标（web 传 Icon name，uniapp 传 iconify 类名）。 |
| `inactiveIcon` | `string` | `""` | 未选中态图标，默认为空（只显示空心框/圆）。 |
| `showIcon` | `boolean` | `true` | 是否渲染图标区域；设为 `false` 时仅显示标签内容。 |
| `isRound` | `boolean` | `true` | **仅 UniApp**。图标容器是否为圆形（`rounded-full`）。 |
| `class` | `string` | `""` | **仅 Web**。追加到根节点的自定义类名。 |
| `customClass` | `string` | - | **仅 UniApp**。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 覆盖内部各区域样式类，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: any)` | 选中值变化时更新绑定值，参数为该选项的 `value`。 |
| `change` | `(value: any)` | 选中值变化时触发（点击已选中项不会触发）。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `active-icon` | - | 自定义选中态图标区域，完全替代默认图标/圆点。 |
| `inactive-icon` | - | 自定义未选中态图标区域。 |
| `default` | `{ isChecked }` | 自定义标签内容，替代 `label` 文本。 |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的样式类：

| 键名 | 说明 |
| --- | --- |
| `root` | 根节点容器。 |
| `wrapper` | 图标与标签的内容行。 |
| `activeIcon` | 选中态图标容器。 |
| `inactiveIcon` | 未选中态图标容器。 |
| `innerDot` | **仅 Web**。`circle` 变体的实心圆点。 |
| `label` | 标签文本。 |

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 选中态由 `modelValue === value` 严格相等判断，注意字符串与数字类型不一致会导致无法选中；点击已选中项不会再次触发事件（单选框不能取消选中）。
- `variant="circle"` 仅 web 端存在，该模式下不渲染 `activeIcon` 图标；uniapp 端用 `isRound` 与 `ui.activeIcon`（如 `rounded-md`）实现方框等外观。
- 使用 `RebornRadioGroup` 时绑定值由 Group 的 `v-model` 管理，单个 Radio 不需要再绑 `v-model`。
- uniapp 端示例尺寸建议使用 rpx（如通过 `ui` 覆盖 `w-[40rpx] h-[40rpx]`）。
