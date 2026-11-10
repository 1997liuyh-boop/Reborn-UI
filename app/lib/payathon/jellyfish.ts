/**
 * 首页首屏 ASCII 水母场景（暗色版）
 *
 * 移植自原站的 payathon-jellyfish-dark 模块（压缩产物，无外部依赖）。场景分三层：
 * 1. 水面层：上千个「≈」字符组成的水波粒子，优先用 WebGL 点精灵绘制，WebGL 不可用时退回 SVG 文本；
 * 2. 生物层：水母，以及轮流登场的海龟、螃蟹、珍珠贝、海豚，全部由 ASCII 字符与短线拼成，用 SVG 绘制；
 * 3. 交互层：指针排开字符、水母喷射留下尾迹、标题文字等避让区域把水面推开、两只生物相撞时互相让位。
 *
 * 所有数值、颜色、时序、着色器与算法都与原实现逐项对应；浮点运算也保持原有的运算顺序，
 * 修改前请先对照原文件，避免「顺手化简」带来肉眼难辨的偏差。
 */

/* eslint-disable prefer-exponentiation-operator -- 原实现在这些位置写的是 Math.pow（另一些位置写的是 **），逐处保留以便与原文件逐行对照 */

// ═════════════════════════════ 对外类型 ═════════════════════════════

/** 场景配色；挂载时通过 onPalette 回调告知调用方 */
export interface JellyfishPalette {
  /** 场景底色 */
  background: string;
  /** 水母伞盖与生物轮廓线的颜色 */
  bell: string;
  /** 触手与生物肢体的颜色 */
  tentacle: string;
  /** 点缀色：伞顶的星号、生物身上的数字 */
  accent: string;
  /** 水面字符静止时的颜色 */
  water: string;
  /** 水面字符被激起时的高亮色 */
  waterActive: string;
}

/** 避让区域：中心点加半宽、半高描述的矩形，坐标为场景 SVG 的 viewBox 坐标 */
export interface AvoidanceArea {
  x: number;
  y: number;
  /** 半宽 */
  hw: number;
  /** 半高 */
  hh: number;
}

/** mountJellyfish 的配置 */
export interface JellyfishOptions {
  /** 配色序号；不是 0~11 之间的整数时随机挑一套 */
  paletteIndex?: number;
  /** 需要让水面字符绕开的元素（如首屏标题），按文字实际排版出的行框计算避让区域 */
  avoidElements?: Iterable<Element>;
  /** 开场结束（场景时间走到 2.8 秒，或系统开启了「减少动态效果」）时回调一次 */
  onIntroComplete?: () => void;
  /** 挂载时回调一次，告知最终选用的配色 */
  onPalette?: (palette: JellyfishPalette) => void;
}

/** mountJellyfish 返回的控制器 */
export interface JellyfishController {
  /** 暂停动画并清空指针状态，用于区块离开视口或弹窗打开时 */
  pause: () => void;
  /** 恢复动画，同时重新测量容器尺寸与避让区域 */
  resume: () => void;
  /** 替换需要避让的元素，并重新监听它们的尺寸变化 */
  setAvoidElements: (elements: Iterable<Element>) => void;
  /** 重新测量容器与避让区域（避让元素在做位移动画时需要逐帧调用） */
  refreshAvoidance: () => void;
  /** 直接指定额外的避让矩形；任一数值非有限或半宽、半高为负时抛错 */
  setAvoidanceAreas: (areas: readonly AvoidanceArea[]) => void;
  /** 销毁场景：停止循环、移除监听、释放 WebGL 上下文并移除创建的 DOM */
  destroy: () => void;
}

// ═════════════════════════════ 内部类型 ═════════════════════════════

interface Point {
  x: number;
  y: number;
}

/** 字形上的短线：角度（弧度）与长度；带短线的字形绘制成 SVG line 而不是文字 */
interface GlyphLine {
  angle: number;
  length: number;
}

/** 一个待绘制的生物字形 */
interface Glyph {
  x: number;
  y: number;
  char: string;
  /** 角色色（见 ROLE_*），绘制时再映射到真实配色 */
  color: string;
  alpha: number;
  size: number;
  line?: GlyphLine;
  /** 珍珠贝退场时闪烁成方块 */
  exitBlock?: boolean;
}

/** 进入场景管线后的生物字形 */
interface SceneGlyph extends Glyph {
  /** 所属生物的槽位号 */
  subject: number;
  /** 槽位上第几代生物，换代时用来重置开场与故障效果 */
  incarnation: number;
  /** 正在与另一只生物接触 */
  creatureContact?: boolean;
  /** 刚开始接触的一小段时间内显示为方块 */
  contactBlock?: boolean;
  /** 已被指针明显推开 */
  displaced?: boolean;
}

/** 水面字形（交给 WebGL 或 SVG 文本绘制） */
interface WaterGlyph {
  x: number;
  y: number;
  char: string;
  size: number;
  /** rgb(r,g,b) 形式的颜色 */
  color: string;
  alpha: number;
}

/** 场景可视范围（viewBox 坐标） */
interface Viewport {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  /** 纵深目标：首屏「马上开始」黑洞按钮的中心；存在时水面改为向它汇聚的隧道效果 */
  depthTarget?: Point;
}

/** 指针位置与排开半径 */
interface Pointer {
  x: number;
  y: number;
  radius: number;
}

/** 水母绘制区域：裁剪边界、伞盖中心 cx、伞缘高度 lip 与倾角 tilt */
interface JellyBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  cx: number;
  lip?: number;
  tilt?: number;
}

/** 水母喷射留下的尾迹 */
interface Wake {
  x: number;
  y: number;
  time: number;
  power: number;
  /** 喷射瞬间水母各行的包围盒，用于激亮周围的水面 */
  footprint: AvoidanceArea[];
}

/** 场景参数（沿用原站调参面板的字段） */
interface SceneSettings {
  /** 动作平滑度：0 按 fps 逐帧跳变（保留 ASCII 动画的顿挫感），1 完全连续 */
  smoothMotion: number;
  /** 是否绘制水面 */
  oceanEnabled: number;
  /** 水面字符的基准间距 */
  oceanSpacing: number;
  /** 水流速度倍率 */
  oceanSpeed: number;
  /** 水面字符静止时的不透明度（百分比） */
  oceanOpacity: number;
  /** 气泡个数 */
  bubbleCount: number;
  /** 气泡半径 */
  bubbleSize: number;
  /** 气泡上浮速度 */
  bubbleSpeed: number;
  /** 尾迹推力 */
  wakeStrength: number;
  /** 尾迹影响半径 */
  wakeRadius: number;
  /** 尾迹存续时间（秒） */
  wakeLife: number;
  /** 生物整体缩放（百分比，50 为基准尺寸） */
  objectScale: number;
  /** 场景时间流速 */
  speed: number;
  /** 水母动作的量化帧率 */
  fps: number;
  /** 一个脉冲周期里蓄力段所占的百分比 */
  charge: number;
  /** 每个脉冲上浮的行数 */
  travel: number;
  /** 左右摇摆幅度 */
  sway: number;
  /** 伞盖跟随指针偏移的程度 */
  follow: number;
  /** 伞盖宽度（字符数） */
  bellWidth: number;
  /** 伞盖高度（行数） */
  bellHeight: number;
  /** 喷射时伞盖收缩的百分比 */
  contraction: number;
  /** 蓄力时伞盖被压扁的百分比 */
  chargeFlatten: number;
  /** 触手根数 */
  tentacles: number;
  /** 触手长度（行数） */
  length: number;
  /** 喷射时触手的额外拉伸 */
  stretch: number;
  /** 触手张开幅度 */
  spread: number;
  /** 触手卷曲幅度 */
  curl: number;
  /** 字号 */
  fontSize: number;
  /** 「横条」水面样式的条高（本场景使用字符样式） */
  barHeight: number;
  /** 「横条」水面样式的圆角（本模块未使用） */
  barRadius: number;
  /** 调参面板的辅助线开关（本模块未使用） */
  guides: number;
  /** 水面字符回到原位的速度 */
  refillSpeed: number;
  /** 指针排开字符的半径 */
  mouseRadius: number;
  /** 喷射瞬间激亮水面的范围 */
  tintRadius: number;
  /** 喷射瞬间激亮水面的强度 */
  tintStrength: number;
  /** 是否为暗色背景 */
  darkBackground: number;
  /** 配色序号 */
  paletteIndex: number;
  /** 未指定配色时是否随机挑选 */
  randomPalette: number;
  /** 同屏生物的槽位数 */
  jellyCount: number;
  /** 水母游动时的最大倾角（度） */
  swimTilt: number;
  /** 水母是否追着指针游 */
  seekMouse: number;
  /** 每个脉冲最多转向的角度（度） */
  aimTurn: number;
  /** 调参面板的标题开关（本模块未使用） */
  titleEnabled: number;
}

/** 水面绘制样式：字符「≈」或横条「━」 */
type OceanMode = "characters" | "bars";

/** 会轮流登场的非水母生物 */
type CreatureSpecies = "turtle" | "crab" | "pearl" | "dolphin" | "leopard";

type Species = "jellyfish" | CreatureSpecies;

// ═════════════════════════════ 通用常量与小工具 ═════════════════════════════

const TAU = Math.PI * 2;

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * 生物字形的「角色色」。生成字形时先用这三个占位色标记角色，绘制时再映射到当前配色；
 * 水面避让、尾迹检测、指针排开的配对也都靠它们区分伞盖、触手与点缀。
 */
const ROLE_BELL = "#308cff";
const ROLE_TENTACLE = "#46c933";
const ROLE_ACCENT = "#ff8300";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function point(x: number, y: number): Point {
  return { x, y };
}

/** 平滑阶梯 3t² - 2t³，输入先截到 [0, 1] */
function smoothstep(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

/** 绕原点旋转向量 */
function rotate(x: number, y: number, angle: number): Point {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

/** 绕指定中心旋转点 */
function rotateAround(x: number, y: number, angle: number, cx: number, cy: number): Point {
  return {
    x: cx + (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle),
    y: cy + (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle),
  };
}

/**
 * 闭合 Catmull-Rom 曲线采样：t 取小数部分，在首尾相接的控制点之间平滑插值。
 * 用于豹子足端轨迹与身体起伏。
 */
function sampleLoop(points: readonly (readonly [number, number])[], t: number): [number, number] {
  const position = (((t % 1) + 1) % 1) * points.length;
  const index = Math.floor(position);
  const s = position - index;
  const count = points.length;
  const axis = (k: 0 | 1): number => {
    const p0 = points[(index + count - 1) % count]![k];
    const p1 = points[index]![k];
    const p2 = points[(index + 1) % count]![k];
    const p3 = points[(index + 2) % count]![k];
    return (
      0.5
      * (2 * p1
        + (-p0 + p2) * s
        + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s
        + (-p0 + 3 * p1 - 3 * p2 + p3) * s * s * s)
    );
  };
  return [axis(0), axis(1)];
}

/** 由一串关节点生成首尾相接的线段 */
interface Segment {
  a: Point;
  b: Point;
  angle: number;
  length: number;
}

function makeSegment(a: Point, b: Point): Segment {
  return {
    a,
    b,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    length: Math.hypot(b.x - a.x, b.y - a.y),
  };
}

function chain(points: readonly Point[]): Segment[] {
  return points.slice(1).map((next, index) => makeSegment(points[index]!, next));
}

/** 伪随机哈希：同一输入恒得同一个 [0, 1) 的值，用来给粒子、气泡分配稳定的随机属性 */
function hash01(seed: number): number {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
}

/** 结果恒为非负的取模 */
function positiveMod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** 网格键：把整数格坐标压成一个数作为 Map 的键 */
function gridKey(cx: number, cy: number): number {
  return (cx + 1e3) * 4096 + cy + 1e3;
}

// ═════════════════════════════ 螃蟹：腿部反向运动学 ═════════════════════════════

/** 螃蟹一个步态周期的时长（秒） */
const CRAB_GAIT_PERIOD = 0.58;

/** 螃蟹八条腿的部位名，绑定骨骼时按名字匹配 */
const CRAB_LEG_KEYS = Array.from({ length: 8 }, (_, index) => `crab-leg-${index}`);

/**
 * 螃蟹第 index 条腿的三个关节（髋、膝、足）。
 * 足端沿一个半圆抬脚轨迹运动，两段腿长固定，用两圆求交解出膝关节，取靠近静止膝位的那一解。
 * 左右两侧、相邻两条腿各差半个周期，形成交替步态。
 */
function crabLegJoints(index: number, phase = 0): [Point, Point, Point] {
  const side = index < 4 ? -1 : 1;
  const row = index % 4;
  const hip = { x: 160 + side * (49 - row * 2), y: 99 + row * 11 };
  const knee = { x: 160 + side * (85 + row * 4), y: 94 + row * 20 };
  const foot = { x: 160 + side * (111 + row * 4), y: 128 + row * 22 };
  const angle = phase * TAU + (row % 2) * Math.PI + (side > 0 ? Math.PI : 0);
  const target = { x: foot.x + Math.sin(angle) * 12, y: foot.y - Math.max(0, Math.cos(angle)) * 11 };
  const thigh = Math.hypot(knee.x - hip.x, knee.y - hip.y);
  const shin = Math.hypot(foot.x - knee.x, foot.y - knee.y);
  const dx = target.x - hip.x;
  const dy = target.y - hip.y;
  // 足端够不着时把腿伸直（留 0.01 余量避免 acos 越界）
  const reach = Math.min(thigh + shin - 0.01, Math.hypot(dx, dy));
  const heading = Math.atan2(dy, dx);
  const along = (thigh * thigh - shin * shin + reach * reach) / (2 * reach);
  const lift = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  const candidates = [-1, 1].map(sign => ({
    x: hip.x + Math.cos(heading) * along - Math.sin(heading) * lift * sign,
    y: hip.y + Math.sin(heading) * along + Math.cos(heading) * lift * sign,
  }));
  candidates.sort(
    (a, b) => Math.hypot(a.x - knee.x, a.y - knee.y) - Math.hypot(b.x - knee.x, b.y - knee.y),
  );
  return [hip, candidates[0]!, { x: hip.x + Math.cos(heading) * reach, y: hip.y + Math.sin(heading) * reach }];
}

/** 螃蟹腿在静止姿态下的折线路径 */
function crabLegPath(index: number): string {
  const [hip, knee, foot] = crabLegJoints(index);
  return `M${hip.x} ${hip.y} L${knee.x} ${knee.y} L${foot.x} ${foot.y}`;
}

// ═════════════════════════════ 豹子：腿部与步态 ═════════════════════════════

type LeopardLegKey = "fore-near" | "fore-far" | "hind-near" | "hind-far";

const LEOPARD_LEG_KEYS: LeopardLegKey[] = ["fore-near", "fore-far", "hind-near", "hind-far"];

/** 豹子的一条腿：髋、膝、踝、趾四个关节 */
type LegJoints = readonly Point[];

/** 前腿足端相对髋关节的轨迹控制点（闭合曲线） */
const FORE_FOOT_LOOP: (readonly [number, number])[] = [
  [30, 62],
  [2, 65],
  [-28, 51],
  [-22, 26],
  [3, 20],
  [45, 14],
  [62, 25],
  [48, 48],
];

/** 后腿足端相对髋关节的轨迹控制点（闭合曲线） */
const HIND_FOOT_LOOP: (readonly [number, number])[] = [
  [24, 30],
  [39, 36],
  [33, 57],
  [5, 62],
  [-31, 51],
  [-54, 28],
  [-34, 21],
  [0, 22],
];

/**
 * 豹子某条腿在步态相位 phase 下的四个关节。
 * 足端沿闭合轨迹运动，两段腿长用余弦定理解出膝关节（前腿膝朝后、后腿膝朝前），
 * 足端离地越高脚趾越下垂。远侧腿比近侧腿相位提前 0.095。
 */
function leopardLegJoints(key: LeopardLegKey, phase: number): Point[] {
  const fore = key.startsWith("fore");
  const far = key.endsWith("far");
  const hip = { x: (fore ? 217 : 123) - (far ? 7 : 0), y: fore ? 116 : 119 };
  const [footX, footY] = sampleLoop(fore ? FORE_FOOT_LOOP : HIND_FOOT_LOOP, phase + (far ? 0.095 : 0));
  const upper = fore ? 34 : 30;
  const lower = fore ? 34 : 36;
  const reach = clamp(Math.hypot(footX, footY), 14, upper + lower - 1.2);
  const heading = Math.atan2(footY, footX);
  const bend
    = (fore ? 1 : -1)
      * Math.acos(clamp((upper * upper + reach * reach - lower * lower) / (2 * upper * reach), -1, 1));
  const knee = { x: hip.x + Math.cos(heading + bend) * upper, y: hip.y + Math.sin(heading + bend) * upper };
  const ankle = { x: hip.x + Math.cos(heading) * reach, y: hip.y + Math.sin(heading) * reach };
  const raised = clamp((175 - ankle.y) / 40, 0, 1);
  const toeAngle = -0.16 * raised;
  const toe = { x: ankle.x + 9 * Math.cos(toeAngle), y: ankle.y + 9 * Math.sin(toeAngle) };
  return [hip, knee, ankle, toe];
}

/** 腿上的一个采样点：位置与切线角 */
interface LegSample {
  x: number;
  y: number;
  angle: number;
}

/**
 * 沿四个关节构成的三段腿做 Hermite 插值，u ∈ [0, 1] 覆盖整条腿。
 * 段内切线取相邻关节连线方向、长度归一到本段弦长，端点段退化为弦本身。
 */
function sampleLegCurve(joints: LegJoints, u: number): LegSample {
  const segment = Math.min(2, Math.floor(u * 3));
  const s = Math.min(1, u * 3 - segment);
  const start = joints[segment]!;
  const end = joints[segment + 1]!;
  const before = joints[Math.max(0, segment - 1)]!;
  const after = joints[Math.min(3, segment + 2)]!;
  const delta = (from: Point, to: Point): Point => ({ x: to.x - from.x, y: to.y - from.y });
  const chord = delta(start, end);
  const chordLength = Math.hypot(chord.x, chord.y);
  const startDirection = segment === 0 ? chord : delta(before, end);
  const endDirection = segment === 2 ? chord : delta(start, after);
  const fitLength = (vector: Point): Point => {
    const length = Math.hypot(vector.x, vector.y) || 1;
    return { x: (vector.x / length) * chordLength, y: (vector.y / length) * chordLength };
  };
  const startTangent = fitLength(startDirection);
  const endTangent = fitLength(endDirection);
  // Hermite 基函数
  const h00 = 2 * s * s * s - 3 * s * s + 1;
  const h10 = s * s * s - 2 * s * s + s;
  const h01 = -2 * s * s * s + 3 * s * s;
  const h11 = s * s * s - s * s;
  const x = h00 * start.x + h10 * startTangent.x + h01 * end.x + h11 * endTangent.x;
  const y = h00 * start.y + h10 * startTangent.y + h01 * end.y + h11 * endTangent.y;
  // 基函数的导数，用于求切线方向
  const dx
    = (6 * s * s - 6 * s) * start.x
      + (3 * s * s - 4 * s + 1) * startTangent.x
      + (-6 * s * s + 6 * s) * end.x
      + (3 * s * s - 2 * s) * endTangent.x;
  const dy
    = (6 * s * s - 6 * s) * start.y
      + (3 * s * s - 4 * s + 1) * startTangent.y
      + (-6 * s * s + 6 * s) * end.y
      + (3 * s * s - 2 * s) * endTangent.y;
  return { x, y, angle: Math.atan2(dy, dx) };
}

/** 豹子腿的轮廓：沿腿中线两侧各偏移一个由粗到细的宽度，围成闭合路径 */
function leopardLegOutline(key: LeopardLegKey): string {
  const joints = leopardLegJoints(key, 0);
  const sides: string[][] = [[], []];
  for (let step = 0; step <= 36; step++) {
    const u = step / 36;
    const sample = sampleLegCurve(joints, u);
    const width = u < 1 / 3 ? 7 - 9 * u : u < 2 / 3 ? 4 - 3 * (u - 1 / 3) : 3;
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1;
      sides[side]!.push(
        `${(sample.x - Math.sin(sample.angle) * width * sign).toFixed(2)} ${(sample.y + Math.cos(sample.angle) * width * sign).toFixed(2)}`,
      );
    }
  }
  return `M${[...sides[0]!, ...sides[1]!.reverse()].join(" L")} Z`;
}

/** 字形相对腿中线的绑定：中线参数 u、法向偏移与当时的切线角 */
interface LegBinding {
  distance: number;
  u: number;
  offset: number;
  angle: number;
}

/** 在静止姿态的腿中线上找离 (x, y) 最近的采样点（180 等分），记下法向偏移 */
function bindLegPoint(key: LeopardLegKey, x: number, y: number): LegBinding {
  const joints = leopardLegJoints(key, 0);
  let best: LegBinding = { distance: Infinity, u: 0, offset: 0, angle: 0 };
  for (let step = 0; step <= 180; step++) {
    const u = step / 180;
    const sample = sampleLegCurve(joints, u);
    const dx = x - sample.x;
    const dy = y - sample.y;
    const distance = dx * dx + dy * dy;
    if (distance < best.distance) {
      best = {
        distance,
        u,
        offset: -dx * Math.sin(sample.angle) + dy * Math.cos(sample.angle),
        angle: sample.angle,
      };
    }
  }
  return best;
}

/** 把绑定在腿上的字形搬到新姿态：同一 u 处、同样的法向偏移，角度返回相对旋转（度） */
function deformLegPoint(joints: LegJoints, binding: LegBinding): RigPose {
  const sample = sampleLegCurve(joints, binding.u);
  return {
    x: sample.x - Math.sin(sample.angle) * binding.offset,
    y: sample.y + Math.cos(sample.angle) * binding.offset,
    angle:
      (Math.atan2(Math.sin(sample.angle - binding.angle), Math.cos(sample.angle - binding.angle)) * 180)
      / Math.PI,
  };
}

/** 豹子步态关键帧：一个周期内 8 个落脚时刻的位置（非均匀分布，模拟奔跑的快慢节奏） */
const LEOPARD_GAIT_KEYS = [0, 0.115, 0.24, 0.36, 0.47, 0.585, 0.735, 0.885, 1];

/** 豹子一个步态周期的时长（秒） */
const LEOPARD_GAIT_PERIOD = 1.2;

/** 豹子水平位移的变速：在匀速前进上叠加一个小正弦，让步幅有蹬地与腾空的快慢 */
function leopardStrideWarp(t: number): number {
  const offset = 0.1;
  return t - (0.06 / TAU) * (Math.sin(TAU * (t - offset)) - Math.sin(-TAU * offset));
}

/** 每段关键帧的平均斜率 */
const LEOPARD_GAIT_SLOPES = LEOPARD_GAIT_KEYS.slice(1).map((key, index) => 0.125 / (key - LEOPARD_GAIT_KEYS[index]!));

/** 关键帧处的切线：相邻两段斜率的调和平均（保证单调、不回退） */
const LEOPARD_GAIT_TANGENTS = LEOPARD_GAIT_KEYS.map((_, index) => {
  const previous = LEOPARD_GAIT_SLOPES[(index + 7) % 8]!;
  const next = LEOPARD_GAIT_SLOPES[index % 8]!;
  return (2 * previous * next) / (previous + next);
});

/** 把匀速时间映射为步态相位：关键帧之间用单调三次 Hermite 插值 */
function leopardGaitPhase(time: number): number {
  const t = ((time % 1) + 1) % 1;
  let index = 0;
  while (index < 7 && t >= LEOPARD_GAIT_KEYS[index + 1]!) index++;
  const span = LEOPARD_GAIT_KEYS[index + 1]! - LEOPARD_GAIT_KEYS[index]!;
  const s = (t - LEOPARD_GAIT_KEYS[index]!) / span;
  return (
    ((2 * s * s * s - 3 * s * s + 1) * index) / 8
    + (s * s * s - 2 * s * s + s) * span * LEOPARD_GAIT_TANGENTS[index]!
    + ((-2 * s * s * s + 3 * s * s) * (index + 1)) / 8
    + (s * s * s - s * s) * span * LEOPARD_GAIT_TANGENTS[index + 1]!
  );
}

/** 身体整体的起伏与俯仰 */
interface BodyTransform {
  /** 竖直位移 */
  translateY: number;
  /** 绕 (165, 110) 旋转的角度（度） */
  rotation: number;
}

/**
 * 豹子身体随步态的起伏与俯仰。
 * 原实现先拼成 SVG transform 字符串（保留三位小数）再用正则解析回数字，这里直接按同样精度取整，结果一致。
 */
function leopardBodyTransform(phase: number): BodyTransform {
  const [translateY, rotation] = sampleLoop(
    [
      [0, 0],
      [3, 1],
      [2, 2],
      [0, 0],
      [-3, -2],
      [-6, -2],
      [-5, -1],
      [-2, 0],
    ],
    phase,
  );
  return { translateY: Number(translateY.toFixed(3)), rotation: Number(rotation.toFixed(3)) };
}

// ═════════════════════════════ 生物造型 ═════════════════════════════

/** 生物造型上的固定字符：[x, y, 字符] */
type ShapeGlyph = readonly [number, number, string];

/** 生物造型：轮廓线（实线描边）、细节线（虚一些的描边）与固定字符，坐标系以 (160, 108) 为中心 */
interface CreatureShape {
  /** 豹子的身体填充轮廓（本模块未使用） */
  backing?: string;
  contours: string[];
  details: string[];
  glyphs: ShapeGlyph[];
}

/** 豹子背部轮廓 */
const LEOPARD_BACK_PATH
  = "M94 104 C101 78 124 74 150 78 C175 83 202 75 220 79 L239 72 L240 60 Q250 58 253 70 C264 69 272 77 274 84 L287 89 L284 98 L267 104 L246 99 L231 113";

/** 豹子腹部轮廓 */
const LEOPARD_BELLY_PATH = "M213 128 C190 138 173 128 145 128";

/** 轮流登场的生物（豹子虽有造型但不在登场名单里） */
const SWIMMER_SPECIES: CreatureSpecies[] = ["turtle", "crab", "pearl", "dolphin"];

/** 豹子腿上 u = 0.55 处的点，用来放置腿上的数字 */
function leopardLegMark(key: LeopardLegKey): Point {
  const sample = sampleLegCurve(leopardLegJoints(key, 0), 0.55);
  return { x: sample.x, y: sample.y };
}

const CREATURE_SHAPES: Record<CreatureSpecies, CreatureShape> = {
  crab: {
    contours: [
      "M108 99 Q111 79 135 76 L149 80 L160 77 L172 80 L186 76 Q210 80 214 99 L207 125 Q185 143 160 143 Q134 143 112 125 Z",
      ...Array.from({ length: 8 }, (_, index) => crabLegPath(index)),
      "M116 96 L92 79 L78 67 Q54 68 48 50 L45 29 Q62 29 72 46 L76 22 Q96 33 94 50 L87 64 L102 73 L121 85 Z",
      "M204 96 L228 79 L242 67 Q266 68 272 50 L275 29 Q258 29 248 46 L244 22 Q224 33 226 50 L233 64 L218 73 L199 85 Z",
      "M140 79 L136 60 L142 59 L147 80",
      "M174 80 L179 59 L185 60 L181 79",
    ],
    details: ["M128 102 Q160 92 195 102", "M140 122 Q160 129 180 122"],
    glyphs: [
      [138, 56, "·"],
      [183, 56, "·"],
      [148, 108, "0"],
      [176, 113, "1"],
      [160, 86, "■"],
    ],
  },
  turtle: {
    contours: [
      "M145 53 C130 20 143 10 160 10 C179 10 189 27 175 53",
      "M119 72 C89 46 69 51 54 77 C72 78 82 94 105 99",
      "M201 72 C231 46 251 51 266 77 C248 78 238 94 215 99",
      "M111 155 C79 157 75 181 79 195 C99 189 112 185 126 174",
      "M209 155 C241 157 245 181 241 195 C221 189 208 185 194 174",
      "M151 186 L160 208 L169 186",
      "M160 48 C123 48 104 83 105 125 C106 164 127 188 160 188 C193 188 214 164 215 125 C216 83 197 48 160 48 Z",
    ],
    details: [
      "M146 72 L174 72 L187 96 L173 121 L147 121 L133 96 Z",
      "M147 121 L133 145 L147 168 L173 168 L187 145 L173 121",
      "M133 96 L113 91 M187 96 L207 91 M133 145 L112 151 M187 145 L208 151",
    ],
    glyphs: [
      [155, 95, "01"],
      [157, 148, "10"],
      [124, 120, ":"],
      [193, 121, ":"],
      [154, 31, "·"],
      [168, 31, "·"],
      [160, 60, "■"],
    ],
  },
  leopard: {
    backing: `${LEOPARD_BACK_PATH} L217 124 L213 128 C190 138 173 128 145 128 Q114 144 94 119 Z`,
    contours: [
      LEOPARD_BACK_PATH,
      leopardLegOutline("fore-near"),
      leopardLegOutline("fore-far"),
      leopardLegOutline("hind-near"),
      leopardLegOutline("hind-far"),
      "M95 107 C74 103 65 86 44 82 C26 78 14 84 12 96 C10 103 18 106 21 99 C26 88 41 91 54 98 C67 110 79 120 95 119",
      LEOPARD_BELLY_PATH,
    ],
    details: [
      "M248 83 L257 89 L260 99",
      "M274 91 L284 92",
      "M113 99 Q121 104 120 119",
      "M209 96 Q218 104 217 118",
      "M28 135 L64 135 M16 151 L39 151",
    ],
    glyphs: [
      [264, 83, "·"],
      [139, 103, "0"],
      [161, 106, "1"],
      [180, 99, "0"],
      [197, 111, "0"],
      [148, 117, ":"],
      [119, 95, "0"],
      [219, 96, "■"],
      [234, 86, "0"],
      [leopardLegMark("hind-far").x, leopardLegMark("hind-far").y, "1"],
      [leopardLegMark("fore-near").x, leopardLegMark("fore-near").y, "0"],
    ],
  },
  pearl: {
    contours: [
      "M157 157 C110 153 68 119 62 77 C68 59 81 51 96 56 C108 31 128 31 141 43 C153 24 171 24 182 43 C200 31 216 39 225 57 C244 49 258 64 259 79 C252 124 212 154 165 157",
      "M65 155 Q160 123 255 155 C239 192 203 210 160 210 C117 210 80 192 65 155 Z",
      "M65 155 Q160 184 255 155",
    ],
    details: [
      "M92 75 Q106 111 137 141",
      "M121 60 Q128 99 149 133",
      "M160 54 L160 125",
      "M200 61 Q191 104 177 134",
      "M231 79 Q216 116 186 142",
      "M92 174 Q160 211 228 174",
    ],
    glyphs: [
      [118, 89, "1"],
      [207, 100, "0"],
      [91, 107, ":"],
      [222, 122, "+"],
      [147, 146, "0"],
      [161, 144, "1"],
      [169, 155, "0"],
      [155, 158, "■"],
      [160, 188, "~"],
    ],
  },
  dolphin: {
    contours: [
      "M47 151 C73 109 106 84 145 77 C150 61 163 44 181 40 C177 53 178 64 185 77 C212 79 235 91 247 107 L276 114 Q281 120 273 124 L246 126 C224 147 199 153 178 150 C170 165 157 176 143 177 L151 147 C111 137 80 139 47 151 Z",
      "M47 151 C36 133 23 126 13 128 L26 151 L12 179 C31 177 40 165 47 151",
    ],
    details: [
      "M77 133 Q149 100 211 112",
      "M204 136 Q230 135 246 126",
      "M280 86 Q297 111 287 139",
      "M295 70 Q320 111 304 154",
    ],
    glyphs: [
      [231, 109, "0"],
      [132, 112, "01"],
      [165, 122, "1"],
      [104, 121, "+"],
      [194, 98, "■"],
      [70, 141, "~"],
    ],
  },
};

// ═════════════════════════════ 生物之间的接触避让 ═════════════════════════════

/** 上一帧每个字形的接触状态，用来做帧间平滑 */
interface ContactState {
  x: number;
  y: number;
  subject: number;
  incarnation: number;
  /** 当前的避让偏移 */
  dx: number;
  dy: number;
  /** 接触效果持续到的时刻 */
  until: number;
  /** 本次接触开始的时刻 */
  start: number;
  touching: boolean;
}

interface ContactSolver {
  reset: () => void;
  apply: (glyphs: SceneGlyph[], dt: number, time: number) => SceneGlyph[];
}

/**
 * 两只生物的字形靠得太近时互相推开。
 * 用 40 像素的空间网格找邻居，只在不同生物之间产生斥力；
 * 再按「同一生物、同一代、位置最近」把本帧字形与上一帧配对，让偏移量平滑过渡。
 */
function createContactSolver(): ContactSolver {
  let previous: ContactState[] = [];
  let lastTime = -Infinity;
  const cell = 40;
  const cellKey = (cx: number, cy: number): number => ((cx + 32768) << 16) ^ (cy + 32768);
  const buildGrid = (items: readonly Point[]): Map<number, number[]> => {
    const grid = new Map<number, number[]>();
    items.forEach((item, index) => {
      const key = cellKey(Math.floor(item.x / cell), Math.floor(item.y / cell));
      const list = grid.get(key);
      if (list) list.push(index);
      else grid.set(key, [index]);
    });
    return grid;
  };
  const forEachNeighbor = (grid: Map<number, number[]>, at: Point, visit: (index: number) => void): void => {
    const cx = Math.floor(at.x / cell);
    const cy = Math.floor(at.y / cell);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        for (const index of grid.get(cellKey(cx + ox, cy + oy)) ?? []) visit(index);
      }
    }
  };
  return {
    reset() {
      previous = [];
      lastTime = -Infinity;
    },
    apply(glyphs, dt, time) {
      // 时间倒流（场景重置）时丢弃历史
      if (time < lastTime) previous = [];
      lastTime = time;
      const active = glyphs.map(glyph => glyph.alpha > 0.15 && !glyph.exitBlock);
      const grid = buildGrid(glyphs);
      const previousGrid = buildGrid(previous);
      const claimed = new Set<number>();
      const states: ContactState[] = [];
      const pushes = glyphs.map(() => ({ x: 0, y: 0, weight: 0, strength: 0 }));
      for (let index = 0; index < glyphs.length; index++) {
        if (!active[index]) continue;
        const glyph = glyphs[index]!;
        forEachNeighbor(grid, glyph, (other) => {
          if (other <= index || !active[other] || glyph.subject === glyphs[other]!.subject) return;
          const neighbor = glyphs[other]!;
          const reach = Math.min(36, (glyph.size + neighbor.size) * 0.9);
          let dx = glyph.x - neighbor.x;
          let dy = glyph.y - neighbor.y;
          if (Math.abs(dx) >= reach || Math.abs(dy) >= reach) return;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq >= reach * reach) return;
          const distance = Math.sqrt(distanceSq);
          // 完全重合时按槽位号决定推开方向，避免除零
          if (distance < 0.01) {
            dx = glyph.subject < neighbor.subject ? -1 : 1;
            dy = 0;
          }
          else {
            dx /= distance;
            dy /= distance;
          }
          const closeness = 1 - distance / reach;
          const weight = closeness * closeness;
          const strength = Math.min(22, reach * 0.7) * closeness;
          const mine = pushes[index]!;
          const theirs = pushes[other]!;
          const pushX = dx * weight;
          const pushY = dy * weight;
          mine.x += pushX;
          mine.y += pushY;
          mine.weight += weight;
          mine.strength = Math.max(mine.strength, strength);
          theirs.x -= pushX;
          theirs.y -= pushY;
          theirs.weight += weight;
          theirs.strength = Math.max(theirs.strength, strength);
        });
      }
      const result = glyphs.map((glyph, index) => {
        let match = -1;
        let best = glyph.size * glyph.size * 4;
        const same = previous[index];
        // 先看同一下标的上一帧状态，对不上再到附近格子里找最近的同类
        if (
          same
          && !claimed.has(index)
          && same.subject === glyph.subject
          && same.incarnation === glyph.incarnation
          && (same.x - glyph.x) ** 2 + (same.y - glyph.y) ** 2 < glyph.size * glyph.size
        ) {
          match = index;
        }
        else {
          forEachNeighbor(previousGrid, glyph, (candidate) => {
            const state = previous[candidate]!;
            if (claimed.has(candidate) || state.subject !== glyph.subject || state.incarnation !== glyph.incarnation)
              return;
            const distance = (state.x - glyph.x) ** 2 + (state.y - glyph.y) ** 2;
            if (distance < best) {
              best = distance;
              match = candidate;
            }
          });
        }
        const matched = match < 0 ? null : previous[match];
        if (match >= 0) claimed.add(match);
        const push = pushes[index]!;
        const touching = push.weight > 0;
        // 接触时快速跟上（时间常数 1/22 秒），分开时慢慢回位（1/9 秒）
        const blend = 1 - Math.exp(-Math.min(0.05, Math.max(0, dt)) * (touching ? 22 : 9));
        const targetX = touching ? (push.x / push.weight) * push.strength : 0;
        const targetY = touching ? (push.y / push.weight) * push.strength : 0;
        const offsetX = (matched?.dx ?? 0) + (targetX - (matched?.dx ?? 0)) * blend;
        const offsetY = (matched?.dy ?? 0) + (targetY - (matched?.dy ?? 0)) * blend;
        const until = touching ? time + 0.22 : (matched?.until ?? -Infinity);
        const start = touching && !matched?.touching ? time : (matched?.start ?? -Infinity);
        states.push({
          x: glyph.x,
          y: glyph.y,
          subject: glyph.subject,
          incarnation: glyph.incarnation,
          dx: offsetX,
          dy: offsetY,
          until,
          start,
          touching,
        });
        return {
          ...glyph,
          x: glyph.x + offsetX,
          y: glyph.y + offsetY,
          creatureContact: time < until,
          contactBlock: time - start < 0.12,
        };
      });
      previous = states;
      return result;
    },
  };
}

// ═════════════════════════════ 生物的行进路线 ═════════════════════════════

/** 各生物相对基准尺寸的放大倍数 */
const SPECIES_SCALE: Partial<Record<Species, number>> = {
  turtle: 1,
  pearl: 1.05,
  crab: 1.05,
  leopard: 1.12,
  dolphin: 1.45,
};

/** 珍珠贝开合一次的周期（秒） */
const PEARL_CYCLE = 5;

/** 珍珠贝停留多久后开始退场（秒） */
const PEARL_STAY = 5;

/** 珍珠贝退场闪烁的时长（秒），结束后槽位让给下一只生物 */
const PEARL_EXIT = 0.65;

/** 海豚游泳摆尾的周期（秒） */
const DOLPHIN_STROKE = 1.65;

/** 生物在场景中的整体位置与朝向（弧度） */
interface PathPose {
  x: number;
  y: number;
  angle: number;
}

/**
 * 生物整体沿什么路线穿过场景：螃蟹横着爬、豹子变速奔跑、海龟缓慢划水、海豚波浪式前进，
 * 都从左侧画外入场（首次挂载时直接出现在画面里）；珍珠贝则原地停留。
 */
function creaturePathPose(
  species: CreatureSpecies,
  time: number,
  viewport: Viewport,
  phase: number,
  scale: number,
  initial = false,
): PathPose {
  const width = 170 * scale + 24;
  const startX = viewport.left - width;
  let dx: number;
  let y: number;
  let angle = 0;
  if (species === "crab") {
    dx = time * 175;
    y = viewport.top + viewport.height * (0.66 + phase * 0.1);
  }
  else if (species === "leopard") {
    dx = 354 * LEOPARD_GAIT_PERIOD * leopardStrideWarp(time / LEOPARD_GAIT_PERIOD);
    y = viewport.top + viewport.height * (0.64 + phase * 0.12);
  }
  else if (species === "turtle") {
    dx = time * 22 + 1.4 * Math.sin((time / 2.8) * TAU);
    y = viewport.top + viewport.height * (0.62 + phase * 0.16) + Math.sin((time / 5.6) * TAU) * 3;
    // 海龟造型是竖着画的，转 90° 让它头朝右游
    angle = Math.PI / 2 + Math.sin((time / 2.8) * TAU) * 0.025;
  }
  else if (species === "dolphin") {
    dx = time * 120 + 2 * Math.sin((time / DOLPHIN_STROKE) * TAU);
    const wave = (time / 7) * TAU + phase * TAU;
    const amplitude = Math.min(14, viewport.height * 0.022);
    y = viewport.top + viewport.height * (0.3 + phase * 0.2) + Math.sin(wave) * amplitude;
    // 身体朝向跟随波浪的切线，只取一半避免摆动过大
    angle = Math.atan2((Math.cos(wave) * amplitude * TAU) / 7, 120) * 0.5;
  }
  else {
    const margin = Math.min(viewport.width / 2, 112 * scale + 24);
    y = Math.min(viewport.top + viewport.height * (0.55 + phase * 0.15), viewport.bottom - 102 * scale - 24);
    return { x: viewport.left + margin + (viewport.width - 2 * margin) * phase, y, angle };
  }
  return {
    x: (initial ? viewport.left + viewport.width * (0.15 + phase * 0.65) : startX) + dx,
    y,
    angle,
  };
}

// ═════════════════════════════ 骨骼绑定 ═════════════════════════════

/** 骨骼变形后的位置与相对旋转（度） */
interface RigPose {
  x: number;
  y: number;
  angle: number;
}

/** 脊柱上的一点，预先算好随身体弯曲所需的各项系数 */
interface SpinePoint {
  x: number;
  y: number;
  /** 沿身体从尾（235）到头（95）的归一化位置 */
  u: number;
  smooth: number;
  arch: number;
  slope: number;
  smoothSlope: number;
}

/** 字形对最近两段骨骼的权重 */
interface SegmentWeight {
  index: number;
  d: number;
  weight: number;
}

/** 绑定到折线骨骼（螃蟹腿、海豚脊柱） */
interface SegmentBinding {
  key: string;
  weights: SegmentWeight[];
}

/** 绑定到豹子腿 */
interface LegRigBinding {
  key: LeopardLegKey;
  leg: LegBinding;
}

/** 绑定到豹子脊柱 */
interface SpineBinding {
  spine: SpinePoint;
  tail: boolean;
}

type RigBinding = SegmentBinding | LegRigBinding | SpineBinding;

/** 生物骨骼：先 bind 记录字形与骨骼的关系，每帧 pose 摆好姿势，再 deform 求出字形的新位置 */
interface CreatureRig {
  bind: (part: string, x: number, y: number) => RigBinding | null;
  pose: (time: number) => void;
  bodyTransform: () => BodyTransform | null;
  deform: (binding: RigBinding | null | undefined, x: number, y: number) => RigPose;
}

function spinePoint(x: number, y: number): SpinePoint {
  const u = clamp((235 - x) / 140, 0, 1);
  const smooth = u * u * (3 - 2 * u);
  return {
    x,
    y,
    u,
    smooth,
    arch: Math.sin(Math.PI * u) ** 2,
    slope: Math.PI * Math.sin(TAU * u),
    smoothSlope: 6 * u * (1 - u),
  };
}

/** 豹子脊柱随步态弯曲：flex ∈ [-1, 1]，身体中段拱起、前后错动，切线方向由各项系数的导数给出 */
function flexSpine(spine: SpinePoint, flex: number): RigPose {
  const { x, y, smooth, arch, slope, smoothSlope } = spine;
  const angle = Math.atan2((9 * slope + 4 * smoothSlope) * flex, 140 - 16 * smoothSlope * flex);
  const offset = y - 105;
  return {
    x: x + 16 * smooth * flex - Math.sin(angle) * offset,
    y: 105 - (9 * arch + 4 * smooth) * flex + Math.cos(angle) * offset,
    angle: (angle * 180) / Math.PI,
  };
}

/** 找离 (x, y) 最近的两段骨骼，按距离的负三次方分配权重 */
function bindToSegments(segments: readonly Segment[], x: number, y: number): SegmentWeight[] {
  const nearest = segments
    .map((segment, index) => {
      const t = clamp(
        ((x - segment.a.x) * (segment.b.x - segment.a.x) + (y - segment.a.y) * (segment.b.y - segment.a.y))
        / (segment.length * segment.length),
        0,
        1,
      );
      return {
        index,
        d: Math.hypot(
          x - segment.a.x - t * (segment.b.x - segment.a.x),
          y - segment.a.y - t * (segment.b.y - segment.a.y),
        ),
      };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  const total = nearest.reduce((sum, item) => sum + 1 / Math.pow(item.d + 5, 3), 0);
  return nearest.map(item => ({ ...item, weight: 1 / Math.pow(item.d + 5, 3) / total }));
}

/** 线性混合蒙皮：字形跟着各骨骼的刚体变换移动，再按权重加权 */
function deformBySegments(
  rest: readonly Segment[],
  posed: readonly Segment[],
  weights: readonly SegmentWeight[],
  x: number,
  y: number,
): RigPose {
  let sumX = 0;
  let sumY = 0;
  let sumAngle = 0;
  for (const { index, weight } of weights) {
    const from = rest[index]!;
    const to = posed[index]!;
    const turn = Math.atan2(Math.sin(to.angle - from.angle), Math.cos(to.angle - from.angle));
    const offset = rotate(x - from.a.x, y - from.a.y, turn);
    sumX += (to.a.x + offset.x) * weight;
    sumY += (to.a.y + offset.y) * weight;
    sumAngle += turn * weight;
  }
  return { x: sumX, y: sumY, angle: (sumAngle * 180) / Math.PI };
}

/** 螃蟹骨骼：八条腿走步态，两只钳子以 1.16 秒为周期轻轻开合 */
function createCrabRig(): CreatureRig {
  const rest: Record<string, Segment[]> = Object.fromEntries(
    CRAB_LEG_KEYS.map((key, index) => [key, chain(crabLegJoints(index))]),
  );
  rest["crab-claw-left"] = chain([point(118, 92), point(75, 48)]);
  rest["crab-claw-right"] = chain([point(202, 92), point(245, 48)]);
  const posed: Record<string, Segment[]> = { ...rest };
  return {
    bind(part, x, y) {
      const key = Object.keys(rest).find(name => part.includes(name));
      return key ? { key, weights: bindToSegments(rest[key]!, x, y) } : null;
    },
    pose(time) {
      CRAB_LEG_KEYS.forEach((key, index) => {
        posed[key] = chain(crabLegJoints(index, time / CRAB_GAIT_PERIOD));
      });
      for (const [key, side] of [
        ["crab-claw-left", -1],
        ["crab-claw-right", 1],
      ] as const) {
        const base = rest[key]![0]!;
        const swing = Math.sin((time / 1.16) * TAU) * 0.08 * side;
        const tip = rotate(base.b.x - base.a.x, base.b.y - base.a.y, swing);
        posed[key] = chain([base.a, point(base.a.x + tip.x, base.a.y + tip.y)]);
      }
    },
    bodyTransform() {
      return null;
    },
    deform(binding, x, y) {
      return binding && "weights" in binding
        ? deformBySegments(rest[binding.key]!, posed[binding.key]!, binding.weights, x, y)
        : { x, y, angle: 0 };
    },
  };
}

/** 豹子骨骼：四条腿按步态摆动，脊柱随步态拱起，尾巴绕臀部摆动，身体整体起伏 */
function createLeopardRig(): CreatureRig {
  const rest = {} as Record<LeopardLegKey, LegJoints>;
  const hips = {} as Record<LeopardLegKey, SpinePoint>;
  const tailRoot = spinePoint(95, 113);
  for (const key of LEOPARD_LEG_KEYS) {
    rest[key] = leopardLegJoints(key, 0);
    hips[key] = spinePoint(rest[key][0]!.x, rest[key][0]!.y);
  }
  const posed: Record<LeopardLegKey, LegJoints> = { ...rest };
  let gaitPhase = 0;
  let flex = 0;
  let tailSwing = 0;
  let hipPose: RigPose | null = null;
  return {
    bind(part, x, y) {
      const key = LEOPARD_LEG_KEYS.find(name => part.includes(name));
      if (!key) return part.includes("speed-trail") ? null : { spine: spinePoint(x, y), tail: part.includes("tail") };
      return { key, leg: bindLegPoint(key, x, y) };
    },
    pose(time) {
      const phase = leopardGaitPhase(time / LEOPARD_GAIT_PERIOD);
      gaitPhase = phase;
      flex = Math.cos(TAU * (phase - 0.25));
      tailSwing = Math.sin(TAU * phase) * 0.12;
      hipPose = flexSpine(tailRoot, flex);
      for (const key of LEOPARD_LEG_KEYS) {
        // 腿的形状按步态重算，再整体平移到弯曲后的髋关节位置
        const restHip = rest[key][0]!;
        const movedHip = flexSpine(hips[key], flex);
        posed[key] = leopardLegJoints(key, phase).map(joint => ({
          x: joint.x + movedHip.x - restHip.x,
          y: joint.y + movedHip.y - restHip.y,
        }));
      }
    },
    bodyTransform() {
      return leopardBodyTransform(gaitPhase);
    },
    deform(binding, x, y) {
      if (binding && "spine" in binding) {
        const pose = flexSpine(binding.spine, flex);
        if (binding.tail && hipPose) {
          const swung = rotate(pose.x - hipPose.x, pose.y - hipPose.y, tailSwing);
          return {
            x: swung.x + hipPose.x,
            y: swung.y + hipPose.y,
            angle: pose.angle + (tailSwing * 180) / Math.PI,
          };
        }
        return pose;
      }
      return binding && "leg" in binding ? deformLegPoint(posed[binding.key], binding.leg) : { x, y, angle: 0 };
    },
  };
}

/** 海豚骨骼：一条从头（260）到尾（30）的脊柱，摆动幅度向尾部递增，形成游泳的波动 */
function createDolphinRig(swimming: boolean): CreatureRig {
  const restSpine = chain([
    point(260, 110),
    point(220, 113),
    point(180, 117),
    point(140, 124),
    point(100, 136),
    point(60, 148),
    point(30, 151),
  ]);
  let posedSpine = restSpine;
  return {
    bind(part, x, y) {
      return part.includes("echo-") ? null : { key: "spine", weights: bindToSegments(restSpine, x, y) };
    },
    pose(time) {
      const angle = (time / (swimming ? DOLPHIN_STROKE : 2.8)) * TAU;
      let joint = point(260, 110 + Math.sin(angle) * (swimming ? 0.5 : 2));
      posedSpine = restSpine.map((segment, index) => {
        const amplitude = swimming
          ? 0.012 + 0.255 * Math.pow(index / (restSpine.length - 1), 1.8)
          : 0.015 + index * 0.035;
        const bend = segment.angle + Math.sin(angle - index * (swimming ? 0.9 : 0.48)) * amplitude;
        const end = point(joint.x + Math.cos(bend) * segment.length, joint.y + Math.sin(bend) * segment.length);
        const next = makeSegment(joint, end);
        joint = end;
        return next;
      });
    },
    bodyTransform() {
      return null;
    },
    deform(binding, x, y) {
      return binding && "weights" in binding
        ? deformBySegments(restSpine, posedSpine, binding.weights, x, y)
        : { x, y, angle: 0 };
    },
  };
}

/** 按物种创建骨骼；海龟与珍珠贝没有骨骼，各自在绘制时做简单的局部摆动 */
function createRig(species: CreatureSpecies, { swimming = false } = {}): CreatureRig | null {
  if (species === "crab") return createCrabRig();
  if (species === "leopard") return createLeopardRig();
  if (species === "dolphin") return createDolphinRig(swimming);
  return null;
}

// ═════════════════════════════ 生物模型 ═════════════════════════════

/** 模型上的一个字形（静止姿态坐标） */
interface ModelGlyph {
  x: number;
  y: number;
  char: string;
  alpha: number;
  /** 所属部位，决定骨骼绑定、局部摆动与角色色 */
  part: string;
  /** 描边短线的方向；有它的字形绘制成线段 */
  line?: { angle: number };
  binding: RigBinding | null | undefined;
}

interface CreatureModel {
  glyphs: ModelGlyph[];
  rig: CreatureRig | null;
}

/** 轮廓线第 index 条属于哪个部位 */
function contourPart(species: CreatureSpecies, index: number): string {
  if (species === "crab") {
    if (index >= 1 && index <= 8) return `crab-leg-${index - 1}`;
    return index === 9 ? "crab-claw-left" : index === 10 ? "crab-claw-right" : "";
  }
  if (species === "leopard") return ["", "fore-near", "fore-far", "hind-near", "hind-far", "tail", ""][index]!;
  if (species === "turtle") return ["", "fin-left", "fin-right", "rear-left", "rear-right", "tail", ""][index]!;
  if (species === "pearl") return index === 0 ? "lid" : "";
  return index === 1 ? "tail" : "";
}

/** 造型上第 index 个固定字符属于哪个部位 */
function shapeGlyphPart(species: CreatureSpecies, index: number): string {
  if (species === "leopard") return index === 9 ? "hind-far" : index === 10 ? "fore-near" : "";
  if (species === "pearl") return index < 4 ? "lid" : index < 8 ? "pearl" : "";
  return "";
}

/**
 * 把生物造型「打印」成字形：沿每条 SVG 路径按固定间距放置短线（间距按缩放折算，保证屏幕上疏密一致），
 * 约四分之一的位置随机换成 0、1 或小方块，让轮廓带上数字感；最后按 x + y 排序，决定开场时的逐个显现顺序。
 */
function buildCreatureModel(species: CreatureSpecies, scale: number): CreatureModel {
  const shape = CREATURE_SHAPES[species];
  const rig = createRig(species, { swimming: true });
  const glyphs: ModelGlyph[] = [];
  const addGlyph = (x: number, y: number, char: string, alpha: number, part: string, line?: { angle: number }): void => {
    const roll = Math.random();
    let finalChar = char;
    let finalLine = line;
    if (char !== "·" && roll < 0.245) {
      finalChar = roll < 0.025 ? "▪" : Math.random() < 0.5 ? "0" : "1";
      finalLine = undefined;
    }
    glyphs.push({ x, y, char: finalChar, alpha, part, line: finalLine, binding: rig?.bind(part, x, y) });
  };
  const tracePath = (d: string, detail: boolean, part: string): void => {
    // 路径元素不挂到文档上，只借用浏览器的路径测量
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    const total = path.getTotalLength();
    for (let at = 0; at < total; at += (detail ? 28 : 22) / scale) {
      const from = path.getPointAtLength(at);
      const to = path.getPointAtLength(Math.min(total, at + 8));
      addGlyph((from.x + to.x) / 2, (from.y + to.y) / 2, "|", detail ? 0.4 : 0.9, part, {
        angle: Math.atan2(to.y - from.y, to.x - from.x),
      });
    }
  };
  shape.contours.forEach((d, index) => tracePath(d, false, contourPart(species, index)));
  shape.details.forEach((d, index) => {
    // 海豚的声波线、豹子的速度线不参与描边
    if ((species === "dolphin" && index >= 2) || (species === "leopard" && index >= 4)) return;
    tracePath(d, true, species === "pearl" && index < 5 ? "lid" : "");
  });
  if (species === "pearl") tracePath("M184 148 A24 24 0 1 0 136 148 A24 24 0 1 0 184 148", false, "pearl");
  shape.glyphs.forEach(([x, y, char], index) =>
    addGlyph(x, y, char.length > 1 ? char[0]! : char, 0.85, shapeGlyphPart(species, index)),
  );
  glyphs.sort((a, b) => a.x + a.y - (b.x + b.y));
  return { glyphs, rig };
}

// ═════════════════════════════ 生物调度 ═════════════════════════════

/** 槽位上当前的生物 */
interface CreatureRecord {
  species: Species;
  /** 登场时刻 */
  born: number;
  /** 是否为挂载时的第一批（直接出现在画面中，而不是从画外入场） */
  initial: boolean;
  /** 随机相位，决定路线高度等个体差异 */
  phase: number;
  generation: number;
  /** 是否曾进入过画面；进入后又离开即退场 */
  seen: boolean;
  retired: boolean;
  scale: number;
  model?: CreatureModel;
  viewport: Viewport;
}

type IncarnatedGlyph = Glyph & { incarnation: number };

interface CreatureDirector {
  prepare: (slot: number, time: number, settings: SceneSettings, viewport: Viewport) => CreatureRecord;
  retire: (slot: number) => void;
  hasOwnMotion: (slot: number) => boolean;
  renderCreature: (slot: number, age: number, settings: SceneSettings, viewport: Viewport) => IncarnatedGlyph[];
  renderJelly: (
    slot: number,
    clock: number,
    dx: number,
    dy: number,
    settings: SceneSettings,
    bounds: JellyBounds,
  ) => IncarnatedGlyph[];
}

/**
 * 生物调度：每个槽位同一时刻只有一只生物，退场后从「水母×2 + 四种生物」里随机挑一只
 * 与其他槽位不重复、也与上一只不同的接替（水母出现两次，概率加倍）。
 * 原实现把绘制函数本身当作调度对象（函数上挂方法），这里拆成普通对象，按物种分成两个绘制入口。
 */
function createCreatureDirector(): CreatureDirector {
  const pool: Species[] = ["jellyfish", "jellyfish", ...SWIMMER_SPECIES];
  const records = new Map<number, CreatureRecord>();
  let generation = 0;
  const recordOf = (slot: number): CreatureRecord => records.get(slot)!;
  /** 生物进入过画面后再整体离开，就让出槽位 */
  const observe = (slot: number, glyphs: readonly Glyph[], viewport: Viewport): void => {
    const record = recordOf(slot);
    if (
      glyphs.some(
        glyph =>
          glyph.x + glyph.size > viewport.left
          && glyph.x - glyph.size < viewport.right
          && glyph.y + glyph.size > viewport.top
          && glyph.y - glyph.size < viewport.bottom,
      )
    ) {
      record.seen = true;
    }
    else if (record.seen) {
      record.retired = true;
    }
  };
  const finish = (slot: number, record: CreatureRecord, glyphs: Glyph[]): IncarnatedGlyph[] => {
    observe(slot, glyphs, record.viewport);
    return glyphs.map(glyph => ({ ...glyph, incarnation: record.generation }));
  };
  return {
    prepare(slot, time, settings, viewport) {
      let record = records.get(slot);
      if (!record || record.retired) {
        const previous = record;
        const taken = new Set(
          [...records.entries()].filter(([key]) => key !== slot).map(([, other]) => other.species),
        );
        const choices = pool.filter(species => !taken.has(species) && species !== previous?.species);
        // 先抽物种、再抽相位，保持与原实现相同的随机数消耗顺序
        const species = choices[Math.floor(Math.random() * choices.length)]!;
        const phase = Math.random();
        const scale = (settings.objectScale / 50) * (SPECIES_SCALE[species] ?? 1);
        record = {
          species,
          born: time,
          initial: !previous,
          phase,
          generation: ++generation,
          seen: false,
          retired: false,
          scale,
          viewport,
        };
        if (species !== "jellyfish") record.model = buildCreatureModel(species, scale);
        records.set(slot, record);
      }
      record.viewport = viewport;
      return record;
    },
    retire(slot) {
      recordOf(slot).retired = true;
    },
    hasOwnMotion(slot) {
      return recordOf(slot).species !== "jellyfish";
    },
    renderCreature(slot, age, settings, viewport) {
      const record = recordOf(slot);
      if (record.species === "pearl" && age >= PEARL_STAY + PEARL_EXIT) {
        record.retired = true;
        return [];
      }
      return finish(slot, record, renderCreatureGlyphs(record, age, settings, viewport));
    },
    renderJelly(slot, clock, dx, dy, settings, bounds) {
      return finish(slot, recordOf(slot), renderJellyfish(clock, dx, dy, settings, bounds));
    },
  };
}

/**
 * 求非水母生物在 time 时刻的全部字形：骨骼摆姿势 → 部位的局部摆动 → 缩放并沿行进路线摆到场景里。
 * 珍珠贝停留 PEARL_STAY 秒后，字形按顺序闪烁成方块并消失。
 */
function renderCreatureGlyphs(record: CreatureRecord, time: number, settings: SceneSettings, viewport: Viewport): Glyph[] {
  // 只有非水母生物会走到这里，它们在登场时就建好了模型
  const species = record.species as CreatureSpecies;
  const { glyphs, rig } = record.model!;
  const scale = record.scale;
  rig?.pose(time);
  const body = rig?.bodyTransform();
  const bodyY = body ? body.translateY : 0;
  const bodyAngle = body ? (body.rotation * Math.PI) / 180 : 0;
  const path = creaturePathPose(species, time, viewport, record.phase, scale, record.initial);
  const heading = path.angle;
  const cos = Math.cos(heading);
  const sin = Math.sin(heading);
  const originX = path.x;
  const originY = path.y;
  const pearlTime = species === "pearl" ? Math.min(time, PEARL_STAY) : time;
  return glyphs.map((glyph, index) => {
    let position: { x: number; y: number; angle?: number } = rig?.deform(glyph.binding, glyph.x, glyph.y) ?? {
      x: glyph.x,
      y: glyph.y,
      angle: 0,
    };
    let turn = ((position.angle ?? 0) * Math.PI) / 180;
    if (species === "turtle" && glyph.part) {
      // 海龟四肢与尾巴绕各自的关节划水，前后肢、左右肢各差半个周期
      const rear = glyph.part.startsWith("rear");
      const right = glyph.part.endsWith("right");
      const swing = Math.sin((time / 2.8) * TAU + (rear ? Math.PI : 0) + (right ? Math.PI : 0)) * 0.16;
      const [pivotX, pivotY] = glyph.part === "tail" ? [160, 187] : [right ? 212 : 108, rear ? 174 : 90];
      position = rotateAround(position.x, position.y, swing, pivotX, pivotY);
      turn += swing;
    }
    else if (species === "pearl") {
      if (glyph.part === "lid") {
        // 贝壳上盖以铰链线 y = 157 为轴竖向压缩，模拟开合
        const open = 0.8 + 0.2 * Math.cos((pearlTime / PEARL_CYCLE) * TAU);
        position = { x: position.x, y: 157 + (position.y - 157) * open };
        if (glyph.line)
          turn = Math.atan2(Math.sin(glyph.line.angle) * open, Math.cos(glyph.line.angle)) - glyph.line.angle;
      }
      else if (glyph.part === "pearl") {
        position = { x: position.x, y: position.y + Math.sin((pearlTime / PEARL_CYCLE) * TAU) * 5 };
      }
    }
    else if (species === "leopard") {
      position = rotateAround(position.x, position.y, bodyAngle, 165, 110);
      position.y += bodyY;
      turn += bodyAngle;
    }
    const localX = (position.x - 160) * scale;
    const localY = (position.y - 108) * scale;
    const exitAge = time - PEARL_STAY - (index / Math.max(1, glyphs.length - 1)) * 0.25;
    const exiting = species === "pearl" && exitAge >= 0;
    const exitAlpha = exiting ? Math.max(0, 1 - exitAge / 0.4) * (exitAge % 0.12 < 0.075 ? 1 : 0.12) : 1;
    return {
      x: originX + localX * cos - localY * sin,
      y: originY + localX * sin + localY * cos,
      char: glyph.char,
      alpha: glyph.alpha * exitAlpha,
      size: settings.fontSize,
      exitBlock: exiting,
      color: glyph.part ? ROLE_TENTACLE : glyph.line ? ROLE_BELL : ROLE_ACCENT,
      line: glyph.line ? { angle: glyph.line.angle + turn + heading, length: settings.fontSize * 0.9 } : undefined,
    };
  });
}

// ═════════════════════════════ 水面：纵深隧道模式 ═════════════════════════════

/** 粒子在纵深模式下的射线：方向向量（已乘长度）与深度 z */
interface DepthRay {
  x: number;
  y: number;
  z: number;
}

/** 水面粒子 */
interface WaterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 被推开后要回到的位置 */
  homeX: number;
  homeY: number;
  /** 被激起的亮度，随时间衰减 */
  energy: number;
  visualSpeed: number;
  /** 本帧受到的挤压，超过阈值会激起 energy */
  pressure: number;
  /** 是否可以再次被激起（挤压消退 0.25 秒后重新上膛） */
  armed: boolean;
  quiet: number;
  phase: number;
  /** 每帧缓存：水流速度与竖向漂移 */
  frameCurrent: number;
  frameDrift: number;
  // 以下仅纵深模式使用
  depthAngle?: number;
  depthPhase?: number;
  depthRay?: DepthRay;
  depthFresh?: boolean;
  depthScale?: number;
  depthActivation?: number;
  depthAlpha?: number;
  depthOffsetX?: number;
  depthOffsetY?: number;
  creatureGlow?: number;
  creatureAvoidX?: number;
  creatureAvoidY?: number;
  creatureRefillAge?: number;
  creatureRefillDelay?: number;
}

/** 经过一次纵深推进后必然存在的字段 */
interface DepthState {
  depthRay: DepthRay;
  depthScale: number;
  depthActivation: number;
  depthAlpha: number;
}

/**
 * 纵深模式下推进一个粒子：粒子沿自己的射线从外圈飞向黑洞按钮。
 * z 按指数增长（0.8 → 5），透视系数 depth = (0.8 / z - 0.16) / 0.84 恰好在 z = 0.8 时为 1（外圈）、z = 5 时为 0（中心）；
 * 超过 5 后回到外圈重新开始。越靠近中心字形越小，靠近中心 22 像素内完全隐去，两端各有一小段淡入淡出。
 */
function advanceDepthParticle(
  particle: WaterParticle,
  dt: number,
  viewport: Viewport,
  target: Point,
  settings: SceneSettings,
): asserts particle is WaterParticle & DepthState {
  if (!particle.depthRay) {
    const turn = particle.phase / (Math.PI * 2);
    const angle = particle.depthAngle ?? turn * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // 射线长度取到画面边缘距离的 1.5 倍，保证外圈铺满整个画面
    const reach
      = Math.min(
        (cos < 0 ? target.x - viewport.left : viewport.right - target.x) / Math.max(0.001, Math.abs(cos)),
        (sin < 0 ? target.y - viewport.top : viewport.bottom - target.y) / Math.max(0.001, Math.abs(sin)),
      ) * 1.5;
    particle.depthRay = {
      x: cos * reach,
      y: sin * reach,
      // 6.25 = 5 / 0.8，初始深度在整个区间里均匀错开
      z: 0.8 * Math.pow(6.25, particle.depthPhase ?? (turn * 17.37) % 1),
    };
    particle.depthFresh = true;
  }
  const ray = particle.depthRay;
  ray.z *= Math.exp(dt * 0.22 * settings.oceanSpeed);
  if (ray.z > 5) {
    ray.z = 0.8 * (ray.z / 5);
    particle.depthFresh = true;
  }
  const depth = Math.max(0, (0.8 / ray.z - 0.16) / 0.84);
  const homeX = target.x + ray.x * depth;
  const homeY = target.y + ray.y * depth;
  if (particle.depthFresh) {
    // 刚生成或刚回到外圈：直接落到新位置并清空所有运动状态
    particle.x = homeX;
    particle.y = homeY;
    particle.vx = 0;
    particle.vy = 0;
    particle.energy = 0;
    particle.creatureGlow = 0;
    particle.creatureAvoidX = 0;
    particle.creatureAvoidY = 0;
    particle.creatureRefillAge = 9;
    particle.depthFresh = false;
  }
  else {
    particle.x += homeX - particle.homeX;
    particle.y += homeY - particle.homeY;
  }
  particle.homeX = homeX;
  particle.homeY = homeY;
  particle.depthScale = 0.6 + 0.9 * depth;
  const fadeIn = Math.min(1, (ray.z - 0.8) / 0.2);
  const fadeOut = Math.min(1, (5 - ray.z) / 0.5);
  const distance = Math.hypot(homeX - target.x, homeY - target.y);
  const spread = Math.min(180, viewport.width * 0.34) * 1.5;
  // 越靠近中心越亮（高斯衰减）
  particle.depthActivation = Math.exp((-distance * distance) / (spread * spread * 0.5));
  particle.depthAlpha
    = Math.max(0, fadeIn * fadeOut * Math.min(1, Math.max(0, (distance - 22) / 32)))
      * (0.7 + 0.3 * particle.depthActivation);
}

/** 纵深模式下被生物排开的「飞溅」字形 */
interface WaterDrift {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 还需让出的距离，按时间常数 0.1 秒补足 */
  clearanceX: number;
  clearanceY: number;
  age: number;
  life: number;
  size: number;
  alpha: number;
  /** 约三成的飞溅会闪烁 */
  spark: boolean;
  phase: number;
  /** 是否位于黑洞中心区域（中心区域的飞溅不受数量配额限制） */
  central: boolean;
}

// ═════════════════════════════ 水面：粒子碰撞网格 ═════════════════════════════

/**
 * 粒子互斥用的空间哈希网格：在视口外扩 32 格的范围内用定长数组存链表头尾，
 * 超出范围的格子落到 overflow Map 里。每帧 clear 只递增 epoch，不必清空数组。
 */
class CollisionGrid {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly next: Int32Array;
  private readonly heads: Int32Array;
  private readonly tails: Int32Array;
  private readonly stamps: Uint32Array;
  private epoch = 0;
  private readonly overflow = new Map<number, { head: number; tail: number }>();

  constructor(capacity: number, viewport: Viewport, cell: number) {
    this.left = Math.floor(viewport.left / cell) - 32;
    this.top = Math.floor(viewport.top / cell) - 32;
    this.width = Math.ceil(viewport.width / cell) + 66;
    this.height = Math.ceil(viewport.height / cell) + 66;
    const size = this.width * this.height;
    this.heads = new Int32Array(size);
    this.tails = new Int32Array(size);
    this.stamps = new Uint32Array(size);
    this.next = new Int32Array(capacity);
  }

  clear(): void {
    this.overflow.clear();
    this.epoch = (this.epoch + 1) >>> 0;
    // epoch 溢出回 0 时才真正清空时间戳
    if (!this.epoch) {
      this.stamps.fill(0);
      this.epoch = 1;
    }
  }

  slot(cx: number, cy: number): number {
    const x = cx - this.left;
    const y = cy - this.top;
    return x >= 0 && y >= 0 && x < this.width && y < this.height ? x * this.height + y : -1;
  }

  /** 取格子链表的第一个粒子下标，空格返回 -1；后续元素沿 next 数组遍历 */
  get(cx: number, cy: number): number {
    const slot = this.slot(cx, cy);
    if (slot < 0) return this.overflow.get(gridKey(cx, cy))?.head ?? -1;
    return this.stamps[slot] === this.epoch ? this.heads[slot]! : -1;
  }

  append(cx: number, cy: number, index: number): void {
    const slot = this.slot(cx, cy);
    this.next[index] = -1;
    if (slot < 0) {
      const key = gridKey(cx, cy);
      const list = this.overflow.get(key);
      if (list) {
        this.next[list.tail] = index;
        list.tail = index;
      }
      else {
        this.overflow.set(key, { head: index, tail: index });
      }
      return;
    }
    if (this.stamps[slot] !== this.epoch) {
      this.stamps[slot] = this.epoch;
      this.heads[slot] = index;
    }
    else {
      this.next[this.tails[slot]!] = index;
    }
    this.tails[slot] = index;
  }
}

// ═════════════════════════════ 水母 ═════════════════════════════

/** 水母绘制区域的默认值：原站设计稿 560 × 480 的画布 */
const DEFAULT_JELLY_BOUNDS: JellyBounds = { left: 180, right: 740, top: 65, bottom: 545, cx: 460 };

/**
 * 用字符拼出一只水母：
 * - 伞盖：顶行「_._」，中间每行左右各一条斜线（带短线角度贴合伞面），底行「( )」，内侧再点两列「:」；
 * - 伞缘：一行交替的「~_」；
 * - 伞顶：三个点缀符「+ * +」；
 * - 触手：若干条由「|」组成、随脉冲张合与摆动的曲线。
 * 每个字形都先绕伞缘中心旋转 tilt，再按 snap 程度吸附到字符网格（snap = 1 时完全对齐，呈现 ASCII 的格子感），
 * 越界或与已有字形重叠的直接丢弃。
 */
function drawJellyfish(
  clock: number,
  dx: number,
  dy: number,
  settings: SceneSettings,
  snap = 0,
  bounds: JellyBounds = DEFAULT_JELLY_BOUNDS,
): Glyph[] {
  const pulse = pulseState(clock, settings);
  const scale = settings.objectScale / 100;
  // 字符网格的列宽与行高
  const column = settings.fontSize * 0.8;
  const row = settings.fontSize * 1.1;
  const centerX = bounds.cx + Math.sin(clock * 0.45) * settings.sway * 16 + dx * settings.follow * 16;
  const gridTop = bounds.top + 9;
  const lip = (bounds.lip ?? gridTop + (8 - pulse.lift) * 22) + dy * settings.follow * 22;
  const bellHalfWidth
    = Math.max(3, settings.bellWidth - ((pulse.squeeze * settings.contraction) / 100) * 4) * scale * 16;
  // 蓄力程度：fan 从 0.25 升到 1 的过程中伞盖逐渐压扁
  const charge = Math.max(0, (pulse.fan - 0.25) / 0.75);
  const bellHeight
    = Math.max(2, settings.bellHeight - ((pulse.squeeze * settings.contraction) / 100) * 2)
      * (1 - (charge * settings.chargeFlatten) / 100)
      * scale
      * 22;
  const glyphs: Glyph[] = [];
  const tilt = bounds.tilt ?? 0;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const place = (px: number, py: number, char: string, color = ROLE_BELL, alpha = 1, line?: GlyphLine): void => {
    const ox = px - centerX;
    const oy = py - lip;
    let x = centerX + ox * cos - oy * sin;
    let y = lip + ox * sin + oy * cos;
    x += (bounds.cx + Math.round((x - bounds.cx) / column) * column - x) * snap;
    y += (gridTop + Math.round((y - gridTop) / row) * row - y) * snap;
    if (y < bounds.top || y > bounds.bottom || x < bounds.left || x > bounds.right) return;
    if (
      glyphs.some(
        glyph => Math.abs(x - glyph.x) < settings.fontSize * 0.65 && Math.abs(y - glyph.y) < settings.fontSize * 0.85,
      )
    ) {
      return;
    }
    glyphs.push({
      x,
      y,
      char,
      color,
      alpha,
      size: settings.fontSize,
      line: line ? { ...line, angle: line.angle + tilt } : undefined,
    });
  };
  // 伞盖：宽度按四分之一椭圆从顶到底展开
  const bellRows = Math.max(2, Math.ceil((settings.bellHeight * scale * 22) / row));
  for (let index = 0; index < bellRows; index++) {
    const t = index / bellRows;
    const halfWidth = bellHalfWidth * Math.sqrt(1 - (1 - t) * (1 - t));
    const y = lip - bellHeight + t * bellHeight;
    if (index === 0) {
      place(centerX - column, y, "_");
      place(centerX, y, ".");
      place(centerX + column, y, "_");
    }
    else if (index === bellRows - 1) {
      place(centerX - halfWidth, y, "(");
      place(centerX + halfWidth, y, ")");
    }
    else {
      // 椭圆在该行的斜率，用来给斜线定角度
      const slope = (bellHalfWidth * (1 - t)) / Math.sqrt(1 - (1 - t) * (1 - t));
      const length = settings.fontSize * 0.9;
      place(centerX - halfWidth, y, "/", ROLE_BELL, 1, { angle: Math.atan2(bellHeight, -slope), length });
      place(centerX + halfWidth, y, "\\", ROLE_BELL, 1, { angle: Math.atan2(bellHeight, slope), length });
    }
    if (index > 0 && index < bellRows - 1) {
      place(centerX - bellHalfWidth * 0.25, y, ":", ROLE_BELL, 0.5);
      place(centerX + bellHalfWidth * 0.25, y, ":", ROLE_BELL, 0.5);
    }
  }
  // 伞缘
  const rimCount = Math.max(4, Math.round((settings.bellWidth * scale * 32) / column));
  for (let index = 0; index <= rimCount; index++)
    place(centerX - bellHalfWidth + (index / rimCount) * bellHalfWidth * 2, lip, index % 2 ? "_" : "~");
  // 伞顶的点缀
  for (let offset = -1; offset <= 1; offset++) {
    place(
      centerX + offset * column * 1.5,
      lip - Math.max(row, bellHeight * 0.2),
      offset === 0 ? "*" : "+",
      ROLE_ACCENT,
    );
  }
  // 触手：side ∈ [-1, 1] 为左右位置；张开量随 fan、摆动随时间，喷射（jet）时收拢拉直
  for (let tentacle = 0; tentacle < settings.tentacles; tentacle++) {
    const side = (tentacle / (settings.tentacles - 1)) * 2 - 1;
    const reach
      = scale
        * 22
        * (settings.length * (0.8 + 0.2 * (1 - Math.abs(side))) + pulse.jet * settings.stretch - pulse.fan * 2);
    const segments = Math.max(3, Math.ceil((scale * 22 * (settings.length + settings.stretch)) / row));
    for (let segment = 0; segment < segments; segment++) {
      const t = (segment + 1) / segments;
      const fanCurve = Math.sin(t * Math.PI * 0.85) * settings.spread + Math.sin(t * Math.PI * 2) * settings.curl * 0.45;
      const wave = Math.sin(clock * 2 - t * 4 + tentacle) * t * scale * 5 * (1 - pulse.jet);
      const x = centerX + side * (bellHalfWidth - 16 * scale) + side * pulse.fan * fanCurve * scale * 16 + wave;
      // 上式对 t 的导数（乘以 reach 前的横向斜率），用来给短线定角度
      const slopeX
        = side
          * pulse.fan
          * scale
          * 16
          * (Math.cos(t * Math.PI * 0.85) * Math.PI * 0.85 * settings.spread
            + Math.cos(t * Math.PI * 2) * Math.PI * 2 * settings.curl * 0.45)
          + (Math.sin(clock * 2 - t * 4 + tentacle) - 4 * t * Math.cos(clock * 2 - t * 4 + tentacle))
          * scale
          * 5
          * (1 - pulse.jet);
      place(x, lip + row * 0.6 + t * reach, "|", ROLE_TENTACLE, 1 - t * 0.18, {
        angle: Math.atan2(reach, slopeX),
        length: Math.min(settings.fontSize * 0.9, (Math.hypot(reach, slopeX) / segments) * 0.8),
      });
    }
  }
  return glyphs;
}

/** 默认场景参数（原站调参面板的定稿值） */
const DEFAULT_SETTINGS: SceneSettings = {
  smoothMotion: 0,
  oceanEnabled: 1,
  oceanSpacing: 18,
  oceanSpeed: 1,
  oceanOpacity: 22,
  bubbleCount: 10,
  bubbleSize: 20,
  bubbleSpeed: 18,
  wakeStrength: 60,
  wakeRadius: 90,
  wakeLife: 2.5,
  objectScale: 50,
  speed: 1,
  fps: 24,
  charge: 48,
  travel: 12,
  sway: 1,
  follow: 0,
  bellWidth: 9,
  bellHeight: 5,
  contraction: 100,
  chargeFlatten: 80,
  tentacles: 5,
  length: 12,
  stretch: 1,
  spread: 4,
  curl: 4,
  fontSize: 16,
  barHeight: 14,
  barRadius: 3.5,
  guides: 1,
  refillSpeed: 1.4,
  mouseRadius: 60,
  tintRadius: 45,
  tintStrength: 90,
  darkBackground: 0,
  paletteIndex: 0,
  randomPalette: 1,
  jellyCount: 1,
  swimTilt: 14,
  seekMouse: 1,
  aimTurn: 12,
  titleEnabled: 1,
};

/** 水面的绘制样式 */
const OCEAN_MODE: OceanMode = "characters";

/** 水母一次脉冲的状态 */
interface PulseState {
  /** 伞盖收缩程度 */
  squeeze: number;
  /** 触手张开程度 */
  fan: number;
  /** 喷射强度（与 squeeze 相同） */
  jet: number;
  /** 累计上浮的行数 */
  lift: number;
}

/**
 * 水母的脉冲节律：每 3.2 秒一个周期。
 * 前 charge% 为蓄力（触手缓缓张开），随后 0.05 个周期内猛然收缩喷射（三次缓出），剩余时间慢慢舒张；
 * 上浮距离在喷射开始后按三次缓出累加，所以水母是一顿一顿地往上窜。
 */
function pulseState(clock: number, settings: SceneSettings = DEFAULT_SETTINGS): PulseState {
  const cycle = Math.floor(clock / 3.2);
  const progress = (clock - cycle * 3.2) / 3.2;
  const charge = settings.charge / 100;
  const burst = 0.05;
  const release = charge + burst;
  const burstEase = 1 - Math.pow(1 - Math.max(0, Math.min(1, (progress - charge) / burst)), 3);
  const squeeze
    = progress < charge ? 0 : progress < release ? burstEase : 1 - smoothstep((progress - release) / (1 - release));
  const fan
    = progress < charge
      ? 0.25 + 0.75 * smoothstep(progress / charge)
      : progress < release
        ? 1 - burstEase
        : 0.25 * smoothstep((progress - release) / (1 - release));
  const travel = Math.max(0, (progress - charge) / (1 - charge));
  const travelEase = 1 - Math.pow(1 - travel, 3);
  return { squeeze, fan, jet: squeeze, lift: (cycle + travelEase) * settings.travel };
}

/**
 * 把连续时间量化到 fps 帧：smooth = 0 时逐帧跳变；smooth > 0 时只在每帧末尾 smooth 比例的时间内平滑过渡到下一帧。
 */
function quantizeTime(time: number, fps: number, smooth: number): number {
  const frame = Math.floor(time * fps);
  const within = time * fps - frame;
  if (smooth <= 0) return frame / fps;
  const blend = Math.max(0, (within - (1 - smooth)) / smooth);
  const eased = blend * smooth + smoothstep(blend) * (1 - smooth);
  return (frame + eased) / fps;
}

/** 按设置的帧率量化时间后绘制水母；动作越不平滑，字形越贴合字符网格 */
function renderJellyfish(
  clock: number,
  dx = 0,
  dy = 0,
  settings: SceneSettings = DEFAULT_SETTINGS,
  bounds?: JellyBounds,
): Glyph[] {
  const smooth = Math.max(0, Math.min(1, settings.smoothMotion));
  return drawJellyfish(quantizeTime(clock, settings.fps, smooth), dx, dy, settings, 1 - smooth, bounds);
}

// ═════════════════════════════ 配色 ═════════════════════════════

/** 依次为 伞盖、触手、点缀、水面、水面高亮 */
type PaletteColors = [string, string, string, string, string];

/** 一套配色：浅色与暗色背景各一组 */
interface PaletteDefinition {
  name: string;
  light: PaletteColors;
  dark: PaletteColors;
}

const PALETTES: PaletteDefinition[] = [
  {
    name: "潮汐蓝绿",
    light: ["#1680ef", "#32ad41", "#f07b00", "#3585bc", "#0058ed"],
    dark: ["#60b5ff", "#7ce66d", "#ffc166", "#529ab8", "#86eaff"],
  },
  {
    name: "珊瑚薄荷",
    light: ["#df5865", "#278b7c", "#c27e13", "#599a91", "#147c70"],
    dark: ["#ff8690", "#74deba", "#ffe29b", "#609e9d", "#a0ffe2"],
  },
  {
    name: "紫雾柠檬",
    light: ["#7b55ce", "#78951d", "#d75e96", "#8e80b0", "#7950dc"],
    dark: ["#bd9bff", "#d3eb74", "#ffa4d0", "#8e80b0", "#dbc8ff"],
  },
  {
    name: "靛蓝杏桃",
    light: ["#4256be", "#d87842", "#249994", "#6e85ad", "#344fe2"],
    dark: ["#9baaff", "#ffb78b", "#71dfdb", "#737fa5", "#bacbff"],
  },
  {
    name: "森林琥珀",
    light: ["#24826a", "#a77c18", "#b95947", "#6e9c89", "#126c53"],
    dark: ["#6ad6a5", "#edc366", "#ff9c83", "#628c7e", "#a5f5cc"],
  },
  {
    name: "玫瑰冰川",
    light: ["#bd527f", "#358cab", "#8765b9", "#7599b2", "#256faf"],
    dark: ["#ff97c6", "#7bd5f5", "#ccb0ff", "#688ea4", "#a9e7ff"],
  },
  {
    name: "晴空橙",
    light: ["#237dad", "#ed762d", "#4b9676", "#729daa", "#006caa"],
    dark: ["#69c8f5", "#ffb06f", "#88e2b4", "#608d9f", "#a1eaff"],
  },
  {
    name: "莓果鼠尾草",
    light: ["#9c4773", "#718751", "#c88b2a", "#97828f", "#a43a81"],
    dark: ["#e995c1", "#c2d399", "#ffd18b", "#997b98", "#ffbce5"],
  },
  {
    name: "孔雀金",
    light: ["#167d90", "#9373bd", "#ba8927", "#59959f", "#0869a0"],
    dark: ["#64d2d6", "#c4a8f4", "#f8d581", "#578b98", "#9dffff"],
  },
  {
    name: "落日海岸",
    light: ["#cb6544", "#ad5189", "#a9871f", "#a38b8a", "#cd4563"],
    dark: ["#ffa17a", "#ed9bd3", "#e8d185", "#967b95", "#ffc3a1"],
  },
  {
    name: "电光蓝紫",
    light: ["#3a6ce0", "#a44abd", "#219786", "#8493bd", "#3b42e5"],
    dark: ["#7faaff", "#e08aff", "#65e2c8", "#7684bc", "#c4aaff"],
  },
  {
    name: "石墨银",
    light: ["#343a46", "#727a85", "#ba7d43", "#89929d", "#303f59"],
    dark: ["#e1e6ec", "#a5b3c3", "#efd0a0", "#718091", "#eff7ff"],
  },
];

function resolvePalette(settings: SceneSettings): JellyfishPalette {
  const palette = PALETTES[Math.max(0, Math.min(PALETTES.length - 1, Math.round(settings.paletteIndex)))]!;
  const colors = settings.darkBackground ? palette.dark : palette.light;
  return {
    background: settings.darkBackground ? "#141414" : "#ffffff",
    bell: colors[0],
    tentacle: colors[1],
    accent: colors[2],
    water: colors[3],
    waterActive: colors[4],
  };
}

function hexToRgb(hex: string): number[] {
  return [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

// ═════════════════════════════ 水母群的排布与游动 ═════════════════════════════

/** 每个槽位的水母节奏快慢 */
const JELLY_TEMPO = [1, 0.73, 1.29, 0.87, 1.13, 0.64];

/** 每个槽位的蓄力占比偏移 */
const JELLY_CHARGE_SHIFT = [0, 12, -10, 7, -6, 15];

/** 槽位 index 的个体差异：节奏、蓄力占比、上浮距离与初始相位各不相同，避免多只水母同步脉动 */
function jellyVariant(time: number, index: number, settings: SceneSettings): { clock: number; settings: SceneSettings; power: number } {
  const local: SceneSettings = {
    ...settings,
    charge: Math.max(25, Math.min(65, settings.charge + JELLY_CHARGE_SHIFT[index]!)),
    travel: settings.travel * [1, 0.86, 1.17, 0.94, 1.08, 0.8][index]!,
  };
  const clock = time * JELLY_TEMPO[index]! + [0, 1.43, 0.58, 2.31, 0.91, 1.87][index]!;
  return { clock, settings: local, power: 0.15 + pulseState(clock, local).jet };
}

/** 水母在格子里的出生点：x 为横向偏移比例，y 为首次出现的高度比例，enter 表示从格子底部游入 */
interface SpawnPoint {
  x: number;
  y: number;
  enter?: boolean;
}

/** layoutJelly 给出的绘制区域，伞缘高度与倾角总是确定的 */
interface JellyLayoutBounds extends JellyBounds {
  lip: number;
  tilt: number;
}

/**
 * 没有追逐指针时水母的自动游动：把画面按槽位数切成格子，每只水母在自己的格子里
 * 从底部（entry）游到顶部（exit）后循环，沿一个固定倾角斜着上浮。
 */
function layoutJelly(
  clock: number,
  index: number,
  settings: SceneSettings,
  viewport: Viewport,
  spawn: SpawnPoint,
): { local: SceneSettings; bounds: JellyLayoutBounds; clock: number } {
  const count = settings.jellyCount;
  const columns = count <= 3 ? count : Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const row = Math.floor(index / columns);
  const inRow = Math.min(columns, count - row * columns);
  const cellWidth = viewport.width / inRow;
  const cellHeight = viewport.height / rows;
  const cellCenterX = viewport.left + cellWidth * ((index % columns) + 0.5);
  const cellTop = viewport.top + row * cellHeight;
  // 原实现此处还计算了一个按格子大小适配的缩放值，但结果被丢弃且无副作用，已省略
  const variant = jellyVariant(clock, index, settings);
  const local: SceneSettings = {
    ...variant.settings,
    objectScale: settings.objectScale,
    sway: settings.sway,
    follow: count === 1 ? settings.follow : 0,
  };
  const scale = local.objectScale / 100;
  // 伞盖与触手各自的高度，加 24 像素余量，保证进出格子时整只水母都在画外
  const bellExtent = settings.bellHeight * scale * 22 + 24;
  const tentacleExtent = (settings.length + settings.stretch + 2) * scale * 22 + 24;
  const entry = cellTop + cellHeight + bellExtent;
  const exit = cellTop - tentacleExtent;
  const gap = [35, 65, 20, 50, 80, 28][index]!;
  const loop = entry - exit + gap;
  const startLift = pulseState(jellyVariant(0, index, settings).clock, local).lift;
  const travelled
    = ((((pulseState(variant.clock, local).lift - startLift) * 22
      + (spawn.enter ? 0 : entry - (cellTop + cellHeight * (0.2 + spawn.y * 0.55))))
    % loop)
    + loop)
    % loop;
  // 倾角上限：别让水母斜着游出格子
  const maxTilt = Math.atan(((560 / inRow) * 0.32) / ((480 / rows) * 0.6));
  const tilt = Math.min((settings.swimTilt * Math.PI) / 180, maxTilt) * [1, -0.82, 0.68, -1, 0.88, -0.65][index]!;
  const lip = entry - travelled;
  const cx = cellCenterX + (spawn.x - 0.5) * cellWidth * 0.3 + (cellTop + cellHeight * 0.5 - lip) * Math.tan(tilt);
  return {
    local,
    bounds: {
      left: cellCenterX - cellWidth / 2 + 8,
      right: cellCenterX + cellWidth / 2 - 8,
      top: cellTop + 8,
      bottom: cellTop + cellHeight - 8,
      cx,
      lip,
      tilt,
    },
    clock: variant.clock,
  };
}

/** 追逐指针的水母：位置与朝向由自身积分，不再沿格子路线走 */
interface Swimmer {
  x: number;
  y: number;
  /** 朝向（0 为正上方，顺时针为正） */
  angle: number;
  /** 上一帧累计的上浮距离，差值即本帧前进量 */
  distance: number;
  poseTime: number;
  /** 已经游过指针，不再掉头 */
  passed: boolean;
  /** 当前追逐的指针位置；指针移动超过 12 像素才更新并重新开始追逐 */
  guide: Point | null;
}

/**
 * 水母群：调度每个槽位的生物，并负责水母的两种游法——
 * 指针不在画面里时按格子路线自动游动；指针出现后改为追着指针游，只在每次脉冲的喷射段内转向，
 * 前进距离等于脉冲上浮量，所以转弯是一段段圆弧。游出画面就让出槽位。
 */
class JellySwarm {
  private readonly swimmers = new Map<number, Swimmer>();
  private creatures = createCreatureDirector();
  private readonly creatureGenerations = new Map<number, number>();
  private readonly spawn: SpawnPoint[] = Array.from({ length: 6 }, () => ({ x: Math.random(), y: Math.random() }));
  private lastTime: number | null = null;

  reset(): void {
    this.swimmers.clear();
    this.creatures = createCreatureDirector();
    this.creatureGenerations.clear();
    this.lastTime = null;
  }

  frame(
    time: number,
    dx: number,
    dy: number,
    settings: SceneSettings,
    pointer: Pointer | null,
    viewport: Viewport,
  ): SceneGlyph[] {
    if (this.lastTime !== null && time < this.lastTime) this.reset();
    this.lastTime = time;
    for (const slot of this.swimmers.keys()) {
      if (slot >= settings.jellyCount) this.swimmers.delete(slot);
    }
    const glyphs: SceneGlyph[] = [];
    for (let slot = 0; slot < settings.jellyCount; slot++) {
      const creature = this.creatures.prepare(slot, time, settings, viewport);
      const age = time - creature.born;
      if (this.creatureGenerations.get(slot) !== creature.generation) {
        // 换了新生物：丢掉追逐状态；非首批的水母改为从格子底部游入
        this.swimmers.delete(slot);
        if (!creature.initial) this.spawn[slot] = { x: Math.random(), y: 0, enter: true };
        this.creatureGenerations.set(slot, creature.generation);
      }
      if (this.creatures.hasOwnMotion(slot)) {
        glyphs.push(
          ...this.creatures.renderCreature(slot, age, settings, viewport).map(glyph => ({ ...glyph, subject: slot })),
        );
        continue;
      }
      const { local, bounds, clock } = layoutJelly(age, slot, settings, viewport, this.spawn[slot]!);
      const poseTime = quantizeTime(clock, settings.fps, settings.smoothMotion);
      const distance = pulseState(poseTime, local).lift * 22;
      let swimmer = this.swimmers.get(slot);
      if (!swimmer && settings.seekMouse && pointer) {
        swimmer = {
          x: bounds.cx,
          y: bounds.lip,
          angle: bounds.tilt,
          distance,
          poseTime,
          passed: false,
          guide: null,
        };
        this.swimmers.set(slot, swimmer);
      }
      if (!swimmer) {
        glyphs.push(
          ...this.creatures.renderJelly(slot, clock, dx, dy, local, bounds).map(glyph => ({ ...glyph, subject: slot })),
        );
        continue;
      }
      const target = settings.seekMouse ? pointer : null;
      if (target && (!swimmer.guide || Math.hypot(target.x - swimmer.guide.x, target.y - swimmer.guide.y) >= 12)) {
        swimmer.guide = { x: target.x, y: target.y };
        swimmer.passed = false;
      }
      if (!target) swimmer.guide = null;
      let heading = swimmer.angle;
      if (target) {
        const toX = target.x - swimmer.x;
        const toY = target.y - swimmer.y;
        // 指针已落在身后（相对朝向的法线另一侧）就算游过了
        if (toX * Math.sin(swimmer.angle) - toY * Math.cos(swimmer.angle) <= 0) swimmer.passed = true;
        if (!swimmer.passed && Math.hypot(toX, toY) > 24) heading = Math.atan2(toX, -toY);
      }
      const advance = Math.max(0, distance - swimmer.distance);
      swimmer.distance = distance;
      const turn = Math.atan2(Math.sin(heading - swimmer.angle), Math.cos(heading - swimmer.angle));
      // 只在蓄力段内累计可转向的时间：chargedTime 是「至今经历过的蓄力时长」
      const chargeSpan = (3.2 * local.charge) / 100;
      const chargedTime = (value: number): number => Math.floor(value / 3.2) * chargeSpan + Math.min(value % 3.2, chargeSpan);
      const turnBudget = Math.max(0, chargedTime(poseTime) - chargedTime(swimmer.poseTime)) / chargeSpan;
      swimmer.poseTime = poseTime;
      const maxTurn = ((settings.aimTurn * Math.PI) / 180) * turnBudget;
      const step = Math.min(maxTurn, Math.abs(turn)) * Math.sign(turn);
      const previousAngle = swimmer.angle;
      swimmer.angle += step;
      if (Math.abs(step) > 1e-6) {
        // 沿圆弧前进：弧长 advance、转角 step，半径即 advance / step
        const radius = advance / step;
        swimmer.x += radius * (Math.cos(previousAngle) - Math.cos(swimmer.angle));
        swimmer.y += radius * (Math.sin(previousAngle) - Math.sin(swimmer.angle));
      }
      else {
        swimmer.x += Math.sin(swimmer.angle) * advance;
        swimmer.y -= Math.cos(swimmer.angle) * advance;
      }
      const margin = (((settings.length + settings.stretch + settings.bellWidth) * local.objectScale) / 100) * 22 + 60;
      if (
        swimmer.x < viewport.left - margin
        || swimmer.x > viewport.right + margin
        || swimmer.y < viewport.top - margin
        || swimmer.y > viewport.bottom + margin
      ) {
        this.swimmers.delete(slot);
        this.creatures.retire(slot);
        continue;
      }
      glyphs.push(
        ...this.creatures
          .renderJelly(
            slot,
            clock,
            0,
            0,
            { ...local, sway: 0, follow: 0 },
            { ...viewport, cx: swimmer.x, lip: swimmer.y, tilt: swimmer.angle },
          )
          .map(glyph => ({ ...glyph, subject: slot })),
      );
    }
    return glyphs;
  }
}

// ═════════════════════════════ 指针排开生物字形 ═════════════════════════════

/** 上一帧每个字形的横向排开量 */
interface DisplacementOffset {
  x: number;
  /** 排开前的位置，用于跨帧配对 */
  bx: number;
  by: number;
  color: string;
  subject: number;
}

/**
 * 指针扫过生物时把字形往左右两侧拨开（只做横向位移），拨开量随帧平滑；
 * 被拨开的字形若彼此挤在一起，再按 x 排序做一次一维的推挤分离。
 */
class PointerDisplacement {
  private offsets: DisplacementOffset[] = [];

  reset(): void {
    this.offsets = [];
  }

  apply(glyphs: SceneGlyph[], pointer: Pointer | null, dt: number): SceneGlyph[] {
    const unclaimed = new Set(this.offsets.map((_, index) => index));
    const next: DisplacementOffset[] = [];
    const blend = 1 - Math.exp(-Math.min(0.05, dt) * (pointer ? 18 : 9));
    const shifted = glyphs.map((glyph) => {
      let match = -1;
      let best = glyph.size * glyph.size * 4;
      for (const index of unclaimed) {
        const offset = this.offsets[index]!;
        if (offset.color !== glyph.color || offset.subject !== glyph.subject) continue;
        const distance = (offset.bx - glyph.x) ** 2 + (offset.by - glyph.y) ** 2;
        if (distance < best) {
          best = distance;
          match = index;
        }
      }
      const previous = match < 0 ? 0 : this.offsets[match]!.x;
      if (match >= 0) unclaimed.delete(match);
      let target = 0;
      if (pointer) {
        const dx = glyph.x - pointer.x;
        const dy = glyph.y - pointer.y;
        const radius = pointer.radius + glyph.size * 0.5;
        // 影响范围是横向拉长 1.6 倍的椭圆，竖直方向越居中、水平方向越靠近，拨得越远
        if (Math.abs(dy) < radius && Math.abs(dx) < radius * 1.6) {
          const vertical = Math.pow(1 - (dy / radius) ** 2, 1.5);
          const horizontal = Math.pow(Math.max(0, 1 - Math.abs(dx) / (radius * 1.6)), 2);
          target = (dx === 0 ? (previous < 0 ? -1 : 1) : Math.sign(dx)) * radius * vertical * horizontal;
        }
      }
      const offset = previous + (target - previous) * blend;
      next.push({ x: offset, bx: glyph.x, by: glyph.y, color: glyph.color, subject: glyph.subject });
      return { ...glyph, x: glyph.x + offset, displaced: Math.abs(offset) > 0.5 };
    });
    const order = shifted.map((_, index) => index).sort((a, b) => shifted[a]!.x - shifted[b]!.x);
    for (let i = 0; i < order.length; i++) {
      const leftIndex = order[i]!;
      const left = shifted[leftIndex]!;
      if (!left.displaced) continue;
      for (let j = i + 1; j < order.length; j++) {
        const rightIndex = order[j]!;
        const right = shifted[rightIndex]!;
        const minGap = Math.min(left.size, right.size) * 0.67;
        if (right.x - left.x > minGap) break;
        if (Math.abs(right.y - left.y) < Math.min(left.size, right.size) * 0.75 && right.displaced) {
          const push = (minGap - (right.x - left.x)) * 0.5;
          left.x -= push;
          right.x += push;
          next[leftIndex]!.x -= push;
          next[rightIndex]!.x += push;
        }
      }
    }
    this.offsets = next;
    return shifted;
  }
}

// ═════════════════════════════ 水面 ═════════════════════════════

/** 水面上的矩形障碍（生物字形、标题文字等），reactive 为 false 时只推开不激起亮光 */
interface OceanObstacle extends AvoidanceArea {
  reactive?: boolean;
}

/** 圆形障碍：漂浮的气泡与指针 */
interface Bubble {
  x: number;
  y: number;
  r: number;
  reactive: boolean;
  collisionRadius: number;
}

/** 仍在生效的尾迹 */
interface ActiveWake {
  x: number;
  y: number;
  power: number;
  age: number;
  /** 随年龄平方衰减后的强度 */
  decay: number;
}

/** 喷射瞬间激亮水面的区域 */
interface TintSource extends AvoidanceArea {
  power: number;
}

/**
 * 水面粒子场。两种模式：
 * - 纵深模式（存在黑洞按钮时）：粒子沿射线向按钮汇聚形成隧道，生物经过处的粒子被推开并溅出闪烁的飞沫；
 * - 平面模式：粒子随一股向右的水流漂动、到右边缘后回到左侧，水母喷射留下涡旋尾迹，
 *   生物字形、避让区域、气泡与指针把粒子推开，粒子之间互相排斥；受到足够挤压的粒子会短暂亮起。
 */
class OceanField {
  private particles: WaterParticle[] = [];
  private previousTime: number | null = null;
  private spacing = 0;
  private driftSource: WaterParticle[] | null = null;
  private waterDrifts: WaterDrift[] = [];
  private collisionStorage: CollisionGrid | null = null;
  private collisionViewport: Viewport | null = null;
  private collisionCell = 0;

  reset(): void {
    this.particles = [];
    this.previousTime = null;
    this.spacing = 0;
  }

  frame(
    time: number,
    settings: SceneSettings,
    glyphs: readonly SceneGlyph[],
    wakes: readonly Wake[],
    mode: OceanMode,
    pointer: Pointer | null,
    obstacles: readonly AvoidanceArea[],
    viewport: Viewport,
  ): WaterGlyph[] {
    if (!settings.oceanEnabled) {
      this.reset();
      return [];
    }
    const spacing = settings.oceanSpacing;
    const glyphSize = Math.min(settings.fontSize, spacing * 0.68);
    // 粒子碰撞盒的半宽、半高
    const halfWidth = glyphSize * 0.34 + 2;
    const halfHeight = glyphSize * 0.6 + 2;
    if (spacing !== this.spacing || this.previousTime === null || time < this.previousTime) {
      // 重建粒子：错行排布的蜂窝网格，左右各多铺一列以便水流循环
      this.spacing = spacing;
      this.particles = [];
      const compress = viewport.depthTarget ? 0.95 : 1;
      const columnStep = spacing * 1.35 * compress;
      const rowStep = spacing * 1.55 * compress;
      for (let row = 0; row < Math.ceil(viewport.height / rowStep); row++) {
        for (let column = -1; column < Math.ceil(viewport.width / columnStep) + 1; column++) {
          const y = viewport.top + (row + 0.5) * rowStep;
          const x = viewport.left + (column + 0.5 + (row % 2) * 0.4) * columnStep;
          this.particles.push({
            x,
            y,
            vx: 0,
            vy: 0,
            homeX: x,
            homeY: y,
            energy: 0,
            visualSpeed: 0,
            pressure: 0,
            armed: true,
            quiet: 0,
            phase: hash01(row * 57 + column + 4) * Math.PI * 2,
            frameCurrent: 0,
            frameDrift: 0,
          });
        }
      }
      this.previousTime = time;
    }
    const dt = Math.max(0, Math.min(0.08, time - this.previousTime));
    this.previousTime = time;
    if (viewport.depthTarget) return this.depthFrame(time, dt, settings, glyphs, mode, pointer, viewport, viewport.depthTarget, glyphSize);
    return this.flowFrame(time, dt, settings, glyphs, wakes, mode, pointer, obstacles, viewport, glyphSize, halfWidth, halfHeight);
  }

  /** 纵深隧道模式的一帧 */
  private depthFrame(
    time: number,
    dt: number,
    settings: SceneSettings,
    glyphs: readonly SceneGlyph[],
    mode: OceanMode,
    pointer: Pointer | null,
    viewport: Viewport,
    target: Point,
    glyphSize: number,
  ): WaterGlyph[] {
    const palette = resolvePalette(settings);
    const waterRgb = hexToRgb(palette.water);
    const activeRgb = hexToRgb(palette.waterActive);
    // 每一圈的粒子数：粒子按下标依次分到各条射线（角度）和各个深度层
    const ringSize = Math.max(48, Math.round(viewport.width / 14));
    const ringCount = Math.ceil(this.particles.length / ringSize);
    const offsetBlend = 1 - Math.exp(-dt * 5);
    // 生物覆盖度网格：32 像素一格，每个字形影响 84 像素半径
    const cell = 32;
    const coverage = new Map<number, number>();
    const pushes = new Map<number, { x: number; y: number; weight: number }>();
    const cellKey = (cx: number, cy: number): number => (cx + 4096) * 8192 + cy + 4096;
    for (const glyph of glyphs) {
      if (glyph.char === " " || glyph.alpha < 0.05) continue;
      const gx = Math.floor(glyph.x / cell);
      const gy = Math.floor(glyph.y / cell);
      for (let cx = gx - 2; cx <= gx + 3; cx++) {
        for (let cy = gy - 2; cy <= gy + 3; cy++) {
          const ox = cx * cell - glyph.x;
          const oy = cy * cell - glyph.y;
          const distance = Math.hypot(ox, oy);
          const weight = Math.max(0, 1 - distance / 84) * glyph.alpha;
          if (weight > 0) {
            const key = cellKey(cx, cy);
            coverage.set(key, Math.max(coverage.get(key) || 0, weight));
            const push = pushes.get(key) || { x: 0, y: 0, weight: 0 };
            const strength = Math.min(64, 84 - distance) * glyph.alpha;
            push.x += (ox / (distance || 1)) * strength * weight;
            push.y += (oy / (distance || 1)) * strength * weight;
            push.weight += weight;
            pushes.set(key, push);
          }
        }
      }
    }
    const glowRise = 1 - Math.exp(-dt * 14);
    const glowFall = Math.exp(-dt * 3);
    if (this.driftSource !== this.particles) {
      this.driftSource = this.particles;
      this.waterDrifts = [];
    }
    const drifts = this.waterDrifts;
    // 飞沫总数上限；中心区域以外的飞沫最多占六成
    const driftLimit = Math.min(320, Math.ceil(this.particles.length * 0.3));
    let outerDrifts = drifts.reduce((sum, drift) => sum + (drift.central ? 0 : 1), 0);
    const outerLimit = Math.floor(driftLimit * 0.6);
    // 水面色先提亮 22%，再向高亮色混合 glow，最后向白色混合 whiten
    const mixColor = (glow: number, whiten = 0): string =>
      `rgb(${waterRgb
        .map((channel, index) => {
          const lifted = channel + (255 - channel) * 0.22;
          const mixed = lifted + (activeRgb[index]! - lifted) * glow;
          return Math.round(mixed + (255 - mixed) * whiten);
        })
        .join(",")})`;
    const output: WaterGlyph[] = this.particles.map((particle, index) => {
      particle.depthAngle = ((index % ringSize) / ringSize) * Math.PI * 2;
      particle.depthPhase = ((Math.floor(index / ringSize) + (index % 2) * 0.5) / ringCount) % 1;
      advanceDepthParticle(particle, dt, viewport, target, settings);
      particle.creatureRefillAge = (particle.creatureRefillAge ?? 9) + dt;
      // 指针附近的粒子被轻轻推开（高斯衰减，最大 12 像素）
      let pushX = 0;
      let pushY = 0;
      if (pointer) {
        const px = particle.homeX - pointer.x;
        const py = particle.homeY - pointer.y;
        const distance = Math.hypot(px, py);
        const strength = Math.exp((-distance * distance) / 4900) * 12;
        pushX = (px / (distance || 1)) * strength;
        pushY = (py / (distance || 1)) * strength;
      }
      particle.depthOffsetX = (particle.depthOffsetX || 0) + (pushX - (particle.depthOffsetX || 0)) * offsetBlend;
      particle.depthOffsetY = (particle.depthOffsetY || 0) + (pushY - (particle.depthOffsetY || 0)) * offsetBlend;
      particle.x = particle.homeX + particle.depthOffsetX;
      particle.y = particle.homeY + particle.depthOffsetY;
      // 双线性插值出粒子所在处的生物覆盖度与推开方向
      const fx = particle.homeX / cell;
      const fy = particle.homeY / cell;
      const cx = Math.floor(fx);
      const cy = Math.floor(fy);
      const tx = fx - cx;
      const ty = fy - cy;
      const c00 = coverage.get(cellKey(cx, cy)) || 0;
      const c10 = coverage.get(cellKey(cx + 1, cy)) || 0;
      const c01 = coverage.get(cellKey(cx, cy + 1)) || 0;
      const c11 = coverage.get(cellKey(cx + 1, cy + 1)) || 0;
      const presence = c00 * (1 - tx) * (1 - ty) + c10 * tx * (1 - ty) + c01 * (1 - tx) * ty + c11 * tx * ty;
      let avoidX = 0;
      let avoidY = 0;
      for (let oy = 0; oy < 2; oy++) {
        for (let ox = 0; ox < 2; ox++) {
          const push = pushes.get(cellKey(cx + ox, cy + oy));
          if (push) {
            const weight = (ox ? tx : 1 - tx) * (oy ? ty : 1 - ty);
            avoidX += (push.x / push.weight) * weight;
            avoidY += (push.y / push.weight) * weight;
          }
        }
      }
      const avoidStrength = Math.hypot(avoidX, avoidY);
      const sparkSeed = ((index * 73 + 19) % 251) / 251;
      const targetDistance = Math.hypot(particle.homeX - target.x, particle.homeY - target.y);
      const coreRadius = Math.min(190, viewport.width * 0.4);
      const central = targetDistance < coreRadius;
      const coreWeight = Math.max(0, 1 - targetDistance / coreRadius);
      const avoidBlend = 1 - Math.exp(-dt * 10);
      particle.creatureAvoidX
        = (particle.creatureAvoidX || 0) + (avoidX - (particle.creatureAvoidX || 0)) * avoidBlend;
      particle.creatureAvoidY
        = (particle.creatureAvoidY || 0) + (avoidY - (particle.creatureAvoidY || 0)) * avoidBlend;
      particle.x += particle.creatureAvoidX;
      particle.y += particle.creatureAvoidY;
      const refill = Math.min(
        1,
        Math.max(0, (particle.creatureRefillAge - (particle.creatureRefillDelay ?? 0.25)) / 0.55),
      );
      // 粒子被生物明显挤开时，原地留下一个向外飞溅的飞沫，粒子自身隐去，过一会儿再淡入
      if (
        refill >= 0.55
        && presence > 0.12
        && avoidStrength > (central ? 2 : 4)
        && particle.depthAlpha > 0.05
        && drifts.length < driftLimit
        && (central || outerDrifts < outerLimit)
      ) {
        const clearance = Math.min(64, 84 * presence) * (1 + coreWeight * 0.3);
        const speed = 18;
        drifts.push({
          x: particle.x,
          y: particle.y,
          vx: (avoidX / avoidStrength) * speed,
          vy: (avoidY / avoidStrength) * speed,
          clearanceX: (avoidX / avoidStrength) * clearance,
          clearanceY: (avoidY / avoidStrength) * clearance,
          age: 0,
          life: 1.05 + (((index * 37) % 101) / 101) * 0.55,
          size: glyphSize * particle.depthScale,
          alpha: particle.depthAlpha * refill,
          spark: sparkSeed < 0.3,
          phase: index * 2.399,
          central,
        });
        if (!central) outerDrifts++;
        particle.creatureRefillDelay = 0.25 + coreWeight * 0.35;
        particle.creatureRefillAge = 0;
      }
      const settle = Math.min(
        1,
        Math.max(0, (particle.creatureRefillAge - (particle.creatureRefillDelay ?? 0.25)) / 0.55),
      );
      const settleEase = settle * settle * (3 - 2 * settle);
      // 约三成粒子在生物经过时闪烁发光，亮起快、熄灭慢
      const sparkle = sparkSeed < 0.3 ? 0.65 + 0.35 * Math.sin(time * (2.2 + sparkSeed * 3) + index * 2.399) ** 2 : 0;
      const glowTarget = Math.min(1, presence * 2.4) * sparkle;
      const glow = particle.creatureGlow || 0;
      particle.creatureGlow = glowTarget > glow ? glow + (glowTarget - glow) * glowRise : Math.max(glowTarget, glow * glowFall);
      const activation = Math.max(particle.depthActivation, particle.creatureGlow * 0.98);
      // 黑洞中心附近再叠一圈泛白的光晕
      const haloRadius = Math.min(90, viewport.width * 0.2);
      const haloDistance = Math.hypot(particle.x - target.x, particle.y - target.y);
      const halo = 0.58 * Math.exp((-haloDistance * haloDistance) / (haloRadius * haloRadius * 0.5));
      return {
        x: particle.x,
        y: particle.y,
        char: mode === "bars" ? "━" : "≈",
        size: glyphSize * particle.depthScale,
        color: mixColor(activation, halo),
        alpha: (0.5 + 0.47 * activation) * particle.depthAlpha * settleEase,
      };
    });
    // 推进飞沫：先用 0.1 秒补足让位距离，再带着初速度滑行（阻尼 0.12），寿命内平方淡出
    let kept = 0;
    for (const drift of drifts) {
      drift.age += dt;
      if (drift.age >= drift.life) continue;
      const clear = 1 - Math.exp(-dt * 10);
      drift.x += drift.clearanceX * clear;
      drift.y += drift.clearanceY * clear;
      drift.clearanceX *= 1 - clear;
      drift.clearanceY *= 1 - clear;
      // 指数阻尼下速度对时间的积分
      const glide = (1 - Math.exp(-dt * 0.12)) / 0.12;
      drift.x += drift.vx * glide;
      drift.y += drift.vy * glide;
      drift.vx *= Math.exp(-dt * 0.12);
      drift.vy *= Math.exp(-dt * 0.12);
      const fade = 1 - drift.age / drift.life;
      const flicker = drift.spark ? 0.78 + 0.22 * Math.sin(drift.age * 8 + drift.phase) ** 2 : 0.08;
      output.push({
        x: drift.x,
        y: drift.y,
        char: mode === "bars" ? "━" : "≈",
        size: drift.size,
        color: mixColor(flicker),
        alpha: drift.alpha * (drift.spark ? 0.98 : 0.48) * fade * fade,
      });
      drifts[kept++] = drift;
    }
    drifts.length = kept;
    return output;
  }

  /**
   * 平面水流模式的一帧。
   * 原实现在这一分支里还有几处针对纵深目标的判断，但该分支只在没有纵深目标时执行，那些判断恒不成立，已省略。
   */
  private flowFrame(
    time: number,
    dt: number,
    settings: SceneSettings,
    glyphs: readonly SceneGlyph[],
    wakes: readonly Wake[],
    mode: OceanMode,
    pointer: Pointer | null,
    avoidAreas: readonly AvoidanceArea[],
    viewport: Viewport,
    glyphSize: number,
    halfWidth: number,
    halfHeight: number,
  ): WaterGlyph[] {
    // 障碍：外部指定的避让区域 + 每个可见生物字形的包围盒 + 同一行伞盖字形连成的整条横带
    const obstacles: OceanObstacle[] = avoidAreas.map(area => ({ ...area, reactive: true }));
    const bellRows = new Map<string, SceneGlyph[]>();
    for (const glyph of glyphs) {
      if (glyph.char === " " || glyph.alpha < 0.4) continue;
      obstacles.push({
        x: glyph.x,
        y: glyph.y,
        hw: Math.max(glyph.size * 0.35, mode === "bars" ? 8 : 0) + 3,
        hh: Math.max(glyph.size * 0.52, mode === "bars" ? settings.barHeight / 2 : 0) + 3,
      });
      if (glyph.color === ROLE_BELL && !glyph.displaced) {
        const key = `${glyph.subject}:${glyph.y}`;
        const row = bellRows.get(key) ?? [];
        row.push(glyph);
        bellRows.set(key, row);
      }
    }
    for (const row of bellRows.values()) {
      if (row.length < 2) continue;
      const minX = Math.min(...row.map(glyph => glyph.x));
      const maxX = Math.max(...row.map(glyph => glyph.x));
      obstacles.push({ x: (minX + maxX) / 2, y: row[0]!.y, hw: (maxX - minX) / 2 + 4, hh: row[0]!.size * 0.65 + 3 });
    }
    // 尾迹按 128 像素的格子分桶（每条尾迹覆盖 4 倍半径）
    const activeWakes: ActiveWake[] = wakes
      .map((wake) => {
        const age = time - wake.time;
        return {
          x: wake.x,
          y: wake.y,
          power: wake.power,
          age,
          decay: Math.pow(1 - age / settings.wakeLife, 2) * wake.power,
        };
      })
      .filter(wake => wake.age >= 0 && wake.age <= settings.wakeLife);
    const wakeGrid = new Map<number, ActiveWake[]>();
    const wakeCell = 128;
    const totalDecay = activeWakes.reduce((sum, wake) => sum + wake.decay, 0);
    for (const wake of activeWakes) {
      const reach = settings.wakeRadius * 4;
      for (let cx = Math.floor((wake.x - reach) / wakeCell); cx <= Math.floor((wake.x + reach) / wakeCell); cx++) {
        for (let cy = Math.floor((wake.y - reach) / wakeCell); cy <= Math.floor((wake.y + reach) / wakeCell); cy++) {
          const key = gridKey(cx, cy);
          const list = wakeGrid.get(key) ?? [];
          list.push(wake);
          wakeGrid.set(key, list);
        }
      }
    }
    // 障碍按 48 像素的格子分桶（范围含粒子碰撞盒）
    const obstacleCell = 48;
    const obstacleGrid = new Map<number, OceanObstacle[]>();
    for (const obstacle of obstacles) {
      for (
        let cx = Math.floor((obstacle.x - obstacle.hw - halfWidth) / obstacleCell);
        cx <= Math.floor((obstacle.x + obstacle.hw + halfWidth) / obstacleCell);
        cx++
      ) {
        for (
          let cy = Math.floor((obstacle.y - obstacle.hh - halfHeight) / obstacleCell);
          cy <= Math.floor((obstacle.y + obstacle.hh + halfHeight) / obstacleCell);
          cy++
        ) {
          const key = gridKey(cx, cy);
          const list = obstacleGrid.get(key) ?? [];
          list.push(obstacle);
          obstacleGrid.set(key, list);
        }
      }
    }
    // 喷射后 0.35 秒内、强度超过 0.35 的尾迹，在水母各行周围激亮水面
    const tintGrid = new Map<number, TintSource[]>();
    for (const wake of wakes) {
      const age = time - wake.time;
      if (age < 0 || age > 0.35 || wake.power <= 0.35) continue;
      for (const area of wake.footprint) {
        const radius = settings.tintRadius;
        const source = { ...area, power: wake.power * (1 - age / 0.35) };
        for (let cx = Math.floor((area.x - area.hw - radius) / 48); cx <= Math.floor((area.x + area.hw + radius) / 48); cx++) {
          for (let cy = Math.floor((area.y - area.hh - radius) / 48); cy <= Math.floor((area.y + area.hh + radius) / 48); cy++) {
            const key = gridKey(cx, cy);
            const list = tintGrid.get(key) ?? [];
            list.push(source);
            tintGrid.set(key, list);
          }
        }
      }
    }
    // 气泡：位置由 hash01 决定，匀速上浮并循环；指针也当作一个会激起亮光的气泡
    const bubbles: Bubble[] = Array.from({ length: settings.bubbleCount }, (_, index) => ({
      x: viewport.left + 10 + hash01(index + 4) * (viewport.width - 30) + Math.sin(time * 0.4 + index) * 12,
      y:
        viewport.top
        - 30
        + positiveMod(
          hash01(index + 20) * (viewport.height + 60) - time * settings.bubbleSpeed * (0.7 + hash01(index + 12)),
          viewport.height + 60,
        ),
      r: settings.bubbleSize * (0.7 + hash01(index + 41) * 0.6),
      reactive: false,
      collisionRadius: 0,
    }));
    if (pointer) bubbles.push({ x: pointer.x, y: pointer.y, r: pointer.radius, reactive: true, collisionRadius: 0 });
    const bubblePadding = Math.hypot(halfWidth, halfHeight) * 0.8;
    for (const bubble of bubbles) bubble.collisionRadius = bubble.r + bubblePadding;
    // 按 1/60 秒拆成子步，保证大步长下碰撞依然稳定
    const steps = Math.max(1, Math.ceil(dt / (1 / 60)));
    const stepDt = dt / steps;
    const cellSize = halfWidth * 2 + 4;
    if (
      !this.collisionStorage
      || this.collisionStorage.next.length !== this.particles.length
      || this.collisionViewport !== viewport
      || this.collisionCell !== cellSize
    ) {
      this.collisionStorage = new CollisionGrid(this.particles.length, viewport, cellSize);
      this.collisionViewport = viewport;
      this.collisionCell = cellSize;
    }
    const grid = this.collisionStorage;
    const chainNext = grid.next;
    const follow = 1 - Math.exp(-stepDt * 3);
    // 尾迹总量越大，单条尾迹的推力越小，避免多条叠加后过猛
    const wakeGain = (settings.wakeStrength * 1.8) / Math.max(1, totalDecay * 0.5);
    const wakeSpread = settings.wakeRadius * settings.wakeRadius * 0.65;
    const vortexSpread = settings.wakeRadius * settings.wakeRadius * 0.35;
    for (const particle of this.particles) {
      // 水流：速度随高度做正弦起伏，另加一个按粒子相位的竖向漂移
      particle.frameCurrent = settings.oceanSpeed * (9 + Math.sin(particle.homeY * 0.012 + time * 0.3) * 3);
      particle.frameDrift = Math.sin(time * 0.65 + particle.phase) * settings.oceanSpeed * 3;
    }
    for (let step = 0; step < steps; step++) {
      for (const particle of this.particles) particle.pressure = 0;
      if (stepDt > 0) {
        for (const particle of this.particles) {
          const current = particle.frameCurrent;
          particle.homeX = Math.min(viewport.right + 70, particle.homeX + current * stepDt);
          const offsetX = particle.homeX - particle.x;
          const offsetY = particle.homeY - particle.y;
          const refill = settings.refillSpeed;
          const limit = (value: number): number => Math.max(-80, Math.min(80, value));
          // 期望速度 = 水流 + 回位弹簧（限幅 80）
          let targetVx = current + limit(offsetX * refill);
          let targetVy = particle.frameDrift + limit(offsetY * refill);
          let wakeX = 0;
          let wakeY = 0;
          let pressure = 0;
          for (const wake of wakeGrid.get(gridKey(Math.floor(particle.x / wakeCell), Math.floor(particle.y / wakeCell))) ?? []) {
            const { age, decay } = wake;
            const dx = particle.x - wake.x;
            const dy = particle.y - wake.y;
            const radius = settings.wakeRadius;
            const distance = Math.hypot(dx, dy);
            // 径向外推
            const radial = Math.exp((-distance * distance) / wakeSpread);
            // 左右各一个涡旋，涡心在尾迹斜下方并随年龄下沉
            const side = dx < 0 ? -1 : 1;
            const vx = dx - side * radius * 0.4;
            const vy = dy - radius * 0.4 - age * 12;
            const vortex = Math.exp(-(vx * vx + vy * vy) / vortexSpread);
            wakeX += ((dx / (distance + 1)) * radial - ((side * vy) / radius) * vortex) * decay;
            wakeY += ((dy / (distance + 1)) * radial * 0.3 + ((side * vx) / radius) * vortex + vortex * 0.5) * decay;
            if (age < 0.4 && distance < radius && wake.power > 0.35) {
              pressure = Math.max(pressure, (1 - distance / radius) * wake.power * settings.wakeStrength * 1.8);
            }
          }
          targetVx += wakeX * wakeGain;
          targetVy += wakeY * wakeGain;
          for (const tint of tintGrid.get(gridKey(Math.floor(particle.x / 48), Math.floor(particle.y / 48))) ?? []) {
            const gapX = Math.max(0, Math.abs(particle.x - tint.x) - tint.hw);
            const gapY = Math.max(0, Math.abs(particle.y - tint.y) - tint.hh);
            const falloff = Math.max(0, 1 - Math.hypot(gapX, gapY) / settings.tintRadius);
            pressure = Math.max(pressure, Math.sqrt(falloff) * tint.power * settings.tintStrength * 2.4);
          }
          particle.pressure = pressure;
          particle.vx += (targetVx - particle.vx) * follow;
          particle.vy += (targetVy - particle.vy) * follow;
          particle.x += particle.vx * stepDt;
          particle.y += particle.vy * stepDt;
          // 漂出右边缘后从左侧画外重新进入
          if (particle.homeX >= viewport.right + 70 && particle.x > viewport.right + 30) {
            particle.x = viewport.left - 50;
            particle.homeX = viewport.left - 50;
            particle.y = particle.homeY;
            particle.vx = current;
            particle.vy = 0;
            particle.energy = 0;
            particle.visualSpeed = 0;
            particle.pressure = 0;
            particle.armed = true;
            particle.quiet = 0;
          }
        }
      }
      // 迭代 5 轮位置约束：障碍、气泡、粒子互斥
      for (let pass = 0; pass < 5; pass++) {
        for (const particle of this.particles) {
          for (const obstacle of obstacleGrid.get(
            gridKey(Math.floor(particle.x / obstacleCell), Math.floor(particle.y / obstacleCell)),
          ) ?? []) {
            const dx = particle.x - obstacle.x;
            const dy = particle.y - obstacle.y;
            const overlapX = halfWidth + obstacle.hw - Math.abs(dx);
            const overlapY = halfHeight + obstacle.hh - Math.abs(dy);
            if (overlapX <= 0 || overlapY <= 0) continue;
            // 只在第一轮记录挤压量，避免多轮重复累计
            if (obstacle.reactive !== false && pass === 0 && Math.min(overlapX, overlapY) > 1)
              particle.pressure = Math.max(particle.pressure, Math.min(overlapX, overlapY) * 30);
            // 沿穿透较浅的轴推出
            if (overlapX < overlapY) {
              particle.x += (dx < 0 ? -1 : 1) * (overlapX + 0.2);
              particle.vx *= 0.8;
            }
            else {
              particle.y += (dy < 0 ? -1 : 1) * (overlapY + 0.2);
              particle.vy *= 0.8;
            }
          }
          for (const bubble of bubbles) {
            const dx = particle.x - bubble.x;
            const dy = particle.y - bubble.y;
            const radius = bubble.collisionRadius;
            if (Math.abs(dx) >= radius || Math.abs(dy) >= radius || dx * dx + dy * dy >= radius * radius) continue;
            const distance = Math.hypot(dx, dy);
            if (bubble.reactive && pass === 0 && radius - distance > 1)
              particle.pressure = Math.max(particle.pressure, (radius - distance) * 30);
            if (distance < radius) {
              particle.x += (dx / (distance || 1)) * (radius - distance);
              particle.y += (dy / (distance || 1)) * (radius - distance);
            }
          }
        }
        // 粒子两两互斥：边插入网格边检查已插入的邻居，每对只处理一次
        grid.clear();
        for (let index = 0; index < this.particles.length; index++) {
          const particle = this.particles[index]!;
          const cx = Math.floor(particle.x / cellSize);
          const cy = Math.floor(particle.y / cellSize);
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
              for (let other = grid.get(nx, ny); other !== -1; other = chainNext[other]!) {
                const neighbor = this.particles[other]!;
                const dx = particle.x - neighbor.x;
                const dy = particle.y - neighbor.y;
                const overlapX = halfWidth * 2 + 2 - Math.abs(dx);
                const overlapY = halfHeight * 2 + 2 - Math.abs(dy);
                if (overlapX <= 0 || overlapY <= 0) continue;
                if (overlapX < overlapY) {
                  const shift = (dx < 0 ? -1 : 1) * (overlapX + 0.1) * 0.5;
                  particle.x += shift;
                  neighbor.x -= shift;
                }
                else {
                  const shift = (dy < 0 ? -1 : 1) * (overlapY + 0.1) * 0.5;
                  particle.y += shift;
                  neighbor.y -= shift;
                }
              }
            }
          }
          grid.append(cx, cy, index);
        }
      }
      // 亮度：挤压超过 18 时激起（上膛的粒子才会触发），之后指数衰减；突然减速的粒子衰减得更快
      if (stepDt > 0) {
        this.particles.forEach((particle) => {
          const current = particle.frameCurrent;
          const speed = Math.hypot(particle.vx - current, particle.vy - particle.frameDrift);
          const slowdown = Math.max(0, (particle.visualSpeed - speed) / Math.max(1, particle.visualSpeed));
          particle.energy *= Math.exp(-stepDt * (9 + slowdown * 24));
          if (particle.armed && particle.pressure > 18) {
            particle.energy = Math.max(particle.energy, Math.min(1, 0.65 + particle.pressure / 150));
            particle.armed = false;
            particle.quiet = 0;
          }
          if (particle.pressure < 6) {
            particle.quiet += stepDt;
            if (particle.quiet > 0.25) particle.armed = true;
          }
          else {
            particle.quiet = 0;
          }
          particle.visualSpeed = speed;
        });
      }
    }
    const palette = resolvePalette(settings);
    const waterRgb = hexToRgb(palette.water);
    const activeRgb = hexToRgb(palette.waterActive);
    // 暗色背景下静止色提亮 22%，不透明度也整体加 0.18
    const baseRgb = settings.darkBackground ? waterRgb.map(channel => Math.round(channel + (255 - channel) * 0.22)) : waterRgb;
    return this.particles.map((particle) => {
      const glow = Math.max(particle.energy, (particle.depthActivation ?? 0) * 0.92);
      const color = `rgb(${baseRgb.map((channel, index) => Math.round(channel + (activeRgb[index]! - channel) * glow)).join(",")})`;
      const opacity = settings.oceanOpacity / 100;
      const base = settings.darkBackground ? Math.min(0.85, opacity + 0.18) : opacity;
      return {
        x: particle.x,
        y: particle.y,
        char: mode === "bars" ? "━" : "≈",
        size: glyphSize * (particle.depthScale ?? 1),
        color,
        alpha: (base + (Math.max(base, 0.98) - base) * glow) * (particle.depthAlpha ?? 1),
      };
    });
  }
}

// ═════════════════════════════ 水面的 WebGL 绘制 ═════════════════════════════

/**
 * 顶点着色器：每个粒子一个点精灵。
 * 场景坐标以 (460, 305) 为中心（与 SVG viewBox 的中心一致），乘以设备像素比后换算到裁剪空间（y 轴翻转）；
 * 点大小 = 字号 × 1.6 × 设备像素比，留出余量容纳整个字形。
 */
const WATER_VERTEX_SHADER
  = "attribute vec3 position;"
    + "attribute vec4 color;"
    + "uniform vec2 viewport;"
    + "uniform float scale;"
    + "varying vec4 tint;"
    + "void main(){"
    + "vec2 p=(position.xy-vec2(460.,305.))*scale;"
    + "gl_Position=vec4(p.x/(viewport.x*.5),-p.y/(viewport.y*.5),0.,1.);"
    + "gl_PointSize=position.z*1.6*scale;"
    + "tint=color;"
    + "}";

/**
 * 片元着色器：从字形图集取覆盖度，乘以粒子透明度后再取三次方——
 * 让半透明字形的边缘收得更干净，低透明度的粒子也更暗；输出预乘 alpha 的颜色。
 */
const WATER_FRAGMENT_SHADER
  = "precision mediump float;"
    + "uniform sampler2D atlas;"
    + "varying vec4 tint;"
    + "void main(){"
    + "float a=texture2D(atlas,gl_PointCoord).a;"
    + "float coverage=tint.a*a;"
    + "float opacity=coverage*coverage*coverage;"
    + "gl_FragColor=vec4(tint.rgb*opacity,opacity);"
    + "}";

/**
 * 用 WebGL 点精灵一次性画完所有水面字形（几千个 SVG text 太慢）。
 * 所有粒子共用同一个字符，字符变化时才重绘 64×64 的字形图集。上下文丢失时 draw 返回 false，由调用方退回 SVG。
 */
class WaterRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  /** 顶点数据：每个粒子 7 个浮点数（x, y, 字号, r, g, b, a） */
  private data = new Float32Array(0);
  private lost = false;
  /** 图集里当前画的字符 */
  private glyph = "";
  /** rgb() 字符串到分量数组的缓存 */
  private readonly colors = new Map<string, number[]>();
  private readonly onLost = (event: Event): void => {
    // 阻止默认行为，浏览器才会在条件允许时恢复上下文
    event.preventDefault();
    this.lost = true;
  };

  private readonly onRestored = (): void => {
    this.lost = false;
    this.init();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    if (this.gl) this.init();
  }

  /** 编译着色器并创建缓冲与纹理；任何一步失败都把渲染器标记为不可用 */
  private init(): void {
    const gl = this.gl;
    if (!gl) return;
    const compile = (type: number, source: string): WebGLShader => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Water shader compile failed");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error("Water shader compile failed");
      return shader;
    };
    try {
      const vertex = compile(gl.VERTEX_SHADER, WATER_VERTEX_SHADER);
      const fragment = compile(gl.FRAGMENT_SHADER, WATER_FRAGMENT_SHADER);
      const program = gl.createProgram();
      this.program = program;
      if (!program) throw new Error("Water shader link failed");
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Water shader link failed");
      this.buffer = gl.createBuffer();
      this.texture = gl.createTexture();
      this.glyph = "";
    }
    catch {
      this.lost = true;
    }
  }

  /** 画一帧水面；返回 false 表示 WebGL 不可用 */
  draw(particles: readonly WaterGlyph[]): boolean {
    const gl = this.gl;
    if (!gl || this.lost || !this.program) return false;
    const rect = this.canvas.getBoundingClientRect();
    // 设备像素比最多取 2，兼顾清晰度与填充率
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!particles.length) return true;
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    if (this.glyph !== particles[0]!.char) {
      this.glyph = particles[0]!.char;
      const atlas = document.createElement("canvas");
      atlas.width = atlas.height = 64;
      const context = atlas.getContext("2d")!;
      context.font = "600 40px 'Courier New', monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#fff";
      context.fillText(this.glyph, 32, 32);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    if (this.data.length < particles.length * 7) this.data = new Float32Array(particles.length * 7);
    particles.forEach((particle, index) => {
      let rgb = this.colors.get(particle.color);
      if (!rgb) {
        rgb = particle.color.match(/\d+/g)!.map(Number);
        this.colors.set(particle.color, rgb);
      }
      this.data.set(
        [particle.x, particle.y, particle.size, rgb[0]! / 255, rgb[1]! / 255, rgb[2]! / 255, particle.alpha],
        index * 7,
      );
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.subarray(0, particles.length * 7), gl.DYNAMIC_DRAW);
    const position = gl.getAttribLocation(this.program, "position");
    const color = gl.getAttribLocation(this.program, "color");
    // 交错布局：步长 28 字节，颜色从第 12 字节开始
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(color);
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 28, 12);
    gl.uniform2f(gl.getUniformLocation(this.program, "viewport"), width, height);
    gl.uniform1f(gl.getUniformLocation(this.program, "scale"), ratio);
    // 着色器输出预乘 alpha，混合用 ONE / ONE_MINUS_SRC_ALPHA
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.POINTS, 0, particles.length);
    return true;
  }

  /** 释放 GPU 资源并主动丢弃上下文（原实现只删除资源，这里额外调用 WEBGL_lose_context 立即归还上下文） */
  dispose(): void {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    const gl = this.gl;
    if (!gl) return;
    gl.deleteProgram(this.program);
    gl.deleteBuffer(this.buffer);
    gl.deleteTexture(this.texture);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

// ═════════════════════════════ 文字避让区域 ═════════════════════════════

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * 把元素里文字实际排版出的行框换算成场景坐标下的避让区域（每边外扩 padding）。
 * 同一行上相邻的框合并成一个；被完全包住的框丢弃；元素位于尚未显现（透明度 < 0.05）的入场块里时不避让。
 */
function textObstacles(element: Element, svg: SVGSVGElement, padding = 8): AvoidanceArea[] {
  const reveal = element.closest("[data-overview-reveal]");
  if (reveal && Number(getComputedStyle(reveal).opacity) < 0.05) return [];
  const screenMatrix = svg.getScreenCTM();
  if (!screenMatrix || !element.getClientRects().length) return [];
  const inverse = screenMatrix.inverse();
  const range = document.createRange();
  range.selectNodeContents(element);
  const rects: Box[] = Array.from(range.getClientRects())
    .filter(rect => rect.width > 0 && rect.height > 0)
    .map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }));
  const merged: Box[] = [];
  for (const rect of rects.sort((a, b) => a.top - b.top || a.left - b.left)) {
    if (
      merged.some(
        box =>
          rect.left >= box.left - 0.5
          && rect.right <= box.right + 0.5
          && rect.top >= box.top - 0.5
          && rect.bottom <= box.bottom + 0.5,
      )
    ) {
      continue;
    }
    const sameLine = merged.find(
      box =>
        Math.abs(rect.top - box.top) < 2
        && Math.abs(rect.bottom - box.bottom) < 2
        && rect.left <= box.right + 3
        && rect.right >= box.left - 3,
    );
    if (sameLine) {
      sameLine.left = Math.min(sameLine.left, rect.left);
      sameLine.right = Math.max(sameLine.right, rect.right);
    }
    else {
      merged.push(rect);
    }
  }
  return merged.map((box) => {
    const topLeft = new DOMPoint(box.left, box.top).matrixTransform(inverse);
    const bottomRight = new DOMPoint(box.right, box.bottom).matrixTransform(inverse);
    return {
      x: (topLeft.x + bottomRight.x) / 2,
      y: (topLeft.y + bottomRight.y) / 2,
      hw: Math.abs(bottomRight.x - topLeft.x) / 2 + padding,
      hh: Math.abs(bottomRight.y - topLeft.y) / 2 + padding,
    };
  });
}

// ═════════════════════════════ 挂载 ═════════════════════════════

/** 生物字形的「故障」效果：每隔几秒随机挑约四分之一的字形，先闪成方块，再短暂显示为 0 或 1 */
interface GlitchState {
  /** 下一次触发的时刻 */
  next: number;
  /** 本次开始的时刻 */
  start: number;
  /** 字形序号 → 要显示的数字 */
  glyphs: Map<number, string>;
}

/** 绘制前的最终字形，introBlock 表示显示为白色方块 */
type ShownGlyph = SceneGlyph & { introBlock?: boolean };

/** 开场时长（秒）：水面高亮从中间向两侧扫过，结束后通知调用方 */
const INTRO_DURATION = 2.8;

/**
 * 在容器里挂载水母场景。容器必须为空；内部会创建一个铺满容器的 div，
 * 里面依次是 WebGL 水面画布与 SVG（水面文本回退层、生物层、一个隐藏的备用层）。
 */
export function mountJellyfish(container: HTMLElement, options: JellyfishOptions = {}): JellyfishController {
  if (!container || container.childNodes.length) throw new Error("Jellyfish capsule requires an empty container");
  const root = document.createElement("div");
  Object.assign(root.style, {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    userSelect: "none",
  });
  // 本模块是暗色版：固定暗色背景，同屏两个生物槽位
  const settings: SceneSettings = { ...DEFAULT_SETTINGS, darkBackground: 1, jellyCount: 2 };
  const requestedPalette = options.paletteIndex;
  if (
    typeof requestedPalette === "number"
    && Number.isInteger(requestedPalette)
    && requestedPalette >= 0
    && requestedPalette < PALETTES.length
  ) {
    settings.paletteIndex = requestedPalette;
  }
  else if (settings.randomPalette) {
    settings.paletteIndex = Math.floor(Math.random() * PALETTES.length);
  }
  root.style.background = resolvePalette(settings).background;
  options.onPalette?.(resolvePalette(settings));

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  });
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "180 65 560 480");
  svg.setAttribute("aria-hidden", "true");
  Object.assign(svg.style, {
    position: "relative",
    display: "block",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    userSelect: "none",
    touchAction: "pan-y",
  });
  const oceanLayer = document.createElementNS(SVG_NS, "g");
  const creatureLayer = document.createElementNS(SVG_NS, "g");
  const spareLayer = document.createElementNS(SVG_NS, "g");
  for (const layer of [oceanLayer, creatureLayer]) {
    layer.setAttribute("font-family", "'Courier New', monospace");
    layer.setAttribute("font-weight", "600");
    layer.setAttribute("text-anchor", "middle");
    layer.setAttribute("dominant-baseline", "central");
    layer.setAttribute("pointer-events", "none");
  }
  creatureLayer.style.display = "";
  spareLayer.style.display = "none";
  svg.append(oceanLayer, creatureLayer, spareLayer);
  root.append(canvas, svg);
  container.append(root);

  // 场景坐标系：中心固定在 (460, 305)，宽高随容器变化，1 个单位 = 1 个 CSS 像素
  let viewport: Viewport = { left: 180, right: 740, top: 65, bottom: 545, width: 560, height: 480 };
  let pointer: Pointer | null = null;
  let oceanObstacles: AvoidanceArea[] = [];
  let sceneTime = 0;
  const swarm = new JellySwarm();
  const ocean = new OceanField();
  const displacement = new PointerDisplacement();
  const water = new WaterRenderer(canvas);
  const oceanNodes: SVGTextElement[] = [];
  const creatureNodes: SVGElement[] = [];
  const contacts = createContactSolver();
  /** 每个槽位当前生物开始逐字显现的时刻 */
  const appearTimes = new Map<number, number>();
  /** 每个槽位当前生物的代数 */
  const incarnations = new Map<number, number>();
  const glitches = new Map<number, GlitchState>();
  let wakes: Wake[] = [];
  let previousSceneTime = -1;
  let lastRenderAt = performance.now();
  /** 指针相对场景中心的归一化偏移，用于水母伞盖的跟随 */
  let pointerDx = 0;
  let pointerDy = 0;
  let destroyed = false;
  let frameId = 0;
  let lastFrameAt = 0;
  let paused = false;
  let introDone = false;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let avoidElements: Element[] = [...(options.avoidElements ?? [])];
  let manualAreas: AvoidanceArea[] = [];

  /** 渲染一帧：推进生物与水面，再同步到 WebGL 画布与 SVG 节点 */
  const renderFrame = (): void => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastRenderAt) / 1e3);
    lastRenderAt = now;
    const rawGlyphs = swarm.frame(sceneTime, pointerDx, pointerDy, settings, pointer, viewport);
    if (reducedMotion.matches) contacts.reset();
    const settled = reducedMotion.matches ? rawGlyphs : contacts.apply(rawGlyphs, dt, sceneTime);
    const display = displacement.apply(settled, pointer, dt);
    const time = sceneTime;
    if (!introDone && (reducedMotion.matches || time >= INTRO_DURATION)) {
      introDone = true;
      options.onIntroComplete?.();
    }
    if (time < previousSceneTime) wakes = [];
    if (settings.oceanEnabled) {
      // 每 1/12 秒为每只水母记录一次尾迹：位置取点缀字形（伞顶）的中心，足迹取各行的包围盒
      if (time - (wakes.at(-1)?.time ?? -1) >= 1 / 12) {
        for (let subject = 0; subject < settings.jellyCount; subject++) {
          const own = display.filter(glyph => glyph.subject === subject);
          const accents = own.filter(glyph => glyph.char !== " " && glyph.color === ROLE_ACCENT);
          if (!accents.length) continue;
          const rows = new Map<number, SceneGlyph[]>();
          for (const glyph of own) {
            if (glyph.char === " " || glyph.alpha < 0.4) continue;
            const row = Math.round(glyph.y / 18);
            const list = rows.get(row) ?? [];
            list.push(glyph);
            rows.set(row, list);
          }
          const footprint = [...rows.values()].map((list) => {
            const minX = Math.min(...list.map(glyph => glyph.x));
            const maxX = Math.max(...list.map(glyph => glyph.x));
            return {
              x: (minX + maxX) / 2,
              y: list.reduce((sum, glyph) => sum + glyph.y, 0) / list.length,
              hw: (maxX - minX) / 2,
              hh: 10,
            };
          });
          wakes.push({
            x: accents.reduce((sum, glyph) => sum + glyph.x, 0) / accents.length,
            y: accents[0]!.y,
            time,
            power: jellyVariant(time, subject, settings).power,
            footprint,
          });
        }
      }
      wakes = wakes.filter(wake => time - wake.time <= settings.wakeLife).slice(-64);
    }
    else {
      wakes = [];
    }
    previousSceneTime = time;
    const waterGlyphs = ocean.frame(time, settings, display, wakes, OCEAN_MODE, pointer, oceanObstacles, viewport);
    if (!reducedMotion.matches && time < INTRO_DURATION) {
      // 开场：一道高亮从画面中线向两侧扫开，每个粒子在 0.72 秒内先快速亮起再平方衰减
      const active = hexToRgb(resolvePalette(settings).waterActive);
      for (const glyph of waterGlyphs) {
        const spread = Math.min(1, Math.abs(glyph.x - (viewport.left + viewport.width / 2)) / (viewport.width / 2));
        const age = time - (0.12 + spread * 1.8);
        if (age < 0 || age > 0.72) continue;
        const strength = age < 0.08 ? age / 0.08 : Math.pow(1 - (age - 0.08) / 0.64, 2);
        const rgb = glyph.color.match(/\d+/g)!.map(Number);
        glyph.color = `rgb(${rgb.map((channel, index) => Math.round(channel + (active[index]! - channel) * strength)).join(",")})`;
        glyph.alpha += (0.98 - glyph.alpha) * strength;
      }
    }
    const drawn = water.draw(waterGlyphs);
    canvas.style.visibility = drawn ? "visible" : "hidden";
    oceanLayer.style.display = drawn ? "none" : "";
    if (!drawn) {
      // WebGL 不可用：水面退回 SVG 文本
      while (oceanNodes.length < waterGlyphs.length) {
        const node = document.createElementNS(SVG_NS, "text");
        oceanLayer.appendChild(node);
        oceanNodes.push(node);
      }
      while (oceanNodes.length > waterGlyphs.length) oceanNodes.pop()?.remove();
      waterGlyphs.forEach((glyph, index) => {
        const node = oceanNodes[index]!;
        node.textContent = glyph.char;
        node.setAttribute("x", glyph.x.toFixed(1));
        node.setAttribute("y", glyph.y.toFixed(1));
        node.setAttribute("font-size", String(glyph.size));
        node.setAttribute("fill", glyph.color);
        node.setAttribute("opacity", glyph.alpha.toFixed(2));
      });
    }
    while (creatureNodes.length < display.length) {
      const node = document.createElementNS(SVG_NS, "text");
      creatureLayer.appendChild(node);
      creatureNodes.push(node);
    }
    while (creatureNodes.length > display.length) creatureNodes.pop()?.remove();
    const palette = resolvePalette(settings);
    const counts = new Map<number, number>();
    const orders = new Map<number, number>();
    for (const glyph of display) counts.set(glyph.subject, (counts.get(glyph.subject) ?? 0) + 1);
    if (!reducedMotion.matches) {
      for (const [subject, count] of counts) {
        let glitch = glitches.get(subject);
        if (!glitch) {
          glitch = { next: time + 2.8 + Math.random() * 1.2, start: -Infinity, glyphs: new Map() };
          glitches.set(subject, glitch);
        }
        if (time >= glitch.next) {
          glitch.start = time;
          glitch.next = time + 2.5 + Math.random() * 1.5;
          glitch.glyphs.clear();
          for (let index = 0; index < count; index++) {
            if (Math.random() < 0.25) glitch.glyphs.set(index, Math.random() < 0.5 ? "0" : "1");
          }
        }
      }
    }
    display.forEach((glyph, index) => {
      const subject = glyph.subject;
      // 换了新生物：重新开始逐字显现，故障计时也重来
      if (incarnations.get(subject) !== glyph.incarnation) {
        appearTimes.delete(subject);
        glitches.delete(subject);
        incarnations.set(subject, glyph.incarnation);
      }
      if (!appearTimes.has(subject)) appearTimes.set(subject, time);
      const order = orders.get(subject) ?? 0;
      orders.set(subject, order + 1);
      // 逐字显现：字形按序号在 0.9 秒内依次出现，每个先以方块闪烁 0.3 秒
      const sinceAppear = time - appearTimes.get(subject)!;
      const delay = (order / Math.max(1, counts.get(subject)! - 1)) * 0.9;
      const introAge = sinceAppear - delay;
      const intro = !reducedMotion.matches && introAge < 0.3;
      const introBlink = introAge < 0 ? 0.12 : introAge % 0.15 < 0.09 ? 1 : 0.12;
      // 故障效果：前 0.28 秒闪方块，0.28~0.92 秒显示数字，之后再闪方块到 1.2 秒
      const glitch = glitches.get(subject);
      const glitchAge = glitch ? time - glitch.start : Infinity;
      const glitchChar
        = !reducedMotion.matches && !intro && glitchAge >= 0 && glitchAge < 1.2 ? glitch?.glyphs.get(order) : undefined;
      const flipChar = glitchChar !== undefined && glitchAge >= 0.28 && glitchAge < 0.92 ? glitchChar : undefined;
      const glitchBlock = glitchChar !== undefined && flipChar === undefined;
      const glitchBlink = (glitchAge < 0.28 ? glitchAge : glitchAge - 0.92) % 0.14 < 0.09 ? 1 : 0.12;
      // 被触碰：与另一只生物接触，或指针落在（横向放宽 1.6 倍的）范围内，用排开前的位置判断
      const raw = rawGlyphs[index];
      const touchRadius = pointer ? pointer.radius + glyph.size * 0.5 : 0;
      const touched
        = !reducedMotion.matches
          && !intro
          && !!(
            glyph.creatureContact
            || (pointer && raw && Math.hypot((raw.x - pointer.x) / 1.6, raw.y - pointer.y) < touchRadius)
          );
      // 被触碰的字形在 0、1 之间跳动，每 0.8 秒有一段显示为方块（各字形错开 0.027 秒）
      const cycle = (time + order * 0.027) % 0.8;
      const touchBlock = touched && (glyph.contactBlock || cycle < 0.12 || cycle >= 0.66);
      const binaryChar = (order + Math.floor(time * 3)) % 2 ? "1" : "0";
      const shown: ShownGlyph = glyph.exitBlock
        ? { ...glyph, char: "█", line: undefined, introBlock: true }
        : intro
          ? { ...glyph, char: "█", line: undefined, introBlock: true, alpha: glyph.alpha * introBlink }
          : touched
            ? { ...glyph, char: touchBlock ? "█" : binaryChar, line: undefined, introBlock: touchBlock }
            : glitchBlock
              ? { ...glyph, char: "█", line: undefined, introBlock: true, alpha: glyph.alpha * glitchBlink }
              : flipChar !== undefined
                ? { ...glyph, char: flipChar, line: undefined }
                : glyph;
      const fill = shown.introBlock
        ? "#ffffff"
        : shown.color === ROLE_BELL
          ? palette.bell
          : shown.color === ROLE_TENTACLE
            ? palette.tentacle
            : palette.accent;
      // 带短线的字形画成 line，其余画成 text；类型变了就替换节点
      let node = creatureNodes[index]!;
      const tag = shown.line ? "line" : "text";
      if (node.tagName !== tag) {
        const replacement = document.createElementNS(SVG_NS, tag);
        node.replaceWith(replacement);
        creatureNodes[index] = node = replacement;
      }
      if (shown.line) {
        const halfX = (Math.cos(shown.line.angle) * shown.line.length) / 2;
        const halfY = (Math.sin(shown.line.angle) * shown.line.length) / 2;
        node.setAttribute("x1", String(shown.x - halfX));
        node.setAttribute("y1", String(shown.y - halfY));
        node.setAttribute("x2", String(shown.x + halfX));
        node.setAttribute("y2", String(shown.y + halfY));
        node.setAttribute("stroke", fill);
        node.setAttribute("stroke-width", String(Math.max(1, shown.size * 0.085)));
        node.setAttribute("stroke-linecap", "round");
        node.setAttribute("opacity", String(shown.alpha));
        return;
      }
      node.setAttribute("font-size", String(shown.size));
      node.setAttribute("x", shown.x.toFixed(2));
      node.setAttribute("y", shown.y.toFixed(2));
      if (node.textContent !== shown.char) node.textContent = shown.char;
      if (node.getAttribute("fill") !== fill) node.setAttribute("fill", fill);
      if (node.getAttribute("opacity") !== String(shown.alpha)) node.setAttribute("opacity", String(shown.alpha));
    });
  };

  /**
   * 重新测量：容器尺寸变化时重建场景坐标与水面；定位黑洞按钮作为纵深目标；
   * 重算文字避让区域（有纵深目标时水面不避让文字）。动画循环没在跑时顺手画一帧。
   */
  const refresh = (): void => {
    if (destroyed || paused || document.hidden) return;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    if (width !== viewport.width || height !== viewport.height) {
      viewport = {
        left: 460 - width / 2,
        right: 460 + width / 2,
        top: 305 - height / 2,
        bottom: 305 + height / 2,
        width,
        height,
      };
      svg.setAttribute("viewBox", [viewport.left, viewport.top, width, height].join(" "));
      ocean.reset();
    }
    // 黑洞按钮在首屏区块内查找（从容器向上找到首屏根节点，不做全局查询）
    const hole = container.closest(".payathon-hero")?.querySelector(".blackhole-button");
    if (hole) {
      const holeRect = hole.getBoundingClientRect();
      viewport.depthTarget = {
        x: viewport.left + holeRect.left + holeRect.width / 2 - rect.left,
        y: viewport.top + holeRect.top + holeRect.height / 2 - rect.top,
      };
    }
    oceanObstacles = viewport.depthTarget
      ? []
      : [...avoidElements.flatMap(element => textObstacles(element, svg)), ...manualAreas];
    if (!frameId) renderFrame();
  };

  const resizeObserver = new ResizeObserver(refresh);
  /** 重新监听容器与所有避让元素的尺寸变化 */
  const observeTargets = (): void => {
    resizeObserver.disconnect();
    resizeObserver.observe(container);
    for (const element of avoidElements) resizeObserver.observe(element);
    refresh();
  };
  const isRunning = (): boolean => !destroyed && !paused && !reducedMotion.matches && !document.hidden;
  const tick = (timestamp: number): void => {
    frameId = 0;
    if (!isRunning()) return;
    // 单帧最多推进 0.04 秒，切回标签页时不会一下跳很远
    const dt = lastFrameAt ? Math.min(0.04, (timestamp - lastFrameAt) / 1e3) : 0;
    lastFrameAt = timestamp;
    sceneTime += dt * settings.speed;
    renderFrame();
    frameId = requestAnimationFrame(tick);
  };
  /** 按当前状态重启或停止动画循环 */
  const restartLoop = (): void => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrameAt = 0;
    if (isRunning()) frameId = requestAnimationFrame(tick);
  };
  const onPointerMove = (event: PointerEvent): void => {
    if (paused || document.hidden) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    if (local.x < viewport.left || local.x > viewport.right || local.y < viewport.top || local.y > viewport.bottom) {
      pointer = null;
      return;
    }
    pointer = { x: local.x, y: local.y, radius: settings.mouseRadius };
    // 以原设计稿 560 × 480 的半宽、半高归一化
    pointerDx = (local.x - 460) / 280;
    pointerDy = (local.y - 305) / 240;
    if (!isRunning()) renderFrame();
  };
  const onPointerLeave = (): void => {
    if (paused || document.hidden) return;
    pointer = null;
    pointerDx = 0;
    pointerDy = 0;
    if (!isRunning()) renderFrame();
  };
  // 容器本身不接收指针（标题等元素盖在上面），所以在父元素上监听
  const pointerTarget = container.parentElement ?? container;
  pointerTarget.addEventListener("pointermove", onPointerMove);
  pointerTarget.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("resize", refresh);
  window.addEventListener("scroll", refresh, true);
  document.addEventListener("visibilitychange", restartLoop);
  reducedMotion.addEventListener("change", restartLoop);
  observeTargets();
  // 字体就绪后文字行框会变，重新计算避让区域
  document.fonts.ready.then(refresh);
  restartLoop();

  return {
    pause() {
      paused = true;
      pointer = null;
      pointerDx = 0;
      pointerDy = 0;
      restartLoop();
    },
    resume() {
      paused = false;
      // 暂停期间的时间不计入渲染步长
      lastRenderAt = performance.now();
      refresh();
      restartLoop();
    },
    setAvoidElements(elements) {
      if (destroyed) return;
      avoidElements = [...elements];
      observeTargets();
    },
    refreshAvoidance: refresh,
    setAvoidanceAreas(areas) {
      if (destroyed) return;
      if (
        areas.some(
          area => ![area.x, area.y, area.hw, area.hh].every(Number.isFinite) || area.hw < 0 || area.hh < 0,
        )
      ) {
        throw new Error("Invalid avoidance area");
      }
      manualAreas = areas.map(area => ({ ...area }));
      refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelAnimationFrame(frameId);
      frameId = 0;
      resizeObserver.disconnect();
      water.dispose();
      pointerTarget.removeEventListener("pointermove", onPointerMove);
      pointerTarget.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
      document.removeEventListener("visibilitychange", restartLoop);
      reducedMotion.removeEventListener("change", restartLoop);
      root.remove();
    },
  };
}
