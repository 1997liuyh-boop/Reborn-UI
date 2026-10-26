import type { VNode } from 'vue';
import { Comment, Fragment, isVNode, Text } from 'vue';

/** 展开后的头像节点与它在插槽里的稳定标识 */
export interface AvatarNodeEntry {
  /** 头像节点 */
  node: VNode;
  /** 包装层的 key：按来源加前缀，静态头像、v-if 头像与各个 v-for 列表互不相撞 */
  id: string;
}

/**
 * v-for 和 template 会生成片段；逐层展开并去掉注释、空文本才能准确计数。
 * 标识取「原始位置路径」：注释占位（v-if 为假）与文本也计入下标，v-if 切换时后面的静态头像不会整体漂移。
 * 业务 key 只在所在片段内唯一，所以拼上片段位置；没有 key 的头像用位置路径。
 * 两类标识分别以 `k:` 与 `p:` 开头（嵌套层以片段位置的数字开头），彼此不会相撞。
 */
export function flattenAvatarNodes(nodes: VNode[], prefix = ''): AvatarNodeEntry[] {
  return nodes.flatMap((node, index) => {
    if (!isVNode(node) || node.type === Comment || node.type === Text) return [];
    const pos = `${prefix}${index}`;
    if (node.type === Fragment) return flattenAvatarNodes(node.children as VNode[], `${pos}.`);
    return [{ node, id: node.key != null ? `${prefix}k:${String(node.key)}` : `p:${pos}` }];
  });
}

/** 头像至少保留一个；小数向下取整，无效值回退到默认的一个。 */
export function normalizeAvatarLimit(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}
