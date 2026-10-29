<script setup lang="ts">
import type {
  UploadChunkAdapter,
  UploadFile,
  UploadListType,
  UploadRawFile,
  UploadRequestHandler,
  UploadRequestOptions,
  UploadStatus,
  UploadUserFile,
} from "~/components/reborn/ui/reborn-upload/reborn-upload.config"
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components"
import { computed, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from "vue"
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import RebornDialog from "~/components/reborn/ui/reborn-dialog/RebornDialog.vue"
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue"
import { message } from "~/components/reborn/ui/reborn-toast/index"
import { uploadListTypes, uploadStatuses } from "~/components/reborn/ui/reborn-upload/reborn-upload.config"
import { ajaxUpload } from "~/components/reborn/ui/reborn-upload/reborn-upload.utils"
import RebornUpload from "~/components/reborn/ui/reborn-upload/RebornUpload.vue"

/** 列表形态的中英对照标签 */
const listTypeLabels: Record<UploadListType, string> = {
  'text': '文字列表 text',
  'picture': '图片列表 picture',
  'picture-card': '照片墙 picture-card',
}
const listTypeOptions = uploadListTypes.map(t => ({ label: listTypeLabels[t], value: t }))

/** 文件状态的中文名 */
const statusLabels: Record<UploadStatus, string> = {
  ready: '待上传',
  uploading: '上传中',
  paused: '已暂停',
  success: '成功',
  fail: '失败',
}

/** 自定义文件项里各状态的文字颜色 */
const statusColors: Record<UploadStatus, string> = {
  ready: 'text-gray-6',
  uploading: 'text-primary',
  paused: 'text-orange-6',
  success: 'text-green-6',
  fail: 'text-red-6',
}

/** 把字节数换算成便于阅读的大小 */
function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 演示拥有的异步任务在卸载时统一取消。 */
let disposed = false
const pendingTasks = new Set<() => void>()
let stopRecording: (() => void) | undefined
onBeforeUnmount(() => {
  disposed = true
  stopRecording?.()
  for (const cancel of [...pendingTasks]) cancel()
  pendingTasks.clear()
  settleRemove(false)
})

/** 模拟上传：按固定间隔推进进度，结束时按结果回调成功或失败；返回 abort 供组件中止。 */
function createMockRequest(opts: {
  outcome?: () => 'success' | 'fail'
  response?: (options: UploadRequestOptions) => unknown
  interval?: number
} = {}): UploadRequestHandler {
  return (req) => {
    let percent = 0
    let timer: ReturnType<typeof setInterval>
    const abort = () => { clearInterval(timer); pendingTasks.delete(abort) }
    timer = setInterval(() => {
      percent = Math.min(100, percent + 10 + Math.random() * 15)
      req.onProgress(Object.assign(new ProgressEvent('progress'), { percent }))
      if (percent < 100) return
      abort()
      if (opts.outcome?.() === 'fail') req.onError(new Error('服务器繁忙，请稍后重试'))
      else req.onSuccess(opts.response?.(req) ?? { ok: true })
    }, opts.interval ?? 200)
    pendingTasks.add(abort)
    return { abort }
  }
}

/** 各场景共用的模拟请求：总是成功 */
const mockRequest = createMockRequest()

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  listType: 'text',
  drag: false,
  multiple: true,
  showFileList: true,
  disabled: false,
  autoUpload: true,
  limit: 0,
  mockResult: 'success',
}

const state = shallowRef<Record<string, any>>({ ...defaultState })

/** 演练场预置文件：成功的图片、带失败原因的文件、超长文件名；工厂函数保证每次重置拿到新对象 */
function createPresetFiles(): UploadUserFile[] {
  return [
    { name: 'strata.webp', url: '/images/lithos/strata.webp', size: 204800 },
    { name: '季度销售报表.xlsx', status: 'fail', errorMessage: '文件超过服务器允许的大小' },
    { name: '2026 年度产品规划与里程碑排期（含各事业部资源申请与预算明细）.pdf', size: 1572864 },
  ]
}

const playRef = useTemplateRef<InstanceType<typeof RebornUpload>>('playRef')
const playFiles = ref<UploadUserFile[]>(createPresetFiles())

/** 最近一次钩子回调，让预览区的交互「有回应」 */
const lastEvent = shallowRef('')

/** 各状态的文件数，随 v-model 列表实时变化；演练场没开分片上传，不会出现已暂停，统计里略过 */
const statusCounts = computed(() => uploadStatuses
  .filter(s => s !== 'paused')
  .map(s => `${statusLabels[s]} ${playFiles.value.filter(f => (f.status ?? 'success') === s).length}`)
  .join(' / '))

/** 演练场的模拟请求：每次上传时读取「模拟结果」开关 */
const playRequest = createMockRequest({
  outcome: () => {
    if (state.value.mockResult === 'random') return Math.random() < 0.5 ? 'fail' : 'success'
    return state.value.mockResult
  },
})

function onPlayChange(file: UploadFile) {
  lastEvent.value = `change：${file.name} → ${statusLabels[file.status]}`
}

function onPlayExceed(files: File[], uploadFiles: UploadUserFile[]) {
  lastEvent.value = `exceed：本次选择 ${files.length} 个，已有 ${uploadFiles.length} 个，超出上限 ${state.value.limit}`
}

function onPlayRemove(file: UploadFile) {
  lastEvent.value = `remove：${file.name}`
}

/** 重置演练场配置，连同文件列表与事件回显 */
function resetState() {
  playRef.value?.abort()
  state.value = { ...defaultState }
  playFiles.value = createPresetFiles()
  lastEvent.value = ''
}

const mockResultOptions = [
  { label: '总是成功', value: 'success' },
  { label: '总是失败', value: 'fail' },
  { label: '随机成功或失败', value: 'random' },
]

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: '基础属性',
    children: [
      { label: '列表形态', key: 'listType', component: 'select' as const, defaultValue: 'text', props: { options: listTypeOptions } },
      { label: '拖拽上传（drag）', key: 'drag', component: 'checkbox' as const, defaultValue: false },
      { label: '多选（multiple）', key: 'multiple', component: 'checkbox' as const, defaultValue: true },
      { label: '显示文件列表（show-file-list）', key: 'showFileList', component: 'checkbox' as const, defaultValue: true },
    ],
  },
  {
    title: '状态',
    children: [
      { label: '禁用状态', key: 'disabled', component: 'checkbox' as const, defaultValue: false },
    ],
  },
  {
    title: '行为',
    children: [
      { label: '选择后立即上传（auto-upload）', key: 'autoUpload', component: 'checkbox' as const, defaultValue: true },
      { label: '数量上限（limit，0 为不限）', key: 'limit', component: 'input-number' as const, defaultValue: 0, props: { min: 0, step: 1 } },
      { label: '模拟上传结果', key: 'mockResult', component: 'select' as const, defaultValue: 'success', props: { options: mockResultOptions } },
    ],
  },
]

/** 演练场提示文字，与 tip 插槽内容一致 */
const playTip = computed(() => (state.value.limit > 0 ? `最多上传 ${state.value.limit} 个文件` : '支持任意类型的文件'))

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const uploadCode = computed(() => {
  const s = state.value
  const props = [
    'v-model:file-list="fileList"',
    'action="/api/upload"',
    `list-type="${s.listType}"`,
    `:drag="${s.drag}"`,
    `:multiple="${s.multiple}"`,
    `:show-file-list="${s.showFileList}"`,
    `:disabled="${s.disabled}"`,
    `:auto-upload="${s.autoUpload}"`,
  ]
  if (s.limit > 0) props.push(`:limit="${s.limit}"`, ':on-exceed="handleExceed"')
  props.push(':on-change="handleChange"', ':on-remove="handleRemove"')
  if (!s.autoUpload) props.unshift('ref="uploadRef"')
  // 文字 / 图片列表的非拖拽形态不内置按钮，由 default 插槽提供，禁用时同步给按钮
  const trigger = !s.drag && s.listType !== 'picture-card'
    ? `  <RebornButton color="neutral" variant="outlined" :disabled="${s.disabled}">\n    点击上传\n  </RebornButton>\n`
    : ''
  const upload = `<RebornUpload\n  ${props.join('\n  ')}\n>\n${trigger}  <template #tip>\n    ${playTip.value}\n  </template>\n</RebornUpload>`
  if (s.autoUpload) return upload
  return `${upload}\n<RebornButton @click="uploadRef?.submit()">\n  开始上传\n</RebornButton>`
})

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 基础用法 */
const basicFiles = ref<UploadUserFile[]>([])

/** 文件列表形态：成功的图片、上传中、上传失败的图片、超长文件名四种情况 */
function createShowcaseFiles(): UploadUserFile[] {
  return [
    { name: 'strata.webp', url: '/images/lithos/strata.webp' },
    { name: '产品宣传册.pdf', status: 'uploading', percentage: 45 },
    { name: 'living-strata.webp', url: '/images/lithos/living-strata.webp', status: 'fail', errorMessage: '网络中断，上传失败' },
    { name: '2026 年度产品规划与里程碑排期（含各事业部资源申请与预算明细）.docx' },
  ]
}
const listTypeFiles = ref(Object.fromEntries(
  uploadListTypes.map(t => [t, createShowcaseFiles()]),
) as Record<UploadListType, UploadUserFile[]>)

/** 拖拽上传 */
const dragFiles = ref<UploadUserFile[]>([])

/** 照片墙与预览 */
const wallFiles = ref<UploadUserFile[]>([
  { name: 'strata.webp', url: '/images/lithos/strata.webp' },
  { name: 'living-strata.webp', url: '/images/lithos/living-strata.webp' },
])
const previewOpen = shallowRef(false)
const previewFile = shallowRef<UploadFile>()
/** 视频通过自定义预览回调打开播放器，图片使用组件内置预览。 */
function onVideoPreview(file: UploadFile) {
  previewFile.value = file
  previewOpen.value = true
}

/** 视频预览 */
const videoListRef = useTemplateRef<InstanceType<typeof RebornUpload>>('videoListRef')
const videoCardRef = useTemplateRef<InstanceType<typeof RebornUpload>>('videoCardRef')
const videoListFiles = ref<UploadUserFile[]>([])
const videoCardFiles = ref<UploadUserFile[]>([])
const videoRecording = shallowRef(false)
let sampleVideoSeq = 0

/**
 * 用 canvas 现录一段 2 秒的视频，手边没有视频文件时也能看到首帧缩略图。
 * 编码器冷启动要一两秒，这段时间录不进画面（首次录制只得到空壳文件），所以收到第一段数据后才开始计时。
 */
async function recordSampleVideo() {
  const mimeType = ['video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported(t))
  if (!mimeType) throw new Error('当前浏览器不支持录制视频')
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 180
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前浏览器不支持画布录制')
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: Blob[] = []
  let start = 0
  recorder.ondataavailable = (e) => {
    if (!e.data.size) return
    chunks.push(e.data)
    if (!start) start = performance.now()
  }
  let frame: number | undefined
  const stop = () => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    if (recorder.state !== 'inactive') recorder.stop()
    stream.getTracks().forEach(track => track.stop())
  }
  stopRecording = stop
  const stopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve()
    recorder.onerror = () => { stop(); reject(new Error('视频录制失败')) }
  })
  const index = ++sampleVideoSeq
  const deadline = performance.now() + 10000
  const draw = () => {
    frame = undefined
    if (disposed) { stop(); return }
    const t = start ? Math.min(1, (performance.now() - start) / 2000) : 0
    ctx.fillStyle = `hsl(${(index * 70 + t * 90) % 360}, 65%, 45%)`
    ctx.fillRect(0, 0, 320, 180)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.fillRect(0, 170, 320 * t, 10)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 26px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`示例视频 ${index}`, 160, 90)
    if (t < 1 && performance.now() < deadline) frame = requestAnimationFrame(draw)
    else stop()
  }
  // 每 100ms 交一次数据，用来判断编码器是否已经开始出画面
  try {
    recorder.start(100)
    draw()
    await stopped
  }
  finally {
    stop()
    if (stopRecording === stop) stopRecording = undefined
    recorder.ondataavailable = null
    recorder.onstop = null
    recorder.onerror = null
  }
  if (disposed) throw new DOMException('演示已卸载', 'AbortError')
  if (!start) throw new Error('录制超时，请直接选择本地视频')
  return { blob: new Blob(chunks, { type: mimeType }), name: `示例视频-${index}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}` }
}

/** 录好的视频同时加入两个列表：handleStart 只入列，submit 才发起上传 */
async function addSampleVideo() {
  if (typeof MediaRecorder === 'undefined') {
    message.error('当前浏览器不支持录制视频，请直接选择本地视频')
    return
  }
  videoRecording.value = true
  try {
    const { blob, name } = await recordSampleVideo()
    if (disposed) return
    for (const uploader of [videoListRef.value, videoCardRef.value]) {
      uploader?.handleStart(new File([blob], name, { type: blob.type }) as UploadRawFile)
      uploader?.submit()
    }
  }
  catch (error) {
    if (!disposed) message.error(error instanceof Error ? error.message : '视频录制失败')
  }
  finally {
    videoRecording.value = false
  }
}

/** 数量限制 */
const limitFiles = ref<UploadUserFile[]>([{ name: '合同扫描件.pdf' }])
function onLimitExceed(files: File[], uploadFiles: UploadUserFile[]) {
  message.warning(`最多上传 3 个文件，本次选择了 ${files.length} 个，列表里已有 ${uploadFiles.length} 个`)
}

/** 上传前处理：记录压缩前的大小，成功后回显「原始 → 提交」 */
const compressFiles = ref<UploadUserFile[]>([])
const originalSizes = new Map<number, number>()
interface UploadLogEntry { id: number, text: string }
let logSequence = 0
const compressLog = shallowRef<UploadLogEntry[]>([])
const compressRequest = createMockRequest({
  response: req => ({ original: originalSizes.get(req.file.uid) ?? req.file.size, submitted: req.file.size }),
})

/** 拒绝非图片与超过 5MB 的文件；其余图片按长边 1280px 压成 jpeg，压完反而更大时上传原文件 */
async function compressBeforeUpload(rawFile: UploadRawFile) {
  if (!rawFile.type.startsWith('image/')) {
    message.error(`「${rawFile.name}」不是图片，已拒绝`)
    return false
  }
  if (rawFile.size > 5 * 1024 * 1024) {
    message.error(`「${rawFile.name}」超过 5MB，已拒绝`)
    return false
  }
  originalSizes.set(rawFile.uid, rawFile.size)
  try {
    const bitmap = await createImageBitmap(rawFile)
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8))
    if (!blob || blob.size >= rawFile.size) return true
    return new File([blob], rawFile.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
  }
  catch {
    // 浏览器解不开的图片（如部分 svg）直接上传原文件
    return true
  }
}

function onCompressSuccess(response: unknown, file: UploadFile) {
  const { original, submitted } = response as { original: number, submitted: number }
  compressLog.value = [{ id: ++logSequence, text: `${file.name}：${formatSize(original)} → ${formatSize(submitted)}` }, ...compressLog.value].slice(0, 3)
}

/** 删除前确认：before-remove 返回 Promise，由确认弹窗决定结果 */
const confirmFiles = ref<UploadUserFile[]>([
  { name: '需求评审纪要.docx' },
  { name: '接口文档 v2.pdf' },
])
const removeConfirmOpen = shallowRef(false)
const removeTarget = shallowRef('')
let resolveRemove: ((ok: boolean) => void) | null = null

function confirmBeforeRemove(file: UploadFile) {
  removeTarget.value = file.name
  removeConfirmOpen.value = true
  return new Promise<boolean>((resolve) => {
    resolveRemove = resolve
  })
}

function settleRemove(ok: boolean) {
  resolveRemove?.(ok)
  resolveRemove = null
}

function onRemoveConfirm() {
  settleRemove(true)
  removeConfirmOpen.value = false
}

// 取消、点遮罩、按 Esc 关闭弹窗都视为不删除
watch(removeConfirmOpen, (open) => {
  if (!open) settleRemove(false)
})

/** 手动上传 */
const manualRef = useTemplateRef<InstanceType<typeof RebornUpload>>('manualRef')
const manualFiles = ref<UploadUserFile[]>([])
const manualRequest = createMockRequest({ interval: 400 })
const manualReadyCount = computed(() => manualFiles.value.filter(f => f.status === 'ready').length)
const manualUploadingCount = computed(() => manualFiles.value.filter(f => f.status === 'uploading').length)

/** 额外参数与请求头：回显组件交给 http-request 的参数 */
const extraFiles = ref<UploadUserFile[]>([])
const extraHeaders = { Authorization: 'Bearer demo-token' }
const extraEcho = shallowRef('')
const extraRequest = createMockRequest({
  response: req => ({ filename: req.filename, data: req.data, headers: req.headers }),
})

/** 模拟先向服务端换取签名，再随文件一起提交 */
async function resolveExtraData(rawFile: UploadRawFile) {
  await wait(300)
  return { bizType: 'contract', signature: `sig-${rawFile.uid}` }
}

function onExtraSuccess(response: unknown) {
  extraEcho.value = JSON.stringify(response, null, 2)
}

/** 真实接口上传：乐淘测试环境的图片上传接口，文件字段名是 multipart，查询参数直接写在地址里 */
const realAction = 'https://api-admin-letaofun.test.rebornnet.cn/api/admin/upload/image?model=config&pid=0'
const realFiles = ref<UploadUserFile[]>([])
const realEcho = shallowRef('')

/** 接口响应：成败看 code，HTTP 状态码不论成败都是 200 */
interface RealUploadResponse {
  code: number
  message: string
  data: { fileName: string, extName: string, fileSize: number, url: string, type: string } | null
}

/**
 * 接口对不支持的格式（如 webp）返回 HTTP 200 + code 500，默认请求只看 HTTP 状态会把它标成成功。
 * 沿用 ajaxUpload 保留进度与中止，只在成功回调里补一道业务码判断，业务失败转交 onError，message 成为失败原因。
 */
const realRequest: UploadRequestHandler = options => ajaxUpload({
  ...options,
  onSuccess: (response) => {
    const body = response as RealUploadResponse | undefined
    if (body?.code === 200 && body.data) options.onSuccess(body)
    else options.onError(new Error(body?.message || '上传失败'))
  },
})

/** 成功后用服务端地址替换本地预览地址，表单提交时拿到的就是线上地址 */
function onRealSuccess(response: unknown, file: UploadFile) {
  const body = response as RealUploadResponse
  if (body.data) file.url = body.data.url
  realEcho.value = JSON.stringify(body, null, 2)
}

function onRealError(error: Error) {
  realEcho.value = `上传失败：${error.message}`
}

/** 断点续传：服务端是页面里的模拟实现，记录每个上传任务已收到的分片，刷新页面即清空 */
interface MockChunkTask {
  uploadId: string
  chunkCount: number
  received: Set<number>
}
const mockChunkServer = new Map<string, MockChunkTask>()
let mockUploadSeq = 0

const resumeRef = useTemplateRef<InstanceType<typeof RebornUpload>>('resumeRef')
const resumeFiles = ref<UploadUserFile[]>([])
const resumeLog = shallowRef<UploadLogEntry[]>([])
const flakyNetwork = shallowRef(false)
const resumeUploadingCount = computed(() => resumeFiles.value.filter(f => f.status === 'uploading').length)
const resumeResumableCount = computed(() => resumeFiles.value.filter(f => f.status === 'paused' || f.status === 'fail').length)

function logResume(line: string) {
  resumeLog.value = [{ id: ++logSequence, text: line }, ...resumeLog.value].slice(0, 8)
}

/** 名称、大小、修改时间都相同视为同一个文件，删掉后重新选择也能接上服务端的上传任务 */
function fingerprint(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

/** 模拟网络耗时；暂停、删除时 signal 触发，立即中断 */
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (disposed || signal?.aborted) { reject(signal?.reason ?? new DOMException('演示已卸载', 'AbortError')); return }
    let timer: ReturnType<typeof setTimeout>
    function cleanup() {
      clearTimeout(timer)
      pendingTasks.delete(cancel)
      signal?.removeEventListener('abort', cancel)
    }
    function cancel() {
      cleanup()
      reject(signal?.reason ?? new DOMException('演示已卸载', 'AbortError'))
    }
    timer = setTimeout(() => { cleanup(); resolve() }, ms)
    pendingTasks.add(cancel)
    signal?.addEventListener('abort', cancel, { once: true })
  })
}

/** 分片适配器：真实接入时把四步换成对应的接口请求，signal 交给 fetch / axios 以便暂停时中断 */
const resumeAdapter: UploadChunkAdapter<string> = {
  chunkSize: 512 * 1024,
  concurrency: 3,
  retries: 2,
  async init({ file, chunkCount, signal }) {
    await wait(200, signal)
    const key = fingerprint(file)
    const existing = mockChunkServer.get(key)
    if (existing) {
      logResume(`init：${file.name} 沿用上传任务 ${existing.uploadId}`)
      return existing.uploadId
    }
    const uploadId = `upload-${++mockUploadSeq}`
    mockChunkServer.set(key, { uploadId, chunkCount, received: new Set() })
    logResume(`init：${file.name} 新建上传任务 ${uploadId}，共 ${chunkCount} 片`)
    return uploadId
  },
  async uploaded({ file, chunkCount, signal }) {
    await wait(150, signal)
    const received = [...(mockChunkServer.get(fingerprint(file))?.received ?? [])]
    logResume(`uploaded：服务端已有 ${received.length} / ${chunkCount} 片，这些分片不再上传`)
    return received
  },
  async uploadChunk({ file, index, onProgress, signal }) {
    // 真实接口在这里把 part.blob 放进 FormData，连同 context（uploadId）与 index 一起提交
    for (let step = 1; step <= 5; step++) {
      await wait(100 + Math.random() * 100, signal)
      if (flakyNetwork.value && step === 3 && Math.random() < 0.25) {
        logResume(`uploadChunk：分片 ${index} 传输中断`)
        throw new Error(`分片 ${index} 传输中断`)
      }
      onProgress(step * 20)
    }
    mockChunkServer.get(fingerprint(file))?.received.add(index)
  },
  async merge({ file, context, chunkCount, signal }) {
    await wait(300, signal)
    mockChunkServer.delete(fingerprint(file))
    logResume(`merge：${context} 的 ${chunkCount} 片合并完成`)
    return { uploadId: context, url: `/files/${encodeURIComponent(file.name)}` }
  },
}

/** 生成 8MB 测试文件：修改时间写死，删掉后再生成仍算同一个文件，可以演示跳过已传分片 */
function addResumeTestFile() {
  const file = new File([new Uint8Array(8 * 1024 * 1024)], '断点续传测试-8MB.bin', {
    type: 'application/octet-stream',
    lastModified: 1767225600000,
  })
  resumeRef.value?.handleStart(file as UploadRawFile)
  resumeRef.value?.submit()
}

/** 上传文件夹 */
const folderFiles = ref<UploadUserFile[]>([])

/** 自定义文件项 */
const customRef = useTemplateRef<InstanceType<typeof RebornUpload>>('customRef')
const customFiles = ref<UploadUserFile[]>([
  { name: '用户访谈录音.m4a', size: 8388608 },
  { name: '竞品分析.key', size: 3145728 },
])

/** 禁用 */
const disabledFiles = ref<UploadUserFile[]>([
  { name: 'strata.webp', url: '/images/lithos/strata.webp' },
  { name: '项目章程.pdf' },
])
const disabledCardFiles = ref<UploadUserFile[]>([
  { name: 'strata.webp', url: '/images/lithos/strata.webp' },
  { name: 'living-strata.webp', url: '/images/lithos/living-strata.webp' },
])
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="uploadCode" component-name="RebornUpload"
      title="交互演练场" description="切换列表形态与行为开关，选择文件后观察状态流转与钩子回调。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full max-w-[520px] flex-col gap-4">
        <RebornUpload
          ref="playRef" v-model:file-list="playFiles" :list-type="state.listType" :drag="state.drag"
          :multiple="state.multiple" :show-file-list="state.showFileList" :disabled="state.disabled"
          :auto-upload="state.autoUpload" :limit="state.limit || undefined" :http-request="playRequest"
          :on-change="onPlayChange" :on-exceed="onPlayExceed" :on-remove="onPlayRemove"
        >
          <template v-if="!state.drag && state.listType !== 'picture-card'">
            <RebornButton color="neutral" variant="outlined" :disabled="state.disabled">
              <template #leading>
                <Icon name="lucide:upload" class="size-[16px]" />
              </template>
              点击上传
            </RebornButton>
          </template>
          <template #tip>
            {{ playTip }}
          </template>
        </RebornUpload>

        <div v-if="!state.autoUpload">
          <RebornButton :disabled="state.disabled" @click="playRef?.submit()">
            开始上传
          </RebornButton>
        </div>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          {{ statusCounts }}<br>
          {{ lastEvent || '选择或删除文件后，这里显示最近一次钩子回调' }}
        </DemoNote>
        <DemoNote tone="dimmed">
          演示使用模拟请求，不会真正发送文件；接入时把 action 换成真实的上传地址即可。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        绑定 <code>v-model:file-list</code> 拿到文件列表，<code>action</code> 填上传地址；选择文件后立即上传。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload v-model:file-list="basicFiles" action="/api/upload" class="w-full max-w-[400px]" :http-request="mockRequest">
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
        </RebornUpload>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="文件列表形态">
      <template #description>
        <code>list-type</code> 切换 <code>text</code>、<code>picture</code>、<code>picture-card</code> 三种形态；上传中显示进度条，失败项悬停图标查看原因。
      </template>
      <DemoBlock layout="stack" class="gap-8">
        <div v-for="t in uploadListTypes" :key="t" class="flex w-full items-start gap-3">
          <p class="text-dimmed w-24 shrink-0 pt-2 text-xs italic">{{ t }}</p>
          <RebornUpload
            v-model:file-list="listTypeFiles[t]" :list-type="t" multiple class="w-full min-w-0"
            :class="t === 'picture-card' ? 'max-w-[640px]' : 'max-w-[480px]'"
            :http-request="mockRequest"
          >
            <template v-if="t !== 'picture-card'">
              <RebornButton color="neutral" variant="outlined">
                <template #leading>
                  <Icon name="lucide:upload" class="size-[16px]" />
                </template>
                点击上传
              </RebornButton>
            </template>
          </RebornUpload>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="拖拽上传">
      <template #description>
        开启 <code>drag</code> 后触发区变为拖放区，把文件拖进来或点击都能选择；配合 <code>multiple</code> 一次放入多个。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload v-model:file-list="dragFiles" drag multiple class="w-full max-w-[480px]" :http-request="mockRequest">
          <template #tip>
            支持一次拖入多个文件
          </template>
        </RebornUpload>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="照片墙与预览">
      <template #description>
        <code>list-type="picture-card"</code> 让卡片与上传入口排在同一行；图片默认使用 <code>RebornImage</code> 预览，支持缩放、旋转与多图切换。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="wallFiles" list-type="picture-card" accept="image/*" multiple
          :http-request="mockRequest"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="视频预览">
      <template #description>
        <code>list-type</code> 为 <code>picture</code> 或 <code>picture-card</code> 时，视频与图片一样生成本地预览地址，缩略图取视频首帧；浏览器无法解码的格式（如 avi）回退为文件图标。
      </template>
      <DemoBlock layout="stack" class="gap-6">
        <div>
          <RebornButton color="neutral" variant="outlined" :loading="videoRecording" @click="addSampleVideo">
            <template #leading>
              <Icon name="lucide:clapperboard" class="size-[16px]" />
            </template>
            生成示例视频
          </RebornButton>
        </div>
        <RebornUpload
          ref="videoListRef" v-model:file-list="videoListFiles" list-type="picture" accept="video/*" multiple
          class="w-full max-w-[480px]" :http-request="mockRequest"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            上传视频
          </RebornButton>
        </RebornUpload>
        <RebornUpload
          ref="videoCardRef" v-model:file-list="videoCardFiles" list-type="picture-card" accept="video/*" multiple
          :http-request="mockRequest" :on-preview="onVideoPreview"
        />
        <DemoNote tone="dimmed">
          「生成示例视频」用 canvas 现录一段 2 秒的视频，同时加入上面两个列表；也可以直接选择本地视频，照片墙悬停后点预览可播放。
        </DemoNote>
      </DemoBlock>
      <RebornDialog v-model="previewOpen" destroy-on-close :title="previewFile?.name" width="640px" :cancel-btn="false" :confirm-btn="false">
        <video v-if="previewOpen && previewFile?.url" :src="previewFile.url" controls autoplay class="w-full rounded-sm" />
      </RebornDialog>
    </DemoSection>

    <DemoSection title="数量限制">
      <template #description>
        <code>limit</code> 限制文件总数；本次选择会超出时整批不加入，并触发 <code>on-exceed</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="limitFiles" :limit="3" multiple class="w-full max-w-[400px]"
          :http-request="mockRequest" :on-exceed="onLimitExceed"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
          <template #tip>
            最多上传 3 个文件
          </template>
        </RebornUpload>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="上传前处理">
      <template #description>
        <code>before-upload</code> 返回 <code>false</code> 时拒绝该文件；返回新的 File / Blob 时改为上传它，适合压缩、加水印。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="compressFiles" list-type="picture" accept="image/*" multiple class="w-full max-w-[480px]"
          :http-request="compressRequest" :before-upload="compressBeforeUpload" :on-success="onCompressSuccess"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
          <template #tip>
            只接收 5MB 以内的图片，上传前按长边 1280px 压缩为 jpeg
          </template>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          <template v-if="compressLog.length">
            <div v-for="line in compressLog" :key="line.id">
              {{ line.text }}
            </div>
          </template>
          <template v-else>
            上传图片后，这里显示压缩前后的大小
          </template>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="删除前确认">
      <template #description>
        <code>before-remove</code> 可以返回 Promise，等确认弹窗关闭后再决定是否删除；返回 <code>false</code> 或 reject 时保留文件。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="confirmFiles" multiple class="w-full max-w-[400px]" :http-request="mockRequest"
          :before-remove="confirmBeforeRemove"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
        </RebornUpload>
      </DemoBlock>
      <RebornDialog
        v-model="removeConfirmOpen" title="删除文件" :describe="`确定删除「${removeTarget}」吗？`" width="400px"
        :confirm-btn="{ label: '删除', color: 'error' }" @confirm="onRemoveConfirm"
      />
    </DemoSection>

    <DemoSection title="手动上传">
      <template #description>
        关闭 <code>auto-upload</code> 后文件先停在待上传状态，通过实例方法 <code>submit</code>、<code>abort</code>、<code>clearFiles</code> 控制。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          ref="manualRef" v-model:file-list="manualFiles" :auto-upload="false" multiple class="w-full max-w-[480px]"
          :http-request="manualRequest"
        >
          <template #trigger>
            <RebornButton color="neutral" variant="outlined">
              <template #leading>
                <Icon name="lucide:folder-open" class="size-[16px]" />
              </template>
              选择文件
            </RebornButton>
          </template>
          <div class="ml-3 inline-flex gap-2">
            <RebornButton :disabled="!manualReadyCount" @click="manualRef?.submit()">
              开始上传
            </RebornButton>
            <RebornButton variant="outlined" color="neutral" :disabled="!manualUploadingCount" @click="manualRef?.abort()">
              中止
            </RebornButton>
            <RebornButton variant="text" color="neutral" :disabled="!manualFiles.length" @click="manualRef?.clearFiles()">
              清空
            </RebornButton>
          </div>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          待上传 {{ manualReadyCount }} 个，上传中 {{ manualUploadingCount }} 个；中止后文件回到待上传，可再次提交
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="额外参数与请求头">
      <template #description>
        <code>data</code> 可以是对象、Promise 或按文件返回的函数，<code>headers</code> 设置请求头，<code>name</code> 改文件字段名。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="extraFiles" name="attachment" class="w-full max-w-[400px]" :data="resolveExtraData"
          :headers="extraHeaders" :http-request="extraRequest" :on-success="onExtraSuccess"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs whitespace-pre-wrap">
          {{ extraEcho || '上传一个文件，这里回显随请求提交的字段名、data 与 headers' }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="真实接口上传">
      <template #description>
        <code>name</code> 设为接口要求的字段名 <code>multipart</code>，查询参数直接写进 <code>action</code>；该接口失败时也返回 HTTP 200、靠响应里的 <code>code</code> 区分，所以用 <code>http-request</code> 包一层 <code>ajaxUpload</code> 补业务码判断，成功后在 <code>on-success</code> 里把预览图换成服务端地址。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="realFiles" :action="realAction" name="multipart" accept="image/*" list-type="picture"
          class="w-full max-w-[400px]" :http-request="realRequest" :on-success="onRealSuccess" :on-error="onRealError"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            上传图片
          </RebornButton>
          <template #tip>
            接口只收 jpg / png / gif / bmp，选一张 webp 可以看到业务码失败的效果
          </template>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs break-all whitespace-pre-wrap">
          {{ realEcho || '上传一张图片，这里回显接口返回的原始响应' }}
        </DemoNote>
        <DemoNote tone="dimmed">
          这是测试环境的真实接口，选中的图片会实际上传；需要登录态的接口在 <code>headers</code> 里带上令牌，写法见「额外参数与请求头」。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="断点续传">
      <template #description>
        传入 <code>chunk</code> 适配器后改为分片上传：组件负责切片、并发、单片重试与跳过已传分片，使用方实现 <code>init</code>、<code>uploaded</code>、<code>uploadChunk</code>、<code>merge</code> 四步对接服务端；上传中的文件可以暂停，暂停或失败后从断点继续。
      </template>
      <DemoBlock layout="stack">
        <div class="flex items-center gap-3">
          <RebornSwitch v-model="flakyNetwork" />
          <span class="text-muted text-sm">模拟网络不稳定（每片约 25% 概率中断，组件自动重试）</span>
        </div>
        <RebornUpload
          ref="resumeRef" v-model:file-list="resumeFiles" :chunk="resumeAdapter" multiple class="w-full max-w-[480px]"
        >
          <template #trigger>
            <RebornButton color="neutral" variant="outlined">
              <template #leading>
                <Icon name="lucide:folder-open" class="size-[16px]" />
              </template>
              选择文件
            </RebornButton>
          </template>
          <div class="ml-3 inline-flex gap-2">
            <RebornButton variant="outlined" color="neutral" @click="addResumeTestFile">
              生成 8MB 测试文件
            </RebornButton>
            <RebornButton variant="text" color="neutral" :disabled="!resumeUploadingCount" @click="resumeRef?.pause()">
              全部暂停
            </RebornButton>
            <RebornButton variant="text" color="neutral" :disabled="!resumeResumableCount" @click="resumeRef?.resume()">
              全部继续
            </RebornButton>
          </div>
          <template #tip>
            按 512KB 切片、每次同时传 3 片；暂停后删掉文件再选同一个文件，会跳过服务端已收到的分片
          </template>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          <template v-if="resumeLog.length">
            <div v-for="line in resumeLog" :key="line.id">
              {{ line.text }}
            </div>
          </template>
          <template v-else>
            开始上传后，这里按时间倒序显示适配器各步骤的调用
          </template>
        </DemoNote>
        <DemoNote tone="dimmed">
          演示的服务端是页面里的模拟实现，分片不会离开浏览器，刷新页面后记录清空。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="上传文件夹">
      <template #description>
        开启 <code>directory</code> 后只能选择文件夹，夹内文件递归展开后逐个加入列表；同样支持拖入文件夹。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          v-model:file-list="folderFiles" directory drag class="w-full max-w-[480px]" :http-request="mockRequest"
          :ui="{ list: 'max-h-[200px] overflow-auto' }"
        >
          <Icon name="lucide:folder-up" class="size-[32px] text-gray-6" />
          <div>拖拽文件夹到此处，或 <span class="text-primary">点击选择</span></div>
        </RebornUpload>
        <DemoNote tone="dimmed" class="font-mono text-xs">
          已加入 {{ folderFiles.length }} 个文件
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义文件项">
      <template #description>
        <code>file</code> 插槽接收 <code>file</code> 与 <code>index</code>，替换整条列表项；删除时调用实例方法 <code>handleRemove</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornUpload
          ref="customRef" v-model:file-list="customFiles" multiple class="w-full max-w-[480px]"
          :http-request="mockRequest"
        >
          <RebornButton color="neutral" variant="outlined">
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
          <template #file="{ file }">
            <Icon name="lucide:file-text" class="size-[16px] shrink-0 text-gray-6" />
            <span class="text-default min-w-0 flex-1 truncate">{{ file.name }}</span>
            <span class="shrink-0 text-xs text-gray-6">{{ formatSize(file.size) }}</span>
            <span class="w-20 shrink-0 text-right text-xs" :class="statusColors[file.status]">
              {{ file.status === 'uploading' ? `上传中 ${Math.round(file.percentage ?? 0)}%` : statusLabels[file.status] }}
            </span>
            <RebornButton size="sm" variant="text" color="neutral" @click="customRef?.handleRemove(file)">
              删除
            </RebornButton>
          </template>
        </RebornUpload>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用">
      <template #description>
        <code>disabled</code> 后不能选择文件，列表也不再显示删除按钮；图片仍可使用内置预览。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <RebornUpload v-model:file-list="disabledFiles" disabled class="w-full">
          <RebornButton color="neutral" variant="outlined" disabled>
            <template #leading>
              <Icon name="lucide:upload" class="size-[16px]" />
            </template>
            点击上传
          </RebornButton>
        </RebornUpload>
        <RebornUpload v-model:file-list="disabledCardFiles" list-type="picture-card" disabled />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
