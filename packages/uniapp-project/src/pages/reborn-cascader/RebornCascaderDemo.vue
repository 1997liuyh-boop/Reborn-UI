<script setup lang="ts">
import { ref } from 'vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'

import RebornText from '@/components/reborn-text/RebornText.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCascader from '@/components/reborn-cascader/RebornCascader.vue'
import { CascaderSizes, CascaderColors } from '@/components/reborn-cascader/reborn-cascader.config'


const currentSize = ref(CascaderSizes[0])
const currentColor = ref(CascaderColors[0])

const value1 = ref<any[]>([])
const value2 = ref<any[]>(['110000', '110101'])
const value3 = ref<any[]>([])

const options = [
    {
        label: '北京市',
        value: '110000',
        children: [
            { label: '东城区', value: '110101' },
            { label: '西城区', value: '110102' },
            { label: '朝阳区', value: '110105' },
            { label: '丰台区', value: '110106' },
        ]
    },
    {
        label: '上海市',
        value: '310000',
        children: [
            { label: '黄浦区', value: '310101' },
            { label: '徐汇区', value: '310104' },
            { label: '长宁区', value: '310105' },
        ]
    },
    {
        label: '广东省',
        value: '440000',
        children: [
            {
                label: '广州市',
                value: '440100',
                children: [
                    { label: '越秀区', value: '440104' },
                    { label: '荔湾区', value: '440103' },
                    { label: '天河区', value: '440106', children: [{ label: '街道', value: '4401061' }] },
                ]
            },
            {
                label: '深圳市',
                value: '440300',
                children: [
                    { label: '罗湖区', value: '440303' },
                    { label: '福田区', value: '440304' },
                    { label: '南山区', value: '440305' },
                ]
            }
        ]
    }
]

const cascaderRef = ref<any>(null)
const openExternal = () => {
    cascaderRef.value?.open()
}

const onChange = (val: any) => {
    console.log('Change:', val)
}

const valueMultiple = ref<(string | number)[][]>([])
const valueLazy = ref<(string | number)[]>([])
const valueLeaf = ref<(string | number)[]>([])

const cunt = ref(0)
const lazyLoad = (node: any, resolve: any) => {
    const { value, isRoot } = node
    setTimeout(() => {
        cunt.value++
        if (isRoot) {
            resolve([
                { label: '北京市', value: '110000' },
                { label: '上海市', value: '310000' },
                { label: '广东省', value: '440000' },
            ])
            return
        }
        const children = [
            { label: `动态节点 ${value}-1`, value: `${value}-1`, leaf: cunt.value >= 8 ? true : false },
            { label: `动态节点 ${value}-2`, value: `${value}-2`, leaf: cunt.value >= 9 ? true : false },
        ]
        resolve(children)
    }, 1000)
}
</script>

<template>
    <RebornPage title="Cascader 级联选择器" description="多层级的数据选择，通常用于省市区、分类导航等场景。">
        <RebornCard title="基础用法">
            <RebornCascader v-model="value1" :options="options" placeholder="请选择省市区" @change="onChange"
                :size="currentSize" :color="currentColor">
                <template #tabs="{ label, index, current }">
                    <view class="text-24"
                        :class="index === current ? 'text-primary relative after:absolute after:-bottom-2 after:left-0 after:w-full after:h-1 after:bg-primary' : 'text-gray-500'">
                        {{ label }}
                    </view>
                </template>
            </RebornCascader>
            <view class="mt-4 text-[24rpx] text-gray-500">
                当前选中值: {{ JSON.stringify(value1) }}
            </view>
        </RebornCard>

        <RebornCard title="初始值">
            <RebornCascader v-model="value2" :options="options" :size="currentSize" :color="currentColor" />
        </RebornCard>
        <RebornCard title="配置">
            <RebornText color="neutral">
                尺寸：
            </RebornText>
            <RebornRadioGroup v-model="currentSize">
                <RebornRadio v-for="s in CascaderSizes" :key="s" :value="s" :label="s" />
            </RebornRadioGroup>
            <RebornText color="neutral">
                按钮颜色：
            </RebornText>
            <RebornRadioGroup v-model="currentColor">
                <RebornRadio v-for="item in CascaderColors" :key="item" :value="item" :showIcon="false">
                    <template #default="{ isChecked }">
                        <view class="relative flex size-5">
                            <view v-if="isChecked"
                                class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                                :class="`bg-${item}`">
                            </view>
                            <view class="relative inline-flex size-5 rounded-full" :class="`bg-${item}`"></view>
                        </view>
                    </template>
                </RebornRadio>
            </RebornRadioGroup>
        </RebornCard>


        <RebornCard title="外部控制">
            <view class="flex flex-col gap-4">
                <RebornButton @click="openExternal">手动打开</RebornButton>
                <RebornCascader ref="cascaderRef" v-model="value3" :options="options" :show-trigger="false" />
                <view class="text-[24rpx] text-gray-500">
                    通过 ref 调用 open() 方法控制。
                </view>
            </view>
        </RebornCard>

        <RebornCard title="多选模式">
            <RebornCascader v-model="valueMultiple" :options="options" multiple placeholder="支持多选" />
            <view class="mt-4 text-[24rpx] text-gray-500">
                已选路径数量: {{ valueMultiple.length }}
            </view>
        </RebornCard>

        <RebornCard title="懒加载 (动态加载)">
            <RebornCascader v-model="valueLazy" :lazy="true" :lazy-load="lazyLoad" placeholder="点击加载子节点" />
        </RebornCard>

        <RebornCard title="层级限制 (leafLevel=2)">
            <RebornCascader v-model="valueLeaf" :options="options" :leafLevel="2" placeholder="只能选到第二级" />
        </RebornCard>

        <RebornCard title="自定义高度">
            <RebornCascader v-model="value1" :options="options" :height="400" placeholder="较矮的选择页" />
        </RebornCard>
    </RebornPage>
</template>
