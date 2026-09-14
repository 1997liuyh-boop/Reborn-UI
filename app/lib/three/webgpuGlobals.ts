/**
 * three/webgpu 的全局常量兜底。
 *
 * three 0.182 的 three.webgpu.js 里有这么一行（源码 70607 行）：
 *   const GPUShaderStage = ( typeof self !== 'undefined' ) ? self.GPUShaderStage : { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 };
 * 守卫判断的是 self 存不存在，而不是 self.GPUShaderStage 存不存在。浏览器里 self 永远存在，
 * 于是非安全上下文（http 明文访问、部分 WebView）会取到 undefined，紧接着模块顶层的
 *   const gpuShaderStageLib = { 'vertex': GPUShaderStage.VERTEX, ... };
 * 直接抛 TypeError: Cannot read properties of undefined (reading 'VERTEX')。
 *
 * 这个错发生在模块求值阶段，早于任何业务代码，因此组件里的 WebGL 兼容模式重试救不了它：
 * 错误没经过 createRetargetingScene 的 catch，不带 retryWithWebGL 标记，
 * 用户只会看到一条英文原文报错，点「使用兼容模式」也没用。
 *
 * 这里在 import three/webgpu 之前补齐常量，让模块能求值完。
 * 值取自 WebGPU 规范的 GPUShaderStage 位标志，与 three 自身的兜底分支一致；
 * 真正没有 WebGPU 的环境随后由 WebGPURenderer 正常回落到 WebGL 后端。
 *
 * 注：GPUBufferUsage 等其余 WebGPU 全局只在 WebGPUBackend 的方法体内读取，
 * 没有 WebGPU 设备时根本不会执行到，因此不需要一并兜底。
 */

/** WebGPU 规范定义的着色器阶段位标志 */
const SHADER_STAGE_FALLBACK = { VERTEX: 1, FRAGMENT: 2, COMPUTE: 4 } as const;

/**
 * 补齐 self.GPUShaderStage。幂等，可重复调用。
 * 必须在 three/webgpu 被求值之前执行。
 */
export function ensureWebGPUGlobals() {
  // 仅在浏览器打补丁：Node 端没有 self，three 的 typeof self 守卫会自己走兜底分支，不会崩，
  // 没必要污染服务端的全局对象。
  if (!("window" in globalThis)) return;
  // 浏览器主线程与 Worker 里 self 都恒等于 globalThis，写 globalThis 即等价于写 self。
  const scope = globalThis as typeof globalThis & { GPUShaderStage?: unknown };
  if (scope.GPUShaderStage) return;
  scope.GPUShaderStage = { ...SHADER_STAGE_FALLBACK };
}

ensureWebGPUGlobals();
