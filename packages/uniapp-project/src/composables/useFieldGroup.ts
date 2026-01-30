import { ref } from 'vue'

export function useFieldGroup(props?: any) {
  return {
    disabled: ref(undefined),
    orientation: ref(undefined),
    size: ref(undefined),
    isError: ref(undefined)
  }
}

export function useFieldGroupItem(props?: any) {
  return {
    disabled: ref(undefined),
    orientation: ref(undefined),
    size: ref(undefined)
  }
}

