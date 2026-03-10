<script setup lang="ts">const show = ref(true);</script>
<template><div class="space-y-4"><UButton @click="show = !show">切换</UButton><RebornTransition :show="show" name="fade-up"><div class="rounded bg-primary/10 p-4">Transition 内容</div></RebornTransition></div></template>
