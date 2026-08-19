import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// 发布前把仓库根的 knowledge/ 快照进包内，使 npx 场景可离线使用
// （monorepo 内开发时运行时会优先解析仓库根的 knowledge/，见 src/kb.ts）
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..", "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const source = path.join(repoRoot, "knowledge");
const target = path.join(pkgRoot, "knowledge");

if (!fs.existsSync(path.join(source, "index.json"))) {
  console.error(`知识库不存在或未生成：${source}，请先在仓库根运行 pnpm kb:build`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
// overrides 是人工源文件，不进快照；schema/components/index/report 全量拷贝
fs.cpSync(source, target, {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}overrides`),
});

const count = fs.readdirSync(path.join(target, "components")).length;
console.log(`知识库快照完成：${count} 个组件 → ${target}`);
