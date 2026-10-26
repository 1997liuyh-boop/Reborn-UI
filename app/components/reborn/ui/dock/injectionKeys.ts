import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { DataOrientation } from "./types";

// 指针坐标由 Dock 维护，以只读引用下发，子组件不能改写
export const MOUSE_X_INJECTION_KEY = Symbol("mouse-x") as InjectionKey<Readonly<Ref<number>>>;
export const MOUSE_Y_INJECTION_KEY = Symbol("mouse-y") as InjectionKey<Readonly<Ref<number>>>;

export const MAGNIFICATION_INJECTION_KEY = Symbol("magnification") as InjectionKey<
  ComputedRef<number>
>;

export const DISTANCE_INJECTION_KEY = Symbol("distance") as InjectionKey<ComputedRef<number>>;

// 方向以引用下发，Dock 切换 orientation 后子组件随之更新
export const ORIENTATION_INJECTION_KEY = Symbol("orientation") as InjectionKey<
  Readonly<Ref<DataOrientation>>
>;
