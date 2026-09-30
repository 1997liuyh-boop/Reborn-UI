---
title: Progress 进度条
description: 展示任务完成比例的进度组件，支持直线、圆环、仪表盘三种形态，以及步骤、渐变、分段颜色与条纹装饰。
category: 反馈
platform: web
tags: [progress, feedback, status, steps]
badge: New
---

::ComponentViewer{demoFile="RebornProgressDemo.vue" config="RebornProgressConfig" componentId="reborn-progress" :componentFiles='["RebornProgress.vue", "reborn-progress.config.ts", "reborn-progress.utils.ts"]'}
::

## 简介

Progress 用一条轨道或一段圆弧表示「已完成多少」，适合上传、下载、任务完成度与配额用量这类能算出比例的场景。组件仅支持 **Web**，UniApp 端暂无对应实现。

`percent` 是单向受控属性：组件只负责把数值画出来，不修改业务数值，因此不提供 `v-model`，也没有进度变化事件。`status` 同样由业务显式指定——到 100% 不会自动变为成功，因为「数值满了」和「任务成功了」在很多业务里并不等价（例如上传完成后服务端校验失败）。

形态上提供直线 `line`、圆环 `circle` 与带 90° 缺口的仪表盘 `dashboard`；`steps` 可把任意形态切成等分节点，颜色支持单色、逐节点数组、线性渐变与按区间分段。

### 何时使用

- 上传、下载、导入导出等能拿到完成比例的耗时操作。
- 展示配额、存储空间、目标达成率等「当前值 / 上限」类数据。
- 多步骤流程需要用离散节点表达「完成了几步」，且不需要步骤标题与说明。

### 何时不使用

- 无法估算完成比例、只需告诉用户「正在处理」—— 改用 Loading。
- 需要展示每一步的标题、描述并允许点击跳转的流程引导 —— 改用 Tabs 或自行组合的步骤导航，`steps` 只画节点、不承载文字。
- 只想用一个数字或小圆点提示数量、状态 —— 改用 Badge 或 Chip。

## 用法

### 基础用法

```vue
<template>
  <RebornProgress :percent="30" />
  <RebornProgress
    :percent="100"
    status="success"
  />
  <RebornProgress
    :percent="45"
    status="error"
  />
</template>
```

`percent` 钳制到 0–100；`NaN`、无穷大回退到 0。直线形态默认占满父容器宽度，百分比文字显示在轨道右侧。

### 尺寸与状态：size 与 status

```vue
<template>
  <RebornProgress
    size="sm"
    :percent="60"
  />
  <RebornProgress
    size="lg"
    :percent="100"
    status="success"
  />
</template>
```

`size` 三档直线高度为 6px / 8px / 16px。`status` 为 `success` / `error` 时根节点切换到对应语义色，并在未传 `format` 时把百分比换成对勾 / 叉号图标。

### 形态：圆环 circle

```vue
<template>
  <RebornProgress
    type="circle"
    :percent="60"
  />
</template>
```

圆环三档外径为 48px / 76px / 114px，描边 4px / 6px / 6px，文字与图标在中央显示。圆形不会占满父容器宽度，外径由 `size` 固定。

### 形态：仪表盘 dashboard

```vue
<template>
  <RebornProgress
    type="dashboard"
    :percent="60"
  />
</template>
```

仪表盘只绘制 270° 圆弧，底部保留 90° 缺口；尺寸、文字和状态图标与圆环一致。

### 步骤：steps 与逐节点配色

```vue
<template>
  <RebornProgress
    :percent="60"
    :steps="5"
    :stroke-color="['#108ee9', '#108ee9', '#ffccc7']"
  />
</template>
```

每个步骤分配相同比例，当前步骤可以部分填充：5 步的 50% 表现为两个完整节点加半个节点。步骤数向下取整并限制在 0–1000。

直线步骤间距固定 2px；中号和大号节点宽 32px、带 2px 圆角，小号节点仅 2px 宽并保持直角。节点宽度固定，因此步骤直线宽度随步骤数增长，容器不足时轨道独立横向滚动，不会压扁节点，也不会盖住右侧文字。

`strokeColor` 传数组时仅在 `steps > 0` 下生效，按顺序给节点着色，缺少的节点回退到状态色。

### 步骤圆环：circle 与 steps

```vue
<template>
  <RebornProgress
    type="circle"
    :percent="60"
    :steps="5"
  />
</template>
```

启用步骤后圆环描边加粗为 6px / 8px / 16px，外径、文字与图标沿用普通圆环。节点间 2px 间距按描边中心线的弧长计算；节点极密时间距缩小到最多半个节点弧长，避免弧线反向或消失。

### 步骤仪表盘：dashboard 与 steps

```vue
<template>
  <RebornProgress
    type="dashboard"
    :percent="60"
    :steps="5"
  />
</template>
```

节点只分布在 270° 圆弧上，底部缺口不参与切分。

### 颜色：stroke-color 渐变

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
    type="dashboard"
    :steps="10"
    :percent="80"
    :stroke-color="gradient"
  />
</template>
```

色标 `offset` 为 0–100 的百分比，自动排序并限制范围；`angle` 默认 90°，表示从左向右。只有一个色标时退化为纯色。

渐变固定在完整轨道上，不随进度增长而移动色标——30% 时只露出起始段颜色，这样同一个颜色始终对应同一个进度位置。圆形使用 SVG 空间线性渐变，不是沿圆周的锥形渐变。直线连续渐变的前端与纯色一样保持圆弧端部，步骤节点内部保持平端。

### 颜色：segments 分段

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

上述配置分别绘制 0–30%、30–65%、65–100% 三个固定颜色区间，实际填充截止于当前进度。它不等于「随进度阈值切换整条颜色」。未覆盖的剩余区间使用 `strokeColor` 单色 / 渐变或状态色；终点重复时采用最后一项。

分段之间没有间隔，每一段只在行进方向一侧带圆弧：从左往右（圆形为顺时针）时圆弧在前端，后端平接上一段。实现方式是每段都从起点绘制到自身终点、终点小的叠在上层，因此只有行进方向一侧露出圆弧。分段与步骤同时启用时仍按步骤节点平端绘制。

**颜色优先级**：步骤颜色数组（启用步骤时）→ `segments` 区间 → `strokeColor` 单色 / 渐变 → 状态色。自定义颜色不会被 success / error 覆盖，状态图标仍使用语义色。

### 方向：flow-direction 反向填充

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
</template>
```

`flowDirection` 默认 `normal`（直线从左往右、圆形顺时针）；设为 `reverse` 时直线从右往左填充、圆形逆时针绘制，仪表盘缺口保持在底部。分段圆弧的朝向、内嵌文字的锚定位置与条纹流向都随方向翻转。

### 条纹：striped、striped-flow 与 duration

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
    :duration="1"
  />
</template>
```

`striped` 叠加一层半透明白色 45° 条纹，覆盖在纯色、渐变、分段与步骤填充之上，只铺到已完成区域。`stripedFlow` 让条纹流动，`duration` 控制一个周期的秒数（非正数回退为 3 秒），流向与 `flowDirection` 一致。条纹只在直线形态生效；系统开启「减少动态效果」时停止流动。

### 文字：text-inside 与 format

```vue
<template>
  <RebornProgress
    size="lg"
    :percent="60"
    text-inside
  />
  <RebornProgress
    type="circle"
    :percent="60"
    :format="(percentage) => `${percentage} / 100`"
  />
</template>
```

`textInside` 仅影响直线形态：文字移到已完成区域内部，字号 10px、白色、垂直居中。轨道高度不会因此增加，`sm` / `md` 的字形会超出细轨道（组件不裁切），所以建议搭配 `lg`。内嵌模式始终显示文字，不显示状态图标。

`format` 接收归一化后的百分比并返回字符串，优先于默认状态图标；返回值按纯文本插值，不解析 HTML。圆形始终居中显示内容。

### 作用域插槽：上传任务

```vue
<template>
  <RebornProgress
    :percent="taskPercent"
    :status="taskPercent === 100 ? 'success' : 'default'"
    aria-label="文件上传进度"
  >
    <template #default="{ percent, status }">
      <span>{{ status === 'success' ? '上传完成' : `已上传 ${percent}%` }}</span>
    </template>
  </RebornProgress>
</template>
```

内容优先级：默认插槽 → `format` → 默认状态图标 / 百分比。`showText` 为 `false` 时文字、图标与插槽一并隐藏。

## API

### Props

| 属性名          | 类型                                | 默认值      | 描述                                                                                   |
| --------------- | ----------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `percent`       | `number`                            | `0`         | 当前完成百分比，钳制到 0–100，非有限数值回退为 0。                                     |
| `type`          | `'line' \| 'circle' \| 'dashboard'` | `'line'`    | 进度条形态。                                                                           |
| `size`          | `'sm' \| 'md' \| 'lg'`              | `'md'`      | 尺寸档位，决定直线高度、圆形外径与描边。                                               |
| `status`        | `'default' \| 'success' \| 'error'` | `'default'` | 显式进度状态，决定语义色与状态图标；不随百分比自动变化。                               |
| `steps`         | `number`                            | `0`         | 步骤数量，0 为连续进度；向下取整并限制在 0–1000。                                      |
| `strokeColor`   | `ProgressStrokeColor`               | —           | 单色、逐节点颜色数组（仅 `steps > 0` 生效）或渐变配置。                                |
| `segments`      | `ProgressSegment[]`                 | `[]`        | 分段颜色，每项为累计终点与颜色。                                                       |
| `textInside`    | `boolean`                           | `false`     | 直线文字放在已完成区域内部，不改变轨道高度。                                           |
| `striped`       | `boolean`                           | `false`     | 叠加条纹装饰层，仅直线形态生效。                                                       |
| `stripedFlow`   | `boolean`                           | `false`     | 让条纹流动，需同时开启 `striped`。                                                     |
| `duration`      | `number`                            | `3`         | 条纹流动一个周期的秒数，非正数回退为 3。                                               |
| `flowDirection` | `'normal' \| 'reverse'`             | `'normal'`  | 填充方向；`reverse` 时直线从右往左、圆形逆时针，分段圆弧、内嵌文字与条纹流向随之翻转。 |
| `format`        | `(percentage: number) => string`    | —           | 自定义显示文字，优先于状态图标。                                                       |
| `showText`      | `boolean`                           | `true`      | 是否显示文字、状态图标与默认插槽。                                                     |
| `ariaLabel`     | `string`                            | `'进度'`    | 无障碍任务名称，写在根节点 `aria-label` 上。                                           |
| `class`         | `ClassValue`                        | —           | 根节点额外类名。                                                                       |
| `ui`            | `ProgressUi`                        | —           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                           |

### Slots

| 插槽名    | 作用域参数                                    | 描述                                                   |
| --------- | --------------------------------------------- | ------------------------------------------------------ |
| `default` | `{ percent: number; status: ProgressStatus }` | 自定义进度文字，优先于 `format` 与状态图标。`percent` 为归一化后的值。 |

### Emits 与 Expose

组件不派发事件，也不通过 `defineExpose` 暴露方法——进度数值与状态完全由业务通过 Props 驱动。

### 类型

```ts
type ProgressType = "line" | "circle" | "dashboard";
type ProgressSize = "sm" | "md" | "lg";
type ProgressStatus = "default" | "success" | "error";
type ProgressFlowDirection = "normal" | "reverse";

interface ProgressGradient {
  stops: { offset: number; color: string }[];
  /** 渐变角度，默认 90（从左向右） */
  angle?: number;
}
type ProgressStrokeColor = string | string[] | ProgressGradient;

interface ProgressSegment {
  /** 累计终点百分比 */
  percentage: number;
  color: string;
}
```

### 自定义样式（ui）

`ui` 的键与 `reborn-progress.config.ts` 中 `slots` 一一对应，传入的类名经 `tailwind-merge` 合并到默认类之后。直线与圆形的节点结构不同，部分键只在其中一种形态下生效：

| 键名      | 作用节点                         | 默认类名（节选）                                                                                     | 渲染条件                                                                                          |
| --------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `root`    | 根容器（`role="progressbar"`）   | `relative inline-flex items-center gap-[8px] text-primary`；直线加 `w-full`，圆形加 `shrink-0` 与外径 | 始终渲染；步骤直线改为 `w-fit max-w-full`                                                          |
| `track`   | 直线轨道容器 / 圆形背景弧路径    | 直线：`relative flex min-w-0 flex-1 gap-[2px]`；圆形背景弧固定 `stroke-gray-3`                       | 直线始终渲染，步骤时加 `overflow-x-auto`；圆形作用在每段背景 `<path>` 上                           |
| `step`    | 直线连续轨道或单个步骤节点       | `relative min-w-0 flex-1 overflow-hidden rounded-full bg-gray-3`，高度 6px / 8px / 16px              | 仅直线形态                                                                                        |
| `fill`    | 已完成区域 / 圆形进度弧路径      | 直线：`absolute inset-y-0 overflow-hidden bg-current transition-[width] duration-300`；连续时 `rounded-full` | 直线有填充时渲染；圆形只合并 `ui.fill`，没有默认类                                                 |
| `stripes` | 直线条纹装饰层                   | `pointer-events-none absolute inset-y-0 left-0`，45° 半透明白色渐变，`bg-[length:1.25em_1.25em]`       | 直线 + `striped` + 该节点有填充；`stripedFlow` 时加流动动画                                         |
| `circle`  | 圆环 / 仪表盘的 `<svg>`          | `block size-full overflow-visible`                                                                   | 仅 `circle` / `dashboard`                                                                          |
| `text`    | 百分比、`format` 结果或插槽容器  | `shrink-0 whitespace-nowrap text-center tabular-nums text-default text-base leading-none`            | `showText` 为 `true`；圆形改为绝对居中，内嵌时改为 `text-[10px] text-white px-[4px]` 并绝对定位    |
| `icon`    | 成功 / 失败状态图标 `<svg>`      | `block size-[18px] shrink-0 text-primary`，按状态换 `text-success` / `text-error`                     | `status` 非 `default`、未传 `format` 与插槽、且非内嵌文字                                          |

```vue
<RebornProgress
  :percent="60"
  :ui="{
    step: 'bg-gray-2',
    fill: 'duration-700',
    text: 'font-semibold text-primary',
  }"
/>
```

### 尺寸对照

| 项目                      | sm      | md       | lg        |
| ------------------------- | ------- | -------- | --------- |
| 直线高度                  | 6px     | 8px      | 16px      |
| 直线步骤节点宽 × 高       | 2 × 6px | 32 × 8px | 32 × 16px |
| 圆环 / 仪表盘外径         | 48px    | 76px     | 114px     |
| 圆环 / 仪表盘描边         | 4px     | 6px      | 6px       |
| 步骤圆环 / 步骤仪表盘描边 | 6px     | 8px      | 16px      |
| 圆形中央文字              | 14px    | 16px     | 24px      |
| 圆形状态图标              | 18px    | 20px     | 28px      |

直线文字固定 14px，不随 `size` 变化；状态图标 18px。

## 注意事项

- **`status` 不会自动切换。** 组件只读 `status` 决定颜色与图标，不比较 `percent`；需要「满 100% 显示成功」时由业务写 `:status="percent === 100 ? 'success' : 'default'"`。
- **自定义颜色会盖过状态色。** 传了 `strokeColor` 或 `segments` 后，`status="error"` 只改变图标与文字颜色，填充仍是自定义颜色；想让失败时整条变红，需要业务在失败时去掉自定义颜色。
- **颜色数组只在步骤模式有效。** `steps` 为 0 时 `strokeColor` 传数组不会逐段着色，按区间着色请改用 `segments`。
- **`textInside` 不会增高轨道。** 内嵌文字固定 10px，`sm` / `md` 轨道只有 6px / 8px，文字会溢出轨道上下边缘；需要内嵌文字时请用 `size="lg"`。
- **`ui.fill` 在圆形上没有默认类。** 圆形进度弧的颜色写在 `<path>` 的 `stroke` 属性上，而 SVG 表现属性的优先级低于任何 CSS 类，所以在 `ui.fill` 里写 `stroke-*` 会把所有分段、渐变与步骤颜色统一覆盖掉；只想改颜色请用 `strokeColor` / `segments`，`ui.fill` 留给线帽、过渡时长这类非颜色样式。
- **无障碍名称要写具体任务。** 根节点带 `role="progressbar"`、`aria-valuenow`、`aria-valuemin` / `aria-valuemax`，未传 `format` 时 `aria-valuetext` 会追加「，成功」/「，失败」；默认 `aria-label` 只是「进度」，页面有多个进度条时读屏无法区分，请通过 `aria-label` 传入「文件上传进度」这类名称。可见文字节点带 `aria-hidden`，不会被重复朗读。
