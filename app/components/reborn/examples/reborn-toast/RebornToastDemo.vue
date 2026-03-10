<script setup lang="ts">import { useToast } from '~/components/reborn/ui/reborn-toast'; const toast=useToast();</script>
<template><div class="flex gap-2"><UButton @click="toast.success('成功')">success</UButton><UButton @click="toast.loading('加载中')">loading</UButton><UButton @click="toast.error('失败')">error</UButton></div></template>
