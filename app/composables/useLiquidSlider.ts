import type { MaybeRefOrGetter } from "vue";
import { animate } from "motion-v";
import { getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, shallowRef, toValue } from "vue";
import { motionPresets, prefersReducedMotion } from "@/lib/motion";

/**
 * 选中滑块（底板）的落位与液体形变
 *
 * Tabs、Radio 与 Segmented 共用 Motion 的调度和落位：
 * 调用方负责量出选中项相对容器的矩形，这里负责把它写成行内样式，
 * 并在真正切换时跑液体形变，三个组件的切换手感因此保持一致。
 *
 * 性能：传入滑块元素（element）时，动画途中的每一帧直接写元素的行内样式，
 * 只在落位（动画结束、立即落位、隐藏）时同步一次响应式 style，宿主组件不会每帧整组件重渲染；
 * 宿主模板仍用 :style="style" 绑定，style 对象引用不变时 Vue 不会重写这些行内样式。
 * 不传 element 时退回每帧更新响应式 style（行为与旧版一致）。
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
   * radio 在字体加载、换行后的重新测量直接到位，不让滑块慢慢飘过去。
   */
  instant?: boolean;
}

/**
 * 拉伸长度上限，按起止两项主轴尺寸之和的倍数计。
 * 相邻切换的并集只是「两项 + 一个间距」，1.1 倍足够容纳，效果不变；
 * 跨很多项切换时并集会覆盖整排，滑块拉成一长条，封顶后变成一段固定长度的液滴追向目标
 */
const LIQUID_MAX_STRETCH = 1.1;

/**
 * @param element 滑块元素（模板引用、getter 均可）；用于动画途中直接写样式，省掉宿主的逐帧重渲染
 */
export function useLiquidSlider(element?: MaybeRefOrGetter<HTMLElement | null | undefined>) {
  /** 滑块的行内样式；量到之前先隐藏 */
  const style = shallowRef<Record<string, string>>({ opacity: "0" });
  /** 每帧记录实际显示的矩形；连续切换从途中位置接续，不跳回上一次提交的终点。 */
  let current: SliderRect | undefined;
  let currentScale = 1;
  /** 形变所处阶段：travel 拉伸行程中、settle 回弹中、idle 空闲 */
  let phase: "idle" | "travel" | "settle" = "idle";
  /** 形变的最终落点；行程途中的重量只改写它，由回弹阶段统一落位 */
  let target: SliderRect | undefined;
  let vertical = false;
  let media: MediaQueryList | undefined;
  let playback: ReturnType<typeof animate> | undefined;
  let generation = 0;

  function stopAnimation() {
    generation++;
    playback?.stop();
    playback = undefined;
    phase = "idle";
  }

  /**
   * 把落点写成行内样式。
   * margin 归零是防御：滑块是容器的子节点，若使用方给相邻子节点加了负外边距
   * （如早先 tabs card 类型共用边框时的 [&>*+*]:-ml-px），滑块同样会命中，行内清零后才会正好落在量到的位置上；
   * min-height 归零同理：表单项会给 radio 组内所有子节点加 min-h-6 / min-h-8 / min-h-10，高度要以量到的选中项为准。
   * 不写 opacity：显示时交回类名（radio 选中项禁用时由类名给出半透明）
   *
   * frame 为 true 表示动画途中的一帧：有滑块元素时直接写元素样式，不改响应式 style
   */
  function apply(rect: SliderRect, vertical: boolean, scale = 1, frame = false) {
    current = rect;
    currentScale = scale;
    const next = {
      margin: "0",
      minHeight: "0px",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      // Motion 每帧提供最终值，关闭类名过渡，避免第二层 CSS 插值拖慢跟随。
      transitionDuration: "0ms",
      transform: vertical ? `scaleX(${scale})` : `scaleY(${scale})`,
    };
    const el = frame ? toValue(element) : undefined;
    if (el) {
      Object.assign(el.style, next);
      return;
    }
    style.value = next;
  }

  /** 数值进度由 Motion 驱动；矩形与交叉轴压缩同步插值。 */
  function animateTo(to: SliderRect, vertical: boolean, scale: number, spring: boolean, complete?: () => void) {
    const from = current ?? to;
    const fromScale = currentScale;
    playback?.stop();
    const token = ++generation;
    playback = animate(0, 1, {
      ...(spring
        ? motionPresets.spring
        : { type: "tween", duration: 0.11, ease: [0.215, 0.61, 0.355, 1] }),
      onUpdate: progress => {
        if (token !== generation) return;
        apply({
          left: from.left + (to.left - from.left) * progress,
          top: from.top + (to.top - from.top) * progress,
          width: Math.max(0, from.width + (to.width - from.width) * progress),
          height: Math.max(0, from.height + (to.height - from.height) * progress),
        }, vertical, fromScale + (scale - fromScale) * progress, true);
      },
      onComplete: () => {
        if (token !== generation) return;
        playback = undefined;
        apply(to, vertical, scale);
        complete?.();
      },
    });
  }

  /**
   * 液体形变。阶段 A 把滑块朝目标拉长：前缘直达目标，后缘留在起点、最多落后到长度上限
   * （相邻切换即起点与终点的并集，跨很多项时是一段定长的液滴）；
   * 阶段 B 收拢到目标矩形，由弹簧自然结束回弹。
   * 拉伸不只是装饰：前缘先到，选中项的反色文字（如 filled 的白字）一开始就有底衬着，
   * 不会有一段悬在容器底色上看不见。交叉轴同时压扁一点，读起来像液体被拉长时的表面张力
   */
  function runLiquid(from: SliderRect, to: SliderRect, vertical: boolean) {
    stopAnimation();
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
    animateTo(stretched, vertical, 1 - squash, false, () => {
      phase = "settle";
      animateTo(target ?? to, vertical, 1, true, () => { phase = "idle"; });
    });
  }

  /** 移动到新的落点；是否形变、是否直接到位由 options 决定 */
  function move(next: SliderRect, options: SliderMoveOptions) {
    const previous = current;
    const previousTarget = target;
    const sameAxis = vertical === options.vertical;
    target = next;
    vertical = options.vertical;

    if (prefersReducedMotion()) {
      stopAnimation();
      apply(next, vertical);
      return;
    }

    // 切换后的字体或容器重量不能打断卡片弹簧；终点没变就继续，改变时从当前画面重定向。
    if (!options.switching && !options.liquid && playback && sameAxis) {
      if (previousTarget && Object.keys(next).every(key => next[key as keyof SliderRect] === previousTarget[key as keyof SliderRect])) return;
      animateTo(next, vertical, 1, true);
      return;
    }

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
      target = next;
      animateTo(next, options.vertical, 1, true, () => { phase = "idle"; });
      return;
    }

    stopAnimation();
    if (options.switching && previous && !options.instant && !prefersReducedMotion()) {
      animateTo(next, options.vertical, 1, true);
    } else {
      apply(next, options.vertical);
    }
  }

  /** 没有选中项时隐藏滑块，并丢掉起点，下次出现时直接落位而不是从旧位置滑过来 */
  function hide() {
    stopAnimation();
    current = undefined;
    target = undefined;
    currentScale = 1;
    style.value = { opacity: "0", transitionDuration: "0ms" };
  }

  /** 动画中切换系统偏好时也立即落位，避免已经启动的弹簧继续播放。 */
  function syncMotionPreference() {
    if (!media?.matches || !target) return;
    stopAnimation();
    apply(target, vertical);
  }

  // 系统偏好只在客户端挂载后监听；不在组件里调用（如 effectScope）时不监听，按调用时的偏好执行
  if (getCurrentInstance()) {
    onMounted(() => {
      media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      media?.addEventListener("change", syncMotionPreference);
    });
  }
  // 清理绑定到当前作用域：组件卸载与 effectScope 停止都会执行
  if (getCurrentScope()) {
    onScopeDispose(() => {
      stopAnimation();
      media?.removeEventListener("change", syncMotionPreference);
    });
  }

  return { style, move, hide };
}
