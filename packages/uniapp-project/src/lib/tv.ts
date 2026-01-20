// @ts-ignore
import { create } from '@weapp-tailwindcss/variants-v3'
// @ts-ignore
const isH5 = process.env.UNI_PLATFORM === 'h5'
// @ts-ignore
const isApp = process.env.UNI_PLATFORM === 'app'
const isMp = !isH5 && !isApp

const { tv } = create({
  escape: isMp,
  unescape: isMp,
})

export { tv }
