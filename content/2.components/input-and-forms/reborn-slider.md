---
title: Slider 滑块
description: 双端滑块：单值 / 范围 / 多节点编辑，支持刻度、间断点、垂直与反向、气泡提示与选区整体拖拽。
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

`v-model` 绑定当前值，`min` / `max` 限定区间，`step` 控制步长；`show-value` 在滑轨末尾显示当前值。

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

### 间断点

设置 `show-stops` 后按步长在轨道上显示间断点。仅数字步长生效；间断点只取区间内部（不含两端），超过 100 个时自动不渲染，避免 `step` 过小时节点爆炸。

```vue
<template>
  <RebornSlider v-model="volume" :step="10" show-stops />
</template>
```

### 范围选择

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

### 刻度标记与 step="mark"

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

### 气泡提示

拖拽时默认在滑块上方（垂直模式为右侧）显示带箭头的数值气泡。`tooltip.formatter` 格式化内容；`tooltip.open` 传 `true` 常显、`false` 强制隐藏；`formatter: null` 效果等同隐藏。

```vue
<template>
  <RebornSlider v-model="percent" :tooltip="{ formatter: (v) => `${v}%` }" />
  <RebornSlider v-model="percent" :tooltip="{ open: true }" />
  <RebornSlider v-model="percent" :tooltip="{ open: false }" />
</template>
```

### 两侧图标

`prefix-icon` / `suffix-icon` 在滑轨两端放业务含义图标；`#prefix` / `#suffix` 插槽可完全接管两端内容（此时同名 prop 被忽略）。两端图标 prop 的取值形式不同，见下方平台差异。

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

### 垂直与反向

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

### 选区整体拖拽

`range` 模式下设置 `draggable-track`，按住首尾节点之间的选区拖动即可整体平移：位移量对首尾节点双向钳制，节点间距保持不变。存在单独禁用的滑块、或 `step="mark"` 时该能力自动不可用。

```vue
<template>
  <RebornSlider v-model:values="window" range draggable-track />
</template>
```

### 可编辑节点

`range` + `editable` 下节点数量可变：点按轨道空白处（没压着滑块的位置）在该处**添加**节点并直接进入拖拽；拖拽节点垂直于滑轨方向离开超过 40px 进入删除预览（滑块隐去），松手即**删除**，拖回则恢复。始终至少保留一个节点，节点增删通过 `update:values` 以变长数组抛出。

```vue
<template>
  <RebornSlider v-model:values="breakpoints" range editable />
</template>
```

Web 端额外支持键盘：点击抓取或 Tab 聚焦节点后，按 `Delete` / `Backspace` 删除。

### 禁用指定滑块

`disabled` 传布尔是整体禁用；传数组则按下标（对应**排序后**的节点位置）单独禁用范围模式下的滑块。被禁用的滑块不可拖动、置灰展示，并作为移动边界——其他滑块无法越过它。

```vue
<template>
  <!-- 左端锁定为下限，只允许调整右端 -->
  <RebornSlider v-model:values="range" range :disabled="[true, false]" />
</template>
```

### 事件时序

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

### 自定义滑块与数值显示

`thumb` 插槽替换滑块本体（单值模式生效），作用域 `value` 内含当前值与定位样式。定位样式是「left/top 百分比」，自定义节点需要自带 `translate` 居中：

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

## API

### Props

除标注项外两端通用。

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
| `editable` | `boolean` | `false` | 可编辑节点（需配合 `range`）：点按轨道空白处添加节点，拖离滑轨松手删除（Web 还支持聚焦后按 Delete / Backspace），至少保留一个。 |
| `draggableTrack` | `boolean` | `false` | 允许按住首尾节点之间的选区整体平移（存在单独禁用的滑块或 `step="mark"` 时不可用）。 |
| `reverse` | `boolean` | `false` | 反向：水平从右向左递增，垂直从上向下递增。 |
| `vertical` | `boolean` | `false` | 垂直模式，滑轨长度由 `height` 给出。 |
| `height` | `string \| number` | `200px` | 垂直模式的滑轨长度，数字按 px 处理。 |
| `tooltip` | `{ open?: boolean; formatter?: ((v: number) => string \| number) \| null }` | `-` | 数值气泡：缺省拖拽时显示，`open` 强制常显/隐藏，`formatter` 格式化内容（传 `null` 等同隐藏）。 |
| `prefixIcon` | `string` | `-` | 滑轨起始端图标。Web 传 `Icon` 组件名（如 `lucide:volume`）；UniApp 传 iconify 类名（如 `i-lucide-volume`）。 |
| `suffixIcon` | `string` | `-` | 滑轨末尾端图标，取值形式同 `prefixIcon`。 |
| `showValue` | `boolean` | `false` | 是否显示当前值。 |
| `range` | `boolean` | `false` | 是否启用范围模式。 |
| `trackHeight` | `number` | `4` | 仅 uniapp。轨道线的粗细（px），水平为高度、垂直为宽度；web 端轨道固定 4px，可用 `ui.track` 覆盖。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸（影响滑块直径与文字，轨道粗细不变）。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题：进度条与滑块外圆取第 6 阶，色晕取 20% 透明度，轨道节点边框取第 3 阶。 |
| `class` | `any` | `-` | 仅 web。追加到根节点的自定义类名。 |
| `customClass` | `any` | `-` | 仅 uniapp。追加到根节点的自定义类名。 |
| `ui` | `object` | `{}` | 细粒度样式覆盖对象，详见下表。 |

### Emits

两端通用。

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 单值变化。 |
| `update:values` | `number[]` | 范围值变化（`editable` 增删节点时长度会变）。 |
| `change` | `number \| number[]` | 值每次变化实时触发（对齐 Ant Design 的 onChange）。 |
| `changeComplete` | `number \| number[]` | 交互结束（松开手指 / 指针，Web 还包括松开按键）时触发一次，适合在此时提交数据。 |
| `changing` | `number \| number[]` | 与 `change` 同时机触发的兼容别名。 |

### Slots

两端通用。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `thumb` | `{ value: { value, style } }` | 自定义滑块本体（单值模式生效）。`style` 为百分比定位，自定义节点需自带 `translate` 居中。 |
| `value` | `{ value }` | 自定义数值显示，`value` 为当前值文本（范围模式为 `起 - 止`）。 |
| `prefix` | `-` | 完全接管滑轨起始端内容（覆盖 `prefixIcon`）。 |
| `suffix` | `-` | 完全接管滑轨末尾端内容（覆盖 `suffixIcon`）。 |

### 自定义样式（ui）

| 键名 | 说明 |
| --- | --- |
| `wrapper` | 根容器。 |
| `inner` | 轨道与滑块所在的内层交互带。 |
| `picker` | 仅 uniapp。覆盖在交互带上的透明触摸层。 |
| `track` | 轨道背景。 |
| `progress` | 已选进度条。 |
| `thumb` | 滑块本体（语义色外圆）。 |
| `thumbDot` | 滑块中心圆。 |
| `stopDot` | 轨道上的间断点。 |
| `markDot` | 轨道上的刻度点。 |
| `markLabel` | 刻度文字。 |
| `tooltip` | 数值气泡。 |
| `prefix` | 起始端图标容器。 |
| `suffix` | 末尾端图标容器。 |
| `value` | 末尾数值文本。 |

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class` | `customClass` |
| 图标 prop 取值 | `Icon` 组件名（`lucide:volume`） | iconify 类名（`i-lucide-volume`） |
| 滑块尺寸单位 | px（激活 16 / 14 / 12px） | rpx 随屏宽缩放（激活 32 / 28 / 24rpx） |
| 轨道粗细 | 固定 4px | `trackHeight` prop，默认 4px |
| 键盘操作 | 方向键步进、Delete / Backspace 删除节点 | 不支持（无键盘） |
| 交互事件源 | Pointer Events + 指针捕获，move 按动画帧合并 | Touch 事件 + `createSelectorQuery` 触摸前测量 |
| `ui` 额外键位 | - | `picker`（透明触摸层） |
| 表单校验联动 | 仅样式（`isError` 红环） | `changeComplete` 时触发 `validate('change')` |

## 注意事项

- 单值模式用 `v-model`；范围模式必须同时设置 `range` 并改用 `v-model:values` 绑定数组，两者不可混用。
- 事件时序对齐 Ant Design：`change` 实时、`changeComplete` 收尾。提交服务端请监听 `changeComplete`，避免拖拽过程刷请求。
- 范围模式默认最右侧滑块为激活态（大一号），跟随最近一次按下切换；拖拽越过相邻节点时激活下标自动换位。
- `disabled` 数组下标对应**排序后**的节点位置，`editable` 增删节点会使后续下标偏移，两者组合使用需业务侧自行维护。
- `step="mark"` 时取值吸附刻度、Web 端方向键在相邻刻度间跳转；`draggableTrack` 在该模式下不可用（平移量无法保证所有节点同时落在刻度上）。
- `thumb` 插槽仅在单值模式渲染，范围模式的滑块不可通过插槽替换；插槽拿到的 `style` 是百分比定位，需自带 `translate` 居中。
- 色晕（按压态 ring）不占布局空间，组件高度只由滑块外径决定；有 `marks` 时组件会自动为刻度文字留出下方（垂直模式为右侧）空间。
- UniApp 端触摸开始前会通过 `createSelectorQuery` 测量轨道位置，滑块所在容器若有进入动画，请保证动画结束后再交互，否则首次取值可能偏移。
