export interface ToastOptions {
  msg?: string;
  duration?: number;
  iconName?: 'success' | 'error' | 'warning' | 'loading' | 'info';
  position?: 'top' | 'middle-top' | 'middle' | 'bottom';
  show?: boolean;
  zIndex?: number;
  cover?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' | '';
  direction?: 'horizontal' | 'vertical';
}

export const toastDefaultOptionKey = '__REBORN_TOAST_OPTION__';
export const defaultOptions: ToastOptions = { duration: 2000, show: false };
export const getToastOptionKey = (selector = '') => (selector ? `${toastDefaultOptionKey}${selector}` : toastDefaultOptionKey);


export const toastTheme = {
  root: 'inline-flex max-w-[70%] items-center justify-center rounded-xl bg-black/80 px-4 py-3 text-white shadow-lg transition-all duration-300',
  positions: { top: '-translate-y-[40vh]', 'middle-top': '-translate-y-[18vh]', middle: '', bottom: 'translate-y-[40vh]' },
  colors: {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-orange-500 text-white',
    error: 'bg-red-500 text-white',
    neutral: 'bg-gray-500 text-white',
  },
  msg: 'text-sm break-all text-center',
};
