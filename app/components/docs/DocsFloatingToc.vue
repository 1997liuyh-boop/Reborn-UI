<script setup lang="ts">
/**
 * DocsFloatingToc —— 桌面端悬浮目录
 *
 * 文档正文在 lg+ 已占满整行（UPage 不再为 TOC 保留栅格列），
 * 目录改为固定在视口右缘的刻度条，悬停 / 点击展开为完整目录卡片；
 * <lg 视口由 UPage #right 槽的原生 UContentToc 折叠条负责，本组件整体隐藏。
 *
 * 锚点滚动：本组件只输出普通 `<a href="#id">`，点击行为由全局
 * plugins/anchor-scroll.client.ts 在捕获阶段统一接管（顶栏偏移、hash 入栈、
 * 减弱动效适配）——不要在组件内再写滚动逻辑，捕获阶段的 stopPropagation
 * 会让组件级 click 处理器永远不执行。
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
    /** 右栏避让：页面存在移动端 demo 面板时刻度条左移（2xl+ 生效） */
    inset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    title: '本页目录',
    inset: false,
})

const b = tv(theme)
const ui = computed(() => b({ inset: props.inset }))

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
 * 滚动跟随：取「视口上缘（单层顶栏 64px + 余量）以上」的最后一个标题作为激活章节。
 * 用 rAF 节流，避免滚动高频触发布局读取。
 */
let ticking = false
function updateActive() {
    ticking = false
    const offset = 96
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

<template>
  <div v-if="flatLinks.length" :class="ui.root()" @mouseenter="open = true" @mouseleave="open = false">
    <!-- 常态：锚点刻度条（每个标题一条短横线，active 跟随滚动） -->
    <div v-show="!open" :class="ui.rail()" @click="open = true">
      <span
        v-for="link in flatLinks" :key="link.id"
        :class="ui.railItem({ active: link.id === activeId, sub: link.depth > 2 })"
      />
    </div>

    <!-- 展开态：完整目录卡片（含社区链接） -->
    <Transition
      enter-active-class="transition duration-200 ease-out" enter-from-class="translate-x-2 opacity-0"
      leave-active-class="transition duration-150 ease-in" leave-to-class="translate-x-2 opacity-0"
    >
      <div v-show="open" :class="ui.panel()">
        <p :class="ui.panelTitle()">{{ title }}</p>
        <nav :class="ui.panelList()">
          <!-- 锚点点击由全局 anchor-scroll 插件统一接管（捕获阶段拦截，含顶栏偏移与减弱动效适配） -->
          <a
            v-for="link in flatLinks" :key="link.id" :href="`#${link.id}`"
            :class="ui.panelLink({ active: link.id === activeId, sub: link.depth > 2 })"
          >
            {{ link.text }}
          </a>
        </nav>
        <!-- 社区链接（原右栏底部内容，随目录一起悬浮化） -->
        <DocsAsideRightBottom />
      </div>
    </Transition>
  </div>
</template>
