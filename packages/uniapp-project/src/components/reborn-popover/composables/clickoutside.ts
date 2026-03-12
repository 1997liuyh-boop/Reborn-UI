let queue: any[] = []

export function pushToQueue(comp: any) {
    queue.push(comp)
}

export function removeFromQueue(comp: any) {
    queue = queue.filter((item) => {
        return item.$.uid !== comp.$.uid
    })
}

export function closeOther(comp: any) {
    queue.forEach((item) => {
        if (item.$.uid !== comp.$.uid) {
            if (item.$.exposed && item.$.exposed.close) {
                item.$.exposed.close()
            }
        }
    })
}

export function closeOutside() {
    queue.forEach((item) => {
        if (item.$.exposed && item.$.exposed.close) {
            item.$.exposed.close()
        }
    })
}
