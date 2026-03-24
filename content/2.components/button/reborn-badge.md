---
title: 徽章 Badge
description: 用于展示状态、数量或重要标识的微型标签。支持多种色彩、感官风格及跨端适配。
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
| `variant` | `BadgeVariant` | `'solid'` | - | 视觉风格：`solid`, `outline`, `soft`, `subtle` 等。 |
| `size` | `BadgeSize` | `'md'` | - | 尺寸规格：`sm`, `md`, `lg`。 |
| `icon` | `string` | - | **UniApp 专用** | 直接传入图标类名。Web 端建议使用插槽。 |
| `square` | `boolean` | `false` | - | 是否为正方形（等宽高）。 |
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
| `close` | `(event: MouseEvent)` | 点击关闭按钮时触发。 |
| `click` | `(event: Event)` | 点击整个徽标时触发（UniApp 显式定义）。 |
| `update:show`| `(value: boolean)` | `v-model:show` 同步事件。 |

## UI 自定义配置 (Config)

可以通过 `ui` 属性对组件内部结构进行精细化样式注入：

```typescript
// Web 端 UiProps 结构
{
  root?: string        // 动画容器层
  base?: string        // 徽标主体内容
  label?: string       // 文本层
  leadingIcon?: string // 前置图标
  trailingIcon?: string// 后置图标
  closeButton?: string // 关闭按钮容器
}

// UniApp 端 UiProps 结构 (额外支持)
{
  root?: string
  base?: string
  label?: string
  leadingIcon?: string
  trailingIcon?: string
  closeButton?: string
  closeIcon?: string
}
```

