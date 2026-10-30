/** 浮层箭头短边固定 7px，长边为短边的 2.5 倍。 */
export const FLOATING_ARROW_DEPTH = 7;
export const FLOATING_ARROW_LENGTH = 17.5;

/** 共用参考 SVG 的圆润轮廓，遮罩随盒子拉伸，底色仍由 ui.arrow 覆盖。 */
export const floatingArrowSides = {
  top: "w-[17.5px] h-[7px] mask-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2080%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M%200%2060%20C%200%2054%206%2050%2015%2045%20C%2035%2034%2049%2019%2058%205%20Q%2061%200%2067%200%20L%2080%200%20L%2080%20120%20L%2067%20120%20Q%2061%20120%2058%20115%20C%2049%20101%2035%2086%2015%2075%20C%206%2070%200%2066%200%2060%20Z%22%20transform%3D%22translate(0%2080)%20rotate(-90)%22%2F%3E%3C%2Fsvg%3E')]",
  bottom: "w-[17.5px] h-[7px] mask-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20120%2080%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M%200%2060%20C%200%2054%206%2050%2015%2045%20C%2035%2034%2049%2019%2058%205%20Q%2061%200%2067%200%20L%2080%200%20L%2080%20120%20L%2067%20120%20Q%2061%20120%2058%20115%20C%2049%20101%2035%2086%2015%2075%20C%206%2070%200%2066%200%2060%20Z%22%20transform%3D%22translate(120%200)%20rotate(90)%22%2F%3E%3C%2Fsvg%3E')]",
  left: "w-[7px] h-[17.5px] mask-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2080%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M%200%2060%20C%200%2054%206%2050%2015%2045%20C%2035%2034%2049%2019%2058%205%20Q%2061%200%2067%200%20L%2080%200%20L%2080%20120%20L%2067%20120%20Q%2061%20120%2058%20115%20C%2049%20101%2035%2086%2015%2075%20C%206%2070%200%2066%200%2060%20Z%22%20transform%3D%22translate(80%200)%20scale(-1%201)%22%2F%3E%3C%2Fsvg%3E')]",
  right: "w-[7px] h-[17.5px] mask-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2080%20120%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M%200%2060%20C%200%2054%206%2050%2015%2045%20C%2035%2034%2049%2019%2058%205%20Q%2061%200%2067%200%20L%2080%200%20L%2080%20120%20L%2067%20120%20Q%2061%20120%2058%20115%20C%2049%20101%2035%2086%2015%2075%20C%206%2070%200%2066%200%2060%20Z%22%20transform%3D%22%22%2F%3E%3C%2Fsvg%3E')]",
} as const;

/** 把面板外阴影转成沿箭头曲线投射的阴影，忽略透明占位层与内阴影。 */
export function getFloatingArrowShadow(panelShadow: string): string {
  const shadows = panelShadow.split(/,(?![^()]*\))/).flatMap((layer) => {
    if (/\binset\b/.test(layer)) return [];
    const color = layer.match(/[a-z-]+\([^)]*\)|#[\da-f]{3,8}\b|\btransparent\b/i)?.[0] ?? '';
    if (/transparent|[,/]\s*0\s*\)$/i.test(color)) return [];
    const lengths = layer.replace(color, '').match(/-?(?:\d+(?:\.\d+)?|\.\d+)px/g)?.map(Number.parseFloat);
    if (!lengths || lengths.length < 2) return [];
    const [x = 0, y = 0, blur = 0] = lengths;
    // drop-shadow 的模糊值为标准差，取 box-shadow 模糊半径的一半。
    return [`drop-shadow(${x}px ${y}px ${blur / 2}px ${color})`];
  });
  return shadows.join(' ') || 'none';
}
