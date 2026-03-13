export const toastColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const toastTheme = {
  slots: {
    root: 'rb-toast inline-block max-w-[70%] rounded-xl bg-black/80 px-4 py-3 text-white shadow-lg transition-all duration-300',
    msg: 'text-left text-24 break-all',
    icon: 'inline-block bg-cover bg-no-repeat',
  },
  variants: {
    position: {
      'top': '-translate-y-[40vh]',
      'middle-top': '-translate-y-[18.8vh]',
      'middle': '',
      'bottom': 'translate-y-[40vh]',
    },
    direction: {
      horizontal: '',
      vertical: 'flex-col',
    },
    withIcon: {
      true: 'inline-flex items-center',
      false: '',
    },
    color: {
      default: '',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success text-success-foreground',
      info: 'bg-info text-info-foreground',
      warning: 'bg-warning text-warning-foreground',
      error: 'bg-error text-error-foreground',
      neutral: 'bg-neutral text-neutral-foreground',
    },
  },
  defaultVariants: {
    position: 'middle-top',
    direction: 'horizontal',
    withIcon: false,
    color: 'default',
  },
}

export default toastTheme
