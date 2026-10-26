import { getCurrentInstance, shallowRef } from 'vue'

export function getRect(selector: string, all: boolean = false, context?: any) {
    return new Promise<any>((resolve) => {
        let query = uni.createSelectorQuery()
        if (context) {
            query = query.in(context)
        }
        query[all ? 'selectAll' : 'select'](selector)
            .boundingClientRect((rect) => {
                if (all && Array.isArray(rect) && rect.length) {
                    resolve(rect)
                } else if (!all && rect) {
                    resolve(rect)
                } else {
                    resolve(null)
                }
            })
            .exec()
    })
}

export function usePopover() {
    const { proxy } = getCurrentInstance() as any
    const popStyle = shallowRef<string>('')
    const arrowStyle = shallowRef<string>('')

    const arrowSide = shallowRef<'top' | 'bottom' | 'left' | 'right' | 'none'>('none')

    const width = shallowRef<number>(0)
    const height = shallowRef<number>(0)

    function noop() { }

    async function init(
        side: 'top' | 'right' | 'bottom' | 'left',
        align: 'start' | 'center' | 'end',
        visibleArrow: boolean,
    ) {
        if (visibleArrow) {
            if (side === 'top') arrowSide.value = 'bottom'
            else if (side === 'bottom') arrowSide.value = 'top'
            else if (side === 'left') arrowSide.value = 'right'
            else if (side === 'right') arrowSide.value = 'left'
        } else {
            arrowSide.value = 'none'
        }

        const rect = await getRect('#target', false, proxy)
        if (!rect) return
        width.value = rect.width
        height.value = rect.height
    }

    function control(
        side: 'top' | 'right' | 'bottom' | 'left',
        align: 'start' | 'center' | 'end',
        offset: number,
        visibleArrow: boolean
    ) {
        const arrowSize = visibleArrow ? 9 : 0
        let placement = side as string
        if (align === 'start') placement += '-start'
        else if (align === 'end') placement += '-end'

        const verticalX = width.value / 2
        const verticalY = arrowSize + height.value + offset + 5
        const horizontalX = width.value + arrowSize + offset + 5
        const horizontalY = height.value / 2

        const offsetX = (verticalX - 17 > 0 ? 0 : verticalX - 25)
        const offsetY = (horizontalY - 17 > 0 ? 0 : horizontalY - 25)

        const placements = new Map([
            ['top', [`left: ${verticalX}px; bottom: ${verticalY}px; transform: translateX(-50%);`, 'left: 50%; margin-left: -4.5px;']],
            ['top-start', [`left: ${offsetX}px; bottom: ${verticalY}px;`, 'left: 16px;']],
            ['top-end', [`right: ${offsetX}px; bottom: ${verticalY}px;`, 'right: 16px;']],

            ['bottom', [`left: ${verticalX}px; top: ${verticalY}px; transform: translateX(-50%);`, 'left: 50%; margin-left: -4.5px;']],
            ['bottom-start', [`left: ${offsetX}px; top: ${verticalY}px;`, 'left: 16px;']],
            ['bottom-end', [`right: ${offsetX}px; top: ${verticalY}px;`, 'right: 16px;']],

            ['left', [`right: ${horizontalX}px; top: ${horizontalY}px; transform: translateY(-50%);`, 'top: 50%; margin-top: -4.5px;']],
            ['left-start', [`right: ${horizontalX}px; top: ${offsetY}px;`, 'top: 16px;']],
            ['left-end', [`right: ${horizontalX}px; bottom: ${offsetY}px;`, 'bottom: 16px;']],

            ['right', [`left: ${horizontalX}px; top: ${horizontalY}px; transform: translateY(-50%);`, 'top: 50%; margin-top: -4.5px;']],
            ['right-start', [`left: ${horizontalX}px; top: ${offsetY}px;`, 'top: 16px;']],
            ['right-end', [`left: ${horizontalX}px; bottom: ${offsetY}px;`, 'bottom: 16px;']]
        ])

        popStyle.value = placements.get(placement)?.[0] || placements.get('bottom')![0]
        arrowStyle.value = placements.get(placement)?.[1] || placements.get('bottom')![1]
    }

    return { popStyle, arrowStyle, arrowSide, init, control, noop }
}
