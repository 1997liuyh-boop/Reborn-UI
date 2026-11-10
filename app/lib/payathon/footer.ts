/**
 * 页脚卡片底部的「生态小屏」：一个像素小人从左走到右，头顶的气泡轮流介绍五个使用场景，
 * 背后是一层带 2×2 Bayer 抖动纹理和细划痕的玻璃；以及页脚卡片在宽屏下的「上一屏吸附」效果。
 */

interface HabitatProduct {
  id: string;
  name: string;
  caption: string;
  steps: string[];
  stops: number[];
}

/** 小屏轮播的使用场景，每走 6 秒换一个；气泡里只显示 name 与 caption，steps / stops 是小人走动的分段 */
const HABITAT_PRODUCTS: HabitatProduct[] = [
  { id: "web", name: "Web 项目", caption: "Vue 或 Nuxt 里，init 之后按需添加组件", steps: ["配置 Tailwind", "运行 init", "安装依赖", "添加组件"], stops: [78, 162, 228, 36] },
  { id: "uniapp", name: "UniApp", caption: "Tailwind v3、v4 各有一份安装指南", steps: ["选 Tailwind 版本", "按指南配置", "添加组件", "编译运行"], stops: [40, 170, 220, 274] },
  { id: "custom", name: "自定义", caption: "组件源码就在项目里，改完即生效", steps: ["打开组件源码", "调整结构", "改样式", "保存生效"], stops: [18, 176, 213, 279] },
  { id: "ai", name: "AI 助手", caption: "文档站里直接向 AI 提问", steps: ["打开助手", "描述需求", "查看回答", "复制代码", "继续追问"], stops: [30, 155, 174, 209, 280] },
  { id: "design", name: "设计工作室", caption: "MasterGo 设计稿对上 Reborn 组件", steps: ["粘贴设计稿链接", "读取节点", "匹配组件", "还原页面"], stops: [35, 112, 205, 272] },
];

/** 玻璃层的 2×2 Bayer 抖动纹理图 */
const BAYER_TEXTURE = "/showcase/payathon-assets/assets/bayer_2x2_4K.png";

/** 挂载页脚生态小屏 */
export function mountFooterHabitat(root: HTMLElement): () => void {
  const habitat = root.querySelector<HTMLElement>("[data-ip-habitat]");
  const walker = habitat?.querySelector<HTMLElement>("[data-habitat-walker]");
  const group = habitat?.querySelector<HTMLElement>("[data-habitat-group]");
  const body = habitat?.querySelector<HTMLElement>("[data-habitat-body]");
  const sprite = habitat?.querySelector<HTMLElement>(".habitatWalkerSprite");
  const product = habitat?.querySelector<HTMLElement>("[data-habitat-product]");
  const message = habitat?.querySelector<HTMLElement>("[data-habitat-message]");
  const viewport = habitat?.querySelector<HTMLElement>("[data-habitat-viewport]");
  const glass = habitat?.querySelector<HTMLCanvasElement>("[data-habitat-glass]");
  if (!habitat || !walker || !group || !body || !sprite || !product || !message || !viewport || !glass) return () => {};

  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const context = glass.getContext("2d");
  const texture = new Image();
  let frame = 0;
  let lastNow = 0;
  /** 小人的横坐标（px） */
  let walkerX = 16;
  /** 累计行走时间（秒） */
  let time = 0;
  let visible = false;
  let destroyed = false;
  let productIndex = 0;

  /** 画玻璃：抖动纹理以 screen 混合铺一层，再随机画 14 道细划痕（伪随机，位置固定） */
  function paintGlass() {
    if (!context || destroyed) return;
    const width = viewport!.clientWidth;
    const height = viewport!.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    glass!.width = Math.max(1, Math.round(width * ratio));
    glass!.height = Math.max(1, Math.round(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const tile = document.createElement("canvas");
    tile.width = tile.height = 4;
    const tileContext = tile.getContext("2d");
    if (tileContext) {
      tileContext.imageSmoothingEnabled = false;
      if (texture.complete && texture.naturalWidth) {
        tileContext.drawImage(texture, 0, 0, 2, 2, 0, 0, 4, 4);
      }
      else {
        // 纹理没加载好时手画一个 2×2 棋盘顶上
        tileContext.fillStyle = "#999";
        tileContext.fillRect(0, 0, 4, 4);
        tileContext.fillStyle = "#333";
        tileContext.fillRect(0, 0, 2, 2);
        tileContext.fillRect(2, 2, 2, 2);
      }
    }
    const pattern = context.createPattern(tile, "repeat");
    if (pattern) {
      context.globalCompositeOperation = "screen";
      context.globalAlpha = 0.07;
      context.fillStyle = pattern;
      context.fillRect(0, 0, width, height);
    }
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;
    const hash = (n: number) => {
      const value = Math.sin(n * 127.1) * 437.5453;
      return value - Math.floor(value);
    };
    for (let i = 1; i <= 14; i++) {
      const x = hash(i) * width;
      const y = hash(i + 21) * height;
      const angle = hash(i + 43) * Math.PI * 2;
      const length = (0.025 + hash(i + 65) * 0.12) * height;
      context.strokeStyle = `rgba(230,233,236,${0.035 + hash(i + 82) * 0.065})`;
      context.lineWidth = 0.65;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
  }
  texture.addEventListener("load", paintGlass, { signal });
  texture.src = BAYER_TEXTURE;

  /** 更新小人位置、上下颠步、偶尔眨眼，以及气泡里的产品 */
  function render() {
    const index = Math.floor(time / 6) % HABITAT_PRODUCTS.length;
    if (index !== productIndex) {
      productIndex = index;
      product!.textContent = HABITAT_PRODUCTS[index]!.name;
      message!.textContent = HABITAT_PRODUCTS[index]!.caption;
    }
    const x = reducedMotion.matches ? 16 : Math.round(walkerX);
    walker!.style.transform = `translate(${x}px,-50%)`;
    const bob = reducedMotion.matches ? 0 : Math.floor(Math.abs(Math.sin(time * 5)) * 2) * 2;
    body!.style.transform = `translateY(${-bob}px)`;
    sprite!.style.transform = !reducedMotion.matches && time > 0 && time % 4 < 0.13 ? "scaleY(.17)" : "none";
  }

  function step(now: number) {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    if (!reducedMotion.matches) {
      const dt = lastNow ? Math.min(40, now - lastNow) / 1000 : 0;
      time += dt;
      // 每秒走 32px，走出右边后从左边外侧重新进场
      walkerX += dt * 32;
      if (walkerX > viewport!.clientWidth + 16) walkerX = -group!.offsetWidth - 16;
    }
    lastNow = now;
    render();
    if (!reducedMotion.matches) frame = requestAnimationFrame(step);
  }
  const start = () => {
    if (!frame && !destroyed && visible && !document.hidden) frame = requestAnimationFrame(step);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastNow = 0;
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    stop();
    start();
  });
  intersection.observe(habitat);
  const resizeObserver = new ResizeObserver(() => {
    paintGlass();
    render();
  });
  resizeObserver.observe(viewport);
  resizeObserver.observe(group);
  document.addEventListener("visibilitychange", () => {
    stop();
    start();
  }, { signal });
  reducedMotion.addEventListener("change", () => {
    stop();
    render();
    start();
  }, { signal });
  paintGlass();
  render();

  return () => {
    destroyed = true;
    stop();
    controller.abort();
    intersection.disconnect();
    resizeObserver.disconnect();
    texture.removeAttribute("src");
  };
}

/**
 * 页脚卡片滚上来时，它上方最近的一个可见区块改成 sticky，停在离顶部最多 104px 处，
 * 页脚卡片像一张纸从下面盖上来。只在宽屏、足够高、且未开启减弱动效时生效。
 */
export function mountFooterScrollShell(shell: HTMLElement): () => void {
  const controller = new AbortController();
  const media = matchMedia("(min-width: 761px) and (min-height: 641px) and (prefers-reduced-motion: no-preference)");
  if (shell.closest(".footerShell--stacked")) return () => {};
  // 向上找第一个占位、可见、非定位的兄弟元素
  let previous = shell.previousElementSibling;
  while (previous) {
    const style = getComputedStyle(previous);
    if (previous instanceof HTMLElement && previous.offsetHeight > 0 && !previous.matches("script,style,link,header,nav") && style.display !== "none" && style.position !== "fixed" && style.position !== "absolute") break;
    previous = previous.previousElementSibling;
  }
  if (!(previous instanceof HTMLElement)) return () => {};
  const target = previous;
  const saved = (["position", "top", "z-index"] as const).map((prop) => [prop, target.style.getPropertyValue(prop), target.style.getPropertyPriority(prop)] as const);
  const restore = () => saved.forEach(([prop, value, priority]) => {
    if (value) target.style.setProperty(prop, value, priority);
    else target.style.removeProperty(prop);
  });
  const apply = () => {
    if (!media.matches) {
      restore();
      return;
    }
    const top = Math.min(104, window.innerHeight - target.offsetHeight - 40);
    target.style.setProperty("position", "sticky");
    target.style.setProperty("top", `${top}px`);
    target.style.setProperty("z-index", "1");
  };
  const resizeObserver = new ResizeObserver(apply);
  resizeObserver.observe(target);
  media.addEventListener("change", apply, { signal: controller.signal });
  window.addEventListener("resize", apply, { signal: controller.signal });
  apply();
  return () => {
    controller.abort();
    resizeObserver.disconnect();
    restore();
  };
}

export { HABITAT_PRODUCTS };
