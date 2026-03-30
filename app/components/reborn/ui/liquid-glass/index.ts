import type { HTMLAttributes } from "vue";

export interface LiquidGlassProps {
    /** 圆角大小（px） */
    radius?: number;
    /** 边框厚度比例（相对于最短边） */
    border?: number;
    /** 位移贴图的亮度（0-100） */
    lightness?: number;
    /** 高斯模糊偏移量（feGaussianBlur stdDeviation） */
    displace?: number;
    /** SVG 渐变混合模式 */
    blend?: string;
    /** 位移贴图 X 通道 */
    xChannel?: "R" | "G" | "B";
    /** 位移贴图 Y 通道 */
    yChannel?: "R" | "G" | "B";
    /** 位移贴图 alpha 透明度 */
    alpha?: number;
    /** 位移贴图模糊半径（px） */
    blur?: number;
    /** 红通道位移偏移量 */
    rOffset?: number;
    /** 绿通道位移偏移量 */
    gOffset?: number;
    /** 蓝通道位移偏移量 */
    bOffset?: number;
    /** 位移强度（负值向内折射） */
    scale?: number;
    /** 磨砂背景透明度 */
    frost?: number;
    /**
     * 容器定位方式
     * - `fixed`：全屏浮层（默认）
     * - `absolute`：相对父容器定位
     * - `relative`：普通文档流
     */
    position?: "fixed" | "absolute" | "relative" | "sticky";
    /** 内层插槽容器的额外 class */
    class?: HTMLAttributes["class"];
    /** 外层效果容器的额外 class */
    containerClass?: HTMLAttributes["class"];
}

export { default as LiquidGlass } from "./LiquidGlass.vue";
