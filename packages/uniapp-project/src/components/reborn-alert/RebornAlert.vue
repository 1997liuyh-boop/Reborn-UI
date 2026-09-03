<script setup lang="ts">
import type { AlertColor, AlertType, AlertUI, AlertVariant } from './reborn-alert.config'
import { computed, useSlots } from 'vue'
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
  }
})

/** 传入 messages 即进入轮播模式，用内置 swiper 做垂直轮播（双端一致） */
const isCarousel = computed(() => (props.messages?.length ?? 0) > 0)
const autoplay = computed(() => (props.messages?.length ?? 0) > 1)

function handleSwiperChange(e: { detail: { current: number } }) {
  emit('change', e.detail.current)
}

function handleClose(e: unknown) {
  show.value = false
  emit('close', e)
}
</script>

<template>
  <RebornTransition name="fade" :show="show" custom-class="w-full" @after-leave="emit('after-close')">
    <view :class="ui.root()">
      <view v-if="showIcon" :class="ui.icon()">
        <slot name="icon">
          <view :class="iconClass" class="size-full" />
        </slot>
      </view>

      <view :class="ui.content()">
        <view v-if="title || slots.title" :class="ui.title()">
          <slot name="title">
            {{ title }}
          </slot>
        </view>

        <!-- 轮播模式：messages 多条消息垂直轮播 -->
        <swiper
          v-if="isCarousel" :class="ui.carouselWrapper()" vertical circular
          :autoplay="autoplay" :interval="interval" @change="handleSwiperChange"
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
