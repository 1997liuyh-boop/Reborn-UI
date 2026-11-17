import type { DesignLint, DesignPattern, DesignSignal, DesignTrait } from "./schema.js";
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

/** 配方表文件的四张表：名字规则、结构信号规则、稿面特征取值、模板用法规则 */
export interface DesignRules {
  patterns: DesignPattern[];
  signals: DesignSignal[];
  traits: DesignTrait[];
  lint: DesignLint[];
}

/** 读取并校验配方表里的名字规则；文件不存在时返回空数组（允许不带配方表的知识库） */
export function loadDesignPatterns(): DesignPattern[] {
  return loadDesignRules().patterns;
}

/** 读取并校验整份配方表；文件不存在时四张表都为空 */
export function loadDesignRules(): DesignRules {
  if (!fs.existsSync(DESIGN_PATTERNS_FILE)) return { patterns: [], signals: [], traits: [], lint: [] };
  const raw = JSON.parse(fs.readFileSync(DESIGN_PATTERNS_FILE, "utf8"));
  const parsed = designPatternsFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `knowledge/design-patterns.json 不符合 schema：${issue?.path.join(".")}: ${issue?.message}`,
    );
  }
  const { patterns, signals = [], traits = [], lint = [] } = parsed.data;
  // 各表内部 id 不能重复；特征表按组件一条、规则 id 在全表内唯一
  const unique = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) throw new Error(`knowledge/design-patterns.json ${label} id 重复：${id}`);
      seen.add(id);
    }
  };
  unique("规则", patterns.map((p) => p.id));
  unique("信号规则", signals.map((s) => s.id));
  unique("特征表组件", traits.map((t) => t.component));
  unique("特征规则", traits.flatMap((t) => (t.rules ?? []).map((r) => r.id)));
  unique("用法规则", lint.map((l) => l.id));
  return { patterns, signals, traits, lint };
}
