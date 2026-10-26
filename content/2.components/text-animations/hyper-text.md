---
title: 超能文字
description: 用于文字以字符快速乱序滚动后定格显现的动画组件，悬停可重播。
category: 文字动画
platform: web
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="HyperTextDemo.vue" config="HyperTextConfig" componentId="hyper-text" :componentFiles='["HyperText.vue"]'}
::

## 简介

HyperText 是仅 Web 的字符乱序动画，用随机字符过渡到最终短文本。

`text` 决定最终内容，`duration` 决定整个过渡时长，`animateOnLoad` 决定挂载时是否自动播放。

`class` 控制文字样式；悬停可重新播放，适合短标题，正文阅读仍应优先保持稳定。

### 何时使用

- 短标题需要字符解码式入场——用 `text` 提供最终文案。
- 需要控制乱序持续时间——用 `duration` 指定毫秒数。
- 只希望悬停时播放——将 `animateOnLoad` 设为 false。

### 何时不使用

- 长段落需要逐行进入——改用 `text-reveal`。
- 需要逐字输入与删除——改用 `reborn-typewriter`。

## 用法

### 基础用法

`animateOnLoad` 控制首次播放，`duration` 设置乱序动画的总毫秒数。

| 配置 | 典型用途 |
| --- | --- |
| `text` | 最终短标题 |
| `duration` | 乱序持续时间 |

```vue
<template>
  <div class="p-6">
    <HyperText
      text="欢迎回来" :duration="800"
      :animate-on-load="true"
    />
  </div>
</template>
```

## API

### Props
| 属性名        | 类型      | 默认值  | 描述                                   |
| ------------- | --------- | ------- | -------------------------------------- |
| `class` | `string`  | `""`    | 应用于组件的额外 CSS 类。              |
| `text` | `string`  | Required| 要做动画的文字。                       |
| `duration` | `number`  | `800`   | 整个动画的持续时间（毫秒）。           |
| `animateOnLoad` | `boolean`| Required| 为 `true` 时挂载后自动播放一次；为 `false` 时只在悬停时播放。 |

### 来源

- 灵感来自 [Magic UI 的 Hyper Text](https://magicui.design/docs/components/hyper-text) 组件。
- 感谢 [Prem](https://github.com/premdasvm) 移植该组件。

## 注意事项

- **持续时间以毫秒计**。`duration` 控制整轮乱序过程，过长会延迟最终文案可读的时间。
- **关闭自动播放仍保留悬停播放**。`animateOnLoad=false` 只影响挂载时机，不能用它表达完全禁用动画。
- **重要内容不应只依靠乱序过程传达**。最终 `text` 才是完整文案，操作名称应在动画后保持清楚可读。
