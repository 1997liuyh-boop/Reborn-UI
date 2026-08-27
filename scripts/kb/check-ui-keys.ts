/**
 * ui 键位漂移守卫
 *
 * 比对「组件源码里实际消费的 ui 键」与「文档『自定义样式（ui）』小节写出的键」。
 *
 * 为什么这件事值得单独设一道守卫：文档站的 AI 助手通过 MCP 的 get-page 读到的
 * 只有文档原文，源码它看不见。文档少写一个键，AI 就当这个键不存在，转而去套一层
 * <div> 手写工具类——用户实际遇到的正是这个。所以「文档没写出键位」等价于功能缺失。
 *
 * 这一项在 CI 与本地都有效：它比对的是源码与**入库的文档**，
 * 不涉及任何生成物，不受「knowledge/components 不入库」影响。
 */
import fs from "node:fs";
import path from "node:path";
import { extractDocUiKeys } from "./extract-docs.js";
import { extractUiKeys } from "./extract-ui-keys.js";
import { KNOWLEDGE_DIR, buildDocIndex, listComponentIds } from "./sources.js";

/** index.json 里标记 internal 的组件不对外出文档，无需校验 */
function internalIds(): Set<string> {
  const indexPath = path.join(KNOWLEDGE_DIR, "index.json");
  if (!fs.existsSync(indexPath)) return new Set();
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  return new Set(
    (index.components ?? []).filter((c: any) => c.internal).map((c: any) => c.id as string),
  );
}

export interface UiKeyDiff {
  id: string;
  docPath: string;
  /** 源码有、文档没写（AI 因此用不上这些键） */
  missing: { web: string[]; uniapp: string[] };
  /** 文档写了、源码没有（键名已改或拼错，AI 会照着写出无效代码） */
  extra: { web: string[]; uniapp: string[] };
  /** 文档整节缺失 */
  sectionMissing: boolean;
}

/**
 * 逐组件比对，返回有差异的条目。
 *
 * 文档端的单表（未包在平台 tab 里）视为对两端都生效：
 * 单端组件本就只该有一张表，不必强行套 tabs。
 */
export function diffUiKeys(): UiKeyDiff[] {
  const docs = buildDocIndex();
  const internal = internalIds();
  const diffs: UiKeyDiff[] = [];

  for (const id of listComponentIds()) {
    if (internal.has(id)) continue;
    const doc = docs.get(id);
    if (!doc) continue; // 没有文档页的组件不在本项职责内

    const src = {
      web: extractUiKeys(id, "web").keys.map((k) => k.key),
      uniapp: extractUiKeys(id, "uniapp").keys.map((k) => k.key),
    };
    if (src.web.length === 0 && src.uniapp.length === 0) continue;

    const docKeys = extractDocUiKeys(doc.absPath);
    // 未标平台的行（单表、或「平台」列写「通用」）对两端都生效，故取并集
    const docFor = (platform: "web" | "uniapp") => [
      ...new Set([...docKeys[platform], ...docKeys.shared]),
    ];

    const diff: UiKeyDiff = {
      id,
      docPath: doc.relPath,
      missing: { web: [], uniapp: [] },
      extra: { web: [], uniapp: [] },
      sectionMissing: !docKeys.present,
    };

    for (const platform of ["web", "uniapp"] as const) {
      if (src[platform].length === 0) continue;
      const written = docFor(platform);
      diff.missing[platform] = src[platform].filter((k) => !written.includes(k));
      diff.extra[platform] = written.filter((k) => !src[platform].includes(k));
    }

    // 双端组件若只写了单表，多余键的判定会因两端键位不同而互相误伤，
    // 此时只报缺失，不报多余（写全 tabs 后自然恢复精确比对）
    const dualPlatform = src.web.length > 0 && src.uniapp.length > 0;
    if (dualPlatform && docKeys.web.length === 0 && docKeys.uniapp.length === 0) {
      diff.extra.web = [];
      diff.extra.uniapp = [];
    }

    const hasDiff =
      diff.sectionMissing ||
      diff.missing.web.length > 0 ||
      diff.missing.uniapp.length > 0 ||
      diff.extra.web.length > 0 ||
      diff.extra.uniapp.length > 0;
    if (hasDiff) diffs.push(diff);
  }
  return diffs;
}

/** 把差异渲染成 check.ts 需要的问题描述 */
export function checkUiKeyDrift(): string[] {
  const problems: string[] = [];
  for (const d of diffUiKeys()) {
    if (d.sectionMissing) {
      const counts = [
        d.missing.web.length > 0 ? `web ${d.missing.web.length} 个键` : "",
        d.missing.uniapp.length > 0 ? `uniapp ${d.missing.uniapp.length} 个键` : "",
      ]
        .filter(Boolean)
        .join("、");
      problems.push(`${d.id}: ${d.docPath} 缺少「自定义样式（ui）」小节（${counts}未写出）`);
      continue;
    }
    for (const platform of ["web", "uniapp"] as const) {
      if (d.missing[platform].length > 0) {
        problems.push(
          `${d.id}: ${d.docPath} 的 ui 键位表缺少 ${platform} 端的 ${d.missing[platform].join("/")}`,
        );
      }
      if (d.extra[platform].length > 0) {
        problems.push(
          `${d.id}: ${d.docPath} 的 ui 键位表写了源码中不存在的 ${platform} 端键 ${d.extra[platform].join("/")}`,
        );
      }
    }
  }
  return problems;
}
