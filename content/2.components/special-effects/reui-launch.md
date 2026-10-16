---
title: Launch 电脑动画
description: 可设置品牌文字和屏幕动效的复古电脑动画，支持悬停展开、点击固定与紧凑取景，仅 Web 端。
category: 特效
series: reborn
platform: web
tags: [svg, animation, hover, text, reui-launch]
badge: New
---

::ComponentViewer{demoFile="ReuiLaunchDemo.vue" config="ReuiLaunchConfig" componentId="reui-launch" :componentFiles='["ReuiLaunchDoodle.vue", "reui-launch.config.ts"]'}
::

## 简介

Launch 以复古电脑为中心，将品牌文字展开为靶心、手柄、时钟和图表，用于可交互的标题与展示卡片；仅 Web 端，UniApp 暂未提供同名实现。

`text` 决定电脑两侧的文字，`screenText` 决定屏幕文字；`screenEffect` 独立控制 CRT 扫描、文字闪烁、终端打字或静态显示，无需展开即可播放。

`compact` 收紧取景留白，`expanded` 强制保持展开，默认则由悬停、点击和键盘控制。组件使用 SVG 与 Tailwind 绘制，根节点的 `class` 可调整宽度、文字色和背景；离开视口或页面隐藏时暂停持续动效，系统要求减少动态效果时显示静态完整屏幕文字。

### 何时使用

- 品牌或产品标题需要可交互的视觉内容 —— 用 `text` 设置两侧字标，`screenText` 设置屏幕短词。
- 需要电脑屏幕的扫描、闪烁或终端输入效果 —— 用 `screenEffect` 切换模式，不必同时开启 `expanded`。
- 把电脑动画放入已有标题区域 —— 用 `compact` 收紧取景，再通过 `class` 设置宽度。
- 展示展开后的图形或核对细节 —— 用 `expanded` 固定展开状态。

### 何时不使用

- 提交表单、确认操作等主要任务入口 —— 改用 `reborn-button`。
- 只需要逐字播放长句，不需要电脑插画 —— 改用 `reborn-typewriter`。
- UniApp 页面需要同类效果 —— 本库暂无对应实现，需另行适配平台绘制与交互能力。

## 用法

### 文本演示

`text` 默认为 `REUI`，首个空格划分左右文字，没有空格则按字素平分；`screenText` 默认为 `RE`，独立显示在电脑屏幕上。自定义文字按绘制区域自动缩小字号，中文与英文均可使用。

| 参数 | 表现 | 典型用途 |
| --- | --- | --- |
| `text="Reborn UI"` | 按空格分配电脑左右文字 | 品牌名与后缀分开显示 |
| `text="REUI"` | 没有空格时按字素平分 | 紧凑字标 |
| `screenText="RE"` | 替换屏幕中央文字 | 产品简称或短词 |

```vue
<template>
  <ReuiLaunchDoodle
    text="Reborn UI"
    screen-text="RE"
    class="max-w-2xl"
  />
</template>
```

### 屏幕动效

`screenEffect` 默认为 `crt`，控制屏幕文字与光标的播放方式；与 `expanded` 独立，收起构图时也会播放。

| `screenEffect` | 表现 | 典型用途 |
| --- | --- | --- |
| `crt`（默认） | 文字轻微明暗变化、扫描光带与闪烁光标 | 复古显示器效果 |
| `blink` | 屏幕文字低频明暗闪烁，保留闪烁光标 | 短词的周期性提示 |
| `typewriter` | 按完整字素逐字显现，完成后停留再循环，带闪烁光标 | 终端输入或启动短词 |
| `none` | 静态显示完整文字，关闭屏幕动效 | 需要稳定阅读的品牌文字 |

```vue
<template>
  <ReuiLaunchDoodle
    text="REUI"
    screen-text="READY"
    screen-effect="typewriter"
    class="max-w-2xl"
  />
</template>
```

::tip
屏幕离开视口或页面进入后台时暂停播放。系统开启减少动态效果时，扫描、闪烁和打字均停用，直接显示完整的 `screenText`，无需等动画结束才能读到文字。
::

### 紧凑标题

`compact` 默认为 false；开启后收紧 SVG 取景，组件宽度仍由外层布局和 `class` 决定。

| `compact` | 表现 | 典型用途 |
| --- | --- | --- |
| `false` | 保留完整卡片留白 | 独立展示卡片 |
| `true` | 收紧电脑和文字周围的留白 | 页面标题或品牌区域 |

```vue
<template>
  <ReuiLaunchDoodle
    text="Reborn UI"
    screen-text="RE"
    compact
    class="max-w-xl bg-transparent! text-gray-10!"
  />
</template>
```

### 保持展开

`expanded` 默认为 false，保留悬停与点击控制；设为 true 时强制显示展开构图。

| `expanded` | 表现 | 典型用途 |
| --- | --- | --- |
| `false` | 鼠标移入展开，点击可固定，触屏轻点切换 | 可交互卡片 |
| `true` | 保持展开，点击与 Esc 不会收起 | 展示图形细节 |

```vue
<template>
  <ReuiLaunchDoodle
    text="REUI"
    screen-text="RE"
    expanded
    class="max-w-2xl"
  />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `text` | `string` | `"REUI"` | 外侧文字，首个空格划分左右，没有空格时按字素平分；自定义文字按可用宽度缩放。 |
| `screenText` | `string` | `"RE"` | 电脑屏幕中央文字，建议使用短词。 |
| `screenEffect` | `'crt' \| 'blink' \| 'typewriter' \| 'none'` | `'crt'` | 屏幕动效，独立于展开状态；依次为 CRT 扫描、文字闪烁、终端打字与静态显示。 |
| `expanded` | `boolean` | `false` | 强制保持展开；true 时内部点击、移出和 Esc 均不能收起。 |
| `compact` | `boolean` | `false` | 收紧 SVG 取景，适合标题区域；不设置固定宽度。 |

### 自定义样式（ui）

组件不提供 `ui` prop，通过根按钮继承的 `class` 调整外观。外侧文字使用 `currentColor`，可用 `text-gray-10!` 覆盖；`bg-transparent!` 可移除卡片底色，`max-w-*` 可约束整体宽度。电脑及展开图形保留各自配色。

```vue
<template>
  <ReuiLaunchDoodle
    text="Reborn UI"
    compact
    class="max-w-xl bg-transparent! text-gray-10!"
  />
</template>
```

## 注意事项

- **文字宜短。** 外侧字标与屏幕都有固定绘制区域，长句会自动缩小字号、降低可读性；完整说明应放在组件旁边。
- **`expanded` 是强制展开开关。** true 时优先于内部悬停与点击状态，需由调用方设回 false 才能恢复交互控制。
- **根节点是原生按钮。** Enter 或空格触发点击，Esc 清除内部固定状态；不要把组件嵌入另一个按钮或链接中。
- **点击不属于自定义事件。** 根按钮可继承原生监听器，但组件不声明自定义 Emits、Slots 或实例方法。
- **屏幕动效独立于展开状态。** 收起构图时也会播放；`screenEffect="none"` 只关闭屏幕动效，不改变悬停展开与外围图形的交互。
- **减少动态效果时直接显示完整文字。** 组件遵循 `prefers-reduced-motion`，停止旋转、扫描、闪烁和逐字播放；离开视口或页面隐藏时暂停持续动效，避免后台无效播放。
- **紧凑取景不替代标题语义。** `compact` 只改变构图；用作页面标题视觉时，应保留独立的真实标题文本供页面结构与辅助技术读取。
