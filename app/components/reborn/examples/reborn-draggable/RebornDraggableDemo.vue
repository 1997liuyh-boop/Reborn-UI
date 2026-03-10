<script setup lang="ts">const list = ref(['A','B','C','D']);</script>
<template><RebornDraggable v-model="list"><template #item="{item,index}"><div>{{ index + 1 }}. {{ item }}</div></template></RebornDraggable></template>
