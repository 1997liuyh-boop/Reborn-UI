import type { Component, VNode } from 'vue';
import { h, createApp, defineComponent, ref } from 'vue';

/**
 * 组件 Props 类型
 */
type ComponentProps<T> = T extends new (...args: any[]) => { $props: infer P }
  ? Partial<P>
  : Record<string, any>;

/**
 * Overlay 配置选项
 */
export interface OverlayOptions<T extends Component> {
  /** 创建后立即打开 */
  defaultOpen?: boolean;
  /** 传递给组件的 props */
  props?: ComponentProps<T>;
  /** 关闭时销毁 */
  destroyOnClose?: boolean;
  /** 内容插槽 */
  content?: VNode | (() => VNode);
  /** 头部插槽 */
  header?: VNode | (() => VNode);
  /** 底部插槽 */
  footer?: VNode | (() => VNode);
  /**
   * 确认回调（命令式确认框专用）
   * - 提供后：点击确认时确认按钮进入 loading 并执行本回调
   * - 回调正常返回 → 视为成功，自动关闭并使 open() 解析为 'confirm'
   * - 回调抛出 → 视为失败，保持打开、恢复按钮，可重试
   * - 未提供时保持旧行为：确认仅使 open() 解析为 'confirm'（不自动关闭）
   */
  onConfirm?: () => void | Promise<void>;
}

/**
 * Overlay 实例
 */
export interface OverlayInstance<T extends Component = Component> {
  /** 打开 overlay */
  open: (props?: ComponentProps<T>) => Promise<any>;
  /** 关闭 overlay */
  close: (value?: any) => void;
  /** 更新 props */
  patch: (props: Partial<ComponentProps<T>>) => void;
  /** overlay ID */
  id: symbol;
}

/**
 * 内部 Overlay 状态
 */
interface OverlayState<T extends Component = Component> {
  id: symbol;
  component: T;
  props: Record<string, any>;
  initialProps: Record<string, any>;
  options: OverlayOptions<T>;
  isOpen: boolean;
  resolve?: (value: any) => void;
  app?: ReturnType<typeof createApp>;
  container?: HTMLDivElement;
  currentProps: Record<string, any>;
}

// 全局 overlay 状态管理
const overlayStates = new Map<symbol, OverlayState>();

/** 将确认按钮配置规整为带 loading 的对象（string / 对象 / false 均安全处理） */
function withLoading(btn: any, loading: boolean) {
  if (btn === false || btn == null) return btn;
  if (typeof btn === 'string') return { label: btn, loading };
  return { ...btn, loading };
}

/** 构建传递给目标组件的具名插槽（content / header / footer） */
function buildSlots(state: OverlayState): Record<string, () => VNode> {
  const slots: Record<string, () => VNode> = {};
  (['content', 'header', 'footer'] as const).forEach((key) => {
    const val = state.options[key];
    if (val) {
      slots[key] = typeof val === 'function' ? val : () => val as VNode;
    }
  });
  return slots;
}

/**
 * useOverlay composable
 * 用于全局管理 reborn-dialog 和 reborn-popup 组件及其二次封装组件
 */
export const useOverlay = () => {
  /**
   * 挂载 overlay 包装组件（open 与 patch 共用，消除重复渲染逻辑）
   * 统一处理：确认（loading / 异步 / 成功关闭 / 失败保持）、取消、关闭、插槽
   */
  function mountOverlay(state: OverlayState, id: symbol) {
    if (!state.container) {
      state.container = document.createElement('div');
      document.body.appendChild(state.container);
    }

    const reactiveProps = ref(state.currentProps);
    const confirming = ref(false);

    const WrapperComponent = defineComponent({
      setup() {
        return () => {
          const userProps = reactiveProps.value;
          const handler = state.options.onConfirm;

          const mergedProps: Record<string, any> = {
            ...userProps,
            open: true,
            // 有异步确认回调时，为确认按钮注入 loading 态
            ...(handler ? { confirmBtn: withLoading(userProps.confirmBtn, confirming.value) } : {}),
            'onUpdate:open': (value: boolean) => {
              // 确认进行中锁定，避免中途关闭打断异步流程
              if (!value && !confirming.value) close(id);
            },
            onConfirm: async () => {
              if (!handler) {
                // 向后兼容：无回调时仅解析 'confirm'，由调用方决定关闭时机
                if (state.resolve) {
                  state.resolve('confirm');
                  state.resolve = undefined;
                }
                return;
              }
              if (confirming.value) return; // 防重复提交
              confirming.value = true;
              try {
                await handler();
                close(id, 'confirm'); // 成功 → 关闭并解析 'confirm'
              } catch {
                confirming.value = false; // 失败 → 保持打开，可重试
              }
            },
            onCancel: () => {
              if (!confirming.value) close(id, 'cancel');
            },
            onClose: (value?: any) => {
              if (!confirming.value) close(id, value);
            },
          };

          return h(state.component, mergedProps, buildSlots(state));
        };
      },
    });

    state.app = createApp(WrapperComponent);
    state.app.mount(state.container);
  }

  /**
   * 创建一个 overlay 实例
   */
  const create = <T extends Component>(
    component: T,
    options?: OverlayOptions<T>
  ): OverlayInstance<T> => {
    const id = Symbol('overlay');

    const state: OverlayState<T> = {
      id,
      component,
      props: (options?.props as Record<string, any>) || {},
      initialProps: (options?.props as Record<string, any>) || {},
      currentProps: (options?.props as Record<string, any>) || {},
      options: (options as OverlayOptions<T>) || {},
      isOpen: false,
    };

    overlayStates.set(id, state);

    const instance: OverlayInstance<T> = {
      id,
      open: (props?: ComponentProps<T>) => open(id, props),
      close: (value?: any) => close(id, value),
      patch: (props: Partial<ComponentProps<T>>) => patch(id, props),
    };

    // 如果设置了 defaultOpen，立即打开
    if (options?.defaultOpen) {
      instance.open();
    }

    return instance;
  };

  /**
   * 打开指定 ID 的 overlay
   */
  const open = <T extends Component>(
    id: symbol,
    props?: ComponentProps<T>
  ): Promise<any> => {
    const state = overlayStates.get(id);
    if (!state) {
      return Promise.reject(new Error(`Overlay with id ${id.toString()} not found`));
    }

    // 合并 props
    if (props) {
      state.currentProps = { ...state.props, ...(props as Record<string, any>) };
    } else {
      state.currentProps = { ...state.props };
    }

    return new Promise((resolve) => {
      state.resolve = resolve;
      state.isOpen = true;

      if (!state.app) {
        mountOverlay(state, id);
      }
    });
  };

  /**
   * 关闭指定 ID 的 overlay
   */
  const close = (id: symbol, value?: any): void => {
    const state = overlayStates.get(id);
    if (!state) return;

    state.isOpen = false;

    // 解析 Promise
    if (state.resolve) {
      state.resolve(value);
      state.resolve = undefined;
    }

    // 卸载应用
    if (state.app) {
      state.app.unmount();
      state.app = undefined;
    }

    // 移除容器
    if (state.container && state.container.parentNode) {
      state.container.parentNode.removeChild(state.container);
      state.container = undefined;
    }

    // 重置 props 到初始状态
    state.props = { ...state.initialProps };
    state.currentProps = { ...state.initialProps };

    // 如果设置了 destroyOnClose，从状态中移除
    if (state.options.destroyOnClose) {
      overlayStates.delete(id);
    }
  };

  /**
   * 关闭所有 overlay
   */
  const closeAll = (): void => {
    overlayStates.forEach((state, id) => {
      if (state.isOpen) {
        close(id);
      }
    });
  };

  /**
   * 更新指定 ID 的 overlay props
   */
  const patch = <T extends Component>(
    id: symbol,
    props: Partial<ComponentProps<T>>
  ): void => {
    const state = overlayStates.get(id);
    if (!state) return;

    // 更新当前 props
    state.currentProps = { ...state.currentProps, ...(props as Record<string, any>) };
    state.props = { ...state.props, ...(props as Record<string, any>) };

    // 如果已打开，需要重新渲染（卸载后用最新 props 重新挂载）
    if (state.isOpen) {
      const resolve = state.resolve;
      if (state.app) {
        state.app.unmount();
        state.app = undefined;
      }
      mountOverlay(state, id);
      state.resolve = resolve;
    }
  };

  /**
   * 卸载指定 ID 的 overlay
   */
  const unmount = (id: symbol): void => {
    const state = overlayStates.get(id);
    if (!state) return;

    // 如果正在打开，先关闭
    if (state.isOpen) {
      close(id);
    }

    // 卸载应用
    if (state.app) {
      state.app.unmount();
      state.app = undefined;
    }

    // 移除容器
    if (state.container && state.container.parentNode) {
      state.container.parentNode.removeChild(state.container);
      state.container = undefined;
    }

    // 从状态中移除
    overlayStates.delete(id);
  };

  /**
   * 检查指定 ID 的 overlay 是否打开
   */
  const isOpen = (id: symbol): boolean => {
    const state = overlayStates.get(id);
    return state?.isOpen ?? false;
  };

  /**
   * 获取所有 overlays 的列表
   */
  const overlays = Array.from(overlayStates.entries());

  return {
    create,
    open,
    close,
    closeAll,
    patch,
    unmount,
    isOpen,
    overlays,
  };
};

// 导出类型
export type OverlayReturn = ReturnType<typeof useOverlay>;