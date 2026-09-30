<script setup lang="ts">
/**
 * 总览卡片缩略：带图标的纵向菜单，第一项处于选中态
 *
 * 只放三个平铺菜单项、不放子菜单：展开的子菜单会把高度撑出卡片。
 */
import { ref } from 'vue'
import RebornMenu from '~/components/reborn/ui/reborn-menu/RebornMenu.vue'
import RebornMenuItem from '~/components/reborn/ui/reborn-menu/RebornMenuItem.vue'

const selectedKeys = ref(['1'])
</script>

<template>
  <RebornMenu
    v-model:selected-keys="selectedKeys"
    mode="vertical"
    color="primary"
    class="w-[180px]"
  >
    <RebornMenuItem index="1">
      <template #icon>
        <Icon
          name="lucide:house"
          class="size-4"
        />
      </template>
      首页
    </RebornMenuItem>
    <RebornMenuItem index="2">
      <template #icon>
        <Icon
          name="lucide:settings"
          class="size-4"
        />
      </template>
      系统管理
    </RebornMenuItem>
    <RebornMenuItem index="3">
      <template #icon>
        <Icon
          name="lucide:chart-column"
          class="size-4"
        />
      </template>
      数据分析
    </RebornMenuItem>
  </RebornMenu>
</template>
