---
title: Overlay 遮罩
description: 全屏遮罩层，支持点击关闭和滚动锁定。
category: Miscellaneous
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornOverlayDemo.vue" config="RebornOverlayConfig" componentId="reborn-overlay" :componentFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]' :uniappFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]'}

#api
## Props
`modelValue` `duration` `lockScroll` `zIndex` `closeOnClickOverlay` `customClass` `customStyle`
## Emits
`update:modelValue` `close`
## 差异说明
- Web 版本通过 `document.body.style.overflow` 实现锁滚动。
::
