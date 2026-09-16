<script setup lang="ts">
import type {
  TreeCheckedKeys,
  TreeDataNode,
  TreeKey,
} from "~/components/reborn/ui/reborn-tree/reborn-tree.config";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import { treeColors } from "~/components/reborn/ui/reborn-tree/reborn-tree.config";
import RebornTree from "~/components/reborn/ui/reborn-tree/RebornTree.vue";
import { useTree } from "~/components/reborn/ui/reborn-tree/useTree";

/** 生成一棵文件目录风格的演示树；每次调用返回全新副本，避免多个示例互相污染 */
function makeTreeData(): TreeDataNode[] {
  return [
    {
      key: "engineering",
      title: "工程效能",
      icon: "lucide:folder",
      children: [
        {
          key: "frontend",
          title: "前端平台",
          icon: "lucide:folder",
          children: [
            { key: "design-system", title: "设计系统", icon: "lucide:palette" },
            { key: "playground", title: "在线演练场", icon: "lucide:flask-conical" },
          ],
        },
        {
          key: "backend",
          title: "服务端",
          icon: "lucide:folder",
          children: [
            { key: "payment-gateway", title: "支付网关", icon: "lucide:credit-card" },
            { key: "message-queue", title: "消息队列", icon: "lucide:mails" },
          ],
        },
      ],
    },
    {
      key: "operation",
      title: "运营支撑",
      icon: "lucide:folder",
      children: [
        { key: "dashboard", title: "数据看板", icon: "lucide:chart-line" },
        { key: "audit-log", title: "审计日志", icon: "lucide:scroll-text" },
      ],
    },
  ];
}

/** 主题色下拉选项 */
const colorOptions = treeColors.map((c) => ({
  label: c.charAt(0).toUpperCase() + c.slice(1),
  value: c,
}));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  color: "primary",
  checkable: false,
  checkStrictly: false,
  showLine: false,
  showIcon: false,
  blockNode: false,
  multiple: false,
  selectable: true,
  draggable: false,
  disabled: false,
  animated: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场的树数据：末尾带一个 disabled 节点，方便观察禁用态对点选/勾选/拖拽的屏蔽 */
const playTreeData = ref<TreeDataNode[]>([
  ...makeTreeData(),
  { key: "archive", title: "历史归档（disabled）", icon: "lucide:archive", disabled: true },
]);

/** 最近一次事件回显，让预览区的交互「有回应」 */
const lastEvent = ref("尚未交互");

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  lastEvent.value = "尚未交互";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "主题色", key: "color", component: "select" as const, defaultValue: "primary", props: { options: colorOptions } },
      { label: "复选框", key: "checkable", component: "checkbox" as const, defaultValue: false },
      { label: "连接线", key: "showLine", component: "checkbox" as const, defaultValue: false },
      { label: "节点图标", key: "showIcon", component: "checkbox" as const, defaultValue: false },
      { label: "节点占据一行", key: "blockNode", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "可点选", key: "selectable", component: "checkbox" as const, defaultValue: true },
      { label: "多选", key: "multiple", component: "checkbox" as const, defaultValue: false },
      { label: "父子勾选不关联", key: "checkStrictly", component: "checkbox" as const, defaultValue: false },
      { label: "可拖拽", key: "draggable", component: "checkbox" as const, defaultValue: false },
      { label: "展开动画", key: "animated", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "整树禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const treeCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    `:tree-data="treeData"`,
    `:default-expanded-keys="['engineering']"`,
    `:checkable="${s.checkable}"`,
    `:check-strictly="${s.checkStrictly}"`,
    `:show-line="${s.showLine}"`,
    `:show-icon="${s.showIcon}"`,
    `:block-node="${s.blockNode}"`,
    `:selectable="${s.selectable}"`,
    `:multiple="${s.multiple}"`,
    `:draggable="${s.draggable}"`,
    `:disabled="${s.disabled}"`,
    `:animated="${s.animated}"`,
    `color="${s.color}"`,
  ];
  return `<RebornTree\n  ${props.join("\n  ")}\n/>`;
});

/** 事件回显：点选 */
function onPlaySelect(keys: TreeKey[]) {
  lastEvent.value = `select → [${keys.join(", ") || "空"}]`;
}

/** 事件回显：勾选（checkStrictly 下第一个参数是对象） */
function onPlayCheck(keys: TreeCheckedKeys) {
  const list = Array.isArray(keys) ? keys : keys.checked;
  lastEvent.value = `check → [${list.join(", ") || "空"}]`;
}

/** 事件回显：展开/收起 */
function onPlayExpand(_keys: TreeKey[], info: { expanded: boolean; node: TreeDataNode }) {
  lastEvent.value = `expand → ${info.node.title}（${info.expanded ? "展开" : "收起"}）`;
}

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 主题色示例的迷你数据：一父两子，预置一个选中与一个勾选，把各着色面撑出来 */
function makeColorTreeData(): TreeDataNode[] {
  return [
    {
      key: "root",
      title: "工程效能",
      children: [
        { key: "selected", title: "选中态" },
        { key: "checked", title: "勾选态" },
      ],
    },
  ];
}

/** 受控展开：展开集合完全由外部持有 */
const controlledExpandedKeys = ref<TreeKey[]>(["engineering"]);
const controlledTreeData = makeTreeData();
const { getPath } = useTree(() => controlledTreeData, {});

/** 展开全部父节点 */
function expandAll() {
  const keys: TreeKey[] = [];
  const walk = (nodes: TreeDataNode[]) => {
    for (const node of nodes) {
      if (node.children?.length) {
        keys.push(node.key);
        walk(node.children);
      }
    }
  };
  walk(controlledTreeData);
  controlledExpandedKeys.value = keys;
}

/** 展开到「支付网关」：getPath 返回根到目标的实体路径，取路径上的 key 并入展开集合 */
function expandToPayment() {
  const pathKeys = getPath("payment-gateway").map((node) => node.key);
  controlledExpandedKeys.value = [...new Set([...controlledExpandedKeys.value, ...pathKeys])];
}

/** 点选与多选的选中回显 */
const singleSelectedKeys = ref<TreeKey[]>([]);
const multiSelectedKeys = ref<TreeKey[]>([]);

/** 复选：父子联动模式的勾选集合 */
const conductCheckedKeys = ref<TreeKey[]>(["frontend"]);
/** 复选：checkStrictly 严格模式的勾选集合（对象形态） */
const strictCheckedKeys = ref<TreeCheckedKeys>({ checked: ["backend"], halfChecked: [] });

/** 联动示例数据：混入禁用节点与仅禁复选框的节点 */
const checkTreeData: TreeDataNode[] = [
  {
    key: "engineering",
    title: "工程效能",
    children: [
      {
        key: "frontend",
        title: "前端平台",
        children: [
          { key: "design-system", title: "设计系统" },
          { key: "playground", title: "在线演练场（disableCheckbox）", disableCheckbox: true },
        ],
      },
      {
        key: "backend",
        title: "服务端",
        children: [
          { key: "payment-gateway", title: "支付网关" },
          { key: "message-queue", title: "消息队列（disabled）", disabled: true },
        ],
      },
    ],
  },
];

/** 严格模式复选集合的文字回显 */
const strictCheckedText = computed(() => {
  const value = strictCheckedKeys.value;
  return Array.isArray(value) ? value.join(", ") : value.checked.join(", ");
});

/** 自定义标题：筛选关键字 */
const filterKeyword = ref("");

/** 命中筛选关键字的节点标题高亮 */
function filterByKeyword(node: TreeDataNode): boolean {
  const keyword = filterKeyword.value.trim();
  if (!keyword) return false;
  return String(node.title ?? "").includes(keyword);
}

/** 统计子级数量，供 extra 插槽展示 */
function childCount(node: TreeDataNode): number {
  return node.children?.length ?? 0;
}

/** extra 插槽演示：收藏的节点集合 */
const starredKeys = ref(new Set<TreeKey>());

/** 切换收藏；extra 容器自带 click.stop，点星标不会触发点选 */
function toggleStar(key: TreeKey) {
  const next = new Set(starredKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  starredKeys.value = next;
}

// ─── 异步加载 ───────────────────────────────────────────────────

/** 异步树：初始只有两个未加载的父节点，isLeaf 未声明 + 无子级即视为待加载 */
const asyncTreeData = ref<TreeDataNode[]>([
  { key: "region-east", title: "华东节点" },
  { key: "region-south", title: "华南节点" },
]);

/** 在异步树里找到目标节点（loadData 的 Promise 内由使用方自行写回子级） */
function findAsyncNode(list: TreeDataNode[], key: TreeKey): TreeDataNode | null {
  for (const node of list) {
    if (node.key === key) return node;
    const found = node.children ? findAsyncNode(node.children, key) : null;
    if (found) return found;
  }
  return null;
}

/** 模拟接口：600ms 后为目标节点写入两个子级，第二层直接标记 isLeaf 终止加载链 */
function loadChildren(node: TreeDataNode): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const target = findAsyncNode(asyncTreeData.value, node.key);
      if (target) {
        target.children = [
          { key: `${node.key}-a`, title: `${node.title} · 可用区 A`, isLeaf: true },
          { key: `${node.key}-b`, title: `${node.title} · 可用区 B`, isLeaf: true },
        ];
      }
      resolve();
    }, 600);
  });
}

// ─── 拖拽调整结构 ───────────────────────────────────────────────

/** 拖拽树的数据：drop 事件不代改数据，由这里的处理函数落库 */
const dragTreeData = ref<TreeDataNode[]>(makeTreeData());
/** 拖拽树的展开集合：放入内部后要把目标节点展开，让结果立刻可见 */
const dragExpandedKeys = ref<TreeKey[]>(["engineering", "frontend", "backend", "operation"]);

/** 从树里摘除指定 key 的节点并返回它 */
function removeNode(list: TreeDataNode[], key: TreeKey): TreeDataNode | null {
  for (let i = 0; i < list.length; i++) {
    const node = list[i]!;
    if (node.key === key) {
      list.splice(i, 1);
      return node;
    }
    if (node.children) {
      const found = removeNode(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

/** 定位指定 key 所在的兄弟列表与下标 */
function locateNode(
  list: TreeDataNode[],
  key: TreeKey,
): { siblings: TreeDataNode[]; index: number; node: TreeDataNode } | null {
  for (let i = 0; i < list.length; i++) {
    const node = list[i]!;
    if (node.key === key) return { siblings: list, index: i, node };
    if (node.children) {
      const found = locateNode(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

/** drop 事件的落库载荷（组件 drop 事件载荷的子集，够用即可） */
interface DropInfo {
  node: TreeDataNode;
  dragNode: TreeDataNode;
  dropPosition: -1 | 0 | 1;
}

/**
 * 把一次 drop 应用到树数据上：先摘除拖拽源，再按 dropPosition（-1 前 / 0 内 / 1 后）插回。
 * 组件不代改 treeData，不做这一步的话拖完会弹回原状——演练场与拖拽示例共用这份实现
 */
function applyDrop(data: TreeDataNode[], info: DropInfo): TreeDataNode | null {
  const dragged = removeNode(data, info.dragNode.key);
  if (!dragged) return null;
  const target = locateNode(data, info.node.key);
  if (!target) {
    // 目标恰好是拖拽源的后代时已随源一起摘除，放回原层级兜底
    data.push(dragged);
    return null;
  }
  if (info.dropPosition === 0) {
    (target.node.children ??= []).push(dragged);
  } else {
    target.siblings.splice(target.index + (info.dropPosition === 1 ? 1 : 0), 0, dragged);
  }
  return target.node;
}

/** 只允许把节点放进目录（有子级的节点）内部，放到任意节点前后不受限 */
function allowDropIntoFolder(info: { dropNode: TreeDataNode; dropPosition: -1 | 0 | 1 }): boolean {
  if (info.dropPosition !== 0) return true;
  return (info.dropNode.children?.length ?? 0) > 0;
}

/** 拖拽示例的 drop 落库：放入内部后把目标节点展开，让结果立刻可见 */
function handleDrop(info: DropInfo) {
  const intoNode = applyDrop(dragTreeData.value, info);
  if (info.dropPosition === 0 && intoNode && !dragExpandedKeys.value.includes(intoNode.key)) {
    dragExpandedKeys.value = [...dragExpandedKeys.value, intoNode.key];
  }
}

/** 演练场的 drop 落库与事件回显（勾选「可拖拽」后拖动即可看到数据实际移动） */
function onPlayDrop(info: DropInfo) {
  applyDrop(playTreeData.value, info);
  const posText = info.dropPosition === 0 ? "内部" : info.dropPosition === -1 ? "之前" : "之后";
  lastEvent.value = `drop → ${info.dragNode.title} 移到 ${info.node.title} ${posText}`;
}

// ─── 虚拟滚动 ───────────────────────────────────────────────────

/** 生成 50 组 × 20 条共 1050 个节点的大数据树 */
const virtualTreeData: TreeDataNode[] = Array.from({ length: 50 }, (_, group) => ({
  key: `group-${group}`,
  title: `分组 ${group}`,
  children: Array.from({ length: 20 }, (_, item) => ({
    key: `group-${group}-item-${item}`,
    title: `条目 ${group}-${item}`,
  })),
}));

/** 虚拟滚动树的组件实例，用于调用 scrollTo */
const virtualTreeRef = ref<InstanceType<typeof RebornTree> | null>(null);

/** 滚动到第 25 组：autoExpand 先展开其父链（非受控模式下生效），behavior: "smooth" 走 rAF 平滑动画 */
function scrollToGroup25() {
  void virtualTreeRef.value?.scrollTo({
    key: "group-25",
    align: "top",
    autoExpand: true,
    behavior: "smooth",
  });
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="treeCode" component-name="RebornTree"
      title="交互演练场" description="调节左侧参数，实时查看树在勾选、点选、连接线与拖拽等模式下的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <RebornTree
          class="w-full max-w-sm"
          :tree-data="playTreeData"
          :default-expanded-keys="['engineering']"
          :color="state.color"
          :checkable="state.checkable"
          :check-strictly="state.checkStrictly"
          :show-line="state.showLine"
          :show-icon="state.showIcon"
          :block-node="state.blockNode"
          :selectable="state.selectable"
          :multiple="state.multiple"
          :draggable="state.draggable"
          :disabled="state.disabled"
          :animated="state.animated"
          @select="onPlaySelect"
          @check="onPlayCheck"
          @expand="onPlayExpand"
          @drop="onPlayDrop"
        />

        <DemoNote tone="dimmed" class="font-mono text-xs">
          最近事件：{{ lastEvent }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>treeData</code> 一次性传入整棵树（<code>key</code> 在整树范围内必须唯一），
        <code>defaultExpandedKeys</code> 指定初始展开的节点；点击箭头展开，点击标题选中。
      </template>
      <DemoBlock layout="stack">
        <RebornTree
          class="w-full max-w-sm"
          :tree-data="makeTreeData()"
          :default-expanded-keys="['engineering', 'frontend']"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="主题色">
      <template #description>
        <code>color</code> 统一控制选中背景/文字、筛选高亮、复选框与拖拽指示的用色：
        选中填充取色阶 1 档、文字与描边取 6 档（neutral 例外：填充取 2 档避免与页面底色同色，文字取 9 档正文色），默认 primary。
      </template>
      <DemoBlock layout="grid" :columns="4">
        <DemoItem
          v-for="c in treeColors"
          :key="c"
          :label="c"
          mono
        >
          <RebornTree
            :color="c"
            :tree-data="makeColorTreeData()"
            default-expand-all
            checkable
            :default-checked-keys="['checked']"
            :default-selected-keys="['selected']"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="受控展开">
      <template #description>
        <code>v-model:expanded-keys</code> 让展开集合由外部持有；配合 <code>useTree</code> 的
        <code>getPath</code> 可以把任意深层节点的父链一次性并入展开集合。
      </template>
      <DemoBlock layout="stack">
        <div class="flex flex-wrap gap-2">
          <RebornButton size="sm" variant="outlined" @click="expandAll">展开全部</RebornButton>
          <RebornButton size="sm" variant="outlined" color="neutral" @click="controlledExpandedKeys = []">
            全部收起
          </RebornButton>
          <RebornButton size="sm" variant="soft" color="secondary" @click="expandToPayment">
            展开到「支付网关」
          </RebornButton>
        </div>
        <RebornTree
          v-model:expanded-keys="controlledExpandedKeys"
          class="w-full max-w-sm"
          :tree-data="controlledTreeData"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          expandedKeys: [{{ controlledExpandedKeys.join(", ") }}]
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="点选与多选">
      <template #description>
        点击标题切换选中；<code>multiple</code> 让点选累加，<code>blockNode</code>
        让点击区拉满整行（选中背景随之铺满）。再次点击已选节点会取消选中。
        点选只存在于非 <code>checkable</code> 树——复选树的标题点击切换的是勾选。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <DemoItem label="单选（默认）" mono>
          <RebornTree
            v-model:selected-keys="singleSelectedKeys"
            class="w-full"
            :tree-data="makeTreeData()"
            :default-expanded-keys="['engineering']"
          />
          <template #note>selectedKeys: [{{ singleSelectedKeys.join(", ") }}]</template>
        </DemoItem>
        <DemoItem label="multiple + blockNode" mono>
          <RebornTree
            v-model:selected-keys="multiSelectedKeys"
            class="w-full"
            :tree-data="makeTreeData()"
            :default-expanded-keys="['engineering']"
            multiple
            block-node
          />
          <template #note>selectedKeys: [{{ multiSelectedKeys.join(", ") }}]</template>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="复选与父子联动">
      <template #description>
        <code>checkable</code> 在节点前渲染复选框，点击标题等同于点击复选框：默认父子联动（子级全选则父级全选、部分选中则父级半选），
        <code>checkStrictly</code> 切断联动、逐节点独立勾选。禁用节点会阻断联动传导。
      </template>
      <DemoBlock layout="grid" :columns="2">
        <DemoItem label="父子联动（默认）" mono>
          <RebornTree
            v-model:checked-keys="conductCheckedKeys"
            class="w-full"
            :tree-data="checkTreeData"
            checkable
            default-expand-all
          />
          <template #note>checkedKeys: [{{ Array.isArray(conductCheckedKeys) ? conductCheckedKeys.join(", ") : "" }}]</template>
        </DemoItem>
        <DemoItem label="checkStrictly" mono>
          <RebornTree
            v-model:checked-keys="strictCheckedKeys"
            class="w-full"
            :tree-data="checkTreeData"
            checkable
            check-strictly
            default-expand-all
          />
          <template #note>checked: [{{ strictCheckedText }}]</template>
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed" class="mt-4">
        「消息队列」整节点禁用、「在线演练场」仅禁复选框：两者都不参与联动计算，
        所以勾选各自的父级时它们保持原状，父级也不会因为它们未勾选而卡在半选。
      </DemoNote>
    </DemoSection>

    <DemoSection title="连接线与图标">
      <template #description>
        <code>showLine</code> 在缩进列画竖向连接线，展开图标换成加减号且不旋转；对象写法
        <code>showLeafIcon</code> 可替换或关闭叶子图标。<code>showIcon</code> 渲染节点自带的
        <code>icon</code> 字段，无默认样式。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <DemoItem label="showLine" mono>
          <RebornTree
            class="w-full"
            :tree-data="makeTreeData()"
            show-line
            default-expand-all
          />
        </DemoItem>
        <DemoItem label="showLeafIcon 自定义" mono>
          <RebornTree
            class="w-full"
            :tree-data="makeTreeData()"
            :show-line="{ showLeafIcon: 'lucide:file-text' }"
            default-expand-all
          />
        </DemoItem>
        <DemoItem label="showIcon + switcherIcon" mono>
          <RebornTree
            class="w-full"
            :tree-data="makeTreeData()"
            show-icon
            switcher-icon="lucide:circle-chevron-right"
            default-expand-all
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义节点内容与筛选">
      <template #description>
        <code>title</code> 插槽整体接管标题，<code>extra</code> 在标题后渲染徽标或行内操作
        （容器自带 click.stop，点击不会误触点选/勾选，<code>blockNode</code> 下推到行尾）；
        复选框、节点图标、展开图标、拖拽手柄同样开放同名插槽。<code>filterTreeNode</code>
        返回 true 的节点标题高亮，常配合搜索框做「筛选定位」。
      </template>
      <DemoBlock layout="stack">
        <RebornInput
          v-model="filterKeyword"
          class="max-w-sm"
          placeholder="输入关键字高亮命中节点，如「支付」"
        />
        <RebornTree
          class="w-full max-w-sm"
          :tree-data="makeTreeData()"
          :filter-tree-node="filterByKeyword"
          default-expand-all
          block-node
        >
          <template #title="{ node }">{{ node.title }}</template>
          <template #extra="{ node, leaf }">
            <span
              v-if="!leaf"
              class="rounded-full bg-elevated px-1.5 text-xs text-dimmed"
            >
              {{ childCount(node) }}
            </span>
            <button
              class="flex size-5 items-center justify-center rounded-sm text-dimmed hover:bg-elevated hover:text-default"
              @click="toggleStar(node.key)"
            >
              <Icon
                :name="starredKeys.has(node.key) ? 'lucide:star' : 'lucide:star-off'"
                class="size-3.5"
                :class="starredKeys.has(node.key) ? 'text-warning' : ''"
              />
            </button>
          </template>
        </RebornTree>
        <DemoNote tone="dimmed">
          已收藏 {{ starredKeys.size }} 个节点；extra 容器点击不冒泡，点星标不会改变点选状态。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="异步加载">
      <template #description>
        <code>loadData</code> 在展开未加载的父节点时被调用，Promise 内由使用方把子级写回
        <code>treeData</code>；同一节点只请求一次（由 <code>loadedKeys</code> 记账），
        子节点声明 <code>isLeaf: true</code> 即终止加载链。
      </template>
      <DemoBlock layout="stack">
        <RebornTree
          class="w-full max-w-sm"
          :tree-data="asyncTreeData"
          :load-data="loadChildren"
        />
        <DemoNote tone="dimmed">
          展开任一节点可看到 600ms 的加载图标；收起再展开不会重复请求。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="拖拽调整结构">
      <template #description>
        <code>draggable</code> 开启拖拽后，节点前 1/4 高度落在目标之前、后 1/4 落在目标之后、
        中间落入目标内部；<code>allowDrop</code> 拦截非法位置。<code>drop</code> 事件不代改数据，
        需在回调里按 <code>dropPosition</code> 自行调整 <code>treeData</code>。
      </template>
      <DemoBlock layout="stack">
        <RebornTree
          v-model:expanded-keys="dragExpandedKeys"
          class="w-full max-w-sm"
          :tree-data="dragTreeData"
          draggable
          block-node
          :allow-drop="allowDropIntoFolder"
          @drop="handleDrop"
        />
        <DemoNote tone="dimmed">
          本例的 <code>allowDrop</code> 只放行「放进目录内部」，叶子节点内部不亮起指示；
          悬停在收起的目录上约 700ms 会自动展开。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="虚拟滚动">
      <template #description>
        设置 <code>height</code> 后成为定高滚动容器并默认启用虚拟滚动，1000+ 节点也只渲染视口内的行；
        行高由 <code>itemHeight</code>（默认 28px）参与换算，<code>scrollTo</code> 可按 key 定位，
        传 <code>behavior: "smooth"</code> 走 rAF 平滑动画。
      </template>
      <DemoBlock layout="stack">
        <RebornButton size="sm" variant="outlined" class="self-start" @click="scrollToGroup25">
          scrollTo「分组 25」
        </RebornButton>
        <RebornTree
          ref="virtualTreeRef"
          class="w-full max-w-sm"
          :tree-data="virtualTreeData"
          :height="280"
        />
        <DemoNote tone="dimmed">
          共 1050 个节点；滚动条长度随展开集合实时变化，展开越多可滚动区域越长。
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
