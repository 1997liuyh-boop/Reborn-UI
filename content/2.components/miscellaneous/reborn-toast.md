---
title: Toast 轻提示
description: 用于短暂消息反馈的轻提示组件，通过 useToast() 服务式调用展示成功、失败、加载等状态。
category: 杂项
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornToastDemo.vue" config="RebornToastConfig" componentId="reborn-toast" :componentFiles='["RebornToast.vue", "index.ts"]' :uniappFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]'}
::

# API

## 用法
```ts
const toast = useToast()
```
**可用方法**：
- `toast.show(options)`
- `toast.close()`
- `toast.loading(options)`
- `toast.success(options)`
- `toast.error(options)`
- `toast.warning(options)`
- `toast.info(options)`

## ToastOptions

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `msg` | `String` | `''` | 提示文字内容 |
| `duration` | `Number` | `2000` | 显示时长，单位毫秒。设置为 `0` 则不会自动关闭 |
| `iconName` | `String` | `undefined` | 图标名称，可选值为 `success` `error` `warning` `loading` `info` |
| `position` | `String` | `'top'` | 显示位置，可选值为 `'top'` `'middle-top'` `'middle'` `'bottom'` |
| `show` | `Boolean` | `false` | 控制 Toast 显示隐藏 |
| `zIndex` | `Number` | `100` | 设置 Toast 容器和遮罩层的 z-index |
| `cover` | `Boolean` | `false` | 是否显示透明遮罩层（防止触摸穿透） |

## 差异说明
- **Web 端**：
  - 调用 `useToast()` 采用 DOM 创建注入 `document.body` 并通过 `provide/inject` 同步状态。
  - 过渡交互基于 `transition-group` 结合 CSS 缩放，实现了消息即时动态刷新替换和平滑渐变。
- **UniApp 端**：
  - 基于 `<page-meta>` 防滚动透传与全局 `ref` 进行组件复用挂载。
  - 支持额外控制 `loadingType` 动画加载器样式与 SVG base64 内联编排。用内置的 svg base64 图标。
