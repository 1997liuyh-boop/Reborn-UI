<script setup lang="ts">
import type { AlertType, AlertVariant } from '@/components/reborn-alert/reborn-alert.config'
import { ref } from 'vue'
import { alertTypes, alertVariants } from '@/components/reborn-alert/reborn-alert.config'
import RebornAlert from '@/components/reborn-alert/RebornAlert.vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

// 演练场状态（默认值与 Web 端 Playground 一致）
const type = ref<AlertType>('info')
const variant = ref<AlertVariant>('soft')
const title = ref('')
const content = ref('这是一条警告提示的内容')
const showIcon = ref(true)
const closable = ref(false)
const banner = ref(false)
const center = ref(false)
const playgroundShow = ref(true)

// 可关闭示例的显隐状态与关闭动画回调
const closableShow = ref(true)
const afterCloseLog = ref('')
function handleAfterClose() {
  afterCloseLog.value = 'after-close 已触发（关闭动画结束）'
}

// 轮播通知栏消息
const noticeMessages = [
  '系统将于今晚 24:00 进行升级维护',
  '新版本 2.41.0 已发布，新增 normal 类型',
  '文档站已支持双端演示与在线运行',
]
const noticeIndex = ref(0)
</script>

<template>
  <RebornPage title="Alert 警告提示" description="静态警告提示条，五种消息类型与按钮同款视觉变体，API 与 Web 端对齐。">
    <!-- Playground Section -->
    <RebornCard>
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          交互演练场
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          调节参数实时预览警告提示；banner 模式会去除边框和圆角作为顶部公告使用。
        </view>
      </template>

      <RebornAlert
        v-model:show="playgroundShow" :type="type" :variant="variant" :title="title || undefined"
        :show-icon="showIcon" :closable="closable" :banner="banner" :center="center"
      >
        {{ content }}
      </RebornAlert>
      <ReButton v-if="!playgroundShow" size="sm" @click="playgroundShow = true">
        重新显示
      </ReButton>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          消息类型
        </text>
        <RebornRadioGroup v-model="type">
          <RebornRadio v-for="item in alertTypes" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          视觉变体
        </text>
        <RebornRadioGroup v-model="variant">
          <RebornRadio v-for="item in alertVariants" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          标题
        </text>
        <RebornInput v-model="title" placeholder="留空则不显示标题" />
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          提示内容
        </text>
        <RebornInput v-model="content" placeholder="输入提示内容" />
      </view>

      <view class="grid grid-cols-2 gap-2">
        <view class="space-y-2">
          <view
            class="
              text-[10px] font-bold uppercase tracking-widest text-slate-400
            "
          >
            展示图标
          </view>
          <RebornSwitch v-model="showIcon" active-label="显示" inactive-label="隐藏" />
        </view>
        <view class="space-y-2">
          <view
            class="
              text-[10px] font-bold uppercase tracking-widest text-slate-400
            "
          >
            关闭按钮
          </view>
          <RebornSwitch v-model="closable" active-label="显示" inactive-label="隐藏" />
        </view>
        <view class="space-y-2">
          <view
            class="
              text-[10px] font-bold uppercase tracking-widest text-slate-400
            "
          >
            顶部公告（banner）
          </view>
          <RebornSwitch v-model="banner" active-label="开启" inactive-label="关闭" />
        </view>
        <view class="space-y-2">
          <view
            class="
              text-[10px] font-bold uppercase tracking-widest text-slate-400
            "
          >
            内容居中
          </view>
          <RebornSwitch v-model="center" active-label="开启" inactive-label="关闭" />
        </view>
      </view>
    </RebornCard>

    <!-- 基本用法 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          基本用法
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          五种消息类型对应五种语义配色与默认图标；normal 为新增类型，用于公告等中性场景。
        </view>
      </template>
      <RebornAlert v-for="t in alertTypes" :key="t" :type="t">
        这是一条 {{ t }} 类型的警告提示
      </RebornAlert>
    </RebornCard>

    <!-- 视觉变体 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          视觉变体
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          六种视觉变体对齐按钮组件的同名变体（不含 circle），默认为 soft 浅底。
        </view>
      </template>
      <RebornAlert v-for="v in alertVariants" :key="v" type="success" :variant="v">
        {{ v }} 变体的警告提示
      </RebornAlert>
    </RebornCard>

    <!-- 标题与操作项 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          标题与操作项
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          通过 title 属性（或 title 插槽）设置标题，action 插槽放置右侧操作项。
        </view>
      </template>
      <RebornAlert type="warning" title="存储空间不足">
        当前可用空间不足 10%，可能影响新数据写入，请及时清理。
        <template #action>
          <ReButton size="sm" color="warning" variant="outlined">
            去清理
          </ReButton>
        </template>
      </RebornAlert>
    </RebornCard>

    <!-- 可关闭 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          可关闭
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          closable 展示关闭按钮，点击触发 close 事件；关闭动画结束后触发 after-close，支持 v-model:show 受控。
        </view>
      </template>
      <RebornAlert v-model:show="closableShow" type="info" closable @after-close="handleAfterClose">
        点击右侧按钮关闭这条提示
      </RebornAlert>
      <view class="flex items-center gap-3">
        <ReButton v-if="!closableShow" size="sm" @click="closableShow = true; afterCloseLog = ''">
          重新显示
        </ReButton>
        <text v-if="afterCloseLog" class="text-xs text-slate-400">{{ afterCloseLog }}</text>
      </view>
    </RebornCard>

    <!-- 顶部公告 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          顶部公告（banner）
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          banner 模式去除边框和圆角，适合置于页面顶部；可配合 center 让内容居中。
        </view>
      </template>
      <RebornAlert type="warning" banner>
        注意：本环境为演示环境，数据每日凌晨重置。
      </RebornAlert>
      <RebornAlert type="error" banner center closable>
        服务当前不可用，请稍后重试。
      </RebornAlert>
    </RebornCard>

    <!-- 消息轮播通知栏 -->
    <RebornCard custom-class="flex flex-col gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          消息轮播通知栏
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          通过 messages 传入多条消息即变为轮播通知栏，垂直轮播展示，interval 控制间隔。
        </view>
      </template>
      <RebornAlert
        type="normal" banner :messages="noticeMessages" :interval="2500" closable
        @change="noticeIndex = $event"
      />
      <text class="text-xs text-slate-400">当前第 {{ noticeIndex + 1 }} / {{ noticeMessages.length }} 条</text>
    </RebornCard>
  </RebornPage>
</template>
