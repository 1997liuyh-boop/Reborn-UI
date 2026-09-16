<script setup lang="ts">
import type { ResultIcon } from '@/components/reborn-result/reborn-result.config'
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import { resultIcons } from '@/components/reborn-result/reborn-result.config'
import RebornResult from '@/components/reborn-result/RebornResult.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

// ─── 演练场状态（默认值与 Web 端 Playground 一致） ───────────────

const currentIcon = ref<ResultIcon>('success')
const title = ref('提交成功')
const subTitle = ref('订单已创建，我们会在 24 小时内完成审核。')
const showIcon = ref(true)
const showExtra = ref(true)

/** 操作区点击回显，让预览「有回应」 */
const lastAction = ref('')
function onAction(name: string) {
  lastAction.value = name
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 七种状态各自的示例文案 */
const ICON_SAMPLE: Record<string, { title: string, subTitle: string }> = {
  'info': { title: '等待审核', subTitle: '资料已提交，审核结果会通过站内信通知。' },
  'success': { title: '提交成功', subTitle: '订单已创建，24 小时内完成发货。' },
  'warning': { title: '部分成功', subTitle: '3 条记录导入成功，1 条因手机号重复被跳过。' },
  'error': { title: '提交失败', subTitle: '收货地址缺少街道信息，补全后重试。' },
  '403': { title: '无访问权限', subTitle: '当前账号不在该空间的成员名单内。' },
  '404': { title: '页面不存在', subTitle: '链接可能已过期，或资源被创建者删除。' },
  '500': { title: '服务异常', subTitle: '请求未能完成，稍后重试或联系管理员。' },
}
</script>

<template>
  <RebornPage
    title="结果页"
    description="展示一次操作或一次请求的最终结果：图标、标题与描述、操作区三段纵向居中排布。"
    custom-class="flex flex-col gap-y-4"
  >
    <!-- 演练场 -->
    <RebornCard title="自定义" custom-class="space-y-4">
      <RebornResult
        :icon="showIcon ? currentIcon : null" :title="title" :sub-title="subTitle"
      >
        <template v-if="showExtra" #extra>
          <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('返回首页')">
            返回首页
          </ReButton>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('查看订单')">
            查看订单
          </ReButton>
        </template>
      </RebornResult>

      <text class="text-24 text-gray-6">最近点击：{{ lastAction || '（无）' }}；组件不派发事件，回显来自插槽里按钮自己的 tap。</text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">图标类型 (icon)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="i in resultIcons" :key="i">
            <ReButton
              size="xs" :variant="currentIcon === i ? 'filled' : 'outlined'"
              :color="currentIcon === i ? 'primary' : 'neutral'" @tap="currentIcon = i"
            >
              {{ i }}
            </ReButton>
          </view>
        </view>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">标题 (title)</text>
        <RebornInput v-model="title" placeholder="留空则不渲染标题" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">描述 (sub-title)</text>
        <RebornInput v-model="subTitle" placeholder="留空则不渲染描述" />
      </view>

      <view class="grid grid-cols-2 gap-2">
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-6">图标区（关闭即 :icon="null"）</text>
          <RebornSwitch v-model="showIcon" active-label="渲染" inactive-label="不渲染" />
        </view>
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-6">操作区（extra 插槽）</text>
          <RebornSwitch v-model="showExtra" active-label="渲染" inactive-label="不渲染" />
        </view>
      </view>
    </RebornCard>

    <!-- 七种状态 -->
    <RebornCard title="七种状态" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        icon 决定默认字形与配色：info / success / warning / error 四种语义反馈，加 403 / 404 / 500 三种状态码。
        状态码复用语义配色——403 是权限拦截走警示色，404 只是资源不存在走信息色，500 是服务端故障走错误色。
      </text>
      <view v-for="i in resultIcons" :key="i" class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">icon="{{ i }}"</text>
        <RebornResult :icon="i" :title="ICON_SAMPLE[i]!.title" :sub-title="ICON_SAMPLE[i]!.subTitle" />
      </view>
    </RebornCard>

    <!-- 隐藏图标与自定义图标 -->
    <RebornCard title="隐藏图标与自定义图标" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        :icon="null" 整段去掉图标区，连同它上面的 48rpx 间距一起消失；icon 插槽只替换字形，144rpx 圆形底板与语义色淡底还在。
        两者一起用时底板退化成无尺寸透明容器，自定义内容自己决定大小。
      </text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">:icon="null"</text>
        <RebornResult :icon="null" title="已退出登录" sub-title="下次访问需要重新验证身份。" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">icon="success" + #icon</text>
        <RebornResult icon="success" title="打款完成" sub-title="底板与淡底保留，只换了字形。">
          <template #icon>
            <view class="i-lucide-wallet size-[64rpx] shrink-0" />
          </template>
        </RebornResult>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">:icon="null" + #icon</text>
        <RebornResult :icon="null" title="正在同步" sub-title="底板不再限制尺寸，图形可以放大。">
          <template #icon>
            <view class="i-svg-spinners-180-ring-with-bg size-[192rpx] text-primary" />
          </template>
        </RebornResult>
      </view>
    </RebornCard>

    <!-- 标题与描述 -->
    <RebornCard title="标题与描述" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        title / sub-title 只收纯文本；要分行或混排别的节点，改用同名的 title / sub-title 插槽，插槽存在时对应的 prop 不再渲染。
      </text>

      <RebornResult icon="error" title="部署失败">
        <template #sub-title>
          <text class="text-28 text-gray-7 dark:text-gray-4">构建在 pnpm build 阶段退出，退出码 1。</text>
        </template>
      </RebornResult>

      <RebornResult icon="warning" sub-title="集群剩余容量不足以承接本次扩容。">
        <template #title>
          <view class="flex items-center justify-center gap-[16rpx]">
            <text class="text-48 font-medium leading-[1.5] text-gray-8 dark:text-gray-1">配额告警</text>
            <text class="text-28 text-warning">已用 92%</text>
          </view>
        </template>
      </RebornResult>
    </RebornCard>

    <!-- 操作区 -->
    <RebornCard title="操作区" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        extra 插槽是第三段，横向排列、超宽自动换行、按钮间距 24rpx。组件不派发任何事件，交互由放进插槽的元素自己承担。
        两个按钮时按「次要动作在左、主要动作在右」排：左侧 neutral + outlined，右侧 primary + filled，都用 size="md"。
      </text>

      <RebornResult icon="success" title="账号已创建" sub-title="验证短信已发送到 138****0000。">
        <template #extra>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('进入控制台')">
            进入控制台
          </ReButton>
        </template>
      </RebornResult>

      <RebornResult icon="403" title="无访问权限" sub-title="当前账号不在该空间的成员名单内。">
        <template #extra>
          <ReButton color="neutral" variant="text" size="md" @tap="onAction('切换账号')">
            切换账号
          </ReButton>
          <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('返回上一页')">
            返回上一页
          </ReButton>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('申请加入')">
            申请加入
          </ReButton>
        </template>
      </RebornResult>
    </RebornCard>

    <!-- 四个插槽一起用 -->
    <RebornCard title="四个插槽一起用" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        icon / title / sub-title / extra 四个具名插槽可以同时启用，三段内容全部由调用方决定，title / sub-title 两个 prop 不再渲染。
        这里配合 :icon="null" 连底板一起接管，自己搭一个 144rpx 圆形底。
      </text>

      <RebornResult :icon="null">
        <template #icon>
          <view class="flex size-[144rpx] shrink-0 items-center justify-center rounded-full bg-success/10">
            <view class="i-lucide-badge-check size-[64rpx] shrink-0 text-success" />
          </view>
        </template>

        <template #title>
          <view class="flex items-center justify-center gap-[16rpx]">
            <text class="text-48 font-medium leading-[1.5] text-gray-8 dark:text-gray-1">支付成功</text>
            <text class="rounded-ui-2xs bg-success/10 px-[12rpx] py-[4rpx] text-24 text-success">已开票</text>
          </view>
        </template>

        <template #sub-title>
          <view class="flex flex-col gap-[8rpx]">
            <text class="text-28 text-gray-7 dark:text-gray-4">实付 ¥ 1,280.00，订单号 RB-20260915-0413。</text>
            <text class="text-28 text-gray-7 dark:text-gray-4">发票已发送至 finance@example.com。</text>
          </view>
        </template>

        <template #extra>
          <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('查看发票')">
            查看发票
          </ReButton>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('返回订单列表')">
            返回订单列表
          </ReButton>
        </template>
      </RebornResult>
    </RebornCard>

    <!-- 缺省段与间距 -->
    <RebornCard title="缺省段与间距" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        三段（图标 / 标题加描述 / 操作区）都按需渲染：某一段没内容就不进节点树，所以段间的 48rpx 间距不会因为空段变成 96rpx。
        标题与描述同属第二段，它俩之间固定 16rpx。
      </text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">仅标题</text>
        <RebornResult :icon="null" title="没有更多内容了" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">图标 + 操作区</text>
        <RebornResult icon="info">
          <template #extra>
            <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('刷新')">
              刷新
            </ReButton>
          </template>
        </RebornResult>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">三段齐全</text>
        <RebornResult icon="404" title="页面不存在" sub-title="链接可能已过期。">
          <template #extra>
            <ReButton color="primary" variant="filled" size="md" @tap="onAction('回到首页')">
              回到首页
            </ReButton>
          </template>
        </RebornResult>
      </view>
    </RebornCard>
  </RebornPage>
</template>
