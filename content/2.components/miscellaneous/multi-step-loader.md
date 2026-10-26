---
title: 多步加载器
description: 用于按步骤序列展示加载进度、支持异步等待步骤的全屏加载组件。
category: 反馈
platform: web
tags: [css, tailwind, aceternity-ui]
---

::ComponentViewer{demoFile="MultiStepLoaderDemo.vue" config="MultiStepLoaderConfig" componentId="multi-step-loader" :componentFiles='["MultiStepLoader.vue"]'}
::

## 简介

MultiStepLoader 是仅 Web 的全屏分步加载提示，将耗时过程按步骤展示。

`steps` 定义步骤文本及可选动作，`loading` 控制一轮流程的显示与停止；步骤可按时间推进，也可等待异步条件。

`defaultDuration` 设定默认停留时间，`preventClose` 控制关闭入口；`state-change`、`complete` 和 `close` 分别通知步骤变化、完成与关闭。

### 何时使用

- 耗时流程有明确阶段——用 `steps` 描述各步骤。
- 业务请求开始或结束时控制遮罩——用 `loading` 同步可见性。
- 纯展示阶段需要统一停留时间——用 `defaultDuration` 设置毫秒间隔。

### 何时不使用

- 只需一个局部忙碌提示——改用 `reborn-loading`。
- 需要用户逐步填写并主动推进——改用 `reborn-steps`。

## 用法

### 定时推进

`steps` 按数组顺序展示，未单独设置时使用 `defaultDuration`。

| 配置 | 典型用途 |
| --- | --- |
| `loading` | 启动或关闭流程 |
| `defaultDuration` | 每步默认停留毫秒数 |

```vue
<template>
  <MultiStepLoader
    :loading="true"
    :steps="[{ text: '准备数据' }, { text: '生成预览' }]"
    :default-duration="1500"
  />
</template>
```

### 等待异步任务

`steps` 中的 `action` 可返回 Promise，步骤等待动作结束后继续。

| 配置 | 典型用途 |
| --- | --- |
| `steps` | 为阶段绑定异步动作 |
| `preventClose` | 隐藏关闭入口 |

```vue
<template>
  <MultiStepLoader
    :loading="true"
    :steps="[{ text: '读取数据', action: async () => { await fetch('/api/data') } }]"
    :prevent-close="true"
  />
</template>
```

## API

### Props
| 属性名           | 类型      | 默认值 | 描述                                            |
| ---------------- | --------- | ------ | ----------------------------------------------- |
| `loading` | `boolean` | `false`| 控制加载器可见性，为 `true` 时显示。            |
| `steps` | `Step[]`  | -（必填） | 定义加载序列的步骤数组。                        |
| `defaultDuration` | `number`  | `1500` | 每个步骤的持续时间（毫秒）。                    |
| `preventClose` | `boolean` | `false`| 若为 `true`，不显示关闭按钮。                   |

### Emits

| 事件名          | 负载类型 | 描述                                 |
| --------------- | -------- | ------------------------------------ |
| `state-change`  | `number` | 当前步骤变化时触发，返回新步骤索引。 |
| `complete`      | `void`   | 所有步骤完成时触发。                 |
| `close`         | `void`   | 点击按钮关闭加载器时触发。           |

### 来源

- 感谢 [M Atif](https://github.com/atif0075) 提供该组件。
- 灵感来自 [Aceternity UI's Multi Step Loader](https://ui.aceternity.com/components/multi-step-loader)。

## 注意事项

- **步骤只在客户端挂载后开始推进。** 服务端渲染会输出第一步的画面，但不启动计时、不执行 `action`；水合后才从第一步开始计时，`action` 只在浏览器里执行一次。挂载前就开始计时会让服务端请求执行一遍 `action`、水合后再执行一遍。
- **全屏层传送到 `#teleports`。** 在应用根节点外提供专用的 `<div id="teleports"></div>`；SSR 宿主需要把该目标的 Teleport 输出注入此容器，才能在服务端与客户端使用相同挂载位置。
