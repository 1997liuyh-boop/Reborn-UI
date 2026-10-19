---
title: AvatarGroup 头像组
description: 重叠展示成员头像，支持尺寸形状继承、数量折叠、隐藏头像浮层与结构化样式覆盖。
category: 数据展示
platform: web
tags: [css, tailwind, avatar, avatar-group, tooltip]
badge: New
---

::ComponentViewer{demoFile="RebornAvatarGroupDemo.vue" config="RebornAvatarGroupConfig" componentId="reborn-avatar-group" :componentFiles='["RebornAvatarGroup.vue", "reborn-avatar-group.config.ts", "reborn-avatar-group.utils.ts"]'}
::

## 简介

AvatarGroup 将多个 `RebornAvatar` 以重叠方式排列，适合展示团队成员和参与者。目前仅提供 Web 实现，组件名为 `RebornAvatarGroup`。

`size`、`shape` 提供子头像的默认外观，`gap` 决定相邻头像的重叠距离；`collapseAvatars` 开启数量折叠，`maxCollapseAvatars` 决定直接展示多少个普通头像，剩余数量显示为 `+N`。子头像显式传参时可以单独覆盖组设置。

`collapseAvatarsTooltip` 为计数头像增加悬停与聚焦浮层，`effect`、`placement` 控制浮层主题与位置。`popperClass` / `popperStyle` 覆盖浮层，`collapseClass` / `collapseStyle` 覆盖计数头像，`ui` 按内部结构统一覆盖类名。

### 何时使用

- 项目卡片展示多名成员 —— 用默认插槽配合 `size`。
- 大量参与者需要控制空间 —— 开启 `collapseAvatars` 并指定 `maxCollapseAvatars`。
- 需要查看折叠的头像 —— 同时开启 `collapseAvatarsTooltip`。
- 组织与个人需要统一外观 —— 用 `shape` 提供组默认值。

### 何时不使用

- 只显示单个用户 —— 改用 `reborn-avatar`。
- 需要成员姓名、权限与操作的完整列表 —— 改用 `reborn-table`。
- 需要多选成员或搜索成员 —— 改用 `reborn-select`，头像仅作为选项内容。

## 用法

### 基础头像组

默认插槽中直接放置 `RebornAvatar`，头像默认以 8px 重叠距离排列，描边区分相邻边界，通过 `gap` 可自定义距离。

```vue
<template>
  <RebornAvatarGroup aria-label="项目成员">
    <RebornAvatar src="/avatar-a.png" alt="林舟" />
    <RebornAvatar src="/avatar-b.png" alt="陈雨" />
    <RebornAvatar alt="周宁">周</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

### 尺寸与形状

组的 `size`、`shape` 只提供默认值，子头像显式传值时使用子项配置。

| 维度 | 取值 | 典型用途 |
| --- | --- | --- |
| `size` | `sm` / `md` / `lg` / 正数 px | 列表、导航、成员卡片 |
| `shape` | `circle` / `square` | 个人或组织标识 |

```vue
<template>
  <RebornAvatarGroup size="lg" shape="square">
    <RebornAvatar src="/avatar-a.png" alt="林舟" />
    <RebornAvatar src="/avatar-b.png" alt="陈雨" />
    <RebornAvatar size="sm" shape="circle">周</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

### 重叠距离

`gap` 默认 `8`，单位为 px，数值越大重叠越多；`0` 表示不重叠。普通头像和计数头像使用相同距离，浮层内部的头像间距不受影响。

```vue
<template>
  <RebornAvatarGroup :gap="12">
    <RebornAvatar>林</RebornAvatar>
    <RebornAvatar>陈</RebornAvatar>
    <RebornAvatar>周</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

### 折叠头像

`collapseAvatars` 默认关闭；开启后保留前 `maxCollapseAvatars` 个普通头像，超出的头像用 `+N` 汇总。

```vue
<template>
  <RebornAvatarGroup collapse-avatars :max-collapse-avatars="2">
    <RebornAvatar>林</RebornAvatar>
    <RebornAvatar>陈</RebornAvatar>
    <RebornAvatar>周</RebornAvatar>
    <RebornAvatar>苏</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

::tip
计数头像不占普通头像的名额。`maxCollapseAvatars` 的小数向下取整，最少保留一个；无效数值回退到一个。
::

### 悬停查看

同时开启 `collapseAvatars` 与 `collapseAvatarsTooltip`，悬停或键盘聚焦 `+N` 可查看全部隐藏头像；鼠标可移入浮层继续查看。

| 参数 | 取值 | 典型用途 |
| --- | --- | --- |
| `effect` | `light` / `dark` | 浅色或深色面板 |
| `placement` | 四个方向及各自 `-start` / `-end` | 按页面边界选择位置 |

```vue
<template>
  <RebornAvatarGroup collapse-avatars collapse-avatars-tooltip :max-collapse-avatars="1" effect="dark" placement="top">
    <RebornAvatar>林</RebornAvatar>
    <RebornAvatar>陈</RebornAvatar>
    <RebornAvatar>周</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

### 自定义样式

`ui` 按结构覆盖组样式；计数头像和浮层同时提供类名与行内样式入口。

```vue
<template>
  <RebornAvatarGroup
    :gap="12" collapse-avatars collapse-avatars-tooltip
    :ui="{ root: 'p-3 rounded-xl bg-primary/5' }"
    collapse-class="bg-primary/10 text-primary"
    :collapse-style="{ fontWeight: 700 }"
    popper-class="border-primary/30 shadow-xl" popper-style="padding: 16px"
  >
    <RebornAvatar>林</RebornAvatar>
    <RebornAvatar>陈</RebornAvatar>
    <RebornAvatar>周</RebornAvatar>
  </RebornAvatarGroup>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| size | `'sm' \| 'md' \| 'lg' \| number` | - | 子头像默认大小，未配置时最终为 `md`；三档为 24 / 32 / 40px，数值单位 px |
| shape | `'circle' \| 'square'` | - | 子头像默认形状，未配置时最终为 `circle` |
| gap | `number` | `8` | 相邻头像重叠距离，单位 px；`0` 表示不重叠，负数按 `0` 处理，非有限数值回退到 `8` |
| collapseAvatars | `boolean` | `false` | 是否折叠超出上限的头像 |
| collapseAvatarsTooltip | `boolean` | `false` | 开启折叠后，悬停或聚焦计数头像时显示隐藏头像 |
| maxCollapseAvatars | `number` | `1` | 折叠时直接显示的普通头像数，至少一个，不包含计数头像 |
| effect | `'light' \| 'dark' \| string` | `light` | 浮层主题，自定义名称写入面板 `data-effect`，默认使用浅色样式 |
| placement | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | `top` | 浮层方位，空间不足时自动调整 |
| popperClass | `string` | `''` | 浮层面板追加类名 |
| popperStyle | `string \| CSSProperties` | - | 浮层面板行内样式 |
| collapseClass | `string` | `''` | 计数头像外框追加类名 |
| collapseStyle | `string \| CSSProperties` | - | 计数头像外框行内样式 |
| class | `ClassValue` | - | 组容器追加类名 |
| ui | `AvatarGroupUI` | `{}` | 按内部结构覆盖类名 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| default | - | 直接放置 `RebornAvatar`；支持 `v-for` 和 `v-if` 片段，不要包额外的 DOM 元素 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| root | 头像组容器，默认 `inline-flex items-center` |
| item | 可见头像与计数头像的包装层，后续项按 `gap` 向前重叠，默认 8px |
| collapse | 计数头像外框，仅存在隐藏头像时渲染；与 `collapseClass` 合并 |
| tooltip | 隐藏头像浮层面板，默认换行、8px 间距；仅开启折叠浮层时存在，与 `popperClass` 合并 |

```vue
<RebornAvatarGroup :gap="12" :ui="{ root: 'p-2 bg-gray-2 rounded-xl' }">
  <RebornAvatar>林</RebornAvatar>
  <RebornAvatar>陈</RebornAvatar>
</RebornAvatarGroup>
```

### CSS 变量

`--rb-avatar-group-gap` 在 `app/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue` 中按 `gap` 写入，由 `reborn-avatar-group.config.ts` 中的 Tailwind 负边距类消费。

| 变量名 | 对应取值 | 值 |
| --- | --- | --- |
| `--rb-avatar-group-gap` | `gap` | 默认 `8px`，负数为 `0px`，非有限值回退到 `8px` |

## 注意事项

- **浮层依赖折叠开关**。仅设置 `collapseAvatarsTooltip` 不会折叠头像，必须同时开启 `collapseAvatars`，且实际存在超出上限的成员。
- **只统计直接插槽项**。会展开 `template` 与 `v-for` 片段并忽略注释、空文本；额外 DOM 包装会作为一个项，不能代表内部多个头像。
- **子头像显式传值优先**。尺寸和形状通过上下文响应式继承，浮层中的头像和计数头像同样遵守这一规则。
- **`gap` 表示重叠距离**。只影响主头像组，相同尺寸下数值越大排列越紧密；通常应小于头像宽度，避免完全遮住前面的头像。
- **隐藏头像在展开浮层时才挂载**。折叠后不会为不可见成员预先请求图片；关闭浮层后销毁隐藏头像，不影响可见成员。
- **浮层复用现有 Tooltip**。默认挂载到 `body`，支持键盘聚焦与 Escape 关闭；`popperStyle` 作用于面板内容，不覆盖浮层定位坐标。
- **自定义主题需提供样式**。`effect` 的内置视觉为 `light` 和 `dark`，其他字符串作为 `data-effect` 标记，可配合 `ui.tooltip` 或 `popperClass` 设置外观。
- **当前仅 Web 实现**。没有同名 UniApp 组件。
