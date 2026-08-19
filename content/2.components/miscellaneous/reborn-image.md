---
title: 图片 Image
description: 增强版图片组件，支持预览、加载状态、错误状态和多种裁剪模式。
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

## UI Configuration

组件的 `ui` 属性支持以下键，用于覆盖默认样式：

| Key | 描述 |
| --- | --- |
| `root` | 根元素样式。 |
| `error` | 错误状态的容器样式。 |
| `errorIcon` | 错误状态的图标样式。 |
| `loading` | 加载状态的容器样式。 |
| `loadingIcon` | 加载状态的图标样式。 |
| `inner` | 内部 `<img />` 或 `<image />` 元素的样式。 |

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
