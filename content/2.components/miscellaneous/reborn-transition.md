---
title: Transition 过渡
description: 过渡动画容器，支持 fade / slide / zoom。
category: Miscellaneous
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornTransitionDemo.vue" config="RebornTransitionConfig" componentId="reborn-transition" :componentFiles='["RebornTransition.vue", "reborn-transition.config.ts"]' :uniappFiles='["RebornTransition.vue", "reborn-transition.config.ts"]'}

#api
## Props
`show` `duration` `lazyRender` `name` `destroy` `customClass` `customStyle` `disableTouchMove`

## Emits
`click` `before-enter` `enter` `after-enter` `before-leave` `leave` `after-leave`

## 差异说明
- Web 基于 DOM + class 切换实现，UniApp 保留原有 Promise 生命周期驱动。
::
