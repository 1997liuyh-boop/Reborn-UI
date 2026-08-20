---
title: NoticeBar 通知栏
description: 用于循环播放一组消息通知的通告栏组件，支持水平滚动与垂直轮播。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornNoticeBarDemo.vue" config="RebornNoticeBarConfig" componentId="reborn-notice-bar" :componentFiles='["RebornNoticeBar.vue", "reborn-notice-bar.config.ts"]' :uniappFiles='["RebornNoticeBar.vue", "reborn-notice-bar.config.ts"]'}
::

## 简介

NoticeBar 是双端可用的通知栏组件，`text` 支持单条字符串或多条字符串数组。水平模式下内容溢出容器时自动以 `speed`（px/s）匀速滚动；`direction="vertical"` 且有多条消息时切换为按 `interval` 间隔的垂直轮播。左右图标、文本颜色与背景色均可配置，并暴露 `pause` / `resume` / `replay` / `goTo` 等方法命令式控制播放。

适用场景：

- 页面顶部公告、促销信息循环播报。
- 多条消息垂直轮播切换（`direction="vertical"` + `interval`）。
- 单条长文本需要匀速水平滚动展示（`speed` 控制 px/s）。

不适用场景：

- 图文卡片类内容的循环滚动（web 营销区块），改用 `reborn-marquee`。
- 操作结果的短暂反馈，改用 `reborn-toast`。

## 用法

### 基础用法（水平滚动）

`text` 传入通知内容；内容宽度超出容器且 `scrollable` 为 `true` 时自动开始匀速滚动，`speed` 控制滚动速率（px/s）。

```vue
<template>
  <RebornNoticeBar
    text="这是一条很长很长的通知内容，超出容器宽度后会自动开始匀速滚动播放。"
    left-icon="i-lucide-volume-2"
    :speed="60"
  />
</template>
```

### 垂直轮播

`direction="vertical"` 且 `text` 为数组时逐条垂直轮播，`interval` 控制切换间隔（ms）；默认插槽提供 `{ item, index }` 作用域参数自定义每条内容。

```vue
<template>
  <RebornNoticeBar
    :text="['上新：夏季新品全场 8 折', '公告：今晚 24 点系统维护', '提示：满 99 元包邮']"
    direction="vertical"
    :interval="3000"
  >
    <template #default="{ item, index }">
      <text>{{ index + 1 }}. {{ item }}</text>
    </template>
  </RebornNoticeBar>
</template>
```

### 命令式控制

通过 `ref` 调用暴露的方法控制播放：`pause` / `resume` 暂停与恢复，`replay` 从头重播，`goTo(index)` 在垂直模式下跳到指定条。

```vue
<script setup lang="ts">
import { ref } from "vue";

const barRef = ref();

function pauseBar() {
  barRef.value?.pause();
}
</script>

<template>
  <RebornNoticeBar ref="barRef" :text="notices" direction="vertical" @change="onChange" />
</template>
```

## API

### Props

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
| `customClass` | `string` | `''` | 追加到根节点的自定义类名 | 通用 |
| `ui` | `object` | `{}` | 细粒度样式覆盖对象，见下方「自定义样式（ui）」 | 通用 |

### Emits

| 事件名 | 回调参数 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| `click` | `-` | 点击通知栏时触发 | 通用 |
| `close` | `-` | 关闭通知栏时触发 | 通用 |
| `replay` | `-` | 重新播放动画时触发 | 通用 |
| `change` | `index: number` | 垂直滚动切换时触发 | 通用 |

### Slots

| 插槽名 | 说明 | 平台 |
| :--- | :--- | :--- |
| `default` | 通知主体内容。垂直模式下提供 `{ item: string, index: number }` | 通用 |
| `left-icon` | 左侧图标区域 | 通用 |
| `right-icon` | 右侧图标区域 | 通用 |

### Expose

| 方法名 | 说明 | 平台 |
| :--- | :--- | :--- |
| `pause` | 暂停播放：水平滚动动画停在原地，垂直轮播停止自动切换（web 端鼠标悬停自动调用） | 通用 |
| `resume` | 恢复被 `pause` 暂停的滚动/轮播（web 端鼠标移出自动调用） | 通用 |
| `replay` | 从头重播：垂直模式回到第 0 条并重启轮播计时（触发 `change`），水平模式重新从头滚动；完成后触发 `replay` 事件 | 通用 |
| `checkOverflow` | 重新检测文本是否溢出并更新水平滚动状态，内容或容器尺寸变化后可手动调用（垂直模式下无效） | 通用 |
| `goTo` | `goTo(index)`：垂直轮播模式下带过渡动画切换到指定索引并触发 `change`；水平模式或索引越界时无操作 | 通用 |

## 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点的类名：

| 键名 | 说明 |
| :--- | :--- |
| `root` | 根容器 |
| `content` | 内容区域 |
| `textWrapper` | 文本外层容器（溢出测量基准） |
| `text` | 滚动文本本体 |
| `icon` | 左右图标容器 |
| `verticalWrapper` | 垂直轮播外层容器 |
| `verticalItem` | 垂直轮播单条内容 |

## 注意事项

- web、uniapp 双端可用；web 端鼠标悬停会自动暂停、移出自动恢复。
- `scrollable` 仅在内容溢出且非垂直模式时生效；`wrapable` 多行仅水平模式生效。
- `speed` 单位为 px/s（默认 60）；`interval` 为垂直轮播间隔毫秒（默认 3000）。
- 垂直轮播需要 `direction="vertical"` 且 `text` 为多条数组才会启动；单条数组仍按水平模式展示。
- 垂直模式下默认插槽提供 `{ item, index }` 作用域参数；组件暴露 `pause` / `resume` / `replay` / `checkOverflow` / `goTo` 方法。
- uniapp 端溢出检测依赖节点查询，动态改变内容后建议调用 `checkOverflow()` 重新测量。
