---
title: Calendar 日历
description: 按月或按年展示事项的日历：支持公农历、直角边框、日期格插槽、时区与字符串绑定值。
category: 数据展示
platform: web
tags: [calendar, date, schedule, event, lunar]
badge: New
---

::warning
仅 Web 端组件，UniApp 端暂无对应实现。只需要选一个日期时，两端都可以改用 `reborn-date-picker`。
::

::ComponentViewer{demoFile="RebornCalendarDemo.vue" config="RebornCalendarConfig" componentId="reborn-calendar" :componentFiles='["RebornCalendar.vue", "reborn-calendar.config.ts", "reborn-calendar.utils.ts", "reborn-calendar.lunar.ts"]'}
::

## 简介

Calendar 把一个月的日期铺成周日开头的七列网格，每个日期格分上下两段：上面是日期（默认靠右），下面是 65px 高的事项区。`v-model`、`range`、`controller-type`、`formatter`、`date-cell` / `header` 插槽与 `selectDate` 等实例方法沿用 Element Plus `el-calendar` 的命名，仅 Web 端实现。

数据驱动方式是 `events` + `v-model`：`events` 是 `{ date, title, color? }` 数组，按 `date` 落到对应的日期格，年视图里按月汇总；`v-model` 是选中日期，视图始终停在选中日期所在的月份——翻页、改年月下拉、点「今天」都是在挪选中日期，视图随之跟过去。`color` 决定有事项日期的浅底、顶边与日期文字，并传给工具栏的年月下拉与月 / 年切换；事项自己的 `color` 只改它的圆点，两者互不影响。

其余 API 分五组：视图由 `v-model:mode`（月 / 年）与 `range`（只显示一段日期）控制；外观由 `title-align`（标题对齐）、`border`（直角边框）与 `lunar`（农历）控制；工具栏由 `controller-type`（年月下拉 / 翻页按钮）与 `formatter`（下拉文案）控制；日期换算由 `timezone`（时区）与 `value-format`（字符串绑定值）控制；`panel-change` 通知换月换年。`date-cell` 与 `header` 两个插槽分别替换日期格内容与整个工具栏，编辑入口和弹窗可在业务层自由组合。

### 何时使用

- 排期、值班、会议这类按天归档的事项总览 —— 传 `events`，有事项的日期自动高亮。
- 需要在日历上新增、删除事项 —— 在 `date-cell` 插槽中组合 `reborn-context-menu` 与 `reborn-dialog`，自己维护 `events`。
- 年度规划的月份概览 —— `v-model:mode="year"`，12 个月各自汇总当月事项。
- 面向国内用户、需要看节日节气的排期 —— 开 `lunar`。
- 选中日期要提交给接口，或用户与服务端不在同一时区 —— 用 `value-format="YYYY-MM-DD"` 收发字符串，必要时再加 `timezone`。

### 何时不使用

- 只是让用户在表单里选一个日期或区间 —— 改用 `reborn-date-picker`，弹出式面板不占版面。
- 按时间先后展示一串事件，日期本身不重要 —— 改用 `reborn-timeline`。
- 需要按小时排程、拖拽调整时长的周视图 / 日视图 —— 本库暂无替代，需要接入专门的排程库自行实现。

## 用法

### 基础用法

`v-model` 绑定选中日期（默认是当天零点的 `Date`，设置 `value-format` 后是字符串）；未选中时视图停在本月。点任意日期即选中，点上下月补位的日期会跟着翻到那个月。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const value = ref<Date>()
</script>

<template>
  <RebornCalendar v-model="value" />
</template>
```

### 事项与语义色

`events` 的每一项按 `date` 落到日期格。`'2026-10-20'` 这类不带时区的字符串直接按日期落格；`Date`、时间戳和带 `Z` / 偏移的字符串是确定时刻，按 `timezone`（缺省本地时区）换算成当天。事项区只露出 3 条，超出在格内滚动。

| 设置位置 | 影响范围 | 典型用途 |
| --- | --- | --- |
| 日历的 `color` | 有事项日期的浅底、顶边、日期文字，选中实底、今天描边、圆点默认色，以及工具栏的年月下拉与月 / 年切换 | 让整张日历与页面主题一致 |
| 事项的 `color` | 只有该条事项的圆点 | 用颜色区分事项类型（发布、故障、截止） |

```vue
<script setup lang="ts">
const events = [
  { date: '2026-10-08', title: '版本发布', color: 'success' },
  { date: '2026-10-12', title: '预算提交截止', color: 'warning' },
  { date: '2026-10-16', title: '设计走查' },
]
</script>

<template>
  <RebornCalendar :events="events" color="primary" />
</template>
```

### 标题对齐与边框

`title-align` 控制表头星期与日期标题的水平对齐，默认 `right`；`border` 给主体加直角外框与格间分隔线。

| 配置 | 外观 | 典型用途 |
| --- | --- | --- |
| `title-align="right"`（默认） | 日期在格子右上角，农历文字在下方靠右 | 事项从左往右读，日期不挡事项 |
| `title-align="left"` / `"center"` | 日期靠左 / 居中 | 与左对齐的表格、看板并排时统一视线 |
| `border` | 主体为无圆角外框，格子之间画分隔线，列间距取消 | 嵌在卡片里、需要明确格子边界 |

```vue
<template>
  <RebornCalendar :events="events" title-align="left" border />
</template>
```

### 农历模式

`lunar` 开启后，公历日期在上，较小的农历文字在下，两者随 `title-align` 对齐；工具栏显示干支年与生肖（如「丙午马年」）。

| 显示内容 | 条件 | 颜色 |
| --- | --- | --- |
| 节日（春节、元宵、端午、七夕、中秋、重阳、腊八、除夕等） | 当天是农历节日；闰月不过节 | 语义色 |
| 节气（立春、清明、冬至等二十四节气） | 当天交节，覆盖 2000–2099 年 | 语义色 |
| 月名（九月、闰六月） | 农历初一 | 灰色 |
| 日名（初二…三十） | 其余日子 | 灰色 |

```vue
<template>
  <RebornCalendar :events="events" lunar />
</template>
```

::tip
农历月日与干支年由浏览器内置的 Intl 中国历法（`zh-CN-u-ca-chinese`）换算，不引入第三方库；节气用寿星通式计算。`date-cell` 插槽的 `data.lunar` 提供完整的农历信息，`getLunar` 也从组件目录导出，自定义渲染时可以直接用。
::

### 右键管理事项

通过 `date-cell` 插槽给日期格包裹 `reborn-context-menu`，菜单回调拿到 `data.day` 后打开自己的 `reborn-dialog`，添加或删除时更新 `events`。日历只负责展示事项，不内置编辑入口。

| 菜单操作 | 弹窗内容 | 典型用途 |
| --- | --- | --- |
| 添加事项 | 标题为「YYYY年M月D日事项添加」，中间放输入框与添加按钮；提交后清空输入并保持弹窗打开 | 为同一天连续添加多条事项 |
| 删除事项 | 列出当天事项，每条单独提供删除按钮；当天无事项时禁用菜单项 | 从当天多条事项中选择要删除的一条 |

下面的业务包装组件通过自定义事件转发操作请求，父组件可据此打开对应弹窗；`request-add` / `request-remove` 并非日历内置事件。页面演示提供完整的添加与逐项删除流程，数据保存在当前页面状态中。

```vue
<script setup lang="ts">
const props = defineProps<{ events?: { date: string; title: string }[] }>()
const emit = defineEmits<{ 'request-add': [day: string]; 'request-remove': [day: string] }>()
</script>
<template>
  <RebornCalendar :events="props.events">
    <template #date-cell="{ data, events }">
      <RebornContextMenu :items="[
        { label: '添加事项', onSelect: () => emit('request-add', data.day) },
        { label: '删除事项', disabled: !events.length, onSelect: () => emit('request-remove', data.day) },
      ]">
        <div class="h-24 p-1">{{ data.day }} · {{ events.length }} 条事项</div>
      </RebornContextMenu>
    </template>
  </RebornCalendar>
</template>
```

### 年视图

`v-model:mode` 在 `month` 与 `year` 之间切换，工具栏的「月 / 年」分段按钮改的也是它。年视图把事项汇总到对应月份下，每条以「YYYY-MM-DD：事项内容」显示，添加与删除后随 `events` 更新。

| `mode` | 网格 | 单元格标题 | 典型用途 |
| --- | --- | --- | --- |
| `month` | 7 列，按周排，4~6 行 | 日期 | 日常查看、编辑事项 |
| `year` | 4 列 × 3 行 | 月份 | 年度规划概览；点月份下钻回月视图 |

```vue
<script setup lang="ts">
const mode = ref<'month' | 'year'>('year')
</script>

<template>
  <RebornCalendar v-model:mode="mode" :events="events" />
</template>
```

### 工具栏控制器

`controller-type` 决定工具栏左侧的切换控件，两种都带「月 / 年」切换，右侧都是「今天」。

| `controller-type` | 左侧控件 | 典型用途 |
| --- | --- | --- |
| `select`（默认） | 年份下拉 + 月份下拉（年视图下隐藏月份） | 跨度大的跳转，如直接跳到三年后 |
| `button` | 上一页 / 下一页按钮 + 年月标题 | 逐月翻看，界面更轻 |

`formatter(value, type)` 改写下拉选项的文案，`type` 为 `'year'` 时 `value` 是年份，为 `'month'` 时是 1~12 的月份。

```vue
<template>
  <RebornCalendar controller-type="button" />
  <RebornCalendar :formatter="(value, type) => (type === 'year' ? value : `${value}月份`)" />
</template>
```

### 日期区间

`range` 传 `[开始, 结束]` 时只显示这段日期：开始补到所在周的周日、结束补到所在周的周六，两者必须同月或相邻月。区间视图下工具栏只显示标题，不显示年月下拉与「月 / 年」切换；今天不在区间内时「今天」按钮置灰。

```vue
<template>
  <RebornCalendar :range="[new Date(2026, 9, 11), new Date(2026, 10, 7)]" />
</template>
```

::tip
跨月的区间会按月拆段后首尾拼接，每段日期的 `type` 相对该段所在月份判定，所以第二个月的日期同样显示为当月样式，不会被当成补位格置灰。拆段逻辑同时以 `calculateValidatedDateRange` 暴露。
::

### 时区与绑定值格式

`Date` 只是一个时刻：东八区选中 10 月 20 日，得到的是当地零点，`JSON.stringify` 后是 `2026-10-19T16:00:00.000Z`，提交给接口就差了一天。两个属性分别解决两类问题：

| 属性 | 作用 | 典型用途 |
| --- | --- | --- |
| `value-format` | `v-model` 收发该格式的字符串（dayjs 格式串），绕开 `Date` 的时区换算 | 选中日期要提交给接口、存进数据库 |
| `timezone` | 「今天」是哪天、带时区的时刻落在哪天、向外派发的 `Date` 取哪个时区的零点，都按这个 IANA 时区计算 | 用户与业务不在同一时区；服务端渲染的服务器时区与用户不同 |

```vue
<script setup lang="ts">
const value = ref<string>()
</script>

<template>
  <!-- value 形如 '2026-10-20'，原样提交 -->
  <RebornCalendar v-model="value" value-format="YYYY-MM-DD" timezone="Asia/Shanghai" />
</template>
```

::warning
`new Date('2026-10-20')` 按 UTC 解析，西半球会变成前一天；事项日期请直接传字符串 `'2026-10-20'`，组件会按日期落格。
::

### 自定义日期格

`date-cell` 插槽替换月视图（含区间视图）日期格的内容，作用域参数 `data` 的前四个字段与 `el-calendar` 一致，开启 `lunar` 时另有 `lunar`；另附当天的 `events`。

| `data` 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `'prev-month' \| 'current-month' \| 'next-month'` | 相对当前月份的位置 |
| `isSelected` | `boolean` | 是否为选中日期 |
| `day` | `string` | 格式化日期，形如 `2026-10-20` |
| `date` | `Date` | 单元格日期：`timezone` 时区（缺省本地）当天零点 |
| `lunar` | `CalendarLunar \| undefined` | 农历信息 `{ yearName, zodiac, month, leap, monthName, day, dayName, festival?, term?, text }`，仅开启 `lunar` 时提供 |

```vue
<template>
  <RebornCalendar :events="events">
    <template #date-cell="{ data, events }">
      <span :class="data.isSelected ? 'text-primary' : 'text-gray-9'">{{ data.day.slice(5) }}</span>
      <span v-if="events.length" class="text-sm text-gray-7">{{ events.length }} 条事项</span>
    </template>
  </RebornCalendar>
</template>
```

### 自定义工具栏

`header` 插槽替换整个工具栏，作用域参数 `date` 是标题文案（如「2026 年 10 月」），`selectDate` 用来翻页或回到今天。

```vue
<template>
  <RebornCalendar>
    <template #header="{ date, selectDate }">
      <span>{{ date }}</span>
      <RebornButton size="sm" @click="selectDate('prev-month')">上个月</RebornButton>
      <RebornButton size="sm" @click="selectDate('next-month')">下个月</RebornButton>
    </template>
  </RebornCalendar>
</template>
```

### 实例方法

通过 `ref` 拿到实例后，`selectDate` 按方向跳转，`pickDay` 选中任意日期，`selectedDay` 读当前选中日期。

```vue
<script setup lang="ts">
const calendar = ref()
</script>

<template>
  <RebornButton @click="calendar?.selectDate('next-year')">下一年</RebornButton>
  <RebornCalendar ref="calendar" v-model="value" />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` / v-model | `Date \| string` | - | 选中日期；默认收发 `timezone` 时区（缺省本地）当天零点的 `Date`，设置 `valueFormat` 后收发字符串。未绑定时组件内部维护，视图始终停在选中日期所在的月份。 |
| `mode` / v-model:mode | `'month' \| 'year'` | `'month'` | 视图模式；传了合法的 `range` 时恒为月视图。 |
| `range` | `[Date, Date]` | - | 只显示的日期区间；开始补到周日、结束补到周六，须同月或相邻月，不合法时控制台警告并退回普通月视图。 |
| `controllerType` | `'select' \| 'button'` | `'select'` | 工具栏左侧控件：年月下拉 / 前后翻页按钮加年月标题。 |
| `formatter` | `(value: number, type: 'year' \| 'month') => string \| number` | - | 年份、月份下拉选项的文案；月份的 `value` 为 1~12。不传时为「2026 年」「10 月」。 |
| `events` | `CalendarEvent[]` | `[]` | 事项数据 `{ date, title, color?, ...自定义字段 }`；`date` 无法解析的事项被跳过。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error'` | `'primary'` | 有事项日期的浅底、顶边、日期文字，选中实底、今天描边、事项圆点的默认色，以及工具栏年月下拉与月 / 年切换的颜色。 |
| `titleAlign` | `'left' \| 'center' \| 'right'` | `'right'` | 表头星期、公历日期与下方农历文字的水平对齐。 |
| `border` | `boolean` | `false` | 边框模式：主体加无圆角外框，格子之间画分隔线，列间距取消。 |
| `lunar` | `boolean` | `false` | 农历模式：公历日期下方以较小字号显示节日 / 节气 / 月名 / 日名，工具栏显示干支年与生肖；运行环境不支持 Intl 中国历法时不显示。 |
| `timezone` | `string` | - | IANA 时区名（如 `'Asia/Shanghai'`）。决定「今天」、带时区的时刻落在哪天，以及向外派发的 `Date` 取哪个时区的零点；不传用本地时区，非法名称警告后退回本地时区。 |
| `valueFormat` | `string` | - | dayjs 格式串（如 `'YYYY-MM-DD'`）。设置后 `v-model` 收发该格式的字符串，不经过 `Date` 的时区换算。 |
| `class` | `any` | - | 追加到根容器的类名。 |
| `ui` | `CalendarUI` | `{}` | 按结构键覆盖各节点样式，键位见「自定义样式（ui）」。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: Date \| string)` | 选中日期变化（由 `defineModel` 生成）；设置 `valueFormat` 时是字符串。翻页、改年月、点「今天」也会触发。 |
| `update:mode` | `(value: 'month' \| 'year')` | 视图模式变化（由 `defineModel` 生成）。 |
| `panel-change` | `(date: Date, mode: 'month' \| 'year')` | 显示的月份、年份或视图模式变化时触发；首次渲染不触发。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `header` | `{ date: string, value: Date, mode: 'month' \| 'year', selectDate: (type) => void }` | 替换整个工具栏；`date` 为标题文案，`value` 为视图基准日。 |
| `date-cell` | `{ data: CalendarDateCellData, events: CalendarEvent[] }` | 替换月视图日期格的内容（日期、农历文字与事项区）；年视图不生效。 |

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `selectedDay` | `ComputedRef<Date \| undefined>` | 当前已选日期（`timezone` 时区当天零点）；通过组件实例访问时自动解包。 |
| `pickDay` | `(day: Date \| string) => void` | 选择一个具体日期，视图随之跳到该月；字符串按 `valueFormat` 或通用规则解析，`Date` 按 `timezone` 换算到当天。 |
| `selectDate` | `(type: 'prev-month' \| 'next-month' \| 'prev-year' \| 'next-year' \| 'today') => void` | 选择日期：前后一月 / 一年保持日不变（目标月没有这一天时取月末），`today` 选中今天。 |
| `calculateValidatedDateRange` | `(start: Date, end: Date) => [Date, Date][]` | 把区间补成整周后按月拆段，每段首尾同月；补周后跨度超过三个月返回空数组。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖 Tailwind 类名，定义在 `app/components/reborn/ui/reborn-calendar/reborn-calendar.config.ts`。

| 键名 | 说明 |
| --- | --- |
| root | 根容器，默认 `w-full min-w-0`。 |
| header | 工具栏，左右两端对齐，窄屏换行。 |
| controller | 工具栏左侧控件组，间隔 8px。**仅在不使用 `header` 插槽时渲染**，下同。 |
| title | 翻页模式与区间模式下的年月标题，默认 `text-base font-medium text-gray-10`。 |
| lunarYear | 农历模式下工具栏里的干支年，默认 `text-sm text-gray-6`；未开启 `lunar` 时不渲染。 |
| select | 年份、月份下拉；年份默认 `w-28`、月份 `w-24`，这里的宽度会覆盖默认值。 |
| navButton | 翻页按钮，默认与 md 按钮等高的正方形。 |
| body | 日历主体，默认 `mt-6`（与工具栏间隔 24px）。 |
| row | 表头行与每一行单元格，默认 `grid gap-x-2`，月视图 7 列、年视图 4 列；边框模式下 `gap-x-0`。 |
| weekday | 表头星期，默认 `h-7 text-base text-gray-5`，对齐随 `titleAlign`。 |
| cell | 单元格，默认 `border-t border-gray-4 p-1`；有事项时叠加语义色浅底与顶边，边框模式下补左分隔线。 |
| cellHeader | 日期标题容器，公历在上、农历在下，对齐随 `titleAlign`。**仅在不使用 `date-cell` 插槽时渲染**，下同。 |
| date | 日期标题按钮，默认 `text-base text-gray-9` 的圆角胶囊；补位日期 `text-gray-5`。 |
| lunar | 公历日期下方的农历文字，默认 `text-sm text-gray-6`，小于公历的 `text-base`；节日与节气用语义色，未开启 `lunar` 时不渲染。 |
| content | 事项区，默认 `h-[65px] pt-0.5`。 |
| eventList | 事项列表，超出事项区时纵向滚动；当天没有事项时不渲染。 |
| event | 单条事项，圆点与标题间隔 4px。 |
| eventDot | 事项圆点，默认 `size-1 rounded-full`，颜色取事项或日历的 `color`。 |
| eventTitle | 事项标题，默认 `text-base leading-normal text-gray-8`，超长省略。 |

```vue
<template>
  <RebornCalendar :events="events" :ui="{ content: 'h-[86px]', eventTitle: 'text-sm' }" />
</template>
```

## 注意事项

- **视图跟着选中日期走**。翻页、改年月下拉、点「今天」都会改写 `v-model`，没有独立的「当前显示月份」；只想翻看不想改选中值时，用 `header` 插槽自己维护一份月份并通过 `pickDay` 驱动，或在 `update:modelValue` 里区分来源。
- **`controller-type` 默认是 `select`**。`el-calendar` 的默认是 `button`，这里按设计稿把年月下拉作为默认工具栏；需要与 Element Plus 行为一致时显式写 `controller-type="button"`。
- **一周固定从周日开始**。表头恒为「日 一 二 三 四 五 六」，周首周尾手算，不受 dayjs 全局 locale 影响；目前没有 `first-day-of-week` 之类的配置。
- **`range` 会向外补齐整周**。开始与结束不必正好是周日 / 周六，组件会自动补齐；但原始区间超过相邻两个月时直接判为不合法，控制台警告后退回普通月视图，不会截断显示。
- **事项按天归档，不支持跨天事项**。`date` 只取到日，同一条事项不会铺满多天；跨天的会议需要按天拆成多条。
- **插槽会连带替换样式节点**。用了 `date-cell` 后默认的日期标题、农历文字与事项列表一起被替换，`cellHeader` / `date` / `lunar` / `content` / `eventList` / `event` / `eventDot` / `eventTitle` 这些 `ui` 键随之失效；`header` 插槽同理会让 `controller` / `title` / `select` / `navButton` 失效。
- **默认的 `Date` 绑定值会在序列化时「差一天」**。东八区的 10 月 20 日零点 `toISOString()` 是 `2026-10-19T16:00:00.000Z`，这是 `Date` 表示时刻的固有行为；要把选中日期交给接口，用 `value-format` 收发字符串。
- **「今天」按客户端时区计算并跨天自动刷新**。服务端渲染时服务器若与用户不在同一时区，首屏的「今天」可能差一天，客户端挂载后立刻修正，并在该时区的下一个零点刷新；需要首屏就一致时传 `timezone`。
- **农历依赖运行环境的 Intl 中国历法**。现代浏览器与带完整 ICU 的 Node 都支持；不支持的环境里 `lunar` 静默不显示。节气只覆盖 2000–2099 年，范围外只显示农历日名。
- **事项管理由业务层维护**。日历不内置编辑按钮或新增、编辑事件；在 `date-cell` 插槽里组合右键菜单、弹窗和输入框，更新传入的 `events` 后月视图与年视图会同步展示。需要刷新后保留事项时，还需自行保存到接口或本地存储。
- **事项行高有意偏离字号令牌**。设计稿的事项标题行高是 150%（21px），而 `text-base` 令牌自带 22px；事项区去掉 2px 顶距后正好放下 3 条 21px 的事项，所以 `eventTitle` 叠了 `leading-normal`，改字号时记得一起调 `content` 的高度。
