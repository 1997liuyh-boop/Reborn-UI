<script setup lang="ts">
/**
 * DemoBlock —— 承载示例本体的排版容器
 *
 * 只负责「怎么排」（行内并排 / 网格 / 纵向堆叠 + 对齐），默认**不带任何背景**。
 * `tone="inset"` 是规范里唯一允许的那层浅填充，仅当被演示的对象本身需要一个容器
 * 才说得清时使用（滚动容器、拖拽区、水印底、弹层落点、骨架屏占位），
 * 且该层内部不得再出现任何填充盒。
 *
 * 完整规范见 ./demo.config.ts 顶部注释与文档页 /getting-started/demo-guidelines。
 */
import { tv } from '~/lib/tv'
import { blockConfig } from './demo.config'

interface Props {
    /** 排列方式：row 行内并排（默认）/ grid 网格 / stack 纵向堆叠 */
    layout?: 'row' | 'grid' | 'stack'
    /**
     * 网格列数，仅 layout="grid" 有意义。
     * auto（默认）沿用「窄屏 1 / sm 2 / lg 3」的响应式档位；
     * 条目数量固定时显式指定，避免 4 项排进 3 列断成 3+1 的孤行。
     */
    columns?: 'auto' | 1 | 2 | 3 | 4
    /** 交叉轴对齐；auto 表示按 layout 取最自然的默认值（row 居中 / grid 等高 / stack 靠左） */
    align?: 'auto' | 'start' | 'center' | 'end'
    /** 填充档位：plain 无背景（默认）/ inset 唯一允许的浅填充层 */
    tone?: 'plain' | 'inset'
}

const props = withDefaults(defineProps<Props>(), {
    layout: 'row',
    columns: 'auto',
    align: 'auto',
    tone: 'plain',
})

const b = tv(blockConfig)
const ui = computed(() =>
    b({ layout: props.layout, columns: props.columns, align: props.align, tone: props.tone }),
)
</script>

<template>
  <div :class="ui.root()">
    <slot />
  </div>
</template>
