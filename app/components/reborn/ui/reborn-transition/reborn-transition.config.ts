export const transitionStyles: Record<string, Record<string, string>> = {
  fade: {
    enter: 'opacity-0',
    'enter-active': 'transition-opacity',
    'enter-to': 'opacity-100',
    leave: 'opacity-100',
    'leave-active': 'transition-opacity',
    'leave-to': 'opacity-0',
  },
  'fade-up': {
    enter: 'translate-y-full opacity-0',
    'enter-active': 'transition-[opacity,transform]',
    'enter-to': 'translate-y-0 opacity-100',
    leave: 'translate-y-0 opacity-100',
    'leave-active': 'transition-[opacity,transform]',
    'leave-to': 'translate-y-full opacity-0',
  },
  'fade-down': {
    enter: '-translate-y-full opacity-0',
    'enter-active': 'transition-[opacity,transform]',
    'enter-to': 'translate-y-0 opacity-100',
    leave: 'translate-y-0 opacity-100',
    'leave-active': 'transition-[opacity,transform]',
    'leave-to': '-translate-y-full opacity-0',
  },
  'slide-up': {
    enter: 'translate-y-full',
    'enter-active': 'transition-transform',
    'enter-to': 'translate-y-0',
    leave: 'translate-y-0',
    'leave-active': 'transition-transform',
    'leave-to': 'translate-y-full',
  },
  'slide-right': {
    enter: 'translate-x-full',
    'enter-active': 'transition-transform',
    'enter-to': 'translate-x-0',
    leave: 'translate-x-0',
    'leave-active': 'transition-transform',
    'leave-to': 'translate-x-full',
  },
  'zoom-in': {
    enter: 'opacity-0 scale-[0.8]',
    'enter-active': 'transition-[opacity,transform]',
    'enter-to': 'opacity-100 scale-100',
    leave: 'opacity-100 scale-100',
    'leave-active': 'transition-[opacity,transform]',
    'leave-to': 'opacity-0 scale-[0.8]',
  },
};

export type TransitionName = keyof typeof transitionStyles;
