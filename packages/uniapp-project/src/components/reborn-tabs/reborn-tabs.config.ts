import type { ClassValue } from 'clsx'
import type { ComputedRef } from 'vue'
import { tv } from '@/lib/tv'

/** 父子组件通信用的 provide/inject 键 */
export const TABS_INJECTION_KEY = 'reborn-tabs'

const tabsTypes = ['line', 'card', 'card-gutter', 'card-fill', 'text', 'rounded', 'capsule'] as const
const tabsSizes = ['mini', 'small', 'medium', 'large'] as const
const tabsPositions = ['top', 'bottom', 'left', 'right'] as const
const tabsDirections = ['horizontal', 'vertical'] as const
const tabsTriggers = ['click', 'hover'] as const
const tabsColors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
] as const

export { tabsColors, tabsDirections, tabsPositions, tabsSizes, tabsTriggers, tabsTypes }

/** 选项卡类型：line 下划线 / card 相接卡片 / card-gutter 间隔卡片 / card-fill 无边框填充卡片 / text 纯文本 / rounded 圆角胶囊 / capsule 分段胶囊 */
export type TabsType = (typeof tabsTypes)[number]
/** 选项卡尺寸 */
export type TabsSize = (typeof tabsSizes)[number]
/** 选项卡头部所在的位置 */
export type TabsPosition = (typeof tabsPositions)[number]
/** 选项卡方向：vertical 等价于把头部放到侧边 */
export type TabsDirection = (typeof tabsDirections)[number]
/** 标签切换的触发方式，hover 仅 H5 生效 */
export type TabsTrigger = (typeof tabsTriggers)[number]
/** 选项卡主题色 */
export type TabsColor = (typeof tabsColors)[number]
/** 标签唯一标识 */
export type TabKey = string | number

/** 单个标签页登记到父级的元信息，父级据此渲染头部 */
export interface TabPaneMeta {
  /** 标签唯一标识，取自 tab-pane 的 key 属性；未写 key 时由父级按登记顺序补序号 */
  key: TabKey
  /** 标题文本 */
  title?: string
  /** 是否禁用 */
  disabled: boolean
  /** 可编辑模式下是否允许关闭 */
  closable: boolean
  /** 不显示时是否销毁内容 */
  destroyOnHide: boolean
}

/** 父级下发给 tab-pane 的上下文 */
export interface TabsContext {
  /** 当前选中的标签 key */
  activeKey: ComputedRef<TabKey | undefined>
  /** 首次展示时才挂载内容 */
  lazyLoad: ComputedRef<boolean>
  /** 父级统一配置的销毁策略，与单个标签页的配置取或 */
  destroyOnHide: ComputedRef<boolean>
  /** 是否开启内容过渡动画 */
  animation: ComputedRef<boolean>
  /** 内容区面板的样式类 */
  paneClass: ComputedRef<string>
  /** 登记标签页，未写 key 的会在此补上序号 */
  addPane: (meta: TabPaneMeta) => void
  /** 注销标签页 */
  removePane: (meta: TabPaneMeta) => void
}

/** 可覆盖的样式区域 */
export type TabsUI = Partial<{
  root: ClassValue
  nav: ClassValue
  navWrapper: ClassValue
  list: ClassValue
  tab: ClassValue
  tabTitle: ClassValue
  tabClose: ClassValue
  indicator: ClassValue
  tabSlider: ClassValue
  addButton: ClassValue
  extra: ClassValue
  content: ClassValue
  stage: ClassValue
  pane: ClassValue
}>

const theme = tv({
  slots: {
    // reborn-tabs 是 createSelectorQuery 的容器锚点，不能删
    root: 'reborn-tabs flex w-full min-w-0',
    nav: 'relative flex shrink-0 flex-row items-center gap-[16rpx]',
    // reborn-tabs__scroll 是量取滚动偏移的锚点，不能删
    navWrapper: 'reborn-tabs__scroll relative min-w-0 flex-1',
    // isolate 把下面这套 z-index 关在标签列内部，选中底板与标题的层叠不会外溢到页面其他元素
    list: 'relative isolate flex w-max',
    // 量取标签矩形的锚点 reborn-tabs__item 写在模板的标签节点上，不能并进这里：
    // 增加按钮会整体复用本槽的样式，锚点跟着进来会被 selectAll 当成一个标签量进去
    // gap 是标题与关闭图标之间的间距，固定 16rpx，不随 size 变化
    tab: 'flex shrink-0 flex-row items-center gap-[16rpx] whitespace-nowrap transition-colors duration-200',
    // reborn-tabs__title 是量取下划线宽度的锚点，不能删
    // z-[1] 让标题浮在选中底板之上：底板滑过相邻标签时不会把它们的文字盖住
    tabTitle: 'reborn-tabs__title relative z-[1] overflow-hidden whitespace-nowrap',
    tabClose: 'i-lucide-x relative z-[1] shrink-0 text-gray-6 transition-colors',
    // 指示器位移与长度由组件量取后写成行内样式，这里只负责形态与过渡
    indicator:
      'pointer-events-none absolute rounded-full bg-[var(--re-tabs-color)] transition-all duration-300 ease-out will-change-transform',
    // 三种卡片类型的选中底板：主轴位移与长度由组件量取选中标签后写成行内样式，交叉轴由 position
    // 变体钉住（同一 size 下所有标签等高，纵向标签列又是 items-stretch，交叉轴无需测量）。
    // z-0 在标签列的层叠上下文里恰好压住所有标签的背景与边框（标签本身不定位，属于更下层），
    // 又被 z-[1] 的标题压在下面，于是底板能从旧标签滑到新标签而不遮挡沿途的文字
    tabSlider:
      'pointer-events-none absolute z-0 transition-all duration-300 ease-out will-change-transform',
    // 增加按钮整体复用未选中标签的盒子样式（见 RebornTabs.vue 的 addButtonClass），
    // 这里只补图标按钮特有的部分：去掉标题用的水平内边距、改为居中摆放图标
    addButton: 'justify-center px-0',
    extra: 'flex shrink-0 flex-row items-center',
    content: 'min-w-0 flex-1',
    // 高度过渡锁在这层而不是 content 上：content 带着 position 变体给的单边内边距，
    // 锁在它身上就得把 32rpx 内边距硬编码进 JS（小程序端没有 getComputedStyle 可读）。
    // 这层不带内边距，量到的进场面板净高就是要写的高度，与 web 端算法同构。
    // reborn-tabs__stage 是量取内容高度的锚点，不能删
    stage: 'reborn-tabs__stage min-w-0',
    pane: 'min-w-0',
  },
  variants: {
    position: {
      top: {
        root: 'flex-col',
        nav: 'w-full flex-row',
        list: 'flex-row items-end',
        indicator: 'bottom-0 left-0 h-[4rpx]',
        // 横向标签列的高度就是标签高度，交叉轴直接钉满；left-0 是 translateX 的起算点
        tabSlider: 'inset-y-0 left-0',
        content: 'pt-[32rpx]',
      },
      bottom: {
        root: 'flex-col-reverse',
        nav: 'w-full flex-row',
        list: 'flex-row items-start',
        indicator: 'left-0 top-0 h-[4rpx]',
        tabSlider: 'inset-y-0 left-0',
        content: 'pb-[32rpx]',
      },
      left: {
        root: 'flex-row',
        nav: 'h-full flex-col items-stretch',
        list: 'w-full flex-col items-stretch',
        indicator: 'right-0 top-0 w-[4rpx]',
        // 纵向标签列是 items-stretch，标签宽度等于列宽，交叉轴同样直接钉满
        tabSlider: 'inset-x-0 top-0',
        content: 'pl-[32rpx]',
      },
      right: {
        root: 'flex-row-reverse',
        nav: 'h-full flex-col items-stretch',
        list: 'w-full flex-col items-stretch',
        indicator: 'left-0 top-0 w-[4rpx]',
        tabSlider: 'inset-x-0 top-0',
        content: 'pr-[32rpx]',
      },
    },
    type: {
      // line 与 text 不画盒子，标签之间靠 64rpx 间距拉开，标签本身不留水平内边距
      'line': { list: 'gap-[64rpx]' },
      'text': { list: 'gap-[64rpx]' },
      'card': { list: 'gap-0', tab: 'border border-gray-3' },
      'card-gutter': {
        list: 'gap-[8rpx]',
        tab: 'rounded-t-ui-xs border border-gray-3',
      },
      // card-fill 不画边框，只有选中项有底色，标签之间靠各自 32rpx 内边距拉开
      'card-fill': { list: 'gap-0' },
      'rounded': { list: 'gap-[8rpx]', tab: 'rounded-full' },
      'capsule': { list: 'gap-[8rpx] rounded-full bg-gray-2 p-[8rpx]', tab: 'rounded-full' },
    },
    // 此处高度是 line、text 的高度；卡片与胶囊类型另有更矮的盒子高度，见 compoundVariants
    // addButton 只写宽度，高度与字号都从标签样式继承；宽度逐档镜像标签高度，保证按钮是正方形
    // （不用 aspect-square：小程序支持不稳，与 reborn-button 的做法保持一致）
    size: {
      mini: {
        tab: 'h-[48rpx] text-24',
        tabClose: 'size-[28rpx]',
        addButton: 'w-[48rpx]',
      },
      small: {
        tab: 'h-[76rpx] text-28',
        tabClose: 'size-[32rpx]',
        addButton: 'w-[76rpx]',
      },
      medium: {
        tab: 'h-[96rpx] text-28',
        tabClose: 'size-[32rpx]',
        addButton: 'w-[96rpx]',
      },
      large: {
        tab: 'h-[112rpx] text-32',
        tabClose: 'size-[36rpx]',
        addButton: 'w-[112rpx]',
      },
    },
    color: {
      primary: { root: '[--re-tabs-color:var(--color-primary)]' },
      secondary: { root: '[--re-tabs-color:var(--color-secondary)]' },
      success: { root: '[--re-tabs-color:var(--color-success)]' },
      info: { root: '[--re-tabs-color:var(--color-info)]' },
      warning: { root: '[--re-tabs-color:var(--color-warning)]' },
      error: { root: '[--re-tabs-color:var(--color-error)]' },
      neutral: { root: '[--re-tabs-color:var(--color-gray-9)]' },
    },
    active: {
      true: { tab: 'font-medium text-[var(--re-tabs-color)]' },
      false: { tab: 'text-gray-9' },
    },
    disabled: {
      true: { tab: 'text-gray-5' },
    },
    /** 头部与内容之间是否有分隔线，由组件按 type 推导 */
    divider: {
      true: {},
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
      true: {
        root: 'h-full',
        content: 'flex min-h-0 flex-col',
        stage: 'flex min-h-0 flex-1 flex-col',
      },
    },
    /**
     * 开启内容过渡动画时面板做透明度、缩放与位移的复合过渡（小程序端渲染层对 filter: blur
     * 支持不稳，不加模糊，这点与 web 端不同）；高度过渡挂在 stage 上，切换时组件把量到的
     * 高度写进行内样式，过渡完再释放
     */
    animation: {
      true: {
        stage: 'transition-[height] duration-[280ms] ease-out',
        pane: 'transition-[opacity,transform] duration-[260ms] ease-out',
      },
    },
  },
  compoundVariants: [
    // 分隔线贴着内容侧，随头部位置换边
    { divider: true, position: 'top', class: { nav: 'border-b border-gray-3' } },
    { divider: true, position: 'bottom', class: { nav: 'border-t border-gray-3' } },
    { divider: true, position: 'left', class: { nav: 'border-r border-gray-3' } },
    { divider: true, position: 'right', class: { nav: 'border-l border-gray-3' } },
    // 两种卡片类型的选中标签都要盖住这条分隔线，但头部滚动容器会裁掉溢出的 1px，
    // 所以改用内阴影把线画进 nav 自身最后 1px：它属于背景层，标签背景天然盖在上面，无需外移
    {
      divider: true,
      type: ['card', 'card-gutter'],
      position: 'top',
      class: { nav: 'border-b-0 shadow-[inset_0_-1px_0_0_var(--color-gray-3)]' },
    },
    {
      divider: true,
      type: ['card', 'card-gutter'],
      position: 'bottom',
      class: { nav: 'border-t-0 shadow-[inset_0_1px_0_0_var(--color-gray-3)]' },
    },
    {
      divider: true,
      type: ['card', 'card-gutter'],
      position: 'left',
      class: { nav: 'border-r-0 shadow-[inset_-1px_0_0_0_var(--color-gray-3)]' },
    },
    {
      divider: true,
      type: ['card', 'card-gutter'],
      position: 'right',
      class: { nav: 'border-l-0 shadow-[inset_1px_0_0_0_var(--color-gray-3)]' },
    },
    // 盒子型标签靠内边距撑开；line 与 text 只靠 list 的 64rpx 间距分隔，不留内边距
    { type: ['rounded', 'capsule'], size: 'mini', class: { tab: 'px-[16rpx]' } },
    {
      type: ['rounded', 'capsule'],
      size: ['small', 'medium', 'large'],
      class: { tab: 'px-[32rpx]' },
    },
    // 三种卡片类型的内边距不随尺寸变化：标签之间没有间距或只有 8rpx，全靠这 32rpx 拉开标题
    { type: ['card', 'card-gutter', 'card-fill'], class: { tab: 'px-[32rpx]' } },
    // 盒子型标签不跟随 line 的行高，固定 80rpx，small 及以下收到 64rpx；addButton 宽度同步跟上保持正方形
    {
      type: ['card', 'card-gutter', 'rounded', 'capsule'],
      size: ['medium', 'large'],
      class: { tab: 'h-[80rpx]', addButton: 'w-[80rpx]' },
    },
    {
      type: ['card', 'card-gutter', 'rounded', 'capsule'],
      size: 'small',
      class: { tab: 'h-[64rpx]', addButton: 'w-[64rpx]' },
    },
    // card-fill 比其余卡片再矮一档：只有 large 是 80rpx，medium 与 small 都收到 64rpx
    { type: 'card-fill', size: 'large', class: { tab: 'h-[80rpx]', addButton: 'w-[80rpx]' } },
    {
      type: 'card-fill',
      size: ['small', 'medium'],
      class: { tab: 'h-[64rpx]', addButton: 'w-[64rpx]' },
    },
    // card 类型相邻标签共用一条边，只在背离内容的两个角保留圆角（首末位置由 tabPlace 显式判定）；
    // 增加按钮不在标签列内、与标签列之间隔着 16rpx，首尾圆角规则对它不成立，改为整条背离内容的边都倒角
    {
      type: 'card',
      position: 'top',
      class: { list: '[&>*+*]:-ml-px', addButton: 'rounded-t-ui-xs' },
    },
    { type: 'card', position: 'top', tabPlace: ['first', 'both'], class: { tab: 'rounded-tl-ui-xs' } },
    { type: 'card', position: 'top', tabPlace: ['last', 'both'], class: { tab: 'rounded-tr-ui-xs' } },
    {
      type: 'card',
      position: 'bottom',
      class: { list: '[&>*+*]:-ml-px', addButton: 'rounded-b-ui-xs' },
    },
    { type: 'card', position: 'bottom', tabPlace: ['first', 'both'], class: { tab: 'rounded-bl-ui-xs' } },
    { type: 'card', position: 'bottom', tabPlace: ['last', 'both'], class: { tab: 'rounded-br-ui-xs' } },
    {
      type: 'card',
      position: ['left', 'right'],
      class: { list: '[&>*+*]:-mt-px', addButton: 'rounded-ui-xs' },
    },
    { type: 'card', position: ['left', 'right'], tabPlace: ['first', 'both'], class: { tab: 'rounded-t-ui-xs' } },
    { type: 'card', position: ['left', 'right'], tabPlace: ['last', 'both'], class: { tab: 'rounded-b-ui-xs' } },
    // ===== 三种卡片类型的选中态：底色、边框、圆角全部交给 tabSlider 这块底板 =====
    // 标签自身的底色不再随选中变化。若仍由标签自己换底色，切换瞬间旧标签会立刻变灰、
    // 新标签会立刻变亮，底板还没滑到人眼就已经看完了结果，滑动也就没了意义；
    // 选中标签的底色整块被底板盖住，看不见，也就不必为它单独换色
    { type: ['card', 'card-gutter'], class: { tab: 'bg-gray-2' } },
    {
      type: ['card', 'card-gutter', 'card-fill'],
      active: true,
      class: { tab: 'font-bold text-[var(--re-tabs-color)]' },
    },
    { type: ['card', 'card-gutter'], class: { tabSlider: 'border border-gray-3 bg-gray-1' } },
    // card-fill 不用边框也不用分隔线区分头部与内容：未选中只是文字，底板铺与内容区同一档的
    // gray-2 底色，两块背景直接连成一片，所以内容区也要跟着铺 gray-2
    { type: 'card-fill', class: { tabSlider: 'bg-gray-2', content: 'bg-gray-2 p-[32rpx]' } },
    // 底板去掉贴着内容那一侧的边框，让自身底色吃掉 nav 内阴影画的那条线，与内容连成一体。
    // 这里不能改用负外边距外移：标签列是 items-end 对齐，负外边距会把选中项整体压低 1px，
    // 相邻标签的顶边就会高出一截，且外移的部分也会被滚动容器裁掉
    { type: ['card', 'card-gutter'], position: 'top', class: { tabSlider: 'border-b-0' } },
    { type: ['card', 'card-gutter'], position: 'bottom', class: { tabSlider: 'border-t-0' } },
    { type: ['card', 'card-gutter'], position: 'left', class: { tabSlider: 'border-r-0' } },
    { type: ['card', 'card-gutter'], position: 'right', class: { tabSlider: 'border-l-0' } },
    // 圆角只开在背离内容的那一侧，贴着内容的两个角保持直角才能与内容区无缝拼接。
    // card-gutter 每张卡片形态一致，底板照搬标签的圆角即可
    { type: 'card-gutter', class: { tabSlider: 'rounded-t-ui-xs' } },
    { type: 'card-fill', position: 'top', class: { tabSlider: 'rounded-t-ui-xs' } },
    { type: 'card-fill', position: 'bottom', class: { tabSlider: 'rounded-b-ui-xs' } },
    { type: 'card-fill', position: 'left', class: { tabSlider: 'rounded-l-ui-xs' } },
    { type: 'card-fill', position: 'right', class: { tabSlider: 'rounded-r-ui-xs' } },
    // card 的圆角按标签在列中的首尾分配，底板滑到哪一端就取哪一端的圆角，滑到中间段是直角；
    // 圆角本身也参与过渡，所以从首个标签滑向中间时能看到外角逐渐收平
    { type: 'card', position: 'top', edge: 'first', class: { tabSlider: 'rounded-tl-ui-xs' } },
    { type: 'card', position: 'top', edge: 'last', class: { tabSlider: 'rounded-tr-ui-xs' } },
    { type: 'card', position: 'top', edge: 'both', class: { tabSlider: 'rounded-t-ui-xs' } },
    { type: 'card', position: 'bottom', edge: 'first', class: { tabSlider: 'rounded-bl-ui-xs' } },
    { type: 'card', position: 'bottom', edge: 'last', class: { tabSlider: 'rounded-br-ui-xs' } },
    { type: 'card', position: 'bottom', edge: 'both', class: { tabSlider: 'rounded-b-ui-xs' } },
    {
      type: 'card',
      position: ['left', 'right'],
      edge: 'first',
      class: { tabSlider: 'rounded-t-ui-xs' },
    },
    {
      type: 'card',
      position: ['left', 'right'],
      edge: 'last',
      class: { tabSlider: 'rounded-b-ui-xs' },
    },
    {
      type: 'card',
      position: ['left', 'right'],
      edge: 'both',
      class: { tabSlider: 'rounded-ui-xs' },
    },
    // ===== 实心与分段胶囊的选中态：底色同样搬到 tabSlider 这块底板上 =====
    // rounded 的选中文字是近白的 gray-1，浅色模式下只有踩在主题色底板上才看得见。
    // 底板从旧标签滑到新标签的这段行程里，两个标签的文字都处在反色状态，
    // 所以行程中底板必须同时覆盖它们 —— 见 RebornTabs.vue 的 runLiquid：
    // 阶段 A 把底板主轴区间拉成两个标签的并集，阶段 B 才收拢到目标标签
    { type: 'rounded', class: { tabSlider: 'rounded-full bg-[var(--re-tabs-color)]' } },
    { type: 'rounded', active: true, class: { tab: 'text-gray-1' } },
    // capsule 的选中文字沿用 active 变体给的主题色，这里只搬底色与投影
    { type: 'capsule', class: { tabSlider: 'rounded-full bg-gray-1 shadow-sm' } },
    // 头部边距只在 line、text 上生效，且随方向切换轴向
    {
      headerPadding: true,
      type: ['line', 'text'],
      position: ['top', 'bottom'],
      class: { list: 'px-[32rpx]' },
    },
    {
      headerPadding: true,
      type: ['line', 'text'],
      position: ['left', 'right'],
      class: { list: 'py-[16rpx]' },
    },
    // 禁用态放在最后，压过卡片与胶囊的选中配色
    { disabled: true, class: { tab: 'text-gray-5' } },
  ],
  defaultVariants: {
    position: 'top',
    type: 'line',
    size: 'medium',
    color: 'primary',
    active: false,
    edge: 'middle',
    tabPlace: 'middle',
  },
})

export default theme
