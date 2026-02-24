<script setup lang="ts">
import { reactive, ref } from 'vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import type { SelectOption } from '@/components/reborn-picker-view/RebornPickerView.vue'

const isShowCancel = ref(true)
const isButtonText = ref(false)
const isDisabled = ref(false)
const isShowValue = ref(false)

type Form = {
    selected: number | null
    selected2: string
    selected3: number[]
    selected4: number | null
}

const form = reactive<Form>({
    selected: null,
    selected2: '2',
    selected3: [],
    selected4: 3,
})

const selectRef2 = ref<InstanceType<typeof RebornSelect> | null>(null)

const options = ref<SelectOption[]>([
    { label: 'HTML', value: 1 },
    { label: 'CSS', value: 2 },
    { label: 'JavaScript', value: 3 },
    { label: 'Node', value: 4 },
    { label: 'Vite', value: 5 },
    { label: 'Webpack', value: 6 },
])

const options2 = ref<SelectOption[]>([
    { label: 'Vue', value: '1' },
    { label: 'React', value: '2' },
    { label: 'Angular', value: '3' },
    { label: 'Svelte', value: '4' },
])

const options3 = ref<SelectOption[]>([
    {
        label: '福建省', value: 1, children: [
            {
                label: '福州市', value: 1, children: [
                    { label: '鼓楼区', value: 1 },
                    { label: '台江区', value: 2 },
                    { label: '仓山区', value: 3 },
                    { label: '马尾区', value: 4 },
                ]
            },
            {
                label: '厦门市', value: 2, children: [
                    { label: '思明区', value: 1 },
                    { label: '湖里区', value: 2 },
                    { label: '集美区', value: 3 },
                    { label: '海沧区', value: 4 },
                ]
            },
            {
                label: '泉州市', value: 3, children: [
                    { label: '鲤城区', value: 1 },
                    { label: '丰泽区', value: 2 },
                    { label: '洛江区', value: 3 },
                    { label: '泉港区', value: 4 },
                ]
            },
        ]
    },
    {
        label: '浙江省', value: 2, children: [
            {
                label: '杭州市', value: 1, children: [
                    { label: '上城区', value: 1 },
                    { label: '下城区', value: 2 },
                    { label: '江干区', value: 3 },
                    { label: '拱墅区', value: 4 },
                ]
            },
            {
                label: '宁波市', value: 2, children: [
                    { label: '海曙区', value: 1 },
                    { label: '江北区', value: 2 },
                    { label: '北仑区', value: 3 },
                ]
            },
        ]
    },
    {
        label: '湖南省', value: 3, children: [
            {
                label: '长沙市', value: 1, children: [
                    { label: '芙蓉区', value: 1 },
                    { label: '天心区', value: 2 },
                    { label: '岳麓区', value: 3 },
                ]
            },
            {
                label: '株洲市', value: 2, children: [
                    { label: '荷塘区', value: 1 },
                    { label: '芦淞区', value: 2 },
                ]
            },
        ]
    },
    {
        label: '江西省', value: 4, children: [
            {
                label: '南昌市', value: 1, children: [
                    { label: '东湖区', value: 1 },
                    { label: '西湖区', value: 2 },
                    { label: '青云谱区', value: 3 },
                ]
            },
            {
                label: '九江市', value: 2, children: [
                    { label: '浔阳区', value: 1 },
                    { label: '濂溪区', value: 2 },
                ]
            },
        ]
    },
])

const options4 = ref<SelectOption[]>([])

function openSelect2() {
    selectRef2.value?.open((value: any) => {
        const d = options2.value.find((item) => item.value == value)
        uni.showToast({ title: `你选择了 ${d?.label}`, icon: 'none' })
    })
}
</script>

<template>
    <RebornPage title="选择器" description="用于从一组选项中选择一个值的组件。">

        <!-- 基础用法 -->
        <RebornCard title="基础用法" custom-class="space-y-4">
            <RebornSelect v-model="form.selected" :options="options" />
        </RebornCard>

        <!-- 自定义触发器 -->
        <RebornCard title="自定义触发器" custom-class="space-y-4">
            <text class="text-xs text-gray-4">通过 show-trigger 隐藏默认触发器，使用 ref 调用 open 方法打开</text>
            <RebornButton variant="outline" color="primary" @tap="openSelect2">打开选择器</RebornButton>
            <RebornSelect ref="selectRef2" v-model="form.selected2" :options="options2" :show-trigger="false" />
        </RebornCard>

        <!-- 多列 -->
        <RebornCard title="多列" custom-class="space-y-4">
            <text class="text-xs text-gray-4">通过 children 配置多级数据，使用 column-count 指定列数</text>
            <RebornSelect v-model="form.selected3" :options="options3" :column-count="3" />
        </RebornCard>

        <!-- 自定义配置 -->
        <RebornCard title="自定义配置" custom-class="space-y-4">
            <view v-if="form.selected4 != null && isShowValue"
                class="p-3 bg-gray-1 dark:bg-gray-8 rounded-lg text-sm mb-2">
                <text>绑定值：{{ form.selected4 }}</text>
            </view>

            <RebornSelect v-model="form.selected4" :options="options" :disabled="isDisabled" :show-cancel="isShowCancel"
                :confirm-text="isButtonText ? '下一步' : '确定'" :cancel-text="isButtonText ? '关闭' : '取消'" />

            <view class="flex justify-between mt-2">
                <text class="text-sm text-slate-500">显示取消按钮</text>
                <RebornSwitch v-model="isShowCancel" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">修改按钮文案</text>
                <RebornSwitch v-model="isButtonText" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">禁用</text>
                <RebornSwitch v-model="isDisabled" size="sm" />
            </view>
            <view class="flex justify-between">
                <text class="text-sm text-slate-500">显示绑定值</text>
                <RebornSwitch v-model="isShowValue" size="sm" />
            </view>
        </RebornCard>

        <!-- 空数据 -->
        <RebornCard title="空数据" custom-class="space-y-4">
            <RebornSelect v-model="form.selected" :options="options4" />
        </RebornCard>
    </RebornPage>
</template>
