/**
 * 演练场参数抽屉的互斥登记：一页有多个演练场时，同一时间只开一个抽屉。
 * 只在点击时由客户端调用，服务端不会改到这份模块级状态。
 */

/** 当前开着抽屉的演练场的关闭函数 */
let closeActive: (() => void) | undefined;

/** 打开抽屉前登记自己；别的演练场开着的话先把它关掉 */
export function claimDrawer(close: () => void) {
    if (closeActive !== close) closeActive?.();
    closeActive = close;
}

/** 卸载时撤销登记 */
export function releaseDrawer(close: () => void) {
    if (closeActive === close) closeActive = undefined;
}
