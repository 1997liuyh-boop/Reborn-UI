import type { ContentNavigationItem } from "@nuxt/content";

/**
 * 侧边栏导航组合式函数
 *
 * 根据当前路由路径，从 Nuxt Content 的导航树中提取对应的子级导航数据，
 * 用于渲染文档站点的侧边栏菜单。
 *
 * @param navigation - 由 `fetchContentNavigation()` 返回的完整导航树（响应式引用）
 * @returns `nav` — 经过处理后可直接用于侧边栏渲染的导航列表
 *
 * @example
 * ```ts
 * const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
 * const { nav } = useNavigation(navigation)
 * ```
 */
export function useNavigation(navigation?: Ref<ContentNavigationItem[]>) {
  const route = useRoute();

  /**
   * 当前路由所属的顶级分区下的所有子项。
   *
   * 例如路由为 `/components/button` 时：
   * 1. 解析出第一级路径段 `components`
   * 2. 在导航树中查找 `path === '/components'` 的节点
   * 3. 返回该节点的 `children`（即所有组件分类/页面）
   */
  const children = computed(() => {
    const nav = toValue(navigation);

    // 将路由路径拆分为段，过滤空字符串（首尾斜杠产生的空串）
    // 例如 '/components/button' → ['components', 'button']
    const pathSegments = route.path.split("/").filter(Boolean);

    // 至少需要一个路径段才能定位顶级分区
    if (pathSegments.length < 1) {
      return [];
    }

    // 构造顶级分区路径，例如 '/components'
    const topParentPath = `/${pathSegments[0]}`;

    // 在导航树的第一层中查找匹配的节点
    const topParent = nav?.find((item) => item.path === topParentPath);

    return topParent?.children || [];
  });

  /**
   * 判断当前分区是否为"扁平列表"（所有子项均无下级子菜单）。
   * 用于区分单层目录（如"入门指南"）和多层分组目录（如"组件"）。
   */
  const isFlatList = computed(() => {
    return children.value.every((child) => !child.children || child.children.length === 0);
  });

  /**
   * 最终供侧边栏渲染的导航数据。
   *
   * - **扁平列表**：包装为单个 `{ title: 'Overview', children: [...] }` 分组，
   *   确保侧边栏仍能以分组形式统一渲染。
   * - **多层结构**：直接透传 `children`，每个子项自身就是一个分组。
   */
  const nav = computed(() => {
    if (isFlatList.value) {
      return [
        {
          title: "Overview",
          path: children.value.at(0)?.path || "",
          children: children.value,
        },
      ];
    }

    return children.value;
  });

  return {
    nav,
  };
}
