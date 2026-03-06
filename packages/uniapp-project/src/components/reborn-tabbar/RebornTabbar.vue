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
import { computed, getCurrentInstance, onMounted, ref, watch, nextTick, type CSSProperties } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { tabbarColors, tabbarShapes, tabbarAnimations } from './reborn-tabbar.config'
import { useChildren } from '@/composables/useChildren'
import { TABBAR_KEY } from './types'
import type { TabbarItem } from './types'

export interface TabbarProps {
    /** 绑定的选中值（一般对应 name 字段） */
    modelValue?: number | string
    /** 是否固定在页面底部 */
    fixed?: boolean
    /** 是否显示顶部边框线 */
    bordered?: boolean
    /** 是否为 iPhone X 等刘海屏设备开启底部安全区适配 */
    safeAreaInsetBottom?: boolean
    /** 形状：normal (常规) | round (悬浮圆角) */
    shape?: (typeof tabbarShapes)[number]
    /** 动画类型，目前支持 reveal, flip, creative, glass, fly-balls 等 */
    animation?: (typeof tabbarAnimations)[number] | null
    /** 小球动画特有的配置：小球颜色的数组 */
    ballColors?: string[]
    /** 选中的文字/图标颜色 */
    activeColor?: string
    /** 未选中的文字/图标颜色 */
    inactiveColor?: string
    /** 开启固定在底部定位时，是否在页面底部生成一个占位元素以防遮挡内容 */
    placeholder?: boolean
    /** 组件的 z-index 层级 */
    zIndex?: number
    /** 组件内置的主题颜色（primary, success 等） */
    color?: (typeof tabbarColors)[number]
    /** 自定义类名 */
    customClass?: any
    /** 自定义内联样式 */
    customStyle?: string
    /** tcv 对应的 ui 覆盖类名 */
    ui?: Partial<Record<'root' | 'base', string>>
    /** 针对 fly-balls 动画下，小球默认深入下降的偏移量 (rpx) */
    ballShiftY?: number
    /**
     * 切换前的回调函数，返回 false 或 rejcect 可阻止切换。如果在函数内执行了 done 参数方法，则在执行 done 的时候才真正切换。
     */
    beforeChange?: (params: { name: string | number }, done: () => void) => boolean | Promise<boolean> | void
}

const props = withDefaults(defineProps<TabbarProps>(), {
    modelValue: 0,
    fixed: false,
    bordered: true,
    safeAreaInsetBottom: false,
    shape: 'normal',
    animation: null,
    placeholder: false,
    zIndex: 99,
    color: 'primary',
    customStyle: '',
    ballColors: () => ['#ff6675', '#ffb03b', '#35b6f2', '#3ac29e']
})

const emit = defineEmits(['change', 'update:modelValue'])

const b = tv(theme)

const height = ref<number | string>('')
const { proxy } = getCurrentInstance() as any

const { linkChildren, children } = useChildren(TABBAR_KEY)

linkChildren({
    props,
    setChange
})

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        shape: props.shape as any,
        fixed: props.fixed,
        bordered: props.bordered,
        animation: props.animation as any,
        safeAreaInsetBottom: props.safeAreaInsetBottom,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
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
    // 根据用户传入的颜色数组计算出它们不同步的起飞点、大小缩放和偏移深度
    return props.ballColors.map((color, index) => {
        return {
            top: 35 - index * 2, // 起飞高度出现明显错落
            width: 12, // 小球宽度统一
            height: 12, // 小球高度统一
            offsetXStart: index, // 原生偏移让起飞点不在同一个中心
            shiftY: props.ballShiftY || -5, // 特殊向下的最终沉没深度偏置
            backgroundColor: color, // 映射到不同的小球各自的颜色
        }
    })
})

const ballCount = computed(() => props.ballColors.length || 3)

watch(
    [() => props.fixed, () => props.placeholder],
    () => {
        setPlaceholderHeight()
    },
    { deep: true, immediate: false }
)

onMounted(() => {
    if (props.fixed && props.placeholder) {
        nextTick(() => {
            setPlaceholderHeight()
        })
    }
})

const isTransition = ref(false)
let transitionTimer: any = null
const oldIndexRef = ref(0)
const newIndexRef = ref(0)

/**
 * 子项状态变更
 */
function setChange(child: TabbarItem) {
    const active = child.name

    if (active === props.modelValue) return

    const done = () => {
        // 先找到变更前的 active index 索引，记录小球起飞位置
        const activeIdx = children.findIndex((c: any, i: number) => {
            const cProps = c.$props || {}
            return (cProps.name !== undefined ? cProps.name : i) === props.modelValue
        })
        oldIndexRef.value = activeIdx >= 0 ? activeIdx : 0

        // 触发 v-model 值更新
        emit('update:modelValue', active)
        emit('change', { value: active })

        if (props.animation === 'fly-balls') {
            // 找到即将变成活跃的 tag 的索引，记录小球落脚点
            const nextIdx = children.findIndex((c: any, i: number) => {
                const cProps = c.$props || {}
                return (cProps.name !== undefined ? cProps.name : i) === active
            })
            newIndexRef.value = nextIdx >= 0 ? nextIdx : 0

            // 触发动画，清空先前的过渡并重新开始
            isTransition.value = false
            setTimeout(() => {
                isTransition.value = true
                if (transitionTimer) clearTimeout(transitionTimer)
                transitionTimer = setTimeout(() => {
                    isTransition.value = false
                }, 600) // 动画周期
            }, 20)
        }
    }

    if (props.beforeChange && typeof props.beforeChange === 'function') {
        const result = props.beforeChange({ name: active }, done)
        if (result === true) {
            done()
        } else if (result && typeof (result as Promise<any>).then === 'function') {
            (result as Promise<any>).then((isPass: boolean | void) => {
                if (isPass !== false) {
                    done()
                }
            }).catch(() => { })
        }
    } else {
        done()
    }
}

const getBallStyle = (ballIndex: number) => {
    const count = children.length || 1

    // 记录起点索引和落脚点索引
    const renderOldIndex = oldIndexRef.value
    const renderNewIndex = newIndexRef.value

    // 基准位置（以每个 tab 的中心点（即 0.5 比例处）为起止点）
    const startLeftPercent = ((renderOldIndex + 0.5) / count) * 100
    const endLeftPercent = ((renderNewIndex + 0.5) / count) * 100

    const p = presets.value[ballIndex % presets.value.length]

    const duration = ballCount.value * 0.2 + 0.1

    // 使用 CSS var 将动画中的起点距离 `--fly-ball-start-left` 和 终点距离 `--fly-ball-left` 存入
    return {
        '--fly-ball-left': `calc(${endLeftPercent}%)`,
        '--fly-ball-start-left': `calc(${startLeftPercent}% + ${p.offsetXStart}px)`,
        '--fly-ball-top': `${p.top}rpx`,
        '--fly-ball-shift': `${p.shiftY}rpx`,
        // 动态传递跳跃高度和动画时间
        '--fly-ball-jump': `-${40 + (ballIndex % 3) * 5}px`,
        '--fly-ball-duration': `${duration - ballIndex * 0.15}s`,
        left: `var(--fly-ball-start-left)`, // 组件就绪时位于起始位置
        top: `var(--fly-ball-top)`, // 初始化偏移高度
        width: `${p.width}rpx`,
        height: `${p.height}rpx`,
        borderRadius: '50%',
        backgroundColor: props.ballColors?.[ballIndex % (count)] || '#000',
        opacity: 0, // 初始时保持不可见，让 keyframes 来接管显示和隐藏
    }
}


function setPlaceholderHeight() {
    if (!props.fixed || !props.placeholder) {
        return
    }

    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-tabbar-base').boundingClientRect((res: any) => {
        if (res) {
            height.value = Number(res.height)
        }
    }).exec()
}
</script>

<template>
    <view :class="ui.root({ class: cn(customClass) })" :style="placeholderStyle">
        <view class="reborn-tabbar-base" :class="ui.base()" :style="[rootStyle, customStyle]">
            <!-- 飞线小球 (fly-balls 动画特有) -->
            <view v-if="animation === 'fly-balls'" class="absolute left-0 top-0 w-full h-full pointer-events-none z-10">
                <view v-for="(color, index) in ballColors" :key="index" class="absolute pointer-events-none z-10"
                    :class="[isTransition ? 'fly-ball-anim-dynamic' : '']" :style="getBallStyle(index)">
                </view>
            </view>

            <slot />
        </view>
    </view>
</template>

<style scoped>
/* 飞入动画：中心对齐、使用动态跳跃高度与动画时长保证兼容性 */
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
</style>
