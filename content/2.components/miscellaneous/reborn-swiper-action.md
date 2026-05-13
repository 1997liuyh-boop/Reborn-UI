---
title: 滑动操作
description: 列表项左右滑出操作按钮，支持同组互斥、受控展开与移除动画；内容与手势层与 UniApp 多端对齐。
category: 杂项
tags: [css, tailwind, uniapp, swiper]
badge: New
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSwiperActionDemo.vue" config="RebornSwiperActionConfig" componentId="reborn-swiper-action" :componentFiles='[]' :uniappFiles='["RebornSwiperAction.vue", "reborn-swiper-action.config.ts"]'}
::

# API

## Props

| 属性                  | 类型                        | 默认值      | 描述                                                                                                    |
| :-------------------- | :-------------------------- | :---------- | :------------------------------------------------------------------------------------------------------ |
| `leftActions`         | `SwiperActionItem[]`        | `[]`        | **手指向右滑**时露出的左侧操作条（内容 `translateX` 为正）                                              |
| `rightActions`        | `SwiperActionItem[]`        | `[]`        | **手指向左滑**时露出的右侧操作条（常见「删除」侧）                                                      |
| `actionWidth`         | `number`                    | `144`       | 单个操作格默认宽度，**数字单位为 rpx**（内部经 `uni.upx2px` 换算）                                      |
| `threshold`           | `number`                    | `0.35`      | 松手时「展开」判定：取 `侧栏总宽 × threshold` 与 `maxThreshold` 换算后的像素上限的较小值（下限约 24px） |
| `maxThreshold`        | `number`                    | `120`       | 上述展开判定距离的 **rpx 上限**                                                                         |
| `closeThreshold`      | `number`                    | `96`        | 已展开时「滑回关闭」判定距离的 **rpx 上限**（同样与 `侧栏宽 × threshold` 取较小值）                     |
| `duration`            | `number`                    | `80`        | 拖拽结束吸附动画时长（ms）                                                                              |
| `closeDuration`       | `number`                    | `300`       | 主动关闭、页面滚动关闭等场景的过渡时长（ms）                                                            |
| `dragDamping`         | `number`                    | `50`        | 拖动阻尼：**0–1 为小数**，**大于 1 时按百分比**理解（内部 `normalizeDamping` 除以 100）                 |
| `damping`             | `number`                    | `0.05`      | 拉出过量时的边缘阻尼系数（0–1）                                                                         |
| `dampingDistance`     | `number`                    | `72`        | 边缘阻尼允许的最大额外位移，**rpx**                                                                     |
| `touchThreshold`      | `number`                    | `12`        | 横竖手势判定死区，**按 rpx 换算为像素**传入底层数据集                                                   |
| `directionRatio`      | `number`                    | `2.4`       | 微信小程序 WXS 侧滑意图判定斜率参数（与 `data-direction-ratio` 同步）                                   |
| `maxRevealRatio`      | `number`                    | `0.82`      | 单侧操作区总宽不超过根宽的该比例（避免操作过多时把主内容推出可视区）                                    |
| `disabled`            | `boolean`                   | `false`     | 禁用拖拽与按钮；为 `true` 时样式变淡并阻断内容指针                                                      |
| `closeOnActionClick`  | `boolean`                   | `true`      | 点击操作按钮后是否自动收起（`item.triggerRemove` 为 `true` 时仍会先走移除流程）                         |
| `closeOnContentClick` | `boolean`                   | `true`      | 展开状态下点击主内容是否收起（与 `contentTapNavigate` 互斥）                                            |
| `closeOnPageScroll`   | `boolean`                   | `true`      | 页面滚动时是否收起已展开项                                                                              |
| `contentTapNavigate`  | `boolean`                   | `false`     | 为 `true` 时点击主内容不自动关闭，改为触发 `content-click`（适合列表项跳转）                            |
| `group`               | `string \| number \| false` | `'default'` | 同组互斥：同值组件同时只展开一个；**`false`** 关闭互斥                                                  |
| `customClass`         | `any`                       | `''`        | 根节点额外 class（会与 `ui.root` 合并）                                                                 |
| `customStyle`         | `any`                       | `''`        | 根节点内联样式（移除动画时会拼接 `max-height` / `opacity`）                                             |
| `ui`                  | `SwiperActionUI`            | `{}`        | 按键覆盖各区域 Tailwind / Uno 类名，见下文 **UI**                                                       |

### `SwiperActionItem`（`leftActions` / `rightActions` 元素）

| 字段            | 类型                | 描述                                                                                        |
| :-------------- | :------------------ | :------------------------------------------------------------------------------------------ |
| `text`          | `string`            | 按钮文案                                                                                    |
| `key`           | `string \| number`  | 可选；列表 `key`，未传则用 `index`                                                          |
| `icon`          | `string`            | 可选；图标 class（默认实现为 `view` + Uno icon 类）                                         |
| `color`         | `SwiperActionColor` | 可选；未传时按 `item.key === 'delete'` → `error`，`key === 'more'` → `info`，否则 `primary` |
| `width`         | `number`            | 可选；该项宽度 **rpx**，未传则用 `actionWidth`                                              |
| `disabled`      | `boolean`           | 可选；禁用该项点击                                                                          |
| `customClass`   | `string`            | 可选；追加在操作格 class 上                                                                 |
| `customStyle`   | `string`            | 可选；操作格内联样式                                                                        |
| `triggerRemove` | `boolean`           | 可选；为 `true` 时点击后自动 `close` 并播放高度折叠动画，随后 `emit('remove', …)`           |

`SwiperActionColor`：`primary` \| `secondary` \| `success` \| `info` \| `warning` \| `error` \| `neutral`

## v-model

| 绑定      | 类型                      | 默认值 | 描述                                                   |
| :-------- | :------------------------ | :----- | :----------------------------------------------------- |
| `v-model` | `'left' \| 'right' \| ''` | `''`   | 当前展开侧；空字符串表示收起。变更时与同组其它实例互斥 |

## Emits

| 事件名          | 回调参数                        | 描述                                                                                                                                                  |
| :-------------- | :------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `change`        | `side: 'left' \| 'right' \| ''` | 展开侧变化（与 `v-model` 同步）                                                                                                                       |
| `open`          | `side: 'left' \| 'right'`       | 从收起到展开                                                                                                                                          |
| `close`         | —                               | 从展开到收起                                                                                                                                          |
| `click`         | `SwiperActionClickPayload`      | 点击某一操作项；`payload` 含 `item`、`index`、`side`，以及 **`close()`**、**`remove()`**（`remove` 为收起后播放移除动画并在结束时触发 `remove` 事件） |
| `content-click` | `{ openSide, close }`           | `contentTapNavigate` 为 `true` 时由主内容点击触发；`openSide` 为当前展开侧，`close` 为收起函数                                                        |
| `remove`        | `{ item, index, side }`         | 移除动画结束后触发（内置 `triggerRemove` 或手动调用 `payload.remove()` 且动画走完）                                                                   |

## Expose

| 名称    | 类型                                 | 描述                                            |
| :------ | :----------------------------------- | :---------------------------------------------- |
| `open`  | `(side?: 'left' \| 'right') => void` | 展开指定侧，默认 `'right'`；`disabled` 时不生效 |
| `close` | `() => void`                         | 收起当前项                                      |

## Slots

| 插槽名         | 作用域参数                                                 | 描述                                                                                             |
| :------------- | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| `default`      | `{ openSide: 'left' \| 'right' \| '', close: () => void }` | 滑动手势覆盖的主内容区                                                                           |
| `left-action`  | `{ item, index, side: 'left', ui }`                        | 自定义左侧单个操作格；`ui` 与组件内部 computed 一致（含 `root`、`content`、`action` 等类名工厂） |
| `right-action` | `{ item, index, side: 'right', ui }`                       | 自定义右侧单个操作格                                                                             |

## UI

| 名称           | 描述                                 |
| :------------- | :----------------------------------- |
| `root`         | 最外层容器（overflow、圆角、背景）   |
| `actions`      | 左右侧操作条公共层（绝对定位、flex） |
| `leftActions`  | 左侧条附加类（如 `justify-start`）   |
| `rightActions` | 右侧条附加类                         |
| `content`      | 主内容层（阴影、位移、圆角）         |
| `action`       | 单个操作格布局                       |
| `icon`         | 默认图标尺寸                         |
| `text`         | 默认文案样式                         |

## 使用注意

- **宽度与阈值**：侧栏宽度由每项 `width`（rpx）或 `actionWidth` 累加后再受 `maxRevealRatio` 限制；`threshold` / `maxThreshold` / `closeThreshold` 共同决定「展开」与「滑回关闭」的手感。
- **同组互斥**：列表中多个实例设相同 `group` 时，新展开会调用上一个实例的 `close`；独立场景可设 `group={false}`。
- **删除行**：在 `click` 回调里调用 `remove()`，或给该项设 `triggerRemove: true`，会在动画结束后收到 `remove`，业务侧此时可从数据源删行。
- **内容区点击**：`contentTapNavigate` 为 `true` 时用于「点进详情」等跳转，不会再因 `closeOnContentClick` 直接收起；需自行在 `content-click` 里按需 `close()`。
- **App 端**：展开时通过透明代理层修正 transform 后的点击区域；操作仍统一走 `click` / `remove` 逻辑。
- 组件从 `.vue` 中导出 `SwiperActionItem`、`SwiperActionClickPayload` 等类型，便于 TypeScript 项目书写 `leftActions` / 事件处理函数。
