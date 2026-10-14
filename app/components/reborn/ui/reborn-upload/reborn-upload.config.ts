import type { ClassValue } from 'tailwind-variants';

/** 文件列表的三种展示形态：纯文字、带缩略图的列表、照片墙卡片。 */
export const uploadListTypes = ['text', 'picture', 'picture-card'] as const;
export type UploadListType = typeof uploadListTypes[number];

/** 文件状态：待上传、上传中、已暂停（仅分片上传）、成功、失败。 */
export const uploadStatuses = ['ready', 'uploading', 'paused', 'success', 'fail'] as const;
export type UploadStatus = typeof uploadStatuses[number];

/** 图片跨域属性，原样透传给列表里的 img。 */
export type UploadCrossorigin = '' | 'anonymous' | 'use-credentials';

/** 选择后的原生文件，组件会补上 uid 用于在列表里定位。 */
export type UploadRawFile = File & { uid: number };

/** 列表中的文件对象，进度、状态、响应都挂在这里。 */
export interface UploadFile {
  /** 文件名，列表展示用。 */
  name: string;
  /** 上传进度 0–100。 */
  percentage?: number;
  /** 当前状态。 */
  status: UploadStatus;
  /** 文件字节数。 */
  size?: number;
  /** 上传成功后服务端的响应体。 */
  response?: unknown;
  /** 列表内唯一标识。 */
  uid: number;
  /** 缩略图或下载地址；图片类列表在选择图片或视频时自动生成本地预览地址。 */
  url?: string;
  /** 失败原因，失败图标的气泡里展示。 */
  errorMessage?: string;
  /** 原生文件；通过 file-list 回显的历史文件没有这一项。 */
  raw?: UploadRawFile;
}

/** 传给 file-list 的文件，name 之外都可省略，组件会补齐 uid 与 status（默认 success）。 */
export type UploadUserFile = Omit<UploadFile, 'status' | 'uid'> & Partial<Pick<UploadFile, 'status' | 'uid'>>;

/** 进度事件，percent 已换算成 0–100。 */
export type UploadProgressEvent = ProgressEvent & { percent: number };

/** 可同步返回也可异步返回的值。 */
export type UploadAwaitable<T> = T | Promise<T>;

/** 额外表单字段，可直接给对象，也可按文件动态生成。 */
export type UploadData = Record<string, unknown>;

/** 交给 http-request 的上传参数。 */
export interface UploadRequestOptions {
  /** 上传地址。 */
  action: string;
  /** 请求方法。 */
  method: string;
  /** 额外表单字段，已解析成普通对象。 */
  data: UploadData;
  /** 文件字段名。 */
  filename: string;
  /** 待上传的文件。 */
  file: UploadRawFile;
  /** 请求头。 */
  headers: Headers | Record<string, string | number | null | undefined>;
  /** 是否携带凭证。 */
  withCredentials: boolean;
  /** 进度回调，percent 取 0–100。 */
  onProgress: (evt: UploadProgressEvent) => void;
  /** 成功回调，参数是服务端响应。 */
  onSuccess: (response: unknown) => void;
  /** 失败回调，错误的 message 会成为失败原因。 */
  onError: (error: Error) => void;
}

/** http-request 的返回值：带 abort 的句柄（如 XMLHttpRequest）可被中止；Promise 的结果会自动转交成功 / 失败回调。 */
export type UploadRequestHandler = (options: UploadRequestOptions) => { abort?: () => void } | Promise<unknown> | void;

/** 分片上传各阶段都会拿到的公共参数。 */
export interface UploadChunkTask {
  /** 正在上传的文件。 */
  file: UploadRawFile;
  /** 分片字节数。 */
  chunkSize: number;
  /** 分片总数，空文件也按 1 片计。 */
  chunkCount: number;
  /** 额外字段，即 data 的解析结果。 */
  data: UploadData;
  /** 请求头，即 headers 的值。 */
  headers: Headers | Record<string, string | number | null | undefined>;
  /** 是否携带凭证，即 with-credentials 的值。 */
  withCredentials: boolean;
  /** 暂停、删除、中止或其他分片最终失败时触发 abort，适配器里的请求应监听它并中断。 */
  signal: AbortSignal;
}

/** init 之后的阶段额外拿到 init 的返回值。 */
export type UploadChunkContextTask<C = any> = UploadChunkTask & {
  /** init 的返回值，如服务端分配的 uploadId；暂停后继续、失败后重试时沿用同一份。 */
  context: C;
};

/** 上传单个分片的参数。 */
export type UploadChunkPart<C = any> = UploadChunkContextTask<C> & {
  /** 分片序号，从 0 开始。 */
  index: number;
  /** 分片在文件中的起始字节（含）。 */
  start: number;
  /** 分片在文件中的结束字节（不含）。 */
  end: number;
  /** 分片内容。 */
  blob: Blob;
  /** 报告本片进度（0–100），可不调用，分片完成后组件会按整片计入。 */
  onProgress: (percent: number) => void;
};

/**
 * 分片上传适配器：组件负责切片、并发、单片重试和跳过已传分片，
 * 与服务端交互的四个步骤由使用方按自己的接口实现，返回 Promise 即可。
 */
export interface UploadChunkAdapter<C = any> {
  /** 分片字节数，默认 5MB。 */
  chunkSize?: number;
  /** 同时上传的分片数，默认 3。 */
  concurrency?: number;
  /** 单个分片失败后的重试次数，默认 2；第 n 次重试前等待 n 秒。 */
  retries?: number;
  /** 开始上传：向服务端登记文件，返回值作为后续步骤的 context。同一文件暂停后继续不会再调用。 */
  init: (task: UploadChunkTask) => UploadAwaitable<C>;
  /** 查询服务端已收到的分片序号，每次开始或继续上传前调用；不提供时只跳过本次会话内传完的分片。 */
  uploaded?: (task: UploadChunkContextTask<C>) => UploadAwaitable<number[]>;
  /** 上传单个分片。 */
  uploadChunk: (part: UploadChunkPart<C>) => UploadAwaitable<unknown>;
  /** 全部分片完成后通知服务端合并，返回值作为文件的 response。 */
  merge: (task: UploadChunkContextTask<C>) => UploadAwaitable<unknown>;
}

export type UploadUi = Partial<Record<
  'root' | 'trigger' | 'dragger' | 'tip' | 'list' | 'item' | 'itemIcon' | 'itemThumb' | 'itemName' | 'itemStatus' | 'itemActions' | 'itemControl' | 'itemAction' | 'progress' | 'card' | 'cardImage' | 'cardStatus' | 'cardMask' | 'cardAction',
  ClassValue
>>;

export default {
  slots: {
    root: 'text-base text-default',
    // 触发区只是一层点击 / 拖放的外壳，真正的外观由插槽内容或下面的变体决定。
    trigger: 'outline-none',
    dragger: 'flex w-full flex-col items-center justify-center gap-[8px] rounded-lg border border-dashed border-gray-4 bg-gray-2 px-[16px] py-[24px] text-center transition-colors',
    tip: 'text-sm text-gray-6',
    list: '',
    // item 只用于 text / picture 的列表行（picture-card 用 card），整行显示手型指针。
    item: 'relative cursor-pointer text-default',
    itemIcon: 'flex shrink-0 items-center justify-center',
    itemThumb: 'size-[40px] shrink-0 rounded-[2px] object-cover',
    // 名称容器只收缩不伸展：错误图标、暂停提示要紧跟在名称后面，操作按钮组再用 ml-auto 推到最右。
    itemName: 'min-w-0 shrink grow-0',
    itemStatus: 'flex shrink-0 items-center text-red-6 outline-none',
    itemActions: 'ml-auto flex shrink-0 items-center gap-[4px]',
    // 暂停 / 继续 / 重试按钮常驻显示，不像删除按钮那样在 text 形态下悬停才出现。
    itemControl: 'flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-8 transition-[color,background-color] outline-none hover:bg-gray-2 focus-visible:ring-2 focus-visible:ring-primary',
    itemAction: 'flex size-[24px] shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-8 transition-[color,background-color,opacity] outline-none hover:bg-gray-2 focus-visible:ring-2 focus-visible:ring-primary',
    progress: '',
    card: 'group relative flex size-[104px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-4 bg-gray-2',
    cardImage: 'size-[88px] rounded-[2px] object-cover',
    cardStatus: 'flex w-full flex-col items-center justify-center gap-[8px] px-[12px] text-sm text-gray-6',
    // 遮罩只盖住中间的图片区域：与 cardImage 同为 88px 并同样居中，不盖卡片边框内的留白；
    // 指针落在图片上才出现（遮罩自身 hover），键盘聚焦卡片内按钮时也出现。
    cardMask: 'absolute inset-0 m-auto flex size-[88px] items-center justify-center gap-[8px] rounded-[2px] bg-[rgba(25,30,39,0.5)] text-white opacity-0 transition-opacity hover:opacity-100 group-focus-within:opacity-100',
    cardAction: 'flex size-[16px] cursor-pointer items-center justify-center rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-white',
  },
  variants: {
    listType: {
      'text': {
        list: 'mt-[12px] flex flex-col gap-[4px]',
        item: 'group/item flex h-[32px] items-center gap-[8px]',
        itemIcon: 'size-[16px]',
        // 删除按钮平时隐藏，悬停整行或键盘聚焦时出现；失败的行例外，见下方组合变体。
        itemAction: 'opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100',
        // 进度条贴行底，左端让出 16px 图标与 8px 间距，与文件名左侧对齐（同 picture 形态）；
        // 进度条自带 w-full，须用 w-auto 改由左右偏移决定宽度。
        progress: 'absolute bottom-0 left-[24px] right-0 w-auto',
      },
      'picture': {
        list: 'mt-[12px] flex flex-col gap-[8px]',
        item: 'flex items-center gap-[8px] rounded-sm border border-gray-4 p-[8px]',
        itemIcon: 'size-[40px] rounded-[2px] bg-gray-2',
        // 进度条压在名称下方：左侧让出 40px 图标与 8px 间距，右侧让出删除按钮；
        // 进度条自带 w-full，绝对定位下会让 right 失效，须用 w-auto 改由左右偏移决定宽度。
        progress: 'absolute bottom-[10px] left-[56px] right-[40px] w-auto',
      },
      // 卡片与上传入口在同一行平铺：列表本身不占盒子（contents），卡片直接参与根节点的 flex 换行。
      'picture-card': {
        root: 'flex flex-wrap gap-[16px]',
        list: 'contents',
        trigger: 'flex size-[104px] shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-4 bg-gray-2 text-gray-6 transition-colors',
        tip: 'basis-full -mt-[8px]',
        progress: 'w-full',
      },
    },
    status: {
      ready: {},
      uploading: {},
      // 暂停时名称后跟一段灰字「已暂停」；进度条转灰由模板通过 RebornProgress 的 ui.root 处理。
      paused: { itemStatus: 'text-sm text-gray-6' },
      success: { item: 'text-primary' },
      fail: { item: 'text-red-6', card: 'border-red-6 bg-red-1' },
    },
    drag: {
      true: {},
      false: {},
    },
    // 分片上传时列表项多一个暂停 / 继续 / 重试按钮。
    chunk: {
      true: {},
      false: {},
    },
    dragover: {
      true: { dragger: 'border-primary bg-brand-1', trigger: 'border-primary' },
    },
    disabled: {
      true: { trigger: 'cursor-not-allowed', dragger: 'cursor-not-allowed text-gray-5' },
      false: { trigger: 'cursor-pointer' },
    },
  },
  compoundVariants: [
    // 文字 / 图片列表下，非拖拽的触发区按内容宽度收缩；拖拽区铺满整行。
    { listType: ['text', 'picture'], drag: false, class: { trigger: 'inline-flex' } },
    { listType: ['text', 'picture'], drag: true, class: { trigger: 'flex w-full' } },
    { listType: ['text', 'picture'], class: { tip: 'mt-[8px]' } },
    { drag: true, disabled: false, class: { dragger: 'hover:border-primary' } },
    { listType: 'picture-card', disabled: false, class: { trigger: 'hover:border-primary hover:text-primary focus-visible:border-primary' } },
    { listType: 'picture-card', disabled: true, class: { trigger: 'text-gray-5' } },
    // 失败的行操作按钮标红；text 下失败的行删除按钮常驻，不必悬停就能看到如何清掉它。
    { listType: ['text', 'picture'], status: 'fail', class: { itemAction: 'text-red-6', itemControl: 'text-red-6' } },
    { listType: 'text', status: 'fail', class: { itemAction: 'opacity-100' } },
    { listType: 'picture', status: 'fail', class: { item: 'border-red-6' } },
    // 图片列表的进度条右侧再让出一个 24px 按钮与 4px 间距。
    { listType: 'picture', chunk: true, class: { progress: 'right-[68px]' } },
    { listType: ['text', 'picture'], disabled: false, class: { trigger: 'focus-visible:ring-2 focus-visible:ring-primary rounded-sm' } },
  ],
  defaultVariants: {
    listType: 'text',
    drag: false,
    chunk: false,
    dragover: false,
    disabled: false,
  },
};
