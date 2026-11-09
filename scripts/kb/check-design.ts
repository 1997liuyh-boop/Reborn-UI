import type { DesignNodeInput } from "../../packages/mcp/src/search.js";
/**
 * 设计稿配方表（knowledge/design-patterns.json）的守卫
 *
 * 1. 规则本身：schema、id 唯一、match 可编译、同一个字面匹配项不能被两条规则重复认领
 *    （先命中的规则会把后一条永远挡住，重复等于写了一条死规则）。
 * 2. 指向真实：component / with 必须是知识库里的组件；uses 里的 props / slots / events
 *    必须在该组件的知识条目里存在，ui 键必须在源码实际消费的键集里——recipe 只能描述
 *    源码里存在的能力，这是文档规范的硬规则在配方表上的延伸。
 * 3. 回归：用真实设计稿（mastergo-test 商品详情页与首页）导出的节点名跑 matchDesignNodes，
 *    断言落到期望的组件。这些名字正是 AI 曾把图廊做成一列按钮、把计数器拼成两个按钮的来源。
 */
import fs from "node:fs";
import path from "node:path";
import { compileMatcher,  matchDesignNodes } from "../../packages/mcp/src/search.js";
import { loadDesignPatterns } from "./design-patterns.js";
import { extractUiKeys, supportsUi } from "./extract-ui-keys.js";
import { KNOWLEDGE_DIR } from "./sources.js";

/** [节点, 期望组件 id；null 表示 ignore / custom, 期望状态] */
const DESIGN_CASES: Array<[DesignNodeInput, string | null, "pattern" | "ignore" | "custom" | "unmapped"]> = [
  // 商品详情页（MasterGo 3:026896）实际导出的节点名
  [{ name: "缩略图", variant: { "属性 1": "已选" }, group: "容器 129642" }, "reborn-carousel", "pattern"],
  [{ name: "缩略图", variant: { "属性 1": "未选" }, group: "容器 129642" }, "reborn-carousel", "pattern"],
  [{ name: "icon/44/箭头" }, null, "ignore"],
  [{ name: "image" }, "reborn-image", "pattern"],
  [{ name: "Tab 2" }, "reborn-tabs", "pattern"],
  [{ name: "Tab 3" }, "reborn-tabs", "pattern"],
  [{ name: "计数器", variant: { "属性 1": "不可用", 尺寸: "40" } }, "reborn-input-number", "pattern"],
  [{ name: "btn", variant: { 尺寸: "大-54", 颜色: "纯色", 状态: "正常" } }, "reborn-button", "pattern"],
  [{ name: "侧边栏", variant: { "属性 1": "正常" } }, "reborn-fab", "pattern"],
  [{ name: "顶部搜索栏" }, "reborn-search-box", "pattern"],
  [{ name: "分割线" }, null, "ignore"],
  [{ name: "页脚", variant: { "属性 1": "pc" } }, null, "custom"],
  [{ name: "規格" }, "reborn-sku", "pattern"],
  // 首页（3:28788）与常见命名
  [{ name: "banner布局" }, "reborn-carousel", "pattern"],
  [{ name: "签到" }, "reborn-button", "pattern"],
  [{ name: "加载更多" }, "reborn-button", "pattern"],
  [{ name: "优惠券" }, "reborn-coupon", "pattern"],
  [{ name: "站点选择" }, "reborn-dropdown", "pattern"],
  [{ name: "购物车角标" }, "reborn-chip", "pattern"],
  [{ name: "状态标签" }, "reborn-badge", "pattern"],
  [{ name: "主图" }, "reborn-carousel", "pattern"],
  [{ name: "商品图" }, "reborn-image", "pattern"],
  [{ name: "选项卡" }, "reborn-tabs", "pattern"],
  [{ name: "底部导航" }, "reborn-tabbar", "pattern"],
  [{ name: "分段" }, "reborn-segmented", "pattern"],
  [{ name: "跑马灯" }, "reborn-marquee", "pattern"],
  [{ name: "头像" }, "reborn-avatar", "pattern"],
  [{ name: "常见问题" }, "reborn-collapse", "pattern"],
  [{ name: "選擇器" }, "reborn-select", "pattern"],
  [{ name: "頂欄" }, "reborn-header", "pattern"],
  // 子节点兜底：自动命名的容器本身不是组件，靠里面的实例名；没有子节点就按稿面自写
  [{ name: "容器 129651", children: ["搜索", "icon/24/放大镜"] }, "reborn-search-box", "pattern"],
  [{ name: "容器 129642", children: ["缩略图", "缩略图", "缩略图"] }, "reborn-carousel", "pattern"],
  [{ name: "容器 129650" }, null, "custom"],
  [{ name: "圆形 971" }, null, "custom"],
  [{ name: "矩形 59092" }, null, "custom"],
  [{ name: "路径 123756" }, null, "custom"],
  // 按钮里的小图标仍是图标；区块名「顶部」沾到「返回顶部」不算候选
  [{ name: "签到小图标" }, null, "ignore"],
  [{ name: "顶部" }, null, "unmapped"],
];

/** 问答列表要同一区块里至少三条问句才算命中，两条不算 */
const FAQ_CASES: Array<[DesignNodeInput[], string | null]> = [
  [
    [
      { name: "如何下单？", group: "faq" },
      { name: "运费怎么算？", group: "faq" },
      { name: "可以退货吗？", group: "faq" },
    ],
    "reborn-collapse",
  ],
  [[{ name: "如何下单？", group: "q2" }, { name: "运费怎么算？", group: "q2" }], null],
];

function loadIndex(): { components: any[]; designPatterns?: any[] } {
  return JSON.parse(fs.readFileSync(path.join(KNOWLEDGE_DIR, "index.json"), "utf8"));
}

function loadComponent(id: string): any | null {
  const file = path.join(KNOWLEDGE_DIR, "components", `${id}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

/** 配方表守卫，返回失败项 */
export function checkDesignPatterns(): string[] {
  const problems: string[] = [];
  let patterns;
  try {
    patterns = loadDesignPatterns();
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  if (!patterns.length) return problems;

  const index = loadIndex();
  const indexed = Array.isArray(index.designPatterns) ? index.designPatterns : [];
  if (JSON.stringify(indexed) !== JSON.stringify(patterns)) {
    problems.push("index.json 里的 designPatterns 与 knowledge/design-patterns.json 不一致，请重新运行 pnpm kb:build");
  }

  // 1. 字面匹配项不能被两条规则重复认领
  const claimed = new Map<string, string>();
  for (const p of patterns) {
    for (const term of p.match) {
      try {
        compileMatcher(term);
      } catch (error) {
        problems.push(`design-patterns.json 规则 ${p.id} 的匹配项「${term}」不是合法正则：${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (term.startsWith("/")) continue;
      const key = term.trim().toLowerCase();
      const owner = claimed.get(key);
      if (owner && owner !== p.id) problems.push(`design-patterns.json 匹配项「${term}」同时出现在规则 ${owner} 与 ${p.id}，后者永远不会命中`);
      claimed.set(key, p.id);
    }
  }

  // 2. 指向真实
  for (const p of patterns) {
    for (const id of [p.component, ...(p.with ?? [])]) {
      if (id && !loadComponent(id)) problems.push(`design-patterns.json 规则 ${p.id} 指向不存在的组件：${id}`);
    }
    if (!p.component || !p.uses) continue;
    const component = loadComponent(p.component);
    if (!component) continue;
    const have = {
      props: new Set((component.props ?? []).map((x: any) => x.name)),
      slots: new Set((component.slots ?? []).map((x: any) => x.name)),
      events: new Set((component.events ?? []).map((x: any) => x.name)),
    };
    for (const kind of ["props", "slots", "events"] as const) {
      for (const name of p.uses[kind] ?? []) {
        if (!have[kind].has(name)) problems.push(`design-patterns.json 规则 ${p.id}：${p.component} 没有 ${kind} 成员「${name}」，recipe 不能描述源码里不存在的能力`);
      }
    }
    if (p.uses.ui?.length && supportsUi(p.component)) {
      // ui 键以源码实际消费的键集为准；抽不出键的组件（loading / table）跳过而不是误报
      const keys = new Set([
        ...extractUiKeys(p.component, "web").keys.map((k) => k.key),
        ...extractUiKeys(p.component, "uniapp").keys.map((k) => k.key),
      ]);
      if (keys.size) {
        for (const key of p.uses.ui) {
          if (!keys.has(key)) problems.push(`design-patterns.json 规则 ${p.id}：${p.component} 的 ui 没有键「${key}」（源码实际消费：${[...keys].sort().join("、")}）`);
        }
      }
    }
  }

  // 3. 回归
  const entries = index.components ?? [];
  const run = (nodes: DesignNodeInput[]) =>
    matchDesignNodes(patterns, entries, nodes, { getComponent: loadComponent });
  const all = run(DESIGN_CASES.map(([node]) => node));
  DESIGN_CASES.forEach(([node, expected, status], i) => {
    const got = all.matches[i];
    if (got.status !== status || got.component !== expected) {
      problems.push(`设计稿回归：「${node.name}」期望 ${status}${expected ? ` → ${expected}` : ""}，实际 ${got.status}${got.component ? ` → ${got.component}` : ""}${got.patternId ? `（规则 ${got.patternId}）` : ""}`);
    }
  });
  for (const [nodes, expected] of FAQ_CASES) {
    const got = run(nodes).matches[0];
    if ((got.component ?? null) !== expected || (expected && got.patternId !== "faq")) {
      problems.push(`设计稿回归：${nodes.length} 条问句期望 ${expected ?? "不命中问答列表"}，实际 ${got.status}${got.component ? ` → ${got.component}` : ""}（规则 ${got.patternId ?? "无"}）`);
    }
  }
  const gallery = run([
    { name: "缩略图", group: "g" },
    { name: "缩略图", group: "g" },
    { name: "image", group: "g" },
    { name: "icon/44/箭头", group: "g" },
  ]);
  if (!gallery.hints.some((h) => h.includes("图廊")) || !gallery.matches[2].note?.includes("reborn-carousel") || !gallery.matches[3].note?.includes("#prev")) {
    problems.push("设计稿回归：缩略图 + image + 箭头 同区块时应给出图廊整体提示，并把主图与箭头并入 reborn-carousel");
  }
  const tabs = run([{ name: "Tab 2" }]).matches[0];
  if (!tabs.subcomponents?.includes("RebornTabPane") || !tabs.imports?.some((line) => line.includes("pathPrefix"))) {
    problems.push("设计稿回归：reborn-tabs 应给出 RebornTabPane 子组件与显式 import 提示");
  }
  const uniapp = run([{ name: "轮播" }]);
  const uniappMatch = matchDesignNodes(patterns, entries, [{ name: "轮播" }], { platform: "uniapp", getComponent: loadComponent }).matches[0];
  if (uniapp.matches[0].component !== "reborn-carousel" || uniappMatch.component !== null || !uniappMatch.note?.includes("仅")) {
    problems.push("设计稿回归：轮播在 web 端应落到 reborn-carousel，在 uniapp 端应标为不可用");
  }
  return problems;
}
