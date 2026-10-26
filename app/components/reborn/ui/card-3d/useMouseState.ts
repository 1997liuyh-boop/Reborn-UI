import type { InjectionKey } from "vue";
import { inject, readonly, shallowRef } from "vue";

/** 3D 卡片的悬停状态：CardContainer 创建并下发，CardItem 读取 */
export function useMouseState() {
  const isMouseEntered = shallowRef(false);

  function setMouseEntered(value: boolean) {
    isMouseEntered.value = value;
  }

  return {
    isMouseEntered: readonly(isMouseEntered),
    setMouseEntered,
  };
}

export type Card3DMouseState = ReturnType<typeof useMouseState>;

/** CardContainer 向 CardItem 下发悬停状态的注入键 */
export const CARD_3D_MOUSE_STATE_KEY: InjectionKey<Card3DMouseState> = Symbol("Card3DMouseState");

/** 读取所在 CardContainer 的悬停状态；脱离 CardContainer 使用时给出明确的错误 */
export function useCard3DContext(): Card3DMouseState {
  const state = inject(CARD_3D_MOUSE_STATE_KEY, null);
  if (!state) {
    throw new Error("[CardItem] 必须放在 CardContainer 内使用");
  }
  return state;
}
