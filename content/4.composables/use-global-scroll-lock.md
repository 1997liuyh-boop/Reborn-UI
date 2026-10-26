---
title: useGlobalScrollLock
description: 全局共享计数的页面滚动锁，自建全屏层与 RebornDrawer、RebornOverlay、showLoading 叠加时不会互相解锁。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useGlobalScrollLock

`useGlobalScrollLock` 是 `RebornDrawer`、`RebornOverlay`、`showLoading` / `v-loading`（全屏且开启 `lock` 时）共用的页面滚动锁。所有调用方共享同一个模块级计数器：计数从 0 变为 1 时锁定页面滚动，回到 0 时才解锁。

自己实现全屏层（自定义抽屉、全屏预览等）需要锁滚动时应该用它，而不是另起一套锁。两套锁各管各的，一方释放时会把另一方仍需要的锁一并解开，例如抽屉还开着，页面却已经能滚动了。

## API

```ts
function useGlobalScrollLock(): {
  acquire: () => void
  release: () => void
  isHolding: () => boolean
}
```

| 成员 | 说明 |
| :--- | :--- |
| `acquire` | 当前调用方上锁：未持锁时计数加 1，已持锁时重复调用不会重复计数。 |
| `release` | 当前调用方释放：只有持锁时才让计数减 1，计数归零时解锁页面。 |
| `isHolding` | 当前调用方是否持锁。 |

每次调用 `useGlobalScrollLock()` 都会得到一个独立的持锁标记，同一个组件里只调用一次即可。在组件 `setup` 或 `effectScope` 内调用时，作用域销毁会自动 `release()`。

## 使用示例

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useGlobalScrollLock } from '~/composables/useGlobalScrollLock'

/** 全屏层是否打开，双向绑定 */
const open = defineModel<boolean>({ default: false })

const { acquire, release } = useGlobalScrollLock()

watch(open, (value) => {
  if (value) acquire()
  else release()
})

// 组件卸载时自动释放，不必再写 onUnmounted(release)
</script>
```

## 使用说明

- **锁的是页面实际的滚动元素**：通过 `@vueuse/core` 的 `useScrollLock` 锁定 `document.scrollingElement`（不存在时用 `document.documentElement`），不给 `body` 加 `overflow: hidden`。原因是给 `body` 设 `overflow` 会改变 `sticky` 元素的参照容器，文档站的侧栏会因此上移。
- **用原生占位代替间距补偿**：计数从 0 变为 1 时，如果页面当前显示着滚动条、根元素又没有设 `scrollbar-gutter: stable`，会给 `<html>` 加上 `[scrollbar-gutter:stable]` 类，用浏览器原生的滚动条占位避免内容横向跳动；最后一把锁释放时只移除这个由它添加的类。
- **随调用方作用域兜底释放**：在组件 `setup` 或 `effectScope` 内调用时，作用域销毁会自动调用一次 `release()`，漏写释放也不会让计数停在大于 0、把整站滚动锁死。`release()` 是幂等的，组件自己已经释放过时这次调用什么也不做。`RebornOverlay` 关闭时还会把释放推迟到退场动画结束，避免动画期间页面提前恢复滚动，自建全屏层有退场动画时可以照此处理。
- **比调用方活得久的持锁者要在独立作用域里取凭据**：`showLoading` 的遮罩不随调用它的组件卸载而关闭，它在 `effectScope(true)` 里调用 `useGlobalScrollLock()`，锁只在遮罩 `close()` 时释放。自建的服务式全屏层同理。
- **在哪里上锁都可以**：底层的 `useScrollLock` 在全局第一次 `acquire()` 时创建，放在独立的副作用作用域里，不挂到当时所在的组件上。因此在 `setup`（包括 `immediate: true` 的 `watch` 首次回调）、生命周期钩子或事件回调里上锁效果相同，先上锁的组件卸载也不会连带解锁页面，只有计数归零才会解锁。
- **服务端安全**：没有 `document` 时 `acquire()` 直接返回，不计数。
