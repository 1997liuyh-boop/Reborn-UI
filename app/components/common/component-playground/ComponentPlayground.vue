<script setup lang="ts">
import DeviceFrame from '../device-frame/DeviceFrame.vue'

const props = defineProps<{
  /** 该组件是否有 UniApp 端 demo（配合 url 使用） */
  uniapp?: boolean
  /** UniApp H5 demo 地址（站内 /uni-render/ 下的 hash 路由） */
  url?: string
}>()

const open = ref(false);

const isDesktop = useMediaQuery("(min-width: 768px)");

// 注册移动端 demo 到页面级状态：面板是否真正展示由 useUniDemoPanel 结合平台开关决定
if (props.uniapp && props.url) {
  const { register } = useUniDemoPanel()
  register({ url: props.url })
}

const { isUniapp } = useDocsPlatform()

/**
 * 预览内容按顶栏平台开关分流：
 * - Web 档：只输出 Web demo，不渲染任何 UniApp 预览；
 * - UniApp 档 + 2xl+：右侧 DocsMobilePanel 常驻手机壳（阈值与其严格一致），
 *   正文仍输出 Web demo（避免同屏双 iframe）；
 * - UniApp 档 + <2xl：无右栏，正文内联手机壳承担 UniApp 预览。
 */
const isPanelViewport = useMediaQuery("(min-width: 1536px)");
const showInlineDevice = computed(() => props.uniapp && isUniapp.value && !isPanelViewport.value)

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
      背景层级铁律：示例区唯一的底色层是页面环境层，
      这里不叠加任何卡片背景 / 描边 / 投影，只负责内容分发。
    -->
    <div v-if="showInlineDevice" class="flex w-full justify-center">
      <DeviceFrame v-if="computedUrl" :src="computedUrl" />
      <div v-else class="text-muted p-4 text-sm">
        未提供预览地址
      </div>
    </div>
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
