import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPEC_KINDS, SPEC_SOURCES } from "../spec.js";

// 发布前把仓库的写作规范正文与唯一参考范本快照进包内 spec/，使 npx 场景可离线取全文
// （monorepo 内开发时运行时会优先解析仓库根的 docs/authoring/，见 src/spec.ts）
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..", "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const target = path.join(pkgRoot, "spec");

const missing: string[] = [];
const plan: Array<{ from: string; to: string }> = [];

for (const kind of SPEC_KINDS) {
  const source = SPEC_SOURCES[kind];
  for (const [repoRef, packedName] of [
    [source.repoSpec, source.packedSpec],
    [source.repoTemplate, source.packedTemplate],
  ] as const) {
    const from = path.join(repoRoot, repoRef);
    if (!fs.existsSync(from)) {
      missing.push(repoRef);
      continue;
    }
    plan.push({ from, to: path.join(target, packedName) });
  }
}

if (missing.length > 0) {
  console.error(`以下规范源文件不存在，无法生成快照：\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

// 统一按 LF 落盘，屏蔽检出时的换行差异（与 src/spec.ts 的读取一致）
for (const { from, to } of plan) {
  fs.writeFileSync(to, fs.readFileSync(from, "utf8").replace(/\r\n/g, "\n"), "utf8");
}

console.log(`写作规范快照完成：${plan.length} 个文件（正文 + 范本）→ ${target}`);
