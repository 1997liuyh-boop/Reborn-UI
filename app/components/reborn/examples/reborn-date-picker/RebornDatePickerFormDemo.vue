<script setup lang="ts">
/**
 * 「与表单联动」章节的卡片内容：表单、校验规则与提交结果回显。
 * 章节标题与描述留在 RebornDatePickerDemo.vue，文档站按那个文件抽取章节。
 */
import { DemoNote } from "#components";
import { reactive, shallowRef, useTemplateRef } from "vue";
import { z } from "zod";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import { formatDisplay } from "../_shared/date-demo-utils";

/** 表单数据：单值未选时是 null，范围未选时是 [] */
const formModel = reactive<{ departDate: string | null; tripRange: string[] }>({
  departDate: null,
  tripRange: [],
});

/** 表单实例 */
const formRef = useTemplateRef<InstanceType<typeof RebornForm>>("formRef");

/** 校验结果回显 */
const formResult = shallowRef("");

/** 校验规则：null 过不了 z.string()，[] 过不了 length(2)，两种「未选」都能拦下 */
const formRules = z.object({
  departDate: z.string({ message: "请选择出发日期" }).min(1, "请选择出发日期"),
  tripRange: z.array(z.string()).length(2, "请选择行程区间"),
});

/** 提交前整体校验 */
async function submitForm() {
  const valid = await formRef.value?.validate();
  formResult.value = valid
    ? `校验通过：${formatDisplay(formModel.departDate)}，${formatDisplay(formModel.tripRange)}`
    : "校验未通过";
}

/** 重置表单与回显 */
function resetForm() {
  formRef.value?.resetFields();
  formResult.value = "";
}
</script>

<template>
  <RebornForm
    ref="formRef"
    :model-value="formModel"
    :rules="formRules"
    label-width="100px"
    label-position="left"
    size="md"
    :trigger="['change', 'blur']"
    class="w-full max-w-lg"
  >
    <RebornFormItem label="出发日期" prop="departDate">
      <RebornDatePicker v-model="formModel.departDate" value-format="YYYY-MM-DD" class="w-full" />
    </RebornFormItem>
    <RebornFormItem label="行程区间" prop="tripRange">
      <RebornDatePicker v-model="formModel.tripRange" type="daterange" value-format="YYYY-MM-DD" class="w-full" />
    </RebornFormItem>
    <RebornFormItem>
      <div class="flex gap-2">
        <RebornButton @click="submitForm">校验并提交</RebornButton>
        <RebornButton color="neutral" variant="outlined" @click="resetForm">重置</RebornButton>
      </div>
    </RebornFormItem>
  </RebornForm>
  <DemoNote v-if="formResult" tone="dimmed">
    <span class="font-mono text-xs">{{ formResult }}</span>
  </DemoNote>
</template>
