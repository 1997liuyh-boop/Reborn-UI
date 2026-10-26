<script setup lang="ts">
import type { TransitionName } from '../reborn-transition/RebornTransition.vue'
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue'
import RebornTransition from '../reborn-transition/RebornTransition.vue'

/** 弹层面板负责遮罩、过渡和内容区域渲染，手势状态由外层组件持有。 */
interface PanelProps {
  model?: boolean
  modal: boolean
  zIndex: number
  lockScroll: boolean
  duration: number | boolean
  panelDuration: number | boolean
  overlayStyle: string
  panelStyle: string
  lazyRender: boolean
  transitionName: TransitionName | TransitionName[]
  rootClass: Record<string, () => string>
  swipeClose: boolean
  showHeader: boolean
  showClose: boolean
  title: string
  /**
   * 使用方是否写了 #header 插槽，由外层按自己的 $slots 判断后传入。
   * 小程序编译器把转发的具名插槽一律记为「已传入」，本组件的 $slots.header 在小程序端恒为真，
   * 不能靠插槽后备内容兜底标题，只能由这个显式 prop 决定渲染插槽还是标题。
   */
  hasHeaderSlot: boolean
}
defineOptions({ options: { virtualHost: true, addGlobalClass: true, styleIsolation: 'shared' } })
defineProps<PanelProps>()
// 拖拽区手势用 swipe* 事件名转发：若用 touchstart 等原生同名事件，小程序会把内容区冒泡上来的原生触摸也交给外层，被当成下拉关闭手势
const emit = defineEmits<{
  'clickModal': [event?: any]
  'beforeEnter': [event?: any]
  'enter': [event?: any]
  'afterEnter': [event?: any]
  'beforeLeave': [event?: any]
  'leave': [event?: any]
  'afterLeave': [event?: any]
  'swipeStart': [event?: any]
  'swipeMove': [event?: any]
  'swipeEnd': [event?: any]
  'swipeCancel': [event?: any]
  'close': [event?: any]
}>()
</script>
<template>
  <view class="rb-popup-wrapper">
    <RebornOverlay
      v-if="modal"
      :model-value="model"
      :z-index="zIndex"
      :lock-scroll="lockScroll"
      :duration="duration"
      :custom-style="overlayStyle"
      @click="emit('clickModal', $event)"
    />
    <RebornTransition
      :lazy-render="lazyRender"
      :custom-class="rootClass.base()"
      :custom-style="panelStyle"
      :duration="panelDuration"
      :show="model"
      :name="transitionName"
      @before-enter="emit('beforeEnter', $event)"
      @enter="emit('enter', $event)"
      @after-enter="emit('afterEnter', $event)"
      @before-leave="emit('beforeLeave', $event)"
      @leave="emit('leave', $event)"
      @after-leave="emit('afterLeave', $event)"
    >
      <view :class="rootClass.inner()">
        <view
          v-if="swipeClose"
          class="rb-popup-drag-zone"
          @touchstart="emit('swipeStart', $event)"
          @touchmove.stop="emit('swipeMove', $event)"
          @touchend="emit('swipeEnd', $event)"
          @touchcancel="emit('swipeCancel', $event)"
        >
          <view class="flex w-full justify-center py-2">
            <view :class="rootClass.draw()" />
          </view>
          <view v-if="showHeader" :class="rootClass.header()">
            <!-- 不用插槽后备内容兜底标题：小程序端后备内容按 $slots.header 编译，而它恒为真 -->
            <slot v-if="hasHeaderSlot" name="header" />
            <text v-else :class="rootClass.title()">{{ title }}</text>
            <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click.stop="emit('close', $event)" />
          </view>
        </view>
        <view v-else-if="showHeader" :class="rootClass.header()">
          <slot v-if="hasHeaderSlot" name="header" />
          <text v-else :class="rootClass.title()">{{ title }}</text>
          <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click="emit('close', $event)" />
        </view>
        <slot />
      </view>
    </RebornTransition>
  </view>
</template>
