<script setup lang="ts">
import type { MessageInstance } from './reborn-toast.config'
import { onShow } from '@dcloudio/uni-app'
import { computed, getCurrentInstance, onMounted, onUnmounted } from 'vue'
import { addUnit } from '@/lib/util'
import {
  isMessageContainerActive,
  markMessageMounted,
  MESSAGE_CONTAINER_KEY,
  MESSAGE_TYPE_ICON,
  messageState,
  messageTheme,
  pauseMessage,
  resumeMessage,
  syncMessageRenderer,
  unmarkMessageMounted,
} from './reborn-toast.config'

// 小程序端启用虚拟节点与全局样式类，保证 tailwind 工具类可作用到组件内
defineOptions({
  name: 'RebornToast',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
})

// 登记实例：页面实例各自渲染；H5 命令式容器只在当前页面没有页面实例时渲染（小程序端组件必须预置在页面里）
const instance = getCurrentInstance()!
const isContainer = instance.vnode.key === MESSAGE_CONTAINER_KEY
onMounted(() => markMessageMounted(instance, isContainer))
onUnmounted(() => unmarkMessageMounted(instance, isContainer))
// 切换 tabBar、返回上一页不会挂载 / 卸载实例，页面重新显示时重判容器是否让位
if (!isContainer) {
  onShow(syncMessageRenderer)
}
const isRenderer = computed(() => !isContainer || isMessageContainerActive())

/**
 * 顶部偏移：数字按 rpx 处理（样式优先原则，Web 端为 px），字符串原样使用；
 * H5 端叠加 --window-top 避开 uni 顶栏，小程序端该变量不存在时回退 0
 */
const topStyle = computed(() => `calc(var(--window-top, 0px) + ${addUnit(messageState.top)})`)

/** 每条消息的主题与语义函数仅在相关消息变化时重算一次。 */
const renderedMessages = computed(() => messageState.list.map(item => {
  const theme = messageTheme({ variant: item.variant, color: item.color })
  const classes = typeof item.classNames === 'function' ? item.classNames({ props: item }) : item.classNames
  const styles = typeof item.styles === 'function' ? item.styles({ props: item }) : item.styles
  return { item, rootClass: theme.root(), iconWrapperClass: theme.iconWrapper(), iconClass: theme.icon(), contentClass: theme.content(), classes, styles }
}))

/** 进出场动画类：closing 标记切到离场动画 */
function motionClass(item: MessageInstance) {
  return item.closing ? 'rb-message-leave' : 'rb-message-enter'
}

/** 图标类名：icon 传入时优先，否则按 type 取默认图标；loading 默认图标追加旋转动画 */
function iconClass(item: MessageInstance) {
  const name = item.icon || MESSAGE_TYPE_ICON[item.type]
  const spin = item.type === 'loading' && !item.icon ? 'animate-spin' : ''
  return `${name} ${spin}`
}

/** 按住（H5 悬停）暂停计时，松开（移出）恢复 */
function handlePause(item: MessageInstance) {
  if (item.pauseOnHover) {
    pauseMessage(item.id)
  }
}
function handleResume(item: MessageInstance) {
  if (item.pauseOnHover) {
    resumeMessage(item.id)
  }
}
</script>

<template>
  <view v-if="isRenderer" :class="messageTheme().wrapper()" :style="{ top: topStyle }" :dir="messageState.rtl ? 'rtl' : undefined">
    <view
      v-for="row in renderedMessages" :key="row.item.id"
      :class="[row.rootClass, motionClass(row.item), row.item.className, row.classes?.root]"
      :style="[row.item.style ?? {}, row.styles?.root ?? {}]" @click="row.item.onClick?.($event)"
      @touchstart="handlePause(row.item)" @touchend="handleResume(row.item)" @touchcancel="handleResume(row.item)"
      @mouseenter="handlePause(row.item)" @mouseleave="handleResume(row.item)"
    >
      <view
        :class="[row.iconWrapperClass, row.classes?.icon]"
        :style="row.styles?.icon"
      >
        <view :class="[iconClass(row.item), row.iconClass]" />
      </view>

      <view
        :class="[row.contentClass, row.classes?.content]"
        :style="row.styles?.content"
      >
        {{ row.item.content }}
      </view>
    </view>
  </view>
</template>

<style>
/* 小程序端不支持 TransitionGroup，进出场动画用 CSS keyframes 驱动，时长需与 config 的 LEAVE_DURATION 一致 */
.rb-message-enter {
  animation: rb-message-in 0.24s ease both;
}

.rb-message-leave {
  animation: rb-message-out 0.24s ease both;
}

@keyframes rb-message-in {
  from {
    opacity: 0;
    transform: translateY(-32rpx) scale(0.96);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes rb-message-out {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    transform: translateY(-16rpx) scale(0.96);
  }
}
</style>
