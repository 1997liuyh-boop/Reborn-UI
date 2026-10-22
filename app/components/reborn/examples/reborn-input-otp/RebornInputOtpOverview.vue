<script setup lang="ts">
/**
 * 总览卡片缩略：四位验证码已输入三位，第四格呈激活描边，上方一行发送提示
 *
 * 组件的激活描边与闪烁光标只在真实聚焦时出现，缩略图不能抢页面焦点；
 * 这里通过 ui.item 只给第四格补上同款主色描边与光晕，并用伪元素画一条静止的光标。
 */
import { ref } from 'vue'
import RebornInputOtp from '~/components/reborn/ui/reborn-input-otp/RebornInputOtp.vue'

const code = ref('286')

const ui = {
  item: 'nth-4:border-primary nth-4:ring-2 nth-4:ring-primary/20 nth-4:after:h-[40%] nth-4:after:w-px nth-4:after:bg-primary nth-4:after:content-[\'\']',
}
</script>

<template>
  <div class="flex flex-col items-center gap-2.5">
    <p class="text-sm text-gray-6">
      验证码已发送至 138****6721
    </p>
    <RebornInputOtp
      v-model="code"
      :ui="ui"
    />
  </div>
</template>
