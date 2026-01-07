import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { pathExists } from "./fs.js";
import { copyDirRecursive } from "./fs.js";

function findNearestPackageRoot(from: string) {
  // from: import.meta.url
  let dir = path.dirname(fileURLToPath(from));
  while (true) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return dir;
    dir = parent;
  }
}

export function getTemplatesRootDir() {
  // 注意：CLI 打包后可能变成单文件（dist/index.js），此时 import.meta.url 的相对基准会变化。
  // 通过向上查找最近的 package.json 来定位包根目录。
  const pkgRoot = findNearestPackageRoot(import.meta.url);
  return path.join(pkgRoot, "templates");
}

export async function copyTemplateSubdir(params: {
  subdir: "lib" | "composables";
  cwd: string;
  targetDir: string;
  overwrite?: boolean;
}) {
  const templatesRoot = getTemplatesRootDir();
  const fromDir = path.join(templatesRoot, params.subdir);
  if (!(await pathExists(fromDir))) return false;

  const toDir = path.join(params.cwd, params.targetDir);
  await copyDirRecursive({ fromDir, toDir, overwrite: params.overwrite });
  return true;
}






