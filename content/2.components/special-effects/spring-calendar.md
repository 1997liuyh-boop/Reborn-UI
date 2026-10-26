---
title: 弹性日历
description: 用于横向选择日期并以弹簧动画展开当日事件的日历条组件。
category: 特效
platform: web
tags: [css, tailwind, motion-v]
---

::ComponentViewer{demoFile="SpringCalendarDemo.vue" config="SpringCalendarConfig" componentId="spring-calendar" :componentFiles='["SpringCalendar.vue", "TextMorph.vue"]'}
::

## 简介

SpringCalendar 是仅 Web 的日期条，以弹簧动画展开选中日期的事件。

`calendarData` 提供每一天和可选事件，`activeIndex` 控制选中下标；组件按数组顺序展示，不自动生成日历数据。

`initialIndex` 提供非受控初值，点击日期通过 `update:activeIndex` 通知选择变化；事件标题、日期与时间由业务数据负责。

### 何时使用

- 近期安排需要紧凑日期条——用 `calendarData` 提供日期与事件。
- 需要与外部选择状态联动——用 `activeIndex` 绑定当前下标。
- 无需受控时希望默认展示某天——用 `initialIndex` 设置起始项。

### 何时不使用

- 需要完整月份网格——改用 `reborn-calendar`。
- 表单需要选择日期并提交——改用 `reborn-date-picker`。

## 用法

### 基础用法

`calendarData` 按顺序定义日期，`initialIndex` 设置非受控初始选择。

| 配置 | 典型用途 |
| --- | --- |
| `calendarData` | 日期与事件数据 |
| `initialIndex` | 默认展开项 |

```vue
<template>
  <SpringCalendar
    :calendar-data="[
      { month: '十月', date: 24, day: '周六', events: [] },
    ]"
    :initial-index="0"
  />
</template>
```

## API

### Props
| 属性名          | 类型                                                                                                           | 默认值 | 描述                                                |
| --------------- | -------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| `calendarData` | `Array<{ month: string; date: number; day: string; events?: { title: string; day: string; time: string }[] }>` | **—**  | 定义每一天及可选事件的数组。_必填。_                |
| `initialIndex` | `number`                                                                                                       | `0`    | 不绑定 `activeIndex` 时的初始选中索引。             |
| `activeIndex` | `number`                                                                                                       | —      | 当前选中的日期索引，支持 `v-model:active-index`；越界时夹到 `calendarData` 范围内。 |

### Emits

| 事件名              | 负载     | 描述                                      |
| ------------------- | -------- | ----------------------------------------- |
| `update:activeIndex`| `number` | 当点击日期按钮时触发，返回新的激活索引；配合 `activeIndex` 实现双向绑定。 |

### 来源

- 灵感来自 [sekachov](https://x.com/sekachov) 的作品。

## 注意事项

- **日期数据需要调用方提供**。组件展示 `calendarData`，不会自行补全月份、时区或节假日。
- **选中值是数组下标**。数据顺序变化后应同步当前索引，避免同一下标对应另一日期。
- **越界索引会被限制到有效范围**。空数据没有可选日期，异步载入后应确认预期选中项。
