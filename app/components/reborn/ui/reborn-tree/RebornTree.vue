<script setup lang="ts">
import type {
  TreeAllowDropInfo,
  TreeCheckedKeys,
  TreeCheckedStrictly,
  TreeColor,
  TreeDataNode,
  TreeDraggableConfig,
  TreeDropPosition,
  TreeEntity,
  TreeFieldNames,
  TreeKey,
  TreeShowLineConfig,
  TreeUI,
} from "./reborn-tree.config";
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { cn } from "~/lib/utils";
import theme from "./reborn-tree.config";

/**
 * 树组件属性接口（对齐 Ant Design Tree，React 专属项做了 Vue 化改造：
 * icon / switcherIcon / titleRender 等 ReactNode 参数改由插槽承担，
 * motion 由布尔 animated 替代——拍平列表下动画是行级过渡而非容器高度过渡）
 */
export interface RebornTreeProps {
  /** treeNodes 数据（key 在整棵树范围内必须唯一） */
  treeData?: TreeDataNode[];
  /** 自定义节点 title、key、children 的字段名 */
  fieldNames?: TreeFieldNames;
  /** 主题色：统一控制选中背景/文字、筛选高亮、复选框与拖拽指示的用色 */
  color?: TreeColor;
  /** 拖拽时是否允许放置到目标位置，返回 false 则该位置不亮起指示并拒绝 drop */
  allowDrop?: (info: TreeAllowDropInfo) => boolean;
  /** expandedKeys 由外部变更时，是否自动补全其父节点的展开态 */
  autoExpandParent?: boolean;
  /** 节点是否占据一行（点击区拉满剩余宽度） */
  blockNode?: boolean;
  /** 节点前是否添加复选框 */
  checkable?: boolean;
  /** checkable 状态下节点勾选完全受控（父子节点选中状态不再关联） */
  checkStrictly?: boolean;
  /** 默认勾选的节点 key（非受控） */
  defaultCheckedKeys?: TreeKey[];
  /** 默认展开所有节点（非受控） */
  defaultExpandAll?: boolean;
  /** 默认展开的节点 key（非受控） */
  defaultExpandedKeys?: TreeKey[];
  /** 初始化时是否自动展开「默认展开节点」的各级父节点 */
  defaultExpandParent?: boolean;
  /** 默认选中的节点 key（非受控） */
  defaultSelectedKeys?: TreeKey[];
  /** 将整棵树禁用 */
  disabled?: boolean;
  /**
   * 设置节点可拖拽：
   * - true / false：整树开关
   * - 函数：按节点判定
   * - 对象：nodeDraggable 按节点判定，icon: false 隐藏拖拽手柄图标
   */
  draggable?: boolean | ((node: TreeDataNode) => boolean) | TreeDraggableConfig;
  /** 按需筛选节点：返回 true 的节点标题高亮 */
  filterTreeNode?: (node: TreeDataNode) => boolean;
  /** 设置虚拟滚动容器高度（像素），设置后内部节点不再支持横向滚动 */
  height?: number;
  /** 虚拟滚动的行高（像素）。Vue 适配新增：拍平定高渲染需要显式行高做滚动换算 */
  itemHeight?: number;
  /** 异步加载数据：返回的 Promise 内应自行把子节点写入 treeData */
  loadData?: (node: TreeDataNode) => Promise<unknown>;
  /** 支持点选多个节点 */
  multiple?: boolean;
  /** 节点是否可被点选 */
  selectable?: boolean;
  /** 是否展示节点图标（图标本身由节点 icon 字段或 icon 插槽给出，无默认样式） */
  showIcon?: boolean;
  /** 是否展示连接线；对象写法可配置叶子图标 showLeafIcon */
  showLine?: boolean | TreeShowLineConfig;
  /** 自定义展开/折叠图标名称（showLine 下不会自动旋转）；复杂内容请改用 switcherIcon 插槽 */
  switcherIcon?: string;
  /** 自定义加载中图标名称 */
  switcherLoadingIcon?: string;
  /** 设为 false 时关闭虚拟滚动（height 仍生效，退化为普通滚动容器） */
  virtual?: boolean;
  /**
   * 展开/收起是否启用行级过渡动画（antd motion 参数的 Vue 化替代）：
   * 新行淡入下滑、下方行 FLIP 位移让位。虚拟滚动生效时强制关闭——
   * 滚动过程中切片不断增删行，过渡会退化成滚动时的闪烁
   */
  animated?: boolean;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写配置 */
  ui?: TreeUI;
}

const props = withDefaults(defineProps<RebornTreeProps>(), {
  treeData: () => [],
  fieldNames: undefined,
  color: "primary",
  allowDrop: undefined,
  autoExpandParent: false,
  blockNode: false,
  checkable: false,
  checkStrictly: false,
  defaultCheckedKeys: () => [],
  defaultExpandAll: false,
  defaultExpandedKeys: () => [],
  defaultExpandParent: true,
  defaultSelectedKeys: () => [],
  disabled: false,
  draggable: false,
  filterTreeNode: undefined,
  height: undefined,
  itemHeight: 28,
  loadData: undefined,
  multiple: false,
  selectable: false,
  showIcon: false,
  showLine: false,
  switcherIcon: undefined,
  switcherLoadingIcon: undefined,
  virtual: true,
  animated: true,
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 勾选复选框时触发；checkStrictly 下第一个参数为 {checked, halfChecked} 对象 */
  (
    e: "check",
    checkedKeys: TreeCheckedKeys,
    info: {
      checked: boolean;
      checkedNodes: TreeDataNode[];
      node: TreeDataNode;
      event: Event;
      halfCheckedKeys: TreeKey[];
    },
  ): void;
  /** 展开/收起节点时触发 */
  (e: "expand", expandedKeys: TreeKey[], info: { expanded: boolean; node: TreeDataNode }): void;
  /** 点选节点时触发 */
  (
    e: "select",
    selectedKeys: TreeKey[],
    info: { selected: boolean; selectedNodes: TreeDataNode[]; node: TreeDataNode; event: MouseEvent },
  ): void;
  /** 节点异步加载完毕时触发 */
  (e: "load", loadedKeys: TreeKey[], info: { node: TreeDataNode }): void;
  /** 双击节点标题时触发 */
  (e: "dblclick", event: MouseEvent, node: TreeDataNode): void;
  /** 右键点击节点标题时触发；需要屏蔽系统菜单请在回调里自行 event.preventDefault() */
  (e: "rightClick", info: { event: MouseEvent; node: TreeDataNode }): void;
  /** 开始拖拽节点时触发 */
  (e: "dragstart", info: { event: DragEvent; node: TreeDataNode }): void;
  /** 拖拽进入某节点时触发 */
  (e: "dragenter", info: { event: DragEvent; node: TreeDataNode; expandedKeys: TreeKey[] }): void;
  /** 拖拽经过某节点时触发 */
  (e: "dragover", info: { event: DragEvent; node: TreeDataNode }): void;
  /** 拖拽离开某节点时触发 */
  (e: "dragleave", info: { event: DragEvent; node: TreeDataNode }): void;
  /** 拖拽结束（无论是否放置成功）时触发 */
  (e: "dragend", info: { event: DragEvent; node: TreeDataNode }): void;
  /**
   * 放置节点时触发。组件不代改 treeData，请在回调里根据
   * dropPosition（-1 前 / 0 内 / 1 后）与 dropToGap 自行调整数据
   */
  (
    e: "drop",
    info: {
      event: DragEvent;
      node: TreeDataNode;
      dragNode: TreeDataNode;
      dragNodesKeys: TreeKey[];
      dropPosition: TreeDropPosition;
      dropToGap: boolean;
    },
  ): void;
}>();

const b = theme;

// --- 字段映射与实体树构建 ---

/** 归一化后的字段名 */
const fields = computed(() => ({
  title: props.fieldNames?.title ?? "title",
  key: props.fieldNames?.key ?? "key",
  children: props.fieldNames?.children ?? "children",
}));

/**
 * 把 treeData 构建成携带父子引用与层级信息的实体树。
 * 展开、勾选联动、拍平渲染都只依赖实体，不再反查原始数据
 */
const entitiesState = computed(() => {
  const map = new Map<TreeKey, TreeEntity>();
  const roots: TreeEntity[] = [];
  /** 按层级分桶，勾选联动自底向上归并时用 */
  const levels: TreeEntity[][] = [];

  const walk = (
    nodes: TreeDataNode[],
    parent: TreeEntity | null,
    level: number,
    ancestorIsLast: boolean[],
  ) => {
    nodes.forEach((node, index) => {
      const key = node[fields.value.key] as TreeKey;
      const entity: TreeEntity = {
        key,
        title: String(node[fields.value.title] ?? ""),
        node,
        parent,
        children: [],
        level,
        isLastInLevel: index === nodes.length - 1,
        ancestorIsLast,
      };
      map.set(key, entity);
      (levels[level] ??= []).push(entity);
      if (parent) parent.children.push(entity);
      else roots.push(entity);

      const children = node[fields.value.children] as TreeDataNode[] | undefined;
      if (Array.isArray(children) && children.length > 0) {
        walk(children, entity, level + 1, [...ancestorIsLast, entity.isLastInLevel]);
      }
    });
  };

  walk(props.treeData, null, 0, []);
  return { map, roots, levels };
});

/** 节点是否整体禁用（树级禁用或节点自带 disabled） */
function isDisabled(entity: TreeEntity): boolean {
  return props.disabled || entity.node.disabled === true;
}

/** 复选框是否禁用（整体禁用之外，disableCheckbox 单独禁复选框） */
function isCheckboxDisabled(entity: TreeEntity): boolean {
  return isDisabled(entity) || entity.node.disableCheckbox === true;
}

/** 勾选联动是否要跳过该节点：禁用节点不参与父子传导 */
function isCheckConductBlocked(entity: TreeEntity): boolean {
  return isCheckboxDisabled(entity);
}

// --- 异步加载状态 ---
// （声明提前到 isLeaf 之前：叶子判定依赖「是否已加载」）

/** （受控）已加载的节点 key，需配合 loadData 使用 */
const loadedKeysModel = defineModel<TreeKey[]>("loadedKeys", { default: undefined });
/** 非受控模式下的已加载集合 */
const innerLoadedKeys = ref<TreeKey[]>([]);
const mergedLoadedKeys = computed(() => loadedKeysModel.value ?? innerLoadedKeys.value);
const loadedSet = computed(() => new Set(mergedLoadedKeys.value));
/** 正在加载中的节点 key，驱动加载图标 */
const loadingKeys = ref(new Set<TreeKey>());

/**
 * 是否叶子节点：
 * 节点显式声明 isLeaf 时以声明为准（false 可强制按父节点渲染）；
 * 配置了 loadData 时，无子级且尚未加载过的节点视为「待加载的父节点」
 */
function isLeaf(entity: TreeEntity): boolean {
  if (entity.node.isLeaf !== undefined) return entity.node.isLeaf;
  if (entity.children.length > 0) return false;
  return props.loadData ? loadedSet.value.has(entity.key) : true;
}

/** 收集实体的全部后代 key（不含自身） */
function descendantKeys(entity: TreeEntity): TreeKey[] {
  const out: TreeKey[] = [];
  const stack = [...entity.children];
  while (stack.length) {
    const cur = stack.pop()!;
    out.push(cur.key);
    stack.push(...cur.children);
  }
  return out;
}

/** 收集实体的全部祖先 key（不含自身） */
function ancestorKeys(entity: TreeEntity): TreeKey[] {
  const out: TreeKey[] = [];
  let cur = entity.parent;
  while (cur) {
    out.push(cur.key);
    cur = cur.parent;
  }
  return out;
}

/** 给一批 key 补全各自的祖先 key */
function withAncestors(keys: TreeKey[]): TreeKey[] {
  const result = new Set(keys);
  for (const key of keys) {
    const entity = entitiesState.value.map.get(key);
    if (entity) ancestorKeys(entity).forEach((k) => result.add(k));
  }
  return [...result];
}

// --- 展开状态 ---

/**
 * （受控）展开的节点 key。
 * 运行时类型是数组，未绑定时必须回落到 undefined 才能判断出非受控，
 * 故显式给 default: undefined，规格上的默认值 [] 由内部状态承担
 */
const expandedKeysModel = defineModel<TreeKey[]>("expandedKeys", { default: undefined });

/** 计算初始展开集合：defaultExpandAll > 模型初值 > defaultExpandedKeys，再按需补全父级 */
function initialExpandedKeys(): TreeKey[] {
  if (props.defaultExpandAll) {
    const all: TreeKey[] = [];
    entitiesState.value.map.forEach((entity) => {
      if (entity.children.length > 0) all.push(entity.key);
    });
    return all;
  }
  const seed = expandedKeysModel.value ?? props.defaultExpandedKeys;
  return props.defaultExpandParent ? withAncestors(seed) : [...seed];
}

/** 非受控模式下的展开集合 */
const innerExpandedKeys = ref<TreeKey[]>(initialExpandedKeys());

/** 实际生效的展开集合：受控值优先 */
const mergedExpandedKeys = computed(() => expandedKeysModel.value ?? innerExpandedKeys.value);
const expandedSet = computed(() => new Set(mergedExpandedKeys.value));

/** 内部写入标记：区分「组件自己更新模型」与「外部变更」，避免 autoExpandParent 把用户刚收起的父级又撑开 */
let internalExpandWrite = false;

/** 统一的展开集合写入口 */
function setExpandedKeys(keys: TreeKey[]) {
  internalExpandWrite = true;
  innerExpandedKeys.value = keys;
  expandedKeysModel.value = keys;
}

/** 外部改动 expandedKeys 且开启 autoExpandParent 时，补全父节点展开态 */
watch(
  () => expandedKeysModel.value,
  (val) => {
    if (internalExpandWrite) {
      internalExpandWrite = false;
      return;
    }
    if (!props.autoExpandParent || !val) return;
    const conducted = withAncestors(val);
    if (conducted.length !== val.length) {
      internalExpandWrite = true;
      expandedKeysModel.value = conducted;
    }
  },
);

/** 切换某节点的展开状态 */
function toggleExpand(entity: TreeEntity) {
  if (isDisabled(entity) || isLeaf(entity)) return;
  const expanded = !expandedSet.value.has(entity.key);
  const keys = expanded
    ? [...mergedExpandedKeys.value, entity.key]
    : mergedExpandedKeys.value.filter((k) => k !== entity.key);
  setExpandedKeys(keys);
  emit("expand", keys, { expanded, node: entity.node });
  if (expanded) void maybeLoadData(entity);
}

// --- 异步加载 ---

/** 展开未加载的父节点时触发异步加载 */
async function maybeLoadData(entity: TreeEntity) {
  if (!props.loadData) return;
  if (
    entity.children.length > 0 ||
    entity.node.isLeaf === true ||
    loadedSet.value.has(entity.key) ||
    loadingKeys.value.has(entity.key)
  ) {
    return;
  }
  loadingKeys.value.add(entity.key);
  try {
    await props.loadData(entity.node);
    const keys = [...mergedLoadedKeys.value, entity.key];
    innerLoadedKeys.value = keys;
    loadedKeysModel.value = keys;
    emit("load", keys, { node: entity.node });
  } finally {
    loadingKeys.value.delete(entity.key);
  }
}

// --- 点选状态 ---

/** （受控）选中的节点 key；default: undefined 的理由同 expandedKeys */
const selectedKeysModel = defineModel<TreeKey[]>("selectedKeys", { default: undefined });
/** 非受控模式下的选中集合 */
const innerSelectedKeys = ref<TreeKey[]>([...props.defaultSelectedKeys]);
const mergedSelectedKeys = computed(() => selectedKeysModel.value ?? innerSelectedKeys.value);
const selectedSet = computed(() => new Set(mergedSelectedKeys.value));

// --- 勾选状态与父子联动 ---

/**
 * （受控）勾选的节点 key。
 * 非 checkStrictly 下传数组即可，父子自动联动补全；
 * checkStrictly 下可传 {checked, halfChecked} 对象，父子不再关联
 */
const checkedKeysModel = defineModel<TreeCheckedKeys>("checkedKeys", { default: undefined });
/** 非受控模式下的勾选集合 */
const innerCheckedKeys = ref<TreeKey[]>([...props.defaultCheckedKeys]);
/** 非受控 + checkStrictly 下独立维护的半选集合 */
const innerHalfCheckedKeys = ref<TreeKey[]>([]);

/**
 * 父子联动归一：以给定 key 为种子，向下填满后代、向上归并父级，
 * 并推导半选集合。禁用节点阻断传导。树外的未知 key 原样保留在 checked 中
 */
function conductCheck(seed: TreeKey[]): { checked: Set<TreeKey>; half: Set<TreeKey> } {
  const { map, levels } = entitiesState.value;
  const checked = new Set<TreeKey>(seed);
  const half = new Set<TreeKey>();

  // 向下：勾选的节点把所有未被禁用的后代一并勾上（禁用子树整体跳过）
  for (const key of seed) {
    const entity = map.get(key);
    if (!entity || isCheckConductBlocked(entity)) continue;
    const stack = [...entity.children];
    while (stack.length) {
      const cur = stack.pop()!;
      if (isCheckConductBlocked(cur)) continue;
      checked.add(cur.key);
      stack.push(...cur.children);
    }
  }

  // 向上：自底向上归并，可勾选子级全选即父级全选，部分选中即父级半选
  for (let level = levels.length - 1; level >= 0; level--) {
    for (const entity of levels[level] ?? []) {
      if (entity.children.length === 0 || isCheckConductBlocked(entity)) continue;
      const conductable = entity.children.filter((c) => !isCheckConductBlocked(c));
      if (conductable.length === 0) continue;
      const allChecked = conductable.every((c) => checked.has(c.key));
      const someChecked = conductable.some((c) => checked.has(c.key) || half.has(c.key));
      if (allChecked) checked.add(entity.key);
      else if (someChecked && !checked.has(entity.key)) half.add(entity.key);
    }
  }

  return { checked, half };
}

/** 实际生效的勾选/半选集合：受控值优先，非 checkStrictly 下总是经过联动归一 */
const mergedChecked = computed<{ checked: Set<TreeKey>; half: Set<TreeKey> }>(() => {
  const model = checkedKeysModel.value;
  let source: TreeKey[];
  let strictHalf: TreeKey[] = [];
  if (model !== undefined) {
    if (Array.isArray(model)) {
      source = model;
    } else {
      source = model.checked;
      strictHalf = model.halfChecked;
    }
  } else {
    source = innerCheckedKeys.value;
    strictHalf = innerHalfCheckedKeys.value;
  }
  if (props.checkStrictly) {
    return { checked: new Set(source), half: new Set(strictHalf) };
  }
  return conductCheck(source);
});

const checkedSet = computed(() => mergedChecked.value.checked);
const halfCheckedSet = computed(() => mergedChecked.value.half);

/** 该节点是否渲染复选框（节点级 checkable: false 仅隐藏复选框，不影响联动计算） */
function showCheckbox(entity: TreeEntity): boolean {
  return props.checkable && entity.node.checkable !== false;
}

/** 勾选/取消勾选一个节点 */
function handleCheck(entity: TreeEntity, targetChecked: boolean, event: Event) {
  const { map } = entitiesState.value;
  let payload: TreeCheckedKeys;
  let checkedList: TreeKey[];
  let halfList: TreeKey[];

  if (props.checkStrictly) {
    // 完全受控：只增删自身，父子互不影响
    const checked = new Set(checkedSet.value);
    const half = new Set(halfCheckedSet.value);
    if (targetChecked) checked.add(entity.key);
    else checked.delete(entity.key);
    half.delete(entity.key);
    checkedList = [...checked];
    halfList = [...half];
    innerCheckedKeys.value = checkedList;
    innerHalfCheckedKeys.value = halfList;
    payload = { checked: checkedList, halfChecked: halfList } satisfies TreeCheckedStrictly;
  } else if (targetChecked) {
    const result = conductCheck([...checkedSet.value, entity.key]);
    checkedList = [...result.checked];
    halfList = [...result.half];
    innerCheckedKeys.value = checkedList;
    payload = checkedList;
  } else {
    // 取消勾选：先摘掉自身、全部后代与祖先，再重新联动归一
    // （祖先必须摘：它们不再满足「子级全选」；兄弟子树在归一时会自动把各自父链补回来）
    const rest = new Set(checkedSet.value);
    rest.delete(entity.key);
    descendantKeys(entity).forEach((k) => rest.delete(k));
    ancestorKeys(entity).forEach((k) => rest.delete(k));
    const result = conductCheck([...rest]);
    checkedList = [...result.checked];
    halfList = [...result.half];
    innerCheckedKeys.value = checkedList;
    payload = checkedList;
  }

  checkedKeysModel.value = payload;
  emit("check", payload, {
    checked: targetChecked,
    checkedNodes: checkedList.map((k) => map.get(k)?.node).filter((n): n is TreeDataNode => !!n),
    node: entity.node,
    event,
    halfCheckedKeys: halfList,
  });
}

/**
 * 点击标题：
 * - checkable 树：等同于点击复选框，直接切换勾选（不再走点选高亮——复选树的
 *   选中语义由复选框承担，再叠一层 selected 背景会出现两套「选中」互相打架）
 * - 普通树：切换选中态（multiple 下累加，多次点击同一节点取消）
 */
function handleContentClick(entity: TreeEntity, event: MouseEvent) {
  if (isDisabled(entity)) return;

  if (props.checkable) {
    // 节点复选框被禁用或被单独隐藏（checkable: false）时点击无效果
    if (showCheckbox(entity) && !isCheckboxDisabled(entity)) {
      handleCheck(entity, !checkedSet.value.has(entity.key), event);
    }
    return;
  }

  if (!props.selectable || entity.node.selectable === false) return;

  const selected = !selectedSet.value.has(entity.key);
  let keys: TreeKey[];
  if (props.multiple) {
    keys = selected
      ? [...mergedSelectedKeys.value, entity.key]
      : mergedSelectedKeys.value.filter((k) => k !== entity.key);
  } else {
    keys = selected ? [entity.key] : [];
  }
  innerSelectedKeys.value = keys;
  selectedKeysModel.value = keys;

  const { map } = entitiesState.value;
  emit("select", keys, {
    selected,
    selectedNodes: keys.map((k) => map.get(k)?.node).filter((n): n is TreeDataNode => !!n),
    node: entity.node,
    event,
  });
}

// --- 筛选高亮 ---

/** filterTreeNode 命中的节点集合 */
const filteredSet = computed(() => {
  const result = new Set<TreeKey>();
  if (!props.filterTreeNode) return result;
  entitiesState.value.map.forEach((entity) => {
    if (props.filterTreeNode!(entity.node)) result.add(entity.key);
  });
  return result;
});

// --- 拍平可见节点与虚拟滚动 ---

/** 按展开状态拍平后的可见节点列表，渲染与虚拟滚动的唯一数据源 */
const flatNodes = computed<TreeEntity[]>(() => {
  const out: TreeEntity[] = [];
  const walk = (list: TreeEntity[]) => {
    for (const entity of list) {
      out.push(entity);
      if (entity.children.length > 0 && expandedSet.value.has(entity.key)) {
        walk(entity.children);
      }
    }
  };
  walk(entitiesState.value.roots);
  return out;
});

/** 是否启用虚拟滚动：必须同时给定容器高度且未显式关闭 */
const useVirtual = computed(() => props.virtual && props.height !== undefined);

/** 列表是否启用行级过渡：虚拟滚动下切片随滚动增删行，过渡会退化成滚动闪烁，强制关闭 */
const listAnimated = computed(() => props.animated && !useVirtual.value);

/** 滚动容器引用 */
const scrollRef = ref<HTMLElement | null>(null);
/** 当前滚动位置，虚拟滚动切片的依据 */
const scrollTop = ref(0);
/** 视口外上下各多渲染的行数，避免快速滚动露白 */
const OVERSCAN = 5;

/** 虚拟滚动的可见切片范围 [start, end) */
const visibleRange = computed<[number, number]>(() => {
  if (!useVirtual.value) return [0, flatNodes.value.length];
  const viewportCount = Math.ceil((props.height ?? 0) / props.itemHeight);
  const start = Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - OVERSCAN);
  const end = Math.min(flatNodes.value.length, start + viewportCount + OVERSCAN * 2);
  return [start, end];
});

/** 实际渲染的节点 */
const renderNodes = computed(() =>
  useVirtual.value
    ? flatNodes.value.slice(visibleRange.value[0], visibleRange.value[1])
    : flatNodes.value,
);

/** 虚拟滚动内容总高度 */
const totalHeight = computed(() => flatNodes.value.length * props.itemHeight);
/** 切片相对内容顶部的位移 */
const offsetY = computed(() => visibleRange.value[0] * props.itemHeight);

function handleScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop;
}

/** 根容器内联样式：给定 height 即成为滚动容器，且按规格关闭横向滚动 */
const rootStyle = computed(() =>
  props.height !== undefined
    ? { height: `${props.height}px`, overflowY: "auto" as const, overflowX: "hidden" as const }
    : undefined,
);

// --- 拖拽 ---

/** 拖拽过程中的瞬时状态 */
const dragState = reactive<{
  /** 拖拽源节点 key，null 表示当前没有拖拽 */
  dragKey: TreeKey | null;
  /** 当前悬停的目标节点 key */
  dropKey: TreeKey | null;
  /** 悬停位置：-1 前 / 0 内 / 1 后 */
  dropPosition: TreeDropPosition;
  /** 当前位置是否允许放置 */
  allowed: boolean;
}>({
  dragKey: null,
  dropKey: null,
  dropPosition: 0,
  allowed: false,
});

/** 拖拽悬停自动展开的延时定时器 */
let dragExpandTimer: ReturnType<typeof setTimeout> | null = null;

function clearDragExpandTimer() {
  if (dragExpandTimer) {
    clearTimeout(dragExpandTimer);
    dragExpandTimer = null;
  }
}

/** 判定某节点是否可拖拽 */
function isNodeDraggable(entity: TreeEntity): boolean {
  if (isDisabled(entity)) return false;
  const d = props.draggable;
  if (!d) return false;
  if (typeof d === "function") return d(entity.node);
  if (typeof d === "object") return d.nodeDraggable ? d.nodeDraggable(entity.node) : true;
  return true;
}

/** 是否渲染拖拽手柄图标（对象写法 icon: false 可隐藏） */
const showDragHandle = computed(() => {
  const d = props.draggable;
  if (!d) return false;
  if (typeof d === "object") return d.icon !== false;
  return true;
});

function handleDragStart(entity: TreeEntity, event: DragEvent) {
  if (!isNodeDraggable(entity)) {
    event.preventDefault();
    return;
  }
  dragState.dragKey = entity.key;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    // Firefox 必须在 dragstart 写入数据才会真正开始拖拽（Chrome 可省略，写上无害）
    event.dataTransfer.setData("text/plain", String(entity.key));
  }
  // 拖拽源若处于展开态，先收起，避免把子级一起拖出视觉歧义
  if (expandedSet.value.has(entity.key)) {
    setExpandedKeys(mergedExpandedKeys.value.filter((k) => k !== entity.key));
  }
  emit("dragstart", { event, node: entity.node });
}

function handleDragEnter(entity: TreeEntity, event: DragEvent) {
  if (dragState.dragKey === null) return;
  // 悬停在收起的父节点上片刻后自动展开，方便放进深层
  clearDragExpandTimer();
  if (!isLeaf(entity) && !expandedSet.value.has(entity.key) && entity.key !== dragState.dragKey) {
    dragExpandTimer = setTimeout(() => {
      setExpandedKeys([...mergedExpandedKeys.value, entity.key]);
      void maybeLoadData(entity);
    }, 700);
  }
  emit("dragenter", { event, node: entity.node, expandedKeys: mergedExpandedKeys.value });
}

function handleDragOver(entity: TreeEntity, event: DragEvent) {
  if (dragState.dragKey === null) return;
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (event.clientY - rect.top) / Math.max(rect.height, 1);
  const dropPosition: TreeDropPosition = ratio < 0.25 ? -1 : ratio > 0.75 ? 1 : 0;

  // 不允许把节点放进自己或自己的后代里
  const dragEntity = entitiesState.value.map.get(dragState.dragKey);
  let allowed = true;
  if (!dragEntity || entity.key === dragEntity.key) {
    allowed = false;
  } else {
    let cur: TreeEntity | null = entity;
    while (cur) {
      if (cur.key === dragEntity.key) {
        allowed = false;
        break;
      }
      cur = cur.parent;
    }
  }
  // 目标节点自身禁用时不可放置
  if (allowed && isDisabled(entity)) allowed = false;
  // 用户自定义放置规则
  if (allowed && props.allowDrop) {
    allowed = props.allowDrop({ dropNode: entity.node, dropPosition });
  }

  dragState.dropKey = entity.key;
  dragState.dropPosition = dropPosition;
  dragState.allowed = allowed;
  if (event.dataTransfer) event.dataTransfer.dropEffect = allowed ? "move" : "none";
  emit("dragover", { event, node: entity.node });
}

function handleDragLeave(entity: TreeEntity, event: DragEvent) {
  emit("dragleave", { event, node: entity.node });
}

function handleDrop(entity: TreeEntity, event: DragEvent) {
  clearDragExpandTimer();
  const dragEntity = dragState.dragKey !== null ? entitiesState.value.map.get(dragState.dragKey) : null;
  const allowed = dragState.allowed && dragState.dropKey === entity.key;
  const dropPosition = dragState.dropPosition;
  resetDragState();
  if (!dragEntity || !allowed) return;
  emit("drop", {
    event,
    node: entity.node,
    dragNode: dragEntity.node,
    dragNodesKeys: [dragEntity.key, ...descendantKeys(dragEntity)],
    dropPosition,
    dropToGap: dropPosition !== 0,
  });
}

function handleDragEnd(entity: TreeEntity, event: DragEvent) {
  clearDragExpandTimer();
  resetDragState();
  emit("dragend", { event, node: entity.node });
}

function resetDragState() {
  dragState.dragKey = null;
  dragState.dropKey = null;
  dragState.dropPosition = 0;
  dragState.allowed = false;
}

/** 放置指示线的内联定位：左端对齐目标节点的内容起点，上下沿由 dropPosition 决定 */
function dropIndicatorStyle(entity: TreeEntity) {
  return {
    left: `${entity.level * 24 + 24}px`,
    top: dragState.dropPosition === -1 ? "-1px" : undefined,
    bottom: dragState.dropPosition === 1 ? "-1px" : undefined,
  };
}

/** 该节点当前是否要渲染放置指示线（内部放置走 dropInside 变体，不画线） */
function showDropIndicator(entity: TreeEntity): boolean {
  return (
    dragState.dropKey === entity.key && dragState.allowed && dragState.dropPosition !== 0
  );
}

/** 该节点当前是否处于「放入内部」的悬停高亮 */
function isDropInside(entity: TreeEntity): boolean {
  return dragState.dropKey === entity.key && dragState.allowed && dragState.dropPosition === 0;
}

onBeforeUnmount(() => {
  clearDragExpandTimer();
  cancelScrollAnimation();
});

// --- 连接线与图标 ---

/** 是否展示连接线 */
const hasLine = computed(() => !!props.showLine);

/** 叶子节点图标名称：仅 showLine 下渲染；false 不渲染、字符串自定义、其余用默认文件图标 */
const leafIconName = computed<string | null>(() => {
  if (!props.showLine) return null;
  const config = typeof props.showLine === "object" ? props.showLine.showLeafIcon : true;
  if (config === false) return null;
  return typeof config === "string" ? config : "lucide:file";
});

/** 父节点的展开/折叠图标名称 */
function switcherIconName(entity: TreeEntity): string {
  if (props.switcherIcon) return props.switcherIcon;
  if (hasLine.value) {
    return expandedSet.value.has(entity.key) ? "lucide:square-minus" : "lucide:square-plus";
  }
  return "lucide:chevron-right";
}

// --- 样式计算 ---

/** 用户传入的 UI 覆盖配置 */
const overrides = computed<TreeUI>(() => props.ui || {});

/** 各语义化结构的样式生成函数集合 */
const ui = computed(() => {
  const styles = b({ blockNode: props.blockNode, showLine: hasLine.value, color: props.color });
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, overrides.value.root) }),
    list: (opts?: { class?: any }) => styles.list({ class: cn(opts?.class, overrides.value.list) }),
    node: (opts?: { class?: any; dragging?: boolean }) =>
      styles.node({ dragging: opts?.dragging, class: cn(opts?.class, overrides.value.node) }),
    indentUnit: (opts?: { class?: any; lineEnd?: boolean }) =>
      styles.indentUnit({ lineEnd: opts?.lineEnd, class: cn(opts?.class, overrides.value.indentUnit) }),
    switcher: (opts?: { class?: any; disabled?: boolean; leaf?: boolean }) =>
      styles.switcher({
        disabled: opts?.disabled,
        leaf: opts?.leaf,
        class: cn(opts?.class, overrides.value.switcher),
      }),
    switcherIcon: (opts?: { class?: any; expanded?: boolean }) =>
      styles.switcherIcon({
        expanded: opts?.expanded,
        class: cn(opts?.class, overrides.value.switcherIcon),
      }),
    dragHandle: (opts?: { class?: any; disabled?: boolean }) =>
      styles.dragHandle({ disabled: opts?.disabled, class: cn(opts?.class, overrides.value.dragHandle) }),
    checkbox: (opts?: { class?: any }) =>
      styles.checkbox({ class: cn(opts?.class, overrides.value.checkbox) }),
    iconEle: (opts?: { class?: any }) =>
      styles.iconEle({ class: cn(opts?.class, overrides.value.iconEle) }),
    content: (opts?: { class?: any; selected?: boolean; disabled?: boolean; dropInside?: boolean }) =>
      styles.content({
        selected: opts?.selected,
        disabled: opts?.disabled,
        dropInside: opts?.dropInside,
        class: cn(opts?.class, overrides.value.content),
      }),
    title: (opts?: { class?: any; filtered?: boolean }) =>
      styles.title({ filtered: opts?.filtered, class: cn(opts?.class, overrides.value.title) }),
    extra: (opts?: { class?: any }) =>
      styles.extra({ class: cn(opts?.class, overrides.value.extra) }),
    dropIndicator: (opts?: { class?: any }) =>
      styles.dropIndicator({ class: cn(opts?.class, overrides.value.dropIndicator) }),
  };
});

// --- 实例方法 ---

/** scrollTo 的入参 */
export interface TreeScrollToOptions {
  /** 目标节点 key */
  key: TreeKey;
  /** 对齐方式：top 顶部对齐 / bottom 底部对齐 / auto 仅在视口外时滚动 */
  align?: "top" | "bottom" | "auto";
  /** 在对齐位置基础上的额外偏移（像素） */
  offset?: number;
  /** 非受控模式下是否先自动展开目标节点的各级父节点 */
  autoExpand?: boolean;
  /**
   * 滚动行为：auto 即时跳转（默认）/ smooth 平滑动画。
   * 动画由 rAF 自行驱动而非原生 smooth——部分环境会把原生 smooth 静默丢弃；
   * 系统开启「减少动态效果」时自动退回即时跳转
   */
  behavior?: "auto" | "smooth";
}

/** 平滑滚动的 rAF 句柄；新一次滚动或组件卸载时取消，避免两段动画抢同一个 scrollTop */
let scrollAnimationFrame: number | null = null;

function cancelScrollAnimation() {
  if (scrollAnimationFrame !== null) {
    cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }
}

/**
 * 用 rAF 把容器滚到目标位置。
 * 每帧同步 scrollTop 状态，虚拟滚动的切片会随动画逐帧更新，不会露白等到动画结束才重排
 */
function animateScrollTop(container: HTMLElement, target: number) {
  cancelScrollAnimation();
  const from = container.scrollTop;
  const distance = target - from;
  if (distance === 0) return;
  // 时长随距离在 150~400ms 之间取值：短距离不拖沓，长距离不瞬移
  const duration = Math.min(400, Math.max(150, Math.abs(distance) * 0.25));
  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    // easeOutCubic：先快后慢，落点前减速便于视线锁定目标行
    const eased = 1 - (1 - progress) ** 3;
    container.scrollTop = from + distance * eased;
    scrollTop.value = container.scrollTop;
    scrollAnimationFrame = progress < 1 ? requestAnimationFrame(step) : null;
  };
  scrollAnimationFrame = requestAnimationFrame(step);
}

/** 滚动到指定 key 的节点（虚拟滚动按行高换算，普通模式回退 scrollIntoView） */
async function scrollTo(options: TreeScrollToOptions) {
  const { key, align = "auto", offset = 0, autoExpand = false, behavior = "auto" } = options;
  const entity = entitiesState.value.map.get(key);
  if (!entity) return;

  // 系统偏好「减少动态效果」时强制即时跳转，不做动画
  const smooth =
    behavior === "smooth" &&
    !(typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  // 仅非受控模式代为展开：受控模式下 expandedKeys 归外部所有，不越权改写
  if (autoExpand && expandedKeysModel.value === undefined) {
    innerExpandedKeys.value = [...new Set([...innerExpandedKeys.value, ...ancestorKeys(entity)])];
    await nextTick();
  }

  const index = flatNodes.value.findIndex((e) => e.key === key);
  if (index < 0) return;

  const container = scrollRef.value;
  if (!container || props.height === undefined) {
    // 无滚动容器：退化为浏览器原生滚动定位。
    // 这里只能交给原生 smooth——滚动发生在页面级祖先上，rAF 动画无从接管；
    // 原生 smooth 被环境丢弃时表现为即时跳转，定位本身不受影响
    container
      ?.querySelector(`[data-key="${CSS.escape(String(key))}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
    return;
  }

  const itemTop = index * props.itemHeight;
  const viewTop = container.scrollTop;
  const viewBottom = viewTop + props.height - props.itemHeight;

  let target: number | null = null;
  if (align === "top") {
    target = itemTop - offset;
  } else if (align === "bottom") {
    target = itemTop - props.height + props.itemHeight + offset;
  } else if (itemTop < viewTop) {
    target = itemTop - offset;
  } else if (itemTop > viewBottom) {
    target = itemTop - props.height + props.itemHeight + offset;
  }
  if (target !== null) {
    // 上限截到最大可滚动距离：目标在列表末尾时避免把动画终点定在滚不到的位置
    const top = Math.min(
      Math.max(0, target),
      Math.max(0, container.scrollHeight - container.clientHeight),
    );
    if (smooth) {
      animateScrollTop(container, top);
    } else {
      cancelScrollAnimation();
      container.scrollTop = top;
      scrollTop.value = top;
    }
  }
}

defineExpose({
  /** 滚动到指定 key 的节点 */
  scrollTo,
});
</script>

<template>
  <div
    ref="scrollRef" :class="ui.root({ class: props.class })" :style="rootStyle" role="tree"
    :aria-multiselectable="props.multiple || undefined" @scroll.passive="useVirtual && handleScroll($event)"
    @wheel.passive="cancelScrollAnimation" @touchmove.passive="cancelScrollAnimation"
  >
    <!-- 虚拟滚动时由占位层撑出总高度，列表整体位移到切片起点 -->
    <div :style="useVirtual ? { height: `${totalHeight}px`, position: 'relative' } : undefined">
      <!-- 展开/收起的行级过渡由 TransitionGroup 承担：新行走 enter、消失行走 leave、
           existing 行靠 FLIP 的 move 类平滑让位；动画关闭时切到无 CSS 的过渡名等于即时增删 -->
      <TransitionGroup
        tag="ul" :name="listAnimated ? 'reborn-tree' : 'reborn-tree-none'" :class="ui.list()"
        :style="useVirtual ? { transform: `translateY(${offsetY}px)` } : undefined" role="group"
      >
        <li
          v-for="entity in renderNodes" :key="entity.key"
          :class="ui.node({ dragging: dragState.dragKey === entity.key })"
          :style="useVirtual ? { height: `${props.itemHeight}px` } : undefined" :data-key="String(entity.key)"
          role="treeitem" :aria-expanded="isLeaf(entity) ? undefined : expandedSet.has(entity.key)"
          :aria-selected="selectedSet.has(entity.key)" :aria-disabled="isDisabled(entity) || undefined"
          :draggable="isNodeDraggable(entity) || undefined" @dragstart="handleDragStart(entity, $event)"
          @dragenter.prevent="handleDragEnter(entity, $event)" @dragover.prevent="handleDragOver(entity, $event)"
          @dragleave="handleDragLeave(entity, $event)" @drop.prevent="handleDrop(entity, $event)"
          @dragend="handleDragEnd(entity, $event)"
        >
          <!-- 缩进列：每层 24px；showLine 下画竖线，祖先已是同级末位的层不再画 -->
          <span
            v-for="depth in entity.level" :key="depth"
            :class="ui.indentUnit({ lineEnd: entity.ancestorIsLast[depth - 1] })"
          />

          <!-- 展开/折叠开关：叶子节点占位保持对齐，showLine 下叶子渲染 leaf 图标 -->
          <span
            :class="ui.switcher({ disabled: isDisabled(entity), leaf: isLeaf(entity) })"
            @click="toggleExpand(entity)"
          >
            <!-- switcherIcon 插槽整体替换展开/折叠图标；叶子（含 showLine 的 leaf 图标）与加载态由作用域的 leaf / loading 区分 -->
            <slot
              name="switcherIcon" :node="entity.node" :expanded="expandedSet.has(entity.key)"
              :loading="loadingKeys.has(entity.key)" :leaf="isLeaf(entity)"
            >
              <template v-if="isLeaf(entity)">
                <Icon v-if="leafIconName" :name="leafIconName" class="size-4 text-gray-5" />
              </template>
              <template v-else>
                <Icon
                  v-if="loadingKeys.has(entity.key)" :name="props.switcherLoadingIcon ?? 'lucide:loader-circle'"
                  class="animate-spin" :class="ui.switcherIcon()"
                />
                <Icon
                  v-else :name="switcherIconName(entity)"
                  :class="ui.switcherIcon({ expanded: expandedSet.has(entity.key) })"
                />
              </template>
            </slot>
          </span>

          <!-- 拖拽手柄：排在 switcher 占位列之后、紧贴内容区，避免叶子的空占位把手柄和标题隔开一大截 -->
          <span
            v-if="showDragHandle && isNodeDraggable(entity)"
            :class="ui.dragHandle({ disabled: isDisabled(entity) })"
          >
            <!-- dragHandle 插槽替换拖拽手柄图标 -->
            <slot name="dragHandle" :node="entity.node" :disabled="isDisabled(entity)">
              <Icon name="lucide:grip-vertical" class="size-3.5" />
            </slot>
          </span>

          <!-- 复选框：受控展示勾选与半选，禁用与联动逻辑由组件维护 -->
          <span v-if="showCheckbox(entity)" :class="ui.checkbox()">
            <!-- checkbox 插槽整体替换复选框；自定义控件在点击时调用作用域的 toggle 即可接入勾选联动 -->
            <slot
              name="checkbox" :node="entity.node" :checked="checkedSet.has(entity.key)"
              :half-checked="halfCheckedSet.has(entity.key)" :disabled="isCheckboxDisabled(entity)"
              :toggle="(ev: Event) => handleCheck(entity, !checkedSet.has(entity.key), ev)"
            >
              <RebornCheckbox
                size="sm" :color="props.color" :model-value="checkedSet.has(entity.key)"
                :indeterminate="halfCheckedSet.has(entity.key)" :disabled="isCheckboxDisabled(entity)"
                @change="(_val: unknown, ev: Event) => handleCheck(entity, !checkedSet.has(entity.key), ev)"
              />
            </slot>
          </span>

          <!-- 标题点击区：选中、双击、右键都落在这里 -->
          <span
            :class="ui.content({
              selected: selectedSet.has(entity.key),
              disabled: isDisabled(entity),
              dropInside: isDropInside(entity),
            })
            " @click="handleContentClick(entity, $event)" @dblclick="emit('dblclick', $event, entity.node)"
            @contextmenu="emit('rightClick', { event: $event, node: entity.node })"
          >
            <!-- 节点图标：无图标时不占位，条件插槽返回空内容时同样收起 -->
            <span v-if="props.showIcon && (entity.node.icon || $slots.icon)" :class="cn(ui.iconEle(), 'empty:hidden')">
              <slot
                name="icon" :node="entity.node" :expanded="expandedSet.has(entity.key)"
                :selected="selectedSet.has(entity.key)" :leaf="isLeaf(entity)"
              >
                <Icon v-if="entity.node.icon" :name="entity.node.icon" class="size-4" />
              </slot>
            </span>

            <span :class="ui.title({ filtered: filteredSet.has(entity.key) })">
              <!-- title 插槽等价于 antd 的 titleRender，自定义整个标题内容 -->
              <slot
                name="title" :node="entity.node" :selected="selectedSet.has(entity.key)"
                :expanded="expandedSet.has(entity.key)"
              >
                {{ entity.title }}
              </slot>
            </span>

            <!-- extra 插槽：标题后的附加内容（徽标、行内操作等）。
                 点击不冒泡，避免行内按钮误触点选/勾选；blockNode 下由 ml-auto 推到行尾 -->
            <span v-if="$slots.extra" :class="ui.extra()" @click.stop>
              <slot
                name="extra" :node="entity.node" :selected="selectedSet.has(entity.key)"
                :expanded="expandedSet.has(entity.key)" :leaf="isLeaf(entity)"
              />
            </span>
          </span>

          <!-- 放置指示线：仅节点前/后两个间隙位置渲染，放入内部走 content 的描边高亮 -->
          <span v-if="showDropIndicator(entity)" :class="ui.dropIndicator()" :style="dropIndicatorStyle(entity)" />
        </li>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
/* 展开/收起的行级过渡：新行淡入下滑，下方行由 move 类做 FLIP 位移让位 */
.reborn-tree-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.reborn-tree-move {
  transition: transform 200ms ease;
}

/* 离场行脱离文档流，让下方行的位移立即开始；绝对定位会让宽度收缩，需锁回整行宽 */
.reborn-tree-leave-active {
  position: absolute;
  width: 100%;
  transition: opacity 150ms ease;
}

.reborn-tree-enter-from,
.reborn-tree-leave-to {
  opacity: 0;
}

.reborn-tree-enter-from {
  transform: translateY(-6px);
}

/* 系统开启「减少动态效果」时整组过渡归零 */
@media (prefers-reduced-motion: reduce) {
  .reborn-tree-enter-active,
  .reborn-tree-leave-active,
  .reborn-tree-move {
    transition: none;
  }
}
</style>
