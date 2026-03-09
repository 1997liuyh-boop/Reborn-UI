export const transitionTheme = {
  base: 'rb-transition ease-linear',
  animations: {
    fade: {
      enter: 'opacity-0',
      enterActive: 'transition-opacity',
      enterTo: '',
      leave: '',
      leaveActive: 'transition-opacity',
      leaveTo: 'opacity-0',
    },
    'slide-up': {
      enter: 'translate-y-full',
      enterActive: 'transition-transform',
      enterTo: 'translate-y-0',
      leave: 'translate-y-0',
      leaveActive: 'transition-transform',
      leaveTo: 'translate-y-full',
    },
    'zoom-in': {
      enter: 'opacity-0 scale-80',
      enterActive: 'transition-all',
      enterTo: 'opacity-100 scale-100',
      leave: 'opacity-100 scale-100',
      leaveActive: 'transition-all',
      leaveTo: 'opacity-0 scale-80',
    },
  },
}
