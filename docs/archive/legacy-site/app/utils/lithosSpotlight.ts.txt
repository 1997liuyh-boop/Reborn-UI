interface SpotlightBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 使用实时容器边界换算坐标，兼容滚动、触摸和窗口缩放。 */
export function getSpotlightPosition(clientX: number, clientY: number, bounds: SpotlightBounds) {
  return {
    x: Math.max(0, Math.min(bounds.width, clientX - bounds.left)),
    y: Math.max(0, Math.min(bounds.height, clientY - bounds.top)),
  };
}
