---
title: 打字机效果
description: 模拟打字机效果，支持文本删除和重新输入，适用于标题动画、终端效果等场景。
category: 文字动画
tags: [css, tailwind, animation]
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornTypewriterDemo.vue" config="RebornTypewriterConfig" componentId="reborn-typewriter" :componentFiles='["RebornTypewriter.vue"]'}

#api

## API

| 属性名             | 类型      | 默认值 | 描述                           |
| ------------------ | --------- | ------ | ------------------------------ | -------- |
| `text`             | `string`  | `""`   | 要显示的文本内容               |
| `typeSpeed`        | `number`  | `50`   | 打字速度（毫秒/字符）          |
| `deleteSpeed`      | `number`  | `30`   | 删除速度（毫秒/字符）          |
| `pauseDuration`    | `number`  | `500`  | 删除后到打字的延迟时间（毫秒） |
| `cursor`           | `string`  | `"     | "`                             | 光标字符 |
| `showCursor`       | `boolean` | `true` | 是否显示光标                   |
| `cursorBlinkSpeed` | `number`  | `530`  | 光标闪烁速度（毫秒）           |
| `resetOnChange`    | `boolean` | `true` | 是否在文本变化时重置           |

## Events

| 事件名           | 参数 | 描述           |
| ---------------- | ---- | -------------- |
| `typed`          | `-`  | 打字完成时触发 |
| `deleted`        | `-`  | 删除完成时触发 |
| `start-typing`   | `-`  | 开始打字时触发 |
| `start-deleting` | `-`  | 开始删除时触发 |

## Methods

通过 `ref` 可以调用以下方法：

| 方法名          | 参数                 | 描述         |
| --------------- | -------------------- | ------------ |
| `startTyping`   | `(text: string)`     | 手动开始打字 |
| `startDeleting` | `(newText?: string)` | 手动开始删除 |
| `clear`         | `-`                  | 清除所有动画 |

#features

## 特性

- ✅ 打字效果：逐字输入文本
- ✅ 删除效果：逐字删除文本
- ✅ 自动切换：修改 `text` 时先删除旧内容，再输入新内容
- ✅ 光标闪烁：支持自定义光标字符和闪烁速度
- ✅ 完全响应式：支持动态修改文本
- ✅ 事件回调：提供完整的事件生命周期

::
