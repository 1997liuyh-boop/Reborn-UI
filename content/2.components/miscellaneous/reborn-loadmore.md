---
title:  加载更多
description: 用于列表底部展示加载中、加载失败与没有更多状态的 uniapp 组件。
category: 杂项
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---
::warning
web端组件描述：暂时不需要
::
::ComponentViewer{demoFile="RebornLoadmoreDemo.vue" config="RebornLoadmoreConfig" componentId="reborn-loadmore" :componentFiles='[]' :uniappFiles='["reborn-loadmore.vue", "reborn-loadmore.config.ts", "index.ts"]'}
::

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 UniApp 端提供：

| 键名        | 平台   | 说明                                                                                                                              |
| ----------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `root`      | UniApp | 根元素，整块加载提示区。默认 `w-full h-[48px] leading-[48px] text-center text-[#999999] bg-transparent`；高度、底色、默认字色改这里，`customClass` 也会并到同一节点。 |
| `divider`   | UniApp | 「没有更多了」的分割线容器。**仅 `state="finished"` 时渲染**，默认 `flex items-center justify-center w-[80%] mx-auto`，改这里可调整分割线整体宽度。 |
| `line`      | UniApp | 分割线容器里文字两侧的横线（左右两条共用此键）。默认 `h-[1px] bg-[#e8e8e8] flex-1`。                                                |
| `text`      | UniApp | 提示文字，`finished` 与 `error` 两种状态共用。默认 `inline-block text-[14px] align-middle`。                                        |
| `errorText` | UniApp | 「点击重试」文字。**仅 `state="error"` 时渲染**，默认 `inline-block text-[14px] align-middle px-[6px] cursor-pointer`。             |
| `refresh`   | UniApp | 「点击重试」旁的刷新图标（内置 svg）。默认 `inline-block align-middle text-[16px] cursor-pointer ml-1`，字号即图标大小。            |

```vue
<template>
  <RebornLoadmore
    state="finished"
    :ui="{ root: 'text-gray-5', line: 'bg-gray-2', text: 'text-24' }"
  />
</template>
```
