<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { uuid } from '@/lib/file'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, {
  type SignatureColor,
  type SignatureSize,
  type SignatureToolbarPosition,
  type SignatureUI,
} from './reborn-signature.config'

defineOptions({
  name: 'RebornSignature',
})

export interface SignaturePoint {
  x: number
  y: number
  time: number
  width?: number
}

export interface SignatureStroke {
  color: string
  width: number
  minWidth?: number
  maxWidth?: number
  penPressure?: boolean
  points: SignaturePoint[]
}

export interface SignatureChangePayload {
  strokes: SignatureStroke[]
  isEmpty: boolean
}

export interface SignatureSavePayload extends SignatureChangePayload {
  tempFilePath: string
}

export interface RebornSignatureProps {
  /** 自定义 class */
  customClass?: any
  /** 自定义 style */
  customStyle?: any
  /** 样式覆盖 */
  ui?: SignatureUI
  /** 尺寸 */
  size?: SignatureSize
  /** 主题色 */
  color?: SignatureColor
  /** 画布高度，数字使用 rpx */
  height?: number | string
  /** 画笔颜色 */
  penColor?: string
  /** 可选画笔颜色列表 */
  penColors?: string[]
  /** 是否显示默认画笔色板 */
  showPenColors?: boolean
  /** 画笔宽度，单位 px */
  lineWidth?: number
  /** 是否启用笔锋效果 */
  penPressure?: boolean
  /** 笔锋最小宽度，单位 px */
  minLineWidth?: number
  /** 笔锋最大宽度，单位 px */
  maxLineWidth?: number
  /** 背景色，设为空字符串可导出透明背景 */
  backgroundColor?: string
  /** 占位文本 */
  placeholder?: string
  /** 是否显示默认操作栏 */
  showToolbar?: boolean
  /** 横屏签名时操作按钮位置 */
  toolbarPosition?: SignatureToolbarPosition
  /** 是否显示撤销按钮 */
  showUndo?: boolean
  /** 是否显示恢复按钮 */
  showRedo?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 空白签名是否允许导出 */
  allowEmpty?: boolean
  /** 导出图片类型 */
  fileType?: 'png' | 'jpg'
  /** jpg 导出质量 */
  quality?: number
  /** 导出图片相对展示尺寸的倍数 */
  destScale?: number
  /** 记录触点的最小移动距离 */
  minDistance?: number
  /**
   * 外部通过 CSS transform rotate 旋转组件时传入的角度（顺时针）。
   * 用于修正触点坐标与画布坐标系的偏差，微信小程序横屏签名场景下需传入 90。
   */
  rotate?: 0 | 90 | 180 | 270
}

const props = withDefaults(defineProps<RebornSignatureProps>(), {
  customClass: '',
  customStyle: '',
  ui: () => ({}),
  size: 'md',
  color: 'primary',
  height: 360,
  penColor: '#111827',
  penColors: () => ['#111827', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'],
  showPenColors: true,
  lineWidth: 4,
  penPressure: false,
  minLineWidth: undefined,
  maxLineWidth: undefined,
  backgroundColor: '#FFFFFF',
  placeholder: '请在此处签名',
  showToolbar: true,
  toolbarPosition: 'bottom',
  showUndo: true,
  showRedo: true,
  disabled: false,
  readonly: false,
  allowEmpty: false,
  fileType: 'png',
  quality: 1,
  destScale: 3,
  minDistance: 2,
  rotate: 0,
})

const modelValue = defineModel<string>({ default: '' })

const emit = defineEmits<{
  (e: 'start', point: SignaturePoint): void
  (e: 'draw', point: SignaturePoint): void
  (e: 'end', stroke: SignatureStroke): void
  (e: 'change', payload: SignatureChangePayload): void
  (e: 'clear'): void
  (e: 'undo', stroke: SignatureStroke | undefined): void
  (e: 'redo', stroke: SignatureStroke | undefined): void
  (e: 'update:penColor', color: string): void
  (e: 'penColorChange', color: string): void
  (e: 'save', payload: SignatureSavePayload): void
  (e: 'error', error: Error): void
}>()

const slots = defineSlots<{
  placeholder: (props: { isEmpty: boolean }) => any
  toolbar: (props: {
    isEmpty: boolean
    disabled: boolean
    readonly: boolean
    clear: () => void
    undo: () => void
    redo: () => void
    save: () => Promise<string>
    penColor: string
    penColors: string[]
    selectPenColor: (color: string) => void
    toolbarPosition: SignatureToolbarPosition
    canUndo: boolean
    canRedo: boolean
  }) => any
}>()

const { proxy } = getCurrentInstance()!
const { disabled: formDisabled, isError, validate } = useFormInject(props)

const canvasId = ref(`reborn-signature-${uuid()}`)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const canvasRect = ref<any>(null)
const strokes = ref<SignatureStroke[]>([])
const undoneStrokes = ref<SignatureStroke[]>([])
const drawing = ref(false)
const currentStroke = ref<SignatureStroke | null>(null)
const canvasContext = ref<any>(null)
const currentPenColor = ref(props.penColor)

const b = tv(theme)
const isDisabled = computed(() => formDisabled.value || props.disabled)
const isReadonly = computed(() => props.readonly)
const isInteractive = computed(() => !isDisabled.value && !isReadonly.value)
const isEmpty = computed(() => strokes.value.length === 0)
const canUndo = computed(() => strokes.value.length > 0)
const canRedo = computed(() => undoneStrokes.value.length > 0)
const historyActionActiveClassMap: Record<SignatureColor, string> = {
  primary: 'border-primary bg-primary/10 text-primary',
  secondary: 'border-secondary bg-secondary/10 text-secondary',
  success: 'border-success bg-success/10 text-success',
  info: 'border-info bg-info/10 text-info',
  warning: 'border-warning bg-warning/10 text-warning',
  error: 'border-error bg-error/10 text-error',
  neutral: 'border-neutral bg-gray-2 text-gray-7',
}
const selectablePenColors = computed(() => {
  const colors = [...props.penColors]
  if (currentPenColor.value && !colors.includes(currentPenColor.value)) {
    colors.unshift(currentPenColor.value)
  }
  return colors
})

function getHistoryActionClass(active: boolean) {
  if (active) {
    return historyActionActiveClassMap[props.color]
  }

  return 'border-gray-3 bg-white text-gray-4 opacity-50'
}

const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    disabled: isDisabled.value,
    readonly: isReadonly.value,
    error: isError.value,
    toolbarPosition: props.toolbarPosition,
  })

  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    board: (opts?: { class?: any }) =>
      styles.board({ class: cn(opts?.class, props.ui?.board) }),
    canvas: (opts?: { class?: any }) =>
      styles.canvas({ class: cn(opts?.class, props.ui?.canvas) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, props.ui?.placeholder) }),
    colorBar: (opts?: { class?: any }) =>
      styles.colorBar({ class: cn(opts?.class, props.ui?.colorBar) }),
    colorSwatch: (opts?: { class?: any }) =>
      styles.colorSwatch({ class: cn(opts?.class, props.ui?.colorSwatch) }),
    colorSwatchInner: (opts?: { class?: any }) =>
      styles.colorSwatchInner({ class: cn(opts?.class, props.ui?.colorSwatchInner) }),
    toolbar: (opts?: { class?: any }) =>
      styles.toolbar({ class: cn(opts?.class, props.ui?.toolbar) }),
    action: (opts?: { class?: any }) =>
      styles.action({ class: cn(opts?.class, props.ui?.action) }),
    actionIcon: (opts?: { class?: any }) =>
      styles.actionIcon({ class: cn(opts?.class, props.ui?.actionIcon) }),
    actionText: (opts?: { class?: any }) =>
      styles.actionText({ class: cn(opts?.class, props.ui?.actionText) }),
  }
})

const boardStyle = computed(() => ({
  height: toUnit(props.height),
  backgroundColor: props.backgroundColor || 'transparent',
}))

const canvasStyle = computed(() => ({
  width: canvasWidth.value ? `${canvasWidth.value}px` : '100%',
  height: canvasHeight.value ? `${canvasHeight.value}px` : toUnit(props.height),
}))

function toUnit(value: number | string) {
  console.warn('[RebornSignature] height 属性建议使用数字，单位默认为 rpx', typeof value === 'number' ? `${value}rpx` : value)
  return typeof value === 'number' ? `${value}rpx` : value
}

function cloneStrokes(): SignatureStroke[] {
  return strokes.value.map(stroke => ({
    color: stroke.color,
    width: stroke.width,
    minWidth: stroke.minWidth,
    maxWidth: stroke.maxWidth,
    penPressure: stroke.penPressure,
    points: stroke.points.map(point => ({ ...point })),
  }))
}

function emitChange() {
  emit('change', {
    strokes: cloneStrokes(),
    isEmpty: isEmpty.value,
  })
}

function createError(message: string) {
  const error = new Error(message)
  emit('error', error)
  return error
}

function setContextStyle(ctx: any, stroke?: SignatureStroke) {
  const color = stroke?.color ?? props.penColor
  const width = stroke?.width ?? props.lineWidth

  if (ctx.setStrokeStyle) {
    ctx.setStrokeStyle(color)
    ctx.setLineWidth(width)
    ctx.setLineCap('round')
    ctx.setLineJoin('round')
  }
  else {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
}

function setFillStyle(ctx: any, color: string) {
  if (ctx.setFillStyle) {
    ctx.setFillStyle(color)
  }
  else {
    ctx.fillStyle = color
  }
}

function clearCanvas(ctx: any) {
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  if (props.backgroundColor) {
    setFillStyle(ctx, props.backgroundColor)
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  }
}

function getMinLineWidth(stroke: SignatureStroke) {
  return stroke.minWidth ?? Math.max(1, stroke.width * 0.35)
}

function getMaxLineWidth(stroke: SignatureStroke) {
  return stroke.maxWidth ?? Math.max(stroke.width, stroke.width * 1.45)
}

function getPointWidth(point: SignaturePoint, prevPoint: SignaturePoint | undefined, stroke: SignatureStroke) {
  if (!stroke.penPressure) {
    return stroke.width
  }

  const minWidth = getMinLineWidth(stroke)
  const maxWidth = Math.max(getMaxLineWidth(stroke), minWidth)

  if (!prevPoint) {
    return maxWidth
  }

  const move = distance(point, prevPoint)
  const duration = Math.max(point.time - prevPoint.time, 16)
  const velocity = move / duration
  const speedRatio = Math.min(1, velocity / 1.2)
  const width = maxWidth - (maxWidth - minWidth) * speedRatio
  const prevWidth = prevPoint.width ?? maxWidth

  return prevWidth * 0.65 + width * 0.35
}

function getSegmentWidth(prevPoint: SignaturePoint, point: SignaturePoint, stroke: SignatureStroke) {
  if (!stroke.penPressure) {
    return stroke.width
  }

  const prevWidth = prevPoint.width ?? getMaxLineWidth(stroke)
  const currentWidth = point.width ?? getPointWidth(point, prevPoint, stroke)

  return (prevWidth + currentWidth) / 2
}

function drawDot(ctx: any, point: SignaturePoint, stroke: SignatureStroke) {
  setFillStyle(ctx, stroke.color)
  ctx.beginPath()
  ctx.arc(point.x, point.y, (point.width ?? stroke.width) / 2, 0, Math.PI * 2)
  if (ctx.fill) {
    ctx.fill()
  }
}

function drawPressureStroke(ctx: any, stroke: SignatureStroke) {
  const points = stroke.points

  for (let index = 1; index < points.length; index++) {
    const prevPoint = points[index - 1]
    const point = points[index]
    const width = getSegmentWidth(prevPoint, point, stroke)

    setContextStyle(ctx, { ...stroke, width })
    ctx.beginPath()
    ctx.moveTo(prevPoint.x, prevPoint.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
  }
}

function drawStroke(ctx: any, stroke: SignatureStroke) {
  const points = stroke.points

  if (points.length === 0) {
    return
  }

  if (points.length === 1) {
    drawDot(ctx, points[0], stroke)
    return
  }

  if (stroke.penPressure) {
    drawPressureStroke(ctx, stroke)
    return
  }

  setContextStyle(ctx, stroke)
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  if (ctx.quadraticCurveTo && points.length > 2) {
    for (let index = 1; index < points.length - 1; index++) {
      const current = points[index]
      const next = points[index + 1]
      const midX = (current.x + next.x) / 2
      const midY = (current.y + next.y) / 2
      ctx.quadraticCurveTo(current.x, current.y, midX, midY)
    }
  }
  else {
    for (let index = 1; index < points.length; index++) {
      ctx.lineTo(points[index].x, points[index].y)
    }
  }

  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

function drawAll() {
  if (!canvasWidth.value || !canvasHeight.value) {
    return
  }

  // #ifdef MP-WEIXIN
  const ctx = canvasContext.value
  if (!ctx) {
    return
  }
  clearCanvas(ctx)
  strokes.value.forEach(stroke => drawStroke(ctx, stroke))
  // #endif

  // #ifndef MP-WEIXIN
  const ctx = uni.createCanvasContext(canvasId.value, proxy)
  clearCanvas(ctx)
  strokes.value.forEach(stroke => drawStroke(ctx, stroke))
  ctx.draw(false)
  // #endif
}

function refreshCanvasRect(): Promise<any> {
  return new Promise((resolve) => {
    uni.createSelectorQuery()
      .in(proxy)
      .select('.reborn-signature__board')
      .boundingClientRect((rect: any) => {
        if (rect) {
          canvasRect.value = rect
          // 外部 CSS rotate(90deg/270deg) 旋转后，bounding rect 的宽高相对组件本地坐标已互换。
          // 还原为组件本地坐标系的真实画布尺寸，保证 clearCanvas/initCanvas 正确。
          const isSwapped = props.rotate === 90 || props.rotate === 270
          canvasWidth.value = isSwapped ? rect.height : rect.width
          canvasHeight.value = isSwapped ? rect.width : rect.height
        }
        resolve(rect)
      })
      .exec()
  })
}

async function initCanvas() {
  await nextTick()
  await refreshCanvasRect()

  // #ifdef MP-WEIXIN
  await new Promise<void>((resolve) => {
    const query = uni.createSelectorQuery().in(proxy)
      ; (query.select(`#${canvasId.value}`) as any)
        .fields({ node: true, size: true }, (res: any) => {
          if (res?.node) {
            const dpr = uni.getSystemInfoSync().pixelRatio || 1
            const canvas = res.node
            canvas.width = canvasWidth.value * dpr
            canvas.height = canvasHeight.value * dpr
            const ctx = canvas.getContext('2d')
            if (ctx.setTransform) {
              ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            }
            else {
              ctx.scale(dpr, dpr)
            }
            canvasContext.value = ctx
          }
          resolve()
        })
        .exec()
  })
  // #endif

  drawAll()
}

function getPoint(event: any): SignaturePoint | null {
  const touch = event?.touches?.[0] || event?.changedTouches?.[0] || event
  const rect = canvasRect.value

  if (!touch || !rect) {
    return null
  }

  const clientX = touch.clientX ?? touch.x ?? 0
  const clientY = touch.clientY ?? touch.y ?? 0
  // dx/dy 是触点在屏幕坐标系中相对于 bounding rect 左上角的偏移
  const dx = clientX - rect.left
  const dy = clientY - rect.top

  // 根据外部 CSS 旋转角度，将屏幕坐标逆变换为画布本地坐标
  // 旋转 90° 时 rect.width = 原始高度，rect.height = 原始宽度
  let x: number
  let y: number
  switch (props.rotate) {
    case 90:
      // 顺时针 90°：screen-Y → canvas-X，screen-X（反向）→ canvas-Y
      x = dy
      y = rect.width - dx
      break
    case 270:
      // 逆时针 90°（顺时针 270°）
      x = rect.height - dy
      y = dx
      break
    case 180:
      x = rect.width - dx
      y = rect.height - dy
      break
    default:
      x = dx
      y = dy
  }

  x = Math.max(0, Math.min(x, canvasWidth.value))
  y = Math.max(0, Math.min(y, canvasHeight.value))

  return {
    x,
    y,
    time: Date.now(),
  }
}

function distance(pointA: SignaturePoint, pointB: SignaturePoint) {
  const x = pointA.x - pointB.x
  const y = pointA.y - pointB.y
  return Math.sqrt(x * x + y * y)
}

async function onTouchStart(event: any) {
  if (!isInteractive.value) {
    return
  }

  // 弹窗、横屏和动画场景下，初次挂载时拿到的画布位置可能不准确。
  // 每次落笔前重新测量一次，确保触点坐标和当前画布位置一致。
  await initCanvas()

  const point = getPoint(event)
  if (!point) {
    return
  }

  drawing.value = true
  modelValue.value = ''
  undoneStrokes.value = []
  const stroke: SignatureStroke = {
    color: currentPenColor.value,
    width: props.lineWidth,
    minWidth: props.minLineWidth,
    maxWidth: props.maxLineWidth,
    penPressure: props.penPressure,
    points: [],
  }
  point.width = getPointWidth(point, undefined, stroke)
  stroke.points.push(point)
  currentStroke.value = stroke
  strokes.value.push(currentStroke.value)
  drawAll()
  emit('start', point)
}

function selectPenColor(color: string) {
  if (!isInteractive.value || !color || currentPenColor.value === color) {
    return
  }

  currentPenColor.value = color
  emit('update:penColor', color)
  emit('penColorChange', color)
}

function onTouchMove(event: any) {
  if (!drawing.value || !currentStroke.value || !isInteractive.value) {
    return
  }

  const point = getPoint(event)
  const points = currentStroke.value.points
  const prevPoint = points[points.length - 1]

  if (!point || (prevPoint && distance(point, prevPoint) < props.minDistance)) {
    return
  }

  point.width = getPointWidth(point, prevPoint, currentStroke.value)
  points.push(point)
  drawAll()
  emit('draw', point)
}

function onTouchEnd() {
  if (!drawing.value || !currentStroke.value) {
    return
  }

  drawing.value = false
  const stroke = currentStroke.value
  if (stroke.penPressure && stroke.points.length > 1) {
    stroke.points[stroke.points.length - 1].width = getMinLineWidth(stroke)
    drawAll()
  }
  currentStroke.value = null
  emit('end', stroke)
  emitChange()
  validate('change')
}

function onMouseStart(event: any) {
  onTouchStart(event)
}

function onMouseMove(event: any) {
  onTouchMove(event)
}

function onMouseEnd() {
  onTouchEnd()
}

function clear() {
  strokes.value = []
  undoneStrokes.value = []
  currentStroke.value = null
  drawing.value = false
  modelValue.value = ''
  drawAll()
  emit('clear')
  emitChange()
  validate('change')
}

function undo() {
  const stroke = strokes.value.pop()
  if (!stroke) {
    return
  }

  undoneStrokes.value.push(stroke)
  modelValue.value = ''
  drawAll()
  emit('undo', stroke)
  emitChange()
  validate('change')
}

function redo() {
  const stroke = undoneStrokes.value.pop()
  if (!stroke) {
    return
  }

  strokes.value.push(stroke)
  modelValue.value = ''
  drawAll()
  emit('redo', stroke)
  emitChange()
  validate('change')
}

function handleClear() {
  if (!isInteractive.value) {
    return
  }
  clear()
}

function handleUndo() {
  if (!isInteractive.value || !canUndo.value) {
    return
  }
  undo()
}

function handleRedo() {
  if (!isInteractive.value || !canRedo.value) {
    return
  }
  redo()
}

function toPng(options?: { allowEmpty?: boolean }): Promise<string> {
  const allowEmpty = options?.allowEmpty ?? props.allowEmpty

  if (isEmpty.value && !allowEmpty) {
    createError('签名内容为空，无法导出')
    return Promise.resolve('')
  }

  drawAll()

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const destWidth = canvasWidth.value * props.destScale
      const destHeight = canvasHeight.value * props.destScale

      // #ifdef MP-WEIXIN
      const query = uni.createSelectorQuery().in(proxy)
        ; (query.select(`#${canvasId.value}`) as any)
          .fields({ node: true }, (res: any) => {
            if (!res?.node) {
              const error = createError('未找到签名画布')
              reject(error)
              return
            }

            ; (uni.canvasToTempFilePath as any)({
              canvas: res.node,
              fileType: props.fileType,
              quality: props.quality,
              destWidth,
              destHeight,
              success: (result: any) => {
                resolve(result.tempFilePath)
              },
              fail: (error: any) => {
                createError(error?.errMsg || '签名导出失败')
                reject(error)
              },
            })
          })
          .exec()
      // #endif

      // #ifndef MP-WEIXIN
      uni.canvasToTempFilePath(
        {
          canvasId: canvasId.value,
          fileType: props.fileType,
          quality: props.quality,
          destWidth,
          destHeight,
          success: (result) => {
            resolve(result.tempFilePath)
          },
          fail: (error) => {
            createError(error?.errMsg || '签名导出失败')
            reject(error)
          },
        },
        proxy,
      )
      // #endif
    }, 80)
  })
}

async function save() {
  const tempFilePath = await toPng()

  if (!tempFilePath) {
    return ''
  }

  modelValue.value = tempFilePath
  const payload = {
    tempFilePath,
    strokes: cloneStrokes(),
    isEmpty: isEmpty.value,
  }
  emit('save', payload)
  validate('change')
  return tempFilePath
}

function getStrokes() {
  return cloneStrokes()
}

watch(
  () => [props.height, props.backgroundColor],
  () => {
    initCanvas()
  },
)

watch(
  () => props.penColor,
  (color) => {
    currentPenColor.value = color
  },
)

onMounted(() => {
  setTimeout(() => {
    initCanvas()
  }, 30)
})

defineExpose({
  clear,
  undo,
  redo,
  save,
  toPng,
  getStrokes,
  selectPenColor,
  penColor: currentPenColor,
  isEmpty,
  canUndo,
  canRedo,
})
</script>

<template>
  <view :class="ui.root()" :style="customStyle">
    <view class="reborn-signature__board" :class="ui.board()" :style="boardStyle"
      @touchstart.stop.prevent="onTouchStart" @touchmove.stop.prevent="onTouchMove" @touchend.stop.prevent="onTouchEnd"
      @touchcancel.stop.prevent="onTouchEnd" @mousedown.stop.prevent="onMouseStart"
      @mousemove.stop.prevent="onMouseMove" @mouseup.stop.prevent="onMouseEnd" @mouseleave.stop.prevent="onMouseEnd">
      <!-- #ifdef MP-WEIXIN -->
      <canvas type="2d" :id="canvasId" :class="ui.canvas()" :style="canvasStyle" :disable-scroll="true" />
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <canvas :id="canvasId" :canvas-id="canvasId" :class="ui.canvas()" :style="canvasStyle" :disable-scroll="true" />
      <!-- #endif -->

      <slot v-if="isEmpty" name="placeholder" :is-empty="isEmpty">
        <view v-if="placeholder" :class="ui.placeholder()">
          {{ placeholder }}
        </view>
      </slot>
    </view>



    <slot name="toolbar" :is-empty="isEmpty" :disabled="isDisabled" :readonly="isReadonly" :clear="clear" :undo="undo"
      :redo="redo" :save="save" :pen-color="currentPenColor" :pen-colors="selectablePenColors"
      :select-pen-color="selectPenColor" :toolbar-position="toolbarPosition" :can-undo="canUndo" :can-redo="canRedo">
      <view v-if="showToolbar" :class="ui.toolbar()" style="background-color: ;">
        <view v-if="showPenColors && selectablePenColors.length > 0" :class="ui.colorBar()">
          <view v-for="item in selectablePenColors" :key="item" :class="ui.colorSwatch({
            class: currentPenColor === item ? 'border-primary ring-2 ring-primary/20' : '',
          })" @tap="selectPenColor(item)">
            <view :class="ui.colorSwatchInner()" :style="{ backgroundColor: item }" />
          </view>
        </view>

        <view v-if="showUndo" :class="ui.action({ class: getHistoryActionClass(canUndo) })" @tap="handleUndo">
          <view :class="ui.actionIcon({ class: 'i-lucide-undo-2' })" />
          <text :class="ui.actionText()">撤销</text>
        </view>

        <view v-if="showRedo" :class="ui.action({ class: getHistoryActionClass(canRedo) })" @tap="handleRedo">
          <view :class="ui.actionIcon({ class: 'i-lucide-redo-2' })" />
          <text :class="ui.actionText()">恢复</text>
        </view>

        <view :class="ui.action({ class: isEmpty && 'opacity-50' })" @tap="handleClear">
          <view :class="ui.actionIcon({ class: 'i-lucide-eraser' })" />
          <text :class="ui.actionText()">清空</text>
        </view>

        <view :class="ui.action()" @tap="save">
          <view :class="ui.actionIcon({ class: 'i-lucide-check' })" />
          <text :class="ui.actionText()">完成</text>
        </view>
      </view>
    </slot>
  </view>
</template>
