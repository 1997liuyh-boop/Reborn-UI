<script setup lang="ts">
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";
import { formLabelPositions } from "~/components/reborn/ui/reborn-form/reborn-form.config";
import { createRules, genderOptions, initialForm, type FormData } from "./reborn-form-demo.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const formRef = ref<InstanceType<typeof RebornForm> | null>(null);

const state = ref<Record<string, any>>({
  labelPosition: "left",
  labelWidth: "120px",
  size: "sm",
  immediateValidate: true,
  hideRequiredAsterisk: false,
  requireAsteriskPosition: "right",
  statusIcon: false,
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
        defaultValue: "left",
        props: { options: formLabelPositions.map((p) => ({ label: p, value: p })) },
      },
      {
        label: "标签宽度",
        key: "labelWidth",
        component: "input" as const,
        defaultValue: "120px",
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "sm",
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
        label: "隐藏必填星号",
        key: "hideRequiredAsterisk",
        component: "checkbox" as const,
        defaultValue: false,
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
      { label: "状态图标", key: "statusIcon", component: "checkbox" as const, defaultValue: false },
      { label: "行内错误提示", key: "inlineMessage", component: "checkbox" as const, defaultValue: false },
      { label: "整体禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const formCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="form"', ':rules="rules"'];

  if (s.labelPosition !== "left") props.push(`label-position="${s.labelPosition}"`);
  if (s.labelWidth !== "140px") props.push(`label-width="${s.labelWidth}"`);
  if (s.size !== "sm") props.push(`size="${s.size}"`);
  props.push(`:trigger="${s.immediateValidate ? "['change', 'blur']" : "'none'"}"`);
  if (s.hideRequiredAsterisk) props.push("hide-required-asterisk");
  if (s.requireAsteriskPosition !== "right")
    props.push(`require-asterisk-position="${s.requireAsteriskPosition}"`);
  if (s.statusIcon) props.push("status-icon");
  if (s.inlineMessage) props.push("inline-message");
  if (s.disabled) props.push("disabled");

  return `<RebornForm\n  ${props.join("\n  ")}\n>\n  <RebornFormItem prop="username" label="用户名" required>\n    <RebornInput v-model="form.username" />\n  </RebornFormItem>\n</RebornForm>`;
});

// ─── 表单数据与校验 ─────────────────────────────────────────────

const form = reactive<FormData>({ ...initialForm });

/** 规则依赖当前值（newPassword 的 refine 引用了 form.password），故用 computed 重建 */
const rules = computed(() => createRules(form));

/** trigger 为 'none' 时只在手动调用 validate() 时校验 */
const formTrigger = computed<"none" | Array<"blur" | "change">>(() =>
  state.value.immediateValidate ? ["change", "blur"] : "none",
);

/** 最近一次提交结果，替代 alert 与 console 输出 */
const lastResult = ref<"" | "success" | "fail">("");

/** 最近一次校验失败的字段数量 */
const errorCount = ref(0);

function addContact() {
  form.contacts.push({
    phone: "",
    email: "",
    name: "",
    no: form.contacts.length + 1,
  });
}

async function submit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate((isValid: boolean, errors: Record<string, any>) => {
    errorCount.value = isValid ? 0 : Object.keys(errors || {}).length;
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
      v-model="state"
      :controls="controls"
      :code="formCode"
      component-name="RebornForm"
      title="交互演练场"
      description="校验规则由 Zod 描述；trigger 决定是输入即校验还是仅在提交时校验，label-width 仅在标签左右布局时生效。"
    >
      <RebornForm
        ref="formRef"
        :model-value="form"
        :rules="rules"
        :label-width="state.labelWidth"
        :label-position="state.labelPosition"
        :size="state.size"
        :trigger="formTrigger"
        :hide-required-asterisk="state.hideRequiredAsterisk"
        :require-asterisk-position="state.requireAsteriskPosition"
        :status-icon="state.statusIcon"
        :inline-message="state.inlineMessage"
        :disabled="state.disabled"
      >
        <RebornFormItem
          prop="username"
          label="用户名"
          required
        >
          <RebornInput
            v-model="form.username"
            placeholder="请输入用户名"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="interest"
          label="兴趣爱好"
          required
        >
          <div class="flex flex-wrap gap-4 py-2">
            <RebornCheckbox
              v-model="form.interest"
              value="a"
              label="篮球"
            />
            <RebornCheckbox
              v-model="form.interest"
              value="b"
              label="足球"
            />
            <RebornCheckbox
              v-model="form.interest"
              value="c"
              label="乒乓球"
            />
            <RebornCheckbox
              v-model="form.interest"
              value="d"
              label="羽毛球"
            />
          </div>
        </RebornFormItem>

        <RebornFormItem
          prop="gender"
          label="性别"
          required
        >
          <RebornSelect
            v-model="form.gender"
            :options="genderOptions"
            placeholder="请选择性别"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="birthday"
          label="出生年月"
          required
        >
          <RebornSelectDate
            v-model="form.birthday"
            type="date"
            placeholder="请选择出生年月"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="dateRange"
          label="入职时间"
          required
        >
          <RebornSelectDate
            v-model="form.dateRange"
            type="daterange"
            rangeable
            placeholder="起始日期 - 结束日期"
            value-format="YYYY-MM-DD"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="isAgree"
          label="是否同意"
          required
        >
          <div class="flex items-center gap-4 py-1">
            <RebornSwitch v-model="form.isAgree" />
            <span class="text-muted text-sm">同意《用户服务协议》</span>
          </div>
        </RebornFormItem>

        <RebornFormItem
          prop="password"
          label="密码"
          required
        >
          <RebornInput
            v-model="form.password"
            placeholder="请输入密码"
            password
          />
        </RebornFormItem>

        <RebornFormItem
          prop="newPassword"
          label="新密码"
          required
        >
          <RebornInput
            v-model="form.newPassword"
            placeholder="再次确认新密码"
            password
          />
        </RebornFormItem>

        <RebornFormItem
          prop="email"
          label="验证邮箱"
          required
        >
          <RebornInput
            v-model="form.email"
            placeholder="example@domain.com"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="age"
          label="年龄"
          required
        >
          <RebornInputNumber
            v-model="form.age"
            placeholder="18-100"
          />
        </RebornFormItem>

        <RebornFormItem
          prop="height"
          label="身高"
          required
        >
          <div class="flex w-full items-center gap-4">
            <RebornSlider
              v-model="form.height"
              :min="140"
              :max="220"
              class="flex-1"
            />
            <span class="text-muted w-12 font-mono text-sm">{{ form.height }}cm</span>
          </div>
        </RebornFormItem>

        <RebornFormItem
          prop="weight"
          label="体重"
          required
        >
          <div class="flex w-full items-center gap-4">
            <RebornSlider
              v-model="form.weight"
              :min="30"
              :max="150"
              class="flex-1"
            />
            <span class="text-muted w-12 font-mono text-sm">{{ form.weight }}kg</span>
          </div>
        </RebornFormItem>

        <RebornFormItem
          prop="bio"
          label="个人简介"
        >
          <RebornTextarea
            v-model="form.bio"
            placeholder="请输入简介 (至少10个字符，选填)"
          />
        </RebornFormItem>

        <!-- 嵌套动态列表：prop 以 contacts-索引-字段 的形式与 Zod 数组规则对应 -->
        <RebornFormItem
          prop="contacts"
          required
          label-position="top"
        >
          <template #label>
            <div class="mb-2 flex w-full items-center justify-between">
              <span class="text-highlighted text-sm font-semibold">联系人列表</span>
              <RebornButton
                size="sm"
                variant="outlined"
                label="添加联系人"
                @click="addContact"
              >
                <template #leading>
                  <Icon name="lucide:plus" />
                </template>
              </RebornButton>
            </div>
          </template>

          <div
            v-for="(contact, index) in form.contacts"
            :key="index"
            class="border-default rounded-ui-md mb-4 flex flex-col border p-4"
          >
            <div class="border-default mb-4 flex items-center justify-between border-b pb-3">
              <span class="text-default text-sm font-medium">#{{ index + 1 }} 联系人信息</span>
              <RebornButton
                variant="text"
                color="neutral"
                size="sm"
                @click="form.contacts.splice(index, 1)"
              >
                <Icon name="lucide:trash-2" />
              </RebornButton>
            </div>

            <div class="grid grid-cols-1 gap-x-8 md:grid-cols-2">
              <RebornFormItem
                :prop="`contacts-${index}-name`"
                label="姓名"
                required
                label-position="top"
              >
                <RebornInput
                  v-model="contact.name"
                  placeholder="请输入姓名"
                />
              </RebornFormItem>
              <RebornFormItem
                :prop="`contacts-${index}-phone`"
                label="手机号"
                required
                label-position="top"
              >
                <RebornInput
                  v-model="contact.phone"
                  placeholder="1XXXXXXXXXX"
                />
              </RebornFormItem>
              <RebornFormItem
                :prop="`contacts-${index}-email`"
                label="邮箱"
                required
                label-position="top"
              >
                <RebornInput
                  v-model="contact.email"
                  placeholder="example@domain.com"
                />
              </RebornFormItem>
              <RebornFormItem
                :prop="`contacts-${index}-no`"
                label="序号"
                required
                label-position="top"
              >
                <RebornInputNumber
                  v-model="contact.no"
                  placeholder="用于递增校验"
                />
              </RebornFormItem>
            </div>
          </div>
        </RebornFormItem>

        <div class="border-default mt-6 flex flex-wrap gap-3 border-t pt-6">
          <RebornButton
            label="提交表单"
            @click="submit"
          />
          <RebornButton
            variant="outlined"
            label="重置"
            @click="reset"
          />
          <RebornButton
            variant="soft"
            color="neutral"
            label="滚动到简介"
            @click="scrollToBio"
          />
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
    </Playground>

    <DemoSection
      title="实时数据"
      description="v-model 绑定的对象随输入同步更新，可直接观察 Zod 预处理后的取值类型。"
    >
      <pre
        class="border-default rounded-ui-sm text-muted max-h-96 overflow-auto border p-4 font-mono text-xs leading-relaxed"
      >{{ JSON.stringify(form, null, 2) }}</pre>
    </DemoSection>
  </div>
</template>
