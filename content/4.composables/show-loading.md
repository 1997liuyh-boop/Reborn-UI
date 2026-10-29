---
title: showLoading
description: 服务式加载遮罩：在逻辑代码中创建全屏或局部遮罩，返回可关闭、可更新的实例，对应 Element Plus 的 ElLoading.service。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# showLoading

`showLoading` 在请求拦截器、异步提交流程这类没有模板可写的地方创建加载遮罩，调用即显示，返回的实例用来更新文字和关闭。不传 `target` 时是全屏遮罩。

它是命令式的服务函数，不是组合式函数：遮罩不随调用它的组件卸载而关闭，必须由调用方 `close()`，所以名字不以 `use` 开头。源码文件仍是 `app/composables/useLoading.ts`，导入路径不变。

它和 `v-loading` 指令共用同一个底层创建函数，遮罩内的图标复用 `RebornLoading`。指令用法、图标类型的视觉效果见 [Loading 加载指令](/components/miscellaneous/reborn-loading-directive)。

## API

### showLoading

```ts
function showLoading(options?: LoadingOptions): LoadingInstance
```

### LoadingOptions

```ts
interface LoadingOptions {
  target?: string | HTMLElement
  body?: boolean
  fullscreen?: boolean
  lock?: boolean
  text?: string
  type?: LoadingType
  color?: string
  size?: string | number
  background?: string
  customClass?: ClassValue
  zIndex?: number
}

type LoadingType = 'outline' | 'ring' | 'spinner' | 'bars-scale' | 'blocks-shuffle' | 'blocks-wave' | 'gooey-balls'
```

| 字段 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `target` | - | 局部遮罩的目标：CSS 选择器或 DOM 元素。选择器找不到元素时在控制台告警，并回退到 `document.body`。 |
| `body` | `false` | 局部遮罩改为挂到 `body`，按目标元素的矩形做 `fixed` 定位；矩形只在创建时读取一次。用于目标被祖先的 `overflow` 裁切或处在 `transform` 内的场景。 |
| `fullscreen` | 未传 `target` 时为 `true` | 挂到 `body` 并以 `fixed` 铺满视口；为 `true` 时忽略 `target`。 |
| `lock` | `false` | 锁定滚动：全屏时使用与 `RebornDrawer`、`RebornOverlay` 共享计数的全局滚动锁，局部时给目标元素加 `overflow: hidden`。 |
| `text` | - | 图标下方的文字。 |
| `type` | `'outline'` | 图标类型，与 `RebornLoading` 的 `type` 一致。 |
| `color` | `'primary'` | 预设色名（`primary` / `secondary` / `success` / `info` / `warning` / `error` / `neutral`）或任意 CSS 颜色，文字颜色跟随图标。 |
| `size` | `'24px'` | 图标尺寸。 |
| `background` | - | 遮罩背景色，覆盖默认的 `bg-gray-1/80`（gray-1 随主题反转，浅色为白、深色近黑）。 |
| `customClass` | - | 追加到遮罩根节点的类名。 |
| `zIndex` | 局部 `2000` / 全屏 `3000` | 遮罩层级。 |

### LoadingInstance

```ts
interface LoadingInstance {
  close: () => void
  setText: (text: string) => void
  patch: (options: LoadingPatchOptions) => void
}

type LoadingPatchOptions = Partial<
  Pick<LoadingOptions, 'text' | 'type' | 'color' | 'size' | 'background' | 'customClass' | 'zIndex' | 'lock'>
>
```

| 方法 | 说明 |
| :--- | :--- |
| `close` | 淡出 200ms 后卸载遮罩并还原宿主样式；遮罩已处于隐藏状态时立即卸载。 |
| `setText` | 更新文字，等价于 `patch({ text })`。 |
| `patch` | 浅合并可视化选项；`zIndex` 显式传 `undefined` 时还原默认层级；`lock` 从 `false` 改为 `true` 时立即上锁，改为 `false` 时立即解锁。 |

## 使用示例

### 全屏遮罩

```ts
import { showLoading } from '~/composables/useLoading'

async function submit() {
  // 未传 target：全屏遮罩，创建即显示
  const loading = showLoading({ text: '提交中...', lock: true })
  try {
    await uploadFiles()
    loading.setText('正在生成报告')
    await buildReport()
  }
  finally {
    loading.close()
  }
}
```

### 局部遮罩

```vue
<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { showLoading } from '~/composables/useLoading'

const panelRef = useTemplateRef<HTMLElement>('panelRef')

async function refresh() {
  const loading = showLoading({ target: panelRef.value, text: '加载中' })
  try {
    await fetchPanelData()
  }
  finally {
    loading.close()
  }
}
</script>

<template>
  <div ref="panelRef" class="min-h-40">
    <!-- 面板内容 -->
  </div>
</template>
```

## 使用说明

- **全屏遮罩是单例**：已有未关闭（未调用 `close()`）的全屏实例时，再次以全屏方式调用会直接返回这个实例，新传入的选项不生效，要改内容请用 `patch()` / `setText()`。
- **`close()` 立即释放单例**：旧遮罩还要约 200ms 才淡出完毕，但调用 `close()` 的同时它就不再是单例，这段时间里再调用全屏 `showLoading()` 会创建新实例，新传入的选项正常生效。新旧两层遮罩会短暂叠在一起，旧的淡出后自行卸载；开启 `lock` 时两者各自计数，旧遮罩释放锁后页面仍由新遮罩锁定。
- **局部遮罩会改宿主样式**：宿主为 `static` 定位时临时改为 `relative`，开启 `lock` 时临时加 `overflow: hidden`，都在卸载时还原为原来的行内值。
- **局部遮罩覆盖整个滚动内容**：宿主本身可滚动时，遮罩按 `scrollWidth × scrollHeight` 铺满全部内容，图标区用 `sticky` 固定在可视范围内，滚动时不会露出未遮挡的内容；宿主尺寸变化由 `ResizeObserver` 重新测量。
- **滚动锁延后释放**：`close()` 后滚动锁在淡出结束时才释放，退场动画期间页面不会提前恢复滚动。
- **不随组件卸载关闭**：在组件 `setup` 或事件回调里调用都一样，遮罩与它持有的滚动锁只在 `close()` 时释放，组件卸载不会把它们带走。在组件里创建的遮罩，要在 `onBeforeUnmount` 里自己 `close()`。
- **服务端安全**：没有 `document` 时返回空实现，三个方法都不做任何事，调用方不必判断环境。
