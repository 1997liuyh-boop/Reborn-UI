/**
 * 把 three.js 示例里的 CarbonFrameBike.glb（Draco + KTX2，3.4MB）压成组件总览头图用的版本：
 * public/models/bike/carbon-frame-bike.glb.gz（约 1.66MB，gzip 后约 0.97MB）。
 *
 * - KTX2(ETC1S) 用 three 自带的 basis 转码器解成 RGBA，缩到 512 并转 WebP：前端不再需要 basis 转码器（约 0.5MB wasm）
 * - 去掉全部 TANGENT（three 缺切线时用屏幕空间导数做法线贴图），无贴图材质的 TEXCOORD_0 一并去掉
 * - 焊接 + 轻度简化（误差 0.2%）+ 动画关键帧重采样
 * - Draco 换成 Meshopt（几何与动画一起压，位置 12 位量化）：解码器只有几十 KB
 * - 最后整体 gzip：生产环境的 Nitro 不预压 .glb（mime 不在可压缩名单里），浏览器端用 DecompressionStream 解开
 *
 * 处理依赖不进 package.json，在任意临时目录装好后执行（脚本从当前目录解析这些包）：
 *   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer draco3dgltf sharp
 *   node <仓库>/scripts/models/optimize-bike.mjs CarbonFrameBike.glb carbon-frame-bike.glb
 *   gzip -9 -k carbon-frame-bike.glb   → 拷到 public/models/bike/carbon-frame-bike.glb.gz
 *
 * 原始模型：https://github.com/mrdoob/three.js/blob/master/examples/models/gltf/CarbonFrameBike.glb
 * 授权 CC BY-SA 4.0，处理结果同样以 CC BY-SA 4.0 发布，见 public/models/bike/README.md。
 */
import { Buffer } from "node:buffer";
import { copyFileSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("用法：node optimize-bike.mjs <输入.glb> <输出.glb>");
  process.exit(1);
}

/** 处理参数：贴图边长、简化比例与误差、位置量化位数 */
const TEXTURE_SIZE = 512;
const SIMPLIFY_RATIO = 0.25;
const SIMPLIFY_ERROR = 0.002;
const POSITION_BITS = 12;

// 依赖从当前目录解析，仓库本身不安装这些包
const local = createRequire(path.join(process.cwd(), "noop.js"));
const load = name => import(pathToFileURL(local.resolve(name)).href);
const { NodeIO } = await load("@gltf-transform/core");
const { ALL_EXTENSIONS } = await load("@gltf-transform/extensions");
const { dedup, meshopt, prune, resample, simplify, textureCompress, weld } = await load("@gltf-transform/functions");
const { default: draco3d } = await load("draco3dgltf");
const { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } = await load("meshoptimizer");
const { default: sharp } = await load("sharp");

// three 的 basis 转码器是 CommonJS，但所在包声明了 type: module，复制成 .cjs 再加载
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const basisDir = path.join(repo, "node_modules/three/examples/jsm/libs/basis");
const basisCjs = path.join(os.tmpdir(), "basis_transcoder.cjs");
copyFileSync(path.join(basisDir, "basis_transcoder.js"), basisCjs);
const BASIS = createRequire(import.meta.url)(basisCjs);
const basis = await BASIS({ wasmBinary: readFileSync(path.join(basisDir, "basis_transcoder.wasm")) });
basis.initializeBasis();

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "meshopt.encoder": MeshoptEncoder,
  "meshopt.decoder": MeshoptDecoder,
});
const doc = await io.read(input);

// KTX2 → PNG（13 = RGBA32），之后由 textureCompress 缩放并转 WebP
for (const texture of doc.getRoot().listTextures()) {
  if (texture.getMimeType() !== "image/ktx2") continue;
  const ktx = new basis.KTX2File(new Uint8Array(texture.getImage()));
  if (!ktx.isValid() || !ktx.startTranscoding()) throw new Error("KTX2 转码失败");
  const width = ktx.getWidth();
  const height = ktx.getHeight();
  const pixels = new Uint8Array(ktx.getImageTranscodedSizeInBytes(0, 0, 0, 13));
  if (!ktx.transcodeImage(pixels, 0, 0, 0, 13, 0, -1, -1)) throw new Error("KTX2 转码失败");
  ktx.close();
  ktx.delete();
  const png = await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } }).png().toBuffer();
  texture.setImage(new Uint8Array(png)).setMimeType("image/png");
}
for (const extension of doc.getRoot().listExtensionsUsed()) {
  if (extension.extensionName === "KHR_texture_basisu" || extension.extensionName === "KHR_draco_mesh_compression") extension.dispose();
}

function hasTexture(material) {
  return !!material && !!(material.getBaseColorTexture() || material.getNormalTexture()
    || material.getMetallicRoughnessTexture() || material.getOcclusionTexture() || material.getEmissiveTexture());
}
for (const mesh of doc.getRoot().listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    primitive.setAttribute("TANGENT", null);
    if (!hasTexture(primitive.getMaterial())) primitive.setAttribute("TEXCOORD_0", null);
  }
}

await doc.transform(
  dedup(),
  prune(),
  resample(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: SIMPLIFY_RATIO, error: SIMPLIFY_ERROR }),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [TEXTURE_SIZE, TEXTURE_SIZE], quality: 82 }),
  meshopt({ encoder: MeshoptEncoder, level: "high", quantizePosition: POSITION_BITS, quantizeNormal: 8, quantizeTexcoord: 10 }),
);
await io.write(output, doc);
console.log(`已写出 ${output}：${(statSync(output).size / 1024 / 1024).toFixed(2)} MB`);
