import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

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






