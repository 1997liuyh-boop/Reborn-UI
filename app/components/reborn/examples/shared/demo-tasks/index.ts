/**
 * 演示共享的定时任务工具：Dialog、Loading 等演示的一次性定时器与等待流程统一由它持有，
 * 演示卸载时调用 dispose() 取消回调，并让挂起的等待以 false 结束。
 * 文件名用 index.ts，是因为 nuxt.config 的组件扫描会跳过所有 index.ts 文件，避免这个纯 TS 工具被注册成全局组件。
 */
export function createDemoTasks() {
  let disposed = false;
  const pending = new Map<ReturnType<typeof setTimeout>, () => void>();

  function schedule(callback: () => void, delay: number) {
    if (disposed) return null;
    const timer = setTimeout(() => {
      pending.delete(timer);
      callback();
    }, delay);
    pending.set(timer, () => {});
    return timer;
  }

  function wait(delay: number): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        pending.delete(timer);
        resolve(true);
      }, delay);
      pending.set(timer, () => resolve(false));
    });
  }

  function dispose() {
    disposed = true;
    for (const [timer, cancel] of pending) {
      clearTimeout(timer);
      cancel();
    }
    pending.clear();
  }

  return { schedule, wait, dispose };
}
