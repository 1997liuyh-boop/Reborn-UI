---
title: 时间选择器
description: Web 单点时间录入：支持时分秒六种组合、手动输入、两种中心选中样式，并保留范围与毫秒选择。
category: 表单与输入
platform: web
tags: [vue, tailwind, time-picker, input]
badge: Update
---

::ComponentViewer{demoFile="RebornTimePickerDemo.vue" config="RebornTimePickerConfig" componentId="reborn-time-picker" dependencies="dayjs" :componentFiles='["RebornTimePicker.vue", "RebornTimePanel.vue", "reborn-time-picker.config.ts", "reborn-time-panel.config.ts", "time-picker.utils.ts", "index.ts"]'}
::

## 简介

时间选择器用于精确到秒的单点时间录入，支持手动输入、点击选项、滚轮与键盘调整；当前仅提供 Web 实现。

`variant` 控制触发器的四种形态，与 `reborn-select` 共用 FieldTrigger；`panelVariant` 独立控制中心区域的填充或上下描边。`format` 控制显示列，`size` 控制触发器尺寸，`color` 控制语义配色。面板统一使用 14px 字号和 29px 行高盒子，显示五个完整选项及上下各半项。

`disabledHours` / `disabledMinutes` / `disabledSeconds` 约束输入与选择；`isRange` 和毫秒格式兼容既有场景。`triggerUi`、`ui`、`panelUi` 分别覆盖共享触发器、选择器和面板，`footer` 插槽可替换底部操作。

### 何时使用

- 录入任务执行时刻，使用默认 `format="HH:mm:ss"` 精确到秒。
- 仅记录小时、分钟或秒，使用 `format="HH"`、`"mm"` 或 `"ss"`，避免显示无关列。
- 需要快速键入时刻，保持 `allowInput=true`，并监听 `invalid` 提示格式或可选时间限制。
- 预约表单需要排除非营业时间，提供 `disabledHours`、`disabledMinutes` 或 `disabledSeconds`。
- 维护起止时段，使用 `isRange` 绑定 `[start, end]`。

### 何时不使用

- 需要同时选择日历日期 —— 改用 `reborn-date-picker`。
- 选项是固定文案时段而非真实时刻，例如「上午 / 下午」—— 改用 `reborn-select`。
- UniApp 端的日期或时间选择 —— 改用 `reborn-select-date`。

## 用法

### 基础与输入

默认可直接输入完整时间；回车或失焦时严格校验，非法值不会覆盖已提交值。

| 配置               | 行为                   | 典型用途     |
| ------------------ | ---------------------- | ------------ |
| `allowInput=true`  | 支持文本输入及面板选择 | 高频录入     |
| `allowInput=false` | 只读输入框，仅面板选取 | 避免手写格式 |
| `clearable=true`   | 非空时显示清空按钮     | 可选时间字段 |

```vue
<script setup lang="ts">
const time = ref("");
const error = ref("");
</script>
<template>
  <RebornTimePicker
    v-model="time"
    @invalid="error = '请填写可选的 HH:mm:ss 时间'"
    @change="error = ''"
  />
  <p v-if="error">{{ error }}</p>
</template>
```

### 时间精度

`format` 同时决定输入格式、输出字符串及可见时间列。

| format     | 显示列     | 典型用途     |
| ---------- | ---------- | ------------ |
| `HH:mm:ss` | 时、分、秒 | 精确执行时间 |
| `HH`       | 时         | 小时设置     |
| `mm`       | 分         | 分钟字段     |
| `ss`       | 秒         | 秒字段       |
| `HH:mm`    | 时、分     | 日常预约     |
| `mm:ss`    | 分、秒     | 分秒字段     |

```vue
<template>
  <RebornTimePicker
    v-model="time"
    format="HH:mm:ss"
  />
  <RebornTimePicker
    v-model="hour"
    format="HH"
  />
  <RebornTimePicker
    v-model="minute"
    format="mm"
  />
  <RebornTimePicker
    v-model="second"
    format="ss"
  />
  <RebornTimePicker
    v-model="hourMinute"
    format="HH:mm"
  />
  <RebornTimePicker
    v-model="minuteSecond"
    format="mm:ss"
  />
</template>
```

### 触发器变体

`variant` 与 `reborn-select` 使用同一触发器样式，不改变面板中心样式。

| variant      | 形态       | 典型用途 |
| ------------ | ---------- | -------- |
| `outlined`   | 描边，默认 | 标准表单 |
| `filled`     | 填充       | 浅色区块 |
| `borderless` | 无边框     | 内嵌字段 |
| `underlined` | 下划线     | 紧凑编辑 |

```vue
<template>
  <RebornTimePicker
    v-model="time"
    variant="outlined"
  />
  <RebornTimePicker
    v-model="time"
    variant="filled"
  />
  <RebornTimePicker
    v-model="time"
    variant="borderless"
  />
  <RebornTimePicker
    v-model="time"
    variant="underlined"
  />
</template>
```

### 中心聚焦变体

选项用 `RebornScrollbar` 滚动，停止后吸附；选中项保持常规字重，悬停背景为 `gray-2`。

| panelVariant | 中心区域                | 典型用途     |
| ------------ | ----------------------- | ------------ |
| `filled`     | 语义色第 1 阶背景，默认 | 需要背景强调 |
| `outlined`   | 上下伪元素细线：1px 缩放 50%，`gray-6`，悬停不遮挡  | 需要细线定位 |

```vue
<template>
  <RebornTimePicker
    v-model="time"
    panel-variant="filled"
  />
  <RebornTimePicker
    v-model="time"
    panel-variant="outlined"
  />
  <!-- 内联面板使用 variant 控制同一中心样式 -->
  <RebornTimePanel
    v-model="time"
    variant="outlined"
  />
</template>
```

### 尺寸与颜色

触发器沿用三档尺寸和七种语义色，面板时间项不随尺寸改变，保证固定的可见行数。

| 维度    | 可选值                                                                         | 典型用途             |
| ------- | ------------------------------------------------------------------------------ | -------------------- |
| `size`  | `sm` / `md` / `lg`                                                             | 与相邻选择器对齐     |
| `color` | `primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral` | 业务语义与中心填充色 |

```vue
<template>
  <RebornTimePicker
    v-model="time"
    size="sm"
  />
  <RebornTimePicker
    v-model="time"
    size="md"
    color="success"
  />
  <RebornTimePicker
    v-model="time"
    size="lg"
    color="warning"
  />
</template>
```

### 禁用与可选时间

回调返回需要禁用的数字数组，规则对手动输入、选项点击、滚动、键盘和「此刻」共同生效。

| 配置              | 范围                   | 典型用途       |
| ----------------- | ---------------------- | -------------- |
| `disabled`        | 整个组件               | 只展示已有值   |
| `disabledHours`   | 0–23                   | 非营业小时     |
| `disabledMinutes` | 0–59，入参含小时       | 限制预约分钟   |
| `disabledSeconds` | 0–59，入参含小时、分钟 | 精确到秒的限制 |

```vue
<script setup lang="ts">
const time = ref("12:30:15");
const disabledHours = () => [0, 1, 2, 3, 4, 23];
const disabledMinutes = (hour: number) => (hour === 12 ? [0, 1, 2] : []);
</script>
<template>
  <RebornTimePicker
    v-model="time"
    :disabled-hours="disabledHours"
    :disabled-minutes="disabledMinutes"
  />
  <RebornTimePicker
    model-value="08:00:00"
    disabled
  />
</template>
```

### 范围与步进

`isRange` 的起止值与占位文字均居中显示（`text-center`）。

范围模式、上下按钮和毫秒列继续可用；范围顺序会校正为开始时间不晚于结束时间。

| 配置                    | 行为                 | 典型用途   |
| ----------------------- | -------------------- | ---------- |
| `isRange`               | 值为 `[start, end]`  | 工作时段   |
| `arrowControl`          | 各列增加上下步进按钮 | 逐项调整   |
| `format="HH:mm:ss.SSS"` | 增加毫秒列           | 高精度时刻 |

```vue
<template>
  <RebornTimePicker
    v-model="range"
    is-range
  />
  <RebornTimePicker
    v-model="time"
    arrow-control
  />
  <RebornTimePicker
    v-model="preciseTime"
    format="HH:mm:ss.SSS"
  />
</template>
```

### 关闭时机

通过 `closeOn` 控制外部关闭事件，参数与 `reborn-select` 完全一致，默认 `click`。

| 值 | 行为 | 典型用途 |
| --- | --- | --- |
| `click` | 外部点击完成后关闭 | 默认表单录入 |
| `mousedown` | 外部按下任意鼠标键或页面滚动时关闭；内部时间列滚动不关闭 | 需要及时收起浮层 |


```vue
<template>
  <RebornTimePicker close-on="click" />
  <RebornTimePicker close-on="mousedown" />
</template>
```

### 自定义底部

`showFooter` 默认 `true`；设为 `false` 隐藏整个底部（包括自定义插槽、分隔线和留白），时间选取仍实时更新绑定值，可通过外部点击或 Escape 关闭，不会因隐藏底部而自动触发 `confirm`。

```vue
<RebornTimePicker v-model="time" :show-footer="false" />
```

基础面板与 footer 为同级区域：基础面板横向 4px、纵向 8px 留白，footer 独立保留上下 8px 留白。默认按钮从左到右为 primary/text/sm「此刻」、primary/filled/sm「确定」，两按钮居中且各占一半可用宽度（扣除间距）。通过 `footer` 作用域插槽可完全替换操作内容、按钮数量与布局，提供 `confirm`、`clear`、`now` 方法。

| 插槽方法  | 行为                   | 典型用途     |
| --------- | ---------------------- | ------------ |
| `confirm` | 提交当前选择并关闭浮层 | 完成录入     |
| `clear`   | 清空绑定值             | 重置字段     |
| `now`     | 校正当前时刻并确认     | 快速填入此刻 |

```vue
<template>
  <RebornTimePicker v-model="time">
    <template #footer="{ clear, now, confirm }">
      <RebornButton
        size="sm"
        variant="text"
        @click="clear"
        >清空</RebornButton
      >
      <RebornButton
        size="sm"
        variant="text"
        @click="now"
        >此刻</RebornButton
      >
      <RebornButton
        size="sm"
        @click="confirm"
        >确定</RebornButton
      >
    </template>
  </RebornTimePicker>
</template>
```

## API

### Props

以下为 `RebornTimePicker`；`modelValue` 通过 `defineModel` 双向绑定。

| 属性                   | 类型                                                                                   | 默认值             | 说明                   |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------ | ---------------------- |
| `modelValue`           | `string \| string[]`                                                                   | `''`               | 单点字符串或范围数组   |
| `variant`              | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                               | `'outlined'`       | 触发器形态             |
| `panelVariant`         | `'filled' \| 'outlined'`                                                               | `'filled'`         | 中心选中形态           |
| `allowInput`           | `boolean`                                                                              | `true`             | 仅单点模式支持手动输入 |
| `icon`                 | `string`                                                                               | `'lucide:clock-3'` | 尾部图标               |
| `closeOn`              | `'click' \| 'mousedown'`                                                               | `'click'`          | 与 reborn-select 一致；click 在外部点击后关闭，mousedown 在外部按下或页面滚动时关闭，内部滚动不关闭       |
| `placeholder`          | `string`                                                                               | `'请选择时间'`     | 单点占位符             |
| `startPlaceholder`     | `string`                                                                               | `'开始时间'`       | 范围起点占位符         |
| `endPlaceholder`       | `string`                                                                               | `'结束时间'`       | 范围终点占位符         |
| `rangeSeparator`       | `string`                                                                               | `'~'`              | 范围文本分隔符         |
| `disabled`             | `boolean`                                                                              | `false`            | 禁用全部交互           |
| `clearable`            | `boolean`                                                                              | `true`             | 是否显示清空按钮       |
| `isRange`              | `boolean`                                                                              | `false`            | 范围选择               |
| `showFooter` | `boolean` | `true` | 显示底部操作区，包含自定义 footer 插槽 |
| `arrowControl`         | `boolean`                                                                              | `false`            | 显示上下步进按钮       |
| `format`               | `string`                                                                               | `'HH:mm:ss'`       | 时间格式与可见列       |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                 | `'md'`             | 触发器尺寸             |
| `color`                | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`        | 语义色                 |
| `class`                | `ClassValue`                                                                           | —                  | 触发器根节点样式       |
| `disabledHours`        | `(role?, comparingValue?) => number[]`                                                 | `() => []`         | 禁用小时               |
| `disabledMinutes`      | `(hour, role?, comparingValue?) => number[]`                                           | `() => []`         | 禁用分钟               |
| `disabledSeconds`      | `(hour, minute, role?, comparingValue?) => number[]`                                   | `() => []`         | 禁用秒                 |
| `disabledMilliseconds` | `(hour, minute, second, role?, comparingValue?) => number[]`                           | `() => []`         | 禁用毫秒               |
| `bordered`             | `boolean`                                                                              | `true`             | 兼容边框开关           |
| `showArrow`            | `boolean`                                                                              | `true`             | 是否显示尾部图标       |
| `arrowAnimation`       | `boolean`                                                                              | `true`             | 展开时图标旋转         |
| `portal`               | `boolean`                                                                              | `true`             | 浮层传送至 body        |
| `autoAdjustOverflow`   | `boolean`                                                                              | `true`             | 自动选择向上或向下展开 |
| `triggerUi`            | `SelectTriggerProps['ui'] & FieldTriggerProps['ui']`                                   | —                  | 共享触发器与浮层样式   |
| `ui`                   | `Partial<Record<键名, ClassValue>>`                                                    | —                  | 选择器内部样式         |
| `panelUi`              | `TimePanelProps['ui']`                                                                 | —                  | 面板内部样式           |

禁用回调中 `role` 为 `'start' | 'end'`；单点传 `'start'`，`comparingValue` 为 `null`；范围模式传入另一端格式化后的值。未显示的单位按零传给后续单位的回调。

### Emits

| 事件名 | 参数 | 说明 |
| ------------------- | -------------------- | ------------------------------------ |
| `update:modelValue` | `string \| string[]` | 双向绑定更新                         |
| `change`            | `string \| string[]` | 有效选择、输入或清空                 |
| `clear`             | 无                   | 清空值                               |
| `confirm`           | `string \| string[]` | 确定、此刻或输入框回车               |
| `invalid`           | `string`             | 输入格式错误或时间被禁用             |
| `visibleChange`     | `boolean`            | 面板显隐，模板使用 `@visible-change` |
| `focus`             | `FocusEvent`         | 默认单点输入框获得焦点               |
| `blur`              | `FocusEvent`         | 默认单点输入框失焦                   |

### Slots

| 插槽名 | 参数 | 说明 |
| --------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `default` | `{ isOpen, toggle, clear, hasValue, rangeDisplay, singleDisplay }` | 自定义触发器内容，替换后不再提供默认文本输入 |
| `cover`   | 同 `default`                                                       | 覆盖共享触发器内容                           |
| `footer`  | `{ confirm, clear, now }`                                          | 自定义面板底部，仅 showFooter 为 true 时渲染 |

### 自定义样式（ui）

选择器使用 `ui` 覆盖外壳和输入；`panelUi` 覆盖面板，独立使用 `RebornTimePanel` 时相同键放入其 `ui`。

| 键名 | 所属配置 | 节点与默认行为 |
| --- | --- | --- |
| `wrapper` | ui / panelUi | 选择器外壳 / 面板外壳；面板外壳不设内边距，包含同级的 body 与 footer |
| `input` | ui | 默认单点输入框，背景透明，继承触发器字体 |
| `triggerText` | ui | 范围模式有值时的文字 |
| `placeholder` | ui | 范围模式空值占位文字 |
| `dropdown` | ui | 浮层容器，尺寸控制最小宽度 |
| `rangeText` | ui | 范围触发器文字容器 |
| `separator` | ui | 范围触发器的分隔符 |
| `body` | panelUi | 基础面板内容区，默认 px-1 py-2（横向 4px，纵向 8px），不包含 footer |
| `rangeWrapper` | panelUi | 范围面板布局容器 |
| `rangeSeparator` | panelUi | 两个范围面板之间的「至」 |
| `section` | panelUi | 一组时间列的容器 |
| `columns` | panelUi | 列容器，divide-x divide-gray-2 分隔 |
| `column` | panelUi | 单列与键盘焦点区域 |
| `arrowButton` | panelUi | arrowControl 开启后的上下按钮 |
| `list` | panelUi | RebornScrollbar 视口，高 174px，五整项与上下各半项 |
| `item` | panelUi | 选项，px-5 py-1 text-base text-gray-9；字号 14px、局部行高 150%，总高 29px |
| `itemActive` | panelUi | 选中项 font-normal，不加粗 |
| `itemDisabled` | panelUi | 禁用选项灰色，不响应选择 |
| `itemIdle` | panelUi | 未选项 font-normal；悬停背景在 item 中设置为 gray-2 |
| `indicator` | panelUi | 中心高 29px 的填充或上下描边 |
| `mask` | panelUi | 兼容覆盖层，默认透明且不拦截交互 |
| `footer` | panelUi | 底部操作容器，上下 py-2（8px），替换插槽后仍生效；showFooter 为 false 时不渲染 |

如覆盖行高，应同时调整 `list` 高度与 `indicator` 高度，避免中心视觉与选中项错位。

### CSS 变量

定义文件：`app/components/reborn/ui/reborn-time-picker/reborn-time-panel.config.ts`；字体基础令牌来自 `app/assets/theme/typography.css`。

| 变量                       | 默认行为                                              | 说明                                       |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| `--time-color-1`           | 按 `color` 指向对应色板的第 1 阶，neutral 使用 gray-2 | filled 中心背景                            |
| `--text-base--line-height` | 时间项局部设为 `1.5`                                  | 保持 14px 字号的 150% 行高，不改变全局令牌 |

### 独立面板

`RebornTimePanel` 接收 `modelValue`、`format`、`isRange`、`arrowControl`、`showFooter`、`size`、`color`、`disabled`、四个禁用回调、`class`、`ui`；中心形态通过 `variant` 设置。底部插槽参数与选择器一致。

面板事件为 `update:modelValue`、`change`、`clear`、`confirm`；实例暴露 `syncColumns()`、`clear()`、`confirm()`。面板在隐藏容器中挂载后，容器显示时可调用 `syncColumns()` 重新定位滚动列。选择器已在浮层进入完成后自动调用。

## 注意事项

- **打开不写值。** 空值打开时只以当前时刻初始化局部选择；选择选项、确认或点击「此刻」后才写入绑定值。
- **选项变动即时提交。** 「确定」用于结束选择而不是事务提交；关闭面板或按 Escape 不撤销已经点击或滚动提交的值，只丢弃未提交的输入草稿。
- **输入严格匹配格式。** `HH:mm:ss` 需要补齐两位数；`24:00:00`、超范围分秒和被禁用的时间均触发 `invalid`，外部关闭会恢复已提交值。
- **「此刻」遵循限制。** 当前时间不可选时按列校正到可用项，没有可用组合则不确认、不写入；外部传入的不合法值不会在挂载时被自动改写。
- **时间不是跨日时长。** 小时为 0–23、分秒为 0–59；范围自动排序，不用于表达跨午夜的倒序区间。
- **单点输入与范围模式不同。** `allowInput` 仅对默认单点触发器生效；`isRange=true` 或自定义触发器时通过面板选择。
- **浮层默认脱离父容器。** `portal=true` 传送到 body；关闭后可能被父级 overflow 裁剪。`closeOn='mousedown'` 可在按下鼠标时提前关闭。
- **仅 Web 实现。** 本次不变更 UniApp 组件；`reborn-select-date` 是另一个组件，并非此组件的同构实现。
