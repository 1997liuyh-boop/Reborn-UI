import type { ClassValue } from "clsx";
import type { ComputedRef } from "vue";
import { tv } from "~/lib/tv";

/** 父子组件通信用的 provide/inject 键 */
export const ANCHOR_INJECTION_KEY = "reborn-anchor";

const anchorTypes = ["default", "underline"] as const;
const anchorDirections = ["vertical", "horizontal"] as const;
const anchorColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;
const anchorMarkers = ["bar", "dot", "hollow", "none"] as const;

export { anchorColors, anchorDirections, anchorMarkers, anchorTypes };

/** 锚点类型：default 画一条贯穿的灰色轨道线，标记是轨道上被点亮的一段；underline 不画轨道，只有选中项那一段线 */
export type AnchorType = (typeof anchorTypes)[number];
/** 锚点方向：vertical 链接竖排、标记在左侧；horizontal 链接横排、标记在底部 */
export type AnchorDirection = (typeof anchorDirections)[number];
/** 强调色，决定选中文字与标记的颜色；取各色阶的 -6 档，neutral 用 gray-9（gray-6 是浅灰，当强调色看不清） */
export type AnchorColor = (typeof anchorColors)[number];
/** 标记形态：bar 竖条 / dot 实心圆 / hollow 空心圆 / none 不显示；横向锚点只有 bar 与 none */
export type AnchorMarker = (typeof anchorMarkers)[number];

/** 单个链接登记到父级的元信息，父级据此判定选中项并测量标记位置 */
export interface AnchorLinkMeta {
  /** 链接地址，形如 `#section-id`；未填写的链接不参与滚动判定 */
  href?: string;
  /** 链接的 a 节点，用于测量标记位置并按 DOM 先后校正顺序 */
  el?: HTMLElement;
}

/** 父级下发给 anchor-link 的上下文 */
export interface AnchorContext {
  /** 当前选中的链接 href */
  activeHref: ComputedRef<string | undefined>;
  /** 单个链接外层容器的样式类 */
  itemClass: ComputedRef<string>;
  /** 子链接容器的样式类 */
  sublistClass: ComputedRef<string>;
  /** 链接文字的样式类 */
  linkTitleClass: ComputedRef<string>;
  /** 按选中态取链接盒子的样式类，选中态逐个链接不同，不能并入一次性算好的样式 */
  linkClass: (active: boolean) => string;
  /** 登记链接 */
  addLink: (meta: AnchorLinkMeta) => void;
  /** 按 a 节点的 DOM 先后校正链接顺序 */
  sortLinks: () => void;
  /** 注销链接 */
  removeLink: (meta: AnchorLinkMeta) => void;
  /** 处理链接点击：先外发 click 事件，未被消费者阻止才滚动 */
  handleClick: (event: MouseEvent, href?: string) => void;
}

/** 可覆盖的样式区域 */
export type AnchorUI = Partial<{
  root: ClassValue;
  list: ClassValue;
  marker: ClassValue;
  item: ClassValue;
  link: ClassValue;
  linkTitle: ClassValue;
  sublist: ClassValue;
}>;

const theme = tv({
  slots: {
    root: "min-w-0",
    // 标记绝对定位在这一层，轨道线由 before 伪元素画：
    // 若改用 list 自身的 border，标记的 left-0 会落在边框内侧的内容盒起点，与轨道错开 2px 对不齐
    list: "relative flex min-w-0",
    // 位置由组件测量选中链接后写入行内样式，这里只负责形态与过渡；尺寸交给 direction × marker 的组合
    marker: "pointer-events-none absolute transition-all duration-300 ease-out motion-reduce:transition-none",
    // 链接与它的子链接共用的外层容器：单根节点才能让使用方写在 anchor-link 上的 class 正常落下来
    item: "flex min-w-0 flex-col",
    // text-base 在本仓库的字号阶梯里是 14px；行高单独覆盖成 150%，阶梯自带的 22px 比设计稿高 1px
    link: "flex min-w-0 cursor-pointer items-center text-base leading-[150%] no-underline transition-colors duration-200 motion-reduce:transition-none",
    linkTitle: "truncate",
    // 子链接始终竖排：横向锚点再嵌一层会把标记的横向测量基准打乱，见组件文档「子链接嵌套」
    sublist: "flex flex-col",
  },
  variants: {
    direction: {
      vertical: {
        list: "flex-col gap-1",
        // 轨道线与文字之间留 18px
        link: "py-1 pl-4.5",
        // 子链接相对上级再缩进 14px
        sublist: "pl-[14px]",
      },
      horizontal: {
        list: "flex-row items-end gap-6",
        link: "pb-1",
        sublist: "pl-[14px]",
      },
    },
    type: {
      default: {},
      underline: {},
    },
    // 强调色只落在两处：标记底色、链接的悬浮文字色。
    // 选中态的文字色要盖掉 active.false 的 text-gray-8，只能放到下面的 color × active 组合里
    color: {
      primary: { marker: "bg-primary", link: "hover:text-primary" },
      secondary: { marker: "bg-secondary", link: "hover:text-secondary" },
      success: { marker: "bg-success", link: "hover:text-success" },
      info: { marker: "bg-info", link: "hover:text-info" },
      warning: { marker: "bg-warning", link: "hover:text-warning" },
      error: { marker: "bg-error", link: "hover:text-error" },
      // --color-neutral 是 gray-4 / gray-5 的浅灰，当强调色看不清，这里改取 gray-9
      neutral: { marker: "bg-gray-9", link: "hover:text-gray-9" },
    },
    // 只管形态，底色由 color 档给
    marker: {
      bar: { marker: "rounded-[2px]" },
      dot: { marker: "rounded-full" },
      // 空心圆的「洞」用 after 挖：再套一层实体元素会把标记的测量基准变成两个节点
      hollow: {
        marker:
          "rounded-full after:absolute after:top-1/2 after:left-1/2 after:size-[2px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-gray-1 after:content-['']",
      },
      // none 由组件直接不渲染标记节点，这里不需要样式
      none: {},
    },
    active: {
      true: { link: "font-medium" },
      false: { link: "text-gray-8" },
    },
  },
  compoundVariants: [
    // default 类型的轨道线：标记就压在这条线上，滑过时看着像轨道被逐段点亮
    {
      type: "default",
      direction: "vertical",
      class: {
        list: "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:rounded-full before:bg-gray-2 before:content-['']",
      },
    },
    {
      type: "default",
      direction: "horizontal",
      class: {
        list: "before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:rounded-full before:bg-gray-2 before:content-['']",
      },
    },
    // 纵向标记：三种形态都是固定尺寸，组件只写中线位置，靠 -translate-y-1/2 自己居中
    {
      direction: "vertical",
      marker: "bar",
      class: { marker: "left-0 h-[21px] w-[2px] -translate-y-1/2" },
    },
    // 圆点比 2px 的轨道宽，左移 2px 才能骑在轨道中线上
    {
      direction: "vertical",
      marker: "dot",
      class: { marker: "left-[-2px] size-[6px] -translate-y-1/2" },
    },
    {
      direction: "vertical",
      marker: "hollow",
      class: { marker: "left-[-2px] size-[6px] -translate-y-1/2" },
    },
    // 横向标记只有贴底的滑块一种形态，宽度由组件按链接宽度写入
    {
      direction: "horizontal",
      marker: "bar",
      class: { marker: "bottom-0 h-[2px]" },
    },
    // 选中链接的文字色：variants 里的 active.false 已经写了 text-gray-8，
    // 同为文字色的强调色只有下沉到组合里才能盖过它（compoundVariants 在 variants 之后合并）
    { color: "primary", active: true, class: { link: "text-primary" } },
    { color: "secondary", active: true, class: { link: "text-secondary" } },
    { color: "success", active: true, class: { link: "text-success" } },
    { color: "info", active: true, class: { link: "text-info" } },
    { color: "warning", active: true, class: { link: "text-warning" } },
    { color: "error", active: true, class: { link: "text-error" } },
    { color: "neutral", active: true, class: { link: "text-gray-9" } },
  ],
  defaultVariants: {
    type: "default",
    direction: "vertical",
    color: "primary",
    marker: "bar",
    active: false,
  },
});

export default theme;
