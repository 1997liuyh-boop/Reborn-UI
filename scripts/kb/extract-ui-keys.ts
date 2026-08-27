/**
 * ui 键位抽取
 *
 * 组件的 `ui` prop 用于细粒度覆盖内部各节点的类名，可用键位是文档里最容易漏写的一块，
 * 而文档站的 AI 助手只能读到文档原文（MCP 的 get-page 直接返回 markdown），
 * 文档没写就等于这个能力不存在——它只能退回「套一层 div + 手写工具类」。
 *
 * 单一事实来源是**源码里对 props.ui 的实际消费点**，而不是 props 接口里声明的类型：
 * 声明可能滞后，消费点不会。三种消费写法都要覆盖，见 collectKeys 内的注释。
 */
import fs from "node:fs";
import path from "node:path";
import { componentSourceDirs, readTextFile } from "./sources.js";

export interface UiKeyInfo {
  key: string;
  /**
   * 该键对应的元素是否长在插槽兜底里。
   * 为真时填充同名插槽会把这个节点整个替换掉，ui 覆盖随之静默失效——
   * 文档需要就这一条给出明确警示。
   */
  slotFallback: boolean;
}

/** 单个组件（单个 .vue）自己的 ui 键集 */
export interface UiComponentKeys {
  /** 组件名，即文件名去掉 .vue，如 RebornLayoutHeader */
  component: string;
  keys: UiKeyInfo[];
}

export interface UiKeysResult {
  /**
   * 按「声明 ui prop 的组件」分组。
   * 一个目录可能导出多个各带独立 ui 的组件（如 reborn-layout 的 5 个子组件、
   * reborn-color-picker 的触发器与面板），混成一张表会让使用方传错键。
   */
  components: UiComponentKeys[];
  /** 全部键的并集，供漂移守卫做「文档是否写全」的比对 */
  keys: UiKeyInfo[];
  /** 声明类型与实际消费点不一致等值得暴露的问题 */
  warnings: string[];
}

/**
 * 内部组件白名单：这些 .vue 虽然消费 props.ui，但没有任何对外入口能把 ui 传进去，
 * 键位写进文档只会误导使用方，故不参与抽取。
 *
 * - RebornLoadingMask：v-loading 指令与 useLoading 共用的遮罩层，由 createLoading
 *   内部渲染，useLoading 的选项里并没有 ui 透传（app/composables/useLoading.ts）。
 *   若将来补上透传，把这里删掉即可，守卫会立刻要求文档补齐这 4 个键。
 */
const INTERNAL_COMPONENTS = new Set(["RebornLoadingMask"]);

/** 转义正则元字符，别名里只可能出现 $ */
function escapeForRegExp(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface VueFile {
  /** 组件名（文件名去掉 .vue） */
  name: string;
  src: string;
}

/** 读取组件目录下全部 .vue 源码 */
function readVueFiles(dir: string): VueFile[] {
  const out: VueFile[] = [];
  const walk = (current: string) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.name.endsWith(".vue")) {
        out.push({ name: entry.name.replace(/\.vue$/, ""), src: readTextFile(abs) });
      }
    }
  };
  walk(dir);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 解析 tv 配置里 slots 对象的一级键名。
 * 供「动态下标」写法兜底：那种写法源码里没有字面量键名，键集等于 tv 的全部 slots。
 */
function configSlotKeys(dir: string, id: string): string[] {
  const configPath = path.join(dir, `${id}.config.ts`);
  if (!fs.existsSync(configPath)) return [];
  const src = readTextFile(configPath);

  const start = src.search(/\bslots\s*:\s*\{/);
  if (start < 0) return [];
  const open = src.indexOf("{", start);

  // 逐字符走到配对的右花括号，只收集深度为 1 的键名
  const keys: string[] = [];
  let depth = 0;
  let segment = "";
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") {
      depth++;
      if (depth === 1) continue;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
    if (depth === 1) segment += ch;
  }

  // 键名前普遍有 /** 说明 */，先剥掉块注释，否则「逗号与键名之间夹注释」的键会漏收
  const clean = segment.replace(/\/\*[\s\S]*?\*\//g, "");

  // 深度 1 的片段里，形如 `key:` 的即为槽位名（值是字符串，不会再引入同形文本）
  for (const m of clean.matchAll(/(?:^|[,{])\s*([A-Za-z0-9_$]+)\s*:/gm)) {
    if (!keys.includes(m[1])) keys.push(m[1]);
  }
  return keys;
}

/** 解析 props 接口里声明的 `ui?: Partial<{ ... }>` 键名，作为交叉校验 */
function declaredKeys(src: string): string[] {
  const m = src.match(/\bui\s*\??\s*:\s*Partial<\s*\{([\s\S]*?)\}\s*>/);
  if (!m) return [];
  const keys: string[] = [];
  for (const line of m[1].split("\n")) {
    const k = line.match(/^\s*([A-Za-z0-9_$]+)\s*[?:]/);
    if (k && !keys.includes(k[1])) keys.push(k[1]);
  }
  return keys;
}

/** 从源码收集实际被消费的 ui 键名 */
function collectKeys(src: string, dir: string, id: string) {
  const keys = new Set<string>();
  const warnings: string[] = [];

  // props.ui 的本地别名：uiOverrides 是最常见的写法，另有
  //   const overrides = props.ui || {}
  //   const o = computed(() => props.ui ?? {})
  //   const ov: any = props.ui ?? {}
  const aliases = new Set<string>(["uiOverrides"]);
  for (const m of src.matchAll(
    /(?:const|let)\s+([A-Za-z0-9_$]+)\s*(?::[^=\n]+)?=\s*(?:computed\(\s*\(\s*\)\s*=>\s*)?props\.ui\b/g,
  )) {
    aliases.add(m[1]);
  }

  // 写法一：直接读 props.ui 的属性
  for (const m of src.matchAll(/props\.ui\s*\??\.\s*([A-Za-z0-9_$]+)/g)) keys.add(m[1]);

  // 写法一变体：先把 props 合并成 computed 再读，如 RebornCoupon 的
  //   activeProps.value.ui?.root
  // 这里必须限定 `.value.ui`（而非泛化的 `.ui`），否则会撞上 tabs 子组件的
  // `context.ui.value.content(...)`——那个 `ui` 是 tv 结果，会把 value 误当键名。
  for (const m of src.matchAll(/\.value\.ui\s*\??\.\s*([A-Za-z0-9_$]+)/g)) keys.add(m[1]);

  // 写法二：读别名的属性。别名若是 computed/ref，脚本里写 `别名.value.键`，
  // 而模板里靠自动解包直接写 `别名.键`（如 TabsRoot.vue 的 uiOverrides.root），
  // 多文件复合组件两种形态会同时出现，故两趟都要跑。
  //
  // 唯一的坑是「键名叫 value」：`.value` 若写成可选量词，单独出现的 `别名.value`
  // 会回溯成键名 value。这里让第一趟专门吃 `别名.value.键`（slider/rate 确有 value
  // 槽位，靠它抽到），第二趟则固定跳过 value——那必然是在读 ref 本身。
  let dynamicIndex = false;
  for (const alias of aliases) {
    const name = escapeForRegExp(alias);
    for (const m of src.matchAll(
      new RegExp(`\\b${name}\\.value\\s*\\??\\.\\s*([A-Za-z0-9_$]+)`, "g"),
    )) {
      keys.add(m[1]);
    }
    for (const m of src.matchAll(new RegExp(`\\b${name}\\s*\\??\\.\\s*([A-Za-z0-9_$]+)`, "g"))) {
      if (m[1] !== "value") keys.add(m[1]);
    }
    // 写法三：动态下标 ov[key]，源码里没有字面量键名
    if (new RegExp(`\\b${name}(?:\\.value)?\\s*\\[`).test(src)) dynamicIndex = true;
  }

  if (dynamicIndex) {
    // 动态下标能覆盖 tv 的全部槽位，键集取配置里的 slots
    for (const k of configSlotKeys(dir, id)) keys.add(k);
  }

  const declared = declaredKeys(src);
  if (keys.size === 0 && declared.length > 0) {
    // 消费点没抽到（罕见写法），退回声明类型，同时提醒人工确认
    for (const k of declared) keys.add(k);
    warnings.push(`${id}: 未能从消费点抽取 ui 键位，已退回 props 接口的声明类型`);
  } else if (declared.length > 0) {
    const missing = declared.filter((k) => !keys.has(k));
    if (missing.length > 0) {
      warnings.push(`${id}: ui 声明了 ${missing.join("/")} 但源码中未见消费，声明可能已过期`);
    }
  }

  return { keys: [...keys].sort((a, b) => a.localeCompare(b)), warnings };
}

/**
 * 找出「元素长在插槽兜底里」的键。
 * `<slot>` 的兜底内容只在插槽未被填充时渲染，一旦使用方填了同名插槽，
 * 兜底里那个带 ui 类名的节点就不复存在，对应的 ui 覆盖也就无声失效。
 */
function slotFallbackKeys(src: string): Set<string> {
  const trapped = new Set<string>();
  // 负向后顾排除自闭合的 <slot />：它没有兜底内容，
  // 若被误当成开标签，正则会一路吃到下一个 </slot>，把无关的键也标成陷阱
  for (const m of src.matchAll(/<slot\b[^>]*(?<!\/)>([\s\S]*?)<\/slot>/g)) {
    // 不限定 :class="ui.x(" 的写法：兜底里也常见 cn(props.icon, ui.leadingIcon())
    // 这类嵌套调用，只要 ui.<键>( 出现在兜底内容里，这个键就会随插槽被替换掉
    for (const c of m[1].matchAll(/\bui\.([A-Za-z0-9_$]+)\s*\(/g)) trapped.add(c[1]);
  }
  return trapped;
}

/**
 * 抽取指定组件在指定端的 ui 键位，按声明 ui prop 的组件分组。
 * 组件在该端不存在、或压根不支持 ui 覆盖时返回空结果。
 */
export function extractUiKeys(id: string, platform: "web" | "uniapp"): UiKeysResult {
  const empty: UiKeysResult = { components: [], keys: [], warnings: [] };
  const dir = componentSourceDirs(id)[platform];
  if (!dir) return empty;

  const consumesUi = /props\.ui|uiOverrides|\.value\.ui\s*\??\./;
  const files = readVueFiles(dir)
    .filter((f) => !INTERNAL_COMPONENTS.has(f.name))
    .filter((f) => consumesUi.test(f.src));
  if (files.length === 0) return empty;

  // 直接读 props.ui 的才是「所有者」；只读注入值的子组件（如 TabsList、
  // RebornDropdownItem 从 inject 里拿父组件的 ui）没有自己的 ui prop，
  // 键位归属于唯一的所有者。
  // 全目录都没有 props.ui 时（如 RebornCoupon 先合并 props 再读 ui），
  // 退回「凡消费 ui 者即所有者」，避免整个组件被判成不支持 ui。
  let isOwner = (f: VueFile) => /props\.ui/.test(f.src);
  if (!files.some(isOwner)) isOwner = () => true;
  const owners = files.filter(isOwner);
  const injected = files.filter((f) => !isOwner(f));

  const warnings: string[] = [];
  if (owners.length === 0) {
    warnings.push(`${id}(${platform}): 有 uiOverrides 消费点但没有任何组件声明 ui prop`);
    return { ...empty, warnings };
  }
  if (injected.length > 0 && owners.length > 1) {
    warnings.push(
      `${id}(${platform}): 存在多个 ui prop 所有者，注入式子组件（${injected
        .map((f) => f.name)
        .join("/")}）的键位归属无法自动判定`,
    );
  }

  const components: UiComponentKeys[] = [];
  for (const owner of owners) {
    // 唯一所有者时，把注入式子组件的源码并进来一起抽取
    const src = owners.length === 1 ? [owner, ...injected].map((f) => f.src).join("\n") : owner.src;
    const collected = collectKeys(src, dir, id);
    warnings.push(...collected.warnings);
    const trapped = slotFallbackKeys(src);
    if (collected.keys.length === 0) continue;
    components.push({
      component: owner.name,
      keys: collected.keys.map((key) => ({ key, slotFallback: trapped.has(key) })),
    });
  }

  // 并集：同名键在多个组件都出现时，只要有一处踩了插槽陷阱就标记
  const union = new Map<string, UiKeyInfo>();
  for (const c of components) {
    for (const k of c.keys) {
      const prev = union.get(k.key);
      if (prev) prev.slotFallback = prev.slotFallback || k.slotFallback;
      else union.set(k.key, { ...k });
    }
  }

  return {
    components,
    keys: [...union.values()].sort((a, b) => a.key.localeCompare(b.key)),
    warnings: [...new Set(warnings)],
  };
}

/** 组件是否消费了 ui prop（任一端），用于决定是否要求文档写出键位表 */
export function supportsUi(id: string): boolean {
  for (const platform of ["web", "uniapp"] as const) {
    if (extractUiKeys(id, platform).keys.length > 0) return true;
  }
  return false;
}
