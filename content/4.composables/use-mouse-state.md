---
title: useMouseState
description: 维护一个只读的鼠标进入状态，适合悬停样式、过渡动画和交互卡片等场景。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useMouseState

`useMouseState` 用一个布尔 ref 记录鼠标是否位于某个元素内：模板里在 `mouseenter` / `mouseleave` 时调用 `setMouseEntered`，其他地方读取 `isMouseEntered`。

## API

```ts
function useMouseState(): {
  isMouseEntered: Readonly<Ref<boolean>>
  setMouseEntered: (value: boolean) => void
}
```

| 成员 | 说明 |
| :--- | :--- |
| `isMouseEntered` | 鼠标是否已进入，初始值 `false`；经 `readonly()` 包装，外部只能读。 |
| `setMouseEntered` | 写入新状态的唯一入口。 |

## 使用示例

```vue
<script setup lang="ts">
import { useMouseState } from '~/composables/useMouseState'

const { isMouseEntered, setMouseEntered } = useMouseState()
</script>

<template>
  <div
    :class="{ 'shadow-lg': isMouseEntered }"
    @mouseenter="setMouseEntered(true)"
    @mouseleave="setMouseEntered(false)"
  >
    {{ isMouseEntered ? '悬停中' : '未悬停' }}
  </div>
</template>
```

## 使用说明

- **状态不共享**：每次调用都会创建一份独立的状态。需要让子组件读到同一份状态时，由父组件调用后 `provide` 下去；`card-3d` 的 `CardContainer` 就是这样把它交给 `CardItem` 的。
- **只记录，不监听**：它不绑定任何 DOM 事件，状态是否准确取决于使用方在模板里绑定的事件；只绑了 `mouseenter` 而漏掉 `mouseleave` 时，状态会一直停在 `true`。
