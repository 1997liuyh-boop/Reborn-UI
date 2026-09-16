/**
 * 描述列表的样式令牌。
 *
 * 字号与配色按设计规格固定，不开放 prop 覆盖（需要改写用 `ui` 或 `class`）：
 * 标签与内容取 `text-base`（14px / 22px），标题取 `text-2xl`（24px / 32px），
 * 字号与行高都来自 `app/assets/theme/typography.css` 的 `--text-*` 令牌，不写死像素值——
 * 该文件里每个 `--text-*` 都配了同名的 `--text-*--line-height`（行高统一取「字号 + 8px」），
 * 所以这里也不再额外写 `leading-*`，否则等于只用令牌的一半又把另一半改掉。
 * 配色随 bordered 反转：带边框时标签 gray-9、内容 gray-8，标签格另有 gray-2 底色，
 * 「字段名」是这一形态里的检索锚点所以更重；无边框时没有底色作边界，改成标签 gray-7、
 * 内容 gray-9，靠轻重对比把视线引向内容。
 */

/** 尺寸档位，值为单元格行高：sm 36px / md 48px / lg 56px */
export const descriptionsSizes = ["sm", "md", "lg"] as const;
export type DescriptionsSize = (typeof descriptionsSizes)[number];

/** 排列方式：horizontal 标签内容同行，vertical 标签行在上、内容行在下 */
export const descriptionsLayouts = ["horizontal", "vertical"] as const;
export type DescriptionsLayout = (typeof descriptionsLayouts)[number];

/** 标签 / 内容单元格水平对齐 */
export const descriptionsAligns = ["left", "center", "right"] as const;
export type DescriptionsAlign = (typeof descriptionsAligns)[number];

/** 断点由窄到宽，逐级向下回退取值时依赖这个顺序 */
export const descriptionsBreakpointOrder = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export type DescriptionsBreakpoint = (typeof descriptionsBreakpointOrder)[number];

/**
 * 各断点的宽度下限（px），取值与 Tailwind 默认断点一致。
 * 判定基准是「组件容器宽度」而不是视口宽度：描述列表被放进窄侧栏时同样要降列，
 * 按视口判定会让 1920 屏幕上的 380px 侧栏仍按 xl 档排 4 列然后挤爆。
 */
export const descriptionsBreakpoints: Record<DescriptionsBreakpoint, number> = {
  "xs": 0,
  "sm": 640,
  "md": 768,
  "lg": 1024,
  "xl": 1280,
  "2xl": 1536,
};

/** 按断点给不同数值，未命中的档位向下回退，如 `{ xs: 1, md: 2, lg: 3 }` */
export type DescriptionsResponsive = Partial<Record<DescriptionsBreakpoint, number>>;

/** 单项占列数：数字、`'filled'`（铺满当前行剩余列）或按断点给数字 */
export type DescriptionsSpan = number | "filled" | DescriptionsResponsive;

const config = {
  slots: {
    root: "reborn-descriptions w-full",
    header: "mb-[16px] flex items-start justify-between gap-[16px]",
    titleWrapper: "flex min-w-0 flex-1 items-center",
    title: "text-2xl font-medium text-gray-9",
    extra: "ml-auto flex shrink-0 items-center gap-[8px]",
    tableWrapper: "w-full overflow-x-auto",
    body: "w-full border-collapse",
    /** 每个 td 共用：左右内边距固定 16px 不随 size 变化，行高与上下内边距由 size 决定，边线由组件按行列位置补 */
    cell: "px-[16px] align-middle",
    label: "text-base font-medium tracking-normal text-gray-9",
    content: "text-base text-gray-8 break-words",
    // 冒号只在「无边框 + 水平」下渲染，所以直接跟随该形态的标签色
    colon: "select-none font-medium text-gray-7",
  },
  variants: {
    // 行高与上下内边距只在带边框时生效，见下方 compoundVariants
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    bordered: {
      true: {
        tableWrapper: "border border-gray-3",
      },
      // 无边框时没有底色单元格作边界，改用轻重对比分层：标签退到 gray-7，内容提到 gray-9
      false: {
        label: "text-gray-7",
        content: "text-gray-9",
      },
    },
    labelAlign: {
      left: { label: "text-left" },
      center: { label: "text-center" },
      right: { label: "text-right" },
    },
    contentAlign: {
      left: { content: "text-left" },
      center: { content: "text-center" },
      right: { content: "text-right" },
    },
  },
  compoundVariants: [
    // 行高用 h-*：表格单元格的 height 实际按最小高度生效，内容换行时照常撑开。
    // 无边框时不吃这套值——那一形态没有网格线，靠留白分层，行距由组件按行位置给固定值
    // （标签与内容之间 4px、项与项之间 16px），套上 48px 行高会把这两个间距淹掉。
    { bordered: true, size: "sm", class: { cell: "h-[36px] py-[6px]" } },
    { bordered: true, size: "md", class: { cell: "h-[48px] py-[8px]" } },
    { bordered: true, size: "lg", class: { cell: "h-[56px] py-[10px]" } },
  ],
  defaultVariants: {
    size: "md" as DescriptionsSize,
    bordered: false,
    labelAlign: "left" as DescriptionsAlign,
    contentAlign: "left" as DescriptionsAlign,
  },
};

export default config;
