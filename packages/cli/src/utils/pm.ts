import fs from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import type { PackageManager } from "../types.js";
import { pathExists, readJsonFile, writeJsonFile } from "./fs.js";

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  if (await pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  if (await pathExists(path.join(cwd, "package-lock.json"))) return "npm";
  if (await pathExists(path.join(cwd, "bun.lockb"))) return "bun";
  return "pnpm";
}

export async function readPackageJson(
  cwd: string,
): Promise<Record<string, any> & { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }> {
  return await readJsonFile(path.join(cwd, "package.json"));
}

export async function writePackageJson(cwd: string, pkg: unknown) {
  await writeJsonFile(path.join(cwd, "package.json"), pkg);
}

export function getMissingDeps(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  deps: string[],
) {
  const existing = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
  return deps.filter((d) => !existing.has(d));
}

export async function installDeps(params: {
  cwd: string;
  pm: PackageManager;
  deps: string[];
  dev?: boolean;
}) {
  const { cwd, pm, deps, dev } = params;
  if (!deps.length) return;

  const args: string[] = [];
  if (pm === "pnpm") args.push("add");
  else if (pm === "npm") args.push("install");
  else if (pm === "yarn") args.push("add");
  else if (pm === "bun") args.push("add");

  if (dev) {
    if (pm === "npm") args.push("--save-dev");
    else args.push("-D");
  }

  args.push(...deps);

  await execa(pm, args, { cwd, stdio: "inherit" });
}

export async function ensureJsonFile(cwd: string, relPath: string, defaultJson: unknown) {
  const p = path.join(cwd, relPath);
  if (await pathExists(p)) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(defaultJson, null, 2) + "\n", "utf8");
}


