<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue"
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue"
import { buttonColors, buttonVariants, buttonSizes } from "~/components/reborn/ui/reborn-button/reborn-button.config"

const colorOptions = buttonColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const variantOptions = buttonVariants.map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));
const sizeOptions = buttonSizes.filter(s => !s.startsWith('icon')).map(s => ({ label: s.toUpperCase(), value: s as typeof buttonSizes[number] }));

const color = ref<typeof buttonColors[number]>('primary')
const variant = ref<typeof buttonVariants[number]>('solid')
const size = ref<typeof buttonSizes[number]>('md')

const disabled = ref(false)
const loading = ref(false)
const gap = ref(true)

const clickCount = ref(0)
function onClick() {
  clickCount.value++
}
</script>

<template>
  <div class="flex flex-col gap-10 w-full max-w-6xl mx-auto pb-20">
    <!-- Header Section -->
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Button 按钮</h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">用于触发特定操作的交互组件。</p>
    </div>

    <!-- Interactive Playground -->
    <section class="flex flex-col gap-4">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">交互演练场</h3>
      <div
        class="flex flex-col md:flex-row rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-1 shadow-2xl">
        <div
          class="w-full md:w-80 p-8 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/30 backdrop-blur-sm rounded-3xl">
          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">颜色</span>
              <RebornSelect v-model="color" :options="colorOptions" />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">风格</span>
              <RebornSelect v-model="variant" :options="variantOptions" />
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-gray-400">尺寸</span>
              <RebornSelect v-model="size" :options="sizeOptions" />
            </div>

            <div class="pt-4 flex flex-col gap-3">
              <RebornCheckbox v-model="disabled" label="禁用状态" />
              <RebornCheckbox v-model="loading" label="加载状态" />
            </div>
          </div>
        </div>

        <div class="flex-1 p-12 flex flex-col items-center justify-center gap-8 min-h-[300px]">
          <div class="flex flex-wrap items-center justify-center gap-6">
            <RebornButton :color="color" :variant="variant" :size="size" :disabled="disabled" :loading="loading"
              @click="onClick">
              点我交互 ({{ clickCount }})
            </RebornButton>

            <RebornButton :color="color" :variant="variant" size="icon-md" :disabled="disabled" :loading="loading">
              <Icon name="lucide:sparkles" size="18" />
            </RebornButton>

            <RebornButton :color="color" variant="outline" :size="size" :disabled="disabled" :loading="loading">
              <template #leading>
                <Icon name="lucide:shopping-cart" />
              </template>
              带图标
            </RebornButton>
          </div>
          <div class="text-xs text-gray-400 font-mono">
            Props: { color: '{{ color }}', variant: '{{ variant }}', size: '{{ size }}' }
          </div>
        </div>
      </div>
    </section>

    <div class="space-y-8">
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white/50 dark:bg-gray-900/20">
        <h4 class="font-medium text-gray-700 dark:text-gray-300">所有变体展示</h4>
        <div class="flex flex-col gap-4">
          <div v-for="v in buttonVariants" :key="v" class="flex flex-wrap items-center gap-3">
            <p class="w-16 text-xs text-gray-400 italic">{{ v }}</p>
            <RebornButton v-for="c in buttonColors" :key="c" :variant="v" :color="c" size="sm">
              {{ c }}
            </RebornButton>
          </div>
        </div>
      </section>

      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white/50 dark:bg-gray-900/20">
        <h4 class="font-medium text-gray-700 dark:text-gray-300">尺寸与图标</h4>
        <div class="flex flex-col gap-6">
          <div class="flex flex-wrap items-end gap-3">
            <RebornButton v-for="s in sizeOptions" :key="s.value" :size="s.value" color="primary">
              {{ s.label }}
            </RebornButton>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <RebornButton v-for="s in (['icon-xs', 'icon-sm', 'icon-md', 'icon-lg', 'icon-xl'] as const)" :key="s"
              :size="s" color="secondary" variant="soft">
              <Icon name="lucide:star" />
            </RebornButton>
          </div>
        </div>
      </section>

      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white/50 dark:bg-gray-900/20">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">间隔功能 (Gap Handle)</h4>
          <RebornCheckbox v-model="gap" label="开启间隔" />
        </div>
        <p class="text-xs text-gray-400 mb-2">自动为同级按钮添加左边距，方便快速布局。</p>
        <div class="p-6 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center">
          <div class="flex flex-wrap items-center">
            <RebornButton color="primary" :gap="gap">确认提交</RebornButton>
            <RebornButton color="neutral" variant="outline" :gap="gap">取消</RebornButton>
            <RebornButton color="error" variant="soft" :gap="gap">删除</RebornButton>
          </div>
        </div>
      </section>

      <!-- Button Groups -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white/50 dark:bg-gray-900/20">
        <h4 class="font-medium text-gray-700 dark:text-gray-300">组合与编排</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            class="flex flex-col gap-3 items-center p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <span class="text-xs text-gray-400">胶囊组</span>
            <div class="flex items-center">
              <RebornButton color="warning" class="rounded-l-full px-6 w-[110px]" :round="false">加入购物车</RebornButton>
              <RebornButton color="error" class="rounded-r-full px-6 w-[110px]" :round="false">立即购买</RebornButton>
            </div>
          </div>
          <div
            class="flex flex-col gap-3 items-center p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <span class="text-xs text-gray-400">垂直功能</span>
            <div class="flex">
              <RebornButton color="warning" variant="solid" class="flex-col h-auto py-3 w-16 gap-1 rounded-r-none"
                :round="false">
                <Icon name="lucide:share-2" size="18" />
                <span class="text-[10px]">分享</span>
              </RebornButton>
              <RebornButton color="secondary" variant="solid" class="flex-col h-auto py-3 w-16 gap-1 rounded-r-none"
                :round="false">
                <Icon name="lucide:message-square" size="18" />
                <span class="text-[10px]">咨询</span>
              </RebornButton>
              <RebornButton color="error" variant="solid" class="flex-col h-auto py-3 w-16 gap-1 rounded-l-none"
                :round="false">
                <Icon name="lucide:heart" size="18" />
                <span class="text-[10px]">点赞</span>
              </RebornButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
