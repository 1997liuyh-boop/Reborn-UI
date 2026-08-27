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

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供；后四个键作用于移动端弹出的抽屉（内部渲染的 `RebornPopup`）：

| 键名          | 说明                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`        | 根节点（标签由 `as` 决定）。默认 `relative top-0 left-0 right-0 z-40 w-full bg-bg-base/80 backdrop-blur-md transition-all`，`sticky` 为真时叠加吸顶变体；底色、毛玻璃、层级改这里；`class` prop 也并到该节点。 |
| `container`   | 内容容器。默认 `mx-auto h-full flex items-center justify-between gap-4 max-w-(--ui-container) min-h-(--ui-header-height)`，限宽与左右内边距改这里（高度请用 `--ui-header-height`）。 |
| `left`        | 左侧区域。**仅存在 `left` / `title` 插槽、`title` prop 或切换按钮在左侧时渲染**，默认 `flex items-center gap-[8px] laptop:gap-[24px]`。                        |
| `title`       | 标题链接 `<NuxtLink>`，默认 `text-xl font-bold flex items-center gap-2 hover:opacity-80 shrink-0`。**仅传了 `to` 且有 `title` / `title` 插槽时渲染**；填充 `left` 插槽会替换掉整块兜底内容，`ui.title` 随之失效。 |
| `center`      | 中间区域。**仅填充了 default 插槽时渲染**，默认 `hidden lg:flex items-center justify-center gap-8 flex-1`——桌面端才显示，导航项间距改这里。                    |
| `right`       | 右侧区域。**仅填充了 `right` 插槽或切换按钮在右侧时渲染**，默认 `flex items-center justify-end gap-3 lg:flex-1`。                                             |
| `toggle`      | 移动端汉堡按钮。默认 `desktop:hidden text-text-secondary hover:bg-bg-sub rounded-lg transition-colors`。**仅在未填充 `toggle` 插槽时渲染**，填充该插槽会替换掉按钮，`ui.toggle` 随之失效。 |
| `popup`       | 移动端抽屉的根节点（透传给内部 `RebornPopup` 的 `ui.root`）。默认带 `z-[980]` 使其位于吸顶导航栏之下，层级与整体底色改这里。                                 |
| `popupHeader` | 抽屉头部。默认 `w-full flex items-center justify-between`。**仅在未填充 `header` 插槽时渲染**，填充该插槽会替换掉这块兜底内容（连带里面的标题链接）。          |
| `popupBody`   | 抽屉内容区。**仅存在 `body` / `content` / default 插槽时渲染**，默认无类名，内边距与滚动行为改这里。                                                          |
| `popupFooter` | 抽屉底部。**仅填充了 `footer` 插槽时渲染**，默认 `p-4 border-t border-border-divider`。                                                                       |

```vue
<template>
  <RebornHeader
    title="Reborn UI"
    to="/"
    sticky
    :ui="{
      root: 'bg-white/90 border-b border-gray-2',
      container: 'max-w-[1200px]',
      title: 'text-lg',
      popupBody: 'p-4',
    }"
  />
</template>
```