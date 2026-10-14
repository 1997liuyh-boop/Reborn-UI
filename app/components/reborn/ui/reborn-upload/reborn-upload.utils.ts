import type { UploadChunkAdapter, UploadChunkTask, UploadData, UploadRawFile, UploadRequestHandler, UploadRequestOptions } from './reborn-upload.config';

/** 上传请求失败的错误，保留状态码、方法与地址，方便在 on-error 里区分处理。 */
export class UploadAjaxError extends Error {
  override name = 'UploadAjaxError';
  status: number;
  method: string;
  url: string;

  constructor(message: string, status: number, method: string, url: string) {
    super(message);
    this.status = status;
    this.method = method;
    this.url = url;
  }
}

/** 读取响应体：能解析成 JSON 就返回对象，否则返回原始文本。 */
export function getBody(xhr: XMLHttpRequest): unknown {
  const text = xhr.responseText || xhr.response;
  if (!text) return text;
  try {
    return JSON.parse(text);
  }
  catch {
    return text;
  }
}

/** 生成失败原因：优先取服务端返回的 message / error 字段，其次按状态码给出中文提示。 */
function getError(action: string, method: string, xhr: XMLHttpRequest) {
  if (xhr.status === 0) return new UploadAjaxError('网络错误，上传失败', 0, method, action);
  const body = getBody(xhr);
  let message = `上传失败（HTTP ${xhr.status}）`;
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const detail = record.message ?? record.error;
    if (typeof detail === 'string' && detail) message = detail;
  }
  return new UploadAjaxError(message, xhr.status, method, action);
}

/** 默认上传实现：XMLHttpRequest + FormData，返回 xhr 以便中止。 */
export const ajaxUpload: UploadRequestHandler = (options: UploadRequestOptions) => {
  if (typeof XMLHttpRequest === 'undefined') throw new Error('当前环境不支持 XMLHttpRequest');
  const xhr = new XMLHttpRequest();
  const { action, method, data, filename, file, headers, withCredentials } = options;

  if (xhr.upload) {
    xhr.upload.addEventListener('progress', (evt) => {
      const progress = evt as ProgressEvent & { percent: number };
      progress.percent = evt.total > 0 ? (evt.loaded / evt.total) * 100 : 0;
      options.onProgress(progress);
    });
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(data ?? {})) {
    // 数组按同名字段逐项追加，后端按多值字段接收。
    if (Array.isArray(value)) value.forEach(item => formData.append(key, item as string | Blob));
    else formData.append(key, value as string | Blob);
  }
  formData.append(filename, file, file.name);

  xhr.addEventListener('error', () => options.onError(getError(action, method, xhr)));
  xhr.addEventListener('load', () => {
    if (xhr.status < 200 || xhr.status >= 300) return options.onError(getError(action, method, xhr));
    options.onSuccess(getBody(xhr));
  });

  xhr.open(method, action, true);
  if (withCredentials && 'withCredentials' in xhr) xhr.withCredentials = true;

  const entries = headers instanceof Headers ? [...headers.entries()] : Object.entries(headers ?? {});
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue;
    xhr.setRequestHeader(key, String(value));
  }

  xhr.send(formData);
  return xhr;
};

let seed = 1;
/** 列表内唯一 id：时间戳加自增序号，同一毫秒内批量选择也不会撞。 */
export function genFileId() {
  return Date.now() + seed++;
}

/**
 * 按 accept 过滤文件，规则与原生 input 一致：
 * `.png` 匹配扩展名（不区分大小写），`image/*` 匹配大类，`image/png` 精确匹配 MIME。
 * 拖拽放入时浏览器不会帮忙过滤，所以组件需要自己做一遍。
 */
export function filterByAccept<T extends File>(files: T[], accept: string): T[] {
  const rules = accept.split(',').map(rule => rule.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return files;
  return files.filter((file) => {
    const name = file.name.toLowerCase();
    const type = (file.type || '').toLowerCase();
    const baseType = type.replace(/\/.*$/, '');
    return rules.some((rule) => {
      if (rule.startsWith('.')) return name.endsWith(rule);
      if (rule.endsWith('/*')) return baseType === rule.replace(/\/\*$/, '');
      return type === rule;
    });
  });
}

/** 是否图片文件，图片类列表据此生成本地预览地址。 */
export function isImageFile(file: { type?: string; name?: string }) {
  if (file.type) return file.type.startsWith('image/');
  return /\.(?:png|jpe?g|gif|webp|bmp|svg|avif|ico)$/i.test(file.name ?? '');
}

/** 是否视频文件，图片类列表据此生成本地预览地址并用 video 显示首帧。 */
export function isVideoFile(file: { type?: string; name?: string }) {
  if (file.type) return file.type.startsWith('video/');
  return /\.(?:mp4|webm|ogv|mov|m4v|mkv|avi)$/i.test(file.name ?? '');
}

/** 把拖入的条目（文件或文件夹）递归展开成扁平的文件数组。 */
export async function readEntries(entries: FileSystemEntry[]): Promise<File[]> {
  const result: File[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) => {
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null));
      });
      if (file) result.push(file);
      return;
    }
    if (!entry.isDirectory) return;
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries 每次最多返回一批（Chrome 为 100 条），读到空数组才算读完。
    while (true) {
      const batch = await new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(resolve, () => resolve([]));
      });
      if (!batch.length) break;
      for (const child of batch) await walk(child);
    }
  };
  for (const entry of entries) await walk(entry);
  return result;
}

/** 给原生文件挂上 uid，保留 File 原型以便继续当作 Blob 使用。 */
export function toRawFile(file: File, uid = genFileId()): UploadRawFile {
  const raw = file as UploadRawFile;
  raw.uid = uid;
  return raw;
}

/** 分片上传的断点记录。组件按文件保存，暂停、失败后继续时沿用，上传成功、删除、中止时丢弃。 */
export interface UploadChunkState {
  /** init 是否已成功返回。 */
  initialized: boolean;
  /** init 的返回值。 */
  context: unknown;
  /** 已完成的分片序号。 */
  done: Set<number>;
  /** 记录对应的分片大小，大小变了序号就对不上，整份记录作废。 */
  chunkSize: number;
}

export function createChunkState(): UploadChunkState {
  return { initialized: false, context: undefined, done: new Set(), chunkSize: 0 };
}

/** 断点记录里已完成分片的总字节数，暂停时据此把进度回退到真正保住的部分。 */
export function getChunkedBytes(state: UploadChunkState, size: number) {
  if (!state.chunkSize) return 0;
  let bytes = 0;
  for (const index of state.done) bytes += Math.max(0, Math.min(size, (index + 1) * state.chunkSize) - index * state.chunkSize);
  return bytes;
}

export interface UploadInChunksOptions {
  adapter: UploadChunkAdapter;
  file: UploadRawFile;
  data: UploadData;
  headers: UploadChunkTask['headers'];
  withCredentials: boolean;
  /** 外部中止信号：暂停、删除、中止时触发。 */
  signal: AbortSignal;
  /** 断点记录，调用过程中会被原地更新。 */
  state: UploadChunkState;
  /** 已上传字节数变化时回调：已完成分片的字节数加上传输中分片已报告的部分。 */
  onProgress: (loaded: number, total: number) => void;
}

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

function toCount(value: number | undefined, fallback: number, min: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min ? Math.floor(value) : fallback;
}

/** 可被中止的等待，用于分片重试前的退避。 */
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * 按适配器分片上传一个文件，resolve 的值是 merge 的返回值。
 * 流程：init（断点记录里已有则跳过）→ uploaded 查询已传分片 → 并发上传其余分片（单片失败按退避重试）→ merge。
 * 任一分片重试耗尽时中止其余分片并 reject 该错误；外部信号中止时 reject 中止原因。
 */
export async function uploadInChunks(options: UploadInChunksOptions): Promise<unknown> {
  const { adapter, file, state } = options;
  const chunkSize = toCount(adapter.chunkSize, DEFAULT_CHUNK_SIZE, 1);
  const concurrency = toCount(adapter.concurrency, 3, 1);
  const retries = toCount(adapter.retries, 2, 0);
  // 空文件也按 1 片处理，保证 init → merge 的流程完整。
  const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize));
  if (state.chunkSize !== chunkSize) Object.assign(state, createChunkState(), { chunkSize });

  // 内部控制器：外部中止或某个分片重试耗尽时，一并通知其余并发中的分片。
  const inner = new AbortController();
  const forward = () => inner.abort(options.signal.reason);
  if (options.signal.aborted) forward();
  else options.signal.addEventListener('abort', forward, { once: true });
  const signal = inner.signal;

  const task: UploadChunkTask = {
    file,
    chunkSize,
    chunkCount,
    data: options.data,
    headers: options.headers,
    withCredentials: options.withCredentials,
    signal,
  };
  const rangeOf = (index: number) => [index * chunkSize, Math.min(file.size, (index + 1) * chunkSize)] as const;
  const inflight = new Map<number, number>();
  const report = () => {
    let loaded = getChunkedBytes(state, file.size);
    for (const bytes of inflight.values()) loaded += bytes;
    options.onProgress(Math.min(loaded, file.size), file.size);
  };

  try {
    signal.throwIfAborted();
    if (!state.initialized) {
      state.context = await adapter.init(task);
      state.initialized = true;
      signal.throwIfAborted();
    }
    const contextTask = { ...task, context: state.context };
    if (adapter.uploaded) {
      // 以服务端为准：它报告的已传分片覆盖本地记录，过滤掉越界或非整数的序号。
      const indexes = await adapter.uploaded(contextTask);
      signal.throwIfAborted();
      state.done = new Set((Array.isArray(indexes) ? indexes : []).filter(index => Number.isInteger(index) && index >= 0 && index < chunkCount));
    }
    report();

    const queue = Array.from({ length: chunkCount }, (_, index) => index).filter(index => !state.done.has(index));
    const runChunk = async (index: number) => {
      const [start, end] = rangeOf(index);
      const blob = file.slice(start, end);
      for (let attempt = 0; ; attempt++) {
        inflight.set(index, 0);
        try {
          await adapter.uploadChunk({
            ...contextTask,
            index,
            start,
            end,
            blob,
            onProgress: (percent) => {
              // 中止或本次尝试已结束后，迟到的进度不再计入。
              if (signal.aborted || !inflight.has(index)) return;
              inflight.set(index, ((end - start) * Math.min(100, Math.max(0, percent || 0))) / 100);
              report();
            },
          });
          inflight.delete(index);
          // 中止后才返回成功的分片服务端已收到，照样记为完成，继续上传时不必重传。
          state.done.add(index);
          report();
          return;
        }
        catch (error) {
          inflight.delete(index);
          if (signal.aborted) throw signal.reason;
          if (attempt >= retries) throw error;
          report();
          await sleep(1000 * (attempt + 1), signal);
        }
      }
    };
    const worker = async () => {
      while (queue.length) {
        signal.throwIfAborted();
        try {
          await runChunk(queue.shift()!);
        }
        catch (error) {
          inner.abort(error);
          throw error;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
    signal.throwIfAborted();
    return await adapter.merge(contextTask);
  }
  finally {
    options.signal.removeEventListener('abort', forward);
  }
}
