---
title: Loading 加载指令
description: 用于给元素或整页添加加载遮罩的组件，提供 v-loading 指令与 useLoading 服务式调用。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornLoadingDirectiveDemo.vue" config="RebornLoadingDirectiveConfig" componentId="reborn-loading" :componentFiles='["RebornLoadingMask.vue", "reborn-loading-mask.config.ts"]'}
::

## 简介

Loading 加载遮罩提供两种使用方式，二者共享同一套底层创建 / 销毁逻辑（`createLoading`）：

- **`v-loading` 指令**：绑定在元素上，声明式控制该元素（或全屏）的加载遮罩。
- **`useLoading` 服务式调用**：在逻辑代码中命令式创建遮罩，返回实例句柄进行关闭与动态更新。

遮罩内部的加载图标复用 [Loading 加载器](/components/miscellaneous/reborn-loading){.text-primary} 组件（`RebornLoading`），图标类型、颜色、尺寸的取值与其保持一致；本文档只关注"遮罩层"能力，图标本身的样式细节请参阅该组件文档。

`v-loading` 指令由 Nuxt 插件（`app/plugins/loading.ts`）全局注册，无需手动引入即可在任意组件中使用。

## 基础用法（区域加载）

给元素绑定 `v-loading="布尔值"`，为 `true` 时在该元素上覆盖一层半透明加载遮罩：

```vue
<template>
    <!-- 宿主元素若为 static 定位，指令会自动为其添加 position: relative，关闭时还原 -->
    <div v-loading="loading" class="min-h-40 rounded-lg border p-4">
        <p>表格 / 列表等业务内容</p>
        <RebornButton @click="reload">重新加载</RebornButton>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

/** 是否处于加载中 */
const loading = ref(false)

/** 模拟一次异步请求 */
function reload() {
    loading.value = true
    setTimeout(() => {
        loading.value = false
    }, 2000)
}
</script>
```

::note
遮罩隐藏（绑定值变为 `false`）时实例会被保留以便快速重开，不会反复创建销毁；元素卸载（`unmounted`）时才彻底清理：卸载内部 Vue 实例、还原宿主定位样式、释放滚动锁。
::

## 自定义（文字 / 图标类型 / 颜色 / 尺寸 / 背景）

有两种自定义方式，**对象值字段的优先级高于元素属性**：

### 方式一：元素属性（响应式）

在宿主元素上添加 `reborn-loading-*` 属性，属性值变化时遮罩会同步更新：

```vue
<template>
    <div
        v-loading="loading"
        reborn-loading-text="拼命加载中..."
        reborn-loading-type="spinner"
        reborn-loading-color="success"
        reborn-loading-size="32px"
        reborn-loading-background="rgba(0, 0, 0, 0.6)"
        reborn-loading-custom-class="rounded-lg"
        class="min-h-40"
    >
        <p>内容区域</p>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

/** 是否处于加载中 */
const loading = ref(true)
</script>
```

### 方式二：对象值

绑定值传对象，用 `loading` 字段控制显隐，其余字段与 `useLoading` 的可视化选项一致：

```vue
<template>
    <div v-loading="loadingConfig" class="min-h-40">
        <p>内容区域</p>
    </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import type { LoadingDirectiveOptions } from '~/directives/loading'

/** 对象值配置：字段优先级高于元素上的 reborn-loading-* 属性 */
const loadingConfig = reactive<LoadingDirectiveOptions>({
    loading: true,
    text: '数据同步中',
    type: 'bars-scale',
    color: '#8b5cf6',
    size: 28,
})
</script>
```

- `type` 可选值（与 `RebornLoading` 一致）：`'outline' | 'ring' | 'spinner' | 'bars-scale' | 'blocks-shuffle' | 'blocks-wave' | 'gooey-balls'`。
- `color` 支持预设色名（`primary | secondary | success | info | warning | error | neutral`）或任意 CSS 颜色值；加载文字颜色跟随图标颜色。
- `background` 为任意 CSS 颜色，用于覆盖默认的半透明背景（`bg-white/80 dark:bg-gray-9/80`）。

## 全屏加载

使用 `.fullscreen` 修饰符将遮罩挂载到 `body` 并铺满视口，通常配合 `.lock` 锁定页面滚动：

```vue
<template>
    <RebornButton v-loading.fullscreen.lock="fullscreenLoading" @click="openFullScreen">
        显示整页加载
    </RebornButton>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

/** 全屏加载状态 */
const fullscreenLoading = ref(false)

function openFullScreen() {
    fullscreenLoading.value = true
    setTimeout(() => {
        fullscreenLoading.value = false
    }, 2000)
}
</script>
```

修饰符也可以改用对象值字段表达：`v-loading="{ loading: true, fullscreen: true, lock: true }"`。

::note
同一个绑定在"局部 ↔ 全屏"之间切换时，由于挂载点与定位方式不同，指令会销毁旧实例并重建。
::

## 服务式 useLoading

在逻辑代码（如请求拦截器、异步流程）中命令式创建遮罩。不传 `target` 时默认为全屏：

```vue
<template>
    <RebornButton @click="submit">提交</RebornButton>
</template>

<script lang="ts" setup>
/** useLoading 为自动导入的组合式函数，也可从 ~/composables/useLoading 显式导入 */
async function submit() {
    // 未指定 target：默认全屏遮罩（挂载 body），创建即显示
    const loading = useLoading({ text: '提交中...', lock: true })
    try {
        await stepOne()
        // 动态更新加载文字
        loading.setText('即将完成')
        await stepTwo()
        // 批量更新可视化选项
        loading.patch({ type: 'spinner', color: 'success', text: '收尾处理' })
        await stepThree()
    } finally {
        // 关闭：等待淡出过渡结束后卸载
        loading.close()
    }
}
</script>
```

指定 `target`（CSS 选择器或 DOM 元素）时为局部遮罩：

```vue
<template>
    <div ref="panelRef" class="min-h-40 rounded-lg border p-4">
        <p>局部内容</p>
        <RebornButton @click="loadPanel">加载面板</RebornButton>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const panelRef = ref<HTMLElement>()

function loadPanel() {
    // target 支持 CSS 选择器或 DOM 元素；选择器找不到目标时回退 body 并在控制台告警
    const loading = useLoading({
        target: panelRef.value,
        text: '面板加载中',
    })
    setTimeout(() => loading.close(), 2000)
}
</script>
```

### 全屏单例

与 Element Plus 语义一致：**全屏遮罩为单例**。已存在未关闭的全屏实例时，再次调用 `useLoading()`（全屏模式）会直接返回同一个实例，**新传入的 options 不会生效**——如需更新展示内容请使用 `patch()` / `setText()`。

### 其他行为说明

- **SSR 安全**：服务端调用 `useLoading` 返回空实现实例（`close / setText / patch` 均为无操作），调用方无需判空；`v-loading` 指令在服务端零输出，全部 DOM 操作仅在客户端执行。
- **滚动锁**：`lock: true` 且为全屏时，使用与 `RebornOverlay` 共享的全局引用计数滚动锁，多个遮罩 / 弹层叠加时不会互相踩踏；局部遮罩则为目标元素临时添加 `overflow: hidden`，释放时还原原值。锁的释放会延迟到淡出过渡结束，避免退场动画期间页面提前恢复滚动。
- **body 挂载模式**：局部遮罩传 `body: true` 时，遮罩挂到 `body` 并以目标元素矩形做 `fixed` 定位（矩形在创建时快照一次），用于目标存在 `overflow` 裁切或 `transform` 的场景。

## API

### v-loading 指令

#### 绑定值

| 绑定值形式 | 类型 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| 布尔值 | `boolean` | 直接控制遮罩显隐。 | Web |
| 对象值 | `LoadingDirectiveOptions` | 通过 `loading` 字段控制显隐，其余字段做可视化配置；**字段优先级高于元素属性 `reborn-loading-*`**。 | Web |

#### 对象值字段（LoadingDirectiveOptions）

| 字段 | 类型 | 默认值 | 说明 | 平台 |
| :--- | :--- | :--- | :--- | :--- |
| `loading` | `boolean` | `false` | 是否处于加载中。 | Web |
| `text` | `string` | - | 加载文字（显示在图标下方）。 | Web |
| `type` | `LoadingType` | `'ring'` | 加载图标类型，与 `RebornLoading` 一致。 | Web |
| `color` | `string` | `'primary'` | 图标与文字颜色：预设色名或任意 CSS 颜色。 | Web |
| `size` | `string \| number` | `'24px'` | 图标尺寸。 | Web |
| `background` | `string` | - | 遮罩背景色（任意 CSS 颜色，覆盖默认 `bg-white/80 dark:bg-gray-9/80`）。 | Web |
| `customClass` | `ClassValue` | - | 遮罩根节点附加类名。 | Web |
| `lock` | `boolean` | `false` | 锁定滚动，等价于 `.lock` 修饰符。 | Web |
| `fullscreen` | `boolean` | `false` | 全屏遮罩，等价于 `.fullscreen` 修饰符。 | Web |
| `zIndex` | `number` | 局部 `2000` / 全屏 `3000` | 遮罩层级（仅对象值支持，无对应元素属性）。 | Web |

#### 修饰符

| 修饰符 | 说明 | 平台 |
| :--- | :--- | :--- |
| `.fullscreen` | 全屏遮罩：挂载到 `body`，`fixed` 铺满视口。 | Web |
| `.lock` | 锁定滚动：全屏时锁定页面滚动，局部时为宿主元素添加 `overflow: hidden`。 | Web |

#### 元素属性（响应式，组件更新时重读）

| 属性名 | 对应选项 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| `reborn-loading-text` | `text` | 加载文字。 | Web |
| `reborn-loading-type` | `type` | 图标类型（非法值会被忽略）。 | Web |
| `reborn-loading-color` | `color` | 图标与文字颜色。 | Web |
| `reborn-loading-size` | `size` | 图标尺寸。 | Web |
| `reborn-loading-background` | `background` | 遮罩背景色。 | Web |
| `reborn-loading-custom-class` | `customClass` | 遮罩根节点附加类名。 | Web |

#### 指令行为

- 宿主元素为 `static` 定位时自动添加 `position: relative`（记录原内联值，关闭时还原）。
- 绑定值变为 `false` 时仅隐藏遮罩（走淡出过渡），实例保留以便快速重开；元素卸载时彻底清理。
- 局部 / 全屏模式切换时销毁旧实例并重建。

### useLoading(options?)

```ts
const loading = useLoading(options)
loading.setText('即将完成')
loading.patch({ color: 'success' })
loading.close()
```

#### Options（LoadingOptions）

| 属性名 | 类型 | 默认值 | 说明 | 平台 |
| :--- | :--- | :--- | :--- | :--- |
| `target` | `string \| HTMLElement` | - | 目标容器：CSS 选择器或 DOM 元素；**未指定时默认全屏**（挂载 `body`）。选择器找不到目标时回退 `body` 并告警。 | Web |
| `body` | `boolean` | `false` | 遮罩挂载到 `body`（`fixed` 定位覆盖目标矩形），用于目标存在 `overflow` 裁切 / `transform` 的场景。 | Web |
| `fullscreen` | `boolean` | 未指定 `target` 时 `true` | 全屏遮罩（挂载 `body`、`fixed` 铺满视口）。 | Web |
| `lock` | `boolean` | `false` | 锁定滚动：全屏时使用全局引用计数锁（与 `RebornOverlay` 共享），局部时为目标元素添加 `overflow: hidden`。 | Web |
| `text` | `string` | - | 加载文字（显示在图标下方）。 | Web |
| `type` | `LoadingType` | `'ring'` | 加载图标类型。 | Web |
| `color` | `string` | `'primary'` | 图标与文字颜色：预设色名或任意 CSS 颜色。 | Web |
| `size` | `string \| number` | `'24px'` | 图标尺寸。 | Web |
| `background` | `string` | - | 遮罩背景色（任意 CSS 颜色，覆盖默认 `bg-white/80 dark:bg-gray-9/80`）。 | Web |
| `customClass` | `ClassValue` | - | 遮罩根节点附加类名。 | Web |
| `zIndex` | `number` | 局部 `2000` / 全屏 `3000` | 遮罩层级。 | Web |

#### 实例方法（LoadingInstance）

| 方法 | 参数 | 说明 | 平台 |
| :--- | :--- | :--- | :--- |
| `close` | `()` | 关闭遮罩，等待淡出过渡结束后卸载。 | Web |
| `setText` | `(text: string)` | 更新加载文字。 | Web |
| `patch` | `(options: LoadingPatchOptions)` | 动态更新可视化选项与 `lock` 开关；可更新字段：`text / type / color / size / background / customClass / zIndex / lock`。`zIndex` 显式传 `undefined` 表示还原默认层级。 | Web |

### 类型导出

| 类型名 | 导出位置 | 说明 |
| :--- | :--- | :--- |
| `LoadingOptions` | `~/composables/useLoading` | `useLoading` / `createLoading` 的完整配置选项。 |
| `LoadingPatchOptions` | `~/composables/useLoading` | `patch()` 支持的可动态更新字段。 |
| `LoadingInstance` | `~/composables/useLoading` | `useLoading` 返回的实例类型（`close / setText / patch`）。 |
| `LoadingType` | `~/composables/useLoading` | 加载图标类型联合（与 `RebornLoading` 的 `type` 对齐）。 |
| `LoadingDirectiveValue` | `~/directives/loading` | `v-loading` 指令绑定值类型（`boolean \| LoadingDirectiveOptions`）。 |
| `LoadingDirectiveOptions` | `~/directives/loading` | `v-loading` 对象值配置类型。 |

### z-index 层级说明

| 场景 | 默认层级 |
| :--- | :--- |
| 局部加载遮罩 | `2000` |
| 全屏加载遮罩 | `3000` |
| Popup 弹出层（参考） | `2000` |
| Dialog 对话框（参考） | `2400` |

全屏遮罩默认层级 `3000` 高于项目内 Popup（`2000`）与 Dialog（`2400`），保证整页加载时覆盖所有弹层；如需自定义叠放关系，可通过 `zIndex` 选项调整。

## 平台差异与注意事项

- **仅 Web 端支持**：`v-loading` 指令与 `useLoading` 服务式调用依赖浏览器 DOM API（动态创建挂载点、`getComputedStyle`、滚动锁等），UniApp 端暂无此指令；UniApp 端加载状态请直接使用 [Loading 加载器](/components/miscellaneous/reborn-loading){.text-primary} 组件。
- 全屏遮罩为单例，复用已有实例时新传入的 options 不会生效，需通过 `patch()` 更新。
- SSR 环境下 `useLoading` 返回空实现实例，指令在服务端零输出，可放心在通用代码中调用。

::warning
Demo 组件路径待联调确认：`ComponentViewer` 中的 `demoFile="RebornLoadingDirectiveDemo.vue"` 与 `config="RebornLoadingDirectiveConfig"` 需在 Demo 组件（`app/components/reborn/examples/reborn-loading/` 下）完成后核对实际文件名 / 配置名。
::
