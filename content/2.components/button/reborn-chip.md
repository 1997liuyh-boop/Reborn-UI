---
title: 提示点/标记
description: 用于在元素角标位置显示提示点或数字标记的组件，双端可用。
category: 按钮
tags: [css, tailwind, chip, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornChipDemo.vue" config="RebornChipConfig" componentId="reborn-chip" :componentFiles='["RebornChip.vue", "chip.ts"]' :uniappFiles='["RebornChip.vue", "chip.ts"]'}
::

## 简介

Chip 是双端可用的角标组件：把宿主元素放进 `default` 插槽，组件就会以宿主为锚点，在四角之一（`position` 默认 `top-right`）叠加一个小圆点或文本标记。`text` 传入数字或短文本时显示为计数/文字角标，不传则只渲染纯色小圆点；`show` 配合 `v-model:show` 可受控显隐。

适用场景：

- 图标、头像或按钮右上角显示未读数量（`text` 传数字或文本）。
- 仅需红点提醒而无文字的消息提示（不传 `text` 即为小圆点）。
- 需要通过 `v-model:show` 动态控制标记显隐的场景。

不适用场景：

- 独立展示状态文字标签（非角标叠加），改用 `reborn-badge`。

## 用法

### 数字角标与颜色

宿主元素放在默认插槽内，`text` 显示计数，`color` 切换语义色（7 种）。

```vue
<template>
  <RebornChip text="9" color="error">
    <Icon name="lucide:bell" class="size-6" />
  </RebornChip>

  <RebornChip text="99+" color="primary" size="lg">
    <Icon name="lucide:mail" class="size-6" />
  </RebornChip>
</template>
```

### 小红点提醒

不传 `text` 时只渲染纯色小圆点，适合「有更新」类轻提醒。

```vue
<template>
  <RebornChip color="error" size="sm">
    <Icon name="lucide:message-circle" class="size-6" />
  </RebornChip>
</template>
```

### 位置与内嵌

`position` 支持四角定位；默认角标中心压在宿主角上，`inset` 开启后改为内嵌贴合宿主边缘，适合圆形头像的在线状态点。

```vue
<template>
  <RebornChip color="success" size="lg" inset position="bottom-right">
    <img src="/avatar.png" class="size-12 rounded-full" />
  </RebornChip>
</template>
```

### 显隐控制（v-model:show）

`show` 控制角标是否渲染（宿主内容不受影响），可用 `v-model:show` 受控。

```vue
<script setup lang="ts">
import { ref } from "vue";

const hasUnread = ref(true);
</script>

<template>
  <RebornChip v-model:show="hasUnread" text="3" color="error">
    <Icon name="lucide:inbox" class="size-6" />
  </RebornChip>
  <RebornButton size="sm" @click="hasUnread = !hasUnread">切换</RebornButton>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 角标背景色（语义色）。 |
| `size` | Web：`"xs" \| "sm" \| "md" \| "lg" \| "xl"`；UniApp：`"3xs"`–`"3xl"` 九档 | `"md"` | 角标尺寸，两端档位不同（web 为 px、uniapp 为 rpx 标尺）。 |
| `text` | `string \| number` | `-` | 角标文本内容；不传（或空）时仅显示纯色小圆点。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 相对宿主的四角定位。 |
| `show` | `boolean` | `true` | 是否显示角标，可配合 `v-model:show` 使用。 |
| `inset` | `boolean` | `false` | 是否内嵌贴合宿主边缘（默认角标中心压在宿主角上）。 |
| `standalone` | `boolean` | `false` | 是否作为独立角标渲染（无宿主内容时使用）。 |
| `class` | `any` | `-` | **仅 Web**。追加到根元素的自定义类名。 |
| `customClass` | `any` | `-` | **仅 UniApp**。追加到根元素的自定义类名。 |
| `ui` | `object` | `-` | **仅 Web**。按内部结构键覆盖样式类，见下方「自定义样式（ui）」。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:show` | `(value: boolean)` | 显隐状态变化时同步，配合 `v-model:show` 使用。 |

### Slots

| 插槽名 | 描述 |
| --- | --- |
| `default` | 宿主内容，作为角标的定位锚点；`standalone` 场景下可为空。 |

## 自定义样式（ui）

`ui` 属性（仅 Web）按以下键覆盖对应节点的样式类：

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器（包裹宿主与角标，`relative` 定位）。 |
| `base` | 角标圆点本体。 |
| `label` | 角标内的文本。 |

## 注意事项

- web 与 uniapp 双端可用；额外类名 web 端用 `class`，uniapp 端用 `customClass`。
- 默认以默认插槽内容为锚点定位（`position` 默认 `top-right`），无宿主独立使用时需设 `standalone`。
- `inset` 使标记内嵌于宿主边缘，与 `position` 组合调整贴合位置。
- `text` 按 truthy 判断渲染：传数字 `0` 或空字符串时不显示文本、只保留小圆点，需要展示「0」请传字符串 `"0"`。
- 组件自身没有关闭交互，`update:show` 不会由组件内部触发，`v-model:show` 实际由外部赋值驱动。
- 两端 `size` 档位不同：web 为 `xs`–`xl` 五档，uniapp 为 `3xs`–`3xl` 九档（尺寸单位 rpx）。
