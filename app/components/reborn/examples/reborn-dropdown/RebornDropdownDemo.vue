<script setup lang="ts">
import RebornDropdown from "~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue";
import RebornDropdownItem from "~/components/reborn/ui/reborn-dropdown/RebornDropdownItem.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { dropdownColors, dropdownSizes } from "~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config";

// --- Playground 状态 ---
const state = ref<Record<string, any>>({
  trigger: "hover",
  splitButton: false,
  hideOnClick: true,
  size: "md",
  color: "primary",
  disabled: false,
  placement: "bottom-start",
});

const lastCommand = ref("");

function handleCommand(key: string) {
  lastCommand.value = key;
}

// --- 控制面板配置 ---
const triggerOptions = [
  { label: "Hover 悬浮", value: "hover" },
  { label: "Click 点击", value: "click" },
];

const placementOptions = [
  { label: "左下 (bottom-start)", value: "bottom-start" },
  { label: "底部居中 (bottom)", value: "bottom" },
  { label: "右下 (bottom-end)", value: "bottom-end" },
  { label: "左上 (top-start)", value: "top-start" },
  { label: "顶部居中 (top)", value: "top" },
  { label: "右上 (top-end)", value: "top-end" },
];

const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "hover",
        props: { options: triggerOptions },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: dropdownSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: dropdownColors.map((c) => ({
            label: c.charAt(0).toUpperCase() + c.slice(1),
            value: c,
          })),
        },
      },
      {
        label: "弹出位置",
        key: "placement",
        component: "select" as const,
        defaultValue: "bottom-start",
        props: { options: placementOptions },
      },
    ],
  },
  {
    title: "行为控制",
    children: [
      { label: "按钮组模式", key: "splitButton", component: "checkbox" as const, defaultValue: false },
      { label: "点击后隐藏菜单", key: "hideOnClick", component: "checkbox" as const, defaultValue: true },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
</script>

<template>
  <div class="flex flex-col gap-16 pb-24">
    <!-- 标题头 -->
    <div class="flex flex-col gap-2">
      <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dropdown 下拉菜单</h2>
      <p class="text-lg text-gray-500 dark:text-gray-400">
        将操作折叠到下拉菜单中，悬停或点击触发元素以展开更多操作。
      </p>
    </div>

    <!-- 交互演练场 -->
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornDropdown"
      title="交互体验"
      description="通过左侧面板实时调节属性，在右侧预览视觉效果"
    >
      <div class="flex flex-col items-center gap-4">
        <RebornDropdown
          :trigger="state.trigger"
          :split-button="state.splitButton"
          :hide-on-click="state.hideOnClick"
          :size="state.size"
          :color="state.color"
          :disabled="state.disabled"
          :placement="state.placement"
          @command="handleCommand"
        >
          <RebornButton :size="state.size" :color="state.color" :disabled="state.disabled">
            {{ state.splitButton ? "提交操作" : "下拉菜单" }}
          </RebornButton>
          <template #dropdown>
            <RebornDropdownItem command="new">
              <template #icon>
                <Icon name="lucide:plus" class="size-4" />
              </template>
              新建文件
            </RebornDropdownItem>
            <RebornDropdownItem command="edit">
              <template #icon>
                <Icon name="lucide:pencil" class="size-4" />
              </template>
              编辑内容
            </RebornDropdownItem>
            <RebornDropdownItem command="share" divided>
              <template #icon>
                <Icon name="lucide:share-2" class="size-4" />
              </template>
              分享链接
            </RebornDropdownItem>
            <RebornDropdownItem command="download">
              <template #icon>
                <Icon name="lucide:download" class="size-4" />
              </template>
              下载文件
            </RebornDropdownItem>
            <RebornDropdownItem command="delete" divided disabled>
              <template #icon>
                <Icon name="lucide:trash-2" class="size-4" />
              </template>
              删除（禁用）
            </RebornDropdownItem>
          </template>
        </RebornDropdown>
        <p v-if="lastCommand" class="text-xs text-gray-400 font-mono">
          最后触发: @command="{{ lastCommand }}"
        </p>
      </div>
    </Playground>

    <!-- 变体展示区 -->
    <section class="space-y-12">
      <!-- 色彩矩阵 -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">核心色彩</h3>
          <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="c in dropdownColors"
            :key="c"
            class="flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <span class="text-xs font-bold text-gray-400 uppercase tracking-tighter">{{ c }}</span>
            <RebornDropdown :color="c" size="sm" @command="handleCommand">
              <RebornButton :color="c" size="sm">操作</RebornButton>
              <template #dropdown>
                <RebornDropdownItem command="edit">编辑</RebornDropdownItem>
                <RebornDropdownItem command="delete">删除</RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>
      </div>

      <!-- 尺寸对比 -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">尺寸规范</h3>
          <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div
          class="flex h-[180px] items-center justify-center gap-10 rounded-2xl border border-gray-100 bg-gray-50/30 p-8 dark:border-gray-800 dark:bg-gray-900/30"
        >
          <div v-for="s in dropdownSizes" :key="s" class="flex flex-col items-center gap-4">
            <RebornDropdown :size="s" color="info" @command="handleCommand">
              <RebornButton :size="s" color="info">{{ s.toUpperCase() }}</RebornButton>
              <template #dropdown>
                <RebornDropdownItem command="a">选项 A</RebornDropdownItem>
                <RebornDropdownItem command="b">选项 B</RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>
      </div>
    </section>

    <!-- 进阶场景 -->
    <section class="space-y-8">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">进阶场景</h3>
        <p class="text-sm text-gray-500">满足复杂业务需求</p>
      </div>

      <div class="grid gap-8 md:grid-cols-2">
        <!-- Split Button 模式 -->
        <div class="rounded-3xl bg-gray-50/50 p-8 dark:bg-gray-900/50">
          <h4 class="mb-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Split Button</h4>
          <p class="mb-6 text-xs text-gray-500">
            split-button 模式下，左侧为功能按钮，右侧箭头触发下拉。
          </p>
          <div class="flex items-center justify-center">
            <RebornDropdown split-button color="warning" @command="handleCommand">
              更多操作
              <template #dropdown>
                <RebornDropdownItem command="export">
                  <template #icon><Icon name="lucide:file-output" class="size-4" /></template>
                  导出数据
                </RebornDropdownItem>
                <RebornDropdownItem command="import">
                  <template #icon><Icon name="lucide:file-input" class="size-4" /></template>
                  导入数据
                </RebornDropdownItem>
                <RebornDropdownItem command="settings" divided>
                  <template #icon><Icon name="lucide:settings" class="size-4" /></template>
                  设置
                </RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>

        <!-- Click 触发 + 分隔线 -->
        <div class="rounded-3xl bg-indigo-50/30 p-8 dark:bg-indigo-950/10 border-2 border-indigo-100 dark:border-indigo-900/50">
          <h4 class="mb-4 text-sm font-bold text-indigo-400 uppercase tracking-widest">Click Trigger + Dividers</h4>
          <p class="mb-6 text-xs text-indigo-500/70">
            点击触发下拉，通过 divided 属性在项目间插入分隔线，区分操作层级。
          </p>
          <div class="flex items-center justify-center">
            <RebornDropdown trigger="click" color="secondary" :hide-on-click="false" @command="handleCommand">
              <RebornButton color="secondary" variant="outline">
                <template #trailing>
                  <Icon name="lucide:chevron-down" class="size-4" />
                </template>
                个人中心
              </RebornButton>
              <template #dropdown>
                <RebornDropdownItem command="profile">个人资料</RebornDropdownItem>
                <RebornDropdownItem command="billing">账单管理</RebornDropdownItem>
                <RebornDropdownItem command="security" divided>安全设置</RebornDropdownItem>
                <RebornDropdownItem command="api">API 密钥</RebornDropdownItem>
                <RebornDropdownItem command="logout" divided>
                  <template #icon><Icon name="lucide:log-out" class="size-4" /></template>
                  退出登录
                </RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>

        <!-- 纯文本触发 -->
        <div class="rounded-3xl bg-emerald-50/30 p-8 dark:bg-emerald-950/10 border-2 border-emerald-100 dark:border-emerald-900/50">
          <h4 class="mb-4 text-sm font-bold text-emerald-400 uppercase tracking-widest">任意触发元素</h4>
          <p class="mb-6 text-xs text-emerald-500/70">
            默认插槽支持任意元素作为触发器，不限于按钮。
          </p>
          <div class="flex items-center justify-center">
            <RebornDropdown trigger="click" @command="handleCommand">
              <span class="cursor-pointer border-b-2 border-dashed border-emerald-400 text-emerald-600 dark:text-emerald-400 font-medium transition-all hover:border-emerald-600 hover:text-emerald-700">
                点击这段文字
              </span>
              <template #dropdown>
                <RebornDropdownItem command="view">查看详情</RebornDropdownItem>
                <RebornDropdownItem command="copy">复制链接</RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>

        <!-- hover 触发 + 丰富内容 -->
        <div class="rounded-3xl bg-orange-50/30 p-8 dark:bg-orange-950/10 border-2 border-orange-100 dark:border-orange-900/50">
          <h4 class="mb-4 text-sm font-bold text-orange-400 uppercase tracking-widest">Hover 悬停菜单</h4>
          <p class="mb-6 text-xs text-orange-500/70">
            默认 hover 触发，无需点击即可展开。鼠标移入即显示、移出 120ms 后自动关闭。
          </p>
          <div class="flex items-center justify-center">
            <RebornDropdown color="error" @command="handleCommand">
              <RebornButton color="error" variant="soft">
                危险操作
                <template #trailing>
                  <Icon name="lucide:alert-triangle" class="size-4" />
                </template>
              </RebornButton>
              <template #dropdown>
                <RebornDropdownItem command="archive">归档项目</RebornDropdownItem>
                <RebornDropdownItem command="transfer">转移所有权</RebornDropdownItem>
                <RebornDropdownItem command="delete" divided disabled>
                  <template #icon><Icon name="lucide:trash-2" class="size-4" /></template>
                  永久删除
                </RebornDropdownItem>
              </template>
            </RebornDropdown>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
