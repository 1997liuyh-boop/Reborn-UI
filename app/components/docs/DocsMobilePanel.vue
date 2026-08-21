<script setup lang="ts">
/**
 * DocsMobilePanel —— 文档页右侧常驻的移动端 demo 面板（三栏布局的右栏）
 *
 * 设计要点：
 * - 挂在布局层（docs.vue）且位于 UPage :key 之外，文档路由切换时组件实例持久，
 *   iframe 里的 uniapp H5 运行时得以复用；切换 demo 走 same-document 的 hash 导航
 *   （location.replace），不整页重载、不污染父页 history；
 * - fixed 右栏：贴视口右缘、占满主顶栏以下整个高度（管理台式固定侧栏），
 *   不参与文档流，正文的右侧避让由 docs.vue 依据 hasDemos 加 2xl:pr 实现；
 * - 仅 2xl+（≥1536px）展示；iframe 挂载由 useMediaQuery 门控（而非纯 CSS 隐藏），
 *   窄屏 / 移动端不会偷跑下载 uniapp H5 包；
 * - 缺 H5 构建产物（纯 pnpm dev 场景）时 HEAD 探测并展示兜底提示，
 *   避免文档站 404 页被渲染进手机壳；
 * - 主题通过 postMessage 与 uniapp 侧同步（协议与 DeviceFrame 一致）。
 *
 * z-index 约定：header z-50 > 悬浮目录 z-40 > 本面板（fixed）z-30 > 吸顶 Tab z-20
 */
import { useMediaQuery, useWindowSize } from "@vueuse/core"

/** 机型定义（与 DeviceFrame 保持一致，剔除超出栏宽的 iPad） */
interface Device {
    label: string
    width: number
    height: number
}

const devices: Device[] = [
    { label: "iPhone SE", width: 320, height: 568 },
    { label: "iPhone 12/13/14", width: 375, height: 812 },
    { label: "iPhone 14 Pro Max", width: 430, height: 932 },
    { label: "HUAWEI MATE 80", width: 366, height: 809 },
    { label: "HUAWEI MATE 70", width: 374, height: 827 },
]

const { entries, activeEntry, activeUrl, hasDemos, setActive, clear } = useUniDemoPanel()

const route = useRoute()

// 路由切换即清空注册，防止旧页 demo 残留（新页组件挂载后会重新注册）
watch(
    () => route.path,
    () => clear(),
)

// ---- 机型与等比缩放 ----

const selectedDeviceName = ref(devices[1]!.label)
const selectedDevice = computed(() => devices.find((d) => d.label === selectedDeviceName.value) || devices[1]!)

/** 机身外框尺寸（设备逻辑尺寸 + 两侧 8px 边框） */
const frameWidth = computed(() => selectedDevice.value.width + 16)
const frameHeight = computed(() => selectedDevice.value.height + 16)

const { height: windowHeight } = useWindowSize()

/**
 * 缩放系数：面板可用宽 = 420 - 两侧内边距 32 - 边框，取 384；
 * 可用高 = 视口 - 主顶栏(64) - 工具条与上下留白(约 112)；
 * iframe 仍按设备逻辑尺寸渲染，保证 rpx / 媒体查询与真机一致。
 */
const scale = computed(() => {
    const availW = 384
    const availH = Math.max(360, windowHeight.value - 176)
    return Math.min(1, availW / frameWidth.value, availH / frameHeight.value)
})

// ---- H5 构建产物探测（缺产物兜底） ----

/** /uni-render/ 产物可用性：null=未探测，true/false=探测结果（会话级缓存） */
const h5Available = useState<boolean | null>("uni-render-available", () => null)

const { app } = useRuntimeConfig()
const h5Base = (app.baseURL || "/").replace(/\/$/, "")

/** HEAD 探测 H5 入口文件（仅客户端；产物缺失时请求会落到文档站 404） */
async function probeH5() {
    try {
        const res = await fetch(`${h5Base}/uni-render/index.html`, { method: "HEAD" })
        h5Available.value = res.ok
    }
    catch {
        h5Available.value = false
    }
}

// ---- iframe 生命周期 ----

/** 面板视口门控：与 ComponentPlayground 的内层 Tab 移除阈值严格一致（2xl） */
const isWide = useMediaQuery("(min-width: 1536px)")

const frameRef = ref<HTMLIFrameElement>()
const isLoading = ref(true)
/** iframe 的初始 src（只在首次赋值 / 手动刷新时变更，后续切 demo 走 hash 导航） */
const initialUrl = ref<string | null>(null)
/** iframe 当前实际展示的地址（hash 导航后与 initialUrl 会不同步） */
const shownUrl = ref<string | null>(null)
/** 手动刷新时递增，强制重建 iframe */
const reloadKey = ref(0)

onMounted(() => {
    if (h5Available.value === null) {
        probeH5()
    }
})

// activeUrl 变化：首次赋值挂载 iframe；后续通过 hash 导航切换页面（不重载运行时）
watch(activeUrl, (url) => {
    if (!url || url === shownUrl.value) return
    if (!initialUrl.value) {
        initialUrl.value = url
        shownUrl.value = url
        return
    }

    const frameWindow = frameRef.value?.contentWindow
    if (frameWindow) {
        try {
            // 同源 hash 导航：uniapp 内部路由接管，避免整页 reload 与父页 history 污染
            frameWindow.location.replace(new URL(url, window.location.origin).href)
            shownUrl.value = url
            return
        }
        catch {
            // 跨源 / 异常时回退为重建 iframe
        }
    }
    initialUrl.value = url
    shownUrl.value = url
    reloadKey.value++
    isLoading.value = true
})

/** 手动刷新：重建 iframe 并回到当前激活 demo */
function reload() {
    if (!activeUrl.value) return
    initialUrl.value = activeUrl.value
    shownUrl.value = activeUrl.value
    reloadKey.value++
    isLoading.value = true
}

// ---- 主题同步（协议与 DeviceFrame 一致） ----

const colorMode = useColorMode()

/** 向 uniapp H5 发送当前主题；load 后延迟补发一次，规避监听器注册晚于 load 的竞态 */
function syncTheme() {
    frameRef.value?.contentWindow?.postMessage({ type: "theme-change", theme: colorMode.value }, "*")
}

function onIframeLoad() {
    isLoading.value = false
    syncTheme()
    setTimeout(syncTheme, 600)
}

watch(
    () => colorMode.value,
    () => syncTheme(),
)
</script>

<template>
  <!-- v-show 保持 iframe 常驻：切到无 demo 页面时仅隐藏，不销毁 uniapp 运行时 -->
  <aside
    v-show="hasDemos"
    class="border-default bg-default/70 fixed top-(--ui-header-height) right-0 bottom-0 z-30 hidden w-[420px] border-l backdrop-blur-xl 2xl:block"
    aria-label="移动端预览"
  >
    <!-- 面板内容仅客户端渲染：demo 注册与缩放计算都依赖客户端环境，SSR 输出会产生水合不一致 -->
    <ClientOnly>
      <div class="flex h-full flex-col gap-3 p-4">
        <!-- 工具条：面板标题 + 机型切换 + 尺寸提示 + 刷新 / 新窗口打开 -->
        <div class="flex items-center justify-between gap-2">
          <USelect
            v-model="selectedDeviceName" :items="devices" label-key="label" value-key="label" size="xs"
            class="w-44"
          />
          <div class="flex items-center gap-1">
            <span class="text-muted text-xs">{{ selectedDevice.width }}×{{ selectedDevice.height }}</span>
            <UButton
              icon="tabler:refresh" size="xs" color="neutral" variant="ghost" aria-label="刷新预览"
              title="刷新预览" @click="reload"
            />
            <UButton
              icon="tabler:external-link" size="xs" color="neutral" variant="ghost" aria-label="新窗口打开"
              title="新窗口打开" :href="activeUrl ?? undefined" target="_blank"
            />
          </div>
        </div>

        <!-- 多 demo 切换 chips（当前每页仅一个 demo，预留能力） -->
        <div v-if="entries.length > 1" class="flex flex-wrap gap-1.5">
          <UButton
            v-for="entry in entries" :key="entry.id" size="xs"
            :color="entry.id === activeEntry?.id ? 'primary' : 'neutral'"
            :variant="entry.id === activeEntry?.id ? 'soft' : 'ghost'" :label="entry.label || entry.id"
            @click="setActive(entry.id)"
          />
        </div>

        <!-- 手机模拟器：固定栏内垂直居中，可用空间不足时整机等比缩放（不裁切内容） -->
        <div class="flex min-h-0 flex-1 items-center justify-center">
          <div :style="{ width: `${frameWidth * scale}px`, height: `${frameHeight * scale}px` }">
            <div
              class="relative origin-top-left overflow-hidden rounded-[3rem] border-8 border-gray-900 bg-gray-900 shadow-2xl transition-[width,height] duration-300"
              :style="{ width: `${frameWidth}px`, height: `${frameHeight}px`, transform: `scale(${scale})` }"
            >
              <!-- 缺 H5 构建产物兜底 -->
              <div
                v-if="h5Available === false"
                class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-zinc-950"
              >
                <UIcon name="tabler:device-mobile-off" class="text-muted size-10" />
                <p class="text-sm font-medium">未检测到 uniapp H5 构建产物</p>
                <p class="text-muted text-xs leading-relaxed">
                  请先运行 <code class="text-primary font-mono">pnpm dev:h5</code><br>
                  或执行 <code class="font-mono">pnpm --filter uniapp-project run build:h5</code> 后重试
                </p>
                <UButton size="xs" color="neutral" variant="outline" label="重试" @click="probeH5" />
              </div>

              <template v-else>
                <!-- 初次加载 / 探测中的占位 -->
                <div
                  v-if="isLoading || h5Available === null"
                  class="absolute inset-0 z-10 flex items-center justify-center bg-white dark:bg-zinc-950"
                >
                  <UIcon name="svg-spinners:blocks-wave" class="text-primary size-12" />
                </div>
                <iframe
                  v-if="isWide && h5Available && initialUrl" ref="frameRef" :key="reloadKey"
                  :src="initialUrl" class="h-full w-full touch-none border-none bg-white" title="移动端 demo 预览"
                  @load="onIframeLoad"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  </aside>
</template>
