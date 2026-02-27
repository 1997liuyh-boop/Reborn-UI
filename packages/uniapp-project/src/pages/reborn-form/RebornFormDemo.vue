<script setup lang="ts">
import { ref } from 'vue'
import * as z from 'zod'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import RebornForm from '@/components/reborn-form/RebornForm.vue'
import RebornFormItem from '@/components/reborn-form/RebornFormItem.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornCheckbox from '@/components/reborn-checkbox/RebornCheckbox.vue'
import RebornTextarea from '@/components/reborn-textarea/RebornTextarea.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornInputNumber from '@/components/reborn-input-number/RebornInputNumber.vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'

type FormData = {
    username: string;
    gender: string;
    password: string;
    newPassword: string;
    email: string;
    age: number | undefined;
    bio: string;
    interest: string[];
    contacts: Contact[];
    isAgree: boolean;
    height: number,
    weight: number,
};


type Contact = {
    name: string;
    phone: string;
    email: string;
    no: number;
};

const formRef = ref()
const immediateValidate = ref(true)
const formTrigger = computed<"none" | Array<"blur" | "change">>(() => immediateValidate.value ? ['change', 'blur'] : 'none')

const form = ref<FormData>({
    username: '乐一番',
    gender: 'male',
    password: 'aA123456789!',
    newPassword: 'aA1234562789!',
    email: '1114321@qq.com',
    age: 18,
    bio: '',
    height: 180,
    weight: 70,
    interest: [],
    contacts: [],
    isAgree: false
})

// 性别选项
const genderOptions = [
    {
        label: "未知",
        value: 0
    },
    {
        label: "男",
        value: 1
    },
    {
        label: "女",
        value: 2
    }
]

const emailRule = z.email('邮箱格式不正确').refine(val => val.endsWith('@qq.com') || val.endsWith('@163.com'), '仅支持 QQ 或 163 邮箱')
const phoneSchema = z.string()
    .min(11, { message: "手机号长度不足" })
    .max(11, { message: "手机号长度超出" })
    .regex(/^1[3-9]\d{9}$/, { message: "手机号格式不正确" });
const passwordSchema = z.string().min(8, '密码至少8位').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, '需包含大小写字母和特殊符号');
const rules = z.object({
    username: z.string().min(3, '用户名至少3个字符'),
    password: passwordSchema,
    newPassword: passwordSchema.refine((val) => val !== form.value.password, '新密码不能与旧密码相同'),
    gender: z.coerce.number({ message: '请选择性别' }),
    email: emailRule,
    age: z.number()
        .min(18, { message: "年龄最小不能小于 18 岁" })
        .max(100, { message: "年龄最大不能超过 100 岁" }),
    height: z.number()
        .min(160, { message: "身高不能小于160cm" })
        .max(190, { message: "身高不能大于190cm" }),
    weight: z.number()
        .min(50, { message: "体重不能小于50kg" })
        .max(100, { message: "体重不能大于100kg" }),
    interest: z.array(z.string()).min(1, '请至少选择一项兴趣爱好'),
    isAgree: z.literal(true, {
        message: "请同意协议"
    }),
    bio: z.string().min(10, '简介至少10个字符').optional().or(z.literal('')),
    contacts: z.array(z.object({
        name: z.string().min(2, 'Name 最少两个字符'),
        phone: phoneSchema,
        email: emailRule,
        no: z.coerce.number(),
    }))
        .min(3, '联系人至少需要3个')
        .refine((items) => {
            // 逻辑：校验 no 和 money 是否递增
            for (let i = 1; i < items.length; i++) {
                if (items[i].no <= items[i - 1].no) {
                    return false;
                }
            }
            return true;
        }, {
            message: '排序必须是递增的'
        })
})

function addContact() {
    form.value.contacts.push({
        phone: "",
        email: "",
        name: "",
        no: 0
    });
}

const submit = async () => {
    if (!formRef.value) return

    const valid = await formRef.value.validate((isValid: boolean, errors: any[]) => {
        if (!isValid) {
            console.log('Validation failed:', errors)
            uni.showToast({
                title: '请检查表单',
                icon: 'none'
            })
        }
    })

    if (valid) {
        uni.showToast({
            title: '提交成功',
            icon: 'success'
        })
        console.log('Form data:', form.value)
    }
}

const reset = () => {
    formRef.value?.resetFields()
}

const scrollToBio = () => {
    formRef.value?.scrollToField('bio')
}
</script>

<template>

    <RebornPage title="Form 表单" description="表单组件用于数据录入与校验，支持多种校验规则、错误提示、禁用状态等功能。">
        <RebornCard title="表单验证">
            <view class="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <text class="text-sm text-gray-6 dark:text-gray-4">开启实时校验（输入内容时立即见效）</text>
                <RebornSwitch v-model="immediateValidate" />
            </view>

            <reborn-form ref="formRef" :model-value="form" :rules="rules" label-width="160rpx" label-position="left"
                size="sm" :trigger="formTrigger">
                <reborn-form-item prop="username" label="用户名" required>
                    <RebornInput v-model="form.username" placeholder="请输入用户名" />
                </reborn-form-item>

                <reborn-form-item prop="interest" label="兴趣爱好" required>
                    <view class="flex flex-wrap gap-2">
                        <RebornCheckbox v-model="form.interest" value="a" label="篮球" />
                        <RebornCheckbox v-model="form.interest" value="b" label="足球" />
                        <RebornCheckbox v-model="form.interest" value="c" label="乒乓球" />
                        <RebornCheckbox v-model="form.interest" value="d" label="羽毛球" />
                    </view>
                </reborn-form-item>

                <reborn-form-item prop="gender" label="性别" required>
                    <RebornSelect v-model="form.gender" :options="genderOptions" />
                </reborn-form-item>

                <reborn-form-item prop="isAgree" label="是否同意" required>
                    <RebornSwitch v-model="form.isAgree" active-label="同意" inactive-label="不同意" />
                </reborn-form-item>

                <reborn-form-item prop="password" label="密码" required>
                    <RebornInput v-model="form.password" placeholder="请输入密码" password />
                </reborn-form-item>

                <reborn-form-item prop="newPassword" label="新密码" required>
                    <RebornInput v-model="form.newPassword" placeholder="请输入新密码" password />
                </reborn-form-item>

                <reborn-form-item prop="email" label="邮箱" required>
                    <RebornInput v-model="form.email" placeholder="请输入邮箱" />
                </reborn-form-item>

                <reborn-form-item prop="age" label="年龄" required>
                    <RebornInputNumber v-model="form.age" placeholder="请输入年龄" />
                </reborn-form-item>

                <reborn-form-item prop="height" label="身高" required>
                    <RebornSlider v-model="form.height" :max="220">
                        <template #value="{ value }">
                            <RebornText :ui="{ base: 'w-[40px] text-xs' }"> {{ value }}cm</RebornText>
                        </template>
                    </RebornSlider>
                </reborn-form-item>

                <reborn-form-item prop="weight" label="体重" required>
                    <RebornSlider v-model="form.weight" :max="150">
                        <template #value="{ value }">
                            <RebornText :ui="{ base: 'w-[40px] text-xs' }"> {{ value }}kg</RebornText>
                        </template>
                    </RebornSlider>
                </reborn-form-item>

                <!-- 演示自定义 UI 样式覆盖 -->
                <reborn-form-item prop="bio" label="个人简介" :ui="{ label: 'text-blue-500', error: 'text-sm font-bold' }">
                    <view>
                        <RebornTextarea v-model="form.bio" placeholder="请输入简介 (选填)" />
                    </view>
                </reborn-form-item>

                <reborn-form-item prop="contacts" required label-position="top">
                    <template #label>
                        <view class="flex items-center justify-between gap-2 w-full">
                            <view class="flex-1">联系人</view>
                            <RebornButton @click="addContact">
                                <template #leading>
                                    <view class="i-lucide-circle-plus w-4 h-4"></view>
                                </template>
                                添加联系人
                            </RebornButton>
                        </view>
                    </template>
                    <view v-for="(contact, index) in form.contacts" :key="index"
                        class="rounded-xl ring-1 ring-gray-200 p-4 mb-4 flex flex-col">
                        <view
                            class="text-26 text-gray-8 dark:text-gray-1 font-medium flex items-center gap-1 border-b border-gray-200 pb-2 mb-4">
                            联系人 {{ index + 1 }}
                        </view>
                        <reborn-form-item :prop="`contacts-${index}-name`" label="姓名" required label-position="top"
                            require-asterisk-position="left">
                            <RebornInput v-model="contact.name" placeholder="请输入姓名" />
                        </reborn-form-item>
                        <reborn-form-item :prop="`contacts-${index}-phone`" label="手机号" required label-position="top"
                            require-asterisk-position="left">
                            <RebornInput v-model="contact.phone" placeholder="请输入手机号" />
                        </reborn-form-item>
                        <reborn-form-item :prop="`contacts-${index}-email`" label="邮箱" required label-position="top"
                            require-asterisk-position="left">
                            <RebornInput v-model="contact.email" placeholder="请输入邮箱" />
                        </reborn-form-item>
                        <reborn-form-item :prop="`contacts-${index}-no`" label="序号" required label-position="top"
                            require-asterisk-position="left">
                            <RebornInputNumber v-model="contact.no" placeholder="请输入序号" />
                        </reborn-form-item>
                    </view>
                </reborn-form-item>
            </reborn-form>

            <view class="flex flex-col gap-3 mt-8">
                <RebornButton @click="submit" :ui="{ base: 'w-full' }">提交</RebornButton>
                <RebornButton @click="reset" variant="outline" :ui="{ base: 'w-full' }">重置</RebornButton>
                <RebornButton @click="scrollToBio" variant="subtle" :ui="{ base: 'w-full' }">
                    滚动到简介
                </RebornButton>
            </view>
        </RebornCard>
        <RebornCard title="数据">
            <view class="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-hidden">
                <text
                    class="text-xs font-mono text-gray-7 dark:text-gray-3 select-text whitespace-pre-wrap break-all leading-5">
                    {{ JSON.stringify(form, null, 4) }}
                </text>
            </view>
        </RebornCard>
    </RebornPage>
</template>
