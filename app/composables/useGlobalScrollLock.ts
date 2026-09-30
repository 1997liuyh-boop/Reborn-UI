import type { Ref } from 'vue';
import { useScrollLock } from '@vueuse/core';

/**
 * 全局滚动锁（引用计数）
 *
 * ⚠️ 根因：若 RebornOverlay 与 v-loading / useLoading 各自维护一套锁，
 * 一方释放时会把另一方仍需要的锁一并解开（互相踩踏）。
 * ✅ 修复：所有使用方共享同一个模块级计数器，计数 > 0 开锁、归零才真正解锁。
 */

// 模块级共享状态：Drawer / Overlay / v-loading / useLoading 共用
let globalLockCount = 0;
let isHtmlLocked: Ref<boolean> | null = null;
const scrollbarGutterClass = '[scrollbar-gutter:stable]';
let addedScrollbarGutter = false;

/**
 * 获取一个全局滚动锁的使用凭据
 * - 每个调用方持有独立的持锁标记，acquire / release 幂等（重复调用不会重复计数）
 * - 仅锁实际页面滚动元素，不改变 body 的滚动容器语义，禁止手写间距补偿
 */
export function useGlobalScrollLock() {
  // 当前调用方是否持有锁（闭包内独立标记）
  let lockedByMe = false;

  /** 上锁：首次调用使全局计数 +1，计数 > 0 时锁定页面滚动 */
  const acquire = () => {
    // SSR 安全：服务端无 document，直接跳过
    if (typeof document === 'undefined') return;
    if (!isHtmlLocked) {
      // 根因：额外给 body 设置 overflow:hidden 会改变 sticky 的参照容器，导致侧栏上移。
      // 只锁浏览器实际的页面滚动元素；未提供 scrollingElement 时回退到根元素。
      isHtmlLocked = useScrollLock(document.scrollingElement ?? document.documentElement);
    }

    if (!lockedByMe) {
      lockedByMe = true;
      if (globalLockCount === 0) {
        const root = document.documentElement;
        // 只保留已存在的滚动条占位，短页面或浮动滚动条不额外留白。
        // 使用浏览器原生占位而非 body 间距补偿，避免破坏 sticky 与已有布局。
        const hasScrollbar = root.clientWidth > 0 && window.innerWidth > root.clientWidth;
        const hasStableGutter = getComputedStyle(root).scrollbarGutter?.includes('stable');
        addedScrollbarGutter = hasScrollbar && !hasStableGutter && !root.classList.contains(scrollbarGutterClass);
        if (addedScrollbarGutter) root.classList.add(scrollbarGutterClass);
      }
      globalLockCount++;
      if (globalLockCount > 0) {
        if (isHtmlLocked) isHtmlLocked.value = true;
      }
    }
  };

  /** 解锁：仅持锁方可释放，全局计数归零时才真正恢复滚动 */
  const release = () => {
    if (lockedByMe) {
      lockedByMe = false;
      globalLockCount--;
      if (globalLockCount <= 0) {
        if (isHtmlLocked) isHtmlLocked.value = false;
        // 最后一把锁释放后仅移除本模块添加的类，保留使用方原有配置。
        if (addedScrollbarGutter) document.documentElement.classList.remove(scrollbarGutterClass);
        addedScrollbarGutter = false;
      }
    }
  };

  /** 当前调用方是否持有锁 */
  const isHolding = () => lockedByMe;

  return { acquire, release, isHolding };
}
