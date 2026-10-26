<script setup lang="ts">
/**
 * 总览卡片缩略：输入框里已提及 @张伟、又敲下一个 @，下方弹出成员候选列表
 *
 * 输入框使用普通只读输入，不挂载 Mention 的全局监听与尺寸观察器，
 * 缩略图用组件的主题样式把面板静态画在输入框下方，宽度与输入框一致（同真实面板）。
 * 原生输入框无法给局部文字上色，已插入的提及保持普通文字色，与真实效果一致。
 */
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue'
import { mentionTheme } from '~/components/reborn/ui/reborn-mention/reborn-mention.config'
import { cn } from '~/lib/utils'

const text = '@张伟 帮忙确认下，@'

const styles = mentionTheme()

const members = [
  { name: '张伟', role: '前端' },
  { name: '李娜', role: '设计' },
  { name: '王芳', role: '产品' },
]
</script>

<template>
  <div class="flex w-[200px] flex-col gap-1">
    <RebornInput
      :model-value="text"
      readonly
      size="sm"
    />
    <div :class="cn(styles.dropdown(), 'static z-auto w-full shadow-md')">
      <div :class="cn(styles.list(), 'py-[4px]')">
        <div
          v-for="(member, index) in members"
          :key="member.name"
          :class="cn(styles.option(), 'justify-between py-[2px] text-sm', index === 0 && styles.optionActive())"
        >
          <span :class="styles.optionLabel()">{{ member.name }}</span>
          <span class="text-gray-5">{{ member.role }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
