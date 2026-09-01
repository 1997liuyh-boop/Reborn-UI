<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

/** 单条埋点记录 */
interface TrackedEvent {
    /** 事件名 */
    eventName: string;
    /** 事件携带的参数 */
    params: Record<string, any>;
    /** 触发时间戳 */
    timestamp: number;
    /** 列表渲染用的唯一键 */
    id: string;
}

const events = ref<TrackedEvent[]>([]);

/** 监听 v-track 指令派发的全局事件，把结果推到日志顶部 */
const onTracked = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    events.value.unshift({
        ...detail,
        id: Math.random().toString(36).substring(2, 9),
    });
};

/** 清空右侧事件流 */
const clearLogs = () => {
    events.value = [];
};

onMounted(() => {
    window.addEventListener("track:event", onTracked);
});

onUnmounted(() => {
    window.removeEventListener("track:event", onTracked);
});

/** 把时间戳格式化成 时:分:秒.毫秒 */
const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}.${d.getMilliseconds().toString().padStart(3, "0")}`;
};
</script>

<template>
    <div class="flex w-full min-w-0 flex-col">
        <DemoSection title="埋点事件模拟器" description="与左栏元素交互即可触发 v-track 指令，右栏实时打印 track:event 事件流。">
            <div class="divide-default grid gap-6 lg:grid-cols-2 lg:gap-0 lg:divide-x">
                <!-- ========== 左栏：埋点触发器 ========== -->
                <div class="scrollbar-hide flex max-h-[560px] flex-col gap-6 overflow-y-auto lg:pr-6">
                    <div class="flex flex-col gap-3">
                        <span class="text-dimmed text-xs font-medium">停留时长 · <code>duration</code></span>
                        <RebornDialog>
                            <RebornButton label="打开追踪弹窗" color="primary" variant="filled" />
                            <template #content>
                                <!-- 组合上报：page_source 来源页面、trigger_type 触发方式、user_status 新老用户 -->
                                <div class="py-8 text-center" v-track:view="{
                                    event: 'auth_popup_show',
                                    params: { page_source: 'home', trigger_type: 'click', user_status: 'new' },
                                    duration: { event: 'auth_popup_stay', params: { auth_type: 'login' } }
                                }">
                                    <h4 class="text-highlighted mb-2 text-base font-semibold">登录弹窗</h4>
                                    <p class="text-muted text-sm">关闭时会额外发送 <code>auth_popup_stay</code>，并携带 duration 属性。</p>
                                </div>
                            </template>
                        </RebornDialog>
                    </div>

                    <div class="flex flex-col gap-3">
                        <span class="text-dimmed text-xs font-medium">点击上报 · <code>v-track</code> / <code>.once</code></span>
                        <DemoBlock>
                            <RebornButton
                                v-track="{ event: 'auth_submit_click', params: { auth_type: 'login', method: 'phone' } }"
                                label="登录" color="neutral" variant="outlined" />
                            <RebornButton
                                v-track.once="{ event: 'auth_submit_click', params: { auth_type: 'register', method: 'phone' } }"
                                label="注册（只触发一次）" color="neutral" variant="soft" />
                        </DemoBlock>
                    </div>

                    <div class="flex flex-col gap-3">
                        <span class="text-dimmed text-xs font-medium">聚焦与失焦 · <code>focus</code> / <code>blur</code></span>
                        <DemoBlock layout="stack" class="gap-3">
                            <RebornInput v-track="{
                                focus: { event: 'auth_input_focus', params: { input_type: 'email' } },
                                blur: { event: 'auth_input_complete', params: { input_type: 'email' } }
                            }" placeholder="登录邮箱" class="w-full" />
                            <RebornInput v-track="{
                                focus: { event: 'auth_input_focus', params: { input_type: 'phone' } },
                                blur: { event: 'auth_input_complete', params: { input_type: 'phone' } }
                            }" placeholder="登录手机号" class="w-full" />
                            <RebornInput v-track="{
                                focus: { event: 'auth_input_focus', params: { input_type: 'password' } },
                                blur: { event: 'auth_input_complete', params: { input_type: 'password' } }
                            }" type="password" placeholder="登录密码" class="w-full" />
                        </DemoBlock>
                    </div>

                    <div class="flex flex-col gap-3">
                        <span class="text-dimmed text-xs font-medium">阻止默认行为 · <code>.prevent</code></span>
                        <a href="https://google.com" target="_blank" v-track.prevent="'link_nav_prevented'"
                            class="text-primary w-fit text-sm font-medium hover:underline">
                            点我：只上报，不跳转
                        </a>
                    </div>

                    <!-- 滚动占位：只描边不填充，用来把下方曝光埋点推出可视区 -->
                    <div
                        class="border-default text-dimmed rounded-ui-sm flex h-64 shrink-0 items-center justify-center border border-dashed text-xs">
                        继续向下滚动，触发曝光类埋点
                    </div>

                    <div v-track:view="{ event: 'section_view_3s', stay: 3000 }"
                        class="bg-info/10 text-info rounded-ui-sm shrink-0 px-4 py-3 text-center text-sm">
                        停留 3 秒触发
                    </div>

                    <div v-track:view="{ event: 'section_levels', stay: [3000, 10000] }"
                        class="bg-secondary/10 text-secondary rounded-ui-sm shrink-0 px-4 py-3 text-center">
                        <p class="text-sm font-medium">停留分档追踪（3s &amp; 10s）</p>
                        <p class="mt-1 text-xs opacity-80">分次发送埋点并携带 stayed 参数</p>
                    </div>

                    <div v-track:view="'item_visible_at_once'"
                        class="bg-warning/10 text-warning rounded-ui-sm shrink-0 px-4 py-3 text-center text-sm font-medium">
                        元素出现即记录
                    </div>
                </div>

                <!-- ========== 右栏：实时事件流 ========== -->
                <div class="flex max-h-[560px] min-h-[320px] flex-col lg:pl-6">
                    <div class="flex shrink-0 items-center justify-between gap-4 pb-3">
                        <span class="text-dimmed text-xs font-bold tracking-wider uppercase">实时事件流 · track:event</span>
                        <div class="flex items-center gap-3">
                            <span class="bg-success size-2 shrink-0 animate-pulse rounded-full" />
                            <RebornButton label="清空日志" size="sm" color="neutral" variant="text" @click="clearLogs">
                                <template #leading>
                                    <Icon name="lucide:trash-2" class="size-4" />
                                </template>
                            </RebornButton>
                        </div>
                    </div>

                    <!-- 控制台面板：规范允许的唯一一层浅填充（tone="inset"），其内部不再叠任何填充盒 -->
                    <DemoBlock tone="inset" layout="stack" class="scrollbar-hide min-h-0 flex-1 gap-0 overflow-y-auto">
                        <div v-if="events.length === 0"
                            class="text-dimmed flex h-full min-h-[220px] flex-col items-center justify-center gap-2">
                            <Icon name="lucide:inbox" class="size-10 opacity-30" />
                            <p class="text-xs">等待记录输出…</p>
                        </div>

                        <TransitionGroup name="list">
                            <div v-for="event in events" :key="event.id"
                                class="border-l-primary flex flex-col gap-1.5 border-l-2 py-3 pl-3">
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-primary font-mono text-xs font-bold">{{ event.eventName }}</span>
                                    <span class="text-dimmed shrink-0 font-mono text-[11px]">{{
                                        formatTime(event.timestamp) }}</span>
                                </div>
                                <pre v-if="Object.keys(event.params).length > 0"
                                    class="text-muted overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre">{{ JSON.stringify(event.params, null, 2) }}</pre>
                                <span v-else class="text-dimmed text-[11px]">无额外参数</span>
                            </div>
                        </TransitionGroup>
                    </DemoBlock>
                </div>
            </div>
        </DemoSection>
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

/* 事件流与触发器列表隐藏原生滚动条，避免在窄栏里挤压内容宽度 */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
