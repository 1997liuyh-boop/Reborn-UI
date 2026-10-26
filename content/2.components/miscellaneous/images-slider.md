---
title: 图片滑块
description: 用于全屏轮播一组背景图并叠加覆盖层内容的图片滑块组件。
category: 数据展示
platform: web
tags: [css, tailwind, images, aceternity-ui]
---

::ComponentViewer{demoFile="ImagesSliderDemo.vue" config="ImagesSliderConfig" componentId="images-slider" :componentFiles='["ImagesSlider.vue"]'}
::

## 简介

ImagesSlider 是仅 Web 的背景图片轮播区，可在图片上叠加标题或操作内容。

`images` 提供数据，`modelValue` 指定当前下标，`direction` 决定切换方向；`autoplay` 决定是否按间隔自动切换。

`imageClass` 与过渡类名控制图片外观，默认插槽承载覆盖层内容，`hideOverlay` 可关闭整个覆盖层。

### 何时使用

- 展示一组背景大图——用 `images` 提供图片地址。
- 需要自动轮播——用 `autoplay` 指定毫秒间隔。
- 需要外部导航控制当前画面——用 `modelValue` 绑定图片下标。

### 何时不使用

- 只需显示单张业务图片——改用 `reborn-image`。
- 需要同时对照两张图片——改用 `compare`。

## 用法

### 基础用法

`images` 提供图片列表，`autoplay` 数值表示自动切换间隔毫秒数。

| 配置 | 典型用途 |
| --- | --- |
| `images` | 背景图数据 |
| `autoplay` | 控制轮播间隔 |

```vue
<template>
  <ImagesSlider :images="['/scene-a.jpg', '/scene-b.jpg']" :autoplay="5000" class="h-96">
    <div class="flex h-full items-center justify-center">
      <h2 class="text-2xl text-white">旅行记录</h2>
    </div>
  </ImagesSlider>
</template>
```

## API

### Props
| 属性名            | 类型                       | 默认值                                           | 描述                                                        |
| ----------------- | -------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `images` | `string[]`                 | `[]`                                             | 要在滑块中展示的图片 URL 数组。                             |
| `hideOverlay` | `boolean`                  | `false`                                          | 是否隐藏图片滑块的覆盖层（槽位将不会渲染）。                |
| `overlayClass` | `string`                   | `''`                                             | 应用于覆盖层容器的类名。                                   |
| `imageClass` | `string`                   | `'bg-cover bg-center bg-no-repeat'`              | 应用于每张图片的类名。                                     |
| `enterFromClass` | `string`                   | `'scale-0 origin-center'`                        | 进入过渡的初始类名。                                       |
| `enterActiveClass` | `string`                   | `'transition-transform duration-300 ease-in-out'`| 进入过渡的激活类名。                                       |
| `leaveActiveClass` | `string`                   | `'transition-transform duration-300 ease-in-out'`| 离开过渡的激活类名。                                       |
| `autoplay` | `boolean\|number\|string`  | `false`                                          | 自动播放间隔（毫秒）：`true` 为 5000，数字或数字字符串为间隔，`false` 禁用。 |
| `direction` | `'vertical'\|'horizontal'` | `'vertical'`                                     | 滑块运行的轴向。                                           |
| `perspective` | `string`                   | `'1000px'`                                       | 应用于滑块容器的透视值。                                   |
| `modelValue` | `number`                   | `0`                                              | 当前幻灯片索引的双向绑定。图片列表变短时越界的下标回到 `0`。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: number)` | 当前图片索引变化时触发，用于同步 v-model。 |

### Slots

| 插槽名    | 作用域参数                 | 描述                                                                         |
| --------- | -------------------------- | ---------------------------------------------------------------------------- |
| `default` | `{ currentIndex: number }` | 覆盖层内容，图片加载结束后进场；外层是一个 `size-full` 容器，可放多个根节点。 |

:::tip
图片只在客户端预加载，`images` 变化后重新加载；加载失败的图片会被跳过，不会让组件一直停在加载态。
:::

### 来源

- 由 [Craig Riley](https://github.com/craigrileyuk) 移植此组件。
- 灵感来自 [Aceternity UI](https://ui.aceternity.com/components/images-slider)。

## 注意事项

- **隐藏覆盖层也会隐藏默认插槽**。`hideOverlay` 会停止渲染覆盖内容，标题和按钮不要在开启它后仍依赖该插槽。
- **图片列表变短时索引可能复位**。越界下标会回到 0，外部导航应跟随模型更新。
- **自动播放间隔以毫秒计**。`autoplay=true` 使用 5000 毫秒，需明确节奏时传入数值。
