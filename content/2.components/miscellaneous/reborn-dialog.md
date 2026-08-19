---
title: Dialog 对话框
description: 用于模态确认与内容展示的对话框组件，支持触发器/受控、拖拽与全屏，仅 web 端。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornDialogDemo.vue" config="RebornDialogConfig" componentId="reborn-dialog" :componentFiles='["RebornDialog.vue", "reborn-dialog.config.ts"]'}

#api

## Props

| 属性                    | 类型                             | 默认值                                                 | 说明                                                     | 平台 |
| :---------------------- | :------------------------------- | :----------------------------------------------------- | :------------------------------------------------------- | :--- |
| `open` / `v-model:open` | `boolean`                        | `undefined`                                            | 控制 Dialog 是否打开，支持外部状态和内部触发器同时参与。 | Web  |
| `title`                 | `string`                         | `''`                                                   | 默认头部标题。                                           | Web  |
| `description`           | `string`                         | `''`                                                   | 默认头部描述。                                           | Web  |
| `close`                 | `boolean \| ButtonProps`         | `{ color: 'primary', variant: 'outline', size: 'sm' }` | 右上角关闭按钮配置，传 `false` 时隐藏。                  | Web  |
| `closeIcon`             | `string`                         | `'lucide:x'`                                           | 关闭按钮图标。                                           | Web  |
| `overlay`               | `boolean`                        | `true`                                                 | 是否显示遮罩层。                                         | Web  |
| `dismissible`           | `boolean`                        | `true`                                                 | 是否允许点击外部或按下 `Esc` 关闭。                      | Web  |
| `scrollable`            | `boolean`                        | `false`                                                | 是否让正文区域在弹层内部滚动。                           | Web  |
| `fullscreen`            | `boolean`                        | `false`                                                | 是否全屏展示 Dialog。                                    | Web  |
| `draggable`             | `boolean`                        | `false`                                                | 是否允许拖拽头部区域移动弹窗，全屏模式下无效。           | Web  |
| `cancelBtn`             | `string \| false \| ButtonProps` | `'取消'`                                               | 取消按钮配置，传 `false` 时隐藏。                        | Web  |
| `confirmBtn`            | `string \| false \| ButtonProps` | `'确认'`                                               | 确认按钮配置，传 `false` 时隐藏。                        | Web  |
| `beforeClose`           | `(done: () => void) => void`     | `undefined`                                            | 关闭前拦截，调用 `done()` 后才会真正关闭。               | Web  |
| `openDelay`             | `number`                         | `0`                                                    | 打开延时，单位毫秒。                                     | Web  |
| `closeDelay`            | `number`                         | `0`                                                    | 关闭延时，单位毫秒。                                     | Web  |
| `zIndex`                | `number`                         | `2400`                                                 | Dialog 根层级。                                          | Web  |
| `lockScroll`            | `boolean`                        | `true`                                                 | 打开时是否锁定页面滚动。                                 | Web  |
| `class`                 | `any`                            | `-`                                                    | 自定义弹窗面板类名。                                     | Web  |
| `ui`                    | `RebornDialogUi`                 | `{}`                                                   | UI 覆盖配置。                                            | Web  |

## Slots

| 插槽名    | 说明                                          | 平台 |
| :-------- | :-------------------------------------------- | :--- |
| `default` | 触发器内容，点击该插槽区域会尝试打开 Dialog。 | Web  |
| `header`  | 自定义头部内容。                              | Web  |
| `content` | Dialog 正文内容。                             | Web  |
| `footer`  | 自定义底部区域。                              | Web  |

## Emits

| 事件名             | 回调参数         | 说明                                   | 平台 |
| :----------------- | :--------------- | :------------------------------------- | :--- |
| `update:open`      | `value: boolean` | 请求更新 Dialog 的打开状态。           | Web  |
| `open`             | `-`              | 打开流程开始时触发。                   | Web  |
| `opened`           | `-`              | 打开动画结束后触发。                   | Web  |
| `close`            | `-`              | 关闭流程开始时触发。                   | Web  |
| `closed`           | `-`              | 关闭动画结束后触发。                   | Web  |
| `confirm`          | `-`              | 点击确认按钮时触发，默认不会自动关闭。 | Web  |
| `cancel`           | `-`              | 点击取消按钮时触发，默认会自动关闭。   | Web  |
| `open-auto-focus`  | `-`              | Dialog 打开后自动聚焦时触发。          | Web  |
| `close-auto-focus` | `-`              | Dialog 关闭后焦点返回触发器时触发。    | Web  |

## 默认行为

- `default` 插槽、`open` 与 `v-model:open` 可以同时参与打开 Dialog，不会互斥。
- 点击取消按钮时会先触发 `cancel`，随后执行关闭流程。
- 点击确认按钮时只触发 `confirm`，默认不会自动关闭。
- `dismissible=false` 时，点击外部和按 `Esc` 都不会关闭 Dialog。
- `beforeClose` 会拦截右上角关闭、取消按钮、点击外部和 `Esc` 等关闭动作。

::
