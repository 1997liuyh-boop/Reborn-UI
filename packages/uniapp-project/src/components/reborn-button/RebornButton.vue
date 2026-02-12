<script lang="ts">
export interface ButtonProps {
    label?: string
    color?: typeof buttonColors[number]
    variant?: typeof buttonVariants[number]
    size?: typeof buttonSizes[number]
    loading?: boolean
    disabled?: boolean
    square?: boolean
    customClass?: any
    ui?: any,
    hoverClass?: string, // 按钮点击态样式类
    hoverStopPropagation?: boolean, // 是否阻止点击态冒泡
    hoverStartTime?: number, // 按钮点击态持续时间
    hoverStayTime?: number, // 按钮点击态持续时间
    formType?: string, // 表单提交类型
    openType?: string, // 开放能力类型
    sessionFrom?: string, // 会话来源
    sendMessageTitle?: string, // 会话标题
    sendMessagePath?: string, // 会话路径
    sendMessageImg?: string, // 会话图片
    showMessageCard?: boolean, // 显示会话卡片
    appParameter?: string, // 打开 APP 时，向 APP 传递的参数
    groupId?: string, // 群ID
    guildId?: string, // 公会ID
    publicId?: string, // 公众号ID
    phoneNumberNoQuotaToast?: boolean, // 手机号获取失败时是否弹出错误提示
    createliveactivity?: boolean, // 是否创建直播活动
}

</script>

<script setup lang="ts">
import { computed, toRef, ref } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'

import { cn } from '@/lib/utils'

import theme, { buttonColors, buttonVariants, buttonSizes } from './reborn-button.config'

const b = tv(theme)

interface UniEvent {
    bubbles: boolean;
    cancelable: boolean;
    type: string;
    target: any;
    currentTarget: any;
    timeStamp: number;
    [key: string]: any;
}
const props = withDefaults(defineProps<ButtonProps>(), {
    color: 'primary',
    variant: 'solid',
    size: 'md',
    loading: false,
    disabled: false,
    square: false,
    hoverStartTime: 20,
    hoverStayTime: 70,
})

// 事件定义
const emit = defineEmits([
    "click",
    "tap",
    "getuserinfo",
    "contact",
    "getphonenumber",
    "error",
    "opensetting",
    "launchapp",
    "chooseavatar",
    "chooseaddress",
    "chooseinvoicetitle",
    "addgroupapp",
    "subscribe",
    "login",
    "getrealtimephonenumber",
    "agreeprivacyauthorization"
]);


const slots = defineSlots<{
    leading(props: { ui: any; loading: boolean }): any
    default(props: { ui: any }): any
    trailing(props: { ui: any }): any
}>()

const { orientation, size: fieldGroupSize, disabled: fieldGroupDisabled } = useFormInject(props)

const isDisabled = computed(() => fieldGroupDisabled.value || props.disabled || props.loading)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const square = toRef(props, 'square')

const uiOverrides = computed(() => props.ui || {});

const ui = computed(() => {
    const styles = b({
        color: color.value,
        variant: variant.value,
        size: (fieldGroupSize.value || size.value) as any,
        square: square.value,
        fieldGroup: orientation.value
    })

    return {
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        root: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }), // alias to base
        label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
        loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
        leadingIcon: (opts?: { class?: any }) => styles.leadingIcon({ class: cn(opts?.class, uiOverrides.value.leadingIcon) }),
        leadingAvatar: (opts?: { class?: any }) => styles.leadingAvatar({ class: cn(opts?.class, uiOverrides.value.leadingAvatar) }),
        leadingAvatarSize: (opts?: { class?: any }) => styles.leadingAvatarSize({ class: cn(opts?.class, uiOverrides.value.leadingAvatarSize) }),
        trailingIcon: (opts?: { class?: any }) => styles.trailingIcon({ class: cn(opts?.class, uiOverrides.value.trailingIcon) }),
    }
})

// 点击事件处理
function onTap(e: UniEvent) {
    if (isDisabled.value) return;

    emit("click", e);
    emit("tap", e);
}

// 点击态状态
const isHover = ref(false);

const onGetUserInfo = (e: any) => emit('getuserinfo', e)
const onContact = (e: any) => emit('contact', e)
const onGetPhoneNumber = (e: any) => emit('getphonenumber', e)
const onError = (e: any) => emit('error', e)
const onOpenSetting = (e: any) => emit('opensetting', e)
const onLaunchApp = (e: any) => emit('launchapp', e)
const onChooseAvatar = (e: any) => emit('chooseavatar', e)
const onChooseAddress = (e: any) => emit('chooseaddress', e)
const onChooseInvoiceTitle = (e: any) => emit('chooseinvoicetitle', e)
const onAddGroupApp = (e: any) => emit('addgroupapp', e)
const onSubscribe = (e: any) => emit('subscribe', e)
const onLogin = (e: any) => emit('login', e)
const onGetRealtimePhoneNumber = (e: any) => emit('getrealtimephonenumber', e)
const onAgreePrivacyAuthorization = (e: any) => emit('agreeprivacyauthorization', e)

// 触摸开始事件处理
function onTouchStart() {
    if (!isDisabled.value) {
        isHover.value = true;
    }
}

// 触摸结束事件处理
function onTouchEnd() {
    isHover.value = false;
}

// 触摸取消事件处理
function onTouchCancel() {
    isHover.value = false;
}
</script>

<template>
    <button class="reborn-button" :disabled="isDisabled" :class="ui.base({ class: props.customClass })"
        :hover-class="hoverClass" :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime"
        :hover-stay-time="hoverStayTime" :form-type="formType" :open-type="openType" :session-from="sessionFrom"
        :send-message-title="sendMessageTitle" :send-message-path="sendMessagePath" :send-message-img="sendMessageImg"
        :show-message-card="showMessageCard" :app-parameter="appParameter" :group-id="groupId" :guild-id="guildId"
        :public-id="publicId" :phone-number-no-quota-toast="phoneNumberNoQuotaToast"
        :createliveactivity="createliveactivity" @tap.stop="onTap" @getuserinfo="onGetUserInfo" @contact="onContact"
        @getphonenumber="onGetPhoneNumber" @error="onError" @opensetting="onOpenSetting" @launchapp="onLaunchApp"
        @chooseavatar="onChooseAvatar" @chooseaddress="onChooseAddress" @chooseinvoicetitle="onChooseInvoiceTitle"
        @addgroupapp="onAddGroupApp" @subscribe="onSubscribe" @login="onLogin"
        @getrealtimephonenumber="onGetRealtimePhoneNumber" @agreeprivacyauthorization="onAgreePrivacyAuthorization"
        @touchstart="onTouchStart" @touchend="onTouchEnd" @touchcancel="onTouchCancel">
        <slot name="leading" :loading="props.loading" :ui="ui">
            <view v-if="props.loading" :class="ui.loading?.()" />
        </slot>

        <slot :ui="ui">
            <text v-if="label" :class="ui.label()">
                {{ label }}
            </text>
            <slot v-else :ui="ui" :class="ui.label()" />
        </slot>


        <slot name="trailing" :ui="ui" />
    </button>
</template>
<style scoped>
.reborn-button {
    &::after {
        border: none;
    }
}
</style>