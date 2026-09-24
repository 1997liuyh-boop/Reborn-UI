<script setup lang="ts">
import type { ItemType } from "~/components/reborn/ui/reborn-menu";
import { computed, ref, watch } from "vue";
import {
  RebornMenu,
  RebornMenuItem,
  RebornMenuItemGroup,
  RebornSubMenu,
} from "~/components/reborn/ui/reborn-menu";
import {
  expandTypes,
  menuColors,
  menuModes,
  menuTriggers,
} from "~/components/reborn/ui/reborn-menu/reborn-menu.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  mode: "vertical",
  collapse: false,
  menuTrigger: "hover",
  uniqueOpened: false,
  expandType: "popup",
  expandMutex: false,
  noIndent: false,
  defaultExpandAll: false,
  color: "primary",
  showActiveBackground: true,
  backgroundColor: "#ffffff",
  textColor: "#303133",
  activeTextColor: "#409eff",
});

/** 演练场里被 v-model:open-keys 双向绑定的展开项 */
const expandedMenus = ref<string[]>([]);

/** 演练场菜单的重建标记，切换「默认全部展开」时自增 */
const playgroundKey = ref(0);

/**
 * defaultExpandAll 只在挂载时判定一次，运行时改动不会让已收起的子菜单重新展开。
 * 演练场需要勾选即可见效，因此清空已展开项并让菜单重建一次，等价于带着新属性重新进页面。
 */
watch(
  () => state.value.defaultExpandAll,
  () => {
    expandedMenus.value = [];
    playgroundKey.value += 1;
  },
);

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
          options: menuModes.map((m) => ({
            label: m === "horizontal" ? "水平" : "垂直",
            value: m,
          })),
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
          options: menuColors.map((c) => ({
            label: c.charAt(0).toUpperCase() + c.slice(1),
            value: c,
          })),
        },
      },
      {
        label: "子菜单展开方式",
        key: "expandType",
        component: "select" as const,
        defaultValue: "popup",
        props: {
          options: expandTypes.map((t) => ({
            label: t === "normal" ? "平铺展开" : "浮层展开",
            value: t,
          })),
        },
      },
    ],
  },
  {
    title: "交互控制",
    children: [
      { label: "折叠菜单", key: "collapse", component: "checkbox" as const, defaultValue: false },
      {
        label: "单一展开（手风琴）",
        key: "uniqueOpened",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "同级互斥展开",
        key: "expandMutex",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "子菜单不缩进",
        key: "noIndent",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "默认全部展开",
        key: "defaultExpandAll",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "选中项背景块",
        key: "showActiveBackground",
        component: "checkbox" as const,
        defaultValue: true,
      },
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

// ─── items 配置式数据 ───────────────────────────────────────────

/** 「配置式」示例的选中项 */
const itemsActive = ref(["items-home"]);

/**
 * 与 Ant Design 对齐的菜单数据：
 * 普通项 / 子菜单（children）/ 分组（type: "group"）/ 分割线（type: "divider"）四类节点混排。
 */
const menuItems: ItemType[] = [
  { key: "items-home", label: "首页", icon: "lucide:home", extra: "⌘H" },
  { key: "items-search", label: "全局搜索", icon: "lucide:search", extra: "⌘K" },
  { type: "divider", key: "items-d1" },
  {
    type: "group",
    key: "items-g1",
    label: "工作台",
    children: [
      { key: "items-project", label: "项目管理", icon: "lucide:folder-kanban" },
      {
        key: "items-team",
        label: "团队协作",
        icon: "lucide:users",
        children: [
          { key: "items-team-member", label: "成员列表" },
          { key: "items-team-role", label: "角色权限" },
          { type: "divider", key: "items-d2", dashed: true },
          { key: "items-team-audit", label: "操作审计", disabled: true },
        ],
      },
    ],
  },
  { type: "divider", key: "items-d3" },
  { key: "items-setting", label: "偏好设置", icon: "lucide:settings", extra: "⌘," },
  { key: "items-logout", label: "退出登录", icon: "lucide:log-out", danger: true },
];

// ─── 溢出折叠 ───────────────────────────────────────────────────

/** 「溢出折叠」示例的选中项 */
const ellipsisActive = ref(["e1"]);
/** 通过缩放容器宽度直观观察折叠点变化 */
const ellipsisWidth = ref(100);
/** 顶栏导航条目 */
const ellipsisNavs = [
  "首页",
  "产品中心",
  "解决方案",
  "开发者文档",
  "社区论坛",
  "定价方案",
  "关于我们",
];

/** 子菜单缩进示例：两块用同一份选中与展开状态，只差 no-indent */
const indentPath = ref<string[]>(["i2-2-1"]);
const indentOpened = ref<string[]>(["i2", "i2-2"]);
const indentShowcases = [
  { label: "默认逐层缩进", note: "每下沉一层向右 16px，层级关系直观。", noIndent: false },
  { label: "no-indent 取消缩进", note: "各级条目左对齐，靠箭头与分组区分层级。", noIndent: true },
];

/** 演练场右上角展示的等价代码 */
const codeString = computed(
  () => `<RebornMenu
  v-model:selected-keys='${JSON.stringify(activePath.value)}'
  v-model:open-keys='[${expandedMenus.value.join(", ")}]'
  :mode='${state.value.mode}'
  :collapse='${state.value.collapse}'
  :menu-trigger='${state.value.menuTrigger}'
  :unique-opened='${state.value.uniqueOpened}'
  :expand-type='${state.value.expandType}'
  :expand-mutex='${state.value.expandMutex}'
  :no-indent='${state.value.noIndent}'
  :default-expand-all='${state.value.defaultExpandAll}'
  color='${state.value.color}'
  :show-active-background='${state.value.showActiveBackground}'
  background-color='${state.value.backgroundColor}'
  text-color='${state.value.textColor}'
  active-text-color='${state.value.activeTextColor}'
/>`,
);
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
      <div>
        <RebornMenu
          :key="playgroundKey"
          v-model:selected-keys="activePath"
          v-model:open-keys="expandedMenus"
          :mode="state.mode"
          :collapse="state.collapse"
          :menu-trigger="state.menuTrigger"
          :unique-opened="state.uniqueOpened"
          :expand-type="state.expandType"
          :expand-mutex="state.expandMutex"
          :no-indent="state.noIndent"
          :default-expand-all="state.defaultExpandAll"
          :color="state.color"
          :show-active-background="state.showActiveBackground"
          class="min-h-[400px] w-full"
          @select="handleSelect"
          @open="handleOpen"
          @close="handleClose"
        >
          <RebornMenuItem index="1">
            <template #icon>
              <Icon
                name="lucide:home"
                class="size-5"
              />
            </template>
            首页
          </RebornMenuItem>

          <RebornSubMenu index="2">
            <template #icon>
              <Icon
                name="lucide:settings"
                class="size-5"
              />
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
              <Icon
                name="lucide:bar-chart-3"
                class="size-5"
              />
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

          <RebornMenuItem
            index="4"
            disabled
          >
            <template #icon>
              <Icon
                name="lucide:lock"
                class="size-5"
              />
            </template>
            禁用项
          </RebornMenuItem>
        </RebornMenu>
      </div>
    </Playground>

    <DemoSection
      title="布局模式"
      description="mode 决定主轴方向：vertical 适合侧边导航，horizontal 适合顶栏；菜单自带表面样式，无需再包一层卡片。"
    >
      <DemoBlock
        layout="stack"
        class="gap-8"
      >
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
            v-model:selected-keys="activePath"
            mode="vertical"
            :collapse="isCollapse"
            color="primary"
            class="min-h-[300px] w-full max-w-xs"
            @select="handleSelect"
          >
            <RebornMenuItem index="1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon
                  name="lucide:settings"
                  class="size-5"
                />
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
                <Icon
                  name="lucide:bar-chart-3"
                  class="size-5"
                />
              </template>
              数据分析
            </RebornMenuItem>
          </RebornMenu>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">水平菜单 · <code>mode="horizontal"</code></span>
          <RebornMenu
            v-model:selected-keys="activePath"
            mode="horizontal"
            color="info"
            class="w-full"
            @select="handleSelect"
          >
            <RebornMenuItem index="1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon
                  name="lucide:settings"
                  class="size-5"
                />
              </template>
              <template #title>系统管理</template>

              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
              <RebornMenuItem index="2-2">角色管理</RebornMenuItem>
            </RebornSubMenu>

            <RebornMenuItem index="3">
              <template #icon>
                <Icon
                  name="lucide:bar-chart-3"
                  class="size-5"
                />
              </template>
              数据分析
            </RebornMenuItem>
          </RebornMenu>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="子菜单缩进">
      <template #description>
        平铺展开（<code>expand-type="normal"</code>）时，子菜单默认逐层向右缩进
        16px，层级关系一眼可辨。侧栏窄、层级深的场景里缩进会把文字挤到右侧， 这时用
        <code>no-indent</code> 取消缩进，各级条目一律左对齐，改由展开箭头和分组标题区分层级。
        浮层展开本就不缩进，该属性对它没有影响。
      </template>
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div
          v-for="opt in indentShowcases"
          :key="opt.label"
          class="flex flex-col gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ opt.label }}</span>
          <DemoNote tone="dimmed">{{ opt.note }}</DemoNote>
          <RebornMenu
            v-model:selected-keys="indentPath"
            v-model:open-keys="indentOpened"
            mode="vertical"
            expand-type="normal"
            :no-indent="opt.noIndent"
            class="w-full"
          >
            <RebornMenuItem index="i1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              工作台
            </RebornMenuItem>
            <RebornSubMenu index="i2">
              <template #icon>
                <Icon
                  name="lucide:folder"
                  class="size-5"
                />
              </template>
              <template #title>内容管理</template>
              <RebornMenuItem index="i2-1">文章列表</RebornMenuItem>
              <RebornSubMenu index="i2-2">
                <template #title>分类设置</template>
                <RebornMenuItem index="i2-2-1">一级分类</RebornMenuItem>
                <RebornMenuItem index="i2-2-2">二级分类</RebornMenuItem>
              </RebornSubMenu>
            </RebornSubMenu>
          </RebornMenu>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="展开模式"
      description="expand-type 控制子菜单形态：normal 内嵌下推、popup 浮层弹出；expand-mutex 让同级子菜单互斥展开。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">垂直 · 平铺展开 <code>normal</code></span>
          <DemoNote tone="dimmed">子菜单内嵌展开并下推后续内容，适合树形导航。</DemoNote>
          <RebornMenu
            v-model:selected-keys="activePath"
            mode="vertical"
            expand-type="normal"
            color="success"
            class="min-h-[280px] w-full"
          >
            <RebornMenuItem index="a1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>
            <RebornSubMenu index="a2">
              <template #icon>
                <Icon
                  name="lucide:folder"
                  class="size-5"
                />
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
                <Icon
                  name="lucide:settings"
                  class="size-5"
                />
              </template>
              设置
            </RebornMenuItem>
          </RebornMenu>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">水平 · 平铺展开 <code>normal</code></span>
          <DemoNote tone="dimmed">水平模式下子菜单内嵌展开，适合顶部导航的下拉场景。</DemoNote>
          <RebornMenu
            v-model:selected-keys="activePath"
            mode="horizontal"
            expand-type="normal"
            color="info"
            class="min-h-[200px] w-full"
          >
            <RebornMenuItem index="b1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>
            <RebornSubMenu index="b2">
              <template #icon>
                <Icon
                  name="lucide:package"
                  class="size-5"
                />
              </template>
              <template #title>产品</template>
              <RebornMenuItem index="b2-1">产品A</RebornMenuItem>
              <RebornMenuItem index="b2-2">产品B</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="b3">
              <template #icon>
                <Icon
                  name="lucide:info"
                  class="size-5"
                />
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
            v-model:selected-keys="activePath"
            mode="vertical"
            expand-type="popup"
            :expand-mutex="true"
            color="warning"
            class="min-h-[280px] w-full"
          >
            <RebornSubMenu index="c1">
              <template #icon>
                <Icon
                  name="lucide:folder"
                  class="size-5"
                />
              </template>
              <template #title>菜单一</template>
              <RebornMenuItem index="c1-1">选项 1-1</RebornMenuItem>
              <RebornMenuItem index="c1-2">选项 1-2</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="c2">
              <template #icon>
                <Icon
                  name="lucide:folder"
                  class="size-5"
                />
              </template>
              <template #title>菜单二</template>
              <RebornMenuItem index="c2-1">选项 2-1</RebornMenuItem>
              <RebornMenuItem index="c2-2">选项 2-2</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="c3">
              <template #icon>
                <Icon
                  name="lucide:folder"
                  class="size-5"
                />
              </template>
              <template #title>菜单三</template>
              <RebornMenuItem index="c3-1">选项 3-1</RebornMenuItem>
              <RebornMenuItem index="c3-2">选项 3-2</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">双向绑定 · <code>v-model:open-keys</code></span>
          <DemoNote tone="dimmed">
            当前展开菜单：<code>{{
              expandedMenus.length ? expandedMenus.join(", ") : "（无）"
            }}</code>
          </DemoNote>
          <RebornMenu
            v-model:selected-keys="activePath"
            v-model:open-keys="expandedMenus"
            mode="vertical"
            color="primary"
            class="min-h-[180px] w-full"
          >
            <RebornSubMenu index="d1">
              <template #icon>
                <Icon
                  name="lucide:star"
                  class="size-5"
                />
              </template>
              <template #title>收藏</template>
              <RebornMenuItem index="d1-1">链接A</RebornMenuItem>
              <RebornMenuItem index="d1-2">链接B</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="d2">
              <template #icon>
                <Icon
                  name="lucide:clock"
                  class="size-5"
                />
              </template>
              <template #title>历史</template>
              <RebornMenuItem index="d2-1">记录A</RebornMenuItem>
              <RebornMenuItem index="d2-2">记录B</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">默认全部展开 · <code>default-expand-all</code></span>
          <DemoNote tone="dimmed">
            进页面即展开全部层级，适合层级少、需要一眼看全的配置型导航。仅在平铺展开
            <code>expand-type="normal"</code> 下生效，浮层形态下全部展开会让弹层互相遮挡。
          </DemoNote>
          <RebornMenu
            v-model:selected-keys="activePath"
            mode="vertical"
            expand-type="normal"
            default-expand-all
            color="error"
            class="min-h-[300px] w-full"
          >
            <RebornSubMenu index="f1">
              <template #icon>
                <Icon
                  name="lucide:sliders-horizontal"
                  class="size-5"
                />
              </template>
              <template #title>基础配置</template>
              <RebornMenuItem index="f1-1">站点信息</RebornMenuItem>
              <RebornMenuItem index="f1-2">主题外观</RebornMenuItem>
            </RebornSubMenu>
            <RebornSubMenu index="f2">
              <template #icon>
                <Icon
                  name="lucide:shield"
                  class="size-5"
                />
              </template>
              <template #title>安全设置</template>
              <RebornMenuItem index="f2-1">登录策略</RebornMenuItem>
              <RebornSubMenu index="f2-2">
                <template #title>访问控制</template>
                <RebornMenuItem index="f2-2-1">IP 名单</RebornMenuItem>
                <RebornMenuItem index="f2-2-2">接口限流</RebornMenuItem>
              </RebornSubMenu>
            </RebornSubMenu>
          </RebornMenu>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="配置式数据"
      description="传入 items 即可由组件递归渲染，无需手写嵌套模板；节点类型与 Ant Design 对齐，支持普通项、子菜单、分组（type: 'group'）与分割线（type: 'divider'）。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">垂直 · <code>items</code></span>
          <DemoNote tone="dimmed">
            当前选中：<code>{{ itemsActive.join(" / ") || "（无）" }}</code>
          </DemoNote>
          <RebornMenu
            v-model:selected-keys="itemsActive"
            :items="menuItems"
            mode="vertical"
            color="primary"
            class="min-h-[420px] w-full max-w-xs"
          />
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">节点能力速览</span>
          <DemoNote tone="dimmed">
            <code>extra</code> 展示右侧快捷键、<code>danger</code> 渲染为错误色、<code>disabled</code>
            置灰并保留 <code>not-allowed</code> 光标、<code>dashed</code> 让分割线变虚线。
          </DemoNote>
          <RebornMenu
            v-model:selected-keys="itemsActive"
            :items="menuItems"
            mode="vertical"
            expand-type="normal"
            color="secondary"
            class="min-h-[420px] w-full max-w-xs"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="溢出折叠"
      description="水平模式下开启 ellipsis，容器放不下的条目会自动收进「更多」子菜单；拖动滑块改变容器宽度即可看到折叠点随之变化。"
    >
      <DemoBlock
        layout="stack"
        class="gap-6"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-4">
            <span class="text-dimmed shrink-0 text-xs font-medium">容器宽度</span>
            <RebornSlider
              v-model="ellipsisWidth"
              class="max-w-xs flex-1"
              :min="30"
              :max="100"
              :step="1"
              show-value
            />
          </div>
          <DemoNote tone="dimmed">
            共
            {{ ellipsisNavs.length }} 项，收窄容器后多余条目会折叠到末尾的「更多」入口。
          </DemoNote>
          <div
            :style="{ width: `${ellipsisWidth}%` }"
            class="min-w-0 transition-[width] duration-200"
          >
            <RebornMenu
              v-model:selected-keys="ellipsisActive"
              mode="horizontal"
              ellipsis
              color="primary"
              class="w-full"
            >
              <RebornMenuItem
                v-for="(nav, index) in ellipsisNavs"
                :key="nav"
                :index="`e${index + 1}`"
              >
                {{ nav }}
              </RebornMenuItem>
            </RebornMenu>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">关闭折叠 · <code>:ellipsis="false"</code></span>
          <DemoNote tone="dimmed">关闭后条目不再收纳，超出宽度会被裁切或换行。</DemoNote>
          <div
            :style="{ width: `${ellipsisWidth}%` }"
            class="min-w-0 transition-[width] duration-200"
          >
            <RebornMenu
              v-model:selected-keys="ellipsisActive"
              mode="horizontal"
              :ellipsis="false"
              color="info"
              class="w-full"
            >
              <RebornMenuItem
                v-for="(nav, index) in ellipsisNavs"
                :key="nav"
                :index="`e${index + 1}`"
              >
                {{ nav }}
              </RebornMenuItem>
            </RebornMenu>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="配色与样式自定义"
      description="background-color / text-color / active-text-color 直接改写菜单自身的表面配色；ui 则用于覆盖各插槽类名。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">深色配色 · <code>background-color</code></span>
          <RebornMenu
            v-model:selected-keys="activePath"
            mode="vertical"
            color="neutral"
            background-color="#1f2937"
            text-color="#e5e7eb"
            active-text-color="#818cf8"
            class="min-h-[280px] w-full"
          >
            <RebornMenuItem index="1">
              <template #icon>
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon
                  name="lucide:settings"
                  class="size-5"
                />
              </template>
              <template #title>系统管理</template>
              <RebornMenuItem index="2-1">用户管理</RebornMenuItem>
            </RebornSubMenu>
          </RebornMenu>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">极简无边 · <code>ui.root</code></span>
          <RebornMenu
            v-model:selected-keys="activePath"
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
                <Icon
                  name="lucide:home"
                  class="size-5"
                />
              </template>
              首页
            </RebornMenuItem>

            <RebornSubMenu index="2">
              <template #icon>
                <Icon
                  name="lucide:settings"
                  class="size-5"
                />
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
