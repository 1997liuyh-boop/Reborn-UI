import fs from "node:fs";
import path from "node:path";
import { parse as parseSfc } from "@vue/compiler-sfc";
import { parseSync } from "@oxc-parser/wasm";
import type { EventInfo, ExposeInfo, PropInfo, SlotInfo } from "./schema.js";
import { readTextFile } from "./sources.js";

/** 单个 .vue / config.ts 抽取结果 */
export interface VueExtractResult {
  props: PropInfo[];
  events: EventInfo[];
  slots: SlotInfo[];
  exposes: ExposeInfo[];
  /** 抽取状态：ok=完整；partial=有告警；failed=解析失败 */
  status: "ok" | "partial" | "failed";
  warnings: string[];
}

interface OxcNode {
  type: string;
  start: number;
  end: number;
  [key: string]: any;
}

interface ParsedScript {
  program: OxcNode;
  comments: { type: string; value: string; start: number; end: number }[];
  source: string;
}

/** 用 oxc 解析一段 TS 源码，返回 AST + 注释 + 源文本 */
function parseTs(source: string, filename: string): ParsedScript | null {
  try {
    const result = parseSync(source, { sourceFilename: filename }) as any;
    const program = typeof result.program === "string" ? JSON.parse(result.program) : result.program;
    return { program, comments: result.comments ?? [], source };
  } catch {
    return null;
  }
}

/** 截取节点对应的源码文本 */
function sliceNode(source: string, node: OxcNode | undefined | null): string {
  if (!node) return "";
  return source.slice(node.start, node.end);
}

/** 找到节点结尾所在行的行尾注释（如 `foo?: boolean // 说明`） */
function trailingComment(parsed: ParsedScript, node: OxcNode): string {
  const lineEnd = parsed.source.indexOf("\n", node.end);
  const searchEnd = lineEnd === -1 ? parsed.source.length : lineEnd;
  for (const c of parsed.comments) {
    if (c.type === "Line" && c.start >= node.end && c.end <= searchEnd + 1) {
      return c.value.trim();
    }
  }
  return "";
}

/** 深度遍历 AST，回调返回 true 时不再深入该节点 */
function walk(node: any, visit: (n: OxcNode) => boolean | void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (typeof node.type === "string") {
    if (visit(node as OxcNode)) return;
  }
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end") continue;
    walk(node[key], visit);
  }
}

/** 类型定义条目：AST 节点 + 它所属文件的解析上下文（切片源码/取注释都要用对文件） */
export interface TypeDeclEntry {
  body: OxcNode;
  ctx: ParsedScript;
}

/** 收集顶层的 interface / type 字面量定义，供 defineProps<X> 解析引用 */
function collectTypeDecls(parsed: ParsedScript): Map<string, TypeDeclEntry> {
  const map = new Map<string, TypeDeclEntry>();
  const register = (decl: any) => {
    if (!decl) return;
    if (decl.type === "TSInterfaceDeclaration" && decl.id?.name) {
      map.set(decl.id.name, { body: decl.body, ctx: parsed }); // TSInterfaceBody
    }
    if (decl.type === "TSTypeAliasDeclaration" && decl.id?.name && decl.typeAnnotation?.type === "TSTypeLiteral") {
      map.set(decl.id.name, { body: decl.typeAnnotation, ctx: parsed });
    }
  };
  for (const stmt of parsed.program.body ?? []) {
    register(stmt);
    if (stmt.type === "ExportNamedDeclaration") register(stmt.declaration);
  }
  return map;
}

/** 收集一个 .ts 文件里的类型定义（用于组件目录下 types.ts 的兜底解析） */
export function collectTypeDeclsFromTsFile(absPath: string): Map<string, TypeDeclEntry> {
  try {
    const source = readTextFile(absPath);
    const parsed = parseTs(source, path.basename(absPath));
    if (!parsed) return new Map();
    return collectTypeDecls(parsed);
  } catch {
    return new Map();
  }
}

/** 从 TSInterfaceBody / TSTypeLiteral 中取成员列表 */
function typeMembers(body: OxcNode | undefined): OxcNode[] {
  if (!body) return [];
  return (body.body ?? body.members ?? []) as OxcNode[];
}

/** 解析类型成员（TSPropertySignature）为 PropInfo */
function memberToProp(parsed: ParsedScript, member: OxcNode): PropInfo | null {
  if (member.type !== "TSPropertySignature") return null;
  const name = member.key?.name ?? member.key?.value;
  if (!name) return null;
  const typeNode = member.typeAnnotation?.typeAnnotation;
  return {
    name,
    type: sliceNode(parsed.source, typeNode) || "unknown",
    required: !member.optional,
    description: trailingComment(parsed, member),
  };
}

/** 取 defineXxx<T>() 调用的类型参数节点（oxc 的字段名做兼容处理） */
function callTypeArg(call: OxcNode): OxcNode | undefined {
  const params = call.typeArguments ?? call.typeParameters;
  return params?.params?.[0];
}

/** 解析 defineProps：接口引用式、内联字面量式、对象运行时式 */
function extractProps(parsed: ParsedScript, typeDecls: Map<string, TypeDeclEntry>, warnings: string[]): PropInfo[] {
  const props: PropInfo[] = [];
  let defaults: Map<string, string> | null = null;
  let found = false;

  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression") return;
    const calleeName = node.callee?.name;

    // withDefaults(defineProps<X>(), { ... })
    if (calleeName === "withDefaults") {
      const inner = node.arguments?.[0];
      const defaultsObj = node.arguments?.[1];
      if (inner?.type === "CallExpression" && inner.callee?.name === "defineProps") {
        found = true;
        props.push(...propsFromDefineProps(parsed, inner, typeDecls, warnings));
        if (defaultsObj?.type === "ObjectExpression") {
          defaults = objectToTextMap(parsed, defaultsObj);
        }
        return true;
      }
    }

    if (calleeName === "defineProps") {
      found = true;
      props.push(...propsFromDefineProps(parsed, node, typeDecls, warnings));
      return true;
    }
  });

  if (defaults) {
    for (const p of props) {
      const d = (defaults as Map<string, string>).get(p.name);
      if (d !== undefined) p.default = d;
    }
  }
  if (found && props.length === 0) {
    warnings.push("找到 defineProps 但未能解析出任何 prop");
  }
  return props;
}

/** 从单个 defineProps 调用解析 props */
function propsFromDefineProps(
  parsed: ParsedScript,
  call: OxcNode,
  typeDecls: Map<string, TypeDeclEntry>,
  warnings: string[],
): PropInfo[] {
  const out: PropInfo[] = [];
  const typeArg = callTypeArg(call);

  if (typeArg) {
    // 类型式：defineProps<ButtonProps>() 或 defineProps<{ ... }>()
    let body: OxcNode | undefined;
    let ctx = parsed; // 类型定义所在文件的上下文（外部 types.ts 时不同于当前文件）
    if (typeArg.type === "TSTypeReference") {
      const refName = typeArg.typeName?.name;
      const entry = refName ? typeDecls.get(refName) : undefined;
      if (entry) {
        body = entry.body;
        ctx = entry.ctx;
      } else {
        warnings.push(`defineProps 引用的类型 ${refName ?? "?"} 未在组件目录中找到`);
      }
    } else if (typeArg.type === "TSTypeLiteral") {
      body = typeArg;
    }
    for (const member of typeMembers(body)) {
      const prop = memberToProp(ctx, member);
      if (prop) out.push(prop);
    }
    return out;
  }

  // 运行时对象式：defineProps({ title: { type: String, default: '' } })
  const objArg = call.arguments?.[0];
  if (objArg?.type === "ObjectExpression") {
    for (const property of objArg.properties ?? []) {
      const name = property.key?.name ?? property.key?.value;
      if (!name) continue;
      let type = "unknown";
      let def: string | undefined;
      let required = false;
      if (property.value?.type === "ObjectExpression") {
        for (const inner of property.value.properties ?? []) {
          const k = inner.key?.name;
          if (k === "type") type = sliceNode(parsed.source, inner.value).toLowerCase();
          if (k === "default") def = sliceNode(parsed.source, inner.value);
          if (k === "required") required = sliceNode(parsed.source, inner.value) === "true";
        }
      } else if (property.value?.type === "Identifier") {
        type = (property.value.name as string).toLowerCase();
      }
      out.push({ name, type, default: def, required, description: trailingComment(parsed, property) });
    }
  }
  return out;
}

/** ObjectExpression → 属性名到值源码文本的映射 */
function objectToTextMap(parsed: ParsedScript, obj: OxcNode): Map<string, string> {
  const map = new Map<string, string>();
  for (const property of obj.properties ?? []) {
    const name = property.key?.name ?? property.key?.value;
    if (name) map.set(name, sliceNode(parsed.source, property.value));
  }
  return map;
}

/** 解析 defineEmits：数组字面量式与类型式 */
function extractEmits(parsed: ParsedScript, typeDecls: Map<string, TypeDeclEntry>): EventInfo[] {
  const events: EventInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineEmits") return;

    const arrArg = node.arguments?.[0];
    if (arrArg?.type === "ArrayExpression") {
      for (const el of arrArg.elements ?? []) {
        if (el?.value !== undefined) {
          events.push({ name: String(el.value), description: trailingComment(parsed, el) });
        }
      }
      return true;
    }

    const typeArg = callTypeArg(node);
    if (typeArg) {
      let body: OxcNode | undefined;
      let ctx = parsed;
      if (typeArg.type === "TSTypeLiteral") body = typeArg;
      if (typeArg.type === "TSTypeReference") {
        const entry = typeDecls.get(typeArg.typeName?.name);
        if (entry) {
          body = entry.body;
          ctx = entry.ctx;
        }
      }
      for (const member of typeMembers(body)) {
        // 形如 (e: 'change', value: string): void 的调用签名
        if (member.type === "TSCallSignatureDeclaration") {
          const first = member.params?.[0] ?? member.parameters?.[0];
          const literal = first?.typeAnnotation?.typeAnnotation;
          if (literal?.type === "TSLiteralType" && literal.literal?.value !== undefined) {
            events.push({
              name: String(literal.literal.value),
              payload: sliceNode(ctx.source, member),
              description: trailingComment(ctx, member),
            });
          }
        }
        // 形如 change: [value: string] 的具名成员
        if (member.type === "TSPropertySignature") {
          const name = member.key?.name ?? member.key?.value;
          if (name) {
            events.push({
              name,
              payload: sliceNode(ctx.source, member.typeAnnotation?.typeAnnotation),
              description: trailingComment(ctx, member),
            });
          }
        }
      }
      return true;
    }
  });
  return events;
}

/** 解析 defineSlots<{ ... }>() */
function extractSlots(parsed: ParsedScript, typeDecls: Map<string, TypeDeclEntry>): SlotInfo[] {
  const slots: SlotInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineSlots") return;
    const typeArg = callTypeArg(node);
    let body: OxcNode | undefined;
    let ctx = parsed;
    if (typeArg?.type === "TSTypeLiteral") body = typeArg;
    if (typeArg?.type === "TSTypeReference") {
      const entry = typeDecls.get(typeArg.typeName?.name);
      if (entry) {
        body = entry.body;
        ctx = entry.ctx;
      }
    }
    for (const member of typeMembers(body)) {
      const name = member.key?.name ?? member.key?.value;
      if (!name) continue;
      slots.push({
        name,
        props: sliceNode(ctx.source, member.typeAnnotation?.typeAnnotation),
        description: trailingComment(ctx, member),
      });
    }
    return true;
  });
  return slots;
}

/** 解析 defineExpose({ ... }) */
function extractExposes(parsed: ParsedScript): ExposeInfo[] {
  const exposes: ExposeInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineExpose") return;
    const objArg = node.arguments?.[0];
    if (objArg?.type === "ObjectExpression") {
      for (const property of objArg.properties ?? []) {
        const name = property.key?.name ?? property.key?.value;
        if (name) exposes.push({ name, description: trailingComment(parsed, property) });
      }
    }
    return true;
  });
  return exposes;
}

/** 解析 defineModel：转成 vModel prop + update 事件 */
function extractModels(parsed: ParsedScript): { props: PropInfo[]; events: EventInfo[] } {
  const props: PropInfo[] = [];
  const events: EventInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineModel") return;
    const firstArg = node.arguments?.[0];
    const name = firstArg?.type === "StringLiteral" || firstArg?.type === "Literal"
      ? String(firstArg.value)
      : "modelValue";
    const typeArg = callTypeArg(node);
    props.push({
      name,
      type: typeArg ? sliceNode(parsed.source, typeArg) : "unknown",
      required: false,
      description: trailingComment(parsed, node) || "双向绑定值",
      vModel: true,
    });
    events.push({ name: `update:${name}`, description: `${name} 变化时触发（v-model 同步）` });
    return true;
  });
  return { props, events };
}

/** 从模板中抽取 <slot> 声明（defineSlots 之外的兜底来源） */
function slotsFromTemplate(template: string): SlotInfo[] {
  const slots: SlotInfo[] = [];
  const seen = new Set<string>();
  for (const m of template.matchAll(/<slot\b([^>]*)>/g)) {
    const attrs = m[1] ?? "";
    const nameMatch = attrs.match(/\bname="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : "default";
    if (name.startsWith(":") || seen.has(name)) continue; // 跳过动态插槽名与重复项
    seen.add(name);
    slots.push({ name, description: "" });
  }
  return slots;
}

/** SFC 解析失败时的降级方案：正则抠出全部 <script> 块内容 */
function fallbackScriptBlocks(source: string): string {
  const blocks: string[] = [];
  for (const m of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    blocks.push(m[1]);
  }
  return blocks.join("\n");
}

/** 抽取单个 .vue 文件的 API 信息；externalTypes 为同目录 .ts 文件里收集到的类型定义 */
export function extractVueFile(absPath: string, externalTypes?: Map<string, TypeDeclEntry>): VueExtractResult {
  const warnings: string[] = [];
  const empty: VueExtractResult = { props: [], events: [], slots: [], exposes: [], status: "failed", warnings };

  let source: string;
  try {
    source = readTextFile(absPath);
  } catch {
    warnings.push(`无法读取文件：${absPath}`);
    return empty;
  }

  const { descriptor, errors } = parseSfc(source, { filename: absPath });
  let scriptContent = "";
  let templateContent = descriptor?.template?.content ?? "";

  if (errors.length > 0) {
    // 例如同时存在两个同类 <script> 块：降级为正则抠块
    scriptContent = fallbackScriptBlocks(source);
    templateContent = source.match(/<template\b[^>]*>([\s\S]*)<\/template>/)?.[1] ?? "";
    if (!scriptContent.trim()) {
      warnings.push(`SFC 解析错误：${errors.map((e: any) => e.message ?? String(e)).join("; ")}`);
    }
  } else {
    // 双 <script> 块场景：普通 script 里通常只有 type-only import，与 setup 内容拼接解析
    scriptContent = [descriptor.script?.content ?? "", descriptor.scriptSetup?.content ?? ""]
      .filter(Boolean)
      .join("\n");
  }

  if (!scriptContent.trim()) {
    warnings.push("组件没有 <script> 内容");
    return { ...empty, slots: slotsFromTemplate(templateContent), status: "partial" };
  }

  const parsed = parseTs(scriptContent, path.basename(absPath) + ".ts");
  if (!parsed) {
    warnings.push("oxc 解析 <script> 失败");
    return empty;
  }

  const typeDecls = collectTypeDecls(parsed);
  // 同目录 .ts 文件的类型作为兜底（如 types.ts 里定义的 Props 接口）
  if (externalTypes) {
    for (const [name, entry] of externalTypes) {
      if (!typeDecls.has(name)) typeDecls.set(name, entry);
    }
  }
  const props = extractProps(parsed, typeDecls, warnings);
  const events = extractEmits(parsed, typeDecls);
  const slots = extractSlots(parsed, typeDecls);
  const exposes = extractExposes(parsed);
  const models = extractModels(parsed);

  // defineModel 的 prop / 事件并入（同名去重，defineModel 优先）
  for (const mp of models.props) {
    const idx = props.findIndex((p) => p.name === mp.name);
    if (idx >= 0) props[idx] = { ...props[idx], ...mp, description: props[idx].description || mp.description };
    else props.push(mp);
  }
  for (const me of models.events) {
    if (!events.some((e) => e.name === me.name)) events.push(me);
  }

  // 模板 <slot> 兜底：补充 defineSlots 没有声明的插槽
  for (const ts of slotsFromTemplate(templateContent)) {
    if (!slots.some((s) => s.name === ts.name)) slots.push(ts);
  }

  return {
    props,
    events,
    slots,
    exposes,
    status: warnings.length > 0 ? "partial" : "ok",
    warnings,
  };
}

/**
 * 抽取 config.ts 中导出的字符串常量数组（如 buttonColors / buttonSizes）
 * 返回 常量名 → 取值列表
 */
export function extractConfigConstants(absPath: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let source: string;
  try {
    source = readTextFile(absPath);
  } catch {
    return map;
  }
  const parsed = parseTs(source, path.basename(absPath));
  if (!parsed) return map;

  for (const stmt of parsed.program.body ?? []) {
    const decl = stmt.type === "ExportNamedDeclaration" ? stmt.declaration : stmt;
    if (decl?.type !== "VariableDeclaration") continue;
    for (const d of decl.declarations ?? []) {
      const name = d.id?.name;
      if (!name) continue;
      // 剥掉 as const 包装
      let init = d.init;
      if (init?.type === "TSAsExpression" || init?.type === "TSSatisfiesExpression") init = init.expression;
      if (init?.type !== "ArrayExpression") continue;
      const values: string[] = [];
      let allString = true;
      for (const el of init.elements ?? []) {
        if (el && typeof el.value === "string") values.push(el.value);
        else allString = false;
      }
      if (allString && values.length > 0) map.set(name, values);
    }
  }
  return map;
}

/**
 * 把 config 常量映射到 props 的 options 字段
 * 依据 prop 类型文本中的 `typeof xxx[number]` 引用
 */
export function applyConfigOptions(props: PropInfo[], constants: Map<string, string[]>) {
  for (const p of props) {
    const m = p.type.match(/typeof\s+(\w+)\[number\]/);
    if (m) {
      const values = constants.get(m[1]);
      if (values) {
        p.options = values;
        p.type = values.map((v) => `'${v}'`).join(" | ");
      }
    }
  }
}
