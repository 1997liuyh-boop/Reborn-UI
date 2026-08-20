---
title: 取色器
description: 用于弹层中选取颜色的取色器组件，支持 hex/hsl/rgb 等格式与预设色板。
category: 表单与输入
tags: [css, tailwind, input, color-picker, uplusion23]
---

::ComponentViewer{demoFile="ColorPickerDemo.vue" config="ColorPickerConfig" componentId="color-picker" :componentFiles='["ColorPicker.vue", "ObjectColorInput.vue", "ContrastRatio.vue", "index.ts"]' dependencies="@uiw/color-convert"}

#api

## API

### ColorPicker Props

| 属性名                 | 类型                                            | 默认值     | 描述                                        |
| ---------------------- | ----------------------------------------------- | ---------- | ------------------------------------------- |
| `value`                | `string \| HsvaColor \| HslaColor \| RgbaColor` | `undefined`| 当前颜色值，支持多种格式。                  |
| `type`                 | `'hsl' \| 'hsla' \| 'rgb' \| 'rgba' \| 'hex'`   | `'hsl'`    | 输入中默认显示的颜色格式。                  |
| `swatches`             | `HexColor[]`                                    | `[]`       | 预设色板数组。                              |
| `hideContrastRatio`    | `boolean`                                       | `false`    | 隐藏无障碍对比度区域。                      |
| `hideDefaultSwatches`  | `boolean`                                       | `false`    | 隐藏默认色板。                              |
| `class`                | `string`                                        | `""`       | 用于弹出内容的额外 CSS 类。                 |
| `open`                 | `boolean`                                       | `false`    | 控制取色器的打开/关闭状态。                 |

### ColorPicker Events

| 事件名         | 类型                                | 描述                         |
| -------------- | ----------------------------------- | ---------------------------- |
| `value-change` | `(value: ColorPickerValue) => void` | 当所选颜色变化时触发。       |
| `update:open`  | `(value: boolean) => void`          | 当弹出层打开状态改变时触发。 |

### ColorPicker Slots

| 插槽名    | 描述                                                                                   |
| --------- | -------------------------------------------------------------------------------------- |
| `default` | 触发器内容（如一个按钮），点击后切换弹层开关；组件自身不渲染默认触发器，必须提供。     |

### ContrastRatio Props

子组件 `ContrastRatio`（面板底部的无障碍对比度区域，可独立使用）：

| 属性名  | 类型        | 默认值 | 描述                                                                     |
| ------- | ----------- | ------ | ------------------------------------------------------------------------ |
| `color` | `HsvaColor` | 必填   | 用于计算无障碍对比度的当前颜色（HSVA 对象），变化时自动重算 AA/AAA 达标。 |

### ObjectColorInput Props

子组件 `ObjectColorInput`（面板中的分通道数字输入组，可独立使用）：

| 属性名  | 类型                                    | 默认值 | 描述                                                                                            |
| ------- | --------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `label` | `'hsl' \| 'hsla' \| 'rgb' \| 'rgba'`    | 必填   | 数字输入组的颜色格式：hsl/hsla 显示 H/S/L 通道，rgb/rgba 显示 R/G/B 通道；带 a 的格式追加透明度输入（0-100）。 |
| `value` | `HslaColor \| RgbaColor`                | 必填   | 当前颜色对象，各输入框的取值来源；输入修改后通过 `value-change` 事件回传。                       |

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

## 注意事项

- 仅 Web 端可用（依赖 `@uiw/color-convert`）；UniApp 项目请改用 `reborn-color-picker`。
- 选色结果通过 `value-change` 事件获取（payload 为 `ColorPickerValue`，一次性给出 hex/hsl/hsla/rgb/rgba 五种格式），**不支持 `v-model` 绑定颜色**，需要自行在回调中更新 `value`。
- 弹层开关由 `open` prop 与 `update:open` 事件控制（`v-model:open`），点击默认插槽内容即可切换。
- `type` 只决定输入区默认显示的颜色格式（默认 `'hsl'`），用户可在面板内自由切换，不影响 `value-change` 的 payload 结构。
- `swatches` 传入的自定义色板会与默认色板合并并按色相排序展示；`hideDefaultSwatches` 只隐藏默认色板，`hideContrastRatio` 隐藏对比度区域。

#credits

- 感谢 [kalix127](https://github.com/kalix127) 移植该组件。
- 灵感来自 [@uplusion23](https://21st.dev/uplusion23/color-picker/color-picker-with-swatches-and-onchange)。

::
