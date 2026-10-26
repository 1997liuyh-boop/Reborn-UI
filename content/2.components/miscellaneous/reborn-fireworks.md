---
title: 礼花
description: 用于给容器内元素附加点击礼花/烟花粒子特效的组件，仅 web 端。
category: 特效
platform: web
tags: [css, tailwind, canvas]
badge: New
---

::ComponentViewer{demoFile="RebornFireworksDemo.vue" config="RebornFireworksConfig" componentId="reborn-fireworks" :componentFiles='["RebornFireworks.vue"]'}
::

## 简介

Fireworks 是仅 Web 的点击粒子特效容器，可围绕内容或在窗口上绘制礼花。

`burstCount` 决定数量，`angleCenter` / `angleSpread` 决定方向，`speedMin` / `speedMax` 决定初速范围。

`teleport` 选择画布层级，`particleScale` 调整粒子尺寸；默认与 `overlay` 插槽提供内容和发射状态，实例 `launch` 可程序化触发。

### 何时使用

- 按钮完成操作后需要一次礼花反馈——用 `burstCount` 控制粒子数量。
- 容器裁切会遮住粒子——用 `teleport` 将画布放到窗口层。
- 需要调整绽放方向——用 `angleCenter` / `angleSpread` 控制角度。

### 何时不使用

- 需要清晰的操作结果文字——改用 `reborn-toast`。
- 需要持续的等待状态——改用 `reborn-loading`。

## 用法

### 容器内绽放

`burstCount` 控制一次反馈的粒子数量，默认画布限于组件区域。

| 配置 | 典型用途 |
| --- | --- |
| `burstCount` | 控制粒子数量 |
| `particleScale` | 控制粒子尺寸 |

```vue
<template>
  <RebornFireworks :burst-count="80">
    <button type="button" class="rounded-lg px-4 py-2">
      完成操作
    </button>
  </RebornFireworks>
</template>
```

### 全屏弹出

`teleport` 将画布放到窗口层，避免局部容器裁切。

| 配置 | 典型用途 |
| --- | --- |
| `teleport` | 窗口范围展示 |
| `angleSpread` | 控制绽放角度范围 |

```vue
<template>
  <RebornFireworks teleport :angle-spread="180">
    <button type="button" class="rounded-lg px-4 py-2">
      显示礼花
    </button>
  </RebornFireworks>
</template>
```

## API

### Props
| 属性名          | 类型      | 默认值  | 描述                                             |
| --------------- | --------- | ------- | ------------------------------------------------ |
| `teleport` | `boolean` | `false` | 为true时画布覆盖整个浏览器窗口                   |
| `burstCount` | `number`  | `160`   | 礼花绽放的纸片数量                               |
| `angleCenter` | `number`  | `270`   | 绽放的中心角度（单位：度）                       |
| `angleSpread` | `number`  | `130`   | 扩散角度范围（单位：度） 如果填360度就是烟花扩散 |
| `speedMin` | `number`  | `8`     | 粒子初始速度的最小值                             |
| `speedMax` | `number`  | `25`    | 粒子初始速度的最大值                             |
| `particleScale` | `number`  | `1`     | 粒子尺寸的整体缩放比例（>1 变大，<1 变小）       |

### Slots

| 插槽名    | Props                               | 描述                                         |
| --------- | ----------------------------------- | -------------------------------------------- |
| `default` | `{ launch, launched, launchCount }` | 基础内容，按常规文档流撑开容器               |
| `overlay` | `{ launch, launched, launchCount }` | 有需要定位布局的元素内容，需要写在这个插槽中 |
### Expose

| 名称     | 类型                                              | 描述                                                    |
| -------- | ------------------------------------------------- | ------------------------------------------------------- |
| `launch` | `(elOrEvent?: HTMLElement \| MouseEvent) => void` | 通过 ref 调用触发绽放 不传值则默认在容器中心绽放 |


## 注意事项

- **透传属性落在容器上。** 组件有 Teleport 和容器两个根节点，`class`、`style`、`id`、`data-*` 与未声明的事件监听统一作用于容器 `div`，不会落到传送出去的全屏画布上。
- **`teleport` 可以在运行时切换。** 切换后组件重新取得画布、上下文与尺寸监听，正在飞行的粒子会画到新画布上，坐标系随之从容器坐标换成视口坐标。
