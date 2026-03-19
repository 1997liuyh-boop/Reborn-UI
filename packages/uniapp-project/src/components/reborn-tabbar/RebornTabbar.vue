<script lang="ts">
export default {
    name: 'reborn-tabbar',
    options: {
        virtualHost: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { tabbarAnimations, tabbarColors, tabbarShapes } from './reborn-tabbar.config'
import { useChildren } from '@/composables/useChildren'
import { TABBAR_KEY } from './types'
import type { TabbarItem } from './types'

export interface TabbarProps {
    modelValue?: number | string
    fixed?: boolean
    bordered?: boolean
    safeAreaInsetBottom?: boolean
    pureIcon?: boolean
    shape?: (typeof tabbarShapes)[number]
    animation?: (typeof tabbarAnimations)[number] | null
    ballColors?: string[]
    activeColor?: string
    inactiveColor?: string
    placeholder?: boolean
    zIndex?: number
    color?: (typeof tabbarColors)[number]
    customClass?: any
    customStyle?: string
    ui?: Partial<Record<'root' | 'base' | 'dropBall' | 'flyBallsContainer' | 'flyBallItem', string>>
    ballShiftY?: number
    beforeChange?: (params: { name: string | number }, done: (shouldProceed?: boolean) => void) => boolean | Promise<boolean> | void
}

const props = withDefaults(defineProps<TabbarProps>(), {
    modelValue: 0,
    fixed: false,
    bordered: true,
    safeAreaInsetBottom: false,
    pureIcon: false,
    shape: 'normal',
    animation: null,
    placeholder: true,
    zIndex: 99,
    color: 'primary',
    customStyle: '',
    ballColors: () => ['#ff6675', '#ffb03b', '#35b6f2', '#3ac29e']
})

const emit = defineEmits(['change', 'update:modelValue'])

const b = tv(theme)
const { proxy } = getCurrentInstance() as any
const { linkChildren, children } = useChildren(TABBAR_KEY)

const height = ref<number | string>('')
const locked = ref(false)
const isTransition = ref(false)
const oldIndexRef = ref(0)
const newIndexRef = ref(0)
const dropBallLeft = ref(0)
const dropBallStartLeft = ref(0)
const dropBallTop = ref(-16)
const dropBallSize = ref(44)
const dropBallReady = ref(false)
const dropBallAnimating = ref(false)
const pendingDropAnimation = ref(false)
const dropBallVisible = computed(() => {
    if (props.animation !== 'drop' || !dropBallReady.value) {
        return false
    }
    if (props.shape === 'round') {
        return dropBallAnimating.value
    }
    return true
})

let transitionTimer: ReturnType<typeof setTimeout> | null = null
let layoutTimer: ReturnType<typeof setTimeout> | null = null
let unlockTimer: ReturnType<typeof setTimeout> | null = null

const DROP_ANIMATION_DURATION = 480

linkChildren({
    props,
    setChange,
    locked,
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        shape: props.shape as any,
        pureIcon: props.pureIcon,
        fixed: props.fixed,
        bordered: props.bordered,
        animation: props.animation as any,
        safeAreaInsetBottom: props.safeAreaInsetBottom,
        color: props.color as any,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        dropBall: (opts?: { class?: any }) => styles.dropBall({ class: cn(opts?.class, uiOverrides.value.dropBall) }),
        flyBallsContainer: (opts?: { class?: any }) => styles.flyBallsContainer({ class: cn(opts?.class, uiOverrides.value.flyBallsContainer) }),
        flyBallItem: (opts?: { class?: any }) => styles.flyBallItem({ class: cn(opts?.class, uiOverrides.value.flyBallItem) }),
    }
})

const rootStyle = computed(() => {
    const style: CSSProperties = {}
    if (props.zIndex !== undefined) {
        style['z-index'] = props.zIndex
    }
    return style
})

const placeholderStyle = computed(() => {
    if (props.fixed && props.placeholder && height.value) {
        return { height: `${height.value}px` }
    }
    return {}
})

const presets = computed(() => {
    return props.ballColors.map((color, index) => ({
        top: 35 - index * 2,
        width: 12,
        height: 12,
        offsetXStart: index,
        shiftY: props.ballShiftY || -5,
        backgroundColor: color,
    }))
})

const ballCount = computed(() => props.ballColors.length || 3)

const activeIndex = computed(() => {
    const index = children.findIndex((child: any, idx: number) => getChildName(child, idx) === props.modelValue)
    return index >= 0 ? index : 0
})

function getChildName(child: any, index: number) {
    const childProps = child?.$props || {}
    return childProps.name !== undefined ? childProps.name : index
}

function getDropMetrics(itemRect: any, baseRect: any) {
    const size = props.shape === 'round' ? 32 : 44
    const top = props.shape === 'round' ? -10 : -22
    return {
        left: itemRect.left - baseRect.left + itemRect.width / 2 - size / 2,
        top,
        size,
    }
}

function getFallbackRect(baseRect: any, index: number, count: number) {
    const safeCount = Math.max(count, 1)
    const width = baseRect.width / safeCount
    return {
        left: baseRect.left + width * index,
        width,
        height: baseRect.height,
    }
}

function syncDropIndicator(animate = false) {
    if (props.animation !== 'drop') {
        dropBallReady.value = false
        dropBallAnimating.value = false
        pendingDropAnimation.value = false
        return
    }

    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-tabbar-base').boundingClientRect()
    query.selectAll('.reborn-tabbar-trigger').boundingClientRect()
    query.exec((res: any[]) => {
        const baseRect = res?.[0]
        const rects = (res?.[1] || []).filter(Boolean)
        if (!baseRect) return

        const targetRect = rects[activeIndex.value] || getFallbackRect(baseRect, activeIndex.value, children.length || 1)
        const metrics = getDropMetrics(targetRect, baseRect)

        dropBallTop.value = metrics.top
        dropBallSize.value = metrics.size

        if (!dropBallReady.value) {
            dropBallReady.value = true
            dropBallStartLeft.value = metrics.left
            dropBallLeft.value = metrics.left
            return
        }

        if (!animate) {
            dropBallAnimating.value = false
            dropBallStartLeft.value = metrics.left
            dropBallLeft.value = metrics.left
            return
        }

        dropBallStartLeft.value = dropBallLeft.value
        dropBallAnimating.value = false
        setTimeout(() => {
            dropBallLeft.value = metrics.left
            dropBallAnimating.value = true
        }, 16)
    })
}

function scheduleLayoutSync(animate = false, delay = 0) {
    if (layoutTimer) clearTimeout(layoutTimer)
    layoutTimer = setTimeout(() => {
        nextTick(() => {
            syncDropIndicator(animate)
            setPlaceholderHeight()
        })
    }, delay)
}

watch(
    () => [props.fixed, props.placeholder, props.shape, props.safeAreaInsetBottom, props.animation, props.bordered, props.pureIcon],
    () => {
        scheduleLayoutSync(false, 16)
    }
)

watch(
    () => children.length,
    () => {
        scheduleLayoutSync(false, 16)
    }
)

watch(
    () => props.modelValue,
    () => {
        const shouldAnimate = props.animation === 'drop' && pendingDropAnimation.value
        scheduleLayoutSync(shouldAnimate, shouldAnimate ? 16 : 0)
        pendingDropAnimation.value = false

        if (shouldAnimate) {
            if (unlockTimer) clearTimeout(unlockTimer)
            unlockTimer = setTimeout(() => {
                dropBallAnimating.value = false
                locked.value = false
            }, DROP_ANIMATION_DURATION)
        }
    }
)

onMounted(() => {
    scheduleLayoutSync(false, 32)
})

onUnmounted(() => {
    if (transitionTimer) clearTimeout(transitionTimer)
    if (layoutTimer) clearTimeout(layoutTimer)
    if (unlockTimer) clearTimeout(unlockTimer)
})

function setChange(child: TabbarItem) {
    const active = child.name

    if (active === props.modelValue) return
    if (locked.value) return

    const done = () => {
        const currentIndex = children.findIndex((c: any, i: number) => getChildName(c, i) === props.modelValue)
        oldIndexRef.value = currentIndex >= 0 ? currentIndex : 0

        emit('update:modelValue', active)
        emit('change', { value: active })

        if (props.animation === 'fly-balls') {
            const nextIdx = children.findIndex((c: any, i: number) => getChildName(c, i) === active)
            newIndexRef.value = nextIdx >= 0 ? nextIdx : 0

            locked.value = true
            isTransition.value = false
            setTimeout(() => {
                isTransition.value = true
                if (transitionTimer) clearTimeout(transitionTimer)
                transitionTimer = setTimeout(() => {
                    isTransition.value = false
                    locked.value = false
                }, 600)
            }, 20)
        } else if (props.animation === 'drop') {
            locked.value = true
            pendingDropAnimation.value = true
        } else {
            locked.value = false
        }
    }

    if (props.beforeChange && typeof props.beforeChange === 'function') {
        locked.value = true
        const wrappedDone = (shouldProceed: boolean = true) => {
            if (shouldProceed) {
                done()
            } else {
                locked.value = false
            }
        }
        const result = props.beforeChange({ name: active }, wrappedDone)
        if (result === true) {
            wrappedDone()
        } else if (result && typeof (result as Promise<any>).then === 'function') {
            ; (result as Promise<any>).then((isPass: boolean | void) => {
                if (isPass !== false) {
                    wrappedDone()
                } else {
                    locked.value = false
                }
            }).catch(() => {
                locked.value = false
            })
        } else if (result === false) {
            locked.value = false
        }
    } else {
        done()
    }
}

const getBallStyle = (ballIndex: number) => {
    const count = children.length || 1
    const renderOldIndex = oldIndexRef.value
    const renderNewIndex = newIndexRef.value
    const startLeftPercent = ((renderOldIndex + 0.5) / count) * 100
    const endLeftPercent = ((renderNewIndex + 0.5) / count) * 100
    const p = presets.value[ballIndex % presets.value.length]
    const duration = ballCount.value * 0.2 + 0.1

    return {
        '--fly-ball-left': `calc(${endLeftPercent}%)`,
        '--fly-ball-start-left': `calc(${startLeftPercent}% + ${p.offsetXStart}px)`,
        '--fly-ball-top': `${p.top}rpx`,
        '--fly-ball-shift': `${p.shiftY}rpx`,
        '--fly-ball-jump': `-${40 + (ballIndex % 3) * 5}px`,
        '--fly-ball-duration': `${duration - ballIndex * 0.15}s`,
        left: 'var(--fly-ball-start-left)',
        top: 'var(--fly-ball-top)',
        width: `${p.width}rpx`,
        height: `${p.height}rpx`,
        borderRadius: '50%',
        backgroundColor: props.ballColors?.[ballIndex % count] || '#000',
        opacity: 0,
    }
}

function setPlaceholderHeight() {
    if (!props.fixed || !props.placeholder) {
        height.value = ''
        return
    }

    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-tabbar-base').boundingClientRect((res: any) => {
        if (res) {
            const extra = props.animation === 'drop' ? Math.max(-dropBallTop.value, 0) : 0
            height.value = Number(res.height) + extra
        }
    }).exec()
}
</script>

<template>
    <view :class="ui.root({ class: cn(customClass) })">
        <view v-if="fixed && placeholder && height" class="reborn-tabbar-placeholder" :style="placeholderStyle"></view>
        <view class="reborn-tabbar-base" :class="ui.base()" :style="[rootStyle, customStyle]">
            <view v-if="dropBallVisible" :class="[ui.dropBall(), { 'drop-ball-bounce': dropBallAnimating }]" :style="{
                left: '0px',
                top: `${dropBallTop}px`,
                width: `${dropBallSize}px`,
                height: `${dropBallSize}px`,
                transform: `translate3d(${dropBallLeft}px, 0, 0)`,
                opacity: props.shape === 'round' ? (dropBallAnimating ? 1 : 0) : 1,
                '--drop-ball-start-x': `${dropBallStartLeft}px`,
                '--drop-ball-end-x': `${dropBallLeft}px`,
                '--drop-ball-peak': props.shape === 'round' ? '-26px' : '-34px'
            }">
            </view>

            <view v-if="animation === 'fly-balls'" :class="ui.flyBallsContainer()">
                <view v-for="(color, index) in ballColors" :key="index"
                    :class="[ui.flyBallItem(), isTransition ? 'fly-ball-anim-dynamic' : '']"
                    :style="getBallStyle(index)">
                </view>
            </view>

            <slot />
        </view>
    </view>
</template>

<style scoped>
@keyframes flyBallsJump {
    0% {
        transform: translateY(0) scale(1) translateX(0);
        opacity: 0;
        left: var(--fly-ball-start-left);
    }

    10% {
        opacity: 1;
        left: var(--fly-ball-start-left);
    }

    50% {
        transform: translateY(var(--fly-ball-jump)) scale(1.1);
        opacity: 1;
        left: calc(var(--fly-ball-start-left) / 2 + var(--fly-ball-left) / 2);
    }

    80% {
        transform: translateY(var(--fly-ball-shift)) scale(1.2) translateX(0);
        opacity: 1;
        left: var(--fly-ball-left);
    }

    100% {
        transform: translateY(calc(var(--fly-ball-shift) + 15px)) scale(0) translateX(0);
        opacity: 0;
        left: var(--fly-ball-left);
    }
}

.fly-ball-anim-dynamic {
    animation: flyBallsJump var(--fly-ball-duration) ease-in-out forwards;
}

.drop-ball-bounce {
    animation: dropBallParabola 0.58s cubic-bezier(0.25, 0.9, 0.3, 1) both;
}

@keyframes dropBallParabola {
    0% {
        transform: translate3d(var(--drop-ball-start-x), 0, 0);
    }

    50% {
        transform: translate3d(calc((var(--drop-ball-start-x) + var(--drop-ball-end-x)) / 2), var(--drop-ball-peak), 0);
    }

    100% {
        transform: translate3d(var(--drop-ball-end-x), 0, 0);
    }
}
</style>
