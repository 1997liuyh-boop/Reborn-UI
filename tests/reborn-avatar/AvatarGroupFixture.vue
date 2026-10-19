<script setup lang="ts">
import RebornAvatarGroup from '~/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue';
import RebornAvatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue';

/** 用编译后的循环插槽验证延迟浮层，覆盖真实演示页面的节点复用方式。 */
defineProps<{ people: string[]; effect?: string }>();
</script>

<template>
  <RebornAvatarGroup collapse-avatars collapse-avatars-tooltip :max-collapse-avatars="1" :effect="effect">
    <RebornAvatar v-for="person in people" :key="person" :alt="person">{{ person }}</RebornAvatar>
  </RebornAvatarGroup>
</template>
