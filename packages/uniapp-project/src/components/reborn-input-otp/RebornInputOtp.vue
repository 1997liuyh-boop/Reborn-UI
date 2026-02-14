<template>
    <view :class="ui.root({ class: props.customClass })" @tap="onTap()">
        <view :class="ui.inner()">
            <RebornInput ref="inputRef" v-model="value" :type="inputType" :maxlength="length" :disabled="disabled"
                :autofocus="autofocus" :hold-keyboard="false" :clearable="false" customClass="!h-full" @input="onChange"
                @focus="onFocus" @blur="onBlur" />
        </view>
        <view :class="ui.list()">
            <view v-for="(item, index) in list" :key="index" :class="ui.item()"
                :data-active="value.length >= index && isFocus" :data-disabled="disabled" @tap="onTap">
                <text :class="ui.value()" :style="{ color: value.length >= index && isFocus ? props.color : '' }">
                    {{ item }}
                </text>
                <view v-if="value.length == index && isFocus && item == ''" ref="cursorRef" class="cursor"
                    :class="ui.cursor()"></view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type PropType } from "vue";
import theme, { inputOtpSizes, inputOtpColors } from "./reborn-input-otp.config";
import { AnimationEngine, createAnimation } from "@/lib/animation";
import RebornInput from "@/components/reborn-input/RebornInput.vue";

import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'

defineOptions({
    name: "RebornInputOtp"
});

const props = withDefaults(defineProps<{
    ui?: any;
    customClass?: any;
    modelValue?: string;
    autofocus?: boolean;
    length?: number;
    disabled?: boolean;
    inputType?: "text" | "number" | "digit";
    size?: typeof inputOtpSizes[number];
    color?: typeof inputOtpColors[number];
}>(), {
    modelValue: "",
    autofocus: false,
    length: 4,
    disabled: false,
    inputType: "number",
    size: "md",
    color: "primary",
    ui: () => ({})
});
const b = tv(theme)
const emit = defineEmits(["update:modelValue", "done", "focus", "blur"]);

const inputRef = ref<InstanceType<typeof RebornInput> | null>(null);

const cursorRef = ref<any[]>([]);

const value = ref(props.modelValue);

const ui = computed(() => {
    const style = b({
        color: props.color,
        size: props.size,
        disabled: props.disabled,
    });

    return {
        root: (opts?: { class?: any }) => style.root({ class: cn(opts?.class, props.ui?.root) }),
        inner: (opts?: { class?: any }) => style.inner({ class: cn(opts?.class, props.ui?.inner) }),
        list: (opts?: { class?: any }) => style.list({ class: cn(opts?.class, props.ui?.list) }),
        item: (opts?: { class?: any }) => style.item({ class: cn(opts?.class, props.ui?.item) }),
        value: (opts?: { class?: any }) => style.value({ class: cn(opts?.class, props.ui?.value) }),
        cursor: (opts?: { class?: any }) => style.cursor({ class: cn(opts?.class, props.ui?.cursor) }),
    }
});

const isFocus = ref(false);

const list = computed<string[]>(() => {
    const arr = [] as string[];
    for (let i = 0; i < props.length; i++) {
        arr.push(value.value.charAt(i));
    }
    return arr;
});

let animationEngine: AnimationEngine | null = null;

function last<T>(array: T[]): T | null {
    return Array.isArray(array) && array.length > 0 ? array[array.length - 1] : null;
}

async function onCursor() {
    await nextTick();

    if (!cursorRef.value) {
        return;
    }

    // #ifdef APP
    if (animationEngine != null) {
        animationEngine.stop();
    }

    const target = last(cursorRef.value);
    if (target) {
        animationEngine = createAnimation(target, {
            duration: 600,
            loop: -1,
            alternate: true
        })
            .opacity("0", "1")
            .play();
    }
    // #endif
}

function onChange(val: string) {
    emit("update:modelValue", val);

    // 输入完成时触发done事件
    if (val.length == props.length) {
        uni.hideKeyboard();
        emit("done", val);
    }

    // 更新光标动画
    onCursor();
}

function onFocus(e: any) {
    isFocus.value = true;
    emit("focus", e);
    onCursor();
}

function onBlur(e: any) {
    isFocus.value = false;
    emit("blur", e);
    if (animationEngine) {
        animationEngine.stop();
    }
}

function onTap() {
    if (inputRef.value) {
        inputRef.value.focus();
    }
    onCursor();
}

onMounted(() => {
    if (props.autofocus) {
        isFocus.value = true;
        nextTick(() => {
            onTap();
        })
    }

    watch(
        () => props.modelValue,
        (val: string) => {
            value.value = val;
            if (val && isFocus.value) {
                onCursor();
            }
        },
        {
            immediate: true
        }
    );
});
</script>
<style lang="scss" scoped>
.cursor {
    // #ifndef APP
    animation: blink 1s infinite;

    @keyframes blink {
        0% {
            opacity: 1;
        }

        50% {
            opacity: 0;
        }
    }

    // #endif
}
</style>