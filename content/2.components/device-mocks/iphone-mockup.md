---
title: iPhone 模型
description: 用于以 iPhone SVG 外壳包裹展示截图的设备模型组件。
category: 设备模型
platform: web
tags: [css, tailwind, device-mockup, magic-ui]
badge: New
---

::ComponentViewer{demoFile="iPhone15ProMockupDemo.vue" config="iPhone15ProMockupConfig" componentId="iphone-mockup" :componentFiles='["iPhone15ProMockup.vue"]'}
::

## 简介

iPhone 模型用 SVG 设备外壳承载截图或内嵌页面，仅支持 Web。

`src` 对应静态截图，`iframeSrc` 对应 iframe 页面；两者同时传入时优先显示页面，避免同一区域叠加两种内容。

`width` / `height` 同时决定 SVG 的像素尺寸和 viewBox，机身按 433×882 的坐标绘制，所以它们只适合保持默认值；要缩放模型，给组件加 `class="w-full h-auto"`，由外层容器控制宽度。截图以 cover 方式裁切到屏幕圆角内；页面是否允许嵌入仍由目标站点决定。

### 何时使用

- 作品集展示移动端截图——用 `src` 把截图嵌入设备屏幕。
- 需要演示可交互页面——用 `iframeSrc` 嵌入允许被框架加载的页面。
- 需要按容器宽度缩放模型——在组件上加 `class="w-full h-auto"`，由外层容器的宽度决定大小，宽高比保持不变。

### 何时不使用

- 普通内容图片不需要设备外壳——改用 `reborn-image`。
- 需要比较两张移动端截图的差异——改用 `compare`。

## 用法

### 基础用法

`src` 显示截图；需要可交互页面时改用 `iframeSrc`。示例用外层容器限定宽度，组件上的 `w-full h-auto` 让模型按容器等比缩放。

| 配置 | 典型用途 |
| --- | --- |
| `src` | 静态截图展示 |
| `iframeSrc` | 嵌入允许展示的页面 |

```vue
<template>
  <div class="w-[300px]">
    <IPhone15ProMockup
      src="/mobile-preview.png"
      class="w-full h-auto"
    />
  </div>
</template>
```

## API

### Props
| 属性名 | 类型     | 默认值 | 描述                              |
| ------ | -------- | ------ | --------------------------------- |
| `width` | `number` | `433`  | 模型 SVG 的宽度（像素），同时作为 viewBox 宽度；改小会裁掉机身右侧。 |
| `height` | `number`| `882`  | 模型 SVG 的高度（像素），同时作为 viewBox 高度；改小会裁掉机身下部。 |
| `src` | `string` | -      | 屏幕中显示的图片地址，按 cover 方式铺满屏幕区域并裁出圆角。 |
| `iframeSrc` | `string` | - | 屏幕中嵌入的页面地址，以 iframe 渲染；与 `src` 同时传入时优先显示页面。 |

### 来源

- 移植自 [Magic UI](https://magicui.design/docs/components/iphone-15-pro)。

## 注意事项

- **`src` 只用于图片**。需要在屏幕里放可交互的页面（例如本站的 UniApp 预览）时改用 `iframeSrc`；此前任意 `src` 都会显示写死的站内页面，现已按传入值渲染。
- **屏幕圆角的裁剪路径按实例生成 id**。同一页面放多个模型时互不影响。
- **缩放模型用 class，不要改 `width` / `height`**。两者同时写进 viewBox，机身路径固定在 433×882 坐标内，传 `:width="300" :height="611"` 会把机身右侧和下部裁掉，而不是整体缩小。在组件上写 `class="w-full h-auto"`，再由外层容器给定宽度即可等比缩放。
