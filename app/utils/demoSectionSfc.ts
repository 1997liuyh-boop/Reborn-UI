/**
 * 把 DemoSection 的模板片段补全为可独立运行的 SFC
 *
 * 卡片里展示的分组代码只是模板片段（见 extractDemoSections），直接丢进
 * Playground 会因为缺少 <script setup> 里的响应式状态而报错。这里按
 * 「模板引用了哪些标识符」从 demo 源文件的 <script setup> 中抽取对应的
 * 顶层声明（含传递依赖）与 import 语句，拼出完整的
 * <script setup> + <template> 结构。
 *
 * 解析是基于行与括号深度的轻量扫描，不是完整的 TS 解析器；
 * 依赖 demo 文件遵循演示代码规范（顶层声明、无奇技淫巧）。
 */

import type {DemoSectionSourceMap} from "./extractDemoSections";
import {  extractDemoSections } from "./extractDemoSections";

/** 脚本顶层块：一条 import 或一组声明 */
interface ScriptBlock {
    /** 该块向外暴露的绑定名 */
    names: string[];
    /** 原始文本 */
    text: string;
    kind: "import" | "decl";
}

/** 声明块的起始判定：const/let/var/function（含 async） */
const DECL_START = /^(?:export\s+)?(?:const|let|var|(?:async\s+)?function)\s+/;

/** 需要整块跳过的顶层语句（类型声明与编译期宏不属于运行代码） */
const SKIP_START = /^(?:export\s+)?(?:interface|type)\s|^(?:defineOptions|defineProps|defineEmits|defineExpose)\s*\(/;

/** 从声明头部取出绑定名（普通声明 + 对象/数组解构） */
function collectDeclNames(head: string): string[] {
    const names = new Set<string>();
    const single = head.match(/^(?:export\s+)?(?:const|let|var|(?:async\s+)?function)\s+([A-Za-z_$][\w$]*)/);
    if (single?.[1]) names.add(single[1]);

    const destructure = head.match(/^(?:export\s+)?(?:const|let|var)\s*(\{[^}]*\}|\[[^\]]*\])\s*=/);
    if (destructure?.[1]) {
        for (const id of destructure[1].matchAll(/(?:^|[,{[\s])(?:[\w$]+\s*:\s*)?([A-Z_$][\w$]*)/gi)) {
            names.add(id[1]!);
        }
    }
    return [...names];
}

/** 从 import 子句取出绑定名（默认导入 + 具名导入，剔除 type-only 项） */
function collectImportNames(text: string): string[] {
    if (/^import\s+type\b/.test(text.trim())) return [];
    const names = new Set<string>();

    // 用 split 取 import 与 from 之间的子句，规避易回溯的正则写法
    const clause = (text.split(/\bfrom\b/)[0] ?? "").replace(/^\s*import\s*/, "").trim();
    const defaultName = clause.match(/^([A-Z_$][\w$]*)/i)?.[1];
    if (defaultName) names.add(defaultName);

    const named = clause.match(/\{([\s\S]*?)\}/)?.[1] ?? "";
    for (const item of named.split(",")) {
        const spec = item.trim();
        if (!spec || spec.startsWith("type ")) continue;
        const name = spec.match(/(?:[\w$]+\s+as\s+)?([A-Za-z_$][\w$]*)\s*$/)?.[1];
        if (name) names.add(name);
    }
    return [...names];
}

/**
 * 统计一行代码带来的括号深度变化，跳过字符串、模板串与注释。
 * 返回 [深度增量, 是否处于未闭合模板串]。
 */
function scanLineDepth(line: string, inTemplate: boolean): [number, boolean] {
    let delta = 0;
    let template = inTemplate;
    let quote: string | null = null;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i]!;
        const prev = i > 0 ? line[i - 1] : "";

        if (template) {
            if (ch === "`" && prev !== "\\") template = false;
            continue;
        }
        if (quote) {
            if (ch === quote && prev !== "\\") quote = null;
            continue;
        }
        if (ch === "`") { template = true; continue; }
        if (ch === '"' || ch === "'") { quote = ch; continue; }
        if (ch === "/" && line[i + 1] === "/") break;
        if (ch === "(" || ch === "[" || ch === "{") delta++;
        else if (ch === ")" || ch === "]" || ch === "}") delta--;
    }
    return [delta, template];
}

/** 把 <script setup> 文本切成顶层块序列 */
function parseScriptBlocks(script: string): ScriptBlock[] {
    const blocks: ScriptBlock[] = [];
    const lines = script.replace(/\r\n/g, "\n").split("\n");

    let i = 0;
    while (i < lines.length) {
        const line = lines[i]!;
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
            i++;
            continue;
        }

        // import：单行为主，多行（跨行具名导入）累积到出现 from "..." 为止
        if (/^import\b/.test(trimmed)) {
            const collected: string[] = [line];
            while (
                !/from\s*['"][^'"]+['"]/.test(collected.join("\n"))
                && !/^import\s*['"]/.test(trimmed)
                && i + 1 < lines.length
            ) {
                i++;
                collected.push(lines[i]!);
            }
            const text = collected.join("\n");
            blocks.push({ names: collectImportNames(text), text, kind: "import" });
            i++;
            continue;
        }

        if (SKIP_START.test(trimmed) || !DECL_START.test(trimmed)) {
            // 跳过类型声明 / 宏 / 其他顶层语句：按深度吞掉整块
            let [depth, template] = scanLineDepth(line, false);
            while ((depth > 0 || template) && i + 1 < lines.length) {
                i++;
                const [d, t] = scanLineDepth(lines[i]!, template);
                depth += d;
                template = t;
            }
            i++;
            continue;
        }

        // 声明块：累积到括号深度归零（含模板串跨行）
        const start = i;
        let [depth, template] = scanLineDepth(line, false);
        while ((depth > 0 || template) && i + 1 < lines.length) {
            i++;
            const [d, t] = scanLineDepth(lines[i]!, template);
            depth += d;
            template = t;
        }
        const text = lines.slice(start, i + 1).join("\n");
        blocks.push({ names: collectDeclNames(text.trimStart()), text, kind: "decl" });
        i++;
    }
    return blocks;
}

/** 收集一段文本里出现的全部标识符（宽松匹配，多收无害——只是多带一条声明） */
function collectIdentifiers(text: string): Set<string> {
    const ids = new Set<string>();
    for (const m of text.matchAll(/[A-Z_$][\w$]*/gi)) ids.add(m[0]);
    return ids;
}

/**
 * 按模板片段的依赖，从 demo 脚本里抽取所需块并拼成完整 SFC。
 * 抽不到任何依赖时也会补 <template> 包裹，保证结果始终是合法 SFC。
 */
export function buildSectionSfc(sectionTemplate: string, demoScript: string): string {
    const blocks = parseScriptBlocks(demoScript);
    const wanted = collectIdentifiers(sectionTemplate);
    const included = new Set<ScriptBlock>();

    // 传递闭包：模板引用的块被纳入后，块内引用的其他顶层块也一并纳入
    let changed = true;
    while (changed) {
        changed = false;
        for (const block of blocks) {
            if (included.has(block)) continue;
            if (!block.names.some((n) => wanted.has(n))) continue;
            included.add(block);
            for (const id of collectIdentifiers(block.text)) wanted.add(id);
            changed = true;
        }
    }

    const imports = blocks.filter((b) => included.has(b) && b.kind === "import").map((b) => b.text);
    const decls = blocks.filter((b) => included.has(b) && b.kind === "decl").map((b) => b.text);

    const template = sectionTemplate
        .split("\n")
        .map((line) => (line.trim() ? `  ${line}` : line))
        .join("\n");

    const scriptBody = [imports.join("\n"), decls.join("\n\n")].filter(Boolean).join("\n\n");
    if (!scriptBody) return `<template>\n${template}\n</template>\n`;

    return `<script setup lang="ts">\n${scriptBody}\n</script>\n\n<template>\n${template}\n</template>\n`;
}

/**
 * 解析 demo 源文件，返回「分组标题 -> 可独立运行的完整 SFC」映射。
 * 与 extractDemoSections 同键，供「在 Playground 运行」使用。
 */
export function buildRunnableDemoSections(raw: string): DemoSectionSourceMap {
    const map: DemoSectionSourceMap = {};
    if (!raw) return map;

    const script = raw.match(/<script[^>]+setup[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? "";
    const sections = extractDemoSections(raw);
    for (const [title, template] of Object.entries(sections)) {
        map[title] = buildSectionSfc(template, script);
    }
    return map;
}
