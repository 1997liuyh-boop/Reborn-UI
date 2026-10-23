<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type {
  UploadAwaitable,
  UploadChunkAdapter,
  UploadCrossorigin,
  UploadData,
  UploadFile,
  UploadListType,
  UploadProgressEvent,
  UploadRawFile,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadStatus,
  UploadUi,
  UploadUserFile,
} from './reborn-upload.config';
import type { UploadChunkState } from './reborn-upload.utils';
import { computed, onBeforeUnmount, ref, shallowRef, toRaw, watch } from 'vue';
import { useFormInject } from '~/composables/useFieldGroup';
import { tv } from '~/lib/tv';
import RebornLoading from '../reborn-loading/RebornLoading.vue';
import RebornProgress from '../reborn-progress/RebornProgress.vue';
import RebornText from '../reborn-text/RebornText.vue';
import RebornTooltip from '../reborn-tooltip/RebornTooltip.vue';
import theme, { uploadStatuses } from './reborn-upload.config';
import { ajaxUpload, createChunkState, filterByAccept, genFileId, getChunkedBytes, isImageFile, isVideoFile, readEntries, toRawFile, uploadInChunks } from './reborn-upload.utils';

export interface RebornUploadProps {
  /** 上传地址；使用自定义 http-request 时可以不传。 */
  action?: string;
  /** 上传请求头。 */
  headers?: Headers | Record<string, string | number | null | undefined>;
  /** 上传请求方法。 */
  method?: string;
  /** 是否允许一次选择多个文件。 */
  multiple?: boolean;
  /** 随文件一起提交的额外字段：对象、Promise，或按文件返回对象 / Promise 的函数。 */
  data?: UploadData | Promise<UploadData> | ((rawFile: UploadRawFile) => UploadAwaitable<UploadData>);
  /** 文件在表单里的字段名。 */
  name?: string;
  /** 是否携带 cookie 等跨域凭证。 */
  withCredentials?: boolean;
  /** 是否显示已选文件列表。 */
  showFileList?: boolean;
  /** 是否启用拖拽上传。 */
  drag?: boolean;
  /** 可选文件类型，写法同原生 input 的 accept；拖拽放入和选择文件夹时组件也按它过滤。 */
  accept?: string;
  /** 列表缩略图的 crossorigin 属性，原样透传给 img 与 video。 */
  crossorigin?: UploadCrossorigin;
  /** 文件列表形态：纯文字、带缩略图的列表或照片墙卡片。 */
  listType?: UploadListType;
  /** 选择文件后是否立即上传；关闭后需调用 submit() 手动上传。 */
  autoUpload?: boolean;
  /** 自定义上传实现，默认使用 XMLHttpRequest 提交 FormData。 */
  httpRequest?: UploadRequestHandler;
  /**
   * 分片上传适配器，传入后改为分片上传，http-request 不再生效。
   * 组件负责切片、并发、单片重试与跳过已传分片，列表项多出暂停 / 继续 / 重试按钮；
   * 与服务端交互的 init、uploaded、uploadChunk、merge 由使用方实现。
   */
  chunk?: UploadChunkAdapter;
  /** 是否禁用；禁用后不能选择文件，列表也不再显示删除按钮。 */
  disabled?: boolean;
  /** 最多允许的文件数，本次选择会超出时触发 on-exceed，且这批文件都不加入。 */
  limit?: number;
  /** 只能选择文件夹，夹内文件递归展开后逐个加入列表。 */
  directory?: boolean;
  /** 点击文件名或卡片预览按钮时触发；传入后文件名变为可点击。 */
  onPreview?: (file: UploadFile) => void;
  /** 文件从列表移除后触发。 */
  onRemove?: (file: UploadFile, uploadFiles: UploadFile[]) => void;
  /** 文件上传成功时触发。 */
  onSuccess?: (response: unknown, file: UploadFile, uploadFiles: UploadFile[]) => void;
  /** 文件上传失败时触发，失败的文件保留在列表里。 */
  onError?: (error: Error, file: UploadFile, uploadFiles: UploadFile[]) => void;
  /** 上传进度变化时触发。 */
  onProgress?: (evt: UploadProgressEvent, file: UploadFile, uploadFiles: UploadFile[]) => void;
  /** 文件状态改变时触发：添加文件、上传成功、上传失败。 */
  onChange?: (file: UploadFile, uploadFiles: UploadFile[]) => void;
  /** 选择的文件数超出 limit 时触发。 */
  onExceed?: (files: File[], uploadFiles: UploadUserFile[]) => void;
  /** 上传前的钩子：返回 false 或被 reject 时中止上传并移除文件；返回 File / Blob 时改为上传它。 */
  beforeUpload?: (rawFile: UploadRawFile) => UploadAwaitable<void | undefined | null | boolean | File | Blob>;
  /** 删除前的钩子：返回 false 或被 reject 时取消删除。 */
  beforeRemove?: (file: UploadFile, uploadFiles: UploadFile[]) => UploadAwaitable<boolean>;
  /** 根元素样式覆盖。 */
  class?: ClassValue;
  /** 各部位样式覆盖。 */
  ui?: UploadUi;
}

const props = withDefaults(defineProps<RebornUploadProps>(), {
  action: '#',
  method: 'post',
  data: () => ({}),
  name: 'file',
  showFileList: true,
  accept: '',
  listType: 'text',
  autoUpload: true,
  httpRequest: ajaxUpload,
});

const slots = defineSlots<{
  /** 触发区内容。text / picture 非拖拽形态下组件不内置按钮，需在这里放按钮；同时提供 trigger 插槽时，改为渲染在触发区之后（常用来放「开始上传」按钮）。 */
  default?: () => unknown;
  /** 触发文件选择的内容，优先于 default 插槽。 */
  trigger?: () => unknown;
  /** 提示说明文字。 */
  tip?: () => unknown;
  /** 自定义单个文件的展示，替换整条列表项（照片墙下为整张卡片）的内容。 */
  file?: (props: { file: UploadFile; index: number }) => unknown;
}>();

/** 已选文件列表，支持 v-model:file-list 双向绑定。 */
const fileList = defineModel<UploadUserFile[]>('fileList', { default: () => [] });

const b = tv(theme);
// 接入表单：禁用跟随所在表单；字段校验失败时上传入口描边标红，文件列表增删、上传成败后按表单的 trigger 配置触发字段校验
const { disabled: fieldGroupDisabled, isError, validate } = useFormInject(props);
const isDisabled = computed(() => fieldGroupDisabled.value === true || props.disabled);
// 选择文件夹必然是多个文件，directory 下不再截取第一个。
const isMultiple = computed(() => props.multiple || props.directory);
const isCard = computed(() => props.listType === 'picture-card');
// 照片墙的触发卡片自己承担拖放区，不再套一层虚线拖拽框。
const useDragger = computed(() => props.drag && !isCard.value);
// text / picture 非拖拽形态下，插槽里放的是按钮，聚焦与键盘交互由按钮自己承担，外壳只做点击代理，避免出现两个 Tab 停靠点；
// 拖拽区与照片墙入口没有现成的可聚焦元素，由外壳模拟按钮语义。
const nativeTrigger = computed(() => !props.drag && !isCard.value);

const inputRef = ref<HTMLInputElement>();
const dragover = ref(false);

/**
 * 组件内部的唯一数据源。
 * defineModel 在受控模式下赋值后同步读取仍是旧值，进度、状态等连续操作都基于这份列表，再同步给 file-list。
 */
const uploadFiles = ref<UploadFile[]>([]);

watch(fileList, (list) => {
  // 外部传入的历史文件补齐 uid 与 status，原地修改以便和外部数组共享同一批对象。
  for (const file of list) {
    if (!file.uid) file.uid = genFileId();
    if (!file.status) file.status = 'success';
  }
  if (toRaw(list) !== toRaw(uploadFiles.value)) uploadFiles.value = list as UploadFile[];
}, { immediate: true, deep: true });

function commit(next: UploadFile[]) {
  uploadFiles.value = next;
  fileList.value = next;
  validate('change');
}

function getFile(uid: number) {
  return uploadFiles.value.find(file => file.uid === uid);
}

/** 组件自己创建的本地预览地址，移除文件或卸载时释放，外部传入的地址不动。 */
const objectUrls = new Set<string>();

function revokeUrl(file: UploadFile) {
  if (!file.url || !objectUrls.has(file.url)) return;
  URL.revokeObjectURL(file.url);
  objectUrls.delete(file.url);
}

/**
 * 进行中的请求（含等待 before-upload 的阶段）。token 区分同一文件的先后两次上传：
 * 中止或重传后，旧请求迟到的回调对不上 token，直接丢弃。
 */
const requests = new Map<number, { token: symbol; abort?: () => void }>();
let disposed = false;

function cancelRequest(uid: number) {
  const request = requests.get(uid);
  if (!request) return;
  // 先删再中止：中止时同步派发的事件已对不上 token，不会再改动文件状态。
  requests.delete(uid);
  request.abort?.();
}

function toError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' && error ? error : '上传失败');
}

/**
 * 分片上传的断点记录，按文件 uid 保存。
 * 暂停、失败时保留，继续上传时沿用（不再 init、跳过已传分片）；上传成功、删除、中止时丢弃。
 */
const chunkStates = new Map<number, UploadChunkState>();

/** 把一个原生文件加入列表（状态 ready），不发起上传。 */
function handleStart(rawFile: UploadRawFile) {
  if (!rawFile.uid) rawFile.uid = genFileId();
  const file: UploadFile = { name: rawFile.name, percentage: 0, status: 'ready', size: rawFile.size, uid: rawFile.uid, raw: rawFile };
  if (props.listType !== 'text' && (isImageFile(rawFile) || isVideoFile(rawFile))) {
    file.url = URL.createObjectURL(rawFile);
    objectUrls.add(file.url);
  }
  commit([...uploadFiles.value, file]);
  props.onChange?.(getFile(file.uid) ?? file, uploadFiles.value);
}

function handleProgress(evt: UploadProgressEvent, uid: number) {
  const file = getFile(uid);
  if (!file) return;
  file.status = 'uploading';
  file.percentage = evt.percent;
  props.onProgress?.(evt, file, uploadFiles.value);
}

function handleSuccess(response: unknown, uid: number) {
  requests.delete(uid);
  chunkStates.delete(uid);
  const file = getFile(uid);
  if (!file) return;
  file.status = 'success';
  file.percentage = 100;
  file.response = response;
  file.errorMessage = undefined;
  props.onSuccess?.(response, file, uploadFiles.value);
  props.onChange?.(file, uploadFiles.value);
  // 文件状态变了（如校验规则要求全部上传成功），同样重新校验
  validate('change');
}

function handleError(error: Error, uid: number) {
  requests.delete(uid);
  const file = getFile(uid);
  if (!file) return;
  file.status = 'fail';
  file.errorMessage = error.message || '上传失败';
  props.onError?.(error, file, uploadFiles.value);
  props.onChange?.(file, uploadFiles.value);
  validate('change');
}

async function doUpload(rawFile: UploadRawFile) {
  if (disposed) return;
  const uid = rawFile.uid;
  const token = Symbol(uid);
  cancelRequest(uid);
  requests.set(uid, { token });
  const alive = () => !disposed && requests.get(uid)?.token === token;

  const file = getFile(uid);
  if (file) {
    file.status = 'uploading';
    // 分片续传时保留已有进度，随后按服务端已收到的分片重新校准。
    if (!(props.chunk && chunkStates.has(uid))) file.percentage = 0;
    file.errorMessage = undefined;
  }

  let data: UploadData;
  try {
    const source = props.data;
    data = { ...(await (typeof source === 'function' ? source(rawFile) : source)) };
  }
  catch (error) {
    if (alive()) handleError(toError(error), uid);
    return;
  }
  // 解析 data 期间文件可能已被中止或移除。
  if (!alive()) return;

  if (props.chunk) {
    const controller = new AbortController();
    const request = requests.get(uid);
    if (request) request.abort = () => controller.abort();
    let state = chunkStates.get(uid);
    if (!state) chunkStates.set(uid, state = createChunkState());
    uploadInChunks({
      adapter: props.chunk,
      file: rawFile,
      data,
      headers: props.headers ?? {},
      withCredentials: props.withCredentials,
      signal: controller.signal,
      state,
      onProgress: (loaded, total) => {
        if (!alive()) return;
        const evt = Object.assign(new ProgressEvent('progress', { lengthComputable: true, loaded, total }), { percent: total ? (loaded / total) * 100 : 0 });
        handleProgress(evt, uid);
      },
    }).then(
      (response) => {
        if (alive()) handleSuccess(response, uid);
      },
      (error) => {
        if (alive()) handleError(toError(error), uid);
      },
    );
    return;
  }

  const options: UploadRequestOptions = {
    action: props.action,
    method: props.method,
    data,
    filename: props.name,
    file: rawFile,
    headers: props.headers ?? {},
    withCredentials: props.withCredentials,
    onProgress: (evt) => {
      if (alive()) handleProgress(evt, uid);
    },
    onSuccess: (response) => {
      if (alive()) handleSuccess(response, uid);
    },
    onError: (error) => {
      if (alive()) handleError(toError(error), uid);
    },
  };

  let result: ReturnType<UploadRequestHandler>;
  try {
    result = props.httpRequest(options);
  }
  catch (error) {
    if (alive()) handleError(toError(error), uid);
    return;
  }
  // 自定义实现可能在同步阶段就回调了成功 / 失败，此时请求已结束。
  if (!alive() || !result) return;

  const handle = result as { abort?: unknown; then?: unknown };
  if (typeof handle.abort === 'function') {
    const request = requests.get(uid);
    if (request) request.abort = () => (handle.abort as () => void).call(result);
  }
  if (typeof handle.then === 'function') {
    (result as Promise<unknown>).then(
      (response) => {
        if (alive()) handleSuccess(response, uid);
      },
      (error) => {
        if (alive()) handleError(toError(error), uid);
      },
    );
  }
}

/** 移除文件但不经过 before-remove，用于 before-upload 拦截。 */
function discard(file: UploadFile) {
  cancelRequest(file.uid);
  chunkStates.delete(file.uid);
  commit(uploadFiles.value.filter(item => item.uid !== file.uid));
  props.onRemove?.(file, uploadFiles.value);
  revokeUrl(file);
}

async function upload(rawFile: UploadRawFile) {
  if (disposed) return;
  if (!props.beforeUpload) return doUpload(rawFile);

  // 钩子也属于可取消的上传任务；再次提交时旧钩子的结果不能改动新任务。
  const token = Symbol(rawFile.uid);
  cancelRequest(rawFile.uid);
  requests.set(rawFile.uid, { token });

  let result: Awaited<ReturnType<NonNullable<RebornUploadProps['beforeUpload']>>>;
  try {
    result = await props.beforeUpload(rawFile);
  }
  catch {
    result = false;
  }
  // 中止、卸载或重新提交后，旧钩子的通过、拒绝和文件替换结果全部作废。
  if (requests.get(rawFile.uid)?.token !== token) return;
  requests.delete(rawFile.uid);
  const target = getFile(rawFile.uid);
  if (!target) return;
  if (result === false) return discard(target);

  let finalFile = rawFile;
  if (result instanceof Blob) {
    // 钩子返回处理后的文件（如压缩、加水印）时改传它，沿用原 uid 保证列表定位不变。
    // 纯 Blob 补上原文件名；类型以 Blob 自身为准（如 png 压成 jpeg），缺省时才沿用原类型。
    const next = result instanceof File ? result : new File([result], rawFile.name, { type: result.type || rawFile.type });
    finalFile = toRawFile(next, rawFile.uid);
    target.raw = finalFile;
    target.size = finalFile.size;
  }
  return doUpload(finalFile);
}

function handleFiles(files: File[]) {
  if (!files.length) return;
  if (props.limit && uploadFiles.value.length + files.length > props.limit) {
    props.onExceed?.(files, uploadFiles.value);
    return;
  }
  const picked = isMultiple.value ? files : files.slice(0, 1);
  for (const file of picked) {
    const rawFile = toRawFile(file);
    handleStart(rawFile);
    if (props.autoUpload) void upload(rawFile);
  }
}

/** 删除文件：先经过 before-remove，上传中的文件会同时中止请求。 */
async function handleRemove(file: UploadFile | UploadRawFile) {
  const target = getFile(file.uid);
  if (!target) return;
  if (props.beforeRemove) {
    let allowed: boolean;
    try {
      allowed = await props.beforeRemove(target, uploadFiles.value);
    }
    catch {
      return;
    }
    if (allowed === false) return;
  }
  discard(target);
}

/** 中止上传：传文件只中止它，不传则中止全部（含已暂停的）；被中止的文件回到待上传状态，分片断点记录一并丢弃。 */
function abort(file?: UploadFile | UploadRawFile) {
  const uids = file
    ? [file.uid]
    : [...requests.keys(), ...uploadFiles.value.filter(item => item.status === 'paused').map(item => item.uid)];
  for (const uid of uids) {
    cancelRequest(uid);
    const target = getFile(uid);
    if (target?.status === 'uploading' || target?.status === 'paused') {
      target.status = 'ready';
      target.percentage = 0;
      chunkStates.delete(uid);
    }
  }
}

/** 暂停分片上传：传文件只暂停它，不传则暂停全部上传中的文件；未开启 chunk 时不做任何事。 */
function pause(file?: UploadFile | UploadRawFile) {
  if (!props.chunk) return;
  const targets = file ? [getFile(file.uid)] : uploadFiles.value;
  for (const target of targets) {
    if (target?.status !== 'uploading') continue;
    cancelRequest(target.uid);
    target.status = 'paused';
    // 传到一半的分片继续时要整片重传，进度只保留已完成分片的部分，免得继续后进度条往回跳。
    const state = chunkStates.get(target.uid);
    const size = target.raw?.size ?? 0;
    target.percentage = state && size ? (getChunkedBytes(state, size) / size) * 100 : 0;
  }
}

/** 继续分片上传：传文件只继续它，不传则继续全部已暂停与失败的文件；继续时不再经过 before-upload。 */
function resume(file?: UploadFile | UploadRawFile) {
  if (!props.chunk) return;
  const targets = file ? [getFile(file.uid)] : uploadFiles.value;
  for (const target of targets) {
    if (target?.raw && (target.status === 'paused' || target.status === 'fail')) void doUpload(target.raw);
  }
}

/** 上传所有待上传（ready）的文件。 */
function submit() {
  for (const file of uploadFiles.value) {
    if (file.status === 'ready' && file.raw) void upload(file.raw);
  }
}

/** 清空列表，可只清除指定状态的文件。 */
function clearFiles(statuses: UploadStatus[] = [...uploadStatuses]) {
  const keep: UploadFile[] = [];
  for (const file of uploadFiles.value) {
    if (!statuses.includes(file.status)) {
      keep.push(file);
      continue;
    }
    cancelRequest(file.uid);
    chunkStates.delete(file.uid);
    revokeUrl(file);
  }
  commit(keep);
}

onBeforeUnmount(() => {
  // 先让全部回调失效，再中止请求，避免自定义 abort 同步回调时继续修改外部状态。
  disposed = true;
  for (const uid of requests.keys()) cancelRequest(uid);
  chunkStates.clear();
  for (const url of objectUrls) URL.revokeObjectURL(url);
  objectUrls.clear();
});

function openPicker() {
  if (isDisabled.value) return;
  inputRef.value?.click();
}

function onTriggerKeydown(e: KeyboardEvent) {
  // 只响应外壳自身的按键，内部按钮的回车已经会冒泡成点击。
  if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  openPicker();
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  // 重置后再次选择同一个文件也能触发 change。
  input.value = '';
  // 选择文件夹时浏览器不按 accept 过滤，这里补一次。
  handleFiles(props.directory ? filterByAccept(files, props.accept) : files);
}

function onDragover(e: DragEvent) {
  if (!props.drag) return;
  // 禁用时同样阻止默认行为，避免浏览器直接打开拖入的文件。
  e.preventDefault();
  if (!isDisabled.value) dragover.value = true;
}

function onDragleave(e: DragEvent) {
  if (!props.drag) return;
  // 在子元素之间移动也会触发 dragleave，只有真正离开拖放区才取消高亮。
  if ((e.currentTarget as Node).contains(e.relatedTarget as Node | null)) return;
  dragover.value = false;
}

async function onDrop(e: DragEvent) {
  if (!props.drag) return;
  e.preventDefault();
  dragover.value = false;
  const dt = e.dataTransfer;
  if (isDisabled.value || !dt) return;
  // 条目必须在 drop 事件同步阶段取出，await 之后 dataTransfer 就被清空了。
  const items = Array.from(dt.items ?? []).filter(item => item.kind === 'file');
  let files: File[];
  if (props.directory) {
    const entries = items.map(item => item.webkitGetAsEntry()).filter((entry): entry is FileSystemEntry => !!entry?.isDirectory);
    files = await readEntries(entries);
  }
  else if (items.length) {
    // 非文件夹模式下忽略拖入的文件夹，它在 files 里只是一个空壳。
    files = items
      .filter(item => !item.webkitGetAsEntry?.()?.isDirectory)
      .map(item => item.getAsFile())
      .filter((file): file is File => !!file);
  }
  else {
    files = Array.from(dt.files);
  }
  handleFiles(filterByAccept(files, props.accept));
}

const directoryAttrs = computed(() => (props.directory ? { webkitdirectory: true } : {}));
const triggerAttrs = computed(() => {
  if (nativeTrigger.value) return {};
  return {
    'role': 'button',
    'tabindex': isDisabled.value ? -1 : 0,
    'aria-disabled': isDisabled.value || undefined,
    'aria-label': isCard.value && !slots.trigger && !slots.default ? '上传文件' : undefined,
  };
});

function previewAttrs(file: UploadFile) {
  if (!props.onPreview) return {};
  return { 'role': 'button', 'tabindex': 0, 'class': 'cursor-pointer hover:underline', 'aria-label': `预览 ${file.name}` };
}

function preview(file: UploadFile) {
  props.onPreview?.(file);
}

function onPreviewKeydown(e: KeyboardEvent, file: UploadFile) {
  if (!props.onPreview || (e.key !== 'Enter' && e.key !== ' ')) return;
  e.preventDefault();
  preview(file);
}

function removeLabel(file: UploadFile) {
  return file.status === 'uploading' || file.status === 'paused' ? `取消上传 ${file.name}` : `删除 ${file.name}`;
}

/** 分片上传时各状态对应的控制按钮：上传中可暂停，已暂停可继续，失败可重试。 */
const chunkControls: Partial<Record<UploadStatus, { icon: string; label: string }>> = {
  uploading: { icon: 'lucide:pause', label: '暂停上传' },
  paused: { icon: 'lucide:play', label: '继续上传' },
  fail: { icon: 'lucide:rotate-cw', label: '重试' },
};

function controlOf(file: UploadFile) {
  // 回显的历史文件没有 raw，无从续传。
  if (!props.chunk || !file.raw) return;
  return chunkControls[file.status];
}

function onControl(file: UploadFile) {
  if (file.status === 'uploading') pause(file);
  else resume(file);
}

/** 加载失败的视频地址（如浏览器不支持的编码），改为显示文件图标。 */
const brokenVideos = shallowRef(new Set<string>());

function onVideoError(url: string) {
  brokenVideos.value = new Set(brokenVideos.value).add(url);
}

function isVideo(file: UploadFile) {
  if (file.raw) return isVideoFile(file.raw);
  // 回显的历史文件没有 raw，按地址或文件名的扩展名判断。
  return isVideoFile({ name: file.url?.split(/[?#]/)[0] }) || isVideoFile({ name: file.name });
}

/** 缩略图类型：图片用 img，视频用 video 显示首帧；没有地址或视频加载失败时为空，显示文件图标。 */
function thumbOf(file: UploadFile) {
  if (!file.url) return;
  if (!isVideo(file)) return 'image';
  return brokenVideos.value.has(file.url) ? undefined : 'video';
}

/** 视频地址补上媒体片段 #t=0.1：部分浏览器停在第 0 秒时只有黑帧。 */
function videoSrc(url: string) {
  return url.includes('#') ? url : `${url}#t=0.1`;
}

/** 已暂停时进度条转灰，停在已传完的位置。 */
function progressUi(file: UploadFile) {
  return { root: file.status === 'paused' ? 'text-gray-5' : undefined, step: 'h-[2px]' };
}

const variants = computed(() => ({
  listType: props.listType,
  drag: props.drag,
  chunk: !!props.chunk,
  dragover: dragover.value,
  disabled: isDisabled.value,
  error: isError.value,
}));
const styles = computed(() => b(variants.value));
// 列表项、卡片的样式随文件状态变化，按状态预先算好五份，渲染时按需取用。
const statusStyles = computed(() => Object.fromEntries(
  uploadStatuses.map(status => [status, b({ ...variants.value, status })]),
) as Record<UploadStatus, ReturnType<typeof b>>);

defineExpose({ abort, submit, clearFiles, handleStart, handleRemove, pause, resume });
</script>

<template>
  <div :class="styles.root({ class: [props.class, props.ui?.root] })">
    <input
      ref="inputRef" type="file" class="hidden" tabindex="-1" aria-hidden="true" :name="props.name"
      :accept="props.accept" :multiple="isMultiple" :disabled="isDisabled" v-bind="directoryAttrs"
      @change="onInputChange" @click.stop
    >

    <!-- 照片墙：卡片与上传入口在同一行平铺 -->
    <template v-if="isCard">
      <div v-if="props.showFileList" role="list" :class="styles.list({ class: props.ui?.list })">
        <RebornTooltip
          v-for="(file, index) in uploadFiles" :key="file.uid" class="shrink-0" :ui="{ trigger: 'block' }"
          :content="file.errorMessage || '上传失败'" :disabled="file.status !== 'fail'" placement="top"
        >
          <div role="listitem" :aria-label="file.name" :class="statusStyles[file.status].card({ class: props.ui?.card })">
            <slot name="file" :file="file" :index="index">
              <div v-if="file.status === 'uploading' || file.status === 'paused'" :class="styles.cardStatus({ class: props.ui?.cardStatus })">
                <span>{{ file.status === 'paused' ? '已暂停' : '上传中...' }}</span>
                <RebornProgress
                  :percent="file.percentage ?? 0" :show-text="false" :aria-label="`${file.name} 上传进度`"
                  :class="styles.progress({ class: props.ui?.progress })" :ui="progressUi(file)"
                />
              </div>
              <video
                v-else-if="thumbOf(file) === 'video'" :src="videoSrc(file.url!)" :aria-label="file.name"
                :crossorigin="props.crossorigin" muted playsinline preload="metadata"
                :class="styles.cardImage({ class: props.ui?.cardImage })" @error="onVideoError(file.url!)"
              />
              <img
                v-else-if="thumbOf(file) === 'image'" :src="file.url" :alt="file.name" :crossorigin="props.crossorigin"
                :class="styles.cardImage({ class: props.ui?.cardImage })"
              >
              <div v-else :class="styles.cardStatus({ class: props.ui?.cardStatus })">
                <Icon name="lucide:file" class="size-[24px] shrink-0" />
                <div class="w-full min-w-0 text-center">
                  <RebornText :value="file.name" ellipsis tooltip />
                </div>
              </div>

              <div v-if="props.onPreview || !isDisabled" :class="styles.cardMask({ class: props.ui?.cardMask })">
                <button
                  v-if="props.onPreview" type="button" :aria-label="`预览 ${file.name}`"
                  :class="styles.cardAction({ class: props.ui?.cardAction })" @click="preview(file)"
                >
                  <Icon name="lucide:eye" class="size-[16px]" />
                </button>
                <button
                  v-if="!isDisabled && controlOf(file)" type="button" :aria-label="`${controlOf(file)!.label} ${file.name}`"
                  :class="styles.cardAction({ class: props.ui?.cardAction })" @click="onControl(file)"
                >
                  <Icon :name="controlOf(file)!.icon" class="size-[16px]" />
                </button>
                <button
                  v-if="!isDisabled" type="button" :aria-label="removeLabel(file)"
                  :class="styles.cardAction({ class: props.ui?.cardAction })" @click="handleRemove(file)"
                >
                  <Icon name="lucide:trash-2" class="size-[16px]" />
                </button>
              </div>
            </slot>
          </div>
        </RebornTooltip>
      </div>

      <div
        v-bind="triggerAttrs" :class="styles.trigger({ class: props.ui?.trigger })" @click="openPicker"
        @keydown="onTriggerKeydown" @dragover="onDragover" @dragleave="onDragleave" @drop="onDrop"
      >
        <slot name="trigger">
          <slot>
            <Icon name="lucide:plus" class="size-[24px]" />
          </slot>
        </slot>
      </div>
      <slot v-if="slots.trigger" />

      <div v-if="slots.tip" :class="styles.tip({ class: props.ui?.tip })">
        <slot name="tip" />
      </div>
    </template>

    <!-- 文字 / 图片列表：触发区在上，提示与列表依次排在下方 -->
    <template v-else>
      <div
        v-bind="triggerAttrs" :class="styles.trigger({ class: props.ui?.trigger })" @click="openPicker"
        @keydown="onTriggerKeydown" @dragover="onDragover" @dragleave="onDragleave" @drop="onDrop"
      >
        <div v-if="useDragger" :class="styles.dragger({ class: props.ui?.dragger })">
          <slot name="trigger">
            <slot>
              <Icon name="lucide:cloud-upload" class="size-[32px] text-gray-6" />
              <div>拖拽文件到此处，或 <span :class="isDisabled ? undefined : 'text-primary'">点击上传</span></div>
            </slot>
          </slot>
        </div>
        <slot v-else name="trigger">
          <slot />
        </slot>
      </div>
      <slot v-if="slots.trigger" />

      <div v-if="slots.tip" :class="styles.tip({ class: props.ui?.tip })">
        <slot name="tip" />
      </div>

      <ul v-if="props.showFileList && uploadFiles.length" :class="styles.list({ class: props.ui?.list })">
        <li v-for="(file, index) in uploadFiles" :key="file.uid" :class="statusStyles[file.status].item({ class: props.ui?.item })">
          <slot name="file" :file="file" :index="index">
            <!-- 图标：上传中换成 loading；图片列表下有地址的图片、视频显示缩略图 -->
            <span v-if="file.status === 'uploading'" :class="styles.itemIcon({ class: props.ui?.itemIcon })">
              <!-- 用组件库统一的 ring 加载图标而不是 lucide 的 loader-circle：后者只是 3/4 段开口弧，
                   视觉重心偏离圆心约 2px，16px 下转起来像在绕圈抖动（text 形态没有底色方块作参照时最明显）；
                   ring 接近整圆、重心落在圆心，且与按钮、选择器的加载态一致 -->
              <RebornLoading type="ring" color="currentColor" :size="16" />
            </span>
            <video
              v-else-if="props.listType === 'picture' && thumbOf(file) === 'video'" :src="videoSrc(file.url!)" :aria-label="file.name"
              :crossorigin="props.crossorigin" muted playsinline preload="metadata"
              :class="styles.itemThumb({ class: props.ui?.itemThumb })" @error="onVideoError(file.url!)"
            />
            <img
              v-else-if="props.listType === 'picture' && thumbOf(file) === 'image'" :src="file.url" :alt="file.name"
              :crossorigin="props.crossorigin" :class="styles.itemThumb({ class: props.ui?.itemThumb })"
            >
            <span v-else :class="styles.itemIcon({ class: props.ui?.itemIcon })">
              <Icon name="lucide:file" class="size-[16px]" />
            </span>

            <div
              :class="styles.itemName({ class: props.ui?.itemName })" v-bind="previewAttrs(file)"
              @click="preview(file)" @keydown="onPreviewKeydown($event, file)"
            >
              <RebornText :value="file.name" ellipsis tooltip />
            </div>

            <RebornTooltip
              v-if="file.status === 'fail'" class="flex shrink-0" :content="file.errorMessage || '上传失败'"
              :trigger="['hover', 'focus']" placement="top"
            >
              <span tabindex="0" :aria-label="`上传失败：${file.errorMessage || '上传失败'}`" :class="statusStyles[file.status].itemStatus({ class: props.ui?.itemStatus })">
                <Icon name="lucide:circle-alert" class="size-[16px]" />
              </span>
            </RebornTooltip>
            <span v-else-if="file.status === 'paused'" :class="statusStyles.paused.itemStatus({ class: props.ui?.itemStatus })">已暂停</span>

            <div v-if="!isDisabled" :class="styles.itemActions({ class: props.ui?.itemActions })">
              <button
                v-if="controlOf(file)" type="button" :aria-label="`${controlOf(file)!.label} ${file.name}`"
                :class="statusStyles[file.status].itemControl({ class: props.ui?.itemControl })" @click="onControl(file)"
              >
                <Icon :name="controlOf(file)!.icon" class="size-[16px]" />
              </button>
              <button
                type="button" :aria-label="removeLabel(file)"
                :class="statusStyles[file.status].itemAction({ class: props.ui?.itemAction })" @click="handleRemove(file)"
              >
                <Icon name="lucide:trash-2" class="size-[16px]" />
              </button>
            </div>

            <RebornProgress
              v-if="file.status === 'uploading' || file.status === 'paused'" :percent="file.percentage ?? 0" :show-text="false"
              :aria-label="`${file.name} 上传进度`" :class="styles.progress({ class: props.ui?.progress })"
              :ui="progressUi(file)"
            />
          </slot>
        </li>
      </ul>
    </template>
  </div>
</template>
