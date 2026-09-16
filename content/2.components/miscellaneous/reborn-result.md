---
title: Result 结果页
description: 操作结果的终态页：图标、标题与描述、操作区三段纵向居中，七种状态含 403 / 404 / 500。
category: 反馈
platform: both
tags: [css, tailwind, result, feedback, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornResultDemo.vue" config="RebornResultConfig" componentId="reborn-result" :componentFiles='["RebornResult.vue", "reborn-result.config.ts"]' :uniappFiles='["RebornResult.vue", "reborn-result.config.ts"]'}
::

## 简介

一次操作或一次请求走完之后，用整块区域交代终态：提交成功、提交失败、无权限、页面不存在。两端同名同构，`title` / `sub-title` / `icon` 三个 props 与 `icon` / `title` / `sub-title` / `extra` 四个插槽逐一相同，只有根节点类名入口与图标写法按端分叉。

结构固定为三段纵向居中：**图标区**由 `icon` 决定（字形与配色一起定），**标题加描述**由 `title` / `sub-title` 决定，**操作区**由 `extra` 插槽决定。三段互相独立、各自可缺省，段间距 24px（UniApp 48rpx），标题与描述之间 8px（UniApp 16rpx）。

余下的 API 面很小：四个插槽分别接管三段的内容（图标区、标题、描述、操作区），`ui` 按七个结构键覆盖节点类名，根节点另有 Web 的 `class` 与 UniApp 的 `custom-class`。组件不派发事件，也不暴露实例方法。

### 何时使用

- 表单 / 订单 / 支付流程走完后的独立结果页——`icon="success"` 配 `title` 说明结果，`extra` 插槽放「返回首页」「查看订单」。
- 失败终态且需要给出补救动作——`icon="error"`，`sub-title` 写失败原因，`extra` 放「重试」。
- 路由级的异常页——`icon` 取 `403` / `404` / `500`，三者复用语义配色，不必自己配图。
- 结果部分成功、需要提醒但不算失败——`icon="warning"`，`sub-title` 写清哪几条没成功。
- 需要整幅插画而非图标——`:icon="null"` 配 `icon` 插槽，底板会退化成无尺寸透明容器。

### 何时不使用

- 页面内常驻的一行状态说明 —— 改用 `reborn-alert`，它是横向排布的提示条，不占整屏。
- 操作后的瞬时反馈（保存成功、已复制）—— 改用 `reborn-toast`，Result 是需要用户停留并做下一步决策的终态页。
- 需要用户确认后才能继续的阻断式反馈 —— 改用 `reborn-dialog` 或 `reborn-popconfirm`。
- 列表 / 表格的空数据占位 —— 改用 `reborn-empty`，它的标题是 14px，嵌在卡片、表格里不会压过周围内容；Result 的标题固定 24px，是给整屏终态页用的。

## 用法

### 七种状态

`icon` 决定图标区的字形与配色，默认 `info`。前四种是语义反馈，后三种是 HTTP 状态码；状态码不额外配色，而是复用语义色——403 是权限拦截走警示色，404 只是资源不存在、不算故障走信息色，500 是服务端故障走错误色。

| `icon` | 图标 | 配色 | 典型用途 |
| --- | --- | --- | --- |
| `info` | `lucide:info` | info（蓝） | 中间态：已提交、等待审核 |
| `success` | `lucide:circle-check` | success（绿） | 操作完成，可以进入下一步 |
| `warning` | `lucide:circle-alert` | warning（橙） | 部分成功，需要用户知晓 |
| `error` | `lucide:circle-x` | error（红） | 操作失败，通常配重试动作 |
| `403` | `lucide:lock` | warning（橙） | 已登录但无权访问 |
| `404` | `lucide:file-question` | info（蓝） | 资源不存在或链接过期 |
| `500` | `lucide:server-crash` | error（红） | 服务端异常 |

```vue
<template>
  <RebornResult icon="success" title="提交成功" sub-title="订单已创建，24 小时内完成发货。" />
  <RebornResult icon="error" title="提交失败" sub-title="收货地址缺少街道信息，补全后重试。" />
  <RebornResult icon="403" title="无访问权限" sub-title="当前账号不在该空间的成员名单内。" />
  <RebornResult icon="500" title="服务异常" sub-title="请求未能完成，稍后重试或联系管理员。" />
</template>
```

### 隐藏图标与自定义图标

`:icon="null"` 把整个图标区去掉，连同它下面的 24px（UniApp 48rpx）间距一起消失。`icon` 插槽只替换字形，圆形底板与语义色淡底仍在；两者一起用时底板退化成无尺寸、无底色的透明容器，插画自己决定大小。

::code-group
```vue [Web]
<template>
  <RebornResult :icon="null" title="已退出登录" sub-title="下次访问需要重新验证身份。" />

  <!-- 保留底板与淡底，只换字形 -->
  <RebornResult icon="success" title="打款完成">
    <template #icon>
      <Icon name="lucide:wallet" class="size-8 shrink-0" />
    </template>
  </RebornResult>

  <!-- 底板不再限制尺寸，插画可以放大 -->
  <RebornResult :icon="null" title="正在同步">
    <template #icon>
      <Icon name="lucide:loader-circle" class="text-primary size-24 animate-spin" />
    </template>
  </RebornResult>
</template>
```

```vue [UniApp]
<template>
  <RebornResult :icon="null" title="已退出登录" sub-title="下次访问需要重新验证身份。" />

  <RebornResult icon="success" title="打款完成">
    <template #icon>
      <view class="i-lucide-wallet size-[64rpx] shrink-0" />
    </template>
  </RebornResult>

  <RebornResult :icon="null" title="正在同步">
    <template #icon>
      <view class="i-svg-spinners-180-ring-with-bg size-[192rpx] text-primary" />
    </template>
  </RebornResult>
</template>
```
::

::tip
`withDefaults` 只在 prop 为 `undefined` 时填默认值，所以显式写 `:icon="null"` 会原样传进组件；漏写 `icon` 走的是默认 `'info'`，两者结果不同。
::

### 标题与描述

`title` 固定 24px / 500 字重 / 行高 150%，`sub-title` 固定 14px / 常规字重 / 行高 150%，两者之间 8px（UniApp 16rpx）。两个 prop 都只收纯文本，被插值进文本节点；要放链接、行内代码或多行排版，改用同名的 `title` / `sub-title` 插槽，插槽存在时对应 prop 不再渲染。

```vue
<template>
  <RebornResult icon="error" title="部署失败">
    <template #sub-title>
      构建在 <code>pnpm build</code> 阶段退出，退出码 1。
      <a href="/logs">查看完整日志</a>
    </template>
  </RebornResult>
</template>
```

### 操作区

`extra` 插槽是第三段，内部 flex 横向排列、超宽自动换行、元素间距 12px（UniApp 24rpx），整体居中。组件本身不派发任何事件，所有交互由放进插槽的元素自己承担。

放两个按钮时按「次要动作在左、主要动作在右」排：左侧 `color="neutral" variant="outlined" size="md"`，右侧 `color="primary" variant="filled" size="md"`。这是排版约定不是组件行为，Result 不会替你调整插槽内元素的样式。

::code-group
```vue [Web]
<template>
  <RebornResult icon="403" title="无访问权限" sub-title="当前账号不在该空间的成员名单内。">
    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @click="goBack">返回上一页</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @click="apply">申请加入</RebornButton>
    </template>
  </RebornResult>
</template>
```

```vue [UniApp]
<template>
  <RebornResult icon="403" title="无访问权限" sub-title="当前账号不在该空间的成员名单内。">
    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @tap="goBack">返回上一页</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @tap="apply">申请加入</RebornButton>
    </template>
  </RebornResult>
</template>
```
::

### 四个插槽一起用

四个具名插槽可以同时启用，此时三段内容全部由调用方决定：`icon` 接管图标区，`title` / `sub-title` 接管第二段（这两个 prop 随之不再渲染），`extra` 接管第三段。配合 `:icon="null"` 时底板也一并交出，可以自己搭一个圆形底。

外层节点的字号与颜色对插槽内容仍然生效，所以插槽里只写差异部分（标签、强调数字），不必重复写标题的 24px。组件没有默认插槽，正文只能放进 `sub-title` 或 `extra`。

::code-group
```vue [Web]
<template>
  <RebornResult :icon="null">
    <template #icon>
      <div class="bg-success/10 flex size-18 shrink-0 items-center justify-center rounded-full">
        <Icon name="lucide:badge-check" class="text-success size-8 shrink-0" />
      </div>
    </template>

    <template #title>
      <span>支付成功</span>
      <span class="bg-success/10 text-success ml-2 px-2 py-0.5 align-middle text-xs font-normal">已开票</span>
    </template>

    <template #sub-title>
      实付 <span class="text-gray-10 font-medium">¥ 1,280.00</span>，订单号 <code>RB-20260915-0413</code>。
    </template>

    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @click="viewInvoice">查看发票</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @click="goOrders">返回订单列表</RebornButton>
    </template>
  </RebornResult>
</template>
```

```vue [UniApp]
<template>
  <RebornResult :icon="null">
    <template #icon>
      <view class="flex size-[144rpx] shrink-0 items-center justify-center rounded-full bg-success/10">
        <view class="i-lucide-badge-check size-[64rpx] shrink-0 text-success" />
      </view>
    </template>

    <template #title>
      <view class="flex items-center justify-center gap-[16rpx]">
        <text class="text-48 font-medium leading-[1.5] text-gray-8 dark:text-gray-1">支付成功</text>
        <text class="bg-success/10 px-[12rpx] py-[4rpx] text-24 text-success">已开票</text>
      </view>
    </template>

    <template #sub-title>
      <text class="text-28 text-gray-7 dark:text-gray-4">实付 ¥ 1,280.00，订单号 RB-20260915-0413。</text>
    </template>

    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md" @tap="viewInvoice">查看发票</RebornButton>
      <RebornButton color="primary" variant="filled" size="md" @tap="goOrders">返回订单列表</RebornButton>
    </template>
  </RebornResult>
</template>
```
::

### 缺省段与间距

三段都带 `v-if`：图标区在 `icon` 为 `null` 且无 `icon` 插槽时不渲染，标题描述段在 `title` / `sub-title` 与对应插槽全空时不渲染，操作区在没有 `extra` 插槽时不渲染。缺省的段连同它那一份段间距一起从 DOM 里消失，所以不会出现 48px 的双倍空隙。

```vue
<template>
  <!-- 只有标题：整块高度就是一行标题 -->
  <RebornResult :icon="null" title="没有更多内容了" />

  <!-- 图标 + 操作区：中间段不渲染，两段之间仍是 24px -->
  <RebornResult icon="info">
    <template #extra>
      <RebornButton color="neutral" variant="outlined" size="md">刷新</RebornButton>
    </template>
  </RebornResult>
</template>
```

::tip
不要靠 `title=" "` 之类的空白占位撑间距——空字符串会让整段跳过渲染，而空格会渲染成一行 36px 高的空标题。需要额外留白请用 `ui.root` 覆盖 `gap-*`。
::

## API

### Props

`title` / `sub-title` / `icon` / `ui` 两端一致，仅根节点类名入口不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}
#### Web 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | `''` | 标题文本，渲染为 24px / 500 字重 / 行高 150% 的 `text-gray-10`。空字符串且无 `title` 插槽时整个标题节点不渲染。 |
| `sub-title` | `string` | `''` | 描述文本，渲染为 14px / 常规字重 / 行高 150% 的 `text-gray-7`。空字符串且无 `sub-title` 插槽时该节点不渲染。 |
| `icon` | `'info' \| 'success' \| 'warning' \| 'error' \| '403' \| '404' \| '500' \| null` | `'info'` | 状态类型，同时决定默认图标字形与图标区配色。传 `null` 时图标区整段不渲染（除非提供了 `icon` 插槽，此时底板退化为无尺寸透明容器）。没有独立的颜色属性。 |
| `class` | `any` | - | 追加到根元素的自定义类名。 |
| `ui` | `ResultUI` | `{}` | 按语义化结构键覆盖各节点类名，键位见「自定义样式（ui）」。 |
:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}
#### UniApp 端全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `title` | `string` | `''` | 标题文本，渲染为 48rpx / 500 字重 / 行高 150% 的 `text-gray-8 dark:text-gray-1`。空字符串且无 `title` 插槽时整个标题节点不渲染。 |
| `sub-title` | `string` | `''` | 描述文本，渲染为 28rpx / 常规字重 / 行高 150% 的 `text-gray-7 dark:text-gray-4`。空字符串且无 `sub-title` 插槽时该节点不渲染。 |
| `icon` | `'info' \| 'success' \| 'warning' \| 'error' \| '403' \| '404' \| '500' \| null` | `'info'` | 状态类型，同时决定默认图标字形与图标区配色。传 `null` 时图标区整段不渲染（除非提供了 `icon` 插槽，此时底板退化为无尺寸透明容器）。没有独立的颜色属性。 |
| `custom-class` | `string` | `''` | 追加到根元素的自定义类名（避开小程序原生 `class`）。 |
| `ui` | `ResultUI` | `{}` | 按语义化结构键覆盖各节点类名，键位见「自定义样式（ui）」。 |
:::

::

### Slots

四个插槽两端同名同义，均无作用域参数。

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `icon` | - | 图标区内容，替换默认字形。`icon` 不为 `null` 时圆形底板与语义色淡底保留；`icon` 为 `null` 时底板退化为无尺寸透明容器，且该插槽是让图标区继续渲染的唯一途径。 |
| `title` | - | 标题内容，存在时 `title` prop 不再渲染。外层节点的 24px 字号与 `text-gray-10` 仍然生效。 |
| `sub-title` | - | 描述内容，存在时 `sub-title` prop 不再渲染。外层节点的 14px 字号与 `text-gray-7` 仍然生效。 |
| `extra` | - | 第三段的内容，通常放按钮。不提供该插槽时第三段连同 24px 段间距一起不渲染。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与 `class` / `custom-class` 一起走 `tailwind-merge`，冲突时后者覆盖前者。两端键位相同，只是默认类名的单位不同。

| 键名 | 说明 |
| --- | --- |
| `root` | 根容器，默认 `flex w-full flex-col items-center gap-6 text-center`（UniApp `gap-[48rpx]`）。改段间距、改左对齐都在这里。 |
| `icon` | 图标区底板，默认 `flex size-18 shrink-0 items-center justify-center rounded-full` 加语义色淡底（UniApp `size-[144rpx]`）。`icon` 为 `null` 时默认类名变成 `size-auto rounded-none bg-transparent`。 |
| `iconGlyph` | 图标字形，默认 `size-8 shrink-0`（UniApp `size-[64rpx]`）。**只管尺寸**：UniApp 端的 `i-lucide-*` 字形类单独挂在节点上，不走这个键。提供 `icon` 插槽时该节点不渲染，此键随之失效。 |
| `content` | 标题与描述的包裹层，默认 `flex min-w-0 max-w-full flex-col items-center gap-2`（UniApp `gap-[16rpx]`）。标题与描述之间的 8px 在这里改。 |
| `title` | 标题节点，默认 `text-2xl font-medium leading-[1.5] text-gray-10`（UniApp `text-48 ... text-gray-8 dark:text-gray-1`）。 |
| `subTitle` | 描述节点，默认 `text-base font-normal leading-[1.5] text-gray-7`（UniApp `text-28 ... text-gray-7 dark:text-gray-4`）。 |
| `extra` | 操作区，默认 `flex flex-wrap items-center justify-center gap-3`（UniApp `gap-[24rpx]`）。没有 `extra` 插槽时该节点不渲染，此键随之失效。 |

```vue
<template>
  <RebornResult
    icon="success"
    title="提交成功"
    :ui="{
      root: 'gap-4 items-start text-left',
      icon: 'bg-primary/10 text-primary',
      content: 'items-start',
    }"
  />
</template>
```

## 两端差异对照

| 维度 | Web | UniApp |
| --- | --- | --- |
| 根节点 | `<div>` | `<view>`，开启 `virtualHost` / `addGlobalClass` / `styleIsolation: shared` |
| 自定义类名入口 | `class`（`any`） | `custom-class`（`string`，默认 `''`） |
| 图标写法 | `<Icon name="lucide:info">`，配置里存图标名 | Tailwind 图标类 `i-lucide-info`，配置里存类名 |
| 段间距 | 24px（`gap-6`） | 48rpx（`gap-[48rpx]`） |
| 标题与描述间距 | 8px（`gap-2`） | 16rpx（`gap-[16rpx]`） |
| 操作区元素间距 | 12px（`gap-3`） | 24rpx（`gap-[24rpx]`） |
| 图标底板 / 字形 | 72px / 32px | 144rpx / 64rpx |
| 标题字号 | 24px（`text-2xl`） | 48rpx（`text-48`） |
| 描述字号 | 14px（`text-base`，本仓库把 `--text-base` 改写成 14px） | 28rpx（`text-28`） |
| 文字颜色 | `text-gray-10` / `text-gray-7`，色阶随暗色模式反转，无需 `dark:` | `text-gray-8 dark:text-gray-1` / `text-gray-7 dark:text-gray-4`，色阶静态且止于 `gray-8` |

## 注意事项

- **七种状态共用同一套 lucide 图标，没有整幅插画**。Arco 的 403 / 404 / 500 是三张手绘 SVG 插图，本组件统一收敛成圆形底板加语义色字形，视觉重量与前四种一致；需要插画请传 `:icon="null"` 并用 `icon` 插槽自己放。
- **`icon` 传 `null` 与不传是两回事**。`withDefaults` 只在 prop 为 `undefined` 时填默认值，显式 `:icon="null"` 会原样传入并整段去掉图标区；漏写 `icon` 得到的是默认的 `info`。
- **空段不进 DOM，间距不会翻倍**。三段各自带 `v-if`，某段无内容时连同它那份段间距一起消失，所以不必担心缺省时出现双倍空隙；反过来也意味着不能靠 `title=""` 占位来撑高度。
- **图标配色不可单独配置**。配色由 `icon` 经 `RESULT_ICON_COLOR` 推导，组件没有 `color` prop；要换色用 `ui.icon` 覆盖 `bg-*` / `text-*`，或者直接用 `icon` 插槽接管整块。
- **组件不派发任何事件，也不暴露实例方法**。`extra` 插槽里的交互由放进去的元素自己承担，别在 Result 上找 `@click` / `@confirm`。
- **`title` / `sub-title` 只收纯文本**。它们被插值进文本节点，写 HTML 不会被解析；要富文本改用同名插槽，插槽存在时对应 prop 不渲染。
- **UniApp 端的 `i-lucide-*` 字形类不要写进 `ui.iconGlyph`**。两个图标类叠在同一节点上会各画一层遮罩，组件把字形类单独挂在 `:class` 数组里；`ui.iconGlyph` 只负责尺寸。
- **描述用的是 `text-base` 不是 `text-sm`**。本仓库在 `app/assets/theme/typography.css` 里把 `--text-sm` 改写成 12px、`--text-base` 改写成 14px，按 Tailwind 默认刻度的直觉写 `text-sm` 会小一号。
