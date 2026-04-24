---
title: useNavigation
description: 根据当前路由和 Nuxt Content 导航树，生成适合侧边栏渲染的导航数据。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useNavigation

`useNavigation` 主要用于 Reborn UI 文档站。它会读取当前路由路径，并从 `fetchContentNavigation()` 返回的导航树中提取当前一级分区下的导航列表。

## API

```ts
function useNavigation(
  navigation?: Ref<ContentNavigationItem[]>
): {
  nav: ComputedRef<ContentNavigationItem[]>
}
```

## 使用示例

```ts
const { data: navigation } = await useAsyncData(
  'navigation',
  () => fetchContentNavigation()
)

const { nav } = useNavigation(navigation)
```

## 使用说明

- 它会根据当前路由的第一个路径段定位顶级分区，例如 `/components/button` 会命中 `/components`。
- 如果当前分区下所有子项都没有继续分组，返回值会被包装成单个 `Overview` 分组，方便统一渲染侧边栏。
- 如果本身是多层结构，则直接返回原始分组。
