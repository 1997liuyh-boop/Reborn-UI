---
title: 放大镜
description: 用于在图片等插槽内容上叠加圆形放大镜的局部放大组件。
category: 数据展示
platform: web
tags: [css, tailwind, aceternity-ui]
---

::ComponentViewer{demoFile="LensDemo.vue" config="LensConfig" componentId="lens" :componentFiles='["Lens.vue", "Rays.vue", "Beams.vue"]'}
::

## 简介

Lens 是仅 Web 的局部放大组件，在默认插槽内容上叠加圆形镜头。

`zoomFactor` 决定倍率，`lensSize` 决定镜头直径；`isStatic` 决定镜头使用 `position` 固定位置还是跟随鼠标。

`hovering` 支持与外部状态双向联动，`update:hovering` 通知指针进入和离开；内容本身由默认插槽提供。

### 何时使用

- 商品图片需观察局部细节——用 `zoomFactor` 调整放大倍率。
- 细节区域需要更大取景范围——用 `lensSize` 设置镜头直径。
- 需要固定位置展示放大效果——用 `isStatic` 配合 `position`。

### 何时不使用

- 需要原图与处理后图片的对照——改用 `compare`。
- 只展示整张图片而不放大——改用 `reborn-image`。

## 用法

### 基础用法

`zoomFactor` 控制倍率，默认插槽放置需要放大的内容。

| 配置 | 典型用途 |
| --- | --- |
| `zoomFactor` | 细节放大倍率 |
| `lensSize` | 镜头直径（px） |

```vue
<template>
  <Lens :zoom-factor="2" :lens-size="180">
    <img
      src="/product.jpg" alt="商品细节"
      class="w-full"
    >
  </Lens>
</template>
```

## API

### Props
| 属性名      | 类型                       | 默认值              | 描述                                         |
| ----------- | -------------------------- | ------------------- | -------------------------------------------- |
| `zoomFactor` | `number`                   | `1.5`               | 镜头的放大倍率。                             |
| `lensSize` | `number`                   | `170`               | 镜头直径（像素）。                           |
| `position` | `{ x: number, y: number }` | `{ x: 200, y: 150 }`| 静态模式下镜头的位置。                       |
| `isStatic` | `boolean`                  | `false`             | 为 `true` 时镜头固定；否则跟随鼠标。         |
| `hovering` | `boolean`                  | -                   | 悬停状态，支持 `v-model:hovering`；未绑定时由组件内部维护。 |

### Emits

| 事件名            | 回调参数           | 描述                                                       |
| ----------------- | ------------------ | ---------------------------------------------------------- |
| `update:hovering` | `(value: boolean)` | 指针进入或离开时触发，配合 `v-model:hovering` 联动外部 UI。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 被放大的内容，基础层与镜头层分别渲染。 |

### 来源

- 感谢 [Aceternity UI](https://ui.aceternity.com/components/lens)。
- 感谢 [SivaReddy Uppathi](https://github.com/sivareddyuppathi) 移植该组件。

## 注意事项

- **悬停状态改用 `v-model:hovering`**。原先的 `hover-update` 事件已移除，挂载时也不再主动派发一次 `false`；联动外部 UI（例如放大时模糊周边文案）写 `v-model:hovering="hovering"` 即可。
- **镜头离场有缩小淡出动画**。镜头由 `AnimatePresence` 管理，指针离开后按 `exit` 配置（缩到 0.8 并淡出）离场。
