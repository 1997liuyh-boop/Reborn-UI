<script lang="ts" setup>
const config = ref({
  title: {
    translateX: 0,
    translateY: 0,
    translateZ: 50,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  },
  description: {
    translateX: 0,
    translateY: 0,
    translateZ: 60,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  },
  image: {
    translateX: 0,
    translateY: 0,
    translateZ: 100,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  },
  btnLeft: {
    translateX: 0,
    translateY: 0,
    translateZ: 20,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  },
  btnRight: {
    translateX: 0,
    translateY: 0,
    translateZ: 20,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
  },
});
/** 五组变换配置共用同一组坐标与旋转字段 */
const groups = [
  { key: 'title', label: '标题' },
  { key: 'description', label: '描述' },
  { key: 'image', label: '图片' },
  { key: 'btnLeft', label: '访问按钮' },
  { key: 'btnRight', label: '开始使用按钮' },
] as const;
const fields = ['translateX', 'translateY', 'translateZ', 'rotateX', 'rotateY', 'rotateZ'] as const;
</script>

<template>
  <ComponentPlayground>
    <template #component>
      <CardDemo v-bind="config" />
    </template>
    <template #config>
      <UPageCard v-for="group in groups" :key="group.key" :title="group.label" class="bg-default/15">
        <UFormField v-for="field in fields" :key="field" :label="field" class="form-field">
          <UInputNumber v-model="config[group.key][field]" class="max-w-40" />
        </UFormField>
      </UPageCard>
    </template>
  </ComponentPlayground>
</template>
