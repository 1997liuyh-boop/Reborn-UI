import baseTheme from "~/assets/theme/base.css?raw";
import typographyTheme from "~/assets/theme/typography.css?raw";

/**
 * Playground 运行时 Tailwind 编译器。
 *
 * 为什么需要:/playground 是在浏览器里现场编译 SFC 的,但样式取自站点**构建期**生成的
 * 那份 CSS(@tailwindcss/vite,无 safelist)。因此 AI 助手或用户临时写出的类,只有恰好在
 * 仓库别处出现过的才有 CSS——例如 `to-green-500`、`from-violet-600`、`hover:opacity-90`
 * 在本仓库零命中,渐变示例就只渲染出半截甚至完全失效,正是「示例效果欠佳」的根因。
 *
 * 做法:注入一段 `style[type="text/tailwindcss"]` 作为编译根,再加载 @tailwindcss/browser。
 * 它会扫描整个文档的 class 并持续监听 DOM 变化,把缺失的工具类实时补出来。
 *
 * 两处刻意的选择:
 * 1. 编译根只 import theme 与 utilities,**不含 preflight**。站点 CSS 已经带了一份 preflight,
 *    运行时产物追加在其后,重复注入等于让后者赢——虽然内容相同,但没有必要冒这个风险。
 * 2. 注入本项目的 theme(base.css + typography.css)。前者提供 gray-1..10 / brand-* / 语义色
 *    等令牌,后者覆盖了字号刻度(--text-sm: 12px)。少了 typography.css,运行时生成的
 *    `text-sm` 会按 Tailwind 默认的 0.875rem 输出并盖掉站点的 12px,整页字号都会变。
 */

/** 编译器只需启动一次;重复调用复用同一个 Promise */
let bootstrap: Promise<void> | undefined;

export function ensureRuntimeTailwind(): Promise<void> {
  if (import.meta.server) return Promise.resolve();
  if (bootstrap) return bootstrap;

  bootstrap = (async () => {
    if (!document.querySelector("style[data-reborn-runtime-tailwind]")) {
      const style = document.createElement("style");
      // 非标准 type 的 style 不会被浏览器当样式表解析,只作为编译器的输入
      style.setAttribute("type", "text/tailwindcss");
      style.setAttribute("data-reborn-runtime-tailwind", "");
      style.textContent = [
        "@layer theme, base, components, utilities;",
        '@import "tailwindcss/theme.css" layer(theme);',
        '@import "tailwindcss/utilities.css" layer(utilities);',
        typographyTheme,
        baseTheme,
      ].join("\n");
      document.head.appendChild(style);
    }

    // 约 300KB 的浏览器端编译器,只在进入 Playground 时按需加载
    await import("@tailwindcss/browser");
  })();

  return bootstrap;
}
