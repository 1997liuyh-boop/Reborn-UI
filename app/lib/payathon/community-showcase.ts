/**
 * 首页「组件一览 / SHOWCASE」区块的卡片动效，移植自原活动页 CommunityShowcase 脚本的卡片部分。
 *
 * 卡片本身由 PayathonShowcase.vue 按组件目录在服务端渲染（链接可被抓取、无需等脚本），这里只负责动效：
 * 1. 卡面 ASCII 气泡：挂载时插入，随机闪烁、指针划过即戳破（仅桌面端）；
 * 2. 标题跑马灯与跟随指针的卡面光斑；
 * 3. 入场：桌面端按行从左右交替滑入并淡出骨架；移动端改为首尾各接一张克隆卡的无限横向轮播。
 *
 * 原脚本里的作品接口、点赞计数与热度排行榜在首页没有对应数据，已整段移除。
 * 入口是页面根元素，所有查询都限定在其内部。
 */

import { observeActivity } from "./activity";

/** 故障动画的一步：[距开始的毫秒数, 显示方式, 透明度倍率] */
type GlitchStep = readonly [at: number, mode: "block" | "digit" | "restore", alpha: number];

/** 故障节奏：方块闪两下 → 显示数字 → 方块再闪两下 → 复原（气泡字符闪烁用） */
const GLITCH_STEPS: readonly GlitchStep[] = [
  [0, "block", 1],
  [90, "block", 0.12],
  [140, "block", 1],
  [230, "block", 0.12],
  [280, "digit", 1],
  [920, "block", 1],
  [1010, "block", 0.12],
  [1060, "block", 1],
  [1150, "block", 0.12],
  [1200, "restore", 1],
];

const noop = (): void => {};

// ---------------------------------------------------------------------------
// 卡面气泡标记
// ---------------------------------------------------------------------------

/** 气泡圆周上轮换使用的字符 */
const BUBBLE_CHARS = ["o", "0", ".", ":", "+"];

/**
 * 卡面上两只上浮的 ASCII 气泡
 *
 * 由作品 ID 求一个散列值，气泡半径、位置、上浮时长与相位都由它决定，同一作品每次生成的气泡一致。
 * 每只气泡是一圈 <text> 字符，字符间距约 11px。
 *
 * @param seed 作品 ID
 */
function bubblesMarkup(seed: string): string {
  let hash = 0;
  for (const char of String(seed)) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  const bubbles = [0, 1].map((index) => {
    const radius = [20, 30, 40][(hash + index) % 3]!;
    const size = radius * 2 + 16;
    const count = Math.round((2 * Math.PI * radius) / 11);
    const texts = Array.from({ length: count }, (_, step) => {
      const angle = (step / count) * Math.PI * 2;
      const x = (size / 2 + Math.cos(angle) * radius).toFixed(2);
      const y = (size / 2 + Math.sin(angle) * radius).toFixed(2);
      return `<text x="${x}" y="${y}">${BUBBLE_CHARS[(step + hash + index) % BUBBLE_CHARS.length]}</text>`;
    }).join("");
    const left = 14 + (((hash % 47) + index * 37) % 65);
    const duration = 16 + ((hash + index * 5) % 10);
    const delay = -((hash % 13) + index * 9);
    return `<span class="work-ascii-bubble" style="--bubble-left:${left}%;--bubble-duration:${duration}s;--bubble-delay:${delay}s"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${texts}</svg></span>`;
  });
  return `<span class="work-ascii-bubbles" aria-hidden="true">${bubbles.join("")}</span>`;
}

// ---------------------------------------------------------------------------
// 桌面端按行入场
// ---------------------------------------------------------------------------

/** 一行卡位：index 为行号，奇偶行分别从右、左滑入 */
interface RevealRow {
  index: number;
  slots: HTMLElement[];
}

/**
 * 卡片按行入场：每行首个卡位进入视口（12%）后，整行从左或右滑入 64px，卡面随后淡入、骨架淡出
 *
 * 列数取自网格的 --work-columns，列数或移动端断点变化时重新分行；占位卡只保留补齐最后一行所需的数量。
 * 移动端不分行，整块网格淡入一次。减弱动效或页面隐藏时直接呈现最终状态。
 *
 * @param grid 作品网格 [data-work-grid]
 */
function mountRowReveal(grid: HTMLElement): () => void {
  const slots = [...grid.querySelectorAll<HTMLElement>(".payathon-work-slot")];
  const placeholders = slots.filter(slot => slot.classList.contains("is-placeholder"));
  const workCount = slots.length - placeholders.length;
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const mobile = matchMedia("(max-width:760px)");
  const controller = new AbortController();
  const { signal } = controller;
  const animations = new Map<HTMLElement, Animation[]>();
  /** 还没揭开的卡位 */
  const pending = new Set<HTMLElement>(slots);
  let rows: RevealRow[] = [];
  let columns = 0;
  let wasMobile: boolean | null = null;
  let fade: Animation | null = null;

  /** 每行首个卡位露出 12% 时揭开整行 */
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = new Set(entries.filter(entry => entry.isIntersecting).map(entry => entry.target));
      rows.forEach((row) => {
        if (visible.has(row.slots[0]!)) reveal(row);
      });
    },
    { threshold: 0.12 },
  );

  /** 结束卡位的入场：取消动画、清掉入场标记 */
  const settle = (slot: HTMLElement): void => {
    const list = animations.get(slot);
    animations.delete(slot);
    list?.forEach((animation) => {
      animation.onfinish = null;
      animation.cancel();
    });
    pending.delete(slot);
    slot.removeAttribute("data-work-enter-pending");
    slot.removeAttribute("data-work-revealing");
    slot.style.removeProperty("--work-enter-x");
  };

  /** 全部直接呈现 */
  const settleAll = (): void => {
    observer.disconnect();
    fade?.cancel();
    fade = null;
    slots.forEach(settle);
  };

  /** 揭开一行：行间错开 100ms（三行一循环），卡面在滑入开始 180ms 后逐列错开 150ms 淡入 */
  function reveal(row: RevealRow): void {
    observer.unobserve(row.slots[0]!);
    row.slots.forEach((slot, column) => {
      if (!pending.has(slot)) return;
      if (reducedMotion.matches || document.hidden) {
        settle(slot);
        return;
      }
      pending.delete(slot);
      const card = slot.querySelector<HTMLElement>(".payathon-work-card");
      const skeleton = slot.querySelector<HTMLElement>(".payathon-work-skeleton");
      const rowDelay = 100 * (row.index % 3);
      const fadeDelay = rowDelay + 180 + column * 150;
      const slide = slot.animate(
        [{ translate: `${row.index % 2 ? 64 : -64}px 0` }, { translate: "0 0" }],
        { duration: 1500, delay: rowDelay, easing: "cubic-bezier(.22,.68,.32,1)", fill: "backwards" },
      );
      const list = [slide];
      if (card) {
        list.push(
          card.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 680,
            delay: fadeDelay,
            easing: "ease-in-out",
            fill: "backwards",
          }),
          skeleton!.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 680,
            delay: fadeDelay,
            easing: "ease-in-out",
            fill: "backwards",
          }),
        );
      }
      animations.set(slot, list);
      slot.removeAttribute("data-work-enter-pending");
      slot.setAttribute("data-work-revealing", "");
      slide.onfinish = () => settle(slot);
    });
  }

  /** 按当前列数重新分行 */
  function layout(): void {
    const nextColumns = Number(getComputedStyle(grid).getPropertyValue("--work-columns")) || 1;
    if (nextColumns === columns && wasMobile === mobile.matches) return;
    columns = nextColumns;
    wasMobile = mobile.matches;
    observer.disconnect();
    [...animations.keys()].forEach(settle);
    // 补齐最后一行需要的占位卡数量
    const fill = workCount ? (columns - (workCount % columns)) % columns : 0;
    placeholders.forEach((placeholder, index) => {
      placeholder.hidden = index >= fill;
    });
    if (mobile.matches) {
      const animate = pending.size > 0 && !reducedMotion.matches && !document.hidden;
      slots.forEach(settle);
      rows = [];
      if (animate) {
        fade?.cancel();
        fade = grid.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
        fade.onfinish = () => {
          fade = null;
        };
      }
      return;
    }
    const visibleSlots = slots.filter(slot => !slot.hidden);
    rows = [];
    for (let start = 0; start < visibleSlots.length; start += columns) {
      const row: RevealRow = { index: start / columns, slots: visibleSlots.slice(start, start + columns) };
      rows.push(row);
      row.slots.forEach((slot) => {
        if (!pending.has(slot)) return;
        slot.setAttribute("data-work-enter-pending", "");
        slot.style.setProperty("--work-enter-x", `${row.index % 2 ? 64 : -64}px`);
      });
      if (row.slots.some(slot => pending.has(slot))) observer.observe(row.slots[0]!);
    }
  }

  layout();
  if (reducedMotion.matches || document.hidden) settleAll();
  window.addEventListener("resize", layout, { passive: true, signal });
  // 键盘聚焦到还没揭开的卡片时，整行立即呈现
  grid.addEventListener(
    "focusin",
    (event) => {
      const slot = (event.target as Element).closest<HTMLElement>(".payathon-work-slot");
      const row = slot ? rows.find(item => item.slots.includes(slot)) : undefined;
      if (row) {
        observer.unobserve(row.slots[0]!);
        row.slots.forEach(settle);
      }
    },
    { signal },
  );
  reducedMotion.addEventListener(
    "change",
    () => {
      if (reducedMotion.matches) settleAll();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) settleAll();
    },
    { signal },
  );
  return () => {
    controller.abort();
    settleAll();
  };
}

// ---------------------------------------------------------------------------
// 标题跑马灯
// ---------------------------------------------------------------------------

/**
 * 标题超出卡片宽度时来回平移：两端各停 900ms，平移速度 22px/s（单程至少 1.6s）
 *
 * 只在卡片活跃（进入视口、页面可见）时播放；尺寸或字体加载完成后重新测量。
 *
 * @param grid 作品网格
 */
function mountTitleMarquee(grid: HTMLElement): () => void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cleanups = [...grid.querySelectorAll<HTMLElement>(".payathon-work-title-viewport")].map((viewport) => {
    const text = viewport.querySelector<HTMLElement>(".payathon-work-title-text")!;
    const card = viewport.closest(".payathon-work-card")!;
    let animation: Animation | null = null;
    let distance = -1;
    let active = false;
    let disposed = false;

    const syncPlayback = (): void => {
      if (!animation) return;
      if (active) animation.play();
      else animation.pause();
    };

    const measure = (): void => {
      if (disposed) return;
      const next = reducedMotion.matches ? 0 : Math.max(0, text.scrollWidth - viewport.clientWidth);
      if (next === distance) return;
      distance = next;
      animation?.cancel();
      animation = null;
      if (distance <= 1) return;
      const travel = Math.max(1600, (distance / 22) * 1e3);
      const hold = 900;
      const duration = travel + hold * 2;
      animation = text.animate(
        [
          { transform: "translateX(0)", offset: 0 },
          { transform: "translateX(0)", offset: hold / duration },
          { transform: `translateX(${-distance}px)`, offset: 1 - hold / duration },
          { transform: `translateX(${-distance}px)`, offset: 1 },
        ],
        { duration, iterations: Infinity, direction: "alternate", easing: "linear" },
      );
      syncPlayback();
    };

    const unobserve = observeActivity(card, (next) => {
      active = next;
      syncPlayback();
    });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    resizeObserver.observe(text);
    reducedMotion.addEventListener("change", measure);
    void document.fonts.ready.then(measure);
    measure();
    return () => {
      disposed = true;
      animation?.cancel();
      resizeObserver.disconnect();
      unobserve();
      reducedMotion.removeEventListener("change", measure);
    };
  });
  return () => cleanups.forEach(fn => fn());
}

// ---------------------------------------------------------------------------
// 卡面气泡
// ---------------------------------------------------------------------------

/** 气泡上的一个字符：包进 <g>，旁边放一个闪烁用的方块 */
interface BubbleGlyph {
  node: SVGGElement;
  text: SVGTextElement;
  block: SVGRectElement;
  char: string | null;
  x: number;
  y: number;
}

interface Bubble {
  node: HTMLElement;
  svg: SVGSVGElement;
  timer: number;
  /** 每次戳破或停止时递增，用来丢弃过期的戳破回调 */
  generation: number;
  popping: boolean;
  animations: Animation[];
  glyphs: BubbleGlyph[];
}

/** 一次戳破溅出的碎片 */
interface FragmentBurst {
  group: HTMLSpanElement;
  animations: Animation[];
}

/** 指针采样点 */
interface PointerSample {
  x: number;
  y: number;
  time: number;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * 卡面气泡交互（仅桌面端）：
 * - 闪烁：每只气泡每 8~14 秒随机挑 1~2 个字符，按故障节奏闪成方块、变成 0/1 再复原，同时沿径向轻轻弹出；
 * - 戳破：鼠标在卡片上划过气泡（按 150ms 内的移动线段求最近距离）时，气泡暂停上浮、字符向外炸开，
 *   并在气泡中心溅出 6 粒碎片；炸开结束后上浮动画从头开始。
 *
 * @param grid 作品网格
 */
function mountBubbles(grid: HTMLElement): () => void {
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const cleanups = [...grid.querySelectorAll<HTMLElement>(".payathon-work-card")]
    .filter(card => !card.closest(".is-lane-clone"))
    .map((card) => {
      const controller = new AbortController();
      const { signal } = controller;
      let visible = false;
      let running = false;
      let lastPointer: PointerSample | null = null;
      const layer = card.querySelector<HTMLElement>(".work-ascii-bubbles")!;
      const bursts = new Set<FragmentBurst>();
      const bubbles: Bubble[] = [...card.querySelectorAll<HTMLElement>(".work-ascii-bubble")].map(node => ({
        node,
        svg: node.querySelector("svg")!,
        timer: 0,
        generation: 0,
        popping: false,
        animations: [],
        glyphs: [...node.querySelectorAll("text")].map((text) => {
          const group = document.createElementNS(SVG_NS, "g");
          const block = document.createElementNS(SVG_NS, "rect");
          const x = Number(text.getAttribute("x"));
          const y = Number(text.getAttribute("y"));
          block.setAttribute("x", String(x - 6));
          block.setAttribute("y", String(y - 6));
          block.setAttribute("width", "12");
          block.setAttribute("height", "12");
          block.setAttribute("fill", "currentColor");
          block.style.display = "none";
          text.before(group);
          group.append(text, block);
          group.style.opacity = ".2";
          return { node: group, text, block, char: text.textContent, x, y };
        }),
      }));

      /** 字符复原：取消字符动画、显示原字符、隐藏方块 */
      const resetGlyphs = (bubble: Bubble): void => {
        bubble.animations.forEach(animation => animation.cancel());
        bubble.animations = [];
        bubble.glyphs.forEach((glyph) => {
          glyph.text.textContent = glyph.char;
          glyph.text.style.removeProperty("display");
          glyph.text.style.removeProperty("fill");
          glyph.block.style.display = "none";
          glyph.node.style.opacity = ".2";
        });
      };

      /** 为气泡安排下一步；到点时若已停止或正在戳破则跳过 */
      const schedule = (bubble: Bubble, callback: () => void, delay: number): void => {
        window.clearTimeout(bubble.timer);
        bubble.timer = window.setTimeout(() => {
          bubble.timer = 0;
          if (running && !bubble.popping) callback();
        }, delay);
      };

      const scheduleFlicker = (bubble: Bubble): void =>
        schedule(bubble, () => flicker(bubble), 8e3 + Math.random() * 6e3);

      /** 随机挑 1~2 个字符闪烁一轮 */
      function flicker(bubble: Bubble): void {
        const pool = [...bubble.glyphs];
        const picked: BubbleGlyph[] = [];
        const count = Math.min(pool.length, 1 + Math.floor(Math.random() * 2));
        for (let index = 0; index < count; index++)
          picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
        const digits = picked.map(() => (Math.random() < 0.5 ? "0" : "1"));
        const center = bubble.svg.viewBox.baseVal.width / 2;
        bubble.animations = picked.map((glyph, index) => {
          const angle = Math.atan2(glyph.y - center, glyph.x - center);
          const push = 4 + (index % 3);
          return glyph.node.animate(
            [
              { transform: "translate(0,0)", offset: 0 },
              { transform: `translate(${Math.cos(angle) * push}px,${Math.sin(angle) * push}px)`, offset: 0.2 },
              { transform: `translate(${Math.cos(angle) * 2}px,${Math.sin(angle) * 2}px)`, offset: 0.75 },
              { transform: "translate(0,0)", offset: 1 },
            ],
            { duration: 1200, easing: "ease-out" },
          );
        });
        const step = (index: number): void => {
          const [at, mode, alpha] = GLITCH_STEPS[index]!;
          if (mode === "restore") {
            resetGlyphs(bubble);
            scheduleFlicker(bubble);
            return;
          }
          picked.forEach((glyph, pickedIndex) => {
            glyph.block.style.display = mode === "block" ? "" : "none";
            glyph.text.style.display = mode === "block" ? "none" : "";
            glyph.text.textContent = digits[pickedIndex]!;
            glyph.text.style.fill = "currentColor";
            glyph.node.style.opacity = String(alpha * 0.28);
          });
          schedule(bubble, () => step(index + 1), GLITCH_STEPS[index + 1]![0] - at);
        };
        step(0);
      }

      /** 上浮动画从头开始（戳破后或停止时） */
      function restartRise(bubble: Bubble): void {
        bubble.node.style.animationDelay = "0s";
        const rise = bubble.node
          .getAnimations()
          .find(animation => animation instanceof CSSAnimation && animation.animationName === "work-bubble-rise");
        if (rise) rise.currentTime = 0;
        bubble.node.style.removeProperty("animation-play-state");
      }

      /** 在气泡中心溅出 6 粒碎片，向上飘散后移除 */
      function spawnFragments(x: number, y: number): void {
        const group = document.createElement("span");
        group.className = "work-bubble-fragments";
        group.style.left = `${x}px`;
        group.style.top = `${y}px`;
        const burst: FragmentBurst = { group, animations: [] };
        bursts.add(burst);
        layer.append(group);
        for (let index = 0; index < 6; index++) {
          const piece = document.createElement("i");
          const size = 3 + Math.random() * 2;
          piece.className = "work-bubble-fragment";
          piece.style.width = `${size}px`;
          piece.style.height = `${size}px`;
          group.append(piece);
          const startX = (index - 2.5) * 5;
          const startY = (Math.random() - 0.5) * 12;
          const drift = (Math.random() - 0.5) * 20;
          const rise = 30 + Math.random() * 30;
          burst.animations.push(
            piece.animate(
              [
                { transform: `translate(${startX}px,${startY}px)`, opacity: 0.32 },
                {
                  transform: `translate(${startX + drift * 0.2}px,${startY - rise * 0.15}px)`,
                  opacity: 0.32,
                  offset: 0.15,
                },
                { transform: `translate(${startX + drift}px,${startY - rise}px)`, opacity: 0 },
              ],
              { duration: 900 + Math.random() * 500, easing: "linear", fill: "forwards" },
            ),
          );
        }
        void Promise.all(burst.animations.map(animation => animation.finished.catch(() => {}))).then(() => {
          burst.animations.forEach(animation => animation.cancel());
          group.remove();
          bursts.delete(burst);
        });
      }

      /** 停止一切：清掉碎片、计时器与字符动画，正在戳破的气泡恢复上浮 */
      function stopAll(): void {
        lastPointer = null;
        bursts.forEach((burst) => {
          burst.animations.forEach(animation => animation.cancel());
          burst.group.remove();
        });
        bursts.clear();
        bubbles.forEach((bubble) => {
          window.clearTimeout(bubble.timer);
          bubble.timer = 0;
          bubble.generation++;
          bubble.animations.forEach(animation => animation.cancel());
          bubble.animations = [];
          if (bubble.popping) restartRise(bubble);
          bubble.popping = false;
          resetGlyphs(bubble);
        });
      }

      /** 卡片活跃且未要求减弱动效时运行 */
      function sync(): void {
        const next = visible && !reducedMotion.matches;
        if (next === running) return;
        running = next;
        if (running) bubbles.forEach(scheduleFlicker);
        else stopAll();
      }

      /** 戳破一只气泡 */
      async function pop(bubble: Bubble): Promise<void> {
        if (bubble.popping || !running) return;
        window.clearTimeout(bubble.timer);
        bubble.timer = 0;
        resetGlyphs(bubble);
        bubble.popping = true;
        const generation = ++bubble.generation;
        const center = bubble.svg.viewBox.baseVal.width / 2;
        bubble.node.style.animationPlayState = "paused";
        const svgRect = bubble.svg.getBoundingClientRect();
        const layerRect = layer.getBoundingClientRect();
        spawnFragments(
          svgRect.left + svgRect.width / 2 - layerRect.left,
          svgRect.top + svgRect.height / 2 - layerRect.top,
        );
        // 每三个字符一个显示为方块，全部沿径向炸开 18~36px 并淡出
        bubble.animations = bubble.glyphs.map((glyph, index) => {
          const dx = glyph.x - center;
          const dy = glyph.y - center;
          const length = Math.hypot(dx, dy) || 1;
          const distance = 18 + (index % 4) * 6;
          glyph.block.style.display = index % 3 === 0 ? "" : "none";
          glyph.text.style.display = index % 3 === 0 ? "none" : "";
          glyph.node.style.opacity = ".55";
          return glyph.node.animate(
            [
              { transform: "translate(0,0)", opacity: 0.55 },
              { transform: `translate(${(dx / length) * distance}px,${(dy / length) * distance}px)`, opacity: 0 },
            ],
            { duration: 340 + (index % 3) * 35, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
          );
        });
        await Promise.all(bubble.animations.map(animation => animation.finished.catch(() => {})));
        if (generation !== bubble.generation) return;
        bubble.animations.forEach(animation => animation.cancel());
        bubble.animations = [];
        resetGlyphs(bubble);
        bubble.popping = false;
        restartRise(bubble);
        if (running) scheduleFlicker(bubble);
      }

      card.addEventListener(
        "pointermove",
        (event) => {
          if (!running || event.pointerType !== "mouse") return;
          const now = performance.now();
          const current: PointerSample = { x: event.clientX, y: event.clientY, time: now };
          // 150ms 内的上一个采样点作为线段起点，快速划过也能命中
          const previous = lastPointer && now - lastPointer.time < 150 ? lastPointer : current;
          lastPointer = current;
          const cardRect = card.getBoundingClientRect();
          for (const bubble of bubbles) {
            if (bubble.popping) continue;
            const rect = bubble.svg.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            // 已经飘出卡片的气泡不响应
            if (cy < cardRect.top || cy > cardRect.bottom || cx < cardRect.left || cx > cardRect.right) continue;
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            const lengthSquared = dx * dx + dy * dy;
            const t = lengthSquared
              ? Math.max(0, Math.min(1, ((cx - previous.x) * dx + (cy - previous.y) * dy) / lengthSquared))
              : 0;
            if (Math.hypot(cx - previous.x - t * dx, cy - previous.y - t * dy) <= rect.width / 2 - 3) void pop(bubble);
          }
        },
        { passive: true, signal },
      );
      card.addEventListener(
        "pointerleave",
        () => {
          lastPointer = null;
        },
        { signal },
      );
      reducedMotion.addEventListener("change", sync, { signal });
      const unobserve = observeActivity(card, (active) => {
        visible = active;
        sync();
      });
      return () => {
        running = false;
        controller.abort();
        unobserve();
        stopAll();
        bubbles.forEach((bubble) => {
          bubble.node.style.removeProperty("animation-delay");
          bubble.node.style.removeProperty("animation-play-state");
          bubble.glyphs.forEach(glyph => glyph.node.replaceWith(glyph.text));
        });
      };
    });
  return () => cleanups.forEach(fn => fn());
}

// ---------------------------------------------------------------------------
// 移动端横向轮播
// ---------------------------------------------------------------------------

/**
 * 移动端把网格变成横向滚动的单行轮播：
 * - 首尾各接一张克隆卡（末卡的克隆放在最前、首卡的克隆放在最后），滚到克隆卡时瞬移回对应的真卡，形成无限循环；
 * - 区块可见时每 3.8 秒自动前进一张；拖动、滚轮、聚焦期间暂停，结束后 5 秒再继续。
 *
 * @param grid 作品网格
 */
function mountMobileLane(grid: HTMLElement): () => void {
  const mobile = matchMedia("(max-width:760px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const controller = new AbortController();
  const { signal } = controller;
  const slots = [...grid.querySelectorAll<HTMLElement>(".payathon-work-slot")].filter(slot =>
    slot.querySelector(".payathon-work-card"),
  );
  let inView = false;
  let dragging = false;
  let autoTimer = 0;
  let settleTimer = 0;
  let headClone: HTMLElement | null = null;
  let tailClone: HTMLElement | null = null;

  const clearAuto = (): void => {
    window.clearTimeout(autoTimer);
    autoTimer = 0;
  };

  /** 让元素居中所需的 scrollLeft */
  const centerOffset = (element: Element): number =>
    grid.scrollLeft
    + element.getBoundingClientRect().left
    + element.getBoundingClientRect().width / 2
    - (grid.getBoundingClientRect().left + grid.clientWidth / 2);

  /** 克隆卡位：不可聚焦、读屏忽略，去掉气泡层，遮罩 id 加后缀避免重复 */
  const cloneSlot = (slot: HTMLElement, suffix: string): HTMLElement => {
    const clone = slot.cloneNode(true) as HTMLElement;
    clone.classList.add("is-lane-clone");
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    clone.removeAttribute("data-work-enter-pending");
    clone.removeAttribute("data-work-revealing");
    clone.style.removeProperty("--work-enter-x");
    clone.querySelector(".work-ascii-bubbles")?.remove();
    clone.querySelectorAll("mask[id]").forEach((mask) => {
      const id = mask.id;
      mask.id = `${id}-lane-${suffix}`;
      clone.querySelectorAll("[mask]").forEach((element) => {
        if (element.getAttribute("mask") === `url(#${id})`) element.setAttribute("mask", `url(#${mask.id})`);
      });
    });
    return clone;
  };

  /** 停在克隆卡上时瞬移到对应的真卡 */
  const wrap = (): void => {
    if (!headClone || dragging) return;
    const left = grid.scrollLeft;
    const head = centerOffset(headClone);
    const tail = centerOffset(tailClone!);
    if (Math.abs(left - head) < 2) grid.scrollLeft = centerOffset(slots[slots.length - 1]!);
    else if (Math.abs(left - tail) < 2) grid.scrollLeft = centerOffset(slots[0]!);
  };

  /** 安排下一次自动前进 */
  const scheduleAuto = (delay = 3800): void => {
    clearAuto();
    if (
      !mobile.matches
      || reducedMotion.matches
      || document.hidden
      || !inView
      || dragging
      || grid.contains(document.activeElement)
      || slots.length < 2
    ) {
      return;
    }
    autoTimer = window.setTimeout(() => {
      autoTimer = 0;
      wrap();
      const step = slots[0]!.getBoundingClientRect().width + 12;
      grid.scrollTo({
        left: Math.min(grid.scrollWidth - grid.clientWidth, grid.scrollLeft + step),
        behavior: "smooth",
      });
      scheduleAuto();
    }, delay);
  };

  /** 按断点重建克隆卡并回到第一张 */
  const rebuild = (): void => {
    window.clearTimeout(settleTimer);
    if (headClone) {
      headClone.remove();
      tailClone!.remove();
      headClone = tailClone = null;
    }
    if (mobile.matches && slots.length > 1) {
      headClone = cloneSlot(slots[slots.length - 1]!, "head");
      tailClone = cloneSlot(slots[0]!, "tail");
      grid.prepend(headClone);
      grid.append(tailClone);
      grid.scrollLeft = centerOffset(slots[0]!);
    }
    else {
      grid.scrollLeft = 0;
    }
    scheduleAuto();
  };

  rebuild();
  const visibility = new IntersectionObserver(
    (entries) => {
      inView = entries.some(entry => entry.isIntersecting);
      scheduleAuto();
    },
    { threshold: 0.15 },
  );
  visibility.observe(grid);
  grid.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(wrap, 140);
    },
    { passive: true, signal },
  );
  grid.addEventListener("scrollend", wrap, { signal });
  grid.addEventListener(
    "pointerdown",
    () => {
      dragging = true;
      clearAuto();
    },
    { passive: true, signal },
  );
  const release = (): void => {
    if (!dragging) return;
    dragging = false;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(wrap, 140);
    scheduleAuto(5e3);
  };
  window.addEventListener("pointerup", release, { signal });
  window.addEventListener("pointercancel", release, { signal });
  grid.addEventListener("wheel", () => scheduleAuto(5e3), { passive: true, signal });
  grid.addEventListener("focusin", clearAuto, { signal });
  grid.addEventListener("focusout", () => scheduleAuto(5e3), { signal });
  mobile.addEventListener("change", rebuild, { signal });
  reducedMotion.addEventListener("change", () => scheduleAuto(), { signal });
  document.addEventListener("visibilitychange", () => scheduleAuto(), { signal });
  return () => {
    clearAuto();
    window.clearTimeout(settleTimer);
    visibility.disconnect();
    controller.abort();
    headClone?.remove();
    tailClone?.remove();
  };
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------

/**
 * 挂载组件墙的卡片动效
 *
 * 卡片已由模板渲染在 [data-work-grid] 里；没有卡片（目录为空）时什么也不做。
 * 卸载时释放监听、观察器、动画循环与计时器，并移除插入的气泡与克隆卡，卡片回到模板渲染时的样子。
 *
 * @param page 页面根元素，内含 [data-payathon-works]
 * @returns 卸载函数
 */
export function mountCommunityShowcase(page: HTMLElement): () => void {
  const gallery = page.querySelector<HTMLElement>("[data-payathon-works]");
  const grid = gallery?.querySelector<HTMLElement>("[data-work-grid]");
  const cards = grid ? [...grid.querySelectorAll<HTMLElement>(".payathon-work-card")] : [];
  if (!grid || !cards.length) return noop;
  const controller = new AbortController();
  const { signal } = controller;

  // 卡面气泡：由卡片的种子（组件文档路径）决定形状与节奏，同一张卡每次一致
  const insertedBubbles = cards
    .filter(card => !card.querySelector(".work-ascii-bubbles"))
    .map((card) => {
      card.insertAdjacentHTML("afterbegin", bubblesMarkup(card.dataset.workSeed ?? card.getAttribute("href") ?? ""));
      return card.firstElementChild!;
    });

  // 气泡交互只在桌面端挂载，跨过断点时重新判断
  let cleanupBubbles = noop;
  const mobile = matchMedia("(max-width:760px)");
  const syncBubbles = (): void => {
    cleanupBubbles();
    cleanupBubbles = mobile.matches ? noop : mountBubbles(grid);
  };
  mobile.addEventListener("change", syncBubbles, { signal });

  // ── 卡面光斑：鼠标所在卡片写入 --work-light-x / --work-light-y ──
  let litCard: HTMLElement | null = null;
  let litSlot: HTMLElement | null = null;
  let lightFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  const clearLight = (): void => {
    cancelAnimationFrame(lightFrame);
    lightFrame = 0;
    if (litCard) {
      litCard.removeAttribute("data-work-light");
      litCard = null;
      litSlot = null;
    }
  };
  const paintLight = (): void => {
    lightFrame = 0;
    if (!litCard || !litSlot) return;
    const rect = litSlot.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
    litCard.style.setProperty("--work-light-x", `${x * 100}%`);
    litCard.style.setProperty("--work-light-y", `${y * 100}%`);
    litCard.setAttribute("data-work-light", "");
  };
  grid.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      const slot = (event.target as Element).closest<HTMLElement>(".payathon-work-slot");
      if (!slot || !grid.contains(slot) || !slot.querySelector(".payathon-work-card")) {
        clearLight();
        return;
      }
      if (litSlot !== slot) {
        clearLight();
        litSlot = slot;
        litCard = slot.querySelector<HTMLElement>(".payathon-work-card");
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!lightFrame) lightFrame = requestAnimationFrame(paintLight);
    },
    { passive: true, signal },
  );
  grid.addEventListener("pointerleave", clearLight, { signal });
  grid.addEventListener("pointercancel", clearLight, { signal });
  window.addEventListener("scroll", clearLight, { passive: true, capture: true, signal });
  window.addEventListener("resize", clearLight, { passive: true, signal });
  window.addEventListener("blur", clearLight, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) clearLight();
    },
    { signal },
  );

  syncBubbles();
  const cleanupReveal = mountRowReveal(grid);
  const cleanupMarquee = mountTitleMarquee(grid);
  const cleanupLane = mountMobileLane(grid);

  return () => {
    cleanupLane();
    cleanupMarquee();
    clearLight();
    cleanupReveal();
    cleanupBubbles();
    controller.abort();
    insertedBubbles.forEach(node => node.remove());
    cards.forEach(card => card.style.removeProperty("--work-light-x"));
    cards.forEach(card => card.style.removeProperty("--work-light-y"));
  };
}
