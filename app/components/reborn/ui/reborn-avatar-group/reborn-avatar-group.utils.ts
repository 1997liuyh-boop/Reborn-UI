import type { VNode } from 'vue';
import { Comment, Fragment, isVNode, Text } from 'vue';

/** v-for 和 template 会生成片段；逐层展开并去掉注释、空文本才能准确计数。 */
export function flattenAvatarNodes(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (!isVNode(node) || node.type === Comment || node.type === Text) return [];
    if (node.type === Fragment) return flattenAvatarNodes(node.children as VNode[]);
    return [node];
  });
}

/** 头像至少保留一个；小数向下取整，无效值回退到默认的一个。 */
export function normalizeAvatarLimit(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}
