---
title: Slider 滑块
description: 双端滑块：单值 / 范围 / 多节点编辑，支持刻度、间断点、垂直与反向、气泡提示与选区整体拖拽。
category: 表单与输入
platform: both
tags: [css, tailwind, slider, range, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornSliderDemo.vue" config="RebornSliderConfig" componentId="reborn-slider" :componentFiles='["RebornSlider.vue", "reborn-slider.config.ts"]' :uniappFiles='["RebornSlider.vue", "reborn-slider.config.ts"]'}
::

## 简介

Slider 用于在 `min` / `max` 连续区间内拖动取值，Web 与 UniApp 两端同名同构。

它的取值体系由三层构成：`step` 决定**取值粒度**（数字步长逐格对齐，`"mark"` 则把取值钉死在刻度上）；`range` 决定**节点数量**（单值一个滑块，范围模式为一组有序节点，`editable` 下节点还可以增删）；`marks` / `showStops` 在轨道上补充**视觉参照**（具名刻度与等距间断点）。在此之上，`vertical` / `reverse` 控制方向，`tooltip` 控制拖拽气泡，`draggableTrack` 允许把整段选区当作一个整体拖动。

滑块视觉为「语义色外圆 + 中性色中心圆」的双层结构：外圆取 `color` 语义色（各色板第 6 阶），中心圆取 `gray-1` 随主题反色；按住拖拽时叠加 20% 透明度的同色色晕。范围模式下激活滑块（默认最右侧、此后跟随最近一次按下）比未激活的大一号，视觉焦点始终落在正要操作的那只上。

### 何时使用

- 音量、亮度、进度、价格等连续数值的调节，需要 `min` / `max` / `step` 控制取值。
- 区间筛选：开启 `range` 并用 `v-model:values` 绑定 `[起, 止]` 数组。
- 取值只允许落在几个预设档位：`marks` + `step="mark"`。
- 多节点分段场景（如分段计价的断点编辑）：`range` + `editable`。
- 需要固定窗口大小、只挪窗口位置的区间：`draggableTrack`。

### 何时不使用

- 人机滑动验证 —— 改用 `reborn-slide-verify`（仅 uniapp）。
- 需要精确键入数字 —— 改用 `reborn-input-number`，或两者组合。
- 离散选项本质是枚举而非数值 —— 改用 `reborn-radio` / `reborn-select`。

## 用法

### 基础用法

`v-model` 绑定当前值，`min` / `max` 限定区间，`step` 控制步长（拖动与 Web 端方向键步进都按步长对齐）；`show-value` 在滑轨末尾显示当前值。

```vue
<script setup lang="ts">
import { ref } from "vue";

const volume = ref(40);
</script>

<template>
  <RebornSlider
    v-model="volume"
    :min="0"
    :max="100"
    :step="10"
    show-value
  />
</template>
```

### 语义色：color

`color` 决定进度条与滑块外圆的颜色（各色板第 6 阶），按压色晕取同色 20% 透明度，间断点与刻度点边框取同色板第 3 阶，因此换色时整条滑轨的视觉层级不变。

```vue
<template>
  <RebornSlider v-model="value" color="success" />
  <RebornSlider v-model="value" color="error" />
</template>
```

### 间断点：show-stops

设置 `show-stops` 后按步长在轨道上显示间断点。仅数字步长生效；间断点只取区间内部（不含两端），超过 100 个时自动不渲染，避免 `step` 过小时节点爆炸。

```vue
<template>
  <RebornSlider v-model="volume" :step="10" show-stops />
</template>
```

### 范围选择：range 与 v-model:values

开启 `range` 后改用 `v-model:values` 绑定数组，组件会自动保证节点升序。默认**最右侧**滑块为激活态（大一号），此后跟随用户最近一次按下的滑块；拖拽越过相邻节点时激活下标自动换位，不会出现「拖着拖着换了一只滑块」的错位感。

```vue
<script setup lang="ts">
import { ref } from "vue";

const priceRange = ref([20, 80]);
</script>

<template>
  <RebornSlider v-model:values="priceRange" range show-value />
</template>
```

### 刻度标记：marks 与 step 吸附

`marks` 的 key 必须是 `[min, max]` 闭区间内的数字（非法或越界的 key 会被忽略），值为标记文案；对象形式可为单个标记设置 `style` 与 `label`。设置 `step="mark"` 后取值只能落在刻度上；点按刻度文字可直接跳转（范围模式移动最近的可用滑块）。

```vue
<script setup lang="ts">
const marks = {
  0: "0°C",
  26: "26°C",
  37: { style: { color: "var(--color-error)" }, label: "37°C" },
};
</script>

<template>
  <!-- 常规步长 + 刻度参照 -->
  <RebornSlider v-model="temp" :marks="marks" />

  <!-- 取值钉死在刻度上 -->
  <RebornSlider v-model="temp" step="mark" :marks="marks" />
</template>
```

### 气泡格式化：tooltip.formatter

拖拽时默认在滑块上方（垂直模式为右侧）显示带箭头的数值气泡。`tooltip.formatter` 接收当前值并返回展示内容，适合补单位或换算显示。

```vue
<template>
  <RebornSlider v-model="percent" :tooltip="{ formatter: (v) => `${v}%` }" />
</template>
```

### 气泡显隐：tooltip.open

缺省只在拖拽时显示气泡；`tooltip.open` 传 `true` 常显、`false` 强制隐藏；`formatter: null` 效果等同隐藏。

```vue
<template>
  <RebornSlider v-model="percent" :tooltip="{ open: true }" />
  <RebornSlider v-model="percent" :tooltip="{ open: false }" />
</template>
```

### 两侧图标：prefix-icon 与 prefix / suffix 插槽

`prefix-icon` / `suffix-icon` 在滑轨两端放业务含义图标；`#prefix` / `#suffix` 插槽可完全接管两端内容（此时同名 prop 被忽略）。两端图标 prop 的取值形式不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
Web 端传 `Icon` 组件名：

```vue
<template>
  <RebornSlider v-model="volume" prefix-icon="lucide:volume" suffix-icon="lucide:volume-2" />

  <RebornSlider v-model="brightness">
    <template #suffix>
      <span class="ml-2 w-9 shrink-0 text-right text-sm text-gray-6">{{ brightness }}%</span>
    </template>
  </RebornSlider>
</template>
```
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
UniApp 端传 iconify 类名：

```vue
<template>
  <RebornSlider v-model="volume" prefix-icon="i-lucide-volume" suffix-icon="i-lucide-volume-2" />
</template>
```
:::

::

### 垂直与反向：vertical、height 与 reverse

`vertical` 开启垂直方向，滑轨长度由 `height` 给出（数字按 px，缺省 200px），正向从下往上递增；`reverse` 反转数值方向——水平变为从右向左递增，垂直变为从上往下递增。

```vue
<template>
  <view class="flex flex-row items-start gap-12">
    <RebornSlider v-model="v1" vertical height="200px" />
    <RebornSlider v-model:values="v2" vertical height="200px" range />
    <RebornSlider v-model="v1" vertical height="200px" reverse />
  </view>
</template>
```

### 选区整体拖拽：draggable-track

`range` 模式下设置 `draggable-track`，按住首尾节点之间的选区拖动即可整体平移：位移量对首尾节点双向钳制，节点间距保持不变。存在单独禁用的滑块、或 `step="mark"` 时该能力自动不可用。

```vue
<template>
  <RebornSlider v-model:values="window" range draggable-track />
</template>
```

### 可编辑节点：editable

`range` + `editable` 下节点数量可变：点按轨道空白处（没压着滑块的位置）在该处**添加**节点并直接进入拖拽；拖拽节点垂直于滑轨方向离开超过 40px 进入删除预览（滑块隐去），松手即**删除**，拖回则恢复。始终至少保留一个节点，节点增删通过 `update:values` 以变长数组抛出。

「压着滑块」的判定半径两端不同：Web 为 12px，UniApp 为 16px（手指精度低于鼠标，放宽命中范围以免误加节点）。

```vue
<template>
  <RebornSlider v-model:values="breakpoints" range editable />
</template>
```

Web 端额外支持键盘：点击抓取或 Tab 聚焦节点后，按 `Delete` / `Backspace` 删除。

### 禁用指定滑块：disabled 数组

`disabled` 传布尔是整体禁用；传数组则按下标（对应**排序后**的节点位置）单独禁用范围模式下的滑块。被禁用的滑块不可拖动、置灰展示，并作为移动边界——其他滑块无法越过它。

```vue
<template>
  <!-- 左端锁定为下限，只允许调整右端 -->
  <RebornSlider v-model:values="range" range :disabled="[true, false]" />
</template>
```

### 事件时序：change 与 changeComplete

值每次变化（拖拽、整体平移、增删节点、点按刻度）都会实时触发 `change`；交互结束（松开手指 / 指针，Web 端还包括松开按键）时触发一次 `changeComplete`——需要提交服务端时监听后者即可，不会被拖拽过程刷屏。

```vue
<template>
  <RebornSlider
    v-model="volume"
    @change="(v) => (preview = v)"
    @change-complete="(v) => save(v)"
  />
</template>
```

::tip
`changing` 与 `change` 同时机触发，是历史版本的兼容别名，新代码建议统一用 `change` + `changeComplete`。
::

### 自定义渲染：thumb 与 value 插槽

`thumb` 插槽替换滑块本体（仅单值模式生效），作用域 `value` 内含当前值与定位样式；`value` 插槽替换末尾数值显示。定位样式是沿滑轨方向的 `left` / `top`，自定义节点需要自带 `translate` 居中：

```vue
<template>
  <RebornSlider v-model="volume">
    <template #thumb="{ value }">
      <view
        :style="{ ...value.style, width: '30px', height: '20px' }"
        class="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning text-center text-white"
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

Web 端的定位值已折算交互带两端各半个滑块的内边距（`calc(半径 + (100% - 直径) × 比例)`），滑块在端点不会溢出；UniApp 端是纯百分比，端点处滑块会向外溢出半个直径，外层需留出余量。

## API

### Props

两端 Props 不完全一致：UniApp 多出 `trackHeight`，根节点类名分别为 `class` / `customClass`。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 单值模式下绑定值。 |
| `values` | `number[]` | `[0, 0]` | 范围模式下绑定值（`v-model:values`），`editable` 时长度可变。 |
| `min` | `number` | `0` | 最小值。 |
| `max` | `number` | `100` | 最大值。 |
| `step` | `number \| "mark"` | `1` | 步长。传 `"mark"` 时取值只能落在 `marks` 定义的刻度上，此时必须设置 `marks`。 |
| `marks` | `Record<number, string \| { style?: CSSProperties; label?: string \| number }>` | `-` | 刻度标记，key 必须是 `[min, max]` 闭区间内的数字（非法或越界的 key 会被忽略）；对象形式可为单个标记设置 `style`。点按刻度文字可直接跳转。 |
| `showStops` | `boolean` | `false` | 按步长在轨道上显示间断点（仅数字步长生效，间断点超过 100 个时自动不渲染）。 |
| `disabled` | `boolean \| boolean[]` | `false` | 是否禁用。数组形式按下标（排序后位置）单独禁用范围模式下的滑块，被禁用的滑块不可拖动并成为移动边界。 |
| `editable` | `boolean` | `false` | 可编辑节点（需配合 `range`）：点按轨道空白处添加节点，拖离滑轨 40px 松手删除，聚焦后也可按 Delete / Backspace 删除，至少保留一个。 |
| `draggableTrack` | `boolean` | `false` | 允许按住首尾节点之间的选区整体平移（存在单独禁用的滑块或 `step="mark"` 时不可用）。 |
| `reverse` | `boolean` | `false` | 反向：水平从右向左递增，垂直从上向下递增。 |
| `vertical` | `boolean` | `false` | 垂直模式，滑轨长度由 `height` 给出。 |
| `height` | `string \| number` | `200px` | 垂直模式的滑轨长度，数字按 px 处理。 |
| `tooltip` | `{ open?: boolean; formatter?: ((v: number) => string \| number) \| null }` | `-` | 数值气泡：缺省拖拽时显示，`open` 强制常显/隐藏，`formatter` 格式化内容（传 `null` 等同隐藏）。 |
| `prefixIcon` | `string` | `-` | 滑轨起始端图标，传 `Icon` 组件名（如 `lucide:volume`）。 |
| `suffixIcon` | `string` | `-` | 滑轨末尾端图标，取值形式同 `prefixIcon`。 |
| `showValue` | `boolean` | `false` | 是否显示当前值。 |
| `range` | `boolean` | `false` | 是否启用范围模式。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸（影响滑块直径与文字，轨道粗细固定 4px）。在表单中未传时继承表单 `size`。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题：进度条与滑块外圆取第 6 阶，色晕取 20% 透明度，轨道节点边框取第 3 阶。 |
| `class` | `any` | `-` | 追加到根节点（`wrapper`）的自定义类名。 |
| `ui` | `object` | `-` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 单值模式下绑定值。 |
| `values` | `number[]` | `[0, 0]` | 范围模式下绑定值（`v-model:values`），`editable` 时长度可变。 |
| `min` | `number` | `0` | 最小值。 |
| `max` | `number` | `100` | 最大值。 |
| `step` | `number \| "mark"` | `1` | 步长。传 `"mark"` 时取值只能落在 `marks` 定义的刻度上，此时必须设置 `marks`。 |
| `marks` | `Record<number, string \| { style?: CSSProperties; label?: string \| number }>` | `-` | 刻度标记，key 必须是 `[min, max]` 闭区间内的数字（非法或越界的 key 会被忽略）；对象形式可为单个标记设置 `style`。点按刻度文字可直接跳转。 |
| `showStops` | `boolean` | `false` | 按步长在轨道上显示间断点（仅数字步长生效，间断点超过 100 个时自动不渲染）。 |
| `disabled` | `boolean \| boolean[]` | `false` | 是否禁用。数组形式按下标（排序后位置）单独禁用范围模式下的滑块，被禁用的滑块不可拖动并成为移动边界。 |
| `editable` | `boolean` | `false` | 可编辑节点（需配合 `range`）：点按轨道空白处添加节点，拖离滑轨 40px 松手删除，至少保留一个。 |
| `draggableTrack` | `boolean` | `false` | 允许按住首尾节点之间的选区整体平移（存在单独禁用的滑块或 `step="mark"` 时不可用）。 |
| `reverse` | `boolean` | `false` | 反向：水平从右向左递增，垂直从上向下递增。 |
| `vertical` | `boolean` | `false` | 垂直模式，滑轨长度由 `height` 给出。 |
| `height` | `string \| number` | `200px` | 垂直模式的滑轨长度，数字按 px 处理。 |
| `tooltip` | `{ open?: boolean; formatter?: ((v: number) => string \| number) \| null }` | `-` | 数值气泡：缺省拖拽时显示，`open` 强制常显/隐藏，`formatter` 格式化内容（传 `null` 等同隐藏）。 |
| `prefixIcon` | `string` | `-` | 滑轨起始端图标，传 iconify 类名（如 `i-lucide-volume`）。 |
| `suffixIcon` | `string` | `-` | 滑轨末尾端图标，取值形式同 `prefixIcon`。 |
| `showValue` | `boolean` | `false` | 是否显示当前值。 |
| `range` | `boolean` | `false` | 是否启用范围模式。 |
| `trackHeight` | `number` | `4` | 轨道线的粗细（px），水平为高度、垂直为宽度。以内联样式写入，会压过 `ui.track` 里的高度 / 宽度类。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸（影响滑块直径与文字，轨道粗细由 `trackHeight` 决定）。在表单中未传时继承表单 `size`。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题：进度条与滑块外圆取第 6 阶，色晕取 20% 透明度，轨道节点边框取第 3 阶。 |
| `customClass` | `any` | `-` | 追加到根节点（`wrapper`）的自定义类名。 |
| `ui` | `object` | `{}` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |
:::

::

### Emits

两端事件名与载荷一致。

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 单值变化。 |
| `update:values` | `number[]` | 范围值变化（`editable` 增删节点时长度会变）。 |
| `change` | `number \| number[]` | 值每次变化实时触发（对齐 Ant Design 的 onChange）。 |
| `changeComplete` | `number \| number[]` | 交互结束（松开手指 / 指针，Web 还包括松开按键）时触发一次，适合在此时提交数据。 |
| `changing` | `number \| number[]` | 与 `change` 同时机触发的兼容别名。 |

### Slots

两端插槽名与作用域一致。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `thumb` | `{ value: { value, style } }` | 自定义滑块本体（仅单值模式生效）。`style` 为沿滑轨方向的 `left` / `top` 定位：Web 已折算两端半个滑块的内边距，UniApp 为纯百分比；自定义节点需自带 `translate` 居中。 |
| `value` | `{ value }` | 自定义数值显示，`value` 为当前值文本（范围模式为 `起 - 止`）。 |
| `prefix` | `-` | 完全接管滑轨起始端内容（覆盖 `prefixIcon`）。 |
| `suffix` | `-` | 完全接管滑轨末尾端内容（覆盖 `suffixIcon`）。 |

### 自定义样式（ui）

`ui` 的类名与默认类合并（冲突时 `ui` 优先）。两端键位不同（UniApp 多一个 `picker` 触摸层），默认类名也分别用 px 与 rpx 书写，因此分端列出。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根容器 | `flex items-center w-full` | 始终渲染；禁用时追加 `opacity-50 cursor-not-allowed`，垂直模式改为 `flex-col`；有 `marks` 时追加 `pb-[26px]`（垂直 `pr-[36px]`）为刻度文字留位 |
| `prefix` | 起始端图标容器 | `shrink-0 inline-flex items-center text-gray-6 mr-[8px]` | 仅设置 `prefixIcon` 且未使用 `#prefix` 插槽时渲染 |
| `inner` | 轨道与滑块所在的交互带 | `flex-1 relative h-full flex items-center touch-none select-none cursor-pointer` | 始终渲染；禁用时光标换为 `cursor-not-allowed` |
| `track` | 轨道背景 | `relative w-full h-1 rounded-full bg-gray-4` | 始终渲染；表单校验失败时追加 `ring-1 ring-red-5` |
| `progress` | 已选进度条 | `absolute top-0 h-full rounded-full pointer-events-none` + `bg-<color>` | 始终渲染 |
| `stopDot` | 间断点 | `absolute top-1/2 … size-[8px] rounded-full bg-gray-1 border-[1.5px]` | 仅 `showStops` 且 `step` 为数字、间断点数量在 1–100 之间时渲染 |
| `markDot` | 刻度点 | 同 `stopDot` | 仅 `marks` 含合法 key 时渲染 |
| `markLabel` | 刻度文字 | `absolute top-full mt-[8px] -translate-x-1/2 text-sm text-gray-6 whitespace-nowrap cursor-pointer select-none` | 同 `markDot` |
| `thumb` | 滑块本体（语义色外圆） | `absolute top-1/2 … rounded-full flex items-center justify-center z-[1] outline-none` + `bg-<color> ring-<color>/20` | 单值模式使用 `#thumb` 插槽时不渲染 |
| `thumbDot` | 滑块中心圆 | `rounded-full bg-gray-1` | 同 `thumb` |
| `tooltip` | 数值气泡 | `absolute z-[3] rounded-sm bg-gray-9 px-2 py-1 text-sm text-gray-1 whitespace-nowrap shadow-md` | 仅拖拽中或 `tooltip.open` 为 `true` 时渲染；`open: false` 或 `formatter: null` 时不渲染 |
| `suffix` | 末尾端图标容器 | `shrink-0 inline-flex items-center text-gray-6 ml-[8px]` | 仅设置 `suffixIcon` 且未使用 `#suffix` 插槽时渲染 |
| `value` | 末尾数值文本 | `text-center w-[50px] text-gray-8 ml-[8px]` | 仅 `showValue` 且未使用 `#value` 插槽时渲染 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 键名 | 对应节点 | 默认关键类名 | 失效 / 渲染条件 |
| --- | --- | --- | --- |
| `wrapper` | 根容器 | `flex flex-row items-center w-full overflow-visible` | 始终渲染；禁用时追加 `opacity-50`，垂直模式改为 `flex-col`；有 `marks` 时追加 `pb-[52rpx]`（垂直 `pr-[72rpx]`） |
| `prefix` | 起始端图标容器 | `shrink-0 inline-flex items-center text-gray-6 mr-[16rpx]` | 仅设置 `prefixIcon` 且未使用 `#prefix` 插槽时渲染 |
| `inner` | 轨道与滑块所在的交互带 | `flex-1 relative flex flex-row items-center overflow-visible` + `h-[24/28/32rpx]`（随 size） | 始终渲染；垂直模式厚度换到宽度轴 |
| `picker` | 覆盖交互带的透明触摸层 | `absolute inset-x-0 -inset-y-[12rpx] z-[3]` | 始终渲染；向外扩 12rpx 让手指按在滑块边缘也能命中 |
| `track` | 轨道背景 | `relative w-full h-[8rpx] rounded-full overflow-visible bg-gray-4` | 始终渲染；粗细会被 `trackHeight` 的内联样式覆盖 |
| `progress` | 已选进度条 | `absolute top-0 h-full rounded-full pointer-events-none` + `bg-<color>` | 始终渲染 |
| `stopDot` | 间断点 | `absolute top-1/2 … size-[16rpx] rounded-full bg-gray-1 border-[3rpx] border-solid` | 仅 `showStops` 且 `step` 为数字、间断点数量在 1–100 之间时渲染 |
| `markDot` | 刻度点 | 同 `stopDot` | 仅 `marks` 含合法 key 时渲染 |
| `markLabel` | 刻度文字 | `absolute top-full mt-[12rpx] -translate-x-1/2 text-24 text-gray-6 whitespace-nowrap` | 同 `markDot` |
| `thumb` | 滑块本体（语义色外圆） | `absolute top-1/2 … rounded-full flex items-center justify-center z-[1]` + `bg-<color> ring-<color>/20` | 单值模式使用 `#thumb` 插槽时不渲染 |
| `thumbDot` | 滑块中心圆 | `rounded-full bg-gray-1` | 同 `thumb` |
| `tooltip` | 数值气泡 | `absolute z-[4] rounded-ui-2xs bg-gray-9 px-[16rpx] py-[8rpx] text-24 text-gray-1 whitespace-nowrap shadow-md` | 仅拖拽中或 `tooltip.open` 为 `true` 时渲染；`open: false` 或 `formatter: null` 时不渲染 |
| `suffix` | 末尾端图标容器 | `shrink-0 inline-flex items-center text-gray-6 ml-[16rpx]` | 仅设置 `suffixIcon` 且未使用 `#suffix` 插槽时渲染 |
| `value` | 末尾数值文本 | `text-center w-[100rpx] text-gray-8 dark:text-gray-1` | 仅 `showValue` 且未使用 `#value` 插槽时渲染 |
:::

::

```vue
<template>
  <RebornSlider
    v-model="volume"
    show-value
    :ui="{
      track: 'bg-gray-3',
      thumbDot: 'bg-primary-1',
      value: 'text-primary font-medium',
    }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class` | `customClass` |
| 图标 prop 取值 | `Icon` 组件名（`lucide:volume`） | iconify 类名（`i-lucide-volume`） |
| 滑块尺寸单位 | px（激活 16 / 14 / 12px） | rpx 随屏宽缩放（激活 32 / 28 / 24rpx） |
| 轨道粗细 | 固定 4px，可用 `ui.track` 覆盖 | `trackHeight` prop，默认 4px，内联样式优先于 `ui.track` |
| 交互带两端内边距 | 有，滑块在端点不溢出，`thumb` 插槽的 `style` 已折算 | 无，端点处滑块溢出半个直径，`style` 为纯百分比 |
| 命中滑块判定半径 | 12px | 16px |
| 键盘操作 | 方向键步进（`step="mark"` 时跳相邻刻度）、Delete / Backspace 删除节点 | 不支持（无键盘） |
| 交互事件源 | Pointer Events + 指针捕获，move 按动画帧合并 | Touch 事件 + `createSelectorQuery` 触摸前测量 |
| `ui` 额外键位 | - | `picker`（透明触摸层） |
| 表单校验联动 | 每次值变化触发 `validate('change')`，`changeComplete` 时触发 `validate('blur')`；校验失败时轨道显示红环 | 仅在 `changeComplete` 时触发 `validate('change')`；无错误态样式 |
| 禁用态样式 | `opacity-50` + `cursor-not-allowed` | 仅 `opacity-50` |

## 注意事项

- 单值模式用 `v-model`；范围模式必须同时设置 `range` 并改用 `v-model:values` 绑定数组，两者不可混用。
- 事件时序对齐 Ant Design：`change` 实时、`changeComplete` 收尾。提交服务端请监听 `changeComplete`，避免拖拽过程刷请求。
- 范围模式默认最右侧滑块为激活态（大一号），跟随最近一次按下切换；拖拽越过相邻节点时激活下标自动换位。
- `disabled` 数组下标对应**排序后**的节点位置，`editable` 增删节点会使后续下标偏移，两者组合使用需业务侧自行维护。
- `step="mark"` 时取值吸附刻度、Web 端方向键在相邻刻度间跳转；`draggableTrack` 在该模式下不可用（平移量无法保证所有节点同时落在刻度上）。
- `thumb` 插槽仅在单值模式渲染，范围模式的滑块不可通过插槽替换；插槽拿到的 `style` 只负责沿滑轨定位，需自带 `translate` 居中。
- 色晕（按压态 ring）不占布局空间，组件高度只由滑块外径决定；有 `marks` 时组件会自动为刻度文字留出下方（垂直模式为右侧）空间。
- UniApp 端触摸开始前会通过 `createSelectorQuery` 测量轨道位置，滑块所在容器若有进入动画，请保证动画结束后再交互，否则首次取值可能偏移。
- UniApp 端交互带没有两端内边距，端点处滑块会向外溢出半个直径；贴边布局时请给外层留出左右余量。
