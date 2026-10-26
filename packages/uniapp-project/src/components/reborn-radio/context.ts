import type { InjectionKey } from 'vue'
import type { RadioGroupContext } from './RebornRadio.vue'

/** 单选框组的内部上下文键。 */
export const radioGroupKey: InjectionKey<RadioGroupContext> = Symbol('RebornRadioGroup')
