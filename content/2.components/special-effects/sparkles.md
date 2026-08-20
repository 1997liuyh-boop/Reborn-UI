---
title: 闪烁粒子
description: 用于渲染可配置密度、大小与颜色的闪烁粒子背景层组件。
category: 特效
tags: [canvas, particles, aceternity-ui]
---

::ComponentViewer{demoFile="SparklesDemo.vue" config="SparklesConfig" componentId="sparkles" :componentFiles='["Sparkles.vue", "index.ts"]' dependencies="@vueuse/core"}

#api

基于 Canvas 渲染缓慢漂移、明暗闪烁的星光粒子层，适合铺在标题背后 / 下方或作为全屏氛围背景；粒子会随容器尺寸变化自动重绘。

## API

| 属性名            | 类型     | 默认值      | 描述                                                       |
| ----------------- | -------- | ----------- | ---------------------------------------------------------- |
| `background`      | `string` | `"#0d47a1"` | 画布背景色；作为叠加层使用时通常显式设为 `"transparent"`。 |
| `particleColor`   | `string` | `"#ffffff"` | 粒子颜色，需为 6 位十六进制值（内部会拼接透明度通道）。    |
| `minSize`         | `number` | `1`         | 粒子最小半径（px）。                                       |
| `maxSize`         | `number` | `3`         | 粒子最大半径（px）。                                       |
| `speed`           | `number` | `4`         | 粒子漂移速度倍率。                                         |
| `particleDensity` | `number` | `120`       | 粒子数量；密集星光效果常用 800-1200。                      |

### 注意事项

- 仅 Web 端可用，依赖 `@vueuse/core`（`useRafFn` 驱动逐帧绘制）。
- 无插槽与事件，前景内容需自行以绝对定位叠放在粒子层之上。
- `background` 默认为深蓝色 `#0d47a1`，与页面背景叠加时记得设为 `transparent`。
- 需要随明暗模式切换粒子颜色时，可配合 `useColorMode` 动态传入 `particleColor`（见演示）。
- 只想给一段文字加闪光点缀改用 sparkles-text；需要流星划过动画改用 meteors。

#credits

- 灵感来自 [Aceternity UI 的 Sparkles](https://ui.aceternity.com/components/sparkles)。

::
