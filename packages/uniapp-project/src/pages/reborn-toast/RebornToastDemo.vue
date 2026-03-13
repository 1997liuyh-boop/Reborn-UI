<script setup lang="ts">
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import { useToast } from '@/components/reborn-toast/index'
const toast = useToast()

function showToast(type: 'info' | 'success' | 'error' | 'warning' | 'loading') {
    if (type === 'loading') {
        toast.loading({
            msg: '3s后自动关闭',
            loadingType: 'ring',
            loadingColor: '#fff',
            duration: 2000,
        })
        setTimeout(() => {
            toast.close()
        }, 3000)
    } else {
        toast[type]({ msg: 'This is ' + type, duration: 1500, direction: 'horizontal' })
    }
}
function showTopToast() {
    toast.show({
        position: 'top',
        iconClass: 'star',
        msg: '顶部toast',
        closed() {
            console.log(232)
        },
        opened() {
            console.log(2323232)
        }
    })
}

function showMiddletoast() {
    toast.show({
        position: 'middle',
        iconName: 'loading',
        loadingType: 'spinner',
        loadingColor: '#fff',
        msg: '中间toast',
        closed() {
            console.log(232)
        },
        opened() {
            console.log(2323232)
        }
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
        msg: '3s后自动关闭',
        loadingType: 'gooey-balls',
        loadingColor: '#fff'
    })
    setTimeout(() => {
        toast.close()
    }, 3000)
}

function showLoadingToast3() {
    toast.loading({
        msg: '芦叶满汀洲，寒沙带浅流。二十年重过南楼。柳下系船犹未稳，能几日，又中秋。黄鹤断矶头，故人曾到否？旧江山浑是新愁。欲买桂花同载酒，终不似，少年游。',
        direction: 'vertical'
    })
    setTimeout(() => {
        toast.close()
    }, 3000)
}
</script>

<template>
    <RebornPage title="Toast 轻提示" description="用于轻量级反馈或提示，不会打断用户操作。">
        <RebornCard title="类型toast" custom-class="grid grid-cols-3 gap-2">
            <ReButton color="success" @click="showToast('success')">
                成功
            </ReButton>
            <ReButton color="info" @click="showToast('info')">
                常规
            </ReButton>
            <ReButton color="error" @click="showToast('error')">
                错误
            </ReButton>
            <ReButton color="warning" @click="showToast('warning')">
                警告
            </ReButton>
            <ReButton color="neutral" @click="showToast('loading')">
                加载
            </ReButton>
        </RebornCard>
        <RebornCard title="类型toast" custom-class="grid grid-cols-3 gap-2">
            <ReButton color="success" @click="showTopToast">
                顶部toast
            </ReButton>
            <ReButton color="info" @click="showMiddletoast">
                中间toast
            </ReButton>
            <ReButton color="error" @click="showBottomToast">
                底部toast
            </ReButton>
        </RebornCard>
        <RebornCard title="loading toast" custom-class="grid grid-cols-3 gap-2">
            <ReButton color="success" @click="showLoadingToast">
                基础环形
            </ReButton>
            <ReButton color="info" @click="showLoadingToast2">
                白色环形
            </ReButton>
            <ReButton color="error" @click="showLoadingToast3">
                纵向环形
            </ReButton>
        </RebornCard>
    </RebornPage>
</template>
