<script setup lang="ts">
import { computed, ref, reactive } from 'vue'
import { initialForm, genderOptions, createRules, type FormData } from './reborn-form-demo.config'
import RebornForm from '../../ui/reborn-form/RebornForm.vue'
import RebornFormItem from '../../ui/reborn-form/RebornFormItem.vue'

const formRef = ref<InstanceType<typeof RebornForm> | null>(null)
const immediateValidate = ref(true)

const form = reactive<FormData>({ ...initialForm })

// 根据当前值生成规则 (由于有 refine 引用了 form.password)
const rules = computed(() => createRules(form))

const formTrigger = computed<'none' | Array<'blur' | 'change'>>(() =>
    immediateValidate.value ? ['change', 'blur'] : 'none'
)

function addContact() {
    form.contacts.push({
        phone: '',
        email: '',
        name: '',
        no: form.contacts.length + 1,
    })
}

async function submit() {
    if (!formRef.value) return

    const valid = await formRef.value.validate((isValid, errors) => {
        if (!isValid) {
            console.log('Validation failed:', errors)
            // 使用全局 Toast 或直接 alert
            alert('请检查表单填写是否正确')
        }
    })

    if (valid) {
        alert('提交成功')
        console.log('Form data:', form)
    }
}

function reset() {
    formRef.value?.resetFields()
}

function scrollToBio() {
    formRef.value?.scrollToField('bio')
}
</script>

<template>
    <div class="space-y-6 p-4 w-full">
        <!-- 控制面板 -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Form 表单验证</h2>
                    <p class="text-xs text-gray-500 mt-1 uppercase tracking-wider">综合能力演示 (基于 Zod & Tailwind Variants)
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm text-gray-600 dark:text-gray-400">实时校验</span>
                    <RebornSwitch v-model="immediateValidate" />
                </div>
            </div>

            <RebornForm ref="formRef" :model-value="form" :rules="rules" label-width="120px" label-position="left"
                size="sm" :trigger="formTrigger">
                <RebornFormItem prop="username" label="用户名" required>
                    <RebornInput v-model="form.username" placeholder="请输入用户名" />
                </RebornFormItem>

                <RebornFormItem prop="interest" label="兴趣爱好" required>
                    <div class="flex flex-wrap gap-4 py-2">
                        <RebornCheckbox v-model="form.interest" value="a" label="篮球" />
                        <RebornCheckbox v-model="form.interest" value="b" label="足球" />
                        <RebornCheckbox v-model="form.interest" value="c" label="乒乓球" />
                        <RebornCheckbox v-model="form.interest" value="d" label="羽毛球" />
                    </div>
                </RebornFormItem>

                <RebornFormItem prop="gender" label="性别" required>
                    <RebornSelect v-model="form.gender" :options="genderOptions" placeholder="请选择性别" />
                </RebornFormItem>

                <RebornFormItem prop="birthday" label="出生年月" required>
                    <RebornSelectDate v-model="form.birthday" type="date" placeholder="请选择出生年月" />
                </RebornFormItem>

                <RebornFormItem prop="dateRange" label="入职时间" required>
                    <RebornSelectDate v-model="form.dateRange" type="daterange" rangeable placeholder="起始日期 - 结束日期"
                        value-format="YYYY-MM-DD" />
                </RebornFormItem>

                <RebornFormItem prop="isAgree" label="是否同意" required>
                    <div class="flex items-center gap-4 py-1">
                        <RebornSwitch v-model="form.isAgree" />
                        <span class="text-sm text-gray-500">同意《用户服务协议》</span>
                    </div>
                </RebornFormItem>

                <RebornFormItem prop="password" label="密码" required>
                    <RebornInput v-model="form.password" placeholder="请输入密码" password />
                </RebornFormItem>

                <RebornFormItem prop="newPassword" label="新密码" required>
                    <RebornInput v-model="form.newPassword" placeholder="再次确认新密码" password />
                </RebornFormItem>

                <RebornFormItem prop="email" label="验证邮箱" required>
                    <RebornInput v-model="form.email" placeholder="example@domain.com" />
                </RebornFormItem>

                <RebornFormItem prop="age" label="年龄" required>
                    <RebornInputNumber v-model="form.age" placeholder="18-100" />
                </RebornFormItem>

                <RebornFormItem prop="height" label="身高" required>
                    <div class="flex items-center gap-4 w-full">
                        <RebornSlider v-model="form.height" :min="140" :max="220" class="flex-1" />
                        <span class="text-sm font-mono text-primary-500 w-12">{{ form.height }}cm</span>
                    </div>
                </RebornFormItem>

                <RebornFormItem prop="weight" label="体重" required>
                    <div class="flex items-center gap-4 w-full">
                        <RebornSlider v-model="form.weight" :min="30" :max="150" class="flex-1" />
                        <span class="text-sm font-mono text-primary-500 w-12">{{ form.weight }}kg</span>
                    </div>
                </RebornFormItem>

                <RebornFormItem prop="bio" label="个人简介">
                    <RebornTextarea v-model="form.bio" placeholder="请输入简介 (至少10个字符，选填)" />
                </RebornFormItem>

                <!-- 嵌套动态列表 -->
                <RebornFormItem prop="contacts" required label-position="top">
                    <template #label>
                        <div class="flex w-full items-center justify-between mb-2">
                            <span class="font-bold text-gray-800 dark:text-gray-200">联系人列表</span>
                            <RebornButton size="sm" @click="addContact" variant="outline">
                                <Icon name="lucide:plus" class="mr-1 size-3" />
                                添加联系人
                            </RebornButton>
                        </div>
                    </template>

                    <div v-for="(contact, index) in form.contacts" :key="index"
                        class="mb-6 flex flex-col rounded-2xl p-6 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 shadow-sm relative group">

                        <div
                            class="mb-6 flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">#{{ index + 1 }}
                                联系人信息</span>
                            <button @click="form.contacts.splice(index, 1)"
                                class="text-gray-400 hover:text-destructive transition-colors">
                                <Icon name="lucide:trash-2" class="size-4" />
                            </button>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <RebornFormItem :prop="`contacts-${index}-name`" label="姓名" required label-position="top">
                                <RebornInput v-model="contact.name" placeholder="请输入姓名" />
                            </RebornFormItem>
                            <RebornFormItem :prop="`contacts-${index}-phone`" label="手机号" required label-position="top">
                                <RebornInput v-model="contact.phone" placeholder="1XXXXXXXXXX" />
                            </RebornFormItem>
                            <RebornFormItem :prop="`contacts-${index}-email`" label="邮箱" required label-position="top">
                                <RebornInput v-model="contact.email" placeholder="example@domain.com" />
                            </RebornFormItem>
                            <RebornFormItem :prop="`contacts-${index}-no`" label="序号" required label-position="top">
                                <RebornInputNumber v-model="contact.no" placeholder="用于递增校验" />
                            </RebornFormItem>
                        </div>
                    </div>
                </RebornFormItem>

                <!-- 底部底部操作 -->
                <div
                    class="sticky bottom-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 mt-8">
                    <RebornButton class="flex-1 min-w-[120px]" @click="submit">提交表单</RebornButton>
                    <RebornButton variant="outline" class="flex-1 min-w-[120px]" @click="reset">重置</RebornButton>
                    <RebornButton variant="soft" class="flex-1 min-w-[120px]" @click="scrollToBio">滚动到简介</RebornButton>
                </div>
            </RebornForm>
        </div>

        <!-- 数据预览 -->
        <div class="bg-gray-900 rounded-2xl p-6 overflow-hidden border border-gray-800">
            <h3 class="text-xs font-bold text-primary-400 uppercase tracking-widest mb-4">Real-time Data Debugger</h3>
            <pre class="text-sm text-gray-400 font-mono overflow-auto max-h-96 leading-relaxed">{{ JSON.stringify(form,
                null, 4) }}</pre>
        </div>
    </div>
</template>
