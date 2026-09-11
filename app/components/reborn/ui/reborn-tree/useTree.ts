import type { MaybeRefOrGetter } from "vue";
import type { TreeDataNode, TreeFieldNames, TreeKey } from "./reborn-tree.config";
import { toValue } from "vue";

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
