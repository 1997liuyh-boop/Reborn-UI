import { tv } from '~/lib/tv';

/** 警告提示的类型（决定默认图标与配色） */
export const alertTypes = ['primary', 'info', 'success', 'warning', 'error', 'loading'] as const;
export type AlertType = (typeof alertTypes)[number];

/** 视觉变体：filled 使用一阶浅底与六阶图标底色，soft 使用一阶底色与六阶文字，subtle 另加二阶描边。 */
export const alertVariants = ['filled', 'outlined', 'soft', 'subtle', 'text', 'round'] as const;
export type AlertVariant = (typeof alertVariants)[number];

/** 配色（与 reborn-button 同一套语义色） */
export const alertColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
export type AlertColor = (typeof alertColors)[number];

/** 轮播方向：vertical 垂直切换（rows > 1 时多行逐行滚动），horizontal 水平跑马灯 */
export const alertDirections = ['vertical', 'horizontal'] as const;
export type AlertDirection = (typeof alertDirections)[number];

/** type → 默认配色 */
export const ALERT_TYPE_COLOR: Record<AlertType, AlertColor> = {
  primary: 'primary',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  loading: 'primary',
};

/** type → 默认图标名 */
export const ALERT_TYPE_ICON: Record<AlertType, string> = {
  primary: 'ant-design:info-outlined',
  info: 'ant-design:info-outlined',
  success: 'lucide:check',
  warning: 'ant-design:exclamation-outlined',
  error: 'lucide:x',
  loading: 'lucide:loader-2',
};

export const alertTheme = tv({
  slots: {
    // 默认字号 text-sm（12px），filled 使用 text-base（14px），均采用令牌自带行高。
    // 下面图标 / 操作区 / 关闭按钮三个盒子的 h-5 / min-h-5 / size-5 就是这 20px：
    // 根节点是 items-start，它们必须与首行行盒等高才能和文字光学居中，改字号时要一起改。
    root: 'reborn-alert relative flex w-full items-start gap-2 px-3 py-2 text-sm font-normal rounded-sm',
    icon: 'flex h-5 shrink-0 items-center',
    content: 'flex min-w-0 flex-1 flex-col gap-2',
    title: 'font-medium',
    description: 'min-w-0',
    action: 'flex min-h-5 shrink-0 items-center',
    closeButton: 'flex size-5 shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors focus:outline-none text-gray-6 hover:text-gray-8 active:text-gray-9',
    closeIcon: 'size-3.5 shrink-0',
    // 位于内容列中，不能带 flex-1：不定高列容器里 basis 0% 会退化为按内容计算，顶掉多行模式的显式高度
    carouselWrapper: 'relative min-w-0 overflow-hidden',
    carouselItem: 'truncate',
    // 多行垂直滚动的轨道：整体 translateY 逐行上移，回卷时由组件临时关闭过渡
    carouselList: 'flex flex-col transition-transform duration-300 ease-out',
    // 水平跑马灯：不换行的整行文本，由组件测宽后驱动 CSS 动画
    marqueeWrapper: 'relative min-w-0 overflow-hidden',
    marquee: 'inline-block whitespace-nowrap will-change-transform',
    marqueeItem: 'mr-6 last:mr-0',
  },
  variants: {
    variant: {
      filled: {
        root: 'text-base text-gray-8',
        // 16px 圆形图标在 22px 首行行盒中居中。
        icon: 'size-4 mt-0.75 justify-center rounded-full text-gray-1',
        description: 'text-gray-8',
        action: 'min-h-5.5',
        closeButton: 'size-5.5',
        closeIcon: 'text-inherit',
      },
      outlined: '',
      soft: '',
      subtle: '',
      // 文字提示：无背景/边框，仅保留语义色文字
      text: '',
      // 胶囊提示：使用语义色实底与配套前景（见 compoundVariants）。
      round: { root: 'rounded-full' },
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    hasDescription: {
      true: { title: 'text-gray-10 leading-[150%]' },
    },
    loading: {
      true: {},
      false: {},
    },
    /** 顶部公告模式：去除边框和圆角，铺满容器宽度 */
    banner: {
      true: { root: 'rounded-none border-none' },
    },
    /** 内容居中显示 */
    center: {
      true: {
        root: 'justify-center text-center',
        content: 'flex-none items-center',
      },
    },
  },
  compoundVariants: [
    // Filled：面板使用一阶浅底，图标底色固定为同色相六阶。
    { variant: 'filled', color: 'primary', class: { root: 'bg-brand-1', icon: 'bg-brand-6' } },
    { variant: 'filled', color: 'secondary', class: { root: 'bg-secondary-1', icon: 'bg-secondary-6' } },
    { variant: 'filled', color: 'success', class: { root: 'bg-green-1', icon: 'bg-green-6' } },
    { variant: 'filled', color: 'info', class: { root: 'bg-blue-1', icon: 'bg-blue-6' } },
    { variant: 'filled', color: 'warning', class: { root: 'bg-orange-1', icon: 'bg-orange-6' } },
    { variant: 'filled', color: 'error', class: { root: 'bg-red-1', icon: 'bg-red-6' } },
    // 灰色一阶与页面底色相同，中性提示使用二阶底色保留可见背景。
    { variant: 'filled', color: 'neutral', class: { root: 'bg-gray-2', icon: 'bg-gray-6' } },

    // 加载图标与基础消息使用相同的透明背景和语义色。
    { variant: 'filled', loading: true, color: 'primary', class: { icon: 'bg-transparent text-primary' } },
    { variant: 'filled', loading: true, color: 'secondary', class: { icon: 'bg-transparent text-secondary' } },
    { variant: 'filled', loading: true, color: 'success', class: { icon: 'bg-transparent text-green-6' } },
    { variant: 'filled', loading: true, color: 'info', class: { icon: 'bg-transparent text-blue-6' } },
    { variant: 'filled', loading: true, color: 'warning', class: { icon: 'bg-transparent text-orange-6' } },
    { variant: 'filled', loading: true, color: 'error', class: { icon: 'bg-transparent text-red-6' } },
    { variant: 'filled', loading: true, color: 'neutral', class: { icon: 'bg-transparent text-neutral' } },

    // 胶囊形状：语义色实底与配套前景，随主题保持可读。
    { variant: 'round', color: 'primary', class: { root: 'bg-primary text-primary-foreground' } },
    { variant: 'round', color: 'secondary', class: { root: 'bg-secondary text-secondary-foreground' } },
    { variant: 'round', color: 'success', class: { root: 'bg-success text-success-foreground' } },
    { variant: 'round', color: 'info', class: { root: 'bg-info text-info-foreground' } },
    { variant: 'round', color: 'warning', class: { root: 'bg-warning text-warning-foreground' } },
    { variant: 'round', color: 'error', class: { root: 'bg-error text-error-foreground' } },
    { variant: 'round', color: 'neutral', class: { root: 'bg-neutral text-neutral-foreground' } },

    // Outlined：同 reborn-button 的 outlined（语义色边框 + 文字，透明底）
    { variant: 'outlined', color: 'primary', class: { root: 'bg-transparent border border-primary text-primary' } },
    { variant: 'outlined', color: 'secondary', class: { root: 'bg-transparent border border-secondary text-secondary' } },
    { variant: 'outlined', color: 'success', class: { root: 'bg-transparent border border-success text-success' } },
    { variant: 'outlined', color: 'info', class: { root: 'bg-transparent border border-info text-info' } },
    { variant: 'outlined', color: 'warning', class: { root: 'bg-transparent border border-warning text-warning' } },
    { variant: 'outlined', color: 'error', class: { root: 'bg-transparent border border-error text-error' } },
    { variant: 'outlined', color: 'neutral', class: { root: 'bg-transparent border border-neutral text-neutral' } },

    // Soft：一阶底色和六阶文字。
    { variant: 'soft', color: 'primary', class: { root: 'bg-brand-1 text-brand-6' } },
    { variant: 'soft', color: 'secondary', class: { root: 'bg-secondary-1 text-secondary-6' } },
    { variant: 'soft', color: 'success', class: { root: 'bg-green-1 text-green-6' } },
    { variant: 'soft', color: 'info', class: { root: 'bg-blue-1 text-blue-6' } },
    { variant: 'soft', color: 'warning', class: { root: 'bg-orange-1 text-orange-6' } },
    { variant: 'soft', color: 'error', class: { root: 'bg-red-1 text-red-6' } },
    { variant: 'soft', color: 'neutral', class: { root: 'bg-gray-1 text-gray-6' } },

    // Subtle：在 soft 的基础上加二阶描边。
    { variant: 'subtle', color: 'primary', class: { root: 'bg-brand-1 border border-brand-2 text-brand-6' } },
    { variant: 'subtle', color: 'secondary', class: { root: 'bg-secondary-1 border border-secondary-2 text-secondary-6' } },
    { variant: 'subtle', color: 'success', class: { root: 'bg-green-1 border border-green-2 text-green-6' } },
    { variant: 'subtle', color: 'info', class: { root: 'bg-blue-1 border border-blue-2 text-blue-6' } },
    { variant: 'subtle', color: 'warning', class: { root: 'bg-orange-1 border border-orange-2 text-orange-6' } },
    { variant: 'subtle', color: 'error', class: { root: 'bg-red-1 border border-red-2 text-red-6' } },
    { variant: 'subtle', color: 'neutral', class: { root: 'bg-gray-1 border border-gray-2 text-gray-6' } },

    // Text：无背景/边框，仅语义色文字
    { variant: 'text', color: 'primary', class: { root: 'bg-transparent text-primary' } },
    { variant: 'text', color: 'secondary', class: { root: 'bg-transparent text-secondary' } },
    { variant: 'text', color: 'success', class: { root: 'bg-transparent text-success' } },
    { variant: 'text', color: 'info', class: { root: 'bg-transparent text-info' } },
    { variant: 'text', color: 'warning', class: { root: 'bg-transparent text-warning' } },
    { variant: 'text', color: 'error', class: { root: 'bg-transparent text-error' } },
    { variant: 'text', color: 'neutral', class: { root: 'bg-transparent text-neutral' } },
  ],
  defaultVariants: {
    variant: 'filled' as AlertVariant,
    color: 'info' as AlertColor,
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface AlertUI {
  root?: string;
  icon?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  closeButton?: string;
  closeIcon?: string;
  carouselWrapper?: string;
  carouselItem?: string;
  carouselList?: string;
  marqueeWrapper?: string;
  marquee?: string;
  marqueeItem?: string;
}
