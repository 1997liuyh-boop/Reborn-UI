import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
// eslint-disable-next-line test/no-import-node-test -- 与既有回归共用 Node 测试运行器。
import test from 'node:test'
import { defineComponent, h, nextTick, provide, reactive, shallowRef } from 'vue'
import { node, renderer } from './harness'

const { FORM_KEY, useFormInject } = createRequire(import.meta.url)('../../packages/uniapp-project/src/composables/useFieldGroup.ts') as typeof import('../../packages/uniapp-project/src/composables/useFieldGroup')

test('Uni H5 size：省略、动态同默认值、不同值、移除及空值遵循显式/表单/默认优先级', async () => {
  const raw = shallowRef<Record<string, unknown>>({})
  const form = reactive({ size: 'lg' })
  const seen: string[] = []
  const warnings: string[] = []
  const Child = defineComponent({ props: { size: { type: String, default: 'md' } }, setup(props) {
    const state = useFormInject(props)
    return () => { seen.push(state.size.value); return h('text', state.size.value) }
  } })
  const app = renderer.createApp({ setup() {
    provide(FORM_KEY, { props: form, addField() {}, removeField() {}, getError: () => '', validateField: async () => null })
    return () => h(Child, raw.value)
  } })
  app.config.warnHandler = message => warnings.push(message)
  app.mount(node('root'))
  try {
    for (const [value, expected] of [[{}, 'lg'], [{ size: 'md' }, 'md'], [{ size: 'sm' }, 'sm'], [{}, 'lg'], [{ size: null }, 'lg'], [{ size: undefined }, 'lg']] as const) {
      raw.value = value
      await nextTick()
      assert.equal(seen.at(-1), expected)
    }
    form.size = ''
    await nextTick()
    assert.equal(seen.at(-1), 'md')
    assert.deepEqual(warnings, [])
  }
  finally { app.unmount() }
})
