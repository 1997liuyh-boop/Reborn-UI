import type { ClassValue } from 'tailwind-variants';
import { tv } from '~/lib/tv';

export const stepsDirections = ['horizontal', 'vertical'] as const;
export const stepsPlacements = ['top', 'bottom', 'left', 'right'] as const;
export const stepsStatuses = ['wait', 'process', 'finish', 'error', 'success'] as const;
export const stepsSizes = ['sm', 'md', 'lg'] as const;
export const stepsTypes = ['default', 'dot', 'text'] as const;
export const stepsLineTypes = ['solid', 'dashed', 'arrow'] as const;
export const stepsColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
export type StepsDirection = (typeof stepsDirections)[number];
export type StepsPlacement = (typeof stepsPlacements)[number];
export type StepsStatus = (typeof stepsStatuses)[number];
export type StepsSize = (typeof stepsSizes)[number];
export type StepsType = (typeof stepsTypes)[number];
export type StepsLineType = (typeof stepsLineTypes)[number];
export type StepsColor = (typeof stepsColors)[number];

/** 父级覆盖向子项级联，子项同名覆盖的优先级更高。 */
export interface StepsUI {
  root?: ClassValue;
  item?: ClassValue;
  marker?: ClassValue;
  content?: ClassValue;
  progressRing?: ClassValue;
  progressTrack?: ClassValue;
  progressIndicator?: ClassValue;
  icon?: ClassValue;
  title?: ClassValue;
  description?: ClassValue;
  connector?: ClassValue;
  line?: ClassValue;
  lineFill?: ClassValue;
  arrow?: ClassValue;
}

export const stepsTheme = tv({
  slots: {
    // 单步圆环可由异步子项或动态插槽生成，直接按实际内容预留外扩空间，避免缓存插槽状态。
    root: 'reborn-steps m-0 flex w-(--steps-width) list-none p-0 has-[[role=progressbar]]:p-1.25',
    item: 'relative min-w-0',
    // 默认不生成布局盒，保留已有布局；混排时再把标题和描述收为独立内容组。
    content: 'contents',
    marker: 'relative z-1 flex shrink-0 items-center justify-center rounded-full font-medium transition-colors duration-200 motion-reduce:transition-none',
    // 圆环宽 2px、与节点间隔 3px，向外共扩展 5px；不改变节点与标题、连接线的布局。
    progressRing: 'pointer-events-none absolute -inset-1.25 size-[calc(100%+--spacing(2.5))] -rotate-90 overflow-visible fill-none stroke-[length:--spacing(0.5)]',
    progressTrack: 'stroke-gray-3',
    progressIndicator: 'stroke-(--step-color) transition-[stroke-dasharray] duration-200 motion-reduce:transition-none',
    icon: 'size-[60%] shrink-0',
    title: 'min-w-0 break-words font-medium text-gray-7 transition-colors duration-200 motion-reduce:transition-none',
    description: 'min-w-0 break-words text-gray-7 [contain:inline-size]',
    connector: 'pointer-events-none relative flex items-center justify-center text-gray-3',
    line: 'block size-full rounded-full bg-current',
    // 裁剪显露主题层，不缩放虚线图案，避免过渡中与灰轨道错位；快速切换从当前帧继续。
    lineFill: 'pointer-events-none absolute inset-0 text-(--step-color) transition-[clip-path] duration-(--duration-base) ease-out motion-reduce:transition-none',
    arrow: 'size-5 shrink-0 transition-colors duration-(--duration-base) ease-out motion-reduce:transition-none',
  },
  variants: {
    direction: {
      horizontal: {
        // 上下内容高度不同会错开节点轴；共享三行轨道，避免测量或渲染时回写状态。
        root: 'flex-row items-start overflow-x-auto has-[>[data-placement=top],>[data-placement=bottom]]:grid has-[>[data-placement=top],>[data-placement=bottom]]:auto-cols-[minmax(max-content,1fr)] has-[>[data-placement=top],>[data-placement=bottom]]:grid-flow-col has-[>[data-placement=top],>[data-placement=bottom]]:grid-rows-[auto_auto_auto]',
        // 描述横跨标题与连接轨道，不参与标题列的宽度计算，长描述不会挤走上行连线。
        // 最小宽度由标记、标题和连接留白决定，窄容器横向滚动，连接线不会穿入下一标记。
        // 描述使用 inline-size containment，不参与内在宽度计算，长文案只增加行数。
        item: 'grid min-w-max flex-1 grid-cols-[auto_minmax(0,auto)_minmax(0,1fr)] grid-rows-[auto_auto]',
        marker: 'col-start-1 row-start-1 self-center',
        title: 'col-start-2 row-start-1 ml-2 self-center',
        description: 'col-start-2 -col-end-1 row-start-2 mt-2 ml-2 pr-6',
        connector: 'col-start-3 row-start-1 mx-6 h-0.5 min-w-4 self-center',
      },
      vertical: {
        // 只有左侧文案需要预留左列；上下文案与右侧文案共用靠左节点轴。
        root: 'flex-col grid-cols-[0_auto_minmax(0,1fr)] has-[>[data-placement]:not([data-placement=right])]:grid has-[>[data-placement=left]]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
        // 连接器独占标记轴；内容增高只会拉长线，不会改变轴线的横向位置。
        item: 'grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] content-start pb-18',
        marker: 'col-start-1 row-start-1 self-start',
        title: 'col-start-2 row-start-1 ml-2 flex items-center',
        description: 'col-start-2 row-start-2 mt-2 ml-2',
        connector: 'absolute bottom-2 w-0.5 -translate-x-1/2',
        arrow: 'rotate-90',
      },
    },
    size: {
      sm: { marker: 'size-6 text-base', title: 'text-base', description: 'text-sm' },
      md: { marker: 'size-8 text-lg', title: 'text-lg', description: 'text-base' },
      // 用户明确指定大档标题为 18px，七级字号没有同值档位，因此仅此处保留字面量。
      lg: { marker: 'size-10 text-[18px] leading-[26px]', title: 'text-[18px] leading-[26px]', description: 'text-lg' },
    },
    color: {
      primary: { item: '[--step-color:var(--color-brand-6)] [--step-soft:var(--color-brand-1)]' },
      secondary: { item: '[--step-color:var(--color-secondary-6)] [--step-soft:var(--color-secondary-1)]' },
      success: { item: '[--step-color:var(--color-green-6)] [--step-soft:var(--color-green-1)]' },
      info: { item: '[--step-color:var(--color-blue-6)] [--step-soft:var(--color-blue-1)]' },
      warning: { item: '[--step-color:var(--color-orange-6)] [--step-soft:var(--color-orange-1)]' },
      error: { item: '[--step-color:var(--color-red-6)] [--step-soft:var(--color-red-1)]' },
      neutral: { item: '[--step-color:var(--color-gray-6)] [--step-soft:var(--color-gray-2)]' },
    },
    status: {
      wait: { marker: 'bg-gray-3 text-gray-7' },
      process: { marker: 'bg-(--step-color) text-gray-1', title: 'text-gray-10' },
      finish: { marker: 'bg-(--step-soft) text-(--step-color)', title: 'text-gray-10' },
      error: { marker: 'bg-error text-gray-1', title: 'text-gray-10' },
      success: { marker: 'bg-success text-gray-1', title: 'text-gray-10' },
    },
    type: { default: {}, dot: {}, text: {} },
    current: { true: {}, false: {} },
    lineType: {
      solid: {},
      // 先清零四边宽度，再按方向绘制一侧，避免未引入 preflight 时出现浏览器默认的 3px 边框。
      dashed: { line: 'rounded-none border-0 border-current border-dashed bg-transparent' },
      arrow: {},
    },
    completed: { true: { arrow: 'text-(--step-color)' }, false: {} },
    alignCenter: { true: {}, false: {} },
    placement: { top: {}, bottom: {}, left: {}, right: {} },
    simple: { true: { description: 'hidden' }, false: {} },
    last: { true: {}, false: {} },
    spaced: { true: { item: 'flex-none' }, false: {} },
  },
  compoundVariants: [
    // 标记跨两行，避免圆形高度撑大标题行后额外增加标题与描述的间距。
    // 标题顶偏移取标记与实际行高之差，根字号变化时仍居中；描述始终接在标题之后。
    { direction: 'horizontal' as const, placement: ['left', 'right'], class: { marker: 'row-span-2 self-start', title: 'self-start', connector: 'self-start' } },
    { direction: 'horizontal' as const, placement: ['left', 'right'], size: 'sm' as const, class: { title: 'mt-[calc((--spacing(6)-1lh)/2)]', connector: 'mt-2.75' } },
    { direction: 'horizontal' as const, placement: ['left', 'right'], size: 'md' as const, class: { title: 'mt-[calc((--spacing(8)-1lh)/2)]', connector: 'mt-3.75' } },
    { direction: 'horizontal' as const, placement: ['left', 'right'], size: 'lg' as const, class: { title: 'mt-[calc((--spacing(10)-1lh)/2)]', connector: 'mt-4.75' } },
    // 末项与前面的步骤一同分配可用宽度，避免长描述被压在标题的窄列内。
    { direction: 'horizontal' as const, last: true, placement: ['left', 'right'], spaced: false, class: { item: 'grid-cols-[auto_minmax(0,1fr)]', description: 'pr-0' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], class: {
      item: 'grid-cols-1 grid-rows-[auto_auto_auto]', marker: 'col-start-1 row-start-1 justify-self-center',
      title: 'col-start-1 row-start-2 mt-2 ml-0 text-center', description: 'col-start-1 row-start-3 ml-0 px-2 text-center',
      connector: 'absolute mx-0 min-w-0',
    } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'sm' as const, class: { item: 'min-w-22', connector: 'top-3 left-[calc(50%+--spacing(9))] right-[calc(-50%+--spacing(9))] -translate-y-1/2' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'md' as const, class: { item: 'min-w-24', connector: 'top-4 left-[calc(50%+--spacing(10))] right-[calc(-50%+--spacing(10))] -translate-y-1/2' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'lg' as const, class: { item: 'min-w-26', connector: 'top-5 left-[calc(50%+--spacing(11))] right-[calc(-50%+--spacing(11))] -translate-y-1/2' } },
    { direction: 'vertical' as const, size: 'sm' as const, class: { item: 'min-h-24', title: 'min-h-6', connector: 'top-8 left-3' } },
    { direction: 'vertical' as const, size: 'md' as const, class: { item: 'min-h-26', title: 'min-h-8', connector: 'top-10 left-4' } },
    { direction: 'vertical' as const, size: 'lg' as const, class: { item: 'min-h-28', title: 'min-h-10', connector: 'top-12 left-5' } },
    { direction: 'vertical' as const, last: true, class: { item: 'min-h-0 pb-0' } },
    { direction: 'horizontal' as const, lineType: 'dashed' as const, class: { line: 'border-t-2' } },
    { direction: 'vertical' as const, lineType: 'dashed' as const, class: { line: 'border-l-2' } },
    { direction: 'horizontal' as const, completed: false, class: { lineFill: '[clip-path:inset(0_100%_0_0)]' } },
    { direction: 'vertical' as const, completed: false, class: { lineFill: '[clip-path:inset(0_0_100%_0)]' } },
    { completed: true, class: { lineFill: '[clip-path:inset(0_0_0_0)]' } },
    { type: 'dot' as const, size: 'sm' as const, class: { marker: 'size-1' } },
    { type: 'dot' as const, size: 'md' as const, class: { marker: 'size-1.5' } },
    { type: 'dot' as const, size: 'lg' as const, class: { marker: 'size-2' } },
    { type: 'dot' as const, status: 'wait' as const, class: { marker: 'border border-gray-5 bg-transparent' } },
    { type: 'dot' as const, status: ['process', 'finish'], class: { marker: 'bg-(--step-color)' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['left', 'right'], class: { title: 'mt-0' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['left', 'right'], size: 'sm' as const, class: { marker: 'mt-[calc((1lh_-_--spacing(1))/2)]', connector: 'mt-[calc((var(--text-base--line-height)_-_--spacing(0.5))/2)]' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['left', 'right'], size: 'md' as const, class: { marker: 'mt-[calc((1lh_-_--spacing(1.5))/2)]', connector: 'mt-[calc((var(--text-lg--line-height)_-_--spacing(0.5))/2)]' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['left', 'right'], size: 'lg' as const, class: { marker: 'mt-[calc((1lh_-_--spacing(2))/2)]', connector: 'mt-[calc((26px_-_--spacing(0.5))/2)]' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'sm' as const, class: { item: 'min-w-17', connector: 'top-0.5 left-[calc(50%+--spacing(6.5))] right-[calc(-50%+--spacing(6.5))]' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'md' as const, class: { item: 'min-w-17.5', connector: 'top-0.75 left-[calc(50%+--spacing(6.75))] right-[calc(-50%+--spacing(6.75))]' } },
    { type: 'dot' as const, direction: 'horizontal' as const, placement: ['top', 'bottom'], size: 'lg' as const, class: { item: 'min-w-18', connector: 'top-1 left-[calc(50%+--spacing(7))] right-[calc(-50%+--spacing(7))]' } },
    // 圆点为对齐标题而下移；连线跨入下一项的空白，保证两端距实际圆点边缘均为 8px。
    { type: 'dot' as const, direction: 'vertical' as const, size: 'sm' as const, class: { marker: 'mt-2.5', connector: 'top-5.5 -bottom-0.5 left-0.5' } },
    { type: 'dot' as const, direction: 'vertical' as const, size: 'md' as const, class: { marker: 'mt-3.25', connector: 'top-6.75 -bottom-1.25 left-0.75' } },
    { type: 'dot' as const, direction: 'vertical' as const, size: 'lg' as const, class: { marker: 'mt-4', connector: 'top-8 -bottom-2 left-1' } },
    // 左侧标题按内容收紧，末项也把剩余宽度留给尾部空轨道，避免文字与节点被弹性标题列拉开。
    { direction: 'horizontal' as const, placement: 'left' as const, class: {
      item: 'grid-cols-[minmax(0,auto)_auto_minmax(0,1fr)]', marker: 'col-start-2',
      title: 'col-start-1 ml-0 mr-2', description: 'col-start-1 -col-end-1 ml-0',
    } },
    // 描述跨越整步后扣除节点与 8px 间距，与右侧布局保留相同的换行宽度。
    { direction: 'horizontal' as const, placement: 'left' as const, size: 'sm' as const, class: { description: 'mr-8' } },
    { direction: 'horizontal' as const, placement: 'left' as const, size: 'md' as const, class: { description: 'mr-10' } },
    { direction: 'horizontal' as const, placement: 'left' as const, size: 'lg' as const, class: { description: 'mr-12' } },
    { direction: 'horizontal' as const, placement: 'left' as const, type: 'dot' as const, size: 'sm' as const, class: { description: 'mr-3' } },
    { direction: 'horizontal' as const, placement: 'left' as const, type: 'dot' as const, size: 'md' as const, class: { description: 'mr-3.5' } },
    { direction: 'horizontal' as const, placement: 'left' as const, type: 'dot' as const, size: 'lg' as const, class: { description: 'mr-4' } },
    { direction: 'vertical' as const, placement: 'left' as const, class: {
      item: 'grid-cols-[minmax(0,1fr)_auto]', marker: 'col-start-2',
      title: 'col-start-1 ml-0 mr-2', description: 'col-start-1 ml-0 mr-2', connector: 'left-auto translate-x-1/2',
    } },
    { direction: 'vertical' as const, placement: 'left' as const, size: 'sm' as const, class: { connector: 'right-3' } },
    { direction: 'vertical' as const, placement: 'left' as const, size: 'md' as const, class: { connector: 'right-4' } },
    { direction: 'vertical' as const, placement: 'left' as const, size: 'lg' as const, class: { connector: 'right-5' } },
    { direction: 'vertical' as const, placement: 'left' as const, type: 'dot' as const, size: 'sm' as const, class: { connector: 'right-0.5' } },
    { direction: 'vertical' as const, placement: 'left' as const, type: 'dot' as const, size: 'md' as const, class: { connector: 'right-0.75' } },
    { direction: 'vertical' as const, placement: 'left' as const, type: 'dot' as const, size: 'lg' as const, class: { connector: 'right-1' } },
    // 上下内容占独立行，竖向连线连接内容组边缘，长描述也不会被轴线穿过。
    { direction: 'vertical' as const, placement: ['top', 'bottom'], class: {
      item: 'grid-cols-1 grid-rows-[auto_auto_auto_minmax(--spacing(16),1fr)] justify-items-center pb-2',
      content: 'col-start-1 row-start-2 grid w-full gap-2',
      marker: 'col-start-1 row-start-1 mt-0 justify-self-center',
      title: 'col-auto row-auto mt-0 ml-0 block min-h-0 text-left',
      description: 'col-auto row-auto mt-0 ml-0 px-0 text-left',
      connector: 'static col-start-1 row-start-4 mt-2 min-h-16 self-stretch justify-self-center translate-x-0',
    } },
    { direction: 'vertical' as const, placement: 'top' as const, class: { content: 'row-start-1', marker: 'row-start-2 mt-2' } },
    { direction: 'vertical' as const, placement: 'bottom' as const, class: { content: 'mt-2' } },
    { direction: 'vertical' as const, placement: ['top', 'bottom'], last: true, class: { item: 'grid-rows-[auto_auto_auto] min-h-0 pb-0' } },
    // 存在上下文案的水平步骤共享节点轴；默认左右文案继续使用原有布局。
    { direction: 'horizontal' as const, class: {
      item: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>&]:row-span-3 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>&]:grid-rows-subgrid',
      content: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-start-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-start-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:ml-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:grid [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:gap-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:self-center',
      marker: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-start-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-span-1 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:mt-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:self-center',
      title: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:col-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:row-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:mt-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:ml-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:mr-0',
      description: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:col-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:row-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:mt-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:ml-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:mr-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:px-0',
      connector: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:relative [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-start-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-end-3 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:top-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:bottom-auto [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:mt-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:self-center [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:translate-y-0',
    } },
    { direction: 'horizontal' as const, placement: 'left' as const, class: { content: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-start-1 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:ml-0 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:mr-2' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], class: {
      content: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-span-full [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-start-1 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:ml-0',
      description: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:px-2',
      marker: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-span-full [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:justify-self-center',
      connector: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:absolute [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:col-span-full [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:top-1/2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:-translate-y-1/2',
    } },
    { direction: 'horizontal' as const, placement: 'top' as const, class: { content: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-start-1 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:mb-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:self-end' } },
    { direction: 'horizontal' as const, placement: 'bottom' as const, class: { content: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:row-start-3 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:mt-2 [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:self-start' } },
    // 内容位置与步内对齐分别控制；默认让节点、标题和描述共用左缘，不预留半步空白。
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, class: {
      marker: '[.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>&]:justify-self-start',
      title: 'text-left',
      description: 'text-left [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>li>div>&]:px-0',
      connector: 'right-6',
    } },
    // 连接器从实际节点边缘起算，两端保留 24px；圆点使用自己的实际尺寸。
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, size: 'sm' as const, class: { connector: 'left-12' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, size: 'md' as const, class: { connector: 'left-14' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, size: 'lg' as const, class: { connector: 'left-16' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, type: 'dot' as const, size: 'sm' as const, class: { connector: 'left-7' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, type: 'dot' as const, size: 'md' as const, class: { connector: 'left-7.5' } },
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], alignCenter: false, type: 'dot' as const, size: 'lg' as const, class: { connector: 'left-8' } },
    // 下一项文案位于侧边时，从其内容组边缘留白，避免居中连线伸进标题或透明图标。
    { direction: 'horizontal' as const, placement: ['top', 'bottom'], class: { connector: '[li:has(+li:is([data-placement=left],[data-placement=right]))>&]:right-6' } },
    // 百分比只在父网格列上计算一次，子项填满该列，避免 25% 再乘列宽变为 6.25%。
    { direction: 'horizontal' as const, spaced: true, class: {
      root: 'has-[>[data-placement=top],>[data-placement=bottom]]:auto-cols-(--steps-space)',
      item: 'w-(--steps-space) [.reborn-steps:has(>[data-placement=top],>[data-placement=bottom])>&]:w-full',
    } },
    // 竖向混排复用中间节点列，避免单项切换方位后把后续连接轴推到另一侧。
    // 选择器限定直属层级，嵌套步骤条不会继承外层的共享轨道。
    { direction: 'vertical' as const, class: {
      item: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>&]:col-span-3 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>&]:grid-cols-subgrid',
      marker: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-2',
      content: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-3 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:row-start-1 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:ml-2 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:grid [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:gap-2 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:self-start',
      title: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:col-auto [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:row-auto [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:ml-0 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:mr-0',
      description: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:col-auto [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:row-auto [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:mt-0 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:ml-0 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:mr-0',
    } },
    { direction: 'vertical' as const, placement: 'left' as const, class: {
      content: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-1 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:ml-0 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:mr-2 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:w-fit [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:max-w-full [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:justify-self-end',
      // 短文案随内容收紧并靠近节点，长描述仍可撑满左半列，两段文字保持左对齐。
      description: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>div>&]:[contain:none]',
    } },
    // 绝对连接器以节点所在网格列为定位区，左列收起后也不会偏到容器中央。
    { direction: 'vertical' as const, placement: ['left', 'right'], class: { connector: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-2 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-end-3 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:left-1/2 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:right-auto [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:-translate-x-1/2' } },
    { direction: 'vertical' as const, placement: ['top', 'bottom'], class: {
      content: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-span-full [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-1 [.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:ml-0',
      connector: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:col-start-2',
    } },
    { direction: 'vertical' as const, placement: 'bottom' as const, class: { content: '[.reborn-steps:has(>[data-placement]:not([data-placement=right]))>li>&]:row-start-2' } },
    // 侧边圆点原本跨入下一项以贴合下移的圆点；下一项改为上下文案时，止于文案组之前。
    { direction: 'vertical' as const, placement: ['left', 'right'], type: 'dot' as const, class: { connector: '[li:has(+li:is([data-placement=top],[data-placement=bottom]))>&]:bottom-2' } },
    // 文本类型没有节点，左右文案不再预留节点间距，连接器与标题居中。
    { direction: 'horizontal' as const, placement: ['left', 'right'], type: 'text' as const, class: {
      title: 'mt-0 ml-0 mr-0', description: 'ml-0 mr-0', connector: 'mt-0 self-center',
    } },
    // 当前步骤按实际索引着色，显式错误或成功状态仍沿用对应的语义色。
    { type: 'text' as const, current: true, class: { title: 'text-(--step-color)', description: 'text-(--step-color)' } },
  ],
  defaultVariants: { direction: 'horizontal', placement: 'right', size: 'md', color: 'primary', status: 'wait', type: 'default', current: false, lineType: 'solid', completed: false, alignCenter: false, simple: false, last: false, spaced: false },
});

export default stepsTheme;
