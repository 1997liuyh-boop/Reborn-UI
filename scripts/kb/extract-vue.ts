import type { EventInfo, ExposeInfo, PropInfo, SlotInfo } from "./schema.js";
import path from "node:path";
import { parseSync } from "@oxc-parser/wasm";
import { parse as parseSfc } from "@vue/compiler-sfc";
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
    const program =
      typeof result.program === "string" ? JSON.parse(result.program) : result.program;
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

/** 工具类注释（lint 指令等）不作为成员描述 */
function isDirectiveComment(text: string): boolean {
  return /^(?:eslint-|@ts-|prettier-|oxlint-|v8 )/.test(text);
}

/** 取节点上方紧邻的注释（JSDoc 块或 // 行注释），与节点之间只允许空白 */
function leadingComment(parsed: ParsedScript, node: OxcNode): string {
  let best: ParsedScript["comments"][number] | null = null;
  for (const c of parsed.comments) {
    if (c.end <= node.start && (!best || c.end > best.end)) best = c;
  }
  if (!best) return "";
  if (!/^\s*$/.test(parsed.source.slice(best.end, node.start))) return "";
  const text = best.value
    .split("\n")
    .map((line) => line.replace(/^\s*\*+\s?/, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return isDirectiveComment(text) ? "" : text;
}

/** 成员描述：优先行尾注释，其次上方紧邻的 JSDoc/行注释 */
function memberComment(parsed: ParsedScript, node: OxcNode): string {
  return trailingComment(parsed, node) || leadingComment(parsed, node);
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
  /** TSInterfaceDeclaration 或 type 别名右侧的类型节点（字面量/联合/交叉/引用） */
  node: OxcNode;
  ctx: ParsedScript;
}

/** 运行时常量对象条目（如 export const popoverProps = { ... }） */
export interface ConstObjEntry {
  node: OxcNode; // ObjectExpression
  ctx: ParsedScript;
}

/** 名称解析上下文：类型定义 + 常量对象 + import 重命名别名 */
interface ResolveCtx {
  typeDecls: Map<string, TypeDeclEntry>;
  constObjs: Map<string, ConstObjEntry>;
  importAliases: Map<string, string>;
}

/** 收集顶层的 interface / type 别名定义，供 defineProps<X> 解析引用 */
function collectTypeDecls(parsed: ParsedScript): Map<string, TypeDeclEntry> {
  const map = new Map<string, TypeDeclEntry>();
  const register = (decl: any) => {
    if (!decl) return;
    if (decl.type === "TSInterfaceDeclaration" && decl.id?.name) {
      map.set(decl.id.name, { node: decl, ctx: parsed });
    }
    if (decl.type === "TSTypeAliasDeclaration" && decl.id?.name && decl.typeAnnotation) {
      map.set(decl.id.name, { node: decl.typeAnnotation, ctx: parsed });
    }
  };
  for (const stmt of parsed.program.body ?? []) {
    register(stmt);
    if (stmt.type === "ExportNamedDeclaration") register(stmt.declaration);
  }
  return map;
}

/** 剥掉 as const / satisfies 包装 */
function unwrapTsExpression(node: any): any {
  let cur = node;
  while (cur?.type === "TSAsExpression" || cur?.type === "TSSatisfiesExpression")
    cur = cur.expression;
  return cur;
}

/** 收集顶层 const X = { ... } 对象字面量（供 defineProps(propsObj) 标识符引用解析） */
function collectConstObjects(parsed: ParsedScript): Map<string, ConstObjEntry> {
  const map = new Map<string, ConstObjEntry>();
  for (const stmt of parsed.program.body ?? []) {
    const decl = stmt.type === "ExportNamedDeclaration" ? stmt.declaration : stmt;
    if (decl?.type !== "VariableDeclaration") continue;
    for (const d of decl.declarations ?? []) {
      const name = d.id?.name;
      const init = unwrapTsExpression(d.init);
      if (name && init?.type === "ObjectExpression") map.set(name, { node: init, ctx: parsed });
    }
  }
  return map;
}

/** 收集 import { X as Y } 的重命名映射（本地名 → 导出名），供跨文件类型引用解析 */
function collectImportAliases(parsed: ParsedScript): Map<string, string> {
  const map = new Map<string, string>();
  for (const stmt of parsed.program.body ?? []) {
    if (stmt.type !== "ImportDeclaration") continue;
    for (const spec of stmt.specifiers ?? []) {
      if (spec.type !== "ImportSpecifier") continue;
      const importedName = spec.imported?.name ?? spec.imported?.value;
      const localName = spec.local?.name;
      if (importedName && localName && importedName !== localName) map.set(localName, importedName);
    }
  }
  return map;
}

/** 收集一个 .ts 文件里的类型定义（用于组件目录下 types.ts / config.ts 的兜底解析） */
export function collectTypeDeclsFromTsFile(absPath: string): Map<string, TypeDeclEntry> {
  const parsed = parseTsFile(absPath);
  return parsed ? collectTypeDecls(parsed) : new Map();
}

/** 收集一个 .ts 文件里的顶层常量对象（用于 defineProps(propsObj) 跨文件解析） */
export function collectConstObjectsFromTsFile(absPath: string): Map<string, ConstObjEntry> {
  const parsed = parseTsFile(absPath);
  return parsed ? collectConstObjects(parsed) : new Map();
}

/** 读取并解析 .ts 文件，失败返回 null */
function parseTsFile(absPath: string): ParsedScript | null {
  try {
    return parseTs(readTextFile(absPath), path.basename(absPath));
  } catch {
    return null;
  }
}

/** 从 TSInterfaceBody / TSTypeLiteral 中取成员列表 */
function typeMembers(body: OxcNode | undefined): OxcNode[] {
  if (!body) return [];
  return (body.body ?? body.members ?? []) as OxcNode[];
}

/** 带上下文的类型成员（成员可能来自不同文件） */
interface MemberWithCtx {
  member: OxcNode;
  ctx: ParsedScript;
}

/**
 * 递归解析类型节点为成员列表：
 * - interface（含 extends 继承链）
 * - 类型字面量、联合/交叉类型（成员合并，先出现者优先）
 * - 类型引用（经 typeDecls 与 import 别名查找，seen 防循环）
 */
function resolveTypeMembers(
  node: OxcNode | undefined,
  ctx: ParsedScript,
  resolve: ResolveCtx,
  seen: Set<string> = new Set(),
): MemberWithCtx[] {
  if (!node) return [];
  if (node.type === "TSInterfaceDeclaration") {
    const own = typeMembers(node.body).map((m) => ({ member: m, ctx }));
    // extends 的基接口成员排在自身成员之后（去重时自身优先）
    for (const heritage of node.extends ?? []) {
      const baseName = heritage.expression?.name;
      if (baseName) own.push(...resolveTypeRefByName(baseName, resolve, seen));
    }
    return own;
  }
  if (node.type === "TSInterfaceBody" || node.type === "TSTypeLiteral") {
    return typeMembers(node).map((m) => ({ member: m, ctx }));
  }
  if (node.type === "TSUnionType" || node.type === "TSIntersectionType") {
    return (node.types ?? []).flatMap((t: OxcNode) => resolveTypeMembers(t, ctx, resolve, seen));
  }
  if (node.type === "TSTypeReference") {
    const refName = node.typeName?.name;
    return refName ? resolveTypeRefByName(refName, resolve, seen) : [];
  }
  return [];
}

/** 按名称（支持 import 重命名）查找类型定义并解析其成员 */
function resolveTypeRefByName(
  name: string,
  resolve: ResolveCtx,
  seen: Set<string>,
): MemberWithCtx[] {
  const targetName = resolve.typeDecls.has(name) ? name : (resolve.importAliases.get(name) ?? name);
  if (seen.has(targetName)) return [];
  seen.add(targetName);
  const entry = resolve.typeDecls.get(targetName);
  if (!entry) return [];
  return resolveTypeMembers(entry.node, entry.ctx, resolve, seen);
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
    description: memberComment(parsed, member),
  };
}

/** 取 defineXxx<T>() 调用的类型参数节点（oxc 的字段名做兼容处理） */
function callTypeArg(call: OxcNode): OxcNode | undefined {
  const params = call.typeArguments ?? call.typeParameters;
  return params?.params?.[0];
}

/** 解析 defineProps：接口引用式、内联字面量式、对象运行时式 */
function extractProps(parsed: ParsedScript, resolve: ResolveCtx, warnings: string[]): PropInfo[] {
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
        props.push(...propsFromDefineProps(parsed, inner, resolve, warnings));
        if (defaultsObj?.type === "ObjectExpression") {
          defaults = objectToTextMap(parsed, defaultsObj);
        }
        return true;
      }
    }

    if (calleeName === "defineProps") {
      found = true;
      props.push(...propsFromDefineProps(parsed, node, resolve, warnings));
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
  resolve: ResolveCtx,
  warnings: string[],
): PropInfo[] {
  const out: PropInfo[] = [];
  const typeArg = callTypeArg(call);

  if (typeArg) {
    // 类型式：defineProps<ButtonProps>() 或 defineProps<{ ... }>()；
    // 支持联合/交叉/extends 继承与跨文件引用，同名成员先出现者优先
    const members = resolveTypeMembers(typeArg, parsed, resolve);
    if (members.length === 0 && typeArg.type === "TSTypeReference") {
      warnings.push(`defineProps 引用的类型 ${typeArg.typeName?.name ?? "?"} 未在组件目录中找到`);
    }
    for (const { member, ctx } of members) {
      const prop = memberToProp(ctx, member);
      if (prop && !out.some((p) => p.name === prop.name)) out.push(prop);
    }
    return out;
  }

  // 运行时对象式：defineProps({ ... }) 或 defineProps(propsObj)（标识符引用跨文件解析）
  let objArg = call.arguments?.[0];
  let objCtx = parsed;
  if (objArg?.type === "Identifier") {
    const entry = resolve.constObjs.get(objArg.name);
    if (entry) {
      objArg = entry.node;
      objCtx = entry.ctx;
    } else {
      warnings.push(`defineProps 引用的常量 ${objArg.name} 未在组件目录中找到`);
    }
  }
  if (objArg?.type === "ObjectExpression") {
    for (const property of objArg.properties ?? []) {
      const name = property.key?.name ?? property.key?.value;
      if (!name) continue;
      let type = "unknown";
      let def: string | undefined;
      let required = false;
      const valueNode = unwrapTsExpression(property.value);
      if (valueNode?.type === "ObjectExpression") {
        for (const inner of valueNode.properties ?? []) {
          const k = inner.key?.name;
          if (k === "type") type = runtimePropType(objCtx, inner.value);
          if (k === "default") def = sliceNode(objCtx.source, unwrapTsExpression(inner.value));
          if (k === "required") required = sliceNode(objCtx.source, inner.value) === "true";
        }
      } else if (valueNode?.type === "Identifier") {
        type = (valueNode.name as string).toLowerCase();
      }
      out.push({
        name,
        type,
        default: def,
        required,
        description: memberComment(objCtx, property),
      });
    }
  }
  return out;
}

/** 运行时 prop 的 type 字段文本：String as PropType<X> 优先取 X */
function runtimePropType(parsed: ParsedScript, valueNode: any): string {
  if (valueNode?.type === "TSAsExpression") {
    const anno = valueNode.typeAnnotation;
    const typeArg = (anno?.typeArguments ?? anno?.typeParameters)?.params?.[0];
    if (anno?.type === "TSTypeReference" && anno.typeName?.name === "PropType" && typeArg) {
      return sliceNode(parsed.source, typeArg);
    }
    return sliceNode(parsed.source, valueNode.expression).toLowerCase();
  }
  return sliceNode(parsed.source, valueNode).toLowerCase();
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
function extractEmits(parsed: ParsedScript, resolve: ResolveCtx): EventInfo[] {
  const events: EventInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineEmits") return;

    const arrArg = node.arguments?.[0];
    if (arrArg?.type === "ArrayExpression") {
      for (const el of arrArg.elements ?? []) {
        if (el?.value !== undefined) {
          events.push({ name: String(el.value), description: memberComment(parsed, el) });
        }
      }
      return true;
    }

    const typeArg = callTypeArg(node);
    if (typeArg) {
      for (const { member, ctx } of resolveTypeMembers(typeArg, parsed, resolve)) {
        // 形如 (e: 'change', value: string): void 的调用签名
        if (member.type === "TSCallSignatureDeclaration") {
          const first = member.params?.[0] ?? member.parameters?.[0];
          const literal = first?.typeAnnotation?.typeAnnotation;
          if (literal?.type === "TSLiteralType" && literal.literal?.value !== undefined) {
            events.push({
              name: String(literal.literal.value),
              payload: sliceNode(ctx.source, member),
              description: memberComment(ctx, member),
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
              description: memberComment(ctx, member),
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
function extractSlots(parsed: ParsedScript, resolve: ResolveCtx): SlotInfo[] {
  const slots: SlotInfo[] = [];
  walk(parsed.program, (node) => {
    if (node.type !== "CallExpression" || node.callee?.name !== "defineSlots") return;
    const typeArg = callTypeArg(node);
    for (const { member, ctx } of resolveTypeMembers(typeArg, parsed, resolve)) {
      const name = member.key?.name ?? member.key?.value;
      if (!name) continue;
      slots.push({
        name,
        props: sliceNode(ctx.source, member.typeAnnotation?.typeAnnotation),
        description: memberComment(ctx, member),
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
        if (name) exposes.push({ name, description: memberComment(parsed, property) });
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
    const name =
      firstArg?.type === "StringLiteral" || firstArg?.type === "Literal"
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
    // :name="..." 动态命名插槽（穿透/数据驱动）无法静态识别，整个跳过
    if (/(?:^|\s)(?::|v-bind:)name=/.test(attrs)) continue;
    const nameMatch = attrs.match(/(?:^|\s)name="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : "default";
    if (name.startsWith(":") || seen.has(name)) continue; // 跳过动态插槽名与重复项
    seen.add(name);
    slots.push({ name, description: "" });
  }
  return slots;
}

/**
 * 从 useSlots() 的属性访问中识别编程式消费的插槽
 * （如 Carousel 经 slots.default 手动渲染，模板中无 <slot> 标签）
 */
function slotsFromUseSlots(script: string): SlotInfo[] {
  const slots: SlotInfo[] = [];
  const seen = new Set<string>();
  for (const decl of script.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*useSlots\(\)/g)) {
    const varName = decl[1];
    const accessRe = new RegExp(
      `\\b${varName}(?:\\.|\\?\\.)([a-zA-Z_$][\\w$]*)|\\b${varName}\\[["']([^"']+)["']\\]`,
      "g",
    );
    for (const m of script.matchAll(accessRe)) {
      const name = m[1] ?? m[2];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      slots.push({ name, description: "" });
    }
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

/** 抽取单个 .vue 文件的 API 信息；externalTypes / externalConsts 为同目录 .ts 文件里收集到的类型与常量对象 */
export function extractVueFile(
  absPath: string,
  externalTypes?: Map<string, TypeDeclEntry>,
  externalConsts?: Map<string, ConstObjEntry>,
): VueExtractResult {
  const warnings: string[] = [];
  const empty: VueExtractResult = {
    props: [],
    events: [],
    slots: [],
    exposes: [],
    status: "failed",
    warnings,
  };

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

  const parsed = parseTs(scriptContent, `${path.basename(absPath)}.ts`);
  if (!parsed) {
    warnings.push("oxc 解析 <script> 失败");
    return empty;
  }

  const typeDecls = collectTypeDecls(parsed);
  // 同目录 .ts 文件的类型作为兜底（如 types.ts / config.ts 里定义的 Props 接口）
  if (externalTypes) {
    for (const [name, entry] of externalTypes) {
      if (!typeDecls.has(name)) typeDecls.set(name, entry);
    }
  }
  const constObjs = collectConstObjects(parsed);
  if (externalConsts) {
    for (const [name, entry] of externalConsts) {
      if (!constObjs.has(name)) constObjs.set(name, entry);
    }
  }
  const resolve: ResolveCtx = { typeDecls, constObjs, importAliases: collectImportAliases(parsed) };
  const props = extractProps(parsed, resolve, warnings);
  const events = extractEmits(parsed, resolve);
  const slots = extractSlots(parsed, resolve);
  const exposes = extractExposes(parsed);
  const models = extractModels(parsed);

  // defineModel 的 prop / 事件并入（同名去重，defineModel 优先）
  for (const mp of models.props) {
    const idx = props.findIndex((p) => p.name === mp.name);
    if (idx >= 0)
      props[idx] = { ...props[idx], ...mp, description: props[idx].description || mp.description };
    else props.push(mp);
  }
  for (const me of models.events) {
    if (!events.some((e) => e.name === me.name)) events.push(me);
  }

  // 模板 <slot> 与 useSlots() 编程式访问兜底：补充 defineSlots 没有声明的插槽
  for (const ts of [...slotsFromTemplate(templateContent), ...slotsFromUseSlots(scriptContent)]) {
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
      if (init?.type === "TSAsExpression" || init?.type === "TSSatisfiesExpression")
        init = init.expression;
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
