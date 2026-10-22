<script setup lang="ts">
/**
 * 组件文档页（/components/xxx）的滚动乐谱背景：《欢乐颂》钢琴谱（大谱表）随页面下滑逐行写出
 * - 由 docs 布局挂载，挂在 UPage 的 :key 之外，组件页之间切换时画布复用、随滚动归零重画；
 * - 每行先以波浪形的五线谱从左向右铺开，随后线条收平、谱号与小节线浮现，音符再从左到右依次落下；
 * - 进度只由滚动位置决定，上滑按原路倒退，停止滚动即停止重绘；
 * - 写满视口后整张谱以半速上移，新的一行始终在视口下部写出，长页面一路都有新内容；
 * - 减少动态效果偏好下去掉波浪、下落与上移，只保留逐行淡入。
 *
 * 坐标约定：谱表内部以「线距」s 为单位，y 从高音谱表第一线（最上一线）起算，
 * 高音谱表占 0~4，低音谱表占 10~14，两谱表之间留 6 个线距放下加线音。
 */
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

interface Props {
  /** 整层最大不透明度，谱面写满后即为此值 */
  opacity?: number
  /** 相邻两行大谱表的间隔（上一行低音谱表末线到下一行高音谱表首线），单位 px */
  rowGap?: number
}

const { opacity = 0.03, rowGap = 25 } = defineProps<Props>()

const wrapper = useTemplateRef<HTMLDivElement>('wrapper')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

/* ─── 曲谱数据 ─── */

/** 音符事件：同一时刻的若干音高（和弦）+ 拍位 + 时值，pos 为相对所在谱表首线的线距 */
interface NoteEvent {
  pos: number[]
  beat: number
  dur: number
  /** 0 高音谱表，1 低音谱表 */
  staff: 0 | 1
  /** 与后一个八分音符连梁 */
  beamNext?: boolean
  /** 被前一个八分音符连梁 */
  beamPrev?: boolean
}

/**
 * 右手旋律（C 大调简化版，4/4，一拍为四分音符）。
 * 写法：音名+八度，冒号后为拍数（缺省 1 拍），和弦用 + 连接。
 */
const PHRASE = ['E4 E4 F4 G4', 'G4 F4 E4 D4', 'C4 C4 D4 E4']
const MELODY = [
  ...PHRASE, 'E4:1.5 D4:.5 D4:2',
  ...PHRASE, 'D4:1.5 C4:.5 C4:2',
  'D4 D4 E4 C4', 'D4 E4:.5 F4:.5 E4 C4', 'D4 E4:.5 F4:.5 E4 D4', 'C4 D4 G3:2',
  ...PHRASE, 'D4:1.5 C4:.5 C4:2',
]

/** 左手伴奏：主、属和弦的根音与五音 */
const TONIC = 'C3+G3'
const DOMINANT = 'G2+D3'
const BASS = [
  `${TONIC}:4`, `${DOMINANT}:4`, `${TONIC}:4`, `${DOMINANT}:4`,
  `${TONIC}:4`, `${DOMINANT}:4`, `${TONIC}:4`, `${DOMINANT}:2 ${TONIC}:2`,
  `${DOMINANT}:2 ${TONIC}:2`, `${DOMINANT}:2 ${TONIC}:2`, `${DOMINANT}:4`, `${TONIC}:2 ${DOMINANT}:2`,
  `${TONIC}:4`, `${DOMINANT}:4`, `${TONIC}:4`, `${DOMINANT}:2 ${TONIC}:2`,
]

const BAR_COUNT = MELODY.length

/** 各谱表首线的音级序号（C0 记 0，每升一个音名 +1）：高音谱表首线 F5，低音谱表首线 A3 */
const TOP_LINE_STEP = [5 * 7 + 3, 3 * 7 + 5] as const

/** 音名 → 相对谱表首线的线距（向下为正，相邻音级差半个线距） */
function staffPos(name: string, staff: 0 | 1) {
  const step = Number(name.slice(-1)) * 7 + 'CDEFGAB'.indexOf(name[0]!)
  return (TOP_LINE_STEP[staff] - step) / 2
}

function parseBar(source: string, staff: 0 | 1) {
  const notes: NoteEvent[] = []
  let beat = 0
  for (const token of source.split(' ')) {
    const [keys = '', dur = '1'] = token.split(':')
    const length = Number(dur)
    notes.push({ pos: keys.split('+').map(key => staffPos(key, staff)), beat, dur: length, staff })
    beat += length
  }
  // 同一拍内相邻的两个八分音符连梁，其余八分音符单独带符尾
  notes.forEach((note, index) => {
    const next = notes[index + 1]
    if (note.dur === 0.5 && next?.dur === 0.5 && Number.isInteger(note.beat)) {
      note.beamNext = true
      next.beamPrev = true
    }
  })
  return notes
}

const SCORE = MELODY.map((melody, index) => [...parseBar(melody, 0), ...parseBar(BASS[index]!, 1)])

/* ─── 时间轴（单行进度 t ∈ [0, 1]） ─── */

/** 一行从开写到写完所跨的滚动量，以「行」计；大于 1 使相邻两行的书写有交叠 */
const ROW_SPAN = 1.8
/** 谱面上移速度：页面每滚动 1px，谱面上移 0.5px */
const DRIFT_SPEED = 0.5
/** 波浪振幅（线距倍数）与波长（线距倍数） */
const WAVE_AMP = 1.15
const WAVE_LENGTH = 22
/** 新写出的行底边停在视口高度的这个比例处，之后整张谱上移 */
const FRONTIER = 0.92

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smoothstep = (from: number, to: number, value: number) => {
  const x = clamp01((value - from) / (to - from))
  return x * x * (3 - 2 * x)
}
const easeOut = (value: number) => 1 - (1 - value) ** 3

/* ─── 布局 ─── */

interface PlacedNote extends NoteEvent {
  x: number
  /** 出现顺序：0 为行首，1 为行尾；连梁的两个音同时出现 */
  order: number
}

interface RowLayout {
  notes: PlacedNote[]
  barLines: number[]
  /** 本行收尾是否为全曲终止线 */
  final: boolean
  /** 本行是否从第 1 小节开始（需要写拍号） */
  opening: boolean
}

let viewWidth = 0
let viewHeight = 0
let dpr = 1
/** 线距 px */
let space = 9
let pitch = 0
let top = 0
let left = 0
let right = 0
let barsPerRow = 4
const rowCache = new Map<number, RowLayout>()

function measure(width: number, height: number) {
  const target = canvas.value
  if (!target) return
  viewWidth = width
  viewHeight = height
  // 大屏高倍率下画布像素过多，限制在约 800 万像素以内，背景层不需要极致锐利
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  dpr = Math.max(1, Math.min(ratio, Math.sqrt(8e6 / Math.max(1, viewWidth * viewHeight))))
  target.width = Math.round(viewWidth * dpr)
  target.height = Math.round(viewHeight * dpr)

  space = Math.min(9, Math.max(7, Math.round(viewWidth / 170)))
  pitch = 14 * space + rowGap
  top = 64 + rowGap + 2 * space
  left = Math.max(16, viewWidth * 0.04) + 1.6 * space
  right = viewWidth - Math.max(16, viewWidth * 0.04)
  // 每小节约 24 个线距时最接近印刷谱的疏密，在 2 / 4 / 8 小节一行里取最接近的（都能整除 16 小节）
  const available = right - left - 6.4 * space
  barsPerRow = [2, 4, 8].reduce((best, count) =>
    Math.abs(available / count - 24 * space) < Math.abs(available / best - 24 * space) ? count : best)
  rowCache.clear()
}

function layoutRow(row: number): RowLayout {
  const firstBar = (row * barsPerRow) % BAR_COUNT
  const cached = rowCache.get(firstBar)
  if (cached) return cached

  const opening = firstBar === 0
  const start = left + (opening ? 6.4 : 4) * space
  const barWidth = (right - start) / barsPerRow
  const notes: PlacedNote[] = []
  const barLines: number[] = []
  for (let offset = 0; offset < barsPerRow; offset++) {
    const barX = start + offset * barWidth
    const inner = barWidth - 2.4 * space
    for (const note of SCORE[(firstBar + offset) % BAR_COUNT]!) {
      const x = barX + 1.4 * space + (note.beat / 4) * inner
      notes.push({ ...note, x, order: (x - start) / (right - start) })
    }
    barLines.push(barX + barWidth)
  }
  // 连梁的后一个音跟随前一个音出现，避免横梁先于音符画出
  notes.forEach((note, index) => {
    if (note.beamPrev) note.order = notes[index - 1]!.order
  })
  const layout = { notes, barLines, final: firstBar + barsPerRow === BAR_COUNT, opening }
  rowCache.set(firstBar, layout)
  return layout
}

/* ─── 绘制 ─── */

let context: CanvasRenderingContext2D | null = null
let ink = 'currentColor'
let calm = false
let frame = 0

/** 高音谱号（单线描绘，坐标为线距，原点在谱号左缘、高音谱表首线） */
const TREBLE_CLEF = 'M1.62 3.05C1.05 3.2 .98 2.35 1.55 2.2C2.3 2 2.65 3 2.25 3.7C1.85 4.35 .55 4.3 .3 3.35C.05 2.4 .85 1.55 1.5 .85C2.15 .15 2.3-.95 1.95-1.65C1.7-2.1 1.25-1.55 1.28-.75L1.78 5.55C1.85 6.2 1.15 6.5 .8 6.1'
/** 低音谱号主体，球心落在第二线（F 线） */
const BASS_CLEF = 'M.3 1C.2 0 1.6-.35 2.15.55C2.65 1.45 2 2.9.3 3.9'

let trebleClef: Path2D | null = null
let bassClef: Path2D | null = null

function dot(x: number, y: number, radius: number) {
  const ctx = context!
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawStaffLines(y: number, t: number, scroll: number) {
  const ctx = context!
  const reveal = calm ? 1 : easeOut(clamp01(t / 0.36))
  const amplitude = calm ? 0 : WAVE_AMP * space * (1 - smoothstep(0.3, 0.6, t))
  const end = left + reveal * (right - left)
  const wave = (Math.PI * 2) / (WAVE_LENGTH * space)
  // 波相位随滚动推进：下滑时波纹向右流动，停止滚动即静止
  const phase = scroll / 120

  ctx.globalAlpha = calm ? smoothstep(0, 0.5, t) : clamp01(t / 0.06)
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let staff = 0; staff < 2; staff++) {
    for (let line = 0; line < 5; line++) {
      const base = y + (staff * 10 + line) * space
      if (amplitude < 0.05) {
        ctx.moveTo(left, base)
        ctx.lineTo(end, base)
        continue
      }
      // 行首振幅收窄，像被谱号一端拴住；每条线错开一点相位，五线谱像一条微微扭转的缎带
      const shift = line * 0.32 + staff * 1.1
      for (let x = left; ; x = Math.min(end, x + 6)) {
        const envelope = 0.25 + 0.75 * smoothstep(0, 0.18, (x - left) / (right - left))
        const offset = amplitude * envelope * Math.sin(x * wave - phase + shift)
        if (x === left) ctx.moveTo(x, base + offset)
        else ctx.lineTo(x, base + offset)
        if (x >= end) break
      }
    }
  }
  ctx.stroke()
}

function drawFrame(y: number, layout: RowLayout, t: number) {
  const ctx = context!
  const s = space
  const alpha = calm ? smoothstep(0.2, 0.6, t) : smoothstep(0.56, 0.72, t)
  if (alpha <= 0) return
  ctx.globalAlpha = alpha
  const height = 14 * s
  // 小节线自上而下画出
  const grow = calm ? height : height * easeOut(alpha)

  // 连谱号（花括号）：左右两条曲线围成的月牙，中段最粗
  const bx = left - 0.45 * s
  const w = s
  const mid = y + 7 * s
  const bottom = y + height
  ctx.beginPath()
  ctx.moveTo(bx, y)
  ctx.bezierCurveTo(bx - w, y + 3 * s, bx - 0.05 * w, mid - 3 * s, bx - w, mid)
  ctx.bezierCurveTo(bx - 0.05 * w, mid + 3 * s, bx - w, bottom - 3 * s, bx, bottom)
  ctx.bezierCurveTo(bx - 0.7 * w, bottom - 3 * s, bx + 0.3 * w, mid + 3 * s, bx - w, mid)
  ctx.bezierCurveTo(bx + 0.3 * w, mid - 3 * s, bx - 0.7 * w, y + 3 * s, bx, y)
  ctx.fill()

  // 行首竖线与各小节线贯穿上下两个谱表
  ctx.lineWidth = Math.max(1, 0.12 * s)
  ctx.beginPath()
  ctx.moveTo(left, y)
  ctx.lineTo(left, y + grow)
  const lines = layout.final ? layout.barLines.slice(0, -1) : layout.barLines
  for (const x of lines) {
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + grow)
  }
  ctx.stroke()
  if (layout.final) {
    // 终止线：细线 + 粗线
    ctx.beginPath()
    ctx.moveTo(right - 0.8 * s, y)
    ctx.lineTo(right - 0.8 * s, y + grow)
    ctx.stroke()
    ctx.fillRect(right - 0.5 * s, y, 0.5 * s, grow)
  }

  // 谱号
  ctx.save()
  ctx.translate(left + 0.7 * s, y)
  ctx.scale(s, s)
  ctx.lineWidth = 0.22
  ctx.lineCap = 'round'
  ctx.stroke(trebleClef!)
  ctx.beginPath()
  ctx.arc(0.95, 5.8, 0.32, 0, Math.PI * 2)
  ctx.fill()
  ctx.translate(0, 10)
  ctx.lineWidth = 0.28
  ctx.stroke(bassClef!)
  // 球头与两个点各自起笔，避免多段圆弧被连成一个多边形填充
  ctx.beginPath()
  for (const [cx, cy, radius] of [[0.55, 1, 0.36], [2.75, 0.5, 0.16], [2.75, 1.5, 0.16]] as const) {
    ctx.moveTo(cx + radius, cy)
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  }
  ctx.fill()
  ctx.restore()

  // 拍号 4/4：只写在从第 1 小节开始的行
  if (layout.opening) {
    ctx.font = `700 ${2.8 * s}px "Times New Roman", Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const x = left + 4.8 * s
    for (const staffTop of [y, y + 10 * s]) {
      ctx.fillText('4', x, staffTop + 1.05 * s)
      ctx.fillText('4', x, staffTop + 3.05 * s)
    }
  }
}

function drawNotes(y: number, layout: RowLayout, t: number) {
  const ctx = context!
  const s = space
  const rx = 0.62 * s
  const ry = 0.44 * s
  ctx.lineCap = 'butt'
  let beamFrom: { x: number, y: number } | null = null

  for (const note of layout.notes) {
    const start = 0.62 + note.order * 0.3
    const progress = calm ? smoothstep(0.3, 0.8, t) : clamp01((t - start) / 0.08)
    if (progress <= 0) continue
    ctx.globalAlpha = progress
    // 音符从上方轻轻落到谱线上
    const drop = calm ? 0 : -(1 - easeOut(progress)) * 1.2 * s
    const staffTop = y + note.staff * 10 * s + drop
    const x = note.x
    const ys = note.pos.map(pos => staffTop + pos * s)

    // 加线：超出谱表的音在其所在及以内的每条线位置补短横线
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const pos of note.pos) {
      for (let line = 5; line <= pos; line++) {
        ctx.moveTo(x - rx - 0.35 * s, staffTop + line * s)
        ctx.lineTo(x + rx + 0.35 * s, staffTop + line * s)
      }
    }
    ctx.stroke()

    // 符头：全音符、二分音符空心，其余实心
    const hollow = note.dur >= 2
    for (const headY of ys) {
      ctx.beginPath()
      if (note.dur >= 4) {
        ctx.ellipse(x, headY, rx * 1.15, ry, 0, 0, Math.PI * 2)
        ctx.lineWidth = 0.22 * s
        ctx.stroke()
      }
      else if (hollow) {
        ctx.ellipse(x, headY, rx * 0.9, ry * 0.82, -0.35, 0, Math.PI * 2)
        ctx.lineWidth = 0.17 * s
        ctx.stroke()
      }
      else {
        ctx.ellipse(x, headY, rx, ry, -0.35, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // 附点：落在线上的音把附点挪到上方的间里
    if (note.dur === 1.5 || note.dur === 3) {
      const pos = note.pos[0]!
      dot(x + rx + 0.5 * s, staffTop + (Number.isInteger(pos) ? pos - 0.5 : pos) * s, 0.17 * s)
    }

    if (note.dur >= 4) continue

    // 符干：平均位置在谱表中线以下朝上，否则朝下
    const up = note.pos.reduce((sum, pos) => sum + pos, 0) / note.pos.length > 2
    const highest = Math.min(...ys)
    const lowest = Math.max(...ys)
    const stemX = up ? x + rx * 0.92 : x - rx * 0.92
    const stemEnd = up ? highest - 3.5 * s : lowest + 3.5 * s
    ctx.lineWidth = Math.max(1, 0.12 * s)
    ctx.beginPath()
    ctx.moveTo(stemX, up ? lowest : highest)
    ctx.lineTo(stemX, stemEnd)
    ctx.stroke()

    if (note.beamNext) {
      beamFrom = { x: stemX, y: stemEnd }
    }
    else if (note.beamPrev && beamFrom) {
      // 符梁：两个符干顶端之间的粗横梁
      const thickness = 0.48 * s * (up ? 1 : -1)
      ctx.beginPath()
      ctx.moveTo(beamFrom.x, beamFrom.y)
      ctx.lineTo(stemX, stemEnd)
      ctx.lineTo(stemX, stemEnd + thickness)
      ctx.lineTo(beamFrom.x, beamFrom.y + thickness)
      ctx.closePath()
      ctx.fill()
      beamFrom = null
    }
    else if (note.dur === 0.5) {
      // 单独的八分音符：符干顶端甩出一条符尾
      ctx.lineWidth = 0.22 * s
      ctx.beginPath()
      ctx.moveTo(stemX, stemEnd)
      ctx.bezierCurveTo(stemX + 0.2 * s, stemEnd + 1.2 * s, stemX + 1.3 * s, stemEnd + 1.6 * s, stemX + 0.9 * s, stemEnd + 2.9 * s)
      ctx.stroke()
    }
  }
}

function draw() {
  frame = 0
  const ctx = context
  if (!ctx || document.hidden || !viewWidth) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, viewWidth, viewHeight)
  ctx.strokeStyle = ink
  ctx.fillStyle = ink

  const scroll = window.scrollY
  // 已开写的行数（可带小数）：每滚动 pitch / DRIFT_SPEED 像素开写新的一行
  const written = (scroll * DRIFT_SPEED) / pitch
  // 新写出的行将越过视口下部时，整张谱随滚动上移，保持书写位置停在 FRONTIER 处
  const drift = calm ? 0 : Math.max(0, top + written * pitch + 14 * space - FRONTIER * viewHeight)
  const first = Math.max(0, Math.floor((drift - top - 16 * space) / pitch))
  const last = Math.ceil(written) - 1

  for (let row = first; row <= last; row++) {
    const t = clamp01((written - row) / ROW_SPAN)
    const y = top + row * pitch - drift
    if (t <= 0 || y > viewHeight + 2 * space || y + 16 * space < 0) continue
    const layout = layoutRow(row)
    drawStaffLines(y, t, scroll)
    drawFrame(y, layout, t)
    drawNotes(y, layout, t)
  }
  ctx.globalAlpha = 1
}

/** 滚动、尺寸与主题变化合并到下一帧绘制 */
function schedule() {
  if (!frame) frame = requestAnimationFrame(draw)
}

/** 墨色取页面主文字色，明暗切换后重新读取 */
function syncInk() {
  if (wrapper.value) ink = getComputedStyle(wrapper.value).color
  schedule()
}

let preference: MediaQueryList | undefined
let resizeObserver: ResizeObserver | undefined
let themeObserver: MutationObserver | undefined

function syncPreference() {
  calm = !!preference?.matches
  schedule()
}

function onResize(entries: ResizeObserverEntry[]) {
  const entry = entries[0]
  if (!entry) return
  // 使用浏览器布局后给出的尺寸，避免挂载途中同步测量整页文档。
  measure(entry.contentRect.width, entry.contentRect.height)
  syncInk()
}

onMounted(() => {
  context = canvas.value?.getContext('2d') ?? null
  if (!context) return
  trebleClef = new Path2D(TREBLE_CLEF)
  bassClef = new Path2D(BASS_CLEF)
  preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', syncPreference)
  calm = preference.matches
  window.addEventListener('scroll', schedule, { passive: true })
  document.addEventListener('visibilitychange', schedule)
  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(wrapper.value!)
  themeObserver = new MutationObserver(syncInk)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  preference?.removeEventListener('change', syncPreference)
  window.removeEventListener('scroll', schedule)
  document.removeEventListener('visibilitychange', schedule)
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
})
</script>

<template>
  <!--
    纯装饰层：固定铺满视口，不占文档高度，不拦截指针。
    z-[-1] 与布局的 bg-gray-1 底色层同级，靠 DOM 顺序排在底色之上、正文之下；更低的层级会被底色盖住。
  -->
  <div
    ref="wrapper" aria-hidden="true" data-docs-score
    class="text-highlighted pointer-events-none fixed inset-0 z-[-1] select-none overflow-hidden" :style="{ opacity }"
  >
    <canvas ref="canvas" class="block size-full" />
  </div>
</template>
