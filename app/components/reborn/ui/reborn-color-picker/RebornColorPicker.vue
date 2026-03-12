<script setup lang="ts">
import { computed } from 'vue'
import theme from './reborn-color-picker.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import RebornButton from '../reborn-button/RebornButton.vue'
import RebornColorPickerPanel from './RebornColorPickerPanel.vue'

interface Props {
    modelValue?: string
    disabled?: boolean
    size?: 'xs' | 'sm' | 'md' | 'lg',
    ui?: {
        root?: string
        base?: string
        icon?: string
    }
}

const open = ref(false)

const props = withDefaults(defineProps<Props>(), {
    modelValue: '#000000',
    disabled: false,
    size: 'md',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

// --- 颜色值计算属性 ---
const colorValue = computed({
    get: () => props.modelValue!,
    set: (val: string) => emit('update:modelValue', val),
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        size: props.size,
        disabled: props.disabled,
        open: open.value,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    }
})
</script>

<template>
    <RebornPopover v-model:open="open" :disabled="disabled" arrow>
        <!-- 触发器插槽 -->
        <slot>
            <div :class="ui.root()">
                <div :class="ui.base()" :style="{ backgroundColor: colorValue }">
                    <Icon name="lucide:chevron-down" :class="ui.icon()" />
                </div>
            </div>
        </slot>

        <!-- 颜色选择面板 -->
        <template #content>
            <RebornColorPickerPanel v-model="colorValue" />
        </template>
    </RebornPopover>
</template>
