import { ref } from 'vue';

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

/**
 * 全局单例状态，放这里是为了避免 index.ts 和 RebornToast.vue 循环引用
 */
export const globalOptionRef = ref<ToastOptions>({ ...defaultOptions });

export const toastTheme = {
  root: 'inline-flex max-w-[70%] items-center justify-center rounded-xl bg-black/80 px-4 py-3 text-white shadow-lg transition-all duration-300',
  positions: { top: '-translate-y-[40vh]', 'middle-top': '-translate-y-[18vh]', middle: '', bottom: 'translate-y-[40vh]' },
  colors: {
    primary: 'bg-white border border-primary/20 text-primary shadow-sm dark:bg-gray-900',
    secondary: 'bg-white border border-secondary/20 text-secondary shadow-sm dark:bg-gray-900',
    success: 'bg-white border border-success/20 text-success shadow-sm dark:bg-gray-900',
    info: 'bg-white border border-info/20 text-info shadow-sm dark:bg-gray-900',
    warning: 'bg-white border border-warning/20 text-warning shadow-sm dark:bg-gray-900',
    error: 'bg-white border border-error/20 text-error shadow-sm dark:bg-gray-900',
    neutral: 'bg-white border border-neutral/20 text-neutral shadow-sm dark:bg-gray-900',
  },
  msg: 'text-sm break-all text-center',
};
