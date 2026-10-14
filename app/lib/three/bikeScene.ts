import type { AnimationAction, Material, Object3D } from "three";
import {
  ACESFilmicToneMapping, AnimationMixer, Box3, MathUtils, Matrix4, Mesh, PerspectiveCamera,
  PMREMGenerator, Scene, SkinnedMesh, Texture, Vector3, WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { loadModelBuffer, resolveModelURL } from "./modelAssets";

/**
 * 组件总览头图的自行车场景。
 *
 * 模型是 three.js misc_exporter_usdz 示例里的 Carbon Frame Bike（Robert Schweier & prefrontal cortex，CC BY-SA 4.0），
 * 站内版本换成了 Meshopt + WebP 并整体 gzip，压缩流程见 public/models/bike/README.md。
 *
 * 模型自带一段 12 秒的 Holobike_Loop：0~3.5s 解体、随后静止、6~9.6s 合体、再静止。
 * 这里不让它自己循环，只把 0~3.5s 这段当进度条来回拖：指针越靠近车身越往后拖（解体），离开时往回拖（合体）。
 * 指针的上下位置决定机位俯仰。合体时车身尽量大；解体时镜头随进度拉远，保证散开的零件完整留在画面里。
 * 场景只在进度或机位还在变化时才渲染，静止时不占 GPU。
 */

/** 默认模型地址：public 下的 gzip 文件 */
export const BIKE_MODEL_PATH = "/models/bike/carbon-frame-bike.glb.gz";

/** 解体段结束时间（秒）：刚性零件 3.35s 就位，再留一点让刹车油管的骨骼晃停 */
const EXPLODE_END = 3.5;

/**
 * 指针到车身中心的「椭圆距离」：以合体包围盒在屏幕上的投影半宽、半高为 1（比车身轮廓略大一圈）。
 * 小于 NEAR（车身中部）时完全解体，大于 FAR 时完全合体，中间按 smoothstep 过渡。
 * 1440 宽的屏幕上，FAR 大约落在正文右缘：指针离开文字区、朝车身移动时开始散开。
 */
const NEAR = 0.4;
const FAR = 1.8;

/** 机位：方位角固定为示例的 3/4 侧视；俯仰以 BASE 为中心，指针从头图底到顶对应 -RANGE~+RANGE */
const AZIMUTH = MathUtils.degToRad(-40);
const BASE_ELEVATION = MathUtils.degToRad(12);
const ELEVATION_RANGE = MathUtils.degToRad(16);
const FOV = 30;

/**
 * 合体取景：合体包围盒投影的最大半径占画布半高的比例，车身尽量大。
 * 包围盒含纵深，角点投影比车身轮廓大一圈，所以取到 1.28 时车身轮廓约占画布高度的八九成，角点出画不影响观感。
 */
const BODY_FILL = 1.28;

/**
 * 解体取景：零件必须完整落在画布的这块区域里（NDC 半宽 / 半高）。
 * 横向避开两侧各 18% 的渐隐带（见 OverviewBike.vue，渐隐从 ±0.64 开始）再留一点余量，纵向上下各留 5%。
 * 合体取景放不下时镜头随解体进度拉远，所以解体时车会整体缩小。
 */
const SAFE_X = 0.6;
const SAFE_Y = 0.9;

/** 解体段取样数：预先算好每个时刻、每档俯仰需要的机位距离，运行时按进度与俯仰插值 */
const SAMPLES = 24;

/** 每个零件取多少个顶点代表它的轮廓（另加本地坐标六个方向的极值点） */
const POINTS_PER_PART = 24;

/** 取景表的三档俯仰：最低、默认、最高（指针在头图底、中、顶） */
const PITCHES = [BASE_ELEVATION - ELEVATION_RANGE, BASE_ELEVATION, BASE_ELEVATION + ELEVATION_RANGE];

/** 跟随速度（每秒趋近比例的指数系数）：越大跟得越紧 */
const DAMPING = 5;

export interface BikeSceneOptions {
  canvas: HTMLCanvasElement;
  /** 监听指针的区域：在它上面移动驱动解体与俯仰，离开后恢复 */
  trigger: HTMLElement;
  signal: AbortSignal;
  baseURL?: string;
  /** WebGL 上下文丢失（驱动重置、显存回收）时回调：场景已自行销毁，调用方退回静态首帧 */
  onLost?: () => void;
}

export interface BikeSceneController {
  dispose: () => void;
}

/** 文件本身是 gzip；开发服务器会带 Content-Encoding 让浏览器先解开，所以按魔数判断是否还需要解压 */
async function gunzipIfNeeded(buffer: ArrayBuffer) {
  const head = new Uint8Array(buffer, 0, 2);
  if (head[0] !== 0x1F || head[1] !== 0x8B) return buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

function disposeResources(root: Object3D) {
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  for (const material of materials) material.dispose();
  for (const texture of textures) {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) texture.source.data.close();
  }
}

/** 参与取景的零件：网格与选出来代表轮廓的顶点下标 */
interface Part {
  mesh: Mesh;
  indices: number[];
}

/** 某一时刻的姿态：全部代表顶点的世界坐标（xyz 连续存放）与它们的中心 */
interface Pose {
  points: Float32Array;
  center: Vector3;
}

/** 地面投影片（Shadows 节点）不参与取景，否则中心会被拉低 */
function isShadow(object: Object3D) {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (node.name === "Shadows") return true;
  }
  return false;
}

/**
 * 取景用真实顶点而不是包围盒：轮胎是一圈环，包围盒的角投影出去比轮胎本身大出一截，按盒子取景会白白缩小。
 * 每个零件均匀取 POINTS_PER_PART 个顶点，再补上本地坐标六个方向的极值点，保证最外缘不漏。
 */
function pickParts(root: Object3D) {
  const parts: Part[] = [];
  root.traverse((object) => {
    if (!(object instanceof Mesh) || isShadow(object)) return;
    const position = object.geometry.getAttribute("position");
    if (!position) return;
    const picked = new Set<number>();
    const step = Math.max(1, Math.floor(position.count / POINTS_PER_PART));
    for (let i = 0; i < position.count; i += step) picked.add(i);
    const extremes = [0, 0, 0, 0, 0, 0];
    for (let i = 1; i < position.count; i++) {
      for (let axis = 0; axis < 3; axis++) {
        const value = position.getComponent(i, axis);
        if (value < position.getComponent(extremes[axis * 2]!, axis)) extremes[axis * 2] = i;
        if (value > position.getComponent(extremes[axis * 2 + 1]!, axis)) extremes[axis * 2 + 1] = i;
      }
    }
    for (const index of extremes) picked.add(index);
    parts.push({ mesh: object, indices: [...picked] });
  });
  return parts;
}

/** 量当前姿态：代表顶点换算到世界坐标（蒙皮的刹车油管按当前骨骼变形） */
function measurePose(root: Object3D, parts: Part[]): Pose {
  root.updateMatrixWorld(true);
  const total = parts.reduce((sum, part) => sum + part.indices.length, 0);
  const points = new Float32Array(total * 3);
  const bounds = new Box3();
  const vertex = new Vector3();
  let offset = 0;
  for (const { mesh, indices } of parts) {
    for (const index of indices) {
      mesh.getVertexPosition(index, vertex).applyMatrix4(mesh.matrixWorld);
      vertex.toArray(points, offset);
      bounds.expandByPoint(vertex);
      offset += 3;
    }
  }
  return { points, center: bounds.getCenter(new Vector3()) };
}

export async function createBikeScene(options: BikeSceneOptions): Promise<BikeSceneController> {
  const { canvas, trigger, signal } = options;
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  const focus = new Vector3();
  const corner = new Vector3();
  /** 解体段 SAMPLES + 1 个时刻的姿态，第 0 个即合体 */
  const poses: Pose[] = [];
  /** 合体时按网格包围盒量的整体范围：合体取景（BODY_FILL）与指针参照都以它为准 */
  const assembled = new Box3();
  const restFocus = new Vector3();
  const viewProjection = new Matrix4();
  /** 取景表：distances[i * 3 + j] 是第 i 个时刻、第 j 档俯仰需要的机位距离 */
  let distances = new Float32Array(0);
  /** 合体、默认俯仰时车身在画布上的投影（占画布宽高的比例），指针距离以它为准 */
  const body = { cx: 0.5, cy: 0.5, hw: 0.2, hh: 0.4 };
  let renderer: WebGLRenderer | undefined;
  let mixer: AnimationMixer | undefined;
  let action: AnimationAction | undefined;
  let model: Object3D | undefined;
  let observer: ResizeObserver | undefined;
  let distance = 1;
  let frame = 0;
  let previous = 0;
  let disposed = false;

  /** 当前值与目标值：progress 0 = 合体、1 = 完全解体 */
  let progress = 0;
  let targetProgress = 0;
  let elevation = BASE_ELEVATION;
  let targetElevation = BASE_ELEVATION;

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    signal.removeEventListener("abort", dispose);
    trigger.removeEventListener("pointermove", onPointerMove);
    trigger.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("webglcontextlost", lose);
    mixer?.stopAllAction();
    if (model) disposeResources(model);
    scene.environment?.dispose();
    renderer?.dispose();
    // 立即归还上下文：浏览器同时可用的 WebGL 上下文有限，首页也有 3D 场景，来回切页不能等 GC
    renderer?.forceContextLoss();
  }

  function lose() {
    dispose();
    options.onLost?.();
  }

  function placeCamera(pitch = elevation, target = focus) {
    if (target !== focus) focus.copy(target);
    camera.position.set(
      focus.x + distance * Math.cos(pitch) * Math.sin(AZIMUTH),
      focus.y + distance * Math.sin(pitch),
      focus.z + distance * Math.cos(pitch) * Math.cos(AZIMUTH),
    );
    camera.lookAt(focus);
    camera.updateMatrixWorld();
  }

  /** 包围盒 8 个角投影后在 NDC 上的最大偏移（横、纵向分别除以允许范围） */
  function extentOf(box: Box3, limitX: number, limitY: number) {
    let extent = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ).project(camera);
      extent = Math.max(extent, Math.abs(corner.x) / limitX, Math.abs(corner.y) / limitY);
    }
    return extent;
  }

  /** 一组世界坐标点投影后在 NDC 上的最大偏移（按 SAFE_X / SAFE_Y 归一）；直接用矩阵元素算，几十万个点也只要几毫秒 */
  function pointsExtent(points: Float32Array) {
    const e = viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).elements;
    let extent = 0;
    for (let k = 0; k < points.length; k += 3) {
      const x = points[k]!;
      const y = points[k + 1]!;
      const z = points[k + 2]!;
      const w = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!;
      const px = (e[0]! * x + e[4]! * y + e[8]! * z + e[12]!) / w;
      const py = (e[1]! * x + e[5]! * y + e[9]! * z + e[13]!) / w;
      extent = Math.max(extent, Math.abs(px) / SAFE_X, Math.abs(py) / SAFE_Y);
    }
    return extent;
  }

  /** 第 i 个时刻的对焦点：合体对焦点加上零件整体中心相对合体时的位移，合体那一刻与原取景完全一致 */
  function focusOf(i: number, target = new Vector3()) {
    return target.copy(restFocus).add(poses[i]!.center).sub(poses[0]!.center);
  }

  /**
   * 取景表。透视下投影尺寸与距离近似成反比，每个距离都是「给初值、投影、按超出比例缩放」迭代两轮：
   * - 合体距离：合体包围盒的投影正好占画布的 BODY_FILL，车身尽量大；
   * - 每个时刻、每档俯仰：所有零件的轮廓点完整落在 SAFE_X / SAFE_Y 内需要的距离，比合体距离近时仍用合体距离。
   * 画布尺寸变化时重算（约六十万次点投影，十几毫秒）。
   */
  function fit() {
    const halfV = MathUtils.degToRad(camera.fov / 2);
    const halfH = Math.atan(Math.tan(halfV) * camera.aspect);
    let rest = assembled.getSize(corner).length() / 2 / Math.sin(Math.min(halfV, halfH));
    for (let round = 0; round < 2; round++) {
      distance = rest;
      placeCamera(BASE_ELEVATION, restFocus);
      rest *= extentOf(assembled, BODY_FILL, BODY_FILL);
    }

    // 指针参照：合体、默认俯仰时车身的投影范围，换算成占画布的比例
    distance = rest;
    placeCamera(BASE_ELEVATION, restFocus);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < 8; i++) {
      corner.set(
        i & 1 ? assembled.max.x : assembled.min.x,
        i & 2 ? assembled.max.y : assembled.min.y,
        i & 4 ? assembled.max.z : assembled.min.z,
      ).project(camera);
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y);
      maxY = Math.max(maxY, corner.y);
    }
    body.cx = ((minX + maxX) / 2 + 1) / 2;
    body.cy = (1 - (minY + maxY) / 2) / 2;
    body.hw = (maxX - minX) / 4;
    body.hh = (maxY - minY) / 4;

    distances = new Float32Array(poses.length * PITCHES.length);
    poses.forEach((pose, i) => {
      PITCHES.forEach((pitch, j) => {
        let need = rest;
        for (let round = 0; round < 2; round++) {
          distance = need;
          placeCamera(pitch, focusOf(i));
          need *= pointsExtent(pose.points);
        }
        distances[i * PITCHES.length + j] = Math.max(rest, need);
      });
    });
  }

  /** 按当前进度与俯仰，从取景表插值出机位距离与对焦点（对焦点跟着零件整体中心走） */
  function interpolate() {
    const s = progress * SAMPLES;
    const i = Math.min(Math.floor(s), SAMPLES - 1);
    const f = s - i;
    const u = MathUtils.clamp((elevation - PITCHES[0]!) / ELEVATION_RANGE, 0, PITCHES.length - 1);
    const j = Math.min(Math.floor(u), PITCHES.length - 2);
    const g = u - j;
    const at = (row: number, column: number) => distances[row * PITCHES.length + column]!;
    distance = MathUtils.lerp(
      MathUtils.lerp(at(i, j), at(i, j + 1), g),
      MathUtils.lerp(at(i + 1, j), at(i + 1, j + 1), g),
      f,
    );
    focus.copy(restFocus).add(corner.lerpVectors(poses[i]!.center, poses[i + 1]!.center, f)).sub(poses[0]!.center);
  }

  function apply() {
    if (action && mixer) {
      action.time = progress * EXPLODE_END;
      mixer.update(0);
    }
    interpolate();
    placeCamera();
  }

  function render() {
    if (disposed || !renderer) return;
    apply();
    renderer.render(scene, camera);
  }

  function tick(now: number) {
    frame = 0;
    if (disposed) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 1 / 60;
    previous = now;
    const k = 1 - Math.exp(-DAMPING * delta);
    progress += (targetProgress - progress) * k;
    elevation += (targetElevation - elevation) * k;
    const settled = Math.abs(targetProgress - progress) < 1e-3 && Math.abs(targetElevation - elevation) < 1e-4;
    if (settled) {
      progress = targetProgress;
      elevation = targetElevation;
    }
    render();
    if (!settled) frame = requestAnimationFrame(tick);
    else previous = 0;
  }

  function wake() {
    if (!frame && !disposed) frame = requestAnimationFrame(tick);
  }

  /**
   * 指针到「本体」的椭圆距离：以合体、默认俯仰时车身投影的中心与半宽 / 半高为准。
   * 不用当前机位：解体时镜头拉远、车身变小，按当前投影算会让距离越解体越远、进度又往回退，来回拉扯。
   */
  function distanceTo(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    return Math.hypot(
      (clientX - rect.left - body.cx * rect.width) / (body.hw * rect.width),
      (clientY - rect.top - body.cy * rect.height) / (body.hh * rect.height),
    );
  }

  function onPointerMove(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    targetProgress = 1 - MathUtils.smoothstep(distanceTo(event.clientX, event.clientY), NEAR, FAR);
    const area = trigger.getBoundingClientRect();
    const vertical = MathUtils.clamp((event.clientY - area.top) / area.height, 0, 1) * 2 - 1;
    // 指针在上方时机位升高（俯视），在下方时降低（平视略仰）
    targetElevation = BASE_ELEVATION - vertical * ELEVATION_RANGE;
    wake();
  }

  function onPointerLeave() {
    targetProgress = 0;
    targetElevation = BASE_ELEVATION;
    wake();
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (disposed || !renderer || !width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit();
    render();
  }

  try {
    signal.throwIfAborted();
    signal.addEventListener("abort", dispose, { once: true });
    const url = resolveModelURL(BIKE_MODEL_PATH, options.baseURL);
    const data = await gunzipIfNeeded(await loadModelBuffer(url, signal));
    signal.throwIfAborted();
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(data, new URL(".", url).href);
    model = gltf.scene;
    // 解码不能中途取消：期间若已卸载，释放刚解出的资源后退出
    if (disposed) {
      disposeResources(model);
      signal.throwIfAborted();
      throw new Error("场景已销毁");
    }
    const clip = gltf.animations[0];
    if (!clip) throw new Error("自行车模型缺少解体动画");
    scene.add(model);
    mixer = new AnimationMixer(model);
    action = mixer.clipAction(clip);
    action.play();

    // 合体状态按网格包围盒量一次：定合体取景与指针参照
    action.time = 0;
    mixer.update(0);
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      if (object instanceof Mesh && !isShadow(object)) assembled.expandByObject(object, false);
    });
    assembled.getCenter(restFocus);
    // 解体段逐个时刻量零件轮廓点，供取景表使用；第 0 个时刻即合体
    const parts = pickParts(model);
    for (let i = 0; i <= SAMPLES; i++) {
      action.time = EXPLODE_END * i / SAMPLES;
      mixer.update(0);
      poses.push(measurePose(model, parts));
    }

    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = ACESFilmicToneMapping;
    const pmrem = new PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();

    observer = new ResizeObserver(resize);
    observer.observe(canvas);
    trigger.addEventListener("pointermove", onPointerMove, { passive: true });
    trigger.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("webglcontextlost", lose);
    resize();
    return { dispose };
  }
  catch (error) {
    dispose();
    throw error;
  }
}
