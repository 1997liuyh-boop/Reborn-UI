import type { PropType } from 'vue'

export const baseProps = {
  customClass: {
    type: String,
    default: '',
  },
  customStyle: {
    type: String,
    default: '',
  },
}

export const makeStringProp = <T extends string>(defaultValue: T) => ({
  type: String as PropType<T>,
  default: defaultValue,
})

export const makeBooleanProp = (defaultValue: boolean) => ({
  type: Boolean,
  default: defaultValue,
})

export const makeNumberProp = (defaultValue: number) => ({
  type: Number,
  default: defaultValue,
})

export const makeNumericProp = (defaultValue: string | number) => ({
  type: [String, Number] as PropType<string | number>,
  default: defaultValue,
})
