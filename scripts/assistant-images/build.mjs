/**
 * 生成 Ask AI 抽屉用到的两张图，输出到 public/images/assistant/：
 *
 * - thinking-pixel.png：聊天区的像素风背景。原图 thinking-source.webp（500×512）先去掉米白底，
 *   再按 8×8 降到 62×64 像素格：非背景像素过半的格子保留，颜色取其中非背景像素的平均，每通道按 32 级量化。
 *   页面上用 image-rendering: pixelated 放大，一格就是一个像素块。
 * - avatar.webp：AI 回答的头像。从 avatar-source.png（375×512 全身立绘）去掉白底，
 *   截取头部所在的正方形，缩放到 128×128（显示 28px，高分屏下也够清晰）。
 *
 * 去底都用同一种做法：从四条边泛洪，与边缘连通的近白像素记为背景，
 * 被描线包住的白色（头饰、衬衫、对话气泡、牛头骨）不受影响。
 *
 * 执行：
 *   node scripts/assistant-images/build.mjs              生成正式素材
 *   node scripts/assistant-images/build.mjs --preview    另在系统临时目录输出浅底 / 深底预览图，核对用
 *
 * 依赖：playwright-core 启动的 Chromium（借它的 canvas 解码、读写像素并编码输出）。
 */
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = path.join(ROOT, "scripts/assistant-images");
const OUT_DIR = path.join(ROOT, "public/images/assistant");
const wantPreview = process.argv.includes("--preview");

const options = {
  thinking: {
    /** 近白判定：三通道最小值高于它、且通道差小于 bgSat 才算背景 */
    bgMin: 205,
    bgSat: 28,
    /** 每个像素格对应原图的边长（px） */
    cell: 8,
    /** 色阶量化步长 */
    step: 32,
  },
  avatar: {
    bgMin: 230,
    bgSat: 24,
    /** 头部所在的正方形（原图坐标）：左、上、边长 */
    crop: [65, 70, 220],
    /** 输出边长（px） */
    size: 128,
    quality: 0.9,
  },
};

const toDataUrl = async (file, mime) => `data:${mime};base64,${(await readFile(path.join(DIR, file))).toString("base64")}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const out = await page.evaluate(async ({ thinkingSrc, avatarSrc, options }) => {
    /** 解码图片并读出像素 */
    async function load(src) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d");
      context.drawImage(img, 0, 0);
      return { canvas, context, image: context.getImageData(0, 0, img.width, img.height), W: img.width, H: img.height };
    }

    /** 从四条边泛洪，返回背景掩码（1 为背景） */
    function floodBackground(d, W, H, bgMin, bgSat) {
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
      return background;
    }

    /** 浅底、深底左右并排的预览 */
    function preview(canvas, scale, smooth) {
      const w = canvas.width * scale;
      const h = canvas.height * scale;
      const board = document.createElement("canvas");
      board.width = w * 2;
      board.height = h;
      const bc = board.getContext("2d");
      bc.imageSmoothingEnabled = smooth;
      bc.fillStyle = "#ffffff";
      bc.fillRect(0, 0, w, h);
      bc.fillStyle = "#17171a";
      bc.fillRect(w, 0, w, h);
      bc.drawImage(canvas, 0, 0, w, h);
      bc.drawImage(canvas, w, 0, w, h);
      return board.toDataURL("image/png");
    }

    // ============ 像素风背景 ============
    const t = options.thinking;
    const thinking = await load(thinkingSrc);
    const td = thinking.image.data;
    const thinkingBg = floodBackground(td, thinking.W, thinking.H, t.bgMin, t.bgSat);
    const GW = Math.floor(thinking.W / t.cell);
    const GH = Math.floor(thinking.H / t.cell);
    const grid = new ImageData(GW, GH);
    let dots = 0;
    for (let gy = 0; gy < GH; gy++) {
      for (let gx = 0; gx < GW; gx++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let yy = 0; yy < t.cell; yy++) {
          for (let xx = 0; xx < t.cell; xx++) {
            const i = (gy * t.cell + yy) * thinking.W + gx * t.cell + xx;
            if (thinkingBg[i]) continue;
            r += td[i * 4];
            g += td[i * 4 + 1];
            b += td[i * 4 + 2];
            n++;
          }
        }
        if (n * 2 < t.cell * t.cell) continue;
        const level = v => Math.min(255, Math.round(v / n / t.step) * t.step);
        grid.data.set([level(r), level(g), level(b), 255], (gy * GW + gx) * 4);
        dots++;
      }
    }
    const pixel = document.createElement("canvas");
    pixel.width = GW;
    pixel.height = GH;
    pixel.getContext("2d").putImageData(grid, 0, 0);

    // ============ 头像 ============
    const a = options.avatar;
    const avatar = await load(avatarSrc);
    const ad = avatar.image.data;
    const avatarBg = floodBackground(ad, avatar.W, avatar.H, a.bgMin, a.bgSat);
    for (let i = 0; i < avatarBg.length; i++) if (avatarBg[i]) ad[i * 4 + 3] = 0;
    avatar.context.putImageData(avatar.image, 0, 0);
    const [cx, cy, side] = a.crop;
    const head = document.createElement("canvas");
    head.width = a.size;
    head.height = a.size;
    const hc = head.getContext("2d");
    hc.imageSmoothingQuality = "high";
    hc.drawImage(avatar.canvas, cx, cy, side, side, 0, 0, a.size, a.size);

    return {
      pixel: pixel.toDataURL("image/png"),
      avatar: head.toDataURL("image/webp", a.quality),
      pixelPreview: preview(pixel, 7, false),
      avatarPreview: preview(head, 2, true),
      grid: [GW, GH],
      dots,
    };
  }, { thinkingSrc: await toDataUrl("thinking-source.webp", "image/webp"), avatarSrc: await toDataUrl("avatar-source.png", "image/png"), options });

  const save = (file, dataUrl) => writeFile(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  await save(path.join(OUT_DIR, "thinking-pixel.png"), out.pixel);
  await save(path.join(OUT_DIR, "avatar.webp"), out.avatar);
  console.log(`已生成 thinking-pixel.png：${out.grid[0]}×${out.grid[1]}，${out.dots} 个像素点`);
  console.log(`已生成 avatar.webp：${options.avatar.size}×${options.avatar.size}`);
  if (wantPreview) {
    await save(path.join(os.tmpdir(), "assistant-thinking-preview.png"), out.pixelPreview);
    await save(path.join(os.tmpdir(), "assistant-avatar-preview.png"), out.avatarPreview);
    console.log(`预览图：${os.tmpdir()}`);
  }
}
finally {
  await browser.close();
}
