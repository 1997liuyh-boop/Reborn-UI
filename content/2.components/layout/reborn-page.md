---
title: 页面容器 Page
description: 用于 uniapp 页面最外层的页面容器组件，可配置页面标题与描述文案。
category: 布局
tags: [uniapp, layout, page]
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

## 基础用法

RebornPage 是 uniapp 页面的最外层根容器，提供统一的页面级结构：`title` 与 `description` 渲染默认页面头部，默认插槽承载页面主体内容（body 区域自带内边距与子元素间距）。需要完全自定义头部区域时，使用 `header` 插槽替换默认的标题/描述渲染。

组件内部还挂载了 RebornToast，包裹在 RebornPage 中的页面可以直接调用 toast 提示，无需再单独引入挂载点。接口刻意保持精简：仅 `title` / `description` / `customClass` / `ui` 四个 props 与 `header` / `default` 两个插槽，无事件。

::ComponentViewer{demoFile="RebornPageDemo.vue" config="RebornPageConfig" componentId="reborn-page" :componentFiles='[]' :uniappFiles='["RebornPage.vue", "reborn-page.config.ts"]'}
::

## API

### Props

| 属性名        | 类型     | 默认值 | 描述                                       |
| :------------ | :------- | :----- | :----------------------------------------- |
| `title`       | `string` | `''`   | 页面标题，渲染在默认头部区域               |
| `description` | `string` | `''`   | 页面描述文案，渲染在标题下方               |
| `customClass` | `string` | `''`   | 追加到页面根容器的自定义类名               |
| `ui`          | `PageUI` | `{}`   | 分区样式覆盖对象，键位见下方 PageUI 键位表 |

### Emits

纯布局容器组件，无抛出事件。

### Slots

| 插槽名    | 描述                                                  |
| :-------- | :---------------------------------------------------- |
| `header`  | 自定义页面头部区域，提供后完全替换默认的标题/描述渲染 |
| `default` | 页面主体内容（body 区域）                             |

## 主题定制

### PageUI 键位

通过 `ui` 属性可按区域覆盖样式，各键位对应的结构区域如下：

| 键名          | 说明                                     |
| :------------ | :--------------------------------------- |
| `root`        | 页面根容器（默认铺满屏幕高度的浅色背景） |
| `header`      | 头部容器（标题与描述的外层）             |
| `title`       | 标题文本样式                             |
| `description` | 描述文本样式                             |
| `body`        | 主体内容容器（默认内边距与子元素间距）   |

## 注意事项

- 仅 uniapp 端可用；web 端页面主体布局请改用 `reborn-main`，普通内容分区容器请改用 `reborn-container`。
- `header` 插槽提供后会整体替换 `title` / `description` 的默认渲染，两者不叠加。
- 组件已内置 RebornToast 挂载点，页面内无需重复引入。
