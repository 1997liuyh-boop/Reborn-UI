---
title: 商品规格 Sku
description: 用于商品规格（SKU）选择的选项组件，按 options 渲染规格项并以对象形式双向绑定选中结果。
category: 表单与输入
tags: [web, sku, form, select]
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

RebornSku 面向商品详情页等场景，按 `options` 配置渲染「颜色、尺码」等一组组规格项，选中结果以对象形式通过 `v-model` 双向绑定：key 为属性组的 `key`，value 为选中项的值（`multiple` 多选时为数组）。单选组内再次点击已选项可取消选中；每次变化会同时触发 `update:modelValue` 与 `change`。

选项默认用 RebornBadge 渲染，可通过 `item` 插槽自定义单个选项的内容（如附带价格）；也可以在某个属性组上配置 `slots` 指定动态插槽，在选项列表后追加自定义内容（如输入框），配合 `slotsCover` 可完全接管该属性组的渲染。

::ComponentViewer{demoFile="RebornSkuDemo.vue" config="RebornSkuConfig" componentId="reborn-sku" :componentFiles='["RebornSku.vue", "reborn-sku.config.ts"]'}

#api

## API

### Props

| 属性名       | 类型                  | 默认值 | 描述                                                                             |
| :----------- | :-------------------- | :----- | :------------------------------------------------------------------------------- |
| `options`    | `SkuOption[]`         | `[]`   | 属性组配置列表，结构见下方 SkuOption 字段表                                      |
| `modelValue` | `Record<string, any>` | `{}`   | 双向绑定值，key 为 `SkuOption.key`，value 为选中的 `valueKey` 值（多选时为数组） |
| `class`      | `any`                 | —      | 追加到根容器的自定义类名                                                         |
| `ui`         | `SkuUi`               | `{}`   | 分区样式覆盖对象，键位见下方 SkuUi 键位表                                        |

### Emits

| 事件名              | 回调参数                       | 描述                                               |
| :------------------ | :----------------------------- | :------------------------------------------------- |
| `update:modelValue` | `(value: Record<string, any>)` | 选中结果变化时触发（v-model）                      |
| `change`            | `(key: string, value: any)`    | 单个属性组选中值变化时触发，`key` 为该属性组的 key |

### Slots

| 插槽名         | 描述                                                                                                                                           |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `item`         | 自定义单个选项内容，作用域参数：`item`（选项数据）、`option`（所属属性组）、`selected`（是否选中）                                             |
| `[option.slots]` | 由属性组 `slots` 字段指定的动态插槽，作用域参数：`option`、`modelValue`；`slotsCover` 为 `true` 时完全替换该属性组渲染，否则追加在选项列表后方 |

## 类型说明

### SkuOption 字段

| 字段         | 类型              | 说明                                                              |
| :----------- | :---------------- | :---------------------------------------------------------------- |
| `key`        | `string`          | 必填，绑定到 `modelValue` 的 key                                  |
| `title`      | `string`          | 属性组标题                                                        |
| `labelKey`   | `string`          | 选项列表中用于显示的字段名，缺省时直接显示选项本身                |
| `valueKey`   | `string`          | 选项列表中用于取值的字段名，缺省时以整个选项对象为值              |
| `multiple`   | `boolean`         | 是否支持多选，多选时该组的值为数组                                |
| `slots`      | `string`          | 自定义插槽名称，指向文档上方 Slots 表中的动态插槽                 |
| `slotsCover` | `boolean`         | 为 `true` 时该属性组不渲染默认内容，完全由 `slots` 指定的插槽接管 |
| `children`   | `SkuOptionItem[]` | 属性选项列表                                                      |

### SkuUi 键位

| 键名      | 说明           |
| :-------- | :------------- |
| `wrapper` | 最外层容器     |
| `group`   | 单个属性组容器 |
| `title`   | 属性组标题     |
| `list`    | 属性值列表容器 |
| `item`    | 单个属性值项   |

## 注意事项

- 仅 web 端提供，uniapp 端无此组件。
- 多层级联动选择（省市区、分类）请改用 `reborn-cascader`；单组互斥选项请改用 `reborn-radio`。
- 单选组再次点击已选项会将该组的值置为 `undefined`（取消选中），提交前注意做空值校验。

::
