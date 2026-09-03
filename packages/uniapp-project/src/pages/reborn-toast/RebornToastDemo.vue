<script setup lang="ts">
import type { MessageType, MessageVariant } from '@/components/reborn-toast/index'
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'
import RebornSlider from '@/components/reborn-slider/RebornSlider.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'
import { message, messageTypes, messageVariants } from '@/components/reborn-toast/index'

// 演练场状态（默认值与 Web 端 Playground 一致）
const content = ref('这是一条消息提示')
const type = ref<MessageType>('success')
const variant = ref<MessageVariant>('base')
const duration = ref(3)
const pauseOnHover = ref(true)

/** 按演练场当前参数弹出消息 */
function fireFromPlayground() {
  message[type.value]({
    content: content.value,
    variant: variant.value,
    duration: duration.value,
    pauseOnHover: pauseOnHover.value,
  })
}

/** Promise 接口：loading 关闭后接续提示 */
function firePromiseDemo() {
  message.loading('正在提交…', 1.5).then(() => {
    message.success('提交成功，感谢反馈！')
  })
}

/** 同 key 更新：先 loading 再原位变成功 */
function fireKeyDemo() {
  message.loading({ content: '加载中…', key: 'updatable', duration: 0 })
  setTimeout(() => {
    message.success({ content: '加载完成！', key: 'updatable', duration: 2 })
  }, 1200)
}

/** maxCount 演示：限 3 条后连发 6 条 */
function fireMaxCountDemo() {
  message.config({ maxCount: 3 })
  for (let i = 1; i <= 6; i++) {
    message.info(`第 ${i} 条消息（最多同时 3 条）`, 2 + i * 0.4)
  }
  // 演示完还原，避免影响其他示例
  setTimeout(() => message.config({ maxCount: 0 }), 100)
}

/** 视觉变体演示 */
function fireVariant(v: MessageVariant) {
  message.success({ content: `${v} 变体的消息提示`, variant: v })
}
</script>

<template>
  <RebornPage title="Toast 轻提示" description="命令式消息提示，顶部堆叠展示，message API 与 Web 端对齐。">
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
          message 为命令式 API，调节参数后点击按钮触发；按住消息可暂停自动关闭计时。
        </view>
      </template>
      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          提示内容
        </text>
        <RebornInput v-model="content" placeholder="输入提示内容" />
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          消息类型
        </text>
        <RebornRadioGroup v-model="type">
          <RebornRadio v-for="item in messageTypes" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          视觉变体
        </text>
        <RebornRadioGroup v-model="variant">
          <RebornRadio v-for="item in messageVariants" :key="item" :value="item" :label="item" />
        </RebornRadioGroup>
      </view>

      <view class="space-y-2">
        <text
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          自动关闭延时（秒，0 不自动关闭）
        </text>
        <RebornSlider v-model="duration" :min="0" :max="10" :step="1" show-value />
      </view>

      <view class="space-y-2">
        <view
          class="text-[10px] font-bold uppercase tracking-widest text-slate-400"
        >
          按住暂停计时
        </view>
        <RebornSwitch v-model="pauseOnHover" active-label="开启" inactive-label="关闭" />
      </view>

      <ReButton block @click="fireFromPlayground">
        弹出消息
      </ReButton>
    </RebornCard>

    <!-- 基本用法 -->
    <RebornCard custom-class="grid grid-cols-3 gap-2">
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
          五个静态方法对应五种消息类型；基础变体为白底浮层 + 语义色圆形图标，3 秒后自动关闭。
        </view>
      </template>
      <ReButton block color="success" @click="message.success('操作成功！')">
        成功
      </ReButton>
      <ReButton block color="error" @click="message.error('出错了，请稍后重试。')">
        错误
      </ReButton>
      <ReButton block color="warning" @click="message.warning('这是一条警告提示。')">
        警告
      </ReButton>
      <ReButton block color="info" @click="message.info('这是一条普通信息。')">
        信息
      </ReButton>
      <ReButton block color="neutral" @click="message.loading('加载中…', 2)">
        加载
      </ReButton>
    </RebornCard>

    <!-- 视觉变体 -->
    <RebornCard custom-class="grid grid-cols-3 gap-2">
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
          base 之外提供 filled / outlined / soft / subtle 四种变体，配色与按钮组件的同名变体一致。
        </view>
      </template>
      <ReButton v-for="v in messageVariants" :key="v" block @click="fireVariant(v)">
        {{ v }}
      </ReButton>
    </RebornCard>

    <!-- Promise 接口 -->
    <RebornCard custom-class="grid grid-cols-2 gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          Promise 接口
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          静态方法返回 Promise，在消息关闭后兑现，可用 then 串联后续动作。
        </view>
      </template>
      <ReButton block color="info" @click="firePromiseDemo">
        loading 后接续 success
      </ReButton>
    </RebornCard>

    <!-- 更新内容与全局方法 -->
    <RebornCard custom-class="grid grid-cols-3 gap-2">
      <template #title>
        <view
          class="
            text-sm font-medium uppercase tracking-wider text-slate-500
            dark:text-slate-200
          "
        >
          更新内容与全局方法
        </view>
        <view
          class="
            text-xs leading-relaxed text-slate-400
            dark:text-slate-300
          "
        >
          传相同 key 可原位更新消息并重置计时；message.config 设置 maxCount 等全局项，message.destroy 立即关闭。
        </view>
      </template>
      <ReButton block color="success" @click="fireKeyDemo">
        同 key 原位更新
      </ReButton>
      <ReButton block color="info" @click="fireMaxCountDemo">
        maxCount 限流
      </ReButton>
      <ReButton block color="error" variant="outlined" @click="message.destroy()">
        destroy 全部关闭
      </ReButton>
    </RebornCard>
  </RebornPage>
</template>
