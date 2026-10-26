import { tv, type VariantProps } from '@/lib/tv';

export type NoticeBarUI = {
  root?: string;
  textWrapper?: string;
  text?: string;
  icon?: string;
  verticalWrapper?: string;
  verticalItem?: string;
};

export type NoticeBarVariantProps = VariantProps<typeof rebornNoticeBar>;

export const rebornNoticeBar = tv({
  slots: {
    root: 'reborn-notice-bar relative flex items-center w-full overflow-hidden p-2 gap-2 rounded-xl',
    textWrapper: 'flex-1 overflow-hidden min-w-0 h-full',
    text: 'inline-block whitespace-nowrap',
    icon: 'shrink-0 flex items-center',
    verticalWrapper: 'h-full w-full overflow-hidden',
    verticalItem: 'h-full flex items-center truncate min-w-0',
  },
  variants: {
    wrapable: {
      true: {
        textWrapper: 'flex-1 overflow-visible',
        text: 'whitespace-normal',
      },
      false: {},
    },
    disabled: {
      true: {
        // 只屏蔽子元素的指针：根节点若也 pointer-events-none，禁止光标永远显示不出来；根节点的点击在 handleClick 里按禁用拦截
        root: 'opacity-50 cursor-not-allowed *:pointer-events-none',
      },
    },
  },
  defaultVariants: {
    wrapable: false,
    disabled: false,
  },
});