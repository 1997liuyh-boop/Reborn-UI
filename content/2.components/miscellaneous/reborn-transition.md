---
title: Transition 过渡
description: 过渡动画容器，支持 fade / slide / zoom。
category: Miscellaneous
navigation:
  badges:
    - label: 通
      color: primary
---

::ComponentViewer{demoFile="RebornTransitionDemo.vue" config="RebornTransitionConfig" componentId="reborn-transition" :componentFiles='["RebornTransition.vue", "reborn-transition.config.ts"]' :uniappFiles='["RebornTransition.vue", "reborn-transition.config.ts"]'}
::

# API

## Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `show` | `Boolean` | `false` | 是否展示组件 |
| `duration` | `Number \| Object \| Boolean` | `300` | 过渡动画持续时间，单位 ms。可传入对象如 `{ enter: 300, leave: 300 }`。传入 `false` 为禁用动画 |
| `lazyRender` | `Boolean` | `false` | 是否懒加载，为 `true` 时，只有在第一次出现时才会渲染内部元素 |
| `name` | `String \| Array` | `fade` | 过渡动画名称，可选值为 `fade` `fade-up` `fade-down` `fade-left` `fade-right` `slide-up` `slide-down` `slide-left` `slide-right` `zoom-in` `zoom-out` |
| `destroy` | `Boolean` | `true` | 是否在隐藏时销毁内容 |
| `customClass` | `String` | `''` | 组件自定义类名 |
| `customStyle` | `String` | `''` | 组件自定义样式 |
| `disableTouchMove` | `Boolean` | `false` | (仅UniApp) 是否禁用触摸移动 |

## Emits

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `click` | 点击组件时触发 | - |
| `before-enter` | 进入前触发 | - |
| `enter` | 进入中触发 | - |
| `after-enter` | 进入后触发 | - |
| `before-leave` | 离开前触发 | - |
| `leave` | 离开中触发 | - |
| `after-leave` | 离开后触发 | - |

## 差异说明
- **Web 端**：
  - 基于 DOM 原生重绘机制与 CSS 类切换 (`requestAnimationFrame` + 强制 Reflow) 实现细粒度动画控制。
  - `disableTouchMove` 属性被忽略。
- **UniApp 端**：
  - 保留原有基于 `Promise` 分步计时触发的动画驱动。
  - 完整支持 `disableTouchMove` 阻止滚动透传。
