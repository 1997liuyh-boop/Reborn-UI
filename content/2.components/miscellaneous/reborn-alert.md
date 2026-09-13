---
title: Alert 警告提示
description: 静态警告提示条：五种消息类型、按钮同款视觉变体、顶部公告模式与消息轮播通知栏。
category: 反馈
platform: both
---

::ComponentViewer{demoFile="RebornAlertDemo.vue" config="RebornAlertConfig" componentId="reborn-alert" :componentFiles='["RebornAlert.vue", "reborn-alert.config.ts"]' :uniappFiles='["RebornAlert.vue", "reborn-alert.config.ts"]'}
::

## 简介

页面内常驻的静态提示条，用于呈现无需用户即时决策的状态说明。五种 `type` 决定默认图标与配色，六种 `variant` 与 `RebornButton` 共用同一套视觉语言；传入 `messages` 即切换为消息轮播通知栏。

::tip
**两端 API 已对齐**：`type`、`variant`、`color` 枚举、`type → 配色 / 图标` 的映射、变体着色规则、`v-model:show`、事件名与插槽名逐一相同，下方表格为两端通用。仅有的差异集中在**根节点类名属性**（Web `class` / UniApp `custom-class`）、**图标写法**（Web 图标名 / UniApp Tailwind 图标类）与轮播的底层实现，详见「两端差异对照」。
::

**适用场景**：表单顶部的整体校验提示；页面级的功能公告、维护通知；顶部通栏公告（`banner`）；多条运营消息的滚动通知栏（`messages`）。

**不适用场景**：需要用户确认或选择的阻断式提示（用 `RebornDialog`）；操作后的瞬时反馈（用 `RebornToast`）；字段级的校验错误（用 `RebornFormItem` 的错误态）。

## 用法

### 基础用法

`type` 同时决定图标与配色，`title` 给标题、默认插槽给正文。

::code-group
```vue [Web]
<template>
  <RebornAlert type="info">这是一条提示信息</RebornAlert>
  <RebornAlert type="success" title="操作成功">数据已保存</RebornAlert>
  <RebornAlert type="warning" closable>库存不足，请及时补货</RebornAlert>
  <RebornAlert type="error" :show-icon="false">请求失败，请稍后重试</RebornAlert>
</template>
```

```vue [UniApp]
<template>
  <RebornAlert type="info">
    这是一条提示信息
  </RebornAlert>
  <RebornAlert type="success" title="操作成功">
    数据已保存
  </RebornAlert>
  <RebornAlert type="warning" closable>
    库存不足，请及时补货
  </RebornAlert>
</template>
```
::

### 视觉变体

六种 `variant` 与 `RebornButton` 同名变体的着色规则完全一致：`filled` 实底白字、`outlined` 语义色描边、`soft` 10% 透明底、`subtle` = soft + 描边、`text` 纯文字、`round` 胶囊（着色同 filled）。

```vue
<template>
  <RebornAlert variant="filled" type="success">实底</RebornAlert>
  <RebornAlert variant="outlined" type="success">描边</RebornAlert>
  <RebornAlert variant="soft" type="success">浅底（默认）</RebornAlert>
  <RebornAlert variant="subtle" type="success">浅底 + 描边</RebornAlert>
  <RebornAlert variant="text" type="success">纯文字</RebornAlert>
  <RebornAlert variant="round" type="success">胶囊</RebornAlert>
</template>
```

::tip
`color` 可脱离 `type` 单独指定，用于「图标语义与配色不一致」的场景，例如 `type="success"` 配 `color="primary"`。缺省时按 `type` 映射，`normal` 映射为 `neutral`。
::

### 顶部公告与居中

`banner` 去掉圆角与边框，适合贴着页面顶部通栏铺开；`center` 让内容整体居中。

```vue
<template>
  <RebornAlert type="normal" banner center>
    系统将于今晚 23:00 - 24:00 进行例行维护
  </RebornAlert>
</template>
```

### 关闭与受控显隐

`closable` 展示关闭按钮，点击后组件把 `v-model:show` 置为 `false` 并发出 `close`；淡出动画结束后发出 `after-close`。

```vue
<script setup lang="ts">
const visible = ref(true);
</script>

<template>
  <RebornAlert v-model:show="visible" closable @after-close="onClosed">
    可关闭的提示
  </RebornAlert>
</template>
```

::tip
`show` 不传时组件自行维护显隐（默认 `true`）；需要外部控制或重新唤起时才绑定 `v-model:show`。
::

### 消息轮播通知栏

传入 `messages` 即进入轮播模式，此时默认插槽不再渲染。三种形态由 `direction` 与 `rows` 组合决定：

| 形态         | 配置                          | 表现                                   |
| ------------ | ----------------------------- | -------------------------------------- |
| 单行逐条轮播 | `direction="vertical"`（默认）| 一次一条，按 `interval` 垂直切换       |
| 多行逐行滚动 | `vertical` + `rows > 1`       | 多条同时可见，整体逐行向上滚动         |
| 水平跑马灯   | `direction="horizontal"`      | 全部消息拼成一行，按 `speed` 匀速左移  |

```vue
<script setup lang="ts">
const messages = ["订单 #1024 已发货", "库存告警：A 商品剩余 3 件", "有 2 条待处理的售后申请"];
</script>

<template>
  <!-- 单行逐条 -->
  <RebornAlert type="normal" :messages="messages" :interval="3000" @change="onChange" />

  <!-- 多行逐行滚动 -->
  <RebornAlert type="normal" :messages="messages" :rows="2" />

  <!-- 水平跑马灯 -->
  <RebornAlert type="normal" :messages="messages" direction="horizontal" :speed="60" />

  <!-- 自定义单条渲染 -->
  <RebornAlert type="normal" :messages="messages">
    <template #message="{ item, index }">
      <span>{{ index + 1 }}. {{ item }}</span>
    </template>
  </RebornAlert>
</template>
```

::warning
条数不足以填满可见行数时（单行 ≤ 1 条、多行 ≤ `rows` 条）不启动自动切换，静态展示。水平跑马灯需要先测出容器与文本宽度才起播，测宽完成前不挂动画类——因此在 `display: none` 的容器里预渲染的跑马灯不会滚动，需在容器可见后触发重测（组件已监听 `show` 变化与窗口 `resize`）。
::

### 操作区与自定义关闭元素

`action` 插槽在关闭按钮左侧放操作项；`close-element` 插槽接管关闭元素本身，作用域参数 `close` 是关闭函数。

```vue
<template>
  <RebornAlert type="warning" closable>
    检测到新版本
    <template #action>
      <RebornButton size="sm" variant="text">立即更新</RebornButton>
    </template>
    <template #close-element="{ close }">
      <span class="cursor-pointer text-[12px]" @click="close">不再提示</span>
    </template>
  </RebornAlert>
</template>
```

## API

::tip
以下 Props / Events / Slots 两端通用，仅标注了平台的条目除外。
::

### Props

| 参数名        | 描述                                                                       | 类型                                                                                   | 默认值       |
| ------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------ |
| `type`        | 警告提示的类型，决定默认图标与配色                                         | `'info' \| 'success' \| 'warning' \| 'error' \| 'normal'`                              | `'info'`     |
| `variant`     | 视觉变体，对齐 `RebornButton` 的同名变体（不含 circle）                    | `'filled' \| 'outlined' \| 'soft' \| 'subtle' \| 'text' \| 'round'`                    | `'soft'`     |
| `color`       | 配色覆盖；缺省时由 `type` 映射（`normal` → `neutral`）                     | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -            |
| `show-icon`   | 是否展示图标                                                               | `boolean`                                                                              | `true`       |
| `closable`    | 是否展示关闭按钮                                                           | `boolean`                                                                              | `false`      |
| `title`       | 警告提示的标题                                                             | `string`                                                                               | -            |
| `banner`      | 是否作为顶部公告使用（去除边框和圆角）                                     | `boolean`                                                                              | `false`      |
| `center`      | 内容是否居中显示                                                           | `boolean`                                                                              | `false`      |
| `icon`        | 自定义图标（也可用 `icon` 插槽）。Web 传图标名，UniApp 传 Tailwind 图标类  | `string`                                                                               | 按 `type` 取 |
| `close-icon`  | 关闭按钮的图标                                                             | `string`                                                                               | Web `'lucide:x'` / UniApp `'i-lucide-x'` |
| `messages`    | 轮播消息列表：传入即变为消息轮播通知栏，默认单条逐条垂直轮播               | `string[]`                                                                             | -            |
| `interval`    | 垂直轮播的切换间隔，单位毫秒                                               | `number`                                                                               | `3000`       |
| `direction`   | 轮播方向：`vertical` 垂直切换；`horizontal` 全部消息拼成一行水平跑马灯滚动 | `'vertical' \| 'horizontal'`                                                           | `'vertical'` |
| `speed`       | 水平跑马灯的滚动速率，单位 px/s                                            | `number`                                                                               | `60`         |
| `rows`        | 垂直轮播时同时展示的行数；大于 1 时多条消息同时可见并逐行向上滚动          | `number`                                                                               | `1`          |
| `v-model:show`| 显隐状态（受控），关闭按钮会将其置为 `false`                               | `boolean`                                                                              | `true`       |
| `ui`          | 按语义化结构覆盖各节点样式                                                 | `AlertUI`                                                                              | -            |
| `class`       | 根节点自定义类名（**仅 Web 端**）                                          | `any`                                                                                  | -            |
| `custom-class`| 根节点自定义类名（**仅 UniApp 端**，避免与原生 `class` 冲突）              | `string`                                                                               | `''`         |

### Events

| 事件名        | 描述               | 参数                                                  |
| ------------- | ------------------ | ----------------------------------------------------- |
| `close`       | 点击关闭按钮时触发 | `ev`：Web 为 `MouseEvent`，UniApp 为原生事件对象      |
| `after-close` | 关闭动画结束后触发 | -                                                     |
| `change`      | 轮播消息切换时触发 | `index: number`（多行模式下为真实消息下标，已取模）   |

### Slots

| 插槽名          | 描述                           | 参数                              |
| --------------- | ------------------------------ | --------------------------------- |
| `default`       | 提示内容（轮播模式下不渲染）   | -                                 |
| `icon`          | 图标                           | -                                 |
| `title`         | 标题                           | -                                 |
| `action`        | 操作项                         | -                                 |
| `close-element` | 关闭元素                       | `close: (e) => void`              |
| `message`       | 轮播模式下单条消息的自定义渲染 | `item: string`、`index: number`   |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与主题默认类通过 `tailwind-merge` 合并。**除 `carouselList` 为 Web 端独有外，其余键两端同名同义**。

| 键名              | 说明                                                                       | 平台   |
| ----------------- | -------------------------------------------------------------------------- | ------ |
| `root`            | 根节点：`items-start` 行布局、内边距、字号 / 行高 / 圆角与配色变体都落在这里 | 通用   |
| `icon`            | 图标容器，高度等于文字首行行高（`1.5em`）并垂直居中                        | 通用   |
| `content`         | 标题与内容的纵向列                                                         | 通用   |
| `title`           | 标题                                                                       | 通用   |
| `description`     | 提示内容（默认插槽）                                                       | 通用   |
| `action`          | 操作项插槽容器，`min-h-[1.5em]` 内垂直居中，超过一行高时与标题顶部对齐     | 通用   |
| `closeButton`     | 关闭按钮，`1.5em` 圆形热区（Web 端带 hover 浅底）                          | 通用   |
| `closeIcon`       | 关闭图标                                                                   | 通用   |
| `carouselWrapper` | 垂直轮播容器；多行模式的高度由组件按 `rows` 以内联样式写入                 | 通用   |
| `carouselItem`    | 单条轮播消息，默认 `truncate`                                              | 通用   |
| `carouselList`    | 多行垂直滚动的轨道，整体 `translateY` 逐行上移                             | 仅 Web |
| `marqueeWrapper`  | 水平跑马灯容器（UniApp 端另带 `createSelectorQuery` 测宽用的选择器类名）   | 通用   |
| `marquee`         | 跑马灯整行文本（不换行），由组件测宽后驱动动画                             | 通用   |
| `marqueeItem`     | 跑马灯中的单条消息，条间距                                                 | 通用   |

::warning
UniApp 端多行垂直轮播由内置 `swiper` 的 `display-multiple-items` 承担，没有独立轨道节点，因此**不存在 `carouselList` 键**；覆盖多行滚动样式请改 `carouselWrapper`。同理，`marqueeWrapper` 与 `marquee` 在 UniApp 端各自带一个 `reborn-alert__*` 选择器类名用于测宽，覆盖时不要用 `!` 之类的手段把它们挤掉，否则跑马灯测不到宽度、不会起播。
::

## 设计令牌

两端规格一一对应（1px = 2rpx），视觉完全等价：

| 项目             | Web       | UniApp     |
| ---------------- | --------- | ---------- |
| 字号             | 14px      | 28rpx      |
| 行高             | 150%      | 150%       |
| 水平内边距       | 12px      | 24rpx      |
| 纵向内边距       | 8px       | 16rpx      |
| 元素间距（gap）  | 8px       | 16rpx      |
| 标题与内容间距   | 8px       | 16rpx      |
| 圆角             | `rounded-ui-sm`（8px） | `rounded-ui-sm` |
| 图标尺寸         | 16px      | 32rpx      |
| 关闭图标尺寸     | 14px      | 28rpx      |
| 关闭按钮热区     | `1.5em` 圆形 | `1.5em` 圆形 |
| 轮播单行高度     | `1.5em`   | 42rpx（28rpx × 1.5） |
| 跑马灯条间距     | 24px      | 48rpx      |

- 字重统一 `font-normal`，仅标题为 `font-medium`。
- `banner` 与 `round` 用 `!` 提权覆盖根节点圆角；`round` 的着色规则与 `filled` 完全一致，只改形状。
- 配色 token 自身已随主题切换，**不要再写 `dark:` 前缀**，否则深色模式下会二次翻转。

## 两端差异对照

| 维度               | Web 端                                                        | UniApp 端                                                                          |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 根节点类名属性     | `class`                                                       | `custom-class`（避免与原生 `class` 冲突）                                          |
| 图标写法           | 图标名，交给 `Icon` 组件（如 `lucide:x`）                     | Tailwind 图标类（如 `i-lucide-x`）                                                 |
| 垂直轮播实现       | 单行用 `Transition` 进出场；多行为列表整体 `translateY` 逐行滚动 | 内置 `swiper` 垂直轮播（`circular` + `autoplay`），多行由 `display-multiple-items` 承担 |
| `carouselList` 键  | 有（多行滚动轨道）                                            | 无（swiper 无独立轨道节点）                                                        |
| 水平跑马灯测宽     | `offsetWidth` / `scrollWidth` 直接读，并监听 `resize` 重测    | `createSelectorQuery` 延时 200ms 测量，失败最多重试 5 次                           |
| `close` 事件参数   | `MouseEvent`                                                  | UniApp 原生事件对象                                                                |
| 悬停暂停轮播       | 支持（垂直轮播与跑马灯同时暂停）                              | 不适用（触屏无悬停）                                                               |
| 关闭按钮 hover 底色 | 有（`hover:bg-black/10`）                                     | 无（触屏无 hover 态）                                                              |
| 小程序适配         | -                                                             | `virtualHost` + `addGlobalClass` + `styleIsolation: shared`，保证工具类能作用到组件内 |
| 尺寸单位           | px                                                            | rpx                                                                                |

## 注意事项

- 传入 `messages` 后**默认插槽不再渲染**，两者互斥。
- 轮播条数不足以填满可见行数时不启动定时器，静态展示。
- 水平跑马灯的 `speed` 是速率（px/s）而非时长，文本越长一轮越久，视觉速度恒定。
- `rows` 会被 `Math.max(1, Math.floor(rows))` 规整，传小数或负数不会报错但会被收敛。
- 多行模式的 `change` 事件参数已对消息条数取模，不会因为无缝衔接的补位项而超出真实下标范围。
- UniApp 端跑马灯必须在节点可见后才能测出宽度；若放在初始 `display: none` 的容器里，需在容器展开后切换 `show` 或改变 `messages` 触发重测。
