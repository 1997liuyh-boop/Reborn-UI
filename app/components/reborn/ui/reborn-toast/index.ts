import type { Ref } from 'vue';
import { createVNode, getCurrentInstance, inject, provide, ref, render } from 'vue';
import { RebornToast } from '#components';
import { type ToastOptions, defaultOptions, getToastOptionKey } from './reborn-toast.config';

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

  const show = (options: ToastOptions) => {
    optionRef.value = { ...defaultOptions, ...options, show: true };
    if (globalTimer) clearTimeout(globalTimer);
    if (optionRef.value.duration! > 0) {
      globalTimer = setTimeout(() => {
        optionRef.value.show = false;
      }, optionRef.value.duration);
    }
  };

  const hide = () => {
    optionRef.value.show = false;
  };

  return {
    show,
    hide,
    success: (msg: string, duration?: number, opts?: Partial<ToastOptions>) => show({ msg, duration, iconName: 'success', ...opts }),
    error: (msg: string, duration?: number, opts?: Partial<ToastOptions>) => show({ msg, duration, iconName: 'error', ...opts }),
    warning: (msg: string, duration?: number, opts?: Partial<ToastOptions>) => show({ msg, duration, iconName: 'warning', ...opts }),
    info: (msg: string, duration?: number, opts?: Partial<ToastOptions>) => show({ msg, duration, iconName: 'info', ...opts }),
    loading: (msg: string, duration = 0, opts?: Partial<ToastOptions>) => show({ msg, duration, iconName: 'loading', ...opts }),
  };
}
