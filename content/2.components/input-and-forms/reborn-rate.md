---
title: 评分
description: 用于星级评分录入与展示的双端组件，支持半星与悬停预览。
category: 表单与输入
tags: [css, tailwind, rate, rating, star, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornRateDemo.vue" config="RebornRateConfig" componentId="reborn-rate" :componentFiles='["RebornRate.vue", "reborn-rate.config.ts"]' :uniappFiles='["RebornRate.vue", "reborn-rate.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 当前评分值。 |
| `count` | `number` | `5` | 星星总数。 |
| `allowHalf` | `boolean` | `false` | 是否允许半星。 |
| `showValue` | `boolean` | `false` | 是否显示当前分数。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"warning"` | 颜色主题。 |
| `icon` | `string` | `"i-lucide-star"` | 未选中图标类名（仅支持 Nuxt Icon）。 |
| `activeIcon` | `string` | `"i-lucide-star"` | 选中图标类名（仅支持 Nuxt Icon）。 |
| `halfIcon` | `string` | - | 半星图标类名（仅支持 Nuxt Icon）。 |
| `ui` | `Partial<{ wrapper, star, icon, iconActive, value }>` | `{}` | 自定义类名覆盖。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 评分值变化。 |
| `change` | `number` | 评分值确认变化。 |

## Slots

| 插槽名 | Props | 描述 |
| --- | --- | --- |
| `icon` | `{ index, active }` | 自定义星星图标。 |
| `value` | `{ value }` | 自定义分数显示。 |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端结构一致，键位相同：

| 键名         | 说明                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 根元素。默认 `inline-flex flex-row items-center gap-1`，星星之间的间距、整体对齐改这里；Web 端的 `class`、UniApp 端的 `customClass` 也会并到同一节点。      |
| `star`       | 单颗星的定位容器（未激活层与激活层都叠在它里面）。默认 `relative cursor-pointer`，Web 端带 `transition-all`，UniApp 端带 `active:scale-90` 点按缩放。       |
| `icon`       | 未激活图标层。默认带过渡与 `dark:text-gray-2`，模板上另有固定的 `opacity-30`——想改未选中颜色请直接给这里设 `text-*`，必要时用 `opacity-100` 覆盖。          |
| `iconActive` | 激活图标层，绝对定位盖在未激活层之上；半星通过 `clip-path` 只露左半边。选中色（含渐变）改这里。                                                            |
| `value`      | 分数文本。默认 `ml-1 font-medium tabular-nums`。**仅在 `showValue` 为真且未填充 `value` 插槽时渲染**，填充该插槽会替换掉这个节点，`ui.value` 随之失效。     |

```vue
<template>
  <RebornRate
    v-model="score"
    show-value
    :ui="{
      wrapper: 'gap-2',
      icon: 'text-gray-3 opacity-100',
      iconActive: 'text-warning',
      value: 'text-sm text-gray-6',
    }"
  />
</template>
```

::
