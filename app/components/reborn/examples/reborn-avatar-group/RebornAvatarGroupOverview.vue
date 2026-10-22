<script setup lang="ts">
/**
 * 总览卡片缩略：五位成员的重叠头像组，前四位直接展示，第五位折叠成「+1」计数
 *
 * 只开 collapseAvatars、不开 collapseAvatarsTooltip：计数头像渲染成静态 span，不会挂载悬停浮层。
 */
import { avatarPeople } from '~/components/reborn/examples/reborn-avatar/avatar-demo.data'
import RebornAvatarGroup from '~/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue'
import RebornAvatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue'
</script>

<template>
  <RebornAvatarGroup
    :size="44"
    collapse-avatars
    :max-collapse-avatars="4"
    aria-label="项目成员"
  >
    <RebornAvatar
      v-for="person in avatarPeople"
      :key="person.name"
      :src="person.src"
      :alt="person.name"
    />
  </RebornAvatarGroup>
</template>
