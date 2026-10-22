---
title: Table 表格
description: Web 数据表格：支持声明列、固定与分组表头、行选择、排序筛选、远程分页、树形数据及合并合计。
category: 数据展示
platform: web
tags: [vue, css, tailwind, table, data]
badge: New
---

::ComponentViewer{demoFile="RebornTableDemo.vue" config="RebornTableConfig" componentId="reborn-table" :componentFiles='["RebornTable.vue", "RebornTableColumn.vue", "table.types.ts", "reborn-table.config.ts"]' :uniappFiles='[]'}
::

## 简介

Table 用于按列比较结构化数据，当前仅提供 Web 实现，没有同名同构的 UniApp 版本；`RebornTable` 负责数据与状态，`RebornTableColumn` 负责声明列。

`data` 决定行数据，`columns` 或默认插槽中的声明列决定列结构；两种列入口不合并，显式传入 `columns` 时优先使用它。`size` 决定行高，`border`、`stripe`、`headerBackground` 与 `hover` 独立控制边界、交替底色、表头与悬停背景。

行选择、当前行、展开、页码与每页条数分别通过具名 `v-model` 控制；列配置负责排序、筛选、固定与分组，`type: 'drag'` 列提供行拖拽排序（结果经 `row-drag-end` 交回调用方），`remote` 将数据处理交给调用方。`spanMethod` / `summaryMethod` 负责合并与合计，`lazy` / `load` 支持按需获取树子行，`showOverflowTooltip` 与提示插槽处理截断内容；作用域插槽负责单元格、详情、空态、加载与页脚，公开实例方法用于清除状态和调整滚动位置。

### 何时使用

- 需要逐行比较订单、人员或报销明细 —— 用 `data` + `columns`，或以 `RebornTableColumn` 声明列。
- 宽表、长表需要保留上下文 —— 用 `height` / `maxHeight` 固定表头，列上配置 `fixed` 与确定的 `width`。
- 需要批量操作或单选记录 —— 用列 `type="selection"` / `type="radio"` + `selectedKeys`；点击行高亮则用 `highlightCurrentRow` + `currentRowKey`。
- 数据由接口分页查询 —— 用 `remote` + `pagination.total`，监听 `change` 统一发起排序、筛选和分页请求。
- 有部门层级、明细展开或金额汇总 —— 用 `treeProps` / `expandedRowKeys`、`showSummary` 与 `summaryMethod`。
- 需要用户手动调整记录顺序（优先级、展示顺序）—— 加一列 `type: 'drag'`，在 `row-drag-end` 里回写 `data`。

### 何时不使用

- 仅展示一条记录的字段和值 —— 改用 `reborn-descriptions`。
- 仅浏览或选择层级节点，不需要多列对比 —— 改用 `reborn-tree` 或 `reborn-tree-select`。
- 需要海量数据虚拟滚动、电子表格式编辑、拖拽列宽、跨表 / 跨层级拖拽或 UniApp 表格 —— 本库此组件暂无对应能力，需自行实现或选择支持这些能力的表格库。

## 用法

### 基础表格

`data` 默认空数组，字段使用 `prop` / `label`；传入 `columns` 后不再解析声明列，即使传的是空数组也不会回退。

| 列入口 | 渲染契约 | 典型用途 |
| --- | --- | --- |
| `columns` | `TableColumn[]`，`prop` 支持 `user.name` 这样的字段路径 | 根据权限、服务端配置动态生成列 |
| `RebornTableColumn` | 放在表格默认插槽中，列的默认插槽接收当前行 | 模板中组合按钮、图标和业务内容 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = [{ id: 1, name: '林晓', amount: 1280 }]
const columns = [{ prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" row-key="id" aria-label="报销明细" />
</template>
```

声明列可直接格式化单元格，不要同时传 `columns`：

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornTableColumn from '~/components/reborn/ui/reborn-table/RebornTableColumn.vue'
const data = [{ id: 1, name: '林晓', amount: 1280 }]
</script>
<template>
  <RebornTable :data="data" aria-label="报销明细">
    <RebornTableColumn prop="name" label="姓名" />
    <RebornTableColumn prop="amount" label="金额" align="right">
      <template #default="{ row }">¥{{ Number(row.amount).toFixed(2) }}</template>
    </RebornTableColumn>
  </RebornTable>
</template>
```

**本地分页**

`pagination` 默认 `false`，开启后本地按「筛选 → 排序 → 分页」处理，`currentPage` 默认 1，`pageSize` 默认 10。

| 模式 | `data` / 总数 | 典型用途 |
| --- | --- | --- |
| 本地 | 传全部数据，由组件计算筛选后的总数并分页 | 小型完整数据集 |
| `remote` | 传当前页数据，使用 `pagination.total` 指定接口总数 | 服务端排序、筛选和分页 |

`pagination` 对象还支持 `layout`、`pageSizes`、`background` 与 `hideOnSinglePage`。`change` 的 `action` 为 `'sort'` / `'filter'` / `'paginate'`，同时携带 `page`、`pageSize`、`sort` 与 `filters`。

远程模式下，`pagination.total` 减少导致当前页越界时，组件会自动将 `currentPage` 钳制到有效页码，并发出 `page-change` 与 `change`（`action: 'paginate'`），通知调用方重新请求该页；仍只需在 `change` 中发起请求，避免重复调用接口。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const page = ref(1), pageSize = ref(3)
const data = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `记录 ${i + 1}` }))
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable v-model:current-page="page" v-model:page-size="pageSize"
    :data="data" :columns="columns" :pagination="{ pageSizes: [3, 5, 10] }" />
</template>
```

### 带斑马纹表格

`stripe` 默认关闭，开启后交替行使用 `bg-gray-2`；悬停和勾选行也使用同一灰阶，不替代当前行高亮。

| 配置 | 外观 | 典型用途 |
| --- | --- | --- |
| `stripe=false` | 无交替底色 | 短列表 |
| `stripe=true` | 隔行使用灰阶 2 | 长行横向阅读 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = [{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }]
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" stripe />
</template>
```

### 带边框表格

`size` 默认 `md`；表头和内容均使用 `text-base font-medium text-gray-9`，沿用 14px 字号、22px 行高与 500 字重，不另叠 `leading-*`。

| `size` | 单行高度 | 典型用途 |
| --- | --- | --- |
| `lg` | 56px | 留出操作空间的业务列表 |
| `md` | 48px | 默认明细与管理页面 |
| `sm` | 36px | 紧凑的只读报表 |

| 外观参数 | 默认行为 | 典型用途 |
| --- | --- | --- |
| `border` | `false`，开启外框与纵向分隔线，使用灰阶 3 | 列较多、需要明确列边界 |
| `stripe` | `false`，开启交替行底色 | 长行横向阅读 |
| `headerBackground` | `false`，开启灰阶 2 表头背景 | 强调表头与表体分区 |
| `hover` | `true`，整行悬停背景为灰阶 2 | 跟踪当前阅读的行 |
| `showHeader` | `true`，设为 `false` 隐藏表头 | 外部已提供列说明的嵌入展示 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = [{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }]
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" size="sm" border header-background />
</template>
```

多行文本或较高的插槽内容可以撑高行，尺寸档位不是内容裁切上限。

### 带状态表格

`row-class-name`（脚本名 `rowClassName`）为某一行添加类名，自定义每行样式；回调返回空类名时保留默认样式。下面只为陈晨添加警告色、周宁添加成功色，其余行不着色，状态列仍保留中文文字。`loading` 控制加载遮罩，不是业务审核状态。

| 入口 | 行为 | 典型用途 |
| --- | --- | --- |
| `rowClassName` | 返回行级 Tailwind 类名 | 区分成功、待审核等业务结果 |
| `cellClassName` | 按单元格作用域返回类名 | 强调异常金额等单个字段 |
| `loading` | 覆盖表体并禁用内置操作 | 请求尚未完成 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableProps } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, name: '林晓', status: '已确认' }, { id: 2, name: '陈晨', status: '待审核' }, { id: 3, name: '周宁', status: '已确认' }, { id: 4, name: '许青', status: '待审核' }]
const columns = [{ prop: 'name', label: '姓名' }, { prop: 'status', label: '状态' }]
const rowClassName: TableProps['rowClassName'] = ({ row }) => row.id === 2 ? 'bg-warning-2' : row.id === 3 ? 'bg-success-2' : ''
</script>
<template>
  <RebornTable :data="data" :columns="columns" :row-class-name="rowClassName" :hover="false" />
</template>
```

`loading` 默认 `false`，开启后覆盖表体并禁用内置操作；`emptyText` 默认「暂无数据」，可用插槽替换这两类内容。

| 入口 | 默认行为 | 典型用途 |
| --- | --- | --- |
| `loading` / `loading` 插槽 | 加载遮罩覆盖表体 | 接口刷新期间防止重复操作 |
| `emptyText` | 无数据时展示文本 | 简单空列表 |
| `empty` 插槽 | 替换空态内容 | 带解释与重试按钮的空态 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable :data="[]" :columns="columns" :loading="false" :height="200">
    <template #empty><p class="p-6 text-base text-gray-9">没有符合条件的记录，请调整筛选。</p></template>
    <template #loading><p role="status">正在读取记录…</p></template>
  </RebornTable>
</template>
```

### 显示溢出工具提示的表格

表级 `showOverflowTooltip` 默认 `false`；开启后普通列省略溢出文本，并在真实溢出时复用 `RebornTooltip`，鼠标悬停和键盘聚焦均可触发，不再使用原生 `title`。

| 配置 | 作用范围 | 典型用途 |
| --- | --- | --- |
| 表级 `true` / 选项对象 | 普通列的默认设置 | 多个长文本字段 |
| 列级 `true` / 选项对象 | 为该列开启或定制提示 | 仅备注列需要提示 |
| 列级 `false` | 覆盖表级开启设置 | 保留该列完整内容 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = [{ id: 1, name: '林晓', email: 'reimbursement-review-team@example.company.com', department: '研发', amount: 1280, status: '已确认', note: '本次报销包含异地交通、连续三晚住宿及跨部门会议费用，请逐项核对项目编号、发票抬头、出行日期、费用归属和收款账户。原始票据及审批记录已随申请提交，金额存在差异时请先联系申请人补齐凭证，再由财务确认入账，避免重复报销。' }]
const columns = [{ prop: 'name', label: '姓名', width: 100 }, { prop: 'department', label: '部门', width: 120 }, { prop: 'email', label: '联系邮箱', width: 240 }, { prop: 'note', label: '说明', width: 280 }, { prop: 'amount', label: '金额', width: 140 }, { prop: 'status', label: '状态', width: 140, showOverflowTooltip: false }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" show-overflow-tooltip />
</template>
```

::tip
此例直接占满容器，不靠外层限宽制造溢出；多列列宽与长说明让正常页面宽度下仍有截断。提示判断基于单元格实际显示内容；插槽与 `formatter` 产生的文本也参与判断。短文本不会因为传入选项就弹出。`tableLayout="auto"` 时内容可能撑宽列，因此不保证省略号或提示出现。
::

### 固定表头

`fixedHeader` 默认 `true`，但仅在设置 `height` 或 `maxHeight` 时固定；`false` 可禁用，`showHeader=false` 则完全不渲染表头。

固定表头时纵向轨道从表头底部开始，只占表体，不覆盖表头；关闭固定表头或不显示表头时，轨道恢复整个滚动区高度。轨道范围由组件根据实际表头高度计算，不需要额外配置。

| 配置 | 滚动行为 | 典型用途 |
| --- | --- | --- |
| `height` + `fixedHeader=true` | 表头停在滚动区顶部 | 固定高度的业务列表 |
| `height` + `fixedHeader=false` | 表头随内容滚动 | 不需要固定上下文 |
| 不传高度约束 | 不固定表头 | 页面自然文档流 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `记录 ${i + 1}` }))
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" :height="220" :fixed-header="true" header-background />
</template>
```

### 固定列

列的 `fixed` 与高度约束独立；指定明确的 `width` 后，固定区域按叶子列宽计算偏移。

| `fixed` | 位置 | 典型用途 |
| --- | --- | --- |
| `false` / 未传 | 随内容滚动 | 中间数据列 |
| `true` / `'left'` | 左侧 | 姓名、主标识或选择列 |
| `'right'` | 右侧 | 金额、操作列 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, name: '林晓', note: '横向滚动后姓名和金额仍然可见', amount: 1280 }]
const columns: TableColumn[] = [
  { prop: 'name', label: '姓名', width: 120, fixed: 'left' },
  { prop: 'note', label: '说明', width: 900 },
  { prop: 'amount', label: '金额', width: 120, fixed: 'right' },
]
</script>
<template>
  <RebornTable :data="data" :columns="columns" border />
</template>
```

列宽总和大于可用宽度时才出现横向滚动；固定单元格应保留不透明背景，避免滚动内容透出。演示页提供姓名、部门、邮箱、城市、报销单号、所属项目、费用类型、提交日期、审核状态、金额十列，每列都有实际字段；姓名固定左侧，金额固定右侧。

### 固定列和表头

`height` 与列 `fixed` 可以组合，表格实例的 `scrollTo` 接受两轴位置，用一次调用同时平滑回到左上角。

| 调用 | 行为 | 典型用途 |
| --- | --- | --- |
| `scrollTo({ top, left })` | 默认 `behavior: 'auto'`，立即定位 | 初始位置或外部跳转 |
| `scrollTo({ top, left, behavior: 'smooth', duration })` | 同一动画协调两轴，返回 `Promise<void>`；`duration` 单位 ms，可省略 | 用户点击复位按钮 |
| `setScrollTop(value)` / `setScrollLeft(value)` | 保留原有立即定位行为，单位 px | 只调整一个方向 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn, TableExpose } from '~/components/reborn/ui/reborn-table/table.types'
const table = ref<TableExpose>()
const data = Array.from({ length: 12 }, (_, i) => ({ id: i, name: '记录 ' + (i + 1), note: '左右与上下滚动后可复位' }))
const columns: TableColumn[] = [{ prop: 'name', label: '姓名', width: 120, fixed: 'left' }, { prop: 'note', label: '说明', width: 900 }]
</script>
<template>
  <RebornButton size="sm" variant="outlined" @click="table?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })">回到左上角</RebornButton>
  <RebornTable ref="table" :data="data" :columns="columns" :height="240" border />
</template>
```

### 流体高度

`maxHeight` 不设置固定高度；数据少时表格自然收缩，超过上限才滚动。数字单位为 px，字符串按 CSS 尺寸处理。

| 高度入口 | 行为 | 典型用途 |
| --- | --- | --- |
| `height` | 固定滚动区高度 | 页面已分配空间 |
| `maxHeight` | 只限制上限 | 少量记录不留大块空白 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const expanded = ref(false)
const data = Array.from({ length: 8 }, (_, i) => ({ id: i, name: '记录 ' + (i + 1) }))
const columns = [{ prop: 'name', label: '姓名' }]
</script>
<template>
  <button type="button" class="mb-3 rounded-lg border border-gray-3 px-3 py-1" @click="expanded = !expanded">切换数据量</button>
  <RebornTable :data="expanded ? data : data.slice(0, 2)" :columns="columns" :max-height="220" />
</template>
```

### 多级表头

`columns[].children` 表示列分组，不是行的树节点；声明列把子列写进父列的默认插槽即可。

| 写法 | 分组结构 | 典型用途 |
| --- | --- | --- |
| 列 `children` | 父列提供 `label`，叶子列提供 `prop` | 程序生成多级表头 |
| 嵌套 `RebornTableColumn` | 父列默认插槽中放子列 | 业务模板中直观组织层级 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornTableColumn from '~/components/reborn/ui/reborn-table/RebornTableColumn.vue'
const data = [{ id: 1, name: '林晓', department: '研发', city: '杭州' }]
</script>
<template>
  <RebornTable :data="data" border>
    <RebornTableColumn prop="name" label="姓名" />
    <RebornTableColumn label="组织信息" header-align="center">
      <RebornTableColumn prop="department" label="部门" />
      <RebornTableColumn prop="city" label="城市" />
    </RebornTableColumn>
  </RebornTable>
</template>
```

### 单选

`type: 'radio'` 使用 `selectedKeys` 数组保存最多一个键；`currentRowKey` 与 `highlightCurrentRow` 原本是独立的当前行高亮机制。本示例仅在调用方使用一个 `radioCurrentKey`，通过双向计算属性映射为 `radioKeys` 数组，关联两种状态：点击单选按钮同步行高亮，点击行同步单选，外部设置、清空和键盘选择也保持一致。

| 状态 | 模型 / 外观 | 典型用途 |
| --- | --- | --- |
| 显示单选列 | `selectedKeys` 映射当前键，当前行使用 `bg-brand-2` | 单选按钮、行点击与键盘联动 |
| 隐藏单选列 | 仅从 `columns` 移除 `radio` 列，保留两个模型 | 无单选按钮的行选择 |
| 不关联模型 | 组件原本的独立行为不变 | 选择目标与当前浏览行分别维护 |

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn, TableKey } from '~/components/reborn/ui/reborn-table/table.types'
const radioCurrentKey = ref<TableKey>(), showRadio = ref(true)
const radioKeys = computed<TableKey[]>({ get: () => radioCurrentKey.value === undefined ? [] : [radioCurrentKey.value], set: keys => { radioCurrentKey.value = keys[0] } })
const data = [{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }]
const radioColumns = computed<TableColumn[]>(() => [...(showRadio.value ? [{ type: 'radio' as const, width: 48 }] : []), { prop: 'name', label: '姓名' }])
</script>
<template>
  <RebornSwitch v-model="showRadio" active-label="显示单选列" />
  <RebornTable v-model:selected-keys="radioKeys" v-model:current-row-key="radioCurrentKey" :data="data" :columns="radioColumns" highlight-current-row />
</template>
```

外部设置 `radioCurrentKey` 即同步两种状态；设为 `undefined` 同时清空。隐藏单选列不清除当前键，再次显示会还原按钮选中态。此关联只属于本示例，不是新增 Table prop，也不改变其他示例的独立模型。当前行品牌二阶 `bg-brand-2` 等价于设计中的 `bg-color-2`，悬停时保留该高亮；普通悬停、勾选和斑马纹使用 `bg-gray-2`。

### 多选

`selectedKeys` 默认 `[]`，`currentRowKey` 默认 `undefined`；多选通过 `type: 'selection'` 开启；`selectable` 限制可选行，`reserveSelection` 保留跨数据选择。

`selection` 列的表头全选框与行复选框均水平、垂直居中，左右内边距为 8px；普通列仍由 `align` / `headerAlign` 控制对齐。

演示使用独立的两批数据，每批八条、行键跨批唯一；切换批次后仍可读取已选行或清空全部选择，待审核行始终禁选。这份扩容数据不用于合并或分页示例。

当前行高亮使用品牌二阶 `bg-brand-2`（设计中的 `bg-color-2`），悬停时保留该底色；勾选行与普通悬停仍使用 `bg-gray-2`，两种状态互相独立。

| 列类型 / 配置 | 状态入口 | 典型用途 |
| --- | --- | --- |
| `type: 'selection'` | `v-model:selected-keys`，支持表头全选 | 批量处理记录 |
| `type: 'radio'` | `v-model:selected-keys`，最多保留一个键 | 仅选一条目标记录 |
| `selectable` | `(row, index) => boolean`，用于选择列 | 禁止选择不满足条件的记录 |
| `reserveSelection` | 数据替换时保留选中键，默认不开启 | 远程翻页后仍保留批量选择 |
| `highlightCurrentRow` | 点击行更新当前行并高亮，默认关闭 | 点击整行查看侧栏详情 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn, TableKey } from '~/components/reborn/ui/reborn-table/table.types'
const selectedKeys = ref<TableKey[]>([])
const batch = ref(0)
const batches = [0, 1].map(group => Array.from({ length: 8 }, (_, i) => ({ id: group * 8 + i, name: `记录 ${group * 8 + i + 1}`, enabled: i % 3 !== 1 })))
const columns: TableColumn[] = [{ type: 'selection', reserveSelection: true, selectable: row => row.enabled === true }, { prop: 'name', label: '姓名' }]
</script>
<template>
  <button type="button" @click="batch = batch === 0 ? 1 : 0">切换批次</button>
  <RebornTable v-model:selected-keys="selectedKeys" :data="batches[batch]" :columns="columns" row-key="id" />
  <p>已选键：{{ selectedKeys }}</p>
</template>
```

::warning
跨数据选择必须使用稳定且唯一的 `rowKey`，不能用随分页变化的数组索引。`reserveSelection` 配在选择列上，不是表格的 prop；`selection-change` 返回行对象，`selectedKeys` 保存行键。
::

### 排序

`sortable` 默认关闭，`defaultSort` 只提供初始排序，`sortMethod` 可保证金额按数值比较。

| 配置 | 数据处理方式 | 典型用途 |
| --- | --- | --- |
| `sortable: true` | 本地排序 | 已取得完整数据 |
| `sortable: 'custom'` | 仅发出排序事件 | 该列排序交给接口 |
| `sortOrders` | `'ascending'` / `'descending'` / `null` 的切换周期 | 限定允许方向 |
| `remote` | 排序、筛选、分页均不在本地执行 | 服务端查询 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, name: '林晓', amount: 1280 }, { id: 2, name: '陈晨', amount: 960 }]
const columns: TableColumn[] = [{ prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额', sortable: true, sortMethod: (a, b) => Number(a.amount) - Number(b.amount) }]
</script>
<template>
  <RebornTable :data="data" :columns="columns" :default-sort="{ prop: 'amount', order: 'ascending' }" />
</template>
```

**远程排序、筛选与分页**

`remote` 模式传接口当前页与 `pagination.total`；只在 `change` 中请求，避免再监听专项事件产生重复调用。演示保留 350ms 异步查询、金额排序、部门筛选、loading 与取消旧定时器；组件本身不发网络请求。

下面用异步函数模拟仅分页的接口。完整的部门筛选、金额排序、加载遮罩与过期请求取消见本页 Demo 的远程示例。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableChange } from '~/components/reborn/ui/reborn-table/table.types'
const source = Array.from({ length: 12 }, (_, i) => ({ id: i, name: `记录 ${i + 1}` }))
const data = ref(source.slice(0, 3)), page = ref(1), pageSize = ref(3)
const columns = [{ prop: 'name', label: '姓名' }]
async function request(query: TableChange) {
  data.value = await Promise.resolve(source.slice((query.page - 1) * query.pageSize, query.page * query.pageSize))
}
</script>
<template>
  <RebornTable v-model:current-page="page" v-model:page-size="pageSize" :data="data" :columns="columns"
    remote :pagination="{ total: source.length, pageSizes: [3, 5, 10] }" @change="request" />
</template>
```

::warning
`remote` 不在本地分页、排序或筛选，也不会自动请求接口。调用方必须回填当前页、总数与加载状态；只监听一次 `change` 即可，不要再用三个专项事件重复请求。
::

### 拖拽排序

加一列 `type: 'drag'` 即在每行渲染拖拽手柄。表格不改动 `data`：松手后派发 `row-drag-end`，回调里的 `data` 已是移动后的新数组，回写即完成排序。

| 操作 | 方式 | 典型用途 |
| --- | --- | --- |
| 按住手柄拖动 | 指针越过同级行的中线即换位，主题色指示线标出落点；拖到滚动区上下边缘自动滚动，`Esc` 取消 | 鼠标、触屏调整顺序 |
| 聚焦手柄按 `↑` / `↓` | 与上一个 / 下一个同级行交换位置，焦点留在手柄上 | 键盘操作、无障碍 |
| 树形数据 | 只能在同一父行的子行之间移动，展开的子行跟随父行一起移动 | 调整同级分类顺序 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn, TableRow, TableRowDragEnd } from '~/components/reborn/ui/reborn-table/table.types'
const data = ref<TableRow[]>([{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }, { id: 3, name: '周宁' }])
const columns: TableColumn[] = [{ type: 'drag', width: 48 }, { prop: 'name', label: '姓名' }]
function onRowDragEnd(payload: TableRowDragEnd) {
  data.value = payload.data
}
</script>
<template>
  <RebornTable :data="data" :columns="columns" @row-drag-end="onRowDragEnd" />
</template>
```

::tip
回调还带 `row`、`targetRow`、`position`（`'before'` / `'after'`）、`oldIndex`、`newIndex` 与 `parent`，需要把新顺序提交给接口时直接取用；索引都相对同级数组，根行是 `data`，子行是父行的 `children`。
::

::warning
有生效的排序时手柄禁用，因为拖完的顺序会被排序立刻打回；加载中、懒加载得到的子行（不在 `data` 里）以及没有同级行可交换的行同样不可拖动。
::

### 筛选

`filters` 提供候选值，`filterMethod` 定义本地筛选规则：同列取或、不同列取且；列标识优先 `columnKey`，其次 `prop`。

| 配置 | 行为 | 典型用途 |
| --- | --- | --- |
| `filterMultiple=true` | 默认允许多选 | 同时查看多个部门 |
| `filterMultiple=false` | 仅保留一个值 | 互斥条件 |
| `filteredValue` 未传 | 组件内部维护 | 独立表格 |
| `filteredValue` 已传 | 调用方在 `filter-change` 后回写 | 页面级筛选联动 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, name: '林晓', department: '研发' }, { id: 2, name: '陈晨', department: '设计' }]
const columns: TableColumn[] = [
  { prop: 'name', label: '姓名' },
  { prop: 'department', label: '部门', filters: [{ text: '研发', value: '研发' }, { text: '设计', value: '设计' }], filterMethod: (value, row) => row.department === value },
]
</script>
<template>
  <RebornTable :data="data" :columns="columns" />
</template>
```

`clearFilter` 可清除内部筛选；外部传入 `filteredValue` 后仍须同步回写，方法调用不能替代受控状态更新。远程筛选见上一节的异步示例。

### 自定义列模板

表格 `cell` 是通用单元格渲染入口；列的 `slotName` 指定内容插槽，也可通过 `cell-列标识` / `header-列标识` 定位单列，列标识优先 `columnKey`，其次 `prop`。

| 入口 | 作用域 | 典型用途 |
| --- | --- | --- |
| `cell` / `cell-列标识` / `slotName` | `{ row, column, $index, columnIndex }` | 单元格、金额与行内操作 |
| `header` / `header-列标识` | `{ column, $index }` | 表头单位、提示和说明 |
| 列 `default` / `header` | 分别与单元格 / 表头一致 | 声明列附近直接写业务模板 |
| `footer` | `{ data, selection }` | 展示选择数量与外部操作 |
| `append` | 无 | 表体后的补充说明 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornText from '~/components/reborn/ui/reborn-text/RebornText.vue'
const data = [{ id: 1, name: '林晓', amount: 1280 }]
const columns = [{ prop: 'name', label: '姓名', columnKey: 'person' }, { prop: 'amount', label: '金额', slotName: 'money' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns">
    <template #cell-person="{ row }">{{ row.name }} / {{ row.id }}</template>
    <template #money="{ row }"><RebornText :value="Number(row.amount)" type="amount" currency="¥" :color="Number(row.amount) > 1000 ? 'error' : 'primary'" class="text-base" /></template>
    <template #footer="{ data, selection }">共 {{ data.length }} 条，已选 {{ selection.length }} 条</template>
    <template #append><p class="p-3">金额单位：人民币元。</p></template>
  </RebornTable>
</template>
```

列 `formatter` 返回文本或 Vue 节点；字符串不会被当成 HTML 注入。行内按钮使用 `@click.stop` 时可避免同时触发行点击。声明分组列的 `default` 用于子列，不要同时将它当作该父列的单元格模板。

::tip
`RebornText` 当前未声明 `defineModel`，通过真实的 `value` prop 展示数值，不能把无效的 `v-model` 当作双向绑定。金额类型是 `amount`，不是 `price`；本例大于 1000 元用 `error`，其余用 `primary`，保留 `text-base` 字号。金额变更由业务数据源负责，Text 不是编辑器。
::

查看与删除使用 `RebornButton size="sm"`：查看回显该行信息，删除只修改本示例独立副本，不影响其他表格。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
const data = ref([{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }]), message = ref('尚未操作')
const columns = [{ prop: 'name', label: '姓名' }, { columnKey: 'action', label: '操作' }]
</script>
<template>
  <RebornTable :data="data" :columns="columns">
    <template #cell-action="{ row }">
      <RebornButton size="sm" variant="text" @click.stop="message = `查看详情：${row.name}`">查看</RebornButton>
      <RebornButton size="sm" variant="text" color="error" @click.stop="data = data.filter(item => item.id !== row.id); message = `已删除：${row.name}`">删除</RebornButton>
    </template>
  </RebornTable><p aria-live="polite">{{ message }}</p>
</template>
```

### 自定义表头

`header` 提供通用表头，`header-列标识` 定位单列，声明列也可直接使用 `header` 插槽。金额表头嵌入真实的 `RebornInputNumber`（目录 `reborn-input-number`），其 `v-model` 驱动最小金额筛选，不只是展示控件。

| 入口 | 作用域 | 典型用途 |
| --- | --- | --- |
| 表级 `header` | `{ column, $index }` | 统一表头内容 |
| `header-列标识` | `{ column, $index }` | 按 columnKey / prop 定制单列 |
| 声明列 `header` | `{ column, $index }` | 在列附近放置金额筛选输入框 |

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue'
const minimum = ref<number | null>(null)
const data = [{ id: 1, name: '林晓', amount: 1280 }, { id: 2, name: '陈晨', amount: 960 }]
const filtered = computed(() => data.filter(row => row.amount >= (minimum.value ?? 0)))
const columns = [{ prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额', minWidth: 280 }]
</script>
<template>
  <RebornTable :data="filtered" :columns="columns">
    <template #header-amount>金额 ≥ <RebornInputNumber v-model="minimum" :min="0" :step="100" size="sm" aria-label="最小金额" placeholder="不限" class="w-36" /></template>
  </RebornTable><p aria-live="polite">最小金额：{{ minimum ?? '不限' }} 元；匹配 {{ filtered.length }} 条。</p>
</template>
```

数字输入默认在回车或失焦时提交，清空得到 `null`，本例将其解释为不限。演示页的数据驱动与声明式表头共享同一条件、同一筛选结果；声明式写法将上述输入框放进 `RebornTableColumn prop="amount"` 的 `header` 插槽即可，不额外传 `columns`。

### 展开行

`type: 'expand'` 配合 `expand` 插槽展示整行详情，`expandedRowKeys` 默认 `[]`，可由外部控制。展开内容可嵌套 `RebornTable`，每个父行按自身键读取对应明细；这与 `children` 树节点不是同一种展示。

| 开关 | 影响范围 | 典型用途 |
| --- | --- | --- |
| 父表边框 | 仅绑定父表的 `border` | 强调主列表边界 |
| 子表边框 | 仅绑定展开区域子表的 `border` | 单独区分明细列 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue'
import type { TableColumn, TableRow } from '~/components/reborn/ui/reborn-table/table.types'
const parentBorder = ref(false), childBorder = ref(false)
const data = [{ id: 1, name: '林晓' }, { id: 2, name: '陈晨' }]
const details: Record<string, TableRow[]> = { 1: [{ id: '1-travel', item: '杭州交通', amount: 768 }, { id: '1-hotel', item: '杭州住宿', amount: 512 }], 2: [{ id: '2-travel', item: '上海交通', amount: 576 }, { id: '2-hotel', item: '上海住宿', amount: 384 }] }
const columns: TableColumn[] = [{ type: 'expand', width: 48 }, { prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornSwitch v-model="parentBorder" active-label="父表边框" /><RebornSwitch v-model="childBorder" active-label="子表边框" />
  <RebornTable :data="data" :columns="columns" :border="parentBorder">
    <template #expand="{ row }"><RebornTable :data="details[String(row.id)]" :columns="[{ prop: 'item', label: '明细' }, { prop: 'amount', label: '金额' }]" :border="childBorder" :aria-label="`${row.name}的报销明细`" /></template>
  </RebornTable>
</template>
```

`defaultExpandAll` 仅在初始 `expandedRowKeys` 为空时展开已有节点，不递归预取后续新增的懒节点；与受控模型一起使用时，服务端首屏和客户端首次渲染保持一致，后续以模型为准。

### 树形数据与懒加载

`treeProps` 默认映射 `children` / `hasChildren`；已有非空 `children` 优先使用，不再请求该节点；无子行的父节点用标记字段与 `lazy` + `load` 按需获取。

| 数据方式 | 契约 | 典型用途 |
| --- | --- | --- |
| 完整树 | 行的 `children` 包含子行 | 已取得完整层级 |
| 懒加载树 | `lazy=true`、标记为真、提供 `load` | 展开后才请求子行 |
| 自定义字段 | `treeProps={ children: 'nodes', hasChildren: 'hasMore' }` | 与现有接口字段对齐 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableKey } from '~/components/reborn/ui/reborn-table/table.types'
const expanded = ref<TableKey[]>(['team'])
const data = [{ id: 'team', name: '研发团队', children: [{ id: 'person', name: '林晓' }] }]
const columns = [{ prop: 'name', label: '团队 / 成员' }]
</script>
<template>
  <RebornTable v-model:expanded-row-keys="expanded" :data="data" :columns="columns"
    row-key="id" :tree-props="{ children: 'children' }" :indent="16" />
</template>
```

`load(row, treeNode, resolve)` 返回 `void` 或 `Promise<void>`；`treeNode` 为 `{ level, expanded, loading, loaded }`。成功必须调用 `resolve(children)`，`resolve([])` 会将节点变为叶子；仅返回数组或让 Promise 完成不会结束加载。

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableProps } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 'team', name: '异步团队', hasMore: true }]
const columns = [{ prop: 'name', label: '团队 / 成员' }]
const load: TableProps['load'] = async (row, treeNode, resolve) => {
  await new Promise<void>(done => setTimeout(done, 350))
  resolve([{ id: String(row.id) + '-member', name: '成员 · 层级 ' + (treeNode.level + 1) }])
}
</script>
<template>
  <RebornTable :data="data" :columns="columns" row-key="id" lazy :load="load"
    :tree-props="{ children: 'nodes', hasChildren: 'hasMore' }" />
</template>
```

树表按根节点分页，展开子行不增加分页总数；所有层级的键必须唯一。行 `children` 是树结构，列 `children` 是多级表头，二者不能混用。

::tip
- **客户端挂载后才请求**。SSR 不调用 `load`，默认展开与模型展开也遵循此时机。
- **失败需折叠后重新展开重试**。`load` 抛错或 Promise 拒绝会清除加载状态，不自动循环重试。
- **折叠不会重新展开**。折叠后晚到的有效结果仅缓存，下次展开复用，不因结果到达自动展开。
::

::warning
**忽略旧结果不等于取消请求**。`data` 数组替换、节点删除或替换、`rowKey` 配置或行键变化、子节点数组引用变化、组件卸载都会使旧结果失效；切换 `lazy`、`load` 或 `treeProps` 字段映射也会清除缓存。组件不取消底层请求，需要取消时由调用方处理。
::

### 可选择的树形数据

树数据可添加 `selection` 列；checkbox 各行独立，不做父子级联，全选仅影响当前展开可见且通过 `selectable` 的行。

| 操作 | 范围 | 典型用途 |
| --- | --- | --- |
| 勾选父行 | 只更新父行的键 | 父子记录分开处理 |
| 表头全选 | 当前页展开可见、可选的行 | 批量操作当前视图 |
| 折叠父行 | 不自动清除已选子行 | 暂时收起已选内容 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn, TableKey } from '~/components/reborn/ui/reborn-table/table.types'
const selected = ref<TableKey[]>([]), expanded = ref<TableKey[]>(['team'])
const data = [{ id: 'team', name: '研发', children: [{ id: 'person', name: '林晓' }] }]
const columns: TableColumn[] = [{ type: 'selection', width: 48 }, { prop: 'name', label: '团队 / 成员' }]
</script>
<template>
  <RebornTable v-model:selected-keys="selected" v-model:expanded-row-keys="expanded" :data="data" :columns="columns" row-key="id" />
  <p>独立选中的行键：{{ selected }}</p>
</template>
```

不提供父子关联策略或勾选后自动加载后代；需要级联选择而不需要多列表格时，改用 `reborn-tree`。

### 表尾合计行

`showSummary` 默认关闭；默认首列显示 `sumText`，其他数字列求和，`summaryMethod` 可替换整行内容。

| 配置 | 合计方式 | 典型用途 |
| --- | --- | --- |
| `showSummary` + `sumText` | 默认求和 | 简单数值统计 |
| `summaryMethod` | 按叶子列顺序返回内容 | 排除编号、附加币种 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableProps } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, name: '林晓', amount: 1280 }, { id: 2, name: '陈晨', amount: 960 }]
const columns = [{ prop: 'name', label: '姓名' }, { prop: 'amount', label: '金额' }]
const summaryMethod: TableProps['summaryMethod'] = ({ data }) => ['报销合计', '¥' + data.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2)]
</script>
<template>
  <RebornTable :data="data" :columns="columns" show-summary :summary-method="summaryMethod" />
</template>
```

`summaryMethod` 接收筛选、排序后的全部根节点，不只当前页；远程模式仅接收传入数据，跨页总计必须由接口提供，不能用当前页之和冒充。

### 合并行或列

`spanMethod` 返回 `[rowspan, colspan]` 或同名对象；纵向合并使用 `[2, 1]`，横向合并使用 `[1, 2]`，被覆盖格均需返回 `[0, 0]`。

| 配置 / 返回值 | 行为 | 典型用途 |
| --- | --- | --- |
| `[1, 1]` 或 `undefined` | 正常单元格 | 不需要合并的列 |
| `[2, 1]` | 向下合并两行 | 相邻同组记录 |
| `[1, 2]` | 向右合并两列 | 同一行的横向说明 |
| `[0, 0]` | 不渲染被覆盖单元格 | 对应已被上方或左侧合并的格子 |
| `showSummary` + `sumText` | 默认首列为「合计」，其余数值列求和 | 简单金额汇总 |
| `summaryMethod` | 覆盖整行合计内容 | 排除数字编号、添加币种单位 |

纵向合并与展开详情并用时，合并块内的详情行会延后插入到整个合并块末尾，而非紧跟触发行；所有行仍在同一张表内，避免 `rowspan` 将详情行计入跨度而挤占详情内容。

`hover=true` 时，悬停纵向合并格会高亮它覆盖的所有数据行；悬停其中的普通格会高亮当前数据行及相交的合并格，不扩散到其他数据行或合计行。表体分隔线绘制在单元格上边缘，底线由表格统一绘制；外框底边向内叠绘，内容撑满时与表格底线重合，短内容或追加区域前仍保留分隔线。

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableProps } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, department: '研发', amount: 1280 }, { id: 2, department: '研发', amount: 960 }]
const columns = [{ prop: 'department', label: '部门' }, { prop: 'amount', label: '金额' }]
const spanMethod: TableProps['spanMethod'] = ({ $index, columnIndex }) => columnIndex === 0 ? ($index === 0 ? [2, 1] : [0, 0]) : [1, 1]
const summaryMethod: TableProps['summaryMethod'] = ({ data }) => ['报销合计', data.reduce((sum, row) => sum + Number(row.amount), 0)]
</script>
<template>
  <RebornTable :data="data" :columns="columns" :span-method="spanMethod"
    show-summary :summary-method="summaryMethod" border />
</template>
```

`summaryMethod` 接收筛选、排序后的全部根节点，不只当前页；远程模式仅接收传入的数据。跨页总合计必须由接口提供后自行渲染，不能把当前页之和当成全部数据之和。

### 自定义索引

`type: 'index'` 创建展示序号；`index` 可以是数字起点或回调。开启 `pagination` 后，回调自动接收含页偏移的零基索引，只需格式化 `index + 1`，不要再次叠加 `(page - 1) * pageSize`；默认序号与数字起点也会自动偏移。

| `index` | 序号规则 | 典型用途 |
| --- | --- | --- |
| 未传 | 从 1 开始，开启分页后自动偏移 | 连续阅读顺序 |
| 数字 | 指定起点，开启分页后自动偏移 | 自定义起始编号 |
| 函数 | 接收含页偏移的零基索引，返回数字或字符串 | 带前缀或跨页编号 |

```vue
<script setup lang="ts">
import { ref } from 'vue'
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const page = ref(1), pageSize = ref(3)
const data = Array.from({ length: 8 }, (_, i) => ({ id: i, name: '记录 ' + (i + 1) }))
const columns: TableColumn[] = [{ type: 'index', label: '编号', width: 100, index: i => 'BX-' + String(i + 1).padStart(3, '0') }, { prop: 'name', label: '姓名' }]
</script>
<template>
  <RebornTable v-model:current-page="page" v-model:page-size="pageSize" :data="data" :columns="columns" :pagination="{ pageSizes: [3, 5, 10] }" row-key="id" />
</template>
```

每页 3 条时，第二页从 `BX-004` 开始。展示序号会随排序、筛选和分页变化，不能用来替代稳定的 `rowKey`。

### 表格布局

`tableLayout` 默认 `'fixed'`，用于选择浏览器表格布局算法，不代表虚拟滚动或列宽拖拽。

| 布局 | 宽度行为 | 典型用途 |
| --- | --- | --- |
| `'fixed'` | 按列配置分配宽度 | 需要稳定列宽和省略文本 |
| `'auto'` | 内容参与计算，长内容可能撑宽列 | 内容宽度优先的报表 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
const data = [{ id: 1, name: '林晓', email: 'reimbursement-review-team@example.company.com' }]
const columns = [{ prop: 'name', label: '姓名', width: 100 }, { prop: 'email', label: '邮箱', width: 140 }]
</script>
<template>
  <div class="w-full max-w-sm">
    <RebornTable :data="data" :columns="columns" table-layout="fixed" show-overflow-tooltip />
    <RebornTable :data="data" :columns="columns" table-layout="auto" show-overflow-tooltip />
  </div>
</template>
```

::warning
`auto` 不保证 ellipsis（省略号）：长内容可以撑宽列，使单元格本身不溢出，此时不会显示溢出提示。需要稳定的省略与提示，请优先使用 `fixed` 并约束容器和列宽。
::

### Tooltip 自定义

`tooltipOptions` 提供表级或列级提示配置，`tooltipFormatter` 返回文本或 Vue 节点；只有真实溢出且未禁用时才显示，不因自定义内容而强制弹出。

| 配置来源（从低到高） | 合并方式 | 典型用途 |
| --- | --- | --- |
| `table.tooltipOptions` | 表级基础选项 | 全表统一外观 |
| `table.showOverflowTooltip` 对象 | 覆盖表级同名选项并开启 | 全表快捷配置 |
| `column.tooltipOptions` | 覆盖前两级同名选项 | 单列调整方向 |
| `column.showOverflowTooltip` 对象 | 最高配置优先级并开启 | 单列快捷覆盖 |

内容优先级：`tooltip` 插槽 > 列 `tooltipFormatter` > 表 `tooltipFormatter` > 实际渲染文本。作用域为 `TableTooltipScope = TableCellScope & { cellValue: unknown; content: string }`：`cellValue` 是原始字段值，`content` 是实际显示文本，不一定相同。

| `TableTooltipOptions` 键 | 类型 / 单位 | 典型用途 |
| --- | --- | --- |
| `placement` | 沿用 RebornTooltip 的 `Placement`（如 `'top'` / `'bottom'`） | 调整显示方位 |
| `openDelay` / `closeDelay` | `number`，ms | 控制开关延迟 |
| `arrow` | `boolean` 或 `{ pointAtCenter?: boolean }` | 显示箭头或居中指向 |
| `disabled` | `boolean` | 保留省略但禁用提示 |
| `color` | `string`，CSS 颜色 | 同步面板与箭头底色 |
| `ui` | `TooltipUI`，Tailwind 类名覆盖 | 调整面板最大宽度等 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, note: '请核对项目编号、发票抬头和收款信息后再确认本次异地报销费用。' }]
const columns: TableColumn[] = [{ prop: 'note', label: '说明', width: 180, tooltipOptions: { placement: 'bottom' }, tooltipFormatter: ({ content }) => '列级说明：' + content }]
</script>
<template>
  <div class="w-full max-w-xs">
    <RebornTable :data="data" :columns="columns" :show-overflow-tooltip="{ openDelay: 160 }" :tooltip-options="{ placement: 'top', ui: { content: 'max-w-80' } }" />
  </div>
</template>
```

下例使用最高优先级的插槽；普通单元格用 `formatter` 追加文字，提示中同时展示原始值和显示文本：

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
import type { TableColumn } from '~/components/reborn/ui/reborn-table/table.types'
const data = [{ id: 1, note: '请核对项目编号、发票抬头和收款信息后再确认本次异地报销费用。' }]
const columns: TableColumn[] = [{ prop: 'note', label: '说明', width: 180, formatter: (row, column, value) => '待确认：' + String(value) }]
</script>
<template>
  <div class="w-full max-w-xs">
    <RebornTable :data="data" :columns="columns" show-overflow-tooltip>
      <template #tooltip="{ cellValue, content }"><div class="flex flex-col gap-1"><span>原值：{{ cellValue }}</span><strong>{{ content }}</strong></div></template>
    </RebornTable>
  </div>
</template>
```

选项仅支持上表列出的 RebornTooltip 子集，不是 Element 的 Tooltip 完整选项；`tooltipOptions` / `tooltipFormatter` 本身不负责开启提示，仍需 `showOverflowTooltip`。字符串按文本渲染，不注入 HTML。

## API

表格由两个组件组成，属性各管各的，互不通用：

- **`RebornTable`（主表）**：数据、外观、状态模型、分页、树形、合计，以及全部事件与实例方法。属性写在 `<RebornTable>` 上。
- **`RebornTableColumn` / `TableColumn`（列）**：单列的字段、宽度、固定、排序、筛选与模板。同一份配置有两种写法：作为 `columns` 数组的一项，或写成 `<RebornTableColumn>` 的属性。

列属性（如 `fixed`、`sortable`、`width`）写到 `RebornTable` 上不会生效。两边同名的只有 `showOverflowTooltip`、`tooltipOptions`、`tooltipFormatter`：主表上的是全表默认值，列上的覆盖它。表格里出现的 `TableKey`、`TableRow` 等类型见文末「类型定义」。

### Props（RebornTable）

主表属性以 `TableProps` 为准；最后五行是具名 `v-model`。

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `data` | `TableRow[]` | `[]` | 只读行数据；组件不会原地排序或修改行对象，不提供 `dataSource` 别名。 |
| `columns` | `TableColumn[]` | - | 数据驱动列；只要传入就优先于声明列。 |
| `rowKey` | `string \| ((row: TableRow) => TableKey)` | `'id'` | 唯一且稳定的行键；跨数据选择与树数据必须确保键有效。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 单行高度 36 / 48 / 56px；文字统一 14px / 22px。 |
| `border` | `boolean` | `false` | 显示外框和纵向分隔线。 |
| `stripe` | `boolean` | `false` | 开启交替行底色。 |
| `showHeader` | `boolean` | `true` | 是否渲染表头。 |
| `headerBackground` | `boolean` | `false` | 表头使用灰阶 2 背景。 |
| `hover` | `boolean` | `true` | 显示灰阶 2 整行悬停背景。 |
| `height` | `number \| string` | - | 滚动区高度；数字按 px，配合 fixedHeader 固定表头。 |
| `maxHeight` | `number \| string` | - | 滚动区最大高度；超出后滚动，配合 fixedHeader 固定表头。 |
| `fixedHeader` | `boolean` | `true` | 仅存在 height / maxHeight 时固定表头；false 禁用。 |
| `tableLayout` | `'fixed' \| 'auto'` | `'fixed'` | 原生表格布局算法；auto 下内容可撑宽，不保证省略号。 |
| `showOverflowTooltip` | `boolean \| TableTooltipOptions` | `false` | 全表普通列溢出提示，可由列配置覆盖；仅真实溢出时显示。 |
| `tooltipOptions` | `TableTooltipOptions` | - | 全表提示基础选项，合并优先级见 Tooltip 自定义。 |
| `tooltipFormatter` | `(scope: TableTooltipScope) => VNodeChild` | - | 表级提示内容；低于列回调和 tooltip 插槽。 |
| `loading` | `boolean` | `false` | 加载中覆盖表体并禁用内置操作。 |
| `emptyText` | `string` | `'暂无数据'` | 无数据时显示；提供 `empty` 插槽可替换。 |
| `highlightCurrentRow` | `boolean` | `false` | 开启当前行品牌二阶背景高亮，点击行更新 `currentRowKey`；悬停不覆盖高亮底色。 |
| `defaultSort` | `TableSort` | - | 初始排序 `{ prop, order }`，不是受控排序模型。 |
| `remote` | `boolean` | `false` | 不在本地分页、排序或筛选；调用方处理 `change`。 |
| `pagination` | `boolean \| TablePagination` | `false` | 开启分页，或提供总数、布局、可选页容量等配置。 |
| `defaultExpandAll` | `boolean` | `false` | 初始展开键为空时展开已有节点，不递归预取新增懒节点；后续用 `expandedRowKeys`。 |
| `treeProps` | `TableTreeProps` | `{ children: 'children', hasChildren: 'hasChildren' }` | 子行与待加载标记字段映射。 |
| `lazy` | `boolean` | `false` | 客户端挂载后按需加载，需配合 load 与待加载标记；已有非空子行优先。 |
| `load` | `(row: TableRow, treeNode: TableTreeNode, resolve: (children: TableRow[]) => void) => void \| Promise<void>` | - | 成功必须调用 resolve，空数组变叶子；抛错或拒绝后折叠再展开重试。treeNode 含 level / expanded / loading / loaded。 |
| `indent` | `number` | `16` | 树节点每级缩进，单位 px。 |
| `showSummary` | `boolean` | `false` | 显示合计行。 |
| `sumText` | `string` | `'合计'` | 默认合计行第一列文案；自定义合计由回调决定。 |
| `summaryMethod` | `(scope: { columns: TableColumn[]; data: TableRow[] }) => VNodeChild[]` | - | 返回逐列合计内容；本地输入为处理后的全部根节点，远程输入为传入数据。 |
| `spanMethod` | `(scope: TableCellScope) => TableSpan` | - | 返回 `[rowspan, colspan]`、同名对象或 `undefined`；被覆盖格返回 `[0, 0]`。 |
| `rowClassName` | `ClassValue \| ((scope: { row: TableRow; rowIndex: number }) => ClassValue)` | - | 行级附加类名或按行计算的类名。 |
| `cellClassName` | `ClassValue \| ((scope: TableCellScope) => ClassValue)` | - | 单元格附加类名。 |
| `ariaLabel` | `string` | `'数据表格'` | 表格可访问名称，建议区分同页的多张表。 |
| `class` | `ClassValue` | - | 根节点附加 Tailwind 类名。 |
| `ui` | `TableUi` | `{}` | 按内部节点键覆盖类名，键位见后文。 |
| `selectedKeys` | `TableKey[]` | `[]` | `v-model:selected-keys`，选择列行键；单选列最多保留一个键。 |
| `expandedRowKeys` | `TableKey[]` | `[]` | `v-model:expanded-row-keys`，详情或树节点展开键。 |
| `currentRowKey` | `TableKey \| undefined` | `undefined` | `v-model:current-row-key`，当前行高亮状态，独立于选择列。 |
| `currentPage` | `number` | `1` | `v-model:current-page`，从 1 开始的页码。 |
| `pageSize` | `number` | `10` | `v-model:page-size`，每页根节点条数。 |

### Props（RebornTableColumn / TableColumn）

列配置的全部字段；写在 `<RebornTableColumn>` 上时用 kebab-case（如 `min-width`）。默认值列的「未传」表示没有显式值，行为由表格解释。

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `prop` | `string` | 未传 | 字段路径，例如 `user.name`。 |
| `label` | `string` | 未传 | 表头文字。 |
| `columnKey` | `string` | 未传 | 独立列标识；筛选、清除筛选及具名插槽优先使用它。 |
| `type` | `'default' \| 'selection' \| 'radio' \| 'index' \| 'expand' \| 'drag'` | 未传，按普通列处理 | 普通、多选、单选、序号、展开或拖拽排序手柄列。 |
| `width` | `number \| string` | 未传 | 列宽，数字或 px 字符串，固定列建议明确指定。 |
| `minWidth` | `number \| string` | 未传 | 未指定宽度时的最小列宽。 |
| `fixed` | `boolean \| 'left' \| 'right'` | 未传，不固定 | `true` 等价于 `'left'`。 |
| `align` | `'left' \| 'center' \| 'right'` | 未传 | 内容水平对齐。 |
| `headerAlign` | `'left' \| 'center' \| 'right'` | 未传，沿用 `align` | 表头水平对齐。 |
| `sortable` | `boolean \| 'custom'` | 未传，不排序 | `true` 本地排序，`'custom'` 只发送事件；`remote` 下均不本地排序。 |
| `sortMethod` | `(a: TableRow, b: TableRow) => number` | 未传 | 本地比较函数，返回负数、零或正数。 |
| `sortOrders` | `TableOrder[]` | 未传 | 自定义排序循环；状态仅为 `'ascending'` / `'descending'` / `null`。 |
| `filters` | `TableFilter[]` | 未传 | 筛选项 `{ text: string, value: string \| number \| boolean }`。 |
| `filterMethod` | `(value: TableFilter['value'], row: TableRow, column: TableColumn) => boolean` | 未传 | 本地筛选规则，同列取或、不同列取且。 |
| `filterMultiple` | `boolean` | 未传，允许多选 | `false` 时仅选一个筛选值。 |
| `filteredValue` | `TableFilter['value'][]` | 未传，内部维护 | 外部受控筛选值；传入后需同步回写筛选状态。 |
| `selectable` | `(row: TableRow, index: number) => boolean` | 未传，允许选择 | 选择列的行可选条件。 |
| `reserveSelection` | `boolean` | 未传，不保留 | 数据更新时保留选中键，必须使用稳定 `rowKey`。 |
| `index` | `number \| ((index: number) => number \| string)` | 未传 | 仅序号列使用；开启 pagination 后，回调接收含页偏移的零基索引，默认序号与数字起点也自动偏移。 |
| `formatter` | `(row: TableRow, column: TableColumn, value: unknown, index: number) => VNodeChild` | 未传 | 格式化普通单元格；返回字符串按文本渲染。 |
| `showOverflowTooltip` | `boolean \| TableTooltipOptions` | 未传，继承表级 | 该列的真实溢出提示；false 关闭，选项对象覆盖表级配置。 |
| `tooltipOptions` | `TableTooltipOptions` | 未传 | 列级提示选项，覆盖表级同名选项。 |
| `tooltipFormatter` | `(scope: TableTooltipScope) => VNodeChild` | 未传 | 列级提示内容，优先于表回调，低于 tooltip 插槽。 |
| `className` | `ClassValue` | 未传 | 该列单元格附加类名。 |
| `labelClassName` | `ClassValue` | 未传 | 该列表头附加类名。 |
| `slotName` | `string` | 未传 | 内容具名插槽名称；也可使用 `cell-列标识`。 |
| `children` | `TableColumn[]` | 未传 | 分组表头的子列；声明式也可嵌套子列。 |
| `hidden` | `boolean` | 未传，不隐藏 | 不显示该列。 |
| `cellRender` | `(scope: TableCellScope) => VNodeChild` | 未传 | 内部字段，用于解析声明列默认插槽，不需要手动传入。 |
| `headerRender` | `(scope: { column: TableColumn; $index: number }) => VNodeChild` | 未传 | 内部字段，用于解析声明列表头插槽，不需要手动传入。 |

### Emits（RebornTable）

事件都由主表发出，声明列没有业务事件。

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:selectedKeys` | `(keys: TableKey[])` | 多选行键模型更新。 |
| `update:expandedRowKeys` | `(keys: TableKey[])` | 展开行键模型更新。 |
| `update:currentRowKey` | `(key: TableKey \| undefined)` | 当前行模型更新。 |
| `update:currentPage` | `(page: number)` | 页码模型更新。 |
| `update:pageSize` | `(size: number)` | 每页条数模型更新。 |
| `selection-change` | `(rows: TableRow[])` | 多选结果变化，返回行对象而非键。 |
| `select` | `(selection: TableRow[], row: TableRow)` | 单行多选操作。 |
| `select-all` | `(selection: TableRow[])` | 表头全选操作。 |
| `current-change` | `(row: TableRow \| undefined, oldRow: TableRow \| undefined)` | 当前行变化，同时提供旧行。 |
| `row-click` | `(row: TableRow, column: TableColumn, event: MouseEvent)` | 点击行。 |
| `row-dblclick` | `(row: TableRow, column: TableColumn, event: MouseEvent)` | 双击行。 |
| `cell-click` | `(row: TableRow, column: TableColumn, cell: HTMLElement, event: MouseEvent)` | 点击单元格，包含元素。 |
| `sort-change` | `(sort: TableSort & { column?: TableColumn })` | 排序字段与方向变化。 |
| `filter-change` | `(filters: TableFilters)` | 筛选映射变化；值为筛选值数组。 |
| `expand-change` | `(row: TableRow, expandedRows: TableRow[])` | 详情或树节点展开状态变化。 |
| `page-change` | `(page: number)` | 页码变化；也包含远程总数减少后自动钳制到有效页码。 |
| `page-size-change` | `(size: number)` | 每页条数变化。 |
| `change` | `(state: TableChange)` | 排序、筛选或分页变化的统一通知：`{ action, page, pageSize, sort, filters }`；远程页码自动钳制也以 `'paginate'` 通知重新请求。 |
| `row-drag-end` | `(payload: TableRowDragEnd)` | 拖拽或方向键移动行之后触发；`payload.data` 是移动后的新根数组，回写给 `data` 即完成排序。落回原位不触发。 |

### Slots（RebornTable）

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | 无 | 声明 `RebornTableColumn`；传入 `columns` 时不用于生成列。 |
| `header` | `{ column, $index }` | 通用表头内容。 |
| `cell` | `{ row, column, $index, columnIndex }` | 通用单元格内容。 |
| `tooltip` | `{ row, column, $index, columnIndex, cellValue, content }` | 溢出提示内容，最高内容优先级；仅真实溢出时显示。 |
| `expand` | `{ row, $index }` | 展开详情区域，需配合 `type: 'expand'` 列。 |
| `empty` | 无 | 空数据内容，替换 `emptyText`。 |
| `loading` | 无 | 加载遮罩内部内容。 |
| `footer` | `{ data, selection }` | 表格页脚，提供处理后的数据及已选行；远程模式的数据为传入数据。 |
| `append` | 无 | 表体后的附加内容。 |

另支持由列配置生成的动态名字：`column.slotName`、`cell-列标识`、`header-列标识`；作用域分别与 `cell`、`cell`、`header` 一致。列标识优先使用 `columnKey`，其次 `prop`，建议业务列显式提供其中一个。

### Slots（RebornTableColumn）

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `{ row, column, $index, columnIndex }`，分组列声明子列时无行作用域 | 普通列自定义单元格；分组列用来嵌套 `RebornTableColumn`。 |
| `header` | `{ column, $index }` | 自定义该列的表头内容。 |

### Expose（RebornTable）

在 `RebornTable` 上绑定模板引用，类型为 `TableExpose`；声明列没有实例方法。

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `clearSelection` | `() => void` | 清空多选结果，包括保留的跨数据选择。 |
| `getSelectionRows` | `() => TableRow[]` | 读取已选行对象。 |
| `toggleRowSelection` | `(row: TableRow, selected?: boolean) => void` | 切换指定行多选状态，传第二参数可明确选中或取消。 |
| `toggleAllSelection` | `() => void` | 切换当前展开可见且可操作行的全选状态；树表不做父子级联。 |
| `setCurrentRow` | `(row?: TableRow) => void` | 设置当前行，不传参数则清除。 |
| `toggleRowExpansion` | `(row: TableRow, expanded?: boolean) => void` | 切换指定行展开状态，可明确展开或收起。 |
| `clearSort` | `() => void` | 清除排序状态。 |
| `sort` | `(prop: string, order: TableOrder) => void` | 按字段设置排序，方向为升序、降序或 `null`。 |
| `clearFilter` | `(columnKeys?: string[]) => void` | 清除指定列或全部筛选；外部受控值仍需调用方更新。 |
| `doLayout` | `() => void` | 请求重新测量表格布局。 |
| `scrollTo` | `(options: { top?: number; left?: number; behavior?: 'auto' \| 'smooth'; duration?: number }) => Promise<void>` | 参数类型为 `TableScrollToOptions`；位置单位 px，默认 `auto` 立即定位，`smooth` 联合平滑滚动两轴；可选 `duration` 单位 ms，未指定的轴保持原位置。 |
| `setScrollTop` | `(value: number) => void` | 立即设置纵向滚动位置，单位 px；可与横向定位连续调用。 |
| `setScrollLeft` | `(value: number) => void` | 立即设置横向滚动位置，单位 px；可与纵向定位连续调用。 |

### 类型定义

全部类型从 `app/components/reborn/ui/reborn-table/table.types.ts` 导出，`reborn-table/index.ts` 已整体转出。

| 类型 | 定义 | 用在哪里 |
| --- | --- | --- |
| `TableKey` | `string \| number` | `rowKey` 的返回值；`selectedKeys`、`expandedRowKeys`、`currentRowKey` |
| `TableRow` | `Record<string, unknown>` | `data` 的每一项，以及回调、插槽里的 `row` |
| `TableOrder` | `'ascending' \| 'descending' \| null` | `sort()`、列的 `sortOrders`、`TableSort.order` |
| `TableSort` | `{ prop: string; order: TableOrder }` | `defaultSort`、`sort-change` |
| `TableCellScope` | `{ row, column, $index, columnIndex }` | `cell` 插槽、列默认插槽、`spanMethod`、`cellClassName` |
| `TableRowDragEnd` | `{ row, targetRow, position, oldIndex, newIndex, parent?, data }` | `row-drag-end`；`position` 为 `'before' \| 'after'`，索引相对同级数组 |

### 自定义样式（ui）

`ui` 使用 `TableUi` 按内部节点覆盖 Tailwind 类名。共享文字为 `text-base font-medium text-gray-9`，不需要重复设置行高；灰阶边界和表头可优先通过外观参数控制。

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器，默认 `relative min-w-0 w-full`，并提供共享文字令牌。 |
| `scrollbar` | 滚动容器，默认 `relative min-w-0 w-full`；开启 `border` 时底框由 `after` 向内叠绘 1px，避免与表格底线相加。涉及固定表头时不要覆盖滚动行为。 |
| `table` | 语义化表格，默认 `w-full table-fixed border-separate border-spacing-0 text-left`，`tableLayout="auto"` 切换为 `table-auto`，底部分隔线为 `border-b border-gray-3`。 |
| `thead` | 表头区域，默认无附加类名；`showHeader=false` 时不渲染。 |
| `headerCell` | 表头单元格，默认 `border-b border-gray-3 bg-gray-1 px-4 py-0 align-middle`，高度跟随 `size`。 |
| `row` | 数据行，默认 `group/row bg-gray-1`，悬停背景为灰阶 2；当前行高亮为 `bg-brand-2`，悬停时保留。 |
| `cell` | 数据单元格，默认 `border-t border-gray-3 px-4 py-0 align-middle`，表体首行不重复绘制顶线，高度跟随 `size`。 |
| `cellContent` | 单元格内容容器，默认 `min-w-0 py-1`。 |
| `expand` | 详情单元格，默认 `border-t border-gray-3 bg-gray-1 px-4 py-3`；无展开详情时不渲染。 |
| `empty` | 空态区域，默认 `px-4 py-10 text-center text-gray-6`，仅无数据时可见。 |
| `loading` | 加载覆盖区域，默认绝对定位铺满表体、`z-40 bg-gray-1/80 text-gray-6`，内容居中；仅加载时可见。 |
| `summary` | 合计行，默认 `bg-gray-2`，仅 `showSummary=true` 时渲染。 |
| `footer` | 页脚区域，默认 `px-4 py-3`，需提供 `footer` 插槽。 |
| `pagination` | 分页容器，默认 `flex justify-end py-3`，需开启 `pagination`。 |

```vue
<script setup lang="ts">
import RebornTable from '~/components/reborn/ui/reborn-table/RebornTable.vue'
</script>
<template>
  <RebornTable :data="[{ id: 1, name: '林晓' }]" :columns="[{ prop: 'name', label: '姓名' }]"
    :ui="{ root: 'rounded-lg', cell: 'px-4', headerCell: 'px-4' }" />
</template>
```

此组件不要求调用方配置专属 CSS 变量；字号与行高沿用 `app/assets/theme/typography.css` 的 `text-base` 令牌。

## 注意事项

- **仅提供 Web 版本，也不承诺完整兼容其他表格库**。没有 UniApp 同名组件或完整 Element API；虚拟滚动、拖拽列宽和电子表格编辑不在本组件契约内。
- **拖拽排序只交回结果，不改 `data`**。`row-drag-end` 的 `data` 是新数组：根级移动只换数组，行对象原样保留；树形移动会浅拷贝被移动行的各级祖先并换上新的 `children`，祖先行因此是新对象，按对象身份保存行的地方要改用 `rowKey` 关联。不回写 `data` 时界面保持原顺序。
- **列入口不混合**。显式 `columns` 优先于声明列，包括空数组；只使用 `data`、`prop` 和 `label`，不提供 `dataSource` 等别名。
- **跨数据选择与树结构必须使用稳定键**。选择列的 `reserveSelection` 才会保留跨数据选择，索引键会在换页后指向不同记录；所有树节点的键也必须全局唯一。
- **远程模式不会代替请求接口**。`remote` 跳过本地分页、排序、筛选，调用方必须处理 `change` 并回填数据和总数；应取消或忽略过期响应。
- **初始化配置不是受控模型**。`defaultSort` 与 `defaultExpandAll` 只描述初次状态，后续用排序方法和 `expandedRowKeys`；传入 `filteredValue` 后由外部回写筛选值。
- **树表按根节点分页，勾选不级联**。子行不增加分页总数，全选只影响当前展开可见且可选的行；懒加载的重试、缓存与失效边界见「树形数据与懒加载」，忽略旧结果不会取消底层请求。
- **合并规则必须与实际展示顺序一致**。`spanMethod` 的索引对应渲染中的行，排序、筛选、分页可能改变连续分组；被覆盖格需要返回 `[0, 0]`，不要让合并跨越当前页或分组边界。
- **合计范围不是固定的当前页或远程全集**。本地为筛选排序后的全部根节点，远程为传入数据；跨页总计应另取服务端汇总，编号等数字列建议用 `summaryMethod` 排除。
- **溢出提示只在真实截断时出现**。提示复用 `RebornTooltip`，支持键盘聚焦且不使用原生 `title`；`auto` 布局不保证省略。提示插槽优先于列回调、表回调和实际显示文本，字符串不会解析为 HTML。
- **固定布局与自定义样式需保留基础约束**。固定列应指定宽度并保持不透明背景，文字保留 14px / 22px 的令牌行高；覆写滚动容器或固定单元格样式后需重新检查滚动时的定位。
