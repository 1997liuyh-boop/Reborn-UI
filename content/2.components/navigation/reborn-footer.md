---
title: Footer 底部栏
description: 用于固定在页面底部放置操作按钮的容器组件，自动占位并适配安全区，目前仅 uniapp 端实现。
category: 导航
badge: New
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::warning
仅 UniApp 端可用。Web 端源码目前是「暂未开发」的占位组件；Web 页面底部操作条可用 `reborn-sticky` 的吸底模式（`position="bottom"`）替代。
::

::ComponentViewer{demoFile="RebornFooterDemo.vue" config="RebornFooterConfig" componentId="reborn-footer" :componentFiles='["RebornFooter.vue"]' :uniappFiles='["RebornFooter.vue", "reborn-footer.config.ts", "offset.ts"]'}
::

## 简介

Footer 是固定在页面底部的操作栏容器：内容通过默认插槽放入，组件挂载后自动测量自身高度并在文档流中生成等高占位元素，防止固定底栏遮挡页面内容；同时通过 `pb-[env(safe-area-inset-bottom)]` 适配 iPhone 底部黑条等安全区。测得的高度还会写入 `offset.ts` 导出的 `rebornFooterOffset` 共享状态，供返回顶部按钮等其他悬浮组件读取以避让底栏。

适用场景：

- 表单页/详情页底部固定的提交、取消等操作栏。
- 需要自动占位防遮挡、并适配底部安全区的固定底栏。

不适用场景：

- 底部多页签导航切换，改用 `reborn-tabbar`。
- Web 端项目：组件仅有 UniApp 实现。

## 用法

### 基础用法

将底部操作内容放入默认插槽即可，组件自动固定到页面底部并生成占位：

```vue
<script setup lang="ts">
import RebornFooter from '@/components/reborn-footer/RebornFooter.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
</script>

<template>
  <view>
    <view v-for="i in 20" :key="i" class="p-[24rpx]">列表内容 {{ i }}</view>

    <RebornFooter :ui="{ content: 'flex items-center gap-[16rpx] px-[24rpx] py-[16rpx]' }">
      <RebornButton fluid>取消</RebornButton>
      <RebornButton fluid color="primary">提交</RebornButton>
    </RebornFooter>
  </view>
</template>
```

### 内容变化后重测高度

组件只在挂载与 `vt` 变化时测量高度。插槽内容动态增减导致高度改变时，需变更 `vt`（例如自增计数器）触发重新测量，否则占位高度不会更新：

```vue
<script setup lang="ts">
const vt = ref(0)
const showTip = ref(false)

function toggleTip() {
  showTip.value = !showTip.value
  vt.value++ // 内容高度变了，触发 footer 重测
}
</script>

<template>
  <RebornFooter :vt="vt">
    <view v-if="showTip" class="p-[16rpx] text-[24rpx] text-warning">合计金额已更新</view>
    <view class="flex justify-end p-[24rpx]">
      <button class="rounded bg-primary px-[32rpx] py-[12rpx] text-white" @click="toggleTip">结算</button>
    </view>
  </RebornFooter>
</template>
```

### 固定内容高度

传入 `height`（px）后不再通过选择器自动测量，内容区强制为该高度，适合高度已知、希望跳过异步测量的场景：

```vue
<template>
  <RebornFooter :height="56">
    <view class="h-full flex items-center justify-between px-[24rpx]">
      <text class="text-[28rpx] font-medium">合计：¥ 99.00</text>
      <button class="rounded bg-primary px-[32rpx] py-[12rpx] text-white">去支付</button>
    </view>
  </RebornFooter>
</template>
```

## API

### Props

| 属性名      | 类型             | 默认值 | 描述                                                                                     |
| :---------- | :--------------- | :----- | :--------------------------------------------------------------------------------------- |
| `minHeight` | `number`         | `30`   | 最小可见高度阈值 (px)。footer 实测高度（含底部安全区）不大于该值时，整个 footer 不显示。 |
| `vt`        | `number`         | `0`    | 监听值。该值变化时强制重新测量 footer 高度并刷新占位。                                   |
| `height`    | `number \| null` | `null` | 指定内容区高度 (px)。设置后不再通过选择器自动测量。                                      |
| `ui`        | `object`         | `{}`   | 按键覆盖各节点类名，见下方「自定义样式（ui）」。                                         |

### Slots

| 插槽名    | 描述                                               |
| :-------- | :------------------------------------------------- |
| `default` | footer 内容区插槽，通常放置提交/取消等底部操作按钮。 |

### 自定义样式（ui）

`ui` 属性按以下键覆盖对应节点类名：

| 键名          | 说明                                                                                     |
| :------------ | :--------------------------------------------------------------------------------------- |
| `placeholder` | 文档流中的占位元素（撑开页面底部空间，防止内容被遮挡），默认 `w-full`。                  |
| `wrapper`     | 固定定位的外层容器，默认 `fixed bottom-0 left-0 z-70 w-full`。                           |
| `base`        | footer 主体容器（背景色、安全区内边距 `pb-[env(safe-area-inset-bottom)]` 在此层）。      |
| `content`     | footer 内容区（内边距、布局），默认 `px-3 py-3`。                                        |

## 注意事项

- 仅 UniApp 端可用，Web 端源码为「暂未开发」的占位组件。
- 显示阈值判定：实测高度（含底部安全区）必须大于 `minHeight + 底部安全区高度` 才显示；隐藏时占位元素一并移除，且 `rebornFooterOffset` 归零。
- 占位高度为实测高度再加 5px 余量，页面底部会比 footer 略多出一点空隙，属预期行为。
- 插槽内容动态变化不会自动触发重测，必须变更 `vt`；`vt` 变化时组件会先恢复显示再测量。
- `height` 指定后内容区强制为该高度（超出部分溢出），底部安全区高度仍会额外叠加。
- Android App 端底部安全区读取为 0 时按 16px 兜底，避免按钮贴底。
- `offset.ts` 导出的 `rebornFooterOffset.height` 是模块级共享的当前底部偏移（响应式 ref），其他悬浮组件可导入它来避让 footer。
