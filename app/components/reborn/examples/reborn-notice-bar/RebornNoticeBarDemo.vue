<script setup lang="ts">
import { ref } from 'vue';
import RebornNoticeBar from "~/components/reborn/ui/reborn-notice-bar/RebornNoticeBar.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";

const state = ref({
  text: '在代码的宇宙里，每一行都是一颗星星，照亮前行的路。愿你的代码如诗般优雅，如画般美丽，Bug 永远追不上你的脚步。',
  speed: 60,
  scrollable: true,
  wrapable: false,
  color: '#ffffff',
  background: '#35B6F2',
  leftIcon: 'lucide:volume-2',
  rightIcon: 'lucide:chevron-right',
});

const controls = [
  {
    title: '内容配置',
    children: [
      { label: '通知文本', key: 'text', component: 'input' as const, defaultValue: '' },
      { label: '左侧图标', key: 'leftIcon', component: 'input' as const },
      { label: '右侧图标', key: 'rightIcon', component: 'input' as const },
    ],
  },
  {
    title: '滚动控制',
    children: [
      { label: '自动滚动', key: 'scrollable', component: 'checkbox' as const, defaultValue: true },
      { label: '多行展示', key: 'wrapable', component: 'checkbox' as const, defaultValue: false },
      {
        label: '滚动速率',
        key: 'speed',
        component: 'slider' as const,
        defaultValue: 60,
        props: { min: 10, max: 200, step: 10 }
      },
    ],
  },
  {
    title: '样式自定义',
    children: [
      { label: '文本颜色', key: 'color', component: 'color-picker' as const, defaultValue: '#ffffff' },
      { label: '背景颜色', key: 'background', component: 'color-picker' as const, defaultValue: '#35B6F2' },
    ],
  },
];

const visible = ref(true);
const noticeBarRef = ref<any>(null);

function handleReplay() {
  noticeBarRef.value?.replay();
}

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <div class="flex flex-col gap-12 w-full pb-20">
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
        NoticeBar 通知栏
      </h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">用于循环播放展示一组消息通知。</p>
    </div>

    <!-- 交互演练场 -->
    <Playground v-model="state" :controls="controls" component-name="RebornNoticeBar" title="交互体验"
      description="体验实时滚动效果，支持自定义样式、图标以及多行展示切换。">
      <RebornNoticeBar v-bind="state" class="max-w-xl" @click="() => console.log('NoticeBar clicked')" />
    </Playground>

    <!-- 详情展示 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 基础与多消息 -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:list" class="size-5 text-primary" />
          多消息滚动
        </h4>
        <div class="space-y-4">
          <p class="text-sm text-gray-500">支持传入数组实现多条消息轮播，支持水平与垂直方向。</p>

          <div class="space-y-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">水平轮播 (横向展示消息1)</span>
            <RebornNoticeBar :text="['🔥 消息1：系统升级公告', '📢 消息2：新功能上线区', '🎯 消息3：限时优惠开启']" scrollable />
          </div>

          <div class="space-y-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">垂直滚动 (轮播模式)</span>
            <RebornNoticeBar :text="['第一条：在代码的宇宙里，每一行都是一颗星星。', '第二条：愿你的代码如诗般优雅，如画般美丽。', '第三条：Bug 永远追不上你的脚步。']"
              direction="vertical" :interval="1500" left-icon="lucide:megaphone" />
          </div>

          <div class="space-y-2">
            <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">垂直滚动插槽 (自定义内容)</span>
            <RebornNoticeBar :text="['账户安全提示', '系统维护公告', '会员福利发放']" direction="vertical" :interval="2500"
              background="#f0f9ff" color="#0369a1" left-icon="lucide:shield-check">
              <template #default="{ item, index }">
                <div class="flex items-center gap-2">
                  <span class="bg-primary/20 text-primary text-caption-sm px-1.5 py-0.5 rounded uppercase font-bold">
                    {{ index === 0 ? '安全' : index === 1 ? '公告' : '福利' }}
                  </span>
                  <span class="font-medium underline cursor-pointer">{{ item }}</span>
                </div>
              </template>
            </RebornNoticeBar>
          </div>
        </div>
      </section>
      <!-- 语义化样式 -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:palette" class="size-5 text-primary" />
          语义化风格
        </h4>
        <div class="space-y-4">
          <RebornNoticeBar text="这是一条普通通知，使用了默认样式。" left-icon="lucide:info" />
          <RebornNoticeBar text="这是一条告警通知，自定义了明亮的警告色。" color="#ed6a0c" background="#fffbe8"
            left-icon="lucide:alert-triangle" />
          <RebornNoticeBar text="操作成功！系统已完成所有挂起任务。" color="#07c160" background="#e8f7e8"
            left-icon="lucide:check-circle" />
          <RebornNoticeBar text="发现严重错误，请立即检查服务器状态。" color="#ee0a24" background="#fff0f0" left-icon="lucide:x-circle" />
        </div>
      </section>

      <!-- 插槽灵活性 -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:layers" class="size-5 text-primary" />
          插槽灵活性
        </h4>
        <div class="space-y-4">
          <RebornNoticeBar>
            <template #left-icon>
              <div class="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span class="text-xs">🔥</span>
              </div>
            </template>
            <span class="font-medium">限时抢购：</span>
            <span class="text-primary font-bold">5折</span>
            <span>优惠最后两小时，不要错过！</span>
          </RebornNoticeBar>

          <RebornNoticeBar>
            <span class="underline decoration-dashed transition-colors hover:text-primary cursor-pointer">
              点击查看协议详情
            </span>
            <template #right-icon>
              <Icon name="lucide:external-link" class="size-4 opacity-50" />
            </template>
          </RebornNoticeBar>
        </div>
      </section>

      <!-- 事件与方法 -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:command" class="size-5 text-primary" />
          事件与方法
        </h4>
        <div class="space-y-4">
          <RebornNoticeBar ref="noticeBarRef" text="点击右侧图标可重新播放滚动动画。" right-icon="lucide:refresh-cw"
            @click="handleReplay" />
          <div v-if="visible">
            <RebornNoticeBar text="点击右侧图标即可关闭此通知栏。" right-icon="lucide:x" @close="handleClose" @click="handleClose" />
          </div>
          <RebornButton v-if="!visible" variant="soft" size="sm" @click="visible = true">
            重置可见性
          </RebornButton>
        </div>
      </section>

      <!-- 禁用状态 -->
      <section
        class="flex flex-col gap-4 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 bg-white/50 dark:bg-gray-900/20 backdrop-blur-sm">
        <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon name="lucide:ban" class="size-5 text-primary" />
          状态控制
        </h4>
        <div class="space-y-4">
          <RebornNoticeBar text="这条通知栏将停止所有动画并降低淡度程度。" disabled />
          <RebornNoticeBar :text="state.text" :scrollable="false" />
          <p class="text-caption-sm text-gray-400 font-mono italic mt-2">
            Tip: 当内容未溢出时，会自动停止滚动。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
