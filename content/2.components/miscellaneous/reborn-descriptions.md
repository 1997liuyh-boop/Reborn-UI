---
title: Descriptions 描述列表
description: 成组展示只读字段的键值对排版件：items 数据驱动或子组件声明式，支持边框底色、水平/垂直布局、按容器宽度响应的列数与跨列，仅 web 端。
category: 数据展示
platform: web
tags: [css, tailwind, descriptions, detail]
---

::ComponentViewer{demoFile="RebornDescriptionsDemo.vue" config="RebornDescriptionsConfig" componentId="reborn-descriptions" :componentFiles='["RebornDescriptions.vue", "reborn-descriptions.config.ts"]'}
::

## 简介

Descriptions 把一组「字段名 — 字段值」渲染成一张对齐的表格，用于订单、用户、资源等详情页里成批罗列**只读**信息。它只负责排版，不承担录入、校验与提交。仅 Web 端提供，UniApp 端没有同名组件。

数据来源与呈现形态是两条互不干扰的轴。**数据来源**二选一：`items` 传数组（字段来自接口时最省事），或在默认插槽里写 `RebornDescriptionsItem` 子组件（值里要塞图标、状态色、链接时更直观）；两者同时存在时 `items` 优先。**呈现形态**由两个 prop 决定：`bordered` 控制标签是否独占一个带底色的单元格，`layout` 控制标签与内容是同行并排还是上下两行。四种组合各自对应不同的 DOM 结构，而不是同一套结构换皮。

密度与分栏由第三组 API 控制：`size` 决定带边框时的单元格行高（36 / 48 / 56px，无边框形态另有一套固定间距，不受 `size` 影响），`column` 决定一行放几项，`span` 决定单项吃掉几列。`column` 与 `span` 都可以写成按断点取值的对象，**判定基准是组件容器宽度而不是视口宽度**——同一个列表放进侧栏和放进主区域会得到不同列数。

### 何时使用

- 详情页、信息面板里成组罗列只读字段，数据直接来自接口数组 —— 传 `items` 即可渲染。
- 字段值需要图标、状态色、链接等富内容 —— 用 `RebornDescriptionsItem` 子组件，或给 item 写 `slot` 指向具名插槽。
- 信息区要像表格一样逐格对齐 —— 开 `bordered`，标签会独占带底色的单元格。
- 同一份信息要塞进宽窄不同的容器 —— `column` 写成 `{ xs: 1, sm: 2, lg: 3 }`，窄容器自动降列。
- 个别字段（地址、备注）明显比其他长 —— 用 `span` 占多列，或写 `'filled'` 吃掉当前行剩余部分。

### 何时不使用

- 字段需要录入、校验与提交 —— 改用 `reborn-form`，它的 `RebornFormItem` 自带标签与校验链路。
- 多条同构记录要按列横向比较 —— 描述列表没有表头概念，一项就是一个独立字段，这类数据请用原生 `<table>` 或列表渲染承载。
- 只有一两条短文本、不需要成列对齐 —— 改用 `reborn-text`，省掉整套表格结构。

## 用法

### 数据驱动与子组件写法

`items` 与默认插槽是等价的两种入口，选一种即可；两者同时存在时 `items` 优先，插槽内容被忽略。

```vue
<script setup lang="ts">
import type { DescriptionsItem } from "~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue";

const orderItems: DescriptionsItem[] = [
  { label: "订单编号", value: "RB-2024-0917-0031" },
  { label: "下单时间", value: "2024-09-17 14:32" },
  { label: "支付方式", value: "余额支付" },
  { label: "实付金额", value: "¥ 1,280.00" },
];
</script>

<template>
  <!-- 数据驱动 -->
  <RebornDescriptions
    bordered
    :column="2"
    :items="orderItems"
  />

  <!-- 子组件声明式：值里可以直接写任意节点 -->
  <RebornDescriptions
    bordered
    :column="2"
  >
    <RebornDescriptionsItem label="订单编号">RB-2024-0917-0031</RebornDescriptionsItem>
    <RebornDescriptionsItem label="支付状态">
      <span class="text-success">已支付</span>
    </RebornDescriptionsItem>
  </RebornDescriptions>
</template>
```

`items` 的元素类型为 `DescriptionsItem`：

| 字段名         | 类型                             | 默认值 | 描述                                                |
| -------------- | -------------------------------- | ------ | --------------------------------------------------- |
| `label`        | `string`                         | -      | 内容的描述，即标签文字。                            |
| `value`        | `string \| number \| null`       | -      | 标签对应的内容，`null` / `undefined` 渲染为空。      |
| `span`         | `number \| 'filled' \| object`   | `1`    | 包含列的数量，写法同下方「跨列与铺满」。            |
| `colon`        | `boolean`                        | -      | 单独覆盖本项的冒号显隐，不传时跟随父级 `colon`。    |
| `labelClass`   | `string`                         | -      | 追加到本项标签节点的类名。                          |
| `contentClass` | `string`                         | -      | 追加到本项内容节点的类名。                          |
| `slot`         | `string`                         | -      | 内容改由具名插槽 `content-{slot}` 渲染。            |
| `labelSlot`    | `string`                         | -      | 标签改由具名插槽 `label-{labelSlot}` 渲染。         |

用 `items` 又想让某一项渲染富内容时，给它写 `slot`，再在模板里补一个同名具名插槽——数据仍然集中在数组里，只有需要自定义的那一项走插槽：

```vue
<script setup lang="ts">
const serviceItems = [
  { label: "服务名称", value: "reborn-gateway" },
  { label: "运行状态", slot: "status" },
];
</script>

<template>
  <RebornDescriptions
    bordered
    :items="serviceItems"
  >
    <template #content-status>
      <span class="text-success">运行中</span>
    </template>
  </RebornDescriptions>
</template>
```

具名插槽的作用域参数为 `{ item }`，即当前项的数据对象，额外带一个已解析好的 `colSpan`（该项实际占用的列数）。

`RebornDescriptionsItem` 自身可用的属性是 `items` 字段的子集（不含 `value` / `slot` / `labelSlot`，这三者在子组件写法下由插槽内容取代）：

| 属性名         | 类型                           | 默认值 | 描述                                             |
| -------------- | ------------------------------ | ------ | ------------------------------------------------ |
| `label`        | `string`                       | -      | 标签文字；富内容改用 `label` 插槽。              |
| `span`         | `number \| 'filled' \| object` | `1`    | 包含列的数量。                                   |
| `colon`        | `boolean`                      | -      | 单独覆盖本项的冒号显隐。                         |
| `labelClass`   | `string`                       | -      | 追加到本项标签节点的类名。                       |
| `contentClass` | `string`                       | -      | 追加到本项内容节点的类名。                       |

它有 `default`（内容）与 `label`（标签）两个插槽。该子组件自身不产出任何 DOM：父级需要把所有项统一编排进同一张 `<table>` 才能对齐列宽与边线，因此它只作声明用，父级直接读取它的 props 与插槽函数来渲染。

### 边框与底色

`bordered` 默认关闭，此时标签与内容挤在同一个单元格里、靠冒号分隔，整体没有边线，适合嵌在卡片内部的轻量信息区。开启后标签独占一格并填上 `bg-gray-2` 底色，单元格之间补 `border-gray-3` 网格线，外框是直角不带圆角，适合需要逐格对齐的详情页。

```vue
<template>
  <!-- 无边框：标签与内容同格，冒号承担分隔职责 -->
  <RebornDescriptions
    :column="2"
    :items="orderItems"
  />

  <!-- 有边框：标签独占带底色的单元格 -->
  <RebornDescriptions
    bordered
    :column="2"
    :items="orderItems"
  />
</template>
```

这两种形态的 DOM 结构不同：无边框时一项 = 一个 `<td>`（内含标签与内容两个 flex 子项），有边框时一项 = 标签 `<td>` + 内容 `<td>`。冒号只在无边框的水平布局下渲染，理由见「注意事项」。

两种形态的**间距与配色也各是一套**，不是同一套换皮。带边框时行高由 `size` 给（36 / 48 / 56px），标签用 `gray-9`、内容用 `gray-8`。无边框时没有网格线和底色作边界，层级改由留白与轻重对比承担：标签与内容之间 4px、项与项之间 16px，这两个值固定，不随 `size` 变化（`size` 在该形态下完全不生效）；配色同时反转成标签 `gray-7`、内容 `gray-9`，与带边框时正好相反，理由见「注意事项」。

### 布局与列数

`layout` 决定标签与内容是同行还是上下两行。`vertical` 下每个数据行会产出两个 `<tr>`：上面一行放全部标签，下面一行放对应内容，两行共用同一套跨列，因此列始终对齐。

`column` 决定一行放几项。写成数字是固定列数；写成对象则按断点取值，未命中的档位向下回退（例如 `{ xs: 1, lg: 3 }` 在 `sm`、`md` 区间仍取 `1`）。

```vue
<template>
  <!-- 垂直布局 -->
  <RebornDescriptions
    bordered
    layout="vertical"
    :column="3"
    :items="orderItems"
  />

  <!-- 响应式列数：窄容器 1 列，中等 2 列，宽容器 3 列 -->
  <RebornDescriptions
    bordered
    :column="{ xs: 1, sm: 2, lg: 3 }"
    :items="responsiveItems"
  />
</template>
```

断点阈值与 Tailwind 默认值一致：`xs` 0 / `sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536（单位 px）。比对的是**组件自身容器的宽度**，不是视口宽度——同一份参数，放进 360px 的侧栏会降到 1 列，放进撑满的主区域则按实际宽度取档。

### 跨列与铺满

`span` 控制单项占几列。传数字时占固定列数，超过当前行剩余列会先换行再排；传 `'filled'` 表示吃掉当前行剩下的所有列，并强制其后的项换到下一行。`span` 同样支持按断点取值的对象写法。

```vue
<script setup lang="ts">
const spanItems = [
  { label: "商品", value: "机械键盘 87 键" },
  { label: "数量", value: 2 },
  { label: "规格", value: "白光 / 茶轴 / 有线", span: 2 },
  { label: "备注", value: "买家留言：请在工作日送达。", span: "filled" },
];
</script>

<template>
  <RebornDescriptions
    bordered
    :column="3"
    :items="spanItems"
  />
</template>
```

需要注意的是，**每一行的末项都会自动延伸补齐剩余列**，否则带边框时会缺格、边线断在半路。这意味着写在最后一项上的 `'filled'` 与不写没有区别；它的真正用途是写在**非末项**上，用来强行把后续内容挤到下一行。

### 标题与操作区

`title` 渲染在最顶部，`extra` 渲染在右上方，两者都有同名插槽用于放置富内容。插槽优先于属性。

```vue
<template>
  <RebornDescriptions
    bordered
    :column="2"
    :items="orderItems"
  >
    <template #title>
      <span class="inline-flex items-center gap-[8px]">
        <Icon
          name="lucide:receipt-text"
          class="text-primary"
          size="20"
        />
        订单详情
      </span>
    </template>
    <template #extra>
      <RebornButton
        size="sm"
        variant="outlined"
        color="neutral"
        >导出</RebornButton
      >
    </template>
  </RebornDescriptions>
</template>
```

`title` 与 `extra` 全为空时整个头部不渲染，不会留下空白间距。

## API

### Props

| 属性名         | 类型                                                                                  | 默认值         | 描述                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `title`        | `string`                                                                              | -              | 描述列表的标题，显示在最顶部；富内容改用同名插槽。                                      |
| `extra`        | `string`                                                                              | -              | 描述列表的操作区域，显示在右上方；富内容改用同名插槽。                                  |
| `bordered`     | `boolean`                                                                             | `false`        | 是否展示边框。开启后标签独占单元格并填 `bg-gray-2` 底色。                               |
| `colon`        | `boolean`                                                                             | `true`         | 是否显示 label 后面的冒号，可被单项的 `colon` 覆盖；仅「无边框 + 水平」下渲染。         |
| `column`       | `number \| Partial<Record<'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl', number>>`     | `3`            | 一行的项数。对象写法按组件容器宽度取值，未命中的档位向下回退。                          |
| `layout`       | `'horizontal' \| 'vertical'`                                                          | `'horizontal'` | 描述布局。水平为标签内容同行，垂直为标签行在上、内容行在下。                            |
| `size`         | `'sm' \| 'md' \| 'lg'`                                                                | `'md'`         | 列表的大小，对应单元格行高 36 / 48 / 56px 与上下内边距，**仅在 `bordered` 下生效**；左右内边距固定 16px。 |
| `items`        | `DescriptionsItem[]`                                                                  | -              | 描述列表项内容，与默认插槽二选一；同时存在时本项优先。                                  |
| `labelWidth`   | `string`                                                                              | -              | 标签单元格的最小宽度，如 `'120px'`。                                                    |
| `labelAlign`   | `'left' \| 'center' \| 'right'`                                                       | `'left'`       | 标签水平对齐；在「无边框 + 水平」下需配合 `labelWidth` 才可见。                         |
| `contentAlign` | `'left' \| 'center' \| 'right'`                                                       | `'left'`       | 内容水平对齐；在「无边框 + 水平」下不生效。                                             |
| `class`        | `any`                                                                                 | -              | 追加到根元素的自定义类名。                                                              |
| `ui`           | `object`                                                                              | -              | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                            |

### Slots

| 插槽名    | 作用域参数 | 描述                                                       |
| --------- | ---------- | ---------------------------------------------------------- |
| `title`   | -          | 标题区内容，优先于 `title` 属性。                          |
| `extra`   | -          | 右上方操作区内容，优先于 `extra` 属性。                    |
| `default` | -          | 放置 `RebornDescriptionsItem` 子组件；传了 `items` 时忽略。 |

除上述固定插槽外，组件还接受一组**动态具名插槽**：`content-{name}` 与 `label-{name}`，分别由 item 的 `slot`、`labelSlot` 字段指向，作用域参数均为 `{ item }`。它们的名字由数据决定，因此不作为固定成员列出，用法见「数据驱动与子组件写法」。

### 自定义样式（ui）

`ui` 按内部结构键**追加**类名（与默认类合并，不是整段替换）。

| 键名           | 说明                                                        |
| -------------- | ----------------------------------------------------------- |
| `root`         | 最外层容器，也是响应式列数的测量对象。                      |
| `header`       | 标题 + 操作区整行；`title` 与 `extra` 都为空时不渲染。      |
| `titleWrapper` | 标题包裹容器。                                              |
| `title`        | 标题文字，默认 24px / 字重 500。                            |
| `extra`        | 右上角操作区。                                              |
| `tableWrapper` | 表格外层，`bordered` 的外框挂在这里；需要圆角时在这里补。   |
| `body`         | `<table>` 本体。                                            |
| `cell`         | 全部单元格共用的类，左右内边距、以及 `bordered` 下 `size` 的行高挂在这里。 |
| `label`        | 标签节点（带边框时是 `<td>`，无边框水平时是内层 `<span>`）。 |
| `content`      | 内容节点，位置规则同 `label`。                              |
| `colon`        | 标签后的冒号。                                              |

```vue
<template>
  <RebornDescriptions
    :items="items"
    :ui="{ root: 'shadow-sm', title: 'text-primary', content: 'font-mono' }"
  />
</template>
```

### CSS 变量

组件不自带专属 CSS 变量，配色全部取自 `app/assets/theme/base.css` 里的共享设计令牌。需要整体改色时覆盖这些令牌，或用 `ui` / `class` 针对单个节点改写。

| 变量名           | 用在哪里                                             | 浅色      | 深色      |
| ---------------- | ---------------------------------------------------- | --------- | --------- |
| `--color-gray-2` | `bordered` 下标签单元格的底色                        | `#f2f3f5` | `#2e2e30` |
| `--color-gray-3` | 表格外框与单元格之间的分隔线                         | `#e5e6eb` | `#484849` |
| `--color-gray-7` | 无边框时的标签文字与冒号                             | `#6b7785` | `#ababac` |
| `--color-gray-8` | `bordered` 时的内容文字                              | `#4e5969` | `#c5c5c5` |
| `--color-gray-9` | 标题；`bordered` 时的标签文字，无边框时的内容文字    | `#272e3b` | `#dfdfdf` |

gray 色阶是会随主题反转的语义色阶，因此组件里不写任何 `dark:` 变体，深色模式由令牌自身切换完成。

## 注意事项

- **本版本对旧 API 做了破坏性重写**。`border`、`direction`、`responsive`、`rounded`、`labelBackground`、`contentBackground`、`labelColor`、`contentColor`、`labelBold`、`contentBold`、`labelLineHeight`、`contentLineHeight` 全部移除。对应迁移：`border="bordered"` → `bordered`，`direction` → `layout`，`responsive` → 把 `column` 写成断点对象；配色与字重类的覆盖统一改走 `ui` 或 `class`，组件不再接受 CSS 颜色值字符串。
- **冒号只在「无边框 + 水平」下渲染**。带边框时标签已经有底色单元格作边界，垂直布局时标签独占一行，此时再加冒号是重复表达，因此 `colon` 会被静默忽略——不是失效，是该形态下本就不该出现。
- **每一行的末项都会自动延伸补齐剩余列**。不补齐的话带边框时会缺格、边线断在半路。副作用是写在最后一项上的 `span: 'filled'` 没有可观察的效果，它只有写在非末项上才有意义。
- **响应式断点比对的是组件容器宽度，不是视口宽度**。组件用 `ResizeObserver` 观测根元素，并在挂载时主动量一次兜底（`ResizeObserver` 的回调挂在浏览器渲染步骤上，页面不可见时不会派发）。因此同一份 `column` 参数在侧栏和主区域会得到不同列数，这是刻意的；需要固定列数就把 `column` 写成数字。
- **`labelAlign` / `contentAlign` 在「无边框 + 水平」下几乎不可见**。该形态里标签与内容是同一单元格内的两个 flex 子项，宽度被内容撑满，`text-align` 没有可分配的余量；只有同时设了 `labelWidth` 且它大于标签文字宽度时，`labelAlign` 才会显现。开 `bordered` 或切 `vertical` 后两者都正常生效。
- **`size` 只在 `bordered` 下生效**。它改的是单元格行高（36 / 48 / 56px）与上下内边距；标题固定 24px / 字重 500、左右内边距固定 16px，都不随 `size` 变化。无边框形态完全不吃这套值：那里没有网格线，层级靠留白撑，行距是固定的 4px（标签与内容之间）与 16px（项与项之间），套上 48px 行高会把这两个间距淹掉。行高是通过 `<td>` 上的 `h-*` 实现的，而表格单元格的 `height` 实际按**最小高度**生效，因此内容换行时该行会照常撑开，测到的高度大于档位值属正常。
- **标签与内容的轻重关系随 `bordered` 反转**。带边框时标签 `gray-9`、内容 `gray-8`，标签比内容重：那一形态里标签被底色单元格圈起来，用户是靠字段名逐格定位的，检索锚点该更醒目。无边框时既没有底色也没有边线，分层只剩配色，于是反过来——标签退到 `gray-7`、内容提到 `gray-9`，让视线直接落在值上。两种形态下标签的字重都是 500。需要另一套关系时用 `ui.label` / `ui.content` 覆盖。
