<script setup lang="ts">
import type { PopoverPlacement } from '@/components/reborn-popover/types'
import { computed, shallowRef } from 'vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornPopover from '@/components/reborn-popover/RebornPopover.vue'
import RebornSelect from '@/components/reborn-select/RebornSelect.vue'

const isControlledOpen = shallowRef(false)
const showPopover2 = shallowRef(false)
const sideOptions = [
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' }
]
const alignOptions = [
    { label: 'Start', value: 'start' },
    { label: 'Center', value: 'center' },
    { label: 'End', value: 'end' }
]

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'
const activeSide = shallowRef<Side>('bottom')
const activeAlign = shallowRef<Align>('center')
/** 方向与对齐拼成 placement：居中对齐只写方向，其余写成「方向-对齐」 */
const activePlacement = computed<PopoverPlacement>(() =>
    activeAlign.value === 'center' ? activeSide.value : `${activeSide.value}-${activeAlign.value}`
)

function manualClose() {
    isControlledOpen.value = false
}
</script>

<template>
    <RebornPage title="Popover" description="弹出气泡组件，用于点击元素弹出相关操作或附加内容" :ui="{ body: 'space-y-4 p-4 pb-20' }">


        <RebornCard :overflowVisible="true">
            <template #title><view>12 个方向动态演示<text class="mt-[8rpx] block text-[24rpx] text-gray-500">placement 由方向与对齐组合而成，如 bottom-start</text></view></template>
            <view class="flex flex-col space-y-6 py-4">
                <view class="flex justify-between space-x-2 px-2">
                    <view class="flex-1">
                        <view class="text-xs text-gray-500 mb-2">主轴 Side</view>
                        <RebornSelect v-model="activeSide" :options="sideOptions" :clearable="false" />
                    </view>
                    <view class="flex-1">
                        <view class="text-xs text-gray-500 mb-2">交叉轴 Align (仅上下有效)</view>
                        <RebornSelect v-model="activeAlign" :options="alignOptions" :clearable="false" />
                    </view>
                </view>

                <view
                    class="h-[400rpx] flex items-center justify-center border border-dashed border-gray-200 mt-6 rounded relative overflow-visible">
                    <RebornPopover v-model:open="showPopover2" :arrow="true"
                        :placement="activePlacement" :side-offset="12">

                        <RebornButton size="md">点我弹出</RebornButton>
                        <template #content>
                            <view class="p-3 w-[500rpx] text-center text-xs">
                                橐离国王侍婢有娠，王欲杀之。婢曰：“有气如鸡子，从天来下，故我有娠。”后生子，捐之猪圈中，猪以喙嘘之；徙至马枥中马复以气嘘之。故得不死。王疑以为天子也，乃令其母收畜之，名曰东明。常令牧马。东明善射，王恐其夺己国也，欲杀之。东明走，南至施掩水，以弓击水。鱼鳖浮为桥，东明得渡。鱼鳖解散，追兵不得渡。因都王夫余。《搜神记》
                            </view>
                        </template>
                    </RebornPopover>
                </view>
            </view>
        </RebornCard>

        <!-- 受控模式 -->
        <RebornCard :overflowVisible="true">
            <template #title>
                <view>受控模式与手动关闭<text class="mt-[8rpx] block text-[24rpx] text-gray-500">绑定 v-model:open，通过模型关闭弹层。</text></view>
      </template>
      <view class="flex flex-col items-center justify-center p-4 space-y-4">
                <view class="text-sm">当前状态: {{ isControlledOpen ? '打开' : '关闭' }}</view>
                <RebornPopover v-model:open="isControlledOpen" placement="top"
                    :arrow="true">
                    <RebornButton :color="isControlledOpen ? 'error' : 'primary'">受控组件触发器</RebornButton>
                    <template #content>
                        <view class="p-4 flex flex-col items-center space-y-4 w-[400rpx]">
                            <text class="text-sm">点击按钮关闭，或通过绑定状态管理。</text>
                            <RebornButton size="sm" variant="soft" @click="manualClose">通过模型关闭</RebornButton>
                        </view>
                    </template>
        </RebornPopover>
      </view>
        </RebornCard>

    </RebornPage>
</template>
