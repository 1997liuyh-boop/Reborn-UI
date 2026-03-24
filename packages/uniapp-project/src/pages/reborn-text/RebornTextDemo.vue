<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { textColors } from '@/components/reborn-text/reborn-text.config'
import RebornText from '@/components/reborn-text/RebornText.vue'

const lines = ref([
  '《游子吟》',
  '慈母手中线，',
  '游子身上衣。',
  '临行密密缝，',
  '意恐迟迟归。',
  '谁言寸草心，',
  '报得三春晖。',
])
</script>

<template>
  <RebornPage title="Text 文本" description="文本组件，支持多种文本类型展示，包括手机号、金额、内容超出省略等功能，并提供数据脱敏能力">
    <RebornCard title="基本用法" custom-class="space-y-4">
      <RebornText>
        春江花月夜
      </RebornText>
    </RebornCard>

    <RebornCard title="基本用法" custom-class="space-y-4">
      <RebornText v-for="(item, index) in lines" :key="index" :ui="{ base: 'block' }" :color="textColors[index]">
        {{ item }}
      </RebornText>
    </RebornCard>

    <RebornCard title="省略号" custom-class="space-y-4">
      <RebornText ellipsis>
        夫以铜为镜，可以正衣冠；以史为镜，可以知兴替；以人为镜，可以明得失。朕尝保此三镜，以防己过。今魏徵殂逝，遂亡一镜矣
      </RebornText>
    </RebornCard>

    <RebornCard title="多行省略号" custom-class="space-y-4">
      <RebornText ellipsis :lines="2">
        夫以铜为镜，可以正衣冠；以史为镜，可以知兴替；以人为镜，可以明得失。朕尝保此三镜，以防己过。今魏徵殂逝，遂亡一镜矣
      </RebornText>
    </RebornCard>

    <RebornCard title="金额" custom-class="space-y-4">
      <RebornText :value="123456789.123456789" :precision="2" currency="¥" type="amount" />
    </RebornCard>

    <RebornCard title="手机号脱敏" custom-class="space-y-4">
      <RebornText type="phone" mask value="13800138000" />
    </RebornCard>

    <RebornCard title="姓名脱敏" custom-class="space-y-4">
      <RebornText type="name" mask value="张三" />
    </RebornCard>

    <RebornCard title="银行卡脱敏" custom-class="space-y-4">
      <RebornText type="card" mask value="6222021234567890123" />
    </RebornCard>

    <RebornCard title="邮箱脱敏" custom-class="space-y-4">
      <RebornText type="email" mask value="example@example.com" />
    </RebornCard>

    <RebornCard title="自定义脱敏字符" custom-class="space-y-4">
      <RebornText type="phone" value="13800138000" mask mask-char="#" />
    </RebornCard>
  </RebornPage>
</template>

<style lang="scss" scoped></style>
