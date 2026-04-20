---
title: NoticeBar 通知栏
description: 用于循环播放展示一组消息通知，支持多种内容溢出时的处理方式。
category: 导航
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornNoticeBarDemo.vue" config="RebornNoticeBarConfig" componentId="reborn-notice-bar" :componentFiles='["RebornNoticeBar.vue", "reborn-notice-bar.config.ts"]' :uniappFiles='["RebornNoticeBar.vue", "reborn-notice-bar.config.ts"]'}

#api

## Props

| 属性 | 类型 | 默认值 | 说明 | 平台 |
| :--- | :--- | :--- | :--- | :--- |
| `text` | `string \| string[]` | `''` | 通知文本内容，支持单条字符串或多条字符串数组 | 通用 |
| `speed` | `number` | `60` | 水平滚动速率，单位 px/s | 通用 |
| `scrollable` | `boolean` | `true` | 是否开启滚动播放，内容溢出且非垂直滚动时生效 | 通用 |
| `wrapable` | `boolean` | `false` | 是否开启多行展示 (水平模式生效) | 通用 |
| `disabled` | `boolean` | `false` | 是否禁用，禁用后不再滚动且样式变淡 | 通用 |
| `color` | `string` | `-` | 文本颜色，支持 Hex、RGB 等 CSS 颜色格式 | 通用 |
| `background` | `string` | `-` | 背景色，支持 Hex、RGB 等 CSS 颜色格式 | 通用 |
| `left-icon` | `string` | `-` | 左侧图标名称 | 通用 |
| `right-icon` | `string` | `-` | 右侧图标名称 | 通用 |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 滚动方向 | 通用 |
| `interval` | `number` | `3000` | 垂直滚动时的轮播间隔时间 (ms) | 通用 |

## Emits

| 事件名 | 回调参数 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| `click` | `-` | 点击通知栏时触发 | 通用 |
| `close` | `-` | 关闭通知栏时触发 | 通用 |
| `replay` | `-` | 重新播放动画时触发 | 通用 |
| `change` | `index: number` | 垂直滚动切换时触发 | 通用 |

## Expose

| 方法名 | 说明 | 平台 |
| :--- | :--- | :--- |
| `pause` | 暂停滚动 | 通用 |
| `resume` | 恢复滚动 | 通用 |
| `replay` | 重播动画 | 通用 |
| `checkOverflow` | 检查并更新溢出状态 | 通用 |
| `goTo` | 垂直模式下跳转到指定索引 | 通用 |

## UI 配置 (Slots & Variants)

### Slots

| 插槽名 | 说明 | 平台 |
| :--- | :--- | :--- |
| `default` | 通知主体内容。垂直模式下提供 `{ item: string, index: number }` | 通用 |
| `left-icon` | 左侧图标区域 | 通用 |
| `right-icon` | 右侧图标区域 | 通用 |

### Variants

| 变体 | 选项 | 说明 |
| :--- | :--- | :--- |
| `wrapable` | `true` / `false` | 控制是否允许内容垂直换行而非水平滚动 |
