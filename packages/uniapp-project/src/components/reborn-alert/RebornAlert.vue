<script setup lang="ts">
import type { AlertColor, AlertDirection, AlertType, AlertUI, AlertVariant } from './reborn-alert.config'
import { computed, getCurrentInstance, nextTick, onMounted, ref, useSlots, watch } from 'vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import { cn } from '@/lib/utils'
import { ALERT_TYPE_COLOR, ALERT_TYPE_ICON, alertTheme } from './reborn-alert.config'

// 小程序端启用虚拟节点与全局样式类，保证 tailwind 工具类可作用到组件内
defineOptions({
  name: 'RebornAlert',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<AlertProps>(), {
  type: 'info',
  variant: 'soft',
  showIcon: true,
  closable: false,
  banner: false,
  center: false,
  closeIcon: 'i-lucide-x',
  interval: 3000,
  direction: 'vertical',
  speed: 60,
  rows: 1,
  customClass: '',
  ui: () => ({}),
})

const emit = defineEmits<{
  /** 点击关闭按钮时触发 */
  'close': [ev: unknown]
  /** 关闭动画结束后触发 */
  'after-close': []
  /** 轮播消息切换时触发 */
  'change': [index: number]
}>()

export interface AlertProps {
  /** 警告提示的类型，决定默认图标与配色，默认 info */
  type?: AlertType
  /** 视觉变体，对齐 reborn-button 的同名变体（不含 circle），默认 soft */
  variant?: AlertVariant
  /** 配色覆盖；缺省时由 type 映射（normal → neutral） */
  color?: AlertColor
  /** 是否展示图标，默认 true */
  showIcon?: boolean
  /** 是否展示关闭按钮，默认 false */
  closable?: boolean
  /** 警告提示的标题 */
  title?: string
  /** 是否作为顶部公告使用（去除边框和圆角），默认 false */
  banner?: boolean
  /** 内容是否居中显示，默认 false */
  center?: boolean
  /** 自定义图标类名（如 i-lucide-star，也可用 icon 插槽） */
  icon?: string
  /** 关闭按钮的图标类名 */
  closeIcon?: string
  /** 轮播消息列表：传入即变为消息轮播通知栏，多条消息垂直轮播展示 */
  messages?: string[]
  /** 轮播间隔时间，单位毫秒，默认 3000 */
  interval?: number
  /** 轮播方向：vertical 垂直切换，horizontal 全部消息拼成一行水平跑马灯滚动，默认 vertical */
  direction?: AlertDirection
  /** 水平跑马灯的滚动速率，单位 px/s，默认 60 */
  speed?: number
  /** 垂直轮播时同时展示的行数；大于 1 时多条消息同时可见并逐行向上滚动，默认 1 */
  rows?: number
  /** 自定义根节点类名 */
  customClass?: string
  /** 按语义化结构覆盖各节点样式 */
  ui?: AlertUI
}

const slots = useSlots()

/** 关闭状态支持 v-model:show 受控 */
const show = defineModel<boolean>('show', { default: true })

/** 配色：显式 color 优先，否则由 type 映射 */
const resolvedColor = computed(() => props.color ?? ALERT_TYPE_COLOR[props.type])

/** 图标：显式 icon 优先，否则按 type 取默认图标 */
const iconClass = computed(() => props.icon ?? ALERT_TYPE_ICON[props.type])

const ui = computed(() => {
  const styles = alertTheme({
    variant: props.variant,
    color: resolvedColor.value,
    banner: props.banner,
    center: props.center,
  })
  return {
    root: () => styles.root({ class: cn(props.ui.root, props.customClass) }),
    icon: () => styles.icon({ class: cn(props.ui.icon) }),
    content: () => styles.content({ class: cn(props.ui.content) }),
    title: () => styles.title({ class: cn(props.ui.title) }),
    description: () => styles.description({ class: cn(props.ui.description) }),
    action: () => styles.action({ class: cn(props.ui.action) }),
    closeButton: () => styles.closeButton({ class: cn(props.ui.closeButton) }),
    closeIcon: () => styles.closeIcon({ class: cn(props.ui.closeIcon) }),
    carouselWrapper: () => styles.carouselWrapper({ class: cn(props.ui.carouselWrapper) }),
    carouselItem: () => styles.carouselItem({ class: cn(props.ui.carouselItem) }),
    marqueeWrapper: () => styles.marqueeWrapper({ class: cn(props.ui.marqueeWrapper) }),
    marquee: () => styles.marquee({ class: cn(props.ui.marquee) }),
    marqueeItem: () => styles.marqueeItem({ class: cn(props.ui.marqueeItem) }),
  }
})

// ─── 消息轮播通知栏 ─────────────────────────────────────────────

/** 传入 messages 即进入轮播模式 */
const isCarousel = computed(() => (props.messages?.length ?? 0) > 0)
const messageCount = computed(() => props.messages?.length ?? 0)
/** 水平跑马灯 */
const isHorizontal = computed(() => isCarousel.value && props.direction === 'horizontal')
/** 垂直模式同时可见的行数，即 swiper 同时显示的滑块数 */
const rowCount = computed(() => Math.max(1, Math.floor(props.rows)))
/** 垂直轮播用内置 swiper 承担：条数超过可见行数才自动切换 */
const autoplay = computed(() => messageCount.value > rowCount.value)
/** 多行时按行数撑高 swiper（单行 42rpx 由 carouselWrapper 给定） */
const swiperStyle = computed(() => (rowCount.value > 1 ? `height: ${rowCount.value * 42}rpx;` : ''))

function handleSwiperChange(e: { detail: { current: number } }) {
  emit('change', e.detail.current)
}

// ─── 水平跑马灯 ─────────────────────────────────────────────────

const proxy = getCurrentInstance()?.proxy
/** 起点为容器宽度（从右缘滚入），一轮时长按 speed 折算以保持匀速 */
const marqueeFrom = ref(0)
const marqueeDuration = ref(0)
/** 测宽重试次数：入场过渡期间根节点仍为 display:none，会测到 0 宽 */
const MARQUEE_MEASURE_RETRIES = 5

function measureMarquee(retries = MARQUEE_MEASURE_RETRIES) {
  if (!isHorizontal.value) {
    return
  }
  nextTick(() => {
    // 延时等布局完成后再测量（与 reborn-notice-bar 做法一致）
    setTimeout(() => {
      const query = uni.createSelectorQuery().in(proxy)
      query.select('.reborn-alert__marquee-wrapper').boundingClientRect()
      query.select('.reborn-alert__marquee').boundingClientRect()
      query.exec((res) => {
        const wrapperWidth = Math.floor(res?.[0]?.width || 0)
        const textWidth = Math.ceil(res?.[1]?.width || 0)
        if (!wrapperWidth || !textWidth) {
          if (retries > 0) {
            measureMarquee(retries - 1)
          }
          return
        }
        marqueeFrom.value = wrapperWidth
        marqueeDuration.value = (textWidth + wrapperWidth) / props.speed
      })
    }, 200)
  })
}

/** 测宽完成前不挂动画类，避免以 0 时长起播 */
const marqueeAnimationClass = computed(() => (marqueeDuration.value > 0 ? 'reborn-alert-marquee' : ''))

const marqueeStyle = computed(() => (
  marqueeDuration.value > 0
    ? `--reborn-alert-marquee-from: ${marqueeFrom.value}px; animation-duration: ${marqueeDuration.value}s;`
    : ''
))

watch(() => [props.messages, props.direction, props.speed], () => measureMarquee())

/** 重新显示后容器才有宽度，需再测一次 */
watch(show, (visible) => {
  if (visible) {
    measureMarquee()
  }
})

onMounted(() => measureMarquee())

function handleClose(e: unknown) {
  show.value = false
  emit('close', e)
}
</script>

<template>
  <!-- after-enter 时根节点已可见，此时测宽最可靠 -->
  <RebornTransition
    name="fade" :show="show" custom-class="w-full"
    @after-enter="measureMarquee()" @after-leave="emit('after-close')"
  >
    <view :class="ui.root()">
      <view v-if="showIcon" :class="ui.icon()">
        <slot name="icon">
          <view :class="iconClass" class="size-[32rpx]" />
        </slot>
      </view>

      <view :class="ui.content()">
        <view v-if="title || slots.title" :class="ui.title()">
          <slot name="title">
            {{ title }}
          </slot>
        </view>

        <!-- 轮播模式：messages 传入即进入，按 direction / rows 分三种形态 -->
        <template v-if="isCarousel">
          <!-- 水平跑马灯：全部消息拼成一行，从右向左匀速滚动 -->
          <view v-if="isHorizontal" :class="ui.marqueeWrapper()">
            <view :class="[ui.marquee(), marqueeAnimationClass]" :style="marqueeStyle">
              <view v-for="(item, index) in messages" :key="index" :class="ui.marqueeItem()">
                <slot name="message" :item="item" :index="index">
                  {{ item }}
                </slot>
              </view>
            </view>
          </view>
          <!-- 垂直轮播：单行逐条 / 多行逐行都由 swiper 承担，rows 即同时显示的滑块数 -->
          <swiper
            v-else :class="ui.carouselWrapper()" :style="swiperStyle" vertical circular
            :display-multiple-items="rowCount" :autoplay="autoplay" :interval="interval"
            @change="handleSwiperChange"
          >
            <swiper-item
              v-for="(item, index) in messages" :key="index" class="
                flex h-full items-center
              "
            >
              <view :class="ui.carouselItem()">
                <slot name="message" :item="item" :index="index">
                  {{ item }}
                </slot>
              </view>
            </swiper-item>
          </swiper>
        </template>
        <view v-else-if="slots.default" :class="ui.description()">
          <slot />
        </view>
      </view>

      <view v-if="slots.action" :class="ui.action()">
        <slot name="action" />
      </view>

      <view v-if="closable" :class="ui.closeButton()" @click.stop="handleClose">
        <slot name="close-element" :close="handleClose">
          <view :class="[props.closeIcon, ui.closeIcon()]" />
        </slot>
      </view>
    </view>
  </RebornTransition>
</template>

<style scoped>
/* 水平跑马灯：从容器右缘滚入，整行滚出左缘后循环 */
@keyframes reborn-alert-marquee {
  from {
    transform: translateX(var(--reborn-alert-marquee-from, 100%));
  }

  to {
    transform: translateX(-100%);
  }
}

.reborn-alert-marquee {
  animation: reborn-alert-marquee linear infinite;
}
</style>
