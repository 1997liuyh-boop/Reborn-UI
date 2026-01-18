<script setup lang="ts">
import { computed, toRef } from 'vue'
import theme, { buttonColors, buttonVariants, buttonSizes } from './reborn-button.config'
import { useFieldGroup } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'

defineOptions({
  name: 'reborn-button',
  inheritAttrs: false,
})

const b = tv(theme)

export interface ButtonProps {
  label?: string
  color?: typeof buttonColors[number]
  variant?: typeof buttonVariants[number]
  size?: typeof buttonSizes[number]
  loading?: boolean
  disabled?: boolean
  square?: boolean
  class?: any
  ui?: any
  // Uniapp specific props
  formType?: string
  openType?: string
  hoverClass?: string
  hoverStopPropagation?: boolean
  hoverStartTime?: number
  hoverStayTime?: number
}

const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
  variant: 'solid',
  size: 'md',
  loading: false,
  disabled: false,
  square: false,
  hoverClass: undefined,
  hoverStartTime: 20,
  hoverStayTime: 70
})

const emit = defineEmits([
  'click',
  'getuserinfo',
  'contact',
  'getphonenumber',
  'error',
  'opensetting',
  'launchapp',
  'chooseavatar',
  'chooseaddress',
  'chooseinvoicetitle',
  'addgroupapp',
  'subscribe',
  'login',
  'getrealtimephonenumber',
  'agreeprivacyauthorization',
])

const { orientation, size: fieldGroupSize } = useFieldGroup(props)

const isDisabled = computed(() => props.disabled || props.loading)

const color = toRef(props, 'color')
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const square = toRef(props, 'square')

const ui = computed(() => b({
  color: color.value,
  variant: variant.value,
  size: (fieldGroupSize.value || size.value) as any,
  square: square.value,
  fieldGroup: orientation.value
}))

const onClick = (e: any) => {
  if (isDisabled.value) return
  emit('click', e)
}

// Forward other events
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
</script>

<template>
  <button :disabled="isDisabled" :class="ui.base({ class: props.class })" :form-type="props.formType"
    :open-type="props.openType" :hover-class="props.hoverClass !== undefined ? props.hoverClass : ui.hoverClass()"
    :hover-stop-propagation="props.hoverStopPropagation" :hover-start-time="props.hoverStartTime"
    :hover-stay-time="props.hoverStayTime" @click="onClick" @getuserinfo="onGetUserInfo" @contact="onContact"
    @getphonenumber="onGetPhoneNumber" @error="onError" @opensetting="onOpenSetting" @launchapp="onLaunchApp"
    @chooseavatar="onChooseAvatar" @chooseaddress="onChooseAddress" @chooseinvoicetitle="onChooseInvoiceTitle"
    @addgroupapp="onAddGroupApp" @subscribe="onSubscribe" @login="onLogin"
    @getrealtimephonenumber="onGetRealtimePhoneNumber" @agreeprivacyauthorization="onAgreePrivacyAuthorization">
    <slot name="leading" :ui="ui">
      <view v-if="props.loading" :class="['i-svg-spinners-270-ring w-4 h-4', ui.leadingIcon()]" />
    </slot>

    <slot :ui="ui">
      <span v-if="label" :class="ui.base()">
        {{ label }}
      </span>
      <slot v-else :ui="ui" />
    </slot>

    <slot name="trailing" :ui="ui" />
  </button>
</template>

<style scoped></style>
