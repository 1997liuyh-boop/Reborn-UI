---
title: Avatar 头像
description: 展示图片、图标或文字头像，支持三档固定尺寸、自定义像素尺寸、图片失败回退和头像组继承。
category: 数据展示
platform: web
tags: [css, tailwind, avatar, image]
badge: New
---

::ComponentViewer{demoFile="RebornAvatarDemo.vue" config="RebornAvatarConfig" componentId="reborn-avatar" :componentFiles='["RebornAvatar.vue", "reborn-avatar.config.ts", "reborn-avatar.context.ts"]'}
::

## 简介

Avatar 用图片、图标或简短文字标识用户或组织，目前仅提供 Web 实现，组件名为 `RebornAvatar`。

`size` 决定头像的宽高，`shape` 决定圆形或方形，`fit` 决定图片如何适应外框。三档尺寸为 `sm` 24px、`md` 32px、`lg` 40px，也可传入数字指定像素。

`src`、`srcSet` 和 `alt` 对应图片内容；图片不可用时显示 `icon` 或默认插槽，加载失败触发 `error`。`class` 与 `ui` 覆盖样式，置于 `RebornAvatarGroup` 中时继承组的尺寸和形状。

### 何时使用

- 用户列表或评论作者需要个人标识 —— 用 `src` 和有意义的 `alt`。
- 无头像照片的账号 —— 用 `icon` 或默认插槽提供姓名首字。
- 不同密度的列表 —— 用 `size="sm"`、`md` 或 `lg`。
- 图片加载不稳定 —— 监听 `error`，通过默认插槽提供回退文字。

### 何时不使用

- 产品图、内容封面等大图展示 —— 改用原生 `img` 或 `NuxtImg`。
- 多名成员需要重叠与折叠 —— 改用 `reborn-avatar-group`。
- 需要上传或裁剪个人照片 —— 上传入口使用 `reborn-upload`，裁剪需另行实现。

## 用法

### 头像内容

图片优先于 `icon`，`icon` 优先于默认插槽；`srcSet` 原样传给图片的原生 `srcset`，可不传 `src` 单独使用。

| 内容 | 输入 | 典型用途 |
| --- | --- | --- |
| 图片 | `src` / `srcSet` | 用户照片 |
| 图标 | `icon` 字符串或 Vue 组件 | 无照片的账号、组织 |
| 自定义内容 | 默认插槽 | 姓名首字、自定义标识 |

```vue
<template>
  <RebornAvatar src="/avatar.png" alt="林舟" />
  <RebornAvatar icon="lucide:user-round" alt="个人账号" />
  <RebornAvatar alt="林舟">林</RebornAvatar>
  <RebornAvatar src-set="/avatar.png 1x, /avatar@2x.png 2x" alt="陈雨" />
</template>
```

### 尺寸

`size` 未传时继承头像组，独立使用时为 `md`；数字以 px 为单位。

| `size` | 宽高 | 典型用途 |
| --- | --- | --- |
| `sm` | 24px | 紧凑列表 |
| `md` | 32px | 常规列表与导航 |
| `lg` | 40px | 评论与成员卡片 |
| 正数 | 指定像素 | 个人资料等更大头像 |

```vue
<template>
  <RebornAvatar size="sm">林</RebornAvatar>
  <RebornAvatar size="md">林</RebornAvatar>
  <RebornAvatar size="lg">林</RebornAvatar>
  <RebornAvatar :size="56">林</RebornAvatar>
</template>
```

### 形状

`shape` 未传时继承头像组，独立使用时为 `circle`。

| `shape` | 外观 | 典型用途 |
| --- | --- | --- |
| `circle` | 圆形 | 个人身份 |
| `square` | 方形，默认 6px 圆角 | 组织与品牌 |

```vue
<template>
  <RebornAvatar shape="circle" src="/avatar.png" alt="林舟" />
  <RebornAvatar shape="square" icon="lucide:building-2" alt="组织账号" />
  <RebornAvatar shape="square" :ui="{ root: 'rounded-xl' }">RE</RebornAvatar>
</template>
```

### 图片适应

`fit` 默认 `cover`，仅对图片生效，对应原生 CSS `object-fit`。

示例使用 160×96px 大图与 40×24px 小图，对比同一 96×72px 外框下的效果。`scale-down` 在大图上与 `contain` 相同，在小图上保留原始尺寸，不会放大。

| `fit` | 图片表现 | 典型用途 |
| --- | --- | --- |
| `fill` | 拉伸铺满 | 可接受变形的素材 |
| `contain` | 完整显示，可能留白 | 不可裁剪的标识 |
| `cover` | 等比铺满，超出裁剪 | 用户照片 |
| `none` | 保留原始尺寸 | 查看原始裁剪范围 |
| `scale-down` | 原始尺寸与完整缩小取较小者 | 小图不放大 |

```vue
<template>
  <RebornAvatar src="/avatar.png" fit="cover" alt="林舟" />
  <RebornAvatar src="/brand.png" fit="contain" shape="square" alt="品牌" />
  <RebornAvatar src="/brand.png" fit="scale-down" :size="56" alt="品牌" />
</template>
```

### 回退行为

图片加载失败时触发 `error`，依次尝试 `icon`、默认插槽；更换 `src` 或 `srcSet` 后自动重新加载图片。

| 回退内容 | 配置 | 典型用途 |
| --- | --- | --- |
| 图标 | `icon` | 未上传头像或加载失败的账号 |
| 文字 | 默认插槽 | 通过姓名首字保留身份信息 |
| 默认图片 | 默认插槽中的 `img` | 业务统一的备用头像 |

```vue
<script setup lang="ts">
function handleError(event: Event) {
  console.warn('头像加载失败', event.type)
}
</script>

<template>
  <RebornAvatar src="/missing-avatar.png" icon="lucide:user-round" alt="个人账号" />
  <RebornAvatar src="/missing-avatar.png" alt="林舟" @error="handleError">林</RebornAvatar>
  <RebornAvatar src="/missing-avatar.png" alt="默认头像" :ui="{ fallback: 'size-full p-0' }">
    <img src="/default-avatar.png" alt="" class="size-full object-cover">
  </RebornAvatar>
</template>
```

### 显示徽标

与 `RebornBadge` 组合，通过 `label` 显示未读数量，通过空内容和 `ui.base` 显示状态点；外层容器使用 `relative`，徽标的 `ui.root` 负责右上角定位。

| 提醒 | 配置 | 典型用途 |
| --- | --- | --- |
| 未读数量 | `label` 和 `show` | 用 `show` 在数量为零时隐藏；超出上限时由业务传入 `99+` |
| 状态点 | 不传 `label`，通过 `color` 和 `ui.base` 设置颜色与尺寸 | 在线、离线等状态；同时提供文字说明 |

```vue
<template>
  <div class="relative inline-flex">
    <RebornAvatar size="lg" src="/avatar.png" alt="林舟" />
    <RebornBadge
      :label="8" size="sm" color="error" round
      :ui="{
        root: 'absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 cursor-default',
        base: 'ring-2 ring-gray-1',
      }"
    />
  </div>
</template>
```

```vue
<template>
  <div class="relative inline-flex">
    <RebornAvatar size="lg" src="/avatar.png" alt="周宁" />
    <RebornBadge
      color="success" size="sm" round
      :ui="{
        root: 'absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 cursor-default',
        base: 'size-2.5! p-0 ring-2 ring-gray-1',
      }"
    />
  </div>
  <span>在线</span>
</template>
```

### 自定义样式

`ui` 按内部节点覆盖 Tailwind 类名；`class` 追加到头像外框。

```vue
<template>
  <RebornAvatar
    size="lg"
    :ui="{ root: 'bg-primary/10 text-primary ring-2 ring-primary/30', fallback: 'font-semibold' }"
  >RE</RebornAvatar>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| icon | `string \| Component` | - | 图标名称或 Vue 组件，图片不可用时优先于默认插槽 |
| size | `'sm' \| 'md' \| 'lg' \| number` | 继承组，最终 `md` | 24 / 32 / 40px；数字为像素，非正数或非有限数回退到 32px |
| shape | `'circle' \| 'square'` | 继承组，最终 `circle` | 圆形或方形 |
| src | `string` | - | 图片地址 |
| srcSet | `string` | - | 原生 `srcset`，模板可写 `src-set` |
| alt | `string` | - | 图片替代文字；回退内容也以此作为无障碍名称 |
| fit | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `cover` | 图片适应外框的方式 |
| class | `ClassValue` | - | 根节点追加类名 |
| ui | `AvatarUI` | `{}` | 按内部结构覆盖类名 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| error | `event: Event` | 原生图片加载失败时触发；组件随即显示回退内容 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| default | - | 无图片或图片失败、且无 `icon` 时展示的自定义内容 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| root | 外框，默认居中、裁剪溢出、灰色背景；尺寸和圆角由变体决定 |
| image | 图片，默认 `block size-full`，仅图片可用时存在 |
| icon | 图标，默认宽高为外框的 60%，仅使用 `icon` 时存在 |
| fallback | 默认插槽容器，默认单行截断；图片或图标生效时不渲染 |

```vue
<RebornAvatar icon="lucide:leaf" :ui="{ root: 'bg-success/10 text-success', icon: 'size-5' }" />
```

### CSS 变量

`--rb-avatar-size` 在 `app/components/reborn/ui/reborn-avatar/RebornAvatar.vue` 中按数字尺寸写入，由 `reborn-avatar.config.ts` 的自定义尺寸变体消费。

| 变量名 | 对应取值 | 值 |
| --- | --- | --- |
| `--rb-avatar-size` | 数字 `size` | 正数转换为 px，无效数字为 `32px`；枚举尺寸不写入 |

## 注意事项

- **默认插槽是回退内容**。有效图片优先显示，其次为 `icon`；需要显示首字时不要同时传图标。
- **徽标放在头像外层**。头像外框会裁剪溢出，且默认插槽只在回退时显示；使用共同的定位容器，将徽标与头像并列放置，避免右上角徽标被裁掉。
- **更换图片候选会重试**。失败状态不会自动循环加载，同一地址需由业务更换后重试，避免网络错误导致无限请求。
- **子头像显式配置优先**。组内未传 `size` 或 `shape` 的头像才继承组设置，折叠计数头像也遵守组设置。
- **长文本默认截断**。文字不会自动缩放，建议使用一至两个字符；更长标识可增大 `size` 或覆盖 `ui.fallback`。
- **当前仅 Web 实现**。没有同名 UniApp 组件，不可直接用于小程序模板。
