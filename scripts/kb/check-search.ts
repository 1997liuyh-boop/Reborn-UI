import type { KnowledgeIndex } from "./schema.js";
/**
 * 选型检索与「改用」指向的守卫
 *
 * 1. 检索回归：按 UI 稿上会看到的说法（「标签」「红点」「胶囊」）检索，断言期望组件进入前几名。
 *    这些词正是 AI 最常把 Badge / Chip 误选成 Button 的来源；别名或打分一改坏，这里先红。
 * 2. 别名合法性：非空、去重、不与 id 重复；并且每条别名原样检索时本组件要进前 2 名——
 *    别名的意义就是让这个词找到它，被别的组件压下去的别名等于没写。允许第 2 名是因为
 *    成对的交叉别名是刻意的（Badge 写 chip、Chip 写 badge，搜 badge 时 reborn-badge 按 id 居首）。
 * 3. 单向「改用」：A 的 whenNotToUse 指向 B 而 B 不指回 A 时，AI 先落到 B 就没有任何提示再去看 A。
 *    存量太多，只做告警不拦截；新增成对关系时顺手补回指。
 */
import fs from "node:fs";
import path from "node:path";
import { searchComponents } from "../../packages/mcp/src/search.js";
import { KNOWLEDGE_DIR } from "./sources.js";

/** [查询词, 期望组件, 允许的名次上限（默认第 1）] */
const SEARCH_CASES: Array<[string, string, number?]> = [
  // 按钮家族：AI 最常误选 button 的两个方向
  ["标签", "reborn-badge"],
  ["状态标签", "reborn-badge"],
  ["tag", "reborn-badge"],
  ["pill", "reborn-badge"],
  ["胶囊", "reborn-badge"],
  ["可关闭", "reborn-badge"],
  ["角标", "reborn-chip"],
  ["红点", "reborn-chip"],
  ["小圆点", "reborn-chip"],
  ["未读", "reborn-chip"],
  ["badge", "reborn-chip", 2],
  ["chip", "reborn-badge", 2],
  ["按钮", "reborn-button"],
  ["分段", "reborn-segmented"],
  // 其余易混组
  ["下拉菜单", "reborn-dropdown"],
  ["下拉选择", "reborn-select"],
  ["通知", "reborn-notification"],
  ["消息提示", "reborn-toast"],
  ["弹窗", "reborn-dialog"],
  ["抽屉", "reborn-drawer"],
  ["时间线", "reborn-timeline"],
  ["步骤条", "reborn-steps"],
  ["进度条", "reborn-progress"],
  ["加载", "reborn-loading"],
  ["输入框", "reborn-input"],
  ["多行输入", "reborn-textarea"],
  ["上传", "reborn-upload"],
  ["轮播", "reborn-carousel"],
  ["搜索框", "reborn-search-box"],
  ["空状态", "reborn-empty"],
  ["面包屑", "reborn-breadcrumb"],
  ["开关", "reborn-switch"],
  ["单选", "reborn-radio"],
  ["多选", "reborn-checkbox"],
  ["滑块", "reborn-slider"],
  ["评分", "reborn-rate"],
  ["表格", "reborn-table"],
  ["头像", "reborn-avatar"],
  ["悬浮按钮", "reborn-fab"],
  ["返回顶部", "reborn-back-top"],
];

function loadIndex(): KnowledgeIndex["components"] {
  const index = JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, "index.json"), "utf8"));
  return index.components ?? [];
}

function loadOverrides(): Map<string, Record<string, any>> {
  const dir = path.join(KNOWLEDGE_DIR, "overrides");
  const result = new Map<string, Record<string, any>>();
  if (!fs.existsSync(dir)) return result;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try {
      result.set(f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    } catch {
      // JSON 损坏由 check.ts 的 schema 校验报，这里跳过
    }
  }
  return result;
}

/** 检索回归 + 别名合法性，返回失败项 */
export function checkSearch(): string[] {
  const problems: string[] = [];
  const entries = loadIndex();

  for (const [query, expected, within = 1] of SEARCH_CASES) {
    const hits = searchComponents(entries, query);
    const rank = hits.findIndex((h) => h.id === expected) + 1;
    if (rank === 0 || rank > within) {
      const top = hits.slice(0, 3).map((h) => `${h.id}(${h.score})`).join(" > ") || "无结果";
      problems.push(`检索回归：「${query}」期望 ${expected} 进前 ${within} 名，实际第 ${rank || "∞"} 名；前三：${top}`);
    }
  }

  for (const e of entries) {
    const aliases = e.aliases ?? [];
    const seen = new Set<string>();
    for (const alias of aliases) {
      const key = alias.trim().toLowerCase();
      if (!key) problems.push(`${e.id}: 别名不能为空`);
      else if (seen.has(key)) problems.push(`${e.id}: 别名重复「${alias}」`);
      else if (key === e.id) problems.push(`${e.id}: 别名「${alias}」与 id 相同，没有意义`);
      else {
        const rank = searchComponents(entries, alias).findIndex((h) => h.id === e.id) + 1;
        if (rank === 0 || rank > 2) {
          problems.push(`${e.id}: 别名「${alias}」原样检索时本组件只排第 ${rank || "∞"} 名，被别的组件压住了，请换词或调整打分`);
        }
      }
      seen.add(key);
    }
  }
  return problems;
}

/** 单向「改用」指向，返回告警文案（不计入失败） */
export function oneWayPointers(): string[] {
  const overrides = loadOverrides();
  const ids = new Set(overrides.keys());
  const targetsOf = new Map<string, Set<string>>();
  for (const [id, o] of overrides) {
    const text = (o.whenNotToUse ?? []).join(" ");
    const targets = new Set<string>();
    for (const m of text.matchAll(/[a-z][a-z0-9-]+/g)) if (ids.has(m[0]) && m[0] !== id) targets.add(m[0]);
    targetsOf.set(id, targets);
  }
  const warnings: string[] = [];
  for (const [a, targets] of targetsOf) {
    for (const b of targets) if (!targetsOf.get(b)?.has(a)) warnings.push(`${a} → ${b}（${b} 未指回 ${a}）`);
  }
  return warnings.sort();
}
