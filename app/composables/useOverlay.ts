import type { Component, VNode } from 'vue';
import { h, createApp, defineComponent, ref } from 'vue';

/**
 * 组件 Props 类型
 */
type ComponentProps<T> = T extends Component<infer P> ? P : Record<string, any>;

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

/**
 * useOverlay composable
 * 用于全局管理 reborn-dialog 和 reborn-popup 组件及其二次封装组件
 */
export const useOverlay = () => {
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

      // 创建容器
      if (!state.container) {
        state.container = document.createElement('div');
        document.body.appendChild(state.container);
      }

      // 创建响应式 props
      const reactiveProps = ref(state.currentProps);

      // 创建包装组件
      const WrapperComponent = defineComponent({
        setup() {
          return () => {
            const mergedProps = {
              ...reactiveProps.value,
              open: true,
              'onUpdate:open': (value: boolean) => {
                if (!value) {
                  close(id);
                }
              },
              onConfirm: () => {
                // 不自动关闭，让用户手动控制
                // 通过返回特殊值让调用者知道是 confirm 事件
                if (state.resolve) {
                  state.resolve('confirm');
                  state.resolve = undefined;
                }
              },
              onCancel: () => {
                close(id, 'cancel');
              },
              onClose: (value?: any) => {
                close(id, value);
              },
            };

            // 渲染组件并传递插槽
            const slots: Record<string, () => VNode> = {};

            if (state.options.content) {
              slots.content = typeof state.options.content === 'function'
                ? state.options.content
                : () => state.options.content as VNode;
            }

            if (state.options.header) {
              slots.header = typeof state.options.header === 'function'
                ? state.options.header
                : () => state.options.header as VNode;
            }

            if (state.options.footer) {
              slots.footer = typeof state.options.footer === 'function'
                ? state.options.footer
                : () => state.options.footer as VNode;
            }

            return h(state.component, mergedProps, slots);
          };
        },
      });

      // 创建并挂载应用
      if (!state.app) {
        state.app = createApp(WrapperComponent);
        state.app.mount(state.container);
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

    // 如果已打开，需要重新渲染
    if (state.isOpen) {
      // 先关闭再打开以应用新的 props
      const resolve = state.resolve;
      if (state.app) {
        state.app.unmount();
        state.app = undefined;
      }

      // 重新创建容器
      if (!state.container) {
        state.container = document.createElement('div');
        document.body.appendChild(state.container);
      }

      // 创建响应式 props
      const reactiveProps = ref(state.currentProps);

      // 创建包装组件
      const WrapperComponent = defineComponent({
        setup() {
          return () => {
            const mergedProps = {
              ...reactiveProps.value,
              open: true,
              'onUpdate:open': (value: boolean) => {
                if (!value) {
                  close(id);
                }
              },
              onConfirm: () => {
                // 不自动关闭，让用户手动控制
                // 通过返回特殊值让调用者知道是 confirm 事件
                if (state.resolve) {
                  state.resolve('confirm');
                  state.resolve = undefined;
                }
              },
              onCancel: () => {
                close(id, 'cancel');
              },
              onClose: (value?: any) => {
                close(id, value);
              },
            };

            // 渲染组件并传递插槽
            const slots: Record<string, () => VNode> = {};

            if (state.options.content) {
              slots.content = typeof state.options.content === 'function'
                ? state.options.content
                : () => state.options.content as VNode;
            }

            if (state.options.header) {
              slots.header = typeof state.options.header === 'function'
                ? state.options.header
                : () => state.options.header as VNode;
            }

            if (state.options.footer) {
              slots.footer = typeof state.options.footer === 'function'
                ? state.options.footer
                : () => state.options.footer as VNode;
            }

            return h(state.component, mergedProps, slots);
          };
        },
      });

      // 重新创建并挂载应用
      state.app = createApp(WrapperComponent);
      state.app.mount(state.container);
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