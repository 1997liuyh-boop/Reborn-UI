---
title: Overlay 遮罩
description: 用于弹层背后的全屏或局部遮罩组件，支持点击关闭与滚动锁定。
category: 通用
platform: both
tags: [overlay, modal, uniapp]
---

::ComponentViewer{demoFile="RebornOverlayDemo.vue" config="RebornOverlayConfig" componentId="reborn-overlay" :componentFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]' :uniappFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]'}
::

## 简介

Overlay 是双端遮罩组件，通过 `v-model` 控制显隐，并可承载默认插槽内容。

`absolute` 决定覆盖定位容器还是视口，`zIndex` 决定叠放层级；`duration` 控制淡入淡出时间。

交互策略由 `closeOnClickOverlay` 与 `lockScroll` 分别控制；外观通过 `customClass` / `customStyle` 追加。

### 何时使用

- 自研弹层需要独立控制背景遮罩时，使用 `v-model` 管理显隐。
- 定位容器需要局部覆盖时，使用 `absolute`。
- 遮罩需要阻止背景触摸滚动时，保持 `lockScroll` 开启。

### 何时不使用

- 需要完整弹窗交互 —— 改用 `reborn-dialog` 或 UniApp `reborn-popup`。
- 需要展示加载状态 —— 改用 `reborn-loading`。

## 用法

### 显隐与关闭

`v-model` 控制遮罩；`closeOnClickOverlay` 决定点击时是否关闭。

| 关闭策略 | 行为 | 典型用途 |
| --- | --- | --- |
| `closeOnClickOverlay=true` | 点击写回 `false` 并派发 `close` | 可取消的临时弹层 |
| `closeOnClickOverlay=false` | 点击保持显示 | 需要明确操作才能退出的流程 |

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
const visible = shallowRef(false)
</script>

<template>
  <RebornOverlay v-model="visible" :duration="300" />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `boolean` | `undefined` | 对应 `v-model`；未传时均关闭 |
| `duration` | Web `number` / UniApp `number \| boolean \| Record<string, number>` | `300` | 转发给过渡组件的动画时长，数值单位 ms |
| `lockScroll` | `Boolean` | `true` | 背景是否锁定滚动 |
| `zIndex` | `number` | Web `100` / UniApp `10` | 遮罩层级 |
| `closeOnClickOverlay` | `Boolean` | `true` | 是否允许点击遮罩层关闭 |
| `absolute` | `Boolean` | `false` | 是否绝对定位。开启后将在祖先元素(position非static)内展示，用于指定节点的部分遮罩 |
| `customClass` | `String` | `''` | 组件自定义类名 |
| `customStyle` | `String` | `''` | 组件自定义样式 |

### Emits

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `update:modelValue` | 遮罩层状态变化时触发 | `(val: Boolean)` |
| `close` | 关闭时触发 | - |
| `afterLeave` | 离场过渡完成后触发，仅 Web | - |
| `click` | 点击遮罩时触发，不受关闭策略限制，仅 UniApp | - |

### Slots

| 插槽名 | 说明 |
| --- | --- |
| `default` | 遮罩内自定义内容 |

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 模型声明默认值 / 初始显示 | `undefined`，未传时隐藏 | `undefined`，未传时隐藏 |
| 默认层级 | `100` | `10` |
| 滚动控制 | 共享全局滚动锁，离场后释放 | H5 使用滚动锁；过渡组件阻止触摸移动 |
| 特有事件 | `afterLeave` | `click` |

## 注意事项

- **两端显式空模型按隐藏展示。** `false`、`undefined`、`null` 不回退到此前本地值；点击关闭发送 `update:modelValue`，父级拒收时继续按父值显示。
- **局部遮罩需要定位祖先。** `absolute` 使用绝对定位，父容器应提供 `relative` 等定位样式以限定范围。
- **遮罩层级需与内容配套。** 两端 `zIndex` 默认值不同，组合其他弹层时显式设置层级，避免遮罩覆盖操作内容。
- **点击插槽内容可能触发关闭。** 组件在过渡根节点监听点击，交互内容应自行阻止冒泡。
- **非 H5 不宣称全局页面滚动锁。** UniApp 在过渡节点阻止触摸移动，原生滚动容器与小程序页面仍需在目标设备检查。
