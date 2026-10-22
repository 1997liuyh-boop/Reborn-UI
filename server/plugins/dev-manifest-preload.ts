import { removeDevManifestPreload } from "../utils/devManifestPreload";

export default defineNitroPlugin((nitroApp) => {
  if (!import.meta.dev) return;

  // 开发清单沿用 Nuxt 的按需请求，生产清单和其他首屏资源仍正常预加载。
  nitroApp.hooks.hook("render:html", (html) => {
    html.head = html.head.map(removeDevManifestPreload);
  });
});
