---
title: ColorPicker 取色器
description: 用于弹层中选取颜色的取色器组件，支持 hex/hsl/rgb 等格式与预设色板。
category: 表单与输入
platform: web
tags: [css, tailwind, input, color-picker, uplusion23]
---

::ComponentViewer{demoFile="ColorPickerDemo.vue" config="ColorPickerConfig" componentId="color-picker" :componentFiles='["ColorPicker.vue", "ObjectColorInput.vue", "ContrastRatio.vue", "index.ts"]' dependencies="@uiw/color-convert"}
::

## 简介

ColorPicker 是仅 Web 的弹层取色器，包含色板、颜色通道输入和对比度参考。

`value` 提供颜色数据，`type` 选择输入格式，`swatches` 提供预设色；输出通过 `value-change` 事件交给调用方处理。

`open` 控制展开，默认插槽提供触发器；`hideContrastRatio` 与 `hideDefaultSwatches` 分别隐藏对比度区和默认色板，自定义色板仍保留。

### 何时使用

- 需要在颜色面板中切换输入格式——用 `type` 设置初始显示格式。
- 设计工具需要展示品牌预设——用 `swatches` 传入色板。
- 需要从页面状态打开面板——用 `open` 绑定展开状态。

### 何时不使用

- 需要同时支持 Web 与 UniApp 的颜色字符串绑定——改用 `reborn-color-picker`。
- 只允许从有限主题名称中选择——改用 `reborn-select`。

## 用法

### 基础用法

`value` 设置当前颜色，默认插槽必须提供弹层触发器。

| 配置 | 典型用途 |
| --- | --- |
| `value` | 回显当前色值 |
| `open` | 受控面板展开 |

```vue
<template>
  <ColorPicker value="#3366ff">
    <button type="button">
      选择颜色
    </button>
  </ColorPicker>
</template>
```

### 输出格式

`type` 选择颜色输入格式，`swatches` 可提供常用色。

| 配置 | 典型用途 |
| --- | --- |
| `type` | 切换颜色通道输入 |
| `swatches` | 品牌预设色 |

```vue
<template>
  <ColorPicker value="#3366ff" type="rgb" :swatches="['#3366ff', '#ff6600']">
    <button type="button">
      编辑 RGB 颜色
    </button>
  </ColorPicker>
</template>
```

## API
### Props

| 属性名                | 类型                                            | 默认值      | 描述                        |
| --------------------- | ----------------------------------------------- | ----------- | --------------------------- |
| `value` | `string \| HsvaColor \| HslaColor \| RgbaColor` | `undefined` | 当前颜色值，支持多种格式。  |
| `type` | `'hsl' \| 'hsla' \| 'rgb' \| 'rgba' \| 'hex'`   | `'hsl'`     | 输入区显示的颜色格式；之后修改会同步到面板，用户仍可在面板内切换。 |
| `swatches` | `HexColor[]`                                    | `[]`        | 预设色板数组。              |
| `hideContrastRatio` | `boolean`                                       | `false`     | 隐藏无障碍对比度区域。      |
| `hideDefaultSwatches` | `boolean`                                       | `false`     | 隐藏默认色板，`swatches` 传入的自定义色板照常显示。 |
| `class` | `string`                                        | `""`        | 用于弹出内容的额外 CSS 类。 |
| `open` | `boolean`                                       | `undefined` | 弹层开关，支持 `v-model:open`；未绑定时由组件内部维护，`undefined` 按关闭处理。 |

### Emits

| 事件名         | 类型                                | 描述                         |
| -------------- | ----------------------------------- | ---------------------------- |
| `value-change` | `(value: ColorPickerValue) => void` | 当所选颜色变化时触发；HEX 输入框只在凑够 6 / 8 位合法十六进制时触发。 |
| `update:open`  | `(value: boolean) => void`          | 当弹出层打开状态改变时触发。 |

### Slots

| 插槽名    | 描述                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| `default` | 触发器内容（如一个按钮），点击后切换弹层开关；组件自身不渲染默认触发器，必须提供。 |

### ContrastRatio Props

子组件 `ContrastRatio`（面板底部的无障碍对比度区域，可独立使用）：

| 属性名  | 类型        | 默认值 | 描述                                                                      |
| ------- | ----------- | ------ | ------------------------------------------------------------------------- |
| `color` | `HsvaColor` | 必填   | 用于计算无障碍对比度的当前颜色（HSVA 对象），变化时自动重算 AA/AAA 达标。 |

### ObjectColorInput Props

子组件 `ObjectColorInput`（面板中的分通道数字输入组，可独立使用）：

| 属性名  | 类型                                 | 默认值 | 描述                                                                                                           |
| ------- | ------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------- |
| `label` | `'hsl' \| 'hsla' \| 'rgb' \| 'rgba'` | 必填   | 数字输入组的颜色格式：hsl/hsla 显示 H/S/L 通道，rgb/rgba 显示 R/G/B 通道；带 a 的格式追加透明度输入（0-100）。 |
| `value` | `HslaColor \| RgbaColor`             | 必填   | 当前颜色对象，各输入框的取值来源；输入修改后通过 `value-change` 事件回传。                                     |

### ColorPickerValue 类型

```typescript
interface ColorPickerValue {
  hex: string; // 十六进制颜色（例如 "#ff0000"）
  hsl: HslaColor; // 具有 h、s、l、a 属性的 HSL 颜色对象
  hsla: HslaColor; // 具有 h、s、l、a 属性的 HSLA 颜色对象
  rgb: RgbaColor; // 具有 r、g、b、a 属性的 RGB 颜色对象
  rgba: RgbaColor; // 具有 r、g、b、a 属性的 RGBA 颜色对象
}
```

### 来源

- 感谢 [kalix127](https://github.com/kalix127) 移植该组件。
- 灵感来自 [@uplusion23](https://21st.dev/uplusion23/color-picker/color-picker-with-swatches-and-onchange)。

## 注意事项

- **跨端场景需换用 Reborn 取色器**。仅 Web 端可用（依赖 `@uiw/color-convert`）；UniApp 项目请改用 `reborn-color-picker`。
- **颜色输入与结果回显分别维护**。`value` 设置初始色或外部指定色，`value-change` 回传 `ColorPickerValue`（hex/hsl/hsla/rgb/rgba）；回调只更新业务展示即可，不必再写回 `value`。持续把 HSL/HSLA 输出回喂为输入会经过 HSV 往返转换，纯黑时会丢失饱和度，使色板横向位置复位；颜色本身不支持 `v-model`，弹层开关另用 `v-model:open`。
- **展开状态支持受控绑定**。弹层开关由 `open` prop 与 `update:open` 事件控制（`v-model:open`），点击默认插槽内容即可切换。
- **默认格式不会限制用户切换**。`type` 只决定输入区默认显示的颜色格式（默认 `'hsl'`），用户可在面板内自由切换，不影响 `value-change` 的 payload 结构。
- **自定义色板默认与内置色板合并**。`swatches` 传入的自定义色板会与默认色板合并并按色相排序展示；`hideDefaultSwatches` 只隐藏默认色板，与 `swatches` 同时使用即可只显示自定义色板；`hideContrastRatio` 隐藏对比度区域。
- **输入框持有草稿，不会在输入中途被改写**。HEX 输入只在合法时提交，失焦后与当前颜色对齐；数字通道清空或输入越界值时不立即提交，失焦或回车时夹取到合法范围。
