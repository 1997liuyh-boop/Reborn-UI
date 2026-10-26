<script setup lang="ts">
/**
 * 总览卡片缩略：展开状态的下拉菜单
 *
 * 主题面板静态渲染，不创建浮层定位器或全局监听。
 */
import type { DropdownOption } from '~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import { dropdownTheme } from '~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config'
const styles = dropdownTheme()

const options: DropdownOption[] = [
  { label: '编辑', value: 'edit', icon: 'lucide:pencil' },
  { label: '复制', value: 'copy', icon: 'lucide:copy' },
  { label: '删除', value: 'delete', icon: 'lucide:trash-2' },
]

</script>

<template>
  <div class="flex h-[160px] w-[160px] items-start justify-center">
    <div class="flex flex-col items-center gap-1">
      <RebornButton
        size="sm"
        variant="outlined"
      >
        操作
        <Icon
          name="lucide:chevron-down"
          class="size-4"
        />
      </RebornButton>
      <div :class="styles.panel()" class="w-32 rounded-md border border-gray-3 bg-gray-1 shadow-md">
        <div :class="styles.list()">
          <div v-for="option in options" :key="option.label" :class="styles.item()">
            <Icon v-if="option.icon" :name="option.icon" :class="styles.itemIcon()" />
            <span :class="styles.itemLabel()">{{ option.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
