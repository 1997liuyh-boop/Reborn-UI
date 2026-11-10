/**
 * 字符鱼群的形状数据与骨骼绑定。
 *
 * 形状数据（轮廓、细节线、固定字符）都在同一套设计坐标里描述，鱼头朝右；
 * 使用方先沿路径采样出字符点，用 bind 为每个点求一次绑定，之后每帧 pose 设定时间，
 * 再用 deform 求出该点在当前姿态下的位置与附加转角。
 *
 * 鲨鱼用沿脊柱逐节摆动的分段骨骼（createSpineRig），蝠鲼用整体扇动的形变场（createMantaRig）。
 */

/** 形变后的点：位置与附加转角（弧度） */
export interface RigPoint {
  x: number;
  y: number;
  angle: number;
}

/** 脊柱骨骼的一项绑定：关节序号与权重 */
export interface SpineWeight {
  index: number;
  weight: number;
}

/** 采样点的绑定结果：脊柱骨骼返回最近两节的权重；蝠鲼形变场不需要绑定，返回 null */
export type RigBinding = SpineWeight[] | null;

/** 鱼的骨骼：bind 只在采样时调用一次，pose 每帧调用一次，deform 每个点每帧调用一次 */
export interface FishRig {
  /** 为静止姿态下的一点求绑定 */
  bind: (x: number, y: number) => RigBinding;
  /** 设定当前时间（秒）与摆幅倍率 */
  pose: (time: number, amplitude?: number) => void;
  /** 求绑定点在当前姿态下的位置；lineAngle 是该点笔画方向，蝠鲼据此求附加转角，脊柱骨骼忽略它 */
  deform: (binding: RigBinding, x: number, y: number, lineAngle?: number) => RigPoint;
}

/** 脊柱参数：头部 x、中线 y、全长、节数、头尾摆幅（弧度）与相邻关节的相位差 */
export interface SpineConfig {
  head: number;
  centerY: number;
  length: number;
  segments: number;
  headSwing: number;
  tailSwing: number;
  phaseLag: number;
}

/** 局部部件（如鳍）绕支点的独立摆动；rootY 到 rootY + span 之间由 0 平滑过渡到满幅 */
export interface FishPartMotion {
  pivot: [number, number];
  /** 摆幅（角度制） */
  amplitude: number;
  phase: number;
  rootY: number;
  span: number;
}

/** 两种鱼共有的运动参数：cycle 为一个摆动周期（秒） */
interface FishMotionBase {
  cycle: number;
  body: { bob: number; rock: number };
  parts: Partial<Record<string, FishPartMotion>>;
}

/** 脊柱骨骼驱动的运动（鲨鱼） */
export interface SpineFishMotion extends FishMotionBase {
  kind?: undefined;
  spine: SpineConfig;
}

/** 形变场驱动的运动（蝠鲼） */
export interface MantaFishMotion extends FishMotionBase {
  kind: "manta";
}

export type FishMotion = SpineFishMotion | MantaFishMotion;

/** 轮廓路径：纯路径，或带部件名的路径（部件名对应 motion.parts 的键） */
export type FishContour = string | { d: string; part: string };

/** 固定字符：[x, y, 字符, 是否固定（不参与随机替换）, 角色（eye 会眨眼）] */
export type FishGlyph = readonly [
  x: number,
  y: number,
  char: string,
  fixed?: boolean,
  role?: string,
];

export interface FishShape<TMotion extends FishMotion = FishMotion> {
  /** 外轮廓，字符较密 */
  contours: FishContour[];
  /** 内部细节线，字符较疏、较淡 */
  details: string[];
  glyphs: FishGlyph[];
  /** 身体左右伸出的范围，用于计算游出卡片外的距离；缺省为 180 */
  extent?: number;
  motion: TMotion;
}

const SHARK_SHAPE: FishShape<SpineFishMotion> = {
  contours: [
    "M318 108 C304 97 278 82 252 77 C230 72 211 71 195 74 Q184 56 178 31 Q161 48 153 78 C117 82 86 94 61 102 Q45 82 22 49 Q25 84 40 108 Q28 137 23 160 Q48 138 61 116 C85 121 104 132 128 138 Q137 149 153 157 L154 142 C188 153 225 152 254 141 Q282 133 296 121 Q309 117 318 108 Z",
    { d: "M225 126 Q206 146 174 172 Q180 148 194 126", part: "fin" },
  ],
  details: [
    "M276 124 Q290 126 306 115",
    "M247 91 Q235 110 239 134",
    "M237 88 Q225 109 229 138",
    "M227 87 Q216 108 219 140",
    "M217 87 Q207 106 209 139",
    "M207 87 Q198 104 199 135",
    "M82 111 C120 112 145 124 170 128",
    "M258 138 Q275 132 287 128",
  ],
  glyphs: [
    [280, 104, "0", true, "eye"],
    [163, 106, "0"],
    [116, 111, "1"],
  ],
  motion: {
    cycle: 2.2,
    body: { bob: 1, rock: 1 },
    parts: {
      fin: {
        pivot: [210, 126],
        amplitude: 3,
        phase: 1.5,
        rootY: 126,
        span: 46,
      },
    },
    spine: {
      head: 310,
      centerY: 108,
      length: 300,
      segments: 8,
      headSwing: 0.012,
      tailSwing: 0.12,
      phaseLag: 0.62,
    },
  },
};

const MANTA_SHAPE: FishShape<MantaFishMotion> = {
  contours: [
    "M242 84 C222 63 210 17 178 -38 C160 -4 148 26 124 51 C105 70 96 87 96 108 C96 129 105 146 124 165 C148 190 160 220 178 254 C210 199 222 153 242 132 Q256 146 272 140 Q273 128 260 122 L260 94 Q273 88 272 76 Q256 70 242 84 Z",
    "M96 108 C70 108 42 113 14 118 C-15 123 -40 121 -63 112",
  ],
  details: [
    "M241 87 C217 76 187 79 158 91 Q141 108 158 125 C187 137 217 140 241 129",
    "M237 91 Q242 108 237 125",
    "M220 75 C202 58 186 29 178 7",
    "M220 141 C202 158 186 187 178 209",
    "M143 71 Q120 90 117 108 Q120 126 143 145",
  ],
  glyphs: [
    [237, 86, "0", true, "eye"],
    [237, 130, "0", true, "eye"],
    [193, 104, "1"],
    [165, 113, "0"],
  ],
  extent: 242,
  motion: {
    kind: "manta",
    cycle: 3.8,
    parts: {},
    body: { bob: 0.5, rock: 0 },
  },
};

/** 两种鱼的形状数据，键与赛道卡片的 data-reward-species 一致 */
export const FISH_SHAPES = { shark: SHARK_SHAPE, manta: MANTA_SHAPE };

export type FishSpecies = keyof typeof FISH_SHAPES;

/**
 * 创建沿脊柱逐节摆动的分段骨骼
 *
 * 静止时各关节从头部沿水平线向尾部等距排开；每帧按正弦摆动，越靠尾部摆幅越大、相位越滞后，
 * 再从头部开始逐节累加角度，得到弯曲后的关节链。采样点按到最近两节的距离（三次反比）加权跟随。
 *
 * @param spine 脊柱参数
 * @param cycle 摆动周期（秒）
 */
export function createSpineRig(spine: SpineConfig, cycle: number): FishRig {
  const { head, centerY, length, segments, headSwing, tailSwing, phaseLag } = spine;
  const segmentLength = length / segments;
  const restJoints = Array.from({ length: segments }, (_, index) => ({
    x: head - index * segmentLength,
    y: centerY,
  }));
  let joints = restJoints.map((joint) => ({ ...joint, angle: 0 }));
  return {
    bind(x, y) {
      // 点到每节骨段（从关节向尾部延伸 segmentLength）的距离，取最近两节
      const nearest = restJoints
        .map((joint, index) => {
          const along = Math.max(0, Math.min(segmentLength, joint.x - x));
          return { index, d: Math.hypot(x - (joint.x - along), y - joint.y) };
        })
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      const total = nearest.reduce((sum, item) => sum + 1 / (item.d + 8) ** 3, 0);
      return nearest.map((item) => ({ index: item.index, weight: 1 / (item.d + 8) ** 3 / total }));
    },
    pose(time, amplitude = 1) {
      const phase = (time / cycle) * Math.PI * 2;
      let x = head;
      // 头部随相位轻微上下起伏
      let y = centerY + Math.sin(phase) * 0.5 * amplitude;
      joints = restJoints.map((_, index) => {
        const progress = index / (segments - 1);
        const swing = (headSwing + (tailSwing - headSwing) * progress) * amplitude;
        const angle = Math.sin(phase - index * phaseLag) * swing;
        const joint = { x, y, angle };
        x -= Math.cos(angle) * segmentLength;
        y -= Math.sin(angle) * segmentLength;
        return joint;
      });
    },
    deform(binding, x, y) {
      let deformedX = 0;
      let deformedY = 0;
      let angle = 0;
      // 把点相对静止关节的局部坐标，按当前关节的位置与转角变换回来，再按权重混合
      for (const { index, weight } of binding!) {
        const joint = joints[index]!;
        const localX = x - restJoints[index]!.x;
        const localY = y - centerY;
        deformedX +=
          (joint.x + localX * Math.cos(joint.angle) - localY * Math.sin(joint.angle)) * weight;
        deformedY +=
          (joint.y + localX * Math.sin(joint.angle) + localY * Math.cos(joint.angle)) * weight;
        angle += joint.angle * weight;
      }
      return { x: deformedX, y: deformedY, angle };
    },
  };
}

/**
 * 创建蝠鲼的整体形变场：两翼远离中线的部分上下扇动、尾鞭随相位甩动、全身轻微起伏
 *
 * 不需要绑定；附加转角由该点沿笔画方向前移一个单位后的位移差求得，让笔画字符跟着翼面转向。
 *
 * @param cycle 扇动周期（秒）
 */
export function createMantaRig(cycle: number): FishRig {
  let phase = 0;
  let amplitude = 1;
  const displace = (x: number, y: number) => {
    const offsetY = y - 108;
    // wing：距中线 36 以外开始、112 内渐变到 1 的翼面权重
    const wing = Math.max(0, Math.min(1, (Math.abs(offsetY) - 36) / 112));
    // tail：x 从 96 往左 160 内渐变到 1 的尾鞭权重
    const tail = Math.max(0, Math.min(1, (96 - x) / 160));
    const flap = Math.sin(phase - wing * 0.85);
    const whip = 14 * tail * tail * Math.sin(phase * 1.7 - tail * Math.PI * 1.8);
    return {
      x: x + 7 * wing * wing * flap * amplitude,
      y:
        y +
        offsetY * 0.075 * wing * wing * flap * amplitude +
        whip * amplitude +
        Math.sin(phase) * 0.5 * amplitude,
    };
  };
  return {
    bind() {
      return null;
    },
    pose(time, nextAmplitude = 1) {
      phase = (time / cycle) * Math.PI * 2;
      amplitude = nextAmplitude;
    },
    deform(_binding, x, y, lineAngle = 0) {
      const point = displace(x, y);
      const ahead = displace(x + Math.cos(lineAngle), y + Math.sin(lineAngle));
      return { ...point, angle: Math.atan2(ahead.y - point.y, ahead.x - point.x) - lineAngle };
    },
  };
}
