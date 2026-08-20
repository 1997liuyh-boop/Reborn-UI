---
title: 数字输入框
description: 用于在最小最大值范围内按步进增减数值的双端数字输入组件。
category: 表单与输入
tags: [css, tailwind, input-number, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornInputNumberDemo.vue" config="RebornInputNumberConfig" componentId="reborn-input-number" :componentFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]' :uniappFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]'}
::

## 简介

数字输入框在 `min` / `max` 范围内按 `step` 步进增减数值：左右为减/加按钮，中间为数字输入区，达到边界后对应按钮自动禁用。支持 `v-model` 受控与 `defaultValue` 非受控两种用法，`size` / `color` / `shape` 控制外观。web 与 uniapp 双端可用，uniapp 端还支持长按按钮连续增减。

适用场景：

- 购物车、库存等数量增减场景。
- 需要限定 `min` / `max` 与 `step` 的数值录入。
- 需要自定义加减按钮图标（web 端 `decrement` / `increment` 插槽，uniapp 端 `decrease-icon` / `increase-icon` 插槽）。

不适用场景：

- 自由输入长数字或文本，改用 `reborn-input`。
- 在连续区间内拖动取值，改用 `reborn-slider`。

## 用法

### 基础用法

`v-model` 绑定当前值，`min` / `max` 限定范围，`step` 控制每次增减的幅度。

```vue
<script setup lang="ts">
import { ref } from "vue";

const count = ref(5);
</script>

<template>
  <RebornInputNumber v-model="count" :min="0" :max="20" :step="5" />
</template>
```

### 尺寸、颜色与形状

`size` 支持 `sm` / `md` / `lg`；`color` 影响聚焦环与按钮悬停色；`shape` 支持 `circle`（胶囊圆角）与 `square`（方角）。

```vue
<template>
  <RebornInputNumber v-model="count" size="lg" color="success" shape="square" />
</template>
```

### 自定义加减按钮图标

两端插槽名不同。web 端为 `decrement` / `increment`，作用域提供 `iconClass`（当前尺寸下的图标类名）；uniapp 端为 `decrease-icon` / `increase-icon`。插槽替换的都是按钮内部的图标位内容，按钮容器与点击、禁用逻辑仍由组件维护。

```vue
<template>
  <!-- web 端 -->
  <RebornInputNumber v-model="count">
    <template #decrement="{ iconClass }">
      <Icon name="lucide:heart-minus" :class="iconClass" />
    </template>
    <template #increment="{ iconClass }">
      <Icon name="lucide:heart-plus" :class="iconClass" />
    </template>
  </RebornInputNumber>
</template>
```

```vue
<template>
  <!-- uniapp 端 -->
  <RebornInputNumber v-model="count">
    <template #decrease-icon>
      <view class="i-lucide-arrow-left size-5" />
    </template>
    <template #increase-icon>
      <view class="i-lucide-arrow-right size-5" />
    </template>
  </RebornInputNumber>
</template>
```

### 深度定制（ui）

`ui` 对象按键位覆盖内部节点类名，可调整高度、宽度、配色甚至隐藏分割线。

```vue
<template>
  <RebornInputNumber
    v-model="count"
    :ui="{
      wrapper: 'h-12 w-full rounded-2xl ring-purple-300',
      button: 'text-purple-500 hover:bg-purple-50',
      input: 'font-bold text-purple-700',
      divider: 'hidden',
    }"
  />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | web `-`；uniapp `0` | 受控值。 |
| `defaultValue` | `number` | web `-`；uniapp `0` | 非受控默认值。 |
| `min` | `number` | web `-`；uniapp `0` | 最小值；web 端不传即不限制。 |
| `max` | `number` | web `-`；uniapp `200` | 最大值；web 端不传即不限制。 |
| `step` | `number` | `1` | 步进值。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 聚焦与按钮强调色。 |
| `shape` | `"circle" \| "square"` | `"circle"` | 外形轮廓：circle 为胶囊圆角，square 为方角。 |
| `readonly` | `boolean` | `true` | 仅 uniapp。是否允许直接键入（与原生语义相反）：设为 `false` 后输入框只读、仅能通过按钮增减。 |
| `placeholder` | `string` | `""` | 仅 uniapp。输入框占位文本。 |
| `inputType` | `"number" \| "digit"` | `"number"` | 仅 uniapp。键盘类型：digit 为带小数点键盘，且数值自动保留两位小数。 |
| `class` | `any` | `""` | 仅 web。追加到根节点的自定义类名。 |
| `customClass` | `any` | `-` | 仅 uniapp。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | UI 定制对象，支持 `wrapper` / `button` / `input` / `divider` / `icon`，详见下表。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 数值变化时触发；按钮增减与失焦会先按 min/max 修正（web 端键入过程中为原始键入值）。 |
| `change` | `number` | 仅 uniapp。数值经修正且与旧值不同时触发，与 `update:modelValue` 同时。 |
| `input` | `Event` | 仅 uniapp。键入时透传原生 input 事件对象（此时数值尚未修正）。 |
| `blur` | `Event` | 仅 uniapp。失焦并完成数值修正后触发。 |
| `focus` | `Event` | 仅 uniapp。聚焦事件（当前版本预留，未实际触发）。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `decrement` | `{ iconClass }` | 仅 web。替换减按钮内部的图标位内容，`iconClass` 为当前尺寸的图标类名。 |
| `increment` | `{ iconClass }` | 仅 web。替换加按钮内部的图标位内容，`iconClass` 为当前尺寸的图标类名。 |
| `decrease-icon` | `-` | 仅 uniapp。替换减按钮内的图标，按钮与点击逻辑保留。 |
| `increase-icon` | `-` | 仅 uniapp。替换加按钮内的图标，按钮与点击逻辑保留。 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 最外层容器，控制背景、边框、圆角等。 |
| `button` | 加减按钮容器，可控制宽度、内边距、悬停背景等。 |
| `input` | 中间输入框，控制文字样式。 |
| `divider` | 分割线。 |
| `icon` | 加减图标，控制大小 (e.g. `size-5`) 或颜色。 |

### CSS Variables

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px` | `48px` |
| `--input-md-height` | 中尺寸输入框高度 | `90px` | `45px` |
| `--input-sm-height` | 小尺寸输入框高度 | `80px` | `40px` |

## 注意事项

- web、uniapp 双端可用，但插槽名不同：web 端 `decrement` / `increment`，uniapp 端 `decrease-icon` / `increase-icon`。
- uniapp 端 `min` 默认 0、`max` 默认 200；web 端两者无默认值，不传即不限制。业务范围不同时必须显式传入。
- `readonly`（仅 uniapp）与原生语义相反：默认 `true` 表示允许直接键入，设为 `false` 后输入框只读、仅能通过按钮增减。
- `inputType`（仅 uniapp）仅支持 `digit` / `number` 两种；digit 模式下数值自动保留两位小数。
- web 端键入过程中不强制截断（允许 `min=10` 时先键入 `1` 的中间态），失焦或 change 时才按 min/max 修正显示值。
- uniapp 端按住加减按钮可长按连续增减；`focus` 事件当前未实际触发（预留）。
