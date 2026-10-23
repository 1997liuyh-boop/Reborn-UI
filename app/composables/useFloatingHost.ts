import type { InjectionKey } from "vue";
import { inject, provide, watch } from "vue";

/**
 * 浮层宿主：弹窗、抽屉把自身的显隐提供给内部的浮层
 *
 * 弹窗未开启 destroy-on-close、抽屉关闭时，内容只是隐藏，组件不会卸载。
 * 里面展开着的下拉、气泡卡片、文字提示收不到任何通知，而它们的面板传送到了 body，
 * 不会随容器一起隐藏，就会孤零零地留在页面上（例如按 Esc 关闭弹窗时，气泡卡片本身不响应 Esc）。
 * 容器开始关闭的同一时刻，订阅了宿主的浮层自行收起。
 *
 * RebornDialog / RebornDrawer 提供；RebornSelectTrigger（下拉类组件共用）、RebornPopover、RebornTooltip 订阅。
 */

/** 注入值：读取宿主当前是否展开 */
const FLOATING_HOST_KEY: InjectionKey<() => boolean> = Symbol("reborn-floating-host");

/** 容器侧调用：向内部浮层提供「当前是否展开」 */
export function provideFloatingHost(visible: () => boolean) {
  provide(FLOATING_HOST_KEY, visible);
}

export interface FloatingHostOptions {
  /** 浮层当前是否展开；已收起时不重复关闭 */
  open: () => boolean;
  /** 所在容器关闭时调用，由浮层收起自己 */
  onHidden: () => void;
}

/** 浮层侧调用：所在容器关闭时收起浮层；不在任何宿主内时什么也不做 */
export function useFloatingHost(options: FloatingHostOptions) {
  const hostVisible = inject(FLOATING_HOST_KEY, null);
  if (!hostVisible) return;
  watch(hostVisible, (visible) => {
    if (!visible && options.open()) options.onHidden();
  });
}
