/**
 * RebornScrollbar 边缘回弹的共享常量与跨实例状态。
 * 放在独立模块而不是组件的 <script setup> 里：setup 中的顶层声明每个实例各有一份，
 * 而嵌套滚动需要所有实例共用同一份「已认领事件」记录。
 */

/**
 * 已被某个实例认领的 wheel 事件。
 * 嵌套滚动时 wheel 自内向外冒泡，最内层在该方向上能滚动的实例认领后，
 * 外层实例不再据此判断「在边缘继续滚动」，避免内层正常滚动时外层误回弹。
 */
export const claimedWheels = new WeakSet<Event>();

/** 回弹位移（px）：只作到达边缘的提示，不改变滚动位置 */
export const BOUNCE_DISTANCE = 2;
/** 回弹时长（ms） */
export const BOUNCE_DURATION = 320;
/** 滚轮停顿超过该时长视为一次手势结束，同一边缘才允许再次回弹（触控板惯性会连续派发 wheel） */
export const WHEEL_GESTURE_GAP = 200;
/** 到达边缘发生在最近一次滚轮之后多久以内才算滚轮送达；浏览器平滑滚轮约 150–200ms 才落位 */
export const WHEEL_ARRIVAL_WINDOW = 300;
