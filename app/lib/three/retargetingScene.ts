import type { Object3D } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
// 下面这组 import 的顺序有语义，整组关掉排序规则：
// ./webgpuGlobals 必须排在 three/webgpu 之前 —— three 0.182 在模块顶层读
// self.GPUShaderStage.VERTEX，非安全上下文（http）下会直接抛 TypeError，详见 webgpuGlobals.ts。
// 只在单行上 disable 没用：perfectionist 会把错误报到下一条 import 上，逐行打补丁打不完。
/* eslint-disable perfectionist/sort-imports */
import "./webgpuGlobals";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { retargetClip } from "three/addons/utils/SkeletonUtils.js";
import { color, mix, reflector } from "three/tsl";
import {
  AnimationMixer, BoxGeometry, Color, DirectionalLight, Euler, Group,
  HemisphereLight, Matrix4, Mesh, MeshStandardNodeMaterial, NeutralToneMapping,
  PerspectiveCamera, Scene, Skeleton, SkeletonHelper, SkinnedMesh, Texture, WebGPURenderer,
} from "three/webgpu";
import { retargetingModels } from "../../components/common/landing/retargetingHero.config";
/* eslint-enable perfectionist/sort-imports */

export interface RetargetingController {
  syncPlayback: () => void;
  dispose: () => void;
}

// 基于 Three.js 官方动画重定向示例（MIT），骨骼映射与姿态补偿保持一致。
export function createRetargetOptions() {
  const clockwise45 = new Matrix4().makeRotationY(Math.PI / 4);
  const counter180 = new Matrix4().makeRotationY(-Math.PI);
  const clockwise180 = new Matrix4().makeRotationY(Math.PI);
  const foot = new Matrix4().makeRotationFromEuler(new Euler(Math.PI / 4, Math.PI, 0));
  const names: Record<string, string> = {};
  const localOffsets: Record<string, Matrix4> = {};
  for (const name of ["Hips", "Spine", "Spine2", "Head"]) names[`mixamorig${name}`] = `mixamorig${name}`;
  for (const side of ["Left", "Right"]) {
    for (const part of ["Shoulder", "Arm", "ForeArm", "Hand", "UpLeg", "Leg", "Foot", "ToeBase"]) {
      const name = `mixamorig${side}${part}`;
      names[name] = name;
      localOffsets[name] = ["Shoulder", "Arm", "ForeArm", "Hand"].includes(part)
        ? side === "Left" ? clockwise45 : counter180
        : part === "Foot" ? foot : clockwise180;
    }
  }
  return { hip: "mixamorigHips", scale: 100, names, localOffsets, fps: 30 };
}

export function prepareRetargetedActors(source: GLTF, target: GLTF) {
  const clip = source.animations[0];
  if (!clip) throw new Error("源角色缺少动画");
  const helper = new SkeletonHelper(source.scene);
  const skeleton = new Skeleton(helper.bones);
  helper.geometry.dispose();
  for (const material of Array.isArray(helper.material) ? helper.material : [helper.material]) material.dispose();
  let targetSkin: SkinnedMesh | undefined;
  target.scene.traverse((object) => { if (!targetSkin && object instanceof SkinnedMesh) targetSkin = object; });
  if (!targetSkin) throw new Error("目标角色缺少蒙皮骨骼");
  const targetClip = retargetClip(targetSkin, skeleton, clip, createRetargetOptions());
  skeleton.dispose();
  // 先在导入姿态下烘焙，再施加舞台变换，避免父级缩放被重复计入骨骼。
  source.scene.position.x = -0.8;
  target.scene.position.set(0.7, 0, -0.1);
  target.scene.scale.setScalar(0.01);
  source.scene.rotation.y = Math.PI / 2;
  target.scene.rotation.y = -Math.PI / 2;
  // 重定向轨道直接绑定蒙皮网格，不能绑定外层场景节点。
  const sourceMixer = new AnimationMixer(source.scene);
  const targetMixer = new AnimationMixer(targetSkin);
  sourceMixer.clipAction(clip).play();
  targetMixer.clipAction(targetClip).play();
  const mixers = [sourceMixer, targetMixer];
  for (const mixer of mixers) mixer.update(0.5);
  return mixers;
}

function disposeObject(root: Object3D) {
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
      material.dispose();
    }
  });
  for (const texture of textures) {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) texture.source.data.close();
  }
}

export async function createRetargetingScene(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  isPaused: () => boolean,
  onError: (message: string) => void,
  options: { compatibility?: boolean; baseURL?: string } = {},
): Promise<RetargetingController> {
  const scene = new Scene();
  const renderer = new WebGPURenderer({ canvas, antialias: true, alpha: true, forceWebGL: options.compatibility ?? false });
  const camera = new PerspectiveCamera(40, 1, 0.1, 60);
  const mixers: AnimationMixer[] = [];
  const group = new Group();
  const loader = new GLTFLoader();
  const loading = new AbortController();
  let loadTimer: ReturnType<typeof setTimeout> | undefined;
  let retryWithWebGL = true;
  let stage = "无法初始化图形渲染器，请尝试兼容模式或检查浏览器硬件加速。";
  let disposed = false;
  let frame = 0;
  let previousTime = 0;
  let initialized = false;
  let observer: ResizeObserver | undefined;
  let reflection: ReturnType<typeof reflector> | undefined;
  let pointerX = 0;
  let pointerY = 0;
  let mobile = false;
  scene.add(group);

  function dispose() {
    if (disposed) return;
    disposed = true;
    loading.abort();
    clearTimeout(loadTimer);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    document.removeEventListener("visibilitychange", syncPlayback);
    window.removeEventListener("pointermove", moveCamera);
    canvas.removeEventListener("webglcontextlost", fail);
    signal.removeEventListener("abort", dispose);
    for (const mixer of mixers) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
    disposeObject(scene);
    reflection?.dispose();
    if (initialized) renderer.dispose();
  }
  function fail() { dispose(); if (!signal.aborted) onError("图形渲染已中断，请重新加载或使用兼容模式。"); }
  function render() {
    try { renderer.render(scene, camera); }
    catch { fail(); }
  }
  function animate(now: number) {
    if (disposed || isPaused() || document.hidden) { frame = 0; return; }
    frame = requestAnimationFrame(animate);
    if (now - previousTime < 1000 / 30) return;
    const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    for (const mixer of mixers) mixer.update(delta);
    camera.position.x += (pointerX * 0.18 - camera.position.x) * 0.06;
    camera.position.y += ((mobile ? 1.5 : 1.6) + pointerY * 0.08 - camera.position.y) * 0.06;
    camera.lookAt(mobile ? 0 : -0.45, mobile ? -0.5 : 0.65, 0);
    render();
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (!disposed && !isPaused() && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function moveCamera(event: PointerEvent) {
    if (event.pointerType !== "mouse" || isPaused()) return;
    pointerX = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
    pointerY = event.clientY / Math.max(window.innerHeight, 1) * 2 - 1;
  }
  function resize() {
    if (disposed) return;
    const parent = canvas.parentElement!;
    const rect = { width: parent.clientWidth, height: parent.clientHeight };
    if (!rect.width || !rect.height) return;
    mobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    // 按画幅预留双角色动作宽度，避免窄屏或张开手臂时裁切。
    const distance = Math.max(6.4, (mobile ? 3.4 : 4.2) / (2 * Math.tan(Math.PI / 9) * camera.aspect));
    camera.position.set(0, mobile ? 1.5 : 1.6, distance);
    camera.lookAt(mobile ? 0 : -0.45, mobile ? -0.5 : 0.65, 0);
    camera.updateProjectionMatrix();
    render();
  }

  try {
    signal.throwIfAborted();
    await renderer.init();
    initialized = true;
    signal.throwIfAborted();
    signal.addEventListener("abort", dispose, { once: true });
    renderer.toneMapping = NeutralToneMapping;
    renderer.onDeviceLost = () => { if (!disposed) fail(); };
    // 保留角色与反射地板，以白色摄影棚衔接首页留白。
    renderer.setClearColor(0xFFFFFF, 0);
    scene.add(new HemisphereLight(0xFFFFFF, 0xA3A7AD, 3));
    const keyLight = new DirectionalLight(0xFFF9EA, 4);
    keyLight.position.set(2, 5, 2);
    scene.add(keyLight);
    const rimLight = new DirectionalLight(0xE6EDFF, 2);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // 使用可取消的本地请求；部分加载失败或切页时也释放已解码资源。
    // 不依赖较新的 AbortSignal.any/timeout，兼容旧版移动浏览器。
    retryWithWebGL = false;
    stage = "角色模型加载失败，请检查网络及 /models/retargeting/ 资源是否已部署。";
    loadTimer = setTimeout(() => loading.abort(), 20000);
    const models = await Promise.allSettled(retargetingModels.map(async (url) => {
      const response = await fetch(new URL(url.slice(1), new URL(options.baseURL ?? "/", window.location.origin)), { signal: loading.signal });
      if (!response.ok) throw new Error(`模型加载失败：${response.status}`);
      const model = await loader.parseAsync(await response.arrayBuffer(), "");
      if (disposed || signal.aborted) { disposeObject(model.scene); throw new Error("场景已卸载"); }
      group.add(model.scene);
      return model;
    }));
    clearTimeout(loadTimer);
    signal.throwIfAborted();
    const [sourceResult, targetResult] = models;
    if (sourceResult?.status !== "fulfilled" || targetResult?.status !== "fulfilled") throw new Error("角色资源不可用");
    stage = "角色动画准备失败，请重新加载。";
    const source = sourceResult.value;
    const target = targetResult.value;
    mixers.push(...prepareRetargetedActors(source, target));

    reflection = reflector({ resolutionScale: 0.5 });
    reflection.target.rotateX(-Math.PI / 2);
    scene.add(reflection.target);
    const floor = new Mesh(new BoxGeometry(50, 0.001, 50), new MeshStandardNodeMaterial({
      color: new Color(0xFFFFFF), roughness: 0.4, metalness: 0.15,
    }));
    floor.material.toneMapped = false;
    floor.material.colorNode = mix(color(0xFFFFFF), reflection, 0.14);
    scene.add(floor);
    retryWithWebGL = true;
    stage = "图形渲染失败，请尝试兼容模式或启用浏览器硬件加速。";
    observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    document.addEventListener("visibilitychange", syncPlayback);
    window.addEventListener("pointermove", moveCamera, { passive: true });
    canvas.addEventListener("webglcontextlost", fail);
    resize();
    if (disposed) throw new Error("渲染器不可用");
    syncPlayback();
    return { syncPlayback, dispose };
  } catch (error) {
    dispose();
    if (signal.aborted) throw error;
    throw Object.assign(new Error(stage, { cause: error }), { retryWithWebGL });
  }
}
