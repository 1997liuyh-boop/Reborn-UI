import { ref } from 'vue'

const height = ref(0)

export const rebornFooterOffset = {
  height,
  set(val: number) {
    height.value = val
  },
}
