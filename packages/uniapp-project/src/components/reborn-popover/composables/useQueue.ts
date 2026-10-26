import type { InjectionKey, Ref } from 'vue'
import { provide, shallowRef } from 'vue'

export const queueKey: InjectionKey<Queue> = Symbol('RebornPopoverQueue')

export interface Queue {
    queue: Ref<any[]>
    pushToQueue: (comp: any) => void
    removeFromQueue: (comp: any) => void
    closeOther: (comp: any) => void
    closeOutside: () => void
}

export function useQueue() {
    const queue = shallowRef<any[]>([])

    function pushToQueue(comp: any) {
        queue.value = [...queue.value, comp]
    }

    function removeFromQueue(comp: any) {
        queue.value = queue.value.filter((item) => {
            return item.$.uid !== comp.$.uid
        })
    }

    function closeOther(comp: any) {
        queue.value.forEach((item) => {
            if (item.$.uid !== comp.$.uid) {
                if (item.$.exposed && item.$.exposed.close) {
                    item.$.exposed.close()
                }
            }
        })
    }

    function closeOutside() {
        queue.value.forEach((item) => {
            if (item.$.exposed && item.$.exposed.close) {
                item.$.exposed.close()
            }
        })
    }

    provide(queueKey, {
        queue,
        pushToQueue,
        removeFromQueue,
        closeOther,
        closeOutside
    })

    return {
        closeOther,
        closeOutside
    }
}
