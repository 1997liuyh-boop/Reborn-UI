import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function writeTextFile(filePath: string, content: string) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

export async function listFilesRecursive(
  dirPath: string,
  opts?: { ignoreDirNames?: Set<string> },
) {
  const ignoreDirNames =
    opts?.ignoreDirNames ??
    new Set(["node_modules", ".git", ".nuxt", "dist", ".output"]);

  const out: string[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoreDirNames.has(entry.name)) continue;
        await walk(p);
      } else if (entry.isFile()) {
        out.push(p);
      }
    }
  }

  await walk(dirPath);
  return out;
}

export async function copyDirRecursive(params: {
  fromDir: string;
  toDir: string;
  overwrite?: boolean;
  ignoreFileNames?: Set<string>;
}) {
  const { fromDir, toDir, overwrite } = params;
  const ignoreFileNames = params.ignoreFileNames ?? new Set([".DS_Store"]);

  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  await ensureDir(toDir);

  for (const entry of entries) {
    if (ignoreFileNames.has(entry.name)) continue;
    const from = path.join(fromDir, entry.name);
    const to = path.join(toDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirRecursive({ fromDir: from, toDir: to, overwrite, ignoreFileNames });
      continue;
    }

    if (!entry.isFile()) continue;

    if (!overwrite) {
      try {
        await fs.access(to);
        continue; // 已存在则跳过
      } catch {
        // not exists
      }
    }

    await ensureDir(path.dirname(to));
    await fs.copyFile(from, to);
  }
}

export function sha1(text: string) {
  return createHash("sha1").update(text).digest("hex");
}


