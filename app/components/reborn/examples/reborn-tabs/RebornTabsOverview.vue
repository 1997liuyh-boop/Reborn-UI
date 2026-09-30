<script setup lang="ts">
/**
 * 总览卡片缩略：三个页签的标签栏，第一项选中
 *
 * 开启 hide-content 只留标签栏：面板内容在缩略图里没有信息量，还会撑高卡片。
 */
import type { TabKey } from '~/components/reborn/ui/reborn-tabs/reborn-tabs.config'
import { ref } from 'vue'
import RebornTabPane from '~/components/reborn/ui/reborn-tabs/RebornTabPane.vue'
import RebornTabs from '~/components/reborn/ui/reborn-tabs/RebornTabs.vue'

const activeKey = ref<TabKey>('overview')
</script>

<template>
  <div class="w-full max-w-[210px]">
    <RebornTabs
      v-model:active-key="activeKey"
      hide-content
    >
      <RebornTabPane
        key="overview"
        title="概览"
      />
      <RebornTabPane
        key="detail"
        title="明细"
      />
      <RebornTabPane
        key="log"
        title="日志"
      />
    </RebornTabs>
  </div>
</template>
