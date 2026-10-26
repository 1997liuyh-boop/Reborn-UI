import type { ComputedRef, InjectionKey, ShallowRef } from 'vue';
import type { CascaderFieldNames, CascaderOption } from './reborn-cascader.config';
import type { CascaderNode, CascaderTree } from './reborn-cascader.tree';
import { computed, onScopeDispose, shallowRef, watch } from 'vue';
import { buildCascaderTree } from './reborn-cascader.tree';

interface TreeProps {
  options: CascaderOption[];
  fieldNames?: CascaderFieldNames;
  valueKey: string;
  loadMore?: (option: CascaderOption, done: (children?: CascaderOption[]) => void) => void;
}
export interface CascaderTreeContext {
  tree: ComputedRef<CascaderTree>;
  loadingKeys: ShallowRef<Set<string>>;
  loadChildren: (node: CascaderNode) => void;
}
export const CASCADER_TREE_KEY: InjectionKey<CascaderTreeContext> = Symbol('RebornCascaderTree');

/**
 * fieldNames 的取值签名。模板里写 `:field-names="{ label: key }"` 时父级每次渲染都会给出新对象，
 * 按引用比较会把懒加载缓存误清掉，所以只比较各字段映射到的名字。
 */
function fieldNamesSignature(fieldNames?: CascaderFieldNames): string {
  if (!fieldNames) return '';
  const record = fieldNames as Record<string, string | undefined>;
  return Object.keys(record).sort().map(key => `${key}=${record[key] ?? ''}`).join('|');
}

/** 包装组件与面板共享树及懒加载缓存，原始 options 始终只读。 */
export function useCascaderState(props: TreeProps): CascaderTreeContext {
  const loadedChildren = shallowRef(new Map<string, CascaderOption[]>());
  const loadingKeys = shallowRef(new Set<string>());
  let generation = 0;
  // 缓存只跟「数据的含义」走：换了 options 数组、改了 valueKey 或 fieldNames 的取值、开关懒加载，才作废缓存与在途请求。
  // loadMore 只比较有无，不比较引用：内联箭头函数每次渲染都是新函数，按引用比较会让刚加载出的下级在父级重渲染后消失。
  watch([
    () => props.options,
    () => props.valueKey,
    () => fieldNamesSignature(props.fieldNames),
    () => !!props.loadMore,
  ], () => {
    generation++;
    loadedChildren.value = new Map();
    loadingKeys.value = new Set();
  }, { flush: 'sync' });
  onScopeDispose(() => { generation++; });
  const tree = computed(() => buildCascaderTree(props.options, {
    fieldNames: props.fieldNames, valueKey: props.valueKey, lazy: !!props.loadMore,
    loadedChildren: loadedChildren.value,
  }));
  function loadChildren(node: CascaderNode) {
    if (!props.loadMore || node.isLeaf || node.children.length || loadingKeys.value.has(node.key)) return;
    const version = generation;
    let settled = false;
    loadingKeys.value = new Set(loadingKeys.value).add(node.key);
    props.loadMore(node.raw, (children) => {
      if (version !== generation || settled) return;
      settled = true;
      loadedChildren.value = new Map(loadedChildren.value).set(node.key, children ?? []);
      const pending = new Set(loadingKeys.value);
      pending.delete(node.key);
      loadingKeys.value = pending;
    });
  }
  return { tree, loadingKeys, loadChildren };
}
