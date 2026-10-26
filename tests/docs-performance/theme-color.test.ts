/* eslint test/no-import-node-test: off -- 使用项目现有的 Node 测试运行器 */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import { runInNewContext } from 'node:vm'
import { normalizeThemeColor, themeColorBootstrap } from '../../app/utils/themeColor'

/** 模拟静态 HTML 在 Vue 水合之前执行阻塞脚本。 */
function initialPreset(cookie: string) {
  const document = { cookie, documentElement: { dataset: {} as Record<string, string> } }
  runInNewContext(themeColorBootstrap, { document })
  return document.documentElement.dataset.themeColor
}

it('静态首屏从普通和 Nuxt 编码 cookie 恢复全部主题预设', () => {
  for (const [color, preset] of [['blue', 'brand'], ['orange', 'orange'], ['green', 'green'], ['red', 'red']]) {
    assert.equal(initialPreset(`other=1; theme-color=${color}; tail=2`), preset)
    assert.equal(initialPreset(`theme-color=${encodeURIComponent(JSON.stringify(color))}`), preset)
  }
})

it('缺失、损坏与非白名单 cookie 都回落品牌色', () => {
  for (const cookie of ['', 'theme-color=%E0%A4%A', 'theme-color=__proto__', 'theme-color=constructor', 'theme-color=purple']) {
    assert.equal(initialPreset(cookie), 'brand')
  }
  assert.equal(normalizeThemeColor({ name: 'red' }), 'blue')
})

it('Nuxt 自动导入扫描到的导出名与源码一致，不会凭空多出内联脚本里的变量名', async () => {
  // unimport 的 scanExports 就是 Nuxt 扫描 app/utils 时用的同一个函数；
  // 多出一个导出名会让全站模块被注入不存在的 import，开发环境直接报 SyntaxError
  const { scanExports } = await import('unimport')
  const names = (await scanExports('app/utils/themeColor.ts', true)).map(item => item.name).sort()
  assert.deepEqual(names, ['ThemeColorName', 'normalizeThemeColor', 'themeColorBootstrap', 'themeColors'])
})

it('浏览器拒绝读取 cookie 时仍能在首屏应用默认主题', () => {
  const document = { get cookie(): string { throw new Error('cookie disabled') }, documentElement: { dataset: {} as Record<string, string> } }
  runInNewContext(themeColorBootstrap, { document })
  assert.equal(document.documentElement.dataset.themeColor, 'brand')
})
