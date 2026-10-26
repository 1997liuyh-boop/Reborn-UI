import { computed, getCurrentInstance, shallowRef } from 'vue'
import { useRawProp } from './useRawProp'

/** defineModel 声明模型；此处统一缺省、本地交互及动态父级接管，不写入 useModel 的本地缓存。 */
export function useBooleanModel(name: string, initial = false) {
  const instance = getCurrentInstance()!
  const { present: controlled, refresh } = useRawProp(name)
  const local = shallowRef(initial)
  return computed({
    get: () => controlled.value ? !!instance.props[name] : local.value,
    set: (value: boolean) => {
      refresh()
      if (!controlled.value) local.value = value
      instance.emit(`update:${name}`, value)
    },
  })
}
