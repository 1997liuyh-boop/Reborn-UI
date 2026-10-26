<script lang="ts">
import type { UIMessage } from 'ai'
import type { DefineComponent } from 'vue'
import { defineAsyncComponent } from 'vue'
import { useClipboardFeedback } from '~/composables/useClipboardFeedback'
import AppAssistantMessage from './AppAssistantMessage.vue'

/**
 * 解析选项与代码块组件放在模块作用域，所有消息实例共用同一份：
 * 写在 <script setup> 里会让每条消息各建一个异步组件包装和 components 对象，
 * MDCCached 拿到的 pre 互不相同，历史越长多出的定义越多。
 */
const parserOptions = { highlight: false } as const
const mdcComponents: Record<string, DefineComponent<any, any, any>> = {
  pre: defineAsyncComponent(() => import('./AppAssistantPre.vue')) as DefineComponent<any, any, any>,
}
</script>

<script setup lang="ts">
// 两个 script 块在 lint 看来是同一个模块，import 统一写在上面的普通 script 块里
interface Props {
  message: UIMessage
  userName: string
  assistantName: string
  avatar: string
  time: string
  streaming: boolean
}
const props = defineProps<Props>()
const { copy, copied, copyError } = useClipboardFeedback()

/** 解析与工具状态归单条消息所有，流式更新只影响当前消息。 */
const text = computed(() => props.message.parts.filter(part => part.type === 'text').map(part => part.text).join('\n'))
const toolCalls = computed(() => props.message.parts
  .filter(part => part.type === 'data-tool-calls')
  .flatMap(part => (part as { data?: { tools?: unknown[] } }).data?.tools ?? []) as never[])
const thinking = computed(() => props.streaming && !props.message.parts.some(part => part.type === 'text'))
</script>

<template>
  <AppAssistantMessage
    :role="message.role === 'user' ? 'user' : 'assistant'"
    :name="message.role === 'user' ? userName : assistantName"
    :avatar="message.role === 'user' ? undefined : avatar"
    :time="time"
  >
    <p v-if="message.role === 'user'" class="whitespace-pre-wrap">{{ text }}</p>
    <div v-else class="flex min-w-0 flex-col gap-2 select-text">
      <AssistantLoading v-if="toolCalls.length || thinking" :tool-calls="toolCalls" :is-loading="thinking" />
      <!-- 流式片段结束后重新解析一次，避免异步首次解析遗漏末尾内容。 -->
      <template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`">
        <MDCCached
          v-if="part.type === 'text' && part.text"
          :value="part.text" :cache-key="`${message.id}-${index}`" :components="mdcComponents"
          :parser-options="parserOptions" class="*:first:mt-0 *:last:mb-0 [&>:last-child>*:last-child]:mb-0"
        />
      </template>
      <div v-if="text && !streaming" class="flex items-center gap-2 text-sm text-gray-6">
        <button
          type="button" aria-label="复制回复"
          class="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-gray-3 hover:text-gray-10 focus-visible:outline-2 focus-visible:outline-primary"
          @click="copy(text)"
        >
          <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-3.5" />
          复制回复
        </button>
        <span v-if="copied || copyError" role="status">{{ copied ? '已复制' : '复制失败，请选取文本复制' }}</span>
      </div>
    </div>
  </AppAssistantMessage>
</template>
