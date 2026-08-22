<script setup lang="ts">
import { ref, reactive } from 'vue';

const open = ref(false);
const options = reactive({
  position: 'right' as any,
  transition: '',
  modal: true,
  resizable: true,
  round: true,
  showHeader: true,
  showClose: true,
  title: 'RebornPopup 演示',
  size: '350px'
});

const nestedLevel1 = ref(false);
const nestedLevel2 = ref(false);
const nestedLevel3 = ref(false);

const openPopup = (config: Partial<typeof options>) => {
  Object.assign(options, config);
  open.value = true;
};

const closeAll = () => {
  nestedLevel1.value = false;
  nestedLevel2.value = false;
  nestedLevel3.value = false;
};
</script>

<template>
  <div class="p-4 md:p-8 space-y-10 w-full">
    <!-- Header Section -->
    <header class="space-y-2">
      <h1 class="text-3xl font-extrabold tracking-tight">Popup 弹出层</h1>
      <p class="text-gray-500 dark:text-gray-400 text-lg">
        一个高级且可定制的弹出容器，支持多方向平移、丰富的动画效果以及动态缩放。
      </p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Controls Column -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Positions Grid -->
        <section>
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Icon name="lucide:layout" class="w-4 h-4" />
            弹出位置 (Positions)
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <RebornButton variant="soft" @click="openPopup({ position: 'top', transition: '', size: '30%' })">Top
            </RebornButton>
            <RebornButton variant="soft" @click="openPopup({ position: 'bottom', transition: '', size: '30%' })">Bottom
            </RebornButton>
            <RebornButton variant="soft" @click="openPopup({ position: 'left', transition: '', size: '300px' })">Left
            </RebornButton>
            <RebornButton variant="soft" @click="openPopup({ position: 'right', transition: '', size: '300px' })">Right
            </RebornButton>
            <RebornButton variant="soft" color="secondary"
              @click="openPopup({ position: 'center', transition: 'zoom', size: 'auto' })">Center</RebornButton>
          </div>
        </section>

        <!-- Transitions Grid -->
        <section>
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
            <Icon name="lucide:sparkles" class="w-4 h-4" />
            动画效果 (Transitions)
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'fade' })">Fade</RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'fade-up' })">Fade Up
            </RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'fade-down' })">Fade Down
            </RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'zoom-in' })">Zoom In
            </RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'zoom-out' })">Zoom Out
            </RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'slide-up' })">Slide Up
            </RebornButton>
            <RebornButton variant="soft" color="neutral" @click="openPopup({ transition: 'slide-right' })">Slide Right
            </RebornButton>
          </div>
        </section>
      </div>

      <!-- Settings Card -->
      <aside
        class="bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-6">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Icon name="lucide:settings" class="w-4 h-4" />
          控制台 (Settings)
        </h2>

        <div class="space-y-4">
          <label
            class="flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
            <span class="text-sm font-medium">遮罩层 (Modal)</span>
            <input type="checkbox" v-model="options.modal" class="w-4 h-4 rounded text-primary focus:ring-primary">
          </label>
          <label
            class="flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
            <span class="text-sm font-medium">自由缩放 (Resizable)</span>
            <input type="checkbox" v-model="options.resizable" class="w-4 h-4 rounded text-primary focus:ring-primary">
          </label>
          <label
            class="flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
            <span class="text-sm font-medium">圆角样式 (Round)</span>
            <input type="checkbox" v-model="options.round" class="w-4 h-4 rounded text-primary focus:ring-primary">
          </label>
          <label
            class="flex items-center justify-between p-3 bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
            <span class="text-sm font-medium">显示头部 (Header)</span>
            <input type="checkbox" v-model="options.showHeader" class="w-4 h-4 rounded text-primary focus:ring-primary">
          </label>
        </div>

        <div class="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <RebornButton color="primary" class="w-full h-12 text-base font-bold shadow-lg shadow-primary/20"
            @click="open = true">
            打开预览
          </RebornButton>
          <RebornButton variant="soft" color="secondary" class="w-full" @click="nestedLevel1 = true">
            测试多层嵌套
          </RebornButton>
        </div>
      </aside>
    </div>

    <!-- Nested Popups Section -->
    <RebornPopup v-model="nestedLevel1" position="center" title="第一层嵌套 (Level 1)" size="450px" round>
      <div class="space-y-6">
        <div class="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
          <p class="text-sm text-secondary leading-relaxed">
            这是第一层弹出层。在复杂的业务场景中，我们经常需要在当前操作之上开启新的会话模块。
          </p>
        </div>
        <RebornButton color="secondary" class="w-full" @click="nestedLevel2 = true">
          开启第二层 (Level 2)
        </RebornButton>
      </div>

      <!-- Level 2 Nested -->
      <RebornPopup v-model="nestedLevel2" position="center" title="第二层嵌套 (Level 2)" size="350px" round>
        <div class="space-y-6">
          <p class="text-sm text-gray-600">
            这是第二层。注意到 z-index 和遮罩层已经自动处理，确保层级排布正确。
          </p>
          <RebornButton color="neutral" variant="soft" class="w-full" @click="nestedLevel3 = true">
            开启第三层 (Level 3)
          </RebornButton>
        </div>

        <!-- Level 3 Nested -->
        <RebornPopup v-model="nestedLevel3" position="center" title="第三层嵌套 (Level 3)" size="280px" round>
          <div class="space-y-4 text-center py-4">
            <div
              class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 text-green-500 mb-2">
              <Icon name="lucide:check-circle" class="w-8 h-8" />
            </div>
            <h4 class="font-bold text-lg">最终确认</h4>
            <p class="text-xs text-gray-500 px-4">
              所有的嵌套操作都已成功堆叠。点击背景或“全部关闭”可以返回初始状态。
            </p>
            <RebornButton color="primary" variant="soft" class="w-full" @click="closeAll">
              全部关闭
            </RebornButton>
          </div>
        </RebornPopup>
      </RebornPopup>
    </RebornPopup>

    <!-- Main Popup -->
    <RebornPopup v-model="open" :position="options.position" :transition="options.transition" :modal="options.modal"
      :resizable="options.resizable" :round="options.round" :show-header="options.showHeader"
      :show-close="options.showClose" :title="options.title" :size="options.size" append-to-body>
      <div class="py-2 space-y-6">
        <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="lucide:info" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-base text-gray-900 dark:text-white">配置详情</h3>
              <p class="text-xs text-gray-500">当前组件生效的所有参数</p>
            </div>
          </div>

          <dl class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-sm uppercase font-semibold text-gray-400">Position</dt>
              <dd class="text-sm font-mono mt-1 capitalize text-primary font-bold">{{ options.position }}</dd>
            </div>
            <div>
              <dt class="text-sm uppercase font-semibold text-gray-400">Transition</dt>
              <dd class="text-sm font-mono mt-1 capitalize text-amber-500 font-bold">{{ options.transition || 'Auto' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm uppercase font-semibold text-gray-400">Resizable</dt>
              <dd class="text-sm font-mono mt-1">{{ options.resizable ? 'Yes' : 'No' }}</dd>
            </div>
            <div>
              <dt class="text-sm uppercase font-semibold text-gray-400">Modal</dt>
              <dd class="text-sm font-mono mt-1">{{ options.modal ? 'Visible' : 'Hidden' }}</dd>
            </div>
          </dl>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            这是一个高级且美观的弹出层实现。通过这个演示，你可以测试在不同位置下的缩放体验。
          </p>
          <p v-if="options.resizable"
            class="flex items-center gap-2 text-xs text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
            <Icon name="lucide:grab" class="w-4 h-4" />
            提示：当前位置支持通过边缘拖拽实时调整大小。
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end items-center gap-3 w-full">
          <RebornButton color="neutral" variant="soft" @click="open = false">取消</RebornButton>
          <RebornButton color="primary" @click="open = false" class="px-8 shadow-md">好的，明白了</RebornButton>
        </div>
      </template>
    </RebornPopup>
  </div>
</template>
