<script setup lang="ts">
import { pinyin } from 'pinyin-pro'
import { computed } from 'vue'

interface Props {
  poem: { title: string, author: string, preface: string, lines: readonly string[] }
}
const props = defineProps<Props>()
function tokens(text: string) {
  return Array.from(text).map((character, position) => ({
    id: `${character}:${position}`,
    character,
    reading: /[\u4E00-\u9FFF]/.test(character)
      ? pinyin(character, { toneType: 'symbol', type: 'string' }).replace(/\s+/g, '') : '',
  }))
}
const heading = computed(() => [
  { id: 'title', content: tokens(props.poem.title), className: 'justify-center text-[40rpx] font-bold' },
  { id: 'author', content: tokens(props.poem.author), className: 'justify-center text-[28rpx]' },
  { id: 'preface', content: tokens(props.poem.preface), className: 'text-[26rpx]' },
])
const lines = computed(() => props.poem.lines.map(line => ({ id: line, content: tokens(line) })))
</script>

<template>
  <view class="flex flex-col gap-[32rpx]">
    <view v-for="section in heading" :key="section.id" class="flex flex-wrap gap-[8rpx]" :class="section.className">
      <view v-for="token in section.content" :key="token.id" class="flex flex-col items-center">
        <text class="h-[36rpx] text-[22rpx] text-gray-400">{{ token.reading }}</text>
        <text class="text-gray-800 dark:text-gray-100">{{ token.character }}</text>
      </view>
    </view>
    <view class="flex flex-col items-center gap-[16rpx]">
      <view v-for="line in lines" :key="line.id" class="flex flex-wrap justify-center gap-[8rpx]">
        <view v-for="token in line.content" :key="token.id" class="flex w-[48rpx] flex-col items-center">
          <text class="h-[32rpx] whitespace-nowrap text-[22rpx] text-gray-400">{{ token.reading }}</text>
          <text class="font-serif text-[28rpx] text-gray-700 dark:text-gray-200">{{ token.character }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
