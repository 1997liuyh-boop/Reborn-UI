---
title: Countdown 倒计时
description: 基于目标时间的倒计时，支持天数与毫秒格式、标题及前后缀插槽，回传剩余毫秒并在结束时通知。
category: 数据展示
platform: web
tags: [css, tailwind, countdown, statistic, dayjs]
badge: New
---

::warning
仅 Web 端实现。UniApp 页面可按目标时间与 `Date.now()` 的差值自行计时展示。
::

::ComponentViewer{demoFile="RebornCountdownDemo.vue" config="RebornCountdownConfig" componentId="reborn-countdown" :componentFiles='["RebornCountdown.vue", "reborn-countdown.utils.ts"]'}
::

## 简介

Countdown 展示距离目标时间的剩余时长，适合活动开始、订单支付和限时任务等场景。使用 `RebornCountdown`，目前仅 Web 端提供实现，展示结构复用 `RebornStatistic`。

`value` 决定绝对截止时间，接受毫秒时间戳或 Dayjs 对象；`format` 决定显示哪些时间单位。未显示的较大单位会累计到较小单位，默认 `HH:mm:ss` 在超过一天时累计小时，加入 `DD` 后再拆成天和小时。

标题及前后缀支持文字与同名插槽，`valueStyle` 和 `ui` 沿用 Statistic 的数字区样式。`change` 回传剩余毫秒，`finish` 在有效目标到零时触发一次，实例的只读 `displayValue` 返回当前格式化文本。

### 何时使用

- 活动即将开始，需要持续展示剩余时长 —— 给 `value` 传入活动开始的毫秒时间戳。
- 会员有效期跨越多天 —— 用 Dayjs 目标与 `format="DD [天] HH:mm:ss"`。
- 短时任务需要显示毫秒 —— 用 `format="ss.SSS"`，计时刷新会提高频率。
- 时间变化与业务状态联动 —— 监听 `change` 获取剩余毫秒，在 `finish` 后更新界面。

### 何时不使用

- 只展示一个金额、人数或比例 —— 改用 `reborn-statistic`。
- 需要用户选定一个日期或截止时间 —— 改用 `reborn-date-picker`。
- 需要显示任务的完成百分比 —— 改用 `reborn-progress`。

## 用法

### 目标时间

`value` 接受毫秒时间戳或 Dayjs 对象，不是倒计时的持续秒数；下面的目标是从挂载后开始的 7 小时。

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
const target = ref<number>();
onMounted(() => { target.value = Date.now() + 7 * 3600000; });
</script>
<template>
  <RebornCountdown title="距离活动开始" :value="target" />
</template>
```

### 显示格式

`format` 默认 `HH:mm:ss`，单位重复时补零；方括号中的文字原样输出。

| 格式 | 含义 | 典型用途 |
| --- | --- | --- |
| `HH:mm:ss` | 累计小时、分钟、秒 | 活动倒计时 |
| `DD [天] HH:mm:ss` | 天数与一天内的小时 | 会员到期提醒 |
| `mm:ss` | 累计分钟与秒 | 短时任务 |
| `ss.SSS` | 累计秒与毫秒 | 短倒计时 |
| `D[天] H[时] m[分] s[秒]` | 不补零的中文单位 | 自然语言展示 |

```vue
<script setup lang="ts">
import dayjs from 'dayjs';
import { onMounted, ref } from 'vue';
const target = ref<dayjs.Dayjs>();
onMounted(() => { target.value = dayjs().add(2, 'day').add(3, 'hour'); });
</script>
<template>
  <RebornCountdown title="剩余会员时间" :value="target" format="DD [天] HH:mm:ss" />
</template>
```

### 标题与前后缀

`title`、`prefix`、`suffix` 的同名插槽优先于文字，数字区样式与 Statistic 一致。

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
const target = ref<number>();
onMounted(() => { target.value = Date.now() + 3600000; });
</script>
<template>
  <RebornCountdown :value="target" :value-style="{ color: 'var(--color-primary-6)' }">
    <template #title>距离开售</template>
    <template #prefix><Icon name="lucide:timer" class="size-5" /></template>
    <template #suffix><span class="text-base">后开始</span></template>
  </RebornCountdown>
</template>
```

### 事件与重置

`change` 返回剩余毫秒数，`finish` 在到零时触发一次；更新 `value` 可重新开始，更新格式不会重置目标。

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue';
const target = ref<number>();
const finished = ref(false);
function restart() { finished.value = false; target.value = Date.now() + 5000; }
onMounted(restart);
</script>
<template>
  <RebornCountdown :value="target" @finish="finished = true" />
  <RebornButton @click="restart">重新开始</RebornButton>
  <span>{{ finished ? '已结束' : '进行中' }}</span>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| value | `number \| Dayjs` | - | 目标时间，数值单位为毫秒；未传或无效时显示零且不触发 `finish`。 |
| format | `string` | `'HH:mm:ss'` | 支持 `D`、`H`、`m`、`s`、`S`，重复字母按长度补零，`SSS` 表示毫秒；方括号内容原样输出。 |
| prefix | `string` | - | 数字区前缀，`#prefix` 插槽优先。 |
| suffix | `string` | - | 数字区后缀，`#suffix` 插槽优先。 |
| title | `string` | - | 倒计时标题，`#title` 插槽优先。 |
| valueStyle | `string \| CSSProperties` | - | 数字区行内样式，包含前后缀。 |
| class | `ClassValue` | - | 追加到根容器的类名。 |
| ui | `StatisticUI` | `{}` | 沿用 Statistic 的内部结构键覆盖类名。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| change | `remaining: number` | 挂载、目标更新或计时刷新使剩余时间变化时派发，单位毫秒，最低为 0。 |
| finish | 无 | 有效目标到零时派发一次；挂载时目标已过期也会派发。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| title | - | 倒计时标题，覆盖 `title` 文字。 |
| prefix | - | 数字区前缀，覆盖 `prefix` 文字。 |
| suffix | - | 数字区后缀，覆盖 `suffix` 文字。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| displayValue | `ComputedRef<string>` | 只读的当前格式化文本；组件实例上自动解包，不含标题和前后缀。 |

### 自定义样式（ui）

结构样式复用 `app/components/reborn/ui/reborn-statistic/reborn-statistic.config.ts`，通过 `ui` 覆盖 Tailwind 类名。

| 键名 | 说明 |
| --- | --- |
| root | 根容器，默认纵向排列标题与数字区，追加 `reborn-countdown` 标记类。 |
| title | 标题，默认 `text-base text-gray-8`，无标题与插槽时不渲染。 |
| content | 数字区，默认 `text-2xl font-medium text-gray-10 tabular-nums`；等宽数字减少计时抖动。 |
| prefix | 前缀容器，仅有文字或插槽时渲染。 |
| value | 格式化后的倒计时文本。 |
| suffix | 后缀容器，仅有文字或插槽时渲染。 |

```vue
<template>
  <RebornCountdown :value="2000000000000" suffix="结束" :ui="{ content: 'text-3xl', suffix: 'text-base' }" />
</template>
```

## 注意事项

- **`value` 是目标时间，不是持续时间**。开始 60 秒倒计时应传 `Date.now() + 60000`，传 `60` 表示 1970 年的毫秒时间戳，会立即结束。
- **没有日期单位的日历语义**。这是时长格式，只识别天、小时、分、秒、毫秒；不是 Dayjs 的年月日日期格式，文字用方括号包裹。
- **后台计时按绝对时间校准**。每次刷新重新计算目标与 `Date.now()` 的差值，浏览器限频不会累计误差；`change` 不保证精确的回调间隔。
- **服务端和水合首帧显示零**。计时与事件在客户端挂载后开始，避免跨秒导致水合不匹配；需要稳定的目标时间时由业务端传入截止时间。
- **结束回调按目标去重**。到零后停止计时，不再派发 `finish`；更换目标可重新启动，未传值或无效 Dayjs 对象不触发结束回调。
- **毫秒格式会提高刷新频率**。含 `S` 的格式约每 16ms 刷新，其他格式约每秒刷新；最后一次以剩余时长为上限，到零后清理，卸载时也会取消任务。
