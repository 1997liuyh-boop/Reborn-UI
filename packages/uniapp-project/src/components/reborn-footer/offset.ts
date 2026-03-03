import { ref } from 'vue'

const footerOffset = ref(0)

export const rebornFooterOffset = {
  set(value: number) {
    footerOffset.value = value
  },
  get() {
    return footerOffset.value
  },
}

export function useRebornFooterOffset() {
  return footerOffset
}
