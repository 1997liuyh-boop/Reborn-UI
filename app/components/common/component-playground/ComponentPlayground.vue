<script setup lang="ts">
import DeviceFrame from '../device-frame/DeviceFrame.vue'

const props = defineProps<{
  uniapp?: boolean
  url?: string
}>()

const open = ref(false);

const isDesktop = useMediaQuery("(min-width: 768px)");

// 注册移动端 demo 到页面级状态：2xl+ 由右侧 DocsMobilePanel 常驻展示
if (props.uniapp && props.url) {
  const { register } = useUniDemoPanel()
  register({ url: props.url })
}

/**
 * 2xl+ 右侧面板可见（阈值与 DocsMobilePanel 严格一致）：
 * 内层不再渲染 Web/UniApp Tabs（避免同屏双 iframe），直接输出 Web demo；
 * <2xl 无右栏，保留原有 UniApp Tab 作为移动端预览的回退入口。
 */
const isPanelViewport = useMediaQuery("(min-width: 1536px)");
const showInnerTabs = computed(() => props.uniapp && !isPanelViewport.value)

const items = [{
  label: 'Web',
  icon: 'i-lucide-globe',
  slot: 'web'
}, {
  label: 'UniApp',
  icon: 'i-lucide-smartphone',
  slot: 'uniapp'
}]
const { app } = useRuntimeConfig()

const computedUrl = computed(() => {
  const base = app.baseURL || '/'
  const uniUrl = base.replace(/\/$/, '') + props.url
  return uniUrl
})
</script>

<template>
  <div class="flex w-full min-w-0 flex-col items-start justify-start gap-6">
    <!--
      背景层级铁律：示例的表面层已由 DemoStage 画布承担，
      这里不再叠加任何卡片背景 / 描边 / 投影，只负责内容分发。
    -->
    <UTabs v-if="showInnerTabs" :items="items" class="w-full min-w-0">
      <template #web>
        <div class="pt-4">
          <slot name="component" />
        </div>
      </template>
      <template #uniapp>
        <div class="flex justify-center pt-4">
          <DeviceFrame v-if="computedUrl" :src="computedUrl" />
          <div v-else class="text-muted p-4 text-sm">
            未提供预览地址
          </div>
        </div>
      </template>
    </UTabs>
    <div v-else class="w-full min-w-0">
      <slot name="component" />
    </div>

    <!-- 参数调节入口：仅少数需要大量可调项的组件使用（抽屉承载，不占画布面积） -->
    <div v-if="$slots.config" class="border-default flex w-full flex-row items-center justify-between border-t pt-6">
      <div class="flex flex-col items-start gap-1.5">
        <span class="text-highlighted text-base font-semibold tracking-tight">交互演练场</span>
        <span class="text-muted text-sm">调节参数，实时查看组件表现。</span>
      </div>
      <UDrawer
        v-model:open="open" :direction="isDesktop ? 'right' : 'bottom'" :overlay="!isDesktop"
        :dismissible="!isDesktop" :handle="false" :modal="!isDesktop" :inset="isDesktop" :ui="{
          header: 'flex items-center justify-between',
          content: 'bg-default/35 backdrop-blur-3xl md:min-w-md',
        }"
      >
        <UButton label="调节参数" variant="solid" trailing-icon="tabler:chevron-right" size="lg" />

        <template #header>
          <div class="flex flex-col gap-2">
            <h2 class="text-highlighted font-semibold">交互演练场</h2>
            <h2 class="text-muted text-sm font-light">调节下方参数，实时查看组件表现。</h2>
          </div>

          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="open = false" />
        </template>
        <template #body>
          <div class="mt-4 grid grid-cols-1 gap-4 overflow-y-auto p-1">
            <slot name="config" />
          </div>
        </template>
      </UDrawer>
    </div>
  </div>
</template>
