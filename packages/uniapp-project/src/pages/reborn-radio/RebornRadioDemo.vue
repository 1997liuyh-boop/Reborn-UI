<script setup lang="ts">
import { ref } from 'vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { radioColors } from '@/components/reborn-radio/reborn-radio.config'
import RebornRadio from '@/components/reborn-radio/RebornRadio.vue'
import RebornRadioGroup from '@/components/reborn-radio/RebornRadioGroup.vue'

/** 水果选项，供多个演示区块复用 */
const fruits = [
  { value: 'apple', label: '苹果' },
  { value: 'banana', label: '香蕉' },
  { value: 'orange', label: '橘子' },
  { value: 'grape', label: '葡萄' },
]

const selectedFruit = ref('apple')
const selectedMode = ref('day')
const selectedAlign = ref('center')
const selectedVariant = ref('apple')
const selectedColor = ref('primary')
const selectedCity = ref('北京')
const selectedPay = ref('wechat')
const selectedPlan = ref('basic')
const selectedDisabled = ref('2')
/** 整组禁用演示的绑定值 */
const disabledGroupValue = ref('banana')

/** 非受控用法的最新值，仅由 change 事件回填展示 */
const uncontrolledValue = ref('banana')

/** options 混合数组：字符串简写与对象写法可以混用，对象写法支持 disabled */
const cityOptions = ['北京', '上海', '广州', { label: '深圳（禁用）', value: '深圳', disabled: true }]

const payOptions = [
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'card', label: '银行卡' },
]

const plans = [
  { value: 'basic', label: '基础版', desc: '适合个人开发者' },
  { value: 'pro', label: '专业版', desc: '适合小型团队' },
  { value: 'enterprise', label: '企业版', desc: '定制化支持' },
]

/** 非受控模式下通过 change 事件拿到最新值 */
function onUncontrolledChange(value: string | number | boolean) {
  uncontrolledValue.value = String(value)
}
</script>

<template>
  <RebornPage title="Radio 单选框" description="用于在一组互斥选项中选择单项，支持圆点、分段按钮与实体按钮拼接三种类型。">
    <RebornCard title="基础用法" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedFruit">
        <RebornRadio v-for="fruit in fruits" :key="fruit.value" :value="fruit.value">
          {{ fruit.label }}
        </RebornRadio>
      </RebornRadioGroup>
      <text class="text-24 text-gray-6">
        当前值：{{ selectedFruit }}
      </text>
    </RebornCard>

    <RebornCard title="按钮类型与尺寸" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedMode" type="button" size="sm">
        <RebornRadio value="day">
          日视图
        </RebornRadio>
        <RebornRadio value="week">
          周视图
        </RebornRadio>
        <RebornRadio value="month">
          月视图
        </RebornRadio>
      </RebornRadioGroup>
      <RebornRadioGroup v-model="selectedMode" type="button" size="lg">
        <RebornRadio value="day">
          日视图
        </RebornRadio>
        <RebornRadio value="week">
          周视图
        </RebornRadio>
        <RebornRadio value="month">
          月视图
        </RebornRadio>
      </RebornRadioGroup>
    </RebornCard>

    <RebornCard title="实体按钮拼接 (pure-button)" custom-class="space-y-[24rpx]">
      <RebornRadioGroup
        v-model="selectedAlign" type="pure-button" color="success"
        :options="['左对齐', '居中', '右对齐']"
      />
      <text class="text-24 text-gray-6">
        当前值：{{ selectedAlign }}
      </text>
    </RebornCard>

    <RebornCard title="样式变体 (variant)" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedVariant" variant="outlined" :options="fruits" />
      <RebornRadioGroup v-model="selectedVariant" variant="filled" :options="fruits" />
      <RebornRadioGroup v-model="selectedVariant" type="button" variant="filled" :options="fruits" />
    </RebornCard>

    <RebornCard title="语义色彩" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedColor">
        <RebornRadio v-for="c in radioColors" :key="c" :value="c" :color="c">
          {{ c }}
        </RebornRadio>
      </RebornRadioGroup>
    </RebornCard>

    <RebornCard title="options 快捷传参" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedCity" :options="cityOptions" />
      <!-- label 插槽统一定制选项文案 -->
      <RebornRadioGroup v-model="selectedPay" :options="payOptions">
        <template #label="{ data }">
          <text class="font-medium">{{ data.label }}</text>
        </template>
      </RebornRadioGroup>
    </RebornCard>

    <RebornCard title="方向与非受控" custom-class="space-y-[24rpx]">
      <RebornRadioGroup
        default-value="banana" direction="vertical" :options="fruits"
        @change="onUncontrolledChange"
      />
      <text class="text-24 text-gray-6">
        change 事件最新值：{{ uncontrolledValue }}
      </text>
    </RebornCard>

    <RebornCard title="禁用状态" custom-class="space-y-[24rpx]">
      <RebornRadioGroup v-model="selectedDisabled">
        <RebornRadio value="1" disabled>
          未选中禁用
        </RebornRadio>
        <RebornRadio value="2" disabled>
          选中禁用
        </RebornRadio>
      </RebornRadioGroup>
      <RebornRadioGroup v-model="disabledGroupValue" disabled :options="fruits" />
    </RebornCard>

    <RebornCard title="radio 插槽深度定制" custom-class="space-y-[24rpx]">
      <!-- radio 插槽（作用域含 checked / disabled）完全接管单选框渲染，可做成卡片式选择 -->
      <RebornRadioGroup v-model="selectedPlan" direction="vertical">
        <RebornRadio v-for="plan in plans" :key="plan.value" :value="plan.value">
          <template #radio="{ checked }">
            <view
              class="w-[300rpx] rounded-ui-xs border border-solid p-[24rpx]"
              :class="checked ? 'border-primary bg-primary/5' : 'border-gray-4'"
            >
              <view
                class="text-28 font-medium"
                :class="checked ? 'text-primary' : 'text-gray-8'"
              >
                {{ plan.label }}
              </view>
              <view class="mt-[8rpx] text-24 text-gray-6">
                {{ plan.desc }}
              </view>
            </view>
          </template>
        </RebornRadio>
      </RebornRadioGroup>
    </RebornCard>
  </RebornPage>
</template>
