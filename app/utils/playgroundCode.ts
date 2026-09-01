import type {Component} from "vue";
import {
    useClipboard,
    useColorMode,
    useDebounceFn,
    useIntervalFn,
    useMediaQuery,
    useMouse,
    useThrottleFn,
    useTimeoutFn,
    useToggle,
    useWindowSize,
} from "@vueuse/core";
/**
 * Playground 代码工具集
 *
 * - 编解码:把演示代码压进 URL hash(#code=<base64url>),实现可分享链接,
 *   AI 助手的"在 Playground 运行"按钮也依赖同一格式
 * - 编译:把用户输入的 <template> + <script setup> 字符串转换为可挂载的组件定义,
 *   依赖 nuxt.config 中开启的 vue.runtimeCompiler
 */
import {  defineComponent, markRaw } from "vue";
import * as vue from "vue";

/** 注入给用户脚本的 VueUse 常用 API(文档示例常用,import 被剥离后仍可直接调用) */
const vueuseApis = {
    useColorMode,
    useMediaQuery,
    useClipboard,
    useWindowSize,
    useMouse,
    useIntervalFn,
    useTimeoutFn,
    useToggle,
    useDebounceFn,
    useThrottleFn,
};

/**
 * 可在 Playground 脚本中 import 的模块注册表
 *
 * new Function 无法解析真正的模块导入，此前所有 import 一律剔除——组件
 * 全局注册无碍，但演示代码里从 config 导入的常量（如 radioColors）会变成
 * undefined。注册表由 /playground 页面按需灌入（glob 收集全部组件 config），
 * 编译时把命中的 import 改写为对注册表的解构，未命中的仍按原逻辑剔除。
 */
const playgroundModules: Record<string, Record<string, unknown>> = {};

/** 归一化模块说明符：去掉扩展名，便于 "x.config" 与 "x.config.ts" 同键命中 */
function normalizeSpecifier(spec: string): string {
  return spec.replace(/\.(?:ts|js|mjs)$/, "");
}

/** 灌入可 import 的模块（key 为演示代码里书写的说明符，如 ~/components/.../x.config） */
export function registerPlaygroundModules(mods: Record<string, Record<string, unknown>>): void {
  for (const [spec, mod] of Object.entries(mods)) {
    playgroundModules[normalizeSpecifier(spec)] = mod;
  }
}

/** 供生成代码调用的取模块函数名（注入 Function 作用域） */
function resolvePlaygroundModule(spec: string): Record<string, unknown> {
  return playgroundModules[normalizeSpecifier(spec)] ?? {};
}

/**
 * 把 import 语句改写为对注册表的解构；未注册的模块返回空串（剔除）。
 * type-only 导入直接剔除。
 */
function rewriteImport(statement: string, spec: string): string {
  if (/^\s*import\s+type\b/.test(statement)) return "";
  if (!playgroundModules[normalizeSpecifier(spec)]) return "";

  // 用 split 取 import 与 from 之间的子句，规避易回溯的正则写法
  const clause = (statement.split(/\bfrom\b/)[0] ?? "").replace(/^\s*import\s*/, "").trim();
  if (!clause) return "";

  const parts: string[] = [];
  const defaultName = clause.match(/^([A-Z_$][\w$]*)/i)?.[1];
  if (defaultName) {
    parts.push(`const ${defaultName} = __mods(${JSON.stringify(spec)}).default ?? __mods(${JSON.stringify(spec)});`);
  }

  const named = clause.match(/\{([\s\S]*?)\}/)?.[1];
  if (named) {
    const bindings = named
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("type "))
      .map((s) => {
        const m = s.match(/^([\w$]+)\s+as\s+([A-Za-z_$][\w$]*)$/);
        return m ? `${m[1]}: ${m[2]}` : s;
      });
    if (bindings.length) {
      parts.push(`const { ${bindings.join(", ")} } = __mods(${JSON.stringify(spec)});`);
    }
  }
  return parts.join("\n");
}

/**
 * 宽松化 TS 语法，使脚本能被 new Function 解析：
 * 演示代码常见的 as const 断言、调用处泛型实参、声明处类型标注一律剥掉。
 * 这是面向演示代码规范的轻量处理，不是完整的 TS 转译。
 */
function looseTs(script: string): string {
  return script
    // as const / as SomeType（到行尾或逗号/括号边界前的简单类型）
    .replace(/\s+as\s+const\b/g, "")
    .replace(/\s+as\s+[A-Za-z_$][\w$.]*(?:<[^<>]*(?:<[^<>]*>[^<>]*)*>)?(?:\[\])*/g, "")
    // 调用处泛型实参：ref<...>( / computed<...>( 等，支持一层嵌套尖括号
    .replace(/([A-Z_$][\w$]*)<[^<>()]*(?:<[^<>]*>[^<>()]*)*>\(/gi, "$1(")
    // 声明处类型标注：const x: Type = → const x =
    .replace(/^(\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*)\s*:\s*(?:[^\s=][^=\n]*|[\t\v\f\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF])=/gm, "$1 =");
}

/** 编译结果:组件与错误互斥 */
export interface PlaygroundCompileResult {
  /** 可直接 <component :is> 挂载的组件定义,失败时为 null */
  component: Component | null;
  /** 编译/解析阶段的错误信息,成功时为 null */
  error: string | null;
}

/** 把代码编码为 URL 安全的 base64(供 hash 传递,兼容中文) */
export function encodePlaygroundCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 从 URL 安全 base64 还原代码,格式非法时返回 null */
export function decodePlaygroundCode(encoded: string): string | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** 生成带代码的 Playground 完整路径(相对站点根) */
export function buildPlaygroundUrl(code: string): string {
  return `/playground#code=${encodePlaygroundCode(code)}`;
}

/** 从当前 location.hash 中提取代码,不存在或非法时返回 null */
export function readPlaygroundCodeFromHash(hash: string): string | null {
  const match = hash.match(/code=([\w-]+)/);
  return match?.[1] ? decodePlaygroundCode(match[1]) : null;
}

/** 拆分出 <template> 与 <script setup> 两段;允许只写模板片段 */
function parseSfcLike(source: string): { template: string; script: string } {
  const templateMatch = source.match(/<template>([\s\S]*)<\/template>/);
  const scriptMatch = source.match(/<script[^>]*>([\s\S]*?)<\/script>/);

  // 没有 <template> 标签时,把去掉 script 块的剩余内容整体视为模板
  const template = templateMatch
    ? templateMatch[1]!
    : source.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");

  return { template: template.trim(), script: scriptMatch?.[1]?.trim() ?? "" };
}

/**
 * 提取脚本顶层声明的变量名,用于自动 return 给模板使用
 * 覆盖 const/let/var/function 及对象、数组解构等常见 demo 写法
 */
function collectTopLevelBindings(script: string): string[] {
  const names = new Set<string>();

  // 普通声明与函数声明
  for (const m of script.matchAll(/^[ \t]*(?:const|let|var|(?:async\s+)?function)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(m[1]!);
  }
  // 对象/数组解构声明:const { a, b: c } = ... / const [x, y] = ...
  for (const m of script.matchAll(/^[ \t]*(?:const|let|var)\s*(\{[^}]*\}|\[[^\]]*\])\s*=/gm)) {
    for (const id of m[1]!.matchAll(/(?:^|[,{[\s])(?:[\w$]+\s*:\s*)?([A-Z_$][\w$]*)/gi)) {
      names.add(id[1]!);
    }
  }
  return [...names];
}

/**
 * 把用户代码编译为组件定义
 *
 * 脚本在受控函数作用域内执行:import 语句会被剔除(Vue API 已注入,
 * Reborn 组件全局注册无需引入),顶层声明自动回传给模板
 */
export function compilePlaygroundComponent(source: string): PlaygroundCompileResult {
  const { template, script } = parseSfcLike(source);

  if (!template) {
    return { component: null, error: "缺少模板内容:请提供 <template> 块或直接书写标签片段" };
  }

  let setupFn: (() => Record<string, unknown>) | null = null;

  if (script) {
    // 带 from 的 import：命中注册表的改写为解构，其余剔除（组件已全局注册）
    let stripped = script.replace(
      /^[ \t]*import\s[\s\S]*?from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
      (statement, spec: string) => rewriteImport(statement, spec),
    );
    // 兜底剔除残余 import（副作用导入、无 from 的写法）
    stripped = stripped.replace(/^[ \t]*import\b[^\n]*$/gm, "");
    // 宽松化 TS 语法后再交给 new Function
    stripped = looseTs(stripped);
    const bindings = collectTopLevelBindings(stripped);

    try {
      // Playground 的本职就是执行用户输入的演示代码，Function 构造器是既定实现方式
      // eslint-disable-next-line no-new-func
      const factory = new Function(
        "__vue",
        "__vueuse",
        "__mods",
        `"use strict";
const { ref, reactive, computed, watch, watchEffect, shallowRef, toRefs, toRef,
  onMounted, onBeforeUnmount, onUnmounted, onUpdated, nextTick, provide, inject,
  defineAsyncComponent, h, useTemplateRef } = __vue;
const { ${Object.keys(vueuseApis).join(", ")} } = __vueuse;
${stripped}
return { ${bindings.join(", ")} };`,
      ) as (v: typeof vue, vu: typeof vueuseApis, m: typeof resolvePlaygroundModule) => Record<string, unknown>;

      setupFn = () => factory(vue, vueuseApis, resolvePlaygroundModule);
    } catch (err) {
      return { component: null, error: `脚本解析失败:${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // 预编译模板,把语法错误拦截在挂载之前
  const templateErrors: string[] = [];
  try {
    vue.compile(template, {
      onError: (err) => {
        templateErrors.push(err.message);
      },
    });
  } catch (err) {
    templateErrors.push(err instanceof Error ? err.message : String(err));
  }
  if (templateErrors.length > 0) {
    return { component: null, error: `模板编译失败:${templateErrors.join(";")}` };
  }

  const component = markRaw(
    defineComponent({
      name: "PlaygroundSandbox",
      setup: setupFn ?? undefined,
      template,
    }),
  );

  return { component, error: null };
}
