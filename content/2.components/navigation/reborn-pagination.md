---
title: Pagination 分页
description: 用于大数据量列表分页切换的分页组件，支持布局组合、简洁模式与页码折叠。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornPaginationDemo.vue" config="RebornPaginationConfig" componentId="reborn-pagination" :componentFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]' :uniappFiles='["RebornPagination.vue", "reborn-pagination.config.ts"]'}
::

## API

### Props

| 参数                           | 说明                                                              | 类型                    | 默认值                |
| ------------------------------ | ----------------------------------------------------------------- | ----------------------- | --------------------- |
| `modelValue / v-model`         | 当前页码                                                          | `number`                | `1`                   |
| `total`                        | 数据总数                                                          | `number`                | `0`                   |
| `pageSize / v-model:page-size` | 每页条数                                                          | `number`                | `10`                  |
| `pagerCount`                   | 页码按钮数量，不小于 3 的整数（奇偶均可），过小的值钳到 3         | `number`                | `3`                   |
| `layout`                       | 布局 token（逗号分隔）：prev/pager/next/jumper/total/sizes        | `string`                | `"prev, pager, next"` |
| `pageSizes`                    | 每页条数选项                                                      | `number[]`              | `[10, 20, 50, 100]`   |
| `size`                         | 尺寸规格                                                          | `sm / md / lg`          | `md`                  |
| `background`                   | 页码按钮是否显示背景。true 时非激活 bg-gray-2，激活 bg-primary/50 | `boolean`               | `false`               |
| `disabled`                     | 是否禁用                                                          | `boolean`               | `false`               |
| `hideOnSinglePage`             | 总页数不超过 1 时整组件隐藏                                       | `boolean`               | `false`               |
| `simple`                       | 简洁模式，忽略 layout，只渲染上一页 + 当前页/总页数文本 + 下一页  | `boolean`               | `false`               |
| `prevText`                     | 上一页按钮文字（空则显示箭头图标）                                | `string`                | `''`                  |
| `nextText`                     | 下一页按钮文字（空则显示箭头图标）                                | `string`                | `''`                  |
| `ui`                           | 各部分 UI 深度定制                                                | `Partial<PaginationUI>` | `{}`                  |
| `class`                        | 自定义类名                                                        | `string`                | `-`                   |

### Events

| 事件名              | 说明                                                                | 回调参数         |
| ------------------- | ------------------------------------------------------------------- | ---------------- |
| `current-change`    | 当前页码实际变化时触发                                              | `(page: number)` |
| `size-change`       | 每页条数变化时触发，随后钳制当前页，若页码变化再补发 current-change | `(size: number)` |
| `update:modelValue` | 当前页码双向绑定更新                                                | `(page: number)` |
| `update:pageSize`   | 每页条数双向绑定更新                                                | `(size: number)` |

### Slots

| 插槽名       | 说明                            | 作用域参数                        |
| ------------ | ------------------------------- | --------------------------------- |
| `prev`       | 上一页按钮                      | `{ disabled, prev }`              |
| `next`       | 下一页按钮                      | `{ disabled, next }`              |
| `pager-item` | 页码项（省略号不是 pager-item） | `{ page, active, disabled }`      |
| `jumper`     | 跳转输入区                      | `{ current, totalPages, jump }`   |
| `total`      | 总数文本                        | `{ total }`                       |
| `sizes`      | 每页条数选择器                  | `{ pageSize, pageSizes, change }` |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，两端键位一致：

| 键名              | 平台 | 说明                                                                                                                                                                                       |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`            | 通用 | 根节点（Web 为 `<nav>`，UniApp 为 `<view>`）。默认 `reborn-pagination inline-flex items-center`，各区块之间的间距改这里（Web `gap-2` / UniApp `gap-[16rpx]`）；`class` prop 也并到该节点。 |
| `prev`            | 通用 | 上一页按钮。**仅在未填充 `prev` 插槽时渲染**，填充该插槽会替换掉按钮，`ui.prev` 随之失效；禁用态由内部 `disabled` 变体处理。                                                               |
| `next`            | 通用 | 下一页按钮。**仅在未填充 `next` 插槽时渲染**，填充该插槽会使其失效。                                                                                                                       |
| `pager`           | 通用 | 页码列表容器。**仅非简洁模式且 `layout` 含 `pager` 时渲染**，默认 `inline-flex items-center`（Web `gap-2` / UniApp `gap-[16rpx]`），页码之间的间距改这里。                                 |
| `pagerItem`       | 通用 | 单个页码。**仅在未填充 `pager-item` 插槽时渲染**，填充该插槽会替换掉页码按钮，`ui.pagerItem` 随之失效；尺寸、圆角、底色由内部变体给出，覆盖写这里。                                        |
| `pagerItemActive` | 通用 | **当前页**页码的追加类名——它不是独立节点，只在 `pagerItem` 处于激活态时并进去；选中底色、字重改这里。                                                                                      |
| `ellipsis`        | 通用 | 省略号 `•••`（点击向对应方向连跳）。**仅页码折叠时渲染**，默认 `inline-flex items-center justify-center text-gray-5`，Web 端另带 `cursor-pointer`。                                        |
| `jumper`          | 通用 | 跳转区容器。**仅 `layout` 含 `jumper` 时渲染**，默认 `inline-flex items-center text-gray-5`；「前往 / 页」两侧文案的间距改这里。填充 `jumper` 插槽只替换内部内容，容器仍生效。             |
| `input`           | 通用 | 跳转输入框（Web 为内部 `RebornInputNumber` 容器，UniApp 为内部 `RebornInput` 的 `custom-class`）。**仅 `layout` 含 `jumper` 时渲染**；填充 `jumper` 插槽后这个输入框不再渲染。             |
| `simple`          | 通用 | 简洁模式的「当前页 / 总页数」文本。**仅 `simple` 为真时渲染**，默认 `inline-flex items-center text-gray-5`。                                                                               |
| `total`           | 通用 | 总数文本容器（默认「共 N 条」）。**仅 `layout` 含 `total` 时渲染**，默认 `text-gray-5`；文案由 `total` 插槽替换，容器类名仍生效。                                                          |
| `sizes`           | 通用 | 每页条数选择器的容器。**仅 `layout` 含 `sizes` 时渲染**，默认无类名；里面的 `RebornSelect` 固定 `w-[110px]`，要改宽度请填充 `sizes` 插槽自行渲染。                                         |

## 注意事项

- `total` 为 `0` 时按 1 页显示且翻页按钮禁用，配合 `hideOnSinglePage` 可整组件隐藏。
- `pagerCount` 为不小于 3 的整数，奇偶均可，过小的值钳到 3；3 时只显示首页、当前页、末页，其余以省略号折叠，偶数时当前页在中间窗口里偏左一格。
- `layout` 使用逗号分隔的 token，未知 token 会被忽略；`simple` 开启后 `layout` 不生效。
- `current-change` 仅在页码实际变化时触发；`size-change` 触发后先钳制当前页，若页码变化再补发 `current-change`。
- `jumper` 输入回车或失焦时会将页码钳制在 `[1, totalPages]`，非法输入回退到当前页。
