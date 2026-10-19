---
title: Statistic 统计
description: 数字指标展示：支持连续计数动画、精度、分隔符、自定义格式化，以及标题和前后缀插槽。
category: 数据展示
platform: web
tags: [css, tailwind, statistic, number, animation]
badge: New
---

::warning
仅 Web 端实现。UniApp 页面请用 `text` 配合数字格式化函数展示统计值。
::

::ComponentViewer{demoFile="RebornStatisticDemo.vue" config="RebornStatisticConfig" componentId="reborn-statistic" :componentFiles='["RebornStatistic.vue", "reborn-statistic.config.ts", "reborn-statistic.utils.ts"]'}
::

## 简介

Statistic 将一个数值排版成带标题、前后缀的指标，适合展示收入、人数、订单量和比率。目前仅提供 Web 实现，使用 `RebornStatistic`，API 与常见统计组件保持一致。

`value` 是原始数字，`precision` 决定四舍五入后的小数位数，`decimalSeparator` 和 `groupSeparator` 分别决定小数点与千分位符号。传入 `formatter` 后直接显示函数返回值，不再叠加默认精度和分隔符。

`animated` 默认开启连续计数，`duration` 控制时长；`title`、`prefix`、`suffix` 支持文字与同名插槽；`valueStyle` 覆盖整个数字区，`ui` 按结构键覆盖类名。实例暴露只读 `displayValue`，可读取当前格式化结果，动画期间包含中间值，不包含标题和前后缀。

### 何时使用

- 仪表盘展示订单量、人数等整数指标 —— 用 `value` 与 `title`，默认精度为 0。
- 金额、比率需要固定小数位 —— 配置 `precision`，用 `prefix` 或 `suffix` 标注货币和单位。
- 展示不同地区的数字记法 —— 组合 `decimalSeparator` 与 `groupSeparator`。
- 将原始数字换算为万、百分数或业务文本 —— 用 `formatter` 返回最终显示内容。
- 数值变化时需要连续计数反馈 —— 保持 `animated` 开启，用 `duration` 调整时长。

### 何时不使用

- 展示距离某个截止时间的剩余时长 —— 改用 `reborn-countdown`。
- 展示任务完成进度和比例图形 —— 改用 `reborn-progress`。
- 需要编辑或递增数值 —— 改用 `reborn-input-number`。

## 用法

### 基础统计

`value` 默认是 0，`title` 描述指标；不传标题时不保留空白行。

```vue
<template>
  <div class="grid gap-6 sm:grid-cols-3">
    <RebornStatistic title="活跃用户" :value="268500" suffix="人" />
    <RebornStatistic title="今日订单" :value="1386" suffix="笔" />
    <RebornStatistic title="待处理任务" />
  </div>
</template>
```

### 数字动画

`animated` 默认开启，客户端挂载后从 0 连续计数到目标，默认时长 1500 毫秒，与 Element Plus 的 Total Transactions 示例一致。后续变更从当前可见数值继续，减小时连续递减。

| 参数组合 | 行为 | 典型用途 |
| --- | --- | --- |
| `animated` + `duration="1500"` | 从 0 连续计数到目标，更新时衔接当前值 | 订单量、累计收入 |
| `animated="false"` | 立即显示完整数值 | 高频数据监控 |
| `duration="0"` | 关闭计数动画 | 与即时读数对照 |

```vue
<script setup lang="ts">
import { ref } from 'vue';
const value = ref(172000);
</script>
<template>
  <RebornStatistic title="累计交易量" :value="value" :duration="1500" suffix="笔" />
  <RebornButton @click="value += 10000">增加 10,000</RebornButton>
  <RebornButton @click="value -= 10000">减少 10,000</RebornButton>
</template>
```

### 精度与分隔符

`precision` 默认 0，支持 0–20 位小数；`groupSeparator=""` 关闭千分位分组。

| 参数组合 | 显示结果（原值 1234567.895） | 典型用途 |
| --- | --- | --- |
| `precision="2"` | `1,234,567.90` | 金额 |
| `precision="2"` + `decimalSeparator=","` + `groupSeparator="."` | `1.234.567,90` | 交换分隔符的地区格式 |
| `precision="3"` + `groupSeparator=""` | `1234567.895` | 不分组的计量值 |

```vue
<template>
  <RebornStatistic :value="1234567.895" :precision="2" />
  <RebornStatistic :value="1234567.895" :precision="2" decimal-separator="," group-separator="." />
  <RebornStatistic :value="1234567.895" :precision="3" group-separator="" />
</template>
```

### 自定义格式化

`formatter` 接收原始数值，返回字符串或数字；默认精度和分隔符不再生效。

```vue
<script setup lang="ts">
function formatTenThousand(value: number) {
  return `${(value / 10000).toFixed(2)} 万`;
}
</script>
<template>
  <RebornStatistic title="以万为单位" :value="1234567.89" :formatter="formatTenThousand" />
</template>
```

### 标题与前后缀

`title`、`prefix`、`suffix` 的同名插槽优先于文字参数；插槽内容仍保留对应的样式容器。

```vue
<template>
  <RebornStatistic :value="7.8" :precision="1">
    <template #title>较昨日增长</template>
    <template #prefix><Icon name="lucide:trending-up" class="size-5 text-success-6" /></template>
    <template #suffix><span class="text-base text-gray-8">%</span></template>
  </RebornStatistic>
</template>
```

### 样式与组合布局

`valueStyle` 作用于包含前后缀的数字区，`ui` 用 Tailwind 类名覆盖内部结构，指标网格由父容器负责。

```vue
<template>
  <div class="grid gap-6 sm:grid-cols-2">
    <RebornStatistic title="本月收入" :value="68235.5" :precision="2" prefix="¥"
      :value-style="{ color: 'var(--color-success-6)' }" />
    <RebornStatistic title="目标完成率" :value="92" suffix="%"
      :ui="{ content: 'text-3xl', suffix: 'text-base text-gray-8' }" />
  </div>
</template>
```

### 倒计时

倒计时使用 `RebornCountdown`，`value` 接受毫秒时间戳或 Dayjs 对象，更新目标即可重新开始；完整格式和事件见 [Countdown 文档](/components/data/reborn-countdown)。

| 场景 | 参数组合 | 典型用途 |
| --- | --- | --- |
| 活动开始 | `value` 为当前时间加 7 小时 | 开售提醒 |
| 会员剩余时长 | 目标为两天后，默认 `HH:mm:ss` 累计小时 | 会员有效期 |
| 距离下月开始 | Dayjs 目标 + `format="DD [天] HH:mm:ss"` | 跨天活动 |
| 短倒计时 | 更新 `value`，监听 `finish` | 结束状态与重新开始 |

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
const target = ref<number>();
const finished = ref(false);
function restart() {
  finished.value = false;
  target.value = Date.now() + 5000;
}
onMounted(restart);
</script>
<template>
  <RebornCountdown title="5 秒倒计时" :value="target" @finish="finished = true" />
  <RebornButton @click="restart">{{ finished ? '已结束，重新开始' : '重新开始' }}</RebornButton>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| value | `number` | `0` | 原始数字；默认格式化时非有限数值按 0 处理。 |
| decimalSeparator | `string` | `'.'` | 小数点符号，支持模板写法 `decimal-separator`。 |
| formatter | `(value: number) => string \| number` | - | 自定义格式化，优先于精度与分隔符；返回内容作为文本显示。 |
| groupSeparator | `string` | `','` | 千分位分隔符，空字符串表示不分组。 |
| precision | `number` | `0` | 小数位数，截为 0–20 的整数；超出范围收敛到边界，非有限值按 0 处理。 |
| animated | `boolean` | `true` | 开启连续计数动画；首次从 0 开始，更新从当前数值衔接；传入 `formatter` 或系统要求减少动态效果时直接显示。 |
| duration | `number` | `1500` | 单次数值过渡时长，单位毫秒；小于等于 0 或非有限值时直接显示。 |
| prefix | `string` | - | 数字区前缀，`#prefix` 插槽优先。 |
| suffix | `string` | - | 数字区后缀，`#suffix` 插槽优先。 |
| title | `string` | - | 数字标题，`#title` 插槽优先；两者都为空时不渲染标题节点。 |
| valueStyle | `string \| CSSProperties` | - | 数字区行内样式，包含前后缀；模板写法为 `value-style`。 |
| class | `ClassValue` | - | 追加到根容器的类名。 |
| ui | `StatisticUI` | `{}` | 按内部结构键覆盖类名。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| title | - | 数字标题，覆盖 `title` 文字。 |
| prefix | - | 数字区之前的内容，覆盖 `prefix` 文字。 |
| suffix | - | 数字区之后的内容，覆盖 `suffix` 文字。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| displayValue | `ComputedRef<string \| number>` | 只读的当前显示内容；通过组件实例访问时自动解包，不含标题和前后缀。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖 Tailwind 类名，定义在 `app/components/reborn/ui/reborn-statistic/reborn-statistic.config.ts`。

| 键名 | 说明 |
| --- | --- |
| root | 根容器，默认纵向排列，间隔 4px。 |
| title | 标题，默认 `text-base text-gray-8`；没有标题与插槽时不渲染。 |
| content | 数字区，默认 `text-2xl font-medium text-gray-10 tabular-nums`，包含前后缀。 |
| prefix | 前缀容器，仅有文字或插槽时渲染。 |
| value | 格式化后的数字文本，默认允许长数值换行。 |
| suffix | 后缀容器，仅有文字或插槽时渲染。 |

```vue
<template>
  <RebornStatistic :value="92" suffix="%" :ui="{ content: 'text-3xl', suffix: 'text-base' }" />
</template>
```

## 注意事项

- **`formatter` 接管完整格式**。函数接收原始 `value`，精度、分组和小数点设置不再加工返回值；需要百分比换算时在函数中完成。
- **`displayValue` 跟随可见数值**。连续计数期间返回格式化后的中间值，到达目标后与 `value` 对应；连续更新从当前数值衔接，结束时精确落到最新目标。
- **服务端与水合首帧直接展示目标**。客户端挂载后才从零计数，不在服务端创建动画帧；再次播放可像 demo 一样更新组件 `key`。
- **自定义格式化与减少动态效果时不计数**。`formatter` 可能返回业务文本，因此直接展示；系统开启 `prefers-reduced-motion` 时也会停止计数并显示目标。
- **`precision` 不会改变源数据**。仅对显示结果四舍五入，组件没有编辑行为或 `v-model`，表单输入请使用 `reborn-input-number`。
- **`valueStyle` 影响整个数字区**。前后缀默认继承数字区样式，需要独立字号或颜色时用 `ui.prefix`、`ui.suffix` 或插槽覆盖。
- **格式化结果以文本渲染**。返回 HTML 字符串会作为文本显示，需要图标或富内容时使用标题与前后缀插槽。
- **目前仅支持 Web**。没有 UniApp 同名实现，不能通过平台切换获得移动端组件源码。
