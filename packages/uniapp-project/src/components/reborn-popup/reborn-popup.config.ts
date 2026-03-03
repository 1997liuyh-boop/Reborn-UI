export type PopupDirection = 'top' | 'bottom' | 'left' | 'right' | 'center'

const config = {
  slots: {
    wrapper: 'fixed inset-0 h-full w-full pointer-events-none',
    mask: 'absolute top-0 bottom-0 left-0 right-0 h-full w-full bg-black opacity-0 transition-opacity',
    popup: 'absolute duration-300 transition-transform pointer-events-auto',
    inner: 'bg-white dark:bg-gray-8 h-full w-full flex flex-col rounded-t-lg',
    draw: 'bg-gray-2 dark:bg-gray-6 rounded-md absolute top-2 left-1/2 h-[5px] w-[35px] -translate-x-1/2 transition-colors duration-200',
    header: 'flex flex-row items-center flex-wrap h-[45px] pl-[13px] pr-[40px]',
    title: 'font-bold text-base truncate dark:text-white',
    container: 'flex-1',
  },
  variants: {
    direction: {
      left: {
        wrapper: '',
        popup: 'left-0 top-0 -translate-x-full',
        inner: 'rounded-r-lg rounded-l-none',
      },
      right: {
        wrapper: '',
        popup: 'right-0 top-0 translate-x-full',
        inner: 'rounded-l-lg rounded-r-none',
      },
      top: {
        wrapper: '',
        popup: 'left-0 top-0 -translate-y-full',
        inner: 'rounded-b-lg rounded-t-none',
      },
      bottom: {
        wrapper: '',
        popup: 'left-0 bottom-0 translate-y-full',
        inner: 'rounded-t-lg rounded-b-none',
      },
      center: {
        wrapper: 'flex flex-col items-center justify-center',
        popup: 'scale-[1.3] opacity-0 transition-[transform,opacity]',
        inner: 'rounded-lg',
      },
    },
    isOpen: {
      true: {
        mask: 'opacity-40',
      },
      false: {},
    },
    isClose: {
      true: {},
    },
    stopTransition: {
      true: {
        popup: '!transition-none',
      },
    },
    rounded: {
      true: {},
      false: {
        inner: '!rounded-none',
      },
    },
  },
  compoundVariants: [
    {
      direction: ['left', 'right'] as PopupDirection[],
      isOpen: true,
      class: { popup: 'translate-x-0' },
    },
    {
      direction: ['top', 'bottom'] as PopupDirection[],
      isOpen: true,
      class: { popup: 'translate-y-0' },
    },
    {
      direction: 'bottom' as PopupDirection,
      isOpen: false,
      isClose: true,
      class: { popup: 'translate-y-full' },
    },
    {
      direction: 'center' as PopupDirection,
      isOpen: true,
      class: { popup: 'scale-100 opacity-100 translate-x-0 translate-y-0' },
    },
  ],
  defaultVariants: {
    direction: 'bottom' as (typeof PopupDirection)[number],
    isOpen: false,
    stopTransition: false,
    isClose: false,
  },
}

export default config
