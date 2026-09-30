---
title: Chip 角标
description: 叠加在宿主元素四角的圆点或计数角标，用于未读、在线等轻量状态提醒，双端可用。
category: 按钮
platform: both
tags: [chip, dot, corner-mark, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornChipDemo.vue" config="RebornChipConfig" componentId="reborn-chip" :componentFiles='["RebornChip.vue", "reborn-chip.config.ts"]' :uniappFiles='["RebornChip.vue", "reborn-chip.config.ts"]'}
::

## 简介

Chip 是挂在宿主元素角上的角标。宿主放进默认插槽后，组件把它包进一个 `relative` 容器，再在四角之一叠加一个绝对定位的圆点。圆点不占文档流，所以加上或去掉角标都不会让宿主周围的布局跳动。

`text` 传数字或短文本时显示计数角标，不传就只是一个纯色圆点。默认角标中心压在宿主的角上，`inset` 可以让它整个收进宿主内部，常用于圆形头像的在线状态点。

组件本身没有交互：`show` 只决定是否渲染角标节点，`update:show` 也从不由组件内部触发，显隐完全由外部状态驱动。

### 何时使用

- 图标、头像或按钮上需要显示未读数量，例如消息铃铛上的「9」「99+」。
- 只需提示「有更新」、不需要具体数字时，用不带 `text` 的纯圆点。
- 头像右下角的在线 / 离线状态，配合 `inset` 让圆点落在头像边缘内。
- 按钮角上的「NEW」「SALE」一类短标记。

### 何时不使用

- 独立展示一段状态文字、不依附于某个元素 —— 改用 `reborn-badge`。
- 需要点击删除、可选中的标签 —— 本组件没有任何交互，改用带 `close` 事件的 `reborn-badge`。
- 提示内容超过三四个字符 —— 角标高度只有 10~18px，长文本会横向撑开遮住宿主，改用 `reborn-tooltip` 或行内文字。

## 用法

### 基础用法

把宿主元素放进默认插槽，角标默认吸附在右上角。`text` 传数字或短文本显示计数，不传则只渲染纯色圆点。

```vue
<template>
  <RebornChip text="9">
    <Icon name="lucide:bell" class="size-6" />
  </RebornChip>

  <RebornChip text="99+" size="lg">
    <Icon name="lucide:mail" class="size-6" />
  </RebornChip>

  <RebornChip>
    <Icon name="lucide:message-circle" class="size-6" />
  </RebornChip>
</template>
```

### 颜色：7 种语义色

`color` 同时决定角标背景色和 `ring-1` 描边色，默认 `primary`。

| 取值 | 典型用途 |
| --- | --- |
| `primary` | 默认计数，和品牌色保持一致。 |
| `secondary` | 次要分组的计数，与主计数区分。 |
| `success` | 在线、已完成等正向状态点。 |
| `info` | 中性的信息更新提醒。 |
| `warning` | 即将过期、待处理等需要留意的状态。 |
| `error` | 未读消息、异常告警等需要尽快处理的提醒。 |
| `neutral` | 离线、已静音等弱化状态。 |

```vue
<template>
  <RebornChip color="error" text="8">
    <Icon name="lucide:bell" class="size-6" />
  </RebornChip>
</template>
```

### 尺寸：五档与纯圆点档

`size` 控制圆点高度与最小宽度。有文本时宽度随内容撑开，高度不变。

| 取值 | 圆点高度 | 文本字号 | 典型用途 |
| --- | --- | --- | --- |
| `xs` | 10px | 不渲染文本 | 小图标上的纯红点。 |
| `sm` | 12px | 不渲染文本 | 常规图标上的纯红点。 |
| `md` | 14px | 8px | 默认档，一位到两位数字计数。 |
| `lg` | 16px | 10px | `99+` 这类三字符计数，或头像状态点。 |
| `xl` | 18px | 12px | 大尺寸宿主上的计数或短标记。 |

以上是 Web 端档位。UniApp 端是 `3xs`~`3xl` 九档，单位为 rpx，且每一档都会渲染文本，见「两端差异对照」。

```vue
<template>
  <!-- xs / sm 只显示圆点，这里的 text 不会出现 -->
  <RebornChip size="sm" color="error" text="NEW">
    <Icon name="lucide:gift" class="size-6" />
  </RebornChip>

  <RebornChip size="xl" color="error" text="NEW">
    <Icon name="lucide:gift" class="size-6" />
  </RebornChip>
</template>
```

### 位置与内嵌：position 与 inset

`position` 选择四角之一。默认 `inset` 为 `false`，角标向外平移自身宽高的一半，中心正好压在宿主的角上；开启 `inset` 后取消平移，角标整个落在宿主内部，贴着宿主的边。

| 取值 | 典型用途 |
| --- | --- |
| `top-right` | 默认位置，未读计数的常规位置。 |
| `bottom-right` | 头像的在线状态点，通常配合 `inset`。 |
| `top-left` | 右上角已有其他元素（如关闭按钮）时的替代位置。 |
| `bottom-left` | 与右下角状态并存的第二个标记。 |

```vue
<template>
  <RebornChip color="success" size="lg" inset position="bottom-right">
    <img src="/avatar.png" class="size-12 rounded-full">
  </RebornChip>
</template>
```

### 显隐控制：v-model:show

`show` 为 `false` 时不渲染角标节点，宿主内容不受影响。组件内部从不触发 `update:show`，`v-model:show` 实际只是把外部状态传进来，写成 `:show` 效果相同。

```vue
<script setup lang="ts">
import { ref } from "vue";

const hasUnread = ref(true);
</script>

<template>
  <RebornChip v-model:show="hasUnread" text="3" color="error">
    <Icon name="lucide:inbox" class="size-6" />
  </RebornChip>
  <RebornButton size="sm" @click="hasUnread = !hasUnread">
    {{ hasUnread ? '标为已读' : '模拟新消息' }}
  </RebornButton>
</template>
```

### 组合场景：在线状态、未读圆点与促销标

角标可以叠在任何元素上。头像在线状态用 `inset` 收进圆形边缘；图标按钮的未读提醒用纯圆点；操作按钮上的活动标记用短文本。

```vue
<template>
  <RebornChip color="success" size="lg" inset position="bottom-right">
    <UAvatar src="https://github.com/benjamincanac.png" size="xl" />
  </RebornChip>

  <RebornChip color="error" size="sm">
    <RebornButton color="neutral" variant="circle" size="lg">
      <template #leading>
        <Icon name="lucide:mail" class="size-6" />
      </template>
    </RebornButton>
  </RebornChip>

  <RebornChip color="warning" text="SALE">
    <RebornButton label="立即解锁" color="neutral" variant="filled" />
  </RebornChip>
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 角标背景色与描边色。 |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"md"` | 圆点高度 10~18px；`xs` / `sm` 为纯圆点档，不渲染文本。 |
| `text` | `string \| number` | `-` | 角标文本；按真值判断渲染，`0` 与空字符串都不显示文本。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 角标吸附在宿主的哪个角。 |
| `show` | `boolean` | `true` | 是否渲染角标节点，支持 `v-model:show`。 |
| `inset` | `boolean` | `false` | 为 `true` 时取消向外平移，角标整个落在宿主内部。 |
| `standalone` | `boolean` | `false` | 只给角标节点追加 `absolute`，而角标节点本身已是 `absolute`，目前没有可见效果。 |
| `class` | `any` | `-` | 追加到根节点 `root` 的类名。 |
| `ui` | `object` | `-` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 角标背景色与描边色。 |
| `size` | `"3xs" \| "2xs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl"` | `"md"` | 圆点高度 8~24rpx，每档递增 2rpx；文本字号与圆点高度相同。 |
| `text` | `string \| number` | `-` | 角标文本；按真值判断渲染，`0` 与空字符串都不显示文本。所有档位都会渲染。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 角标吸附在宿主的哪个角。 |
| `show` | `boolean` | `true` | 是否渲染角标节点，支持 `v-model:show`。 |
| `inset` | `boolean` | `false` | 为 `true` 时取消向外平移，角标整个落在宿主内部。 |
| `standalone` | `boolean` | `false` | 只给角标节点追加 `absolute`，而角标节点本身已是 `absolute`，目前没有可见效果。 |
| `customClass` | `any` | `-` | 追加到定位容器（Web 端 `root` 对应的节点）的类名。 |

:::

::

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:show` | `(value: boolean)` | 已声明但组件内部从不触发，仅用于让 `v-model:show` 的写法成立。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `-` | 宿主内容，角标以它的外框为定位基准。 |

### 自定义样式（ui）

`ui` 仅 Web 端支持。UniApp 端没有 `ui` 属性，只能通过 `customClass` 给定位容器追加类名，角标本体与文本无法单独覆盖。

| 键名 | 对应节点 | 默认类名 | 说明 |
| --- | --- | --- | --- |
| `root` | 包裹宿主与角标的 `<span>` | `relative inline-flex items-center justify-center shrink-0 h-fit leading-none` | 始终渲染；`class` 也合并到这里。 |
| `base` | 角标圆点 `<div>` | `absolute rounded-full flex items-center justify-center font-medium whitespace-nowrap ring-1`，另按 `color` 加 `bg-*` `ring-*`、按 `size` 加高度与最小宽度、按 `position` 加 `top-0` / `right-0` 等；`inset` 为 `false` 时再加 `translate-*` 平移 | `show` 为 `false` 时不渲染。 |
| `label` | 角标内的文本 `<div>` | `text-white`，另按 `size` 加字号（`md` 8px、`lg` 10px、`xl` `text-sm`） | 仅当 `text` 为真值且 `size` 不是 `xs` / `sm` 时渲染。 |

```vue
<template>
  <RebornChip
    text="5"
    :ui="{
      root: 'rounded-full',
      base: 'ring-2 ring-white',
      label: 'font-bold',
    }"
  >
    <UAvatar src="/avatar.png" />
  </RebornChip>
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| `size` 档位 | `xs`~`xl` 五档，圆点高 10~18px | `3xs`~`3xl` 九档，圆点高 8~24rpx |
| 纯圆点档 | `xs` / `sm` 不渲染文本 | 没有纯圆点档，任何档位传了 `text` 都会渲染 |
| 文本字号 | `md` 8px、`lg` 10px、`xl` 12px，小于圆点高度 | 与圆点高度相同（`text-[length:16rpx]` 等） |
| 样式覆盖 | `class` + `ui`（`root` / `base` / `label`） | 只有 `customClass`，作用于定位容器 |
| 外层结构 | 根节点就是行内的 `<span>` 定位容器 | 定位容器外还包了一层块级 `<view>`，且 `inheritAttrs: false`，写在组件上的其他属性不会透传 |
| 文本节点 | `<div>` | `<text>` |
| 类型约束 | `color` / `size` / `position` 额外接受任意字符串 | 只接受配置里列出的取值 |

## 注意事项

- **显示数字 0 要传字符串 `"0"`。** 两端都按 `props.text` 的真值决定是否渲染文本节点，数字 `0` 与空字符串都会被当成「没有文本」，只剩一个纯圆点。
- **Web 端 `xs` / `sm` 传了 `text` 也不显示。** 这两档圆点只有 10px / 12px 高，装不下最小字号令牌（`--text-sm` 12px），组件在这两档直接跳过文本节点。需要带文字的角标请用 `md` 及以上；同一份代码搬到 UniApp 后这两档会显示文字，排版要单独检查。
- **`v-model:show` 不会被组件改写。** 组件内部没有任何关闭入口，`update:show` 从不触发。「点一下消失」这类逻辑要在宿主的点击事件里自己把绑定值改为 `false`。
- **`standalone` 目前没有效果。** 它只给角标节点追加 `absolute`，而角标节点的基础类里本就有 `absolute`。没有宿主时角标会相对空的定位容器摆放，不能指望这个属性让角标独立排版。
- **默认模式下角标会溢出宿主外框。** `inset` 为 `false` 时角标向外平移半个自身尺寸，宿主的祖先如果有 `overflow-hidden`（如卡片、滚动列表），角标会被裁掉一半。遇到这种情况改用 `inset`，或给容器留出内边距。
- **UniApp 端外层多一层块级 `<view>`。** 在行内排版里使用时，这层 `<view>` 会独占一行；需要和文字同行时，给父容器设 `flex` 布局。
