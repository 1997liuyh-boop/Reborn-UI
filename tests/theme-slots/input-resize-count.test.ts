/* eslint test/no-import-node-test: off -- 使用 Node 内置测试运行器 */
import assert from 'node:assert/strict'
import { it } from 'node:test'
import theme, { inputSizes, inputVariants } from '../../app/components/reborn/ui/reborn-input/reborn-input.config'
import { tv } from '../../app/lib/tv'

const input = tv(theme)
for (const size of inputSizes) {
  for (const variant of inputVariants) {
    it(`可拖拽多行统计 ${size}/${variant} 将手柄移到外框角落并保留文本内边距`, () => {
      const styles = input({ size, variant, multiline: true, resizeWithCount: true })
      assert.ok(styles.wrapper().split(/\s+/).includes('px-0!'))
      assert.ok(styles.wrapper().split(/\s+/).includes('py-0'))
      assert.ok(styles.input().split(/\s+/).includes('py-2'))
      assert.ok(styles.input().split(/\s+/).includes('pb-6'))
      const padding = variant === 'underlined' ? 'px-0.5' : `px-input-px-${size}`
      assert.ok(styles.input().split(/\s+/).includes(padding))
      assert.ok(styles.count().split(/\s+/).includes('right-6'))
      assert.ok(!styles.count().split(/\s+/).includes('right-2'))
    })
  }
}
it('普通多行和单行布局保持原样', () => {
  const multiline = input({ multiline: true, resizeWithCount: false })
  assert.ok(multiline.wrapper().split(/\s+/).includes('py-2'))
  assert.ok(multiline.count().split(/\s+/).includes('right-2'))
  assert.ok(!multiline.input().split(/\s+/).includes('pb-6'))
  assert.ok(!input({ resizeWithCount: false }).wrapper().split(/\s+/).includes('px-0!'))
})
