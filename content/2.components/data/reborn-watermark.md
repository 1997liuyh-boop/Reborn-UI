---
title: 水印 Watermark
description: 用于在内容容器上平铺文本或图片水印的组件。
category: 数据
tags: [data, watermark]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornWatermarkDemo.vue" config="RebornWatermarkConfig" componentId="reborn-watermark" :componentFiles='["RebornWatermark.vue", "reborn-watermark.config.ts"]' :uniappFiles='["RebornWatermark.vue", "reborn-watermark.config.ts"]'}

#api

## API

### Watermark Attributes

| 属性名    | 描述                                     | 类型                | 默认值                 |
| --------- | ---------------------------------------- | ------------------- | ---------------------- |
| `width`   | 水印的宽度                               | `number`            | `120`                  |
| `height`  | 水印的高度                               | `number`            | `64`                   |
| `rotate`  | 水印的旋转角度, 单位 °                   | `number`            | `-22`                  |
| `z-index` | 水印元素的 z-index 值                    | `number`            | `9`                    |
| `image`   | 水印图片，建议使用 2x 或 3x 图像         | `string`            | —                      |
| `content` | 水印文本内容                             | `string / string[]` | `Reborn UI`            |
| `font`    | 文字样式                                 | `Font`              | —                      |
| `gap`     | 水印之间的间距 [x, y]                    | `[number, number]`  | `[100, 100]`           |
| `offset`  | 水印从容器左上角的偏移，默认值为 `gap/2` | `[number, number]`  | `[gap[0]/2, gap[1]/2]` |

### Font Attributes

| 名称           | 详情     | 类型              | 默认              |
| -------------- | -------- | ----------------- | ----------------- |
| `color`        | 字体颜色 | `string`          | `rgba(0,0,0,.15)` |
| `fontSize`     | 字体大小 | `number / string` | `16`              |
| `fontWeight`   | 字重     | `string / number` | `normal`          |
| `fontFamily`   | 字体     | `string`          | `sans-serif`      |
| `fontStyle`    | 字体样式 | `string`          | `normal`          |
| `textAlign`    | 文本对齐 | `string`          | `center`          |
| `textBaseline` | 文本基线 | `string`          | `hanging`         |

### Watermark Slots

| 插槽名    | 描述                   |
| --------- | ---------------------- |
| `default` | 需要添加水印的内容容器 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端结构一致，键位相同：

| 键名        | 说明                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| `root`      | 根元素。相对定位的内容容器，默认 `w-full overflow-hidden`，水印层以它为定位参照。 |
| `watermark` | 水印平铺层。绝对定位覆盖整个根元素，默认 `pointer-events-none` 不拦截交互，层级由 `--reborn-watermark-z-index` 控制。 |

```vue
<template>
  <RebornWatermark content="内部资料" :ui="{ root: 'rounded-xl', watermark: 'opacity-60' }">
    <div class="h-40">受保护的内容</div>
  </RebornWatermark>
</template>
```

::
