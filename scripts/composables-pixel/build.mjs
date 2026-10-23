/**
 * 生成文档站「组合式函数」一节的像素风背景素材 public/images/composables/throne-pixel.png。
 *
 * 流程：source.png（512×341）先修补右下角的平台水印（白字及其描边按周围像素逐圈扩散填平）→
 * 从四条边泛洪，与边缘连通的近白像素记为背景（被描线包住的白裙、对话框内部不受影响）→
 * 按 4×4 降到 128×85 像素格：非背景像素过半的格子保留，颜色取其中非背景像素的平均，避免边缘被白底冲淡 →
 * 每通道按 32 级量化，得到像素画的色块感。
 * 产物每个像素就是一个像素点，运行时由 DocsPixelBackground 读出来做下落拼合动画。
 *
 * 执行：
 *   node scripts/composables-pixel/build.mjs              生成正式素材
 *   node scripts/composables-pixel/build.mjs --preview    另在系统临时目录输出放大 7 倍的浅底 / 深底预览图，核对用
 *
 * 依赖：playwright-core 启动的 Chromium（借它的 canvas 读写像素）。
 */
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = path.join(ROOT, "scripts/composables-pixel/source.png");
const OUTPUT = path.join(ROOT, "public/images/composables/throne-pixel.png");
const wantPreview = process.argv.includes("--preview");

const options = {
  /** 每个像素格对应原图的边长（px） */
  cell: 4,
  /** 近白判定：三通道最小值高于它、且通道差小于 bgSat 才算背景 */
  bgMin: 222,
  bgSat: 30,
  /** 一格 16 个原像素里，至少这么多非背景像素才保留 */
  cover: 8,
  /** 色阶量化步长 */
  step: 32,
  /** 水印所在框（原图坐标，含边界）：[x0, y0, x1, y1] */
  watermark: [399, 306, 503, 331],
};

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const src = `data:image/png;base64,${(await readFile(SOURCE)).toString("base64")}`;
  const out = await page.evaluate(async ({ src, options }) => {
    const { cell, bgMin, bgSat, cover, step, watermark } = options;
    const img = new Image();
    img.src = src;
    await img.decode();
    const W = img.width;
    const H = img.height;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0);
    const d = context.getImageData(0, 0, W, H).data;

    // 1) 水印修补：框内亮且不饱和的像素（白字、浅灰投影）连同外扩一圈记为待补，
    //    每一轮用已知邻居的平均值填掉最外一圈，直到填满
    const [wx0, wy0, wx1, wy1] = watermark;
    const hole = new Uint8Array(W * H);
    for (let y = wy0; y <= wy1; y++) {
      for (let x = wx0; x <= wx1; x++) {
        const i = (y * W + x) * 4;
        const min = Math.min(d[i], d[i + 1], d[i + 2]);
        const max = Math.max(d[i], d[i + 1], d[i + 2]);
        if (min > 140 && max - min < 45) hole[y * W + x] = 1;
      }
    }
    const pending = hole.slice();
    for (let y = wy0; y <= wy1; y++) {
      for (let x = wx0; x <= wx1; x++) {
        if (!hole[y * W + x]) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) pending[(y + dy) * W + x + dx] = 1;
        }
      }
    }
    for (;;) {
      const fills = [];
      for (let y = wy0 - 1; y <= wy1 + 1; y++) {
        for (let x = wx0 - 1; x <= wx1 + 1; x++) {
          if (!pending[y * W + x]) continue;
          let r = 0;
          let g = 0;
          let b = 0;
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const j = (y + dy) * W + x + dx;
              if (pending[j]) continue;
              r += d[j * 4];
              g += d[j * 4 + 1];
              b += d[j * 4 + 2];
              n++;
            }
          }
          if (n) fills.push([y * W + x, r / n, g / n, b / n]);
        }
      }
      if (!fills.length) break;
      for (const [j, r, g, b] of fills) {
        d[j * 4] = r;
        d[j * 4 + 1] = g;
        d[j * 4 + 2] = b;
        pending[j] = 0;
      }
    }

    // 2) 背景：从四条边泛洪，只有与边缘连通的近白像素才算背景
    const nearWhite = (i) => {
      const min = Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      const max = Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
      return min > bgMin && max - min < bgSat;
    };
    const background = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
    for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
    while (stack.length) {
      const i = stack.pop();
      if (background[i] || !nearWhite(i)) continue;
      background[i] = 1;
      const x = i % W;
      const y = (i - x) / W;
      if (x > 0) stack.push(i - 1);
      if (x < W - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - W);
      if (y < H - 1) stack.push(i + W);
    }

    // 3) 降采样 + 量化
    const GW = Math.floor(W / cell);
    const GH = Math.floor(H / cell);
    const output = new ImageData(GW, GH);
    let opaque = 0;
    const colors = new Set();
    for (let gy = 0; gy < GH; gy++) {
      for (let gx = 0; gx < GW; gx++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let yy = 0; yy < cell; yy++) {
          for (let xx = 0; xx < cell; xx++) {
            const i = (gy * cell + yy) * W + gx * cell + xx;
            if (background[i]) continue;
            r += d[i * 4];
            g += d[i * 4 + 1];
            b += d[i * 4 + 2];
            n++;
          }
        }
        if (n < cover) continue;
        const level = v => Math.min(255, Math.round(v / n / step) * step);
        const rgb = [level(r), level(g), level(b)];
        output.data.set([...rgb, 255], (gy * GW + gx) * 4);
        opaque++;
        colors.add(rgb.join());
      }
    }
    const result = document.createElement("canvas");
    result.width = GW;
    result.height = GH;
    result.getContext("2d").putImageData(output, 0, 0);

    // 预览：上半浅底、下半深底，各放大 7 倍
    const K = 7;
    const preview = document.createElement("canvas");
    preview.width = GW * K;
    preview.height = GH * K * 2;
    const pc = preview.getContext("2d");
    pc.imageSmoothingEnabled = false;
    pc.fillStyle = "#e9ebf0";
    pc.fillRect(0, 0, preview.width, GH * K);
    pc.fillStyle = "#17171a";
    pc.fillRect(0, GH * K, preview.width, GH * K);
    pc.drawImage(result, 0, 0, GW * K, GH * K);
    pc.drawImage(result, 0, GH * K, GW * K, GH * K);

    return { png: result.toDataURL("image/png"), preview: preview.toDataURL("image/png"), width: GW, height: GH, opaque, colors: colors.size };
  }, { src, options });

  await writeFile(OUTPUT, Buffer.from(out.png.split(",")[1], "base64"));
  console.log(`已生成 ${path.relative(ROOT, OUTPUT)}：${out.width}×${out.height}，${out.opaque} 个像素点，${out.colors} 种颜色`);
  if (wantPreview) {
    const previewPath = path.join(os.tmpdir(), "throne-pixel-preview.png");
    await writeFile(previewPath, Buffer.from(out.preview.split(",")[1], "base64"));
    console.log(`预览图：${previewPath}`);
  }
}
finally {
  await browser.close();
}
