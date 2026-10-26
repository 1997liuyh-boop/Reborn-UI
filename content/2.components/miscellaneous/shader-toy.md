---
title: ShaderToy 着色器
description: 用于在浏览器中渲染 ShaderToy GLSL 片段着色器的 WebGL 组件。
category: 特效
platform: web
tags: [css, tailwind, shader-toy, ogl, webgl]
---

::ComponentViewer{demoFile="ShaderToyDemo.vue" config="ShaderToyConfig" componentId="shader-toy" :componentFiles='["ShaderToy.vue", "rebornShaderToy.ts"]' dependencies="ogl"}
::

## 简介

ShaderToy 是仅 Web 的 WebGL 片段着色器展示组件，用于实时图形效果。

`shaderCode` 提供片段程序，`mouseMode` 控制指针输入，`speed` 控制时间推进；源码须遵循组件支持的 ShaderToy 接口。

`hue` / `saturation` / `brightness` 调整输出，`class` 设置容器；创建渲染器失败会派发 `error`，可用 `fallback` 插槽提供替代内容。

### 何时使用

- 展示 ShaderToy 风格片段着色器——用 `shaderCode` 传入 GLSL 源码。
- 需要指针持续参与效果——用 `mouseMode="hover"`。
- 需要调整播放节奏与色调——用 `speed` / `hue` 控制输出。

### 何时不使用

- 静态装饰图无需实时着色——改用 `reborn-image`。
- 需要以多张背景图轮播——改用 `images-slider`。

## 用法

### 基础用法

`shaderCode` 提供 `mainImage` 片段程序，`class` 给画布确定的高度。

| 配置 | 典型用途 |
| --- | --- |
| `shaderCode` | 实时 GLSL 输出 |
| `speed` | 控制时间推进倍率 |

```vue
<template>
  <ShaderToy
    shader-code="void mainImage(out vec4 color, in vec2 coord) { color = vec4(coord / iResolution.xy, 0.5, 1.0); }"
    :speed="1" class="h-64 w-full"
  >
    <template #fallback>当前环境无法显示实时图形。</template>
  </ShaderToy>
</template>
```

## API

### Props
| 属性名     | 类型                 | 默认值   | 描述                                      |
| ---------- | -------------------- | -------- | ----------------------------------------- |
| `shaderCode` | `string`            | `-`      | 来自 ShaderToy 的 GLSL 片段着色器源码。   |
| `mouseMode` | `'click' \| 'hover'`| `'click'`| 鼠标跟踪模式：点击或持续悬停。            |
| `hue` | `number`            | `0`      | 调整着色器输出的色相。                    |
| `saturation` | `number`            | `1`      | 调整着色器输出的饱和度。                  |
| `brightness` | `number`            | `1`      | 调整着色器输出的亮度。                    |
| `speed` | `number`            | `1`      | 调整着色器输出的速度。                    |
| `class` | `string`            | `-`      | 应用于容器的自定义类。                    |

`shaderCode` 与 `mouseMode` 在挂载后修改即生效：切换着色器时组件在同一个 WebGL 上下文里重新编译，不需要用 `:key` 重建组件。

### Emits

| 事件名  | 参数               | 描述                                                         |
| ------- | ------------------ | ------------------------------------------------------------ |
| `error` | `(error: unknown)` | 当前环境不支持 WebGL 2、无法创建渲染器时触发，载荷为抛出的错误。 |

### Slots

| 插槽名     | 描述                                                   |
| ---------- | ------------------------------------------------------ |
| `fallback` | 不支持 WebGL 2 时在容器内渲染的降级内容，默认为空。 |

### 来源

- 使用 [OGL](https://github.com/oframe/ogl) 构建。
- 灵感来自 [Shadertoy](https://shadertoy.com/)，并为 Vue 兼容性做了适配。

## 注意事项

- **运行环境需要 WebGL 2**。无法创建渲染器时会派发 `error` 并显示 `fallback`，应提供可读的降级内容。
- **代码输入是片段着色器源码**。普通图片地址不能作为 `shaderCode` 使用，需要按 ShaderToy 的函数约定编写。
- **容器必须有可用尺寸**。画布按容器布局显示，使用 `class` 给出高度，避免内容区塌陷。
