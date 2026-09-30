<script setup lang="ts">
/**
 * 总览卡片缩略：一张成功通知
 *
 * 真实通知通过命令式调用固定在屏幕角落，缩略图用主题样式静态渲染；
 * 默认宽度 360px、内边距 20/24px 放不进卡片，这里收窄宽度并缩小内边距。
 */
import { NOTIFICATION_TYPE_ICON, notificationTheme } from '~/components/reborn/ui/reborn-notification/reborn-notification.config'
import { cn } from '~/lib/utils'

const styles = notificationTheme({ type: 'success', ribbon: 'none' })
</script>

<template>
  <div :class="cn(styles.root(), 'w-[220px] gap-3 px-4 py-3 shadow-[0_4px_16px_rgba(15,23,42,0.12)]')">
    <div :class="cn(styles.header(), 'gap-2')">
      <span :class="styles.iconWrapper()">
        <Icon
          :name="NOTIFICATION_TYPE_ICON.success"
          :class="cn(styles.icon(), 'size-5')"
        />
      </span>
      <div :class="cn(styles.headerContent(), 'gap-1')">
        <div :class="cn(styles.title(), 'text-sm')">
          发布成功
        </div>
        <div :class="cn(styles.message(), 'text-xs')">
          新版本已推送给全部用户
        </div>
      </div>
      <span :class="cn(styles.close(), 'size-4')">
        <Icon
          name="lucide:x"
          class="size-4"
        />
      </span>
    </div>
  </div>
</template>
