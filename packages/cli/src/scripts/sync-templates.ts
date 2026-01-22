import path from "node:path";
import fs from "node:fs/promises";
import fssync from "node:fs";
import { fileURLToPath } from "node:url";

async function getFilesRecursive(dir: string, baseDir: string, ignoreFileNames?: Set<string>): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!fssync.existsSync(dir)) return result;

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreFileNames?.has(entry.name)) continue;
    if (entry.name === ".DS_Store") continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursive(fullPath, baseDir, ignoreFileNames);
      Object.assign(result, subFiles);
    } else if (entry.isFile()) {
      const relPath = path.relative(baseDir, fullPath).split(path.sep).join("/");
      const content = await fs.readFile(fullPath, "utf8");
      result[relPath] = content;
    }
  }
  return result;
}

function findWorkspaceRoot(startDir: string) {
  let current = path.resolve(startDir);
  while (true) {
    const marker = path.join(current, "pnpm-workspace.yaml");
    if (fssync.existsSync(marker)) return current;
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = findWorkspaceRoot(__dirname);
  const cliRoot = path.join(workspaceRoot, "packages/cli");
  const generatedFile = path.join(cliRoot, "src/generated/templates.ts");

  console.log(`正在将模板转换为字符串语句...`);

  // 1. 获取 Web 模板
  const webLibFiles = await getFilesRecursive(
    path.join(workspaceRoot, "app/lib"),
    path.join(workspaceRoot, "app")
  );
  const webComposablesFiles = await getFilesRecursive(
    path.join(workspaceRoot, "app/composables"),
    path.join(workspaceRoot, "app"),
    new Set(["useComponentCode.ts", "useCopyToClipboard.ts","getComponentCode.ts","getUniappCode.ts"])
  );

  // 2. 获取 UniApp 模板
  const uniappLibFiles = await getFilesRecursive(
    path.join(workspaceRoot, "packages/uniapp-project/src/lib"),
    path.join(workspaceRoot, "packages/uniapp-project/src")
  );
  const uniappComposablesFiles = await getFilesRecursive(
    path.join(workspaceRoot, "packages/uniapp-project/src/composables"),
    path.join(workspaceRoot, "packages/uniapp-project/src")
  );

  const templateData = {
    web: { ...webLibFiles, ...webComposablesFiles },
    uniapp: { ...uniappLibFiles, ...uniappComposablesFiles }
  };

  const fileContent = `// 此文件由 sync-templates.ts 自动生成，请勿手动修改
export const TEMPLATES = ${JSON.stringify(templateData, null, 2)} as const;

export type Platform = keyof typeof TEMPLATES;
`;

  await fs.mkdir(path.dirname(generatedFile), { recursive: true });
  await fs.writeFile(generatedFile, fileContent, "utf8");

  console.log(`✓ 已生成字符串模板文件: src/generated/templates.ts`);
}

main().catch(console.error);
