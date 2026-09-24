---
title: Rate 评分
description: 用于星级评分录入与展示的双端组件，支持半星与悬停预览。
category: 表单与输入
platform: both
tags: [css, tailwind, rate, rating, star, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornRateDemo.vue" config="RebornRateConfig" componentId="reborn-rate" :componentFiles='["RebornRate.vue", "reborn-rate.config.ts"]' :uniappFiles='["RebornRate.vue", "reborn-rate.config.ts"]'}

#api

## API

| 属性名          | 类型                                                                                   | 默认值          | 描述                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`    | `number`                                                                               | `0`             | 当前评分值。                                                                                                                                                                      |
| `count`         | `number`                                                                               | `5`             | 星星总数，也是最大分值，分数与自定义文案都以它为上限。                                                                                                                              |
| `allowHalf`     | `boolean`                                                                              | `false`         | 是否允许半星。                                                                                                                                                                    |
| `clearable`     | `boolean`                                                                              | `false`         | 再次点击当前分值时是否清零。                                                                                                                                                      |
| `showValue`     | `boolean`                                                                              | `false`         | 是否显示当前分数（已提交的值，悬停预览不影响）；传了 `formatText` 时显示其返回值。                                                                                                |
| `formatText`    | `(value: number) => string`                                                            | -               | 分数区域的自定义文案：接收已提交的分值、返回要显示的文字，传入后无需 `showValue`；不传时没有默认文案。更复杂的内容请用 `value` 插槽。                                             |
| `disabled`      | `boolean`                                                                              | `false`         | 是否禁用。                                                                                                                                                                        |
| `readonly`      | `boolean`                                                                              | `false`         | 是否只读。                                                                                                                                                                        |
| `trigger`       | `"click" \| "hover"`                                                                   | `"click"`       | 切换分数的触发方式：click 悬停仅预览、点击提交；hover 悬停即改分（触控端等同 click）。                                                                                            |
| `size`          | `"sm" \| "md" \| "lg"`                                                                 | `"md"`          | 尺寸大小。                                                                                                                                                                        |
| `color`         | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"warning"`     | 颜色主题；传了 `colors` 时以分段颜色为准。                                                                                                                                        |
| `colors`        | `string[] \| Record<number, string \| { value, excluded }>`                            | -               | 按分段自定义选中色：数组按 `lowThreshold` / `highThreshold` 分低、中、高三段；对象以键为分段上界（含），`excluded: true` 表示不含上界本身。所有点亮的星统一取当前分值命中的颜色。 |
| `lowThreshold`  | `number`                                                                               | `2`             | 低分界限（含），配合数组形式的 `colors` / `icons`。                                                                                                                               |
| `highThreshold` | `number`                                                                               | `4`             | 高分界限（不含），配合数组形式的 `colors` / `icons`。                                                                                                                             |
| `voidColor`     | `string`                                                                               | -               | 未选中图标颜色；不传时为文字色的 30% 不透明度。                                                                                                                                   |
| `icon`          | `string`                                                                               | `"lucide:star"` | 未选中图标名（Nuxt Icon）。                                                                                                                                                       |
| `activeIcon`    | `string`                                                                               | `"lucide:star"` | 选中图标名（Nuxt Icon）；传了 `icons` 时以分段结果为准。                                                                                                                          |
| `halfIcon`      | `string`                                                                               | -               | 半星图标名（Nuxt Icon）。                                                                                                                                                         |
| `icons`         | `RateIconSource[] \| Record<number, RateIconSource>`                                   | -               | 按分段自定义选中图标，分段规则同 `colors`；值为 `{ type, url, excluded? }`，`type` 为 `icon` 时 `url` 是 Nuxt Icon 名，为 `image` 时是图片地址。                                  |
| `ui`            | `Partial<{ wrapper, star, icon, iconActive, value }>`                                  | `{}`            | 自定义类名覆盖。                                                                                                                                                                  |

## Events

| 事件名              | 参数     | 描述             |
| ------------------- | -------- | ---------------- |
| `update:modelValue` | `number` | 评分值变化。     |
| `change`            | `number` | 评分值确认变化。 |

## Slots

| 插槽名  | Props               | 描述                                                                                                                   |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `icon`  | `{ index, active }` | 自定义星星图标。                                                                                                       |
| `value` | `{ value, text }`   | 自定义分数 / 自定义文案区域；`value` 为已提交的分值，`text` 为 `formatText` 的返回值（未传时为空）；悬停预览不影响两者。 |

## Exposes

| 名称                | 描述                                                                                                                      | 类型                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `setCurrentValue`   | 设置当前分数：按 `count` 夹取，`allowHalf` 时取整到半星、否则取整到整星；与点击一样触发 `update:modelValue` 与 `change`。 | `(value: number) => void` |
| `resetCurrentValue` | 重置当前分数：清除悬停预览，并把内部值同步回 `modelValue`（非受控用法下可撤销未被父级接收的改动）。                       | `() => void`              |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端结构一致，键位相同：

| 键名         | 说明                                                                                                                                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 根元素。默认 `inline-flex flex-row items-center gap-1`，星星之间的间距、整体对齐改这里；Web 端的 `class`、UniApp 端的 `customClass` 也会并到同一节点。                                                                                                           |
| `star`       | 单颗星的定位容器（未激活层与激活层都叠在它里面）。默认 `relative cursor-pointer`，Web 端带 `transition-all`，UniApp 端带 `active:scale-90` 点按缩放。                                                                                                            |
| `icon`       | 未激活图标层。默认带过渡与 `dark:text-gray-2`，模板上另有固定的 `opacity-30`——想改未选中颜色优先用 `voidColor` 属性（会去掉 30% 不透明度）；也可给这里设 `text-*`，必要时用 `opacity-100` 覆盖。                                                                 |
| `iconActive` | 激活图标层，绝对定位盖在未激活层之上；半星通过 `clip-path` 只露左半边。选中色（含渐变）改这里。                                                                                                                                                                  |
| `value`      | 分数文本。默认 `ml-3 font-medium tabular-nums text-gray-9`，md 档字号 `text-base`（14px）；与末颗星的 16px 间距由 wrapper 的 `gap-1` 加自身 `ml-3` 组成。**仅在 `showValue` 为真且未填充 `value` 插槽时渲染**，填充该插槽会替换掉这个节点，`ui.value` 随之失效。 |

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
