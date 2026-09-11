<script setup lang="ts">
import type {
  TabKey,
  TabPaneMeta,
  TabsColor,
  TabsDirection,
  TabsPosition,
  TabsSize,
  TabsTrigger,
  TabsType,
  TabsUI,
} from './reborn-tabs.config'
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { cn } from '@/lib/utils'
import theme, { TABS_INJECTION_KEY } from './reborn-tabs.config'

defineOptions({
  name: 'RebornTabs',
})

const props = withDefaults(defineProps<RebornTabsProps>(), {
  position: 'top',
  type: 'line',
  direction: 'horizontal',
  size: 'medium',
  color: 'primary',
  editable: false,
  showAddButton: false,
  destroyOnHide: false,
  lazyLoad: false,
  justify: false,
  animation: false,
  headerPadding: false,
  autoSwitch: false,
  hideContent: false,
  trigger: 'click',
  scrollPosition: 'auto',
})

const emit = defineEmits<{
  /** 当前标签值改变时触发 */
  (e: 'change', key: TabKey): void
  /** 用户点击标签时触发，禁用标签不触发；模板上写作 @tab-click */
  (e: 'tabClick', key: TabKey): void
  /** 用户点击增加按钮时触发 */
  (e: 'add'): void
  /** 用户点击删除按钮时触发，组件不会自行移除标签，需由外部维护列表 */
  (e: 'delete', key: TabKey): void
}>()

export interface RebornTabsProps {
  /** 默认选中的标签 key，非受控状态使用；为空时选中第一个标签页 */
  defaultActiveKey?: TabKey
  /** 选项卡头部的位置 */
  position?: TabsPosition
  /** 选项卡的大小 */
  size?: TabsSize
  /** 选项卡的类型 */
  type?: TabsType
  /** 选项卡的方向，vertical 等价于把头部放到侧边 */
  direction?: TabsDirection
  /** 选项卡主题色，决定选中态文字、指示器与卡片边框的取色 */
  color?: TabsColor
  /** 是否开启可编辑模式，开启后才会渲染删除按钮与增加按钮 */
  editable?: boolean
  /** 是否显示增加按钮，仅在可编辑模式可用 */
  showAddButton?: boolean
  /** 是否在不显示标签时销毁内容，对所有标签页生效 */
  destroyOnHide?: boolean
  /** 是否在首次展示标签时才挂载内容 */
  lazyLoad?: boolean
  /** 高度撑满容器，只在水平模式下生效 */
  justify?: boolean
  /** 是否开启选项内容过渡动画 */
  animation?: boolean
  /** 选项卡头部是否相对容器缩进一段边距，仅对 line、text 类型生效；默认贴边对齐 */
  headerPadding?: boolean
  /** 创建标签后是否切换到新标签（最后一个） */
  autoSwitch?: boolean
  /** 是否隐藏内容区，隐藏时标签页仍保持挂载，头部不受影响 */
  hideContent?: boolean
  /** 切换标签的触发方式，hover 仅 H5 生效 */
  trigger?: TabsTrigger
  /** 被选中标签的滚动位置，auto 只在超出可视区域时滚动，数字为直接指定的滚动距离 */
  scrollPosition?: 'start' | 'end' | 'center' | 'auto' | number
  class?: any
  /** 细粒度样式覆盖对象，键为 root/nav/navWrapper/list/tab/tabTitle/tabClose/indicator/tabSlider/addButton/extra/content/stage/pane */
  ui?: TabsUI
}

/** 当前选中的标签 key；未绑定 v-model 时由组件自身维护 */
const activeKey = defineModel<TabKey | undefined>('activeKey', { default: undefined })

const instance = getCurrentInstance()
/** 标签页登记表，顺序即头部渲染顺序 */
const panes = shallowRef<TabPaneMeta[]>([])

/** position 为左右时强制纵向；direction 为 vertical 时把上下位置折算成左侧 */
const isVertical = computed(
  () => props.direction === 'vertical' || props.position === 'left' || props.position === 'right',
)
const resolvedPosition = computed<TabsPosition>(() => {
  if (props.position === 'left' || props.position === 'right') return props.position
  return isVertical.value ? 'left' : props.position
})

/** 为空时回落到 defaultActiveKey，仍为空则选中第一个标签页 */
const currentKey = computed<TabKey | undefined>(
  () => activeKey.value ?? props.defaultActiveKey ?? panes.value[0]?.key,
)

/** line、card 系列的头部与内容之间有分隔线，其余类型靠标签自身形态区分 */
const hasDivider = computed(() => ['line', 'card', 'card-gutter'].includes(props.type))
/** 只有下划线类型需要可滑动的指示器 */
const showIndicator = computed(() => props.type === 'line')
/** 五种类型用一块可滑动的底板承载选中态，切换时底板从旧标签滑到新标签 */
const showSlider = computed(() =>
  ['card', 'card-gutter', 'card-fill', 'rounded', 'capsule'].includes(props.type),
)
/** 只有胶囊型底板做液体形变：卡片型底板就是那张卡片，压扁会看着像渲染坏了 */
const isLiquid = computed(() => ['rounded', 'capsule'].includes(props.type))
/** 可编辑模式才渲染增加按钮 */
const showAdd = computed(() => props.editable && props.showAddButton)

const uiOverrides = computed<TabsUI>(() => props.ui || {})

const baseVariants = computed(() => ({
  position: resolvedPosition.value,
  type: props.type,
  size: props.size,
  color: props.color,
  divider: hasDivider.value,
  headerPadding: props.headerPadding,
  // justify 只在水平方向生效
  justify: props.justify && !isVertical.value,
  animation: props.animation,
}))

const styles = computed(() => theme(baseVariants.value))

/**
 * 增加按钮直接套用未选中标签的整套盒子样式（高度、内边距、圆角、边框、底色），
 * addButton 槽只在末尾补图标按钮特有的方形宽度与居中，靠 tailwind-merge 覆盖掉标签的水平内边距
 */
const addButtonClass = computed(() =>
  theme({ ...baseVariants.value, active: false }).tab({
    class: cn(styles.value.addButton(), uiOverrides.value.addButton),
  }),
)

/**
 * 选中标签处在标签列的哪一端。card 类型的圆角按首尾分配，而底板是标签列的兄弟节点、
 * 永远既非首也非末，用不了标签那套 first:/last:，只能把端位算出来交给变体
 */
const activeEdge = computed<'first' | 'last' | 'both' | 'middle'>(() => {
  const total = panes.value.length
  const index = panes.value.findIndex(item => item.key === currentKey.value)
  if (index < 0) return 'middle'
  if (total === 1) return 'both'
  if (index === 0) return 'first'
  if (index === total - 1) return 'last'
  return 'middle'
})

/** 底板样式单独算一次，避免把随选中项变化的 edge 并进 baseVariants 让整套样式跟着重算 */
const sliderClass = computed(() =>
  theme({ ...baseVariants.value, edge: activeEdge.value }).tabSlider({
    class: uiOverrides.value.tabSlider,
  }),
)

/** 高度过渡时长，与 animation 变体写在 stage 上的 duration 保持一致 */
const STAGE_TRANSITION_DURATION = 280

/** 锁定期间写进 stage 的行内高度，为空表示已释放回 auto */
const stageHeight = ref('')
/** 锁定标志单独存一个：写入新高度的那一刻 stageHeight 会短暂相等，不能靠它反推是否在锁定中 */
const stageLocked = ref(false)
let stageTimer: ReturnType<typeof setTimeout> | undefined

const stageStyle = computed<Record<string, string>>(() =>
  stageHeight.value ? { height: stageHeight.value } : {},
)

/** justify 下高度由容器给（root h-full + content 撑满），hideContent 下内容整块不渲染，两种情况都不锁高度 */
const canFluidHeight = computed(
  () => props.animation && !props.hideContent && !(props.justify && !isVertical.value),
)

const ui = computed(() => ({
  root: (opts?: { class?: any }) =>
    styles.value.root({ class: cn(opts?.class, uiOverrides.value.root) }),
  nav: () => styles.value.nav({ class: uiOverrides.value.nav }),
  navWrapper: () => styles.value.navWrapper({ class: uiOverrides.value.navWrapper }),
  list: () => styles.value.list({ class: uiOverrides.value.list }),
  tabTitle: () => styles.value.tabTitle({ class: uiOverrides.value.tabTitle }),
  tabClose: () => styles.value.tabClose({ class: uiOverrides.value.tabClose }),
  indicator: () => styles.value.indicator({ class: uiOverrides.value.indicator }),
  tabSlider: () => sliderClass.value,
  addButton: () => addButtonClass.value,
  extra: () => styles.value.extra({ class: uiOverrides.value.extra }),
  content: () => styles.value.content({ class: uiOverrides.value.content }),
  // overflow-hidden 只在锁定期间挂着：静息态不裁剪，面板里的下拉与浮层照样能溢出
  stage: () =>
    styles.value.stage({
      class: cn(stageLocked.value && 'overflow-hidden', uiOverrides.value.stage),
    }),
}))

const paneClass = computed(() => styles.value.pane({ class: uiOverrides.value.pane }))

/**
 * 选中态与禁用态逐个标签计算，不能并入根节点的一次性样式。
 * 首末位置（tabPlace）也在这里按下标推导：card 的首末圆角不能靠 first:/last: 伪类——
 * 滑动底板恒为标签列的末位兄弟，:last-child 永远落不到最后一个标签上
 */
function tabClass(pane: TabPaneMeta, index: number) {
  const total = panes.value.length
  return theme({
    ...baseVariants.value,
    active: pane.key === currentKey.value,
    disabled: pane.disabled,
    tabPlace: total === 1 ? 'both' : index === 0 ? 'first' : index === total - 1 ? 'last' : 'middle',
  }).tab({ class: uiOverrides.value.tab })
}

/** 未写 key 的标签页按登记顺序补序号，计数器随组件实例独立 */
let autoKey = 0

function addPane(meta: TabPaneMeta) {
  if (meta.key === undefined || meta.key === null) meta.key = autoKey++
  panes.value = [...panes.value, meta]
}

function removePane(meta: TabPaneMeta) {
  panes.value = panes.value.filter(item => item !== meta)
}

/** 主轴上的起点与长度，起点已归一到滚动容器的内容坐标 */
interface AxisRect {
  offset: number
  size: number
}

const itemRects = shallowRef<AxisRect[]>([])
const titleRects = shallowRef<AxisRect[]>([])
/** 滚动容器可视区在主轴上的长度 */
const viewSize = ref(0)
/** 滚动容器当前的滚动量，auto 模式据此判断标签是否已在可视区域内 */
const currentScroll = ref(0)
/** 写回 scroll-view 的滚动量，仅在数值变化时才会触发滚动 */
const scrollOffset = ref(0)

const indicatorOffset = ref(0)
const indicatorSize = ref(0)
const indicatorVisible = ref(false)

const sliderOffset = ref(0)
const sliderSize = ref(0)
const sliderVisible = ref(false)

/** 指示器位置由测量标题得到，写成行内样式避免为每个位置生成一套类名 */
const indicatorStyle = computed<Record<string, string>>(() => {
  if (!indicatorVisible.value) return { opacity: '0' }
  return isVertical.value
    ? {
        opacity: '1',
        transform: `translateY(${indicatorOffset.value}px)`,
        height: `${indicatorSize.value}px`,
      }
    : {
        opacity: '1',
        transform: `translateX(${indicatorOffset.value}px)`,
        width: `${indicatorSize.value}px`,
      }
})

/** 交叉轴的压扁量，0 表示不压；只有液体类型会写非零值 */
const sliderSquash = ref(0)
/** 分段写入的行内过渡时长与缓动，为空表示沿用类名上的默认过渡 */
const sliderDuration = ref('')
const sliderEasing = ref('')

/**
 * 选中底板的位置。交叉轴已由 position 变体钉满，这里只写主轴位移与长度。
 * margin 归零是为了抹掉 card 类型挂在标签列上的 [&>*+*]:-ml-px —— 底板作为末位兄弟同样会命中，
 * 行内样式优先级高于类名，清零后底板才会正好落在量到的位置上。
 * 液体类型恒定写出 scale 函数（静息为 1）：transform 函数表长度前后一致，渲染层才会逐函数插值，
 * 卡片类型则一个字都不多写，行为与上一批完全一致
 */
const sliderStyle = computed<Record<string, string>>(() => {
  if (!sliderVisible.value) return { margin: '0', opacity: '0' }
  const vertical = isVertical.value
  const scale = isLiquid.value
    ? ` ${vertical ? 'scaleX' : 'scaleY'}(${1 - sliderSquash.value})`
    : ''
  const timing = sliderDuration.value
    ? {
        'transition-duration': sliderDuration.value,
        'transition-timing-function': sliderEasing.value,
      }
    : {}
  return vertical
    ? {
        margin: '0',
        opacity: '1',
        transform: `translateY(${sliderOffset.value}px)${scale}`,
        height: `${sliderSize.value}px`,
        ...timing,
      }
    : {
        margin: '0',
        opacity: '1',
        transform: `translateX(${sliderOffset.value}px)${scale}`,
        width: `${sliderSize.value}px`,
        ...timing,
      }
})

/** 行程段：前缘直奔目标、后缘留在原地，底板被拉成两个标签的并集 */
const LIQUID_TRAVEL_DURATION = 180
const LIQUID_TRAVEL_EASING = 'cubic-bezier(0.215, 0.61, 0.355, 1)'
/** 收拢段：后缘追上前缘，back-out 越过目标再弹回，就是「到位后回弹」 */
const LIQUID_SETTLE_DURATION = 240
const LIQUID_SETTLE_EASING = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'

/** 上一次提交的落点，液体形变的起点。快速连点时取的是提交值而非飞行中的视觉位置 */
let sliderRect: AxisRect | undefined
let liquidTimer: ReturnType<typeof setTimeout> | undefined
/** 只有真正切换标签才跑两段动画；每次 refresh() 重测也会走到写入口，靠这个标志区分 */
let liquidPending = false
/** 鼠标靠近未选中标签时给主轴落点叠的偏移量，不进响应式，写入时直接参与计算 */
let hoverOffset = 0

/** 把一次落点写进行内样式；duration 为 0 表示不覆盖类名上的默认过渡 */
function applySlider(rect: AxisRect, squash: number, duration: number, easing: string) {
  sliderOffset.value = rect.offset + hoverOffset
  sliderSize.value = rect.size
  sliderSquash.value = squash
  sliderDuration.value = duration ? `${duration}ms` : ''
  sliderEasing.value = duration ? easing : ''
  sliderVisible.value = true
}

/**
 * 液体形变。阶段 A 把底板主轴区间拉成起点与终点的并集（前缘先到、后缘留在原地），
 * 阶段 B 收拢到目标矩形并用 back-out 缓动越过目标再弹回。
 * 拉伸不只是装饰：行程中底板同时盖住两个标签，rounded 那身近白的选中文字才不会有一段
 * 悬在页面底色上看不见。交叉轴同时压扁一点，读起来像液体被拉长时的表面张力
 */
function runLiquid(from: AxisRect, to: AxisRect) {
  const unionStart = Math.min(from.offset, to.offset)
  const unionEnd = Math.max(from.offset + from.size, to.offset + to.size)
  // 压扁幅度随位移增长并封顶，相邻标签之间不会夸张形变
  const squash = Math.min(0.12, Math.abs(to.offset - from.offset) / 900)

  applySlider(
    { offset: unionStart, size: unionEnd - unionStart },
    squash,
    LIQUID_TRAVEL_DURATION,
    LIQUID_TRAVEL_EASING,
  )

  liquidTimer = setTimeout(() => {
    liquidTimer = undefined
    applySlider(to, 0, LIQUID_SETTLE_DURATION, LIQUID_SETTLE_EASING)
  }, LIQUID_TRAVEL_DURATION)
}

/** 悬停跟随：底板朝鼠标所在标签轻微前倾，尺寸不变。形变飞行中不打断，落位后才跟随 */
function applyHoverSlider() {
  if (!sliderRect || !isLiquid.value || liquidTimer !== undefined) return
  applySlider(sliderRect, 0, LIQUID_TRAVEL_DURATION, LIQUID_TRAVEL_EASING)
}

/** scroll-view 的横纵滚动量必须分别绑定，非当前轴恒为 0 */
const scrollLeft = computed(() => (isVertical.value ? 0 : scrollOffset.value))
const scrollTop = computed(() => (isVertical.value ? scrollOffset.value : 0))

/** 按 scroll-position 把选中标签滚进可视区域，并让指示器贴住选中标题 */
function updatePosition() {
  const index = panes.value.findIndex(item => item.key === currentKey.value)
  const item = index === -1 ? undefined : itemRects.value[index]
  if (!item) {
    indicatorVisible.value = false
    sliderVisible.value = false
    sliderRect = undefined
    return
  }

  // 指示器宽度取标题而非整个标签，左右内边距不计入下划线
  const title = index === -1 ? undefined : titleRects.value[index]
  indicatorOffset.value = title ? title.offset : item.offset + item.size / 2 - 10
  indicatorSize.value = title ? title.size : 20
  indicatorVisible.value = true

  // 底板要整块盖住选中标签，所以取标签矩形而非标题矩形
  const target: AxisRect = { offset: item.offset, size: item.size }
  const previous = sliderRect
  sliderRect = target

  const liquid = liquidPending
  liquidPending = false
  if (liquidTimer !== undefined) {
    clearTimeout(liquidTimer)
    liquidTimer = undefined
  }

  if (liquid && previous && isLiquid.value) {
    runLiquid(previous, target)
  }
  else {
    // 卡片类型不写行内时长，节奏交回 tabSlider 槽上的 duration-300，行为与改动前一致
    applySlider(target, 0, 0, '')
  }

  let next = currentScroll.value
  if (typeof props.scrollPosition === 'number') next = props.scrollPosition
  else if (props.scrollPosition === 'start') next = item.offset
  else if (props.scrollPosition === 'end') next = item.offset + item.size - viewSize.value
  else if (props.scrollPosition === 'center')
    next = item.offset + item.size / 2 - viewSize.value / 2
  // auto：只在超出可视区域时补齐差值，不做额外位置调整
  else if (item.offset < currentScroll.value) next = item.offset
  else if (item.offset + item.size > currentScroll.value + viewSize.value)
    next = item.offset + item.size - viewSize.value

  scrollOffset.value = Math.max(0, next)
}

/** 静息时量到的当前面板净高，作为下次切换的高度起点 */
let paneHeight: number | undefined

/** 释放高度锁回到 auto；之后内容自己长高不会被裁 */
function unlockStage() {
  if (stageTimer !== undefined) {
    clearTimeout(stageTimer)
    stageTimer = undefined
  }
  stageHeight.value = ''
  stageLocked.value = false
}

/** 把锁定的高度改写成新面板高度起过渡，过渡结束后释放 */
function settleStage(to: number) {
  if (!stageLocked.value) return
  if (stageHeight.value === `${to}px`) {
    unlockStage()
    return
  }
  if (stageTimer !== undefined) clearTimeout(stageTimer)
  stageHeight.value = `${to}px`
  stageTimer = setTimeout(unlockStage, STAGE_TRANSITION_DURATION)
}

/** 起点用上次静息时量到的高度：小程序端拿不到同步布局，切换这一刻已经无法再测 */
function lockStage() {
  if (paneHeight === undefined) return
  if (stageTimer !== undefined) clearTimeout(stageTimer)
  stageHeight.value = `${paneHeight}px`
  stageLocked.value = true
  // 兜底：测量失败时到时无条件释放，不把高度永久锁死
  stageTimer = setTimeout(unlockStage, STAGE_TRANSITION_DURATION * 2)
}

/** 量取头部各节点的位置，小程序端只能通过 createSelectorQuery 异步取得 */
function measure() {
  const vertical = isVertical.value
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query.select('.reborn-tabs__scroll').boundingClientRect()
  query.select('.reborn-tabs__scroll').scrollOffset()
  query.selectAll('.reborn-tabs__item').boundingClientRect()
  query.selectAll('.reborn-tabs__title').boundingClientRect()
  // 用 active 专属类单点查询而非按下标取：v-show 隐藏的兄弟节点量出 0，小程序对它们的返回还不一致
  query.select('.reborn-tabs__pane--active').boundingClientRect()
  query.exec((nodes: any[]) => {
    const wrapper = nodes?.[0]
    if (!wrapper) {
      indicatorVisible.value = false
      sliderVisible.value = false
      sliderRect = undefined
      return
    }
    const scroll = nodes?.[1]
    currentScroll.value = (vertical ? scroll?.scrollTop : scroll?.scrollLeft) ?? 0
    viewSize.value = (vertical ? wrapper.height : wrapper.width) ?? 0

    // 视口坐标减去容器起点再加回当前滚动量，得到与滚动无关的内容坐标
    const origin = (vertical ? wrapper.top : wrapper.left) ?? 0
    const toAxisRect = (node: any): AxisRect => ({
      offset: ((vertical ? node?.top : node?.left) ?? 0) - origin + currentScroll.value,
      size: ((vertical ? node?.height : node?.width) ?? 0),
    })

    itemRects.value = ((nodes?.[2] as any[]) ?? []).map(toAxisRect)
    titleRects.value = ((nodes?.[3] as any[]) ?? []).map(toAxisRect)
    updatePosition()

    // 进场面板此刻只做了 X 轴缩放与纵向位移，量到的高度就是净高，可以直接当过渡终点
    const height = nodes?.[4]?.height
    if (typeof height === 'number' && height > 0) {
      paneHeight = height
      settleStage(height)
    }
  })
}

/** 重新测量；用 setTimeout 而非 nextTick，确保视图层已完成渲染再取布局 */
function refresh() {
  setTimeout(measure, 50)
}

function switchTo(key: TabKey) {
  if (key === currentKey.value) return
  activeKey.value = key
  // 受控绑定下写入后同步读仍是旧值，事件载荷用本地 key
  emit('change', key)
}

function handleTabClick(pane: TabPaneMeta) {
  if (pane.disabled) return
  emit('tabClick', pane.key)
  switchTo(pane.key)
}

function handleTabHover(pane: TabPaneMeta, index: number) {
  if (props.trigger === 'hover') {
    if (pane.disabled) return
    switchTo(pane.key)
    return
  }
  // 点击触发时悬停只做底板的轻微前倾，给 trigger=hover 的直接切换让位。
  // 标签矩形取自缓存的测量结果，小程序端拿不到事件源节点的布局
  if (!sliderRect || !isLiquid.value) return
  if (pane.disabled || pane.key === currentKey.value) return
  const item = itemRects.value[index]
  if (!item) return
  const targetCenter = item.offset + item.size / 2
  const selfCenter = sliderRect.offset + sliderRect.size / 2
  hoverOffset = (targetCenter - selfCenter) * 0.15
  applyHoverSlider()
}

/** 归位挂在整条标签列上而不是单个标签，标签之间移动时底板持续跟随 */
function handleListLeave() {
  if (!hoverOffset) return
  hoverOffset = 0
  applyHoverSlider()
}

function handleDelete(pane: TabPaneMeta) {
  if (pane.disabled) return
  emit('delete', pane.key)
}

watch(currentKey, (_key, previous) => {
  liquidPending = true
  // 点击后底板真正吸附到目标标签，不再保留悬停的前倾
  hoverOffset = 0
  // 首次确定选中项时还没有缓存到的起点高度，跳过这一次高度过渡
  if (previous === undefined || !canFluidHeight.value) return
  lockStage()
})

watch(
  [currentKey, () => panes.value, () => props.type, () => props.size, resolvedPosition],
  refresh,
)

watch(
  () => panes.value.length,
  (length, previous) => {
    if (!props.autoSwitch || length <= (previous ?? 0)) return
    const last = panes.value[length - 1]
    if (last) switchTo(last.key)
  },
)

onMounted(refresh)

onBeforeUnmount(() => {
  if (liquidTimer !== undefined) clearTimeout(liquidTimer)
  if (stageTimer !== undefined) clearTimeout(stageTimer)
})

provide(TABS_INJECTION_KEY, {
  activeKey: currentKey,
  lazyLoad: computed(() => props.lazyLoad),
  destroyOnHide: computed(() => props.destroyOnHide),
  animation: computed(() => props.animation),
  paneClass,
  addPane,
  removePane,
})

defineExpose({
  /** `() => void` 重新测量指示器与选中底板并把选中标签滚进可视区域，外部改变标签宽度后调用 */
  refresh,
})
</script>

<template>
  <view :class="ui.root({ class: props.class })">
    <view :class="ui.nav()">
      <scroll-view
        :class="ui.navWrapper()"
        :scroll-x="!isVertical"
        :scroll-y="isVertical"
        :scroll-left="scrollLeft"
        :scroll-top="scrollTop"
        :scroll-with-animation="true"
        :show-scrollbar="false"
      >
        <view :class="ui.list()" @mouseleave="handleListLeave">
          <view
            v-for="(pane, index) in panes"
            :key="pane.key"
            class="reborn-tabs__item"
            :class="tabClass(pane, index)"
            @tap="handleTabClick(pane)"
            @mouseenter="handleTabHover(pane, index)"
          >
            <view :class="ui.tabTitle()">{{ pane.title }}</view>
            <view
              v-if="props.editable && pane.closable"
              :class="ui.tabClose()"
              @tap.stop="handleDelete(pane)"
            />
          </view>

          <!-- 指示器跟随选中标题滑动，位置由测量写入行内样式 -->
          <view v-if="showIndicator" :class="ui.indicator()" :style="indicatorStyle" />

          <!--
            选中底板。放在标签之后是为了不让 card 的 [&>*+*]:-ml-px 落到首个标签上，
            层叠顺序与这里的先后无关：底板有 z-index 而标签不定位，底板天然画在所有标签的背景之上，
            标题与关闭图标又提了 z-[1] 压在底板之上，于是底板滑过沿途标签时不会盖住它们的文字
          -->
          <view v-if="showSlider" :class="ui.tabSlider()" :style="sliderStyle" />
        </view>
      </scroll-view>

      <view v-if="showAdd" :class="ui.addButton()" @tap="emit('add')">
        <view class="i-lucide-plus" />
      </view>

      <!-- 额外内容贴在头部末尾，水平方向靠右、垂直方向靠底 -->
      <view v-if="$slots.extra" :class="ui.extra()">
        <slot name="extra" />
      </view>
    </view>

    <view v-show="!props.hideContent" :class="ui.content()">
      <!-- 无内边距的中间层：高度过渡锁在这里，量到的进场面板净高就是要写的高度 -->
      <view :class="ui.stage()" :style="stageStyle">
        <slot />
      </view>
    </view>
  </view>
</template>
