/**
 * 全局单例状态管理 —— 确保页面上同时只有一个 RebornContextMenu 处于打开状态。
 *
 * 为什么需要独立文件？
 * Vue 3 的 <script setup> 中声明的变量会被编译进每个实例的 setup() 函数中，
 * 导致每个组件实例各自持有一份独立的副本，无法跨实例通信。
 * 将状态放在独立模块中，变量只在模块首次加载时初始化一次，所有实例共享同一份引用。
 */
import type { InjectionKey } from "vue";

/** 根菜单控制器：根实例创建，递归渲染的子菜单通过注入拿到同一份 */
export interface ContextMenuRootController {
  /** 根菜单 id，由根实例的 useId() 生成，服务端与客户端一致；整条菜单链共用 */
  rootId: string;
  /** 关闭整条菜单链（根菜单收起后，子菜单跟随收起） */
  closeAll: () => void;
  /** 根菜单当前是否展开；子菜单据此在根菜单收起时一并收起 */
  isOpen: () => boolean;
}

/**
 * 根控制器的注入键。必须在模块作用域声明：写在 <script setup> 里会落进每个实例的 setup()，
 * 每个实例各生成一个新 Symbol，子菜单永远注入不到根控制器
 */
export const CONTEXT_MENU_ROOT_KEY: InjectionKey<ContextMenuRootController> = Symbol("reborn-context-menu-root");

let activeRootMenuId: string | null = null;
let activeRootMenuClose: (() => void) | null = null;
let contextMenuScrollLockCount = 0;

const blockedScrollKeys = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

export function setActiveRootMenu(rootId: string, close: () => void): void {
  if (activeRootMenuId && activeRootMenuId !== rootId) {
    activeRootMenuClose?.();
  }

  activeRootMenuId = rootId;
  activeRootMenuClose = close;
}

export function clearActiveRootMenu(rootId: string): void {
  if (activeRootMenuId !== rootId) return;

  activeRootMenuId = null;
  activeRootMenuClose = null;
}

// ─── Scroll Lock ───

function preventWheelScroll(event: WheelEvent) {
  event.preventDefault();
}

function preventTouchScroll(event: TouchEvent) {
  event.preventDefault();
}

function preventKeyboardScroll(event: KeyboardEvent) {
  if (event.defaultPrevented || !blockedScrollKeys.has(event.key)) return;

  const target = event.target as HTMLElement | null;
  const isTypingTarget =
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

  if (isTypingTarget) return;

  event.preventDefault();
}

export function lockDocumentScroll(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (contextMenuScrollLockCount === 0) {
    window.addEventListener("wheel", preventWheelScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", preventTouchScroll, { passive: false, capture: true });
    window.addEventListener("keydown", preventKeyboardScroll, { passive: false, capture: true });
  }

  contextMenuScrollLockCount += 1;
}

export function unlockDocumentScroll(): void {
  if (typeof window === "undefined" || typeof document === "undefined" || contextMenuScrollLockCount === 0) return;

  contextMenuScrollLockCount -= 1;

  if (contextMenuScrollLockCount === 0) {
    window.removeEventListener("wheel", preventWheelScroll, { capture: true });
    window.removeEventListener("touchmove", preventTouchScroll, { capture: true });
    window.removeEventListener("keydown", preventKeyboardScroll, { capture: true });
  }
}
