<script setup lang="ts">
import type {FormData} from "./reborn-form-demo.config";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, nextTick, reactive, shallowRef, useTemplateRef } from 'vue';
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornCheckboxGroup from "~/components/reborn/ui/reborn-checkbox/RebornCheckboxGroup.vue";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import { formLabelPositions } from "~/components/reborn/ui/reborn-form/reborn-form.config";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSlider from "~/components/reborn/ui/reborn-slider/RebornSlider.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import RebornTextarea from "~/components/reborn/ui/reborn-textarea/RebornTextarea.vue";
import { createInitialForm, createRules, genderOptions, interestOptions } from "./reborn-form-demo.config";
import RebornFormLinkageDemo from "./RebornFormLinkageDemo.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const formRef = useTemplateRef<InstanceType<typeof RebornForm>>("formRef");

const state = shallowRef<Record<string, any>>({
  labelPosition: "right",
  labelWidth: "80px",
  size: "md",
  immediateValidate: true,
  requireAsteriskPosition: "right",
  showMessage: true,
  inlineMessage: false,
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "标签与尺寸",
    children: [
      {
        label: "标签位置",
        key: "labelPosition",
        component: "select" as const,
        defaultValue: "right",
        props: { options: formLabelPositions.map((p) => ({ label: p, value: p })) },
      },
      {
        label: "标签宽度",
        key: "labelWidth",
        component: "input" as const,
        defaultValue: "80px",
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: [
            { label: "SM", value: "sm" },
            { label: "MD", value: "md" },
            { label: "LG", value: "lg" },
          ],
        },
      },
    ],
  },
  {
    title: "校验与提示",
    children: [
      {
        label: "实时校验（change + blur）",
        key: "immediateValidate",
        component: "checkbox" as const,
        defaultValue: true,
      },
      {
        label: "星号位置",
        key: "requireAsteriskPosition",
        component: "select" as const,
        defaultValue: "right",
        props: {
          options: [
            { label: "标签右侧 right", value: "right" },
            { label: "标签左侧 left", value: "left" },
          ],
        },
      },
      { label: "显示错误信息", key: "showMessage", component: "checkbox" as const, defaultValue: true },
      { label: "行内错误提示", key: "inlineMessage", component: "checkbox" as const, defaultValue: false },
      { label: "整体禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const formCode = computed(() => {
  const s = state.value;
  const props: string[] = [':model-value="form"', ':rules="rules"'];

  if (s.labelPosition !== "left") props.push(`label-position="${s.labelPosition}"`);
  if (s.labelWidth !== "140px") props.push(`label-width="${s.labelWidth}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  props.push(`:trigger="${s.immediateValidate ? "['change', 'blur']" : "'none'"}"`);
  if (!s.showMessage) props.push(':show-message="false"');
  if (s.inlineMessage) props.push("inline-message");
  if (s.disabled) props.push("disabled");

  return `<RebornForm\n  ${props.join("\n  ")}\n>\n  <RebornFormItem prop="username" label="用户名" required require-asterisk-position="${s.requireAsteriskPosition}">\n    <RebornInput v-model="form.username" />\n  </RebornFormItem>\n</RebornForm>`;
});

// ─── 表单数据与校验 ─────────────────────────────────────────────

const form = reactive<FormData>(createInitialForm());

/** refine 在校验时才读取当前密码，规则只需创建一次。 */
const rules = createRules(form);

/** trigger 为 'none' 时只在手动调用 validate() 时校验 */
const formTrigger = computed<"none" | Array<"blur" | "change">>(() =>
  state.value.immediateValidate ? ["change", "blur"] : "none",
);

/** 最近一次提交结果，替代 alert 与 console 输出 */
const lastResult = shallowRef<"" | "success" | "fail">("");

/** 最近一次校验失败的字段数量 */
const errorCount = shallowRef(0);

let contactSeed = 0;

/** 联系人身份不依赖数组下标，删除后仍能保留输入实例。 */
function addContact() {
  form.contacts.push({
    id: ++contactSeed,
    phone: "",
    email: "",
    name: "",
    no: form.contacts.length + 1,
  });
}

/** 路径随索引变化前清除联系人校验，防止旧错误或在途校验落到下一行。 */
async function removeContact(index: number) {
  const fields = [...(formRef.value?.fields || [])].filter(prop => prop === "contacts" || prop.startsWith("contacts-"));
  formRef.value?.clearValidate(fields);
  form.contacts.splice(index, 1);
  lastResult.value = "";
  errorCount.value = 0;
  await nextTick();
  if (state.value.immediateValidate) {
    await Promise.all([...formRef.value?.fields || []].filter(prop => prop === "contacts" || prop.startsWith("contacts-")).map(prop => formRef.value?.validateField(prop)));
  }
}

async function submit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate((isValid, errors) => {
    errorCount.value = isValid ? 0 : errors.length;
  });

  lastResult.value = valid ? "success" : "fail";
}

function reset() {
  formRef.value?.resetFields();
  lastResult.value = "";
  errorCount.value = 0;
}

/** 校验失败时可用 scrollToField 把出错项滚动进视口 */
function scrollToBio() {
  formRef.value?.scrollToField("bio");
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="formCode" component-name="RebornForm" title="交互演练场"
      description="校验规则由 Zod 描述；trigger 决定是输入即校验还是仅在提交时校验，label-width 仅在标签左右布局时生效。"
    >
      <div class="py-2 w-150">
        <RebornForm
          ref="formRef" :model-value="form" :rules="rules" :label-width="state.labelWidth"
          :label-position="state.labelPosition" :size="state.size" :trigger="formTrigger"
          :show-message="state.showMessage" :inline-message="state.inlineMessage" :disabled="state.disabled"
        >
          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="username" label="用户名" required>
            <RebornInput v-model="form.username" placeholder="请输入用户名" />
          </RebornFormItem>

          <!-- 复选框组接管数组值与布局，并通过表单注入继承尺寸/禁用、在勾选时触发校验 -->
          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="interest" label="兴趣爱好" required>
            <RebornCheckboxGroup v-model="form.interest" :options="interestOptions" />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="gender" label="性别" required>
            <RebornSelect v-model="form.gender" :options="genderOptions" placeholder="请选择性别" />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="birthday" label="出生年月" required>
            <RebornDatePicker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" placeholder="请选择出生年月" />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="dateRange" label="入职时间" required>
            <RebornDatePicker
              v-model="form.dateRange" type="daterange" start-placeholder="起始日期" end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="isAgree" label="是否同意" required>
            <div class="flex items-center gap-4">
              <RebornSwitch v-model="form.isAgree" />
              <span class="text-muted text-sm">同意《用户服务协议》</span>
            </div>
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="password" label="密码" required>
            <RebornInput v-model="form.password" placeholder="请输入密码" password />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="newPassword" label="新密码" required>
            <RebornInput v-model="form.newPassword" placeholder="再次确认新密码" password />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="email" label="验证邮箱" required>
            <RebornInput v-model="form.email" placeholder="example@domain.com" />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="age" label="年龄" required>
            <RebornInputNumber v-model="form.age" placeholder="18-100" />
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="height" label="身高" required>
            <div class="flex w-full items-center gap-4">
              <RebornSlider v-model="form.height" :min="140" :max="220" class="flex-1" />
              <span class="text-muted w-12 font-mono text-sm">{{ form.height }}cm</span>
            </div>
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="weight" label="体重" required>
            <div class="flex w-full items-center gap-4">
              <RebornSlider v-model="form.weight" :min="30" :max="150" class="flex-1" />
              <span class="text-muted w-12 font-mono text-sm">{{ form.weight }}kg</span>
            </div>
          </RebornFormItem>

          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="bio" label="个人简介">
            <RebornTextarea v-model="form.bio" placeholder="请输入简介 (至少10个字符，选填)" />
          </RebornFormItem>

          <!-- 嵌套动态列表：prop 以 contacts-索引-字段 的形式与 Zod 数组规则对应 -->
          <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" prop="contacts" required label-position="top">
            <template #label>
              <div class="mb-2 flex w-full items-center justify-between">
                <span class="text-highlighted text-sm font-semibold">联系人列表</span>
                <RebornButton size="sm" variant="outlined" label="添加联系人" @click="addContact">
                  <template #leading>
                    <Icon name="lucide:plus" />
                  </template>
                </RebornButton>
              </div>
            </template>

            <div
              v-for="(contact, index) in form.contacts" :key="contact.id"
              class="border-default rounded-xl mb-4 flex flex-col border p-4"
            >
              <div class="border-default mb-4 flex items-center justify-between border-b pb-3">
                <span class="text-default text-sm font-medium">#{{ index + 1 }} 联系人信息</span>
                <RebornButton variant="text" color="neutral" size="sm" @click="removeContact(index)">
                  <Icon name="lucide:trash-2" />
                </RebornButton>
              </div>

              <div class="grid grid-cols-1 gap-x-8 md:grid-cols-2">
                <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" :prop="`contacts-${index}-name`" label="姓名" required label-position="top">
                  <RebornInput v-model="contact.name" placeholder="请输入姓名" />
                </RebornFormItem>
                <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" :prop="`contacts-${index}-phone`" label="手机号" required label-position="top">
                  <RebornInput v-model="contact.phone" placeholder="1XXXXXXXXXX" />
                </RebornFormItem>
                <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" :prop="`contacts-${index}-email`" label="邮箱" required label-position="top">
                  <RebornInput v-model="contact.email" placeholder="example@domain.com" />
                </RebornFormItem>
                <RebornFormItem :require-asterisk-position="state.requireAsteriskPosition" :prop="`contacts-${index}-no`" label="序号" required label-position="top">
                  <RebornInputNumber v-model="contact.no" placeholder="用于递增校验" />
                </RebornFormItem>
              </div>
            </div>
          </RebornFormItem>

          <div class="border-default mt-6 flex flex-wrap gap-3 border-t pt-6">
            <RebornButton label="提交表单" @click="submit" />
            <RebornButton variant="outlined" label="重置" @click="reset" />
            <RebornButton variant="soft" color="neutral" label="滚动到简介" @click="scrollToBio" />
          </div>

          <DemoNote tone="dimmed">
            <template v-if="lastResult === 'success'">
              校验通过，<code>validate()</code> 返回 <code>true</code>。
            </template>
            <template v-else-if="lastResult === 'fail'">
              校验未通过，共 <code>{{ errorCount }}</code> 个字段存在错误；联系人至少需要 3
              个且序号必须递增。
            </template>
            <template v-else>
              点击「提交表单」触发一次全量校验；<code>scrollToField</code> 可把指定字段滚动进视口。
            </template>
          </DemoNote>
        </RebornForm>
      </div>
    </Playground>

    <DemoSection title="完整表单联动" class="relative z-10">
      <template #description>
        多种控件共享同一份表单数据；举办方式与通知开关同步调整字段、<code>rules</code> 和必填完成度。
      </template>
      <DemoBlock layout="stack">
        <RebornFormLinkageDemo />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="实时数据" description="v-model 绑定的对象随输入同步更新，可直接观察 Zod 预处理后的取值类型。">
      <pre
        class="border-default rounded-lg text-muted max-h-96 overflow-auto border p-4 font-mono text-xs leading-relaxed"
      >
      {{ JSON.stringify(form, null, 2) }}</pre>
    </DemoSection>
  </div>
</template>
