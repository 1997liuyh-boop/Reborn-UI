---
title: RootPortal 根门户
description: 将插槽内容传送到页面根部，避开祖先容器的裁剪。
category: 通用
platform: both
tags: [portal, overlay]
---

::ComponentViewer{demoFile="RebornRootPortalDemo.vue" config="RebornRootPortalConfig" componentId="reborn-root-portal" :componentFiles='["RebornRootPortal.vue"]' :uniappFiles='["RebornRootPortal.vue"]'}
::

## 简介

RootPortal 将默认插槽传送到页面根部，Web 使用 Vue `Teleport`，UniApp 使用对应平台的根门户能力。

组件只处理节点的挂载位置，不管理显隐、层级或交互。两端均不接收业务 props。

内容由 `default` 插槽提供；定位、样式、遮罩和键盘交互由插槽内容负责。

### 何时使用

- 自定义浮层被祖先 `overflow` 裁剪，现有浮层组件不能覆盖需求时，通过 `default` 插槽传送内容。
- 自定义提示需要挂到页面根部时，通过 `default` 插槽提供自行定位的节点。
- UniApp 需要根门户能力时，通过 `default` 插槽提供平台支持的内容。

### 何时不使用

- 常规说明浮层 —— 改用 `reborn-popover` 的 `portal`。
- 抽屉面板 —— 改用 `reborn-drawer` 的 `appendTo`。

## 用法

### 传送内容

`default` 插槽的节点挂到根部，内容使用 `fixed` 自行定位。

```vue
<template>
  <RebornRootPortal>
    <div class="fixed right-4 bottom-4 z-50 rounded-lg bg-gray-1 p-4">
      自定义浮层内容
    </div>
  </RebornRootPortal>
</template>
```

## API

### Props

不接收 props。

### Emits

不派发事件。

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 需要传送到根部的内容。 |

### Expose

不暴露实例成员。

### 自定义样式（ui）

没有 `ui` prop。Web 没有包装节点，直接在插槽内容上写 Tailwind 类名；原先未生效的 Web `config` 导出已移除。

### CSS 变量

没有组件专用 CSS 变量。

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 挂载方式 | `Teleport to="body"` | 小程序使用原生 `root-portal`，App 使用 RenderJS。 |
| 样式配置 | 不导出 config，不增加包装层。 | 保留平台原有配置。 |

## 注意事项

- **定位由内容负责**。传送后不再属于原 DOM 祖先，依赖父级定位和祖先选择器的样式需要调整。
- **组件不处理显隐与焦点**。需要这些能力时优先使用已有浮层组件。
- **Web 的 body 目标需由客户端提供**。SSR 场景应按宿主框架的 Teleport 策略处理根部内容。
