---
title: 主体布局
description: 页面主体区域布局组件，自动适配 Header 高度。
category: 导航与布局
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornMainDemo.vue" config="RebornMainConfig" componentId="reborn-main" :componentFiles='["RebornMain.vue", "reborn-main.config.ts"]'}
::


## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `class` | `any` | - | 自定义类名。 |
| `ui` | `Partial<MainUI>` | `{}` | 内部组件 UI 配置对象。 |

## UI

### `ui`
| 名称 | 描述 |
| --- | --- |
| `base` | 主体容器的基础样式。默认包含 `min-h-[calc(100vh-var(--ui-header-height))]`。 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `default` | - | 容器内部插槽内容。 |
