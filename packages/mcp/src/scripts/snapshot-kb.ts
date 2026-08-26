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

// 必须检查 components/ 而非 index.json：index.json 是入库文件（恒存在），
// 而 components/ 是不入库的生成物，缺失时下方的 readdirSync 会直接 ENOENT 崩溃
if (!fs.existsSync(path.join(source, "components"))) {
  console.error(`知识库尚未生成：${source}/components，请先在仓库根运行 pnpm kb:bootstrap`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
// overrides 是人工源文件，不进快照；schema/components/index/report 全量拷贝
fs.cpSync(source, target, {
  recursive: true,
  filter: (src) => !src.includes(`${path.sep}overrides`),
});

// 仓库内的 demo 示例只存 path 不存 code（避免改 demo 就重写整份知识库 JSON），
// 发布出去的包读不到仓库源码，因此快照时按 path 把源码灌进 code，保证 npx 场景可离线取到完整示例
const componentsDir = path.join(target, "components");
let inlined = 0;
const missing: string[] = [];

for (const file of fs.readdirSync(componentsDir)) {
  if (!file.endsWith(".json")) continue;
  const abs = path.join(componentsDir, file);
  const data = JSON.parse(fs.readFileSync(abs, "utf8"));
  let changed = false;

  for (const example of data.examples ?? []) {
    if (example.code || !example.path) continue;
    const src = path.join(repoRoot, example.path);
    if (!fs.existsSync(src)) {
      missing.push(example.path);
      continue;
    }
    example.code = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");
    inlined++;
    changed = true;
  }

  // 注意：只改 examples[].code，不重算 _meta.contentHash
  // contentHash 是仓库内产物与源码的一致性凭据，快照是它的派生物，不参与 kb:check
  if (changed) fs.writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

if (missing.length > 0) {
  console.error(`以下示例文件不存在，快照缺少源码：\n  ${missing.join("\n  ")}`);
  process.exit(1);
}

const count = fs.readdirSync(componentsDir).length;
console.log(`知识库快照完成：${count} 个组件、内联 ${inlined} 份示例源码 → ${target}`);
