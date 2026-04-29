<script setup lang="ts">
import { ref, computed } from "vue";
import {
  RebornMenu,
  RebornSubMenu,
  RebornMenuItem,
  RebornMenuItemGroup,
} from "~/components/reborn/ui/reborn-menu";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { menuModes, menuTriggers, menuColors, expandTypes } from "~/components/reborn/ui/reborn-menu/reborn-menu.config";

// --- Playground 状态 ---
const state = ref<Record<string, any>>({
  mode: "vertical",
  collapse: false,
  menuTrigger: "hover",
  uniqueOpened: false,
  expandType: "popup",
  expandMutex: false,
  color: "primary",
  backgroundColor: "#ffffff",
  textColor: "#303133",
  activeTextColor: "#409eff",
});

const expandedMenus = ref<string[]>([]);

// --- 控制面板配置 ---
const controls: any = [
  {
    title: "布局模式",
    children: [
      {
        label: "展示模式",
        key: "mode",
        component: "select" as const,
        defaultValue: "vertical",
        props: {
          options: menuModes.map((m) => ({ label: m === "horizontal" ? "水平" : "垂直", value: m })),
        },
      },
      {
        label: "触发方式",
        key: "menuTrigger",
        component: "select" as const,
        defaultValue: "hover",
        props: {
          options: menuTriggers.map((t) => ({ label: t === "hover" ? "悬停" : "点击", value: t })),
        },
      },
      {
        label: "颜色主题",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: menuColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
        },
      },
      {
        label: "子菜单展开方式",
        key: "expandType",
        component: "select" as const,
        defaultValue: "popup",
        props: {
          options: expandTypes.map((t) => ({ label: t === "normal" ? "平铺展开" : "浮层展开", value: t })),
        },
      },
    ],
  },
  {
    title: "交互控制",
    children: [
      { label: "折叠菜单", key: "collapse", component: "checkbox" as const, defaultValue: false },
      { label: "单一展开（手风琴）", key: "uniqueOpened", component: "checkbox" as const, defaultValue: false },
      { label: "同级互斥展开", key: "expandMutex", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

const activePath = ref(["1"]);
const isCollapse = ref(false);

function handleSelect(index: string) {
  console.log("select", index);
}

function handleOpen(index: string) {
  console.log("open", index);
}

function handleClose(index: string) {
  console.log("close", index);
}

const codeString = computed(() => `<RebornMenu
  v-model:active='${JSON.stringify(activePath.value)}'
  v-model:expanded='[${expandedMenus.value.join(", ")}]'
  :mode='${state.value.mode}'
  :collapse='${state.value.collapse}'
  :menu-trigger='${state.value.menuTrigger}'
  :unique-opened='${state.value.uniqueOpened}'
  :expand-type='${state.value.expandType}'
  :expand-mutex='${state.value.expandMutex}'
  color='${state.value.color}'
  background-color='${state.value.backgroundColor}'
  text-color='${state.value.textColor}'
  active-text-color='${state.value.activeTextColor}'
/>`);
</script>

<template>
  <div class="flex flex-col gap-16 pb-24">
    <!-- 第一部分：交互式游乐场 -->
    <Playground v-model="state" :controls="controls" :code="codeString" component-name="RebornMenu" title="交互体验"
      description="通过左侧面板实时调节组件属性，在右侧查看视觉反馈">
      <RebornMenu v-model:active="activePath" v-model:expanded="expandedMenus" :mode="state.mode"
        :collapse="state.collapse" :menu-trigger="state.menuTrigger" :unique-opened="state.uniqueOpened"
        :expand-type="state.expandType" :expand-mutex="state.expandMutex" :color="state.color" class="min-h-[400px]"
        @select="handleSelect" @open="handleOpen" @close="handleClose">
        <RebornMenuItem index="1">
          <template #icon>
            <Icon name="lucide:home" class="size-5" />
          </template>
          首页
        </RebornMenuItem>

        <RebornSubMenu index="2">
          <template #icon>
            <Icon name="lucide:settings" class="size-5" />
          </template>
          <template #title>系统管理</template>

          <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
          <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
          <RebornMenuItem index="2-3">权限管理</RebornMenuItem>
          <RebornSubMenu index="2-4">
            <template #title>名单管理</template>

            <RebornMenuItemGroup title="白名单">
              <RebornMenuItem index="2-4-1">白名单管理</RebornMenuItem>
              <!-- <RebornMenuItem index="2-4-2">白名单IP管理</RebornMenuItem> -->
              <RebornSubMenu index="2-4-2">
                <template #title>白名单IP管理</template>

                <RebornMenuItemGroup title="白名单">
                  <RebornMenuItem index="2-4-2-1">白名单管理</RebornMenuItem>
                  <RebornMenuItem index="2-4-2-2">白名单IP管理</RebornMenuItem>
                </RebornMenuItemGroup>
              </RebornSubMenu>
            </RebornMenuItemGroup>

            <RebornMenuItemGroup title="黑名单">
              <RebornMenuItem index="2-4-3">黑名单管理</RebornMenuItem>
              <RebornMenuItem index="2-4-4">黑名单IP管理</RebornMenuItem>
            </RebornMenuItemGroup>
          </RebornSubMenu>
        </RebornSubMenu>

        <RebornSubMenu index="3">
          <template #icon>
            <Icon name="lucide:bar-chart-3" class="size-5" />
          </template>
          <template #title>数据分析</template>

          <RebornMenuItemGroup title="报表">
            <RebornMenuItem index="3-1">日报表</RebornMenuItem>
            <RebornMenuItem index="3-2">周报表</RebornMenuItem>
          </RebornMenuItemGroup>

          <RebornMenuItemGroup title="图表">
            <RebornMenuItem index="3-3">柱状图</RebornMenuItem>
            <RebornMenuItem index="3-4">折线图</RebornMenuItem>
          </RebornMenuItemGroup>
        </RebornSubMenu>

        <RebornMenuItem index="4" disabled>
          <template #icon>
            <Icon name="lucide:lock" class="size-5" />
          </template>
          禁用项
        </RebornMenuItem>
      </RebornMenu>
    </Playground>

    <!-- 第二部分：组件变体 -->
    <section class="space-y-8">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">核心变体</h3>
        <p class="text-sm text-gray-500">展示菜单的多种布局模式</p>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- 垂直菜单 -->
        <div
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-700 dark:text-gray-300">垂直菜单</h4>
            <RebornButton size="sm" variant="soft" @click="isCollapse = !isCollapse">
              {{ isCollapse ? "展开" : "折叠" }}
            </RebornButton>
          </div>
          <RebornMenu v-model:active="activePath" mode="vertical" :collapse="isCollapse" color="primary"
            class="min-h-[300px]" @select="handleSelect">
            <RebornMenuItem index="1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              <template #title>系统管理</template>

              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
              <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
              <RebornSubMenu index="2-4">
                <template #title>名单管理</template>

                <RebornMenuItemGroup title="白名单">
                  <RebornMenuItem index="2-4-1">白名单管理</RebornMenuItem>
                  <!-- <RebornMenuItem index="2-4-2">白名单IP管理</RebornMenuItem> -->
                  <RebornSubMenu index="2-4-2">
                    <template #title>白名单IP管理</template>

                    <RebornMenuItemGroup title="白名单">
                      <RebornMenuItem index="2-4-2-1">白名单管理</RebornMenuItem>
                      <RebornMenuItem index="2-4-2-2">白名单IP管理</RebornMenuItem>
                    </RebornMenuItemGroup>
                  </RebornSubMenu>
                </RebornMenuItemGroup>

                <RebornMenuItemGroup title="黑名单">
                  <RebornMenuItem index="2-4-3">黑名单管理</RebornMenuItem>
                  <RebornMenuItem index="2-4-4">黑名单IP管理</RebornMenuItem>
                </RebornMenuItemGroup>
              </RebornSubMenu>
            </RebornSubMenu>

            <RebornMenuItem index="3">
              <template #icon>
                <Icon name="lucide:bar-chart-3" class="size-5" />
              </template>
              数据分析
            </RebornMenuItem>
          </RebornMenu>
        </div>

        <!-- 水平菜单 -->
        <div
          class="col-span-2 flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">水平菜单</h4>
          <RebornMenu v-model:active="activePath" mode="horizontal" color="info" @select="handleSelect">
            <RebornMenuItem index="1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              <template #title>系统管理</template>

              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
              <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
            </RebornSubMenu>

            <RebornMenuItem index="3">
              <template #icon>
                <Icon name="lucide:bar-chart-3" class="size-5" />
              </template>
              数据分析
            </RebornMenuItem>
          </RebornMenu>
        </div>
      </div>
    </section>

    <!-- 第三部分：高级定制 -->
    <section class="space-y-8">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">进阶自定义</h3>
        <p class="text-sm text-gray-500">通过配置实现个性化样式</p>
      </div>

      <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        <!-- 深色主题 -->
        <div
          class="group relative overflow-hidden rounded-[40px] bg-gray-900 p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/20">
          <div class="mb-6 flex items-center gap-2 text-indigo-400 font-mono text-sm uppercase tracking-tighter">
            <Icon name="lucide:moon" class="size-4" />
            <span>Dark Mode</span>
          </div>
          <RebornMenu v-model:active="activePath" mode="vertical" color="neutral" background-color="#1f2937"
            text-color="#e5e7eb" active-text-color="#818cf8" class="min-h-[280px]">
            <RebornMenuItem index="1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              <template #title>系统管理</template>
              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <!-- 极简风格 -->
        <div
          class="group flex flex-col justify-center rounded-[40px] border-2 border-dashed border-gray-100 p-8 transition-all hover:border-gray-200 dark:border-gray-800">
          <div class="mb-6 text-sm text-gray-400 font-medium px-2">Minimalist</div>
          <RebornMenu v-model:active="activePath" mode="vertical" color="secondary" :ui="{
            root: 'rounded-none shadow-none border-0',
            menuItem: 'rounded-none mx-0',
            menuItemTitle: 'font-normal text-gray-700 dark:text-gray-300',
          }" class="min-h-[280px]">
            <RebornMenuItem index="1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              <template #title>系统管理</template>
              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <!-- 彩色主题 -->
        <div
          class="group relative overflow-hidden rounded-[40px] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-8 transition-all hover:shadow-2xl">
          <div class="mb-6 flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black">
            <Icon name="lucide:sparkles" class="size-5" />
            <span>Colorful</span>
          </div>
          <RebornMenu v-model:active="activePath" mode="vertical" color="error" background-color="transparent"
            text-color="#7c3aed" active-text-color="#ec4899" :ui="{
              root: 'rounded-none shadow-none border-0',
              menuItem: 'rounded-full bg-white/50 dark:bg-gray-900/50 mb-2',
            }" class="min-h-[280px]">
            <RebornMenuItem index="1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              <template #title>系统管理</template>
              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>
      </div>
    </section>

    <!-- 第四部分：展开模式对比 -->
    <section class="space-y-8">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">展开模式</h3>
        <p class="text-sm text-gray-500">对比平铺展开 (normal) 与浮层展开 (popup) 的区别</p>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- 平铺展开 - 垂直 -->
        <div
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">垂直 · 平铺展开 (normal)</h4>
          <p class="text-xs text-gray-400">子菜单内嵌展开，推动下方内容下移，适合树形导航</p>
          <RebornMenu v-model:active="activePath" mode="vertical" expand-type="normal" color="success"
            class="min-h-[280px]">
            <RebornMenuItem index="a1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>
            <RebornSubMenu index="a2">
              <template #icon>
                <Icon name="lucide:folder" class="size-5" />
              </template>
              <template #title>目录管理</template>
              <RebornMenuItem index="a2-1">新增目录</RebornMenuItem>
              <RebornMenuItem index="a2-2">编辑目录</RebornMenuItem>
              <RebornSubMenu index="a2-3">
                <template #title>高级设置</template>
                <RebornMenuItem index="a2-3-1">权限配置</RebornMenuItem>
                <RebornMenuItem index="a2-3-2">排序规则</RebornMenuItem>
              </RebornSubMenu>
            </RebornSubMenu>
            <RebornMenuItem index="a3">
              <template #icon>
                <Icon name="lucide:settings" class="size-5" />
              </template>
              设置
            </RebornMenuItem>
          </RebornMenu>
        </div>

        <!-- 平铺展开 - 水平 -->
        <div
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">水平 · 平铺展开 (normal)</h4>
          <p class="text-xs text-gray-400">水平模式下子菜单内嵌展开，适合顶部导航下拉场景</p>
          <RebornMenu v-model:active="activePath" mode="horizontal" expand-type="normal" color="info"
            class="min-h-[200px]">
            <RebornMenuItem index="b1">
              <template #icon>
                <Icon name="lucide:home" class="size-5" />
              </template>
              首页
            </RebornMenuItem>
            <RebornSubMenu index="b2">
              <template #icon>
                <Icon name="lucide:package" class="size-5" />
              </template>
              <template #title>产品</template>
              <RebornMenuItem index="b2-1">产品A</RebornMenuItem>
              <RebornMenuItem index="b2-2">产品B</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="b3">
              <template #icon>
                <Icon name="lucide:info" class="size-5" />
              </template>
              <template #title>关于</template>
              <RebornMenuItem index="b3-1">关于我们</RebornMenuItem>
              <RebornMenuItem index="b3-2">联系方式</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>
      </div>

      <div class="grid gap-8 lg:grid-cols-2">
        <!-- 浮层展开 + 同级互斥 -->
        <div
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">浮层展开 + 同级互斥 (expandMutex)</h4>
          <p class="text-xs text-gray-400">开启 expandMutex 后，同级子菜单只有一个展开，其余自动收起</p>
          <RebornMenu v-model:active="activePath" mode="vertical" expand-type="popup" :expand-mutex="true"
            color="warning" class="min-h-[280px]">
            <RebornSubMenu index="c1">
              <template #icon>
                <Icon name="lucide:folder" class="size-5" />
              </template>
              <template #title>菜单一</template>
              <RebornMenuItem index="c1-1">选项 1-1</RebornMenuItem>
              <RebornMenuItem index="c1-2">选项 1-2</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="c2">
              <template #icon>
                <Icon name="lucide:folder" class="size-5" />
              </template>
              <template #title>菜单二</template>
              <RebornMenuItem index="c2-1">选项 2-1</RebornMenuItem>
              <RebornMenuItem index="c2-2">选项 2-2</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="c3">
              <template #icon>
                <Icon name="lucide:folder" class="size-5" />
              </template>
              <template #title>菜单三</template>
              <RebornMenuItem index="c3-1">选项 3-1</RebornMenuItem>
              <RebornMenuItem index="c3-2">选项 3-2</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <!-- expanded 双向绑定示例 -->
        <div
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/20 p-6">
          <h4 class="font-medium text-gray-700 dark:text-gray-300">v-model:expanded 双向绑定</h4>
          <p class="text-xs text-gray-400">
            当前展开菜单：
            <code class="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-xs font-mono">
          {{ expandedMenus.length ? expandedMenus.join(', ') : '（无）' }}
        </code>
          </p>
          <RebornMenu v-model:active="activePath" v-model:expanded="expandedMenus" mode="vertical" color="primary"
            class="min-h-[180px]">
            <RebornSubMenu index="d1">
              <template #icon>
                <Icon name="lucide:star" class="size-5" />
              </template>
              <template #title>收藏</template>
              <RebornMenuItem index="d1-1">链接A</RebornMenuItem>
              <RebornMenuItem index="d1-2">链接B</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="d2">
              <template #icon>
                <Icon name="lucide:clock" class="size-5" />
              </template>
              <template #title>历史</template>
              <RebornMenuItem index="d2-1">记录A</RebornMenuItem>
              <RebornMenuItem index="d2-2">记录B</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>
      </div>
    </section>
  </div>
</template>
