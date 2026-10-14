import { onBeforeUnmount, shallowRef } from "vue";

/**
 * 选中滑块（底板）的落位与液体形变
 *
 * RebornTabs 的卡片 / 胶囊底板与 RebornRadioGroup 的分段按钮滑块共用：
 * 调用方负责量出选中项相对容器的矩形，这里负责把它写成行内样式，
 * 并在真正切换时跑液体形变，两个组件的切换手感因此保持一致。
 */

/** 滑块落点，相对容器左上角；两个轴向都记，滑块要整块盖住选中项 */
export interface SliderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SliderMoveOptions {
  /** 是否为一次真正的切换；只有切换才跑液体形变，尺寸变化引起的重量直接落位 */
  switching: boolean;
  /** 是否启用液体形变；tabs 的卡片型底板就是那张卡片，形变会看着像渲染坏了，所以只给胶囊型开 */
  liquid: boolean;
  /** 主轴是否为竖向：竖排时沿 top / height 拉伸、横向压扁 */
  vertical: boolean;
  /**
   * 非形变的落位是否直接到位（行内 0ms）。
   * tabs 交回类名上的过渡；radio 直接到位，否则字体加载、换行时滑块会慢慢飘过去
   */
  instant?: boolean;
}

/** 液体形变两段的节奏：行程直奔目标，回弹越过目标再弹回 */
const LIQUID_TRAVEL_DURATION = 110;
const LIQUID_TRAVEL_EASING = "cubic-bezier(0.215, 0.61, 0.355, 1)";
const LIQUID_SETTLE_DURATION = 150;
const LIQUID_SETTLE_EASING = "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
/**
 * 拉伸长度上限，按起止两项主轴尺寸之和的倍数计。
 * 相邻切换的并集只是「两项 + 一个间距」，1.1 倍足够容纳，效果不变；
 * 跨很多项切换时并集会覆盖整排，滑块拉成一长条，封顶后变成一段固定长度的液滴追向目标
 */
const LIQUID_MAX_STRETCH = 1.1;

/** transition-none 只能关掉过渡、关不掉行内 transform 的瞬时生效，所以形变要在 JS 里判定 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useLiquidSlider() {
  /** 滑块的行内样式；量到之前先隐藏 */
  const style = shallowRef<Record<string, string>>({ opacity: "0" });
  /** 上一次提交的落点，作为液体形变的起点；连点时取的是提交值而非飞行中的视觉位置 */
  let committed: SliderRect | undefined;
  /** 形变所处阶段：travel 拉伸行程中、settle 回弹中、idle 空闲 */
  let phase: "idle" | "travel" | "settle" = "idle";
  /** 形变的最终落点；行程途中的重量只改写它，由回弹阶段统一落位 */
  let target: SliderRect | undefined;
  let travelTimer: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  function clearTimers() {
    if (travelTimer !== undefined) clearTimeout(travelTimer);
    if (settleTimer !== undefined) clearTimeout(settleTimer);
    travelTimer = undefined;
    settleTimer = undefined;
    phase = "idle";
  }

  /**
   * 把落点写成行内样式。
   * margin 归零是防御：滑块是容器的子节点，若使用方给相邻子节点加了负外边距
   * （如早先 tabs card 类型共用边框时的 [&>*+*]:-ml-px），滑块同样会命中，行内清零后才会正好落在量到的位置上；
   * min-height 归零同理：表单项会给 radio 组内所有子节点加 min-h-input-*，高度要以量到的选中项为准。
   * 不写 opacity：显示时交回类名（radio 选中项禁用时由类名给出半透明）
   */
  function apply(rect: SliderRect, extra?: Record<string, string>) {
    style.value = {
      margin: "0",
      minHeight: "0px",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      ...extra,
    };
  }

  function settleStyle(vertical: boolean) {
    return {
      transform: vertical ? "scaleX(1)" : "scaleY(1)",
      transitionDuration: `${LIQUID_SETTLE_DURATION}ms`,
      transitionTimingFunction: LIQUID_SETTLE_EASING,
    };
  }

  /**
   * 液体形变。阶段 A 把滑块朝目标拉长：前缘直达目标，后缘留在起点、最多落后到长度上限
   * （相邻切换即起点与终点的并集，跨很多项时是一段定长的液滴）；
   * 阶段 B 收拢到目标矩形并用 back-out 缓动越过目标再弹回。
   * 拉伸不只是装饰：前缘先到，选中项的反色文字（如 filled 的白字）一开始就有底衬着，
   * 不会有一段悬在容器底色上看不见。交叉轴同时压扁一点，读起来像液体被拉长时的表面张力
   */
  function runLiquid(from: SliderRect, to: SliderRect, vertical: boolean) {
    clearTimers();
    const fromStart = vertical ? from.top : from.left;
    const fromSize = vertical ? from.height : from.width;
    const toStart = vertical ? to.top : to.left;
    const toSize = vertical ? to.height : to.width;

    // 拉伸段以目标一侧为准：领先的一端直达目标，拖尾的一端最多落后到长度上限，
    // 远距离切换时滑块是整段向目标移动，而不是起点不动、一路铺满整排
    const maxLength = (fromSize + toSize) * LIQUID_MAX_STRETCH;
    const forward = toStart >= fromStart;
    const unionStart = forward
      ? Math.max(fromStart, toStart + toSize - maxLength)
      : toStart;
    const unionEnd = forward
      ? toStart + toSize
      : Math.min(fromStart + fromSize, toStart + maxLength);
    // 压扁幅度随位移增长并封顶，相邻选项之间不会夸张形变
    const squash = Math.min(0.12, Math.abs(toStart - fromStart) / 900);
    const stretched: SliderRect = vertical
      ? { ...to, top: unionStart, height: unionEnd - unionStart }
      : { ...to, left: unionStart, width: unionEnd - unionStart };

    phase = "travel";
    target = to;
    apply(stretched, {
      transform: vertical ? `scaleX(${1 - squash})` : `scaleY(${1 - squash})`,
      transitionDuration: `${LIQUID_TRAVEL_DURATION}ms`,
      transitionTimingFunction: LIQUID_TRAVEL_EASING,
    });

    travelTimer = setTimeout(() => {
      travelTimer = undefined;
      phase = "settle";
      apply(target ?? to, settleStyle(vertical));
      settleTimer = setTimeout(() => {
        settleTimer = undefined;
        phase = "idle";
      }, LIQUID_SETTLE_DURATION);
    }, LIQUID_TRAVEL_DURATION);
  }

  /** 移动到新的落点；是否形变、是否直接到位由 options 决定 */
  function move(next: SliderRect, options: SliderMoveOptions) {
    const previous = committed;
    committed = next;

    if (options.switching && options.liquid && previous && !prefersReducedMotion()) {
      runLiquid(previous, next, options.vertical);
      return;
    }

    // 形变途中又来了一次重量（如选中项加粗改变了宽度，ResizeObserver 紧跟着触发）：
    // 只改写落点、不打断形变，否则刚开始的动画会被这次重量吃掉
    if (options.liquid && phase === "travel") {
      target = next;
      return;
    }
    if (options.liquid && phase === "settle") {
      apply(next, settleStyle(options.vertical));
      return;
    }

    clearTimers();
    apply(next, {
      ...(options.liquid ? { transform: options.vertical ? "scaleX(1)" : "scaleY(1)" } : {}),
      ...(options.instant ? { transitionDuration: "0ms" } : {}),
    });
  }

  /** 没有选中项时隐藏滑块，并丢掉起点，下次出现时直接落位而不是从旧位置滑过来 */
  function hide() {
    clearTimers();
    committed = undefined;
    style.value = { opacity: "0" };
  }

  onBeforeUnmount(clearTimers);

  return { style, move, hide };
}
