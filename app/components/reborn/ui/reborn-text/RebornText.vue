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
    /** 是否开启 Tooltip (自动检测省略并显示) */
    tooltip?: boolean;
    /** 是否保留空白 */
    preWrap?: boolean;
    class?: any;
    ui?: Partial<{ base: ClassValue }>;
}

const props = withDefaults(defineProps<RebornTextProps>(), {
    value: null,
    type: "default",
    mask: false,
    currency: "¥",
    precision: 2,
    maskStart: 3,
    maskEnd: 4,
    maskChar: "*",
    ellipsis: false,
    lines: 1,
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
    const formatted = num.toFixed(props.precision);
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (props.currencyPosition === "after") {
        return parts.join(".") + props.currency;
    }
    return props.currency + parts.join(".");
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

/** 省略号自动气泡提示逻辑 */
const textRef = ref<HTMLElement | null>(null);
const isEllipsisActive = ref(false);
const tooltipText = ref("");
let observer: ResizeObserver | null = null;

const checkEllipsis = () => {
    if (!props.tooltip || !textRef.value) {
        isEllipsisActive.value = false;
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

onMounted(() => {
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
    <RebornTooltip :disabled="!props.tooltip || !isEllipsisActive" :content="tooltipText" placement="top">
        <span ref="textRef"
            :class="cn(ui.base({ class: props.class }), { 'cursor-pointer': props.tooltip && isEllipsisActive })"
            :style="textStyle">
            <slot :content="content">{{ content }}</slot>
        </span>
    </RebornTooltip>
</template>
