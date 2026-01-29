<script lang="ts">
export interface RebornCollapseProps {
    customClass?: any
    ui?: {
        root?: any
        trigger?: any
        content?: any
    }
}
</script>
<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { cn } from '@/lib/utils'
import { tv } from '@/lib/tv'
import theme from './reborn-collapse.config'

const props = withDefaults(defineProps<RebornCollapseProps>(), {
    customClass: '',
    ui: () => ({})
})

const collapse = defineModel("modelValue", {
    type: Boolean,
    default: false
})

const b = tv(theme)
const ui = computed(() => b())
const overrides = computed(() => props.ui || {})

const contentRef = ref<HTMLElement | null>(null)
const height = ref(0)
const isOpened = ref(false)

function updateHeight() {
    if (contentRef.value) {
        height.value = contentRef.value.scrollHeight
    }
}

function show() {
    isOpened.value = true
    // Wait for display:block (if inherent) or just ensuring Ref is ready
    nextTick(() => {
        updateHeight()
    })
}

function hide() {
    isOpened.value = false
    height.value = 0
}

function toggle() {
    if (isOpened.value) {
        hide()
    } else {
        show()
    }
}

watch(
    () => collapse.value,
    (val) => {
        if (val) show()
        else hide()
    },
    { immediate: true }
)

// Optional: ResizeObserver to update height if content changes while open
onMounted(() => {
    if (contentRef.value) {
        const resizeObserver = new ResizeObserver(() => {
            if (isOpened.value) {
                updateHeight()
            }
        })
        resizeObserver.observe(contentRef.value)
    }
})

defineExpose({
    show,
    hide,
    toggle,
    resize: updateHeight
})
</script>

<template>
    <div :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
        <div @click="toggle">
            <slot :open="isOpened" />
        </div>
        <div :class="ui.trigger({ class: overrides?.trigger })" :style="{ height: isOpened ? height + 'px' : '0px' }">
            <div ref="contentRef" class="reborn-collapse__content" :class="ui.content({ class: overrides?.content })">
                <slot name="content"></slot>
            </div>
        </div>
    </div>
</template>
