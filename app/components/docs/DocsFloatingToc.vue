<template>
    <div v-if="flatLinks.length" :class="ui.root()" @mouseenter="open = true" @mouseleave="open = false">
        <!-- 常态：锚点刻度条（每个标题一条短横线，active 跟随滚动） -->
        <div v-show="!open" :class="ui.rail()" @click="open = true">
            <span v-for="link in flatLinks" :key="link.id"
                :class="ui.railItem({ active: link.id === activeId, sub: link.depth > 2 })" />
        </div>

        <!-- 展开态：完整目录卡片（含社区链接） -->
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="translate-x-2 opacity-0"
            leave-active-class="transition duration-150 ease-in" leave-to-class="translate-x-2 opacity-0">
            <div v-show="open" :class="ui.panel()">
                <p :class="ui.panelTitle()">{{ title }}</p>
                <nav :class="ui.panelList()">
                    <a v-for="link in flatLinks" :key="link.id" :href="`#${link.id}`"
                        :class="ui.panelLink({ active: link.id === activeId, sub: link.depth > 2 })"
                        @click.prevent="scrollToAnchor(link.id)">
                        {{ link.text }}
                    </a>
                </nav>
                <!-- 社区链接（原右栏底部内容，随目录一起悬浮化） -->
                <DocsAsideRightBottom />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
/**
 * DocsFloatingToc —— 桌面端悬浮目录
 *
 * 文档正文在 lg+ 已占满整行（UPage 不再为 TOC 保留栅格列），
 * 目录改为固定在视口右缘的刻度条，悬停 / 点击展开为完整目录卡片；
 * <lg 视口由 UPage #right 槽的原生 UContentToc 折叠条负责，本组件整体隐藏。
 */
import { tv } from '~/lib/tv'
import theme from './docs-floating-toc.config'

/** 目录链接节点（@nuxt/content 的 page.body.toc.links 结构） */
interface TocLinkItem {
    id: string
    text: string
    depth: number
    children?: TocLinkItem[]
}

interface Props {
    /** 目录链接树（h2 + 嵌套 h3） */
    links: TocLinkItem[]
    /** 卡片标题 */
    title?: string
}

const props = withDefaults(defineProps<Props>(), {
    title: 'On This Page',
})

const b = tv(theme)
const ui = b()

/** 是否展开目录卡片 */
const open = ref(false)

/** 将目录树拍平为一维列表（保留层级信息用于缩进与刻度长度） */
const flatLinks = computed<TocLinkItem[]>(() => {
    const result: TocLinkItem[] = []
    const walk = (items: TocLinkItem[]) => {
        for (const item of items) {
            result.push(item)
            if (item.children?.length) walk(item.children)
        }
    }
    walk(props.links ?? [])
    return result
})

/** 当前滚动位置对应的章节 id */
const activeId = ref('')

/**
 * 点击目录锚点：自行平滑滚动到目标标题。
 * 不走路由 hash 跳转 —— 中文标题 id 经编码后会导致 Nuxt 默认 scrollBehavior
 * 的选择器解析失败（滚动不生效），这里直接定位元素并预留双 sticky 头高度。
 */
function scrollToAnchor(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 144
    // 用即时滚动而非 smooth：smooth 在部分环境（减弱动效 / 自动化内核）会被静默丢弃
    window.scrollTo({ top })
    // 同步地址栏 hash，便于复制分享（replaceState 不触发路由滚动行为）
    history.replaceState(history.state, '', `#${encodeURIComponent(id)}`)
    activeId.value = id
}

/**
 * 滚动跟随：取「视口上缘（含双 sticky 头约 128px + 余量）以上」的最后一个标题作为激活章节。
 * 用 rAF 节流，避免滚动高频触发布局读取。
 */
let ticking = false
function updateActive() {
    ticking = false
    const offset = 160
    let current = ''
    for (const link of flatLinks.value) {
        const el = document.getElementById(link.id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= offset) {
            current = link.id
        } else {
            break
        }
    }
    // 页面顶部尚未滚到首个标题时，默认高亮第一条
    activeId.value = current || flatLinks.value[0]?.id || ''
}

function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(updateActive)
}

onMounted(() => {
    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
})

// 路由 hash 跳转 / 内容变化后重算一次激活态
watch(flatLinks, () => nextTick(updateActive))
</script>
