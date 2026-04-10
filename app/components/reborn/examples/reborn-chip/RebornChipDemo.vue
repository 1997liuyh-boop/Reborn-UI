<script setup lang="ts">
import { ref } from 'vue'
import RebornChip from '~/components/reborn/ui/reborn-chip/RebornChip.vue'
import { chipColors, chipSizes, chipPositions } from '~/components/reborn/ui/reborn-chip/reborn-chip.config'

const state = ref({
  color: 'primary',
  size: 'md',
  position: 'top-right',
  text: '9',
  show: true,
  inset: false,
  standalone: false
})

const controls = [
  {
    title: '基础配置',
    children: [
      {
        label: '标签文本',
        key: 'text',
        component: 'input' as const,
        defaultValue: '9'
      },
      {
        label: '显示状态',
        key: 'show',
        component: 'checkbox' as const,
        defaultValue: true
      }
    ]
  },
  {
    title: '样式选项',
    children: [
      {
        label: '颜色主题',
        key: 'color',
        component: 'select' as const,
        defaultValue: 'primary',
        props: {
          items: chipColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))
        }
      },
      {
        label: '尺寸规格',
        key: 'size',
        component: 'select' as const,
        defaultValue: 'md',
        props: {
          items: chipSizes.map(s => ({ label: s.toUpperCase(), value: s }))
        }
      }
    ]
  },
  {
    title: '布局位置',
    children: [
      {
        label: '显示位置',
        key: 'position',
        component: 'select' as const,
        defaultValue: 'top-right',
        props: {
          items: chipPositions.map(p => ({ label: p, value: p }))
        }
      },
      {
        label: '内嵌模式',
        key: 'inset',
        component: 'checkbox' as const,
        defaultValue: false
      },
      {
        label: '独立渲染',
        key: 'standalone',
        component: 'checkbox' as const,
        defaultValue: false
      }
    ]
  }
]
</script>

<template>
  <div class="flex flex-col gap-12 w-full pb-20">
    <!-- Playground Section -->
    <Playground v-model="state" :controls="controls" component-name="RebornChip" title="Chip 角标"
      description="用于在元素角落显示状态、通知或计数信息的微型标签。">
      <div class="flex items-center justify-center p-10">
        <RebornChip v-bind="state">
          <div
            class="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-700">
            <Icon name="lucide:bell" class="w-8 h-8 text-gray-400" />
          </div>
        </RebornChip>
      </div>
    </Playground>

    <!-- Variants Matrix -->
    <section class="space-y-6">
      <div class="flex flex-col gap-1 border-l-4 border-primary pl-4">
        <h3 class="text-xl font-bold">色彩体系</h3>
        <p class="text-gray-500 text-sm">支持丰富的语义化色彩系统，适应不同的视觉反馈需求。</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-6 mt-6">
        <div v-for="c in chipColors" :key="c"
          class="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
          <RebornChip :color="c" text="8">
            <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700" />
          </RebornChip>
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ c }}</span>
        </div>
      </div>
    </section>

    <!-- Sizes & Creative Examples -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Sizes -->
      <section
        class="space-y-6 p-8 rounded-3xl bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10">
          <Icon name="lucide:maximize" class="w-20 h-20" />
        </div>
        <div class="flex flex-col gap-1 relative z-10">
          <h3 class="text-xl font-bold">尺寸规格</h3>
          <p class="text-gray-500 text-sm">从细微的装饰到醒目的提示，多级尺寸随心切换。</p>
        </div>

        <div class="flex flex-wrap items-end gap-10 py-6 relative z-10">
          <div v-for="s in chipSizes" :key="s" class="flex flex-col items-center gap-4">
            <RebornChip :size="s" color="error" text="NEW">
              <div
                class="w-20 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-[10px] text-primary/40 font-bold uppercase tracking-tighter">
                {{ s }}
              </div>
            </RebornChip>
            <span class="text-[10px] font-bold text-gray-400 tracking-widest">{{ s.toUpperCase() }}</span>
          </div>
        </div>
      </section>

      <!-- Typical Usage -->
      <section
        class="space-y-6 p-8 rounded-3xl bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-10">
          <Icon name="lucide:layout" class="w-20 h-20" />
        </div>
        <div class="flex flex-col gap-1 relative z-10">
          <h3 class="text-xl font-bold">创意应用</h3>
          <p class="text-gray-500 text-sm">结合头像、按钮等组件，打造更加生动的交互界面。</p>
        </div>

        <div class="flex flex-wrap gap-10 items-center py-6 relative z-10">
          <!-- Avatar Status -->
          <div class="group cursor-pointer">
            <RebornChip color="success" size="lg" inset position="bottom-right">
              <UAvatar src="https://github.com/benjamincanac.png" size="xl"
                class="ring-4 ring-white dark:ring-gray-900 group-hover:scale-105 transition-transform" />
            </RebornChip>
          </div>

          <!-- Notification Dot -->
          <div class="relative">
            <RebornChip color="error" size="sm" text="">
              <div
                class="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Icon name="lucide:mail" class="w-6 h-6 text-gray-500" />
              </div>
            </RebornChip>
          </div>

          <!-- Badge on Button -->
          <RebornChip color="warning" text="SALE" size="md">
            <button
              class="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-lg">
              立即解锁
            </button>
          </RebornChip>
        </div>
      </section>
    </div>
  </div>
</template>
