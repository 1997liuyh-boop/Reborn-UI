import type { MaybeRefOrGetter } from "vue";

/**
 * useDocTitleParts —— 从文档 title 推导「英文名 + 中文名」两段标题
 *
 * 组件页页头要把英文名与中文名分开设样式，但各组件 frontmatter 的 title 写法并不统一，
 * 实测有四种形态：
 * - 英文在前：`Button 按钮`、`Layout布局容器`（无空格）、`Tree Select 树选择器`
 * - 中文在前：`引导 Guide`、`卡片 Card`、`商品规格 Sku`、`滚动条 Scrollbar`
 * - 纯中文：`渐变按钮`、`提示点/标记`
 * - 纯英文：`BackTop`、`Dock`
 *
 * 所以既不能按空格切，也不能一律把「首个中文字符之前」当英文名 —— 那会把
 * `引导 Guide` 切成空英文名。这里先判断中英的前后次序再取两端；两端都取不到英文名时，
 * 回退到文件名（stem）转 PascalCase。个别推导不准的组件，在 frontmatter 写 `titleEn` 覆盖。
 */

/**
 * 中文字符（含中日韩标点与全角符号）的码点区间：英文名与中文名的分界靠它判定。
 *
 * 判中文用码点比较而不是正则字符类，是被两头夹出来的：区间起点 U+3000 是不可见的全角
 * 空格，在字符类里写成字面量既看不出来也过不了 regexp/no-invisible-character；而本仓库
 * 的编辑链路会把转义序列还原成它所表示的字符，改成转义形式落不了盘。码点区间是纯 ASCII
 * 源码，两头都绕开了 —— 别再「顺手」改回正则字符类。
 * 五个区间都在基本多文种平面内，逐个 UTF-16 码元比较即可，不必处理代理对。
 */
const CJK_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x3000, 0x303F], // 中日韩标点（全角空格、书名号、顿号等）
  [0x3400, 0x4DBF], // 汉字扩展 A
  [0x4E00, 0x9FFF], // 基本汉字
  [0xF900, 0xFAFF], // 兼容汉字
  [0xFF00, 0xFFEF], // 全角字母数字与半角片假名
];

/** 单字符是否落在中文码点区间内 */
function isCjkChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return CJK_RANGES.some(([start, end]) => code >= start && code <= end);
}

/** 首个中文字符的下标，没有则 -1 */
function findFirstCjkIndex(text: string): number {
  for (let i = 0; i < text.length; i++) {
    if (isCjkChar(text[i]!)) return i;
  }
  return -1;
}

/** 末个中文字符的下标，没有则 -1 */
function findLastCjkIndex(text: string): number {
  for (let i = text.length - 1; i >= 0; i--) {
    if (isCjkChar(text[i]!)) return i;
  }
  return -1;
}

/** 至少含一个拉丁字母才算英文名，避免把 `下拉选择2` 尾部的数字当成英文名 */
const LATIN_LETTER_PATTERN = /[a-z]/i;

/**
 * 组件文档的 stem 前缀：只有组件页才拆两段标题。
 *
 * DocsPage 是全站文档共用模板，入门指南 / 更新日志 / 组合式函数也走它。那些标题不是
 * 「英文名 + 中文名」的组合，硬拆会出错：`web项目安装` 会被切成 `Web` + `项目安装`，
 * 纯中文的 `更新日志` 还会拿文件名兜底出 `Index`。所以非组件页一律原样渲染。
 */
const COMPONENT_STEM_PREFIX = "2.components/";

/** 页头两段标题 */
export interface DocTitleParts {
  /** 英文名：页头主标题 */
  en: string;
  /** 中文名：跟在英文名之后弱化显示；纯英文组件为空串 */
  zh: string;
}

/** 文件名转 PascalCase：`gradient-button` → `GradientButton`（`reborn-` 是目录约定前缀，不进标题） */
function stemToPascalCase(stem: string): string {
  const name = (stem.split("/").pop() ?? "").replace(/^reborn-/, "");
  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/** 剥掉英文名两端的括号与标点：`悬浮按钮 (Fab)` 切出来的是 `(Fab)`，要还原成 `Fab`（中间的空格保留，`Tree Select` 是完整英文名） */
function stripWrappingPunctuation(name: string): string {
  return name.replace(/^[^a-z0-9]+/i, "").replace(/[^a-z0-9]+$/i, "");
}

/** 全小写的英文名补首字母大写：`checkbox 多选框` → `Checkbox`；`iPhone`、`3D` 已有大写则不动 */
function normalizeEnglishName(name: string): string {
  const cleaned = stripWrappingPunctuation(name);
  // 这里判的就是「有没有大写字母」，不能加 i 标志，否则 `checkbox` 会被当成已大写
  if (!cleaned || /[A-Z]/.test(cleaned)) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * 拆分标题为英文名与中文名
 *
 * @param title 文档 frontmatter 的 title
 * @param stem 文档 stem（形如 `2.components/button/reborn-button`），纯中文标题时兜底英文名
 * @param titleEn frontmatter 的可选覆盖值，推导不准时用它硬指定英文名
 */
export function splitDocTitle(title?: string, stem?: string, titleEn?: string): DocTitleParts {
  const raw = (title ?? "").trim();
  const override = (titleEn ?? "").trim();

  // 非组件页（入门指南 / 更新日志 / 组合式函数）：标题原样作主标题，不拆分也不用文件名兜底
  if (stem && !stem.startsWith(COMPONENT_STEM_PREFIX)) {
    return { en: override || raw, zh: "" };
  }

  const fallbackEn = stem ? stemToPascalCase(stem) : "";

  if (!raw) return { en: override || fallbackEn, zh: "" };

  const firstCjkIndex = findFirstCjkIndex(raw);

  // 纯英文标题：没有中文名可分
  if (firstCjkIndex < 0) {
    return { en: override || normalizeEnglishName(raw), zh: "" };
  }

  // 英文在前：`Button 按钮` / `Layout布局容器` / `3D 卡片效果`
  if (firstCjkIndex > 0) {
    const lead = raw.slice(0, firstCjkIndex).trim();
    if (LATIN_LETTER_PATTERN.test(lead)) {
      return { en: override || normalizeEnglishName(lead), zh: raw.slice(firstCjkIndex).trim() };
    }
    // 前缀里没有字母（以数字或符号开头），整串都算中文名
    return { en: override || fallbackEn, zh: raw };
  }

  // 中文在前：`引导 Guide` / `卡片 Card`，或纯中文 `渐变按钮`
  const lastCjkIndex = findLastCjkIndex(raw);
  const trail = raw.slice(lastCjkIndex + 1).trim();

  // 尾巴里没有字母（`下拉选择2` 的 `2`）就不是英文名，它属于中文名，整串都留给中文名
  if (!LATIN_LETTER_PATTERN.test(trail)) {
    return { en: override || fallbackEn, zh: raw };
  }

  return { en: override || normalizeEnglishName(trail), zh: raw.slice(0, lastCjkIndex + 1).trim() };
}

/** 组合式封装：传入 Nuxt Content 页面对象（或其 ref / getter），返回随页面变化的两段标题 */
export function useDocTitleParts(page: MaybeRefOrGetter<Record<string, any> | undefined>) {
  return computed<DocTitleParts>(() => {
    const value = toValue(page);
    return splitDocTitle(value?.title, value?.stem, value?.titleEn);
  });
}
