import type { PlacementAlign, PlacementSide } from './placement';

/**
 * 浮层类组件（tooltip / popover / popconfirm 等）共用的定位几何。
 *
 * 这里只做纯计算，不读写 DOM、也不关心箭头长什么样：箭头的形状与渲染留给各组件自己，
 * 本模块负责的是「气泡落在哪」——面板坐标、溢出后的翻转与贴边规则、箭头在交叉轴上的落点。
 * 各浮层组件共用同一套口径，气泡位置才不会随组件各自演化而漂移。
 *
 * 方位词汇取自 ~/lib/placement，与 resolvePlacement 的输出直接对接。
 */

/** 面板左上角坐标，相对视口 */
export interface FloatingPoint {
  top: number;
  left: number;
}

/** 仅含宽高的尺寸描述，避免与 DOMRect 耦合 */
export interface FloatingSize {
  width: number;
  height: number;
}

/** 触发器的位置与尺寸；DOMRect 满足该结构，可直接传入 */
export interface FloatingRect extends FloatingSize {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 四个方向超出视口的像素数，正数表示溢出 */
export interface FloatingOverflow {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** 面板与视口边缘至少保留的距离 */
export const FLOATING_VIEWPORT_PADDING = 8;

/**
 * 不带箭头时面板与触发器的间距。
 * 带箭头时应改用箭头伸出面板的厚度，让箭头正好填满这段距离，而不是让它悬空或压住触发器。
 */
export const FLOATING_TRIGGER_GAP = 8;

/** 面板圆角（rounded-lg = 8px），箭头底边压到这段弧线上连接处会露缺口 */
export const FLOATING_PANEL_RADIUS = 8;

/** 贴边偏移时面板与触发器至少保持的交叠量 */
export const FLOATING_MIN_OVERLAP = 12;

/** 主轴溢出时的翻转映射 */
export const FLIP_SIDE: Record<PlacementSide, PlacementSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** 按方向与对齐方式算出面板坐标；offset 是面板与触发器之间的主轴间距 */
export function getFloatingPosition(
  triggerRect: FloatingRect,
  size: FloatingSize,
  side: PlacementSide,
  align: PlacementAlign,
  offset: number,
): FloatingPoint {
  // 交叉轴上 start 贴触发器起边、end 贴终边、center 取中线对齐
  const crossX
    = align === 'start'
      ? triggerRect.left
      : align === 'end'
        ? triggerRect.right - size.width
        : triggerRect.left + triggerRect.width / 2 - size.width / 2;
  const crossY
    = align === 'start'
      ? triggerRect.top
      : align === 'end'
        ? triggerRect.bottom - size.height
        : triggerRect.top + triggerRect.height / 2 - size.height / 2;

  if (side === 'top')
    return { top: triggerRect.top - size.height - offset, left: crossX };
  if (side === 'bottom')
    return { top: triggerRect.bottom + offset, left: crossX };
  if (side === 'left')
    return { top: crossY, left: triggerRect.left - size.width - offset };
  return { top: crossY, left: triggerRect.right + offset };
}

/** 计算面板相对视口的溢出量 */
export function getFloatingOverflow(
  position: FloatingPoint,
  size: FloatingSize,
  padding: number = FLOATING_VIEWPORT_PADDING,
): FloatingOverflow {
  return {
    top: padding - position.top,
    right: position.left + size.width - (window.innerWidth - padding),
    bottom: position.top + size.height - (window.innerHeight - padding),
    left: padding - position.left,
  };
}

/** 取某一侧的主轴溢出量 */
export function getMainOverflow(overflow: FloatingOverflow, side: PlacementSide): number {
  return side === 'top'
    ? overflow.top
    : side === 'bottom'
      ? overflow.bottom
      : side === 'left'
        ? overflow.left
        : overflow.right;
}

/**
 * 贴边偏移：交叉轴方向把面板挪回视口内，但始终与触发器保持最小交叠。
 *
 * 只动交叉轴、不动主轴，是浮层保持「锚定在触发器上」的关键：
 * 触发器随滚动移出视口时，面板跟着一同滚出，而不是被钳在屏幕边缘、和触发器彻底脱节。
 */
export function shiftCrossAxis(
  position: FloatingPoint,
  size: FloatingSize,
  triggerRect: FloatingRect,
  side: PlacementSide,
  padding: number = FLOATING_VIEWPORT_PADDING,
  minOverlap: number = FLOATING_MIN_OVERLAP,
): FloatingPoint {
  if (side === 'top' || side === 'bottom') {
    const overlap = Math.min(minOverlap, triggerRect.width / 2);
    let left = Math.min(
      Math.max(position.left, padding),
      window.innerWidth - size.width - padding,
    );
    left = Math.min(
      Math.max(left, triggerRect.left + overlap - size.width),
      triggerRect.right - overlap,
    );
    return { top: position.top, left };
  }

  const overlap = Math.min(minOverlap, triggerRect.height / 2);
  let top = Math.min(
    Math.max(position.top, padding),
    window.innerHeight - size.height - padding,
  );
  top = Math.min(
    Math.max(top, triggerRect.top + overlap - size.height),
    triggerRect.bottom - overlap,
  );
  return { top, left: position.left };
}

/**
 * 定位主流程：先按声明方位摆放，主轴放不下时尝试翻转到对侧，最后做交叉轴贴边偏移。
 *
 * 翻转前会先验证对侧真的放得下，对侧同样溢出就维持原方向——
 * 无条件翻转只会把面板推到一个同样糟糕、但方向还变了的位置。
 */
export function resolveFloatingPosition(options: {
  triggerRect: FloatingRect;
  size: FloatingSize;
  side: PlacementSide;
  align: PlacementAlign;
  offset: number;
  /** 主轴放不下时是否允许翻转与贴边；关闭后严格按声明方位摆放 */
  autoAdjustOverflow?: boolean;
  padding?: number;
  minOverlap?: number;
}): { side: PlacementSide; position: FloatingPoint } {
  const {
    triggerRect,
    size,
    align,
    offset,
    autoAdjustOverflow = true,
    padding,
    minOverlap,
  } = options;

  let side = options.side;
  let position = getFloatingPosition(triggerRect, size, side, align, offset);

  if (!autoAdjustOverflow)
    return { side, position };

  const overflow = getFloatingOverflow(position, size, padding);
  if (getMainOverflow(overflow, side) > 0) {
    const flippedSide = FLIP_SIDE[side];
    const flippedPosition = getFloatingPosition(triggerRect, size, flippedSide, align, offset);
    const flippedOverflow = getFloatingOverflow(flippedPosition, size, padding);
    if (getMainOverflow(flippedOverflow, flippedSide) <= 0) {
      side = flippedSide;
      position = flippedPosition;
    }
  }

  return {
    side,
    position: shiftCrossAxis(position, size, triggerRect, side, padding, minOverlap),
  };
}

/**
 * 箭头在交叉轴上的中心坐标，以面板该轴的起点为原点。
 *
 * 默认停在对齐端：start 内缩 inset、end 内缩到 extent - inset，
 * 这样 start / center / end 三档的箭头落点是稳定的三个位置，不随触发器宽度漂移；
 * center 与 pointAtCenter 才让箭头指向触发器中心。
 * 无论走哪条分支都会钳制进 [inset, extent - inset]，面板短到放不下两倍内缩量时退回正中。
 */
export function getArrowCenter(options: {
  /** 面板在交叉轴上的起点坐标 */
  panelStart: number;
  /** 面板在交叉轴上的长度 */
  panelExtent: number;
  /** 触发器在交叉轴上的起点坐标 */
  triggerStart: number;
  /** 触发器在交叉轴上的长度 */
  triggerExtent: number;
  align: PlacementAlign;
  /** 箭头中心距面板端部的最小内缩量，通常是面板圆角加半个箭头底边 */
  inset: number;
  /** 强制指向触发器中心，忽略对齐端 */
  pointAtCenter?: boolean;
}): number {
  const { panelStart, panelExtent, triggerStart, triggerExtent, align, inset, pointAtCenter } = options;
  // 面板过短时两倍内缩量会超过面板长度，钳制上下限倒挂，这里收敛到正中
  const limit = Math.min(inset, panelExtent / 2);
  const ideal
    = pointAtCenter || align === 'center'
      ? triggerStart + triggerExtent / 2 - panelStart
      : align === 'start'
        ? limit
        : panelExtent - limit;

  return Math.min(Math.max(ideal, limit), panelExtent - limit);
}
