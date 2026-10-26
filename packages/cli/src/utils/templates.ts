import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// 文档站专用逻辑依赖 Nuxt 内容、路由或共享状态，不随组件安装到普通 Vue 工程。
export const WEB_SITE_COMPOSABLE_FILES = new Set([
  "useComponentCode.ts",
  "useDemoFrameTheme.ts",
  "useDocTitleParts.ts",
  "useDocsAside.ts",
  "useDocsPageData.ts",
  "useDocsPlatform.ts",
  "useIsRootPage.ts",
  "useNavigation.ts",
  "useThemeColor.ts",
  "useUniDemoPanel.ts",
]);

export function findNearestPackageRoot(from: string) {
  // from: import.meta.url
  let dir = path.dirname(fileURLToPath(from));
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
}






