import { tv } from '~/lib/tv';

export const rebornTooltip = tv({
  slots: {
    wrapper: 'inline-flex max-w-full',
    trigger: 'inline-flex max-w-full',
    contentWrapper: 'fixed left-0 top-0 z-[9999] pointer-events-none',
    content:
      'relative inline-flex max-w-xs items-center px-2 py-1 text-xs rounded-md whitespace-pre-line break-words',
    arrow: 'absolute h-2 w-2 rotate-45',
  },
  variants: {
    side: {
      top: {
        content: 'origin-bottom',
      },
      bottom: {
        content: 'origin-top',
      },
      left: {
        content: 'origin-right',
      },
      right: {
        content: 'origin-left',
      },
    },
    effect: {
      dark: {
        // contentWrapper: 'drop-shadow-sm',
        content: 'bg-gray-900 text-white',
        arrow: 'bg-gray-900',
      },
      light: {
        content: 'bg-white text-gray-900 border border-gray-5',
        arrow: 'bg-white border border-gray-5',
      },
    },
  },
  defaultVariants: {
    side: 'bottom',
    effect: 'dark',
  },
});
