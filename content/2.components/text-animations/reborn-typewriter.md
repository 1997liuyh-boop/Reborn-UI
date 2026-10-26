---
title: 打字机效果
description: 用于让文本以打字机方式逐字输入与删除的文字动画组件。
category: 文字动画
platform: web
tags: [css, tailwind, animation]
---

::ComponentViewer{demoFile="RebornTypewriterDemo.vue" config="RebornTypewriterConfig" componentId="reborn-typewriter" :componentFiles='["RebornTypewriter.vue"]'}
::

## 简介

Typewriter 是仅 Web 的逐字输入与删除动画组件，适合动态标题和短句。

`text` 是目标内容，`typeSpeed` / `deleteSpeed` 分别设置输入和删除速度，`pauseDuration` 控制两段过程间的停顿。

`cursor` / `showCursor` / `cursorBlinkSpeed` 控制光标，`resetOnChange` 控制文本变化后的重播；实例方法可中断或重新启动，阶段事件用于联动其它界面。

### 何时使用

- 标题需逐字出现——用 `text` 提供内容、`typeSpeed` 控制节奏。
- 文本切换需先删后写——配合 `resetOnChange` 与 `deleteSpeed`。
- 需要定制光标表现——用 `cursor` / `showCursor` / `cursorBlinkSpeed`。

### 何时不使用

- 整段正文需要逐行进入——改用 `text-reveal`。
- 短标题需要随机字符解码效果——改用 `hyper-text`。

## 用法

### 基础用法

`text` 在挂载后逐字显示。

| 配置 | 典型用途 |
| --- | --- |
| `text` | 目标文案 |
| `typeSpeed` | 每字符耗时（ms） |

```vue
<template>
  <div class="text-xl">
    <RebornTypewriter
      text="欢迎阅读本次更新"
    />
  </div>
</template>
```

### 动态切换文本

`text` 变化后可先删除旧内容再输入新内容，`resetOnChange` 控制该行为。

| 配置 | 典型用途 |
| --- | --- |
| `text` | 响应业务文案 |
| `resetOnChange` | 文本变化后重播 |

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
const message = shallowRef('第一段内容')
</script>
<template>
  <RebornTypewriter :text="message" />
  <button @click="message = '第二段内容'">切换内容</button>
</template>
```

### 速度控制

`typeSpeed` / `deleteSpeed` 分别控制输入与删除的每字符毫秒数。

| 配置 | 典型用途 |
| --- | --- |
| `typeSpeed` | 输入速度 |
| `deleteSpeed` | 删除速度 |

```vue
<template>
  <RebornTypewriter
    text="按自己的节奏阅读"
    :type-speed="100"
    :delete-speed="50"
  />
</template>
```

### 光标定制

`cursor` 设置光标字符，`cursorBlinkSpeed` 控制闪烁周期。

| 配置 | 典型用途 |
| --- | --- |
| `cursor` | 自定义光标 |
| `showCursor` | 控制光标显示 |

```vue
<template>
  <RebornTypewriter
    text="准备就绪"
    cursor="▌"
    :cursor-blink-speed="600"
  />
</template>
```

## API

### Props
| 属性名             | 类型      | 默认值 | 描述                           |
| ------------------ | --------- | ------ | ------------------------------ |
| `text` | `string`  | `""`   | 要显示的文本内容               |
| `typeSpeed` | `number`  | `50`   | 打字速度（毫秒/字符）          |
| `deleteSpeed` | `number`  | `30`   | 删除速度（毫秒/字符）          |
| `pauseDuration` | `number`  | `500`  | 删除后到打字的延迟时间（毫秒） |
| `cursor` | `string`  | `"\|"` | 光标字符                       |
| `showCursor` | `boolean` | `true` | 是否显示光标                   |
| `cursorBlinkSpeed` | `number`  | `530`  | 光标闪烁速度（毫秒）           |
| `resetOnChange` | `boolean` | `true` | 文本变化时是否重新播放；挂载后的首次播放不受它影响 |

### Emits

| 事件名           | 参数 | 描述           |
| ---------------- | ---- | -------------- |
| `typed`          | `-`  | 打字完成时触发 |
| `deleted`        | `-`  | 删除完成时触发 |
| `start-typing`   | `-`  | 开始打字时触发 |
| `start-deleting` | `-`  | 开始删除时触发 |

### Expose

通过 `ref` 可以调用以下方法与读取以下状态：

| 方法名          | 参数                 | 描述         |
| --------------- | -------------------- | ------------ |
| `startTyping`   | `(text: string)`     | 手动开始打字；会先中断正在进行的打字或删除 |
| `startDeleting` | `(newText?: string)` | 手动开始删除；会先中断正在进行的打字或删除 |
| `clear`         | `-`                  | 清除所有动画 |
| `displayText`   | `Readonly<Ref<string>>`  | 当前已显示的文本，只读 |
| `isTyping`      | `Readonly<Ref<boolean>>` | 是否正在打字，只读 |
| `isDeleting`    | `Readonly<Ref<boolean>>` | 是否正在删除，只读 |

三个状态只读，因为内部的定时器链依赖它们推进，外部写入会打乱打字与删除的进度；要改变显示内容，请调用 `startTyping` / `startDeleting` 或修改 `text`。

打字动画在组件挂载后才开始：服务端渲染时只输出空文本，不在服务端启动定时器。

## 特性

- ✅ 打字效果：逐字输入文本
- ✅ 删除效果：逐字删除文本
- ✅ 自动切换：修改 `text` 时先删除旧内容，再输入新内容
- ✅ 光标闪烁：支持自定义光标字符和闪烁速度
- ✅ 完全响应式：支持动态修改文本
- ✅ 事件回调：提供完整的事件生命周期

## 注意事项

- **首次动画从挂载后开始**。服务端只输出空文本，不启动定时器，首屏重要正文需另有静态展示。
- **暴露状态只读**。`displayText`、`isTyping`、`isDeleting` 参与内部定时器推进，外部应通过方法或 `text` 改变内容。
- **手动方法会中断当前过程**。`startTyping` / `startDeleting` 清理旧任务后开始新流程，调用方不应同时启动相互冲突的指令。
