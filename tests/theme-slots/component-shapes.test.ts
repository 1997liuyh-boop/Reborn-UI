/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import badgeTheme, { badgeSizes, badgeVariants } from '../../app/components/reborn/ui/reborn-badge/reborn-badge.config'
import buttonTheme, { buttonSizes, buttonVariants } from '../../app/components/reborn/ui/reborn-button/reborn-button.config'
import { tv } from '../../app/lib/tv'

it('按钮风格选项不再包含形状，旧变体仍可使用', () => {
  assert.deepEqual(buttonVariants, ['filled', 'outlined', 'soft', 'subtle', 'text'])
  assert.match(tv(buttonTheme)({ variant: 'round' }).base(), /!rounded-full/)
  assert.match(tv(buttonTheme)({ variant: 'circle' }).base(), /!aspect-square/)
})

for (const [name, theme, variants, sizes] of [
  ['button', buttonTheme, buttonVariants, buttonSizes],
  ['badge', badgeTheme, badgeVariants, badgeSizes],
] as const) {
  const styles = tv(theme)
  for (const variant of variants) {
    it(`${name  } 的 ${  variant  } 形状独立于配色及禁用态`, () => {
      for (const disabled of [false, true]) {
        const base = styles({ variant, disabled }).base().split(/\s+/)
        for (const shape of [{ round: true }, { circle: true }, { round: true, circle: true }]) {
          const shaped = styles({ variant, disabled, ...shape }).base().split(/\s+/)
          for (const cls of base.filter(c => /^(?:bg-|text-|border-(?:gray|primary|brand|secondary|green|blue|orange|red))/.test(c))) {
            assert.ok(shaped.includes(cls), `${name  } 应保留 ${  cls}`)
          }
          assert.ok(shaped.includes('!rounded-full'))
        }
      }
    })
    for (const size of sizes) {
      it(`${name  } 的 ${  variant  } 圆形 ${  size  } 固定宽高且优先于其他形状`, () => {
        const classes = styles({ variant, size, circle: true, round: true, square: true } as any).base().split(/\s+/)
        assert.ok(classes.includes(`!w-[var(--height-${  name  }-${  size  })]`))
        assert.ok(classes.includes(`!h-[var(--height-${  name  }-${  size  })]`))
        assert.ok(classes.includes('!p-0'))
        assert.ok(!classes.includes('!h-auto'))
      })
    }
  }
}
