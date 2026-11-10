import type { LeopardLegBinding, LeopardLegName, OrientedPoint, Point } from "./leopard-gait";
import {
  bindLeopardLeg,
  CRAB_GAIT_CYCLE,
  CRAB_LEG_KEYS,
  crabLegJoints,
  deformLeopardLeg,
  LEOPARD_GAIT_CYCLE,
  leopardBodyTransform,
  leopardGaitPhase,
  leopardLegJoints,
} from "./leopard-gait";

/**
 * 评选标准上方的字符生物（「什么样的产品，更有竞争力？ / WHAT MATTERS」区块）。
 *
 * 每只生物是一个 svg.criteria-creature，挂载时：
 * - 把轮廓与细节线按固定步长切成一小段一小段的「笔画片段」，文字逐个拆成片段；
 *   部分片段随机换成 0 / 1 / ▪ / : / + / ~ / · 等底字（每个 SVG 一个随机种子，重挂载时分布不变）；
 * - 按 data-species 建骨骼：螃蟹的腿和钳子、豹子的腿与躯干、海豚的脊柱会动，乌龟和珍珠没有骨骼；
 * - 每帧让骨骼摆出当前姿态，再把每个片段按绑定形变到新位置；
 * - 指针靠近时片段被推开，并在叠加层里闪烁成 █ / 0 / 1；每隔 2.5–4 秒随机一批片段沿对角线依次「刷屏」。
 * 只有进入视口、页面可见、且未开启「减少动态效果」时才运行。
 */

/* ── 常量 ─────────────────────────────────────────────────────────── */

const TAU = Math.PI * 2;
const SVG_NS = "http://www.w3.org/2000/svg";

/** 海豚游动模式下的摆动周期（秒）；本区块不开启游动模式，用 DOLPHIN_IDLE_CYCLE */
const DOLPHIN_SWIM_CYCLE = 1.65;
/** 海豚常态的摆动周期（秒） */
const DOLPHIN_IDLE_CYCLE = 2.8;

/** 叠加层用到的字符 */
const DOT_GLYPH = "·";
const SMALL_BLOCK_GLYPH = "▪";
const FULL_BLOCK_GLYPH = "█";
/** 文字片段落在「普通」档位时的候选底字 */
const TEXT_BASE_GLYPHS = [":", "+", "~", DOT_GLYPH];

/** 叠加层字符格的初始边长（viewBox 单位）；ResizeObserver 回调后按渲染尺寸换算 */
const INITIAL_CELL = 19.2;

/** 豹子的四条腿 */
const LEOPARD_LEGS: readonly LeopardLegName[] = ["fore-near", "fore-far", "hind-near", "hind-far"];

/* ── 骨骼的基础几何 ───────────────────────────────────────────────── */

/** 一节骨段：起点、终点、方向（弧度）与长度 */
interface Segment {
  a: Point;
  b: Point;
  angle: number;
  length: number;
}

/** 片段对一节骨段的蒙皮权重 */
interface SegmentWeight {
  index: number;
  /** 片段到该骨段的距离 */
  d: number;
  weight: number;
}

/** 豹子躯干上一点的绑定：u 为沿躯干的参数，其余为预先算好的形变系数 */
interface SpineBinding extends Point {
  u: number;
  smooth: number;
  arch: number;
  slope: number;
  smoothSlope: number;
}

/** 骨段蒙皮绑定（螃蟹的腿与钳子、海豚的脊柱） */
interface SkinBinding {
  key: string;
  weights: SegmentWeight[];
}

/** 豹腿绑定 */
interface LegBinding {
  key: LeopardLegName;
  leg: LeopardLegBinding;
}

/** 豹子躯干绑定；tail 表示该点属于尾巴，还要额外绕尾根摆动 */
interface TorsoBinding {
  spine: SpineBinding;
  tail: boolean;
}

type RigBinding = SkinBinding | LegBinding | TorsoBinding;

/** 字符生物的骨骼：bind 在拆片段时每段调用一次，pose 每帧一次，deform 每个片段每帧一次 */
interface CreatureRig {
  /** 按片段所在元素的 class 与静止位置求绑定；不随骨骼运动的片段返回 null */
  bind: (className: string, x: number, y: number) => RigBinding | null;
  /** 设定当前时间（秒） */
  pose: (time: number) => void;
  /** 整个身体的 transform；没有整体运动时返回 null */
  bodyTransform: () => string | null;
  /** 求片段在当前姿态下的位置与附加转角（角度制） */
  deform: (binding: RigBinding | null, x: number, y: number) => OrientedPoint;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function createSegment(a: Point, b: Point): Segment {
  return {
    a,
    b,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    length: Math.hypot(b.x - a.x, b.y - a.y),
  };
}

function point(x: number, y: number): Point {
  return { x, y };
}

/** 折线转成逐节骨段 */
function toSegments(points: readonly Point[]): Segment[] {
  return points.slice(1).map((end, index) => createSegment(points[index]!, end));
}

/** 向量绕原点旋转 angle（弧度） */
function rotate(x: number, y: number, angle: number): Point {
  return {
    x: x * Math.cos(angle) - y * Math.sin(angle),
    y: x * Math.sin(angle) + y * Math.cos(angle),
  };
}

/* ── 豹子躯干 ─────────────────────────────────────────────────────── */

/**
 * 豹子躯干上一点的绑定。u 沿身体从前到后：x = 235（肩前）为 0，x = 95（臀后）为 1。
 * 同时预先算好形变要用的几个形状函数及其对 u 的导数。
 */
function bindLeopardSpine(x: number, y: number): SpineBinding {
  const u = clamp((235 - x) / 140, 0, 1);
  const smooth = u * u * (3 - 2 * u);
  return {
    x,
    y,
    u,
    smooth,
    // 弓背形状：中段最高
    arch: Math.sin(Math.PI * u) ** 2,
    // arch 对 u 的导数
    slope: Math.PI * Math.sin(TAU * u),
    // smooth 对 u 的导数
    smoothSlope: 6 * u * (1 - u),
  };
}

/**
 * 躯干形变：脊柱以 y = 105 为基线，flex > 0 时弓背收拢，flex < 0 时伸展。
 * 弓背幅度 9（arch）；后半身整体再抬高 4、前移 16（smooth）。
 * 先由位移对 x 求导得到形变后的脊柱切线角，再让点沿法线保持与基线的原距离。
 * @returns 位置与转角（角度制）
 */
function deformLeopardSpine(binding: SpineBinding, flex: number): OrientedPoint {
  const { x, y, smooth, arch, slope, smoothSlope } = binding;
  const tangent = Math.atan2((9 * slope + 4 * smoothSlope) * flex, 140 - 16 * smoothSlope * flex);
  const offset = y - 105;
  return {
    x: x + 16 * smooth * flex - Math.sin(tangent) * offset,
    y: 105 - (9 * arch + 4 * smooth) * flex + Math.cos(tangent) * offset,
    angle: (tangent * 180) / Math.PI,
  };
}

/* ── 骨段蒙皮 ─────────────────────────────────────────────────────── */

/** 求点 (x, y) 对最近两节骨段的权重，权重与 (距离 + 5) 的三次方成反比 */
function nearestSegmentWeights(segments: readonly Segment[], x: number, y: number): SegmentWeight[] {
  const nearest = segments
    .map((segment, index) => {
      // 点在骨段上的投影参数，夹在端点之间
      const t = clamp(
        ((x - segment.a.x) * (segment.b.x - segment.a.x) + (y - segment.a.y) * (segment.b.y - segment.a.y)) /
          (segment.length * segment.length),
        0,
        1,
      );
      return {
        index,
        d: Math.hypot(x - segment.a.x - t * (segment.b.x - segment.a.x), y - segment.a.y - t * (segment.b.y - segment.a.y)),
      };
    })
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  const total = nearest.reduce((sum, item) => sum + 1 / (item.d + 5) ** 3, 0);
  return nearest.map(item => ({ ...item, weight: 1 / (item.d + 5) ** 3 / total }));
}

/**
 * 线性混合蒙皮：点随每节骨段从静止到当前姿态做刚体变换（绕骨段起点旋转再平移），按权重混合。
 * @returns 位置与混合后的转角（角度制）
 */
function skinPoint(
  rest: readonly Segment[],
  posed: readonly Segment[],
  weights: readonly SegmentWeight[],
  x: number,
  y: number,
): OrientedPoint {
  let blendedX = 0;
  let blendedY = 0;
  let blendedAngle = 0;
  for (const { index, weight } of weights) {
    const from = rest[index]!;
    const to = posed[index]!;
    const turn = Math.atan2(Math.sin(to.angle - from.angle), Math.cos(to.angle - from.angle));
    const local = rotate(x - from.a.x, y - from.a.y, turn);
    blendedX += (to.a.x + local.x) * weight;
    blendedY += (to.a.y + local.y) * weight;
    blendedAngle += turn * weight;
  }
  return { x: blendedX, y: blendedY, angle: (blendedAngle * 180) / Math.PI };
}

/* ── 各物种的骨骼 ─────────────────────────────────────────────────── */

/** 螃蟹：八条腿按步态做反向运动学，两只钳子以 1.16 秒为周期轻轻开合 */
function createCrabRig(): CreatureRig {
  const rest: Record<string, Segment[]> = {};
  CRAB_LEG_KEYS.forEach((key, index) => {
    rest[key] = toSegments(crabLegJoints(index));
  });
  rest["crab-claw-left"] = toSegments([point(118, 92), point(75, 48)]);
  rest["crab-claw-right"] = toSegments([point(202, 92), point(245, 48)]);
  const posed: Record<string, Segment[]> = { ...rest };
  const claws: readonly (readonly [string, number])[] = [
    ["crab-claw-left", -1],
    ["crab-claw-right", 1],
  ];

  return {
    bind(className, x, y) {
      const key = Object.keys(rest).find(name => className.includes(name));
      return key ? { key, weights: nearestSegmentWeights(rest[key]!, x, y) } : null;
    },
    pose(time) {
      CRAB_LEG_KEYS.forEach((key, index) => {
        posed[key] = toSegments(crabLegJoints(index, time / CRAB_GAIT_CYCLE));
      });
      for (const [key, side] of claws) {
        const claw = rest[key]![0]!;
        const swing = Math.sin((time / 1.16) * TAU) * 0.08 * side;
        const tip = rotate(claw.b.x - claw.a.x, claw.b.y - claw.a.y, swing);
        posed[key] = toSegments([claw.a, point(claw.a.x + tip.x, claw.a.y + tip.y)]);
      }
    },
    bodyTransform() {
      return null;
    },
    deform(binding, x, y) {
      return binding && "weights" in binding
        ? skinPoint(rest[binding.key]!, posed[binding.key]!, binding.weights, x, y)
        : { x, y, angle: 0 };
    },
  };
}

/**
 * 豹子：四条腿按步态奔跑，腿根随躯干形变移动；躯干一屈一伸，尾巴绕尾根额外摆动，
 * 整个身体还随步态上下起伏、俯仰。class 含 speed-trail 的速度线不参与形变。
 */
function createLeopardRig(): CreatureRig {
  const restLegs = {} as Record<LeopardLegName, Point[]>;
  const hipBindings = {} as Record<LeopardLegName, SpineBinding>;
  for (const leg of LEOPARD_LEGS) {
    restLegs[leg] = leopardLegJoints(leg, 0);
    hipBindings[leg] = bindLeopardSpine(restLegs[leg][0]!.x, restLegs[leg][0]!.y);
  }
  const posedLegs: Record<LeopardLegName, Point[]> = { ...restLegs };
  const tailRootBinding = bindLeopardSpine(95, 113);
  /** 当前步态相位 */
  let gaitPhase = 0;
  /** 躯干屈伸量，-1 到 1 */
  let flex = 0;
  /** 尾巴附加转角（弧度） */
  let tailSwing = 0;
  /** 形变后的尾根位置；第一次 pose 之前为 null */
  let tailRoot: OrientedPoint | null = null;

  return {
    bind(className, x, y) {
      const key = LEOPARD_LEGS.find(name => className.includes(name));
      if (!key) {
        return className.includes("speed-trail")
          ? null
          : { spine: bindLeopardSpine(x, y), tail: className.includes("tail") };
      }
      return { key, leg: bindLeopardLeg(key, x, y) };
    },
    pose(time) {
      const phase = leopardGaitPhase(time / LEOPARD_GAIT_CYCLE);
      gaitPhase = phase;
      flex = Math.cos(TAU * (phase - 0.25));
      tailSwing = Math.sin(TAU * phase) * 0.12;
      tailRoot = deformLeopardSpine(tailRootBinding, flex);
      for (const leg of LEOPARD_LEGS) {
        // 腿整体跟着髋关节在躯干上的形变平移
        const restHip = restLegs[leg][0]!;
        const hip = deformLeopardSpine(hipBindings[leg], flex);
        posedLegs[leg] = leopardLegJoints(leg, phase).map(joint => ({
          x: joint.x + hip.x - restHip.x,
          y: joint.y + hip.y - restHip.y,
        }));
      }
    },
    bodyTransform() {
      return leopardBodyTransform(gaitPhase);
    },
    deform(binding, x, y) {
      if (binding && "spine" in binding) {
        const torso = deformLeopardSpine(binding.spine, flex);
        if (binding.tail && tailRoot) {
          const swung = rotate(torso.x - tailRoot.x, torso.y - tailRoot.y, tailSwing);
          return {
            x: swung.x + tailRoot.x,
            y: swung.y + tailRoot.y,
            angle: torso.angle + (tailSwing * 180) / Math.PI,
          };
        }
        return torso;
      }
      if (binding && "leg" in binding) return deformLeopardLeg(posedLegs[binding.key], binding.leg);
      return { x, y, angle: 0 };
    },
  };
}

/**
 * 海豚：七节脊柱从头到尾传递一道正弦波，越往后摆幅越大；头部也轻微上下浮动。
 * class 含 echo- 的声呐弧线不参与形变。
 */
function createDolphinRig(swimming: boolean): CreatureRig {
  const rest = toSegments([
    point(260, 110),
    point(220, 113),
    point(180, 117),
    point(140, 124),
    point(100, 136),
    point(60, 148),
    point(30, 151),
  ]);
  let posed = rest;

  return {
    bind(className, x, y) {
      return className.includes("echo-") ? null : { key: "spine", weights: nearestSegmentWeights(rest, x, y) };
    },
    pose(time) {
      const wave = (time / (swimming ? DOLPHIN_SWIM_CYCLE : DOLPHIN_IDLE_CYCLE)) * TAU;
      let joint = point(260, 110 + Math.sin(wave) * (swimming ? 0.5 : 2));
      // 从头部开始逐节累加：每节在静止方向上叠加一个随节序滞后的摆角
      posed = rest.map((segment, index) => {
        const amplitude = swimming
          ? 0.012 + 0.255 * (index / (rest.length - 1)) ** 1.8
          : 0.015 + index * 0.035;
        const angle = segment.angle + Math.sin(wave - index * (swimming ? 0.9 : 0.48)) * amplitude;
        const next = point(joint.x + Math.cos(angle) * segment.length, joint.y + Math.sin(angle) * segment.length);
        const posedSegment = createSegment(joint, next);
        joint = next;
        return posedSegment;
      });
    },
    bodyTransform() {
      return null;
    },
    deform(binding, x, y) {
      return binding && "weights" in binding ? skinPoint(rest, posed, binding.weights, x, y) : { x, y, angle: 0 };
    },
  };
}

/** 按物种建骨骼；乌龟、珍珠等没有骨骼的物种返回 null */
function createCreatureRig(species: string | undefined, { swimming = false }: { swimming?: boolean } = {}): CreatureRig | null {
  if (species === "crab") return createCrabRig();
  if (species === "leopard") return createLeopardRig();
  if (species === "dolphin") return createDolphinRig(swimming);
  return null;
}

/* ── 随机数 ───────────────────────────────────────────────────────── */

/** 每个 SVG 一个随机种子；模块级保存，同一元素重新挂载时得到同一套底字分布 */
const creatureSeeds = new WeakMap<Element, number>();

/** 以元素种子初始化的伪随机数发生器（mulberry32），返回 [0, 1) */
function createSeededRandom(element: Element): () => number {
  if (!creatureSeeds.has(element)) creatureSeeds.set(element, Math.floor(Math.random() * 4294967296));
  let state = creatureSeeds.get(element)!;
  return () => {
    state += 1831565813;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── 片段与生物状态 ───────────────────────────────────────────────── */

/** 一个笔画片段 */
interface Fragment {
  /** 片段容器，承载骨骼形变与指针推开的 transform */
  node: SVGGElement;
  /** 片段本体：一小段笔画、原文字或底字 */
  ink: SVGElement;
  /** 叠加层里的闪烁字符组 */
  glyph: SVGGElement;
  /** 闪烁字符的文字（0 / 1） */
  code: SVGTextElement;
  /** 闪烁字符的方块（█ / ▪） */
  block: SVGRectElement;
  /** 底字是 ▪：常态下也在叠加层显示一个小方块 */
  baseBlock: boolean;
  /** 刷屏与闪烁的延迟（秒），按对角线顺序递增到 0.9 */
  delay: number;
  /** 静止位置 */
  x: number;
  y: number;
  binding: RigBinding | null;
  /** 指针推开的位移，逐帧趋近目标 */
  dx: number;
  dy: number;
  /** 当前叠加层显示的字符，"" 表示不显示 */
  phase: string;
  /** 本轮刷屏要显示的数字；不参与本轮时为 null */
  burst: "0" | "1" | null;
  /** 叠加层当前的不透明度 */
  opacity: string;
}

/** 由一个原始元素拆出的片段组 */
interface FragmentGroup {
  node: SVGGElement;
  fragments: Fragment[];
}

interface CreatureState {
  svg: SVGSVGElement;
  groups: FragmentGroup[];
  /** 指针的视口坐标；不在 SVG 上时为 null */
  pointer: Point | null;
  rig: CreatureRig | null;
  body: SVGGElement;
  /** 已运行时长（秒），只在活跃时累加 */
  time: number;
  burstStart: number;
  nextBurst: number;
  /** 叠加层：闪烁字符画在这里，不受身体 transform 影响 */
  overlay: SVGGElement;
  /** 叠加层字符格边长（viewBox 单位） */
  cell: number;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

/**
 * 把生物 SVG 里的每个 path / circle / text 拆成片段：原元素换成一个 g.creature-motion（保留原 class），
 * 片段放进去；每个片段在叠加层里配一组闪烁字符。
 * @returns 片段组，以及原元素与替换组的对应关系（清理时换回）
 */
function splitCreature(
  state: CreatureState,
  random: () => number,
): { groups: FragmentGroup[]; replacements: { source: Element; group: SVGGElement }[] } {
  const groups: FragmentGroup[] = [];
  const replacements: { source: Element; group: SVGGElement }[] = [];

  state.svg.querySelectorAll<SVGElement>("path,circle,text").forEach((source) => {
    const className = `${source.getAttribute("class") || ""} creature-motion`;
    const group = createSvgElement("g");
    group.setAttribute("class", className);
    const fragments: Fragment[] = [];

    const addFragment = (initialInk: SVGElement, x: number, y: number) => {
      let ink = initialInk;
      const isText = ink.tagName.toLowerCase() === "text";
      // 原本就是「·」的文字保持原样；其余片段掷骰子决定底字：
      // 2.5% 为 ▪，22% 为 0 或 1，其余文字随机取 : + ~ ·，笔画保持原样
      if ((isText ? ink.textContent : "") !== DOT_GLYPH) {
        const roll = random();
        const baseGlyph =
          roll < 0.025
            ? SMALL_BLOCK_GLYPH
            : roll < 0.245
              ? random() < 0.5
                ? "0"
                : "1"
              : isText
                ? TEXT_BASE_GLYPHS[Math.floor(random() * 4)]!
                : "";
        if (baseGlyph) {
          const text = createSvgElement("text");
          text.setAttribute("class", "creature-base-glyph");
          text.setAttribute("x", String(x));
          text.setAttribute("y", String(y));
          text.textContent = baseGlyph;
          ink = text;
        }
      }
      const node = createSvgElement("g");
      const glyph = createSvgElement("g");
      const code = createSvgElement("text");
      const block = createSvgElement("rect");
      node.setAttribute("class", "creature-fragment");
      glyph.setAttribute("class", "creature-hover-glyph");
      code.setAttribute("class", "creature-hover-glyph");
      block.setAttribute("fill", "#fff");
      block.setAttribute("stroke", "none");
      glyph.append(block, code);
      glyph.style.display = "none";
      node.append(ink);
      group.append(node);
      state.overlay.append(glyph);
      fragments.push({
        node,
        ink,
        glyph,
        code,
        block,
        baseBlock: ink.textContent === SMALL_BLOCK_GLYPH,
        delay: 0,
        x,
        y,
        binding: state.rig ? state.rig.bind(className, x, y) : null,
        dx: 0,
        dy: 0,
        phase: "",
        burst: null,
        opacity: "",
      });
    };

    if (source.tagName.toLowerCase() === "text") {
      const clone = source.cloneNode(true) as SVGTextElement;
      clone.removeAttribute("class");
      addFragment(clone, Number(source.getAttribute("x")), Number(source.getAttribute("y")));
    } else {
      // 笔画按固定步长切段：细节线每 14 取 3 长的一小段，轮廓每 16 取 6 长的一小段
      const geometry = source as SVGGeometryElement;
      const total = geometry.getTotalLength();
      const isDetail = !!geometry.closest(".creature-detail");
      const dash = isDetail ? 3 : 6;
      const step = isDetail ? 14 : 16;
      for (let start = 0; start < total; start += step) {
        const end = Math.min(total, start + dash);
        const piece = createSvgElement("path");
        const samples = [start, (start + end) / 2, end].map(length => geometry.getPointAtLength(length));
        piece.setAttribute(
          "d",
          samples.map((sample, index) => `${index ? "L" : "M"}${sample.x.toFixed(2)} ${sample.y.toFixed(2)}`).join(" "),
        );
        piece.style.strokeDasharray = "none";
        addFragment(piece, samples[1]!.x, samples[1]!.y);
      }
    }

    source.replaceWith(group);
    replacements.push({ source, group });
    groups.push({ node: group, fragments });
  });

  return { groups, replacements };
}

/** 按 20 × 20 的格子沿对角线排序片段，依次分配 0–0.9 秒的延迟，刷屏时形成斜向扫过的效果 */
function assignDiagonalDelays(groups: readonly FragmentGroup[]): void {
  const ordered = groups
    .flatMap(group => group.fragments)
    .sort(
      (a, b) =>
        Math.floor(a.y / 20) + Math.floor(a.x / 20) - (Math.floor(b.y / 20) + Math.floor(b.x / 20)) ||
        a.y - b.y ||
        a.x - b.x,
    );
  ordered.forEach((fragment, index) => {
    fragment.delay = (index / Math.max(1, ordered.length - 1)) * 0.9;
  });
}

/** 生物回到静止：清掉指针、身体与片段的 transform，隐藏叠加层字符 */
function resetCreature(state: CreatureState): void {
  state.pointer = null;
  state.body.removeAttribute("transform");
  for (const group of state.groups) {
    for (const fragment of group.fragments) {
      fragment.dx = 0;
      fragment.dy = 0;
      fragment.phase = "";
      fragment.node.removeAttribute("transform");
      fragment.ink.style.visibility = "";
      fragment.glyph.style.display = "none";
      fragment.glyph.style.opacity = "";
      fragment.opacity = "";
    }
  }
}

/* ── 挂载 ─────────────────────────────────────────────────────────── */

/**
 * 挂载区块内所有字符生物的动画。
 * @param root 评选标准区块根元素（section#selection），在其中查找 svg.criteria-creature
 * @returns 清理函数：断开观察器、移除监听、停止动画循环，把 SVG 恢复成挂载前的结构
 */
export function mountCriteriaCreatures(root: HTMLElement): () => void {
  const svgs = [...root.querySelectorAll<SVGSVGElement>(".criteria-creature")];
  if (!svgs.length) return () => {};

  const controller = new AbortController();
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  /** 当前在视口内的 SVG */
  const visible = new Set<Element>();
  const states = new Map<SVGSVGElement, CreatureState>();
  const replacements: { source: Element; group: SVGGElement }[] = [];
  /** 挂载前是否已有 style 属性；清理时据此决定是否删掉空的 style 属性 */
  const hadStyleAttribute = new Map<SVGSVGElement, boolean>();

  svgs.forEach((svg) => {
    hadStyleAttribute.set(svg, svg.hasAttribute("style"));
    const random = createSeededRandom(svg);
    const overlay = createSvgElement("g");
    overlay.setAttribute("class", "creature-grid-effects");
    const state: CreatureState = {
      svg,
      groups: [],
      pointer: null,
      rig: createCreatureRig(svg.dataset.species),
      body: svg.querySelector<SVGGElement>(".creature-body")!,
      time: 0,
      burstStart: -Infinity,
      // 首次刷屏在 2.8–4 秒后
      nextBurst: 2.8 + random() * 1.2,
      overlay,
      cell: INITIAL_CELL,
    };
    svg.toggleAttribute("data-rigged", !!state.rig);
    states.set(svg, state);
    const split = splitCreature(state, random);
    state.groups.push(...split.groups);
    replacements.push(...split.replacements);
    svg.append(overlay);
    assignDiagonalDelays(state.groups);
  });

  let frameId = 0;
  let lastTime = 0;

  const frame = (now: number) => {
    frameId = 0;
    const delta = Math.min((now - lastTime) / 1000 || 1 / 60, 0.05);
    lastTime = now;
    // 指针推开位移的逐帧逼近系数（与帧长无关的指数平滑）
    const ease = 1 - Math.exp(-14 * delta);
    let keepRunning = false;

    for (const state of states.values()) {
      if (!visible.has(state.svg) || document.hidden || reducedMotion.matches) {
        resetCreature(state);
        continue;
      }
      // 只要有一只生物在活跃，循环就继续
      state.time += delta;
      keepRunning = true;
      // 到点开始一轮刷屏：约四分之一的片段参与，各自随机显示 0 或 1
      if (state.time >= state.nextBurst) {
        state.burstStart = state.time;
        state.nextBurst = state.time + 2.5 + Math.random() * 1.5;
        for (const group of state.groups) {
          for (const fragment of group.fragments) {
            fragment.burst = Math.random() < 0.25 ? (Math.random() < 0.5 ? "0" : "1") : null;
          }
        }
      }
      const burstElapsed = state.time - state.burstStart;
      if (state.rig) {
        state.rig.pose(state.time);
        const transform = state.rig.bodyTransform();
        if (transform) state.body.setAttribute("transform", transform);
      }

      // 先统一读出各组的屏幕变换矩阵，再逐片段写入，避免读写交错
      const rootInverse = state.svg.getScreenCTM()!.inverse();
      const pointer = state.pointer;
      const frames = state.groups.map((group) => {
        const ctm = group.node.getScreenCTM();
        return {
          group,
          /** 组坐标 → SVG 根坐标 */
          toRoot: rootInverse.multiply(ctm ?? undefined),
          /** 指针在组坐标系里的位置 */
          cursor: pointer && ctm ? new DOMPoint(pointer.x, pointer.y).matrixTransform(ctm.inverse()) : null,
        };
      });

      /** 片段在整只生物里的序号，用于让相邻片段的 0 / 1 交错 */
      let index = 0;
      for (const { group, toRoot, cursor } of frames) {
        for (const fragment of group.fragments) {
          const posed: Point & { angle?: number } = state.rig?.deform(fragment.binding, fragment.x, fragment.y) || fragment;

          // 指针推力：横向距离按 1.6 压缩成椭圆范围，60 以内生效，越近推得越远（最多 24）
          const offsetX = cursor ? posed.x - cursor.x : 0;
          const offsetY = cursor ? posed.y - cursor.y : 0;
          const distance = cursor ? Math.hypot(offsetX / 1.6, offsetY) : Infinity;
          const proximity = Math.max(0, 1 - distance / 60);
          const length = Math.hypot(offsetX, offsetY) || 1;
          const push = 24 * proximity * proximity;
          const targetX = (offsetX / length) * push;
          const targetY = (offsetY / length) * push;
          fragment.dx += (targetX - fragment.dx) * ease;
          fragment.dy += (targetY - fragment.dy) * ease;
          const displaced = Math.abs(fragment.dx) + Math.abs(fragment.dy) > 0.04;
          if (displaced || fragment.binding) {
            fragment.node.setAttribute(
              "transform",
              `translate(${(posed.x - fragment.x + fragment.dx).toFixed(2)} ${(posed.y - fragment.y + fragment.dy).toFixed(2)}) rotate(${(posed.angle || 0).toFixed(2)} ${fragment.x} ${fragment.y})`,
            );
          } else {
            fragment.dx = 0;
            fragment.dy = 0;
            fragment.node.removeAttribute("transform");
          }

          // 选叠加层字符：
          // - 指针附近：0.8 秒一循环，前 0.12 与后 0.14 秒显示 █，其余时间按序号与时钟（每秒 3 次）交替 0 / 1；
          // - 刷屏中（片段本地时间 0–1.2 秒）：首 0.28 秒与末 0.28 秒显示 █，中段显示本轮数字；
          // - 其余：底字是 ▪ 的显示小方块，否则不显示
          const cyclePhase = (((state.time - fragment.delay) % 0.8) + 0.8) % 0.8;
          const burstLocal = burstElapsed - fragment.delay;
          const burst = fragment.burst;
          const bursting = burst !== null && burstLocal >= 0 && burstLocal < 1.2;
          const burstEdge = bursting && (burstLocal < 0.28 || burstLocal >= 0.92);
          const glyph =
            proximity > 0
              ? cyclePhase < 0.12 || cyclePhase >= 0.66
                ? FULL_BLOCK_GLYPH
                : (index + Math.floor((now / 1000) * 3)) % 2
                  ? "1"
                  : "0"
              : bursting
                ? burstEdge
                  ? FULL_BLOCK_GLYPH
                  : burst
                : fragment.baseBlock
                  ? SMALL_BLOCK_GLYPH
                  : "";
          // 刷屏首尾的 █ 闪烁：每 0.14 秒里有 0.05 秒压暗到 0.12
          const edgeTime = burstLocal < 0.28 ? burstLocal : burstLocal - 0.92;
          const opacity = proximity <= 0 && burstEdge && edgeTime % 0.14 >= 0.09 ? ".12" : "1";
          if (opacity !== fragment.opacity) {
            fragment.opacity = opacity;
            fragment.glyph.style.opacity = opacity;
          }
          if (glyph !== fragment.phase) {
            fragment.phase = glyph;
            fragment.ink.style.visibility = glyph ? "hidden" : "";
            fragment.glyph.style.display = glyph ? "" : "none";
            const isBlock = glyph === FULL_BLOCK_GLYPH || glyph === SMALL_BLOCK_GLYPH;
            fragment.block.style.display = isBlock ? "" : "none";
            fragment.code.style.display = isBlock ? "none" : "";
            fragment.code.textContent = isBlock ? "" : glyph;
            fragment.block.setAttribute("fill", glyph === FULL_BLOCK_GLYPH ? "#fff" : "currentColor");
          }
          if (glyph) {
            const position = new DOMPoint(posed.x + fragment.dx, posed.y + fragment.dy).matrixTransform(toRoot);
            const size = state.cell * (glyph === SMALL_BLOCK_GLYPH ? 0.35 : 0.8);
            fragment.glyph.setAttribute("transform", `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`);
            fragment.block.setAttribute("x", String(-size / 2));
            fragment.block.setAttribute("y", String(-size / 2));
            fragment.block.setAttribute("width", String(size));
            fragment.block.setAttribute("height", String(size));
          }
          index++;
        }
      }
    }

    if (keepRunning) frameId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (!frameId && !document.hidden && !reducedMotion.matches) {
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    }
  };

  states.forEach((state) => {
    state.svg.addEventListener(
      "pointermove",
      (event) => {
        // 触摸不触发推开效果
        if (event.pointerType === "touch" || reducedMotion.matches) return;
        state.pointer = { x: event.clientX, y: event.clientY };
        start();
      },
      { signal: controller.signal },
    );
    state.svg.addEventListener(
      "pointerleave",
      () => {
        state.pointer = null;
        start();
      },
      { signal: controller.signal },
    );
  });

  // 滚动或窗口尺寸变化后，记录的指针视口坐标已失效，一并清掉
  const clearPointers = () => {
    states.forEach((state) => {
      state.pointer = null;
    });
    start();
  };
  window.addEventListener("scroll", clearPointers, { signal: controller.signal, passive: true });
  window.addEventListener("resize", clearPointers, { signal: controller.signal, passive: true });

  /** 同步每只生物的播放状态：写 data-playing，不活跃的立即复位；页面隐藏或减少动态效果时停掉循环 */
  const syncPlayback = () => {
    svgs.forEach((svg) => {
      const playing = visible.has(svg) && !document.hidden && !reducedMotion.matches;
      svg.toggleAttribute("data-playing", playing);
      if (!playing) resetCreature(states.get(svg)!);
    });
    if (document.hidden || reducedMotion.matches) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else if (visible.size) {
      start();
    }
  };

  // 叠加层字号与字符格：保证无论 SVG 渲染多大，字符都显示为 16 CSS 像素
  const resizeObserver = new ResizeObserver((entries) => {
    for (const { target, contentRect } of entries) {
      if (contentRect.width > 0) {
        const svg = target as SVGSVGElement;
        const cell = (16 * svg.viewBox.baseVal.width) / contentRect.width;
        states.get(svg)!.cell = cell;
        svg.style.setProperty("--creature-font-size", `${cell}px`);
      }
    }
  });
  svgs.forEach(svg => resizeObserver.observe(svg));

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      syncPlayback();
    },
    { threshold: 0 },
  );
  svgs.forEach(svg => intersectionObserver.observe(svg));
  document.addEventListener("visibilitychange", syncPlayback, { signal: controller.signal });
  reducedMotion.addEventListener("change", syncPlayback, { signal: controller.signal });

  return () => {
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    controller.abort();
    visible.clear();
    cancelAnimationFrame(frameId);
    frameId = 0;
    states.forEach((state) => {
      state.body.removeAttribute("transform");
      state.overlay.remove();
    });
    replacements.forEach(({ source, group }) => group.replaceWith(source));
    svgs.forEach((svg) => {
      svg.style.removeProperty("--creature-font-size");
      // 挂载前没有 style 属性的，把写自定义属性留下的空 style 属性也去掉
      if (!hadStyleAttribute.get(svg) && !svg.getAttribute("style")) svg.removeAttribute("style");
      svg.removeAttribute("data-playing");
      svg.removeAttribute("data-rigged");
    });
  };
}
