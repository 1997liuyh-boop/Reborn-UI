import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { runInThisContext } from 'node:vm';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

/**
 * 组合式函数测试的公共环境
 *
 * 必须先 installDom() 再加载 vue：runtime-dom 与 @vueuse/core 在模块求值时就读取 document / window，
 * 晚于加载会被判定为服务端环境。
 */

/** 安装 jsdom 全局对象（pretendToBeVisual 提供 requestAnimationFrame，Vue 过渡依赖它推进） */
export function installDom() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
  const keys = [
    'window', 'document', 'navigator', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'NodeList',
    'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  ] as const;
  for (const key of keys) {
    const value = dom.window[key];
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: typeof value === 'function' && /^[a-z]/.test(key) ? value.bind(dom.window) : value });
  }
  return dom;
}

/**
 * 用 esbuild 打包 app 内的一个模块后在当前上下文执行
 * - .vue 经 compiler-sfc 编译；依赖包保持外部引用，与测试代码共享同一个 vue 实例
 * - 模块里 Nuxt 自动导入的标识符（useToast 等）在运行时按全局变量解析，由测试自行挂到 globalThis
 */
export async function loadAppModule<T>(source: string): Promise<T> {
  const result = await build({
    entryPoints: [path.resolve(source)],
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    packages: 'external',
    alias: { '~': path.resolve('app'), '@': path.resolve('app') },
    plugins: [{
      name: 'vue-sfc',
      setup(builder) {
        builder.onLoad({ filter: /\.vue$/ }, (args) => {
          const { descriptor } = parse(readFileSync(args.path, 'utf8'), { filename: args.path });
          const compiled = compileScript(descriptor, {
            id: args.path,
            inlineTemplate: true,
            fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
          });
          return { contents: compiled.content, loader: 'ts', resolveDir: path.dirname(args.path) };
        });
      },
    }],
  });
  const module = { exports: {} as T };
  runInThisContext(`(function(module, exports, require) { ${result.outputFiles[0]!.text}\n})`)(module, module.exports, createRequire(import.meta.url));
  return module.exports;
}

/** 等待 Vue 更新与若干毫秒的定时器 / 动画帧 */
export async function wait(ms = 0) {
  const { nextTick } = await import('vue');
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, ms));
  await nextTick();
}
