---
title: Chip 角标
description: 叠加在宿主元素四角的圆点、圆环或文字角标，提供 4 种变体、3 档尺寸，用于未读、在线等轻量状态提醒，双端可用。
category: 按钮
platform: both
tags: [chip, dot, corner-mark, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornChipDemo.vue" config="RebornChipConfig" componentId="reborn-chip" :componentFiles='["RebornChip.vue", "reborn-chip.config.ts"]' :uniappFiles='["RebornChip.vue", "reborn-chip.config.ts"]'}
::

## 简介

Chip 是挂在宿主元素角上的角标。宿主放进默认插槽后，组件把它包进一个 `relative` 容器，再在四角之一叠加一个绝对定位的角标节点。角标不占文档流，所以加上或去掉角标都不会让宿主周围的布局跳动。

角标有四种变体：`solid` 实心圆点和 `outline` 空心圆环只表达「有状态」，不显示文字；`textDot` 实心、`textOutline` 描边两种会显示 `text`。不传 `variant` 时按 `text` 自动选择，传了文本就是 `textDot` 计数角标，不传就是 `solid` 圆点。

组件本身没有交互：`show` 只决定是否渲染角标节点，组件内部从不改写它，显隐完全由外部状态驱动。

### 何时使用

- 图标、头像或按钮上需要显示未读数量，例如消息铃铛上的「9」「99+」。
- 只需提示「有更新」、不需要具体数字时，用 `solid` 圆点。
- 头像右下角的在线 / 离线状态，用 `outline` 圆环配合 `inset` 落在头像边缘内。
- 按钮角上的「NEW」「SALE」一类短标记。

### 何时不使用

- 独立展示一段状态文字、不依附于某个元素 —— 改用 `reborn-badge`。
- 需要点击删除、可选中的标签 —— 本组件没有任何交互，改用带 `close` 事件的 `reborn-badge`。
- 提示内容超过三四个字符 —— 文字角标高度只有 16~24px，长文本会横向撑开遮住宿主，改用 `reborn-tooltip` 或行内文字。

## 用法

### 基础用法

把宿主元素放进默认插槽，角标默认吸附在右上角。不传 `variant` 时按 `text` 自动选择：传了文本是 `textDot` 计数角标，不传是 `solid` 纯圆点。

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

### 变体：圆点、圆环与文字角标

`variant` 有四种取值。`solid` 与 `outline` 最大外径只有 16px，放不下文字，即使传了 `text` 也只画图形；`textDot` 与 `textOutline` 会渲染 `text`。

| 取值 | 外观 | 是否显示 `text` | 典型用途 |
| --- | --- | --- | --- |
| `solid` | 实心圆点，填充语义色 | 否 | 未读提醒、「有更新」小红点。 |
| `outline` | 空心圆环，语义色描边 | 否 | 在线状态点，比实心点更轻。 |
| `textDot` | 实心底 + 白字 | 是 | 未读计数，最醒目的提醒。 |
| `textOutline` | 语义色描边 + 同色文字 | 是 | 「NEW」「SALE」等不想抢走宿主视觉重心的短标记。 |

`outline` 与 `textOutline` 垫了一层纸面色底（`bg-gray-1`，暗色模式随主题反转），宿主内容不会透过圆环的空洞或衬在文字下面。

```vue
<template>
  <RebornChip variant="outline" color="success">
    <Icon name="lucide:user" class="size-6" />
  </RebornChip>

  <RebornChip variant="textOutline" color="error" text="NEW">
    <Icon name="lucide:gift" class="size-6" />
  </RebornChip>
</template>
```

### 颜色：7 种语义色

`color` 统一取色阶的 6 阶：`solid` / `textDot` 用作底色，`outline` / `textOutline` 用作描边与文字色，默认 `primary`。

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

### 尺寸：三档

`size` 只有 `sm` / `md` / `lg` 三档，默认 `md`，具体像素随变体不同。文字角标的最小宽度等于高度，单个字符时是正圆，多个字符时横向撑成胶囊，高度不变。

| 变体 | `sm` | `md` | `lg` |
| --- | --- | --- | --- |
| `solid` | 直径 4px | 直径 5px | 直径 6px |
| `outline` | 内径 4px + 描边 2px，外径 8px | 内径 6px + 描边 3px，外径 12px | 内径 8px + 描边 4px，外径 16px |
| `textDot` / `textOutline` | 高 16px，字号 12px | 高 20px，字号 16px | 高 24px，字号 20px |

以上是 Web 端像素，UniApp 端按 1px = 2rpx 换算，见「两端差异对照」。

```vue
<template>
  <RebornChip size="sm" color="error" text="NEW">
    <Icon name="lucide:gift" class="size-6" />
  </RebornChip>

  <RebornChip size="lg" color="error" text="NEW">
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

`show` 为 `false` 时不渲染角标节点，宿主内容不受影响。组件自身没有关闭交互，显隐完全由外部赋值驱动，`v-model:show` 与 `:show` 效果相同。

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

角标可以叠在任何元素上。头像在线状态用 `outline` 圆环加 `inset` 收进圆形边缘；图标按钮的未读提醒用 `solid` 圆点；操作按钮上的活动标记用 `textOutline`，不和按钮自身的实心底色抢视觉。

```vue
<template>
  <RebornChip variant="outline" color="success" inset position="bottom-right">
    <UAvatar src="https://github.com/benjamincanac.png" size="xl" />
  </RebornChip>

  <RebornChip color="error" size="lg">
    <RebornButton color="neutral" variant="circle" size="lg">
      <template #leading>
        <Icon name="lucide:mail" class="size-6" />
      </template>
    </RebornButton>
  </RebornChip>

  <RebornChip variant="textOutline" color="warning" text="SALE" size="sm">
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
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色：`solid` / `textDot` 取 6 阶作底色，`outline` / `textOutline` 取 6 阶作描边与文字色。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸档位，各变体的具体像素不同：圆点 4~6px、圆环外径 8~16px、文字角标高 16~24px。 |
| `variant` | `"solid" \| "outline" \| "textDot" \| "textOutline"` | `-` | 视觉变体。不传时按 `text` 自动选择：有文本取 `textDot`，否则取 `solid`。 |
| `text` | `string \| number` | `-` | 角标文本，仅 `textDot` / `textOutline` 渲染；按真值判断，`0` 与空字符串都不显示。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 角标吸附在宿主的哪个角。 |
| `show` | `boolean` | `true` | 是否渲染角标节点，支持 `v-model:show`；组件内部不会改写它。 |
| `inset` | `boolean` | `false` | 为 `true` 时取消向外平移，角标整个落在宿主内部。 |
| `standalone` | `boolean` | `false` | 只给角标节点追加 `absolute`，而角标节点本身已是 `absolute`，目前没有可见效果。 |
| `class` | `any` | `-` | 追加到根节点 `root` 的类名。 |
| `ui` | `object` | `-` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 语义色：`solid` / `textDot` 用作底色，`outline` / `textOutline` 用作描边与文字色。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸档位，各变体的具体尺寸不同：圆点 8~12rpx、圆环外径 16~32rpx、文字角标高 32~48rpx。 |
| `variant` | `"solid" \| "outline" \| "textDot" \| "textOutline"` | `-` | 视觉变体。不传时按 `text` 自动选择：有文本取 `textDot`，否则取 `solid`。 |
| `text` | `string \| number` | `-` | 角标文本，仅 `textDot` / `textOutline` 渲染；按真值判断，`0` 与空字符串都不显示。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 角标吸附在宿主的哪个角。 |
| `show` | `boolean` | `true` | 是否渲染角标节点，支持 `v-model:show`；组件内部不会改写它。 |
| `inset` | `boolean` | `false` | 为 `true` 时取消向外平移，角标整个落在宿主内部。 |
| `standalone` | `boolean` | `false` | 只给角标节点追加 `absolute`，而角标节点本身已是 `absolute`，目前没有可见效果。 |
| `customClass` | `any` | `-` | 追加到定位容器（Web 端 `root` 对应的节点）的类名。 |

:::

::

### Emits

两端通用。

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:show` | `(value: boolean)` | 由 `v-model:show` 声明，组件内部从不触发，仅用于让 `v-model:show` 的写法成立。 |

### Slots

两端通用。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `-` | 宿主内容，角标以它的外框为定位基准。 |

### 自定义样式（ui）

`ui` 仅 Web 端支持。UniApp 端没有 `ui` 属性，只能通过 `customClass` 给定位容器追加类名，角标本体与文本无法单独覆盖。

| 键名 | 对应节点 | 默认类名 | 说明 |
| --- | --- | --- | --- |
| `root` | 包裹宿主与角标的 `<span>` | `relative inline-flex items-center justify-center shrink-0 h-fit leading-none` | 始终渲染；`class` 也合并到这里。 |
| `base` | 角标节点 `<div>` | `absolute rounded-full flex items-center justify-center whitespace-nowrap`，另按 `variant` × `color` 加 `bg-*` 或 `border-*`、按 `variant` × `size` 加尺寸、按 `position` 加 `top-0` / `right-0` 等；`inset` 为 `false` 时再加 `translate-*` 平移 | `show` 为 `false` 时不渲染。 |
| `label` | 角标内的文本 `<div>` | `font-medium`，另按 `size` 加字号与 `leading-none`；`textDot` 加 `text-white`，`textOutline` 加语义色 `text-*` | 仅 `text` 为真值且变体为 `textDot` / `textOutline` 时渲染。 |

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
| 尺寸单位 | px：圆点 4 / 5 / 6、圆环外径 8 / 12 / 16、文字角标高 16 / 20 / 24 | rpx，数值为 Web 的 2 倍：8 / 10 / 12、16 / 24 / 32、32 / 40 / 48 |
| 配色来源 | 色阶 6 阶类（`bg-brand-6`、`border-red-6` 等） | 语义色类（`bg-primary`、`border-error` 等），本端语义色即 6 阶 |
| 样式覆盖 | `class` + `ui`（`root` / `base` / `label`） | 只有 `customClass`，作用于定位容器 |
| 外层结构 | 根节点就是行内的 `<span>` 定位容器 | 定位容器外还包了一层块级 `<view>`，且 `inheritAttrs: false`，写在组件上的其他属性不会透传 |
| 文本节点 | `<div>` | `<text>` |
| 类型约束 | `color` / `size` / `position` 额外接受任意字符串 | 只接受配置里列出的取值 |

## 注意事项

- **显示数字 0 要传字符串 `"0"`。** 两端都按 `props.text` 的真值决定是否渲染文本节点，数字 `0` 与空字符串都会被当成「没有文本」；不传 `variant` 时还会因此自动退回 `solid` 圆点。
- **`solid` / `outline` 传了 `text` 也不显示。** 这两种变体最大只有 16px，装不下文字，组件直接跳过文本节点。需要带文字的角标请用 `textDot` 或 `textOutline`。
- **显式传 `variant` 后不再自动切换。** 自动选择只在不传 `variant` 时生效；写死 `variant="textDot"` 但 `text` 为空时，会渲染一个没有文字的实心圆，尺寸与文字角标相同。
- **`outline` 的外径是内径加两倍描边。** `size` 档位描述的是圆环内径，描边长在外圈，`lg` 实际占 16px。和 `solid` 混排时，两者外径不同，需要对齐时以外径为准。
- **`v-model:show` 不会被组件改写。** 组件内部没有任何关闭入口，`update:show` 从不触发。「点一下消失」这类逻辑要在宿主的点击事件里自己把绑定值改为 `false`。
- **`standalone` 目前没有效果。** 它只给角标节点追加 `absolute`，而角标节点的基础类里本就有 `absolute`。没有宿主时角标会相对空的定位容器摆放，不能指望这个属性让角标独立排版。
- **默认模式下角标会溢出宿主外框。** `inset` 为 `false` 时角标向外平移半个自身尺寸，宿主的祖先如果有 `overflow-hidden`（如卡片、滚动列表），角标会被裁掉一半。遇到这种情况改用 `inset`，或给容器留出内边距。
- **UniApp 端外层多一层块级 `<view>`。** 在行内排版里使用时，这层 `<view>` 会独占一行；需要和文字同行时，给父容器设 `flex` 布局。
