import { createApp, defineComponent, h, ref } from 'vue';
import type { Component } from 'vue';
import type { ClassValue } from 'tailwind-variants';
import { cn } from '~/lib/utils';
import RebornLoadingMask from '~/components/reborn/ui/reborn-loading/RebornLoadingMask.vue';
import { LOADING_MASK_DURATION } from '~/components/reborn/ui/reborn-loading/reborn-loading-mask.config';
import type { LoadingTypes } from '~/components/reborn/ui/reborn-loading/reborn-loading.config';
import { useGlobalScrollLock } from './useGlobalScrollLock';

/**
 * useLoading —— 服务式加载遮罩（对应 Element Plus 的 ElLoading.service）
 * v-loading 指令（app/directives/loading.ts）与本 hook 共享同一套底层创建 / 销毁逻辑（createLoading）。
 */

/** 加载图标类型（与 RebornLoading 的 type 对齐） */
export type LoadingType = (typeof LoadingTypes)[number];

/** 加载遮罩配置选项 */
export interface LoadingOptions {
  /** 目标容器：CSS 选择器或 DOM 元素；未指定时默认全屏 */
  target?: string | HTMLElement;
  /** 遮罩挂载到 body（fixed 定位覆盖目标矩形），用于目标存在 overflow 裁切 / transform 的场景 */
  body?: boolean;
  /** 全屏遮罩（挂载 body、fixed 铺满视口）；未指定 target 时默认为 true */
  fullscreen?: boolean;
  /** 锁定滚动：全屏时锁定页面滚动（全局引用计数锁），局部时为目标元素加 overflow:hidden */
  lock?: boolean;
  /** 加载文字（显示在图标下方） */
  text?: string;
  /** 加载图标类型，默认 'ring' */
  type?: LoadingType;
  /** 图标与文字颜色：预设色名或任意 CSS 颜色，默认 'primary' */
  color?: string;
  /** 图标尺寸，默认 '24px' */
  size?: string | number;
  /** 遮罩背景色（任意 CSS 颜色，覆盖默认的 bg-white/80 dark:bg-gray-9/80） */
  background?: string;
  /** 遮罩根节点附加类名 */
  customClass?: ClassValue;
  /** 遮罩层级；默认：局部 2000，全屏 3000 */
  zIndex?: number;
}

/** 可动态更新的选项（patch 支持的字段） */
export type LoadingPatchOptions = Partial<
  Pick<LoadingOptions, 'text' | 'type' | 'color' | 'size' | 'background' | 'customClass' | 'zIndex' | 'lock'>
>;

/** useLoading 返回的实例 */
export interface LoadingInstance {
  /** 关闭遮罩（等淡出过渡结束后卸载） */
  close: () => void;
  /** 更新加载文字 */
  setText: (text: string) => void;
  /** 动态更新可视化选项 */
  patch: (options: LoadingPatchOptions) => void;
}

/** 内部句柄：在 LoadingInstance 之上补充指令所需的能力（显隐复用、立即销毁） */
export interface LoadingHandle extends LoadingInstance {
  /** 直接切换显隐（不销毁实例，供 v-loading 快速开关复用同一实例） */
  setVisible: (visible: boolean) => void;
  /** 立即销毁（不等待过渡，供指令 unmounted 时彻底清理） */
  destroy: () => void;
  /** 是否已彻底销毁 */
  readonly closed: boolean;
}

/**
 * 遮罩可视化 props（传递给 RebornLoadingMask 的响应式部分）
 * ⚠️ 根因：customClass 若保留 ClassValue（tailwind-merge 的递归联合类型），
 * 在 render 内的 props 字面量赋值处会触发类型推导深度爆炸（TS2589）
 * ✅ 修复：公共 API（LoadingOptions）保留 ClassValue，进入核心时统一用 cn() 归一化为 string
 */
interface MaskVisualProps {
  text?: string;
  type?: LoadingType;
  color?: string;
  size?: string | number;
  background?: string;
  customClass?: string;
  zIndex: number;
}

/** 将 ClassValue 归一化为 string（undefined 透传，保持「未设置」语义） */
function normalizeClass(value: ClassValue | undefined): string | undefined {
  return value === undefined ? undefined : cn(value);
}

/**
 * 遮罩渲染 props（与 RebornLoadingMaskProps 字段对齐的本地类型）
 * ⚠️ 根因：直接引用 .vue 导出的 Props 接口会牵入 SFC 生成的组件类型，
 * 叠加 ClassValue（clsx 递归类型）导致 h() / 赋值处类型推导深度爆炸（TS2589）
 * ✅ 修复：用本地接口收口 props 类型，h() 调用处以 Component 宽化组件类型
 */
interface MaskRenderProps extends MaskVisualProps {
  visible: boolean;
  fixed: boolean;
  style?: Record<string, string>;
  viewportStyle?: Record<string, string>;
  onAfterLeave: () => void;
}

/** SSR / 目标缺失时的空实现，保证调用方无需判空 */
const noopHandle: LoadingHandle = {
  close: () => { },
  setText: () => { },
  patch: () => { },
  setVisible: () => { },
  destroy: () => { },
  closed: true,
};

/**
 * 创建一个加载遮罩实例（指令与 hook 共享的底层核心）
 * 创建即显示；关闭 / 销毁请通过返回句柄操作
 */
export function createLoading(options: LoadingOptions = {}): LoadingHandle {
  // SSR 安全：服务端不做任何 DOM 操作
  if (typeof document === 'undefined') return { ...noopHandle };

  // 未指定 target 时默认全屏（与 Element Plus 语义一致）
  const fullscreen = options.fullscreen ?? !options.target;

  // 解析目标元素（选择器 → DOM；找不到时回退 body 并告警）
  let target: HTMLElement = document.body;
  if (!fullscreen && options.target) {
    const resolved = typeof options.target === 'string'
      ? document.querySelector<HTMLElement>(options.target)
      : options.target;
    if (resolved) {
      target = resolved;
    } else {
      console.warn(`[useLoading] 未找到目标元素：${String(options.target)}，已回退到 document.body`);
    }
  }

  // body 模式：遮罩挂到 body，fixed + 目标矩形定位（矩形创建时快照一次，与 Element Plus 一致）
  const bodyMode = !fullscreen && options.body === true && target !== document.body;
  const mountParent = fullscreen || bodyMode ? document.body : target;
  const useFixed = fullscreen || bodyMode;

  let rectStyle: Record<string, string> | undefined;
  if (bodyMode) {
    const rect = target.getBoundingClientRect();
    rectStyle = {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  }

  // 定位修复：局部遮罩要求宿主为定位元素，static 时临时加 relative（记录原内联值，销毁时还原）
  let restorePosition: (() => void) | null = null;
  if (!useFixed && getComputedStyle(target).position === 'static') {
    const originalPosition = target.style.position;
    target.style.position = 'relative';
    restorePosition = () => {
      target.style.position = originalPosition;
    };
  }

  // ---- 滚动容器覆盖 ----
  // ⚠️ 根因：宿主自身是滚动容器时，absolute + inset-0 的遮罩只有可视一屏大小，滚动后被滚出可视区；
  // 若改用 scroll 事件 + translate 跟随，事件回调相对合成器滚动是异步的，快速滚动会闪出未遮挡内容
  // ✅ 修复：遮罩直接铺满整个滚动内容（scrollWidth × scrollHeight），天然无滞后；
  // 图标区用 sticky 钉在可视区域（reborn-loading-mask.config 的 viewport 槽），由合成器同步定位
  const coverStyle = ref<Record<string, string> | undefined>();
  const viewportStyle = ref<Record<string, string> | undefined>();
  let remeasure: (() => void) | null = null;
  let stopMeasure: (() => void) | null = null;
  if (!useFixed) {
    const measure = () => {
      const cover = { width: `${target.scrollWidth}px`, height: `${target.scrollHeight}px` };
      const viewport = { width: `${target.clientWidth}px`, height: `${target.clientHeight}px` };
      // 逐值比较：滚动监听高频触发，仅在尺寸真实变化时才更新响应式引用
      if (coverStyle.value?.width !== cover.width || coverStyle.value?.height !== cover.height) {
        coverStyle.value = cover;
      }
      if (viewportStyle.value?.width !== viewport.width || viewportStyle.value?.height !== viewport.height) {
        viewportStyle.value = viewport;
      }
    };
    measure();
    remeasure = measure;
    // 可视尺寸变化（容器缩放）由 ResizeObserver 感知
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    // 内容增长（scrollHeight 变化）不触发 ResizeObserver，滚动时兜底重测（无变化则为空操作）
    target.addEventListener('scroll', measure, { passive: true });
    stopMeasure = () => {
      observer.disconnect();
      target.removeEventListener('scroll', measure);
    };
  }

  // ---- 滚动锁 ----
  // 全屏：复用全局引用计数锁（与 RebornOverlay 同一个计数器，避免两套锁互相踩踏）
  // 局部：为目标元素加 overflow:hidden（记录原内联值，还原时恢复）
  const scrollLock = useGlobalScrollLock();
  let lockEnabled = options.lock === true;
  let restoreOverflow: (() => void) | null = null;
  let lockReleaseTimer: ReturnType<typeof setTimeout> | null = null;

  const applyLock = () => {
    // 重新显示时取消挂起的延迟释放
    if (lockReleaseTimer) {
      clearTimeout(lockReleaseTimer);
      lockReleaseTimer = null;
    }
    if (!lockEnabled) return;
    if (fullscreen) {
      scrollLock.acquire();
    } else if (!restoreOverflow) {
      const originalOverflow = target.style.overflow;
      target.style.overflow = 'hidden';
      restoreOverflow = () => {
        target.style.overflow = originalOverflow;
      };
    }
  };

  const releaseLock = () => {
    scrollLock.release();
    if (restoreOverflow) {
      restoreOverflow();
      restoreOverflow = null;
    }
  };

  /** 延迟到淡出过渡结束后再释放锁，避免退场动画期间页面提前恢复滚动（与 RebornOverlay 一致） */
  const scheduleReleaseLock = () => {
    if (lockReleaseTimer) clearTimeout(lockReleaseTimer);
    lockReleaseTimer = setTimeout(() => {
      lockReleaseTimer = null;
      releaseLock();
    }, LOADING_MASK_DURATION);
  };

  // ---- 响应式渲染 ----
  const defaultZIndex = options.zIndex ?? (fullscreen ? 3000 : 2000);
  const visible = ref(true);
  const maskProps = ref<MaskVisualProps>({
    text: options.text,
    type: options.type,
    color: options.color,
    size: options.size,
    background: options.background,
    customClass: normalizeClass(options.customClass),
    zIndex: defaultZIndex,
  });

  let destroyed = false;
  let pendingDestroy = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  // display:contents：容器自身不参与宿主的 flex/grid 布局（空 div 会吃掉 gap / 占据网格轨道），
  // 遮罩（absolute）直接以宿主为定位基准
  const container = document.createElement('div');
  container.style.display = 'contents';
  mountParent.appendChild(container);

  // 与 useOverlay 一致：先 defineComponent 得到具体组件类型，再交给 createApp（对象字面量直传会触发深度推导）
  const MaskWrapper = defineComponent({
    setup() {
      return () => {
        // props 对象用本地 MaskRenderProps 收口类型（原因见其类型定义处的根因注释）
        const propsForMask: MaskRenderProps = {
          ...maskProps.value,
          visible: visible.value,
          fixed: useFixed,
          // fixed 模式用目标矩形快照定位；局部模式铺满整个滚动内容
          style: useFixed ? rectStyle : coverStyle.value,
          // 局部模式的可视区尺寸：sticky 图标区按此定高定宽，钉在滚动可视范围内
          viewportStyle: useFixed ? undefined : viewportStyle.value,
          onAfterLeave: () => {
            // 仅在 close() 发起的隐藏后销毁；指令的 setVisible(false) 保留实例以便快速重开
            if (pendingDestroy) destroy();
          },
        };
        return h(RebornLoadingMask as Component, propsForMask);
      };
    },
  });

  const app = createApp(MaskWrapper);
  app.mount(container);
  // 创建即显示，立即上锁
  applyLock();

  /** 立即销毁：卸载 Vue 实例、移除容器、还原宿主样式、释放滚动锁 */
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (lockReleaseTimer) clearTimeout(lockReleaseTimer);
    stopMeasure?.();
    app.unmount();
    container.remove();
    restorePosition?.();
    releaseLock();
  };

  /** 切换显隐（不销毁实例）：显示走淡入，隐藏走淡出并延迟释放锁 */
  const setVisible = (v: boolean) => {
    if (destroyed) return;
    if (v) {
      // ⚠️ 根因：快速 false→true 开关时，上一次 close/隐藏 的 afterLeave 或兜底定时器
      // 可能在重开后触发，导致刚显示的遮罩被误销毁
      // ✅ 修复：重开时撤销销毁意图并清掉兜底定时器（相当于代次作废）
      pendingDestroy = false;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      // 隐藏期间宿主内容 / 尺寸可能已变化，重新显示前重测覆盖尺寸
      remeasure?.();
      visible.value = true;
      applyLock();
    } else if (visible.value) {
      visible.value = false;
      scheduleReleaseLock();
    }
  };

  /** 关闭：淡出过渡结束后彻底销毁 */
  const close = () => {
    if (destroyed) return;
    if (!visible.value) {
      // 已处于隐藏态（或淡出中）：直接销毁
      destroy();
      return;
    }
    pendingDestroy = true;
    visible.value = false;
    scheduleReleaseLock();
    // ⚠️ 根因：宿主 display:none 等场景下过渡可能不触发 afterLeave，实例会泄漏
    // ✅ 修复：兜底定时器在过渡时长后强制销毁（正常路径下 afterLeave 先触发，destroy 幂等）
    fallbackTimer = setTimeout(destroy, LOADING_MASK_DURATION + 100);
  };

  /** 动态更新可视化选项与 lock 开关 */
  const patch = (opts: LoadingPatchOptions) => {
    if (destroyed) return;
    const { lock, customClass, ...visual } = opts;

    // lock 动态开关：开启且当前可见时立即上锁；关闭时立即释放
    if (lock !== undefined && lock !== lockEnabled) {
      lockEnabled = lock;
      if (lock) {
        if (visible.value) applyLock();
      } else {
        releaseLock();
      }
    }

    const next: MaskVisualProps = {
      ...maskProps.value,
      ...visual,
      // customClass 需归一化为 string（原因见 MaskVisualProps 的根因注释）；未显式传入时保留现值
      customClass: 'customClass' in opts ? normalizeClass(customClass) : maskProps.value.customClass,
      // zIndex 传 undefined 视为还原默认层级
      zIndex: visual.zIndex ?? ('zIndex' in visual ? defaultZIndex : maskProps.value.zIndex),
    };

    // 浅比较跳过无变化的更新（指令 updated 钩子每次组件更新都会调用）
    const keys = Object.keys(next) as (keyof MaskVisualProps)[];
    const changed = keys.some((key) => next[key] !== maskProps.value[key]);
    if (changed) maskProps.value = next;
  };

  const setText = (text: string) => patch({ text });

  return {
    close,
    setText,
    patch,
    setVisible,
    destroy,
    get closed() {
      return destroyed;
    },
  };
}

// 全屏单例：与 Element Plus 一致，全屏遮罩重复调用返回同一个实例
let fullscreenHandle: LoadingHandle | null = null;

/** 收敛为对外实例（隐藏 setVisible / destroy 等内部能力） */
function toInstance(handle: LoadingHandle): LoadingInstance {
  return {
    close: handle.close,
    setText: handle.setText,
    patch: handle.patch,
  };
}

/**
 * 服务式加载遮罩
 *
 * ```ts
 * const loading = useLoading({ text: '加载中...' }) // 未指定 target 时默认全屏
 * loading.setText('即将完成')
 * loading.close()
 * ```
 */
export function useLoading(options: LoadingOptions = {}): LoadingInstance {
  // SSR 安全：服务端返回空实现
  if (typeof document === 'undefined') return toInstance({ ...noopHandle });

  const fullscreen = options.fullscreen ?? !options.target;

  // 全屏单例：已有未关闭的全屏实例时直接复用
  if (fullscreen && fullscreenHandle && !fullscreenHandle.closed) {
    return toInstance(fullscreenHandle);
  }

  const handle = createLoading(options);
  if (fullscreen) fullscreenHandle = handle;
  return toInstance(handle);
}
