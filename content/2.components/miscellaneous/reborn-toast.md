---
title: Toast 轻提示
description: 支持 useToast() 调用的轻提示组件。
category: Miscellaneous
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornToastDemo.vue" config="RebornToastConfig" componentId="reborn-toast" :componentFiles='["RebornToast.vue", "index.ts"]' :uniappFiles='["RebornToast.vue", "index.ts", "reborn-toast.config.ts"]'}

#api
## 用法
`const toast = useToast()`
可调用：`show` `close` `loading` `success` `error` `warning` `info`
## ToastOptions
`msg` `duration` `iconName` `position` `show` `zIndex` `cover`
## 差异说明
- Web 图标使用 lucide，UniApp 使用内置 svg base64 图标。
::
