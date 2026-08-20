<script setup lang="ts">
import type { buttonColors, buttonSizes, buttonVariants } from './reborn-button.config'
import { computed, ref, toRef } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-button.config'
import RebornLoading from '../reborn-loading/RebornLoading.vue'

export interface ButtonProps {
  label?: string // 按钮文本内容；提供 default 插槽时被插槽内容覆盖
  color?: typeof buttonColors[number] // 语义色：primary/secondary/success/info/warning/error/neutral，默认 primary
  variant?: typeof buttonVariants[number] // 视觉变体：solid 实心/outline 描边/soft 浅底/subtle 浅底加描边，默认 solid
  size?: typeof buttonSizes[number] // 尺寸：xs/sm/default/md/lg/xl/2xl（default 与 md 等高），默认 md
  loading?: boolean // 是否加载中；显示加载动画并禁用点击
  disabled?: boolean // 是否禁用按钮
  fluid?: boolean // 是否为 flex-1 布局
  gap?: boolean // 是否间隔按钮
  block?: boolean // 是否块级元素
  customClass?: any // 追加到根节点的自定义类名（对应 Web 端 class）
  ui?: any // 细粒度样式覆盖对象，键为 base/inner/label/loading
  hoverClass?: string // 按钮点击态样式类
  hoverStopPropagation?: boolean // 是否阻止点击态冒泡
  hoverStartTime?: number // 按住后出现点击态的延迟时间，单位毫秒
  hoverStayTime?: number // 手指松开后点击态保留时间，单位毫秒
  formType?: string // 表单提交类型（submit/reset），配合 form 组件使用
  openType?: string // 小程序开放能力类型（contact/getPhoneNumber/openSetting/launchApp/chooseAvatar 等），对应事件见 emits
  lang?: string // 语言
  sessionFrom?: string // 会话来源
  sendMessageTitle?: string // 会话标题
  sendMessagePath?: string // 会话路径
  sendMessageImg?: string // 会话图片
  showMessageCard?: boolean // 显示会话卡片
  appParameter?: string // 打开 APP 时，向 APP 传递的参数
  groupId?: string // 群ID
  guildId?: string // 公会ID
  publicId?: string // 公众号ID
  phoneNumberNoQuotaToast?: boolean // 手机号获取失败时是否弹出错误提示
  createliveactivity?: boolean // 是否创建直播活动
  round?: boolean // 是否为胶囊形状
  circle?: boolean // 是否为圆形
}

const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  loading: false,
  disabled: false,
  fluid: false,
  gap: false,
  hoverStartTime: 20,
  hoverStayTime: 70,
  block: false,
  round: true,
  circle: false
})

// 事件定义
const emit = defineEmits([
  'click', // 点击按钮时触发；disabled 或 loading 时不触发
  'tap', // 与 click 同时派发，便于沿用 uniapp @tap 写法
  'getuserinfo', // open-type="getUserInfo" 时触发，e.detail 含 userInfo 等用户信息
  'contact', // open-type="contact" 客服会话回调，e.detail.path/query 为小程序消息参数
  'getphonenumber', // open-type="getPhoneNumber" 时触发，e.detail.code 用于服务端换取手机号
  'error', // 使用开放能力发生错误时触发，e.detail 含错误信息
  'opensetting', // open-type="openSetting" 打开授权设置页后回调，e.detail.authSetting 为授权结果
  'launchapp', // open-type="launchApp" 打开 APP 成功时触发，参数经 appParameter 传给 APP
  'chooseavatar', // open-type="chooseAvatar"（微信）时触发，e.detail.avatarUrl 为所选头像临时路径
  'chooseaddress', // open-type="chooseAddress"（QQ）用户选择收货地址后回调，e.detail 含地址信息
  'chooseinvoicetitle', // open-type="chooseInvoiceTitle"（QQ）用户选择发票抬头后回调
  'addgroupapp', // open-type="addGroupApp"（QQ）添加群应用后回调
  'subscribe', // open-type="subscribe"（QQ）订阅号订阅结果回调
  'login', // open-type="login"（QQ）登录回调，e.detail 含登录 code
  'getrealtimephonenumber', // open-type="getRealtimePhoneNumber"（微信）实时手机号验证回调，e.detail.code 换取手机号
  'agreeprivacyauthorization', // open-type="agreePrivacyAuthorization"（微信）用户同意隐私协议后回调
])

const slots = defineSlots<{
  /** 前置内容（常放图标），作用域含 loading 状态；loading 时被加载动画替代 */
  leading: (props: { ui: any, loading: boolean }) => any
  /** 按钮主体内容，优先于 label prop 渲染 */
  default: (props: { ui: any }) => any
  /** 后置内容（常放图标）；loading 时不渲染 */
  trailing: (props: { ui: any }) => any
}>()

const b = tv(theme)

interface UniEvent {
  bubbles: boolean
  cancelable: boolean
  type: string
  target: any
  currentTarget: any
  timeStamp: number
  [key: string]: any
}
const { size: fieldGroupSize, disabled: fieldGroupDisabled } = useFormInject(props)

const isDisabled = computed(() => fieldGroupDisabled.value || props.loading)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')

const loadingColor = computed(() => {
  if (props.variant === 'solid') { return 'white' }
  return props.color
})

const loadingSize = computed(() => {
  const sizeMap: Record<string, number> = {
    'xs': 22,
    'sm': 24,
    'default': 26,
    'md': 26,
    'lg': 28,
    'xl': 30,
    '2xl': 32,
  }
  return sizeMap[size.value] || 16
})

const isIconOnly = computed(() => props.circle)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
  const styles = b({
    color: color.value,
    variant: variant.value,
    size: (fieldGroupSize.value || size.value) as any,
    disabled: fieldGroupDisabled.value,
    loading: props.loading,
    gap: props.gap,
    block: props.block,
    round: props.round,
    circle: props.circle
  })

  return {
    base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base, props.customClass) }),
    inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
    label: (opts?: { class?: any }) => styles.label({ class: cn(opts?.class, uiOverrides.value.label) }),
    loading: (opts?: { class?: any }) => styles.loading({ class: cn(opts?.class, uiOverrides.value.loading) }),
  }
})

// 点击事件处理
function onTap(e: UniEvent) {
  if (isDisabled.value) { return }

  emit('click', e)
  emit('tap', e)
}

// 点击态状态
const isHover = ref(false)

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
    isHover.value = true
  }
}

// 触摸结束事件处理
function onTouchEnd() {
  isHover.value = false
}

// 触摸取消事件处理
function onTouchCancel() {
  isHover.value = false
}
</script>

<template>
  <view :class="[
    ui.base(),
    isHover && hoverClass ? hoverClass : ''
  ]" @tap="onTap" @touchstart="onTouchStart" @touchend="onTouchEnd" @touchcancel="onTouchCancel">
    <button :class="ui.inner()" :disabled="isDisabled" :hover-class="hoverClass"
      :hover-stop-propagation="hoverStopPropagation" :hover-start-time="hoverStartTime" :hover-stay-time="hoverStayTime"
      :form-type="formType" :open-type="openType" :lang="lang" :session-from="sessionFrom"
      :send-message-title="sendMessageTitle" :send-message-path="sendMessagePath" :send-message-img="sendMessageImg"
      :show-message-card="showMessageCard" :app-parameter="appParameter" :group-id="groupId" :guild-id="guildId"
      :public-id="publicId" :phone-number-no-quota-toast="phoneNumberNoQuotaToast"
      :createliveactivity="createliveactivity" @getuserinfo="onGetUserInfo" @contact="onContact"
      @getphonenumber="onGetPhoneNumber" @error="onError" @opensetting="onOpenSetting" @launchapp="onLaunchApp"
      @chooseavatar="onChooseAvatar" @chooseaddress="onChooseAddress" @chooseinvoicetitle="onChooseInvoiceTitle"
      @addgroupapp="onAddGroupApp" @subscribe="onSubscribe" @login="onLogin"
      @getrealtimephonenumber="onGetRealtimePhoneNumber" @agreeprivacyauthorization="onAgreePrivacyAuthorization" />

    <!-- Leading Slot / Loading Spinner -->
    <view v-if="props.loading && !isIconOnly" :class="ui.loading()">
      <RebornLoading :color="loadingColor" :size="loadingSize" />
    </view>
    <slot v-else name="leading" :loading="props.loading" :ui="ui" />

    <view v-if="props.loading && isIconOnly" :class="ui.loading()">
      <RebornLoading :color="loadingColor" :size="loadingSize" />
    </view>
    <slot v-else :ui="ui">
      <text v-if="label" :class="ui.label()">
        {{ label }}
      </text>
    </slot>

    <!-- Trailing Slot -->
    <slot v-if="!props.loading" name="trailing" :ui="ui" />
  </view>
</template>

<style scoped>
.reborn-button-clicker {
  border: none;
}

.reborn-button-clicker::after {
  border: none;
}
</style>
