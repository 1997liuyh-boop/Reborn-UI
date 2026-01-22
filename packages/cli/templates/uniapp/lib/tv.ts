// @ts-ignore
import { create } from '@weapp-tailwindcss/variants-v3'
// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'

const { tv } = create({
  escape: !isH5,
  unescape: !isH5,
})

export { tv }
