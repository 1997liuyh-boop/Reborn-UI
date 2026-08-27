---
title: 图片 Image
description: 用于展示图片并提供预览、加载/错误状态与多种裁剪模式的双端图片组件。
category: 杂项
tags: [css, tailwind, image, media, uniapp, viewerjs]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornImageDemo.vue" config="RebornImageConfig" componentId="reborn-image" :componentFiles='["RebornImage.vue", "reborn-image.config.ts"]' dependencies="[viewerjs, vue-lazyload]" :uniappFiles='["RebornImage.vue", "reborn-image.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `src` | `string` | - | **必填**。图片地址。 |
| `mode` | `string` | `aspectFill` | **仅仅uniapp有效**。图片裁剪、缩放的模式。支持 `scaleToFill`, `aspectFit`, `aspectFill`, `widthFix`, `heightFix`, `top`, `bottom`, `center`, `left`, `right`, `top left`, `top right`, `bottom left`, `bottom right`。 |
| `width` | `string \| number` | `120` | 图片宽度。数字默认为 px，字符串支持 rpx, %, vw 等。 |
| `height` | `string \| number` | `120` | 图片高度。数字默认为 px，字符串支持 rpx, %, vw 等。 |
| `preview` | `boolean` | `false` | 是否开启点击预览（大图查看）。Web 端使用 viewerjs，移动端使用 uni.previewImage。 |
| `previewList` | `string[]` | `[]` | 预览时的图片列表。如果不传，默认预览当前 `src`。 |
| `showLoading` | `boolean` | `true` | 是否显示加载中的 loading 图标。 |
| `lazyLoad` | `boolean` | `false` | 是否开启图片懒加载。 |
| `fadeShow` | `boolean` | `false` | 是否开启图片加载完成后的淡入动画。 |
| `webp` | `boolean` | `false` | 是否默认开启 webp 格式 (仅部分平台支持)。 |
| `showMenuByLongpress` | `boolean` | `false` | 长按是否显示菜单 (如保存图片)。 |
| `customClass` | `any` | - | 用于自定义根节点的样式类。 |
| `ui` | `object` | - | 覆盖子组件样式的 UI 配置对象。 |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。放大镜相关的三个键为 Web 端独有：

| 键名                 | 平台   | 说明                                                                                                                                          |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`               | 通用   | 根元素。默认 `relative flex flex-row items-center justify-center rounded-xl overflow-hidden`，圆角、外框尺寸改这里；`customClass` 也并到该节点。 |
| `inner`              | 通用   | 真正的 `<img />` / `<image />` 元素，默认 `w-full h-full`；`object-fit` 由 `fit` prop 控制，想额外加滤镜、圆角写这里。                          |
| `loading`            | 通用   | 加载态遮罩容器。**仅 `showLoading` 为真且图片仍在加载时渲染**，默认 `absolute h-full w-full bg-gray-2 flex flex-col items-center justify-center`。 |
| `loadingIcon`        | 通用   | 加载态的转圈图标。**仅在未填充 `loading` 插槽时渲染**，填充该插槽会替换掉这个节点，`ui.loadingIcon` 随之失效。                                   |
| `error`              | 通用   | 加载失败遮罩容器。**仅图片加载失败时渲染**，默认与 `loading` 同款底色与居中布局。                                                              |
| `errorIcon`          | 通用   | 失败态图标，默认 `text-gray-4 size-8 icon-[lucide--image-off]`。**仅在未填充 `error` 插槽时渲染**，填充该插槽会使其失效。                        |
| `magnifierLens`      | Web    | 放大镜在原图上的透镜方块。**仅 `magnifier` 为真且视口达到宽屏断点时渲染**，默认 `absolute bg-black/30 border border-white/20 rounded-lg backdrop-blur-[2px]`；透镜的可见度改这里，尺寸请用 `magnifierSize` prop。 |
| `magnifierView`      | Web    | 放大镜的预览窗口（浮在原图右侧）。默认 `absolute top-0 left-[calc(100%+16px)] border bg-white shadow-2xl overflow-hidden z-50`；想换预览窗位置就覆盖这里的定位类。 |
| `magnifierViewImage` | Web    | 预览窗内被放大的图层，默认 `absolute max-w-none origin-top-left`；缩放与偏移由内联样式实时计算，一般只在这里加圆角或滤镜。                     |

```vue
<template>
  <RebornImage
    src="/cover.png"
    magnifier
    :ui="{
      root: 'rounded-none size-60',
      magnifierView: 'left-[calc(100%+8px)] rounded-lg',
    }"
  />
</template>
```

## Slots

| 插槽名 | 描述 |
| --- | --- |
| `loading` | 自定义加载状态的内容。 |
| `error` | 自定义错误状态的内容。 |
| `default` | 自定义图片上的覆盖内容（如角标）。 |

## Events

| 事件名 | 描述 |
| --- | --- |
| `load` | 图片加载成功时触发。 |
| `error` | 图片加载失败时触发。 |

::
