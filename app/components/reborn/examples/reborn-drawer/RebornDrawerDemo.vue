<script setup lang="ts">const open=ref(false);</script>
<template><div><UButton @click="open = true">打开抽屉</UButton><RebornDrawer v-model="open"><div class="p-4"><h3 class="font-medium">RebornDrawer</h3><p class="text-sm text-gray-500">支持 overlay + transition</p></div></RebornDrawer></div></template>
