/**
 * RebornCollapse（UniApp）布局高度回归：
 * 展开动画结束后外壳放开为 height: auto，这时外壳高度只由文档流内的子节点决定；
 * 内容节点若绝对定位，auto 算出来是 0，面板会塌掉。用内存渲染器跑完整的测量 / 计时流程，
 * 断言「外壳为 auto 时内容节点不在绝对定位里」以及「闭合态挂载不先撑开」。
 */
import type { TestNode } from '../uniapp-u1/harness'
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { nextTick, reactive } from 'vue'
import { find, fixture, loadComponent, mount } from '../uniapp-u1/harness'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const tick = async () => { await nextTick(); await nextTick() }

function classList(node: TestNode) {
  return String(node.props.class ?? '').split(/\s+/).filter(Boolean)
}

/** 极简布局：外壳 height 为 auto 时取文档流内子节点（非 absolute / fixed）的高度，否则取内联像素值 */
function shellHeight(shell: TestNode, contentHeight: number) {
  const height = shell.props.style?.height
  if (height !== 'auto') return Number.parseFloat(height)
  const inFlow = shell.children.filter(child => !classList(child).some(name => name === 'absolute' || name === 'fixed'))
  return inFlow.length ? contentHeight : 0
}

function parts(root: TestNode) {
  const content = find(root, n => classList(n).includes('reborn-collapse__content'))[0]!
  return { content, shell: content.parent! }
}

test('UniApp Collapse：展开动画结束放开为 auto 后，外壳高度仍等于内容高度', async () => {
  const env = fixture()
  const Comp = await loadComponent('reborn-collapse/RebornCollapse.vue')
  const props = reactive<Record<string, any>>({ modelValue: false })
  const wrapper = await mount(Comp, props)
  const { shell } = parts(wrapper.root)

  props.modelValue = true
  await tick()
  await wait(40)
  env.flush() // 测量返回：内容高 50
  await tick()
  assert.equal(shell.props.style.height, '50px', '过渡阶段写入测得的像素高度')
  await wait(340)
  await tick()
  assert.equal(shell.props.style.height, 'auto', '过渡结束放开为 auto，后续内容变化能自动跟随')
  assert.equal(shellHeight(shell, 50), 50, 'height: auto 时内容必须在文档流里撑起外壳，不能塌成 0')

  props.modelValue = false
  await tick()
  await wait(40)
  env.flush()
  await tick()
  await wait(40)
  await tick()
  assert.equal(shell.props.style.height, '0px', '收起：先回到像素高度再过渡到 0')
  wrapper.unmount()
})

test('UniApp Collapse：闭合态挂载不测量、不先撑开；展开态挂载直接是 auto', async () => {
  const env = fixture()
  const Comp = await loadComponent('reborn-collapse/RebornCollapse.vue')
  const closed = await mount(Comp, { modelValue: false })
  const seen: string[] = []
  const { shell } = parts(closed.root)
  seen.push(shell.props.style.height)
  await wait(40)
  assert.equal(env.pending.length, 0, '闭合态挂载不应发起高度测量')
  env.flush()
  await tick()
  seen.push(shell.props.style.height)
  await wait(40)
  await tick()
  seen.push(shell.props.style.height)
  assert.deepEqual([...new Set(seen)], ['0px'], `闭合态挂载期间高度应始终为 0，实际 ${seen.join(' → ')}`)
  closed.unmount()

  const opened = await mount(Comp, { modelValue: true })
  const openedShell = parts(opened.root).shell
  assert.equal(openedShell.props.style.height, 'auto')
  assert.equal(shellHeight(openedShell, 50), 50)
  opened.unmount()
})
