import type {MaybeRefOrGetter} from "vue";
import { computed,  toValue } from "vue";

/* ═══════════════════════════════════════════════════════════════════════
   落地页的字体与颜色控制（移植自 ThreeUI 的 pageTypography.ts）。

   页面是一份完整的 HTML 文档，在 iframe 中原样加载，所以控制项不改写文档本身：
   frame 加载完成后，往它自己的 <head> 末尾追加一张样式表，用页面原有的选择器
   重新声明所选的值。

   各项取默认值时，追加的样式只是复述页面原本的声明，渲染结果与原页面一致。
   字体例外：页面自带的字体排在首位并作为默认值；另外三种共享字体只在被选中时
   才从 Google Fonts 加载，未选中时页面不发出额外请求。
   ═══════════════════════════════════════════════════════════════════════ */

export interface PageFont {
  value: string;
  label: string;
  stack: string;
  /** Google Fonts css2 的字体族描述；页面已自带的字体不填 */
  google?: string;
}

/** 同系列页面都提供的三种共享备选字体 */
export const INSTRUMENT_SERIF: PageFont = {
  value: "instrument-serif",
  label: "Instrument Serif",
  stack: '"Instrument Serif", Georgia, serif',
  google: "Instrument+Serif",
};

export const NEWSREADER: PageFont = {
  value: "newsreader",
  label: "Newsreader",
  stack: '"Newsreader", Georgia, serif',
  google: "Newsreader:wght@200..700",
};

export const GEIST: PageFont = {
  value: "geist",
  label: "Geist",
  stack: '"Geist", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
  google: "Geist:wght@100..900",
};

export interface PageTypographyProps {
  /** 标题字体，取值为字体的 value，未命中时回落到页面自带字体 */
  headingFont?: string;
  /** 正文字体 */
  bodyFont?: string;
  /** 标题字重，须在配方提供的档位内 */
  headingWeight?: string;
  /** 正文字重 */
  bodyWeight?: string;
  /** 主色（#rgb 或 #rrggbb），非法值回落到页面原色 */
  primaryColor?: string;
  /** 标题字号，按页面自身的设计单位计 */
  headingSize?: number;
  /** 正文字号 */
  bodySize?: number;
  /** 标题字间距，单位 em */
  headingLetterSpacing?: number;
}

/** 解析并钳制后的取值，以及配方写 CSS 时用到的颜色工具 */
export interface PageTypography {
  heading: string;
  body: string;
  headingWeight: string;
  bodyWeight: string;
  primary: string;
  headingSize: number;
  bodySize: number;
  headingLetterSpacing: number;
  /** 按主色的同一偏移量移动页面原有的某个颜色，保持调色板内部的明暗关系 */
  retone: (hex: string) => string;
  /** 对 rgb() / rgba() 字符串做同样的偏移，保留透明度 */
  retoneRgba: (color: string) => string;
  /** 把原色带到主色上的 filter，用于 WebGL 绘制、CSS 变量够不着的部分；主色未变时返回 "none" */
  filter: (baseHex?: string) => string;
}

export interface PageInlineStyleOverride {
  selector: string;
  styles: Readonly<Record<string, string>>;
}

export interface PageTypographyRecipe {
  headingFonts: readonly PageFont[];
  bodyFonts: readonly PageFont[];
  /** 可选字重（按滑块顺序）与页面原本的字重 */
  headingWeights: readonly string[];
  headingWeight: string;
  bodyWeights: readonly string[];
  bodyWeight: string;
  /** 页面原本的主色，也是所有偏移与 filter 的基准 */
  primaryColor: `#${string}`;
  /** [最小值, 默认值, 最大值] */
  headingSize: readonly [number, number, number];
  bodySize: readonly [number, number, number];
  headingLetterSpacing: readonly [number, number, number];
  css: (type: PageTypography) => string;
  inlineStyles?: (type: PageTypography) => readonly PageInlineStyleOverride[];
}

export interface LandingPageCustomization {
  css: string;
  /** 只有选中的字体需要加载时才有值 */
  fontHref?: string;
  /** 仅用于排版写在元素 style 属性里的页面：追加样式压不过行内样式，只能在加载后的 DOM 上设置 */
  inlineStyles?: readonly PageInlineStyleOverride[];
}

/* ── 颜色 ────────────────────────────────────────────────────────────── */

interface Hsl { h: number; s: number; l: number }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function normalizeHex(value: string | undefined, fallback: string) {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return fallback;
  const digits = match[1]!.toLowerCase();
  return `#${digits.length === 3 ? digits.replace(/./g, d => d + d) : digits}`;
}

function hexToHsl(hex: string): Hsl {
  const [red, green, blue] = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255) as [number, number, number];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  const base = max === red
    ? ((green - blue) / delta) % 6
    : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return { h: (base * 60 + 360) % 360, s, l };
}

function hslToRgb({ h, s, l }: Hsl) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60
    ? [c, x, 0]
    : h < 120
      ? [x, c, 0]
      : h < 180
        ? [0, c, x]
        : h < 240
          ? [0, x, c]
          : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r + m, g + m, b + m].map(channel => Math.round(clamp01(channel) * 255));
}

function hslToHex(hsl: Hsl) {
  return `#${hslToRgb(hsl).map(channel => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** 原主色到新主色的偏移：色相旋转加饱和度/亮度比例。用比例而非差值，柔和的色调仍按比例柔和 */
function colorShift(base: string, target: string) {
  const from = hexToHsl(base);
  const to = hexToHsl(target);
  return {
    hue: to.h - from.h,
    saturation: from.s > 0.01 ? Math.min(3, to.s / from.s) : 1,
    lightness: from.l > 0.01 ? Math.min(3, to.l / from.l) : 1,
  };
}

/* ── 选项解析 ────────────────────────────────────────────────────────── */

function selectFont(value: string | undefined, options: readonly PageFont[]) {
  return options.find(option => option.value === value) ?? options[0]!;
}

function selectWeight(value: string | undefined, options: readonly string[], fallback: string) {
  return value !== undefined && options.includes(value) ? value : fallback;
}

function clampRange(value: number | undefined, [min, fallback, max]: readonly [number, number, number]) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value as number)) : fallback;
}

function fontHrefFor(fonts: readonly PageFont[]) {
  const families = [...new Set(fonts.map(font => font.google).filter((family): family is string => Boolean(family)))];
  if (!families.length) return undefined;
  return `https://fonts.googleapis.com/css2?${families.map(family => `family=${family}`).join("&")}&display=swap`;
}

/* ── 同系列页面共用的组合式函数 ─────────────────────────────────────── */

export function usePageTypography(recipe: PageTypographyRecipe, props: MaybeRefOrGetter<PageTypographyProps>) {
  return computed<LandingPageCustomization>(() => {
    const { headingFont, bodyFont, headingWeight, bodyWeight, primaryColor, headingSize, bodySize, headingLetterSpacing } = toValue(props);
    const heading = selectFont(headingFont, recipe.headingFonts);
    const body = selectFont(bodyFont, recipe.bodyFonts);
    const primary = normalizeHex(primaryColor, recipe.primaryColor);
    const untouched = primary === recipe.primaryColor;
    const shift = colorShift(recipe.primaryColor, primary);

    const retone = (hex: string) => {
      if (untouched) return hex;
      const source = hexToHsl(normalizeHex(hex, hex));
      return hslToHex({
        h: (source.h + shift.hue + 360) % 360,
        s: clamp01(source.s * shift.saturation),
        l: clamp01(source.l * shift.lightness),
      });
    };

    const retoneRgba = (color: string) => {
      if (untouched) return color;
      const match = color.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i);
      if (!match) return color;
      const hex = `#${[match[1], match[2], match[3]]
        .map(channel => Math.round(Number(channel)).toString(16).padStart(2, "0"))
        .join("")}`;
      const [red, green, blue] = [1, 3, 5].map(index => Number.parseInt(retone(hex).slice(index, index + 2), 16));
      return match[4] === undefined
        ? `rgb(${red}, ${green}, ${blue})`
        : `rgba(${red}, ${green}, ${blue}, ${match[4]})`;
    };

    const filter = (baseHex: string = recipe.primaryColor) => {
      if (untouched) return "none";
      const local = colorShift(baseHex, retone(baseHex));
      return [
        `hue-rotate(${local.hue.toFixed(2)}deg)`,
        `saturate(${Math.max(0, local.saturation).toFixed(3)})`,
        `brightness(${Math.min(2, Math.max(0.2, local.lightness)).toFixed(3)})`,
      ].join(" ");
    };

    const type: PageTypography = {
      heading: heading.stack,
      body: body.stack,
      headingWeight: selectWeight(headingWeight, recipe.headingWeights, recipe.headingWeight),
      bodyWeight: selectWeight(bodyWeight, recipe.bodyWeights, recipe.bodyWeight),
      primary,
      headingSize: clampRange(headingSize, recipe.headingSize),
      bodySize: clampRange(bodySize, recipe.bodySize),
      headingLetterSpacing: clampRange(headingLetterSpacing, recipe.headingLetterSpacing),
      retone,
      retoneRgba,
      filter,
    };

    return { css: recipe.css(type), fontHref: fontHrefFor([heading, body]), inlineStyles: recipe.inlineStyles?.(type) };
  });
}

/* ── 注入 ────────────────────────────────────────────────────────────── */

const STYLE_ID = "threeui-page-typography";
const FONT_LINK_ID = "threeui-page-typography-fonts";

/**
 * 追加到 frame 自己的 head 末尾，而不是写进文档，页面文件保持原样。
 * 每次更新都重新追加，让这张表始终排在 head 最后，同等优先级下胜过页面自身规则，无需 !important。
 */
export function applyPageCustomization(frame: HTMLIFrameElement | null, customization?: LandingPageCustomization) {
  const frameDocument = frame?.contentDocument;
  if (!frameDocument?.head) return;

  const existingLink = frameDocument.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (customization?.fontHref) {
    const link = existingLink ?? frameDocument.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    if (link.getAttribute("href") !== customization.fontHref) link.href = customization.fontHref;
    if (!existingLink) frameDocument.head.append(link);
  }
  else {
    existingLink?.remove();
  }

  if (!customization?.css) {
    frameDocument.getElementById(STYLE_ID)?.remove();
    return;
  }

  const style = (frameDocument.getElementById(STYLE_ID) as HTMLStyleElement | null) ?? frameDocument.createElement("style");
  style.id = STYLE_ID;
  if (style.textContent !== customization.css) style.textContent = customization.css;
  frameDocument.head.append(style);

  for (const override of customization.inlineStyles ?? []) {
    for (const element of frameDocument.querySelectorAll<HTMLElement>(override.selector)) {
      for (const [property, value] of Object.entries(override.styles)) element.style.setProperty(property, value);
    }
  }
}
