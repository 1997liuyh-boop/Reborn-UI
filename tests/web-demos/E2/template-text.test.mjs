/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
/**
 * Vue 模板默认 whitespace: 'condense'：含文字的文本节点里，换行连同缩进会压成一个空格。
 * 批量重排曾把紧贴 <code> 的中文标点拆到独立行，渲染成「包含 route 、 routes 与 paths 。」，
 * 这些文字同时进入文档卡片与知识库示例。这里按编译器的规则还原渲染文本，拦住此类多余空格。
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { it } from "node:test";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { parse: parseTemplate } = require("@vue/compiler-dom");
const { parse } = require("@vue/compiler-sfc");

/** 本分片（Badge ~ Descriptions）的演示目录与两份日期演示共用的 _shared 目录 */
const examplesDir = "app/components/reborn/examples";
const directories = [
  "_shared",
  ...readdirSync(examplesDir).filter(name => name >= "reborn-badge" && name <= "reborn-descriptions"),
];

/** 在目录里递归查找 .vue 文件，测试只依赖仓库内的源码 */
function vueFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return vueFiles(full);
    return entry.name.endsWith(".vue") ? [full] : [];
  });
}

const files = directories.flatMap(name => vueFiles(path.join(examplesDir, name)));

/** 把模板 AST 串回「渲染后的文本 + 元素标记」，空白按编译器 condense 规则处理 */
function renderedText(source) {
  const { descriptor } = parse(source);
  if (!descriptor.template) return "";
  const out = [];
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.type === 2) out.push(node.content);
      else if (node.type === 5) out.push(`{{${node.content.loc.source.trim()}}}`);
      else if (node.type === 1) {
        out.push(`<${node.tag}>`);
        walk(node.children);
        out.push(`</${node.tag}>`);
      }
    }
  };
  walk(parseTemplate(descriptor.template.content, { whitespace: "condense" }).children);
  return out.join("");
}

const INLINE = "(?:code|span|strong|em|b|a|kbd)";
const rules = [
  ["行内元素或插值之后、中文标点之前多出空格", new RegExp(`(?:</${INLINE}>|\\}\\}) [，。、；：）！？」』…]`)],
  ["中文标点之后、行内元素或插值之前多出空格", new RegExp(`[，。、；：（！？「『] (?:<${INLINE}>|\\{\\{)`)],
  ["中文标点之后、中文文字之前多出空格", /[，。、；：）！？] [\p{Script=Han}（「]/u],
];

it("V9 演示模板里中文标点两侧不因换行多出空格", () => {
  assert.ok(files.length >= 40, `只找到 ${files.length} 个演示文件`);
  const problems = [];
  for (const file of files) {
    const text = renderedText(readFileSync(file, "utf8"));
    for (const [label, pattern] of rules) {
      const match = text.match(pattern);
      if (match) problems.push(`${file}：${label}「${text.slice(Math.max(0, match.index - 8), match.index + 12)}」`);
    }
  }
  assert.deepEqual(problems, []);
});
