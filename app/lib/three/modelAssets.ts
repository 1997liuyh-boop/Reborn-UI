import { retargetingModels } from "../../components/common/landing/retargetingHero.config";

/**
 * 首页角色模型的下载缓存。
 *
 * 这个模块刻意不引入 three：首页一挂载就调用 prefetchLandingModels，
 * 让约 1.5MB 的模型与 three/webgpu 大包、渲染器初始化并行下载，而不是等场景建好才开始请求。
 * 两个场景都用 Soldier.glb，同一 URL 只发一次请求；解析仍各自进行，互不共享对象。
 */
const buffers = new Map<string, Promise<ArrayBuffer>>();

/** 把 /models/... 这类站内路径按 app.baseURL 解析成绝对地址 */
export function resolveModelURL(path: string, baseURL = "/") {
  return new URL(path.replace(/^\//, ""), new URL(baseURL, window.location.origin)).href;
}

function download(url: string) {
  let task = buffers.get(url);
  if (!task) {
    // 共享请求本身不绑定任何调用方的取消信号：一方切页取消，另一方仍在等同一份数据
    task = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`模型请求失败：${response.status}`);
      return response.arrayBuffer();
    });
    // 失败的请求移出缓存，「重新加载」时才会真的重新发起
    task.catch(() => buffers.delete(url));
    buffers.set(url, task);
  }
  return task;
}

/** 读取模型二进制；signal 只决定当前调用方是否继续等待，不会中断共享的下载 */
export function loadModelBuffer(url: string, signal: AbortSignal) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    download(url).then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/** 首页挂载时调用：提前开始下载全部角色模型，失败不在这里报错，交给场景自己的错误提示 */
export function prefetchLandingModels(baseURL?: string) {
  for (const path of retargetingModels) download(resolveModelURL(path, baseURL)).catch(() => {});
}
