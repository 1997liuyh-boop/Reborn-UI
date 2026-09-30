---
title: Collapse 折叠面板
description: 点击触发区展开或收起内容的折叠组件，带高度过渡动画；Web 端另支持向上展开、浮层模式与禁用。
category: 数据展示
platform: both
tags: [css, tailwind, collapse, accordion, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornCollapseDemo.vue" config="RebornCollapseConfig" componentId="reborn-collapse" :componentFiles='["RebornCollapse.vue", "reborn-collapse.config.ts"]' :uniappFiles='["RebornCollapse.vue", "reborn-collapse.config.ts"]'}
::

## 简介

Collapse 只做一件事：管理一块内容区的展开 / 收起状态，并给高度变化加过渡。触发区与内容都由插槽提供，组件不预设边框、背景、箭头等视觉样式，所以它可以嵌进任何卡片、列表或工具栏里。

默认插槽是**触发区**，点击它切换状态，作用域参数 `open` 用来驱动箭头旋转之类的联动；`content` 插槽是**折叠内容**。展开状态通过 `v-model` 双向绑定。

两端的高度动画实现不同：Web 端用 CSS Grid 的 `grid-template-rows: 0fr ↔ 1fr` 过渡，不需要测量内容高度；UniApp 端先用 `createSelectorQuery` 量出内容高度，再用内联 `height` 驱动过渡。Web 端额外提供 `position`（向上展开）、`absolute`（浮层模式）、`disabled` 与 `toggle` 事件，UniApp 端只保留最基础的折叠能力，差异见[两端差异对照](#两端差异对照)。

### 何时使用

- 次要信息默认收起、按需展开，例如详情说明、高级设置、FAQ 条目。
- 需要自定义触发区外观的折叠场景，箭头、标题、计数都由插槽自己写。
- 底部工具栏向上弹出一块面板而不推开页面（Web 端 `position="top"` + `absolute`）。

### 何时不使用

- 需要内置互斥的手风琴、统一的标题栏样式 —— 组件没有分组与互斥逻辑，多面板需要自己在外部维护状态。
- 需要在任意位置弹出、可自动翻转方向的浮层 —— 改用 `reborn-popover` 或 `reborn-dropdown`，浮层模式只会贴着触发区上下展开。
- 多个平级内容区之间切换 —— 改用 `reborn-tabs`。

## 用法

### 基础用法

默认插槽写触发区，`content` 插槽写折叠内容，`v-model` 绑定展开状态。触发区外层是一个带点击事件的 `div`，没有样式类，边框、内边距、`cursor-pointer` 都要写在插槽内容上。

```vue
<template>
  <RebornCollapse v-model="visible">
    <template #default="{ open }">
      <div class="flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3">
        <span>点击展开 / 收起</span>
        <Icon name="lucide:chevron-down" :class="{ 'rotate-180': open }" />
      </div>
    </template>
    <template #content>
      <div class="px-4 py-3">折叠内容</div>
    </template>
  </RebornCollapse>
</template>
```

::tip
UniApp 端点击触发区只改组件内部状态，**不会回写** `v-model`，外部绑定值会与界面不同步；需要读取当前状态时，以默认插槽的 `open` 为准，或改由外部按钮改写 `v-model`。
::

### 展开方向：向上展开

`position="top"`（仅 Web 端）把折叠区渲染到触发区上方。此时内层会叠加 `flex flex-col justify-end`，把内容底边锚定在触发区边缘，收起时从顶部朝触发区裁切，而不是从底部往上缩。折叠区仍在文档流中，展开会把触发区往下挤。

```vue
<template>
  <RebornCollapse v-model="visible" position="top">
    <template #default="{ open }">…</template>
    <template #content>…</template>
  </RebornCollapse>
</template>
```

### 浮层模式：脱离文档流

`absolute`（仅 Web 端）让折叠区绝对定位：`position="bottom"` 时贴在触发区下方（`top-full`），`position="top"` 时贴在上方（`bottom-full`），层级 `z-50`，根节点自动加 `relative` 作为定位参照。

这时动画从栅格高度过渡换成 `transform` 平移：外层裁切窗口固定、`overflow-hidden`，内层从触发区一侧滑入滑出。这样做的原因是绝对定位盒在高度动画期间保不住锚定边，收起时底边会朝中心漂移，看起来像两端同时收起；平移不触发布局，面板始终只朝触发区一个方向收起。

```vue
<template>
  <!-- 底部工具栏：面板向上浮出，不推开页面 -->
  <RebornCollapse v-model="visible" position="top" absolute>
    <template #default="{ open }">…</template>
    <template #content>
      <div class="mb-2 rounded-lg border bg-default p-3 shadow-sm">浮层内容</div>
    </template>
  </RebornCollapse>
</template>
```

::warning
浮层不占位，会覆盖相邻内容；祖先元素如果有 `overflow-hidden`，面板会被裁掉。收起态的裁切窗口设置了 `pointer-events-none`，不会拦截下方元素的点击。
::

### 禁用与事件

`disabled`（仅 Web 端）让点击触发区不再切换，但 `v-model` 与 Expose 的 `show()` / `hide()` 不受限制，外部仍可改写状态。组件不会给触发区加任何禁用样式，灰显、`cursor-not-allowed` 需要在插槽里自己写。

`toggle` 事件（仅 Web 端）只在点击触发区且切换成功时派发，载荷是切换后的状态；外部改写 `v-model` 或调用 `show()` / `hide()` 都不会触发它，适合只关心用户操作的场景，例如首次展开时懒加载内容。

```vue
<template>
  <RebornCollapse v-model="visible" :disabled="locked" @toggle="onToggle">
    <template #default="{ open }">
      <div :class="locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">…</div>
    </template>
    <template #content>…</template>
  </RebornCollapse>
</template>
```

### 组合：多面板列表

每个 `RebornCollapse` 各自持有一份状态，`v-for` 渲染即可组成列表，多项可以同时展开。组件没有内置互斥，需要手风琴效果时，在某一项展开后把其余项的 `v-model` 置为 `false`。

```vue
<template>
  <div class="divide-y rounded-xl border">
    <RebornCollapse v-for="panel in panels" :key="panel.title" v-model="panel.open">
      <template #default="{ open }">…</template>
      <template #content>…</template>
    </RebornCollapse>
  </div>
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### Web 端全部属性

| 属性名        | 类型                | 默认值     | 描述                                                              |
| ------------- | ------------------- | ---------- | ----------------------------------------------------------------- |
| `modelValue`  | `boolean`           | `false`    | 展开状态，支持 `v-model`。                                        |
| `disabled`    | `boolean`           | `false`    | 禁用点击触发区切换；`v-model` 与 `show()` / `hide()` 不受影响。   |
| `position`    | `'bottom' \| 'top'` | `'bottom'` | 折叠区相对触发区的位置，`top` 时渲染在触发区上方。                |
| `absolute`    | `boolean`           | `false`    | 浮层模式：折叠区绝对定位、不占文档流，动画改为 `transform` 平移。 |
| `customClass` | `ClassValue`        | `''`       | 根节点的自定义样式类，与 `ui.root` 合并。                         |
| `ui`          | `object`            | `{}`       | 细粒度样式覆盖，键位见「自定义样式（ui）」。                      |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

#### UniApp 端全部属性

| 属性名        | 类型      | 默认值  | 描述                                                               |
| ------------- | --------- | ------- | ------------------------------------------------------------------ |
| `modelValue`  | `boolean` | `false` | 展开状态初值与外部控制；点击触发区不会回写，见「基础用法」的提示。 |
| `customClass` | `any`     | `''`    | 根节点的自定义样式类，与 `ui.root` 合并。                          |
| `ui`          | `object`  | `{}`    | 细粒度样式覆盖，键位见「自定义样式（ui）」。                       |

:::

::

### Emits

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 事件名              | 参数               | 描述                                                         |
| ------------------- | ------------------ | ------------------------------------------------------------ |
| `update:modelValue` | `(value: boolean)` | 展开状态变化时触发，`v-model` 依赖它。                       |
| `toggle`            | `(value: boolean)` | 点击触发区切换成功后触发，载荷为切换后的状态；禁用时不触发。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 事件名              | 参数               | 描述                                                           |
| ------------------- | ------------------ | -------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean)` | 由 `defineModel` 声明，但组件内部从不派发，点击不会更新外部值。 |

:::

::

### Slots

两端通用：

| 插槽名    | 参数                | 描述                                                  |
| --------- | ------------------- | ----------------------------------------------------- |
| `default` | `{ open: boolean }` | 触发区内容，点击切换展开状态；`open` 为当前是否展开。 |
| `content` | -                   | 折叠展示的内容区域。                                  |

### Expose

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 名称          | 类型           | 描述                                                                      |
| ------------- | -------------- | ------------------------------------------------------------------------- |
| `show`        | `() => void`   | 展开，不受 `disabled` 限制，不派发 `toggle`。                             |
| `hide`        | `() => void`   | 收起，不受 `disabled` 限制，不派发 `toggle`。                             |
| `toggle`      | `() => void`   | 与点击触发区等价：受 `disabled` 限制，切换后派发 `toggle`。               |
| `resize`      | `() => void`   | 空实现，仅为与 UniApp 端保持同名；栅格动画不需要测量高度。                |
| `isAnimating` | `Ref<boolean>` | 是否处于 300ms 过渡期内，动画期间据此给外层加 `contain: layout style`。   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 名称     | 类型         | 描述                                                                               |
| -------- | ------------ | ---------------------------------------------------------------------------------- |
| `show`   | `() => void` | 展开并在 50ms 后重新测量内容高度。                                                 |
| `hide`   | `() => void` | 收起，高度置 0。                                                                   |
| `toggle` | `() => void` | 切换展开状态，同样不回写 `v-model`。                                               |
| `resize` | `() => void` | 重新测量内容高度。展开状态下内容变化（异步加载、增删行）后调用，否则高度停在旧值。 |

:::

::

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端键名相同（`root` / `trigger` / `content`），但动画实现不同，默认类名与各键承担的职责也不同，因此分端列出。触发区（默认插槽的外层 `div` / `view`）没有对应的 ui 键，样式直接写在插槽内容上。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名      | 说明 |
| --------- | ---- |
| `root`    | 根元素，包裹触发区与折叠区。默认无样式类，`absolute` 时叠加 `relative` 作为浮层定位参照；`customClass` 也并到这个节点。 |
| `trigger` | 折叠区的**动画外层**（注意不是触发区）。默认 `grid transition-[grid-template-rows] duration-300 ease-out`，展开 / 收起分别叠加 `grid-rows-[1fr]` / `grid-rows-[0fr]`，过渡期间再加 `[contain:layout_style]`。`absolute` 时改为 `block overflow-hidden pointer-events-none transition-none`，并按 `position` 叠加 `absolute top-full` 或 `absolute bottom-full` 与 `left-0 z-50 w-full`。在这里改动画时长只对非浮层模式生效。 |
| `content` | 折叠区的**内容内层**，直接包裹 `content` 插槽。默认 `overflow-hidden min-h-0`，让内容随栅格轨道裁切；`position="top"` 时叠加 `flex flex-col justify-end`；`absolute` 时叠加 `transition-transform duration-300 ease-out pointer-events-auto` 与 `translateY` 平移，浮层模式的动画时长要改这里。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名      | 说明 |
| --------- | ---- |
| `root`    | 根元素，包裹触发区与折叠区。默认无样式类，`customClass` 也并到这个节点。 |
| `trigger` | 折叠区的**动画外层**（注意不是触发区）。默认 `relative overflow-hidden transition-[height] duration-300 ease-in-out`，高度由内联 `height` 驱动；改动画时长、缓动写在这里，写固定 `h-*` 无效，会被内联样式覆盖。 |
| `content` | 折叠区的**内容内层**，直接包裹 `content` 插槽，同时是高度测量的目标节点。默认 `absolute top-0 left-0 w-full`；内边距写在这里会计入测量高度，外边距不会，因此间距优先用 `padding`。 |

:::

::

```vue
<template>
  <RebornCollapse
    v-model="visible"
    :ui="{
      trigger: 'duration-500',
      content: 'rounded-b-xl bg-gray-1 p-4',
    }"
  >
    <template #default="{ open }">
      <div class="p-3">{{ open ? "收起" : "展开" }}</div>
    </template>
    <template #content>折叠内容</template>
  </RebornCollapse>
</template>
```

## 两端差异对照

| 维度           | Web                                | UniApp                                           |
| -------------- | ---------------------------------- | ------------------------------------------------ |
| 高度动画       | CSS Grid `0fr ↔ 1fr` 过渡，无需测量 | `createSelectorQuery` 测量后用内联 `height` 过渡 |
| `v-model` 回写 | 点击触发区会回写                   | 点击只改内部状态，不回写                         |
| 展开方向       | `position="bottom"` / `"top"`      | 只能向下                                         |
| 浮层模式       | `absolute`                         | 不支持                                           |
| 禁用           | `disabled`                         | 不支持                                           |
| `toggle` 事件  | 支持                               | 不支持                                           |
| `resize()`     | 空实现                             | 重新测量内容高度                                 |
| `isAnimating`  | 通过 Expose 暴露                   | 无                                               |

## 注意事项

- **UniApp 端 `v-model` 单向**：外部改写 `v-model` 会同步到界面，但点击触发区不会回写外部值。需要双向状态时，不要依赖点击，改由外部控件改写 `v-model`。
- **UniApp 端内容变化后要 `resize()`**：高度只在展开时测量一次（延迟 50ms），展开状态下内容变高或变矮不会自动跟随，需要通过 ref 调用 `resize()`。
- **Web 端 `disabled` 只拦点击**：`show()` / `hide()` 与外部 `v-model` 仍然生效，适合「用户不能操作、程序可以控制」的场景。
- **浮层模式需要空间**：`absolute` 的面板不占位，外层要预留空间，且不能有会裁切它的 `overflow-hidden` 祖先。
