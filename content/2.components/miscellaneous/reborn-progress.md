---
title: Progress 进度条
description: 用于展示任务完成比例的进度组件，支持直线、圆环、仪表盘及步骤形态、渐变与分段颜色。
category: 杂项
tags: [progress, feedback, status, steps]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornProgressDemo.vue" config="RebornProgressConfig" componentId="reborn-progress" :componentFiles='["RebornProgress.vue", "reborn-progress.config.ts", "reborn-progress.utils.ts"]'}
::

## 简介

仅支持 **Web**。适用于上传、下载、任务完成度和配额用量；未知完成比例的等待提示建议使用 Loading。与 `animated-circular-progressbar` 相互独立，不改变旧组件的 API。

## 基础用法

```vue
<template>
  <RebornProgress :percent="60" />
  <RebornProgress
    type="circle"
    :percent="60"
  />
  <RebornProgress
    type="dashboard"
    :percent="60"
  />
  <RebornProgress
    :percent="100"
    status="success"
  />
  <RebornProgress
    :percent="40"
    status="error"
  />
</template>
```

`status` 显式指定，不会在 100% 时自动切换成功。`percent` 为单向受控属性，组件不修改业务数值，因此不提供 `v-model` 或进度变化事件。数值钳制到 0–100；`NaN`、无穷大回退到 0。

## 步骤形态与节点颜色

```vue
<template>
  <RebornProgress
    :percent="60"
    :steps="5"
    :stroke-color="['#108ee9', '#108ee9', '#ffccc7']"
  />
  <RebornProgress
    type="circle"
    :percent="60"
    :steps="5"
  />
  <RebornProgress
    type="dashboard"
    :percent="60"
    :steps="5"
  />
</template>
```

每个步骤分配相同比例，当前步骤可以部分填充；例如 5 步的 50% 为两个完整节点加半个节点。颜色数组仅在 `steps > 0` 时有效，缺少的节点颜色回退到状态色。步骤数向下取整并限制在 0–1000。

直线步骤间距固定 2px；中号和大号节点带 2px 圆角，小号节点仅 2px 宽保持直角。步骤圆环的 2px 沿描边中心线弧长计算；节点极密时，间距缩小到最多半个节点弧长，以避免反向或消失的弧线。

## 自定义渐变色

```vue
<script setup lang="ts">
const gradient = {
  angle: 90,
  stops: [
    { offset: 0, color: "#108ee9" },
    { offset: 50, color: "#6366f1" },
    { offset: 100, color: "#87d068" },
  ],
};
</script>

<template>
  <RebornProgress
    :percent="80"
    :stroke-color="gradient"
  />
  <RebornProgress
    type="circle"
    :percent="80"
    :stroke-color="gradient"
  />
  <RebornProgress
    type="dashboard"
    :steps="10"
    :percent="80"
    :stroke-color="gradient"
  />
</template>
```

色标 `offset` 为 0–100 的百分比，自动排序并限制范围；角度默认 90°，表示从左向右。圆形使用空间线性渐变，不是沿圆周的锥形渐变。渐变固定在完整轨道上，不随进度增长而移动色标。直线连续渐变的进度前端与纯色一样保持圆弧端部；步骤节点内部保持平端。

## 分段颜色

```vue
<template>
  <RebornProgress
    :percent="85"
    :segments="[
      { percentage: 30, color: '#108ee9' },
      { percentage: 65, color: '#f59e0b' },
      { percentage: 100, color: '#22c55e' },
    ]"
  />
</template>
```

上述配置分别绘制 0–30%、30–65%、65–100% 三个固定颜色区间，实际填充截止于当前进度。不等于“随进度阈值切换整条颜色”。未覆盖的剩余区间使用 `strokeColor` 单色/渐变或状态色；重复终点采用最后一项。

分段之间没有间隔，每一段只在行进方向一侧带圆弧：从左往右（圆形为顺时针）时圆弧在前端，后端平接上一段；`flowDirection` 设为 `reverse` 时圆弧换到另一侧。直线、圆环与仪表盘行为一致；分段与步骤同时启用时仍按步骤节点平端绘制。

**颜色优先级**：步骤颜色数组（启用步骤时）→ `segments` 区间 → `strokeColor` 单色/渐变 → 状态色。自定义颜色不会被 success/error 覆盖；状态图标仍使用语义色。

## 流动方向

```vue
<template>
  <RebornProgress
    :percent="60"
    flow-direction="reverse"
  />
  <RebornProgress
    type="circle"
    :percent="60"
    flow-direction="reverse"
  />
  <RebornProgress
    type="dashboard"
    :percent="60"
    flow-direction="reverse"
  />
</template>
```

`flowDirection` 默认 `normal`（直线从左往右、圆形顺时针）；设为 `reverse` 时直线从右往左填充、圆形逆时针绘制，仪表盘缺口保持在底部。分段圆弧的朝向、内嵌文字的锚定位置与条纹流向都随方向翻转。

## 条纹进度条

```vue
<template>
  <RebornProgress
    :percent="70"
    striped
  />
  <RebornProgress
    :percent="70"
    striped
    striped-flow
  />
  <RebornProgress
    :percent="70"
    striped
    striped-flow
    :duration="1"
  />
</template>
```

设置 `striped` 属性获取条纹进度条；再开启 `stripedFlow` 使条纹流动起来，`duration` 控制流动一个周期的秒数（非正数回退为 3 秒），流向与 `flowDirection` 保持一致。

条纹是半透明白色装饰层，叠加在纯色、渐变、分段与步骤填充之上，仅直线形态生效。系统开启“减少动态效果”时条纹停止流动。可通过 `ui.stripes` 覆盖条纹样式。

## 内嵌文字与格式化

```vue
<template>
  <RebornProgress
    size="lg"
    :percent="60"
    text-inside
  />
  <RebornProgress
    size="lg"
    :percent="60"
    text-inside
    :format="(percentage) => `${percentage} / 100`"
  />
  <RebornProgress
    type="circle"
    :percent="60"
    :format="(percentage) => `${percentage}%`"
  />
</template>
```

`textInside` 仅影响直线文字位置，内部文字默认白色并垂直居中，可通过 `ui.text` 覆盖颜色；不改变高度，建议搭配 `lg`；`sm/md` 的字形允许超出细轨道，避免裁切。内嵌模式保持显示文字；普通模式 success/error 默认显示图标。`format` 优先于默认图标，返回值作为纯文本转义。圆形始终居中显示内容。

## 作用域插槽

```vue
<template>
  <RebornProgress :percent="60">
    <template #default="{ percent, status }">
      <span>{{ percent }}% · {{ status }}</span>
    </template>
  </RebornProgress>
</template>
```

内容优先级：默认插槽 → `format` → 默认状态图标/百分比。`showText=false` 同时隐藏文字、图标与插槽。组件提供 `role="progressbar"`、数值范围及 `aria-valuetext`；请通过 `ariaLabel` 或原生 `aria-label` 提供具体任务名称。

## 尺寸

| 形态 / 项目               | sm      | md       | lg        |
| ------------------------- | ------- | -------- | --------- |
| 直线高度                  | 6px     | 8px      | 16px      |
| 圆环 / 仪表盘外径         | 48px    | 76px     | 114px     |
| 圆环 / 仪表盘描边         | 4px     | 6px      | 6px       |
| 圆形中央文字              | 14px    | 16px     | 24px      |
| 圆形状态图标              | 18px    | 20px     | 28px      |
| 直线步骤宽 × 高           | 2 × 6px | 32 × 8px | 32 × 16px |
| 步骤圆环 / 步骤仪表盘描边 | 6px     | 8px      | 16px      |

步骤圆形沿用普通圆形的外径、文字和图标尺寸。轨道颜色为 `gray-3`，仪表盘底部开口为 90°。

## API

### Props

| 属性名          | 类型                                | 默认值      | 描述                                                                               |
| --------------- | ----------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `percent`       | `number`                            | `0`         | 当前完成百分比，归一化到 0–100。                                                   |
| `type`          | `'line' \| 'circle' \| 'dashboard'` | `'line'`    | 进度条形态。                                                                       |
| `size`          | `'sm' \| 'md' \| 'lg'`              | `'md'`      | 尺寸档位。                                                                         |
| `status`        | `'default' \| 'success' \| 'error'` | `'default'` | 显式进度状态。                                                                     |
| `steps`         | `number`                            | `0`         | 步骤数量，0 为连续进度。                                                           |
| `strokeColor`   | `ProgressStrokeColor`               | `—`         | 单色、步骤数组或渐变配置。                                                         |
| `segments`      | `ProgressSegment[]`                 | `[]`        | 分段颜色的累计终点与颜色。                                                         |
| `textInside`    | `boolean`                           | `false`     | 直线文字放在内部，不改变高度。                                                     |
| `striped`       | `boolean`                           | `false`     | 条纹装饰层，仅直线形态生效。                                                       |
| `stripedFlow`   | `boolean`                           | `false`     | 让条纹流动起来，需同时开启 `striped`。                                             |
| `duration`      | `number`                            | `3`         | 条纹流动一个周期的秒数，非正数回退为 3。                                           |
| `flowDirection` | `'normal' \| 'reverse'`             | `'normal'`  | 进度条流动方向；`reverse` 时直线从右往左、圆形逆时针，分段圆弧与条纹流向随之翻转。 |
| `format`        | `(percentage: number) => string`    | `—`         | 自定义显示文字。                                                                   |
| `showText`      | `boolean`                           | `true`      | 是否显示文字、状态图标与默认插槽。                                                 |
| `ariaLabel`     | `string`                            | `'进度'`    | 无障碍任务名称。                                                                   |
| `class`         | `ClassValue`                        | `—`         | 根节点样式。                                                                       |
| `ui`            | `ProgressUi`                        | `—`         | 样式覆盖：root/track/step/fill/stripes/circle/text/icon。                          |

### Slots

| 插槽名    | 参数                                          | 描述             |
| --------- | --------------------------------------------- | ---------------- |
| `default` | `{ percent: number, status: ProgressStatus }` | 自定义进度内容。 |

### 颜色类型

```ts
interface ProgressGradient {
  stops: { offset: number; color: string }[];
  angle?: number;
}
type ProgressStrokeColor = string | string[] | ProgressGradient;
interface ProgressSegment {
  percentage: number;
  color: string;
}
```

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的 Tailwind 类名：

| 键名      | 说明                           |
| --------- | ------------------------------ |
| `root`    | 根容器。                       |
| `track`   | 直线轨道容器或圆弧背景路径。   |
| `step`    | 直线连续轨道或步骤节点。       |
| `fill`    | 已完成区域或圆弧路径。         |
| `stripes` | 直线条纹装饰层。               |
| `circle`  | 圆环、仪表盘的 SVG 容器。      |
| `text`    | 百分比、格式化内容或插槽容器。 |
| `icon`    | 成功、失败状态图标。           |

```vue
<RebornProgress :percent="60" :ui="{ text: 'font-semibold', step: 'bg-gray-2' }" />
```

步骤直线在容器不足时允许轨道独立横向滚动，保持节点尺寸且不覆盖外部文字。分段颜色靠“后段垫底、前段叠压”的方式实现单侧圆弧：每段都从起点绘制到自身终点，终点小的在上层，因此仅行进方向一侧露出圆弧；步骤节点仍为平端，避免密集节点交界重叠。
