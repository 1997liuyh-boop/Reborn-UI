import { tv, type VariantProps } from 'tailwind-variants'

export const formItemVariants = tv({
    base: 'flex flex-col',
})

export type FormItemVariants = VariantProps<typeof formItemVariants>

export default {
    base: 'flex flex-col'
}
