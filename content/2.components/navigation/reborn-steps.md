---
title: Steps 步骤条
description: Web 流程步骤条：横纵排列、四向内容位置与三档尺寸，支持进度圆环、单步状态和内容插槽。
category: 导航
platform: web
tags: [vue, tailwind, steps, workflow, navigation]
badge: New
---

::ComponentViewer{demoFile="RebornStepsDemo.vue" config="RebornStepsConfig" componentId="reborn-steps" :componentFiles='["RebornSteps.vue", "RebornStep.vue", "reborn-steps.config.ts", "reborn-steps.context.ts", "index.ts"]'}
::

## 简介

`RebornSteps` 与 `RebornStep` 展示有序流程的阶段及当前进度，适合注册、下单或审批页面；目前仅提供 Web 实现。

`active` 决定当前步骤，单步 `progress` 表示该阶段的完成百分比，父级 `overallProgress` 自动折算整体完成量；`processStatus` 与 `finishStatus` 决定当前和前序步骤的状态。`direction` 决定横纵排列，`type` 决定数字或点状节点，`lineType` 独立决定实线、虚线或箭头连接。

`size` 调整节点与文字尺寸，`width` 控制步骤条整体宽度，`space` 调整步骤间距，`placement` 选择标题与描述相对节点的上、下、左、右位置，`alignCenter` 控制横向上、下方内容的居中对齐，`simple` 控制描述显示。单步 `status`、`color`、`icon`、`placement` 可覆盖继承结果，节点、标题、描述和连接器插槽可放入业务内容；流程通过外部状态推进，`change` 回报下标变化。

### 何时使用

- 注册、下单等有顺序的流程——通过 `v-model:active` 标出当前阶段，使用外部按钮推进。
- 流程包含处理、完成或失败状态——设置 `processStatus`、`finishStatus`，必要时用单步 `status` 覆盖。
- 页面宽度或阶段说明长短不同——用 `width` 控制整体宽度，配合 `direction`、`space`、`placement` 调整排列与内容位置。
- 只展示阶段名称的摘要——用 `simple` 隐藏描述，或用 `type="dot"` 缩小节点。
- 阶段内的耗时处理需要反馈——为 `RebornStep` 设置 `progress` 显示该步骤的进度圆环，或用父级 `overallProgress` 自动换算整个流程。

### 何时不使用

- 按时间回顾日志、消息或操作记录——改用 `reborn-timeline`。
- 点击标题切换内容面板——改用 `reborn-tabs`。
- 通过遮罩聚焦页面元素并逐步讲解——改用 `reborn-guide`。

## 用法

### 基础与状态流转

`active` 默认 `0`，表示第一个步骤；前序节点使用 `finishStatus`，当前节点使用 `processStatus`，后续节点使用 `wait`。

| 状态      | 默认表现           | 典型用途           |
| --------- | ------------------ | ------------------ |
| `wait`    | 灰色节点与文字     | 尚未开始           |
| `process` | 主题色实心节点     | 当前处理阶段       |
| `finish`  | 主题浅色节点与对勾 | 已完成的普通阶段   |
| `error`   | 错误色节点与叉号   | 校验失败或处理异常 |
| `success` | 成功色节点与对勾   | 明确的成功结果     |

```vue
<script setup lang="ts">
import { ref } from "vue";
const active = ref(0);
</script>
<template>
  <RebornSteps v-model:active="active">
    <RebornStep
      title="填写资料"
      description="补充基本信息"
    />
    <RebornStep
      title="身份验证"
      description="核对联系方式"
    />
    <RebornStep title="提交完成" />
  </RebornSteps>
  <RebornButton @click="active = Math.min(active + 1, 3)">下一步</RebornButton>
</template>
```

### 步骤进度

单步 `RebornStep.progress` 与父级 `RebornSteps.overallProgress` 都接受 `0`～`100` 的百分比，默认不传时保持普通节点；超出范围会被限制到边界，非有限值按 `0` 处理。

| 参数                          | 计算方式                                                                                 | 典型用途                     |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| `RebornStep.progress`         | 独立指定该步骤的圆环进度；仅当前且状态为 `process` 时显示，优先于整体折算值              | 每个阶段分别上报任务进度     |
| `RebornSteps.overallProgress` | 每个步骤占相同份额，自动折算完成步骤及当前下标；当前步未设置 `progress` 时使用折算百分比 | 服务端只返回整个流程的百分比 |

当前步骤进度为 `100%` 时不会自动进入下一步，业务仍通过 `active` 推进：

```vue
<template>
  <RebornSteps :active="1">
    <RebornStep
      title="填写资料"
      :progress="100"
    />
    <RebornStep
      title="核验资料"
      :progress="45"
    />
    <RebornStep
      title="确认提交"
      :progress="0"
    />
  </RebornSteps>
</template>
```

演示中的上一步、下一步与重置按钮分别更新受控下标；输入的单步百分比传给当前激活的 `RebornStep`，前序步骤为 `100%`、后续为 `0%`。重置恢复第二步和 `45%`。

整体进度 `50%` 对三个步骤的展示结果是：第一步完成、第二步处理中且进度 `50%`、第三步等待。`100%` 时全部完成，不再显示当前步骤圆环。

```vue
<template>
  <RebornSteps :overall-progress="50">
    <RebornStep title="填写资料" />
    <RebornStep title="核验资料" />
    <RebornStep title="确认提交" />
  </RebornSteps>
</template>
```

整体进度演示的上一步和下一步各移动三分之一的整体份额，并限制在 `0%`～`100%`；重置恢复 `50%`。按钮直接更新 `overallProgress`，使当前步骤由组件继续自动折算。

::tip
圆环只围绕当前且状态为 `process` 的节点显示，根字号为 `16px` 时厚度 `2px`、与节点边缘相隔 `3px`，均随 Tailwind 刻度缩放；轨道使用 `gray-3`，进度使用该步骤实际主题色的第 6 阶。`0%` 时保留灰色轨道，`100%` 时显示完整进度环，数字与点状节点均支持。显式传入单步 `progress`（包括 `0`）时覆盖该步骤的整体折算百分比；整体进度仍决定当前下标。整体进度只计算展示结果，不回写 `active`，也不额外触发 `change`。
::

### 尺寸

`size` 默认 `md`，同时控制节点、标题和描述；节点使用 Tailwind 尺寸刻度，以下像素值以根字号 `16px` 为基准，文字字号固定为 px。

| `size` | 数字节点直径          | 标题 / 描述字号 | 典型用途           |
| ------ | --------------------- | --------------- | ------------------ |
| `sm`   | `1.5rem`，默认 `24px` | `14px` / `12px` | 紧凑的流程摘要     |
| `md`   | `2rem`，默认 `32px`   | `16px` / `14px` | 普通表单与审批流程 |
| `lg`   | `2.5rem`，默认 `40px` | `18px` / `16px` | 主要业务流程       |

```vue
<template>
  <RebornSteps
    :active="1"
    size="sm"
  >
    <RebornStep
      title="填写资料"
      description="补充基本信息"
    />
    <RebornStep
      title="身份验证"
      description="核对联系方式"
    />
    <RebornStep title="提交完成" />
  </RebornSteps>
</template>
```

### 方向与间距

`direction` 默认 `horizontal`；`width` 默认 `'100%'`，控制整个步骤条宽度。`space` 留空时自动布局，横向控制每步宽度、纵向控制每步高度；两者都支持数字（按 px 解释）或 CSS 长度字符串。

横向自动布局让所有步骤共同分配可用宽度，末项不再根据标题宽度单独收缩，长描述在每步的可用区域内换行。需要固定每步宽度时传入 `space`。

垂直排列且文案位于节点左侧或右侧时，连接线首尾与相邻节点的边缘各留 `8px`，圆形和点状节点均适用；`top` / `bottom` 会让连接线避开文案，连接内容组边缘，节点与文案仍间隔 `8px`。间距使用 Tailwind 刻度，像素值以根字号 `16px` 为基准。

| `direction`  | 排列方式 | 典型用途               |
| ------------ | -------- | ---------------------- |
| `horizontal` | 从左到右 | 横向表单与流程页头     |
| `vertical`   | 从上到下 | 窄容器或较长的阶段说明 |

| 参数    | 控制范围                         | 典型用途                                  |
| ------- | -------------------------------- | ----------------------------------------- |
| `width` | 整个步骤条，默认 `'100%'`        | 铺满容器，或限定为 `640` / `'75%'` 等宽度 |
| `space` | 单步布局长度，默认 `''` 自动分配 | 固定相邻步骤的布局节奏                    |

整体宽度可以单独设置，保留单步间距自动分配：

```vue
<template>
  <RebornSteps
    :active="1"
    :width="640"
  >
    <RebornStep title="填写资料" />
    <RebornStep title="身份验证" />
    <RebornStep title="提交完成" />
  </RebornSteps>
</template>
```

纵向流程可以单独设置每步长度：

```vue
<template>
  <RebornSteps
    :active="1"
    direction="vertical"
    :space="104"
  >
    <RebornStep
      title="填写资料"
      description="补充基本信息"
    />
    <RebornStep
      title="身份验证"
      description="核对联系方式"
    />
    <RebornStep title="提交完成" />
  </RebornSteps>
</template>
```

### 标题与描述位置

`placement` 表示标题与描述相对节点的位置，不改变步骤的排列方向；父级统一设置，单个 `RebornStep` 可独立覆盖，未配置时默认在右侧。

| `placement` | 内容位置 | 典型用途 |
| --- | --- | --- |
| `top` | 标题与描述位于节点上方 | 节点下方需要保留空间 |
| `bottom` | 标题与描述位于节点下方 | 横向阶段摘要 |
| `left` | 标题与描述位于节点左侧 | 左侧文字说明 |
| `right` | 标题与描述位于节点右侧 | 默认流程布局或较长说明 |

```vue
<template>
  <RebornSteps :active="1" placement="top">
    <RebornStep title="填写资料" description="继承父级上方位置" />
    <RebornStep title="身份验证" description="此步骤改为下方" placement="bottom" />
    <RebornStep title="提交完成" description="其余步骤仍在上方" />
  </RebornSteps>
</template>
```

::tip
内容位置优先采用单步 `placement`，其次为父级 `placement`；均未设置时，横向 `alignCenter=true` 回退为 `bottom`，其余情况默认 `right`。横向 `top` / `bottom` 默认沿每步起点左对齐，开启 `alignCenter` 后居中；显式位置始终保留。纵向排列也支持四种位置，不受 `alignCenter` 影响。
::

### 居中对齐

`alignCenter` 默认 `false`，控制横向 `top` / `bottom` 布局中节点与文字是否在每步宽度内居中；关闭时从每步左侧开始，不预留半步宽度。未显式设置父级或单步 `placement` 时，开启后还会将内容位置回退为 `bottom`；纵向布局不受它影响。

| `alignCenter` | 横向 `top` / `bottom` 的对齐方式 | 典型用途                   |
| ------------- | ------------------------------- | -------------------------- |
| `false`       | 节点、标题和描述从每步左侧开始 | 说明文字较长，首项贴齐容器 |
| `true`        | 节点、标题和描述在每步宽度内居中 | 阶段名称较短、各步宽度相近 |

```vue
<template>
  <RebornSteps
    :active="1"
    align-center
  >
    <RebornStep
      title="已提交"
      description="材料已接收"
    />
    <RebornStep
      title="审核中"
      description="预计一个工作日"
    />
    <RebornStep
      title="待发布"
      description="审核完成后发布"
    />
  </RebornSteps>
</template>
```

### 连接线样式

`lineType` 默认 `solid`，统一选择实线、原生 CSS 虚线或箭头；与节点类型 `type` 独立，点状节点也可搭配箭头连接。

| 配置                | 连接方式 | 典型用途           |
| ------------------- | -------- | ------------------ |
| `lineType="solid"`  | 连续实线 | 普通阶段进度       |
| `lineType="dashed"` | 原生虚线 | 辅助或待定流程     |
| `lineType="arrow"`  | 方向箭头 | 强调步骤的先后关系 |

```vue
<template>
  <RebornSteps
    :active="1"
    line-type="dashed"
  >
    <RebornStep title="创建订单" />
    <RebornStep title="确认付款" />
    <RebornStep title="安排配送" />
  </RebornSteps>
</template>
```

实线和虚线在步骤完成时从前一步向后一步延展主题色，横向从左到右、纵向从上到下，回退时反向收回；箭头使用颜色过渡。过渡持续约 `200ms`，系统启用减少动态效果时立即切换。

### 点状步骤

`type="dot"` 用圆点替代数字、状态图标和自定义图标；`size` 仍控制节点与文字尺寸。

| `size` | 圆点直径               | 典型用途           |
| ------ | ---------------------- | ------------------ |
| `sm`   | `0.25rem`，默认 `4px`  | 紧凑摘要           |
| `md`   | `0.375rem`，默认 `6px` | 普通点状流程       |
| `lg`   | `0.5rem`，默认 `8px`   | 需要突出节点的流程 |

```vue
<template>
  <RebornSteps
    :active="1"
    type="dot"
    size="md"
  >
    <RebornStep
      title="待付款"
      description="订单已创建"
    />
    <RebornStep
      title="配送中"
      description="包裹已出库"
    />
    <RebornStep title="已签收" />
  </RebornSteps>
</template>
```

### 简洁模式

`simple` 默认 `false`，开启后隐藏全部描述，包括 `description` 插槽；节点、标题和连接方式保持当前配置。

| `simple` | 描述展示           | 典型用途         |
| -------- | ------------------ | ---------------- |
| `false`  | 渲染描述文字或插槽 | 阶段需要辅助说明 |
| `true`   | 不渲染描述         | 只需展示流程名称 |

```vue
<template>
  <RebornSteps
    :active="1"
    simple
  >
    <RebornStep
      title="填写资料"
      description="简洁模式下隐藏"
    />
    <RebornStep
      title="身份验证"
      description="简洁模式下隐藏"
    />
    <RebornStep title="提交完成" />
  </RebornSteps>
</template>
```

### 单步状态与颜色

单步 `status` 优先于父级推导状态，单步 `color` 优先于继承色；`error` 和 `success` 状态始终采用对应语义色。

| `color`     | 语义         | 典型用途       |
| ----------- | ------------ | -------------- |
| `primary`   | 主色，默认值 | 主要流程       |
| `secondary` | 辅助色       | 次级流程       |
| `success`   | 成功色       | 确认或完成阶段 |
| `info`      | 信息色       | 通知与信息处理 |
| `warning`   | 警示色       | 待核对阶段     |
| `error`     | 错误色       | 异常阶段       |
| `neutral`   | 中性色       | 辅助状态展示   |

```vue
<template>
  <RebornSteps
    :active="1"
    color="secondary"
  >
    <RebornStep
      title="已收集"
      status="success"
    />
    <RebornStep
      title="需要核对"
      status="error"
    />
    <RebornStep
      title="人工复核"
      status="process"
      color="warning"
    />
    <RebornStep title="等待通知" />
  </RebornSteps>
</template>
```

### 自定义图标与内容

`icon` 接受图标名称或 Vue 组件，同名插槽优先；`title` 与 `description` 插槽分别替换对应文字。

| 入口           | 内容来源            | 典型用途         |
| -------------- | ------------------- | ---------------- |
| `icon`         | 图标名称或 Vue 组件 | 业务阶段图标     |
| `#icon`        | 自定义标记内容      | 组合图标或徽记   |
| `#title`       | 自定义标题内容      | 强调词或业务标签 |
| `#description` | 自定义描述内容      | 订单号、补充信息 |

```vue
<template>
  <RebornSteps :active="1">
    <RebornStep
      title="填写订单"
      icon="lucide:clipboard-list"
    />
    <RebornStep icon="lucide:truck">
      <template #title><RebornText color="neutral">配送安排</RebornText></template>
      <template #description>核对订单 <strong>RB-2026</strong></template>
    </RebornStep>
    <RebornStep
      title="确认收货"
      icon="lucide:package-check"
    />
  </RebornSteps>
</template>
```

### 插槽定制

`icon`、`title`、`description` 与 `connector` 插槽分别替换节点内容、标题、描述和当前步骤到下一步的指示线；作用域参数随步骤状态更新。演示通过 `ui.marker` 去除节点背景，只显示图标，标题使用 `RebornText color="neutral"`。

| 插槽 | 可读取的关键状态 | 典型用途 |
| --- | --- | --- |
| `#icon` | `index`、`status` | 根据阶段与完成状态显示业务图标 |
| `#title` | `index`、`current` | 当前阶段显示辅助标签 |
| `#description` | `status`、`progress` | 展示阶段内进度或业务详情 |
| `#connector` | `completed`、`direction`、`lineType` | 自绘带图标的指示线或纵向连接器 |

```vue
<template>
  <RebornSteps :active="1" :ui="{ marker: 'bg-transparent text-brand-6' }">
    <RebornStep title="资料已提交" icon="lucide:check" />
    <RebornStep>
      <template #icon><Icon name="lucide:credit-card" class="size-5 text-brand-6" /></template>
      <template #title="{ current }"><RebornText color="neutral">{{ current ? '正在核验' : '核验资料' }}</RebornText></template>
      <template #description="{ status }">核验状态：{{ status }}</template>
      <template #connector="{ completed }">
        <span class="h-0.5 w-full rounded-full" :class="completed ? 'bg-brand-6' : 'bg-gray-4'" />
      </template>
    </RebornStep>
    <RebornStep title="确认提交" icon="lucide:send" />
  </RebornSteps>
</template>
```

::tip
四个插槽共用 `index`、`status`、`current`、`progress`；`connector` 额外提供 `completed`、`direction`、`lineType`。`index` 从 `0` 开始，`progress` 是该步骤实际采用的百分比，未设置时为 `undefined`。自定义指示线保留默认连接器外层，位置和尺寸仍通过 `ui.connector` 调整；内部线条与过渡效果由插槽自行绘制，末步不调用该插槽。
::

## API

### Props

#### RebornSteps

| 属性名            | 类型                                                                                   | 默认值         | 描述                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `active`          | `number`                                                                               | `0`            | 当前步骤零基下标，支持 `v-model:active`；等于步骤数量时全部完成。                   |
| `overallProgress` | `number`                                                                               | -              | 整体进度，范围 0～100；优先于 `active` 决定展示下标，等分折算当前进度，不回写模型。 |
| `width`           | `number \| string`                                                                     | `'100%'`       | 步骤条整体宽度；数字为 px，字符串为 CSS 长度；与单步布局长度 `space` 独立。         |
| `space`           | `number \| string`                                                                     | `''`           | 每步布局长度；数字为 px，字符串为 CSS 长度，空值自动分配。                          |
| `direction`       | `'horizontal' \| 'vertical'`                                                           | `'horizontal'` | 步骤排列方向。                                                                      |
| `placement`       | `'top' \| 'bottom' \| 'left' \| 'right'`                                                | -              | 标题与描述相对节点的位置，子项可覆盖；未配置时，横向 `alignCenter=true` 回退为 `bottom`，其余默认 `right`。 |
| `processStatus`   | `'wait' \| 'process' \| 'finish' \| 'error' \| 'success'`                              | `'process'`    | 当前步骤的推导状态。                                                                |
| `finishStatus`    | `'wait' \| 'process' \| 'finish' \| 'error' \| 'success'`                              | `'finish'`     | 当前下标之前步骤的推导状态。                                                        |
| `alignCenter`     | `boolean`                                                                              | `false`        | 横向 `top` / `bottom` 的节点与文字在每步宽度内居中；未设置位置时回退为 `bottom`，纵向不生效。 |
| `simple`          | `boolean`                                                                              | `false`        | 隐藏全部步骤的描述文字与描述插槽。                                                  |
| `size`            | `'sm' \| 'md' \| 'lg'`                                                                 | `'md'`         | 节点、标题与描述的尺寸档位。                                                        |
| `type`            | `'default' \| 'dot'`                                                                   | `'default'`    | 数字节点或点状节点，与连接线类型独立。                                              |
| `lineType`        | `'solid' \| 'dashed' \| 'arrow'`                                                       | `'solid'`      | 实线、原生 CSS 虚线或箭头连接。                                                     |
| `color`           | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`    | 子项未设置颜色时继承的主题色。                                                      |
| `ui`              | `StepsUI`                                                                              | `{}`           | 根节点与所有子项的样式覆盖。                                                        |

#### RebornStep

| 属性名        | 类型                                                                                   | 默认值 | 描述                                                                         |
| ------------- | -------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| `title`       | `string`                                                                               | `''`   | 标题文字，`title` 插槽优先。                                                 |
| `description` | `string`                                                                               | `''`   | 描述文字，`description` 插槽优先，`simple` 模式不显示。                      |
| `placement`   | `'top' \| 'bottom' \| 'left' \| 'right'`                                                | -      | 单步标题与描述的位置，优先于父级 `placement` 及默认位置回退；横向上、下方仍由 `alignCenter` 控制居中。 |
| `icon`        | `string \| Component`                                                                  | -      | 图标名称或 Vue 组件，`icon` 插槽优先；点状节点不显示。                       |
| `status`      | `'wait' \| 'process' \| 'finish' \| 'error' \| 'success' \| ''`                        | `''`   | 非空时覆盖父级推导状态。                                                     |
| `progress`    | `number`                                                                               | -      | 本步骤进度，范围 0～100；优先于整体折算值，仅当前且状态为 `process` 时显示。 |
| `color`       | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -      | 未指定时继承父级；错误和成功状态优先使用状态色。                             |
| `ui`          | `StepsUI`                                                                              | `{}`   | 本步骤样式覆盖，优先于父级同名配置；不处理 `root`。                          |

### Emits

事件均由 `RebornSteps` 派发。

| 事件名          | 回调参数                           | 描述                                                    |
| --------------- | ---------------------------------- | ------------------------------------------------------- |
| `update:active` | `(value: number)`                  | `active` 模型的更新事件。                               |
| `change`        | `(next: number, previous: number)` | `active` 真正变化时触发，初始化与单独修改进度时不触发。 |

### Slots

| 插槽名        | 作用域参数 | 描述                                                                                     |
| ------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `default`     | -          | `RebornSteps` 的步骤内容，约定传入 `RebornStep` 或其异步包装；支持 Fragment 与 `v-for`。 |
| `icon`        | `{ index: number; status: StepsStatus; current: boolean; progress: number \| undefined }` | `RebornStep` 的节点内容，优先于 `icon`；`type="dot"` 时不渲染，可通过 `ui.marker` 改节点外形。 |
| `title`       | `{ index: number; status: StepsStatus; current: boolean; progress: number \| undefined }` | `RebornStep` 的标题，优先于标题文字。 |
| `description` | `{ index: number; status: StepsStatus; current: boolean; progress: number \| undefined }` | `RebornStep` 的描述，优先于描述文字；`simple` 时不渲染。 |
| `connector` | `{ index: number; status: StepsStatus; current: boolean; progress: number \| undefined; completed: boolean; direction: 'horizontal' \| 'vertical'; lineType: 'solid' \| 'dashed' \| 'arrow' }` | 替换当前步骤到下一步的连接器内容，保留外层位置与尺寸；末步不渲染。 |

`StepsStatus` 为 `'wait' \| 'process' \| 'finish' \| 'error' \| 'success'`。`current` 表示实际展示下标是否为当前步骤；`completed` 与默认连接器的完成判断一致，表示该步骤已使用 `finish` 或 `success` 状态。

### 自定义样式（ui）

`ui` 按内部结构覆盖类名，子步骤同名配置优先于父级；`root` 仅由 `RebornSteps` 使用，其余键由 `RebornStep` 使用。

四向布局使用条件选择器共享节点轴。覆盖其网格位置、外边距或连接器定位时，使用 Tailwind 重要修饰符，例如 `content: 'mt-6!'`；常规颜色与字号覆盖直接传类名即可。

| 键名                | 说明                                                                      |
| ------------------- | ------------------------------------------------------------------------- |
| `root`              | 父级有序列表，默认 flex 布局；上下文案或竖向混排时使用共享 grid 轨道。      |
| `item`              | 单步列表项，默认 grid 布局。                                              |
| `marker`            | 数字或圆点节点，默认圆形。                                                |
| `progressRing`      | 当前步骤的 SVG 圆环容器；只有传入进度且当前状态为 `process` 时渲染。      |
| `progressTrack`     | 圆环背景轨道，默认 `stroke-gray-3`，包括进度为 `0%` 时。                  |
| `progressIndicator` | 圆环进度笔画，默认使用当前主题色；进度大于 `0%` 时渲染。                  |
| `icon`              | `icon` 参数或状态生成的图标，默认占节点 `60%`；不直接作用于图标插槽内容。 |
| `content`           | 标题与描述的组合容器，默认 `contents`；四向布局用于组内间距与定位。       |
| `title`             | 标题容器，默认允许换行；插槽仍处于该容器内。                              |
| `description`       | 描述容器；无内容或 `simple` 时不渲染。                                    |
| `connector`         | 连接器外层容器，插槽内容仍在该容器内；末步不渲染。                       |
| `line`              | 实线或原生虚线背景轨道；箭头或自定义 `connector` 插槽时不渲染。          |
| `lineFill`          | 实线或虚线的主题色覆盖层，完成时延展、回退时收回；自定义 `connector` 时不渲染。 |
| `arrow`             | 箭头图标；仅 `lineType="arrow"` 且无自定义 `connector` 时渲染，完成状态使用颜色过渡。 |

```vue
<template>
  <RebornSteps
    :active="1"
    :ui="{ title: 'font-semibold' }"
  >
    <RebornStep title="提交" />
    <RebornStep
      title="审核"
      :ui="{ title: 'text-warning' }"
    />
    <RebornStep title="完成" />
  </RebornSteps>
</template>
```

### CSS 变量

整体宽度与单步长度变量由 `app/components/reborn/ui/reborn-steps/RebornSteps.vue` 根据 `width` / `space` 在根节点上生成；颜色变量定义在 `app/components/reborn/ui/reborn-steps/reborn-steps.config.ts`，由每步的实际 `color` 在列表项上生成，对应色板定义在 `app/assets/theme/base.css`。

| 变量名          | 对应取值           | 值                                                                   |
| --------------- | ------------------ | -------------------------------------------------------------------- |
| `--steps-width` | 整体 `width`       | 默认 `100%`；数字转为 px，字符串保留为 CSS 长度。通过 `width` 调整。 |
| `--steps-space` | 单步 `space`       | 默认空值、自适应；数字转为 px，字符串保留为 CSS 长度。通过 `space` 调整。 |
| `--step-color`  | 当前步骤实际主题色 | 对应色板的第 6 阶；`primary` 为 `var(--color-brand-6)`。             |
| `--step-soft`   | 当前步骤浅色背景   | 通常为对应色板第 1 阶；`neutral` 为 `var(--color-gray-2)`。          |

## 注意事项

- **`active` 从 0 开始**。等于步骤数量时所有步骤使用 `finishStatus`；业务层应自行限制可用范围。
- **整体进度决定展示下标，单步进度优先决定圆环**。设置 `overallProgress` 后按步骤数量等分计算展示状态；当前步骤显式设置 `progress` 时覆盖折算百分比，不影响折算下标。整体进度不会回写 `active` 或额外触发 `change`，需要改回手动流程时移除该参数。
- **进度传给 `RebornStep`，圆环仅展示当前处理中步骤**。每步独立接收 `progress`，达到 100% 不会推进下标；当前步通过 `status` 或 `processStatus` 改为其他状态时圆环隐藏，业务应根据任务结果更新状态。
- **箭头属于连接方式**。使用 `line-type="arrow"`，`type` 仅接受 `default` 与 `dot`；虚线采用原生 CSS `border-style: dashed`，短段长度和分布由浏览器决定。
- **步骤不提供点击切换能力**。`RebornStep` 只展示阶段，使用外部按钮或业务状态更新 `active`。
- **子项状态优先于自动推导**。显式 `status` 不随当前下标变化，错误与成功状态还会覆盖 `color`，避免语义与配色冲突。
- **`simple` 会隐藏描述插槽**。描述节点不参与渲染，需要始终展示说明时请保持 `simple` 为 `false`。
- **内容位置、排列与居中分别控制**。`direction` 选择步骤横排或纵排，`placement` 选择标题与描述相对节点的位置，单步设置优先于父级；横向 `top` / `bottom` 默认左对齐，`alignCenter` 开启后居中。均未指定位置时，横向居中布局回退为 `bottom`，其余默认 `right`。
- **整体宽度与单步间距分别控制**。`width` 默认铺满容器，`space` 控制步骤布局长度；过小可能导致文字与连接器拥挤，设定的整体宽度或步骤总宽超出容器时应在外层提供滚动区域。
- **默认插槽约定只放步骤组件**。直接传入 `RebornStep` 或其异步包装，可用 Fragment 与 `v-for` 组织步骤；普通组件也会占用步骤索引，不要混入按钮或其他无关组件，原生元素不会被收集。
- **`change` 不用于初始化通知**。它只观察 `active` 的实际变化，初始状态处理请在业务代码中执行。
