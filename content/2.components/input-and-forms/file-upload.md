---
title: 文件上传
description: 用于拖放或点击选择文件、带动效展示区的文件上传入口组件。
category: 表单与输入
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="FileUploadDemo.vue" config="FileUploadConfig" componentId="file-upload" :componentFiles='["FileUpload.vue", "FileUploadGrid.vue"]'}

#credits

- 感谢 [kalix127](https://github.com/kalix127) 移植该组件。
- 灵感来自 [AcernityUI](https://ui.aceternity.com/components/file-upload)。

::

## 简介

文件上传是一个带动效的文件选择入口：点击区域打开文件选择框，或直接把文件拖放进来；选中的文件以动画卡片列出文件名、大小、类型和修改时间。所选文件通过 `onChange` 事件抛出（`File[]`），组件本身不发起上传请求，需要在回调中自行处理。默认插槽用于放置 `FileUploadGrid` 等背景装饰层。仅 web 端可用。

适用场景：

- 表单中需要拖拽上传文件的交互入口。
- 需要配合 `FileUploadGrid` 网格背景的视觉化上传区块。

不适用场景：

- 需要上传进度、文件列表增删等受控管理：组件未提供相关 props / exposes。

## 用法

### 基础用法

把 `FileUploadGrid` 放入默认插槽作为背景网格，监听 `onChange` 拿到当前已选的全部文件（`File[]` 累计列表），在回调中自行发起上传。

```vue
<script setup lang="ts">
function handleChange(files: File[]) {
  // files 为累计的完整文件列表，自行调用上传接口
  console.log(files.map((f) => f.name));
}
</script>

<template>
  <FileUpload
    class="rounded-lg border border-dashed border-neutral-200 dark:border-neutral-800"
    @on-change="handleChange"
  >
    <FileUploadGrid />
  </FileUpload>
</template>
```

### 自定义外观

`class` 追加到最外层容器（常用于边框、圆角）；默认插槽内容渲染在上传区域后方的装饰层中（`pointer-events-none` 且带径向渐变遮罩），除 `FileUploadGrid` 外也可以放任意自定义背景；`FileUploadGrid` 自身也接受 `class` 微调网格样式。

```vue
<template>
  <FileUpload class="rounded-2xl bg-neutral-50 dark:bg-neutral-950">
    <FileUploadGrid class="opacity-60" />
  </FileUpload>
</template>
```

## API

### `FileUpload`

`FileUpload` 组件是文件上传效果的包装容器，处理点击选择、拖放与悬停动效。

#### Props

| 属性名 | 类型   | 默认值 | 描述                       |
| ------ | ------ | ------ | -------------------------- |
| `class`| String | -      | 用于容器元素的额外样式类。 |

#### Emits

| 事件名    | 类型                      | 描述                                                     |
| --------- | ------------------------- | -------------------------------------------------------- |
| `onChange`| `(files: File[]) => void` | 添加/上传文件时触发，回调为累计的完整文件列表。          |

#### Slots

| 插槽名    | 描述                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| `default` | 背景装饰层插槽，渲染在上传区域后方的绝对定位容器内（带径向渐变遮罩），通常放置 `FileUploadGrid`。 |

### `FileUploadGrid`

`FileUploadGrid` 组件为上传区域提供背景网格图案，应在 `FileUpload` 内使用，以在上传界面背后呈现网格效果。

#### Props

| 属性名 | 类型   | 默认值 | 描述                     |
| ------ | ------ | ------ | ------------------------ |
| `class`| String | -      | 用于自定义样式的额外类。 |

## 注意事项

- 仅 web 端可用，依赖 `motion-v`。
- 所选文件通过 `onChange` 事件抛出（payload 为 `File[]`），组件本身不含上传请求逻辑，需在回调中自行处理。
- `onChange` 回调的是累计列表：内部文件数组只增不减，包含之前已选的文件，且组件未提供删除/清空能力。
- 点击选择为单文件（内部 `input` 未设 `multiple`）；拖拽可一次放入多个文件。
- 背景网格是独立子组件 `FileUploadGrid`，需放入默认插槽；该插槽层为 `pointer-events-none`，不会拦截点击与拖放。
