<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, nextTick, onMounted, shallowRef, useAttrs, useTemplateRef } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import theme, { inputOtpColors, inputOtpSizes } from "./reborn-input-otp.config";
import { tv } from "~/lib/tv";

const b = tv(theme);

defineOptions({ inheritAttrs: false });

export interface InputOtpProps {
    autofocus?: boolean;
    length?: number;
    disabled?: boolean;
    inputType?: "text" | "number";
    size?: (typeof inputOtpSizes)[number];
    color?: (typeof inputOtpColors)[number];
    /** 追加到根节点的自定义类名 */
    class?: any;
    /** 细粒度样式覆盖对象，按 root/inner/list/item/value/cursor 键位重写对应节点类名 */
    ui?: Partial<{
        root: ClassValue;
        inner: ClassValue;
        list: ClassValue;
        item: ClassValue;
        value: ClassValue;
        cursor: ClassValue;
    }>;
}

const props = withDefaults(defineProps<InputOtpProps>(), {
    autofocus: false,
    length: 4,
    disabled: false,
    inputType: "number",
    size: "md",
    color: "primary",
});

const emit = defineEmits<{
    /** 输满 length 位时触发，回调为完整的值 */
    (e: "done", value: string): void;
    /** 隐藏的原生输入框获得焦点时触发 */
    (e: "focus", event: FocusEvent): void;
    /** 隐藏的原生输入框失去焦点时触发 */
    (e: "blur", event: FocusEvent): void;
}>();

/** 输入值（v-model）；未绑定时由 defineModel 内部保存本地值 */
const model = defineModel<string>({ default: "" });

const attrs = useAttrs();
/** 每次渲染读取最新透传样式，避免缓存非响应式 attrs。 */
function rootStyle(): StyleValue {
    return attrs.style as StyleValue;
}
/**
 * 透传属性（id、name、aria-label、data-* 等）语义上属于隐藏的原生 input，落在 input 上；
 * class 已是 prop，style 单独落在根节点
 */
function inputAttrs() {
    const { style: _style, ...rest } = attrs;
    return rest;
}

const inputRef = useTemplateRef<HTMLInputElement>("inputRef");
/** inputmode 随 inputType 切换：text 时要能弹出全键盘输入字母，不能写死 numeric */
const nativeInputmode = computed(() => (props.inputType === "number" ? "numeric" : "text"));
const isFocus = shallowRef(false);

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        color: props.color,
        size: props.size,
        disabled: props.disabled,
    });
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
        list: (opts?: { class?: any }) => styles.list({ class: cn(opts?.class, uiOverrides.value.list) }),
        item: (opts?: { class?: any }) => styles.item({ class: cn(opts?.class, uiOverrides.value.item) }),
        value: (opts?: { class?: any }) => styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
        cursor: (opts?: { class?: any }) => styles.cursor({ class: cn(opts?.class, uiOverrides.value.cursor) }),
    };
});

const list = computed<string[]>(() => {
    const arr: string[] = [];
    for (let i = 0; i < props.length; i++) {
        arr.push(model.value.charAt(i));
    }
    return arr;
});

function onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    let val = target.value;
    if (props.inputType === "number") {
        val = val.replace(/\D/g, "");
    }
    val = val.slice(0, props.length);
    target.value = val;
    // 受控绑定下赋值后同步读 model 仍是旧值，下面的判断与事件载荷都用本地的 val
    model.value = val;
    if (val.length === props.length) {
        emit("done", val);
        inputRef.value?.blur();
    }
}

function onFocus(e: FocusEvent) {
    isFocus.value = true;
    emit("focus", e);
}

function onBlur(e: FocusEvent) {
    isFocus.value = false;
    emit("blur", e);
}

function onClick() {
    inputRef.value?.focus();
}

onMounted(() => {
    if (props.autofocus) {
        nextTick(() => inputRef.value?.focus());
    }
});
</script>

<template>
    <div :class="ui.root({ class: props.class })" :style="rootStyle()" @click="onClick">
        <div :class="ui.inner()">
            <input v-bind="inputAttrs()" ref="inputRef" :value="model" :type="inputType === 'number' ? 'tel' : 'text'" :maxlength="length"
                :disabled="disabled" :autofocus="autofocus" autocomplete="one-time-code" :inputmode="nativeInputmode"
                class="h-full w-full opacity-0" @input="onInput" @focus="onFocus" @blur="onBlur" />
        </div>
        <div :class="ui.list()">
            <div v-for="(item, index) in list" :key="index" :class="ui.item()"
                :data-active="model.length === index && isFocus" :data-disabled="disabled" @click="onClick">
                <span :class="ui.value()">{{ item }}</span>
                <span v-if="model.length === index && isFocus && item === ''" class="otp-cursor" :class="ui.cursor()" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.otp-cursor {
    animation: blink 1s infinite;
}

@keyframes blink {
    0% {
        opacity: 1;
    }

    50% {
        opacity: 0;
    }
}
</style>
