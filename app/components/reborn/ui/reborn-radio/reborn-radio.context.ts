import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import type { RadioAppearance, RadioColor, RadioSize, RadioVariant } from "./reborn-radio.config";

/** RadioGroup 通过 provide 下发的上下文 */
export interface RadioGroupContext {
  /** 组内当前选中值 */
  modelValue: ComputedRef<string | number | boolean | undefined>;
  /** 组级禁用（含 Form 级禁用） */
  disabled: ComputedRef<boolean>;
  /** 组级尺寸 */
  size: ComputedRef<RadioSize>;
  /** 组级形态 */
  variant: ComputedRef<RadioVariant>;
  /** 组级语义色 */
  color: Ref<RadioColor>;
  /** 组级填充方式 */
  appearance: ComputedRef<RadioAppearance>;
  /** 组级下发给 pure-button 类型的 RebornButton 透传参数 */
  buttonProps: Ref<ButtonProps | undefined>;
  /** 表单校验错误态 */
  isError?: Ref<boolean>;
  /** 分段按钮的选中底色是否已交给组容器的滑块绘制（组容器挂载并量好位置后为 true） */
  sliderReady?: Ref<boolean>;
  /** 组内选中值更新入口 */
  updateValue: (value: string | number | boolean, ev: Event) => void;
}

/**
 * RadioGroup 上下文的注入键。
 * 用 Symbol 而不是字符串：provide 与 inject 两端通过同一个类型化的键关联，下发的对象缺字段会在编译期报错，
 * 也不会与页面上其他同名字符串键冲突。
 */
export const radioGroupContextKey: InjectionKey<RadioGroupContext> = Symbol("reborn-radio-group");
