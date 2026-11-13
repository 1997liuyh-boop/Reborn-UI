/**
 * 组件目录场景的分类转场：六种，每次切换轮换一种
 * 每种包含新分类的露出形状、旧卡片离场、新卡片入场，函数只把进度换算成样式字符串
 */

/** 画框尺寸 */
export interface TransitionBox {
  width: number;
  height: number;
}

/** 卡片在网格里的位置 */
export interface CardGeometry {
  /** 序号 */
  index: number;
  /** 所在列，0 ~ 2 */
  col: number;
  /** 所在行 */
  row: number;
  /** 相对窗口中心的水平偏移（px） */
  dx: number;
  /** 相对窗口中心的垂直偏移（px） */
  dy: number;
  /** 离中心的相对距离，0 ~ 1 */
  spread: number;
}

/** 卡片位姿 */
export interface CardPose {
  transform: string;
  opacity: number;
}

export interface CatalogTransition {
  /** 名称，便于调试 */
  name: string;
  /** 新分类的露出形状 */
  reveal: (p: number, box: TransitionBox) => string;
  /** 主色环形状 */
  ring: (p: number, box: TransitionBox) => string;
  /** 旧卡片离场 */
  exit: (e: number, card: CardGeometry) => CardPose;
  /** 离场延迟占比 */
  exitDelay: (card: CardGeometry) => number;
  /** 新卡片入场 */
  enter: (t: number, card: CardGeometry) => CardPose;
  /** 入场延迟占比 */
  enterDelay: (card: CardGeometry) => number;
}

const px = (value: number) => `${value.toFixed(1)}px`;
const deg = (value: number) => `${value.toFixed(2)}deg`;

/** 入场透明度，前半程到 1 */
const fadeIn = (t: number) => Math.min(1, t * 1.8);

/** 回弹缓出 */
function backOut(t: number) {
  const s = 1.7;
  return 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
}

/** 按列取值 */
const byCol = (card: CardGeometry, values: [number, number, number]) => values[card.col] ?? 0;

export const CATALOG_TRANSITIONS: readonly CatalogTransition[] = [
  {
    // 圆心扩散：旧卡片带转角下落，新卡片自下升起
    name: "圆心扩散",
    reveal: (p, box) => `circle(${px(p * (Math.hypot(box.width, box.height) / 2 + 2))} at 50% 50%)`,
    ring: (p, box) => `circle(${px(p * (Math.hypot(box.width, box.height) / 2 + 2) + 12)} at 50% 50%)`,
    exit: (e, card) => ({
      transform: `translate3d(${px(e * byCol(card, [-24, 4, -56]))}, ${px(e * 360)}, 0) rotate(${deg(e * byCol(card, [-12, 7, -10]))})`,
      opacity: 1 - Math.max(0, e - 0.7) / 0.3,
    }),
    exitDelay: card => card.col * 0.07,
    enter: (t, _card) => ({
      transform: `translate3d(0, ${px((1 - t) * 120)}, 0) scale(${(1 - (1 - t) * 0.08).toFixed(4)})`,
      opacity: fadeIn(t),
    }),
    enterDelay: card => Math.min(0.3, card.index * 0.05),
  },
  {
    // 方框撑开：旧卡片向四周散开，新卡片向中心聚拢
    name: "方框撑开",
    reveal: (p, box) => `inset(${px(((1 - p) * box.height) / 2)} ${px(((1 - p) * box.width) / 2)} round 20px)`,
    ring: (p, box) =>
      `inset(${px(Math.max(0, ((1 - p) * box.height) / 2 - 12))} ${px(Math.max(0, ((1 - p) * box.width) / 2 - 12))} round 26px)`,
    exit: (e, card) => ({
      transform: `translate3d(${px(card.dx * 0.55 * e)}, ${px(card.dy * 0.55 * e)}, 0) scale(${(1 - 0.25 * e).toFixed(4)})`,
      opacity: 1 - e,
    }),
    exitDelay: card => (1 - card.spread) * 0.15,
    enter: (t, card) => ({
      transform: `translate3d(${px(-card.dx * 0.6 * (1 - t))}, ${px(-card.dy * 0.6 * (1 - t))}, 0) scale(${(0.55 + 0.45 * t).toFixed(4)})`,
      opacity: fadeIn(t),
    }),
    enterDelay: card => card.spread * 0.25,
  },
  {
    // 横向擦入：旧卡片右移，新卡片从左滑入
    name: "横向擦入",
    reveal: (p, box) => `inset(0 ${px((1 - p) * box.width)} 0 0)`,
    ring: (p, box) => `inset(0 ${px(Math.max(0, (1 - p) * box.width - 14))} 0 0)`,
    exit: (e, card) => ({
      transform: `translate3d(${px(e * (260 + card.col * 40))}, 0, 0) rotate(${deg(e * 6)})`,
      opacity: 1 - e * 0.9,
    }),
    exitDelay: card => card.col * 0.07,
    // 越靠右的列滑得越远
    enter: (t, card) => ({
      transform: `translate3d(${px(-(1 - t) * (180 + card.col * 50))}, 0, 0) rotate(${deg(-(1 - t) * 6)})`,
      opacity: fadeIn(t),
    }),
    enterDelay: card => Math.min(0.3, card.col * 0.06 + card.row * 0.03),
  },
  {
    // 角落扩散：旧卡片后翻，新卡片从上方落下
    name: "角落扩散",
    reveal: (p, box) => `circle(${px(p * (Math.hypot(box.width, box.height) + 2))} at 100% 100%)`,
    ring: (p, box) => `circle(${px(p * (Math.hypot(box.width, box.height) + 2) + 14)} at 100% 100%)`,
    exit: (e, _card) => ({
      transform: `perspective(900px) translate3d(0, ${px(-e * 60)}, 0) rotateX(${deg(e * 65)})`,
      opacity: 1 - e,
    }),
    exitDelay: card => (2 - card.col) * 0.06,
    enter: (t, card) => ({
      transform: `translate3d(0, ${px(-(1 - t) * 140)}, 0) rotate(${deg((1 - t) * byCol(card, [-8, 5, -6]))})`,
      opacity: fadeIn(t),
    }),
    enterDelay: card => Math.min(0.3, (2 - card.col) * 0.05 + card.row * 0.04),
  },
  {
    // 菱形展开：旧卡片旋转缩小，新卡片回弹放大
    name: "菱形展开",
    reveal: (p, box) => diamond(p * (box.width / 2 + box.height / 2 + 2), box),
    ring: (p, box) => diamond(p * (box.width / 2 + box.height / 2 + 2) + 17, box),
    exit: (e, card) => ({
      transform: `scale(${(1 - 0.6 * e).toFixed(4)}) rotate(${deg(e * byCol(card, [-20, 12, 20]))})`,
      opacity: 1 - e,
    }),
    exitDelay: () => 0,
    enter: (t, card) => ({
      transform: `scale(${(0.4 + 0.6 * backOut(t)).toFixed(4)}) rotate(${deg((1 - t) * byCol(card, [12, -10, 8]))})`,
      opacity: Math.min(1, t * 2),
    }),
    enterDelay: card => Math.min(0.3, card.index * 0.045),
  },
  {
    // 中缝拉开：两侧列外推、中列下沉，新卡片翻转进入
    name: "中缝拉开",
    reveal: (p, box) => `inset(0 ${px(((1 - p) * box.width) / 2)})`,
    ring: (p, box) => `inset(0 ${px(Math.max(0, ((1 - p) * box.width) / 2 - 14))})`,
    exit: (e, card) => ({
      transform: `translate3d(${px(e * byCol(card, [-220, 0, 220]))}, ${px(e * byCol(card, [0, 300, 0]))}, 0) rotate(${deg(e * byCol(card, [-8, 0, 8]))})`,
      opacity: 1 - e * 0.8,
    }),
    exitDelay: card => Math.abs(card.col - 1) * 0.08,
    enter: (t, card) => ({
      transform:
        card.col === 1
          ? `perspective(900px) rotateX(${deg((1 - t) * 70)})`
          : `perspective(900px) rotateY(${deg((1 - t) * (card.col === 0 ? -75 : 75))})`,
      opacity: fadeIn(t),
    }),
    enterDelay: card => Math.min(0.3, Math.abs(card.col - 1) * 0.08 + card.row * 0.03),
  },
];

/** 以画框中心为圆心的菱形 */
function diamond(r: number, box: TransitionBox) {
  const cx = box.width / 2;
  const cy = box.height / 2;
  return `polygon(${px(cx)} ${px(cy - r)}, ${px(cx + r)} ${px(cy)}, ${px(cx)} ${px(cy + r)}, ${px(cx - r)} ${px(cy)})`;
}

/** 切入第 categoryIndex 个分类时使用的转场，第一次切换为圆心扩散 */
export function transitionFor(categoryIndex: number, offset = 0) {
  const count = CATALOG_TRANSITIONS.length;
  return CATALOG_TRANSITIONS[(((categoryIndex - 1 + offset) % count) + count) % count]!;
}
