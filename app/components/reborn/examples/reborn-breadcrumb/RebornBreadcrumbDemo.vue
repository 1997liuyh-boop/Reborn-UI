<script setup lang="ts">
import RebornBreadcrumb from "~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumb.vue"
import RebornBreadcrumbItem from "~/components/reborn/ui/reborn-breadcrumb/RebornBreadcrumbItem.vue"
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue"
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue"

const separator = ref('/')
const separatorIcon = ref('')

const separatorOptions = [
  { label: 'Slash (/)', value: '/' },
  { label: 'Arrow (>)', value: '>' },
  { label: 'Dash (-)', value: '-' },
  { label: 'Double Arrow (»)', value: '»' },
  { label: 'Dot (•)', value: '•' },
]
</script>

<template>
  <div class="flex flex-col gap-12 w-full max-w-6xl mx-auto pb-24 px-4">
    <!-- Header -->
    <div class="flex flex-col gap-3">
      <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Breadcrumb 面包屑</h2>
      <p class="text-xl text-gray-500 dark:text-gray-400 max-w-3xl">
        导航辅助工具，显示当前页面在层级结构中的位置，允许用户快速返回上级页面。
      </p>
    </div>

    <!-- Interactive Playground -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center gap-2">
        <div class="w-1 h-6 bg-primary rounded-full"></div>
        <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200">交互演练场</h3>
      </div>
      <div
        class="grid grid-cols-1 lg:grid-cols-4 gap-0 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        <div class="col-span-1 p-8 bg-gray-50/50 dark:bg-gray-900/30 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-900 flex flex-col gap-8">
          <div class="flex flex-col gap-3">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400">分隔符类型</span>
            <RebornSelect v-model="separator" :options="separatorOptions" />
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400">图标分隔符</span>
            <RebornInput v-model="separatorIcon" placeholder="如: lucide:chevron-right" />
            <p class="text-[10px] text-gray-400">输入 Iconify 图标名称，将覆盖文本分隔符</p>
          </div>
        </div>
        <div class="col-span-3 p-12 flex items-center justify-center bg-white dark:bg-gray-950 min-h-[300px]">
          <RebornBreadcrumb :separator="separator" :separator-icon="separatorIcon">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/components">组件库</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/components/navigation">导航组件</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>面包屑</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </div>
      </div>
    </section>

    <!-- Examples Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Base Usage -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950/50">
        <h4 class="text-lg font-bold">基础用法</h4>
        <p class="text-sm text-gray-500 mb-4">最简单的用法，通过 <code>separator</code> 定义分隔符。</p>
        <div class="py-4 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
          <RebornBreadcrumb separator=">">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/promotion">活动管理</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>活动详情</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </div>
      </section>

      <!-- Icon Separator -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950/50">
        <h4 class="text-lg font-bold">图标分隔符</h4>
        <p class="text-sm text-gray-500 mb-4">使用 <code>separator-icon</code> 来设置自定义图标。</p>
        <div class="py-4 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
          <RebornBreadcrumb separator-icon="lucide:arrow-right">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/user">用户中心</RebornBreadcrumbItem>
            <RebornBreadcrumbItem>设置</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </div>
      </section>

      <!-- External Links -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950/50">
        <h4 class="text-lg font-bold">外部链接与新窗口</h4>
        <p class="text-sm text-gray-500 mb-4">支持 <code>target</code> 参数，可以控制打开方式。</p>
        <div class="py-4 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
          <RebornBreadcrumb separator="/">
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="https://github.com" target="_blank">
              GitHub (新窗口)
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>项目详情</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </div>
      </section>

      <!-- Custom Separator Slot -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950/50">
        <h4 class="text-lg font-bold">自定义分隔符插槽</h4>
        <p class="text-sm text-gray-500 mb-4">通过 <code>separator</code> 插槽可以为每一项定义不同的分隔符。</p>
        <div class="py-4 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
          <RebornBreadcrumb>
            <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
            <RebornBreadcrumbItem to="/shop">
              商城
              <template #separator>
                <span class="text-primary mx-1">~</span>
              </template>
            </RebornBreadcrumbItem>
            <RebornBreadcrumbItem>购物车</RebornBreadcrumbItem>
          </RebornBreadcrumb>
        </div>
      </section>
    </div>
  </div>
</template>
