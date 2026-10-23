---
title: useNavigation
description: 文档站侧边栏使用：按当前路由与顶栏平台开关，从 Nuxt Content 导航树中取出当前分区的导航数据。
category: Composables
navigation:
  badges:
    - label: Web
      color: info
---

# useNavigation

`useNavigation` 服务于 Reborn UI 文档站自身的侧边栏（`DocsAsideLeftBody`），不是组件库的通用能力。它读取当前路由的第一个路径段，从导航树里找到对应的顶级分区，并按顶栏的 Web / UniApp 开关裁剪组件分区后返回。

## API

```ts
function useNavigation(
  navigation?: Ref<ContentNavigationItem[]>
): {
  nav: ComputedRef<ContentNavigationItem[]>
}
```

`navigation` 是完整的导航树。文档站在 `app.vue` 里用 `queryCollectionNavigation()` 查询导航（组件分区已重组为「系列 → 分类 → 组件」），再以 `provide('navigation', navigation)` 下发。

## 使用示例

```ts
import type { ContentNavigationItem } from '@nuxt/content'
import { inject } from 'vue'
import type { Ref } from 'vue'
import { useNavigation } from '~/composables/useNavigation'

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const { nav } = useNavigation(navigation)
```

## 使用说明

- **按第一个路径段定位分区**：`/components/reborn-button` 命中 `path` 为 `/components` 的节点。根路径 `/` 或找不到对应分区时，分区子项视为空数组，按下文「扁平分区」的规则包装为 `[{ title: 'Overview', path: '', children: [] }]`，而不是返回空数组。
- **先按平台裁剪再取分区**：裁剪调用 `useDocsPlatform().filterNavigation()`，只作用于组件分区下的页面，`platform` 为 `both` 的页面两端都显示，缺省按仅 Web 处理；子项被筛空的分组整组移除。其余分区（入门指南、组合式函数等）原样保留。
- **扁平分区会被包一层**：分区下所有子项都没有下级时，返回值包装为单个分组 `{ title: 'Overview', path: 第一个子项的 path, children }`，侧栏因此可以按分组统一渲染。
- **多层分区原样返回**：有任意子项带下级时直接返回分区的 `children`，组件分区里每个系列是一个分组，分组下是分类节点，再下一层才是组件页。
