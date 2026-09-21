<script setup lang="ts">
import { sandboxContextKey } from '../component-viewer/types'
import DeviceFrame from '../device-frame/DeviceFrame.vue'

const props = defineProps<{
  /** 该组件是否有 UniApp 端 demo（配合 url 使用） */
  uniapp?: boolean
  /** UniApp H5 demo 地址（站内 /uni-render/ 下的 hash 路由） */
  url?: string
}>()

// 注册移动端 demo 到页面级状态：面板是否真正展示由 useUniDemoPanel 结合平台开关决定
if (props.uniapp && props.url) {
  const { register } = useUniDemoPanel()
  register({ url: props.url })
}

/**
 * 参数调节区的去处。
 *
 * 在文档页里，这块内容归 ComponentTabs 的 Sandbox 面板管；但那张面板和这里隔着
 * `<component :is="config" />` 这层动态组件，父子关系上够不着，只能用 Teleport 搬过去。
 * 注入不到 sandbox 说明不在文档页（例如别处单独引用本组件），那就退回原地铺开。
 */
const sandbox = inject(sandboxContextKey, null)
const slots = useSlots()

// 有没有可调参数，只有本组件能从 #config 插槽看出来；挂载后回报上层，决定那张 Tab 要不要出现
onMounted(() => {
  if (slots.config) sandbox?.register()
})

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

    <!-- 参数调节区：仅少数需要大量可调项的组件会写 #config -->
    <template v-if="$slots.config">
      <!--
        文档页里搬进 Sandbox 面板。用 v-if 而不是 :disabled 卡住渲染时机：
        Teleport 即使 disabled 也会去解析 to 选择器，目标还没挂上时会报 Invalid Teleport target。
      -->
      <Teleport v-if="sandbox && sandbox.ready.value" :to="`#${sandbox.targetId}`">
        <slot name="config" />
      </Teleport>

      <!-- 没有承载面板才就地铺开；已登记但目标还没挂好的那一帧什么都不画，免得控件先在预览区闪一下 -->
      <div v-else-if="!sandbox" class="border-default flex w-full flex-col gap-4 border-t pt-6">
        <div class="flex flex-col gap-1">
          <span class="text-highlighted text-base font-semibold tracking-tight">交互演练场</span>
          <span class="text-muted text-sm">调节参数，实时查看组件表现。</span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <slot name="config" />
        </div>
      </div>
    </template>
  </div>
</template>
