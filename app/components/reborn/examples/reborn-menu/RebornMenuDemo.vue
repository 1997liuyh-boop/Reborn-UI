<script setup lang="ts">
import { ref, computed } from "vue";
import {
  RebornMenu,
  RebornSubMenu,
  RebornMenuItem,
  RebornMenuItemGroup,
} from "~/components/reborn/ui/reborn-menu";
import { menuModes, menuTriggers, menuColors, expandTypes } from "~/components/reborn/ui/reborn-menu/reborn-menu.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

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

/** 演练场里被 v-model:expanded 双向绑定的展开项 */
const expandedMenus = ref<string[]>([]);

/** 演练场控制面板配置 */
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

// ─── 场景演示状态 ───────────────────────────────────────────────

const activePath = ref(["1"]);
/** 「垂直菜单」示例的折叠开关 */
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

/** 演练场右上角展示的等价代码 */
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
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="codeString"
      component-name="RebornMenu"
      title="交互演练场"
      description="调节左侧属性，实时预览菜单的布局、展开方式与配色。"
    >
      <RebornMenu
        v-model:active="activePath"
        v-model:expanded="expandedMenus"
        :mode="state.mode"
        :collapse="state.collapse"
        :menu-trigger="state.menuTrigger"
        :unique-opened="state.uniqueOpened"
        :expand-type="state.expandType"
        :expand-mutex="state.expandMutex"
        :color="state.color"
        class="min-h-[400px] w-full"
        @select="handleSelect"
        @open="handleOpen"
        @close="handleClose"
      >
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

    <DemoSection
      title="布局模式"
      description="mode 决定主轴方向：vertical 适合侧边导航，horizontal 适合顶栏；菜单自带表面样式，无需再包一层卡片。"
    >
      <DemoBlock layout="stack" class="gap-8">
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-4">
            <span class="text-dimmed text-xs font-medium">垂直菜单 · <code>mode="vertical"</code></span>
            <RebornButton
              size="sm"
              variant="soft"
              color="neutral"
              :label="isCollapse ? '展开' : '折叠'"
              @click="isCollapse = !isCollapse"
            />
          </div>
          <RebornMenu
            v-model:active="activePath"
            mode="vertical"
            :collapse="isCollapse"
            color="primary"
            class="min-h-[300px] w-full max-w-xs"
            @select="handleSelect"
          >
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
                  <RebornMenuItem index="2-4-2">白名单IP管理</RebornMenuItem>
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

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">水平菜单 · <code>mode="horizontal"</code></span>
          <RebornMenu
            v-model:active="activePath"
            mode="horizontal"
            color="info"
            class="w-full"
            @select="handleSelect"
          >
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
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="展开模式"
      description="expand-type 控制子菜单形态：normal 内嵌下推、popup 浮层弹出；expand-mutex 让同级子菜单互斥展开。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">垂直 · 平铺展开 <code>normal</code></span>
          <DemoNote tone="dimmed">子菜单内嵌展开并下推后续内容，适合树形导航。</DemoNote>
          <RebornMenu
            v-model:active="activePath"
            mode="vertical"
            expand-type="normal"
            color="success"
            class="min-h-[280px] w-full"
          >
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

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">水平 · 平铺展开 <code>normal</code></span>
          <DemoNote tone="dimmed">水平模式下子菜单内嵌展开，适合顶部导航的下拉场景。</DemoNote>
          <RebornMenu
            v-model:active="activePath"
            mode="horizontal"
            expand-type="normal"
            color="info"
            class="min-h-[200px] w-full"
          >
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

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">浮层展开 + 同级互斥 <code>expand-mutex</code></span>
          <DemoNote tone="dimmed">同级子菜单同时只保留一个展开，其余自动收起。</DemoNote>
          <RebornMenu
            v-model:active="activePath"
            mode="vertical"
            expand-type="popup"
            :expand-mutex="true"
            color="warning"
            class="min-h-[280px] w-full"
          >
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

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">双向绑定 · <code>v-model:expanded</code></span>
          <DemoNote tone="dimmed">
            当前展开菜单：<code>{{ expandedMenus.length ? expandedMenus.join(", ") : "（无）" }}</code>
          </DemoNote>
          <RebornMenu
            v-model:active="activePath"
            v-model:expanded="expandedMenus"
            mode="vertical"
            color="primary"
            class="min-h-[180px] w-full"
          >
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
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="配色与样式自定义"
      description="background-color / text-color / active-text-color 直接改写菜单自身的表面配色；ui 则用于覆盖各插槽类名。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">深色配色 · <code>background-color</code></span>
          <RebornMenu
            v-model:active="activePath"
            mode="vertical"
            color="neutral"
            background-color="#1f2937"
            text-color="#e5e7eb"
            active-text-color="#818cf8"
            class="min-h-[280px] w-full"
          >
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

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">极简无边 · <code>ui.root</code></span>
          <RebornMenu
            v-model:active="activePath"
            mode="vertical"
            color="secondary"
            background-color="transparent"
            :ui="{
              root: 'rounded-none shadow-none border-0 bg-transparent dark:bg-transparent',
              menuItem: 'rounded-none mx-0',
              menuItemTitle: 'font-normal',
            }"
            class="min-h-[280px] w-full"
          >
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
      </DemoBlock>
    </DemoSection>
  </div>
</template>
