---
title: 文件上传
description: 用于拖放或点击选择文件、带动效展示区的文件上传入口组件。
category: 表单与输入
platform: web
tags: [css, tailwind, input, aceternity-ui]
---

::ComponentViewer{demoFile="FileUploadDemo.vue" config="FileUploadConfig" componentId="file-upload" :componentFiles='["FileUpload.vue", "FileUploadGrid.vue"]'}
::

## 简介

FileUpload 是仅 Web 的文件选择入口，支持点击选择和拖放，选中的文件以动效卡片展示。

文件由用户选择后累计到内部列表，`change` 事件返回 `File[]` 副本；组件不发起上传请求，业务需在回调中完成上传。

`class` 控制入口外观；默认插槽是背景装饰层，可放置 FileUploadGrid，文件卡片展示名称、大小、类型与修改时间。

### 何时使用

- 落地页需要明显的拖放文件入口——用 `class` 设置选择区尺寸。
- 同一表单中需要对齐上传区与其它字段——用 `class` 约束外层宽度。
- 需要带网格背景的上传入口——给 FileUploadGrid 的 `class` 配置装饰样式。

### 何时不使用

- 只展示已上传图片而不选择文件——改用 `reborn-image`。
- 仅需录入文件地址——改用 `reborn-input`。

## 用法

### 基础用法

把 `FileUploadGrid` 放入默认插槽作为背景网格，监听 `change` 拿到当前已选的全部文件（`File[]` 累计列表），在回调中自行发起上传。

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
    @change="handleChange"
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
`FileUpload` 组件是文件上传效果的包装容器，处理点击选择、拖放与悬停动效。

### Props

| 属性名 | 类型   | 默认值 | 描述                       |
| ------ | ------ | ------ | -------------------------- |
| `class` | String | -      | 用于容器元素的额外样式类。 |

### Emits

| 事件名    | 类型                      | 描述                                                     |
| --------- | ------------------------- | -------------------------------------------------------- |
| `change`  | `(files: File[]) => void` | 添加文件时触发，参数为累计的完整文件列表（副本，修改它不影响组件内部列表）。 |

### Slots

| 插槽名    | 描述                                                                                       |
| --------- | ------------------------------------------------------------------------------------------ |
| `default` | 背景装饰层插槽，渲染在上传区域后方的绝对定位容器内（带径向渐变遮罩），通常放置 `FileUploadGrid`。 |

### `FileUploadGrid`

`FileUploadGrid` 组件为上传区域提供背景网格图案，应在 `FileUpload` 内使用，以在上传界面背后呈现网格效果。

#### Props

| 属性名 | 类型   | 默认值 | 描述                     |
| ------ | ------ | ------ | ------------------------ |
| `class` | String | -      | 用于自定义样式的额外类。 |

### 来源

- 感谢 [kalix127](https://github.com/kalix127) 移植该组件。
- 灵感来自 [AcernityUI](https://ui.aceternity.com/components/file-upload)。

## 注意事项

- **仅支持 Web**。动画依赖 `motion-v`，不可直接用于 UniApp 原生页面。
- **上传请求由使用方处理**。所选文件通过 `change` 事件抛出（payload 为 `File[]` 副本），组件本身不含上传请求逻辑，需在回调中自行处理。事件曾名为 `onChange`（监听写作 `@on-change`），现已改名，旧写法不再触发。
- **回调返回累计列表**。内部文件数组只增不减，包含之前已选的文件，且组件未提供删除/清空能力；使用方不能把回调数组当成本次增量。
- **点击与拖放的数量限制不同**。内部 `input` 未设 `multiple`，点击只能选择一个文件；拖拽可一次放入多个文件。
- **背景网格需手动放入插槽**。独立子组件 `FileUploadGrid` 放入默认插槽后才显示；该插槽层为 `pointer-events-none`，不会拦截点击与拖放。
