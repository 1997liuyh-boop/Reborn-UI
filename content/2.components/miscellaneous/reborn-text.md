---
title: 文本 Text
description: 双端文本组件：按 type 格式化手机号、姓名、金额、银行卡、邮箱并可脱敏，支持多行省略；Web 另有截断气泡。
category: 通用
platform: both
tags: [css, tailwind, text, format, mask, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornTextDemo.vue" config="RebornTextConfig" componentId="reborn-text" :componentFiles='["RebornText.vue", "reborn-text.config.ts"]' :uniappFiles='["RebornText.vue", "reborn-text.config.ts"]'}
::

## 简介

Text 是承载一段行内文本的展示组件，把常见的「格式化 + 脱敏 + 省略」逻辑收进同一个节点，Web 与 UniApp 两端同名，格式化与脱敏规则一致，但金额默认值、字号单位与端特有能力不同。

`type` 决定按哪种规则格式化（`default` / `phone` / `name` / `amount` / `card` / `email`），`mask` 决定是否脱敏，两者独立：`mask` 只对 `phone` / `name` / `card` / `email` 生效，`amount` 只做数字格式化。`ellipsis` + `lines` 控制省略，与格式化互不干扰。

其余 API：`color` / `size` 控制外观；`currency` / `currencyPosition` / `precision` / `thousandsIcon` 调整金额；`maskStart` / `maskEnd` / `maskChar` 调整脱敏；`preWrap` 保留空白。Web 端独有 `tooltip`（截断时自动气泡）与作用域插槽 `content`；UniApp 端独有 `selectable` / `space` / `decode`，透传给原生 `text`。

### 何时使用

- 列表、详情页中展示需要脱敏的敏感信息——用 `type="phone"` / `type="card"` 等配合 `mask`。
- 展示金额且需要统一小数位与千分位——用 `type="amount"` + `precision`（Web 还需传 `currency` / `thousandsIcon`）。
- 定宽容器里的标题或描述需要截断——用 `ellipsis` + `lines`，Web 端再加 `tooltip` 让用户看到全文。
- 需要让一段文字带语义色——用 `color`，不必手写 `text-*` 类名。

### 何时不使用

- 富文本或含 HTML 标签的内容 —— 改用 `v-html` 或专门的富文本渲染方案，本组件只输出纯文本。
- 数字需要滚动 / 跳动动画 —— 改用 `number-ticker`。
- 大段正文排版（段落、标题层级） —— 直接用原生 `p` / `h*` 与排版类名，本组件是行内节点。

## 用法

### 基础用法

文本可以通过 `value` 传入，也可以写进默认插槽；两者同时存在时**默认插槽优先**，`value` 的格式化结果不会显示。Web 端默认插槽暴露作用域参数 `content`（格式化后的文本），可以在插槽里拼接前后缀而不丢失格式化。

`size` 是数字，直接写入行内 `font-size`：Web 端单位为 px，UniApp 端单位为 rpx。

```vue
<template>
  <RebornText value="通过 value 传入的文本" />
  <RebornText>通过默认插槽传入的文本</RebornText>

  <!-- Web：用作用域参数保留脱敏结果 -->
  <RebornText type="phone" value="13812345678" mask>
    <template #default="{ content }">联系电话：{{ content }}</template>
  </RebornText>

  <RebornText :size="20" value="Web 下为 20px，UniApp 下为 20rpx" />
</template>
```

### 语义色

`color` 取全站语义色，映射到 `text-<color>` 类名。不传时不加颜色类，文字继承父级颜色。

| `color` | 典型用途 |
| --- | --- |
| `primary` | 可点击或需要强调的文字 |
| `secondary` | 次要强调 |
| `success` | 完成、通过、正向数值 |
| `info` | 提示性说明 |
| `warning` | 待处理、临界值 |
| `error` | 失败、欠款、负向数值 |
| `neutral` | 中性说明文字 |

```vue
<template>
  <RebornText color="success" value="已完成" />
  <RebornText color="error" value="审核未通过" />
</template>
```

### 格式化与脱敏

`type` 选择规则，`mask` 为 `true` 时才替换字符。各类型的行为与生效条件：

| `type` | 脱敏规则（`mask` 为 `true`） | 生效条件 | 示例 |
| --- | --- | --- | --- |
| `default` | 不处理，原样输出 | - | `hello` |
| `phone` | 保留前 3 位与后 4 位，中间固定 4 个 `maskChar` | 长度恰为 11 位，否则原样输出 | `138****5678` |
| `name` | 2 个字保留首字；3 个字及以上保留首尾字 | 长度大于 1 | `张*丰` |
| `card` | 保留前 `maskStart` 位与后 `maskEnd` 位 | 长度不小于 8 | `622*********7890` |
| `email` | 用户名保留首尾字符，域名完整保留 | 含 `@` 且用户名长于 2 个字符 | `h***o@example.com` |
| `amount` | 不脱敏，只格式化数字，见下一节 | - | - |

```vue
<template>
  <RebornText type="phone" value="13812345678" mask />
  <RebornText type="name" value="张三丰" mask />
  <RebornText type="card" value="6222021234567890" mask :mask-start="4" mask-char="#" />
  <RebornText type="email" value="hello@example.com" mask />
</template>
```

::tip
`maskStart` / `maskEnd` 只对 `card` 生效；`phone` 的保留位数固定为前 3 后 4，`email` / `name` 也不读这两个参数。`maskChar` 对所有脱敏类型都生效。
::

### 金额：货币符号、千分位与精度

`type="amount"` 先按 `precision` 调用 `toFixed`，再插入千分位。两端在货币符号与千分位的默认值上不一致：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
`currency` 默认为空字符串、`thousandsIcon` 默认不插入分隔符，所以不传参数时 `12345.6` 输出为 `12345.60`。货币符号渲染在独立的 `<span>` 里（可用 `ui.currency` 单独设样式），`currencyPosition="after"` 时排在数字之后。值无法解析为数字时原样输出字符串。

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `precision` | `2` | 小数位数 |
| `currency` | `''` | 货币符号，为空时不渲染符号节点 |
| `currencyPosition` | `'before'` | 符号位置，`'after'` 时后置 |
| `thousandsIcon` | - | 千分位分隔符，不传时不分隔 |

```vue
<template>
  <!-- 输出 ¥12,345.60 -->
  <RebornText type="amount" :value="12345.6" currency="¥" thousands-icon="," />
  <!-- 输出 12,346元 -->
  <RebornText
    type="amount"
    :value="12345.6"
    currency="元"
    currency-position="after"
    :precision="0"
    thousands-icon=","
  />
</template>
```
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
`currency` 默认为 `'¥'`，千分位固定为 `,`，符号直接拼接在数字前面，与数字处于同一文本节点，因此无法单独设样式，也不能后置。

| 参数 | 默认值 | 作用 |
| --- | --- | --- |
| `precision` | `2` | 小数位数 |
| `currency` | `'¥'` | 货币符号，传 `''` 可去掉 |

```vue
<template>
  <!-- 输出 ¥12,345.60 -->
  <RebornText type="amount" :value="12345.6" />
  <!-- 输出 $12,345.6 -->
  <RebornText type="amount" :value="12345.6" currency="$" :precision="1" />
</template>
```
:::

::

### 多行省略与气泡提示

`ellipsis` 为 `true` 时切换为 `-webkit-box` 布局并按 `lines` 截断（默认 1 行），`lines` 仅在 `ellipsis` 开启时生效。省略依赖宽度约束，需要给组件或父容器设最大宽度。

Web 端再开 `tooltip` 时，组件用 `ResizeObserver` 监听尺寸，只有 `scrollHeight` / `scrollWidth` 超出可视区域（即确实被截断）时才启用 `RebornTooltip` 并加 `cursor-pointer`，短文本不会弹出气泡。

```vue
<template>
  <RebornText ellipsis tooltip class="max-w-[100px]">
    这是一段很长的单行文本内容，超出会显示省略号和气泡
  </RebornText>
  <RebornText ellipsis :lines="2" tooltip class="max-w-xs">
    多行文本超过两行时截断，悬停显示全文。
  </RebornText>
</template>
```

::warning
`tooltip` 仅 Web 端可用，UniApp 端没有该 prop，截断后需要自行提供查看全文的入口（如点击弹窗）。
::

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | 显示的值；提供默认插槽时被插槽内容覆盖。 |
| `type` | `string` | `'default'` | 格式化类型，可选 `default` / `phone` / `name` / `amount` / `card` / `email`，其他取值按 `default` 处理。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | - | 语义色；不传时继承父级颜色。 |
| `size` | `number` | - | 字号，单位 px，写入行内样式。 |
| `mask` | `boolean` | `false` | 是否脱敏；仅对 `phone` / `name` / `card` / `email` 生效。 |
| `currency` | `string` | `''` | 金额货币符号；为空时不渲染符号节点。 |
| `currencyPosition` | `'before' \| 'after'` | - | 货币符号位置；不传或非 `'after'` 时前置。 |
| `precision` | `number` | `2` | 金额小数位数。 |
| `thousandsIcon` | `string` | - | 金额千分位分隔符；不传时不分隔。 |
| `maskStart` | `number` | `3` | 银行卡脱敏时保留的前几位。 |
| `maskEnd` | `number` | `4` | 银行卡脱敏时保留的后几位。 |
| `maskChar` | `string` | `'*'` | 脱敏替换字符。 |
| `ellipsis` | `boolean` | `false` | 是否超出省略。 |
| `lines` | `number` | `1` | 最大行数，仅 `ellipsis` 为 `true` 时生效。 |
| `tooltip` | `boolean` | `false` | 内容被截断时自动显示 Tooltip 展示全文。 |
| `preWrap` | `boolean` | `false` | 是否保留空白与换行（`whitespace-pre-wrap`）。 |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `ui` | `{ base?: ClassValue; currency?: ClassValue }` | - | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | 显示的值；提供默认插槽时被插槽内容覆盖。 |
| `type` | `string` | `'default'` | 格式化类型，可选 `default` / `phone` / `name` / `amount` / `card` / `email`，其他取值按 `default` 处理。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | - | 语义色；不传时继承父级颜色。 |
| `size` | `number` | - | 字号，单位 rpx，写入行内样式；不传时为 `text-28`。 |
| `mask` | `boolean` | `false` | 是否脱敏；仅对 `phone` / `name` / `card` / `email` 生效。 |
| `currency` | `string` | `'¥'` | 金额货币符号，直接拼接在数字前。 |
| `precision` | `number` | `2` | 金额小数位数；千分位固定为 `,`。 |
| `maskStart` | `number` | `3` | 银行卡脱敏时保留的前几位。 |
| `maskEnd` | `number` | `4` | 银行卡脱敏时保留的后几位。 |
| `maskChar` | `string` | `'*'` | 脱敏替换字符。 |
| `ellipsis` | `boolean` | `false` | 是否超出省略。 |
| `lines` | `number` | `1` | 最大行数，仅 `ellipsis` 为 `true` 时生效。 |
| `preWrap` | `boolean` | `false` | 是否保留空白与换行；APP 端不生效。 |
| `selectable` | `boolean` | `false` | 文本是否可选，透传给原生节点。 |
| `space` | `string` | `''` | 显示连续空格的方式（`ensp` / `emsp` / `nbsp`），透传给原生节点。 |
| `decode` | `boolean` | `false` | 是否解码字符实体，APP 端解析实体时需开启。 |
| `customClass` | `string` | `''` | 追加到根节点的自定义类名（对应 Web 端 `class`）。 |
| `ui` | `{ base: string }` | `{ base: '' }` | 细粒度样式覆盖，键位见「自定义样式（ui）」。 |

:::

::

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | `{ content }` | 替换整块文本内容（含货币符号节点）；`content` 为格式化后的值。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 替换格式化后的文本内容，不提供作用域参数。 |
:::

::

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端 DOM 结构不同，可用键位也不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名 | 说明 |
| --- | --- |
| `base` | 根元素 `<span>`，默认 `inline [flex-shrink:unset]`；`color` / `preWrap` / `ellipsis` 的变体类与 `class` prop 都并到这个节点。开启 `tooltip` 时它被包在 `RebornTooltip` 里，仍是同一个 `<span>`。 |
| `currency` | 货币符号节点，默认无类名。**仅在 `currency` 非空且未填充 default 插槽时渲染**，填充插槽会替换整块兜底内容，`ui.currency` 随之失效。位置由 `currencyPosition` 决定。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名 | 说明 |
| --- | --- |
| `base` | 根节点，小程序端为 `<view>`，其他端为 `<text>`。默认 `reborn-text [flex-shrink:unset] text-28`（APP 端为 `reborn-text text-28`）；`customClass` 也并到这个节点。UniApp 没有独立的货币符号节点，因此没有 `currency` 键。 |

:::

::

```vue
<template>
  <RebornText
    type="amount"
    :value="12345.6"
    currency="¥"
    thousands-icon=","
    :ui="{ base: 'font-semibold text-error', currency: 'mr-0.5 text-xs' }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 自定义类名 | `class` | `customClass` |
| `size` 单位 | px | rpx，默认 `text-28` |
| 金额货币符号 | 默认 `''`，独立节点，可 `currencyPosition` 后置 | 默认 `'¥'`，拼接在数字前，不可后置 |
| 金额千分位 | `thousandsIcon` 指定，默认不分隔 | 固定 `,` |
| 非数字金额 | 原样输出字符串 | 输出 `NaN` |
| 截断气泡 | `tooltip` | 不支持 |
| 插槽作用域 | `{ content }` | 无 |
| `ui` 键位 | `base` / `currency` | `base` |
| 根节点 | `<span>` | 小程序 `<view>`，其他端 `<text>` |
| 原生文本能力 | 不支持 | `selectable` / `space` / `decode` |

## 注意事项

- **Web 端金额默认不带符号也不分千分位**。`currency` 默认为空、`thousandsIcon` 默认不传，要得到 `¥12,345.60` 必须显式传 `currency="¥" thousands-icon=","`；UniApp 端默认就是这个效果，迁移时注意补参。
- **`mask` 不传时不脱敏**。`type="phone"` 等只声明规则，必须同时开 `mask` 才会替换字符。
- **脱敏有长度门槛**。手机号必须恰好 11 位、银行卡不少于 8 位、邮箱用户名需长于 2 个字符，不满足时原样输出，不会报错，敏感数据校验需在业务层完成。
- **`maskStart` / `maskEnd` 只影响 `card`**。手机号保留位数写死为前 3 后 4，改这两个参数不会生效。
- **默认插槽会覆盖格式化结果**。插槽内容替换整块兜底内容（Web 含货币符号节点），需要保留格式化时在 Web 端用作用域参数 `content`。
- **Web 端不透传未声明的属性**。组件设置了 `inheritAttrs: false` 且未绑定 `$attrs`，`id`、`data-*`、`@click` 等写在组件上不会落到 DOM，需要时包一层元素。
- **省略需要宽度约束**。`ellipsis` 只负责截断样式，组件本身是行内元素，不设 `max-w-*` 或父容器宽度时不会出现省略号，`tooltip` 也就不会触发。
- **UniApp 根节点随平台变化**。小程序端渲染 `<view>`、其他端渲染 `<text>`，在 `<text>` 里嵌套非文本组件在 APP 端可能不显示，需要复杂插槽时注意端差异。
