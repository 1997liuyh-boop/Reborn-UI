<script setup lang="ts">
/**
 * 总览卡片缩略：虚线拖拽上传区，下方一个上传到 60% 的文件条目
 *
 * 文件条目通过 file-list 回显，状态直接给 uploading，不会真的发起请求；
 * 拖拽区默认 24px 上下内边距与 32px 图标放不下，用 ui 收紧并在默认插槽里换成小一号的图标与文案。
 */
import type { UploadUserFile } from '~/components/reborn/ui/reborn-upload/reborn-upload.config'
import { ref } from 'vue'
import RebornUpload from '~/components/reborn/ui/reborn-upload/RebornUpload.vue'

const files = ref<UploadUserFile[]>([
  { name: '季度经营报告.pdf', status: 'uploading', percentage: 60 },
])

const ui = {
  root: 'text-sm',
  dragger: 'gap-[4px] py-[12px] text-sm',
  list: 'mt-[8px]',
}
</script>

<template>
  <div class="w-[200px]">
    <RebornUpload
      v-model:file-list="files"
      drag
      :ui="ui"
    >
      <Icon
        name="lucide:cloud-upload"
        class="size-[24px] text-gray-6"
      />
      <div>拖拽文件到此处，或 <span class="text-primary">点击上传</span></div>
    </RebornUpload>
  </div>
</template>
