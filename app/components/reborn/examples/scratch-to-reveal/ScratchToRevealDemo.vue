<script lang="ts" setup>
const completed = ref(false);

function handleComplete() {
  completed.value = true;
}
</script>

<template>
  <DemoSection
    title="基础用法"
    description="涂层本身是刮刮卡的主体表面；刮开超过一半面积后触发 complete。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <ScratchToReveal
        :width="250"
        :height="250"
        :min-scratch-percentage="50"
        class="border-default bg-elevated mx-auto flex items-center justify-center overflow-hidden rounded-ui-lg border-2"
        :gradient-colors="['#A97CF8', '#F38CB8', '#FDCC92']"
        @complete="handleComplete"
      >
        <div class="text-8xl">🥳</div>
      </ScratchToReveal>
      <DemoNote
        v-if="completed"
        tone="dimmed"
      >
        已刮开
      </DemoNote>
    </DemoBlock>
  </DemoSection>
</template>
