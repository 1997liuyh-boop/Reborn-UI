import { shallowRef } from 'vue'

const height = shallowRef(0)

export const rebornFooterOffset = {
  height,
  set(val: number) {
    height.value = val
  },
}
