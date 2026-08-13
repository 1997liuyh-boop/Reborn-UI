/**
 * useUniDemoPanel —— 移动端 demo 面板的页面级状态（注册制）
 *
 * 三栏布局数据流：
 * - 生产端：ComponentPlayground 在 setup 中调用 register({ url })，把当前文档页的
 *   uniapp H5 demo 地址上抛到全局状态（组件卸载时自动注销）；
 * - 消费端：布局层的 DocsMobilePanel 读取 activeUrl 渲染右侧手机模拟器。
 *
 * 采用 useState 而非 provide/inject：注册发生在 ContentRenderer 深处的动态组件里，
 * 与右栏（布局层）没有稳定的祖先关系，全局状态 + 路由清理是最稳的通路。
 */

export interface UniDemoEntry {
    /** 唯一标识（默认取原始 url） */
    id: string
    /** 规范化后的 iframe 地址（已拼接 baseURL、已修复 hash 前缀） */
    url: string
    /** 面板中展示的名称（多 demo 时用于切换 chips） */
    label?: string
}

/**
 * 规范化 uniapp H5 预览地址：
 * 1. 修复存量 Config 中 '#pages/' 缺斜杠的写法（统一为 '#/pages/'）；
 * 2. 站内绝对路径统一拼接应用 baseURL。
 */
function normalizeUniDemoUrl(url: string, baseURL: string): string {
    const fixed = url.replace("/#pages/", "/#/pages/")
    const base = (baseURL || "/").replace(/\/$/, "")
    return fixed.startsWith("/") ? `${base}${fixed}` : fixed
}

export function useUniDemoPanel() {
    /** 当前页已注册的移动端 demo 列表 */
    const entries = useState<UniDemoEntry[]>("uni-demo-entries", () => [])
    /** 当前激活的 demo id */
    const activeId = useState<string | null>("uni-demo-active-id", () => null)

    const { app } = useRuntimeConfig()

    /**
     * 注册一个移动端 demo。
     * 在组件 setup 中调用时卸载会自动注销；也可手动调用返回的清理函数。
     */
    function register(entry: { url: string; id?: string; label?: string }) {
        const id = entry.id ?? entry.url
        const url = normalizeUniDemoUrl(entry.url, app.baseURL)

        if (!entries.value.some((item) => item.id === id)) {
            entries.value = [...entries.value, { id, url, label: entry.label }]
        }
        if (!activeId.value) {
            activeId.value = id
        }

        const cleanup = () => {
            entries.value = entries.value.filter((item) => item.id !== id)
            if (activeId.value === id) {
                activeId.value = entries.value[0]?.id ?? null
            }
        }

        // setup 上下文内自动挂载卸载清理；上下文外由调用方自行处理
        if (getCurrentInstance()) {
            onUnmounted(cleanup)
        }
        return cleanup
    }

    /** 切换当前激活的 demo（多 demo 页面的 chips 使用） */
    function setActive(id: string) {
        activeId.value = id
    }

    /** 清空所有注册（路由切换时由 DocsMobilePanel 调用，防止残留） */
    function clear() {
        entries.value = []
        activeId.value = null
    }

    /** 当前激活的 demo（无显式激活时回退到首个） */
    const activeEntry = computed(
        () => entries.value.find((item) => item.id === activeId.value) ?? entries.value[0] ?? null,
    )
    /** 当前激活 demo 的 iframe 地址 */
    const activeUrl = computed(() => activeEntry.value?.url ?? null)
    /** 当前页是否有移动端 demo（决定右栏显隐） */
    const hasDemos = computed(() => entries.value.length > 0)

    return { entries, activeId, activeEntry, activeUrl, hasDemos, register, setActive, clear }
}
