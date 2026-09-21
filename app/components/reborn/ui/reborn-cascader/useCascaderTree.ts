import type {
  CascaderFieldNames,
  CascaderOption,
  CascaderOptionValue,
} from "./reborn-cascader.config";

/**
 * 路径 key 的分隔符。用不可打印字符，业务值里几乎不可能出现，
 * 从而保证「省 / 市 / 区」拼出来的 key 不会与某个真实值撞车。
 */
export const CASCADER_KEY_SEP = "";

/** field-names 未覆盖到的字段一律回落到这套默认名 */
const DEFAULT_FIELDS: Required<CascaderFieldNames> = {
  value: "value",
  label: "label",
  children: "children",
  disabled: "disabled",
  isLeaf: "isLeaf",
  tagProps: "tagProps",
  render: "render",
};

/** 规范化后的级联节点，组件内部只与它打交道，不再直接读原始 option */
export interface CascaderNode {
  /** 整棵树内唯一：由根到自身各级值的同一性串联而成 */
  key: string;
  /** 原始选项对象，插槽与 format-label 回传的就是它 */
  raw: CascaderOption;
  /** 选项值，可能是对象 */
  value: CascaderOptionValue;
  /** 选项文本 */
  label: string;
  /** 层级，根为 0 */
  level: number;
  /** 父节点，根节点为 null */
  parent: CascaderNode | null;
  /** 子节点，懒加载未展开时为空数组 */
  children: CascaderNode[];
  /** 是否禁用。父级禁用会向下继承：父级展不开，子级也就点不到 */
  disabled: boolean;
  /** 是否为叶子节点。开启懒加载后，没有子节点也不算叶子，除非显式标了 isLeaf */
  isLeaf: boolean;
  /** 根到自身的节点链，含自身 */
  path: CascaderNode[];
  /** 根到自身的值数组，即 path-mode 下的绑定值 */
  pathValue: CascaderOptionValue[];
  /** 根到自身的文本数组，拼接后即触发器上的展示文本 */
  pathLabel: string[];
  /** 子树下全部叶子的 key；自身即叶子时为自身 key */
  leafKeys: string[];
  /** 子树下未禁用的叶子 key，勾选联动只写这一批 */
  enabledLeafKeys: string[];
  /** 该选项在多选标签上的附加属性 */
  tagProps?: Record<string, any>;
  /** 自定义渲染函数 */
  render?: () => any;
}

/** 规范化后的整棵树，附带两张索引表 */
export interface CascaderTree {
  /** 第一列的节点 */
  roots: CascaderNode[];
  /** 路径 key → 节点，供 path-mode 回填 */
  nodeMap: Map<string, CascaderNode>;
  /** 值的同一性 → 节点（同值取先出现的那个），供值模式回填 */
  valueMap: Map<string, CascaderNode>;
  /** 深度优先展开的全部节点，搜索与全量遍历用 */
  flat: CascaderNode[];
}

/**
 * 值的同一性。对象值取 value-key 指定的属性，其余值带上类型前缀，
 * 避免数字 1 与字符串 "1" 被当成同一个选项（两者本就该匹配不上，交给 fallback 兜底）。
 */
export function identityOf(value: unknown, valueKey: string): string {
  if (value && typeof value === "object") {
    return `o:${String((value as Record<string, any>)[valueKey])}`;
  }
  return `${typeof value}:${String(value)}`;
}

/** 把一条绑定值（值模式为单值，路径模式为值数组）折算成可比对的 key */
export function valueToKey(
  value: CascaderOptionValue | CascaderOptionValue[],
  pathMode: boolean,
  valueKey: string,
): string {
  if (!pathMode) return identityOf(value, valueKey);
  const list = Array.isArray(value) ? value : [value];
  return list.map((item) => identityOf(item, valueKey)).join(CASCADER_KEY_SEP);
}

/**
 * 把 options 规范化成节点树。
 * 每次 options / field-names / value-key 变化都会整棵重建：
 * 节点上缓存了路径、叶子集合等派生数据，增量更新的收益远不抵维护成本。
 */
export function buildCascaderTree(
  options: CascaderOption[],
  config: { fieldNames?: CascaderFieldNames; valueKey: string; lazy: boolean },
): CascaderTree {
  const fields = { ...DEFAULT_FIELDS, ...(config.fieldNames || {}) };
  const nodeMap = new Map<string, CascaderNode>();
  const valueMap = new Map<string, CascaderNode>();
  const flat: CascaderNode[] = [];

  function walk(list: CascaderOption[], parent: CascaderNode | null): CascaderNode[] {
    if (!Array.isArray(list)) return [];

    return list.map((raw) => {
      const value = raw[fields.value] as CascaderOptionValue;
      const identity = identityOf(value, config.valueKey);
      const node: CascaderNode = {
        key: parent ? parent.key + CASCADER_KEY_SEP + identity : identity,
        raw,
        value,
        label: String(raw[fields.label] ?? ""),
        level: parent ? parent.level + 1 : 0,
        parent,
        children: [],
        disabled: !!raw[fields.disabled] || !!parent?.disabled,
        isLeaf: true,
        path: [],
        pathValue: [],
        pathLabel: [],
        leafKeys: [],
        enabledLeafKeys: [],
        tagProps: raw[fields.tagProps],
        render: raw[fields.render],
      };

      // 路径在下钻之前就能定稿：父节点的 path 此刻已经完整
      node.path = parent ? [...parent.path, node] : [node];
      node.pathValue = node.path.map((item) => item.value);
      node.pathLabel = node.path.map((item) => item.label);

      // 先登记再下钻：三张表都按「先序」排列，值模式下同值取到的是层级最浅的那个节点，
      // 搜索结果与多选标签的顺序也与用户在面板上从上往下读到的顺序一致。
      nodeMap.set(node.key, node);
      if (!valueMap.has(identity)) valueMap.set(identity, node);
      flat.push(node);

      node.children = walk(raw[fields.children] as CascaderOption[], node);
      // 懒加载下「没有子节点」不等于叶子：子节点可能还没请求回来，
      // 此时只认显式的 isLeaf 标记，否则节点会失去展开能力。
      node.isLeaf =
        raw[fields.isLeaf] === true || (node.children.length === 0 && !config.lazy);

      if (node.children.length === 0) {
        // 懒加载未展开的节点同样按叶子记账：勾选状态总得有个落点，
        // 等子节点加载回来后，父节点的状态改由子节点推导，这条记录自然失效。
        node.leafKeys = [node.key];
        node.enabledLeafKeys = node.disabled ? [] : [node.key];
      } else {
        for (const child of node.children) {
          node.leafKeys.push(...child.leafKeys);
          node.enabledLeafKeys.push(...child.enabledLeafKeys);
        }
      }

      return node;
    });
  }

  const roots = walk(options, null);
  return { roots, nodeMap, valueMap, flat };
}

/** 按绑定值回查节点：路径模式比对整条路径，值模式只比对单值 */
export function findNodeByValue(
  tree: CascaderTree,
  value: CascaderOptionValue | CascaderOptionValue[],
  pathMode: boolean,
  valueKey: string,
): CascaderNode | undefined {
  if (pathMode) return tree.nodeMap.get(valueToKey(value, true, valueKey));
  return tree.valueMap.get(identityOf(value, valueKey));
}

/** 把节点折算成对外的绑定值 */
export function nodeToValue(
  node: CascaderNode,
  pathMode: boolean,
): CascaderOptionValue | CascaderOptionValue[] {
  return pathMode ? [...node.pathValue] : node.value;
}

/**
 * 关联模式下节点的勾选状态。
 * 全部叶子都在集合里才算选中，只要有一部分就是半选；
 * 判定用的是全部叶子而非仅未禁用的叶子：子树里躺着一个禁用且未选的叶子时，
 * 父节点本就不该显示成「全选」，半选才是实情。
 */
export function getCheckState(
  node: CascaderNode,
  checkedKeys: Set<string>,
): { checked: boolean; indeterminate: boolean } {
  if (node.leafKeys.length === 0) return { checked: false, indeterminate: false };

  let hit = 0;
  for (const key of node.leafKeys) {
    if (checkedKeys.has(key)) hit += 1;
  }

  if (hit === 0) return { checked: false, indeterminate: false };
  if (hit === node.leafKeys.length) return { checked: true, indeterminate: false };
  return { checked: false, indeterminate: true };
}
