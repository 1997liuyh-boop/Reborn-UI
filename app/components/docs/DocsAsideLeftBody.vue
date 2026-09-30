<script setup lang="ts">
/**
 * DocsAsideLeftBody —— 文档页左侧导航（覆盖 Docus 层同名组件）
 *
 * 基于 RebornMenu 搭成三层结构：
 * - 分区 / 系列（入门指南、Reborn 组件、社区移植……）→ RebornSubMenu，一级标题，可收起；
 * - 分类小标题（组件分区的虚拟节点，`page: false`）→ RebornMenuItemGroup，只是一行标签，
 *   不可点击、不可收起，标题右侧带该分类的组件数；
 * - 页面 → RebornMenuItem，key 就是路由路径，菜单开 router 模式，点击即跳转；
 * - 其它分区仍是「分组 → 页面」两级；带子页面的目录页把子页缩进一档列在它下面。
 *
 * 折叠：侧栏的折叠状态（useDocsAside，按钮在 layouts/docs.vue）直接传给 RebornMenu 的 collapse。
 * 折叠后菜单收成 64px 窄轨，每个分区只剩一枚图标，点击弹出浮层，浮层里按分类分组列出全部页面；
 * 一个分区可能有上百个页面，浮层限高并可滚动。
 * 图标展开态也渲染但藏起来（分区标题前不显示，保持原有侧栏观感），原因见模板里 #icon 插槽的说明。
 * expand-type 随折叠切换：RebornSubMenu 向浮层内再分发上下文时把 collapse 固定为 false，
 * 浮层里若还有子菜单，展开方式回落到根节点的 expand-type——传 normal 就会在浮层里平铺，
 * 所以折叠态传 popup、展开态传 normal。
 *
 * 展开状态：各分区默认全部展开，用户收起过的分区记在 useState 里，
 * 路由切换（布局层 UPage 以 route.path 为 key 整体重挂载）后依然保持收起。
 * 之所以显式绑定 open-keys 而不只靠 default-expand-all：后者是子菜单挂载后才逐个上报展开，
 * 每次重挂载都会从 0 高度撑开一遍，首屏与每次切页都能看到整列菜单「长」出来；
 * 有了初始值，子菜单首帧就是展开态，没有这段动画。default-expand-all 仍然传着，
 * 只在用户把所有分区都收起后的下一次挂载兜底，避免侧栏空着一片。
 * 折叠态下 open-keys 固定为空：浮层形态里「全部展开」等于所有浮层同时弹出、互相遮挡，
 * 浮层的开合交给菜单自己按点击维护。
 *
 * 选中项：由当前路由推导完整路径（分区 → 页面；分组不是子菜单，不进路径），分区标题随之高亮；
 * auto-scroll-into-view 把选中项滚到侧栏可视区中部——只滚侧栏自身，不带动页面。
 *
 * 样式：不改组件源码，全部走 ui 传参。根节点去掉卡片投影与底色让菜单融入侧栏，
 * 三个层级再各用一份 ui 覆盖字号与间距：一级 18px 加粗、分类 14px 主色、页面 14px；
 * 折叠态换回组件默认的内边距，图标才会落在窄轨正中。
 * 适用端 / New 等徽标已不再出现：适用端由顶栏的 Web / UniApp 开关统一筛选
 * （useNavigation 已按档位裁剪），组件分区顶部只留一行当前平台与数量的说明。
 */
import type { ContentNavigationItem } from "@nuxt/content";
import type { MenuUI } from "~/components/reborn/ui/reborn-menu/reborn-menu.config";

const navigation = inject<Ref<ContentNavigationItem[]>>("navigation");
const { nav } = useNavigation(navigation);
const { platform } = useDocsPlatform();
const route = useRoute();
/** 侧栏折叠状态：按钮与栅格切换都在 layouts/docs.vue，这里只把它交给菜单 */
const { collapsed } = useDocsAside();

/** 当前是否在组件分区：平台说明行只在这里出现 */
const isComponentsSection = computed(() => route.path.startsWith("/components"));

/** 当前平台下侧栏列出的组件数（穿透分类节点数叶子） */
const componentCount = computed(() => countNavigationLeaves(nav.value));

/** 平台说明行文案 */
const platformCaption = computed(() =>
  platform.value === "uniapp" ? "UniApp 端组件" : "Web 端组件",
);

/** 虚拟分组节点（分类小标题）：不对应页面，只渲染标题与其子项 */
function isVirtualGroup(item: ContentNavigationItem): boolean {
  return item.page === false && !!item.children?.length;
}

/**
 * 分区的菜单 key。
 * 扁平分区（如入门指南）会被 useNavigation 包成 { title: 'Overview', path: 首页路径 }，
 * path 与它第一个页面的路径相同，直接当 key 会与那个页面的 key 撞上，所以加前缀区分。
 */
function sectionKey(section: ContentNavigationItem): string {
  return `section:${section.path}`;
}

/** 去掉尾斜杠，路由与导航两边的路径按同一口径比对 */
function normalizePath(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

// ---- 折叠态窄轨里的分区图标 ----

/** 组件分区的两个系列：导航节点是重组出来的虚拟节点，没有自带图标 */
const SERIES_ICONS: Record<string, string> = {
  reborn: "lucide:blocks",
  community: "lucide:package-open",
};

/**
 * 分区图标的取值顺序：导航节点自带的 icon（.navigation.yml 里写的）→ 组件系列 →
 * 所在顶级分区的 icon（入门指南 lucide:rocket、Composables tabler:function……）→ 文件夹兜底。
 * 扁平分区被包成的「Overview」没有自己的图标，走的就是第三档。
 */
function sectionIcon(section: ContentNavigationItem): string {
  if (typeof section.icon === "string" && section.icon) return section.icon;
  if (typeof section.series === "string" && SERIES_ICONS[section.series]) {
    return SERIES_ICONS[section.series];
  }
  const topPath = `/${route.path.split("/").filter(Boolean)[0] ?? ""}`;
  const top = toValue(navigation)?.find((item) => item.path === topPath);
  return typeof top?.icon === "string" && top.icon ? top.icon : "lucide:folder";
}

// ---- 选中项：由路由推导完整路径 ----

/**
 * 页面路径 → 菜单路径（分区 key → 页面 key）。
 * RebornMenu 的 selectedKeys 存的是完整路径而非单个 key，祖先高亮依赖这一点；
 * 分组（RebornMenuItemGroup）不是子菜单、不下发路径，所以分类不出现在路径里。
 */
const pathIndex = computed(() => {
  const map = new Map<string, string[]>();
  for (const section of nav.value) {
    const base = [sectionKey(section)];
    for (const item of section.children ?? []) {
      if (isVirtualGroup(item)) {
        for (const child of item.children ?? []) {
          map.set(normalizePath(child.path), [...base, child.path]);
        }
        continue;
      }
      map.set(normalizePath(item.path), [...base, item.path]);
      // 目录页的下级页面与它平级列出（都是 RebornMenuItem），路径里不含目录页自身
      for (const child of item.children ?? []) {
        map.set(normalizePath(child.path), [...base, child.path]);
      }
    }
  }
  return map;
});

const selectedKeys = ref<string[]>([]);

watch(
  [() => route.path, pathIndex],
  () => {
    selectedKeys.value = pathIndex.value.get(normalizePath(route.path)) ?? [];
  },
  { immediate: true },
);

// ---- 展开状态：记「收起过的」而不是「展开着的」 ----

/**
 * 用户手动收起过的分区 key，跨路由保留。
 * 记收起项而非展开项：切换 Web / UniApp 档位后分区可能增减，新出现的分区应当默认展开，
 * 记展开项的话它不在名单里就成了收起。
 */
const closedKeys = useState<string[]>("docs-aside-closed-keys", () => []);

/** 当前导航里所有可展开的节点：只有分区，分类是分组、不可收起 */
const openableKeys = computed(() => nav.value.map((section) => sectionKey(section)));

/**
 * 与菜单双向绑定的展开集合：全部分区减去用户收起过的。
 * 折叠态固定为空，且不接受菜单的回写：浮层的开合由菜单内部按点击维护，
 * 回写会把「只开着这一个浮层」误记成「其余全部收起」，展开侧栏时整列就塌了。
 */
const openKeys = computed<string[]>({
  get: () =>
    collapsed.value ? [] : openableKeys.value.filter((key) => !closedKeys.value.includes(key)),
  set: (value) => {
    if (collapsed.value) return;
    closedKeys.value = openableKeys.value.filter((key) => !value.includes(key));
  },
});

// ---- 样式覆盖：只改尺寸与配色，交互态沿用组件默认 ----

/**
 * 根节点：去掉卡片投影与底色让菜单融入侧栏。
 * 展开态分区之间留 20px、分区内条目间距 2px；
 * 折叠态窄轨里图标行之间只留 4px，分区浮层限高在顶栏以下一屏之内并可滚动——
 * 「Reborn 组件」有一百多个页面，不限高的浮层会超出视口、下半截点不到。
 * 96px = 顶栏 64px + 浮层贴边定位时留的 8px 安全距离，再留些余量。
 */
const menuUi = computed<MenuUI>(() =>
  collapsed.value
    ? {
        root: "shadow-none bg-transparent",
        menu: "gap-y-1",
        subMenuContent: "max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain",
      }
    : { root: "shadow-none bg-transparent", menu: "gap-y-5", subMenuContent: "gap-y-0.5" },
);

/**
 * 一级分区标题：18px 加粗 gray-9，与旧版侧栏一致。
 * 标题行不要悬浮底色与按压缩放（它是分组标题，不是可选项）；
 * 文字色与箭头色钉死为灰阶，不跟随「后代被选中」的祖先高亮——分区标题变主色会抢过真正选中的页面。
 * 折叠态只剩图标：沿用组件默认的 px-4 让图标框落在 64px 窄轨正中，悬浮底色也留着当点击反馈。
 */
const sectionUi = computed<MenuUI>(() =>
  collapsed.value
    ? { menuItem: "rounded-md active:scale-100" }
    : {
        menuItem: "mb-2 rounded-md px-3 py-0 bg-transparent shadow-none hover:bg-transparent active:scale-100",
        menuItemTitle: "text-[18px] leading-[26px] font-semibold text-gray-9",
        menuItemArrow: "text-gray-7 opacity-70",
        // 图标框始终渲染、展开态只是藏起来（见模板里 #icon 插槽的说明）
        menuItemIcon: "hidden",
      },
);

/**
 * 分类分组：标题 14px 主色、不大写不加字距（组件默认是小号灰色大写标签），右侧带组件数徽标；
 * 组内条目间距 2px，与分区内其它条目一致。展开态与浮层里用同一份。
 */
const groupUi: MenuUI = {
  menuItemGroupTitle:
    "px-3 pt-0 pb-1 text-[14px] leading-[20px] font-medium normal-case tracking-normal text-primary",
  menuItemGroupContent: "gap-y-0.5",
};

/**
 * 页面条目：14px 单行截断，悬浮浅灰底与选中主色浅底都沿用组件默认。
 * 去掉选中态的投影（侧栏里的选中块不该浮起来）与按压缩放。
 * 标题色不写：level 变体给的 gray-9 已经合适，写了会连选中态的主色一起盖掉。
 */
const pageUi: MenuUI = {
  menuItem: "rounded-md px-3 py-2 shadow-none active:scale-100",
  menuItemTitle: "text-[14px] leading-[20px] font-normal",
};

/** 目录页的下级页面：左侧再缩进一档、字号略小，区分于同级的目录页 */
const subPageUi: MenuUI = {
  menuItem: "rounded-md py-1.5 pr-3 pl-6 shadow-none active:scale-100",
  menuItemTitle: "text-[12.5px] leading-[18px] font-normal",
};
</script>

<template>
  <div class="py-1">
    <!-- 平台说明行：告知当前列出的是哪一端的组件（由顶栏开关切换）；gray 色阶自带明暗反转 -->
    <div v-if="isComponentsSection" v-show="!collapsed" class="mb-5 flex items-center justify-between px-3 text-xs text-gray-6">
      <span>{{ platformCaption }}</span>
      <span class="tabular-nums">{{ componentCount }}</span>
    </div>

    <!--
      展开态平铺展开 + 点击触发：各分区是可收起的子菜单，互不影响（不互斥、不手风琴）；
      折叠态切成浮层展开，见顶部说明。
      close-on-click-outside 只在折叠态打开：展开态它会把菜单外的任何点击当成「收起全部」，
      读者一点正文整列侧栏就塌了；折叠态则要靠它把点开的浮层收掉。
      no-indent：侧栏只有 248px，多层缩进会把组件名挤得没地方放。
    -->
    <RebornMenu
      v-model:selected-keys="selectedKeys"
      v-model:open-keys="openKeys"
      mode="vertical"
      :collapse="collapsed"
      :tooltip="true"
      menu-trigger="click"
      :unique-opened="false"
      :expand-type="collapsed ? 'popup' : 'normal'"
      :expand-mutex="false"
      :no-indent="true"
      :default-expand-all="true"
      color="primary"
      :show-active-background="true"
      router
      :close-on-click-outside="collapsed"
      auto-scroll-into-view
      :scroll-config="{ block: 'center' }"
      :ui="menuUi"
    >
      <RebornSubMenu
        v-for="section in nav"
        :key="sectionKey(section)"
        :index="sectionKey(section)"
        :ui="sectionUi"
      >
        <!--
          折叠态窄轨里分区只剩这枚图标。展开态也照样渲染、由 sectionUi 的 menuItemIcon: hidden 藏起来，
          而不是 v-if 到折叠时才挂：Nuxt Icon 的 css 模式在图标首次出现时往 head 最前面插一个 style，
          整页样式随之重算（这页六千多个节点，一次一两百毫秒，几枚图标就是几百毫秒的卡顿）；
          首屏渲染出来，规则在 SSR 阶段随页面一起下发，折叠时就没有注入。
        -->
        <template #icon>
          <Icon :name="sectionIcon(section)" class="size-4" />
        </template>
        <template #title>{{ section.title }}</template>

        <template v-for="item in section.children" :key="item.path">
          <!-- 组件分区的分类小标题：虚拟节点，渲染成分组标签，下面直接列组件页；分类之间展开态留 14px、浮层里留 8px -->
          <RebornMenuItemGroup
            v-if="isVirtualGroup(item)"
            :class="collapsed ? 'pt-2 first:pt-0' : 'pt-3.5 first:pt-0'"
            :ui="groupUi"
          >
            <template #title>
              <span class="flex min-w-0 items-center justify-between gap-2">
                <span class="min-w-0 truncate">{{ item.title }}</span>
                <!-- 该分类下的组件数：穿透子树数叶子，与顶部总数同一套口径 -->
                <RebornBadge :label="countNavigationLeaves(item.children)" square size="sm" />
              </span>
            </template>

            <RebornMenuItem
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
              :ui="pageUi"
            >
              {{ child.title }}
            </RebornMenuItem>
          </RebornMenuItemGroup>

          <template v-else>
            <RebornMenuItem :index="item.path" :ui="pageUi">
              {{ item.title }}
            </RebornMenuItem>

            <!-- 真实目录节点（有页面）的下级页面：缩进一档列在目录页下方 -->
            <RebornMenuItem
              v-for="child in item.children ?? []"
              :key="child.path"
              :index="child.path"
              :ui="subPageUi"
            >
              {{ child.title }}
            </RebornMenuItem>
          </template>
        </template>
      </RebornSubMenu>
    </RebornMenu>
  </div>
</template>
