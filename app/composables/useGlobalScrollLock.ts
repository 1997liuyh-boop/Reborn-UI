import type { Ref } from 'vue';
import { useScrollLock } from '@vueuse/core';

/**
 * 全局滚动锁（引用计数）
 *
 * ⚠️ 根因：若 RebornOverlay 与 v-loading / useLoading 各自维护一套锁，
 * 一方释放时会把另一方仍需要的锁一并解开（互相踩踏）。
 * ✅ 修复：所有使用方共享同一个模块级计数器，计数 > 0 开锁、归零才真正解锁。
 */

// 模块级共享状态：全部滚动锁使用方（RebornOverlay / v-loading / useLoading）共用
let globalLockCount = 0;
let isBodyLocked: Ref<boolean> | null = null;
let isHtmlLocked: Ref<boolean> | null = null;

/**
 * 获取一个全局滚动锁的使用凭据
 * - 每个调用方持有独立的持锁标记，acquire / release 幂等（重复调用不会重复计数）
 * - 同时锁 body 与 documentElement（部分浏览器滚动容器不同），禁止手写 overflow 补偿
 */
export function useGlobalScrollLock() {
  // 当前调用方是否持有锁（闭包内独立标记）
  let lockedByMe = false;

  /** 上锁：首次调用使全局计数 +1，计数 > 0 时锁定页面滚动 */
  const acquire = () => {
    // SSR 安全：服务端无 document，直接跳过
    if (typeof document === 'undefined') return;
    if (!isBodyLocked) {
      isBodyLocked = useScrollLock(document.body);
      isHtmlLocked = useScrollLock(document.documentElement);
    }

    if (!lockedByMe) {
      lockedByMe = true;
      globalLockCount++;
      if (globalLockCount > 0) {
        if (isBodyLocked) isBodyLocked.value = true;
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
        if (isBodyLocked) isBodyLocked.value = false;
        if (isHtmlLocked) isHtmlLocked.value = false;
      }
    }
  };

  /** 当前调用方是否持有锁 */
  const isHolding = () => lockedByMe;

  return { acquire, release, isHolding };
}
