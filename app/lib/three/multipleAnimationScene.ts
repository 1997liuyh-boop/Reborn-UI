import type { MeshPhongMaterial} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import {
  AnimationMixer, DetachedBindMode, DirectionalLight, Group, HemisphereLight,
  Matrix4, Mesh, PCFSoftShadowMap, PerspectiveCamera,
  PlaneGeometry, Scene, ShadowMaterial, SkinnedMesh, Texture, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { retargetingModels } from "../../components/common/landing/retargetingHero.config";

// 改编自 Three.js 官方 webgl_animation_multiple（MIT），复用本站 Soldier 资源。
export function prepareMultipleActors(model: GLTF, shared = false) {
  const root = new Group();
  const mixers: AnimationMixer[] = [];
  const clips = [0, 1, 3].map(index => model.animations[index]);
  if (clips.some(clip => !clip)) throw new Error("士兵模型缺少待机、跑步或行走动画。");
  if (shared) {
    const source = clone(model.scene);
    const skin = source.getObjectByName("vanguard_Mesh");
    const hips = source.getObjectByName("mixamorigHips");
    if (!(skin instanceof SkinnedMesh) || !hips) throw new Error("士兵模型缺少共享骨骼。");
    root.add(hips);
    for (const x of [-2, 0, 2]) {
      const actor = skin.clone();
      actor.bindMode = DetachedBindMode;
      actor.bind(skin.skeleton, new Matrix4());
      actor.position.x = x;
      actor.scale.setScalar(0.01);
      actor.rotation.x = -Math.PI / 2;
      root.add(actor);
    }
    const mixer = new AnimationMixer(hips);
    mixer.clipAction(clips[1]!).play();
    mixers.push(mixer);
  } else {
    for (const [index, x] of [-2, 0, 2].entries()) {
      const actor = clone(model.scene);
      actor.position.x = x;
      const mixer = new AnimationMixer(actor);
      mixer.clipAction(clips[index]!).play();
      root.add(actor);
      mixers.push(mixer);
    }
  }
  root.traverse((object) => { if (object instanceof Mesh) object.castShadow = true; });
  for (const mixer of mixers) mixer.update(0.5);
  root.updateMatrixWorld(true);
  function dispose() {
    for (const mixer of mixers) { mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
    const skeletons = new Set<SkinnedMesh["skeleton"]>();
    root.traverse((object) => { if (object instanceof SkinnedMesh) skeletons.add(object.skeleton); });
    for (const skeleton of skeletons) skeleton.dispose();
    // 克隆体共用几何体与材质，仅在整个场景销毁时释放原始资源。
    root.removeFromParent();
  }
  return { root, mixers, dispose };
}

export interface MultipleAnimationController {
  syncPlayback: () => void;
  setShared: (shared: boolean) => void;
  dispose: () => void;
}

function disposeResources(root: Group | Scene) {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<MeshPhongMaterial>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (object instanceof SkinnedMesh) object.skeleton.dispose();
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) texture.source.data.close();
  }
}

export async function createMultipleAnimationScene(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  isPaused: () => boolean,
  onError: (message: string) => void,
  options: { baseURL: string; shared: boolean },
): Promise<MultipleAnimationController> {
  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  const loading = new AbortController();
  let renderer: WebGLRenderer | undefined;
  let model: GLTF | undefined;
  let actors: ReturnType<typeof prepareMultipleActors> | undefined;
  let observer: ResizeObserver | undefined;
  let frame = 0;
  let previous = 0;
  let disposed = false;
  let stage = "多角色场景需要 WebGL2，请检查浏览器硬件加速。";
  const timeout = setTimeout(() => loading.abort(), 20000);

  function dispose() {
    if (disposed) return;
    disposed = true;
    loading.abort();
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    observer?.disconnect();
    signal.removeEventListener("abort", dispose);
    document.removeEventListener("visibilitychange", syncPlayback);
    canvas.removeEventListener("webglcontextlost", fail);
    actors?.dispose();
    if (model) disposeResources(model.scene);
    disposeResources(scene);
    scene.traverse((object) => { if (object instanceof DirectionalLight) object.shadow.dispose(); });
    renderer?.dispose();
  }
  function fail() {
    dispose();
    if (!signal.aborted) onError("多角色渲染已中断，请重新加载。");
  }
  function render() {
    if (disposed) return;
    try { renderer?.render(scene, camera); } catch { fail(); }
  }
  function animate(now: number) {
    if (disposed || isPaused() || document.hidden) return;
    frame = requestAnimationFrame(animate);
    if (now - previous < 1000 / 30) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    for (const mixer of actors?.mixers ?? []) mixer.update(delta);
    render();
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    previous = 0;
    if (!disposed && !isPaused() && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function setShared(shared: boolean) {
    if (disposed || !model) return;
    try {
      const next = prepareMultipleActors(model, shared);
      actors?.dispose();
      actors = next;
      scene.add(actors.root);
      render();
    } catch { fail(); }
  }
  function resize() {
    const parent = canvas.parentElement;
    if (disposed || !parent?.clientWidth || !parent.clientHeight) return;
    camera.aspect = parent.clientWidth / parent.clientHeight;
    // 扩大舞台并拉近镜头，桌面角色约为原尺寸两倍；窄屏仍按动作宽度避让裁切。
    const distance = Math.max(4, 6.6 / (2 * Math.tan(Math.PI / 9) * camera.aspect));
    camera.position.set(0.7, 1.8, -distance);
    camera.lookAt(0, 0.9, 0);
    camera.updateProjectionMatrix();
    renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer?.setSize(parent.clientWidth, parent.clientHeight, false);
    render();
  }

  try {
    signal.throwIfAborted();
    signal.addEventListener("abort", dispose, { once: true });
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0xFFFFFF, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    scene.add(new HemisphereLight(0xFFFFFF, 0x8D8D8D, 3));
    const light = new DirectionalLight(0xFFFFFF, 3);
    light.position.set(-3, 10, -10);
    light.castShadow = true;
    light.shadow.camera.far = 30;
    scene.add(light);
    // 放大后仅保留透明接影地面，避免白色平面遮挡右侧主舞台。
    const floor = new Mesh(new PlaneGeometry(200, 200), new ShadowMaterial({ opacity: 0.1, depthWrite: false }));
    floor.material.toneMapped = false;
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    stage = "多角色模型加载失败，请检查网络后重试。";
    const url = new URL(retargetingModels[1].slice(1), new URL(options.baseURL, window.location.origin));
    const response = await fetch(url, { signal: loading.signal });
    if (!response.ok) throw new Error(`模型请求失败：${response.status}`);
    const data = await response.arrayBuffer();
    loading.signal.throwIfAborted();
    model = await new GLTFLoader().parseAsync(data, new URL(".", url).href);
    // 解码无法取消，若期间切页，仍需释放刚完成的模型资源。
    if (disposed) { disposeResources(model.scene); signal.throwIfAborted(); throw new Error("场景已销毁"); }
    loading.signal.throwIfAborted();
    clearTimeout(timeout);
    stage = "多角色动画初始化失败，请重新加载。";
    actors = prepareMultipleActors(model, options.shared);
    scene.add(actors.root);
    observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    document.addEventListener("visibilitychange", syncPlayback);
    canvas.addEventListener("webglcontextlost", fail);
    resize();
    if (disposed) throw new Error("渲染器不可用");
    syncPlayback();
    return { syncPlayback, setShared, dispose };
  } catch (error) {
    dispose();
    throw new Error(stage, { cause: error });
  }
}


