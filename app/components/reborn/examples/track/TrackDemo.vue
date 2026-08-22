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
    window.addEventListener('track:event', onTracked)
})

onUnmounted(() => {
    window.removeEventListener('track:event', onTracked)
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
                    <Icon name="lucide:chart-column-increasing" class="text-primary w-6 h-6" />
                    埋点事件模拟器 (v-track)
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
                class="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 space-y-8 overflow-y-auto max-h-[600px]">


                <RebornDialog>
                    <RebornButton label="打开追踪弹窗 (带有 .duration)" color="primary" variant="solid" />
                    <template #content>
                        <!-- 成功结合：page_source（来源页面）、trigger_type（触发方式：点击/自动弹出）、user_status（new/returning） -->
                        <div class="p-12 text-center" v-track:view="{
                            event: 'auth_popup_show',
                            params: { page_source: 'home', trigger_type: 'click', user_status: 'new' },
                            duration: { event: 'auth_popup_stay', params: { auth_type: 'login' } }
                        }">
                            <h4 class="text-lg font-bold mb-2">登录弹窗</h4>
                            <p class="text-sm text-gray-500">此弹窗在关闭时会额外发送一个 `auth_popup_stay` 埋点并带有 duration 属性
                            </p>
                        </div>
                    </template>
                </RebornDialog>

                <RebornButton v-track="{ event: 'auth_submit_click', params: { auth_type: 'login', method: 'phone' } }">
                    登录
                </RebornButton>

                <RebornButton
                    v-track.once="{ event: 'auth_submit_click', params: { auth_type: 'register', method: 'phone' } }">
                    注册(只触发一次)
                </RebornButton>

                <div>
                    登录邮箱1
                    <RebornInput v-track="{
                        focus: { event: 'auth_input_focus', params: { input_type: 'email' } },
                        blur: { event: 'auth_input_complete', params: { input_type: 'email' } }
                    }" />
                </div>
                <div>
                    登录手机号
                    <RebornInput v-track="{
                        focus: { event: 'auth_input_focus', params: { input_type: 'phone' } },
                        blur: { event: 'auth_input_complete', params: { input_type: 'phone' } }
                    }" />
                </div>
                <div>
                    登录密码
                    <RebornInput v-track="{
                        focus: { event: 'auth_input_focus', params: { input_type: 'password' } },
                        blur: { event: 'auth_input_complete', params: { input_type: 'password' } }
                    }" />
                </div>
                <a href="https://google.com" target="_blank" v-track.prevent="'link_nav_prevented'"
                    class="text-primary hover:underline text-sm font-medium px-2 py-2">
                    阻止跳转并追踪
                </a>

                <div class="h-150 w-full bg-gray-2 rounded-ui-base">

                </div>

                <div v-track:view="{ event: 'section_view_3s', stay: 3000 }"
                    class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-center">
                    <p class="text-sm text-blue-700 dark:text-blue-400">停留 3 秒触发</p>
                </div>
                <div v-track:view="{ event: 'section_levels', stay: [3000, 10000] }"
                    class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg text-center">
                    <p class="text-sm text-purple-700 dark:text-purple-400 font-medium">停留分档追踪 (3s & 10s)</p>
                    <p class="text-sm text-purple-500 mt-1">分次发送埋点并带有 stayed 参数</p>
                </div>

                <div v-track:view="'item_visible_at_once'"
                    class="shrink-0 w-3/4 p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-lg text-center font-bold border border-yellow-200 dark:border-yellow-800/50 transition-all hover:scale-105">
                    元素显示的时记录
                </div>
            </div>

            <!-- 右侧：实时监控 -->
            <div
                class="bg-gray-100 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                <div class="flex items-center justify-between mb-3 px-2">
                    <span class="text-xs font-bold text-gray-400 uppercase">实时事件流 (track:event)</span>
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
                                class="bg-gray-50 dark:bg-black/20 p-2 rounded border border-gray-100 dark:border-white/5 font-mono text-sm text-gray-600 dark:text-gray-400 scroll-auto overflow-x-auto whitespace-pre">
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
