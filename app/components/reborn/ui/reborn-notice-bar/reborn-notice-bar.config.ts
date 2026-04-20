import { tv } from '@/lib/tv';

export const rebornNoticeBar = tv({
  slots: {
    root: 'reborn-notice-bar relative flex items-center w-full overflow-hidden px-2 gap-2',
    content: 'flex items-center gap-2 whitespace-nowrap',
    textWrapper: 'flex-1 overflow-hidden',
    text: 'inline-block whitespace-nowrap',
    icon: 'shrink-0 size-5',
    verticalWrapper: 'h-full w-full',
    verticalItem: 'h-full flex items-center whitespace-nowrap',
  },
  variants: {
    wrapable: {
      true: {
        root: 'h-auto py-2',
        textWrapper: 'flex-1 overflow-visible',
        text: 'whitespace-normal',
      },
      false: {
        root: 'h-10',
      },
    },
  },
  defaultVariants: {
    wrapable: false,
  },
});
