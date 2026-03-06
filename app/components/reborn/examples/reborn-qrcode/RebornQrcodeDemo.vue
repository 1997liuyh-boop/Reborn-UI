<script setup lang="ts">
import type { ClQrcodeMode } from '../../ui/reborn-qrcode'
import { computed, ref } from 'vue'
import { eccLevel } from '../../ui/reborn-qrcode'

const qrConfig = ref({
  text: 'https://www.leyifan.com/',
  foreground: '#131313',
  background: '#FFFFFF',
  pdColor: '#131313',
  padding: 5,
  mode: 'circular' as ClQrcodeMode,
  ecc: eccLevel.H,
  logo: '',
  logoSize: 40,
  pdOuterRadius: 10,
  pdInnerRadius: 5,
})

const copyParams = async () => {
  const payload = JSON.stringify(qrConfig.value, null, 2)
  await navigator.clipboard.writeText(payload)
}

const propsPreview = computed(() => JSON.stringify(qrConfig.value, null, 2))
</script>

<template>
  <div class="space-y-4 p-6">
    <div class="flex flex-wrap items-end gap-3">
      <UInput v-model="qrConfig.text" class="w-80" placeholder="二维码内容" />
      <USelect v-model="qrConfig.mode" :items="['rect', 'circular', 'line', 'rectSmall']" class="w-36" />
      <USelect v-model="qrConfig.ecc" :items="['L', 'M', 'Q', 'H']" class="w-28" />
      <UButton color="primary" @click="copyParams">复制当前参数</UButton>
    </div>

    <div class="flex items-center gap-8">
      <RebornQrcode
        :text="qrConfig.text"
        :foreground="qrConfig.foreground"
        :background="qrConfig.background"
        :pd-color="qrConfig.pdColor"
        :padding="qrConfig.padding"
        :mode="qrConfig.mode"
        :ecc="qrConfig.ecc"
        :logo="qrConfig.logo"
        :logo-size="qrConfig.logoSize"
        :pd-outer-radius="qrConfig.pdOuterRadius"
        :pd-inner-radius="qrConfig.pdInnerRadius"
      />
      <UTextarea :model-value="propsPreview" :rows="12" class="w-96" readonly />
    </div>
  </div>
</template>