<template>
  <view :class="rootClass" :style="buttonStyle" @tap.stop="onTap">
    <button
      :class="clickerClass"
      :disabled="isDisabled"
      :hover-class="hoverClass"
      :hover-stop-propagation="hoverStopPropagation"
      :hover-start-time="hoverStartTime"
      :hover-stay-time="hoverStayTime"
      :form-type="formType"
      :open-type="openType"
      :lang="lang"
      :session-from="sessionFrom"
      :send-message-title="sendMessageTitle"
      :send-message-path="sendMessagePath"
      :send-message-img="sendMessageImg"
      :show-message-card="showMessageCard"
      :app-parameter="appParameter"
      :group-id="groupId"
      :guild-id="guildId"
      :public-id="publicId"
      :phone-number-no-quota-toast="phoneNumberNoQuotaToast"
      :createliveactivity="createliveactivity"
      @getuserinfo="onGetUserInfo"
      @contact="onContact"
      @getphonenumber="onGetPhoneNumber"
      @error="onError"
      @opensetting="onOpenSetting"
      @launchapp="onLaunchApp"
      @chooseavatar="onChooseAvatar"
      @chooseaddress="onChooseAddress"
      @chooseinvoicetitle="onChooseInvoiceTitle"
      @addgroupapp="onAddGroupApp"
      @subscribe="onSubscribe"
      @login="onLogin"
      @getrealtimephonenumber="onGetRealtimePhoneNumber"
      @agreeprivacyauthorization="onAgreePrivacyAuthorization"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    ></button>

    <view v-if="loading && !disabled" :class="spinnerClass"></view>

    <view v-if="hasIconSlot" :class="iconWrapperClass">
      <slot name="icon"></slot>
    </view>
    <text v-else-if="icon" :class="iconClass">{{ icon }}</text>

    <view v-if="!isIcon" :class="contentClass">
      <text :class="labelClass">
        <slot></slot>
      </text>
      <view v-if="$slots.content" :class="contentSlotClass">
        <slot name="content"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, useSlots, type PropType } from "vue";
import { parseClass, parsePt, type ClassValue } from "@/utils/tailwind";

type PassThrough = {
  className?: ClassValue;
  clicker?: { className?: ClassValue };
  spinner?: { className?: ClassValue };
  iconWrapper?: { className?: ClassValue };
  icon?: { className?: ClassValue };
  label?: { className?: ClassValue };
  content?: { className?: ClassValue };
};

defineOptions({
  name: "reborn-button",
});

const props = defineProps({
  pt: {
    type: Object as PropType<PassThrough>,
    default: () => ({}),
  },
  type: {
    type: String as PropType<
      "primary" | "success" | "warn" | "error" | "info" | "light" | "dark" | "neutral"
    >,
    default: "primary",
  },
  color: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  text: {
    type: Boolean,
    default: false,
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  border: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<"small" | "normal" | "large">,
    default: "normal",
  },
  hoverClass: {
    type: String,
    default: "",
  },
  hoverStopPropagation: {
    type: Boolean,
    default: false,
  },
  hoverStartTime: {
    type: Number,
    default: 20,
  },
  hoverStayTime: {
    type: Number,
    default: 70,
  },
  formType: {
    type: String as PropType<"submit" | "reset">,
    default: "",
  },
  openType: {
    type: String,
    default: "",
  },
  lang: {
    type: String as PropType<"en" | "zh_CN" | "zh_TW">,
    default: "zh_CN",
  },
  sessionFrom: {
    type: String,
    default: "",
  },
  sendMessageTitle: {
    type: String,
    default: "",
  },
  sendMessagePath: {
    type: String,
    default: "",
  },
  sendMessageImg: {
    type: String,
    default: "",
  },
  showMessageCard: {
    type: Boolean,
    default: false,
  },
  appParameter: {
    type: String,
    default: "",
  },
  groupId: {
    type: String,
    default: "",
  },
  guildId: {
    type: String,
    default: "",
  },
  publicId: {
    type: String,
    default: "",
  },
  phoneNumberNoQuotaToast: {
    type: Boolean,
    default: false,
  },
  createliveactivity: {
    type: Boolean,
    default: false,
  },
});

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
  "agreeprivacyauthorization",
]);

const slots = useSlots();
const pt = computed(() => parsePt<PassThrough>(props.pt));
const isDisabled = computed(() => props.disabled || props.loading);
const isIcon = computed(() => !slots.default && !slots.content);
const hasIconSlot = computed(() => Boolean(slots.icon));

const sizeClass = computed(() => {
  switch (props.size) {
    case "small":
      return "h-[64rpx] px-[24rpx] text-[24rpx]";
    case "large":
      return "h-[84rpx] px-[40rpx] text-[30rpx]";
    default:
      return "h-[72rpx] px-[32rpx] text-[28rpx]";
  }
});

const typeClass = computed(() => {
  switch (props.type) {
    case "success":
      return "bg-[var(--color-success)] text-white";
    case "warn":
      return "bg-[var(--color-warning)] text-white";
    case "error":
      return "bg-[var(--color-error)] text-white";
    case "info":
      return "bg-[var(--color-info)] text-white";
    case "light":
      return "bg-white text-[var(--color-gray-8)] border-[var(--color-gray-4)]";
    case "dark":
      return "bg-[#1f2937] text-white";
    case "neutral":
      return "bg-[var(--color-neutral)] text-white";
    default:
      return "bg-[var(--color-primary)] text-white";
  }
});

const rootClass = computed(() =>
  parseClass(
    "inline-flex items-center justify-center gap-[12rpx] relative rounded-[16rpx] font-medium transition-[background-color,border-color,opacity] duration-200 border-[2rpx] border-solid border-transparent overflow-hidden",
    sizeClass.value,
    typeClass.value,
    props.rounded && "rounded-full",
    isIcon.value && "px-[24rpx]",
    props.text && "bg-transparent border-transparent",
    props.border && "bg-transparent border-current",
    props.loading && "opacity-70",
    isDisabled.value && "opacity-50",
    isHover.value && "opacity-[0.85]",
    pt.value.className,
  ),
);

const clickerClass = computed(() =>
  parseClass("absolute inset-0 opacity-0 z-[2]", pt.value.clicker?.className),
);

const spinnerClass = computed(() =>
  parseClass(
    "h-[28rpx] w-[28rpx] rounded-full border-[4rpx] border-solid border-white/30 border-t-white/90 animate-spin",
    pt.value.spinner?.className,
  ),
);

const iconWrapperClass = computed(() =>
  parseClass("flex items-center", pt.value.iconWrapper?.className),
);

const iconClass = computed(() =>
  parseClass("text-[26rpx]", pt.value.icon?.className),
);

const labelClass = computed(() =>
  parseClass("leading-[1.4]", pt.value.label?.className),
);

const contentClass = computed(() =>
  parseClass("flex items-center gap-[8rpx]", pt.value.content?.className),
);

const contentSlotClass = computed(() => parseClass("flex", pt.value.content?.className));

const buttonStyle = computed(() => {
  if (!props.color) return {};

  if (props.text || props.border) {
    return {
      color: props.color,
      borderColor: props.color,
    };
  }

  return {
    backgroundColor: props.color,
    borderColor: props.color,
    color: "#ffffff",
  };
});

function onTap(e: UniPointerEvent) {
  if (isDisabled.value) return;
  emit("click", e);
  emit("tap", e);
}

function onGetUserInfo(e: UniEvent) {
  emit("getuserinfo", e);
}

function onContact(e: UniEvent) {
  emit("contact", e);
}

function onGetPhoneNumber(e: UniEvent) {
  emit("getphonenumber", e);
}

function onError(e: UniEvent) {
  emit("error", e);
}

function onOpenSetting(e: UniEvent) {
  emit("opensetting", e);
}

function onLaunchApp(e: UniEvent) {
  emit("launchapp", e);
}

function onChooseAvatar(e: UniEvent) {
  emit("chooseavatar", e);
}

function onChooseAddress(e: UniEvent) {
  emit("chooseaddress", e);
}

function onChooseInvoiceTitle(e: UniEvent) {
  emit("chooseinvoicetitle", e);
}

function onAddGroupApp(e: UniEvent) {
  emit("addgroupapp", e);
}

function onSubscribe(e: UniEvent) {
  emit("subscribe", e);
}

function onLogin(e: UniEvent) {
  emit("login", e);
}

function onGetRealtimePhoneNumber(e: UniEvent) {
  emit("getrealtimephonenumber", e);
}

function onAgreePrivacyAuthorization(e: UniEvent) {
  emit("agreeprivacyauthorization", e);
}

const isHover = ref(false);

function onTouchStart() {
  if (!isDisabled.value) {
    isHover.value = true;
  }
}

function onTouchEnd() {
  isHover.value = false;
}

function onTouchCancel() {
  isHover.value = false;
}
</script>
