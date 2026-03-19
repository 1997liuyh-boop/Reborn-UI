<script setup lang="ts">
import { ref } from 'vue'
import RebornRootPortal from '@/components/reborn-root-portal/RebornRootPortal.vue'
import RebornButton from '@/components/reborn-button/RebornButton.vue'

const showPortal = ref(false)

const togglePortal = () => {
    showPortal.value = !showPortal.value
}
</script>

<template>
    <view class="p-4">
        <view class="mb-8 p-4 bg-gray-100 rounded-lg">
            <view class="text-32 font-bold mb-2">RootPortal 根节点渲染</view>
            <view class="text-28 text-gray-600">
                RootPortal 组件可以将子节点渲染到页面的根节点，从而脱离当前的层级关系。
                常用于弹窗、等需要覆盖全屏的场景。
            </view>
        </view>

        <view class="flex flex-col gap-4">
            <view class="text-28 font-semibold mb-2">基础用法</view>
            <RebornButton @click="togglePortal">
                {{ showPortal ? '关闭 Portal' : '打开 Portal' }}
            </RebornButton>

            <view class="mt-4 p-4 border border-dashed border-gray-300 rounded">
                这里是普通文档流中的内容。
            </view>

            <RebornRootPortal v-if="showPortal">
                <view class="fixed inset-0 flex items-center justify-center pointer-events-none">
                    <view
                        class="bg-white p-6 rounded-2xl shadow-2xl pointer-events-auto border border-gray-100 animate-in fade-in zoom-in duration-300">
                        <view class="text-32 font-bold mb-4 text-primary">Portal 内容</view>
                        <view class="text-28 mb-6 text-gray-600">
                            这段内容被渲染到了页面的根节点。
                            它脱离了原有的 DOM 结构。
                        </view>
                        <RebornButton @click="showPortal = false" size="sm" variant="soft">
                            确定并关闭
                        </RebornButton>
                    </view>
                </view>
            </RebornRootPortal>
        </view>
    </view>
</template>

<style scoped>
.animate-in {
    animation-fill-mode: both;
}

@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes zoom-in {
    from {
        transform: scale(0.95);
    }

    to {
        transform: scale(1);
    }
}

.fade-in {
    animation-name: fade-in;
}

.zoom-in {
    animation-name: zoom-in;
}
</style>
