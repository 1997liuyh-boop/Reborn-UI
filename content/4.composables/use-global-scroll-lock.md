---
title: useGlobalScrollLock
description: 全局共享计数的页面滚动锁，自建全屏层与 RebornDrawer、RebornOverlay、useLoading 叠加时不会互相解锁。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useGlobalScrollLock

`useGlobalScrollLock` 是 `RebornDrawer`、`RebornOverlay`、`useLoading` / `v-loading`（全屏且开启 `lock` 时）共用的页面滚动锁。所有调用方共享同一个模块级计数器：计数从 0 变为 1 时锁定页面滚动，回到 0 时才解锁。

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

每次调用 `useGlobalScrollLock()` 都会得到一个独立的持锁标记，同一个组件里只调用一次即可。

## 使用示例

```vue
<script setup lang="ts">
import { onUnmounted, watch } from 'vue'
import { useGlobalScrollLock } from '~/composables/useGlobalScrollLock'

/** 全屏层是否打开，双向绑定 */
const open = defineModel<boolean>({ default: false })

const { acquire, release } = useGlobalScrollLock()

watch(open, (value) => {
  if (value) acquire()
  else release()
})

// 组件卸载时不会自动释放，漏掉这一步计数无法归零，页面会一直锁着
onUnmounted(release)
</script>
```

## 使用说明

- **锁的是页面实际的滚动元素**：通过 `@vueuse/core` 的 `useScrollLock` 锁定 `document.scrollingElement`（不存在时用 `document.documentElement`），不给 `body` 加 `overflow: hidden`。原因是给 `body` 设 `overflow` 会改变 `sticky` 元素的参照容器，文档站的侧栏会因此上移。
- **用原生占位代替间距补偿**：计数从 0 变为 1 时，如果页面当前显示着滚动条、根元素又没有设 `scrollbar-gutter: stable`，会给 `<html>` 加上 `[scrollbar-gutter:stable]` 类，用浏览器原生的滚动条占位避免内容横向跳动；最后一把锁释放时只移除这个由它添加的类。
- **必须手动释放**：它不监听组件卸载，持锁的组件要在 `onUnmounted` / `onBeforeUnmount` 里调用 `release()`。`RebornOverlay` 关闭时还会把释放推迟到退场动画结束，避免动画期间页面提前恢复滚动，自建全屏层有退场动画时可以照此处理。
- **在哪里上锁都可以**：底层的 `useScrollLock` 在全局第一次 `acquire()` 时创建，放在独立的副作用作用域里，不挂到当时所在的组件上。因此在 `setup`（包括 `immediate: true` 的 `watch` 首次回调）、生命周期钩子或事件回调里上锁效果相同，先上锁的组件卸载也不会连带解锁页面，只有计数归零才会解锁。
- **服务端安全**：没有 `document` 时 `acquire()` 直接返回，不计数。
