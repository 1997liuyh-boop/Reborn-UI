<script setup lang="ts">
import { useToast } from '@/components/reborn/ui/reborn-toast/index'

const toast = useToast()

function showToast(type: 'info' | 'success' | 'error' | 'warning' | 'loading') {
    if (type === 'loading') {
        toast.loading({
            msg: '3s后自动关闭',
            duration: 0,
            cover: true
        })
        setTimeout(() => {
            toast.close()
        }, 3000)
    } else {
        toast[type]({ msg: 'This is ' + type, duration: 1500 })
    }
}

function showTopToast() {
    toast.show({
        position: 'top',
        msg: '顶部toast',
    })
}

function showMiddletoast() {
    toast.show({
        position: 'middle',
        iconName: 'loading',
        msg: '中间toast',
    })
}

function showBottomToast() {
    toast.show({
        position: 'bottom',
        msg: '底部toast'
    })
}

function showLoadingToast() {
    toast.loading('3s后自动关闭')
    setTimeout(() => {
        toast.close()
    }, 3000)
}

function showLoadingToast2() {
    toast.loading({
        msg: '自定义Loading Toast',
        duration: 0,
        cover: true
    })
    setTimeout(() => {
        toast.close()
    }, 3000)
}

function showLoadingToast3() {
    toast.loading({
        msg: '芦叶满汀洲，寒沙带浅流。二十年重过南楼。柳下系船犹未稳，能几日，又中秋。黄鹤断矶头，故人曾到否？旧江山浑是新愁。欲买桂花同载酒，终不似，少年游。',
        duration: 0
    })
    setTimeout(() => {
        toast.close()
    }, 3000)
}
</script>

<template>
    <div class="space-y-6">
        <div class="space-y-4">
            <h3 class="text-lg font-medium">类型提示</h3>
            <div
                class="rounded-xl border bg-card text-card-foreground shadow p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <RebornButton color="success" variant="solid" @click="showToast('success')">成功</RebornButton>
                <RebornButton color="info" variant="solid" @click="showToast('info')">常规</RebornButton>
                <RebornButton color="error" variant="solid" @click="showToast('error')">错误</RebornButton>
                <RebornButton color="warning" variant="solid" @click="showToast('warning')">警告</RebornButton>
                <RebornButton color="primary" variant="solid" @click="showToast('loading')">加载</RebornButton>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">定位提示</h3>
            <div class="rounded-xl border bg-card text-card-foreground shadow p-4 grid grid-cols-3 gap-2">
                <RebornButton color="primary" variant="solid" @click="showTopToast">顶部toast</RebornButton>
                <RebornButton color="primary" variant="solid" @click="showMiddletoast">中间toast</RebornButton>
                <RebornButton color="primary" variant="solid" @click="showBottomToast">底部toast</RebornButton>
            </div>
        </div>

        <div class="space-y-4">
            <h3 class="text-lg font-medium">加载提示</h3>
            <div
                class="rounded-xl border bg-card text-card-foreground shadow p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <RebornButton color="primary" variant="solid" @click="showLoadingToast">基础加载</RebornButton>
                <RebornButton color="primary" variant="solid" @click="showLoadingToast2">自定义加载</RebornButton>
                <RebornButton color="primary" variant="solid" @click="showLoadingToast3">长文本加载</RebornButton>
            </div>
        </div>
    </div>
</template>
