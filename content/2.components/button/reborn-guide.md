---
title: 引导 Guide
description: Web 分步引导：自动居中并锁定目标，支持父子步骤、数字或点状进度、封面与整步组件替换。
category: 反馈
platform: web
tags: [css, tailwind, guide, tour]
badge: New
---

::ComponentViewer{demoFile="RebornGuideDemo.vue" config="RebornGuideConfig" componentId="reborn-guide" :componentFiles='["RebornGuide.vue", "reborn-guide.config.ts"]'}
::

## 简介

Guide 是仅 Web 端可用的分步引导组件，将页面目标滚动到可见区域中央，并显示说明面板；引导期间锁定页面滚动，目标和背景不响应交互。

`steps` 定义目标、内容与父子关系，`mode` 决定贴边浮层或对话框，`indicator` 决定数字或点状步骤指示。父子步骤按「父节点 → 子节点」的深度优先顺序展开，`current` 控制展开后的步骤索引。

内容方面支持 `cover` 封面、动态正文插槽和 `component` 整步组件替换；按钮可按步骤定制文案。`finish`、`skip`、`close` 区分结束原因，`ui` 按内部节点覆盖样式。

### 何时使用

- 首次进入页面时介绍多个操作入口——用 `steps` 指定目标，将 `current` 从 `-1` 改为 `0` 启动。
- 同一功能需要继续拆解说明——用 `children` 定义子步骤，子步骤可继承父级 `element`。
- 简短引导需要紧凑的进度提示——用 `indicator="dots"`，默认数字指示则展示当前步骤与总步骤。
- 步骤需要图文介绍或独立交互——用 `cover` 添加封面，或用 `component` 接管整个面板内容。

### 何时不使用

- 单个元素的悬浮提示——改用 `reborn-tooltip`；需要点击展开说明时改用 `reborn-popover`。
- 需要用户实际点击高亮目标才能继续——改用 `reborn-popover` 配合业务状态；Guide 激活期间会拦截目标交互。
- UniApp 端的分步操作指引——本组件仅支持 Web，需自行结合页面状态与原生滚动 API 实现。

## 用法

### 基础引导

`current` 从 `-1` 设为 `0` 开始；结束后恢复为 `-1`。每次切换会先尽量居中目标，再显示面板并锁定页面滚动。

步骤切换时，当前面板先淡出，新目标定位完成后再以轻微位移淡入；开启系统的减少动态效果设置时，只保留短暂淡入淡出。连续切换以最新步骤为准，关闭引导会立即结束过渡并恢复页面交互。

| `mode` | 定位方式 | 典型用途 |
| --- | --- | --- |
| `popup` | 沿目标边框定位，读取步骤的 `placement` | 解释某个入口或页面区域 |
| `dialog` | 屏幕居中；步骤设置 `placement: 'top'` 时顶部展示 | 需要集中阅读的说明 |

```vue
<script setup lang="ts">
import { ref } from 'vue';
const current = ref(-1);
const steps = [
  { element: '#guide-workspace', title: '工作区', body: '在这里查看项目信息。' },
  { element: '#guide-action', title: '操作入口', body: '完成引导后即可使用。' },
];
</script>
<template>
  <RebornButton @click="current = 0">开始引导</RebornButton>
  <div id="guide-workspace">项目工作区</div>
  <RebornButton id="guide-action">创建项目</RebornButton>
  <RebornGuide v-model:current="current" :steps="steps" />
</template>
```

::tip
默认面板使用 8px 圆角、16px 内边距与 `0 2px 12px rgba(0, 0, 0, 0.15)` 阴影。标题和正文均为 14px，关闭按钮独占顶部一行；`:show-overlay="false"` 只隐藏可见遮罩，透明交互拦截和滚动锁定仍然生效。
::

### 步骤指示与按钮

`indicator` 默认是 `counter`，设置为 `dots` 使用点状进度；`hideCounter` 可隐藏两种指示。每一步的按钮配置优先于组件级配置。

| 配置 | 默认表现 | 典型用途 |
| --- | --- | --- |
| `indicator="counter"` | 当前步骤 / 总步骤 | 步骤较多，需要精确进度 |
| `indicator="dots"` | 未激活为 6×6px 圆点，激活为 10×6px 圆角条，间距 8px | 简短介绍流程 |
| `prevButtonProps` | `neutral`、`outlined`、`sm` | 返回上一项说明 |
| `nextButtonProps` / `finishButtonProps` | `primary`、`filled`、`sm` | 推进或完成流程 |
| `hideSkip: false` | 非最后一步显示跳过按钮 | 允许提前结束引导 |

```vue
<script setup lang="ts">
import { ref } from 'vue';
const current = ref(-1);
const steps = [
  { element: '#guide-settings', title: '介绍', nextButtonProps: { label: '查看设置' } },
  { element: '#guide-settings', title: '设置', prevButtonProps: { label: '返回介绍' }, finishButtonProps: { label: '我知道了' } },
];
</script>
<template>
  <RebornButton id="guide-settings" @click="current = 0">查看点状引导</RebornButton>
  <RebornGuide v-model:current="current" :steps="steps" indicator="dots" />
</template>
```

### 封面与内容插槽

步骤的 `cover` 指定图片地址，`coverAlt` 提供替代文本；`content` 指定正文插槽名，只替换描述区，保留默认标题、步骤指示和按钮。

| 内容入口 | 替换范围 | 典型用途 |
| --- | --- | --- |
| `cover` + `coverAlt` | 标题上方的可选图片，8px 圆角，与标题间距 16px | 功能截图或示意图 |
| `body` | 纯文本描述 | 简短说明 |
| `content` | 正文插槽，优先于 `body` | 清单、链接或富文本 |

```vue
<script setup lang="ts">
import { ref } from 'vue';
const current = ref(-1);
const steps = [{ element: '#guide-feature', title: '使用提示', content: 'tips' }];
</script>
<template>
  <RebornButton id="guide-feature" @click="current = 0">查看说明</RebornButton>
  <RebornGuide v-model:current="current" :steps="steps">
    <template #tips="{ current: stepNumber, total }">
      <p>第 {{ stepNumber }} / {{ total }} 步：请先阅读说明，再继续。</p>
    </template>
  </RebornGuide>
</template>
```

### 子步骤与自动居中

`children` 定义嵌套步骤，兼容拼写 `chidren`；两者同时存在时以 `children` 为准。未填写 `element` 的子步骤继承父目标，其他步骤字段各自独立。

| 输入 | 展开行为 | 典型用途 |
| --- | --- | --- |
| `children` | 先展示父步骤，再递归展示子步骤 | 分层讲解一个区域 |
| `chidren` | `children` 的兼容别名 | 兼容已有调用写法 |
| 子步骤省略 `element` | 继承最近的父级目标 | 在同一个位置补充说明 |
| 子步骤指定 `element` | 滚动页面及滚动容器，将新目标尽量居中 | 介绍离屏或嵌套容器中的功能 |

```vue
<script setup lang="ts">
import { ref } from 'vue';
const current = ref(-1);
const steps = [{ element: '#guide-parent', title: '父步骤', children: [
  { title: '子步骤一', body: '继续说明同一目标。' },
  { element: '#guide-child', title: '子步骤二', body: '切换到新目标。' },
] }];
</script>
<template>
  <RebornButton id="guide-parent" @click="current = 0">开始父子步骤</RebornButton>
  <div id="guide-child" class="mt-96">下方目标</div>
  <RebornGuide v-model:current="current" :steps="steps" />
</template>
```

::tip
此例总数为 3。`v-model:current` 使用展开序列中从 0 开始的索引；面板、插槽和自定义组件拿到的 `current` 从 1 开始，便于直接展示。
::

### 整步自定义组件

步骤的 `component` 可直接传入 Vue 组件，替换面板的标题、正文、关闭按钮和底部操作区；外层继续负责定位、遮罩与交互锁定。

| 输入 | 行为 | 典型用途 |
| --- | --- | --- |
| `component` | 替换整块面板内容，优先于 `cover` / `title` / `body` / `content` | 自定义布局或带交互的步骤 |
| `componentProps` | 向自定义组件传入业务数据 | 按步骤显示不同文案与数据 |
| 注入的导航方法 | `next` / `prev` / `finish` / `close` 控制流程 | 在自定义面板中实现按钮 |

```vue
<script setup lang="ts">
import { markRaw, ref } from 'vue';
import CustomStep from './CustomStep.vue';
const current = ref(-1);
const steps = [{ element: '#guide-custom', component: markRaw(CustomStep),
  componentProps: { message: '这一整块面板来自独立组件。' } }];
</script>
<template>
  <RebornButton id="guide-custom" @click="current = 0">查看自定义面板</RebornButton>
  <RebornGuide v-model:current="current" :steps="steps" />
</template>
```

`CustomStep.vue` 可以直接使用注入的步骤信息与导航方法：

```vue
<script setup lang="ts">
defineProps<{ message: string; current: number; total: number; finish: () => void }>();
</script>
<template>
  <div class="flex flex-col gap-2">
    <p class="text-base text-gray-8">{{ message }}（{{ current }}/{{ total }}）</p>
    <RebornButton size="sm" @click="finish()">完成引导</RebornButton>
  </div>
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `current` | `number` | `-1` | 支持 `v-model:current`；展开后从 0 开始的步骤索引，`-1` 隐藏引导。 |
| `defaultCurrent` | `number` | `-1` | 未传入受控 `current` 时的初始步骤。 |
| `steps` | `GuideStep[]` | - | 必填的步骤树，按深度优先顺序展开。 |
| `mode` | `'popup' \| 'dialog'` | `'popup'` | 面板定位方式，可被步骤级 `mode` 覆盖。 |
| `indicator` | `'counter' \| 'dots'` | `'counter'` | 数字或点状步骤指示。 |
| `hideCounter` | `boolean` | `false` | 隐藏默认步骤指示区域。 |
| `hidePrev` | `boolean` | `false` | 隐藏上一步按钮；第一步始终不显示。 |
| `hideSkip` | `boolean` | `true` | 隐藏跳过按钮；最后一步始终不显示。 |
| `finishButtonProps` | `ButtonProps` | - | 完成按钮配置，默认 `primary`、`filled`、`sm`。 |
| `nextButtonProps` | `ButtonProps` | - | 下一步按钮配置，默认 `primary`、`filled`、`sm`。 |
| `prevButtonProps` | `ButtonProps` | - | 上一步按钮配置，默认 `neutral`、`outlined`、`sm`。 |
| `skipButtonProps` | `ButtonProps` | - | 跳过按钮配置，受 `hideSkip` 控制。 |
| `showOverlay` | `boolean` | `true` | 显示可见遮罩；关闭后仍拦截背景交互并锁定滚动。 |
| `highlightPadding` | `number` | `4` | 高亮区域向目标边框外扩的距离，单位 px；默认等同 `p-1` 的 4px 间距，不改变面板相对目标边框的定位。 |
| `zIndex` | `number` | `999999` | 引导层级基值，面板位于遮罩上方。 |
| `class` | `ClassValue` | - | 追加面板类名。 |
| `ui` | `RebornGuideProps['ui']` | - | 覆盖下表列出的内部节点类名。 |

### Emits

事件参数中的 `current`、`next`、`prev` 均为从 0 开始的展开步骤索引。

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:current` | `current: number` | 同步受控步骤；关闭或结束时为 `-1`。 |
| `change` | `(current: number, context?: { e: MouseEvent; total: number })` | 已启动的引导切换到另一有效步骤时触发。 |
| `nextStepClick` | `{ e: MouseEvent; next: number; current: number; total: number }` | 进入下一步；模板中写作 `@next-step-click`。 |
| `prevStepClick` | `{ e: MouseEvent; prev: number; current: number; total: number }` | 返回上一步；模板中写作 `@prev-step-click`。 |
| `finish` | `{ e: MouseEvent; current: number; total: number }` | 完成引导。 |
| `skip` | `{ e: MouseEvent; current: number; total: number }` | 跳过剩余步骤。 |
| `close` | `{ e: MouseEvent; current: number; total: number }` | 关闭当前引导，与完成和跳过区分。 |

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `counter` | `{ step, current, total, next, prev, finish, close }` | 替换默认步骤指示；`current` 从 1 开始。 |

步骤的 `content` 和 `highlightContent` 是动态具名插槽名称，接收相同的作用域参数。`content` 替换正文，`highlightContent` 在浮层模式的高亮区域内显示内容，仍不能与页面目标交互。

### Expose

| 方法名 | 签名 | 描述 |
| --- | --- | --- |
| `next` | `(event?: MouseEvent) => void` | 进入下一步；最后一步调用时完成引导。 |
| `prev` | `(event?: MouseEvent) => void` | 返回上一步；第一步不动作。 |
| `finish` | `(event?: MouseEvent) => void` | 触发完成事件并结束引导。 |
| `skip` | `(event?: MouseEvent) => void` | 触发跳过事件并结束引导。 |
| `close` | `(event?: MouseEvent) => void` | 触发关闭事件并结束引导。 |

### 步骤定义（GuideStep）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `element` | `string \| (() => Element \| null)` | CSS 选择器或返回目标的函数；子步骤省略时继承父目标。 |
| `title` | `string` | 标题，14px、500 字重、灰阶 10。 |
| `body` | `string` | 描述，14px、灰阶 8。 |
| `cover` | `string` | 可选封面图片地址。 |
| `coverAlt` | `string` | 封面的替代文本。 |
| `content` | `string` | 正文插槽名，优先于 `body`。 |
| `highlightContent` | `string` | 浮层模式的高亮区域插槽名。 |
| `children` | `GuideStep[]` | 子步骤，先父后子深度优先展开。 |
| `chidren` | `GuideStep[]` | 兼容别名；存在 `children` 时不读取此字段。 |
| `component` | `Component` | 替换整个面板内容的 Vue 组件。 |
| `componentProps` | `Record<string, unknown>` | 传给自定义组件的数据；注入的步骤信息与导航方法由引导维护。 |
| `mode` | `'popup' \| 'dialog'` | 覆盖组件级展示模式。 |
| `placement` | `'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end' \| 'center'` | 浮层默认 `bottom`；`center` 用于对话框模式。 |
| `offset` | `[number \| string, number \| string]` | 浮层横向与纵向偏移，按 px 解析。 |
| `highlightPadding` | `number` | 覆盖高亮区域外扩距离，单位 px。 |
| `showOverlay` | `boolean` | 覆盖组件级可见遮罩开关。 |
| `stepOverlayClass` | `string` | 追加高亮区域的类名。 |
| `prevButtonProps` | `ButtonProps` | 当前步骤的上一步按钮配置，`label` 指定文案。 |
| `nextButtonProps` | `ButtonProps` | 当前步骤的下一步按钮配置，`label` 指定文案。 |
| `finishButtonProps` | `ButtonProps` | 当前步骤的完成按钮配置，仅最后一步显示。 |
| `skipButtonProps` | `ButtonProps` | 当前步骤的跳过按钮配置。 |
| `popupProps` | `Record<string, unknown>` | 兼容保留字段，当前未接线。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖 Tailwind 类名。使用 `component` 时，默认封面、标题、正文、关闭按钮和操作区不再渲染，对应键位不影响自定义组件内部。

| 键名 | 说明 |
| --- | --- |
| `overlay` | 浮层模式的全屏交互拦截层。 |
| `highlightMask` | 目标高亮区域，默认 8px 圆角。 |
| `guideBox` | 浮层面板，默认 8px 圆角、16px 内边距与轻阴影。 |
| `guideArrow` | 浮层箭头；目标不存在时隐藏。 |
| `closeRow` | 顶部独立关闭行，右对齐。 |
| `closeButton` | 关闭按钮，图标 20×20px。 |
| `cover` | 可选封面图片，默认 8px 圆角。 |
| `guideHeader` | 标题区域。 |
| `guideTitle` | 标题，默认 `text-base font-medium text-gray-10`。 |
| `guideBody` | 描述区域，默认 `text-base text-gray-8`。 |
| `guideFooter` | 底部，步骤指示靠左、按钮靠右，间距 8px。 |
| `counter` | 默认数字指示；使用 `counter` 插槽时失效。 |
| `indicators` | 点状指示容器，间距 8px。 |
| `indicatorDot` | 单个步骤圆点；激活尺寸为 10×6px，未激活为 6×6px。 |
| `buttonGroup` | 操作按钮组，间距 8px。 |
| `dialogOverlay` | 对话框模式的全屏拦截层。 |
| `dialogBox` | 对话框面板。 |

## 注意事项

- **仅支持 Web**。目标定位依赖 DOM 和浏览器滚动 API，不能用于 UniApp 页面。
- **目标在引导期间不可交互**。即使 `showOverlay` 为 `false`，仍有透明交互拦截层；完成、跳过或关闭后恢复。
- **自动居中受页面边界限制**。靠近页面首尾或使用固定定位的目标无法保证严格居中；嵌套滚动容器会一并滚动到可见位置，随后锁定。
- **未找到目标时回退到屏幕中央**。面板仍显示且不绘制箭头；选择器应匹配已挂载元素，异步内容建议在加载完成后启动。
- **步骤索引与展示序号不同**。受控 `current` 和事件索引从 0 开始；插槽与自定义组件的 `current` 从 1 开始，总数包含父步骤与所有子步骤。
- **`children` 优先于 `chidren`**。同时提供时只展开 `children`；子步骤只继承目标，不自动继承父步骤的标题、按钮或其他配置。
- **整步替换后需要自行提供退出操作**。`component` 不保留默认关闭按钮与底部按钮；可通过注入的 `close` 或 `finish` 结束，组件对象进入响应式数据前建议使用 `markRaw`。
- **`popupProps` 当前是保留字段**。面板由 Guide 自己定位，没有转交其他 Popup 组件；请使用步骤的 `placement`、`offset` 与 `ui` 调整。
- **只有索引、目标与形态变化才会重放切步动画**。`steps` 换了新引用但当前步骤的 `element`、`mode` 没变时，面板只就地刷新标题、正文等内容，不再淡出淡入、重新居中。`element` 写成内联函数时每次都是新函数，会被当作目标变化，引导打开期间请让 `steps`（尤其是函数形式的 `element`）保持稳定引用，例如定义在 `setup` 顶层而不是写在模板里。
