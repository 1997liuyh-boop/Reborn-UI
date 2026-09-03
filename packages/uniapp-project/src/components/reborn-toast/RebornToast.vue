<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { MessageInstance, MessageSemanticDOM } from './reborn-toast.config'
import { computed, onMounted, onUnmounted } from 'vue'
import { addUnit } from '@/lib/util'
import {
  markMessageMounted,
  MESSAGE_TYPE_ICON,
  messageState,
  messageTheme,
  pauseMessage,
  resumeMessage,
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

// 注册实例计数：H5 命令式调用据此判断是否还需动态挂载容器（小程序端组件必须预置在页面里）
onMounted(markMessageMounted)
onUnmounted(unmarkMessageMounted)

/**
 * 顶部偏移：数字按 rpx 处理（样式优先原则，Web 端为 px），字符串原样使用；
 * H5 端叠加 --window-top 避开 uni 顶栏，小程序端该变量不存在时回退 0
 */
const topStyle = computed(() => `calc(var(--window-top, 0px) + ${addUnit(messageState.top)})`)

/** 取单条消息的样式构建器 */
const themeOf = (item: MessageInstance) => messageTheme({ variant: item.variant, color: item.color })

/** classNames / styles 支持对象或函数两种形态 */
function semanticClass(item: MessageInstance, key: MessageSemanticDOM): string | undefined {
  const source = typeof item.classNames === 'function' ? item.classNames({ props: item }) : item.classNames
  return source?.[key]
}
function semanticStyle(item: MessageInstance, key: MessageSemanticDOM): CSSProperties | undefined {
  const source = typeof item.styles === 'function' ? item.styles({ props: item }) : item.styles
  return source?.[key]
}

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
  <view :class="messageTheme().wrapper()" :style="{ top: topStyle }" :dir="messageState.rtl ? 'rtl' : undefined">
    <view
      v-for="item in messageState.list" :key="item.id"
      :class="[themeOf(item).root(), motionClass(item), item.className, semanticClass(item, 'root')]"
      :style="[item.style ?? {}, semanticStyle(item, 'root') ?? {}]" @click="item.onClick?.($event)"
      @touchstart="handlePause(item)" @touchend="handleResume(item)" @touchcancel="handleResume(item)"
      @mouseenter="handlePause(item)" @mouseleave="handleResume(item)"
    >
      <view
        :class="[themeOf(item).iconWrapper(), semanticClass(item, 'icon')]"
        :style="semanticStyle(item, 'icon')"
      >
        <view :class="[iconClass(item), themeOf(item).icon()]" />
      </view>

      <view
        :class="[themeOf(item).content(), semanticClass(item, 'content')]"
        :style="semanticStyle(item, 'content')"
      >
        {{ item.content }}
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
