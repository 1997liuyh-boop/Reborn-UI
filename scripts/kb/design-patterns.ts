import type { DesignPattern } from "./schema.js";
/**
 * 设计稿配方表的读取与基本校验（build 与 check 共用）
 *
 * 文件本身只做 schema 校验与 id 去重；组件是否存在、uses 成员是否真实存在
 * 需要知识库产物，由 check-design.ts 在 kb:check 里核对。
 */
import fs from "node:fs";
import path from "node:path";
import { designPatternsFileSchema } from "./schema.js";
import { KNOWLEDGE_DIR } from "./sources.js";

export const DESIGN_PATTERNS_FILE = path.join(KNOWLEDGE_DIR, "design-patterns.json");

/** 读取并校验配方表；文件不存在时返回空数组（允许不带配方表的知识库） */
export function loadDesignPatterns(): DesignPattern[] {
  if (!fs.existsSync(DESIGN_PATTERNS_FILE)) return [];
  const raw = JSON.parse(fs.readFileSync(DESIGN_PATTERNS_FILE, "utf8"));
  const parsed = designPatternsFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `knowledge/design-patterns.json 不符合 schema：${issue?.path.join(".")}: ${issue?.message}`,
    );
  }
  const seen = new Set<string>();
  for (const p of parsed.data.patterns) {
    if (seen.has(p.id)) throw new Error(`knowledge/design-patterns.json 规则 id 重复：${p.id}`);
    seen.add(p.id);
  }
  return parsed.data.patterns;
}
