import type { ClassValue } from "clsx";
import type { ComputedRef, Slot } from "vue";
import { tv } from "~/lib/tv";

/** 父子组件通信用的 provide/inject 键 */
export const TABS_INJECTION_KEY = "reborn-tabs";

const tabsTypes = ["line", "card", "card-gutter", "card-fill", "text", "rounded", "capsule"] as const;
const tabsSizes = ["sm", "md", "lg"] as const;
const tabsPositions = ["top", "bottom", "left", "right"] as const;
const tabsDirections = ["horizontal", "vertical"] as const;
const tabsTriggers = ["click", "hover"] as const;
const tabsOverflows = ["scroll", "arrows", "dropdown"] as const;
const tabsColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;

export { tabsColors, tabsDirections, tabsOverflows, tabsPositions, tabsSizes, tabsTriggers, tabsTypes };

/** 选项卡类型：line 下划线 / card 相接卡片（无边框） / card-gutter 间隔卡片（带边框） / card-fill 填充卡片 / text 纯文本 / rounded 圆角胶囊 / capsule 分段胶囊 */
export type TabsType = (typeof tabsTypes)[number];
/** 选项卡尺寸 */
export type TabsSize = (typeof tabsSizes)[number];
/** 选项卡头部所在的位置 */
export type TabsPosition = (typeof tabsPositions)[number];
/** 选项卡方向：vertical 等价于把头部放到侧边 */
export type TabsDirection = (typeof tabsDirections)[number];
/** 标签切换的触发方式 */
export type TabsTrigger = (typeof tabsTriggers)[number];
/** 标签超出容器时的导航方式：scroll 仅滚动 / arrows 两端箭头分步滚动 / dropdown 末尾下拉选标 */
export type TabsOverflow = (typeof tabsOverflows)[number];
/** 选项卡主题色 */
export type TabsColor = (typeof tabsColors)[number];
/** 标签唯一标识 */
export type TabKey = string | number;

/** 单个标签页登记到父级的元信息，父级据此渲染头部 */
export interface TabPaneMeta {
  /** 标签唯一标识，取自 tab-pane 的 key 属性；未写 key 时由父级按登记顺序补序号 */
  key: TabKey;
  /** 标题文本 */
  title?: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 可编辑模式下是否允许关闭 */
  closable: boolean;
  /** 不显示时是否销毁内容 */
  destroyOnHidden: boolean;
  /** 自定义标题插槽，由父级在头部渲染 */
  titleSlot?: Slot;
  /** 内容根节点，用于按 DOM 先后校正标签顺序 */
  el?: HTMLElement;
}

/** 父级下发给 tab-pane 的上下文 */
export interface TabsContext {
  /** 当前选中的标签 key */
  activeKey: ComputedRef<TabKey | undefined>;
  /** 首次展示时才挂载内容 */
  lazyLoad: ComputedRef<boolean>;
  /** 父级统一配置的销毁策略，与单个标签页的配置取或 */
  destroyOnHidden: ComputedRef<boolean>;
  /** 是否开启内容过渡动画 */
  animation: ComputedRef<boolean>;
  /** 内容区各 slot 的样式类 */
  paneClass: ComputedRef<string>;
  /** 登记标签页，未写 key 的会在此补上序号 */
  addPane: (meta: TabPaneMeta) => void;
  /** 按内容节点的 DOM 先后校正标签顺序 */
  sortPanes: () => void;
  /** 注销标签页 */
  removePane: (meta: TabPaneMeta) => void;
}

/** 可覆盖的样式区域 */
export type TabsUI = Partial<{
  root: ClassValue;
  nav: ClassValue;
  navWrapper: ClassValue;
  list: ClassValue;
  tab: ClassValue;
  tabTitle: ClassValue;
  tabClose: ClassValue;
  indicator: ClassValue;
  tabSlider: ClassValue;
  scrollBody: ClassValue;
  addButton: ClassValue;
  navButton: ClassValue;
  dropdown: ClassValue;
  dropdownPanel: ClassValue;
  dropdownItem: ClassValue;
  leftExtra: ClassValue;
  rightExtra: ClassValue;
  content: ClassValue;
  stage: ClassValue;
  pane: ClassValue;
}>;

const theme = tv({
  slots: {
    root: "flex w-full min-w-0",
    nav: "relative flex shrink-0 items-center gap-2",
    // 头部滚动容器：标签超出时可滚动，但不出现滚动条。
    // flex-1（basis 0）不能去掉：换成 basis auto 后它的 max-content 会把 nav 乃至组件根节点的
    // 内在宽度撑成标签总宽，宽度没约束死的祖先布局会被整体顶破。
    // 增加按钮要紧贴标签列，靠的是把按钮挪进滚动内容里（见模板的 scrollBody 层），不是收缩这层。
    // 溢出导航模式下组件还会在这层追加 mask-image，让两端的标签渐隐（见 RebornTabs.vue 的 scrollMaskClass）
    navWrapper: "relative min-w-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    // 滚动内容内层：标签列与增加按钮的并排容器，按钮因此紧贴末尾标签（间距 8px 与 nav 的 gap-2 一致）；
    // 代价是标签溢出时按钮跟着滚动，与 uniapp 端行为一致
    scrollBody: "flex",
    // isolate 把下面这套 z-index 关在标签列内部，选中底板与标题的层叠不会外溢到页面其他元素
    list: "relative isolate flex w-max",
    // gap 是标题与关闭图标之间的间距，固定 8px，不随 size 变化
    tab: "group/tab flex shrink-0 cursor-pointer select-none items-center gap-2 whitespace-nowrap transition-colors duration-200 motion-reduce:transition-none",
    // z-[1] 让标题浮在选中底板之上：底板滑过相邻标签时不会把它们的文字盖住
    tabTitle: "relative z-[1] truncate",
    tabClose:
      "relative z-[1] -mr-1 inline-flex shrink-0 items-center justify-center rounded-sm text-gray-6 transition-colors hover:bg-gray-2 hover:text-gray-9 motion-reduce:transition-none",
    // 指示器位置由组件测量标题后写入行内样式，这里只负责形态与过渡；底色由 color 变体给
    indicator:
      "pointer-events-none absolute rounded-full transition-all duration-300 ease-out motion-reduce:transition-none",
    // 三种卡片类型的选中底板：位置与尺寸由组件测量选中标签后写入行内样式，这里只负责形态与过渡。
    // z-0 在标签列的层叠上下文里恰好压住所有标签的背景与边框（标签本身不定位，属于更下层），
    // 又被 z-[1] 的标题压在下面，于是底板能从旧标签滑到新标签而不遮挡沿途的文字
    tabSlider:
      "pointer-events-none absolute z-0 transition-all duration-300 ease-out motion-reduce:transition-none",
    // 增加按钮整体复用未选中标签的盒子样式（见 RebornTabs.vue 的 addButtonClass），
    // 这里只补图标按钮特有的部分：去掉标题用的水平内边距、改为居中摆放图标
    addButton: "justify-center px-0",
    // 溢出导航按钮（箭头 / 下拉开关）：不复用标签盒子，是一枚固定尺寸的幽灵图标按钮，
    // 仅在标签真正溢出时渲染，禁用态（已滚到端点）压掉悬浮反馈
    navButton:
      "flex size-6 shrink-0 cursor-pointer select-none items-center justify-center rounded-md text-gray-6 transition-colors duration-200 hover:bg-gray-2 hover:text-gray-9 disabled:cursor-not-allowed disabled:text-gray-4 disabled:hover:bg-transparent motion-reduce:transition-none",
    // 下拉选标的定位锚点：面板相对开关按钮摆放，展开方向见 position 变体
    dropdown: "relative flex shrink-0 items-center",
    // 投影取 reborn-context-menu 同款：菜单类面板的统一投影，比 shadow-lg 更看得出悬浮感
    dropdownPanel:
      "absolute z-10 flex max-h-64 min-w-32 flex-col overflow-auto rounded-lg border border-gray-3 bg-gray-1 p-1 shadow-[0_2px_16px_0_rgba(1,27,70,0.1)]",
    // 下拉选标的单个选项，选中 / 禁用态与标签共用 active / disabled 变体
    dropdownItem:
      "flex w-full shrink-0 cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-left text-sm text-gray-9 transition-colors duration-200 hover:bg-gray-2 motion-reduce:transition-none",
    // 头部两侧的额外内容：left-extra 在标签列之前、right-extra 在头部末尾，
    // 水平方向即左 / 右，垂直方向（position=left/right）即顶 / 底
    leftExtra: "flex shrink-0 items-center",
    rightExtra: "flex shrink-0 items-center",
    content: "min-w-0 flex-1",
    // 高度过渡锁在这层而不是 content 上：content 带着 position 变体给的单边内边距，
    // 锁在它身上就得把内边距算进目标高度，而 uniapp 端没有 getComputedStyle 可读。
    // 这层不带内边距，量到的进场面板净高就是要写的高度，两端算法同构
    stage: "min-w-0",
    pane: "min-w-0",
  },
  variants: {
    position: {
      top: {
        root: "flex-col",
        nav: "w-full flex-row",
        navWrapper: "overflow-y-hidden",
        scrollBody: "w-max flex-row items-center gap-2",
        list: "flex-row items-end",
        indicator: "bottom-0 h-[2px]",
        content: "pt-4",
        dropdownPanel: "right-0 top-full mt-2",
      },
      bottom: {
        root: "flex-col-reverse",
        nav: "w-full flex-row",
        navWrapper: "overflow-y-hidden",
        scrollBody: "w-max flex-row items-center gap-2",
        list: "flex-row items-start",
        indicator: "top-0 h-[2px]",
        content: "pb-4",
        dropdownPanel: "bottom-full right-0 mb-2",
      },
      left: {
        root: "flex-row",
        nav: "flex-col items-stretch",
        navWrapper: "overflow-x-hidden",
        scrollBody: "w-full flex-col items-stretch gap-2",
        list: "w-full flex-col items-stretch",
        indicator: "right-0 w-[2px]",
        content: "pl-4",
        dropdownPanel: "left-0 top-full mt-2",
      },
      right: {
        root: "flex-row-reverse",
        nav: "flex-col items-stretch",
        navWrapper: "overflow-x-hidden",
        scrollBody: "w-full flex-col items-stretch gap-2",
        list: "w-full flex-col items-stretch",
        indicator: "left-0 w-[2px]",
        content: "pr-4",
        dropdownPanel: "right-0 top-full mt-2",
      },
    },
    type: {
      // line 与 text 不画盒子，标签之间靠 32px 间距拉开，标签本身不留水平内边距
      "line": { list: "gap-8" },
      "text": { list: "gap-8" },
      // card 不画边框：相邻标签靠 gap-0 直接相接成一排，只有选中底板是 gray-1 的亮块
      "card": { list: "gap-0" },
      "card-gutter": { list: "gap-1", tab: "rounded-t-md border border-gray-3" },
      // card-fill 不画边框，只有选中项有底色，标签之间靠各自 16px 内边距拉开
      "card-fill": { list: "gap-0" },
      // rounded / capsule 的悬浮底色瞬时切换、只让文字色过渡：底板的滑动才是「切换动画」，
      // 悬停不该有任何动效；文字色保留 150ms 过渡（与底板 110ms 行程同量级）是为了在行程中遮住 rounded 反白文字的空档
      "rounded": { list: "gap-1", tab: "rounded-full transition-[color] duration-150" },
      "capsule": { list: "gap-1 rounded-full bg-gray-2 p-1", tab: "rounded-full transition-[color] duration-150" },
    },
    // 此处高度是 line、text 的高度；卡片与胶囊类型另有更矮的盒子高度，见 compoundVariants
    // 字号：sm / md 的 text-base 14px、lg 的 text-lg 16px，三档全部取自本仓库七级排版令牌
    // （见 app/assets/theme/typography.css），text-base 在本仓库是 14px 而非 Tailwind 默认的 16px。
    // sm 的 40px 由原 small 档的 38px 规整而来，换成 Tailwind 原生刻度 h-10：
    // 纵向 line 那侧的内边距按 (标签高 - 行高) / 2 算恰好是已写死的 9px，38px 时差 1px
    // addButton 只写宽度，高度与字号都从标签样式继承；宽度逐档镜像标签高度，保证按钮是正方形
    // （不用 aspect-square：uniapp 端小程序支持不稳，两端统一写死宽度以便对照）
    size: {
      sm: {
        tab: "h-10 text-base",
        tabClose: "size-4",
        addButton: "w-10",
      },
      md: {
        tab: "h-12 text-base",
        tabClose: "size-4",
        addButton: "w-12",
      },
      lg: {
        tab: "h-14 text-lg",
        tabClose: "size-[18px]",
        addButton: "w-14",
      },
    },
    // 强调色直接落成语义类名，不再经由组件私有的 CSS 变量中转（与本仓库其余组件一致）。
    // 这里只能写「无条件生效」的两处：指示条底色、悬浮文字色；
    // 选中文字色与 rounded 底板色都要跨 active / type 取值，见下面的 compoundVariants。
    // 悬浮色放在这里而不是 active.false 上：除 rounded 外各类型的选中文字本就是同一个强调色，
    // 选中项悬停与否看不出差别；rounded 的选中文字是反白的，由它自己把悬浮色压回 gray-1
    color: {
      primary: { indicator: "bg-primary", tab: "hover:text-primary" },
      secondary: { indicator: "bg-secondary", tab: "hover:text-secondary" },
      success: { indicator: "bg-success", tab: "hover:text-success" },
      info: { indicator: "bg-info", tab: "hover:text-info" },
      warning: { indicator: "bg-warning", tab: "hover:text-warning" },
      error: { indicator: "bg-error", tab: "hover:text-error" },
      // --color-neutral 是 gray-4 / gray-5 的浅灰，当强调色看不清，这里改取 gray-9
      neutral: { indicator: "bg-gray-9", tab: "hover:text-gray-9" },
    },
    active: {
      // 选中文字色要按 color 档取值，见下面的 color × active 组合
      true: { tab: "font-medium", dropdownItem: "font-medium" },
      false: { tab: "text-gray-9" },
    },
    disabled: {
      true: {
        tab: "cursor-not-allowed text-gray-5 hover:text-gray-5",
        dropdownItem: "cursor-not-allowed text-gray-5 hover:bg-transparent hover:text-gray-5",
      },
    },
    /** 头部与内容之间是否有分隔线，由组件按 type 推导 */
    divider: {
      true: {},
    },
    /**
     * 标签宽度自撑开：标签用 grow 均分头部宽度，标题居中。由组件限定仅水平方向生效
     * （纵向标签本就 items-stretch 撑满列宽）。grow 不带 shrink-basis-0，
     * 标签总宽超出容器时保持自然宽度照常滚动，不会把标题挤到截断
     */
    stretch: {
      true: { scrollBody: "w-full", list: "min-w-0 flex-1", tab: "grow justify-center" },
    },
    /**
     * 选中标签处在标签列的哪一端，由组件按选中项下标推导，只用于 card 类型选中底板的圆角。
     * 底板是标签列的兄弟节点而非首尾子节点，用不了标签那套 first:/last:，只能显式分端
     */
    edge: {
      first: {},
      last: {},
      both: {},
      middle: {},
    },
    /**
     * 单个标签在列中的位置，由组件按下标推导，用于 card 类型的首末圆角。
     * 不能用 first:/last: 伪类：滑动底板与指示器作为列内末位兄弟节点，
     * :last-child 永远落不到最后一个标签上，末位圆角会静默失效
     */
    tabPlace: {
      first: {},
      last: {},
      both: {},
      middle: {},
    },
    /** 头部水平边距，仅 line、text 类型生效 */
    headerPadding: {
      true: {},
    },
    /** 高度撑满容器，仅水平方向生效；stage 这层要一起撑开，否则版式会被它截断 */
    justify: {
      true: { root: "h-full", content: "flex min-h-0 flex-col", stage: "flex min-h-0 flex-1 flex-col" },
    },
    /**
     * 开启内容过渡动画时 stage 需要定位上下文，离场面板才能靠 absolute inset-0 与入场面板重叠；
     * 高度过渡也挂在这里，切换时组件把量到的高度写进行内样式，过渡完再释放回 auto
     */
    animation: {
      true: { stage: "relative transition-[height] duration-[280ms] ease-out motion-reduce:transition-none" },
    },
  },
  compoundVariants: [
    // 分隔线贴着内容侧，随头部位置换边；色阶与卡片边框、nav 内阴影统一取 gray-3（与 uniapp 端一致）
    { divider: true, position: "top", class: { nav: "border-b border-gray-3" } },
    { divider: true, position: "bottom", class: { nav: "border-t border-gray-3" } },
    { divider: true, position: "left", class: { nav: "border-r border-gray-3" } },
    { divider: true, position: "right", class: { nav: "border-l border-gray-3" } },
    // 两种卡片类型的选中标签都要盖住这条分隔线，但头部滚动容器 overflow-auto 会裁掉溢出的 1px，
    // 所以改用内阴影把线画进 nav 自身最后 1px：它属于背景层，标签背景天然盖在上面，无需外移
    {
      divider: true,
      type: ["card", "card-gutter"],
      position: "top",
      class: { nav: "border-b-0 shadow-[inset_0_-1px_0_0_var(--color-gray-3)]" },
    },
    {
      divider: true,
      type: ["card", "card-gutter"],
      position: "bottom",
      class: { nav: "border-t-0 shadow-[inset_0_1px_0_0_var(--color-gray-3)]" },
    },
    {
      divider: true,
      type: ["card", "card-gutter"],
      position: "left",
      class: { nav: "border-r-0 shadow-[inset_-1px_0_0_0_var(--color-gray-3)]" },
    },
    {
      divider: true,
      type: ["card", "card-gutter"],
      position: "right",
      class: { nav: "border-l-0 shadow-[inset_1px_0_0_0_var(--color-gray-3)]" },
    },
    // ===== 纵向（position=left/right）的排版，只对 line 与 text 生效 =====
    // 横向那一套在纵向全部换掉：标签高度交还给内容（h-auto，不再吃 size 轴的 40/48/56px），
    // 宽度不写死、由最长的标题撑开列宽，标签之间的间距从横向的 32px 收到 16px。
    // 于是 size 在纵向只剩一处体现：标题与列缘指示条之间的那段内边距。
    // 它不再由「标签高 - 行高」推导，而是逐档写死 8 / 12 / 16px——纵向的标签被
    // items-stretch 撑满列宽，最宽的标题会直接贴上指示条，这段内边距是唯一的呼吸空间
    {
      position: ["left", "right"],
      type: ["line", "text"],
      class: { tab: "h-auto", list: "gap-4" },
    },
    { position: "left", type: "line", size: "sm", class: { tab: "pr-2" } },
    { position: "left", type: "line", size: "md", class: { tab: "pr-3" } },
    { position: "left", type: "line", size: "lg", class: { tab: "pr-4" } },
    { position: "right", type: "line", size: "sm", class: { tab: "pl-2" } },
    { position: "right", type: "line", size: "md", class: { tab: "pl-3" } },
    { position: "right", type: "line", size: "lg", class: { tab: "pl-4" } },
    // 盒子型标签靠内边距撑开；line 与 text 只靠 list 的 32px 间距分隔，不留内边距。
    // 三档统一 16px：原先只有已删除的 mini 档收到 8px，size 轴至此不再需要
    { type: ["rounded", "capsule"], class: { tab: "px-4" } },
    // 三种卡片类型的内边距不随尺寸变化：标签之间没有间距或只有 4px，全靠这 16px 拉开标题
    { type: ["card", "card-gutter", "card-fill"], class: { tab: "px-4" } },
    // 盒子型标签不跟随 line 的行高，固定 40px，sm 收到 32px；addButton 宽度同步跟上保持正方形
    {
      type: ["card", "card-gutter", "rounded", "capsule"],
      size: ["md", "lg"],
      class: { tab: "h-10", addButton: "w-10" },
    },
    {
      type: ["card", "card-gutter", "rounded", "capsule"],
      size: "sm",
      class: { tab: "h-8", addButton: "w-8" },
    },
    // card-fill 比其余卡片再矮一档：只有 lg 是 40px，md 与 sm 都收到 32px
    { type: "card-fill", size: "lg", class: { tab: "h-10", addButton: "w-10" } },
    { type: "card-fill", size: ["sm", "md"], class: { tab: "h-8", addButton: "w-8" } },
    // card 类型相邻标签无边框直接相接成一排，只在背离内容的两个角保留 6px 圆角（首末位置由 tabPlace 显式判定）；
    // 增加按钮不在标签列内、与标签列之间隔着 8px，首尾圆角规则对它不成立，改为整条背离内容的边都倒角
    { type: "card", position: "top", class: { addButton: "rounded-t-md" } },
    { type: "card", position: "top", tabPlace: ["first", "both"], class: { tab: "rounded-tl-md" } },
    { type: "card", position: "top", tabPlace: ["last", "both"], class: { tab: "rounded-tr-md" } },
    { type: "card", position: "bottom", class: { addButton: "rounded-b-md" } },
    { type: "card", position: "bottom", tabPlace: ["first", "both"], class: { tab: "rounded-bl-md" } },
    { type: "card", position: "bottom", tabPlace: ["last", "both"], class: { tab: "rounded-br-md" } },
    { type: "card", position: ["left", "right"], class: { addButton: "rounded-md" } },
    { type: "card", position: ["left", "right"], tabPlace: ["first", "both"], class: { tab: "rounded-t-md" } },
    { type: "card", position: ["left", "right"], tabPlace: ["last", "both"], class: { tab: "rounded-b-md" } },
    // ===== 三种卡片类型的选中态：底色、边框、圆角全部交给 tabSlider 这块底板 =====
    // 标签自身的底色不再随选中变化。若仍由标签自己换底色，切换瞬间旧标签会立刻变灰、
    // 新标签会立刻变亮，底板还没滑到人眼就已经看完了结果，滑动也就没了意义；
    // 选中标签的底色整块被底板盖住，看不见，也就不必为它单独换色
    { type: ["card", "card-gutter"], class: { tab: "bg-gray-2" } },
    {
      type: ["card", "card-gutter", "card-fill"],
      active: true,
      // 文字色由下面的 color × active 组合统一给，这里只加粗
      class: { tab: "font-bold" },
    },
    // card 的底板与标签一样不画边框，只靠 gray-1 亮块区分选中；card-gutter 保留 gray-3 边框撑出卡片轮廓
    { type: "card", class: { tabSlider: "bg-gray-1" } },
    { type: "card-gutter", class: { tabSlider: "border border-gray-3 bg-gray-1" } },
    // card-fill 不用边框也不用分隔线区分头部与内容：未选中只是文字，底板铺与内容区同一档的
    // gray-2 底色，两块背景直接连成一片，所以内容区也要跟着铺 gray-2
    { type: "card-fill", class: { tabSlider: "bg-gray-1", content: "bg-gray-1 p-4" } },
    // card-gutter 的底板去掉贴着内容那一侧的边框，让自身底色吃掉 nav 内阴影画的那条线，与内容连成一体
    //（card 已无边框，底板的不透明底色本身就盖住了那条线）。
    // 这里不能改用负外边距外移：标签列是 items-end 对齐，负外边距会把选中项整体压低 1px，
    // 相邻标签的顶边就会高出一截，且外移的部分也会被滚动容器裁掉
    { type: "card-gutter", position: "top", class: { tabSlider: "border-b-0" } },
    { type: "card-gutter", position: "bottom", class: { tabSlider: "border-t-0" } },
    { type: "card-gutter", position: "left", class: { tabSlider: "border-r-0" } },
    { type: "card-gutter", position: "right", class: { tabSlider: "border-l-0" } },
    // 圆角只开在背离内容的那一侧，贴着内容的两个角保持直角才能与内容区无缝拼接。
    // card-gutter 每张卡片形态一致，底板照搬标签的圆角即可
    { type: "card-gutter", class: { tabSlider: "rounded-t-md" } },
    { type: "card-fill", position: "top", class: { tabSlider: "rounded-t-md" } },
    { type: "card-fill", position: "bottom", class: { tabSlider: "rounded-b-md" } },
    { type: "card-fill", position: "left", class: { tabSlider: "rounded-l-md" } },
    { type: "card-fill", position: "right", class: { tabSlider: "rounded-r-md" } },
    // card 的圆角按标签在列中的首尾分配，底板滑到哪一端就取哪一端的圆角，滑到中间段是直角；
    // 圆角本身也参与过渡，所以从首个标签滑向中间时能看到外角逐渐收平
    { type: "card", position: "top", edge: "first", class: { tabSlider: "rounded-tl-md" } },
    { type: "card", position: "top", edge: "last", class: { tabSlider: "rounded-tr-md" } },
    { type: "card", position: "top", edge: "both", class: { tabSlider: "rounded-t-md" } },
    { type: "card", position: "bottom", edge: "first", class: { tabSlider: "rounded-bl-md" } },
    { type: "card", position: "bottom", edge: "last", class: { tabSlider: "rounded-br-md" } },
    { type: "card", position: "bottom", edge: "both", class: { tabSlider: "rounded-b-md" } },
    {
      type: "card",
      position: ["left", "right"],
      edge: "first",
      class: { tabSlider: "rounded-t-md" },
    },
    {
      type: "card",
      position: ["left", "right"],
      edge: "last",
      class: { tabSlider: "rounded-b-md" },
    },
    {
      type: "card",
      position: ["left", "right"],
      edge: "both",
      class: { tabSlider: "rounded-md" },
    },
    // ===== 选中态的文字色：按 color 档取对应语义色 =====
    // 写不进 active.true，那里拿不到当前 color；必须排在下面 rounded 的反白规则之前，
    // compoundVariants 按数组顺序合并，排在后面的 text-gray-1 才能盖住这里的强调色
    // dropdownItem 与标签取同一档选中文字色，下拉选标里的当前项才与头部呼应
    { color: "primary", active: true, class: { tab: "text-primary", dropdownItem: "text-primary" } },
    { color: "secondary", active: true, class: { tab: "text-secondary", dropdownItem: "text-secondary" } },
    { color: "success", active: true, class: { tab: "text-success", dropdownItem: "text-success" } },
    { color: "info", active: true, class: { tab: "text-info", dropdownItem: "text-info" } },
    { color: "warning", active: true, class: { tab: "text-warning", dropdownItem: "text-warning" } },
    { color: "error", active: true, class: { tab: "text-error", dropdownItem: "text-error" } },
    { color: "neutral", active: true, class: { tab: "text-gray-9", dropdownItem: "text-gray-9" } },
    // ===== 实心与分段胶囊的选中态：底色同样搬到 tabSlider 这块底板上 =====
    // rounded 的选中文字是近白的 gray-1，浅色模式下只有踩在主题色底板上才看得见。
    // 底板从旧标签滑到新标签的这段行程里，两个标签的文字都处在反色状态，
    // 所以行程中底板必须同时覆盖它们 —— 见 RebornTabs.vue 的 runLiquid：
    // 阶段 A 把底板主轴区间拉成两个标签的并集，阶段 B 才收拢到目标标签
    { type: "rounded", class: { tabSlider: "rounded-full" } },
    { color: "primary", type: "rounded", class: { tabSlider: "bg-primary" } },
    { color: "secondary", type: "rounded", class: { tabSlider: "bg-secondary" } },
    { color: "success", type: "rounded", class: { tabSlider: "bg-success" } },
    { color: "info", type: "rounded", class: { tabSlider: "bg-info" } },
    { color: "warning", type: "rounded", class: { tabSlider: "bg-warning" } },
    { color: "error", type: "rounded", class: { tabSlider: "bg-error" } },
    { color: "neutral", type: "rounded", class: { tabSlider: "bg-gray-9" } },
    // 选中的反白文字连悬浮态一起压住：color 变体给的 hover:text-* 是无条件的，
    // 不在这里压回 gray-1，鼠标移上去就会变成主题色踩主题色底板，文字直接消失
    { type: "rounded", active: true, class: { tab: "text-gray-1 hover:text-gray-1" } },
    // capsule 的选中文字沿用上面 color × active 给的主题色，这里只搬底色与投影
    { type: "capsule", class: { tabSlider: "rounded-full bg-gray-1 shadow-sm" } },
    { type: ["rounded", "capsule"], active: false, class: { tab: "hover:bg-gray-2" } },
    { type: "capsule", active: false, class: { tab: "hover:bg-gray-3" } },
    // 禁用态放在最后，压过卡片与胶囊的选中配色和悬浮反馈
    {
      disabled: true,
      class: { tab: "text-gray-5 hover:bg-transparent hover:text-gray-5" },
    },
  ],
  defaultVariants: {
    position: "top",
    type: "line",
    size: "md",
    color: "primary",
    active: false,
    edge: "middle",
    tabPlace: "middle",
  },
});

export default theme;
