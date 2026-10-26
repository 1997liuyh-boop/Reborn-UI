import type { ComponentInternalInstance } from 'vue'
import { getCurrentInstance, onBeforeUpdate, onScopeDispose, onUpdated, shallowRef } from 'vue'
// #ifdef MP
import * as VueRuntime from 'vue'
// #endif

// 小程序的原始属性缓存在父级渲染时生成，原生 uP observer 不会更新 vnode.props。
interface MpInstance extends ComponentInternalInstance {
  ctx: { $scope?: { properties?: { uP?: string }; props?: { uP?: string } } }
  u?: Array<() => void>
}

// #ifdef MP
const updates = new WeakMap<ComponentInternalInstance, { subscribers: Set<() => void>; hook: () => void }>()

function subscribe(owner: MpInstance, refresh: () => void) {
  let entry = updates.get(owner)
  if (!entry) {
    const subscribers = new Set<() => void>()
    // 实例 $nextTick 等待该祖先原生 setData 完成；导入的 nextTick 只等待 Vue 队列。
    const register = onUpdated as (hook: () => void, target: ComponentInternalInstance) => () => void
    const hook = register(() => owner.proxy?.$nextTick(() => subscribers.forEach(sync => sync())), owner)
    entry = { subscribers, hook }
    updates.set(owner, entry)
  }
  entry.subscribers.add(refresh)
  onScopeDispose(() => {
    entry.subscribers.delete(refresh)
    if (entry.subscribers.size) return
    // uni-mp-vue 3.4 的生命周期注册返回包装函数；最后一项卸载时同步解除父级钩子。
    const index = owner.u?.indexOf(entry.hook) ?? -1
    if (index >= 0) owner.u?.splice(index, 1)
    updates.delete(owner)
  })
}
// #endif

const hasOwnProperty = Object.prototype.hasOwnProperty

/** 统一读取调用方原始属性，区分缺省、显式 undefined 与组件默认值。 */
export function useRawProp(name: string) {
  const instance = getCurrentInstance() as MpInstance | null
  const hyphenated = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  const present = shallowRef(false)
  const value = shallowRef<unknown>()
  function refresh() {
    let raw = instance?.vnode.props ?? {}
    // #ifdef MP
    const scope = instance?.ctx.$scope
    const runtime = VueRuntime as unknown as { findComponentPropsData?: (token?: string) => Record<string, unknown> | undefined }
    if (scope && runtime.findComponentPropsData) {
      raw = runtime.findComponentPropsData((scope.properties ?? scope.props)?.uP) ?? {}
    }
    // #endif
    // 不用 ES2022 的 Object.hasOwn：iOS 15.4 以下的小程序 / WebView 没有该方法
    const key = hasOwnProperty.call(raw, name) ? name : hyphenated
    present.value = hasOwnProperty.call(raw, key)
    value.value = raw[key]
  }
  refresh()
  if (instance) {
    onBeforeUpdate(refresh)
    // #ifdef MP
    // 插槽可由任一祖先拥有；解析后的值未变时也要等待原生 setData 后刷新。
    if (instance.ctx.$scope) {
      for (let owner = instance.parent; owner; owner = owner.parent) subscribe(owner as MpInstance, refresh)
    }
    // #endif
  }
  return { present, value, refresh }
}
