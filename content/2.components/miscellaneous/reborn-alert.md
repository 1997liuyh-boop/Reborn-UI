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
| messages    | 轮播消息列表：传入即变为消息轮播通知栏，多条消息垂直轮播展示 | `string[]`                                                                             | -          |
| interval    | 轮播间隔时间，单位毫秒                                       | `number`                                                                               | `3000`     |
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

## 双端差异

| 能力          | Web 端                          | uniapp 端                                        |
| ------------ | ------------------------------- | ------------------------------------------------ |
| 图标          | `Icon` 组件（lucide 图标名）     | tailwind 图标类（`i-lucide-*`）                   |
| 轮播实现      | `Transition` 垂直进出场          | 内置 `swiper` 垂直轮播（circular + autoplay）     |
| close 事件参数 | `MouseEvent`                    | uniapp 事件对象                                   |
| 悬停暂停轮播  | 支持                             | 不适用（触屏无悬停）                              |
