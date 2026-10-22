<script setup lang="ts">
/**
 * 总览卡片缩略：鼠标右键处展开的菜单面板，含图标、快捷键、子菜单箭头、分隔线与危险操作
 *
 * 真实菜单右键后传送到 body 并 fixed 定位，缩略图用主题样式静态渲染面板；
 * 取 sm 尺寸并把最小宽度收到 150px，带子菜单的一项套上悬停底色，看起来像正在选择。
 */
import theme from '~/components/reborn/ui/reborn-context-menu/reborn-context-menu.config'
import { cn } from '~/lib/utils'

interface OverviewMenuItem {
  /** 文案 */
  label: string
  /** 前置图标 */
  icon: string
  /** 快捷键 */
  kbds?: string[]
  /** 是否带子菜单箭头 */
  hasChildren?: boolean
  /** 语义色 */
  color?: 'neutral' | 'error'
  /** 模拟悬停态 */
  hovered?: boolean
}

const ui = theme({ size: 'sm' })

/** 两组菜单项，组间用分隔线隔开 */
const groups: OverviewMenuItem[][] = [
  [
    { label: '复制', icon: 'lucide:copy', kbds: ['Ctrl', 'C'] },
    { label: '移动到', icon: 'lucide:folder-input', hasChildren: true, hovered: true },
  ],
  [
    { label: '删除', icon: 'lucide:trash-2', color: 'error' },
  ],
]
</script>

<template>
  <div class="relative">
    <!-- 右键位置：菜单从光标处展开 -->
    <Icon
      name="lucide:mouse-pointer-2"
      class="absolute -top-2 -left-2 z-1 size-4 fill-gray-1 text-gray-9"
    />

    <div :class="cn(ui.content(), 'w-[150px] min-w-0')">
      <template
        v-for="(group, groupIndex) in groups"
        :key="groupIndex"
      >
        <div
          v-if="groupIndex > 0"
          :class="ui.separator()"
        />
        <div :class="ui.group()">
          <div
            v-for="item in group"
            :key="item.label"
            :class="ui.item({ itemColor: item.color ?? 'neutral', class: item.hovered ? 'bg-gray-2' : '' })"
          >
            <span :class="ui.itemLeading()">
              <Icon
                :name="item.icon"
                class="size-4"
              />
            </span>
            <span :class="ui.itemBody()">
              <span :class="ui.itemLabel()">{{ item.label }}</span>
            </span>
            <span
              v-if="item.kbds || item.hasChildren"
              :class="ui.itemTrailing()"
            >
              <span
                v-for="kbd in item.kbds ?? []"
                :key="kbd"
                :class="ui.itemKbd()"
              >{{ kbd }}</span>
              <Icon
                v-if="item.hasChildren"
                name="lucide:chevron-right"
                :class="cn(ui.itemArrow(), 'size-4')"
              />
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
