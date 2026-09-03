---
title: 徽章 Badge
description: 用于展示状态、数量或标识的跨端徽标组件，支持圆角胶囊、可关闭、可选中（Check Tag）与显隐绑定。
category: 按钮
tags: [css, tailwind, badge, uniapp, cross-platform]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
---

::ComponentViewer{demoFile="RebornBadgeDemo.vue" config="RebornBadgeConfig" componentId="reborn-badge" :componentFiles='["RebornBadge.vue", "reborn-badge.config.ts"]' :uniappFiles='["RebornBadge.vue", "reborn-badge.config.ts"]'}
::

## 跨端差异说明

Reborn UI 致力于在 Web (Nuxt 3) 和 UniApp 平台提供一致的开发体验，但受限于平台特性，部分 API 存在细微差异。

### Props 属性

| 属性名 | 类型 | 默认值 | 平台差异 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `v-model:show` | `boolean` | `true` | - | 控制徽标显示/隐藏，支持动画。 |
| `label` | `string \| number` | - | - | 徽标显示的文本内容。 |
| `color` | `BadgeColor` | `'primary'` | - | 语义化颜色，详见下方配置。 |
| `variant` | `BadgeVariant` | `'filled'` | - | 视觉风格：`filled`, `outlined`, `soft`, `subtle` 等。 |
| `size` | `BadgeSize` | `'md'` | - | 尺寸规格：`sm`, `md`, `lg`。 |
| `icon` | `string` | - | **UniApp 专用** | 直接传入图标类名。Web 端建议使用插槽。 |
| `square` | `boolean` | `false` | - | 是否为正方形（等宽高）。 |
| `round` | `boolean` | `false` | - | 圆角标签：与按钮组件一致变为全圆角胶囊。 |
| `check` | `boolean` | `false` | - | 可选中模式：作为类复选框的 Check Tag 使用。 |
| `v-model:checked` | `boolean` | `false` | - | 可选中模式下的选中态；未选中时徽标退为灰阶。 |
| `disabled` | `boolean` | `false` | - | 是否禁用（屏蔽选中切换与关闭交互）。 |
| `closable` | `boolean` | `false` | - | 是否显示关闭按钮。 |
| `closeIcon` | `string` | - | **默认值差异** | Web 默认为 `i-lucide-x`；UniApp 默认为 `i-mdi-close-circle`。 |
| `as` | `any` | `'span'` | **Web 专用** | 指定渲染的 HTML 标签或组件。 |
| `beforeClose` | `Function` | - | **Web 专用** | 关闭前的钩子函数，支持异步阻断。 |
| `gap` | `boolean` | `false` | - | 多个徽标并排时是否自动添加左间距。 |
| `class` | `any` | - | **Web 专用** | 容器类名。 |
| `customClass` | `any` | - | **UniApp 专用** | 容器类名（避免 UniApp 原生 class 冲突）。 |
| `ui` | `object` | `{}` | - | 深度定制内部各组件样式的对象。 |

### Slots 插槽

| 插槽名 | 作用域 (Web) | 说明 |
| :--- | :--- | :--- |
| `default` | `{ ui }` | 徽标主体内容，覆盖 `label`。 |
| `leading` | `{ ui }` | 前置内容，通常用于图标、小头像。 |
| `trailing` | `{ ui }` | 后置内容。 |
| `close` | `{ ui, close }` | 自定义关闭按钮。 |


### Emits 事件

| 事件名 | 参数 | 平台说明 |
| :--- | :--- | :--- |
| `close` | `(event: MouseEvent)` | 点击关闭按钮时触发；徽标以 200ms 的缩放淡出动画收起。 |
| `click` | `(event: Event)` | 点击整个徽标时触发（双端一致）。 |
| `change` | `(checked: boolean)` | 可选中模式下点击切换选中态时触发。 |
| `update:show`| `(value: boolean)` | `v-model:show` 同步事件。 |
| `update:checked`| `(value: boolean)` | `v-model:checked` 同步事件。 |

## 视觉规格

尺寸三档：`sm` 高 18px / 字号 12px，`md` 高 24px / 字号 12px，`lg` 高 32px / 字号 14px，水平内边距统一 6px（UniApp 端按 rpx 双倍取值）。

配色按「语义色 → 色相族」映射到设计令牌的数字色阶，各视觉风格的取阶规则：

| 风格 | 背景 | 边框 | 文字 |
| :--- | :--- | :--- | :--- |
| `subtle` | `[color]-2` | `1px solid [color]-4` | `[color]-6`（neutral 用 `gray-9` 正文色） |
| `soft` | `[color]-2` | - | `[color]-6`（neutral 用 `gray-9` 正文色） |
| `outlined` | 透明 | `1px solid [color]-4` | `[color]-6`（neutral 用 `gray-9` 正文色） |
| `filled` | `[color]-6` | - | `gray-1`（纸面色） |

UniApp 端调色板差异：主色即 red 系（primary→red）；无独立 secondary 色阶、gray 只到 8 阶，因此 secondary 走灰阶、neutral 文字用 `gray-8` 顶替 `gray-9`。

## 可选中标签

开启 `check` 后徽标即为类复选框的 Check Tag：点击切换 `v-model:checked` 并触发 `change`；未选中时按当前 `variant` 统一退为灰阶（`subtle`/`soft` 底色 `gray-1`、`outlined` 边框 `gray-2`、`filled` 底色 `gray-2`，文字均为 `gray-6`），`disabled` 可禁用交互。

```vue
<template>
  <RebornBadge
    check
    v-model:checked="checked"
    variant="soft"
    label="热销"
    @change="onTagChange"
  />
</template>
```

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端键名相同，但个别键的生效条件不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名           | 说明                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 最外层动画容器（`RebornTransition`）。默认 `reborn-badge cursor-pointer`，显隐过渡与外边距、定位加在这里。                                          |
| `base`         | 徽标主体（标签名由 `as` 决定）。默认 `inline-flex items-center justify-center font-medium whitespace-nowrap overflow-hidden`，底色、圆角、内边距、字号都在这里，尺寸/配色变体也作用于它。 |
| `label`        | 文本包裹层，默认 `inline-flex items-center justify-center truncate max-w-full min-w-0`。**该节点在 default 插槽外层**，因此填充 default 插槽后它依然存在，`ui.label` 仍生效。 |
| `leadingIcon`  | 前置图标类名。模板本身不渲染前置图标，需要在 `leading` 插槽里自行取用：`<template #leading="{ ui }">`，再把 `ui.leadingIcon()` 挂到你的图标上。      |
| `trailingIcon` | 后置图标类名，用法同 `leadingIcon`，通过 `trailing` 插槽的作用域参数取用。                                                                          |
| `closeButton`  | 关闭按钮容器。**仅 `closable` 为真时渲染**，默认 `inline-flex items-center justify-center rounded-full hover:bg-black/10`。                        |
| `closeIcon`    | 关闭图标。**仅 `closable` 为真且未填充 `close` 插槽时渲染**，填充该插槽会替换掉图标节点，`ui.closeIcon` 随之失效（插槽作用域里可拿到 `ui` 自行套用）。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名           | 说明                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`         | 最外层动画容器（`RebornTransition` 的 `custom-class`）。默认 `reborn-badge inline`。                                                            |
| `base`         | 徽标主体 `<view>`。默认 `inline-flex items-center justify-center font-medium whitespace-nowrap overflow-hidden`，底色、圆角、内边距、字号在这里；`customClass` 也会并到同一节点。 |
| `label`        | 文本包裹 `<view>`，默认 `truncate`。**仅在传了 `label` 或填充了 default 插槽时渲染**；该节点在插槽外层，填充插槽不影响它生效。                  |
| `leadingIcon`  | 前置图标 `<view>`（类名图标）。**仅在传了 `icon` 且未填充 `leading` 插槽时渲染**，填充该插槽会替换掉图标节点，`ui.leadingIcon` 随之失效。       |
| `trailingIcon` | 后置图标类名。UniApp 端模板未渲染后置图标（`trailing` 插槽也不透出 `ui`），当前传入不会生效，保留该键仅为与 Web 端对齐。                        |
| `closeButton`  | 关闭按钮容器 `<view>`。**仅 `closable` 为真时渲染**，默认 `inline-flex items-center justify-center rounded-full hover:bg-black/10`。            |
| `closeIcon`    | 关闭图标 `<view>`（与 `closeIcon` prop 的类名一起作用）。**仅 `closable` 为真且未填充 `close` 插槽时渲染**，填充该插槽会使其失效。              |

:::

::

```vue
<template>
  <RebornBadge
    label="新"
    closable
    :ui="{
      base: 'bg-error/10 text-error',
      label: 'tracking-wide',
      closeButton: 'hover:bg-error/20',
    }"
  />
</template>
```

