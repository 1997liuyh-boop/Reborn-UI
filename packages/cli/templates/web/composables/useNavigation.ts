import type { ContentNavigationItem } from "@nuxt/content";

export function useNavigation(navigation?: Ref<ContentNavigationItem[]>) {
  const route = useRoute();

  const children = computed(() => {
    const nav = toValue(navigation);

    // Get the current path segments
    const pathSegments = route.path.split("/").filter(Boolean);

    // Need at least one section (e.g., ['components', 'button'])
    if (pathSegments.length < 1) {
      return [];
    }

    // Build the top parent path (e.g., '/components')
    const topParentPath = `/${pathSegments[0]}`;

    // Find the matching top-level navigation item
    const topParent = nav?.find((item) => item.path === topParentPath);

    return topParent?.children || [];
  });

  const isFlatList = computed(() => {
    return children.value.every((child) => !child.children || child.children.length === 0);
  });

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
