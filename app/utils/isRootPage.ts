export function isRootPage() {
  const route = useRoute();

  const rootPages = ["/components", "/blocks", "/changelogs"];

  return computed(
    () =>
      rootPages.findIndex(
        (item) => item === route.fullPath,
      ) >= 0,
  );
}
