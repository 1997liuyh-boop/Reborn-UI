import type { MaybeRefOrGetter } from "vue";
import type { TreeDataNode, TreeEntity, TreeFieldNames, TreeKey } from "./reborn-tree.config";
import { toValue } from "vue";

/** 归一化后的字段名（三项都已补齐默认值） */
export interface TreeResolvedFields {
  title: string;
  key: string;
  children: string;
}

/** 实体树：key 索引、根节点列表与按层级分桶的实体 */
export interface TreeEntitiesState {
  map: Map<TreeKey, TreeEntity>;
  roots: TreeEntity[];
  /** 按层级分桶，勾选联动自底向上归并时用 */
  levels: TreeEntity[][];
}

/** 联动结果：勾选集合与半选集合 */
export interface TreeConductResult {
  checked: Set<TreeKey>;
  half: Set<TreeKey>;
}

/**
 * 把 treeData 构建成携带父子引用与层级信息的实体树。
 * Tree 与 TreeSelect 共用，保证两者对「父子联动」的判定基于同一份结构
 */
export function buildTreeEntities(treeData: TreeDataNode[], fields: TreeResolvedFields): TreeEntitiesState {
  const map = new Map<TreeKey, TreeEntity>();
  const roots: TreeEntity[] = [];
  const levels: TreeEntity[][] = [];

  const walk = (
    nodes: TreeDataNode[],
    parent: TreeEntity | null,
    level: number,
    ancestorIsLast: boolean[],
  ) => {
    nodes.forEach((node, index) => {
      const key = node[fields.key] as TreeKey;
      const entity: TreeEntity = {
        key,
        title: String(node[fields.title] ?? ""),
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

      const children = node[fields.children] as TreeDataNode[] | undefined;
      if (Array.isArray(children) && children.length > 0) {
        walk(children, entity, level + 1, [...ancestorIsLast, entity.isLastInLevel]);
      }
    });
  };

  walk(treeData, null, 0, []);
  return { map, roots, levels };
}

/** 收集实体的全部后代 key（不含自身） */
export function descendantKeys(entity: TreeEntity): TreeKey[] {
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
export function ancestorKeys(entity: TreeEntity): TreeKey[] {
  const out: TreeKey[] = [];
  let cur = entity.parent;
  while (cur) {
    out.push(cur.key);
    cur = cur.parent;
  }
  return out;
}

/**
 * 父子联动归一：以给定 key 为种子，向下填满后代、向上归并父级，并推导半选集合。
 * isBlocked 返回 true 的节点阻断传导（由调用方决定哪些节点算禁用）；
 * 树外的未知 key 原样保留在 checked 中，避免异步数据到达前丢值
 */
export function conductCheck(
  seed: Iterable<TreeKey>,
  state: Pick<TreeEntitiesState, "map" | "levels">,
  isBlocked: (entity: TreeEntity) => boolean,
): TreeConductResult {
  const { map, levels } = state;
  const checked = new Set<TreeKey>(seed);
  const half = new Set<TreeKey>();

  // 向下：勾选的节点把所有未被禁用的后代一并勾上（禁用子树整体跳过）。
  // 子级逆序入栈，出栈即先序遍历，补入的 key 保持树中的上下顺序，标签回显不会倒序
  for (const key of [...checked]) {
    const entity = map.get(key);
    if (!entity || isBlocked(entity)) continue;
    const stack = [...entity.children].reverse();
    while (stack.length) {
      const cur = stack.pop()!;
      if (isBlocked(cur)) continue;
      checked.add(cur.key);
      for (let i = cur.children.length - 1; i >= 0; i--) stack.push(cur.children[i]!);
    }
  }

  // 向上：自底向上归并，可勾选子级全选即父级全选，部分选中即父级半选
  for (let level = levels.length - 1; level >= 0; level--) {
    for (const entity of levels[level] ?? []) {
      if (entity.children.length === 0 || isBlocked(entity)) continue;
      const conductable = entity.children.filter((c) => !isBlocked(c));
      if (conductable.length === 0) continue;
      const allChecked = conductable.every((c) => checked.has(c.key));
      const someChecked = conductable.some((c) => checked.has(c.key) || half.has(c.key));
      if (allChecked) checked.add(entity.key);
      else if (someChecked && !checked.has(entity.key)) half.add(entity.key);
    }
  }

  return { checked, half };
}

/**
 * 联动模式下取消勾选一个节点：先摘掉自身、全部后代与祖先，再重新联动归一。
 * 祖先必须摘：它们不再满足「子级全选」；兄弟子树在归一时会自动把各自父链补回来
 */
export function conductUncheck(
  checked: Iterable<TreeKey>,
  entity: TreeEntity,
  state: Pick<TreeEntitiesState, "map" | "levels">,
  isBlocked: (entity: TreeEntity) => boolean,
): TreeConductResult {
  const rest = new Set(checked);
  rest.delete(entity.key);
  descendantKeys(entity).forEach((k) => rest.delete(k));
  ancestorKeys(entity).forEach((k) => rest.delete(k));
  return conductCheck(rest, state, isBlocked);
}

/** useTree 的配置项 */
export interface UseTreeConfig {
  /** 自定义节点字段名映射，与组件的 fieldNames 属性同义 */
  fieldNames?: TreeFieldNames;
}

/** useTree 返回的数据工具集 */
export interface UseTreeReturn {
  /**
   * 返回从根节点到目标节点的实体路径（含目标节点本身），未找到时返回空数组。
   * 常用于受控模式下更新 expandedKeys：把路径上的 key 并入展开集合即可展开到目标节点
   */
  getPath: (key: TreeKey) => TreeDataNode[];
}

/**
 * 树数据工具（对齐 antd 的 Tree.useTree）。
 *
 * getPath 的函数引用保持稳定，并在每次调用时读取最新的 treeData。
 * 若对 getPath 的派生结果做缓存（computed / memo），请把 treeData 与查询 key
 * 一并列入依赖：依赖追踪无法感知 getPath 内部惰性读取的数据。
 */
export function useTree(
  treeData: MaybeRefOrGetter<TreeDataNode[] | undefined>,
  config: UseTreeConfig = {},
): UseTreeReturn {
  const childrenField = config.fieldNames?.children ?? "children";
  const keyField = config.fieldNames?.key ?? "key";

  /** 深度优先查找目标节点，命中后沿递归栈回填路径 */
  function findPath(nodes: TreeDataNode[], key: TreeKey, path: TreeDataNode[]): boolean {
    for (const node of nodes) {
      path.push(node);
      if ((node[keyField] as TreeKey) === key) return true;
      const children = node[childrenField] as TreeDataNode[] | undefined;
      if (Array.isArray(children) && findPath(children, key, path)) return true;
      path.pop();
    }
    return false;
  }

  function getPath(key: TreeKey): TreeDataNode[] {
    const data = toValue(treeData) ?? [];
    const path: TreeDataNode[] = [];
    return findPath(data, key, path) ? path : [];
  }

  return { getPath };
}
