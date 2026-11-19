<script setup lang="ts">
import { tv } from '@/lib/tv'
import RebornDialog from '../reborn-dialog/RebornDialog.vue'
import theme from './reborn-image.config'

/** 内部视频预览：复用图片的遮罩、关闭按钮与对话框的焦点和滚动管理。 */
defineProps<{ src: string; title?: string }>()
const emit = defineEmits<{ closed: [] }>()
const open = defineModel<boolean>({ default: false })
const styles = tv(theme)()
const dialogUi = {
  backdrop: styles.previewBackdrop(),
  panel: 'gap-0 border-0 bg-transparent p-0 shadow-none',
  header: 'contents',
  headerContent: 'contents',
  body: 'flex h-full items-center justify-center',
}
</script>

<template>
  <RebornDialog
    v-model="open"
    fullscreen
    destroy-on-close
    transition="fade"
    :show-close="false"
    :cancel-btn="false"
    :confirm-btn="false"
    :ui="dialogUi"
    :aria-label="title || '视频预览'"
    @closed="emit('closed')"
  >
    <template #header="{ close }">
      <button type="button" :class="styles.previewClose()" aria-label="关闭视频预览" @click="close">
        <span :class="styles.previewCloseIcon()" aria-hidden="true" />
      </button>
    </template>
    <template #default="{ close }">
      <div class="flex size-full items-center justify-center p-8" @click.self="close">
        <!-- 加载前后固定为 16:9；宽度同时受视口高度约束，并为上下留白各预留 2rem。 -->
        <video v-if="open" :src="src" :aria-label="title || '视频预览播放器'" controls autoplay playsinline class="aspect-video h-auto w-[min(800px,100%,calc((100dvh_-_4rem)*16/9))] shrink-0 object-contain" />
      </div>
    </template>
  </RebornDialog>
</template>
