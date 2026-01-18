import { ref } from 'vue'

export function useFieldGroup(props: any) {
  return {
    orientation: ref(undefined),
    size: ref(undefined)
  }
}
