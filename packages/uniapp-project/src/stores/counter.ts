import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = shallowRef(0)
  function increment() {
    count.value++
  }

  return { count, increment }
})
