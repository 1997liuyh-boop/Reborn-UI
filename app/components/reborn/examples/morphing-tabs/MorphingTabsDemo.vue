<script lang="ts" setup>
import { shallowRef } from "vue";

const tabs = ["Home", "Apps", "About", "My"];
const activeTab = shallowRef("Home");
</script>

<template>
  <MorphingTabs
    v-model:active-tab="activeTab"
    :tabs="tabs"
  />
</template>
