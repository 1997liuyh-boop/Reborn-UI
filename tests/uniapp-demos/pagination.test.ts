/* eslint test/no-import-node-test: off -- 使用仓库现有测试运行器 */
import assert from 'node:assert/strict'
import { after, it } from 'node:test'
import { installDom, wait } from '../composables/harness'
import { createFixture, loadUniDemo } from './harness'

const dom = installDom()
const { createApp, h } = await import('vue')
after(() => dom.window.close())

for (const [name, size, delay] of [['Loadmore', 10, 850], ['Waterfall', 4, 650]] as const) {
  const Page = await loadUniDemo(`packages/uniapp-project/src/pages/reborn-${name.toLowerCase()}/Reborn${name}Demo.vue`)
  it(`${name} 错误页不写数据，触底不能隐式重试，显式重试不产生重复项`, async () => {
    const fixture = createFixture()
    const root = document.createElement('div')
    const app = createApp({ render: () => h(Page) })
    app.config.warnHandler = () => {}
    app.mount(root)
    const count = () => name === 'Waterfall' ? fixture.appended.length : root.querySelectorAll('[data-title]').length / 2
    try {
      fixture.hooks.load.forEach(fn => fn())
      await wait(delay)
      assert.equal(count(), size)
      fixture.hooks.reach.forEach(fn => fn())
      await wait(delay)
      assert.ok(root.querySelector('[data-load-state="error"]'))
      assert.equal(count(), size, '失败页不得提前追加数据')
      fixture.hooks.reach.forEach(fn => fn())
      await wait(delay)
      assert.equal(count(), size)
      root.querySelector<HTMLButtonElement>('[data-load-state="error"]')!.click()
      await wait(delay)
      assert.equal(count(), size * 2)
      if (name === 'Waterfall') assert.equal(new Set(fixture.appended.map(item => item.id)).size, fixture.appended.length)
    }
    finally { app.unmount(); root.remove() }
  })
}
