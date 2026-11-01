/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import badgeTheme from '../../app/components/reborn/ui/reborn-badge/reborn-badge.config'
import buttonTheme, { buttonColors } from '../../app/components/reborn/ui/reborn-button/reborn-button.config'
import { tv } from '../../app/lib/tv'

const button = tv(buttonTheme)
const badge = tv(badgeTheme)

for (const color of buttonColors) {
  it(`${color} 实底与兼容形状消费配套背景、前景和交互角色`, () => {
    for (const variant of ['filled', 'round', 'circle'] as const) {
      const classes = button({ color, variant }).base().split(/\s+/)
      for (const expected of [
        `bg-${color}`, `text-${color}-foreground`,
        `enabled:hover:bg-${color}-hover`, `enabled:hover:text-${color}-hover-foreground`,
        `enabled:active:bg-${color}-active`, `enabled:active:text-${color}-active-foreground`,
      ]) assert.ok(classes.includes(expected), `${variant} 缺少 ${expected}`)
      assert.ok(!classes.includes('text-white'))
      assert.ok(!classes.some(value => value.endsWith('/75')))
    }
    const badgeClasses = badge({ color, variant: 'filled' }).base().split(/\s+/)
    assert.ok(badgeClasses.includes(`bg-${color}`))
    assert.ok(badgeClasses.includes(`text-${color}-foreground`))
  })
}
