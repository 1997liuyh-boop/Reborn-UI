<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface TrackedEvent {
    eventName: string
    params: Record<string, any>
    timestamp: number
    id: string
}

const events = ref<TrackedEvent[]>([])

const onTracked = (e: Event) => {
    const detail = (e as CustomEvent).detail
    events.value.unshift({
        ...detail,
        id: Math.random().toString(36).substring(2, 9)
    })
}

const clearLogs = () => {
    events.value = []
}

onMounted(() => {
    window.addEventListener('ga-event:track', onTracked)
})

onUnmounted(() => {
    window.removeEventListener('ga-event:track', onTracked)
})

const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`
}
</script>

<template>
    <div
        class="analytics-demo p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[600px]">
        <!-- 头部 -->
        <div class="mb-8 flex items-center justify-between">
            <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Icon name="lucide:chart-column-increasing" class="text-primary-500 w-6 h-6" />
                    埋点事件模拟器 (v-ga-event)
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">与左侧元素交互将触发埋点事件，并在右侧实时展示。</p>
            </div>
            <button @click="clearLogs"
                class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                <Icon name="lucide:trash-2" class="w-4 h-4" />
                清空日志
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
            <!-- 左侧：触发器 -->
            <div
                class="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 space-y-8 overflow-y-auto max-h-[500px]">

                <!-- 模块 1: 标准点击 -->
                <section>
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">点击追踪 (v-ga-event)</h3>
                    <div class="flex flex-wrap gap-3">
                        <button v-ga-event="'btn_primary_click'"
                            class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            基础按钮
                        </button>
                        <button
                            v-ga-event="{ event: 'feature_used', params: { feature_name: 'multi_param_demo', level: 1 } }"
                            class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            复杂对象载荷
                        </button>
                    </div>
                </section>

                <!-- 模块 2: 修饰符 -->
                <section>
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">修饰符 (.once / .prevent)
                    </h3>
                    <div class="flex flex-wrap gap-3">
                        <button v-ga-event.once="'tracked_once_only'"
                            class="border border-gray-200 dark:border-gray-600 hover:border-primary-500 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition active:scale-95">
                            仅追踪一次
                        </button>
                        <a href="https://google.com" target="_blank" v-ga-event.prevent="'link_nav_prevented'"
                            class="text-primary-500 hover:underline text-sm font-medium px-2 py-2">
                            阻止默认跳转链接
                        </a>
                    </div>
                </section>

                <!-- 模块 3: 自定义事件 -->
                <section>
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">其他 DOM 事件
                        (:mouseenter)</h3>
                    <div v-ga-event:mouseenter="{ event: 'hover_detected', params: { source: 'hover_card' } }"
                        class="p-6 bg-linear-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/10 rounded-xl border border-primary-200 dark:border-primary-800 text-center cursor-pointer transform transition hover:scale-[1.02]">
                        <p class="text-sm text-primary-700 dark:text-primary-400 font-medium">鼠标悬停在此处触发</p>
                    </div>
                </section>

                <!-- 模块 4: 曝光追踪 -->
                <section>
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">曝光追踪 (:view)</h3>
                    <div
                        class="h-40 overflow-y-auto border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 space-y-20 flex flex-col items-center">
                        <p class="text-xs text-gray-400 italic">请在下方框内滚动</p>
                        <div v-ga-event:view="{ event: 'item_visible', params: { item_id: 'secret_box' } }"
                            class="shrink-0 w-3/4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg text-center font-bold border border-yellow-200 dark:border-yellow-800/50">
                            惊喜！盒子已曝光
                        </div>
                    </div>
                </section>
                <section>
                    <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">曝光追踪 (:view)</h3>
                    <div
                        class="h-40 overflow-y-auto border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 space-y-20 flex flex-col items-center">
                        <p class="text-xs text-gray-400 italic">请在下方框内滚动</p>
                        <div v-ga-event:view.once="{ event: 'item_visible', params: { item_id: 'secret_box' } }"
                            class="shrink-0 w-3/4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg text-center font-bold border border-yellow-200 dark:border-yellow-800/50">
                            惊喜！盒子已曝光
                        </div>
                    </div>
                </section>

            </div>

            <!-- 右侧：实时监控 -->
            <div
                class="bg-gray-100 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                <div class="flex items-center justify-between mb-3 px-2">
                    <span class="text-xs font-bold text-gray-400 uppercase">实时事件流</span>
                    <span class="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>

                <div class="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    <div v-if="events.length === 0"
                        class="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-600 py-20">
                        <Icon name="lucide:inbox" class="w-12 h-12 mb-2 opacity-20" />
                        <p class="text-sm italic">等待记录输出...</p>
                    </div>

                    <TransitionGroup name="list">
                        <div v-for="event in events" :key="event.id"
                            class="p-3 bg-white dark:bg-gray-900 rounded-lg shadow-sm border-l-4 border-l-primary-500 text-xs">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-mono text-primary-600 dark:text-primary-400 font-bold">{{
                                    event.eventName }}</span>
                                <span class="text-gray-400 scale-90">{{ formatTime(event.timestamp) }}</span>
                            </div>
                            <div v-if="Object.keys(event.params).length > 0"
                                class="bg-gray-50 dark:bg-black/20 p-2 rounded border border-gray-100 dark:border-white/5 font-mono text-caption-sm text-gray-600 dark:text-gray-400 scroll-auto overflow-x-auto whitespace-pre">
                                {{ JSON.stringify(event.params, null, 2) }}
                            </div>
                            <div v-else class="text-gray-400 italic py-1">无额外参数</div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
.list-enter-active,
.list-leave-active {
    transition: all 0.4s ease;
}

.list-enter-from {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
}

.list-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
