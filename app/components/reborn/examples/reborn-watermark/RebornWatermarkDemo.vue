<script setup lang="ts">
import { reactive, ref } from 'vue'
import RebornWatermark from "~/components/reborn/ui/reborn-watermark/RebornWatermark.vue"
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue"
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue"
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"

const config = reactive({
  content: 'Reborn UI Premium',
  rotate: -22,
  gapX: 100,
  gapY: 100,
  fontSize: 16,
  color: 'rgba(0, 0, 0, 0.15)',
  zIndex: 9
})

const font = computed(() => ({
  color: config.color,
  fontSize: config.fontSize,
  fontWeight: '600'
}))

const gap = computed(() => [config.gapX, config.gapY] as [number, number])

const reset = () => {
  config.content = 'Reborn UI Premium'
  config.rotate = -22
  config.gapX = 100
  config.gapY = 100
  config.fontSize = 16
  config.color = 'rgba(0, 0, 0, 0.15)'
}
</script>

<template>
  <div class="flex flex-col gap-12 w-full pb-24 px-4">
    <!-- Header -->
    <div class="flex flex-col gap-3">
      <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Watermark 水印</h2>
      <p class="text-xl text-gray-500 dark:text-gray-400 max-w-3xl">
        用于版权保护或信息安全标识。支持文本、多行文本及图片模式，具备高度可定制性。
      </p>
    </div>

    <!-- Playground -->
    <section class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200">交互演示与配置</h3>
        <RebornButton variant="ghost" size="sm" @click="reset">重置配置</RebornButton>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-0 rounded-[32px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
        <!-- Sidebar Controls -->
        <div class="col-span-1 p-8 bg-gray-50/50 dark:bg-gray-900/30 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-900 flex flex-col gap-8">
          <div class="flex flex-col gap-4">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400">水印文本</span>
            <RebornInput v-model="config.content" placeholder="输入水印文字" />
          </div>
          
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-widest text-gray-400">旋转角度</span>
              <span class="text-xs font-mono text-primary">{{ config.rotate }}°</span>
            </div>
            <RebornSlider v-model="config.rotate" :min="-180" :max="180" />
          </div>

          <div class="flex flex-col gap-4">
             <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-widest text-gray-400">横向间距 (Gap X)</span>
              <span class="text-xs font-mono text-primary">{{ config.gapX }}px</span>
            </div>
            <RebornSlider v-model="config.gapX" :min="0" :max="300" />
          </div>

          <div class="flex flex-col gap-4">
             <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-widest text-gray-400">纵向间距 (Gap Y)</span>
              <span class="text-xs font-mono text-primary">{{ config.gapY }}px</span>
            </div>
            <RebornSlider v-model="config.gapY" :min="0" :max="300" />
          </div>

          <div class="flex flex-col gap-4">
             <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-widest text-gray-400">字体大小</span>
              <span class="text-xs font-mono text-primary">{{ config.fontSize }}px</span>
            </div>
            <RebornSlider v-model="config.fontSize" :min="10" :max="48" />
          </div>

          <div class="flex flex-col gap-4">
            <span class="text-xs font-bold uppercase tracking-widest text-gray-400">文本颜色</span>
            <RebornInput v-model="config.color" placeholder="rgba(0,0,0,0.15)" />
          </div>
        </div>

        <!-- Preview Area -->
        <div class="col-span-3 p-8 md:p-12 bg-white dark:bg-gray-950 flex items-center justify-center min-h-[500px]">
          <RebornWatermark 
            :content="config.content" 
            :rotate="config.rotate"
            :gap="gap"
            :font="font"
            :z-index="config.zIndex"
          >
            <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden p-8 md:p-12">
               <!-- Dummy Invoice/Document Content -->
               <div class="flex flex-col gap-10">
                 <div class="flex justify-between items-start">
                    <div class="flex flex-col gap-2">
                      <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                         <Icon name="lucide:file-text" size="24" />
                      </div>
                      <h4 class="text-2xl font-bold mt-2">薪资确认单</h4>
                      <p class="text-sm text-gray-400">编号: INV-2024-00129</p>
                    </div>
                    <div class="text-right">
                       <p class="text-3xl font-black text-primary">¥ 28,450.00</p>
                       <p class="text-sm text-gray-400 mt-1 italic">已通过系统审核</p>
                    </div>
                 </div>

                 <div class="grid grid-cols-2 gap-8 border-y border-gray-50 dark:border-gray-800 py-8">
                    <div class="flex flex-col gap-2">
                       <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">接收人</span>
                       <p class="font-semibold text-gray-700 dark:text-gray-200">张三 (Zhang San)</p>
                       <p class="text-sm text-gray-500">产品设计部 / 资深UI设计师</p>
                    </div>
                    <div class="flex flex-col gap-2">
                       <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">发放日期</span>
                       <p class="font-semibold text-gray-700 dark:text-gray-200">2024年4月25日</p>
                       <p class="text-sm text-gray-500">结算周期: 2024/03/01 - 2024/03/31</p>
                    </div>
                 </div>

                 <div class="flex flex-col gap-4">
                    <div class="flex justify-between text-sm">
                       <span class="text-gray-500">基本工资</span>
                       <span class="font-mono">¥ 22,000.00</span>
                    </div>
                    <div class="flex justify-between text-sm">
                       <span class="text-gray-500">绩效奖金</span>
                       <span class="font-mono">¥ 6,000.00</span>
                    </div>
                    <div class="flex justify-between text-sm">
                       <span class="text-gray-500">全勤补助</span>
                       <span class="font-mono text-green-500">+ ¥ 450.00</span>
                    </div>
                    <div class="flex justify-between text-sm font-bold pt-4 border-t border-gray-50 dark:border-gray-800">
                       <span>实发金额 (NET)</span>
                       <span class="text-lg text-primary">¥ 28,450.00</span>
                    </div>
                 </div>

                 <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p class="text-[11px] text-gray-400 leading-relaxed italic">
                      声明: 本文件包含敏感财务信息，仅供个人查阅。任何未经授权的泄露、分发或复制行为均可能触犯公司信息安全政策。本页面已由 Reborn UI 水印系统提供版权保护。
                    </p>
                 </div>
               </div>
            </div>
          </RebornWatermark>
        </div>
      </div>
    </section>

    <!-- Other Examples -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Image Watermark -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-[32px] bg-white dark:bg-gray-950/50">
        <h4 class="text-xl font-bold italic">Logo 品牌标识</h4>
        <p class="text-sm text-gray-500 mb-4">通过 <code>image</code> 属性设置品牌 Logo 水印。</p>
        <div class="rounded-2xl overflow-hidden shadow-inner">
          <RebornWatermark 
            :width="130" 
            :height="30" 
            image="https://element-plus.org/images/element-plus-logo.svg"
            :gap="[100, 100]"
          >
            <div class="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
               <div class="p-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                 <Icon name="lucide:image" size="48" class="text-gray-200" />
               </div>
            </div>
          </RebornWatermark>
        </div>
      </section>

      <!-- Multi-line -->
      <section class="flex flex-col gap-4 p-8 border border-gray-200 dark:border-gray-800 rounded-[32px] bg-white dark:bg-gray-950/50">
        <h4 class="text-xl font-bold italic">多维安全标识</h4>
        <p class="text-sm text-gray-500 mb-4">通过数组传入 <code>content</code> 实现多行差异化标识。</p>
        <div class="rounded-2xl overflow-hidden shadow-inner">
          <RebornWatermark 
            :content="['内部机密 (SECRET)', 'ID: 8829-1102', 'IP: 192.168.1.102']" 
            :font="{ fontSize: 12, color: 'rgba(239, 68, 68, 0.12)' }"
            :gap="[120, 120]"
          >
             <div class="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 italic text-gray-400">
               敏感资产保护区域
            </div>
          </RebornWatermark>
        </div>
      </section>
    </div>
  </div>
</template>
