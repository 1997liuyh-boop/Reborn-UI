/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 测试运行器 */
import type { Ref } from 'vue'
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { loadAppModule } from '../composables/harness'

const vue = await import('vue')

/**
 * 在 Node 里跑主题色插件；useCookie 按 Nuxt 服务端语义模拟：
 * 缺省时取 default，渲染结束时值与请求里的 cookie 不同才写 Set-Cookie
 */
async function runPlugin(requestCookie?: string) {
  let cookie!: Ref<unknown>
  const themeColor = vue.ref('blue')
  const globals = {
    computed: vue.computed,
    watch: vue.watch,
    defineNuxtPlugin: (setup: () => void) => setup,
    useThemeColor: () => themeColor,
    useHead: () => {},
    useCookie: (_name: string, options?: { default?: () => unknown }) => {
      cookie = vue.ref(requestCookie ?? options?.default?.())
      return cookie
    },
  }
  const descriptors = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, value })
  try {
    const plugin = (await loadAppModule<{ default: () => void }>('app/plugins/theme-color.ts')).default
    plugin()
  }
  finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
  /** 渲染结束时会写出的 Set-Cookie 值；undefined 表示不写 */
  const setCookie = () => cookie.value === requestCookie ? undefined : cookie.value
  return { themeColor, setCookie }
}

it('新访客的服务端响应不写主题色 cookie，首屏仍回落品牌蓝', async () => {
  const { themeColor, setCookie } = await runPlugin()
  assert.equal(themeColor.value, 'blue')
  assert.equal(setCookie(), undefined)
})

it('已选过主题色的访客按 cookie 恢复，原样不回写', async () => {
  const { themeColor, setCookie } = await runPlugin('orange')
  assert.equal(themeColor.value, 'orange')
  assert.equal(setCookie(), undefined)
})

it('用户切换主题色后才写 cookie，非白名单值回落品牌蓝', async () => {
  const { themeColor, setCookie } = await runPlugin()
  themeColor.value = 'green'
  await vue.nextTick()
  assert.equal(setCookie(), 'green')
  themeColor.value = 'purple'
  await vue.nextTick()
  assert.equal(setCookie(), 'blue')
})
