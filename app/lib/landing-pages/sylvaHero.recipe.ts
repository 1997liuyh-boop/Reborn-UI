import type {PageFont, PageTypographyRecipe} from "./pageTypography";
import { GEIST, INSTRUMENT_SERIF, NEWSREADER   } from "./pageTypography";

/* 移植自 ThreeUI 的 pageRecipes.ts（Sylva 部分）。
   配方的默认值逐条复述页面原本的排版，未调整时追加的样式不改变渲染结果。
   字号挂在页面自己的设计单位 --u 上。 */

/** 去掉比例运算产生的浮点噪声，让输出的 CSS 保持可读 */
const n = (value: number) => Number(value.toFixed(3));
/** 按页面设计单位 --u 计算的尺寸 */
const unit = (value: number) => `calc(${n(value)} * var(--u))`;

function withAlpha(hex: string, alpha: number) {
  const [red, green, blue] = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** 页面自带的字体，已通过 inner-green-assets/lexend-latin.woff2 加载 */
const LEXEND: PageFont = {
  value: "lexend",
  label: "Lexend",
  stack: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/* 场景本身已有四种配色，这里的颜色控制只作用于文字墨色：
   移动主标题与页面由它派生的两档淡色，苔藓场景交给变体处理。 */
export const SYLVA_TYPOGRAPHY: PageTypographyRecipe = {
  headingFonts: [LEXEND, INSTRUMENT_SERIF, NEWSREADER, GEIST],
  bodyFonts: [LEXEND, GEIST, NEWSREADER, INSTRUMENT_SERIF],
  headingWeights: ["200", "300", "400", "500", "600"],
  headingWeight: "300",
  bodyWeights: ["200", "300", "400", "500"],
  bodyWeight: "300",
  primaryColor: "#ffffff",
  headingSize: [40, 63, 92],
  bodySize: [12, 16.5, 24],
  headingLetterSpacing: [-0.06, -0.006, 0.12],
  css: type => `
:root {
  --ink: ${type.primary};
  --ink-soft: ${withAlpha(type.primary, 0.62)};
  --ink-faint: ${withAlpha(type.primary, 0.44)};
}
body { font-family: ${type.body}; font-weight: ${type.bodyWeight}; }
.headline, .ghost {
  font-family: ${type.heading};
}
.headline {
  font-weight: ${type.headingWeight};
  font-size: ${unit(type.headingSize)};
  line-height: ${unit((type.headingSize * 65) / 63)};
  letter-spacing: ${type.headingLetterSpacing}em;
}
.lede {
  font-weight: ${type.bodyWeight};
  font-size: ${unit(type.bodySize)};
  line-height: ${unit((type.bodySize * 22) / 16.5)};
}
@media (max-width: 900px) {
  .headline {
    font-size: ${unit((type.headingSize * 62) / 63)};
    line-height: ${unit((type.headingSize * 66) / 63)};
  }
  .lede {
    font-size: ${unit((type.bodySize * 19) / 16.5)};
    line-height: ${unit((type.bodySize * 27) / 16.5)};
  }
}
`,
};
