<script setup lang="ts">const show = ref(false);</script>
<template><div><UButton @click="show = true">打开遮罩</UButton><RebornOverlay v-model="show" /></div></template>
