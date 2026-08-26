import type { ComponentReport } from "./merge.js";
import type { KnowledgeIndex } from "./schema.js";
/**
 * 知识库构建入口
 * 用法：
 *   pnpm kb:build              全量重建 knowledge/
 *   pnpm kb:build --only a,b   只构建指定组件（不清空目录、不重写 index）
 */
import fs from "node:fs";
import path from "node:path";
import { zodToJsonSchema } from "zod-to-json-schema";
import { buildComponent } from "./merge.js";
import { componentSchema } from "./schema.js";
import { KNOWLEDGE_DIR, listComponentIds } from "./sources.js";

function writeJson(absPath: string, data: unknown) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

/**
 * 写入带时间戳的聚合文件（index.json / report.json）
 * 除 generatedAt 外内容没变时保持原文件不动，避免每次构建都把这两个文件标记为已修改
 */
function writeJsonStable(absPath: string, data: Record<string, unknown>) {
  const withoutTime = (o: Record<string, unknown>) => {
    const { generatedAt: _generatedAt, ...rest } = o;
    return JSON.stringify(rest);
  };
  if (fs.existsSync(absPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(absPath, "utf8"));
      if (withoutTime(prev) === withoutTime(data)) return;
    } catch {
      // 旧文件损坏则直接覆盖
    }
  }
  writeJson(absPath, data);
}

function parseArgs() {
  const onlyIdx = process.argv.indexOf("--only");
  const only = onlyIdx >= 0 ? (process.argv[onlyIdx + 1] ?? "").split(",").filter(Boolean) : null;
  return { only };
}

async function main() {
  const { only } = parseArgs();
  const allIds = listComponentIds();
  const targetIds = only ? allIds.filter((id) => only.includes(id)) : allIds;

  if (only && targetIds.length !== only.length) {
    const missing = only.filter((id) => !allIds.includes(id));
    console.error(`以下组件不存在：${missing.join(", ")}`);
    process.exit(1);
  }

  const componentsDir = path.join(KNOWLEDGE_DIR, "components");
  const now = new Date().toISOString();

  // 全量构建时先清空，保证无孤儿
  if (!only) {
    fs.rmSync(componentsDir, { recursive: true, force: true });
  }

  // 生成 JSON Schema（供编辑器与 CI 校验）
  writeJson(
    path.join(KNOWLEDGE_DIR, "schema", "component.schema.json"),
    zodToJsonSchema(componentSchema, "RebornComponentKnowledge"),
  );

  const reports: ComponentReport[] = [];
  const indexEntries: KnowledgeIndex["components"] = [];
  const internalIds = new Set<string>();
  let failed = 0;

  for (const id of targetIds) {
    const { component, report } = buildComponent(id);

    // zod 校验，保证产物永远符合 schema
    const check = componentSchema.safeParse(component);
    if (!check.success) {
      failed++;
      console.error(
        `✗ ${id} 校验失败：${check.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
      continue;
    }

    writeJson(path.join(componentsDir, `${id}.json`), component);
    reports.push(report);
    if (component.internal) internalIds.add(component.id);
    indexEntries.push({
      id: component.id,
      title: component.title,
      description: component.description,
      category: component.category,
      tags: component.tags,
      platforms: component.platforms,
      ...(component.internal ? { internal: true } : {}),
    });
  }

  // 只有全量构建才重写 index 与报告
  if (!only) {
    const index: KnowledgeIndex = { schemaVersion: 1, generatedAt: now, components: indexEntries };
    writeJsonStable(path.join(KNOWLEDGE_DIR, "index.json"), index);

    // 覆盖率报告
    const okCount = reports.filter(
      (r) =>
        ["ok", "absent"].includes(r.extractors.web) &&
        ["ok", "absent"].includes(r.extractors.uniapp),
    ).length;
    // 内部基础组件不面向用户，不要求独立文档
    const noDocs = reports
      .filter((r) => r.extractors.docs === "missing" && !internalIds.has(r.id))
      .map((r) => r.id);
    const withDrifts = reports.filter((r) => r.drifts.length > 0);
    const withWarnings = reports.filter((r) => r.warnings.length > 0);

    writeJsonStable(path.join(KNOWLEDGE_DIR, "report.json"), {
      generatedAt: now,
      total: reports.length,
      extractCleanRate: `${((okCount / Math.max(reports.length, 1)) * 100).toFixed(1)}%`,
      missingDocs: noDocs,
      drifts: Object.fromEntries(withDrifts.map((r) => [r.id, r.drifts])),
      warnings: Object.fromEntries(withWarnings.map((r) => [r.id, r.warnings])),
    });

    console.log(
      `知识库已生成：${reports.length} 个组件，抽取干净率 ${((okCount / Math.max(reports.length, 1)) * 100).toFixed(1)}%`,
    );
    console.log(
      `  无文档组件：${noDocs.length} 个；有文档偏差：${withDrifts.length} 个；有告警：${withWarnings.length} 个`,
    );
    console.log(`  详情见 knowledge/report.json`);
  } else {
    console.log(`已重建 ${reports.length} 个组件：${targetIds.join(", ")}`);
  }

  if (failed > 0) {
    console.error(`${failed} 个组件校验失败`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
