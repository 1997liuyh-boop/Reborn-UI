import type { ClassValue } from 'clsx'
import type { tabsOrientations, tabsSizes, tabsTypes, tabsVariants } from './reborn-tabs.config'

export interface TabsProps {
  active?: number
  defaultActive?: number
  type?: typeof tabsTypes[number]
  variant?: typeof tabsVariants[number]
  size?: typeof tabsSizes[number]
  orientation?: typeof tabsOrientations[number]
  sticky?: boolean
  swipeable?: boolean
  shrink?: boolean
  scrollspy?: boolean
  ignorePageScroll?: boolean
  activationMode?: 'automatic' | 'manual'
  customClass?: ClassValue
  ui?: Partial<{
    root: ClassValue
    list: ClassValue
    indicator: ClassValue
    trigger: ClassValue
    leadingIcon: ClassValue
    leadingAvatar: ClassValue
    leadingAvatarSize: ClassValue
    label: ClassValue
    trailingBadge: ClassValue
    trailingBadgeSize: ClassValue
    content: ClassValue
  }>
}
