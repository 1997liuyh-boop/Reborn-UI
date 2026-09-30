<script setup lang="ts">
/**
 * 总览卡片缩略：展开状态的下拉菜单
 *
 * 关闭 portal 让面板就地渲染在触发按钮下方，不挂到 body 上；
 * 面板是 absolute 定位，外层留出高度并把触发器放在上部，避免面板被卡片裁切。
 * 显隐写成受控且丢弃关闭请求：否则点页面任意处都会触发外部点击，把缩略图收起。
 */
import type { DropdownOption } from '~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornDropdown from '~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue'

const options: DropdownOption[] = [
  { label: '编辑', value: 'edit', icon: 'lucide:pencil' },
  { label: '复制', value: 'copy', icon: 'lucide:copy' },
  { label: '删除', value: 'delete', icon: 'lucide:trash-2' },
]

/** 缩略图常驻展开，忽略组件发出的显隐变更 */
function keepOpen() {}
</script>

<template>
  <div class="flex h-[160px] w-[160px] items-start justify-center">
    <RebornDropdown
      :popup-visible="true"
      :options="options"
      :portal="false"
      @update:popup-visible="keepOpen"
    >
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
    </RebornDropdown>
  </div>
</template>
