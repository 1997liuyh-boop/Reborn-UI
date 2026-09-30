---
title: Timeline 时间线
description: 按时间顺序展示事件节点：支持竖向与横向、倒序、左右交替、自定义节点图标与时间戳落位。
category: 数据展示
platform: web
tags: [css, tailwind, timeline, data]
badge: New
---

::warning
仅 Web 端组件。UniApp 端暂无对应实现。
::

::ComponentViewer{demoFile="RebornTimelineDemo.vue" config="RebornTimelineConfig" componentId="reborn-timeline" :componentFiles='["RebornTimeline.vue", "RebornTimelineItem.vue", "reborn-timeline.config.ts"]'}
::

## 简介

Timeline 用于按时间顺序展示一组事件，例如审批记录、发布流程、操作日志。节点有两种写法：传 `items` 数组由组件渲染，适合节点来自接口数据；或在默认插槽里逐个书写 `RebornTimelineItem`，适合节点内容需要插槽定制。两种写法共用同一套节点属性。

每个节点由三格组成：**轴线格**（实心圆点或带图标的底圆，加上贯穿整个节点的连接线）、**内容格**、**对侧格**。相邻节点的轴线格首尾相接，连接线从第一个节点一直连到最后一个节点的内容末尾，中间不会断开。`labelPosition` 决定内容落在轴线的哪一侧；`placement` 决定时间戳是堆叠在内容上下（`top` / `bottom`），还是放到轴线的某一侧（`left` / `right`）——与内容同侧时并排，与内容异侧时越过轴线进入对侧格。

布局上，父级是 CSS Grid，每个节点通过 subgrid 继承父级的列（竖向）或行（横向）轨道，所有节点的轴线落在同一条轨道上，某个节点的时间戳变长也不会让轴线错位。`direction="horizontal"` 时节点改为等分一行排布。

### 何时使用

- 审批流、工单处理记录这类「谁在什么时候做了什么」的追溯信息——时间戳默认在内容下方，一眼能对上事件与时间。
- 发布、部署这类有明确先后且仍在推进的流程——用 `color` 区分已完成 / 失败 / 未开始，用 `loading` 标出正在进行的节点。
- 需要左右交替、把时间与事件分列轴线两侧的展示页——逐个节点设置 `labelPosition` 与 `placement` 即可。
- 阶段数量少（通常不超过 6 个）、横向空间充足的进度概览——用 `direction="horizontal"`。

### 何时不使用

- 需要随页面滚动逐段展开、带粘性标题与渐变动画的长篇叙事 —— 改用 `timeline`（时间线动效组件），它是内容展示区块而非数据列表。
- 等待异步任务时按步骤提示加载进度 —— 改用 `multi-step-loader`，它是全屏加载态。
- 只需要表达单个任务的完成百分比 —— 改用 `reborn-progress`。

## 用法

### 基础用法

在默认插槽里用 `v-for` 书写 `RebornTimelineItem`，`timestamp` 默认显示在内容下方；`reverse` 翻转节点顺序。连接线贯穿所有节点，末项的线同样画到该节点内容（含底部留白）的末尾。

```vue
<template>
  <RebornTimeline :reverse="reverse">
    <RebornTimelineItem
      v-for="(activity, index) in activities"
      :key="index"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 数据驱动

传入 `items` 后由组件渲染节点，字段与 `RebornTimelineItem` 的属性一一对应（见下方 TimelineItemData 表）。`content` 字段按 HTML 渲染，可以直接带 `<strong>`、`<code>` 这类标签。

```vue
<script setup lang="ts">
const items: TimelineItemData[] = [
  { key: "plan", timestamp: "2026-09-01", content: "确定 <strong>v1.2.0</strong> 发布范围", color: "neutral" },
  { key: "dev", timestamp: "2026-09-10", content: "完成开发并合入 <code>main</code> 分支", color: "success" },
  { key: "release", timestamp: "2026-09-25", content: "灰度发布中", loading: true },
];
</script>

<template>
  <RebornTimeline :items="items" />
</template>
```

### 节点颜色

`color` 控制实心圆点（以及图标底圆）的填充色，接受七个语义色预设或任意 CSS 色值。预设色读取主题配置，自定义颜色可传十六进制、`rgb(...)` 或 `var(--brand-color)`。

| `color` | 实际用色 | 典型用途 |
| --- | --- | --- |
| `primary`（默认） | `bg-primary`，跟随主题主色 | 进行中、常规记录 |
| `secondary` | `bg-secondary` | 辅助记录 |
| `success` | `bg-success` | 已完成、审批通过 |
| `info` | `bg-info` | 信息提示 |
| `warning` | `bg-warning` | 待关注、风险提醒 |
| `error` | `bg-error` | 失败、驳回 |
| `neutral` | `bg-neutral` | 尚未开始 |
| 任意色值（如 `#f59e0b`） | 内联 `background-color` | 业务自有的状态色 |

```vue
<template>
  <RebornTimeline>
    <RebornTimelineItem color="success">已完成</RebornTimelineItem>
    <RebornTimelineItem color="error">失败或被驳回</RebornTimelineItem>
    <RebornTimelineItem color="neutral">尚未开始</RebornTimelineItem>
    <RebornTimelineItem color="#f59e0b">任意 CSS 色值</RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 自定义图标与加载

`icon` 传 Iconify 名称或组件，`#icon` 插槽可以放任意内容，`loading` 显示旋转的 `lucide:loader-circle`。三者任一存在时，节点从 10px 的实心圆点放大为 20px 的实心底圆（填充色取 `color`），图标以白色居中显示在圆内；`#icon` 插槽的内容同样放进底圆，不写颜色类时显示为白色，尺寸建议与默认图标一致用 `size-3`。

```vue
<template>
  <RebornTimeline>
    <RebornTimelineItem icon="lucide:git-commit-horizontal">提交代码</RebornTimelineItem>
    <RebornTimelineItem color="success">
      <template #icon>
        <Icon name="lucide:check" class="size-3" />
      </template>
      流水线通过
    </RebornTimelineItem>
    <RebornTimelineItem loading>正在部署到预发环境</RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 时间戳位置

`placement` 决定时间戳的落位。竖向时 `left` / `right` 按轴线两侧理解，结果取决于它与内容所在侧（`labelPosition`）是否相同：

| `placement` | 内容在右侧（默认）时 | 典型用途 |
| --- | --- | --- |
| `bottom`（默认） | 堆叠在内容下方 | 操作日志、审批记录 |
| `top` | 堆叠在内容上方 | 以日期为主线的动态流 |
| `left` | 越过轴线放到左列，与内容隔轴相对 | 时间与事件分列两侧的对照展示 |
| `right` | 与内容同一行并排，贴在远离轴线的一端 | 行内展示简短时间 |

```vue
<template>
  <RebornTimeline>
    <RebornTimelineItem
      v-for="activity in activities"
      :key="activity.timestamp"
      :timestamp="activity.timestamp"
      placement="left"
    >
      {{ activity.content }}
    </RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 内容侧

`labelPosition` 决定内容位于轴线左侧还是右侧，逐个节点设置即可左右交替。交替时把时间戳放到内容的对侧（右侧内容配 `placement="left"`，左侧内容配 `placement="right"`），轴线两边都不会空着。

```vue
<template>
  <RebornTimeline>
    <RebornTimelineItem
      v-for="(activity, index) in activities"
      :key="activity.timestamp"
      :timestamp="activity.timestamp"
      :label-position="index % 2 === 0 ? 'right' : 'left'"
      :placement="index % 2 === 0 ? 'left' : 'right'"
    >
      {{ activity.content }}
    </RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 横向时间轴

`direction="horizontal"` 让节点等分一行，连接线横贯整行、在节点之间不断开。横向时内容固定在轴线下方，`labelPosition` 不生效；`placement="top"` 把时间戳放到轴线上方，`left` / `right` 让时间戳与内容同行并排。

```vue
<template>
  <RebornTimeline direction="horizontal">
    <RebornTimelineItem
      v-for="item in stageItems"
      :key="item.key"
      :timestamp="item.timestamp"
      placement="top"
    >
      {{ item.content }}
    </RebornTimelineItem>
  </RebornTimeline>
</template>
```

### 内容与时间戳插槽

`#content` 与 `#timestamp` 插槽替换对应区域，用于「标题 + 描述」、带图标的时间这类结构化内容。内容区的取值优先级为 `#content` 插槽 > 默认插槽 > `content` 属性。

```vue
<template>
  <RebornTimeline>
    <RebornTimelineItem color="success">
      <template #content>
        <div class="flex flex-col gap-0.5">
          <span class="font-medium">合同审批通过</span>
          <span class="text-sm text-gray-6">法务部 · 审批人 张敏</span>
        </div>
      </template>
      <template #timestamp>
        <span class="inline-flex items-center gap-1">
          <Icon name="lucide:clock" class="size-3" />
          2026-09-05 14:30
        </span>
      </template>
    </RebornTimelineItem>
  </RebornTimeline>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `items` | `TimelineItemData[]` | - | 节点数据，非空时由组件渲染节点并忽略默认插槽；字段见下方 TimelineItemData 表。 |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | 时间轴方向：竖向为「左格 \| 轴线 \| 右格」三列网格，横向为节点等分一行的三行网格。 |
| `reverse` | `boolean` | `false` | 倒序排列节点。翻转的是 DOM 顺序而非视觉顺序，键盘与读屏顺序随之一致。 |
| `ui` | `TimelineUI` | `{}` | 细粒度样式覆盖，会级联到所有节点；键位见「自定义样式（ui）」。 |

#### TimelineItemData 字段

| 字段名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `key` | `string \| number` | 数组下标 | 列表渲染用的唯一标识。 |
| `timestamp` | `string` | - | 时间戳文本。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral' \| string` | `'primary'` | 节点颜色，预设色或任意 CSS 色值。 |
| `content` | `string` | - | 节点内容，按 HTML 渲染。 |
| `icon` | `string \| Component` | - | 自定义节点图标：Iconify 名称或组件。 |
| `loading` | `boolean` | `false` | 是否为加载中节点。 |
| `labelPosition` | `'left' \| 'right'` | `'right'` | 内容位于轴线的哪一侧，仅竖向生效。 |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'bottom'` | 时间戳位置。 |
| `class` | `ClassValue` | - | 追加到该节点根元素 `li` 的类名。 |
| `ui` | `TimelineUI` | - | 该节点的细粒度样式覆盖，优先级高于父组件的 `ui`。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 书写 `RebornTimelineItem` 节点；传了非空 `items` 时不渲染。 |

### TimelineItem Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `timestamp` | `string` | - | 时间戳文本；复杂内容用 `timestamp` 插槽。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral' \| string` | `'primary'` | 节点颜色：预设色走语义类，其余值作为 CSS 色值走内联样式，取值见「节点颜色」。 |
| `content` | `string` | - | 节点内容，按 HTML（`v-html`）渲染；默认插槽或 `content` 插槽存在时忽略。 |
| `icon` | `string \| Component` | - | 自定义节点图标：字符串按 Iconify 名称渲染，否则按组件渲染，以白色显示在节点的实心底圆内。 |
| `loading` | `boolean` | `false` | 加载中节点：底圆内显示旋转的 `lucide:loader-circle`，优先级高于 `icon`。 |
| `labelPosition` | `'left' \| 'right'` | `'right'` | 内容位于轴线的哪一侧，仅 `vertical` 方向生效。 |
| `placement` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'bottom'` | 时间戳位置：`top` / `bottom` 堆叠在内容上下；`left` / `right` 放到轴线对应一侧，落位规则见「时间戳位置」。 |
| `ui` | `TimelineUI` | `{}` | 本节点的细粒度样式覆盖，优先级高于父组件的 `ui`。 |

### TimelineItem Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 节点内容，优先级高于 `content` 属性。 |
| `content` | - | 替换整个内容区，优先级高于默认插槽。 |
| `icon` | - | 替换底圆内的图标；内容放进填充了节点颜色的实心底圆，不写颜色类时显示为白色。 |
| `timestamp` | - | 替换时间戳文本，落位仍由 `placement` 决定。 |

### 自定义样式（ui）

`ui` 按结构键把类名合并到对应节点上（经 `cn` 合并，同类工具类以传入值为准）。`RebornTimeline` 的 `ui` 级联到所有节点，`RebornTimelineItem`（或 `items` 字段）的 `ui` 只作用于单个节点，优先级更高；`root` 只在 `RebornTimeline` 上生效。共 11 个键，键名与 `reborn-timeline.config.ts` 的 `slots` 一一对应：

| 键名 | 作用节点 | 默认关键类 | 渲染条件 |
| --- | --- | --- | --- |
| `root` | 根列表 `ol` | `m-0 list-none p-0 text-base`；竖向追加 `grid` 与列轨道（`grid-cols-[auto_auto_1fr]` 等），横向追加 `grid grid-flow-col auto-cols-fr` | 始终 |
| `item` | 单个节点 `li` | `grid`；竖向 `col-span-3 grid-cols-subgrid`，横向 `row-span-3 grid-rows-subgrid` | 每个节点 |
| `axis` | 轴线格：圆点与连接线 | `relative flex`；竖向 `col-start-2 flex-col items-center pt-1`，横向 `row-start-2 items-center pl-1` | 每个节点 |
| `dotWrapper` | 圆点 / 图标的定位容器 | `relative items-center justify-center`；竖向 `h-[22px] min-w-5`（对齐内容首行），横向 `h-5` | 每个节点 |
| `dot` | 实心圆点；带图标时是图标底圆 | `rounded-full text-white`，填充色随 `color`；无图标 `size-2.5`，有图标 `size-5` | 每个节点 |
| `icon` | 底圆内的图标 | `size-3 shrink-0`；加载图标追加 `animate-spin` | 设了 `icon` 或 `loading`；`icon` 插槽的内容不走此键 |
| `line` | 连接线 | `pointer-events-none absolute bg-gray-3`，铺满整个轴线格；竖向 `inset-y-0 w-px`，横向 `inset-x-0 h-px` | 每个节点（含末项） |
| `body` | 内容格：内容及同侧的时间戳 | `min-w-0`；堆叠时 `flex flex-col gap-1`，并排时 `flex items-baseline gap-3`；竖向 `pt-1 pb-5`，距轴线 `pl-4`（内容在左时 `pr-4`）；横向 `pt-4 pl-1 pr-5` | 每个节点 |
| `opposite` | 对侧格：越过轴线的时间戳 | `min-w-0 text-gray-6`；竖向 `pt-1 pb-5`，距轴线 16px；横向 `pb-4 pl-1 pr-5` | 竖向 `placement` 为 `left` / `right` 且与 `labelPosition` 异侧；横向 `placement="top"` |
| `content` | 内容文本 | `min-w-0 break-words text-gray-9` | 有默认插槽、`content` 插槽或 `content` 属性 |
| `timestamp` | 时间戳文本 | `shrink-0 text-sm text-gray-6` | 有 `timestamp` 属性或 `timestamp` 插槽 |

```vue
<template>
  <RebornTimeline
    :items="items"
    :ui="{
      body: 'pb-8',
      dot: 'size-3',
      timestamp: 'text-xs',
    }"
  />
</template>
```

::tip
竖向时 `dotWrapper` 的高度 22px 取自 `text-base` 的行高，圆点在其中垂直居中，从而对齐内容首行；轴线格与两侧格子同时带 `pt-1`，节点整体下移 4px，连接线从第一个节点上方露出一截。用 `ui.content` 改了内容字号或行高时，要同步调整 `ui.dotWrapper` 的高度；只改 `ui.axis` 或 `ui.body` 其中一个的上内边距，圆点也会偏离首行。
::

## 注意事项

- **`content` 属性经 `v-html` 渲染**。只传可信内容；来自用户输入的文本需先转义，或改用默认插槽以插值方式渲染。
- **`labelPosition` 只在竖向生效**。横向时每个节点占一列，内容固定在轴线下方，没有「轴线左右」可言。
- **竖向列宽由所有节点的内容侧共同决定**。内容全在右侧时左列按时间戳自适应宽度；全在左侧时相反；两侧都有时左右列等宽、轴线居中——所以只要有一个节点设了 `labelPosition="left"`，整条时间线都会切成居中布局。
- **`reverse` 翻转的是 DOM 顺序**。插槽模式下翻转的是默认插槽平铺后的节点列表（`v-for` 与手写节点混用时按整体顺序翻转），不是用 CSS `order` 做视觉倒序，因此键盘与读屏顺序都与视觉一致。
- **`items` 非空时忽略默认插槽**。两种写法不能混用；`items` 为空数组时退回默认插槽。
- **节点必须是 `RebornTimeline` 的直接子元素**。布局依赖 `li` 直接落在父级网格上并通过 subgrid 共享轨道，在节点外再包一层 `div` 会打断网格，轴线随之错位；`v-for` 与 `<template>` 不受影响。
- **自定义色值走内联样式**。非预设的 `color` 以内联 `background-color` 生效，`ui.dot` 里的背景色类覆盖不了它；预设色则是普通类名，可以用 `ui.dot` 覆盖。
- **轴线对齐依赖 CSS subgrid**。需要 Chrome 117+、Safari 16+、Firefox 71+；更早的浏览器里各节点的列宽会各自计算，时间戳长短不一时轴线会错位。
