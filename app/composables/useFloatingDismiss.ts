import type { InjectionKey, MaybeRefOrGetter } from "vue";
import { getCurrentScope, inject, onScopeDispose, provide, toValue, watch } from "vue";

/**
 * 浮层的外部关闭判定：在外部按下、带动触发器位移的滚动、焦点移进 iframe，三种情况调用 onDismiss
 *
 * RebornPopover、RebornSelectTrigger（各下拉类组件共用）、RebornContextMenu 直接调用，
 * RebornPopconfirm 基于 RebornPopover 实现而间接复用。
 * - 按下判定挂在 document 的 pointerdown 捕获阶段：外部元素的 @click.stop 拦不住，判定时点中的节点也一定还在 DOM 里
 * - 滚动只在页面或触发器所在容器滚动时关闭，浮层内部、嵌套子浮层、与触发器无关的容器滚动都放行
 * - 全局监听只在展开期间挂载，收起或组件卸载时移除
 * - 嵌套浮层逐级登记：所有调用方共用下方的注入键，子浮层传送到 body 后不是父浮层的 DOM 后代，
 *   在子浮层里点击、滚动都不算父浮层的外部
 */

/** 嵌套浮层登记函数：子级把自己的判定函数交给父级，返回注销函数 */
export type NestedOverlayRegistry = (contains: (node: Node | null) => boolean) => () => void;

/**
 * 所有调用方共用同一个注入键：Popover 里放 Select、Select 面板里放 Popover，
 * 两个方向的嵌套都能互相登记，点子浮层不会关掉外层。
 * 用带类型的 Symbol：提供方与注入方共享登记函数的类型，也不会与使用方自己的字符串键冲突
 */
export const NESTED_OVERLAY_KEY: InjectionKey<NestedOverlayRegistry> = Symbol("reborn-nested-overlay");

/** 关闭原因：在外部按下 / 带动触发器位移的滚动 / 焦点移进 iframe（在 iframe 里点击，文档收不到按下事件） */
export type FloatingDismissReason = "click-outside" | "scroll" | "iframe";

export interface FloatingDismissOptions {
  /** 当前是否展开；只在展开期间挂全局监听，页面上大量收起的浮层不占事件开销 */
  open: () => boolean;
  /** 监听生命周期可覆盖离场动画；此 getter 只控制是否允许触发关闭。 */
  dismissEnabled?: () => boolean;
  /** 共用捕获阶段的滚动监听维护浮层位置，避免宿主重复登记。 */
  onViewportScroll?: (event: Event) => void;
  /** 本浮层自己的交互范围，通常是触发器外层与面板；在这些元素里按下、滚动都不算外部 */
  elements: () => Array<Element | null | undefined>;
  /** 触发器锚点：只有带动它位移的滚动才关闭，无关容器的滚动（如轮播图自动播放）不关闭 */
  anchor: () => Element | null | undefined;
  /** 是否启用点击外部关闭 */
  closeOnClickOutside: MaybeRefOrGetter<boolean>;
  /** 外部点击的判定时机；mousedown 使用 pointerdown 同时覆盖触屏 */
  closeOn?: MaybeRefOrGetter<'mousedown' | 'click'>;
  /** 是否启用滚动关闭 */
  closeOnScroll: MaybeRefOrGetter<boolean>;
  /** 是否在外部 wheel/touchstart 时提前关闭；默认仍只响应实际滚动 */
  closeOnScrollIntent?: MaybeRefOrGetter<boolean>;
  /** 需要关闭时调用 */
  onDismiss: (reason: FloatingDismissReason, event: Event) => void;
}

export function useFloatingDismiss(options: FloatingDismissOptions) {
  /** 已登记的嵌套子浮层判定 */
  const nestedContains = new Set<(node: Node | null) => boolean>();

  /** 节点是否属于本浮层或任一层嵌套子浮层 */
  function contains(node: Node | null) {
    if (!node) return false;
    for (const el of options.elements()) {
      if (el?.contains(node)) return true;
    }
    for (const childContains of nestedContains) {
      if (childContains(node)) return true;
    }
    return false;
  }

  provide(NESTED_OVERLAY_KEY, (childContains) => {
    nestedContains.add(childContains);
    return () => nestedContains.delete(childContains);
  });
  const unregisterFromParent = inject(NESTED_OVERLAY_KEY, null)?.(contains);

  /** pointerdown 覆盖鼠标、触屏与触控笔，按下即判定，不必等抬起后模拟出的 mousedown */
  function onPointerDown(event: Event) {
    if (!options.open() || options.dismissEnabled?.() === false || !toValue(options.closeOnClickOutside)) return;
    if (!contains(event.target as Node)) options.onDismiss("click-outside", event);
  }

  /**
   * 滚动只代表「某个容器滚动了」：浮层内部的列表滚动、嵌套子浮层的滚动、与触发器无关的容器滚动都放行，
   * 只有页面或触发器所在容器的滚动——也就是会让浮层与触发器错位的那种——才关闭
   */
  function onScroll(event: Event) {
    options.onViewportScroll?.(event);
    if (!options.open() || options.dismissEnabled?.() === false || !toValue(options.closeOnScroll)) return;
    const target = event.target;
    if (target instanceof Node && contains(target)) return;
    const anchor = options.anchor();
    // 页面级滚动的 target 是 document（不是 Element），一律视为会带动触发器
    const movesAnchor = !anchor || !(target instanceof Element) || target.contains(anchor);
    if (movesAnchor) options.onDismiss("scroll", event);
  }

  /** 滚轮和触摸可能先于 scroll 发生；只在浮层及嵌套浮层之外响应。 */
  function onScrollIntent(event: Event) {
    if (!options.open() || options.dismissEnabled?.() === false || !toValue(options.closeOnScroll) || !toValue(options.closeOnScrollIntent)) return;
    if (!contains(event.target as Node)) options.onDismiss("scroll", event);
  }

  /** 失焦后延迟判定的定时器：收起或卸载时清掉，避免在已卸载的组件上触发 onDismiss */
  let blurTimer: ReturnType<typeof setTimeout> | undefined;

  function clearBlurTimer() {
    if (blurTimer !== undefined) {
      clearTimeout(blurTimer);
      blurTimer = undefined;
    }
  }

  /** 在 iframe 里点击不会派发到本文档，只能从窗口失焦、焦点落在 iframe 上间接得知 */
  function onWindowBlur(event: FocusEvent) {
    if (!options.open() || options.dismissEnabled?.() === false || !toValue(options.closeOnClickOutside)) return;
    // 失焦当下 activeElement 可能还没切到 iframe，等这一轮事件处理完再读
    clearBlurTimer();
    blurTimer = setTimeout(() => {
      blurTimer = undefined;
      if (options.open() && options.dismissEnabled?.() !== false && document.activeElement instanceof HTMLIFrameElement)
        options.onDismiss("iframe", event);
    });
  }

  let bound = false;
  let outsideEvent: 'pointerdown' | 'click' = 'pointerdown';

  function bind() {
    if (bound || typeof window === "undefined") return;
    bound = true;
    outsideEvent = toValue(options.closeOn) === 'click' ? 'click' : 'pointerdown';
    document.addEventListener(outsideEvent, onPointerDown, true);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("wheel", onScrollIntent, { capture: true, passive: true });
    document.addEventListener("touchstart", onScrollIntent, { capture: true, passive: true });
    window.addEventListener("blur", onWindowBlur);
  }

  function unbind() {
    clearBlurTimer();
    if (!bound) return;
    bound = false;
    document.removeEventListener(outsideEvent, onPointerDown, true);
    window.removeEventListener("scroll", onScroll, true);
    document.removeEventListener("wheel", onScrollIntent, true);
    document.removeEventListener("touchstart", onScrollIntent, true);
    window.removeEventListener("blur", onWindowBlur);
  }

  // 打开动作本身的 pointerdown 已经发生在挂监听之前，不会被当成外部点击立刻关掉
  watch(options.open, value => (value ? bind() : unbind()), { immediate: true });
  watch(() => toValue(options.closeOn), () => {
    if (bound) { unbind(); bind(); }
  });

  // 清理绑定到当前作用域：组件卸载与 effectScope 停止都会执行（onBeforeUnmount 只在组件实例里生效）
  if (getCurrentScope()) {
    onScopeDispose(() => {
      unbind();
      unregisterFromParent?.();
    });
  }

  return { contains };
}
