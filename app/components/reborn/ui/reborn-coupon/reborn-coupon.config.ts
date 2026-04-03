export type CouponType = 'notch' | 'ticket' | 'stamp' | 'perforated' | 'combined'
export type CouponDirection = 'horizontal' | 'vertical'
export type CouponPosition = 'start' | 'center' | 'end'
export type CouponSplit = 'dashed' | 'dotted'

export default {
    slots: {
        root: 'flex overflow-hidden box-border bg-[#f5f5f5] transition duration-300 ease-in-out cursor-pointer antialiased',
        left: 'shrink-0',
        right: 'grow flex-1',
        center: 'hidden',
    },
    variants: {
        direction: {
            horizontal: {
                root: 'flex-col',
                left: 'w-full',
                right: 'w-full',
                center: 'w-full'
            },
            vertical: {
                root: 'flex-row',
                left: 'h-full',
                right: 'h-full',
                center: 'h-full'
            }
        },
        hoverable: {
            true: {
                root: 'hover:-translate-y-1 hover:shadow-xl will-change-transform'
            }
        }
    }
}
