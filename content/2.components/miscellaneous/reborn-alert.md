---
title: Alert 警告提示
description: 静态警告提示条：五种消息类型、按钮同款视觉变体、顶部公告模式与消息轮播通知栏。
category: 杂项
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornAlertDemo.vue" config="RebornAlertConfig" componentId="reborn-alert" :componentFiles='["RebornAlert.vue", "reborn-alert.config.ts"]' :uniappFiles='["RebornAlert.vue", "reborn-alert.config.ts"]'}
::

## API

### `<alert>` Props

| 参数名       | 描述                                                        | 类型                                                                                   | 默认值      |
| ----------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------- |
| type        | 警告提示的类型。2.41.0 新增 `normal` 类型                    | `'info' \| 'success' \| 'warning' \| 'error' \| 'normal'`                              | `'info'`   |
| variant     | 视觉变体，对齐 reborn-button 的同名变体（不含 circle）       | `'filled' \| 'outlined' \| 'soft' \| 'subtle' \| 'text' \| 'round'`                    | `'soft'`   |
| color       | 配色覆盖；缺省时由 type 映射（normal → neutral）             | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | -          |
| show-icon   | 是否展示图标                                                 | `boolean`                                                                              | `true`     |
| closable    | 是否展示关闭按钮                                             | `boolean`                                                                              | `false`    |
| title       | 警告提示的标题                                               | `string`                                                                               | -          |
| banner      | 是否作为顶部公告使用（去除边框和圆角）                       | `boolean`                                                                              | `false`    |
| center      | 内容是否居中显示                                             | `boolean`                                                                              | `false`    |
| icon        | 自定义图标名（也可用 icon 插槽）                             | `string`                                                                               | -          |
| close-icon  | 关闭按钮的图标                                               | `string`                                                                               | `'lucide:x'` |
| messages    | 轮播消息列表：传入即变为消息轮播通知栏，默认单条逐条垂直轮播 | `string[]`                                                                             | -          |
| interval    | 垂直轮播的切换间隔，单位毫秒                                 | `number`                                                                               | `3000`     |
| direction   | 轮播方向：`vertical` 垂直切换；`horizontal` 全部消息拼成一行水平跑马灯滚动 | `'vertical' \| 'horizontal'`                                              | `'vertical'` |
| speed       | 水平跑马灯的滚动速率，单位 px/s                              | `number`                                                                               | `60`       |
| rows        | 垂直轮播时同时展示的行数；大于 1 时多条消息同时可见并逐行向上滚动 | `number`                                                                          | `1`        |
| v-model:show | 显隐状态（受控），关闭按钮会将其置为 false                  | `boolean`                                                                              | `true`     |
| ui          | 按语义化结构覆盖各节点样式                                   | `AlertUI`                                                                              | -          |

### `<alert>` Events

| 事件名       | 描述                 | 参数              |
| ----------- | -------------------- | ----------------- |
| close       | 点击关闭按钮时触发   | ev: `MouseEvent`  |
| after-close | 关闭动画结束后触发   | -                 |
| change      | 轮播消息切换时触发   | index: `number`   |

### `<alert>` Slots

| 插槽名         | 描述                             | 参数                                  | 版本    |
| ------------- | -------------------------------- | ------------------------------------- | ------ |
| default       | 提示内容                          | -                                     |        |
| icon          | 图标                              | -                                     |        |
| title         | 标题                              | -                                     |        |
| action        | 操作项                            | -                                     |        |
| close-element | 关闭元素                          | close: `(e: MouseEvent) => void`      | 2.36.0 |
| message       | 轮播模式下单条消息的自定义渲染    | item: `string`、index: `number`       |        |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名，与主题默认类通过 tailwind-merge 合并：

### Web 端

| 键名              | 说明                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `root`            | 根节点：`items-start` 行布局、内边距 12px 8px、字号 / 行高 / 圆角与配色变体都落在这里     |
| `icon`            | 图标容器，高度等于文字首行行高（1.5em）并垂直居中                                        |
| `content`         | 标题与内容的纵向列，标题与内容间距 8px                                                   |
| `title`           | 标题                                                                                     |
| `description`     | 提示内容（默认插槽）                                                                     |
| `action`          | 操作项插槽容器，`min-h-[1.5em]` 内垂直居中，超过一行高时与标题顶部对齐                   |
| `closeButton`     | 关闭按钮，`1.5em` 圆形热区，hover 浅底                                                   |
| `closeIcon`       | 关闭图标                                                                                 |
| `carouselWrapper` | 垂直轮播容器（单行 / 多行），多行模式高度由组件按 rows 写入                              |
| `carouselItem`    | 单条轮播消息，默认 `truncate`                                                            |
| `carouselList`    | 多行垂直滚动的轨道，整体 `translateY` 逐行上移                                           |
| `marqueeWrapper`  | 水平跑马灯容器                                                                           |
| `marquee`         | 跑马灯整行文本（不换行），由组件测宽后驱动动画                                           |
| `marqueeItem`     | 跑马灯中的单条消息，条间距 24px                                                          |

### UniApp 端

| 键名              | 说明                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `root`            | 根节点：`items-start` 行布局、内边距 24rpx 16rpx、字号 / 行高 / 圆角与配色变体           |
| `icon`            | 图标容器，高度等于文字首行行高并垂直居中                                                 |
| `content`         | 标题与内容的纵向列，间距 16rpx                                                           |
| `title`           | 标题                                                                                     |
| `description`     | 提示内容（默认插槽）                                                                     |
| `action`          | 操作项插槽容器，`min-h-[1.5em]` 内垂直居中                                               |
| `closeButton`     | 关闭按钮，`1.5em` 圆形热区                                                               |
| `closeIcon`       | 关闭图标                                                                                 |
| `carouselWrapper` | 垂直轮播的 swiper 容器，单行 42rpx，多行由组件按 rows 写入高度                           |
| `carouselItem`    | 单条轮播消息，默认 `truncate`                                                            |
| `marqueeWrapper`  | 水平跑马灯容器（带 `createSelectorQuery` 测宽用的选择器类名）                             |
| `marquee`         | 跑马灯整行文本（不换行）                                                                 |
| `marqueeItem`     | 跑马灯中的单条消息，条间距 48rpx                                                         |

## 双端差异

| 能力          | Web 端                          | uniapp 端                                        |
| ------------ | ------------------------------- | ------------------------------------------------ |
| 图标          | `Icon` 组件（lucide 图标名）     | tailwind 图标类（`i-lucide-*`）                   |
| 垂直轮播实现  | 单行 `Transition` 进出场；多行为列表整体 `translateY` 逐行滚动 | 内置 `swiper` 垂直轮播（circular + autoplay），多行由 `display-multiple-items` 承担 |
| 水平跑马灯    | `offsetWidth` 测宽后驱动 CSS 动画 | `createSelectorQuery` 测宽后驱动 CSS 动画        |
| close 事件参数 | `MouseEvent`                    | uniapp 事件对象                                   |
| 悬停暂停轮播  | 支持                             | 不适用（触屏无悬停）                              |
