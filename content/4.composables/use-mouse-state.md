---
title: useMouseState
description: 维护简单的鼠标进入状态，适合用于悬停样式、过渡动画和交互卡片等场景。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useMouseState

`useMouseState` 是一个极简的鼠标悬停状态管理函数，用于在组件外层维护 `mouseenter` / `mouseleave` 触发后的布尔状态。

## API

```ts
function useMouseState(): {
  isMouseEntered: Readonly<Ref<boolean>>
  setMouseEntered(value: boolean): void
}
```

## 使用示例

```vue
<script setup lang="ts">
const { isMouseEntered, setMouseEntered } = useMouseState()
</script>

<template>
  <div
    @mouseenter="setMouseEntered(true)"
    @mouseleave="setMouseEntered(false)"
  >
    {{ isMouseEntered ? 'hover' : 'idle' }}
  </div>
</template>
```

## 使用说明

- `isMouseEntered` 以只读方式暴露，避免在外部直接覆写。
- 适合与条件类名、动画状态、Tooltip 显示状态联动。
