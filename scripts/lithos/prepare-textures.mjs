import { Buffer } from "node:buffer";
import sharp from "sharp";

// 用同一组岩石的颜色和法线纹理制作对齐的双层素材，避免显影时地形跳变。
const root = "public/images/lithos/";
const width = 2048;
const load = async (name) =>
  sharp(root + name)
    .resize(width, width)
    .removeAlpha()
    .raw()
    .toBuffer();
const [rock, normal, moss, flowers] = await Promise.all(
  ["rock-source.jpg", "rock-normal.jpg", "moss-source.jpg", "yellow-flowers.jpg"].map(load),
);
const base = Buffer.alloc(width * width * 3);
const living = Buffer.alloc(base.length);
for (let y = 0; y < width; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    const nx = normal[i] / 127.5 - 1;
    const ny = normal[i + 1] / 127.5 - 1;
    const nz = normal[i + 2] / 127.5 - 1;
    const gray = (rock[i] + rock[i + 1] + rock[i + 2]) / 3;
    const light = Math.max(0, nx * -0.6 + ny * 0.5 + nz * 0.35);
    const hot = Math.max(0, nx * 0.82 - ny * 0.6 - 0.13)**1.5;
    const ambient = gray * (0.22 + light * 0.62);
    const glow = hot * 390;
    base[i] = Math.min(255, ambient * 0.83 + glow);
    base[i + 1] = Math.min(255, ambient * 0.9 + glow * 0.19);
    base[i + 2] = Math.min(255, ambient + glow * 0.025);
    const green = Math.max(0, moss[i + 1] - moss[i] * 0.83) / 55;
    const growth = Math.min(0.86, 0.28 + green * 0.5);
    const bloom =
      flowers[i] > flowers[i + 1] * 1.15 && flowers[i + 1] > flowers[i + 2] * 2.3 && flowers[i] > 100;
    for (let c = 0; c < 3; c++) {
      const stone = gray * (0.42 + light * 0.7);
      const plant = moss[i + c] * (0.7 + light * 0.8) * [0.62, 1.5, 0.58][c];
      living[i + c] = Math.min(
        255,
        bloom ? flowers[i + c] * 1.7 : stone * (1 - growth) + plant * growth,
      );
    }
  }
}
for (const [name, pixels] of [
  ["strata.webp", base],
  ["living-strata.webp", living],
]) {
  await sharp(pixels, { raw: { width, height: width, channels: 3 } })
    .rotate(-24, { background: "#101113" })
    .resize(2400, 1600, { fit: "cover" })
    .webp({ quality: 88 })
    .toFile(root + name);
}
console.log("岩层双图已写入");


