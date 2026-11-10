/**
 * 字符生物的步态数学：螃蟹八条腿的两段式反向运动学，以及豹子奔跑的腿部、躯干起伏与步态时间扭曲。
 *
 * 所有坐标都在字符生物 SVG 的 viewBox（336 × 224）里，y 轴向下。
 * 角度约定：曲线采样返回的切线角是弧度；形变结果里的 angle 是角度制，直接用于 SVG rotate()。
 */

/** 二维点 */
export interface Point {
  x: number;
  y: number;
}

/** 带方向的点；angle 的单位见各函数说明 */
export interface OrientedPoint extends Point {
  angle: number;
}

/** 豹子的四条腿：fore 前腿 / hind 后腿，near 近侧 / far 远侧 */
export type LeopardLegName = "fore-near" | "fore-far" | "hind-near" | "hind-far";

/** 豹腿上一点的绑定：静止姿态下离该点最近的中心线采样 */
export interface LeopardLegBinding {
  /** 到最近采样点的距离平方 */
  distance: number;
  /** 最近采样点在腿链曲线上的参数，0 为髋、1 为脚尖 */
  u: number;
  /** 该点沿曲线法线方向的偏移 */
  offset: number;
  /** 绑定时最近采样点处的切线角（弧度） */
  angle: number;
}

const TAU = Math.PI * 2;

/* ── 螃蟹 ─────────────────────────────────────────────────────────── */

/** 螃蟹步态周期（秒） */
export const CRAB_GAIT_CYCLE = 0.58;

/** 螃蟹八条腿在 SVG 里的 class 名：0–3 在左侧，4–7 在右侧 */
export const CRAB_LEG_KEYS: readonly string[] = Array.from({ length: 8 }, (_, index) => `crab-leg-${index}`);

/**
 * 螃蟹第 index 条腿在给定相位下的三个关节：[髋, 膝, 脚尖]。
 *
 * 两段式反向运动学：髋固定，脚尖目标在静止落脚点附近画一段弧（前后摆幅 12，只向上抬、最多 11）；
 * 大小腿长度取静止姿态下的长度，用余弦定理求出膝盖的两个候选位置，取离静止膝盖更近的那个，
 * 保证膝盖始终朝外弯。相邻两条腿相差半个周期，左右两侧再错开半个周期，形成交替步态。
 * @param index 腿序号 0–7
 * @param phase 步态相位，以周期为单位（1 = 一整步）
 */
export function crabLegJoints(index: number, phase = 0): [Point, Point, Point] {
  const side = index < 4 ? -1 : 1;
  const slot = index % 4;
  const hip = { x: 160 + side * (49 - slot * 2), y: 99 + slot * 11 };
  const restKnee = { x: 160 + side * (85 + slot * 4), y: 94 + slot * 20 };
  const restFoot = { x: 160 + side * (111 + slot * 4), y: 128 + slot * 22 };
  const angle = phase * TAU + (slot % 2) * Math.PI + (side > 0 ? Math.PI : 0);
  const target = { x: restFoot.x + Math.sin(angle) * 12, y: restFoot.y - Math.max(0, Math.cos(angle)) * 11 };
  const upper = Math.hypot(restKnee.x - hip.x, restKnee.y - hip.y);
  const lower = Math.hypot(restFoot.x - restKnee.x, restFoot.y - restKnee.y);
  const reachX = target.x - hip.x;
  const reachY = target.y - hip.y;
  // 目标超出两段腿长之和时，腿伸直并朝目标方向尽量够
  const reach = Math.min(upper + lower - 0.01, Math.hypot(reachX, reachY));
  const direction = Math.atan2(reachY, reachX);
  // 膝盖在髋→脚尖连线上的投影距离与离开连线的高度
  const along = (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const height = Math.sqrt(Math.max(0, upper * upper - along * along));
  const knees = [-1, 1].map(sign => ({
    x: hip.x + Math.cos(direction) * along - Math.sin(direction) * height * sign,
    y: hip.y + Math.sin(direction) * along + Math.cos(direction) * height * sign,
  }));
  knees.sort(
    (a, b) =>
      Math.hypot(a.x - restKnee.x, a.y - restKnee.y) - Math.hypot(b.x - restKnee.x, b.y - restKnee.y),
  );
  return [hip, knees[0]!, { x: hip.x + Math.cos(direction) * reach, y: hip.y + Math.sin(direction) * reach }];
}

/** 螃蟹第 index 条腿静止姿态的折线路径（SVG path d） */
export function crabLegPath(index: number): string {
  const [hip, knee, foot] = crabLegJoints(index);
  return `M${hip.x} ${hip.y} L${knee.x} ${knee.y} L${foot.x} ${foot.y}`;
}

/* ── 豹子：腿 ─────────────────────────────────────────────────────── */

/** 前脚相对髋关节的一圈轨迹控制点（闭合曲线，8 个关键姿态） */
const FORE_FOOT_PATH: readonly (readonly [number, number])[] = [
  [30, 62],
  [2, 65],
  [-28, 51],
  [-22, 26],
  [3, 20],
  [45, 14],
  [62, 25],
  [48, 48],
];

/** 后脚相对髋关节的一圈轨迹控制点（闭合曲线，8 个关键姿态） */
const HIND_FOOT_PATH: readonly (readonly [number, number])[] = [
  [24, 30],
  [39, 36],
  [33, 57],
  [5, 62],
  [-31, 51],
  [-54, 28],
  [-34, 21],
  [0, 22],
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 在闭合的控制点环上按相位取点（均匀 Catmull-Rom 样条）。
 * 相位以一圈为 1，自动取模；控制点在相位上等距分布。
 */
function sampleClosedCurve(points: readonly (readonly [number, number])[], phase: number): [number, number] {
  const position = (((phase % 1) + 1) % 1) * points.length;
  const index = Math.floor(position);
  const t = position - index;
  const count = points.length;
  const component = (axis: 0 | 1): number => {
    const p0 = points[(index + count - 1) % count]![axis];
    const p1 = points[index]![axis];
    const p2 = points[(index + 1) % count]![axis];
    const p3 = points[(index + 2) % count]![axis];
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    );
  };
  return [component(0), component(1)];
}

/**
 * 豹子一条腿在给定相位下的四个关节：[髋, 膝, 踝, 脚尖]。
 *
 * - 髋：前腿 (217, 116)，后腿 (123, 119)，远侧腿再往后 7；
 * - 踝：沿该腿的闭合轨迹运动，远侧腿相位提前 0.095，与近侧腿错开；
 * - 膝：两段骨（前腿 34 / 34，后腿 30 / 36）用余弦定理求出，前后腿弯向相反；
 * - 脚掌：长 9，踝离地面（y = 175）越高脚尖越上翘，最多 0.16 弧度。
 * @param leg 腿名
 * @param phase 步态相位，以周期为单位
 */
export function leopardLegJoints(leg: LeopardLegName, phase: number): [Point, Point, Point, Point] {
  const fore = leg.startsWith("fore");
  const far = leg.endsWith("far");
  const hip = { x: (fore ? 217 : 123) - (far ? 7 : 0), y: fore ? 116 : 119 };
  const [footX, footY] = sampleClosedCurve(fore ? FORE_FOOT_PATH : HIND_FOOT_PATH, phase + (far ? 0.095 : 0));
  const upper = fore ? 34 : 30;
  const lower = fore ? 34 : 36;
  // 髋到踝的距离：太近会折叠、太远会拉直，两头都夹住
  const reach = clamp(Math.hypot(footX, footY), 14, upper + lower - 1.2);
  const direction = Math.atan2(footY, footX);
  const bend = (fore ? 1 : -1) * Math.acos(clamp((upper * upper + reach * reach - lower * lower) / (2 * upper * reach), -1, 1));
  const knee = { x: hip.x + Math.cos(direction + bend) * upper, y: hip.y + Math.sin(direction + bend) * upper };
  const ankle = { x: hip.x + Math.cos(direction) * reach, y: hip.y + Math.sin(direction) * reach };
  const lift = clamp((175 - ankle.y) / 40, 0, 1);
  const toeAngle = -0.16 * lift;
  const toe = { x: ankle.x + 9 * Math.cos(toeAngle), y: ankle.y + 9 * Math.sin(toeAngle) };
  return [hip, knee, ankle, toe];
}

/**
 * 沿腿的关节链取点：四个关节连成三段三次 Hermite 曲线，u ∈ [0, 1] 均分到三段。
 * 每段两端的切线方向取相邻关节连线（Catmull-Rom 方向），长度统一为本段弦长，曲线在关节处一阶连续。
 * @returns 位置与切线角（弧度）
 */
export function sampleLegChain(joints: readonly Point[], u: number): OrientedPoint {
  const segment = Math.min(2, Math.floor(u * 3));
  const t = Math.min(1, u * 3 - segment);
  const start = joints[segment]!;
  const end = joints[segment + 1]!;
  const before = joints[Math.max(0, segment - 1)]!;
  const after = joints[Math.min(3, segment + 2)]!;
  const delta = (from: Point, to: Point): Point => ({ x: to.x - from.x, y: to.y - from.y });
  const chord = delta(start, end);
  const chordLength = Math.hypot(chord.x, chord.y);
  const startDirection = segment === 0 ? chord : delta(before, end);
  const endDirection = segment === 2 ? chord : delta(start, after);
  const scaleToChord = (vector: Point): Point => {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: (vector.x / length) * chordLength, y: (vector.y / length) * chordLength };
  };
  const startTangent = scaleToChord(startDirection);
  const endTangent = scaleToChord(endDirection);
  // Hermite 基函数
  const h00 = 2 * t * t * t - 3 * t * t + 1;
  const h10 = t * t * t - 2 * t * t + t;
  const h01 = -2 * t * t * t + 3 * t * t;
  const h11 = t * t * t - t * t;
  const x = h00 * start.x + h10 * startTangent.x + h01 * end.x + h11 * endTangent.x;
  const y = h00 * start.y + h10 * startTangent.y + h01 * end.y + h11 * endTangent.y;
  // 基函数对 t 的导数，用来求切线方向
  const dx =
    (6 * t * t - 6 * t) * start.x +
    (3 * t * t - 4 * t + 1) * startTangent.x +
    (-6 * t * t + 6 * t) * end.x +
    (3 * t * t - 2 * t) * endTangent.x;
  const dy =
    (6 * t * t - 6 * t) * start.y +
    (3 * t * t - 4 * t + 1) * startTangent.y +
    (-6 * t * t + 6 * t) * end.y +
    (3 * t * t - 2 * t) * endTangent.y;
  return { x, y, angle: Math.atan2(dy, dx) };
}

/**
 * 豹腿静止姿态的轮廓路径（SVG path d）：沿关节链中心线取 37 个点，向两侧外扩成闭合形状。
 * 半宽：大腿从 7 收到 4，小腿从 4 收到 3，脚掌恒为 3。
 */
export function leopardLegOutline(leg: LeopardLegName): string {
  const joints = leopardLegJoints(leg, 0);
  const sides: [string[], string[]] = [[], []];
  for (let step = 0; step <= 36; step++) {
    const u = step / 36;
    const sample = sampleLegChain(joints, u);
    const halfWidth = u < 1 / 3 ? 7 - 9 * u : u < 2 / 3 ? 4 - 3 * (u - 1 / 3) : 3;
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1;
      sides[side]!.push(
        `${(sample.x - Math.sin(sample.angle) * halfWidth * sign).toFixed(2)} ${(sample.y + Math.cos(sample.angle) * halfWidth * sign).toFixed(2)}`,
      );
    }
  }
  return `M${[...sides[0], ...sides[1].reverse()].join(" L")} Z`;
}

/**
 * 为静止姿态下的一点求豹腿绑定：在腿链中心线上均匀取 181 个采样，找离 (x, y) 最近的一个，
 * 记下它的参数、该点的法向偏移和切线角。
 */
export function bindLeopardLeg(leg: LeopardLegName, x: number, y: number): LeopardLegBinding {
  const joints = leopardLegJoints(leg, 0);
  // 初值与原实现一致：只有 distance 为无穷大；其余字段在第一次比较后即被覆盖
  let best: LeopardLegBinding = { distance: Infinity, u: Number.NaN, offset: Number.NaN, angle: Number.NaN };
  for (let step = 0; step <= 180; step++) {
    const u = step / 180;
    const sample = sampleLegChain(joints, u);
    const offsetX = x - sample.x;
    const offsetY = y - sample.y;
    const distance = offsetX * offsetX + offsetY * offsetY;
    if (distance < best.distance) {
      best = {
        distance,
        u,
        offset: -offsetX * Math.sin(sample.angle) + offsetY * Math.cos(sample.angle),
        angle: sample.angle,
      };
    }
  }
  return best;
}

/**
 * 求绑定点在当前腿姿态下的位置：回到绑定参数处的曲线点，沿法线放回原偏移。
 * @returns 位置与相对静止姿态的转角（角度制）
 */
export function deformLeopardLeg(joints: readonly Point[], binding: LeopardLegBinding): OrientedPoint {
  const sample = sampleLegChain(joints, binding.u);
  return {
    x: sample.x - Math.sin(sample.angle) * binding.offset,
    y: sample.y + Math.cos(sample.angle) * binding.offset,
    angle: (Math.atan2(Math.sin(sample.angle - binding.angle), Math.cos(sample.angle - binding.angle)) * 180) / Math.PI,
  };
}

/* ── 豹子：步态节奏与躯干 ─────────────────────────────────────────── */

/** 豹子奔跑一步的周期（秒） */
export const LEOPARD_GAIT_CYCLE = 1.2;

/** 8 个关键姿态在一个周期内出现的时刻（周期为 1），首尾相接 */
const GAIT_KEY_TIMES = [0, 0.115, 0.24, 0.36, 0.47, 0.585, 0.735, 0.885, 1];

/** 每段的「相位 / 时间」斜率：每段推进 1/8 相位 */
const GAIT_SEGMENT_SLOPES = GAIT_KEY_TIMES.slice(1).map((time, index) => 0.125 / (time - GAIT_KEY_TIMES[index]!));

/** 各关键时刻的切线：取前后两段斜率的调和平均（首尾环绕），保证插值单调 */
const GAIT_KEY_TANGENTS = GAIT_KEY_TIMES.map((_, index) => {
  const previous = GAIT_SEGMENT_SLOPES[(index + 7) % 8]!;
  const next = GAIT_SEGMENT_SLOPES[index % 8]!;
  return (2 * previous * next) / (previous + next);
});

/**
 * 步态时间扭曲：把匀速流逝的时间映射为步态相位。
 * 8 个关键姿态在相位上等分，但在时间上不等分（见 GAIT_KEY_TIMES），
 * 用单调三次 Hermite 插值连接，让腾空段和着地段的节奏快慢不同。
 * @param time 以周期为单位的时间，自动取模
 * @returns 0–1 的步态相位
 */
export function leopardGaitPhase(time: number): number {
  const wrapped = ((time % 1) + 1) % 1;
  let segment = 0;
  while (segment < 7 && wrapped >= GAIT_KEY_TIMES[segment + 1]!) segment++;
  const span = GAIT_KEY_TIMES[segment + 1]! - GAIT_KEY_TIMES[segment]!;
  const t = (wrapped - GAIT_KEY_TIMES[segment]!) / span;
  return (
    ((2 * t * t * t - 3 * t * t + 1) * segment) / 8 +
    (t * t * t - 2 * t * t + t) * span * GAIT_KEY_TANGENTS[segment]! +
    ((-2 * t * t * t + 3 * t * t) * (segment + 1)) / 8 +
    (t * t * t - t * t) * span * GAIT_KEY_TANGENTS[segment + 1]!
  );
}

/** 躯干随步态的起伏：每项为 [竖直位移, 俯仰角（角度制）]，8 个关键姿态 */
const BODY_SWAY: readonly (readonly [number, number])[] = [
  [0, 0],
  [3, 1],
  [2, 2],
  [0, 0],
  [-3, -2],
  [-6, -2],
  [-5, -1],
  [-2, 0],
];

/** 豹子身体在给定步态相位下的 SVG transform：上下起伏，并绕 (165, 110) 俯仰 */
export function leopardBodyTransform(phase: number): string {
  const [offsetY, pitch] = sampleClosedCurve(BODY_SWAY, phase);
  return `translate(0 ${offsetY.toFixed(3)}) rotate(${pitch.toFixed(3)} 165 110)`;
}
