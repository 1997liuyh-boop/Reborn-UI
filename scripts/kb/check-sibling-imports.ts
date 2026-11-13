/**
 * 兄弟组件显式导入守卫
 *
 * 检查「Web 组件的模板里用到了本库其它组件，脚本里却没有显式 import」。
 *
 * 为什么这件事值得单独设一道守卫：本仓库的 nuxt.config 以 pathPrefix: false 全局注册组件，
 * 模板里直接写 <RebornPopover /> 就能解析，缺 import 在文档站里永远看不出来。
 * 但组件是经 CLI 逐文件复制到使用方项目的，对方的自动导入规则未必相同
 * （常见的 `components: [{ path: '~/components', pathPrefix: true }]` 会给名字加上目录前缀），
 * 标签随即解析失败：控制台报 Failed to resolve component，对应功能渲染不出来。
 *
 * 跨目录引用还有第二层后果：CLI 靠扫描 import 路径判断「关联组件」
 * （packages/cli/src/utils/dependencies.ts 的 COMPONENT_IMPORT_RE），
 * 没有 import 语句就识别不到依赖，`reborn-ui add` 会漏装被引用的组件目录。
 *
 * 这一项在 CI 与本地都有效：它只读组件源码，不涉及任何生成物。
 * 范围仅限 Web 端（app/components/reborn/ui）；UniApp 端由 easycom 按文件名解析，不在此列。
 */
import fs from "node:fs";
import path from "node:path";
import { parse as parseSfc } from "@vue/compiler-sfc";
import ts from "typescript";
import { REPO_ROOT, WEB_COMPONENTS_DIR } from "./sources.js";

export interface SiblingImportViolation {
  /** 违规文件，相对仓库根的 POSIX 路径 */
  file: string;
  /** 模板里用到却未导入的组件名（PascalCase，等于目标文件名） */
  component: string;
  /** 建议补上的相对导入路径 */
  importPath: string;
}

/** 递归列出目录下全部 .vue 文件（绝对路径，排序稳定） */
function listVueFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith(".vue")) out.push(abs);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out.sort((a, b) => a.localeCompare(b));
}

/**
 * 把模板标签名归一成 PascalCase 组件名。
 * <RebornPopover>、<reborn-popover>、<ripple> 三种写法在运行时都会解析到同一个组件，这里统一成文件名的形态。
 */
function componentNameOfTag(tag: string): string {
  return tag
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");
}

/**
 * 收集模板 AST 里被当作组件解析的标签；注释节点不是元素，天然被排除。
 * 「是不是组件」直接采用编译器的判定（tagType），不自己按大小写猜：
 * 原生 HTML/SVG 元素、<slot>、<template> 都不算，非原生的全小写标签（<ripple />）则算。
 */
function collectComponentTags(node: any, tags: Set<string>) {
  // type === 1 为元素节点（NodeTypes.ELEMENT），tagType === 1 为组件（ElementTypes.COMPONENT）
  if (node.type === 1 && node.tagType === 1 && typeof node.tag === "string") tags.add(node.tag);
  for (const child of node.children ?? []) collectComponentTags(child, tags);
}

/**
 * 收集脚本顶层能被模板当作组件解析的绑定名。
 * - <script setup>：值导入（默认 / 具名 / 命名空间）与顶层声明都会暴露给模板；
 *   `import type` 在编译后被擦除，不算数。
 * - 普通 <script>：只有 components 选项里局部注册过的名字才算数，
 *   单独一条 import 而不注册，模板依然解析不到。
 */
function collectScriptBindings(content: string, isSetup: boolean, bindings: Set<string>) {
  const ast = ts.createSourceFile("script.ts", content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  if (!isSetup) {
    const visit = (node: ts.Node) => {
      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(ast).replace(/['"]/g, "") === "components" &&
        ts.isObjectLiteralExpression(node.initializer)
      ) {
        for (const prop of node.initializer.properties) {
          if (prop.name) bindings.add(prop.name.getText(ast).replace(/['"]/g, ""));
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    return;
  }

  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      if (clause.name) bindings.add(clause.name.text);
      const named = clause.namedBindings;
      if (named && ts.isNamespaceImport(named)) bindings.add(named.name.text);
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          if (!element.isTypeOnly) bindings.add(element.name.text);
        }
      }
    } else if (ts.isVariableStatement(statement)) {
      // 顶层 const X = defineAsyncComponent(...) 之类的局部定义同样可被模板引用
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) bindings.add(declaration.name.text);
      }
    } else if ((ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) && statement.name) {
      bindings.add(statement.name.text);
    }
  }
}

/** 逐文件比对，返回全部违规条目（按文件、组件名排序） */
export function findSiblingImportViolations(componentsDir = WEB_COMPONENTS_DIR): SiblingImportViolation[] {
  const vueFiles = listVueFiles(componentsDir);
  // 组件名 → 文件。组件名取文件名，与 Nuxt 在 pathPrefix: false 下的注册名一致
  const library = new Map<string, string[]>();
  for (const abs of vueFiles) {
    const name = path.basename(abs, ".vue");
    library.set(name, [...(library.get(name) ?? []), abs]);
  }

  const violations: SiblingImportViolation[] = [];
  for (const abs of vueFiles) {
    const selfName = path.basename(abs, ".vue");
    const { descriptor } = parseSfc(fs.readFileSync(abs, "utf8"), { filename: abs });
    if (!descriptor.template?.ast) continue;

    const tags = new Set<string>();
    collectComponentTags(descriptor.template.ast, tags);

    const bindings = new Set<string>();
    const hasSetup = Boolean(descriptor.scriptSetup);
    if (descriptor.scriptSetup) collectScriptBindings(descriptor.scriptSetup.content, true, bindings);
    // 与 <script setup> 并存时，普通 <script> 的导入同样进入模板作用域
    if (descriptor.script) collectScriptBindings(descriptor.script.content, hasSetup, bindings);

    const used = new Set<string>();
    for (const tag of tags) used.add(componentNameOfTag(tag));

    for (const name of [...used].sort((a, b) => a.localeCompare(b))) {
      // 引用自身靠 SFC 的文件名推断完成递归，不需要也不应该 import 自己
      if (name === selfName) continue;
      const candidates = library.get(name);
      if (!candidates || bindings.has(name)) continue;

      // 同目录的候选优先，其余取第一个，保证提示稳定
      const target = candidates.find((c) => path.dirname(c) === path.dirname(abs)) ?? candidates[0]!;
      let importPath = path.relative(path.dirname(abs), target).split(path.sep).join("/");
      if (!importPath.startsWith(".")) importPath = `./${importPath}`;

      violations.push({
        file: path.relative(REPO_ROOT, abs).split(path.sep).join("/"),
        component: name,
        importPath,
      });
    }
  }
  return violations;
}

/** 把违规渲染成 check.ts 需要的问题描述 */
export function checkSiblingImports(): string[] {
  return findSiblingImportViolations().map(
    (v) =>
      `${v.file}: 模板使用了本库组件 <${v.component}> 但未显式导入，` +
      `请在 <script setup> 中补 import ${v.component} from "${v.importPath}"`,
  );
}
