<script setup lang="ts">
/**
 * ThemeSlotsPanel —— 示例卡片内的「Theme slots」面板
 *
 * 列出当前组件主题里声明的全部 slot（也就是 `ui` 属性可覆盖的键），
 * 悬停某一行时把对应的真实节点描边高亮，点击则滚动定位。
 *
 * slot 与 DOM 的对应关系不靠手工维护：`~/lib/tv` 在生成类名时给每个 slot
 * 追加了 `<组件名称>-<slot 名>-<主题指纹>` 标记类，这里按键与指纹匹配即可命中
 * （见 utils/getComponentTheme）。所以面板内容永远和组件代码同步。
 *
 * 面板跟着示例走：由 DemoSection 逐张卡片渲染并持有开关，
 * 作用域就是那张卡片的示例本体，同页其它示例不会互相干扰。
 *
 * 【为什么还要查作用域之外】
 * 有一批组件（Popup / Dialog / Tooltip / Popover / ContextMenu / SubMenu /
 * SelectTrigger / Guide / Image / Fireworks / AppleCard 等）把内容 Teleport 到 body，
 * 这些节点在 DOM 上已经不在示例卡片里了，只按卡片作用域查会全部漏掉。
 * 所以这里做两层统计：卡片内命中 + Teleport 出去的弹层节点。
 *
 * 判定弹层的依据是「跑到了应用根节点 #__nuxt 之外」——Teleport to="body" 会把节点
 * 挂成 #__nuxt 的兄弟。不能只用「不在任何示例卡片里」来判定：文档页的 API 演练台
 * 同样会渲染一份当前组件的实例，它在 #__nuxt 之内、却不属于任何示例卡片，
 * 按那种判定会被误算成弹层，让每张卡片都凭空多出几个命中。
 */
import type { ComponentThemeGroup } from '~/utils/getComponentTheme'
import { DEMO_SCOPE_ATTR } from './types'

interface Props {
    /** 该组件主题的全部 slot 分组（由 ComponentTabs 一次性加载后经 demo 上下文下发） */
    groups: ComponentThemeGroup[]
    /** 本示例的容器节点：卡片内命中以它为作用域 */
    scope?: HTMLElement | null
}

const props = withDefaults(defineProps<Props>(), {
    scope: null,
})

/** 面板是否展开（开关由 DemoSection 的动作组持有，这里只提供收起入口） */
const open = defineModel<boolean>('open', { default: false })

/** 高亮时挂到目标节点上的类名（样式见文件底部的非 scoped 样式块） */
const HIGHLIGHT_CLASS = 'reborn-theme-slot-highlight'

/** 任意示例卡片的作用域标记，用于把「弹层」和「别的卡片」区分开 */
const SCOPE_SELECTOR = `[${DEMO_SCOPE_ATTR}]`

/**
 * 应用根节点。页面自身的内容（含 API 演练台里的组件实例）都在它之内，
 * Teleport to="body" 的弹层会挂到它外面，据此区分两者。
 */
function appRoot(): HTMLElement | null {
    return document.getElementById('__nuxt')
}

/** 单个 slot 的命中情况：卡片内 / Teleport 出去的弹层 */
interface SlotHit {
    scoped: number
    floating: number
}

/** 选择器 -> 命中情况，用来把当前示例中不存在的 slot 置灰、并标出弹层节点 */
const hits = ref<Record<string, SlotHit>>({})
/** 当前高亮的选择器，用于给面板行加选中态 */
const activeSelector = ref('')

/** 已加上高亮类的节点，离开时逐个还原（不依赖再次查询，避免 DOM 变动后漏摘） */
let highlighted: Element[] = []

const { copy } = useClipboard({ copiedDuring: 2000 })
const toast = useToast()

/** slot 总数，展示在标题右侧 */
const total = computed(() => props.groups.reduce((sum, group) => sum + group.slots.length, 0))

/** 本次统计里有多少 slot 是在弹层里找到的，有的话在头部提示一句 */
const floatingTotal = computed(() =>
    Object.values(hits.value).filter(hit => hit.floating > 0).length,
)

/** 卡片内命中的节点 */
function queryScoped(selector: string): HTMLElement[] {
    const scope = props.scope
    return scope ? [...scope.querySelectorAll<HTMLElement>(selector)] : []
}

/**
 * Teleport 到 body 的弹层节点。
 * 两个条件都要满足：不在任何示例卡片里，且已经跑到应用根节点之外。
 * 定位不到应用根节点时宁可一个都不算，避免把页面里别处的实例误报成本示例的。
 */
function queryFloating(selector: string): HTMLElement[] {
    const root = appRoot()
    if (!root) return []
    return [...document.querySelectorAll<HTMLElement>(selector)]
        .filter(el => !el.closest(SCOPE_SELECTOR) && !root.contains(el))
}

/** 一行要操作的全部节点：卡片内 + 弹层 */
function queryAll(selector: string): HTMLElement[] {
    return [...queryScoped(selector), ...queryFloating(selector)]
}

/** 统计每个 slot 当前出现了多少次 */
function refreshHits() {
    if (!import.meta.client) return
    const next: Record<string, SlotHit> = {}
    for (const group of props.groups) {
        for (const slot of group.slots) {
            next[slot.selector] = {
                scoped: queryScoped(slot.selector).length,
                floating: queryFloating(slot.selector).length,
            }
        }
    }
    hits.value = next
}

/**
 * 展开时、以及每次指针进入面板时都重算一遍。
 * 示例里的节点可能是懒渲染的，弹层更是要等用户点开才存在，
 * 所以不能只在挂载时统计一次。
 */
watch([open, () => props.scope, () => props.groups], async ([isOpen]) => {
    if (!isOpen) return
    await nextTick()
    refreshHits()
}, { immediate: true })

function clearHighlight() {
    for (const el of highlighted) el.classList.remove(HIGHLIGHT_CLASS)
    highlighted = []
    activeSelector.value = ''
}

function highlight(selector: string) {
    clearHighlight()
    activeSelector.value = selector
    highlighted = queryAll(selector)
    for (const el of highlighted) el.classList.add(HIGHLIGHT_CLASS)
}

/** 点击行：把第一个命中节点滚到视口中间（本环境 smooth 行为不生效，用默认瞬时滚动） */
function locate(selector: string) {
    queryAll(selector)[0]?.scrollIntoView({ block: 'center' })
}

/** 复制该 slot 的 ui 覆盖片段，方便直接粘到组件上改 */
async function copySlot(key: string, classes: string) {
    await copy(`${key}: '${classes}'`)
    toast.add({
        title: '已复制',
        description: `slot「${key}」的类名已复制到剪贴板。`,
        color: 'success',
        icon: 'tabler:copy-check',
    })
}

onBeforeUnmount(clearHighlight)
</script>

<template>
  <aside
    class="flex h-full max-h-[70vh] flex-col overflow-hidden lg:max-h-[calc(100vh-12rem)]"
    @pointerenter="refreshHits"
    @pointerleave="clearHighlight"
  >
    <header class="border-default flex items-center gap-2 border-b px-3 py-2">
      <div class="min-w-0 flex-1">
        <p class="text-highlighted truncate text-sm font-medium">
          Theme slots
        </p>
        <p class="text-dimmed truncate text-xs">
          {{ total }} 个可覆盖节点 · 悬停高亮<span v-if="floatingTotal"> · {{ floatingTotal }} 个在弹层</span>
        </p>
      </div>
      <UButton
        icon="tabler:x" color="neutral" variant="ghost" size="xs"
        title="收起" aria-label="收起 Theme slots" @click="open = false"
      />
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto p-1.5">
      <div v-for="group in groups" :key="group.exportName" class="mb-1 last:mb-0">
        <!-- 一个配置文件里可能有多份主题（主体 + 子项），只有多份时才需要标出归属 -->
        <p v-if="groups.length > 1" class="text-dimmed px-1.5 py-1 font-mono text-[11px]">
          {{ group.exportName }}
        </p>

        <div
          v-for="slot in group.slots" :key="slot.key"
          class="hover:bg-elevated/60 group cursor-pointer rounded-lg px-1.5 py-1 transition-colors"
          :class="[
            activeSelector === slot.selector && 'bg-elevated',
            !hits[slot.selector]?.scoped && !hits[slot.selector]?.floating && 'opacity-45',
          ]"
          @pointerenter="highlight(slot.selector)"
          @click="locate(slot.selector)"
        >
          <div class="flex items-center gap-1.5">
            <span class="text-highlighted truncate font-mono text-xs">{{ slot.key }}</span>
            <span class="text-dimmed shrink-0 text-[10px] tabular-nums">
              ×{{ (hits[slot.selector]?.scoped ?? 0) + (hits[slot.selector]?.floating ?? 0) }}
            </span>
            <!-- 只在弹层里找到的节点标一下来源，避免让人以为面板串到了别的示例 -->
            <UBadge
              v-if="hits[slot.selector]?.floating" color="neutral" variant="subtle" size="sm"
              class="shrink-0 px-1 py-0 text-[9px] leading-tight"
              title="该节点被 Teleport 到了 body（弹层）"
            >
              弹层
            </UBadge>
            <span class="flex-1" />
            <UButton
              icon="tabler:copy" color="neutral" variant="ghost" size="xs"
              class="opacity-0 transition-opacity group-hover:opacity-100"
              :title="`复制 ${slot.key} 的类名`" :aria-label="`复制 ${slot.key} 的类名`"
              @click.stop="copySlot(slot.key, slot.classes)"
            />
          </div>
          <p class="text-muted line-clamp-2 font-mono text-[10px] leading-relaxed break-all">
            {{ slot.classes || '—' }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>

<style>
/* 高亮描边挂在示例里的真实节点上，必须是全局样式；用 outline 避免撑开布局 */
.reborn-theme-slot-highlight {
    outline: 2px solid var(--color-primary, #3b82f6) !important;
    outline-offset: 1px;
    border-radius: inherit;
    position: relative;
    z-index: 1;
}
</style>
