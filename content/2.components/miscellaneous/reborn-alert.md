---
title: Alert 警告提示
description: 静态警告提示条：五种消息类型、按钮同款视觉变体、顶部公告模式与消息轮播通知栏。
category: 反馈
platform: both
tags: [alert, notice, banner, marquee, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornAlertDemo.vue" config="RebornAlertConfig" componentId="reborn-alert" :componentFiles='["RebornAlert.vue", "reborn-alert.config.ts"]' :uniappFiles='["RebornAlert.vue", "reborn-alert.config.ts"]'}
::

## 简介

Alert 是嵌在页面流里的提示条，用来说明当前状态，不打断用户操作。它不会自动消失，也不需要用户确认；能否关闭由 `closable` 决定。

`type` 同时决定默认图标与配色，`variant` 决定着色方式，着色规则与 `RebornButton` 的同名变体一致，所以按钮和提示条放在一起时视觉语言统一。`color` 可以单独覆盖配色，让图标语义和颜色脱钩。

传入 `messages` 后组件切换为轮播通知栏：单行逐条切换、多行逐行上移、水平跑马灯三种形态由 `direction` 与 `rows` 组合决定，此时默认插槽不再渲染。

### 何时使用

- 表单顶部的整体校验结果或提交前的风险说明。
- 页面级的功能公告、维护通知，需要一直可见直到用户关闭。
- 贴着页面顶部通栏铺开的公告（`banner`）。
- 多条运营消息轮流展示的滚动通知栏（`messages`）。

### 何时不使用

- 需要用户确认或选择才能继续 —— 改用 `reborn-dialog`。
- 操作后的瞬时反馈，几秒后自动消失 —— 改用 `reborn-toast`。
- 某个输入框的校验错误 —— 改用 `reborn-form-item` 的错误提示，就近展示在字段下方。

## 用法

### 基础用法

`type` 同时决定图标与配色，默认插槽写正文。五种类型的默认图标依次为：`info` 圆形 i、`success` 圆形对勾、`warning` 圆形感叹号、`error` 圆形叉、`normal` 喇叭。`normal` 的配色映射为 `neutral`，用于公告等中性场景。

```vue
<template>
  <RebornAlert type="info">这是一条提示信息</RebornAlert>
  <RebornAlert type="success">数据已保存</RebornAlert>
  <RebornAlert type="warning">库存不足，请及时补货</RebornAlert>
  <RebornAlert type="error" :show-icon="false">请求失败，请稍后重试</RebornAlert>
  <RebornAlert type="normal">系统将于今晚进行例行维护</RebornAlert>
</template>
```

### 变体：六种 variant

`variant` 与 `RebornButton` 的同名变体着色一致（不含按钮的 `circle`），默认 `soft`。

| variant    | 着色                              | 典型用途                               |
| ---------- | --------------------------------- | -------------------------------------- |
| `soft`     | 语义色 10% 透明底 + 语义色文字    | 默认，页面内大多数说明性提示           |
| `subtle`   | `soft` 再加语义色描边             | 背景偏浅、需要边界把提示区分出来时     |
| `outlined` | 透明底 + 语义色描边与文字         | 卡片内部，不想再叠一层底色             |
| `filled`   | 语义色实底 + 白字                 | 需要强提醒的错误或阻断性风险           |
| `round`    | 着色同 `filled`，圆角改为胶囊     | 单行短提示，放在工具栏或浮层顶部       |
| `text`     | 无底无边，仅语义色文字            | 行内的弱提示，只保留图标与文字         |

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
`color` 可脱离 `type` 单独指定，用于图标语义与配色不一致的场景。例如 `type="success"` 配 `color="primary"`：图标仍是对勾，配色换成主色。
::

### 标题与操作区：title 与 action 插槽

`title` 属性或 `title` 插槽渲染一行加粗标题，标题与正文纵向排列。`action` 插槽位于内容右侧、关闭按钮左侧，适合放一个处理按钮。它与首行文字顶部对齐，所以正文多行时按钮不会被拉到中间。

```vue
<template>
  <RebornAlert type="warning" title="存储空间不足">
    当前可用空间不足 10%，可能影响新数据写入，请及时清理。
    <template #action>
      <RebornButton size="sm" color="warning" variant="outlined">去清理</RebornButton>
    </template>
  </RebornAlert>
</template>
```

### 关闭与受控显隐：closable 与 v-model:show

`closable` 展示关闭按钮。点击后组件先把 `show` 置为 `false`，再触发 `close`；淡出过渡结束后触发 `after-close`。

不绑定 `show` 时，组件自行维护显隐（默认 `true`），关掉后无法从外部重新唤起。需要「重新显示」时才绑定 `v-model:show`。

```vue
<script setup lang="ts">
const visible = ref(true);

function onClosed() {
  // 淡出结束后再移除占位或上报
}
</script>

<template>
  <RebornAlert v-model:show="visible" closable @after-close="onClosed">
    可关闭的提示
  </RebornAlert>
  <RebornButton v-if="!visible" size="sm" @click="visible = true">重新显示</RebornButton>
</template>
```

### 自定义关闭元素：close-element 插槽

`close-element` 插槽替换默认的关闭图标，必须同时开启 `closable`，否则插槽不渲染。插槽外层已经绑定了关闭点击，插槽里的元素被点击时会冒泡触发关闭，所以只放展示内容即可。

```vue
<template>
  <RebornAlert type="warning" closable>
    检测到新版本，刷新页面后生效。
    <template #close-element>
      <span class="whitespace-nowrap text-xs">不再提示</span>
    </template>
  </RebornAlert>
</template>
```

::warning
作用域参数 `close` 就是外层绑定的同一个关闭函数。如果在插槽元素上再写 `@click="close"`，一次点击会执行两次关闭，`close` 事件也会触发两次。
::

### 顶部公告与居中：banner 与 center

`banner` 去掉圆角与边框，适合贴着页面顶部通栏铺开。它用 `!` 提升了优先级，会压过 `round` 的胶囊圆角。

`center` 让图标与内容整体居中，内容列不再撑满剩余宽度。

```vue
<template>
  <RebornAlert type="warning" title="重要消息提示" banner closable>
    注意：本环境为演示环境，数据每日凌晨重置。
  </RebornAlert>
  <RebornAlert type="error" banner center closable>
    服务当前不可用，请稍后重试。
  </RebornAlert>
</template>
```

### 消息轮播：messages、direction 与 rows

传入非空 `messages` 即进入轮播模式，默认插槽不再渲染。三种形态由 `direction` 与 `rows` 组合决定：

| 形态         | 配置                           | 表现                                     | 典型用途                   |
| ------------ | ------------------------------ | ---------------------------------------- | -------------------------- |
| 单行逐条轮播 | `direction="vertical"`（默认） | 一次一条，每隔 `interval` 毫秒垂直切换   | 顶部公告栏轮流展示几条通知 |
| 多行逐行滚动 | `vertical` + `rows > 1`        | 同时可见 `rows` 条，每次整体上移一行     | 侧栏的动态、订单播报       |
| 水平跑马灯   | `direction="horizontal"`       | 全部消息拼成一行，按 `speed` 像素/秒左移 | 单行长公告，需要完整读完   |

- `message` 插槽自定义单条消息的渲染，作用域参数为 `item` 与 `index`。
- `change` 事件在垂直轮播切换时触发，参数为当前消息下标。

```vue
<script setup lang="ts">
const messages = ["订单 #1024 已发货", "库存告警：A 商品剩余 3 件", "有 2 条待处理的售后申请"];
const current = ref(0);
</script>

<template>
  <!-- 单行逐条 -->
  <RebornAlert type="normal" :messages="messages" :interval="3000" @change="current = $event" />

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
- 条数不够填满可见行数时不会自动切换，只静态展示。单行模式下是只有 1 条，多行模式下是不超过 `rows` 条。
- 水平跑马灯要先测出容器与文本的宽度才开始滚动，测宽完成前不加动画类。
- 放在 `display: none` 的容器里渲染时，测到的宽度是 0，跑马灯不会动。容器可见后，切换一次 `show` 或更新 `messages` 就会重新测宽。
::

## API

### Props

两端属性名与默认值基本一致。差异在根节点类名属性（`class` / `custom-class`）与图标写法，因此分端列出全部属性。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名         | 类型                                                                                   | 默认值       | 描述                                                              |
| -------------- | -------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| `type`         | `'info' \| 'success' \| 'warning' \| 'error' \| 'normal'`                              | `'info'`     | 消息类型，决定默认图标与配色。                                    |
| `variant`      | `'filled' \| 'outlined' \| 'soft' \| 'subtle' \| 'text' \| 'round'`                    | `'soft'`     | 视觉变体，着色规则同 `RebornButton` 的同名变体。                  |
| `color`        | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -            | 配色覆盖；缺省时按 `type` 映射，`normal` 映射为 `neutral`。       |
| `show-icon`    | `boolean`                                                                              | `true`       | 是否展示图标。                                                    |
| `closable`     | `boolean`                                                                              | `false`      | 是否展示关闭按钮。                                                |
| `title`        | `string`                                                                               | -            | 标题，也可用 `title` 插槽。                                       |
| `banner`       | `boolean`                                                                              | `false`      | 顶部公告模式，去除圆角与边框。                                    |
| `center`       | `boolean`                                                                              | `false`      | 图标与内容整体居中。                                              |
| `icon`         | `string`                                                                               | 按 `type` 取 | Iconify 图标名（如 `lucide:star`），也可用 `icon` 插槽。          |
| `close-icon`   | `string`                                                                               | `'lucide:x'` | 关闭按钮的 Iconify 图标名。                                       |
| `messages`     | `string[]`                                                                             | -            | 轮播消息列表，非空时进入轮播模式，默认插槽不再渲染。              |
| `interval`     | `number`                                                                               | `3000`       | 垂直轮播的切换间隔，单位毫秒；水平跑马灯不使用。                  |
| `direction`    | `'vertical' \| 'horizontal'`                                                           | `'vertical'` | 轮播方向，`horizontal` 为水平跑马灯。                             |
| `speed`        | `number`                                                                               | `60`         | 水平跑马灯的滚动速率，单位 px/s。                                 |
| `rows`         | `number`                                                                               | `1`          | 垂直轮播同时可见的行数，按 `Math.max(1, Math.floor(rows))` 取整。 |
| `v-model:show` | `boolean`                                                                              | `true`       | 显隐状态，点击关闭按钮会置为 `false`。                            |
| `class`        | `any`                                                                                  | -            | 根节点类名，与 `ui.root` 一起并入根节点。                         |
| `ui`           | `AlertUI`                                                                              | -            | 细粒度样式覆盖，键位见「自定义样式（ui）」。                      |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名         | 类型                                                                                   | 默认值         | 描述                                                              |
| -------------- | -------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------- |
| `type`         | `'info' \| 'success' \| 'warning' \| 'error' \| 'normal'`                              | `'info'`       | 消息类型，决定默认图标与配色。                                    |
| `variant`      | `'filled' \| 'outlined' \| 'soft' \| 'subtle' \| 'text' \| 'round'`                    | `'soft'`       | 视觉变体，着色规则同 `RebornButton` 的同名变体。                  |
| `color`        | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -              | 配色覆盖；缺省时按 `type` 映射，`normal` 映射为 `neutral`。       |
| `show-icon`    | `boolean`                                                                              | `true`         | 是否展示图标。                                                    |
| `closable`     | `boolean`                                                                              | `false`        | 是否展示关闭按钮。                                                |
| `title`        | `string`                                                                               | -              | 标题，也可用 `title` 插槽。                                       |
| `banner`       | `boolean`                                                                              | `false`        | 顶部公告模式，去除圆角与边框。                                    |
| `center`       | `boolean`                                                                              | `false`        | 图标与内容整体居中。                                              |
| `icon`         | `string`                                                                               | 按 `type` 取   | 图标类名（如 `i-lucide-star`），也可用 `icon` 插槽。              |
| `close-icon`   | `string`                                                                               | `'i-lucide-x'` | 关闭按钮的图标类名。                                              |
| `messages`     | `string[]`                                                                             | -              | 轮播消息列表，非空时进入轮播模式，默认插槽不再渲染。              |
| `interval`     | `number`                                                                               | `3000`         | 垂直轮播的切换间隔，单位毫秒，传给内置 `swiper`；水平跑马灯不使用。 |
| `direction`    | `'vertical' \| 'horizontal'`                                                           | `'vertical'`   | 轮播方向，`horizontal` 为水平跑马灯。                             |
| `speed`        | `number`                                                                               | `60`           | 水平跑马灯的滚动速率，单位 px/s。                                 |
| `rows`         | `number`                                                                               | `1`            | 垂直轮播同时可见的行数，按 `Math.max(1, Math.floor(rows))` 取整。 |
| `v-model:show` | `boolean`                                                                              | `true`         | 显隐状态，点击关闭按钮会置为 `false`。                            |
| `custom-class` | `string`                                                                               | `''`           | 根节点类名。小程序里 `class` 不能透传到组件内部，所以改用此属性。 |
| `ui`           | `AlertUI`                                                                              | `{}`           | 细粒度样式覆盖，键位见「自定义样式（ui）」。                      |

:::

::

### Emits

两端事件名一致，只有 `close` 的参数类型不同。

| 事件名        | 回调参数                                                        | 描述                                                      |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `close`       | `ev`：Web 为 `MouseEvent`，UniApp 为原生点击事件（`unknown`）   | 点击关闭按钮时触发，此时 `show` 已置为 `false`。          |
| `after-close` | -                                                               | 淡出过渡结束后触发。                                      |
| `change`      | `index: number`                                                 | 垂直轮播切换时触发，参数为当前消息下标；跑马灯不触发。    |
| `update:show` | `value: boolean`                                                | 点击关闭按钮时以 `false` 触发，供 `v-model:show` 使用。   |

### Slots

两端通用。

| 插槽名          | 作用域参数                        | 描述                                                           |
| --------------- | --------------------------------- | -------------------------------------------------------------- |
| `default`       | -                                 | 提示正文；轮播模式下不渲染。                                   |
| `icon`          | -                                 | 替换默认图标；`show-icon` 为 `false` 时不渲染。                |
| `title`         | -                                 | 替换标题内容；即使没有 `title` 属性，传了该插槽也会渲染标题行。 |
| `action`        | -                                 | 操作区，位于内容右侧、关闭按钮左侧。                           |
| `close-element` | `{ close }`                       | 替换关闭图标，需开启 `closable`；外层已绑定关闭点击。          |
| `message`       | `{ item: string, index: number }` | 轮播模式下单条消息的渲染。                                     |

### 自定义样式（ui）

`ui` 按结构键覆盖对应节点的类名，与默认类合并时冲突的工具类以传入值为准。Web 端比 UniApp 端多一个 `carouselList` 键；其余键同名，但默认类的尺寸单位不同。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名              | 对应节点                                          | 默认类                                                                                                                                                       | 渲染条件                               |
| ----------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `root`            | 根节点（`role="alert"`），`class` 也并入此处      | `reborn-alert relative flex w-full items-start gap-2 px-3 py-2 text-sm font-normal rounded-lg`，另叠加变体配色                                               | 始终                                   |
| `icon`            | 图标容器                                          | `flex h-5 shrink-0 items-center`                                                                                                                             | `show-icon` 为 `true`                  |
| `content`         | 标题与正文所在的纵向列                            | `flex min-w-0 flex-1 flex-col gap-2`                                                                                                                         | 始终                                   |
| `title`           | 标题                                              | `font-medium`                                                                                                                                                | 有 `title` 属性或 `title` 插槽         |
| `description`     | 正文（默认插槽）                                  | `min-w-0`                                                                                                                                                    | 非轮播模式且有默认插槽                 |
| `action`          | 操作区                                            | `flex min-h-5 shrink-0 items-center`                                                                                                                         | 有 `action` 插槽                       |
| `closeButton`     | 关闭按钮热区                                      | `flex size-5 shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none` | `closable` 为 `true`                   |
| `closeIcon`       | 默认关闭图标                                      | `size-3.5 shrink-0`                                                                                                                                          | `closable` 且未用 `close-element` 插槽 |
| `carouselWrapper` | 垂直轮播容器                                      | `relative min-w-0 overflow-hidden`；多行时高度写在内联样式里                                                                                                 | 垂直轮播模式                           |
| `carouselItem`    | 单条轮播消息                                      | `truncate`                                                                                                                                                   | 垂直轮播模式                           |
| `carouselList`    | 多行滚动的轨道，整体 `translateY` 上移            | `flex flex-col transition-transform duration-300 ease-out`                                                                                                   | 垂直轮播且 `rows > 1`                  |
| `marqueeWrapper`  | 跑马灯容器                                        | `relative min-w-0 overflow-hidden`                                                                                                                           | `direction="horizontal"`               |
| `marquee`         | 跑马灯整行文本                                    | `inline-block whitespace-nowrap will-change-transform`                                                                                                       | `direction="horizontal"`               |
| `marqueeItem`     | 跑马灯中的单条消息                                | `mr-6 last:mr-0`                                                                                                                                             | `direction="horizontal"`               |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名              | 对应节点                              | 默认类                                                                                                                                              | 渲染条件                               |
| ----------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `root`            | 根节点，`custom-class` 也并入此处     | `reborn-alert relative flex w-full items-start gap-[16rpx] rounded-ui-sm px-[24rpx] py-[16rpx] text-28 font-normal leading-[1.5]`，另叠加变体配色 | 始终                                   |
| `icon`            | 图标容器                              | `flex h-[1.5em] shrink-0 items-center`                                                                                                              | `show-icon` 为 `true`                  |
| `content`         | 标题与正文所在的纵向列                | `flex min-w-0 flex-1 flex-col gap-[16rpx]`                                                                                                          | 始终                                   |
| `title`           | 标题                                  | `font-medium`                                                                                                                                       | 有 `title` 属性或 `title` 插槽         |
| `description`     | 正文（默认插槽）                      | `min-w-0`                                                                                                                                           | 非轮播模式且有默认插槽                 |
| `action`          | 操作区                                | `flex min-h-[1.5em] shrink-0 items-center`                                                                                                          | 有 `action` 插槽                       |
| `closeButton`     | 关闭按钮热区                          | `flex size-[1.5em] shrink-0 items-center justify-center rounded-full`                                                                               | `closable` 为 `true`                   |
| `closeIcon`       | 默认关闭图标                          | `size-[28rpx] shrink-0`                                                                                                                             | `closable` 且未用 `close-element` 插槽 |
| `carouselWrapper` | 垂直轮播的 `swiper`                   | `h-[42rpx] min-w-0 overflow-hidden`；多行时高度以内联样式写为 `rows × 42rpx`                                                                        | 垂直轮播模式                           |
| `carouselItem`    | 单条轮播消息                          | `truncate`                                                                                                                                          | 垂直轮播模式                           |
| `marqueeWrapper`  | 跑马灯容器                            | `reborn-alert__marquee-wrapper h-[42rpx] min-w-0 overflow-hidden`                                                                                   | `direction="horizontal"`               |
| `marquee`         | 跑马灯整行文本                        | `reborn-alert__marquee inline-block whitespace-nowrap will-change-transform`                                                                        | `direction="horizontal"`               |
| `marqueeItem`     | 跑马灯中的单条消息                    | `mr-[48rpx] inline-block last:mr-0`                                                                                                                 | `direction="horizontal"`               |

::warning
`reborn-alert__marquee-wrapper` 与 `reborn-alert__marquee` 是 `createSelectorQuery` 测宽用的选择器。覆盖 `marqueeWrapper` / `marquee` 时只能追加类，不要设法去掉它们，否则测不到宽度，跑马灯不会滚动。
::

:::

::

```vue
<template>
  <RebornAlert
    type="info"
    title="提示"
    closable
    :ui="{
      root: 'rounded-none px-4',
      title: 'text-base',
      closeButton: 'hover:bg-transparent',
    }"
  >
    覆盖根节点圆角与内边距、放大标题、去掉关闭按钮的悬停底色。
  </RebornAlert>
</template>
```

## 两端差异对照

| 维度             | Web 端                                                             | UniApp 端                                                                                           |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 根节点类名属性   | `class`                                                            | `custom-class`                                                                                      |
| 图标写法         | Iconify 图标名，交给 `Icon` 组件（如 `lucide:x`）                  | 图标类名（如 `i-lucide-x`）                                                                         |
| 字号与行高       | `text-sm`（12px，行高 20px）                                       | `text-28` + `leading-[1.5]`                                                                         |
| 圆角             | `rounded-lg`                                                       | `rounded-ui-sm`                                                                                     |
| 图标尺寸         | `size-4`                                                           | `size-[32rpx]`                                                                                      |
| 关闭淡出时长     | 200ms                                                              | 300ms（`RebornTransition` 的默认值）                                                                |
| 垂直轮播实现     | 单行用 `Transition` 进出场；多行把列表整体 `translateY`，逐行滚动  | 内置 `swiper`（`vertical` + `circular`），多行由 `display-multiple-items` 承担                      |
| `carouselList` 键 | 有                                                                | 无，`swiper` 没有独立的轨道节点                                                                     |
| 跑马灯测宽       | 直接读 `offsetWidth` / `scrollWidth`，并监听窗口 `resize` 重测     | `createSelectorQuery` 延时 200ms 测量，失败最多重试 5 次；入场过渡结束时再测一次；不监听尺寸变化    |
| 悬停暂停         | 鼠标移入时，垂直轮播与跑马灯都暂停                                 | 无                                                                                                  |
| 关闭按钮悬停底色 | 有（`hover:bg-black/10`）                                          | 无                                                                                                  |
| `close` 事件参数 | `MouseEvent`                                                       | 原生点击事件（类型为 `unknown`）                                                                    |
| 小程序样式穿透   | -                                                                  | `virtualHost` + `addGlobalClass` + `styleIsolation: 'shared'`                                       |

## 注意事项

- **传入 `messages` 后默认插槽不再渲染。** 组件按「跑马灯 → 垂直轮播 → 默认插槽」的顺序只渲染其中一种。想在轮播上方补一句说明，请用 `title`。
- **轮播条数不足时不会滚动。** 单行只有 1 条、或多行不超过 `rows` 条时，不启动定时器（UniApp 端不开启 `swiper` 的 `autoplay`），只静态展示。
- **`speed` 是速率，不是时长。** 一轮的时长等于「文本宽度 + 容器宽度」除以 `speed`。文本越长一轮越久，但视觉速度不变。
- **`close-element` 插槽里不要再调用 `close`。** 外层节点已用 `@click.stop` 绑定关闭，插槽内的点击会冒泡上去。再手动调用一次会让 `close` 事件触发两次。
- **不绑定 `v-model:show` 时，关掉就回不来。** 组件内部把 `show` 置为 `false` 后，没有任何属性能让它重新出现。需要重新唤起的场景必须受控。
- **关闭按钮不能用键盘操作。** 两端的关闭按钮分别是 `span` 与 `view`，不在 Tab 焦点序列中。需要键盘可达时，用 `close-element` 插槽放一个真正的按钮；按上一条，这个按钮不要再绑 `close`。
- **UniApp 端跑马灯不会随容器尺寸变化重测。** 只在以下时机测宽：挂载、入场过渡结束、`messages` / `direction` / `speed` 变化、重新显示。横竖屏切换等让容器变宽后，需要切换一次 `show` 或更新 `messages` 来触发重测。
