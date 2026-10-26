---
title: 水印 Watermark
description: 用于在内容容器上平铺文本或图片水印的组件。
category: 数据展示
platform: both
tags: [data, watermark, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornWatermarkDemo.vue" config="RebornWatermarkConfig" componentId="reborn-watermark" :componentFiles='["RebornWatermark.vue", "reborn-watermark.config.ts"]' :uniappFiles='["RebornWatermark.vue", "reborn-watermark.config.ts"]'}
::

## 简介

Watermark 在内容容器上平铺文字或图片标识，Web 与 UniApp 提供同名组件，绘制实现按平台区分。

`content` / `image` 决定标识内容，`rotate` 决定倾角，`gap` / `offset` 决定平铺密度与起点；图片与文字同时提供时图片优先。

`width` / `height` 控制单块水印尺寸，`font` 配置文字绘制，`zIndex` 控制覆盖层级；默认插槽放置被标识的内容，`ui` 覆盖根节点与水印层样式。

### 何时使用

- 内部资料需标识归属——用 `content` 显示部门或查看者信息。
- 图片区域需覆盖品牌标识——用 `image` 提供水印图片。
- 密集正文需降低遮挡——用 `gap`、`rotate` 调整平铺间距与倾角。

### 何时不使用

- 只需在角落显示状态标记——改用 `reborn-badge`。
- 需要展示图片本身而非平铺标识——改用 `reborn-image`。

## 用法

### 图片水印

`image` 指定平铺图片，`width` / `height` 决定单块尺寸。

| 配置 | 典型用途 |
| --- | --- |
| `image` | 品牌标识图片 |
| `width` | 控制单块标识大小 |

```vue
<template>
  <RebornWatermark image="/logo.png" :width="120" :height="64">
    <div class="p-6">
      需要标识归属的内容
    </div>
  </RebornWatermark>
</template>
```

### 多行安全标识

`content` 可传字符串数组，把查看者与用途分行显示。

| 配置 | 典型用途 |
| --- | --- |
| `content` | 多行归属说明 |
| `gap` | 调整重复密度 |

```vue
<template>
  <RebornWatermark :content="['内部资料', '仅供评审']" :gap="[80, 80]">
    <div class="p-6">
      评审正文
    </div>
  </RebornWatermark>
</template>
```

## API
### Props

| 属性名    | 描述                                     | 类型                | 默认值                 |
| --------- | ---------------------------------------- | ------------------- | ---------------------- |
| `width` | 水印的宽度                               | `number`            | `120`                  |
| `height` | 水印的高度                               | `number`            | `64`                   |
| `rotate` | 水印的旋转角度, 单位 °                   | `number`            | `-22`                  |
| `zIndex` | 水印元素的 z-index 值                    | `number`            | `9`                    |
| `image` | 水印图片，建议使用 2x 或 3x 图像；与 `content` 同时传入时优先绘制图片，Web 端图片加载失败时回退为 `content` 文字水印 | `string`            | —                      |
| `content` | 水印文本内容                             | `string / string[]` | `Reborn UI`            |
| `font` | 文字样式                                 | `Font`              | —                      |
| `gap` | 水印之间的间距 [x, y]                    | `[number, number]`  | `[100, 100]`           |
| `offset` | 水印从容器左上角的偏移，默认值为 `gap/2` | `[number, number]`  | `[gap[0]/2, gap[1]/2]` |
| `customClass` | 追加到根元素的类名，与 `ui.root` 合并 | `any` | — |

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

### Slots

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

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 绘制环境 | 浏览器 Canvas 生成平铺图 | UniApp Canvas 生成平铺图 |
| 图片路径 | 浏览器加载图片 | uni.getImageInfo 转为本地路径；失败回退 content |

## 注意事项

- **水印不能代替访问控制**。它只是叠加在内容上的视觉标识，敏感数据仍需由服务端鉴权。
- **图片与文字有优先级**。同时传入时先绘制 `image`，Web 图片加载失败才回退到 `content`，需为失败场景准备文字。
- **水印层不接管点击**。覆盖层使用 `pointer-events-none`，内容仍可正常交互，不能把它当禁用遮罩。
