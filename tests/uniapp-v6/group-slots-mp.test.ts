/**
 * RebornCheckboxGroup / RebornRadioGroup（UniApp）options 模式的小程序插槽回归：
 * 组向子项转发 #checkbox / #radio 时，若写成 <template v-if="$slots.xxx" #xxx>，小程序编译器无视 v-if，
 * 子项的 u-s 仍含该插槽名、$slots.xxx 恒为真，使用方没写自定义插槽时子项自带的勾选框 / 单选框就不渲染。
 * 断言实际渲染出的子项标签：未写插槽时 u-s 不含该名字，写了才含。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { bindWxml, compileMpTemplate, renderWxml } from './mp-template'

const ui = new Proxy({}, { get: (_, key) => () => `ui-${String(key)}` })

function renderedSlotNames(file: string, childTag: string, $slots: Record<string, boolean>) {
  const template = compileMpTemplate(file)
  const options = [{ label: '甲', value: 'a' }, { label: '乙', value: 'b' }]
  const ctx = new Proxy({ normalizedOptions: options, ui, groupClass: 'group', customClass: '', $slots } as Record<string, any>, {
    get: (target, key: string) => target[key],
  })
  const data = { ...template.render(ctx), $slots }
  const slotLists: string[][] = []
  renderWxml(template.wxml, data, (tag, attrs, scope) => {
    if (tag === childTag) slotLists.push(bindWxml(attrs['u-s']!, scope))
  })
  return slotLists
}

for (const [file, childTag, slotName] of [
  ['reborn-checkbox/RebornCheckboxGroup.vue', 'reborn-checkbox', 'checkbox'],
  ['reborn-radio/RebornRadioGroup.vue', 'reborn-radio', 'radio'],
] as const) {
  test(`小程序 ${file}：options 模式未写 #${slotName} 时子项不被标记为已传入该插槽`, () => {
    const plain = renderedSlotNames(file, childTag, { d: true })
    assert.equal(plain.length, 2, '每个选项渲染一个子项')
    for (const names of plain) assert.ok(!names.includes(slotName), `子项 u-s 不应含 ${slotName}：${names.join(',')}`)

    const custom = renderedSlotNames(file, childTag, { d: true, [slotName]: true })
    assert.equal(custom.length, 2)
    for (const names of custom) assert.ok(names.includes(slotName), `写了 #${slotName} 时应转发给子项`)
  })
}
