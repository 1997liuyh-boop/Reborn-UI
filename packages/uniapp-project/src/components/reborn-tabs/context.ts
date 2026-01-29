import type { InjectionKey, Ref } from 'vue'

export interface TabsContext {
    activeValue: Ref<string | number>
    upateValue: (value: string | number) => void
}

export const TABS_INJECTION_KEY: InjectionKey<TabsContext> = Symbol('RebornTabs')
