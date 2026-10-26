---
title: 取色器
description: 用于弹出面板选取颜色并以 v-model 绑定色值字符串的取色器组件，双端可用。
category: 表单与输入
platform: both
tags: [vue, reborn-color-picker, uniapp]
---

::ComponentViewer{demoFile="RebornColorPickerDemo.vue" config="RebornColorPickerConfig" componentId="reborn-color-picker" :componentFiles='["RebornColorPicker.vue", "RebornColorPickerPanel.vue", "reborn-color-picker.config.ts", "reborn-color-picker-panel.config.ts"]' :uniappFiles='["RebornColorPicker.vue", "reborn-color-picker.config.ts"]'}
::

## 简介

RebornColorPicker 是 Web 与 UniApp 均可用的色块触发器与弹出选色面板，颜色以字符串写回模型。

`modelValue` 决定当前颜色，`placement` / `sideOffset` 控制方向和间距；面板包含饱和度、明度、色相、透明度输入和主题预设色。

`size` / `disabled` 控制触发器尺寸与状态，UniApp 的 `defaultFormat` 控制输出格式，Web 可用默认插槽定制触发器，两端差异见对照表。

### 何时使用

- 用户设置主题色——用 `modelValue` 双向绑定颜色字符串。
- 窄容器需要控制面板方向——用 `placement` / `sideOffset` 调整位置。
- 权限不足时保留颜色展示——用 `disabled` 禁止交互。

### 何时不使用

- 需要 Web 对比度参考面板——改用 `color-picker`。
- 只允许选固定颜色名称——改用 `reborn-radio`。

## 用法

### 基础用法

`v-model` 绑定颜色字符串（默认 `'#000000'`），面板中选色后实时回写。Web 端回写的是十六进制：不透明时为 `#rrggbb`，拖过透明度滑杆后为带透明度的 `#rrggbbaa`。不绑 `v-model` 时组件自己保存选中的颜色，触发器色块照样跟随。

```vue
<script setup lang="ts">
import { ref } from "vue";

const color = ref("#4D80F0");
</script>

<template>
  <RebornColorPicker v-model="color" />
</template>
```

### 尺寸与禁用

`size` 支持 `'sm' | 'md' | 'lg'` 三档色块尺寸，两端一致；`disabled` 禁用后不再弹出面板。

```vue
<template>
  <RebornColorPicker v-model="color" size="sm" />
  <RebornColorPicker v-model="color" size="lg" />
  <RebornColorPicker v-model="color" disabled />
</template>
```

### 输出格式（UniApp）

UniApp 端用 `default-format` 指定回写格式（`'hex' | 'rgb' | 'rgba'`）；未指定时按传入的 `modelValue` 自动识别格式，用户仍可在面板中切换。

```vue
<script setup lang="ts">
import { ref } from "vue";

const colorHex = ref("#4D80F0");
const colorRgba = ref("rgba(244, 63, 94, 0.50)");
</script>

<template>
  <view class="flex flex-col gap-[24rpx]">
    <RebornColorPicker v-model="colorHex" default-format="hex" />
    <RebornColorPicker v-model="colorRgba" default-format="rgba" />
  </view>
</template>
```

### 弹出配置与自定义触发器

`placement` 调整弹出方向与对齐，`sideOffset` 调整间距，两端写法一致；默认值两端不同：Web 端 `'bottom'`，UniApp 端 `'right'`，间距都是 8px。UniApp 端 `:arrow="false"` 可隐藏弹层箭头；Web 端可用默认插槽替换触发器。

```vue
<template>
  <!-- 向上弹出、起点对齐（两端通用）；UniApp 端另可隐藏箭头 -->
  <RebornColorPicker v-model="color" placement="top-start" :side-offset="12" />

  <!-- Web：自定义触发器 -->
  <RebornColorPicker v-model="color">
    <button class="rounded border px-3 py-1 text-sm">选择颜色</button>
  </RebornColorPicker>
</template>
```

## API
### Props

| 属性名          | 类型                     | 默认值                                            | 说明                                                                                            |
| :-------------- | :----------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------- |
| `modelValue` | `string`                 | `'#000000'`                                       | 绑定的颜色值，支持通过 `v-model` 双向绑定                                                       |
| `disabled` | `boolean`                | `false`                                           | 是否禁用整体取色器                                                                              |
| `size` | `'sm' \| 'md' \| 'lg'`   | `'md'`                                            | 色块触发器尺寸                                                                                  |
| `defaultFormat` | `'hex' \| 'rgb' \| 'rgba'` | `undefined`                                     | 初始颜色输出格式；未设置时根据 `modelValue` 自动识别，用户仍可在面板中切换。仅 UniApp 端        |
| `format` | `'hex' \| 'rgb' \| 'rgba'` | `undefined`                                     | `defaultFormat` 的别名，同样指定输出格式；两者同时传入时 `defaultFormat` 优先。仅 UniApp 端     |
| `placement` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | Web `'bottom'` / UniApp `'right'` | 面板弹出方向与对齐方式，与 `reborn-popover` 一致；UniApp 端未传时回落到 `content`                 |
| `sideOffset` | `number`                 | `8`                                               | 面板与色块触发器的间距（px）                                                                    |
| `content` | `object`                 | `{ side: 'right', align: 'center', sideOffset: 8 }` | 已废弃：旧的弹出配置（`side`/`align`/`sideOffset`），等价于 `placement` + `sideOffset`。仅 UniApp 端 |
| `arrow` | `boolean`                | `true`                                            | 是否显示弹层箭头。仅 UniApp 端                                                                  |
| `ui` | `object`                 | `{}`                                              | UI 配置覆盖对象，见下方「自定义样式（ui）」                                                     |
| `class` | `any`                    | `-`                                               | 追加到选色面板根节点的自定义类名（面板组件 `RebornColorPickerPanel` 的属性）                    |

### Emits

| 事件名              | 回调参数                | 说明                                                                     |
| :------------------ | :---------------------- | :----------------------------------------------------------------------- |
| `update:modelValue` | `(val: string)`         | 颜色值变化时触发（`v-model` 同步）。Web 端拖拽中逐帧触发，参数为 `#rrggbb`（带透明度时 `#rrggbbaa`）；UniApp 端参数按当前格式序列化 |
| `change`            | `(val: string)`         | 一次取色交互结束且颜色确实变化时触发：松开拖拽、点选预设色、输入框失焦或回车提交合法色值；外部改写 `v-model` 不触发。`RebornColorPickerPanel` 同样派发，两端一致。 |
| `update:format`     | `(val: ColorFormat)`    | 面板中切换输出格式时触发（面板的 `v-model:format` 同步）。仅 UniApp 端   |

### Slots

| 插槽名    | 说明                                                              |
| :-------- | :---------------------------------------------------------------- |
| `default` | 自定义触发器内容，替换默认的色块按钮。仅 Web 端；UniApp 端不支持 |

### 自定义样式（ui）

`RebornColorPicker` 上的 `ui` 只作用于**触发器**（双端键位相同）：

| 键名   | 说明                                                                                                                                              |
| :----- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root` | 触发器根容器，默认 `ring ring-1 ring-gray-5 p-1 rounded-md cursor-pointer select-none hover:scale-105 transition-all`；整体尺寸由 `size` 变体给出，外框与圆角改这里。**Web 端填充 default 插槽只替换容器内部的色块，`ui.root` 仍生效。** |
| `base` | 色块本体（背景色为当前颜色，由内联 `style` 给出），默认 `rounded-md ring ring-1 ring-gray-5 w-full h-full flex justify-center items-center`。**Web 端填充 default 插槽会替换掉该节点**，`ui.base` 与 `ui.icon` 随之失效。 |
| `icon` | 色块内的下拉箭头图标，默认 `text-white transition-transform duration-200`；同样受上面的 default 插槽陷阱影响。                                      |

**面板的 `ui` 要写在 `RebornColorPickerPanel` 上**——触发器不会把 `ui` 下发给内部弹出的面板。想改面板样式，请直接使用面板组件（双端键位相同，只有默认值不同：Web 端面板宽 `w-64`，UniApp 端为 `w-[260px]`）：

| 键名               | 说明                                                                                                                       |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `root`             | 面板根节点，默认 `w-64 space-y-4 p-3 bg-white rounded-xl border shadow-sm`（UniApp 端为 `flex flex-col w-[260px] … p-4`）；面板宽度、内边距、底色改这里。 |
| `saturation`       | 饱和度/明度取色区，默认 `relative w-full aspect-video rounded-lg cursor-crosshair overflow-hidden`（UniApp 端为固定 `h-40`）；背景渐变由内联 `style` 生成，这里只改尺寸与圆角。 |
| `saturationCursor` | 取色区内的圆形游标，默认 `absolute w-4 h-4 rounded-full border-2 border-white shadow-sm pointer-events-none`；位置由内联 `style` 驱动。 |
| `controls`         | 「预览色块 + 滑杆组」一行的容器，默认 `flex gap-3 items-center`。                                                            |
| `preview`          | 当前颜色预览块，默认 `size-10 rounded-lg shadow-inner shrink-0`（UniApp 端为圆形 `rounded-full`）。                          |
| `sliders`          | 色相/透明度两条滑杆的纵向容器，默认 `flex-1 space-y-2`。                                                                     |
| `hueSlider`        | 色相滑杆轨道，默认 `relative h-3 w-full rounded-full cursor-pointer`；彩虹渐变由内联 `style` 给出。                          |
| `hueCursor`        | 色相滑杆游标，默认 `absolute h-4 w-4 bg-white rounded-full shadow-md pointer-events-none`。                                  |
| `alphaSlider`      | 透明度滑杆轨道，默认同 `hueSlider`；棋盘格与当前色渐变由内联 `style` 给出。                                                   |
| `alphaCursor`      | 透明度滑杆游标，默认同 `hueCursor`。                                                                                        |
| `inputs`           | 「格式切换 + 色值输入框」区块的容器，默认 `space-y-2`（UniApp 端 `flex flex-col gap-3`）。                                    |
| `formatToggles`    | `HEX / RGB / RGBA` 切换按钮组的容器，默认 `flex gap-1`；按钮本身是 `RebornButton`，样式请用它自己的 props。                   |
| `input`            | 色值输入框（内部 `RebornInput` 的 `class`），默认 `w-full text-xs font-mono`。                                               |
| `presets`          | 预设色区块容器，默认 `pt-3 border-t border-gray-100`；分隔线改这里。                                                         |
| `presetTitle`      | 预设色标题「主题预设」，默认 `text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-tight`。                            |
| `presetGrid`       | 预设色网格，默认 `grid grid-cols-10 gap-1.5`（UniApp 端 `grid-cols-8`）；每行个数改这里。                                     |
| `presetSwatch`     | 单个预设色块（`RebornButton` 的 `class`），默认 `aspect-square ring-1 ring-black/5 hover:scale-110 p-0!`。                    |

```vue
<template>
  <!-- 触发器 -->
  <RebornColorPicker v-model="color" :ui="{ root: 'rounded-full p-0.5', base: 'rounded-full' }" />

  <!-- 面板（内联使用时才能改面板样式） -->
  <RebornColorPickerPanel
    v-model="color"
    :ui="{
      root: 'w-72 p-4',
      saturation: 'h-44',
      presetGrid: 'grid-cols-8 gap-2',
    }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 输出格式 | HEX，含透明度时为 HEXA | 支持 hex / rgb / rgba 切换 |
| 自定义触发器 | 支持 default 插槽 | 使用内置色块 |
| 默认方向 | bottom | right |

## 注意事项

- **模型保存颜色字符串**。Web 与 UniApp 双端可用；`modelValue` 为颜色字符串，默认 `'#000000'`。
- **UniApp 输出格式可以锁定**。UniApp 端输出格式由 `defaultFormat` / `format` 控制；未指定时按传入色值自动识别（如传入 `rgba(...)` 字符串则回写 `rgba` 格式）。
- **边缘取色器需调整弹出方向**。UniApp 端弹出位置默认 `right`，取色器贴近屏幕边缘时用 `placement` 调整（如 `placement="top"`）；旧的 `content` 写法仍然可用，同时传入时以 `placement` 为准。
- **重复颜色不会反复回写**。面板内部以 HSVA 保存颜色以避免格式转换的精度丢失；与当前颜色一致的回写会被跳过，减少重复渲染。
- **外部改写 `v-model` 不会被面板改写回来。** 面板只把外部值解析后同步显示，不回传：父组件写的 `#FF0000`、`#f00`、`rgb(...)` 原样保留；颜色名（如 `red`）等无法解析的值不改面板显示。只有拖拽、点预设、输入框提交这几个交互会回写。
- **色值输入框失焦或回车才生效。** 输入到一半的 `#12` 不是合法颜色，逐字回写会把输入框改成别的值；只接受完整的 `#rgb`、`#rgba`、`#rrggbb`、`#rrggbbaa` 与 `rgb()` / `rgba()`，不合法时恢复为当前色值。
- **Web 端表单校验在一次取色结束时触发。** 拖拽中 `v-model` 逐帧更新，校验只在 `change` 时做一次；若要在拖拽中实时响应，监听 `update:modelValue`。
- **自定义触发器仅支持 Web**。默认插槽替换触发器仅 Web 端支持，UniApp 端触发器为固定的色块按钮。
- **父容器必须允许溢出**。在小程序等容器内使用时，父级容器需允许溢出（如示例中卡片开启 `overflowVisible`），否则弹层会被裁剪。
