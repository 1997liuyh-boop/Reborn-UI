import type { BadgeUI } from '../../app/components/reborn/ui/reborn-badge/reborn-badge.config'
import type { ButtonUI } from '../../app/components/reborn/ui/reborn-button/reborn-button.config'

export const buttonUi: ButtonUI = {
  base: ['rounded-lg', { 'gap-3': true }],
  label: 'leading-6',
  leadingIcon: null,
}
export const badgeUi: BadgeUI = { root: 'inline-flex', closeIcon: ['size-4'] }

// 按钮没有 root 节点，拼错键位必须在编译期报错。
// @ts-expect-error 按钮只接受真实的内部结构键。
export const invalidButtonUi: ButtonUI = { root: 'rounded-lg' }
// @ts-expect-error 徽章关闭图标键不能拼成 closeIcons。
export const invalidBadgeUi: BadgeUI = { closeIcons: 'size-4' }
// @ts-expect-error 类名值不能是 Symbol。
export const invalidClass: ButtonUI = { base: Symbol('rounded-lg') }
