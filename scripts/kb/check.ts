/**
 * 知识库一致性校验（CI 用）
 * 检查项：
 *   1. 磁盘上的组件 JSON 与内存中重新抽取的结果一致（contentHash 比对，防 drift）
 *   2. 每份 JSON 通过 zod schema 校验
 *   3. 组件集合与源码目录、index.json 三方一致
 *   4. overrides 不引用不存在的组件
 * 任何一项失败即退出码 1
 */
import fs from "node:fs";
import path from "node:path";
import { componentSchema } from "./schema.js";
import { buildComponent, contentHashOf } from "./merge.js";
import { KNOWLEDGE_DIR, listComponentIds } from "./sources.js";

function fail(messages: string[]): never {
  for (const m of messages) console.error(`✗ ${m}`);
  console.error(`\n共 ${messages.length} 个问题。请运行 pnpm kb:build 重新生成后提交。`);
  process.exit(1);
}

function main() {
  const problems: string[] = [];
  const componentsDir = path.join(KNOWLEDGE_DIR, "components");
  const sourceIds = listComponentIds();

  if (!fs.existsSync(componentsDir)) {
    fail(["knowledge/components 目录不存在，请先运行 pnpm kb:build"]);
  }

  const diskIds = fs
    .readdirSync(componentsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();

  // 3. 集合一致性
  for (const id of sourceIds) {
    if (!diskIds.includes(id)) problems.push(`源码存在但知识库缺失：${id}`);
  }
  for (const id of diskIds) {
    if (!sourceIds.includes(id)) problems.push(`知识库存在但源码已删除（孤儿）：${id}`);
  }

  // 1 + 2. 逐组件校验 schema 与 drift
  for (const id of diskIds) {
    if (!sourceIds.includes(id)) continue;
    const diskPath = path.join(componentsDir, `${id}.json`);
    let disk: any;
    try {
      disk = JSON.parse(fs.readFileSync(diskPath, "utf8"));
    } catch {
      problems.push(`${id}: JSON 解析失败`);
      continue;
    }

    const parsed = componentSchema.safeParse(disk);
    if (!parsed.success) {
      problems.push(`${id}: schema 校验失败（${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}）`);
      continue;
    }

    // 磁盘自身哈希完整性（防手改生成文件）
    const selfHash = contentHashOf(disk);
    if (selfHash !== disk._meta?.contentHash) {
      problems.push(`${id}: 文件疑似被手工修改（contentHash 不匹配），生成文件禁止手改，请改 overrides/`);
      continue;
    }

    // 与源码重新抽取结果比对（防源码改了没重新生成）
    const { component: fresh } = buildComponent(id);
    if (fresh._meta.contentHash !== disk._meta.contentHash) {
      problems.push(`${id}: 与源码不同步（drift），源码或文档已变更但知识库未重新生成`);
    }
  }

  // 4. overrides 引用检查
  const overridesDir = path.join(KNOWLEDGE_DIR, "overrides");
  if (fs.existsSync(overridesDir)) {
    for (const f of fs.readdirSync(overridesDir)) {
      if (!f.endsWith(".json")) continue;
      const id = f.replace(/\.json$/, "");
      if (!sourceIds.includes(id)) problems.push(`overrides/${f} 引用了不存在的组件`);
    }
  }

  // index.json 一致性
  const indexPath = path.join(KNOWLEDGE_DIR, "index.json");
  if (!fs.existsSync(indexPath)) {
    problems.push("knowledge/index.json 不存在");
  } else {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    const indexIds = (index.components ?? []).map((c: any) => c.id).sort();
    if (JSON.stringify(indexIds) !== JSON.stringify(diskIds.filter((id) => sourceIds.includes(id)))) {
      problems.push("index.json 与 components/ 目录不一致");
    }
  }

  if (problems.length > 0) fail(problems);
  console.log(`✓ 知识库校验通过（${diskIds.length} 个组件）`);
}

main();
