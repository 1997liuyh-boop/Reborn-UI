/**
 * Playground 代码工具集
 *
 * - 编解码:把演示代码压进 URL hash(#code=<base64url>),实现可分享链接,
 *   AI 助手的"在 Playground 运行"按钮也依赖同一格式
 * - 编译:把用户输入的 <template> + <script setup> 字符串转换为可挂载的组件定义,
 *   依赖 nuxt.config 中开启的 vue.runtimeCompiler
 */
import { defineComponent, markRaw, type Component } from "vue";
import * as vue from "vue";
import {
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
} from "@vueuse/core";

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
  const match = hash.match(/code=([A-Za-z0-9_-]+)/);
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
    for (const id of m[1]!.matchAll(/(?:^|[,{[\s])(?:[\w$]+\s*:\s*)?([A-Za-z_$][\w$]*)/g)) {
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
    // 剔除 import 语句(new Function 中不支持,依赖均已注入)
    const stripped = script.replace(/^[ \t]*import\b[^\n]*$/gm, "");
    const bindings = collectTopLevelBindings(stripped);

    try {
      const factory = new Function(
        "__vue",
        "__vueuse",
        `"use strict";
const { ref, reactive, computed, watch, watchEffect, shallowRef, toRefs, toRef,
  onMounted, onBeforeUnmount, onUnmounted, onUpdated, nextTick, provide, inject,
  defineAsyncComponent, h, useTemplateRef } = __vue;
const { ${Object.keys(vueuseApis).join(", ")} } = __vueuse;
${stripped}
return { ${bindings.join(", ")} };`,
      ) as (v: typeof vue, vu: typeof vueuseApis) => Record<string, unknown>;

      setupFn = () => factory(vue, vueuseApis);
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
