<script setup lang="ts">
/**
 * 总览卡片缩略：一条成功消息
 *
 * 真实消息通过命令式调用挂到页面顶部，缩略图直接用主题样式静态渲染一条，外观与实际弹出的一致。
 */
import { MESSAGE_TYPE_COLOR, MESSAGE_TYPE_ICON, messageTheme } from '~/components/reborn/ui/reborn-toast/reborn-toast.config'

const styles = messageTheme({ variant: 'base', color: MESSAGE_TYPE_COLOR.success })
</script>

<template>
  <div :class="styles.root()">
    <span :class="styles.iconWrapper()">
      <Icon
        :name="MESSAGE_TYPE_ICON.success"
        :class="styles.icon()"
      />
    </span>
    <span :class="styles.content()">保存成功</span>
  </div>
</template>
