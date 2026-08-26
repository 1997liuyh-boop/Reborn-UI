<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Playground from '~/components/common/play-ground/Playground.vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'

/** 命令式滚动的可选参数（与组件内部保持一致） */
interface ScrollToOptions {
  animated?: boolean
  duration?: number
}

/** 组件实例的最小结构，用于类型标注模板 ref */
interface ScrollbarExposed {
  update: () => void
  refresh: () => void
  setScrollTop: (value: number, options?: ScrollToOptions) => Promise<void>
  setScrollLeft: (value: number, options?: ScrollToOptions) => Promise<void>
  stopScroll: () => void
  wrapRef: HTMLElement | null
}

/**
 * 滚动容器本身就是被演示的对象，按示例规范它是画布内唯一允许的那层浅填充；
 * 该层内部不得再出现任何填充盒，内容一律靠分隔线与留白区分。
 */
const panelClass = 'bg-elevated rounded-ui-base'

// ============ Playground 配置项 ============

/** 三档预设尺寸 */
const sizeOptions = [
  { label: '4px（极细）', value: '4' },
  { label: '6px（默认）', value: '6' },
  { label: '8px（加粗）', value: '8' },
]

/** 容器圆角档位，用于验证轨道两端的圆角安全内缩 */
const radiusOptions = [
  { label: '直角 rounded-none', value: 'rounded-none' },
  { label: '小圆角 8px', value: 'rounded-ui-sm' },
  { label: '中圆角 16px', value: 'rounded-ui-base' },
  { label: '大圆角 24px', value: 'rounded-ui-lg' },
]

/** 内缩策略：auto 自动推算，其余为固定像素值 */
const insetOptions = [
  { label: 'auto（跟随圆角）', value: 'auto' },
  { label: '0（关闭内缩）', value: '0' },
  { label: '固定 16px', value: '16' },
]

const defaultState = {
  size: '6',
  radius: 'rounded-ui-base',
  insetMode: 'auto',
  track: false,
  thumbColor: '#71717a',
  hoverColor: '#a1a1aa',
  always: true,
  hideDelay: 800,
}

const state = ref({ ...defaultState })

function resetState() {
  state.value = { ...defaultState }
}

/** 选择框返回的是字符串，需要还原成 inset 属性接受的 number | 'auto' */
const insetProp = computed(() => (state.value.insetMode === 'auto' ? 'auto' : Number(state.value.insetMode)))

/** 颜色变量覆盖：外部 :style 的同名变量优先级高于组件内部写入的值 */
const thumbStyle = computed(() => ({
  '--reborn-scrollbar-thumb': state.value.thumbColor,
  '--reborn-scrollbar-thumb-hover': state.value.hoverColor,
}))

const controls = [
  {
    title: '外观配置',
    children: [
      { label: '滚动条尺寸', key: 'size', component: 'select' as const, defaultValue: '6', props: { options: sizeOptions } },
      { label: '容器圆角', key: 'radius', component: 'select' as const, defaultValue: 'rounded-ui-base', props: { options: radiusOptions } },
      { label: '圆角自适应 inset', key: 'insetMode', component: 'select' as const, defaultValue: 'auto', props: { options: insetOptions } },
      { label: '显示轨道 track', key: 'track', component: 'checkbox' as const, defaultValue: false },
    ],
  },
  {
    title: '配色配置',
    children: [
      { label: 'thumb 颜色', key: 'thumbColor', component: 'color-picker' as const, defaultValue: '#71717a' },
      { label: '悬停颜色', key: 'hoverColor', component: 'color-picker' as const, defaultValue: '#a1a1aa' },
    ],
  },
  {
    title: '行为配置',
    children: [
      { label: '常驻显示 always', key: 'always', component: 'checkbox' as const, defaultValue: true },
      { label: '隐藏延迟 hideDelay', key: 'hideDelay', component: 'slider' as const, defaultValue: 800, props: { min: 0, max: 3000, step: 100 } },
    ],
  },
]

/** 示例代码随配置实时变化，便于直接复制 */
const code = computed(() => {
  const s = state.value
  const lines = ['<RebornScrollbar', `  :size="${s.size}"`]
  if (s.always) lines.push('  always')
  else lines.push(`  :hide-delay="${s.hideDelay}"`)
  if (s.insetMode !== 'auto') lines.push(`  :inset="${s.insetMode}"`)
  if (s.track) lines.push('  track')
  lines.push(
    '  :horizontal="false"',
    `  class="h-64 w-72 ${s.radius}"`,
    '  :style="{',
    `    '--reborn-scrollbar-thumb': '${s.thumbColor}',`,
    `    '--reborn-scrollbar-thumb-hover': '${s.hoverColor}',`,
    '  }"',
    '>',
    '  <!-- 滚动内容 -->',
    '</RebornScrollbar>',
  )
  return lines.join('\n')
})

// ============ 演示数据 ============

/** Playground 内容：动态通知流，比纯文本更贴近真实滚动场景 */
const notices = [
  { icon: 'lucide:git-merge', title: '合并请求已通过', desc: 'feat(scrollbar)：圆角容器两端自动内缩', time: '2 分钟前' },
  { icon: 'lucide:bug', title: '缺陷已关闭', desc: 'thumb 滚到末端时被圆角弧线削角', time: '18 分钟前' },
  { icon: 'lucide:rocket', title: '预发布完成', desc: 'v1.8.0-beta.3 已部署至预发环境', time: '1 小时前' },
  { icon: 'lucide:message-square', title: '新的评论', desc: '悬停色建议再提高一档对比度', time: '3 小时前' },
  { icon: 'lucide:package', title: '依赖升级', desc: 'tailwindcss 4.1.11 → 4.1.13', time: '昨天' },
  { icon: 'lucide:shield-check', title: '安全扫描通过', desc: '本次提交未发现新增风险项', time: '昨天' },
  { icon: 'lucide:users', title: '成员变更', desc: 'liuyinghao 加入了设计系统小组', time: '2 天前' },
  { icon: 'lucide:file-text', title: '文档更新', desc: '补充「圆角容器适配」章节', time: '3 天前' },
]

/** 尺寸对比内容：版本时间线 */
const releases = [
  { version: 'v1.9.0', text: 'inset / track 属性化' },
  { version: 'v1.8.2', text: '命令式滚动支持缓动动画' },
  { version: 'v1.8.0', text: '浮层式滚动条正式发布' },
  { version: 'v1.7.4', text: '修复圆角容器端点削角' },
  { version: 'v1.7.0', text: '新增 8px 加粗档位' },
  { version: 'v1.6.2', text: '拖拽行程按轨道长度换算' },
  { version: 'v1.6.0', text: '支持 scroll 事件透出偏移' },
  { version: 'v1.5.1', text: '暗色 thumb 对比度提升' },
  { version: 'v1.5.0', text: '新增 minThumbSize 下限' },
  { version: 'v1.4.0', text: '支持横向滚动条' },
  { version: 'v1.3.2', text: '修复 ResizeObserver 未释放' },
  { version: 'v1.3.0', text: '首个可用版本' },
]

/** 颜色演示内容：设计令牌清单 */
const tokens = [
  '--color-primary-50', '--color-primary-100', '--color-primary-200',
  '--color-primary-300', '--color-primary-400', '--color-primary-500',
  '--color-primary-600', '--color-primary-700', '--color-primary-800',
  '--color-primary-900', '--color-primary-950', '--color-secondary-500',
  '--color-neutral-500', '--color-success-500', '--color-warning-500',
]

/** 双向滚动演示：列数足够多的宽表格，确保横向必定溢出 */
const orderColumns = ['订单号', '客户', '金额', '状态', '负责人', '支付方式', '发货仓', '更新时间', '备注']
const orderRows = [
  ['RB-20250801', '深蓝科技', '¥12,800.00', '已完成', '张伟', '对公转账', '华东一仓', '08-01 09:12', '客户要求加急发货'],
  ['RB-20250802', '云栖数据', '¥3,260.00', '待付款', '李娜', '在线支付', '华北二仓', '08-01 11:45', '等待财务确认回款'],
  ['RB-20250803', '星河设计', '¥48,500.00', '已完成', '王强', '对公转账', '华东一仓', '08-02 14:03', '年度框架协议内订单'],
  ['RB-20250804', '南山智造', '¥960.00', '已退款', '赵敏', '在线支付', '华南三仓', '08-02 16:27', '客户下单后取消'],
  ['RB-20250805', '海创医疗', '¥21,340.00', '进行中', '陈杰', '承兑汇票', '华东一仓', '08-03 08:51', '需随货提供质检报告'],
  ['RB-20250806', '锦程物流', '¥7,180.00', '已完成', '刘洋', '在线支付', '西南四仓', '08-03 13:09', '已签收无异常'],
  ['RB-20250807', '禾光传媒', '¥15,600.00', '待审核', '孙悦', '对公转账', '华北二仓', '08-04 10:22', '折扣超权限待审批'],
  ['RB-20250808', '华映电子', '¥2,450.00', '已完成', '周涛', '在线支付', '华南三仓', '08-04 17:40', '首单客户，已回访'],
]

/** 状态色映射：统一走语义色板，不引入色板外的原始色 */
const statusTone: Record<string, string> = {
  已完成: 'bg-success/10 text-success',
  待付款: 'bg-warning/10 text-warning',
  已退款: 'bg-error/10 text-error',
  进行中: 'bg-info/10 text-info',
  待审核: 'bg-secondary/10 text-secondary',
}

/** 命令式滚动演示：长文目录 */
const chapterNames = ['组件总览', '安装与引入', '基础用法', '尺寸档位', '颜色定制', '暗色适配', '圆角容器', '双向滚动', '命令式 API', '常见问题']
const chapters = Array.from({ length: 20 }, (_, i) => ({
  index: i + 1,
  title: `第 ${i + 1} 章 · ${chapterNames[i % 10]}`,
}))

/** 横向动画演示：卡片轨道 */
const rails = Array.from({ length: 12 }, (_, i) => ({
  index: i + 1,
  title: `Frame ${String(i + 1).padStart(2, '0')}`,
  desc: chapterNames[i % 10],
}))

// ============ 圆角自适应：读取组件实际写入的内缩值 ============

const insetAutoRef = ref<ScrollbarExposed | null>(null)
const insetOffRef = ref<ScrollbarExposed | null>(null)
const insetFixedRef = ref<ScrollbarExposed | null>(null)
const playgroundRef = ref<ScrollbarExposed | null>(null)

const insetValues = ref({ auto: '—', off: '—', fixed: '—', playground: '—' })

/** 组件把内缩量写在根元素的 --reborn-scrollbar-inset 上，从计算样式读回即可 */
function readInset(instance: ScrollbarExposed | null) {
  const root = instance?.wrapRef?.parentElement
  if (!root) return '—'
  return getComputedStyle(root).getPropertyValue('--reborn-scrollbar-inset').trim() || '0px'
}

function measureInsets() {
  insetValues.value = {
    auto: readInset(insetAutoRef.value),
    off: readInset(insetOffRef.value),
    fixed: readInset(insetFixedRef.value),
    playground: readInset(playgroundRef.value),
  }
}

/**
 * 圆角是「只改样式不改尺寸」的变化，ResizeObserver 不会触发，
 * 因此切换圆角档位后需手动调用实例的 refresh() 重算内缩；
 * inset 属性变化由组件内部 watch 处理，这里只需在下一帧读回展示值。
 */
watch(() => [state.value.radius, state.value.insetMode], async () => {
  await nextTick()
  playgroundRef.value?.refresh()
  measureInsets()
})

// ============ 命令式滚动动画 ============

const jumpRef = ref<ScrollbarExposed | null>(null)
const railRef = ref<ScrollbarExposed | null>(null)

/** 动画时长档位，0 表示立即落位 */
const durationOptions = [
  { label: '立即', value: 0 },
  { label: '300ms', value: 300 },
  { label: '600ms', value: 600 },
  { label: '1200ms', value: 1200 },
]
const duration = ref(600)

const jumpScrollTop = ref(0)
const jumpProgress = ref(0)
/** 动画进行中标记，用于按钮禁用与状态提示 */
const scrollBusy = ref(false)

function onJumpScroll(payload: { scrollTop: number; scrollLeft: number }) {
  jumpScrollTop.value = Math.round(payload.scrollTop)
  const wrap = jumpRef.value?.wrapRef
  const max = wrap ? wrap.scrollHeight - wrap.clientHeight : 0
  jumpProgress.value = max > 0 ? Math.min(Math.round((payload.scrollTop / max) * 100), 100) : 0
}

/** 统一包装：等待动画结束后再解除忙碌态，便于观察 Promise 语义 */
async function runScroll(task: Promise<void> | undefined) {
  if (!task) return
  scrollBusy.value = true
  await task
  scrollBusy.value = false
}

function scrollToTop() {
  runScroll(jumpRef.value?.setScrollTop(0, { duration: duration.value }))
}

function scrollToBottom() {
  const wrap = jumpRef.value?.wrapRef
  if (wrap) runScroll(jumpRef.value?.setScrollTop(wrap.scrollHeight, { duration: duration.value }))
}

/** 定位到第 n 章：按条目实际 offsetTop 换算偏移 */
function scrollToChapter(index: number) {
  const wrap = jumpRef.value?.wrapRef
  if (!wrap) return
  const item = wrap.querySelector<HTMLElement>(`[data-chapter="${index}"]`)
  if (item) runScroll(jumpRef.value?.setScrollTop(item.offsetTop, { duration: duration.value }))
}

/** 纵向定位按钮组，抽成数据避免模板里内联对象数组 */
const jumpActions = [
  { label: '顶部', icon: 'lucide:arrow-up-to-line', handler: scrollToTop },
  { label: '第 8 章', icon: 'lucide:crosshair', handler: () => scrollToChapter(8) },
  { label: '第 16 章', icon: 'lucide:crosshair', handler: () => scrollToChapter(16) },
  { label: '底部', icon: 'lucide:arrow-down-to-line', handler: scrollToBottom },
]

/** 横向翻屏：每次滚动 80% 可视宽度 */
function railStep(direction: 1 | -1) {
  const wrap = railRef.value?.wrapRef
  if (!wrap) return
  railRef.value?.setScrollLeft(wrap.scrollLeft + direction * wrap.clientWidth * 0.8, { duration: duration.value })
}

// ============ 不占宽度对比：浮层式 vs 原生滚动条 ============

const overlayRef = ref<ScrollbarExposed | null>(null)
const nativeRef = ref<HTMLElement | null>(null)
const widthResult = ref({ overlayOuter: 0, overlayInner: 0, nativeOuter: 0, nativeInner: 0 })

function measureWidths() {
  const wrap = overlayRef.value?.wrapRef
  const root = wrap?.parentElement
  const native = nativeRef.value
  if (!wrap || !root || !native) return
  widthResult.value = {
    overlayOuter: root.clientWidth,
    overlayInner: wrap.clientWidth,
    nativeOuter: native.offsetWidth,
    nativeInner: native.clientWidth,
  }
}

/** 原生滚动条实际吃掉的宽度；macOS 覆盖式滚动条下为 0 */
const nativeCost = computed(() => widthResult.value.nativeOuter - widthResult.value.nativeInner)

function measureAll() {
  measureWidths()
  measureInsets()
}

onMounted(async () => {
  await nextTick()
  measureAll()
  window.addEventListener('resize', measureAll)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureAll)
})
</script>

<template>
  <!-- min-w-0：作为网格项时其自动最小宽度会被内部宽表格撑开，导致整页横向溢出 -->
  <div class="flex w-full min-w-0 flex-col">

    <!-- 交互演练场：Playground 自带标题栏，不再外套 DemoSection -->
    <Playground v-model="state" :controls="controls" component-name="RebornScrollbar" :code="code" title="交互演练场"
      description="尺寸、轨道、圆角内缩、常驻与隐藏延迟均可现场切换；把鼠标移到滚动条上查看悬停色，按住可拖拽，点击轨道空白处可跳转。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <DemoBlock layout="stack" align="center" class="gap-4">
        <RebornScrollbar ref="playgroundRef" :size="state.size" :always="state.always" :hide-delay="state.hideDelay"
          :inset="insetProp" :track="state.track" :horizontal="false" :style="thumbStyle" class="bg-elevated h-64 w-72"
          :class="state.radius">
          <ul class="divide-default divide-y">
            <li v-for="item in notices" :key="item.title" class="flex gap-3 px-4 py-3">
              <Icon :name="item.icon" class="text-primary mt-0.5 size-4 shrink-0" />
              <div class="min-w-0 flex-1">
                <p class="text-default truncate text-sm font-medium">{{ item.title }}</p>
                <p class="text-muted mt-0.5 text-xs leading-relaxed">{{ item.desc }}</p>
                <p class="text-dimmed mt-1 text-[11px]">{{ item.time }}</p>
              </div>
            </li>
          </ul>
        </RebornScrollbar>

        <DemoNote tone="dimmed" class="text-center font-mono text-[11px]">
          --reborn-scrollbar-inset: {{ insetValues.playground }}
          ·
          {{ state.always ? 'always（常驻）' : `hideDelay: ${state.hideDelay}ms` }}
        </DemoNote>
      </DemoBlock>
    </Playground>

    <DemoSection title="显隐时机"
      description="默认仅在悬停、滚动或拖拽时淡入，停止滚动 hideDelay 毫秒后淡出；always 为 true 则常驻显示。把鼠标移入 / 移出三个容器即可对比。">
      <DemoBlock layout="grid" align="start" class="sm:grid-cols-3 lg:grid-cols-3">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">自动隐藏（默认） · <code class="text-dimmed font-mono">默认</code></span>
          <RebornScrollbar :horizontal="false" :class="panelClass" class="h-48">
            <ol class="px-4 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">延迟 2 秒隐藏 · <code class="text-primary font-mono">:hide-delay="2000"</code></span>
          <RebornScrollbar :hide-delay="2000" :horizontal="false" :class="panelClass" class="h-48">
            <ol class="px-4 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">常驻显示 · <code class="text-primary font-mono">always</code></span>
          <RebornScrollbar always :horizontal="false" :class="panelClass" class="h-48">
            <ol class="px-4 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="圆角自适应">
      <template #description>
        容器带圆角时 <code>overflow: hidden</code> 会用弧线裁剪贴边的轨道两端，thumb 滚到端点会被削角。
        <code>inset</code> 默认 <code>"auto"</code>，按容器实际 <code>border-radius</code> 自动推算内缩；
        也可传固定像素值，或传 <code>0</code> 完全关闭。公式为
        <code>inset = ceil(R − √(R² − (R − gap)²))</code>，把滚动条拖到两端即可验证。
      </template>
      <DemoBlock layout="grid" align="start" class="sm:grid-cols-3 lg:grid-cols-3">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">auto · 24px 圆角 · <code class="text-primary font-mono">{{ insetValues.auto }}</code></span>
          <RebornScrollbar ref="insetAutoRef" always :horizontal="false" class="bg-elevated rounded-ui-lg h-48">
            <ol class="px-5 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">关闭内缩 · 会被削角 · <code class="text-primary font-mono">:inset="0"</code></span>
          <RebornScrollbar ref="insetOffRef" :inset="0" always :horizontal="false"
            class="bg-elevated rounded-ui-lg h-48">
            <ol class="px-5 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">固定内缩 · 直角容器 · <code class="text-primary font-mono">:inset="16"</code></span>
          <RebornScrollbar ref="insetFixedRef" :inset="16" always :horizontal="false"
            class="bg-elevated h-48 rounded-none">
            <ol class="px-5 py-3">
              <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                {{ item.version }} · {{ item.text }}
              </li>
            </ol>
          </RebornScrollbar>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="轨道与配色"
      description="track 默认关闭（轨道全透明，纯悬浮感）；传 true 使用内置浅灰凹槽并自动适配暗色；传颜色字符串则按该色显形。thumb 颜色与圆角继续由 --reborn-scrollbar-* 变量定制。">
      <DemoBlock layout="grid" align="start" class="sm:grid-cols-2 lg:grid-cols-4">
        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">无轨道 · <code class="text-dimmed font-mono">默认</code></span>
          <RebornScrollbar always :horizontal="false" :class="panelClass" class="h-44">
            <ul class="px-4 py-3">
              <li v-for="token in tokens" :key="token" class="text-muted py-1 font-mono text-xs">
                {{ token }}
              </li>
            </ul>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">内置轨道 · <code class="text-primary font-mono">track</code></span>
          <RebornScrollbar track always :horizontal="false" :class="panelClass" class="h-44">
            <ul class="px-4 py-3">
              <li v-for="token in tokens" :key="token" class="text-muted py-1 font-mono text-xs">
                {{ token }}
              </li>
            </ul>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">翠绿凹槽 · <code class="text-primary font-mono">:track="色值"</code></span>
          <RebornScrollbar always :horizontal="false" :size="8" track="rgb(16 185 129 / 0.14)"
            :style="{ '--reborn-scrollbar-thumb': '#10b981', '--reborn-scrollbar-thumb-hover': '#34d399' }"
            :class="panelClass" class="h-44">
            <ul class="px-4 py-3">
              <li v-for="token in tokens" :key="token" class="text-muted py-1 font-mono text-xs">
                {{ token }}
              </li>
            </ul>
          </RebornScrollbar>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">靛蓝直角 · <code class="text-primary font-mono">CSS 变量</code></span>
          <RebornScrollbar always :horizontal="false" :size="8" :style="{
            '--reborn-scrollbar-thumb': '#6366f1',
            '--reborn-scrollbar-thumb-hover': '#818cf8',
            '--reborn-scrollbar-radius': '2px',
          }" :class="panelClass" class="h-44">
            <ul class="px-4 py-3">
              <li v-for="token in tokens" :key="token" class="text-muted py-1 font-mono text-xs">
                {{ token }}
              </li>
            </ul>
          </RebornScrollbar>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸档位"
      description="4 / 6 / 8 三档由 --reborn-scrollbar-size 变量驱动，也可直接传任意像素值或带单位的值（如 &quot;0.5rem&quot;）。">
      <DemoBlock layout="grid" align="start" class="sm:grid-cols-3 lg:grid-cols-3">
        <div v-for="size in ['4', '6', '8']" :key="size" class="flex flex-col gap-2">
          <span class="text-dimmed text-xs font-medium">{{ size }}px · <code class="text-primary font-mono">:size="{{ size }}"</code></span>
          <RebornScrollbar :size="size" always :horizontal="false" :class="panelClass" class="h-44">
            <ol class="px-4 py-3">
              <li v-for="item in releases" :key="item.version" class="flex gap-3 py-1.5">
                <span class="text-primary font-mono text-xs">{{ item.version }}</span>
                <span class="text-muted text-xs">{{ item.text }}</span>
              </li>
            </ol>
          </RebornScrollbar>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="命令式滚动动画">
      <template #description>
        通过模板 ref 拿到实例后调用 <code>setScrollTop</code> / <code>setScrollLeft</code> 主动滚动，默认带
        <code>easeInOutCubic</code> 缓动。时长取 <code>scrollDuration</code>（默认 400ms），也可按次传
        <code>{ duration }</code>；传 <code>{ animated: false }</code> 立即落位。方法返回 Promise，动画结束或被用户滚轮 / 拖拽打断时 resolve。
      </template>

      <DemoBlock layout="stack" class="gap-6">
        <!-- 时长档位 -->
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-muted text-xs font-medium">动画时长</span>
          <RebornButton v-for="option in durationOptions" :key="option.value" size="sm" color="primary"
            :variant="duration === option.value ? 'solid' : 'outline'" @click="duration = option.value">
            {{ option.label }}
          </RebornButton>
          <span class="text-primary ml-auto flex items-center gap-1.5 font-mono text-xs font-medium">
            <Icon :name="scrollBusy ? 'lucide:loader-circle' : 'lucide:check'" class="size-3.5"
              :class="{ 'animate-spin': scrollBusy }" />
            scrollTop {{ jumpScrollTop }}px · {{ jumpProgress }}%
          </span>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 纵向定位 -->
          <div class="flex flex-col gap-3">
            <span class="text-dimmed text-xs font-medium">纵向定位 setScrollTop · <code class="text-primary font-mono">{{ duration }}ms</code></span>
            <div class="flex flex-wrap gap-2">
              <RebornButton v-for="action in jumpActions" :key="action.label" size="sm" variant="outline"
                color="neutral" @click="action.handler()">
                <template #leading>
                  <Icon :name="action.icon" class="size-3.5" />
                </template>
                {{ action.label }}
              </RebornButton>
            </div>
            <!-- 进度条：动画过程中平滑推进，直观证明缓动生效 -->
            <div class="bg-accented h-1 overflow-hidden rounded-full">
              <div class="bg-primary h-full rounded-full" :style="{ width: `${jumpProgress}%` }" />
            </div>
            <RebornScrollbar ref="jumpRef" always :horizontal="false" :class="panelClass" class="h-56"
              @scroll="onJumpScroll">
              <ul class="divide-default divide-y">
                <li v-for="chapter in chapters" :key="chapter.index" :data-chapter="chapter.index"
                  class="text-default px-5 py-3 text-sm">
                  {{ chapter.title }}
                </li>
              </ul>
            </RebornScrollbar>
          </div>

          <!-- 横向翻屏 -->
          <div class="flex flex-col gap-3">
            <span class="text-dimmed text-xs font-medium">横向翻屏 setScrollLeft · <code class="text-primary font-mono">{{ duration }}ms</code></span>
            <div class="flex flex-wrap gap-2">
              <RebornButton size="sm" variant="outline" color="neutral" @click="railStep(-1)">
                <template #leading>
                  <Icon name="lucide:chevron-left" class="size-3.5" />
                </template>
                上一屏
              </RebornButton>
              <RebornButton size="sm" variant="outline" color="neutral" @click="railStep(1)">
                下一屏
                <template #trailing>
                  <Icon name="lucide:chevron-right" class="size-3.5" />
                </template>
              </RebornButton>
            </div>
            <!-- 占位：与左栏进度条等高，保证两侧滚动容器顶边对齐 -->
            <div class="h-1" />
            <RebornScrollbar ref="railRef" always :class="panelClass" class="h-56">
              <div class="flex h-full items-center gap-3 p-4">
                <!-- 轨道卡片只描边不填充，避免在演示容器内再叠一层表面 -->
                <div v-for="rail in rails" :key="rail.index"
                  class="border-default rounded-ui-sm flex h-full w-52 shrink-0 flex-col justify-between border p-4">
                  <span class="text-dimmed font-mono text-xs">{{ rail.title }}</span>
                  <div class="flex flex-col gap-1">
                    <span class="text-default text-sm font-medium">{{ rail.desc }}</span>
                    <span class="text-dimmed text-[11px]">横向内容溢出触发底部滚动条</span>
                  </div>
                </div>
              </div>
            </RebornScrollbar>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="双向滚动"
      description="horizontal 默认开启，内容横向溢出时底部会出现横向滚动条；两条滚动条都支持拖拽与点击轨道跳转。设为 false 则横向内容被裁剪。">
      <DemoBlock layout="stack">
        <RebornScrollbar always :class="panelClass" class="h-64">
          <!-- 显式最小宽度，保证任何视口下都有横向溢出，横向滚动条必定出现 -->
          <table class="w-max min-w-[1400px] text-left text-xs">
            <!-- 表头需遮挡下方滚过的行，沿用与容器同色的底，视觉上仍是同一层表面 -->
            <thead class="bg-elevated sticky top-0">
              <tr>
                <th v-for="col in orderColumns" :key="col" class="text-default px-5 py-3 font-semibold whitespace-nowrap">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-default divide-y">
              <tr v-for="row in orderRows" :key="row[0]">
                <td v-for="(cell, ci) in row" :key="ci" class="text-muted px-5 py-3 whitespace-nowrap">
                  <span v-if="ci === 3" class="rounded-md px-2 py-0.5 text-[11px] font-medium"
                    :class="statusTone[cell] ?? 'bg-neutral/10 text-muted'">
                    {{ cell }}
                  </span>
                  <span v-else :class="ci === 0 ? 'text-default font-mono' : ''">{{ cell }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </RebornScrollbar>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="不占布局宽度"
      description="滚动条浮层绝对定位、不参与文档流，内容可视宽度恒等于容器宽度；右侧是同样内容的原生 overflow-auto 容器，滚动条会实打实吃掉一段宽度并挤压内容。">
      <DemoBlock layout="stack" class="gap-5">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <span class="text-dimmed text-xs font-medium">浮层式 RebornScrollbar · <code class="text-primary font-mono">{{ widthResult.overlayOuter }} → {{ widthResult.overlayInner }}</code></span>
            <RebornScrollbar ref="overlayRef" always :horizontal="false" :class="panelClass" class="h-44">
              <ol class="px-4 py-3">
                <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                  {{ item.version }} · {{ item.text }}
                </li>
              </ol>
            </RebornScrollbar>
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-dimmed text-xs font-medium">原生滚动条（对照） · <code class="text-dimmed font-mono">{{ widthResult.nativeOuter }} → {{ widthResult.nativeInner }}</code></span>
            <div ref="nativeRef" :class="panelClass" class="h-44 overflow-y-auto">
              <ol class="px-4 py-3">
                <li v-for="item in releases" :key="item.version" class="text-muted py-1.5 text-xs">
                  {{ item.version }} · {{ item.text }}
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div class="flex items-start gap-2.5">
          <Icon :name="nativeCost > 0 ? 'lucide:circle-check' : 'lucide:info'"
            class="mt-0.5 size-4 shrink-0" :class="nativeCost > 0 ? 'text-success' : 'text-dimmed'" />
          <DemoNote>
            {{ nativeCost > 0
              ? `浮层式内容可视宽度与容器完全一致；原生滚动条额外占用了 ${nativeCost}px，切换有 / 无滚动条时会引起布局抖动。`
              : '当前系统使用覆盖式原生滚动条（如 macOS），两侧宽度一致；在 Windows 等经典滚动条系统上原生方案会额外占用约 15px。' }}
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

  </div>
</template>
