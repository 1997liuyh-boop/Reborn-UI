import type { InjectionKey } from "vue";

export interface CarouselContextType {
  /** 卡片关闭时调用，轮播把该卡滚回视野 */
  onCardClose: (index: number) => void;
}

export const CarouselKey = Symbol("AppleCarousel") as InjectionKey<CarouselContextType>;
