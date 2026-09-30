<script setup lang="ts">
/**
 * 总览卡片缩略：一个带标题、描述与操作按钮的对话框面板
 *
 * 真实弹窗是全屏遮罩加居中面板，缩略图只取面板部分用主题样式静态渲染；
 * 默认最大宽度 560px 与大投影放不进卡片，这里收窄宽度、缩小内边距并减弱投影。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import theme from '~/components/reborn/ui/reborn-dialog/reborn-dialog.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const styles = tv(theme)({})
</script>

<template>
  <div :class="cn(styles.panel(), 'w-[220px] gap-3 bg-gray-1 px-4 py-3 text-gray-9 shadow-[0_4px_16px_rgba(15,23,42,0.12)]')">
    <div :class="styles.header()">
      <div :class="cn(styles.headerContent(), 'gap-1')">
        <div :class="cn(styles.title(), 'text-sm')">
          退出登录
        </div>
        <div :class="cn(styles.description(), 'text-xs')">
          退出后需要重新验证身份
        </div>
      </div>
      <Icon
        name="lucide:x"
        :class="cn(styles.close(), 'size-4')"
      />
    </div>
    <div :class="cn(styles.footer(), 'gap-2')">
      <RebornButton
        size="sm"
        variant="outlined"
      >
        取消
      </RebornButton>
      <RebornButton
        size="sm"
        color="primary"
      >
        确定
      </RebornButton>
    </div>
  </div>
</template>
