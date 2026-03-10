import type { Ref } from 'vue';
import { createVNode, getCurrentInstance, inject, provide, ref, render } from 'vue';
import RebornToast from './RebornToast.vue';

export interface ToastOptions {
  msg?: string;
  duration?: number;
  iconName?: 'success' | 'error' | 'warning' | 'loading' | 'info';
  position?: 'top' | 'middle-top' | 'middle' | 'bottom';
  show?: boolean;
  zIndex?: number;
  cover?: boolean;
}

const toastDefaultOptionKey = '__REBORN_TOAST_OPTION__';
export const defaultOptions: ToastOptions = { duration: 2000, show: false };
export const getToastOptionKey = (selector = '') => (selector ? `${toastDefaultOptionKey}${selector}` : toastDefaultOptionKey);

let toastContainer: HTMLElement | null = null;
let globalTimer: ReturnType<typeof setTimeout> | null = null;
const globalOptionRef = ref<ToastOptions>({ ...defaultOptions });

export function useToast(selector = '') {
  const key = getToastOptionKey(selector);
  const instance = getCurrentInstance();
  const optionRef = inject<Ref<ToastOptions>>(key, globalOptionRef);

  if (typeof document !== 'undefined' && !toastContainer) {
    toastContainer = document.createElement('div');
    document.body.appendChild(toastContainer);

    const vnode = createVNode(RebornToast);
    if (instance) {
      vnode.appContext = instance.appContext;
    }
    if (vnode.appContext) {
      vnode.appContext.provides[key] = optionRef;
    }
    render(vnode, toastContainer);
  }

  provide(key, optionRef);

  const close = () => {
    if (globalTimer) clearTimeout(globalTimer);
    optionRef.value = { ...optionRef.value, show: false };
  };

  const show = (option: ToastOptions | string) => {
    const next = typeof option === 'string' ? { msg: option } : option;
    optionRef.value = { ...defaultOptions, ...next, show: true };

    if (globalTimer) clearTimeout(globalTimer);
    if ((optionRef.value.duration || 0) > 0) {
      globalTimer = setTimeout(close, optionRef.value.duration);
    }
  };

  const build = (base: ToastOptions) => (options: ToastOptions | string) => show({ ...base, ...(typeof options === 'string' ? { msg: options } : options) });

  return {
    show,
    close,
    loading: build({ iconName: 'loading', duration: 0, cover: true }),
    success: build({ iconName: 'success', duration: 1500 }),
    error: build({ iconName: 'error' }),
    warning: build({ iconName: 'warning' }),
    info: build({ iconName: 'info' }),
  };
}

export { RebornToast };
