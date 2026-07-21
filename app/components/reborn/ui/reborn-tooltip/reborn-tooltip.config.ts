import { tv } from '~/lib/tv';

export const rebornTooltip = tv({
  slots: {
    wrapper: '',
    trigger: 'inline-flex max-w-full',
    contentWrapper: 'fixed left-0 top-0 z-[9999] pointer-events-none flex',
    content:
      'relative inline-flex max-w-xs items-center px-4 py-3 text-xs rounded-ui-sm whitespace-pre-line break-words',
    arrow: 'absolute h-3 w-3',
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
        content: 'bg-gray-9/90 text-white',
        arrow: 'bg-gray-9/75',
      },
      light: {
        content: 'bg-white text-gray-9 border border-gray-5',
        arrow: 'bg-white border border-gray-5',
      },
    },
  },
  defaultVariants: {
    side: 'bottom',
    effect: 'dark',
  },
});
