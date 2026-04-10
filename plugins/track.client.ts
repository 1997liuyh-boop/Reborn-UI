import { defineNuxtPlugin, useGtag } from "#imports";
import type { Directive, DirectiveBinding } from "vue";

/** 埋点事件参数类型 */
type TrackParams = Record<string, unknown>;

/** 埋点指令配置项 */
interface TrackOptions {
    /** 自定义事件名称 (GA event name) */
    event?: string;
    /** 别名，同 event */
    name?: string;
    /** 事件类别 (GA event_category) */
    category?: string;
    /** 事件标签 (GA event_label) */
    label?: string;
    /** 事件数值 (GA value) */
    value?: number;
    /** 发送目标 (GA send_to) */
    sendTo?: string;
    /** 是否为非互动事件 (GA non_interaction) */
    nonInteraction?: boolean;
    /** 传输类型 (GA transport_type) */
    transportType?: string;
    /** 额外的自定义参数 */
    params?: TrackParams;
    /**
     * 停留时长（毫秒），支持单个数值或数组（分档）。仅在 :view 模式下有效。
     * 只有当元素在视口内持续停留超过指定时长时才触发。
     * 例如: 3000 或 [3000, 10000]
     */
    stay?: number | number[];
    /**
     * 总曝光时长配置 (仅在 :view 模式下有效)。
     * 开启后，在元素离开视口或卸载时触发。
     * 支持布尔值（使用原事件名）或对象（自定义名称与参数）。
     */
    duration?: boolean | { event?: string; params?: TrackParams };
}

/** 埋点解析上下文 */
type TrackContext = {
    /** 指令绑定的元素 */
    el: HTMLElement;
    /** 指令绑定信息 */
    binding: DirectiveBinding<TrackDirectiveValue>;
    /** 原生事件对象（触发 click/blur 等时存在） */
    event?: Event;
    /** 曝光观察对象（触发 :view 时存在） */
    entry?: IntersectionObserverEntry;
    /** 到达的停留阶段时长（触发 stay 逻辑时存在） */
    stayed?: number;
    /** 总曝光停留时长（触发 .duration 逻辑时存在） */
    duration?: number;
};

/** 动态解析埋点配置的函数类型 */
type TrackResolver = (context: TrackContext) => string | TrackOptions | null | undefined;
/** 指令值类型：支持字符串、对象配置、解析函数或多事件映射对象 */
type TrackDirectiveValue = string | TrackOptions | TrackResolver | Record<string, string | TrackOptions | TrackResolver>;

/** 解析后的埋点载荷 */
interface TrackResolvedPayload {
    eventName: string | null;
    params: TrackParams;
}

/** 存在元素上的埋点状态记录 */
interface TrackState {
    binding?: DirectiveBinding<TrackDirectiveValue>;
    cleanups: Array<() => void>; // 存储多个清理函数
    eventType?: string;
    observer?: IntersectionObserver;
    onceTracked: boolean;
    wasVisible: boolean;
    stayTimers?: any[]; // 存储 setTimeout 的 ID
    viewStartTime?: number; // 曝光开始时间戳
}

const STATE_KEY = Symbol("track-event");
const VIEW_THRESHOLD = 0.15; // 触发曝光的可见比例阈值

type TrackElement = HTMLElement & {
    [STATE_KEY]?: TrackState;
};

/** 获取或初始化元素的埋点状态 */
function getState(el: HTMLElement) {
    const trackEl = el as TrackElement;
    if (!trackEl[STATE_KEY]) {
        trackEl[STATE_KEY] = {
            onceTracked: false,
            wasVisible: false,
            cleanups: [],
        };
    }

    return trackEl[STATE_KEY]!;
}

/** 清理元素的埋点绑定和状态 */
function clearState(el: HTMLElement) {
    const state = getState(el);
    state.cleanups.forEach(cleanup => cleanup());
    state.cleanups = [];
    state.observer?.disconnect();
    state.observer = undefined;
    state.wasVisible = false;
    state.viewStartTime = undefined;

    if (state.stayTimers) {
        state.stayTimers.forEach(timer => clearTimeout(timer));
        state.stayTimers = undefined;
    }
}

/** 过滤对象中的 undefined 属性 */
function pruneUndefined(input: TrackParams) {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    );
}

/** 解析埋点载荷：支持处理单事件配置与嵌套的 duration 配置 */
function resolvePayload(
    el: HTMLElement,
    binding: DirectiveBinding<TrackDirectiveValue>,
    context: Omit<TrackContext, "binding" | "el">,
    specifiedValue?: any // 新增：支持直接传入解析值（用于多事件模式）
): TrackResolvedPayload {
    let rawValue = specifiedValue ?? (
        typeof binding.value === "function"
            ? (binding.value as TrackResolver)({ el, binding, ...context })
            : binding.value
    );

    // 统一转换为对象格式处理
    if (typeof rawValue === "string") {
        rawValue = { event: rawValue };
    }

    if (!rawValue || typeof rawValue !== "object") {
        return { eventName: null, params: {} };
    }

    let options = { ...(rawValue as TrackOptions) };

    // 支持嵌套配置：如果是总时长统计触发，且有 duration 子配置对象
    if (context.duration && typeof options.duration === 'object') {
        options = { ...options, ...options.duration };
    }

    const {
        event,
        name,
        category,
        label,
        value,
        sendTo,
        nonInteraction,
        transportType,
        params,
    } = options;

    return {
        eventName: event ?? name ?? null,
        params: pruneUndefined({
            event_category: category,
            event_label: label,
            value,
            send_to: sendTo,
            stayed: context.stayed,
            duration: context.duration,
            non_interaction: nonInteraction,
            transport_type: transportType,
            ...params,
        }),
    };
}

/** 执行埋点发送 */
function trackEvent(
    el: HTMLElement,
    gtag: ReturnType<typeof useGtag>["gtag"],
    context: Omit<TrackContext, "binding" | "el">,
    specifiedValue?: any // 显式传入的值（如来自多事件映射）
) {
    const state = getState(el);
    const binding = state.binding;

    if (!binding) return;

    // .once 限制：非 duration 类事件只上报一次
    if (binding.modifiers.once && state.onceTracked && !context.duration) {
        return;
    }

    const payload = resolvePayload(el, binding, context, specifiedValue);
    if (!payload.eventName) {
        console.warn("[v-track] Missing event name.", el);
        return;
    }

    if (Object.keys(payload.params).length > 0) {
        gtag("event", payload.eventName, payload.params);
    } else {
        gtag("event", payload.eventName);
    }

    // 派发自定义全局事件
    if (import.meta.client) {
        window.dispatchEvent(new CustomEvent('track:event', {
            detail: {
                eventName: payload.eventName,
                params: payload.params,
                timestamp: Date.now()
            }
        }));
    }

    if (binding.modifiers.once && !context.duration) {
        state.onceTracked = true;
    }
}

/** 绑定通用 DOM 事件 */
function bindDomEvent(
    el: HTMLElement,
    eventName: string,
    value: any,
    gtag: ReturnType<typeof useGtag>["gtag"],
) {
    const state = getState(el);
    // 关键改进：将 focus/blur 映射为冒泡版本的 focusin/focusout
    // 这样当指令绑定在组件容器（如 RebornInput 的外层 div）上时，也能捕获到内部 input 的聚焦事件
    const realEventName = eventName === 'focus' ? 'focusin' : (eventName === 'blur' ? 'focusout' : eventName);

    const handler = (event: Event) => {
        if (state.binding?.modifiers.prevent) {
            event.preventDefault();
        }
        trackEvent(el, gtag, { event }, value);
    };

    el.addEventListener(realEventName, handler);
    return () => el.removeEventListener(realEventName, handler);
}

/** 绑定曝光与停留追踪 (:view) */
function bindViewEvent(
    el: HTMLElement,
    value: any,
    gtag: ReturnType<typeof useGtag>["gtag"],
) {
    const state = getState(el);
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.target !== el) continue;

                const isVisible = entry.isIntersecting && entry.intersectionRatio >= VIEW_THRESHOLD;
                const options = typeof value === 'object' ? value : null;

                if (isVisible && !state.wasVisible) {
                    // 记录开始时间 (支持 .duration 修饰符或配置对象)
                    if (state.binding?.modifiers.duration || options?.duration) {
                        state.viewStartTime = Date.now();
                    }

                    const stayConfig = options?.stay;
                    if (stayConfig) {
                        const thresholds = Array.isArray(stayConfig) ? stayConfig : [stayConfig];
                        state.stayTimers = thresholds.map(ms => setTimeout(() => {
                            trackEvent(el, gtag, { entry, stayed: ms }, value);
                        }, ms));
                    } else {
                        trackEvent(el, gtag, { entry }, value);
                    }

                    if (state.binding?.modifiers.once && !stayConfig) {
                        observer.disconnect();
                        state.observer = undefined;
                        state.wasVisible = true;
                        return;
                    }
                } else if (!isVisible && state.wasVisible) {
                    // 离开视口处理总时长
                    if ((state.binding?.modifiers.duration || options?.duration) && state.viewStartTime) {
                        const duration = Date.now() - state.viewStartTime;
                        trackEvent(el, gtag, { entry, duration }, value);
                        state.viewStartTime = undefined;
                    }
                    if (state.stayTimers) {
                        state.stayTimers.forEach(timer => clearTimeout(timer));
                        state.stayTimers = undefined;
                    }
                }
                state.wasVisible = isVisible;
            }
        },
        { threshold: VIEW_THRESHOLD }
    );

    observer.observe(el);
    state.observer = observer;

    return () => {
        observer.disconnect();
        if (state.observer === observer) state.observer = undefined;
        if (state.stayTimers) {
            state.stayTimers.forEach(timer => clearTimeout(timer));
            state.stayTimers = undefined;
        }
        // 卸载处理
        const options = typeof value === 'object' ? value : null;
        if ((state.binding?.modifiers.duration || options?.duration) && state.viewStartTime) {
            const duration = Date.now() - state.viewStartTime;
            trackEvent(el, gtag, { duration }, value);
            state.viewStartTime = undefined;
        }
    };
}

/** 根据 arg 或 value 分发绑定逻辑 */
function bindTracking(
    el: HTMLElement,
    binding: DirectiveBinding<TrackDirectiveValue>,
    gtag: ReturnType<typeof useGtag>["gtag"],
) {
    const state = getState(el);
    clearState(el);
    state.binding = binding;

    // 情况 1: 显式使用指令参数，如 v-track:click 或 v-track:view
    if (binding.arg) {
        if (binding.arg === 'view') {
            state.cleanups.push(bindViewEvent(el, binding.value, gtag));
        } else {
            state.cleanups.push(bindDomEvent(el, binding.arg, binding.value, gtag));
        }
        return;
    }

    // 情况 2: 未使用参数，且值为对象，且包含可能的事件名（多事件模式）
    if (typeof binding.value === 'object' && binding.value !== null) {
        const val = binding.value as Record<string, any>;
        // 如果对象包含 event/name，则视为对 click 的单配置
        if ('event' in val || 'name' in val || 'params' in val) {
            state.cleanups.push(bindDomEvent(el, 'click', binding.value, gtag));
        } else {
            // 否则遍历对象，将 Key 视为事件名
            for (const [evt, config] of Object.entries(val)) {
                if (evt === 'view') {
                    state.cleanups.push(bindViewEvent(el, config, gtag));
                } else {
                    state.cleanups.push(bindDomEvent(el, evt, config, gtag));
                }
            }
        }
        return;
    }

    // 情况 3: 默认情况 (如 v-track="'event_name'")
    state.cleanups.push(bindDomEvent(el, 'click', binding.value, gtag));
}

export default defineNuxtPlugin((nuxtApp) => {
    const { gtag } = useGtag();

    const trackDirective: Directive<HTMLElement, TrackDirectiveValue> = {
        mounted(el, binding) {
            bindTracking(el, binding, gtag);
        },
        updated(el, binding) {
            const state = getState(el);
            const oldBinding = state.binding;
            state.binding = binding;

            // 性能优化：如果核心配置（参数或多事件映射的键名）未发生变化，则不重新绑定，仅更新 binding 引用
            // 这样可以防止因父组件更新导致的曝光事件被重复触发（因为 bindTracking 会执行 clearState 重置状态）

            // 1. 如果都有相同的参数 (如 :view)
            if (binding.arg && binding.arg === oldBinding?.arg) {
                return;
            }

            // 2. 如果都是多事件模式（无参数且值为对象），检查事件键名列表是否一致
            if (!binding.arg && !oldBinding?.arg) {
                const oldVal = oldBinding?.value;
                const newVal = binding.value;

                if (oldVal && newVal && typeof oldVal === 'object' && typeof newVal === 'object') {
                    const oldKeys = Object.keys(oldVal).sort().join(',');
                    const newKeys = Object.keys(newVal).sort().join(',');
                    if (oldKeys === newKeys) return;
                }
            }

            // 其余情况（参数变化、从单事件转多事件等），视为配置变更，执行重新绑定
            bindTracking(el, binding, gtag);
        },
        beforeUnmount(el) {
            clearState(el);
            delete (el as TrackElement)[STATE_KEY];
        },
    };

    nuxtApp.vueApp.directive("track", trackDirective);
});
