<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { textColors } from "./reborn-text.config";
import { tv } from "~/lib/tv";
import RebornTooltip from "../reborn-tooltip/RebornTooltip.vue";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export interface RebornTextProps {
    /** 文本颜色 */
    color?: (typeof textColors)[number];
    /** 字体大小 px */
    size?: number;
    /** 显示的值 */
    value?: string | number | null;
    /** 文本类型: default | phone | name | amount | card | email */
    type?: string;
    /** 是否开启脱敏 */
    mask?: boolean;
    /** 金额货币符号 */
    currency?: string;
    /** 货币符号位置 */
    currencyPosition?: "before" | "after";
    /** 金额小数位数 */
    precision?: number;
    /** 脱敏起始位置 */
    maskStart?: number;
    /** 脱敏结束位置 */
    maskEnd?: number;
    /** 脱敏替换字符 */
    maskChar?: string;
    /** 是否省略号 */
    ellipsis?: boolean;
    /** 最大行数 */
    lines?: number;
    /** 省略号位置：end 尾部省略（保留开头）、start 头部省略（保留结尾）、middle 中间省略（保留首尾），仅 ellipsis 为 true 时生效 */
    ellipsisPosition?: "start" | "middle" | "end";
    /** 是否开启 Tooltip (自动检测省略并显示) */
    tooltip?: boolean;
    /** 是否保留空白 */
    preWrap?: boolean;
    class?: any;
    /** 是否开启千分位符 */
    thousandsIcon?: string;
    ui?: Partial<{ base: ClassValue; currency: ClassValue }>;
}

const props = withDefaults(defineProps<RebornTextProps>(), {
    value: null,
    type: "default",
    mask: false,
    currency: "",
    precision: 2,
    maskStart: 3,
    maskEnd: 4,
    maskChar: "*",
    ellipsis: false,
    lines: 1,
    ellipsisPosition: "end",
    tooltip: false,
    preWrap: false,
});

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        color: props.color,
        preWrap: props.preWrap,
        ellipsis: props.ellipsis,
    });
    return {
        base: (opts?: { class?: any }) =>
            styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        currency: (opts?: { class?: any }) =>
            cn(opts?.class, uiOverrides.value.currency),
    };
});

const textStyle = computed(() => {
    const style: Record<string, any> = {};
    if (props.ellipsis) {
        style["-webkit-line-clamp"] = props.lines;
        style["line-clamp"] = props.lines;
        style["-webkit-box-orient"] = "vertical";
        style["display"] = "-webkit-box";
        style["overflow"] = "hidden";
        style["word-break"] = "break-all";
    }
    if (props.size) {
        style.fontSize = `${props.size}px`;
    }
    return style;
});

function formatPhone(phone: string): string {
    if (phone.length !== 11 || !props.mask) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, `$1${props.maskChar.repeat(4)}$2`);
}

function formatName(name: string): string {
    if (name.length <= 1 || !props.mask) return name;
    if (name.length === 2) return name[0] + props.maskChar;
    return name[0] + props.maskChar.repeat(name.length - 2) + name[name.length - 1];
}

function formatAmount(amount: string | number): string {
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    if (isNaN(num)) return typeof amount === "string" ? amount : "";
    const formatted = num.toFixed(props.precision);
    const parts = formatted.split(".");
    // 千位符
    const integerPart = (parts[0] ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, props.thousandsIcon || "");
    return [integerPart, ...parts.slice(1)].join(".");
}

function formatCard(card: string): string {
    if (card.length < 8 || !props.mask) return card;
    const start = card.substring(0, props.maskStart);
    const end = card.substring(card.length - props.maskEnd);
    const middle = props.maskChar.repeat(card.length - props.maskStart - props.maskEnd);
    return start + middle + end;
}

function formatEmail(email: string): string {
    if (!props.mask) return email;
    const atIndex = email.indexOf("@");
    if (atIndex === -1) return email;
    const username = email.substring(0, atIndex);
    const domain = email.substring(atIndex);
    if (username.length <= 2) return email;
    return username[0] + props.maskChar.repeat(username.length - 2) + username[username.length - 1] + domain;
}

const content = computed(() => {
    const val = props.value ?? "";
    switch (props.type) {
        case "phone": return formatPhone(val as string);
        case "name": return formatName(val as string);
        case "amount": return formatAmount(val as number);
        case "card": return formatCard(val as string);
        case "email": return formatEmail(val as string);
        default: return val;
    }
});

/** 省略号字符，与 CSS 尾部省略显示的字符一致 */
const ELLIPSIS_MARK = "…";

/** 头部 / 中间省略：CSS line-clamp 只能截断尾部，这两种位置改为逐字测量后写入截断文本 */
const isJsClamp = computed(() => props.ellipsis && props.ellipsisPosition !== "end");
/** 原文节点：始终承载插槽内容；截断生效后转为仅读屏可见，用于读取全文和无障碍朗读 */
const sourceRef = ref<HTMLElement | null>(null);
/** 截断结果节点：文本由 runClamp 直接写入、不经 Vue 渲染，测量时反复改写也不会触发重渲染 */
const clampRef = ref<HTMLElement | null>(null);
/** 截断结果是否已写入；写入前原文照常显示（SSR 首屏和挂载前是 CSS 尾部省略），避免出现空白 */
const clampReady = ref(false);
/** 截断后是否确实省略了内容 */
const clampTruncated = ref(false);
/** 参与截断的完整纯文本，同时作为气泡文案 */
const clampFullText = ref("");

/** 省略号自动气泡提示逻辑 */
const textRef = ref<HTMLElement | null>(null);
const isEllipsisActive = ref(false);
const tooltipText = ref("");
let observer: ResizeObserver | null = null;

/** 气泡宽度下限，取 RebornTooltip 设计稿的 240px：文本比它窄时仍按 240px 折行，避免气泡挤成细长条 */
const TOOLTIP_MIN_WIDTH = 240;
/** 文本节点当前的渲染宽度 */
const textWidth = ref(0);
/** 气泡宽度跟随文本宽度，不低于下限；全文较短时气泡仍按内容收窄 */
const tooltipBodyStyle = computed(() => ({ maxWidth: `${Math.max(TOOLTIP_MIN_WIDTH, textWidth.value)}px` }));

const checkEllipsis = () => {
    if (!props.tooltip || !textRef.value) {
        isEllipsisActive.value = false;
        return;
    }

    textWidth.value = textRef.value.getBoundingClientRect().width;

    // 头部 / 中间省略以截断结果为准，气泡展示截断前的完整文本
    if (isJsClamp.value) {
        isEllipsisActive.value = clampTruncated.value;
        tooltipText.value = clampFullText.value;
        return;
    }

    const el = textRef.value;

    // 由于我们使用了 display: -webkit-box 来实现多行和单行截断，
    // 前端文本截断后会自动换行（隐藏在盒子模型外），
    // 所以不论是单行还是多行，超出时 scrollHeight 都会大于 clientHeight。
    // 我们综合检查宽高的溢出来确保兼容性。
    isEllipsisActive.value = el.scrollHeight > el.clientHeight + 0.5 || el.scrollWidth > el.clientWidth + 0.5;

    // 获取实际的文本供 Tooltip 显示
    if (isEllipsisActive.value) {
        tooltipText.value = content.value ? String(content.value) : (el.textContent || '').trim();
    }
};

/** line-clamp 截掉的部分仍计入 scrollHeight，超出可视高度即表示 lines 行内放不下 */
const fitsInLines = (el: HTMLElement) => el.scrollHeight <= el.clientHeight + 0.5;

/** 保留 keep 个字符时的候选文本；middle 模式下前半段多分一个字符 */
function buildClampText(chars: string[], keep: number, position: "start" | "middle"): string {
    if (position === "start") return ELLIPSIS_MARK + chars.slice(chars.length - keep).join("");
    const head = Math.ceil(keep / 2);
    return chars.slice(0, head).join("") + ELLIPSIS_MARK + chars.slice(chars.length - (keep - head)).join("");
}

/**
 * 二分出 lines 行内最多能保留的字符数。
 * 直接在真实节点上判定，容器宽度、字号、换行规则都原样参与；
 * 每轮改写触发一次同步排版，n 个字符约 log2(n) 轮，全程在同一个任务里完成，浏览器不会绘制中间态。
 */
function clampText(el: HTMLElement, clampEl: HTMLElement, full: string, position: "start" | "middle") {
    clampEl.textContent = full;
    if (fitsInLines(el)) return { text: full, truncated: false };

    // 按码点切分，避免把 emoji 等代理对从中间截断成乱码
    const chars = Array.from(full);
    let fit = 0;
    let overflow = chars.length;
    while (overflow - fit > 1) {
        const mid = (fit + overflow) >> 1;
        clampEl.textContent = buildClampText(chars, mid, position);
        if (fitsInLines(el)) fit = mid;
        else overflow = mid;
    }
    return { text: buildClampText(chars, fit, position), truncated: true };
}

/** 读取原文并写入截断结果 */
const runClamp = () => {
    const el = textRef.value;
    const sourceEl = sourceRef.value;
    const clampEl = clampRef.value;
    // 宽度为 0（如处于隐藏的标签页）时测不出有效结果，保留现状，等可见后由 ResizeObserver 再触发
    if (!isJsClamp.value || !el || !sourceEl || !clampEl || el.clientWidth === 0) return;

    const raw = sourceEl.textContent ?? "";
    // 未开 preWrap 时浏览器本就会折叠空白，这里同步折叠，模板里的缩进和换行不占截断名额
    const full = props.preWrap ? raw : raw.replace(/\s+/g, " ").trim();
    // 先让原文退出排版，测量时块内只剩截断节点；Vue 随后按 clampReady 渲染出同样的类名
    sourceEl.classList.add("sr-only");
    const { text, truncated } = clampText(el, clampEl, full, props.ellipsisPosition as "start" | "middle");
    clampEl.textContent = text;
    clampFullText.value = full;
    clampTruncated.value = truncated;
    clampReady.value = true;
    checkEllipsis();
};

let clampResizeObserver: ResizeObserver | null = null;
let clampMutationObserver: MutationObserver | null = null;
let clampFrame: number | null = null;
/** 当前已建立测量的根节点；开关 tooltip 会切换模板分支、换成新节点，需要据此重建 */
let clampHost: HTMLElement | null = null;

/** 合并同一帧内的多次触发；rAF 在绘制前执行，内容变化后不会先闪一帧旧结果 */
const scheduleClamp = () => {
    if (clampFrame !== null) return;
    clampFrame = requestAnimationFrame(() => {
        clampFrame = null;
        runClamp();
    });
};

/** 向上跳过行内外壳（如 RebornTooltip 的 inline-flex 触发器），找到真正决定可用宽度的祖先 */
function findLayoutAncestor(el: HTMLElement): HTMLElement | null {
    let node = el.parentElement;
    while (node && /^(?:inline|contents)/.test(getComputedStyle(node).display)) node = node.parentElement;
    return node;
}

const stopClampObservers = () => {
    clampResizeObserver?.disconnect();
    clampResizeObserver = null;
    clampMutationObserver?.disconnect();
    clampMutationObserver = null;
    if (clampFrame !== null) {
        cancelAnimationFrame(clampFrame);
        clampFrame = null;
    }
};

const startClampObservers = (el: HTMLElement) => {
    // 截断后自身宽度可能随内容收缩（如 tooltip 触发器是 inline-flex），只监听自身会错过容器变宽，所以连同布局祖先一起监听
    clampResizeObserver = new ResizeObserver(scheduleClamp);
    clampResizeObserver.observe(el);
    const ancestor = findLayoutAncestor(el);
    if (ancestor) clampResizeObserver.observe(ancestor);

    // 插槽或 value 变化会改写原文节点
    if (sourceRef.value) {
        clampMutationObserver = new MutationObserver(scheduleClamp);
        clampMutationObserver.observe(sourceRef.value, { childList: true, characterData: true, subtree: true });
    }
};

/** 按当前模式建立或拆除测量；关闭后原文节点恢复可见，回到 CSS 尾部省略 */
const syncClamp = () => {
    const el = isJsClamp.value ? textRef.value : null;
    if (el === clampHost) return;
    clampHost = el;
    stopClampObservers();
    if (!el) {
        clampReady.value = false;
        clampTruncated.value = false;
        nextTick(checkEllipsis);
        return;
    }
    runClamp();
    startClampObservers(el);
};

watch([isJsClamp, textRef], syncClamp, { flush: "post" });

// 行数、字号、换行规则变化会改变可容纳的字符数，start / middle 互切会改变截断方式
watch(() => [props.lines, props.ellipsisPosition, props.size, props.preWrap], () => {
    if (isJsClamp.value) scheduleClamp();
}, { flush: "post" });

onMounted(() => {
    syncClamp();
    // Web 字体加载完成后字宽会变，但块高度被 lines 锁住，ResizeObserver 感知不到，需要补算一次
    document.fonts?.ready.then(() => {
        if (isJsClamp.value) scheduleClamp();
    });

    if (props.tooltip && textRef.value) {
        // 渲染完成后稍微延迟检查，确保字体和布局完全就绪
        nextTick(() => {
            nextTick(checkEllipsis);
        });

        observer = new ResizeObserver(() => {
            checkEllipsis();
        });
        observer.observe(textRef.value);
    }
});

onBeforeUnmount(() => {
    stopClampObservers();
    if (observer) {
        observer.disconnect();
        observer = null;
    }
});

// 当内容或样式参数变化时，重新检查
watch(() => [content.value, props.lines, props.size, props.ellipsis, props.tooltip], () => {
    nextTick(() => {
        nextTick(checkEllipsis);
    });
});
</script>

<template>
  <!-- 面板默认 max-w-60 写死 240px，这里放开上限、去掉内边距，由下方内容节点按文本宽度约束 -->
  <!-- 截断后悬停可看全文：用帮助光标提示这里有气泡，文字本身不可点，不用手型 -->
  <RebornTooltip v-if="props.tooltip" :disabled="!isEllipsisActive" placement="top" :ui="{ content: 'max-w-none p-0' }">
    <span
      ref="textRef" :class="cn(ui.base({ class: props.class }), { 'cursor-help': isEllipsisActive })"
      :style="textStyle"
    >
      <span ref="sourceRef" :class="{ 'sr-only': clampReady }">
        <slot :content="content">
          <template v-if="props.currency">
            <span v-if="props.currencyPosition !== 'after'" :class="ui.currency()">{{ props.currency }}</span>
            <span>{{ content }}</span>
            <span v-if="props.currencyPosition === 'after'" :class="ui.currency()">{{ props.currency }}</span>
          </template>
          <template v-else>
            {{ content }}
          </template>
        </slot>
      </span>
      <!-- 头部 / 中间省略的截断结果；读屏走上面的原文节点，这里对辅助技术隐藏 -->
      <span v-if="isJsClamp" ref="clampRef" aria-hidden="true" />
    </span>
    <template #content>
      <!-- 内边距挪到这一层：max-width 按 border-box 计算，面板外宽正好等于文本宽度 -->
      <span class="p-2" :style="tooltipBodyStyle">{{ tooltipText }}</span>
    </template>
  </RebornTooltip>
  <span v-else ref="textRef" :class="ui.base({ class: props.class })" :style="textStyle">
    <span ref="sourceRef" :class="{ 'sr-only': clampReady }">
      <slot :content="content">
        <template v-if="props.currency">
          <span v-if="props.currencyPosition !== 'after'" :class="ui.currency()">{{ props.currency }}</span>
          <span>{{ content }}</span>
          <span v-if="props.currencyPosition === 'after'" :class="ui.currency()">{{ props.currency }}</span>
        </template>
        <template v-else>
          {{ content }}
        </template>
      </slot>
    </span>
    <!-- 头部 / 中间省略的截断结果；读屏走上面的原文节点，这里对辅助技术隐藏 -->
    <span v-if="isJsClamp" ref="clampRef" aria-hidden="true" />
  </span>
</template>
