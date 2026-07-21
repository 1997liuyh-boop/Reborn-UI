import type { DirectiveBinding, ObjectDirective } from 'vue';
import type { LoadingHandle, LoadingOptions, LoadingType } from '~/composables/useLoading';
import { createLoading } from '~/composables/useLoading';

/**
 * v-loading 自定义指令（对应 Element Plus 的 v-loading）
 * 与 useLoading 共享同一套底层创建 / 销毁逻辑（createLoading）。
 *
 * 用法：
 * - `v-loading="isLoading"`：布尔值控制宿主元素上的加载遮罩
 * - `v-loading="{ loading: true, text: '加载中', type: 'spinner' }"`：对象值（字段优先级高于元素属性）
 * - 修饰符：`.fullscreen` 全屏遮罩（挂 body）、`.lock` 锁定滚动
 * - 元素属性定制（响应式，updated 钩子重读）：
 *   reborn-loading-text / reborn-loading-type / reborn-loading-color /
 *   reborn-loading-size / reborn-loading-background / reborn-loading-custom-class
 */

/** v-loading 对象值配置（对象字段优先级高于元素属性 reborn-loading-*） */
export interface LoadingDirectiveOptions extends Pick<
  LoadingOptions,
  'text' | 'type' | 'color' | 'size' | 'background' | 'customClass' | 'lock' | 'fullscreen' | 'zIndex'
> {
  /** 是否处于加载中 */
  loading?: boolean;
}

/** v-loading 指令绑定值：布尔或对象配置 */
export type LoadingDirectiveValue = boolean | LoadingDirectiveOptions;

/** 元素上挂载的指令状态 */
interface LoadingElementState {
  /** 底层加载实例（懒创建：首次 loading=true 时创建，隐藏时保留以便快速重开） */
  handle: LoadingHandle | null;
  /** 当前实例的全屏模式（切换时需销毁重建） */
  fullscreen: boolean;
}

const STATE_KEY = Symbol('reborn-loading');

type LoadingElement = HTMLElement & { [STATE_KEY]?: LoadingElementState };

/** 读取元素上的 reborn-loading-* 定制属性 */
function readAttr(el: HTMLElement, name: string): string | undefined {
  return el.getAttribute(`reborn-loading-${name}`) ?? undefined;
}

/** 解析后的指令配置 */
interface ResolvedDirectiveConfig {
  loading: boolean;
  fullscreen: boolean;
  lock: boolean;
  /** 可视化选项（对象值字段 > 元素属性） */
  visual: Pick<LoadingOptions, 'text' | 'type' | 'color' | 'size' | 'background' | 'customClass' | 'zIndex'>;
}

/** 解析指令绑定值：布尔 / 对象值 + 修饰符 + 元素属性，收敛为统一配置 */
function resolveConfig(el: HTMLElement, binding: DirectiveBinding<LoadingDirectiveValue>): ResolvedDirectiveConfig {
  const raw = binding.value;
  const obj: LoadingDirectiveOptions = typeof raw === 'object' && raw !== null ? raw : {};
  const loading = typeof raw === 'boolean' ? raw : !!obj.loading;

  return {
    loading,
    fullscreen: !!(binding.modifiers.fullscreen || obj.fullscreen),
    lock: !!(binding.modifiers.lock || obj.lock),
    visual: {
      text: obj.text ?? readAttr(el, 'text'),
      // 元素属性为字符串，按 LoadingType 收口（非法值由 RebornLoading 的 v-else-if 分支自然忽略）
      type: obj.type ?? (readAttr(el, 'type') as LoadingType | undefined),
      color: obj.color ?? readAttr(el, 'color'),
      size: obj.size ?? readAttr(el, 'size'),
      background: obj.background ?? readAttr(el, 'background'),
      customClass: obj.customClass ?? readAttr(el, 'custom-class'),
      zIndex: obj.zIndex,
    },
  };
}

/** 依据解析配置创建底层加载实例 */
function createForElement(el: HTMLElement, config: ResolvedDirectiveConfig): LoadingHandle {
  return createLoading({
    // 全屏模式挂 body，与宿主元素解耦；否则以宿主元素为遮罩容器
    target: config.fullscreen ? undefined : el,
    fullscreen: config.fullscreen,
    lock: config.lock,
    ...config.visual,
  });
}

export const vLoading: ObjectDirective<HTMLElement, LoadingDirectiveValue> = {
  mounted(el, binding) {
    const config = resolveConfig(el, binding);
    const state: LoadingElementState = {
      handle: null,
      fullscreen: config.fullscreen,
    };
    (el as LoadingElement)[STATE_KEY] = state;

    if (config.loading) {
      state.handle = createForElement(el, config);
    }
  },

  updated(el, binding) {
    const state = (el as LoadingElement)[STATE_KEY];
    if (!state) return;

    // 每次组件更新重读对象值与元素属性，保证 reborn-loading-* 属性响应式生效
    const config = resolveConfig(el, binding);

    // 全屏模式切换：挂载点与定位方式不同，必须销毁重建
    if (state.handle && config.fullscreen !== state.fullscreen) {
      state.handle.destroy();
      state.handle = null;
    }
    state.fullscreen = config.fullscreen;

    if (config.loading) {
      if (!state.handle || state.handle.closed) {
        state.handle = createForElement(el, config);
      } else {
        // 复用现有实例：先同步最新配置，再确保显示（快速开关的竞态由 setVisible 内部处理）
        state.handle.patch({ ...config.visual, lock: config.lock });
        state.handle.setVisible(true);
      }
    } else if (state.handle) {
      state.handle.setVisible(false);
    }
  },

  unmounted(el) {
    // 彻底清理：卸载 Vue 实例、还原宿主样式、释放滚动锁
    const state = (el as LoadingElement)[STATE_KEY];
    state?.handle?.destroy();
    delete (el as LoadingElement)[STATE_KEY];
  },

  // SSR 安全：服务端不向宿主元素注入任何属性，全部 DOM 操作仅在客户端钩子中执行
  getSSRProps: () => ({}),
};
