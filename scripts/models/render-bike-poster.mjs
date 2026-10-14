/**
 * 截取组件总览头图自行车的静态首帧：public/models/bike/carbon-frame-bike-poster.webp。
 *
 * 首帧就是 3D 场景本身的第一帧：打开本地开发站，等 OverviewBike 的画布就绪、指针不在头图上（合体、默认俯仰），
 * 直接读画布像素（透明背景）。所以机位、取景、光照与线上 3D 完全一致，淡入替换时看不出跳动。
 * 画布宽高比固定为 12:5（舞台 aspect-[3/2]，画布再左右各宽出 30%，见 OverviewBike.vue），改了比例或机位常量要重新截。
 *
 * 执行（先启动开发服务器）：
 *   node scripts/models/render-bike-poster.mjs                     默认连 http://localhost:3000
 *   node scripts/models/render-bike-poster.mjs --base=http://localhost:3001
 *
 * 依赖：本机安装的 Chrome（经 playwright-core 以 channel "chrome" 启动）与 sharp。
 */
import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const BASE = args.base ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "public/models/bike/carbon-frame-bike-poster.webp");

const browser = await chromium.launch({ channel: "chrome", headless: false });
try {
  // 2 倍像素密度：首帧在高分屏上也清晰；舞台只在 xl（≥1280px）显示，视口取 1440
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  // 保留绘制缓冲区，渲染之后任何时候都能读到画布像素
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      if (type === "webgl2" || type === "webgl") options = { ...options, preserveDrawingBuffer: true };
      return getContext.call(this, type, options);
    };
  });
  // 先进别的页面再走客户端路由：开发服务器的 SSR 偶尔不刷新组件，客户端路由不受影响
  await page.goto(`${BASE}/getting-started`, { waitUntil: "load", timeout: 180000 });
  await page.waitForFunction(() => document.querySelector("#__nuxt")?.__vue_app__, null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  // 路由刚就绪时 push 偶尔被吞：没进总览就再推一次
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => document.querySelector("#__nuxt").__vue_app__.config.globalProperties.$router.push("/components"));
    if (await page.locator(".overview-hero").waitFor({ timeout: 30000 }).then(() => true, () => false)) break;
  }
  await page.locator(".overview-bike canvas.opacity-100").waitFor({ state: "attached", timeout: 180000 });
  await page.mouse.move(2, 880);
  // 等阻尼回到静止（进度 0、默认俯仰）
  await page.waitForTimeout(2500);
  const dataURL = await page.locator(".overview-bike canvas").evaluate(canvas => canvas.toDataURL("image/png"));
  const png = Buffer.from(dataURL.split(",")[1], "base64");
  const webp = await sharp(png).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toBuffer();
  await writeFile(OUT, webp);
  const { width, height } = await sharp(png).metadata();
  console.log(`已写出 ${path.relative(process.cwd(), OUT)}：${width}×${height}，${(webp.length / 1024).toFixed(1)} KB`);
}
finally {
  await browser.close();
}
