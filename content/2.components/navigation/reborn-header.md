---
title: 标题
description: 用于站点顶部导航的响应式头部组件，移动端可切换为弹窗菜单。
category: 导航
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

# RebornHeader 头部

头部组件用于在多个页面之间进行导航，同时支持移动端响应式切换。

## 基础用法

通过 `title` 和 `to` 自动计算分页。

::ComponentViewer{demoFile="RebornHeaderDemo.vue" config="RebornHeaderConfig" componentId="reborn-header" :componentFiles='["RebornHeader.vue", "reborn-header.config.ts"]'}

## API

### Props

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | `'Nuxt UI'` | 导航栏标题文本 |
| `to` | `string` | `'/'` | 标题链接地址 |
| `toggleSide` | `'left' \| 'right'` | `'right'` | 移动端菜单切换按钮侧边 (左/右) |
| `mode` | `'modal' \| 'slideover' \| 'popup'` | `'popup'` | 移动端菜单模式 |
| `as` | `string` | `'header'` | 自定义根元素的包装标签 |
| `sticky` | `boolean` | `false` | 是否吸顶显示 |
| `autoClose` | `boolean` | `true` | 路由改变时是否自动关闭菜单 |
| `beforeToggle` | `() => boolean \| Promise<boolean>` | - | 菜单展开前的拦截函数 |
| `class` | `any` | - | 根元素的自定义类名 |
| `ui` | `Partial<RebornHeaderUI>` | `{}` | UI 插槽样式覆盖 |

### v-model

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `v-model:open` | `boolean` | `false` | 控制移动端菜单的展开/关闭状态 |

### Slots

| 插槽名 | 参数 | 描述 |
| --- | --- | --- |
| `default` | - | 导航栏中间区域内容 |
| `left` | - | 自定义左侧区域 |
| `title` | - | 自定义标题内容 |
| `right` | - | 自定义右侧区域 |
| `toggle` | `{ open: boolean, toggle: () => void }` | 自定义切换按钮 |
| `top` | - | 导航栏根容器顶部插槽 |
| `bottom` | - | 导航栏根容器底部插槽 |
| `header` | `{ close: () => void }` | 移动端弹窗头部背景 |
| `content` | `{ close: () => void }` | 移动端弹窗内容区 |
| `body` | - | 移动端弹窗主体 (位于 content 内) |
| `footer` | - | 移动端弹窗底部 |

### UI 配置

`ui` 属性支持以下键名的样式覆盖：

- `root`: 根元素
- `container`: 内容容器
- `left`: 左侧区域
- `title`: 标题链接
- `center`: 中间区域
- `right`: 右侧区域
- `toggle`: 切换按钮
- `popupHeader`: 弹窗头部
- `popupBody`: 弹窗内容
- `popupFooter`: 弹窗底部