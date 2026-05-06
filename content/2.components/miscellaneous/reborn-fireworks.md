---
title: 礼花
description: 可为容器内任意元素附加点击烟花特效。
category: 杂项
tags: [css, tailwind, canvas]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornFireworksDemo.vue" config="RebornFireworksConfig" componentId="reborn-fireworks" :componentFiles='["RebornFireworks.vue"]'}

#api

## API

| 属性名        | 类型      | 默认值  | 描述                                             |
| ------------- | --------- | ------- | ------------------------------------------------ |
| `teleport`    | `boolean` | `false` | 为true时画布覆盖整个浏览器窗口                   |
| `burstCount`  | `number`  | `160`   | 礼花绽放的纸片数量                               |
| `angleCenter` | `number`  | `270`   | 绽放的中心角度（单位：度）                       |
| `angleSpread` | `number`  | `130`   | 扩散角度范围（单位：度） 如果填360度就是烟花扩散 |
| `speedMin`    | `number`  | `8`     | 粒子初始速度的最小值                             |
| `speedMax`    | `number`  | `24`    | 粒子初始速度的最大值                             |

## Emits

| 事件名   | 类型    | 默认值        | 描述                                    |
| -------- | ------- | ------------- | --------------------------------------- |
| `launch` | `event` | `HTMLElement` | 事件点击触发 不传值则默认在容器中心绽放 |

## CascaderUI Slots

| 插槽名    | Props                              | 描述                                         |
| --------- | ---------------------------------- | -------------------------------------------- |
| `overlay` | `{ launch, launched,launchCount }` | 有需要定位布局的元素内容，需要写在这个插槽中 |
