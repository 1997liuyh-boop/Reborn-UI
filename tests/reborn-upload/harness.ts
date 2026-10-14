/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
/* eslint antfu/no-top-level-await: off -- 内存编译完成后再挂载组件，避免生成临时产物 */
import type { TestContext } from 'node:test';
import type { UploadFile, UploadRawFile, UploadStatus, UploadUserFile } from '../../app/components/reborn/ui/reborn-upload/reborn-upload.config';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { compileScript, parse } from '@vue/compiler-sfc';
import { build } from 'esbuild';
import { createRenderer, nextTick } from 'vue';

const filename = resolve('app/components/reborn/ui/reborn-upload/RebornUpload.vue');
// 仅编译待测组件逻辑，保留真实工具函数、表单注入及 Vue 生命周期，不写临时产物。
const result = await build({
  entryPoints: [filename], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external',
  alias: { '~': resolve('app') },
  plugins: [{ name: 'upload-test', setup(builder) {
    builder.onLoad({ filter: /\.vue$/ }, ({ path }) => {
      if (path !== filename) return { contents: 'export default {}', loader: 'js' };
      const { descriptor } = parse(readFileSync(path, 'utf8'), { filename: path });
      return { contents: compileScript(descriptor, {
        id: 'upload-test', fs: { fileExists: existsSync, readFile: file => readFileSync(file, 'utf8') },
      }).content, loader: 'ts' };
    });
  } }],
});
const runtime = { exports: {} as any };
// eslint-disable-next-line no-new-func -- 仅执行本地组件的内存编译结果，保留真实生命周期且无需落盘
new Function('require', 'module', 'exports', result.outputFiles[0]!.text)(createRequire(import.meta.url), runtime, runtime.exports);
const Upload = runtime.exports.default;
Upload.render = () => null;

const renderer = createRenderer<object, object>({
  createElement: () => ({}), createText: () => ({}), createComment: () => ({}),
  insert() {}, remove() {}, setText() {}, setElementText() {}, patchProp() {},
  parentNode: () => null, nextSibling: () => null,
});

interface UploadExpose {
  handleStart: (file: UploadRawFile) => void;
  handleRemove: (file: UploadRawFile) => Promise<void>;
  submit: () => void;
  abort: (file?: UploadRawFile) => void;
  pause: (file?: UploadRawFile) => void;
  resume: (file?: UploadRawFile) => void;
  clearFiles: (statuses?: UploadStatus[]) => void;
}

let uid = 0;
export function mountUpload(t: TestContext, props: Record<string, unknown> = {}) {
  let files: UploadUserFile[] = [];
  const events: string[] = [];
  const app = renderer.createApp(Upload, {
    autoUpload: false,
    onSuccess: () => events.push('success'), onError: () => events.push('error'),
    onProgress: () => events.push('progress'), onRemove: () => events.push('remove'),
    onChange: () => events.push('change'),
    'onUpdate:fileList': (value: UploadUserFile[]) => { files = value; },
    ...props,
  });
  const api = app.mount({}) as unknown as UploadExpose;
  let mounted = true;
  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    app.unmount();
  };
  t.after(unmount);
  return {
    api, events, unmount, get files() { return files as UploadFile[]; },
    add(name = '文件.txt') {
      const file = Object.assign(new File(['abcd'], name, { type: 'text/plain' }), { uid: ++uid });
      api.handleStart(file);
      return file;
    },
  };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

export async function flush() {
  await setImmediate();
  await nextTick();
}

/** 只替换网络边界；请求构造、FormData 和业务回调仍由真实 ajaxUpload 执行。 */
export function mockNetwork(t: TestContext) {
  const requests: FakeXHR[] = [];
  class FakeXHR extends EventTarget {
    upload = new EventTarget();
    status = 200;
    responseText = '{}';
    withCredentials = false;
    body?: FormData;
    abortCalls = 0;
    constructor() { super(); requests.push(this); }
    open() {}
    setRequestHeader() {}
    send(body: FormData) { this.body = body; }
    abort() {
      this.abortCalls++;
      // 覆盖中止过程中同步触发错误，以及之后仍迟到的事件。
      this.dispatchEvent(new Event('error'));
    }
    lateEvents() {
      this.upload.dispatchEvent(new ProgressEvent('progress', { loaded: 2, total: 4, lengthComputable: true }));
      this.dispatchEvent(new Event('error'));
      this.dispatchEvent(new Event('load'));
    }
  }
  class MemoryProgressEvent extends Event {
    loaded: number;
    total: number;
    lengthComputable: boolean;
    constructor(type: string, init: ProgressEventInit = {}) {
      super(type);
      this.loaded = init.loaded ?? 0;
      this.total = init.total ?? 0;
      this.lengthComputable = init.lengthComputable ?? false;
    }
  }
  for (const [key, value] of Object.entries({ XMLHttpRequest: FakeXHR, ProgressEvent: MemoryProgressEvent })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    });
  }
  t.mock.method(globalThis, 'fetch', () => { throw new Error('回归测试禁止真实联网'); });
  return requests;
}
