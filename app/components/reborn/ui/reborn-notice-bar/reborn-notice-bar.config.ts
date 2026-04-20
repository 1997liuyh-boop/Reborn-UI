import { tv, type VariantProps } from '@/lib/tv';

export type NoticeBarUI = {
  root?: string;
  content?: string;
  textWrapper?: string;
  text?: string;
  icon?: string;
  verticalWrapper?: string;
  verticalItem?: string;
};

export type NoticeBarVariantProps = VariantProps<typeof rebornNoticeBar>;

export const rebornNoticeBar = tv({
  slots: {
    root: 'reborn-notice-bar relative flex items-center w-full overflow-hidden p-2 gap-2 rounded-ui-md',
    content: 'flex items-center gap-2 whitespace-nowrap h-full',
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
        root: 'opacity-50 pointer-events-none cursor-not-allowed',
      },
    },
  },
  defaultVariants: {
    wrapable: false,
    disabled: false,
  },
});