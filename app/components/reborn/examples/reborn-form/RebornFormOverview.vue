<script setup lang="ts">
/**
 * 总览卡片缩略：「用户名 / 手机号」两行左置标签加输入框，底部一个提交按钮
 *
 * 表单项默认 24px 的行间距在卡片里显得松散，用 class 收到 12px；标签宽度按三个字给 56px。
 */
import { reactive } from 'vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornForm from '~/components/reborn/ui/reborn-form/RebornForm.vue'
import RebornFormItem from '~/components/reborn/ui/reborn-form/RebornFormItem.vue'
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue'

const form = reactive({
  username: '张三',
  phone: '',
})
</script>

<template>
  <RebornForm
    :model-value="form"
    label-width="56px"
    class="w-[200px]"
  >
    <RebornFormItem
      prop="username"
      label="用户名"
      required
      class="mb-3"
    >
      <RebornInput
        v-model="form.username"
        size="sm"
      />
    </RebornFormItem>
    <RebornFormItem
      prop="phone"
      label="手机号"
      required
      class="mb-3"
    >
      <RebornInput
        v-model="form.phone"
        size="sm"
        placeholder="请输入手机号"
      />
    </RebornFormItem>
    <RebornFormItem class="mb-0 pl-[56px]">
      <RebornButton
        color="primary"
        size="sm"
        class="self-start"
      >
        提交申请
      </RebornButton>
    </RebornFormItem>
  </RebornForm>
</template>
