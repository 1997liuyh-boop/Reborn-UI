/**
 * RebornForm（Web）字段路径匹配回归，与 UniApp 端 tests/uniapp-v6/form-hyphen-prop.test.ts 同口径：
 * 顶层键本身含连字符（如 user-name）时，按原名匹配 zod issue，不能被当成嵌套路径 user.name 而静默放行；
 * 文档约定的嵌套写法 contacts-0-name 仍按嵌套路径匹配。
 */
import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- 沿用仓库可直接执行的 Node 回归测试宿主。
import test from 'node:test'
import { h } from 'vue'
import { z } from 'zod'
import { fixture, loadComponent, mount } from '../uniapp-u1/harness'

test('Web Form：连字符顶层字段名按原名校验，嵌套连字符路径仍可用', async () => {
  fixture()
  const Form = await loadComponent('reborn-form/RebornForm.vue', [], 'web')
  const Item = await loadComponent('reborn-form/RebornFormItem.vue', [], 'web')
  const rules = z.object({
    'user-name': z.string().min(1, '请输入用户名'),
    'contacts': z.array(z.object({ name: z.string().min(1, '请输入联系人') })),
  })
  const wrapper = await mount(Form, {
    modelValue: { 'user-name': '', 'contacts': [{ name: '' }] },
    rules,
    showMessage: false,
    scrollToError: false,
  }, { default: () => [h(Item, { prop: 'user-name' }), h(Item, { prop: 'contacts-0-name' })] })

  assert.equal(await wrapper.exposed.validateField('user-name'), '请输入用户名', '含连字符的顶层字段必须拿到自己的错误')
  assert.equal(await wrapper.exposed.validateField('contacts-0-name'), '请输入联系人')
  assert.equal(await wrapper.exposed.validate(), false, '非法数据不能被放行提交')
  wrapper.unmount()
})
