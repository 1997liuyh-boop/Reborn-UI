/**
 * 拦截外部调试器/浏览器的端口探测请求,避免它们落进页面 catch-all 路由。
 *
 * 根因:Chrome DevTools 协议(CDP)客户端(DevTools、Playwright/Puppeteer、各类
 * "attach to node/browser" 调试器)会朝本机端口逐个发 `GET /json/version` 之类的
 * 握手请求来寻找可调试目标;Chrome 自身还会请求
 * `/.well-known/appspecific/com.chrome.devtools.json` 探测工作区配置。
 * 这些路径没有对应的服务端路由,于是被 `app/pages/[[lang]]/[...slug].vue`
 * 这个文档 catch-all 页面接住,查不到文档后抛出 `fatal: true` 的 404,
 * dev 终端里就会出现一大段指向本仓库源码的红色堆栈:
 * `[fatal] [GET] /json/version → Page not found: /json/version in collection docs`。
 * 它并非真实缺陷,却会掩盖同时发生的真错误。
 *
 * 方案:在 Nitro 层用纯 404 提前结束这些请求(与 `server/api/[...].ts` 的处理一致),
 * 不进入 SSR,因此不会产生 fatal 堆栈。探测方收到 404 即判定"该端口不是调试目标",
 * 属于其预期分支,不影响任何功能。
 */

/** 需要提前短路的探测路径前缀(按「完全相等」或「前缀 + /」匹配,避免误伤 /jsonxxx 之类真实路由) */
const PROBE_PATH_PREFIXES = ["/json", "/.well-known/appspecific"];

/** 判断请求路径是否属于调试器探测 */
function isProbePath(path: string): boolean {
  return PROBE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default defineEventHandler((event) => {
  const path = event.path.split("?")[0];
  if (!isProbePath(path)) return;

  // 这里不用 createError:404 是探测方的正常返回,无需在服务端日志里留痕
  setResponseStatus(event, 404);
  return "Not Found";
});