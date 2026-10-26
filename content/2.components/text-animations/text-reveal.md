---
title: 文字揭示
description: 用于基于 GSAP SplitText 将段落按行依次入场的文字动画组件。
category: 文字动画
platform: web
tags: [css, tailwind, gsap]
---

::ComponentViewer{demoFile="TextRevealDemo.vue" config="TextRevealConfig" componentId="text-reveal" :componentFiles='["TextReveal.vue"]' dependencies="gsap"}
::

## 简介

TextReveal 是仅 Web 的段落入场组件，用 GSAP SplitText 将默认插槽文本按行拆分并揭示。

`duration` 决定单行动画时长，`delay` 决定开始延迟，`stagger` 决定相邻行之间的间隔，单位均为秒。

`class` 与 `containerClass` 分别控制内层文字和外层容器；只有插槽文字或动画参数真正变化时才重播入场动画，与文字无关的重渲染不会重播。

### 何时使用

- 段落需要按行入场——用 `duration` 设置每行动画秒数。
- 需等待其它视觉元素先出现——用 `delay` 延后开始。
- 多行之间需要错开节奏——用 `stagger` 设置行间秒数。

### 何时不使用

- 需要逐字输入删除——改用 `reborn-typewriter`。
- 短标签需要悬停时字符翻动——改用 `hyper-text`。

## 用法

### 基础用法

默认插槽承载段落，`stagger` 让相邻行依次出现。

| 配置 | 典型用途 |
| --- | --- |
| `duration` | 单行动画秒数 |
| `stagger` | 相邻行间隔秒数 |

```vue
<template>
  <TextReveal :duration="0.6" :stagger="0.1" container-class="max-w-xl">
    <p>
      把一段文字按实际排版逐行展示，保留自然的阅读顺序。
    </p>
  </TextReveal>
</template>
```

## API

### Props
| 属性名            | 类型     | 默认值 | 描述                                 |
| ----------------- | -------- | ------ | ------------------------------------ |
| `class` | `string` | `-`    | 内层文字容器的额外类。               |
| `containerClass` | `string` | `-`    | 外层容器的额外类。                   |
| `duration` | `number` | `0.6`  | 逐行揭示的动画时长。                 |
| `delay` | `number` | `0.2`  | 动画开始前的延迟。                   |
| `stagger` | `number` | `0.1`  | 每行揭示之间的动画间隔。             |

SplitText 会把插槽里的文字拆成行与词元素，拆分后的 DOM 不再由 Vue 管理。组件每次渲染都会比对插槽的渲染结果，按变化的内容分别处理：

| 变化 | 处理 |
| --- | --- |
| 插槽文字变化 | 重建文字容器，对新内容重新拆分并重播入场动画 |
| `duration`、`delay`、`stagger` 变化 | 就地重新拆分，按新参数重播 |
| 插槽里只有属性（如类名）变化 | 重建文字容器以带上新属性，动画接着原进度，不重播 |
| `class`、`containerClass` 的实际类名变化 | 就地按新排版重新拆分换行，不重播 |
| 渲染结果不变的重渲染（父组件无关状态变化、`v-for` 里的动态插槽、内联 class 数组换了新引用） | 不做任何处理 |

窗口缩放触发的自动重新拆分同样沿用原进度，不会重播。

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 按实际换行拆分并执行入场动画的文本。 |

### 来源

- 基于 [GSAP](https://gsap.com/) 与 [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)。

## 注意事项

- **只有文字变化才重播**。组件按插槽渲染结果判断，文字变了才重建拆分并从头播放；频繁改动插槽文字会反复播放入场动画。
- **插槽里子组件自身的更新不会同步到拆分后的文字**。拆分后的节点已脱离 Vue，子组件只在自己内部重渲染时 TextReveal 不知情，改动落在脱离页面的旧节点上。需要变化的文字由父组件直接写进插槽，或在变化时给 TextReveal 换 `key`。
- **换行由实际布局决定**。字体、容器宽度和窗口变化可能改变行数，使用 `class` / `containerClass` 确定排版边界。
- **动画时长使用秒**。`duration`、`delay` 与 `stagger` 传给 GSAP，不能按毫秒数直接填写。
