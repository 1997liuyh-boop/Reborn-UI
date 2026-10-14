/**
 * 由角色模型渲染 reborn-depth-image 所需的一对素材：彩色图（透明背景）与深度图（白近黑远）。
 *
 * 两张图出自同一姿势、同一机位，像素严格对齐；深度不是估算出来的，而是直接读模型的几何深度，
 * 所以视差位移时脸、手臂、躯干的前后关系是准的。
 *
 * 执行：
 *   node scripts/depth-image/render-model.mjs --preview          按时间轴出几帧候选姿势的缩略图，挑帧用
 *   node scripts/depth-image/render-model.mjs --preview --from=1.5 --to=3.2   只在这一段时间里细挑
 *   node scripts/depth-image/render-model.mjs --time=1.2         按指定时间（秒）渲染正式素材
 *
 * 换角色：--model=Soldier（public/models/retargeting/ 下的文件名，不带扩展名），输出名随之变为 soldier.webp；
 * --clip=Idle 按名称选动画（默认取模型里的第一段），--preview 时会列出模型里全部动画名。
 * --yaw=180 让模型绕竖轴转过指定角度：Soldier 这类朝 -Z 建模的角色默认背对机位，要转半圈才是正面。
 *
 * 依赖：本机安装的 Chrome（经 playwright-core 以 channel "chrome" 启动，借它的 WebGL 渲染）与 sharp。
 * 模型与授权说明见 public/models/retargeting/README.md：模型来自 Mixamo，渲染结果同样只用于本站演示，不进 registry。
 */
import { Buffer } from "node:buffer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import sharp from "sharp";

const root = process.cwd();
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

/** 素材与模型 */
const MODEL_NAME = args.model ?? "Michelle";
const MODEL = `/models/retargeting/${MODEL_NAME}.glb`;
const OUT_DIR = path.join(root, "public/images/depth-image");
const OUT_NAME = MODEL_NAME.toLowerCase();

/**
 * 输出尺寸：宽高比 6:7，与头图右侧「贴底站立」的人物区比例接近。
 * 深度图只取 1/3 分辨率：视差只需要大块的前后关系，细节反而会让边缘采样抖动。
 */
const WIDTH = 720;
const HEIGHT = 840;
const DEPTH_SCALE = 3;

/** 画面纵向只取头顶到大腿中部，人物贴底站立时下半身被头图底边裁掉，与参考站的半身构图一致 */
const CROP_BOTTOM = 0.42;

/** 静态服务：只开放 three 与模型目录，页面本身内联在下方 */
const MIME = { ".js": "text/javascript", ".glb": "model/gltf-binary", ".html": "text/html" };
const ROUTES = [
  ["/three/", path.join(root, "node_modules/three/")],
  ["/models/", path.join(root, "public/models/")],
];

const PAGE = `<!doctype html>
<html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// 摄影棚布光：天空光打底，左前上方主光，右后方轮廓光勾出边缘
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 2.4));
const key = new THREE.DirectionalLight(0xffffff, 2.6);
key.position.set(-2, 3, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 2.2);
rim.position.set(3, 2.5, -3);
scene.add(rim);

// 模型经 meshopt 压缩几何与动画，解析前必须挂上解码器（与首页 retargetingScene 一致）
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(${JSON.stringify(MODEL)});
const model = gltf.scene;
model.rotation.y = THREE.MathUtils.degToRad(${Number(args.yaw ?? 0)});
scene.add(model);
const mixer = new THREE.AnimationMixer(model);
// 按名称选动画，找不到时退回第一段
const clip = gltf.animations.find(item => item.name === ${JSON.stringify(args.clip ?? "")}) ?? gltf.animations[0];
mixer.clipAction(clip).play();

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
// 深度用 MeshDepthMaterial：内置材质自带蒙皮，摆好的姿势在深度通道里同样生效
const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.BasicDepthPacking });

/** 摆到指定时间的姿势，按包围盒取景，返回彩色与深度两张 PNG */
window.renderPose = (time, width, height, cropBottom) => {
  mixer.setTime(time);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // 取景范围：头顶留一点余量，底部裁到 cropBottom 处
  const top = box.max.y + size.y * 0.03;
  const bottom = box.min.y + size.y * cropBottom;
  const frameHeight = top - bottom;
  camera.aspect = width / height;
  const distance = frameHeight / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // 略偏右侧的四分之三视角，比正面多一点体积感
  const target = new THREE.Vector3(center.x, (top + bottom) / 2, center.z);
  camera.position.set(target.x + distance * 0.32, target.y + frameHeight * 0.06, target.z + distance * 0.95);
  camera.lookAt(target);
  // 近远平面贴着模型取，深度精度全部花在人物身上
  const radius = size.length() / 2;
  const toCenter = camera.position.distanceTo(center);
  camera.near = Math.max(0.01, toCenter - radius);
  camera.far = toCenter + radius;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  scene.overrideMaterial = null;
  renderer.render(scene, camera);
  const color = renderer.domElement.toDataURL("image/png");

  renderer.setClearColor(0x000000, 0);
  scene.overrideMaterial = depthMaterial;
  const toneMapping = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.render(scene, camera);
  renderer.toneMapping = toneMapping;
  const depth = renderer.domElement.toDataURL("image/png");
  scene.overrideMaterial = null;
  return { color, depth };
};
window.clipInfo = { name: clip.name, duration: clip.duration, all: gltf.animations.map(item => item.name) };
window.ready = true;
</script></body></html>`;

function serve() {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    if (url === "/") {
      res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
      return;
    }
    const route = ROUTES.find(([prefix]) => url.startsWith(prefix));
    if (!route) {
      res.writeHead(404).end();
      return;
    }
    const file = path.join(route[1], url.slice(route[0].length));
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" }).end(body);
    }
    catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const fromDataURL = (url) => Buffer.from(url.slice(url.indexOf(",") + 1), "base64");

/**
 * 轮廓外延展的像素数（按 WIDTH 宽的原图计）：须大于组件最大位移换算到原图上的像素数，否则人物移出轮廓的部分会被裁掉。
 * 头图里人物显示宽约 270px，默认 parallax 12px 约合原图 32px，留余量取 40
 */
const EDGE_GROW = 40;

/**
 * 深度图后处理：
 * 1. 轮廓内的深度拉伸到 0.2~1 区间，让视差幅度只取决于组件参数，而不是取景远近；
 * 2. 把轮廓内的深度向外延展 EDGE_GROW 像素，每轮让紧邻轮廓的背景像素取已填充邻居的平均值。
 *    不延展的话，视差位移时轮廓外侧会采到「最远」的背景深度，边缘出现撕裂与残影。
 *    这里不用 sharp 的 dilate：它是二值形态学运算，套在灰度图上会把人物轮廓侵蚀掉；
 * 3. 延展带以外的背景取中灰（0.5），与组件默认 focus 相同：背景不位移，人物移开后露出的地方保持透明。
 *    若背景取纯黑（最远），视差时轮廓一侧的背景会反向位移、采到人物本身，形成残影；
 * 4. 高斯模糊抹平延展带与中灰背景之间的台阶，再缩到 1/DEPTH_SCALE。
 */
async function processDepth(depthPng, colorPng, width, height) {
  const depth = await sharp(depthPng).ensureAlpha().raw().toBuffer();
  const color = await sharp(colorPng).ensureAlpha().raw().toBuffer();
  const count = width * height;
  const value = new Float32Array(count);
  const filled = new Uint8Array(count);
  let min = 255;
  let max = 0;
  for (let i = 0; i < count; i++) {
    if (color[i * 4 + 3] < 8) continue;
    min = Math.min(min, depth[i * 4]);
    max = Math.max(max, depth[i * 4]);
  }
  const span = Math.max(1, max - min);
  for (let i = 0; i < count; i++) {
    if (color[i * 4 + 3] < 8) continue;
    value[i] = 51 + ((depth[i * 4] - min) / span) * 204;
    filled[i] = 1;
  }

  for (let round = 0; round < EDGE_GROW; round++) {
    const next = filled.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (filled[i]) continue;
        let sum = 0;
        let hits = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const j = ny * width + nx;
            if (filled[j]) {
              sum += value[j];
              hits++;
            }
          }
        }
        if (hits) {
          value[i] = sum / hits;
          next[i] = 1;
        }
      }
    }
    filled.set(next);
  }

  const gray = Buffer.alloc(count);
  for (let i = 0; i < count; i++) gray[i] = filled[i] ? Math.round(value[i]) : 128;
  return sharp(gray, { raw: { width, height, channels: 1 } })
    .blur(6)
    .resize(Math.round(width / DEPTH_SCALE), Math.round(height / DEPTH_SCALE))
    .webp({ quality: 92 })
    .toBuffer();
}

const server = await serve();
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage();
  // 页面里的报错直接转到终端：模型加载或 WebGL 初始化失败时，不至于只看到一个超时
  page.on("pageerror", error => console.error("[页面错误]", error.message));
  page.on("console", (message) => {
    if (message.type() === "error") console.error("[页面控制台]", message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60_000 });
  const clip = await page.evaluate(() => window.clipInfo);
  await mkdir(OUT_DIR, { recursive: true });

  if (args.preview) {
    // 均匀取 8 帧拼成一张缩略图，左上角标注时间，挑好后用 --time 正式渲染
    const frames = 8;
    const thumbW = 180;
    const thumbH = 210;
    const tiles = [];
    for (let i = 0; i < frames; i++) {
      // 默认铺满整段动画；传 --from / --to（秒）时只在这一段里细挑
      const from = Number(args.from ?? 0);
      const to = Number(args.to ?? clip.duration);
      const time = Number((from + ((to - from) * i) / frames).toFixed(2));
      const { color } = await page.evaluate(([t, w, h, c]) => window.renderPose(t, w, h, c), [time, thumbW, thumbH, CROP_BOTTOM]);
      const label = Buffer.from(`<svg width="${thumbW}" height="24"><text x="6" y="17" font-size="14" font-family="sans-serif">${time}s</text></svg>`);
      const tile = await sharp({ create: { width: thumbW, height: thumbH, channels: 4, background: "#f2f3f5" } })
        .composite([{ input: fromDataURL(color) }, { input: label, top: 0, left: 0 }])
        .png()
        .toBuffer();
      tiles.push({ input: tile, left: (i % 4) * thumbW, top: Math.floor(i / 4) * thumbH });
    }
    const sheet = path.join(OUT_DIR, "preview.png");
    await sharp({ create: { width: thumbW * 4, height: thumbH * 2, channels: 4, background: "#ffffff" } })
      .composite(tiles)
      .png()
      .toFile(sheet);
    console.log(`模型 ${MODEL_NAME} 的动画：${clip.all.join(" / ")}`);
    console.log(`动画「${clip.name}」时长 ${clip.duration.toFixed(2)}s，候选帧已输出：${sheet}`);
  }
  else {
    const time = Number(args.time ?? 0);
    const { color, depth } = await page.evaluate(([t, w, h, c]) => window.renderPose(t, w, h, c), [time, WIDTH, HEIGHT, CROP_BOTTOM]);
    const colorPng = fromDataURL(color);
    const colorFile = path.join(OUT_DIR, `${OUT_NAME}.webp`);
    const depthFile = path.join(OUT_DIR, `${OUT_NAME}-depth.webp`);
    await writeFile(colorFile, await sharp(colorPng).webp({ quality: 90, alphaQuality: 100 }).toBuffer());
    await writeFile(depthFile, await processDepth(fromDataURL(depth), colorPng, WIDTH, HEIGHT));
    console.log(`已按 ${time}s 的姿势输出：\n  ${colorFile}\n  ${depthFile}`);
  }
}
finally {
  await browser.close();
  server.close();
}
