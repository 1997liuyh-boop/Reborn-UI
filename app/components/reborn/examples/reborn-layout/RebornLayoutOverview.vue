<script setup lang="ts">
/**
 * 总览卡片缩略：顶栏 + 侧边栏 + 主区域的经典后台布局
 *
 * 各区域只放色块和区域名，看清骨架即可；外层限宽限高，避免撑满卡片。
 */
import RebornLayout from '~/components/reborn/ui/reborn-layout/RebornLayout.vue'
import RebornLayoutAside from '~/components/reborn/ui/reborn-layout/RebornLayoutAside.vue'
import RebornLayoutHeader from '~/components/reborn/ui/reborn-layout/RebornLayoutHeader.vue'
import RebornLayoutMain from '~/components/reborn/ui/reborn-layout/RebornLayoutMain.vue'
</script>

<template>
  <div class="border-default h-[130px] w-[210px] overflow-hidden rounded-lg border">
    <RebornLayout class="h-full">
      <RebornLayoutHeader
        height="32px"
        class="bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold"
      >
        Header
      </RebornLayoutHeader>
      <RebornLayout>
        <RebornLayoutAside
          width="64px"
          class="bg-elevated text-muted flex items-center justify-center text-xs font-semibold"
        >
          Aside
        </RebornLayoutAside>
        <RebornLayoutMain class="bg-muted/40 text-muted flex items-center justify-center text-xs font-semibold">
          Main
        </RebornLayoutMain>
      </RebornLayout>
    </RebornLayout>
  </div>
</template>
