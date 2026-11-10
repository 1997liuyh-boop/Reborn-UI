/**
 * 挂绳（strap）公共工具：REBORN UI 字标素材、挂带着色片段、挂带网格与绳索物理。
 *
 * 奖励区的奖牌挂带与页面其他挂绳效果共用这一份实现，导出的名字与参数顺序保持稳定，供多个模块引用。
 */

/** 绳索节点：x/y 为当前位置，px/py 为上一步位置（Verlet 积分用两者之差隐式表示速度） */
export interface RopeNode {
  x: number;
  y: number;
  px: number;
  py: number;
}

/** 挂带网格上的一个点；z 缺省按 0 处理 */
export interface StrapPoint {
  x: number;
  y: number;
  z?: number;
}

/** 挂带中心线上的节点：half 为该处半宽，v 为沿带方向的纹理坐标（0~1） */
export interface StrapNode extends StrapPoint {
  half: number;
  v: number;
}

/** 挂带字标第一段「REBORN」（白），宽 392、高 37；字形取自页面精灵图的字母符号 */
export const STRAP_WORDMARK_SVG = `<svg width="392" height="37" viewBox="0 0 392 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(0 0)"><path transform="translate(-1112.82 0)" d="M1112.82 35.8V0.799999H1162.67C1166.24 0.799999 1168.97 1.6 1170.87 3.2C1172.77 4.76667 1173.72 6.93333 1173.72 9.7C1173.72 11.8333 1173.07 13.5667 1171.77 14.9C1170.47 16.2333 1168.44 17.15 1165.67 17.65V18.65C1168.7 18.9167 1170.99 19.7833 1172.52 21.25C1174.05 22.6833 1174.82 24.55 1174.82 26.85V35.8H1158.62V27.35C1158.62 26.75 1158.44 26.2667 1158.07 25.9C1157.7 25.5333 1157.2 25.35 1156.57 25.35H1128.32V35.8H1112.82ZM1128.32 15.85H1155.57C1156.2 15.85 1156.7 15.65 1157.07 15.25C1157.44 14.85 1157.62 14.3167 1157.62 13.65C1157.62 12.9167 1157.42 12.3667 1157.02 12C1156.62 11.6333 1156.14 11.45 1155.57 11.45H1128.32V15.85Z" fill="#FFFFFF"/></g>
<g transform="translate(66 0)"><path transform="translate(-259.987 0)" d="M259.987 35.8V0.799999H321.987V10.9H275.487V14H316.587V22.6H275.487V25.7H321.987V35.8H259.987Z" fill="#FFFFFF"/></g>
<g transform="translate(132 0)"><path transform="translate(-64.577 0)" d="M64.577 35.8V0.799999H114.427C118.027 0.799999 120.76 1.61667 122.627 3.25C124.527 4.85 125.477 7 125.477 9.7C125.477 11.8333 124.827 13.5667 123.527 14.9C122.227 16.2333 120.194 17.15 117.427 17.65V18.65C120.394 18.9167 122.66 19.7667 124.227 21.2C125.794 22.6 126.577 24.4833 126.577 26.85C126.577 29.5167 125.627 31.6833 123.727 33.35C121.86 34.9833 119.294 35.8 116.027 35.8H64.577ZM80.077 14.45H107.527C108.16 14.45 108.66 14.2667 109.027 13.9C109.394 13.5333 109.577 13.05 109.577 12.45C109.577 11.8167 109.377 11.3333 108.977 11C108.61 10.6333 108.127 10.45 107.527 10.45H80.077V14.45ZM80.077 26.15H108.327C108.96 26.15 109.46 25.9667 109.827 25.6C110.194 25.2333 110.377 24.75 110.377 24.15C110.377 23.5167 110.177 23.0333 109.777 22.7C109.41 22.3333 108.927 22.15 108.327 22.15H80.077V26.15Z" fill="#FFFFFF"/></g>
<g transform="translate(198 0)"><path transform="translate(-917.127 0)" d="M948.127 36.6C941.794 36.6 936.294 35.8833 931.627 34.45C926.994 32.9833 923.411 30.9 920.877 28.2C918.377 25.5 917.127 22.3 917.127 18.6V18C917.127 14.2667 918.377 11.0667 920.877 8.4C923.411 5.7 926.994 3.63333 931.627 2.2C936.294 0.733333 941.794 0 948.127 0C954.494 0 959.994 0.733333 964.627 2.2C969.261 3.63333 972.827 5.7 975.327 8.4C977.861 11.0667 979.127 14.2667 979.127 18V18.6C979.127 22.3 977.861 25.5 975.327 28.2C972.827 30.9 969.261 32.9833 964.627 34.45C959.994 35.8833 954.494 36.6 948.127 36.6ZM948.127 25.1C952.694 25.1 956.294 24.5333 958.927 23.4C961.594 22.2333 962.927 20.6333 962.927 18.6V18C962.927 15.9667 961.594 14.3833 958.927 13.25C956.294 12.0833 952.694 11.5 948.127 11.5C943.594 11.5 939.994 12.0833 937.327 13.25C934.661 14.3833 933.327 15.9667 933.327 18V18.6C933.327 20.6333 934.661 22.2333 937.327 23.4C939.994 24.5333 943.594 25.1 948.127 25.1Z" fill="#FFFFFF"/></g>
<g transform="translate(264 0)"><path transform="translate(-1112.82 0)" d="M1112.82 35.8V0.799999H1162.67C1166.24 0.799999 1168.97 1.6 1170.87 3.2C1172.77 4.76667 1173.72 6.93333 1173.72 9.7C1173.72 11.8333 1173.07 13.5667 1171.77 14.9C1170.47 16.2333 1168.44 17.15 1165.67 17.65V18.65C1168.7 18.9167 1170.99 19.7833 1172.52 21.25C1174.05 22.6833 1174.82 24.55 1174.82 26.85V35.8H1158.62V27.35C1158.62 26.75 1158.44 26.2667 1158.07 25.9C1157.7 25.5333 1157.2 25.35 1156.57 25.35H1128.32V35.8H1112.82ZM1128.32 15.85H1155.57C1156.2 15.85 1156.7 15.65 1157.07 15.25C1157.44 14.85 1157.62 14.3167 1157.62 13.65C1157.62 12.9167 1157.42 12.3667 1157.02 12C1156.62 11.6333 1156.14 11.45 1155.57 11.45H1128.32V15.85Z" fill="#FFFFFF"/></g>
<g transform="translate(330 0)"><path transform="translate(-851.1 0)" d="M851.1 35.8V0.799999H866.4L897.6 20.1V0.799999H913.1V35.8H897.8L866.6 16.5V35.8H851.1Z" fill="#FFFFFF"/></g>
</svg>
`;
/** 字标第一段的宽度 */
export const STRAP_WORDMARK_WIDTH = 392;

/** 挂带字标第二段「UI」（蓝），宽 128、高 37 */
export const STRAP_SUFFIX_SVG = `<svg width="128" height="37" viewBox="0 0 128 37" fill="none" xmlns="http://www.w3.org/2000/svg">
<g transform="translate(0 0)"><path transform="translate(-1305.19 0)" d="M1336.19 36.6C1315.52 36.6 1305.19 29.95 1305.19 16.65V0.799999H1320.69V16.15C1320.69 22.1167 1325.85 25.1 1336.19 25.1C1346.52 25.1 1351.69 22.1167 1351.69 16.15V0.799999H1367.19V16.65C1367.19 29.95 1356.85 36.6 1336.19 36.6Z" fill="#1677FF"/></g>
<g transform="translate(66 0)"><path transform="translate(-524.13 0)" d="M524.13 35.8V24.2H547.38V12.4H524.13V0.799999H586.13V12.4H562.88V24.2H586.13V35.8H524.13Z" fill="#1677FF"/></g>
</svg>
`;
/** 字标第二段的宽度 */
export const STRAP_SUFFIX_WIDTH = 128;

/**
 * 挂带面料的片元着色片段（GLSL，需要嵌入完整着色器使用）：
 * - weave：两组高频正弦相乘，模拟织带纹理；
 * - edge：横向两侧 10% 处渐暗，形成包边；
 * - sheen：横向余弦，中间略亮；
 * - u_material<1.5 时叠加 u_strap 贴图里的字标（沿带方向重复 3 次），字标处压成近黑色。
 * 依赖 v_uv、u_color、u_material、u_strap，并声明输出变量 color。
 */
export const STRAP_SHADER_SNIPPET = `
    float weave=.92+.055*sin(v_uv.x*120.)*sin(v_uv.y*420.);
    float edge=smoothstep(0.,.1,v_uv.x)*smoothstep(0.,.1,1.-v_uv.x);
    float sheen=.85+.15*cos(v_uv.x*3.14159);
    vec3 color=u_color*weave*sheen*(.72+.28*edge);
    if(u_material<1.5){
      vec4 mark=texture2D(u_strap,vec2(v_uv.x,fract(v_uv.y*3.)));
      color=mix(color,vec3(.06),mark.a*.85);
    }
`;

/**
 * 在 128×512 的画布上绘制竖排的挂带字标贴图
 * @param ctx 贴图画布的 2D 上下文
 * @param image 字标图片；尚未加载完成时退化为黑色粗体文字「REBORN」
 */
export function paintStrapLabel(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
  ctx.clearRect(0, 0, 128, 512);
  ctx.save();
  // 以画布中心为原点旋转 90°，让横向字标沿挂带竖向排布
  ctx.translate(64, 256);
  ctx.rotate(Math.PI / 2);
  if (image.complete && image.naturalWidth) {
    ctx.drawImage(image, -174, -17, 348, 34);
  } else {
    ctx.fillStyle = "#000";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("REBORN", 0, 14);
  }
  ctx.restore();
}

/**
 * 把挂带中心线展开成三角形带
 *
 * 除最后一个节点外，每个节点沿相邻节点连线的法向左右各偏移 half，得到截面两端；
 * 最后一个节点的截面直接使用 endPair（通常是挂带在奖牌挂环上的两个固定点）。
 * 相邻截面之间拼两个三角形，每个顶点输出 [x, y, z, u, v] 共 5 个数。
 *
 * @param nodes 中心线节点
 * @param endPair 末端截面的左右两点
 * @param flipV 是否把 v 翻转为 1 - v（背面挂带用，让贴图方向与正面一致）
 * @returns 扁平顶点数组，每 5 个数一个顶点，每 6 个顶点一段
 */
export function buildStrapTriangles(
  nodes: readonly StrapNode[],
  endPair: readonly [StrapPoint, StrapPoint],
  flipV = false,
): number[] {
  const vertex = (point: StrapPoint, u: number, v: number) => [
    point.x,
    point.y,
    point.z || 0,
    u,
    v,
  ];
  const vertices: number[] = [];
  const sections = nodes.map((node, index): readonly [StrapPoint, StrapPoint] => {
    if (index === nodes.length - 1) return [endPair[0], endPair[1]];
    const prev = nodes[Math.max(0, index - 1)]!;
    const next = nodes[Math.min(nodes.length - 1, index + 1)]!;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    return [
      { x: node.x - (dy / length) * node.half, y: node.y + (dx / length) * node.half },
      { x: node.x + (dy / length) * node.half, y: node.y - (dx / length) * node.half },
    ];
  });
  for (let index = 0; index < nodes.length - 1; index++) {
    const [left, right] = sections[index]!;
    const [nextLeft, nextRight] = sections[index + 1]!;
    const v = flipV ? 1 - nodes[index]!.v : nodes[index]!.v;
    const nextV = flipV ? 1 - nodes[index + 1]!.v : nodes[index + 1]!.v;
    vertices.push(
      ...vertex(left, 0, v),
      ...vertex(right, 1, v),
      ...vertex(nextLeft, 0, nextV),
      ...vertex(nextLeft, 0, nextV),
      ...vertex(right, 1, v),
      ...vertex(nextRight, 1, nextV),
    );
  }
  return vertices;
}

/**
 * 对绳索做一步 Verlet 积分（首节点固定不动）：速度衰减 0.986，竖直方向加 0.3 的重力
 * @param nodes 绳索节点，原地修改
 * @returns 本步所有节点速度分量绝对值之和，调用方据此判断绳索是否已静止
 */
export function integrateRope(nodes: RopeNode[]): number {
  let motion = 0;
  for (let index = 1; index < nodes.length; index++) {
    const node = nodes[index]!;
    const vx = (node.x - node.px) * 0.986;
    const vy = (node.y - node.py) * 0.986;
    node.px = node.x;
    node.py = node.y;
    node.x += vx;
    node.y += vy + 0.3;
    motion += Math.abs(vx) + Math.abs(vy);
  }
  return motion;
}

/**
 * 做一轮距离约束：首节点钉在锚点，其余相邻节点之间拉回到 segmentLength
 *
 * 第一段只移动下游节点（上游是锚点）；之后每段两端各承担一半修正量。
 * @param nodes 绳索节点，原地修改
 * @param anchorX 锚点 x
 * @param anchorY 锚点 y
 * @param segmentLength 每段目标长度
 */
export function constrainRope(
  nodes: RopeNode[],
  anchorX: number,
  anchorY: number,
  segmentLength: number,
): void {
  nodes[0]!.x = anchorX;
  nodes[0]!.y = anchorY;
  for (let index = 1; index < nodes.length; index++) {
    const prev = nodes[index - 1]!;
    const node = nodes[index]!;
    const dx = node.x - prev.x;
    const dy = node.y - prev.y;
    const distance = Math.hypot(dx, dy) || 1;
    const error = (distance - segmentLength) / distance;
    const share = index === 1 ? 1 : 0.5;
    node.x -= dx * error * share;
    node.y -= dy * error * share;
    if (index > 1) {
      prev.x += dx * error * 0.5;
      prev.y += dy * error * 0.5;
    }
  }
}
