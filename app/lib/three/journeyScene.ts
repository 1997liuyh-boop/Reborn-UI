import type { Material, Texture } from "three";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  FogExp2,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/* ═══════════════════════════════════════════════════════════════════════
   云海之旅：滚动从云上一路下降到海底的场景。

   世界以海平面 y = 0 为基准，摄像机沿 -z 前进并逐段下降：
   - 云上：摄像机在云海之上，太阳低悬在前方；
   - 穿过云层：云团由实例化的公告板组成，穿行时雾一下子变浓、变白；
   - 俯瞰大地：低多边形地形（田野、林地、山脊、海滩），视角压低看向地面；
   - 潜入海底：越过海岸线后穿过水面，雾切换为水下的青蓝色，光柱、浮游粒子、海草与鱼群出现。
   全部几何与贴图在代码里生成，不加载任何外部资源；滚动进度只决定摄像机位置，
   云、水面、海草与鱼群按时间各自运动。
   ═══════════════════════════════════════════════════════════════════════ */

export interface JourneySceneOptions {
  /** 减少动态效果：云、水面、海草与鱼群静止，摄像机不随指针摆动 */
  reducedMotion?: boolean;
}

export interface JourneySceneController {
  /** 设置滚动进度（0 在云上，1 停在海底），摄像机会平滑追上 */
  setProgress: (value: number) => void;
  /** 设置指针位置（-1 ~ 1），用于轻微的视差摆动 */
  setPointer: (x: number, y: number) => void;
  /** 离开视口或页面隐藏时暂停渲染循环 */
  setPaused: (value: boolean) => void;
  /** 画布尺寸变化后调用 */
  resize: () => void;
  dispose: () => void;
}

/* ── 摄像机路径 ───────────────────────────────────────────────────────── */

/** 关键帧：at 为滚动进度，position 与 target 是摄像机位置与注视点 */
const KEYFRAMES: { at: number; position: [number, number, number]; target: [number, number, number] }[] = [
  { at: 0, position: [0, 150, 140], target: [0, 138, -200] },
  { at: 0.18, position: [0, 140, 95], target: [0, 126, -200] },
  { at: 0.3, position: [0, 104, 48], target: [0, 90, -160] },
  { at: 0.42, position: [0, 58, 12], target: [0, 40, -160] },
  // 视角转换：大幅低头，看向下方的大地
  { at: 0.56, position: [0, 66, -28], target: [0, 0, -78] },
  { at: 0.67, position: [0, 36, -96], target: [0, 0, -152] },
  { at: 0.76, position: [0, 5, -140], target: [0, -12, -188] },
  // 穿过水面
  { at: 0.85, position: [0, -15, -172], target: [0, -24, -232] },
  { at: 1, position: [0, -27, -212], target: [0, -28, -282] },
];

const CLOUD_BASE = 76;
const CLOUD_TOP = 104;
const COAST_Z = -112;
const SUN_DIRECTION = new Vector3(0, 0.16, -1).normalize();

const colors = {
  zenith: new Color("#2f63b0"),
  middle: new Color("#8ab3dd"),
  horizon: new Color("#f6dcb8"),
  sun: new Color("#fff3da"),
  haze: new Color("#c9dbee"),
  cloudFog: new Color("#f3f6fa"),
  underwater: new Color("#0e4c5e"),
};

/* ── 噪声与随机 ───────────────────────────────────────────────────────── */

/** 可复现的伪随机数：同一个种子每次生成同一片地形与鱼群 */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

/** 二维值噪声，输出 0 ~ 1 */
function valueNoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** 分形噪声，输出约 0 ~ 1 */
function fbm(x: number, y: number, octaves = 5) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let index = 0; index < octaves; index++) {
    sum += amplitude * valueNoise(x * frequency, y * frequency);
    frequency *= 2;
    amplitude *= 0.5;
  }
  return sum / (1 - 0.5 ** octaves);
}

/** 地形高度：海岸线以北是起伏的陆地，往南逐渐沉成大陆架与海床 */
function terrainHeight(x: number, z: number) {
  const inland = MathUtils.smoothstep(z, COAST_Z - 38, COAST_Z + 30);
  const mountains = MathUtils.smoothstep(z, -60, 160) * 0.65 + 0.35;
  const ridges = MathUtils.smoothstep(Math.abs(x), 110, 260) * 26;
  const land = 2.5 + fbm(x * 0.012, z * 0.012) * 34 * mountains + ridges;
  const deep = 1 - MathUtils.smoothstep(z, -205, COAST_Z);
  const seabed = MathUtils.lerp(-5, -44, deep) + (fbm(x * 0.04 + 9, z * 0.04) - 0.5) * 9;
  return MathUtils.lerp(seabed, land, inland);
}

function terrainColor(height: number, x: number, z: number, target: Color) {
  const patch = fbm(x * 0.05 + 3, z * 0.05 - 7, 3);
  if (height < -1.5) {
    // 海床：越深越暗、越偏青
    const depth = MathUtils.clamp(-height / 45, 0, 1);
    return target.set("#d8c69a").lerp(new Color("#3d6f74"), depth * 0.75);
  }
  if (height < 3) return target.set("#e7d7a8");
  if (height < 17) return target.set(patch > 0.55 ? "#9cbf5e" : patch > 0.42 ? "#79a64c" : "#c9b45c");
  if (height < 29) return target.set(patch > 0.5 ? "#3f6f3a" : "#4f7d40");
  if (height < 40) return target.set("#8b877a");
  return target.set("#f2f4f6");
}

/* ── 贴图 ─────────────────────────────────────────────────────────────── */

/** 云团贴图：几团偏移的径向渐变叠成不规则的棉絮轮廓 */
function createCloudTexture(random: () => number) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  for (let index = 0; index < 9; index++) {
    const x = size / 2 + (random() - 0.5) * size * 0.4;
    const y = size / 2 + (random() - 0.5) * size * 0.28;
    const radius = size * (0.18 + random() * 0.18);
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

function createDotTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  return new CanvasTexture(canvas);
}

/* ── 天空与水面 ───────────────────────────────────────────────────────── */

function createSky() {
  return new Mesh(new SphereGeometry(900, 48, 24), new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      sunDirection: { value: SUN_DIRECTION },
      zenith: { value: colors.zenith },
      middle: { value: colors.middle },
      horizon: { value: colors.horizon },
      sun: { value: colors.sun },
      haze: { value: colors.haze },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDirection;
      uniform vec3 zenith;
      uniform vec3 middle;
      uniform vec3 horizon;
      uniform vec3 sun;
      uniform vec3 haze;
      varying vec3 vDirection;
      void main() {
        float h = vDirection.y;
        vec3 color = mix(horizon, middle, smoothstep(0.0, 0.22, h));
        color = mix(color, zenith, smoothstep(0.2, 0.75, h));
        float facing = max(dot(normalize(vDirection), sunDirection), 0.0);
        color += sun * smoothstep(0.9991, 0.9996, facing) * 1.4;
        color += horizon * pow(facing, 18.0) * 0.5;
        // 地平线以下是雾色，远处的云与地面融进去
        color = mix(color, haze, smoothstep(0.02, -0.08, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }));
}

/** 海面：从上看是带菲涅尔与日光闪烁的深蓝，从水下看是发亮的波纹天花板 */
function createWater() {
  const material = new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    fog: false,
    uniforms: {
      time: { value: 0 },
      sunDirection: { value: SUN_DIRECTION },
      deep: { value: new Color("#1d5a7a") },
      shallow: { value: new Color("#3f9cb0") },
      haze: { value: colors.haze },
      sun: { value: colors.sun },
      ceiling: { value: new Color("#7fd6dc") },
      underwater: { value: colors.underwater },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform vec3 sunDirection;
      uniform vec3 deep;
      uniform vec3 shallow;
      uniform vec3 haze;
      uniform vec3 sun;
      uniform vec3 ceiling;
      uniform vec3 underwater;
      varying vec3 vWorld;
      void main() {
        vec2 p = vWorld.xz;
        // 两组方向不同的正弦波合成法线扰动
        vec3 normal = normalize(vec3(
          sin(p.x * 0.31 + time * 1.1) * 0.06 + sin(p.y * 0.23 - time * 0.9) * 0.05 + sin((p.x + p.y) * 0.9 + time * 2.0) * 0.03,
          1.0,
          cos(p.y * 0.27 + time * 1.3) * 0.06 + cos(p.x * 0.19 - time * 0.7) * 0.05
        ));
        vec3 toCamera = cameraPosition - vWorld;
        float distance = length(toCamera);
        vec3 view = toCamera / distance;
        if (gl_FrontFacing) {
          float fresnel = pow(1.0 - max(dot(view, normal), 0.0), 3.0);
          vec3 color = mix(deep, shallow, 0.35) ;
          color = mix(color, haze, fresnel * 0.6);
          float glint = pow(max(dot(reflect(-view, normal), sunDirection), 0.0), 180.0);
          color += sun * glint * 1.3;
          color = mix(color, haze, 1.0 - exp(-distance * 0.0022));
          gl_FragColor = vec4(color, 0.94);
        } else {
          // 水下仰望：越靠近头顶越亮，波纹带出闪动的焦散
          float ripple = sin(p.x * 0.6 + time * 1.6 + sin(p.y * 0.5 + time) * 2.0) * sin(p.y * 0.7 - time * 1.2);
          vec3 color = mix(underwater, ceiling, 0.55 + 0.25 * ripple);
          color = mix(color, underwater, 1.0 - exp(-distance * 0.02));
          gl_FragColor = vec4(color, 0.96);
        }
      }
    `,
  });
  const water = new Mesh(new PlaneGeometry(2400, 2400, 1, 1), material);
  water.rotation.x = -Math.PI / 2;
  water.renderOrder = 1;
  return { water, material };
}

/* ── 云层 ─────────────────────────────────────────────────────────────── */

/** 实例化公告板云团：每个四边形在顶点着色器里转向摄像机 */
function createClouds(random: () => number) {
  const offsets: number[] = [];
  const scales: number[] = [];
  const shades: number[] = [];
  for (let clump = 0; clump < 72; clump++) {
    const cx = (random() - 0.5) * 900;
    const cz = 360 - random() * 760;
    const cy = MathUtils.lerp(CLOUD_BASE + 4, CLOUD_TOP - 6, random());
    const puffs = 6 + Math.floor(random() * 7);
    for (let index = 0; index < puffs; index++) {
      offsets.push(cx + (random() - 0.5) * 80, cy + (random() - 0.5) * 12, cz + (random() - 0.5) * 60);
      scales.push(30 + random() * 40);
      shades.push(random());
    }
  }
  // 摄像机正好要穿过的那一段额外加密，下降时能真正钻进云里
  for (let index = 0; index < 70; index++) {
    offsets.push((random() - 0.5) * 140, MathUtils.lerp(CLOUD_BASE, CLOUD_TOP, random()), 70 - random() * 110);
    scales.push(22 + random() * 26);
    shades.push(random());
  }

  const base = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.getAttribute("position"));
  geometry.setAttribute("uv", base.getAttribute("uv"));
  geometry.setAttribute("offset", new InstancedBufferAttribute(new Float32Array(offsets), 3));
  geometry.setAttribute("scale", new InstancedBufferAttribute(new Float32Array(scales), 1));
  geometry.setAttribute("shade", new InstancedBufferAttribute(new Float32Array(shades), 1));
  geometry.instanceCount = scales.length;

  const texture = createCloudTexture(random);
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      lit: { value: new Color("#ffffff") },
      warm: { value: new Color("#fff1dc") },
      shadow: { value: new Color("#b9c8dc") },
    },
    vertexShader: /* glsl */ `
      attribute vec3 offset;
      attribute float scale;
      attribute float shade;
      uniform float time;
      varying vec2 vUv;
      varying float vShade;
      varying float vDistance;
      void main() {
        vUv = uv;
        vShade = shade;
        vec3 drift = vec3(sin(time * 0.05 + shade * 6.28) * 6.0, 0.0, 0.0);
        vec4 view = viewMatrix * vec4(offset + drift, 1.0);
        view.xy += position.xy * scale * vec2(1.6, 1.0);
        vDistance = -view.z;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform vec3 lit;
      uniform vec3 warm;
      uniform vec3 shadow;
      varying vec2 vUv;
      varying float vShade;
      varying float vDistance;
      void main() {
        float alpha = texture2D(map, vUv).a;
        // 顶部受光偏暖白，底部偏灰蓝
        vec3 color = mix(shadow, mix(lit, warm, vShade * 0.6), smoothstep(0.15, 0.85, vUv.y));
        // 贴着镜头的云团淡出，交给雾来表现「身处云中」
        float near = smoothstep(3.0, 22.0, vDistance);
        float far = 1.0 - smoothstep(520.0, 820.0, vDistance);
        gl_FragColor = vec4(color, alpha * near * far);
        if (gl_FragColor.a < 0.01) discard;
      }
    `,
  });
  const clouds = new Mesh(geometry, material);
  clouds.frustumCulled = false;
  clouds.renderOrder = 2;
  return { clouds, material, texture, base };
}

/* ── 大地 ─────────────────────────────────────────────────────────────── */

function createTerrain(random: () => number) {
  const geometry = new PlaneGeometry(900, 760, 220, 190);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -40);
  const position = geometry.getAttribute("position") as BufferAttribute;
  const colorArray = new Float32Array(position.count * 3);
  const color = new Color();
  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const z = position.getZ(index);
    const height = terrainHeight(x, z);
    position.setY(index, height);
    terrainColor(height, x, z, color);
    // 轻微的明暗抖动，让平地也有田块感
    const jitter = 0.92 + valueNoise(x * 0.2, z * 0.2) * 0.12;
    colorArray[index * 3] = color.r * jitter;
    colorArray[index * 3 + 1] = color.g * jitter;
    colorArray[index * 3 + 2] = color.b * jitter;
  }
  geometry.setAttribute("color", new BufferAttribute(colorArray, 3));
  geometry.computeVertexNormals();
  const terrain = new Mesh(geometry, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));

  // 低多边形树林：只种在草地与林地的高度区间
  const treeGeometry = new ConeGeometry(1, 3.2, 6);
  treeGeometry.translate(0, 1.6, 0);
  const trees = new InstancedMesh(treeGeometry, new MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), 2200);
  const dummy = new Object3D();
  const treeColor = new Color();
  let count = 0;
  for (let attempt = 0; attempt < 12000 && count < trees.count; attempt++) {
    const x = (random() - 0.5) * 760;
    const z = 300 - random() * 400;
    const height = terrainHeight(x, z);
    if (height < 6 || height > 30) continue;
    if (fbm(x * 0.03 - 4, z * 0.03 + 11, 3) < 0.48) continue;
    const scale = 1.2 + random() * 1.6;
    dummy.position.set(x, height - 0.2, z);
    dummy.scale.set(scale, scale * (0.9 + random() * 0.5), scale);
    dummy.rotation.y = random() * Math.PI;
    dummy.updateMatrix();
    trees.setMatrixAt(count, dummy.matrix);
    trees.setColorAt(count, treeColor.set(random() > 0.5 ? "#2f5e33" : "#3e6f3a"));
    count++;
  }
  trees.count = count;
  return { terrain, trees };
}

/* ── 海底 ─────────────────────────────────────────────────────────────── */

/** 鱼：椭球身体 + 竖直的三角尾鳍，头朝 -z */
function createFishGeometry() {
  const body = new SphereGeometry(1, 10, 8);
  body.scale(0.36, 0.42, 1.1);
  const tail = new Shape();
  tail.moveTo(0, 0);
  tail.lineTo(0.75, 0.55);
  tail.lineTo(0.6, 0);
  tail.lineTo(0.75, -0.55);
  tail.lineTo(0, 0);
  const tailGeometry = new ShapeGeometry(tail);
  // 形状画在 xy 平面，转成竖直的 yz 平面并接在身体尾端
  tailGeometry.rotateY(-Math.PI / 2);
  tailGeometry.translate(0, 0, 0.95);
  const merged = mergeGeometries([body, tailGeometry])!;
  body.dispose();
  tailGeometry.dispose();
  return merged;
}

interface School {
  center: Vector3;
  radius: number;
  speed: number;
  fish: { offset: Vector3; phase: number; scale: number }[];
  start: number;
}

/** 海草摇摆：在标准材质的顶点阶段按高度加一段正弦位移 */
function swayMaterial(time: { value: number }) {
  const material = new MeshStandardMaterial({ color: "#3f7f4d", side: DoubleSide, roughness: 0.8, emissive: "#0f2a1a", emissiveIntensity: 0.5 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.time = time;
    shader.vertexShader = `uniform float time;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float seed = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.5;
      #else
        float seed = 0.0;
      #endif
      transformed.x += sin(time * 1.3 + seed + position.y * 2.2) * position.y * position.y * 0.45;`,
    );
  };
  return material;
}

function createSeaLife(random: () => number) {
  const group = new Group();
  const time = { value: 0 };

  // 礁石
  const rocks = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: "#5d6a66", flatShading: true, roughness: 1 }), 120);
  const dummy = new Object3D();
  for (let index = 0; index < rocks.count; index++) {
    const x = (random() - 0.5) * 90;
    const z = -170 - random() * 140;
    const scale = 0.8 + random() * 3.4;
    dummy.position.set(x, terrainHeight(x, z) + scale * 0.3, z);
    dummy.scale.set(scale * (0.8 + random() * 0.6), scale * (0.5 + random() * 0.5), scale);
    dummy.rotation.set(random(), random() * Math.PI, random());
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
  }
  group.add(rocks);

  // 海草：单位高度的细长平面，实例缩放出不同高度
  const kelpGeometry = new PlaneGeometry(0.7, 1, 1, 8);
  kelpGeometry.translate(0, 0.5, 0);
  const kelp = new InstancedMesh(kelpGeometry, swayMaterial(time), 260);
  for (let index = 0; index < kelp.count;) {
    const x = (random() - 0.5) * 100;
    const z = -175 - random() * 130;
    // 不长在摄像机的必经之路上
    if (Math.abs(x) < 6 && z > -230) continue;
    const height = 5 + random() * 12;
    dummy.position.set(x, terrainHeight(x, z) - 0.3, z);
    dummy.scale.set(1, height, 1);
    dummy.rotation.set(0, random() * Math.PI, 0);
    dummy.updateMatrix();
    kelp.setMatrixAt(index, dummy.matrix);
    index++;
  }
  group.add(kelp);

  // 鱼群：每群绕一个中心巡游，鱼在群内保持相对位置并轻微摆尾
  const schoolsConfig: { center: [number, number, number]; radius: number; speed: number; count: number; colors: string[] }[] = [
    { center: [-13, -27, -246], radius: 13, speed: 0.32, count: 42, colors: ["#ff9a3c", "#ffb35c", "#ff7a2f"] },
    { center: [15, -22, -262], radius: 17, speed: -0.24, count: 48, colors: ["#a9d3ee", "#d6ecf8", "#7fb4d8"] },
    { center: [2, -33, -288], radius: 24, speed: 0.18, count: 54, colors: ["#ffd166", "#f6e7a1", "#ffc23d"] },
  ];
  const schools: School[] = [];
  let total = 0;
  for (const config of schoolsConfig) {
    const fish = Array.from({ length: config.count }, () => ({
      offset: new Vector3((random() - 0.5) * 7, (random() - 0.5) * 3.5, (random() - 0.5) * 7),
      phase: random() * Math.PI * 2,
      scale: 0.5 + random() * 0.45,
    }));
    schools.push({ center: new Vector3(...config.center), radius: config.radius, speed: config.speed, fish, start: total });
    total += config.count;
  }
  const fishMesh = new InstancedMesh(createFishGeometry(), new MeshStandardMaterial({ roughness: 0.45, metalness: 0.2, side: DoubleSide, emissive: "#1b2a30", emissiveIntensity: 0.4 }), total);
  const fishColor = new Color();
  schoolsConfig.forEach((config, schoolIndex) => {
    const school = schools[schoolIndex]!;
    for (let index = 0; index < config.count; index++) fishMesh.setColorAt(school.start + index, fishColor.set(config.colors[index % config.colors.length]!));
  });
  group.add(fishMesh);

  // 从水面斜射下来的光柱：叠加混合的竖长平面，始终转向摄像机
  const shaftMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
    uniforms: { time, color: { value: new Color("#9fe9ea") } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time;
      uniform vec3 color;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
        float fade = smoothstep(0.0, 0.9, vUv.y);
        float flicker = 0.75 + 0.25 * sin(time * 0.8 + vUv.x * 6.0);
        gl_FragColor = vec4(color, edge * fade * flicker * 0.16);
      }
    `,
  });
  const shafts: Mesh[] = [];
  const shaftGeometry = new PlaneGeometry(9, 70);
  for (let index = 0; index < 9; index++) {
    const shaft = new Mesh(shaftGeometry, shaftMaterial);
    shaft.position.set((random() - 0.5) * 70, -32, -190 - random() * 110);
    shaft.rotation.z = (random() - 0.5) * 0.35;
    shafts.push(shaft);
    group.add(shaft);
  }

  // 浮游微粒
  const dotTexture = createDotTexture();
  const particleCount = 700;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index++) {
    particlePositions[index * 3] = (random() - 0.5) * 90;
    particlePositions[index * 3 + 1] = -2 - random() * 42;
    particlePositions[index * 3 + 2] = -150 - random() * 160;
  }
  const particleGeometry = new BufferGeometry();
  particleGeometry.setAttribute("position", new BufferAttribute(particlePositions, 3));
  const particles = new Points(particleGeometry, new PointsMaterial({
    size: 0.28,
    map: dotTexture,
    color: "#cdf6f2",
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: AdditiveBlending,
  }));
  group.add(particles);

  const matrix = new Matrix4();
  const quaternion = new Quaternion();
  const scaleVector = new Vector3();
  const position = new Vector3();
  const ahead = new Vector3();
  const up = new Vector3(0, 1, 0);
  const wiggle = new Quaternion();
  const yAxis = new Vector3(0, 1, 0);
  const lookMatrix = new Matrix4();

  function update(elapsed: number, camera: PerspectiveCamera) {
    time.value = elapsed;
    for (const school of schools) {
      const angle = elapsed * school.speed;
      const direction = Math.sign(school.speed) || 1;
      for (let index = 0; index < school.fish.length; index++) {
        const fish = school.fish[index]!;
        const local = angle + fish.offset.x * 0.02;
        position.set(
          school.center.x + Math.cos(local) * (school.radius + fish.offset.z),
          school.center.y + fish.offset.y + Math.sin(elapsed * 0.6 + fish.phase) * 0.6,
          school.center.z + Math.sin(local) * (school.radius + fish.offset.z),
        );
        // 切线方向即游动方向
        ahead.set(-Math.sin(local) * direction, 0, Math.cos(local) * direction).add(position);
        lookMatrix.lookAt(position, ahead, up);
        quaternion.setFromRotationMatrix(lookMatrix);
        wiggle.setFromAxisAngle(yAxis, Math.sin(elapsed * 9 + fish.phase) * 0.18);
        quaternion.multiply(wiggle);
        scaleVector.setScalar(fish.scale);
        matrix.compose(position, quaternion, scaleVector);
        fishMesh.setMatrixAt(school.start + index, matrix);
      }
    }
    fishMesh.instanceMatrix.needsUpdate = true;
    for (const shaft of shafts) shaft.rotation.y = Math.atan2(camera.position.x - shaft.position.x, camera.position.z - shaft.position.z);
    particles.position.y = Math.sin(elapsed * 0.2) * 0.8;
  }

  return { group, update, textures: [dotTexture] as Texture[] };
}

/* ── 场景入口 ─────────────────────────────────────────────────────────── */

export function createJourneyScene(canvas: HTMLCanvasElement, options: JourneySceneOptions = {}): JourneySceneController {
  const reducedMotion = Boolean(options.reducedMotion);
  const random = seeded(20261105);

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new Scene();
  const fog = new FogExp2(colors.haze.clone(), 0.0016);
  scene.fog = fog;
  scene.background = colors.haze.clone();

  const camera = new PerspectiveCamera(55, 1, 0.5, 2000);

  const sky = createSky();
  scene.add(sky);

  scene.add(new HemisphereLight("#cfe2ff", "#5b4a3a", 1.1));
  const sunLight = new DirectionalLight("#fff0d8", 2.4);
  sunLight.position.copy(SUN_DIRECTION).multiplyScalar(400);
  scene.add(sunLight);

  const { terrain, trees } = createTerrain(random);
  scene.add(terrain, trees);

  const { water, material: waterMaterial } = createWater();
  scene.add(water);

  const { clouds, material: cloudMaterial, texture: cloudTexture, base: cloudBase } = createClouds(random);
  scene.add(clouds);

  const sea = createSeaLife(random);
  scene.add(sea.group);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.45, 0.6, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const positionCurve = new CatmullRomCurve3(KEYFRAMES.map(frame => new Vector3(...frame.position)));
  const targetCurve = new CatmullRomCurve3(KEYFRAMES.map(frame => new Vector3(...frame.target)));

  /** 把滚动进度换算成曲线参数：关键帧之间线性，曲线本身保证速度连续 */
  function curveParameter(value: number) {
    const last = KEYFRAMES.length - 1;
    for (let index = 0; index < last; index++) {
      const from = KEYFRAMES[index]!;
      const to = KEYFRAMES[index + 1]!;
      if (value <= to.at) return (index + (value - from.at) / (to.at - from.at)) / last;
    }
    return 1;
  }

  /* ── 状态与循环 ────────────────────────────────────────────────────── */

  let targetProgress = 0;
  let progress = 0;
  const pointer = new Vector2();
  const smoothPointer = new Vector2();
  let paused = false;
  let frame = 0;
  let last = performance.now();
  let elapsed = 0;
  const position = new Vector3();
  const target = new Vector3();
  const fogColor = new Color();

  function updateCamera(delta: number) {
    // 指数阻尼：滚轮一格一格地滚，摄像机仍连续移动
    progress += (targetProgress - progress) * (1 - Math.exp(-delta * 3.5));
    smoothPointer.lerp(pointer, 1 - Math.exp(-delta * 3));
    const parameter = curveParameter(progress);
    positionCurve.getPoint(parameter, position);
    targetCurve.getPoint(parameter, target);
    camera.position.set(position.x + smoothPointer.x * 2, position.y + smoothPointer.y * 1, position.z);
    target.x += smoothPointer.x * 6;
    camera.lookAt(target);
  }

  /** 雾随高度切换：云上薄霾 → 云中白雾 → 云下薄霾 → 水下青蓝 */
  function updateAtmosphere() {
    const y = camera.position.y;
    const underwater = y < 0;
    sky.visible = !underwater;
    clouds.visible = y > -1;
    sea.group.visible = y < 6;
    if (underwater) {
      const surface = MathUtils.smoothstep(y, -4, 0);
      fogColor.copy(colors.underwater).lerp(colors.haze, surface * 0.3);
      fog.density = MathUtils.lerp(0.03, 0.012, surface);
    }
    else {
      const inCloud = MathUtils.smoothstep(y, CLOUD_BASE - 8, CLOUD_BASE + 6) * (1 - MathUtils.smoothstep(y, CLOUD_TOP - 6, CLOUD_TOP + 10));
      fogColor.copy(colors.haze).lerp(colors.cloudFog, inCloud);
      fog.density = MathUtils.lerp(0.0016, 0.03, inCloud);
    }
    fog.color.copy(fogColor);
    (scene.background as Color).copy(fogColor);
  }

  function render(now: number) {
    frame = 0;
    if (paused) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reducedMotion) elapsed += delta;
    updateCamera(delta);
    updateAtmosphere();
    sky.position.copy(camera.position);
    waterMaterial.uniforms.time!.value = elapsed;
    cloudMaterial.uniforms.time!.value = elapsed;
    if (sea.group.visible) sea.update(elapsed, camera);
    composer.render();
    frame = requestAnimationFrame(render);
  }

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.aspect = width / height;
    // 竖屏时拉宽视角，左右两侧仍有足够的场景
    camera.fov = camera.aspect < 1 ? 70 : 55;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    bloom.setSize(width, height);
  }

  function start() {
    if (frame || paused) return;
    last = performance.now();
    frame = requestAnimationFrame(render);
  }

  resize();
  updateCamera(1);
  updateAtmosphere();
  // 鱼群在首帧就有位置，减少动态效果时也不会全部挤在原点
  sea.update(elapsed, camera);
  start();

  return {
    setProgress(value) {
      targetProgress = MathUtils.clamp(value, 0, 1);
    },
    setPointer(x, y) {
      if (reducedMotion) return;
      pointer.set(MathUtils.clamp(x, -1, 1), MathUtils.clamp(y, -1, 1));
    },
    setPaused(value) {
      paused = value;
      if (paused && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      else {
        start();
      }
    },
    resize,
    dispose() {
      paused = true;
      if (frame) cancelAnimationFrame(frame);
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      scene.traverse((object) => {
        const mesh = object as Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        const material = mesh.material;
        for (const item of Array.isArray(material) ? material : material ? [material] : []) materials.add(item);
      });
      geometries.add(cloudBase);
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const texture of [cloudTexture, ...sea.textures]) texture.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
