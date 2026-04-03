<template>
    <div :class="ui.root()" :style="rootStyle" ref="couponRef">
        <div :class="ui.left()" :style="leftStyle" v-if="$slots.left">
            <slot name="left"></slot>
        </div>
        <div :style="centerStyle"></div>
        <div :class="ui.right()" v-if="$slots.right">
            <slot name="right"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { tv } from '~/lib/tv'
import theme, { type CouponType, type CouponDirection, type CouponPosition, type CouponSplit } from './reborn-coupon.config'

export interface RebornCouponProps {
    type?: CouponType
    width?: string | number
    height?: string | number
    radius?: number
    direction?: CouponDirection
    position?: CouponPosition
    offset?: number
    corner?: number
    gap?: number
    split?: CouponSplit
    size?: number
    class?: any
    ui?: {
        root?: any
        left?: any
        right?: any
        center?: any
    }
    hoverable?: boolean
}

const props = withDefaults(defineProps<RebornCouponProps>(), {
    type: 'notch',
    width: '100%',
    height: 'auto',
    radius: 10,
    direction: 'horizontal',
    position: 'start',
    offset: 50,
    corner: 20,
    gap: 14,
    split: 'dotted',
    size: 4,
    class: '',
    ui: () => ({}),
    hoverable: false
})

const ui = computed(() => {
    const b = tv(theme)({
        direction: props.direction as any,
        hoverable: props.hoverable
    })
    return {
        root: () => b.root({ class: [props.ui?.root, props.class] }),
        left: () => b.left({ class: [props.ui?.left] }),
        right: () => b.right({ class: [props.ui?.right] }),
        center: () => b.center({ class: [props.ui?.center] })
    }
})

const state = reactive({
    offsetWidth: 0,
    offsetHeight: 0
})

const couponRef = ref<HTMLElement | null>(null)

const leftStyle = computed(() => {
    if (!['notch', 'perforated'].includes(props.type)) return {}

    const basis = props.position === 'center'
        ? '50%'
        : props.position === 'end'
            ? `calc(100% - ${props.offset}px)`
            : `${props.offset}px`

    if (props.direction === 'vertical') {
        return {
            flexBasis: `calc(${basis} - ${props.radius}px)`,
            width: `calc(${basis} - ${props.radius}px)`,
        }
    }
    return {
        flexBasis: `calc(${basis} - ${props.radius}px)`,
        height: `calc(${basis} - ${props.radius}px)`,
    }
})

const centerStyle = computed(() => {
    if (!['notch', 'perforated'].includes(props.type as string)) return {
        display: 'none'
    }
    const r = `${props.radius * 2}px`
    if (props.direction === 'vertical') {
        const h = typeof props.height === 'number' ? `${props.height}px` : props.height
        return { display: 'block', width: r }
    }
    // horizontal
    const w = typeof props.width === 'number' ? `${props.width}px` : props.width
    return { display: 'block', height: r }
})

onMounted(() => {
    if (couponRef.value) {
        const { width, height } = couponRef.value.getBoundingClientRect()
        state.offsetWidth = width
        state.offsetHeight = height
    }
})

// 基于 type 的统一遮罩逻辑
const maskStyle = computed(() => {
    const type = props.type
    const direction = props.direction
    const radius = props.radius
    const position = props.position
    const offsetValue = props.offset
    const corner = props.corner

    if (type === 'notch') {
        const offset = position === 'center' ? '50%' : offsetValue + 'px'
        const maskPosition = `${direction === 'horizontal' ? '' : '0 '}${position === 'end' ? '' : '-'}${radius}px`

        return {
            '-webkit-mask-image': `radial-gradient(circle at ${position === 'end' ? 'right ' : ''}${direction === 'horizontal' ? radius + 'px' : offset} ${position === 'end' ? 'bottom ' : ''}${direction === 'horizontal' ? offset : radius + 'px'}, transparent ${radius}px, red ${radius}.5px)`,
            '-webkit-mask-position': maskPosition,
        }
    }

    if (type === 'ticket') {
        return {
            '-webkit-mask-image': `radial-gradient(circle at ${corner}px ${corner}px, transparent ${corner}px, red ${corner}.5px)`,
            '-webkit-mask-position': `-${corner}px -${corner}px`
        }
    }

    if (type === 'stamp') {
        const gap = `${props.gap * 1 + radius * 2}px`
        const size = direction === 'horizontal' ? `100% ${gap}` : `${gap} 100%`
        const maskPosition = `${direction === 'horizontal' ? '' : '50% '}-${radius}px`
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`

        const imageMap: Record<string, string> = { horizontal, vertical }

        return {
            '-webkit-mask-image': imageMap[direction],
            '-webkit-mask-position': maskPosition,
            '-webkit-mask-size': size,
        }
    }

    if (type === 'perforated') {
        const offset = position === 'center' ? '50%' : offsetValue + 'px'
        const maskPosition = `${direction === 'horizontal' ? '' : '0 '}${position === 'end' ? '' : '-'}${radius}px`
        const split = props.split === 'dashed'
            ? `, linear-gradient(${direction === 'horizontal' ? '90deg, ' : ''}transparent 25%, red 0, red 75%, transparent 0)`
            : (props.split === 'dotted' ? `, radial-gradient(closest-side circle at 50%, red 99%, transparent 100%)` : '')

        const sizeStr = direction === 'horizontal'
            ? `${props.split === 'dashed' ? props.gap * 2 : (~~props.size + ~~props.gap)}px ${props.size}px`
            : `${props.size}px ${props.split === 'dashed' ? props.gap * 2 : (~~props.size + ~~props.gap)}px`

        const getPrimaryPos = () => {
            if (position === 'center') return '50%'
            if (position === 'end') return `calc(100% - ${offsetValue - props.size / 2}px)`
            return `${offsetValue - props.size / 2}px`
        }

        const splitPosXY = direction === 'horizontal'
            ? `${radius}px ${getPrimaryPos()}`
            : `${getPrimaryPos()} ${radius}px`

        return {
            '-webkit-mask-image': `radial-gradient(circle at ${position === 'end' ? 'right ' : ''}${direction === 'horizontal' ? radius + 'px' : offset} ${position === 'end' ? 'bottom ' : ''}${direction === 'horizontal' ? offset : radius + 'px'}, transparent ${radius}px, red ${radius}.5px)${split}`,
            '-webkit-mask-size': `100%, ${sizeStr}`,
            '-webkit-mask-repeat': `repeat, ${direction === 'horizontal' ? 'repeat-x' : 'repeat-y'}`,
            '-webkit-mask-position': `${maskPosition}, ${splitPosXY}`,
            '-webkit-mask-composite': 'source-out',
            'mask-composite': 'subtract',
        }
    }

    if (type === 'combined') {
        const gap = `${props.gap * 1 + radius * 2}px`
        const size = direction === 'horizontal' ? `100% ${gap}` : `${gap} 100%`
        const maskPosition = `${direction === 'horizontal' ? '' : '50% '}-${radius}px`
        const horizontal = `radial-gradient(circle at ${radius}px, transparent ${radius}px, red ${radius}.5px)`
        const vertical = `radial-gradient(circle at 50% ${radius}px, transparent ${radius}px, red ${radius}.5px)`

        const imageMap: Record<string, string> = { horizontal, vertical }

        return {
            '-webkit-mask-image': imageMap[direction] + `, radial-gradient(circle at ${corner}px ${corner}px, red ${corner}px, transparent ${corner}.5px)`,
            '-webkit-mask-position': maskPosition + `, -${corner}px -${corner}px`,
            '-webkit-mask-size': size + ', 100%',
            '-webkit-mask-composite': 'source-out, destination-over',
            'mask-composite': 'subtract, add',
        }
    }

    return {}
})

const rootStyle = computed(() => {
    const w = typeof props.width === 'number' ? `${props.width}px` : props.width
    const h = typeof props.height === 'number' ? `${props.height}px` : props.height
    return {
        width: w,
        height: h,
        ...maskStyle.value
    }
})
</script>
