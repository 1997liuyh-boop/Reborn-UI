---
title: 滑块
description: 用于在数值区间内拖动取值的滑块组件，支持单值与范围两种模式。
category: 表单与输入
tags: [css, tailwind, slider, range, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSliderDemo.vue" config="RebornSliderConfig" componentId="reborn-slider" :componentFiles='["RebornSlider.vue", "reborn-slider.config.ts"]' :uniappFiles='["RebornSlider.vue", "reborn-slider.config.ts"]'}
::

## 简介

滑块用于在 `min` / `max` 连续区间内拖动取值，按 `step` 对齐步长。单值模式用 `v-model` 绑定一个数字；开启 `range` 后切换为范围模式，用 `v-model:values` 绑定 `[起, 止]` 数组并出现两个滑块。拖动中实时触发 `changing`，松手后触发 `change`，可用 `showValue` 或 `value` 插槽展示当前值。web 与 uniapp 双端可用。

适用场景：

- 音量、进度、价格等连续数值的调节，需要 `min` / `max` / `step` 控制取值。
- 区间筛选场景：开启 `range` 并用 `v-model:values` 绑定 `[起, 止]` 数组。
- 需要展示当前值（`showValue`）或用 `thumb` / `value` 插槽自定义滑块与数值显示。

不适用场景：

- 人机滑动验证，改用 `reborn-slide-verify`（仅 uniapp）。
- 需要精确键入数字，改用 `reborn-input-number`。

## 用法

### 基础用法

`v-model` 绑定当前值，`min` / `max` 限定区间，`step` 控制步长；`show-value` 在滑块右侧显示当前值。

```vue
<script setup lang="ts">
import { ref } from "vue";

const volume = ref(40);
</script>

<template>
  <RebornSlider v-model="volume" :min="0" :max="100" :step="10" show-value />
</template>
```

### 范围选择

开启 `range` 后改用 `v-model:values` 绑定数组，两个滑块分别控制起止值（组件会自动保证顺序）。

```vue
<script setup lang="ts">
import { ref } from "vue";

const priceRange = ref([20, 80]);
</script>

<template>
  <RebornSlider v-model:values="priceRange" range show-value />
</template>
```

### 监听拖拽过程与结果

拖动过程中 `changing` 实时回调，松手时 `change` 给出最终值；回调参数在单值模式为 `number`、范围模式为 `number[]`。

```vue
<template>
  <RebornSlider
    v-model="volume"
    @changing="(v) => (preview = v)"
    @change="(v) => save(v)"
  />
</template>
```

### 自定义滑块与数值显示

`thumb` 插槽替换滑块本体（单值模式），作用域 `value` 内含当前值与定位样式，需要把 `value.style` 应用到自定义节点上；`value` 插槽替换右侧数值显示。

```vue
<template>
  <RebornSlider v-model="volume">
    <template #thumb="{ value }">
      <view
        :style="{ ...value.style, width: '30px', height: '20px' }"
        class="pointer-events-none absolute rounded-full bg-warning text-center text-white"
      >
        {{ value.value }}
      </view>
    </template>
    <template #value="{ value }">
      <text class="text-primary">{{ value }}%</text>
    </template>
  </RebornSlider>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 单值模式下绑定值。 |
| `values` | `number[]` | `[0, 0]` | 范围模式下绑定值（`v-model:values`）。 |
| `min` | `number` | `0` | 最小值。 |
| `max` | `number` | `100` | 最大值。 |
| `step` | `number` | `1` | 步长。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `showValue` | `boolean` | `false` | 是否显示当前值。 |
| `range` | `boolean` | `false` | 是否启用范围模式。 |
| `trackHeight` | `number` | `4` | 仅 uniapp。轨道线的高度。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小（影响滑块直径）。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |
| `class` | `any` | `-` | 仅 web。追加到根节点的自定义类名。 |
| `customClass` | `any` | `-` | 仅 uniapp。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 细粒度样式覆盖对象，详见下表。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 单值变化。 |
| `update:values` | `number[]` | 范围值变化。 |
| `change` | `number \| number[]` | 拖拽结束后的最终值。 |
| `changing` | `number \| number[]` | 拖拽中的实时值。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `thumb` | `{ value: { value, style } }` | 自定义滑块本体（单值模式生效），需将 `value.style` 应用到自定义节点以保持定位。 |
| `value` | `{ value }` | 自定义数值显示，`value` 为当前值文本（范围模式为 `起 - 止`）。 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `inner` | 轨道与滑块所在的内层容器。 |
| `picker` | 仅 uniapp。拖拽命中区域。 |
| `track` | 轨道背景。 |
| `progress` | 已选进度条。 |
| `thumb` | 滑块本体。 |
| `thumbActive` | 激活状态滑块（范围模式两个滑块常驻此态）。 |
| `value` | 右侧数值文本。 |

## 注意事项

- web、uniapp 双端可用。
- 单值模式用 `v-model`；范围模式必须同时设置 `range` 并改用 `v-model:values` 绑定数组，两者不可混用。
- 除 `update:modelValue` / `update:values` 外还提供 `change`（松手后最终值）与 `changing`（拖拽中实时值）两个事件，回调为数值或数组。
- 范围模式下组件会自动排序两端值并选择离点击位置更近的滑块进行拖动。
- `thumb` 插槽仅在单值模式渲染，范围模式的两个滑块不可通过插槽替换。
- `trackHeight` 仅 uniapp 端有效；web 端轨道高度由 `size` 与 `ui.track` 控制。
