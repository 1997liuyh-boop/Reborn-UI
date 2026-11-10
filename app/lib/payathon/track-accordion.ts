/**
 * 「按场景找组件 / FIND YOUR COMPONENT」区块的交互与动效，逐行移植自原站 TrackAccordion 脚本。
 *
 * 由四部分组成：
 * 1. 透视跑道布局：按视口宽度算出五条车道的梯形与中线虚线，写入 CSS 变量与 SVG 路径；
 * 2. 赛道详情手风琴：点击车道入口切换展开项，带扫描线、卡片揭开与路牌进出场动画；
 * 3. 节拍小游戏：节拍块沿车道下落，按数字 1~5 或点击按键判定，分数过千放一次彩虹描边；
 * 4. CRT 撕裂滤镜：用 WebGL 预渲染一张扫描噪声图，交给 SVG feDisplacementMap 做信号撕裂；
 *
 * 入口根元素是 [data-track-accordion]（即 .track-runway），
 * 它的父元素 .track-runway-wrap 承载节拍层、彩虹画布与滤镜 SVG。
 */

// ---------------------------------------------------------------------------
// 通用工具
// ---------------------------------------------------------------------------

/** 内联样式账本：记录每个属性被改写前的原值，卸载时一次性还原 */
interface InlineStyleLedger {
  set: (element: HTMLElement, property: string, value: string) => void;
  restore: () => void;
}

/**
 * 创建内联样式账本
 *
 * 车道面板的 --lane-top-left 等变量在标记里本身就有初始值，卸载时不能简单删除，
 * 所以第一次改写前先记下原值与优先级，还原时写回原值（原本没有的则移除）。
 */
function createInlineStyleLedger(): InlineStyleLedger {
  const originals = new Map<HTMLElement, Map<string, { value: string; priority: string }>>();
  return {
    set(element, property, value) {
      let record = originals.get(element);
      if (!record) {
        record = new Map();
        originals.set(element, record);
      }
      if (!record.has(property)) {
        record.set(property, {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
        });
      }
      element.style.setProperty(property, value);
    },
    restore() {
      for (const [element, record] of originals) {
        for (const [property, { value, priority }] of record) {
          if (value) element.style.setProperty(property, value, priority);
          else element.style.removeProperty(property);
        }
      }
      originals.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// 彩虹描边（节拍分数首次过千时播放）
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

/** 折线顶点及其外扩方向 */
interface OffsetVertex extends Point {
  nx: number;
  ny: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

interface RainbowBurst {
  /** 播放一次（期间再次调用会从头重播） */
  start: () => void;
  /** 释放画布、观察器与监听 */
  dispose: () => void;
}

/** 彩虹描边持续时长（毫秒） */
const RAINBOW_DURATION_MS = 5000;

/**
 * 计算折线每个顶点的外扩方向，用于把整条折线沿法线平移（描边一圈圈向外扩散）
 *
 * 与前一个原始点距离不超过 0.5 的点视为重复点剔除。
 * 拐角处取前后两段法线之和再除以 (1 + cosθ)，得到斜接方向，长度恰为 1 / cos(θ/2)，
 * 平移后两条边仍保持等距；除数下限 0.25，避免锐角处外扩过远。
 */
function buildOffsetPath(points: ReadonlyArray<readonly [number, number]>): OffsetVertex[] {
  const filtered = points.filter(
    (point, index) =>
      !index ||
      Math.hypot(point[0] - points[index - 1]![0], point[1] - points[index - 1]![1]) > 0.5,
  );
  // 每段的单位法线（指向行进方向的左侧）
  const normals = filtered.slice(1).map((point, index) => {
    const dx = point[0] - filtered[index]![0];
    const dy = point[1] - filtered[index]![1];
    const length = Math.hypot(dx, dy);
    return { x: dy / length, y: -dx / length };
  });
  return filtered.map(([x, y], index) => {
    const previous = normals[Math.max(0, index - 1)]!;
    const next = normals[Math.min(index, normals.length - 1)]!;
    const divisor = Math.max(0.25, 1 + previous.x * next.x + previous.y * next.y);
    return { x, y, nx: (previous.x + next.x) / divisor, ny: (previous.y + next.y) / divisor };
  });
}

/** #rrggbb 转 HSL（h 为角度，s、l 为百分数） */
function hexToHsl(hex: string): Hsl {
  const [red, green, blue] = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  ) as [number, number, number];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  if (delta) {
    hue =
      (max === red
        ? (green - blue) / delta + (green < blue ? 6 : 0)
        : max === green
          ? (blue - red) / delta + 2
          : (red - green) / delta + 4) * 60;
  }
  return {
    h: hue,
    s: delta ? (delta / (1 - Math.abs(2 * lightness - 1))) * 100 : 0,
    l: lightness * 100,
  };
}

/** 沿折线描出路径，拐角用二次贝塞尔倒圆，圆角半径不超过 16 且不超过相邻边长的 22% */
function traceRoundedPolyline(context: CanvasRenderingContext2D, points: Point[]): void {
  context.beginPath();
  context.moveTo(points[0]!.x, points[0]!.y);
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const incoming = Math.hypot(current.x - previous.x, current.y - previous.y);
    const outgoing = Math.hypot(next.x - current.x, next.y - current.y);
    const radius = Math.min(16, incoming * 0.22, outgoing * 0.22);
    context.lineTo(
      current.x + ((previous.x - current.x) * radius) / incoming,
      current.y + ((previous.y - current.y) * radius) / incoming,
    );
    context.quadraticCurveTo(
      current.x,
      current.y,
      current.x + ((next.x - current.x) * radius) / outgoing,
      current.y + ((next.y - current.y) * radius) / outgoing,
    );
  }
  const last = points[points.length - 1]!;
  context.lineTo(last.x, last.y);
}

/**
 * 彩虹描边：沿「跑道左边线 → 展开的详情卡片外框 → 跑道右边线」这条折线，
 * 以主题强调色为起点、色相逐渐旋转，一道道向外扩散，5 秒后自动销毁。
 */
function createRainbowBurst(root: HTMLElement, reducedMotion: MediaQueryList): RainbowBurst {
  const wrap = root.parentElement!;
  const controller = new AbortController();
  const { signal } = controller;
  let canvas: HTMLCanvasElement | null = null;
  let context: CanvasRenderingContext2D | null = null;
  let rafId = 0;
  let stopTimer: number | undefined;
  let startTime = 0;
  let path: OffsetVertex[] = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let visible = true;
  let accent: Hsl = { h: 190, s: 80, l: 70 };

  /** 停止并移除画布 */
  function teardown() {
    cancelAnimationFrame(rafId);
    window.clearTimeout(stopTimer);
    rafId = 0;
    stopTimer = undefined;
    canvas?.remove();
    canvas = null;
    context = null;
  }

  /** 同步画布尺寸，并按当前展开的详情卡片重算描边折线 */
  function measure() {
    if (!canvas || !context) return;
    const rootRect = root.getBoundingClientRect();
    const content = root.querySelector('.track-panel[data-expanded="true"] .track-detail-content');
    if (!content) return;
    const contentRect = content.getBoundingClientRect();
    // 画布比根元素高 320px，折线整体下移 160px，给向外扩散的描边留出余量
    width = root.clientWidth;
    height = root.clientHeight + 320;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.left = `${(wrap.clientWidth - width) / 2}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const left = contentRect.left - rootRect.left;
    const right = contentRect.right - rootRect.left;
    const top = contentRect.top - rootRect.top + 160;
    const bottom = contentRect.bottom - rootRect.top + 160;
    // 跑道顶边所在高度：根元素底部减去车道入口按钮高度
    const runwayTop = rootRect.height - root.querySelector(".track-toggle")!.clientHeight + 160;
    const runwayTopLeft =
      (Number.parseFloat(root.style.getPropertyValue("--runway-top-left")) / 100) * width;
    const runwayTopRight =
      (Number.parseFloat(root.style.getPropertyValue("--runway-top-right")) / 100) * width;
    path = buildOffsetPath([
      [0, height - 160],
      [runwayTopLeft, runwayTop],
      [left, bottom],
      [left, top],
      [right, top],
      [right, bottom],
      [runwayTopRight, runwayTop],
      [width, height - 160],
    ]);
  }

  /** 绘制一帧 */
  function draw(target: CanvasRenderingContext2D, elapsed: number) {
    target.clearRect(0, 0, width, height);
    // 整体在开头 90ms 淡入、结尾 700ms 淡出
    const fade = Math.min(1, elapsed / 90, (RAINBOW_DURATION_MS - elapsed) / 700);
    target.lineJoin = "round";
    target.lineCap = "round";
    target.globalCompositeOperation = "lighter";
    // 五道波纹依次间隔 260ms 发出，每道 1300ms 一个周期：外扩 108px、逐渐变淡，色相从强调色旋转 210°
    for (let wave = 0; wave < 5; wave++) {
      const delay = wave * 260;
      if (elapsed < delay) continue;
      const progress = ((elapsed - delay) % 1300) / 1300;
      const offset = progress * 108;
      const strength = (1 - progress)**1.05;
      const hueShift = Math.max(0, (progress - 0.1) / 0.9);
      target.strokeStyle = `hsl(${accent.h + hueShift * 210} ${accent.s}% ${accent.l}%)`;
      traceRoundedPolyline(
        target,
        path.map((vertex) => ({
          x: vertex.x + vertex.nx * offset,
          y: vertex.y + vertex.ny * offset,
        })),
      );
      // 同一路径描三遍叠出辉光：宽而淡的外晕、中层、细而亮的芯
      target.globalAlpha = fade * strength * 0.14;
      target.lineWidth = 36;
      target.stroke();
      target.globalAlpha = fade * strength * 0.32;
      target.lineWidth = 18;
      target.stroke();
      target.globalAlpha = fade * strength * 0.95;
      target.lineWidth = 8;
      target.stroke();
    }
    target.globalAlpha = 1;
    target.globalCompositeOperation = "source-over";
  }

  function frame(now: number) {
    rafId = 0;
    if (!canvas || !context) return;
    const elapsed = now - startTime;
    if (elapsed >= RAINBOW_DURATION_MS) {
      teardown();
      return;
    }
    // 不可见时只停帧不销毁，时钟照走；5 秒到点由定时器兜底销毁
    if (visible && !document.hidden) draw(context, elapsed);
    if (visible && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (reducedMotion.matches) return;
    teardown();
    canvas = document.createElement("canvas");
    canvas.className = "runway-rainbow";
    canvas.setAttribute("aria-hidden", "true");
    wrap.append(canvas);
    context = canvas.getContext("2d");
    if (!context) {
      teardown();
      return;
    }
    const accentHex = getComputedStyle(root).getPropertyValue("--payathon-accent").trim();
    accent = hexToHsl(/^#[0-9a-f]{6}$/i.test(accentHex) ? accentHex : "#86eaff");
    measure();
    startTime = performance.now();
    stopTimer = window.setTimeout(teardown, RAINBOW_DURATION_MS);
    rafId = requestAnimationFrame(frame);
  }

  /** 可见性变化后重启帧循环 */
  function resume() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (canvas && visible && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);
  const intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries[0]!.isIntersecting;
    resume();
  });
  intersectionObserver.observe(root);
  document.addEventListener("visibilitychange", resume, { signal });
  reducedMotion.addEventListener(
    "change",
    () => {
      if (reducedMotion.matches) teardown();
    },
    { signal },
  );

  return {
    start,
    dispose() {
      teardown();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      controller.abort();
    },
  };
}

// ---------------------------------------------------------------------------
// 节拍小游戏
// ---------------------------------------------------------------------------

/** 节拍块从生成到抵达判定线的时长（毫秒） */
const NOTE_TRAVEL_MS = 2600;
/** 相邻节拍块的生成间隔（毫秒） */
const NOTE_SPAWN_INTERVAL_MS = 720;
/** 判定窗口（毫秒）：偏差在此范围内才算命中，越过判定线超过此值的节拍块被移除 */
const HIT_WINDOW_MS = 180;

interface RhythmNote {
  id: number;
  lane: number;
  /** 生成时刻（游戏时钟，毫秒） */
  born: number;
  /** 应当被击中的时刻 */
  target: number;
}

type HitGrade = "perfect" | "good";

interface HitResult {
  grade: HitGrade;
  score: number;
  /** 分数首次超过 1000 时为 true，用于触发彩虹描边 */
  celebrate?: true;
}

interface RhythmGame {
  readonly notes: RhythmNote[];
  /** 游戏时钟（毫秒），只在可见时推进 */
  readonly time: number;
  readonly score: number;
  update: (delta: number) => void;
  hit: (lane: number) => HitResult | null;
}

/**
 * 节拍游戏的纯逻辑部分
 *
 * 车道顺序用「洗牌袋」生成：每五个节拍块恰好覆盖五条车道各一次，顺序随机。
 * @param random 随机数来源，默认 Math.random
 */
function createRhythmGame(random: () => number = Math.random): RhythmGame {
  let time = 0;
  let nextSpawn = 350;
  let lastId = 0;
  let score = 0;
  let bag: number[] = [];
  let celebrated = false;
  const notes: RhythmNote[] = [];

  return {
    notes,
    get time() {
      return time;
    },
    get score() {
      return score;
    },
    update(delta) {
      for (time += Math.max(0, delta); time >= nextSpawn; ) {
        if (!bag.length) {
          bag = [0, 1, 2, 3, 4];
          // Fisher–Yates 洗牌
          for (let index = 4; index > 0; index--) {
            const swap = Math.floor(random() * (index + 1));
            [bag[index], bag[swap]] = [bag[swap]!, bag[index]!];
          }
        }
        notes.push({
          id: ++lastId,
          lane: bag.pop()!,
          born: nextSpawn,
          target: nextSpawn + NOTE_TRAVEL_MS,
        });
        nextSpawn += NOTE_SPAWN_INTERVAL_MS;
      }
      for (let index = notes.length - 1; index >= 0; index--) {
        if (time > notes[index]!.target + HIT_WINDOW_MS) notes.splice(index, 1);
      }
    },
    hit(lane) {
      const note = notes
        .filter((candidate) => candidate.lane === lane)
        .sort((a, b) => Math.abs(a.target - time) - Math.abs(b.target - time))[0];
      if (!note || Math.abs(note.target - time) > HIT_WINDOW_MS) return null;
      const grade: HitGrade = Math.abs(note.target - time) <= 95 ? "perfect" : "good";
      score += grade === "perfect" ? 100 : 50;
      notes.splice(notes.indexOf(note), 1);
      const celebrate = !celebrated && score > 1000;
      if (celebrate) celebrated = true;
      const result: HitResult = { grade, score };
      if (celebrate) result.celebrate = true;
      return result;
    },
  };
}

/** 车道配色：color 为按键文字色（描边、波纹），fill 为与深色底混合后的填充色 */
interface LaneColor {
  color: string;
  fill: string;
}

/** 节拍层坐标系下的车道几何（像素） */
interface LaneGeometry {
  /** 车道顶边中点横坐标 */
  top: number;
  /** 车道底边中点横坐标 */
  bottom: number;
  /** 车道顶边宽度 */
  topWidth: number;
  /** 按键中心横坐标 */
  keyX: number;
  keyWidth: number;
  keyHeight: number;
}

/** 按键命中后从按键向外扩散的椭圆波纹 */
interface KeyRipple {
  start: number;
  duration: number;
  scale: number;
}

/** 可编辑区域内的数字键不当作节拍输入 */
const EDITABLE_SELECTOR =
  'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]';

/**
 * 挂载节拍小游戏：节拍块画在 .runway-beats 画布上，按键位置跟随车道标签
 * @returns 清理函数
 */
function mountRhythmGame(root: HTMLElement, reducedMotion: MediaQueryList): () => void {
  const wrap = root.parentElement!;
  const rhythm = wrap.querySelector<HTMLElement>("[data-runway-rhythm]")!;
  const keys = [...rhythm.querySelectorAll<HTMLElement>("[data-rhythm-key]")];
  const beats = rhythm.querySelector<HTMLCanvasElement>(".runway-beats")!;
  const panels = [...root.querySelectorAll<HTMLElement>(".track-panel")];
  const scoreOutput = root
    .closest(".event-subsection")!
    .querySelector<HTMLElement>("[data-rhythm-score]")!;
  const game = createRhythmGame();
  const rainbow = createRainbowBurst(root, reducedMotion);
  const controller = new AbortController();
  const { signal } = controller;
  const context = beats.getContext("2d");
  const styles = createInlineStyleLedger();
  /** 每个元素同一时刻只保留一段 WAAPI 动画，新的会打断旧的 */
  const runningAnimations = new Map<Element, Animation>();
  /** 正在扩散的按键波纹，键为车道序号 */
  const ripples = new Map<number, KeyRipple>();

  let dpr = 1;
  let laneColors: LaneColor[] = [];
  /** 节拍层是否至少 55% 进入视口 */
  let visible = false;
  let rafId = 0;
  let lastTimestamp = 0;
  let width = 0;
  let height = 0;
  /** 判定线（按键中心）的纵坐标 */
  let hitLineY = 0;
  let lanes: LaneGeometry[] = [];

  scoreOutput.textContent = "score: 0";
  scoreOutput.hidden = true;
  // 原站靠 [hidden]{display:block;visibility:hidden} 让分数行隐藏时仍占 40px 高度；
  // 站点的 Tailwind 预设在 base 层里把 [hidden] 写成 display:none !important，层内的 !important 压过页面样式，
  // 只有内联的 !important 能盖住它。隐藏与显示仍由 hidden 属性切换 visibility
  scoreOutput.style.setProperty("display", "block", "important");

  /** 取消所有反馈动画与波纹，并重绘一帧 */
  function resetEffects() {
    runningAnimations.forEach((animation) => animation.cancel());
    runningAnimations.clear();
    ripples.clear();
    draw();
  }

  /** 同步节拍层尺寸、按键位置、车道配色与几何 */
  function measure() {
    width = root.clientWidth;
    height = root.querySelector<HTMLElement>(".track-toggle")!.clientHeight;
    styles.set(rhythm, "width", `${width}px`);
    styles.set(rhythm, "height", `${height}px`);
    styles.set(rhythm, "left", `${(wrap.clientWidth - width) / 2}px`);
    const firstKey = keys[0]!;
    hitLineY =
      height - Number.parseFloat(getComputedStyle(firstKey).bottom) - firstKey.offsetHeight / 2;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    beats.width = Math.max(1, Math.round(width * dpr));
    beats.height = Math.max(1, Math.round(height * dpr));
    laneColors = keys.map((key) => {
      const color = getComputedStyle(key).color;
      // 按键色与深色底 rgb(16,20,27) 按 65% : 35% 混合，作为节拍块填充色
      const fill = `rgb(${color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((channel, index) => Math.round(channel * 0.65 + [16, 20, 27][index]! * 0.35))
        .join(",")})`;
      return { color, fill };
    });
    lanes = panels.map((panel, index) => {
      const style = getComputedStyle(panel);
      const key = keys[index]!;
      const top =
        ((Number.parseFloat(style.getPropertyValue("--lane-top-left")) +
          Number.parseFloat(style.getPropertyValue("--lane-top-right"))) /
          200) *
        width;
      // 车道底边五等分整个宽度
      const bottom = ((index + 0.5) * width) / 5;
      const topWidth =
        ((Number.parseFloat(style.getPropertyValue("--lane-top-right")) -
          Number.parseFloat(style.getPropertyValue("--lane-top-left"))) /
          100) *
        width;
      // 按键水平对齐车道标签（--lane-label-center 由跑道布局算出）
      styles.set(
        key,
        "left",
        `${(Number.parseFloat(style.getPropertyValue("--lane-label-center")) / 100) * width}px`,
      );
      return {
        top,
        bottom,
        topWidth,
        keyX: Number.parseFloat(key.style.left),
        keyWidth: key.offsetWidth,
        keyHeight: key.offsetHeight,
      };
    });
  }

  /** 节拍层可见、页面在前台且未要求减少动效时才运行 */
  function isRunning() {
    return visible && !document.hidden && !reducedMotion.matches;
  }

  /** 用帧时间戳推进游戏时钟 */
  function advance(now: number) {
    if (lastTimestamp) game.update(Math.max(0, now - lastTimestamp));
    lastTimestamp = now;
  }

  function draw() {
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    for (const note of game.notes) {
      const progress = Math.max(0, (game.time - note.born) / NOTE_TRAVEL_MS);
      // 下落带 1.2 次方加速，模拟透视下越近越快；progress = 1 时恰好到达判定线
      const depth = (progress**1.2 * hitLineY) / height;
      const { top, bottom, topWidth } = lanes[note.lane]!;
      const halfThickness = width < 768 ? 8 : 10;
      // 按纵坐标在车道顶边与底边之间线性插值出车道边缘的横坐标；side 为 -1（左）或 1（右）
      const edgeX = (y: number, side: number) => {
        const ratio = y / height;
        return (
          top +
          (side * topWidth) / 2 +
          (bottom + (side * width) / 10 - top - (side * topWidth) / 2) * ratio
        );
      };
      const upper = depth * height - halfThickness;
      const lower = depth * height + halfThickness;
      // 生成后快速淡入，越过判定线后迅速淡出
      context.globalAlpha =
        Math.min(1, progress * 8) * Math.max(0, 1 - Math.max(0, progress - 1) * 12);
      context.fillStyle = laneColors[note.lane]!.fill;
      context.strokeStyle = laneColors[note.lane]!.color;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(edgeX(upper, -1), upper);
      context.lineTo(edgeX(upper, 1), upper);
      context.lineTo(edgeX(lower, 1), lower);
      context.lineTo(edgeX(lower, -1), lower);
      context.closePath();
      context.fill();
      context.stroke();
    }
    // 按键波纹：两圈，第二圈晚 65ms 发出、扩得更大更淡
    for (const [lane, ripple] of ripples) {
      const elapsed = game.time - ripple.start;
      if (elapsed > ripple.duration + 65) {
        ripples.delete(lane);
        continue;
      }
      const { keyX, keyWidth, keyHeight } = lanes[lane]!;
      context.strokeStyle = laneColors[lane]!.color;
      for (let ring = 0; ring < 2; ring++) {
        const progress = (elapsed - ring * 65) / ripple.duration;
        if (progress < 0 || progress >= 1) continue;
        const eased = 1 - (1 - progress) ** 3;
        const scale = 0.8 + (ripple.scale + ring * 0.5 - 0.8) * eased;
        context.globalAlpha = (ring ? 0.6 : 0.95) * (1 - progress) ** 1.5;
        context.lineWidth = 1.5;
        context.beginPath();
        context.ellipse(
          keyX,
          hitLineY,
          (keyWidth / 2 + 5) * scale,
          (keyHeight / 2 + 5) * scale,
          0,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }
    }
    context.globalAlpha = 1;
  }

  function frame(now: number) {
    rafId = 0;
    if (isRunning()) {
      advance(now);
      draw();
      rafId = requestAnimationFrame(frame);
    }
  }

  /** 运行条件变化：重置时间基准，运行则起帧循环，否则清掉反馈效果 */
  function sync() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    lastTimestamp = 0;
    styles.set(wrap, "will-change", isRunning() ? "transform" : "");
    if (isRunning()) rafId = requestAnimationFrame(frame);
    else resetEffects();
  }

  /** 在元素上播放动画，并打断该元素上一段未结束的动画 */
  function playExclusive(
    element: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    runningAnimations.get(element)?.cancel();
    const animation = element.animate(keyframes, options);
    runningAnimations.set(element, animation);
    animation.finished.then(
      () => {
        if (runningAnimations.get(element) === animation) runningAnimations.delete(element);
      },
      () => {},
    );
  }

  /** 按下某条车道的按键：判定、按键回弹、波纹、跑道震动与评级字样 */
  function pressKey(lane: number) {
    if (!isRunning()) return;
    advance(performance.now());
    const key = keys[lane]!;
    const result = game.hit(lane);
    const perfect = result?.grade === "perfect";
    // 震动幅度：perfect > good > 未命中
    const shake = perfect ? 5 : result ? 3.5 : 2;
    // 奇偶车道震动方向相反
    const direction = lane % 2 ? -1 : 1;
    playExclusive(
      key,
      [
        {
          transform: "translateX(-50%) translateY(3px) scale(.86)",
          backgroundColor: laneColors[lane]!.fill,
          offset: 0,
        },
        {
          transform: "translateX(-50%) translateY(-2px) scale(1.12)",
          backgroundColor: laneColors[lane]!.fill,
          offset: 0.28,
        },
        {
          transform: "translateX(-50%) translateY(0) scale(1)",
          backgroundColor: "#10141b",
          offset: 1,
        },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.7,.3,1)" },
    );
    ripples.set(lane, {
      start: game.time,
      duration: perfect ? 620 : 500,
      scale: perfect ? 4.4 : result ? 3.7 : 3.1,
    });
    // 通知 CRT 滤镜暂停撕裂
    root.dispatchEvent(new Event("runway-impact"));
    playExclusive(
      wrap,
      [
        { transform: `translate3d(${direction * shake}px,${shake * 0.5}px,0)`, offset: 0 },
        {
          transform: `translate3d(${-direction * shake * 0.8}px,${-shake * 0.45}px,0)`,
          offset: 0.2,
        },
        {
          transform: `translate3d(${direction * shake * 0.5}px,${shake * 0.3}px,0)`,
          offset: 0.44,
        },
        {
          transform: `translate3d(${-direction * shake * 0.2}px,${-shake * 0.15}px,0)`,
          offset: 0.7,
        },
        { transform: "translate3d(0,0,0)", offset: 1 },
      ],
      { duration: perfect ? 210 : 170, easing: "ease-out" },
    );
    if (result) {
      if (result.celebrate) rainbow.start();
      scoreOutput.hidden = false;
      scoreOutput.textContent = `score: ${result.score}`;
      const judgement = key.querySelector<HTMLElement>(".runway-judgement")!;
      judgement.querySelectorAll<HTMLElement>("[data-grade]").forEach((grade) => {
        grade.hidden = grade.dataset.grade !== result.grade;
      });
      judgement.dataset.result = result.grade;
      // 评级字样：弹出放大、回弹两下后上飘淡出，perfect 更夸张
      playExclusive(
        judgement,
        [
          {
            opacity: 0,
            transform: `translate(-50%,12px) scale(.55) rotate(${perfect ? -8 : -4}deg)`,
            offset: 0,
          },
          {
            opacity: 1,
            transform: `translate(-50%,-12px) scale(${perfect ? 1.65 : 1.35}) rotate(${perfect ? 3 : 1}deg)`,
            offset: 0.13,
          },
          {
            opacity: 1,
            transform: "translate(-50%,-7px) scale(.96) rotate(-1deg)",
            offset: 0.27,
          },
          {
            opacity: 1,
            transform: "translate(-50%,-9px) scale(1.06) rotate(0deg)",
            offset: 0.4,
          },
          {
            opacity: 1,
            transform: "translate(-50%,-12px) scale(1)",
            offset: 0.7,
          },
          {
            opacity: 0,
            transform: "translate(-50%,-28px) scale(.96)",
            offset: 1,
          },
        ],
        { duration: perfect ? 800 : 680, easing: "cubic-bezier(.16,.7,.3,1)" },
      );
    }
    draw();
  }

  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);
  window.addEventListener("resize", measure, { signal });
  measure();

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0]!.intersectionRatio >= 0.55;
      sync();
    },
    { threshold: [0, 0.55] },
  );
  intersectionObserver.observe(rhythm);
  document.addEventListener("visibilitychange", sync, { signal });
  reducedMotion.addEventListener("change", sync, { signal });

  keys.forEach((key, lane) => key.addEventListener("click", () => pressKey(lane), { signal }));
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey ||
        !/^[1-5]$/.test(event.key)
      ) {
        return;
      }
      if (event.target instanceof Element && event.target.closest(EDITABLE_SELECTOR)) return;
      // 有弹窗打开时不抢数字键；弹窗可能在页面任意位置，所以这里查的是整个文档
      if (document.querySelector('dialog[open],[aria-modal="true"]:not([hidden])')) return;
      if (isRunning()) {
        event.preventDefault();
        pressKey(Number(event.key) - 1);
      }
    },
    { signal },
  );

  return () => {
    rainbow.dispose();
    cancelAnimationFrame(rafId);
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    controller.abort();
    resetEffects();
    // 还原节拍层尺寸、按键位置与跑道的 will-change
    styles.restore();
    context?.clearRect(0, 0, beats.width, beats.height);
    // 以下为移植补充：释放画布缓冲区、复位分数显示
    beats.removeAttribute("width");
    beats.removeAttribute("height");
    scoreOutput.textContent = "score: 0";
    scoreOutput.hidden = true;
  };
}

// ---------------------------------------------------------------------------
// 跑道中线虚线
// ---------------------------------------------------------------------------

/**
 * 生成车道中线虚线路径（SVG viewBox 为 0 0 1000 460）
 *
 * 共 10 段短划，从车道顶端往下排列，间距按 1.3 次方递增，越靠近观察者越稀疏；
 * 末端停在距底边约 112px 处（按入口按钮高度折算成比例，至少保留 20%）。
 * @param topX 车道顶边中点横坐标
 * @param bottomX 车道底边中点横坐标
 * @param toggleHeight 车道入口按钮的高度（像素）
 */
function buildDashPath(topX: number, bottomX: number, toggleHeight = 340): string {
  const end = Math.max(0.2, 1 - 112 / toggleHeight);
  const pointAt = (progress: number) => `${topX + (bottomX - topX) * progress} ${460 * progress}`;
  return Array.from({ length: 10 }, (_, index) => {
    const start = 0.04 + (end - 0.04) * (index / 10)**1.3;
    // 短划长度随深度略增
    const length = 0.009 + start * 0.012;
    return `M${pointAt(start)} L${pointAt(Math.min(end, start + length))}`;
  }).join(" ");
}

// ---------------------------------------------------------------------------
// CRT 撕裂滤镜
// ---------------------------------------------------------------------------

interface CrtOptions {
  /** 生成的 SVG 滤镜 id，样式里以 url(#id) 引用 */
  id?: string;
  /** 为 true 时噪声图铺满整个区域，并关闭横向扫描亮线的位移 */
  fullField?: boolean;
}

/** 需要在卸载时释放的 WebGL 资源 */
interface CrtGlResources {
  shaders: WebGLShader[];
  program: WebGLProgram | null;
  buffer: WebGLBuffer | null;
}

/** 构成 CRT 滤镜、且在动画中需要逐帧改写属性的节点 */
interface CrtFilterParts {
  svg: SVGSVGElement;
  filter: SVGFilterElement;
  /** 噪声扫描图，纵向扫过整个区域 */
  scan: SVGFEImageElement;
  /** 用噪声图做水平撕裂的位移图元 */
  glitch: SVGFEDisplacementMapElement;
  /** 5px 高的扫描亮线 */
  line: SVGFEFloodElement;
}

/** 滤镜区域四周外扩的余量（像素），保证位移后的像素不被裁掉 */
const CRT_FILTER_MARGIN = 128;

const SVG_NS = "http://www.w3.org/2000/svg";

const CRT_VERTEX_SHADER = `attribute vec2 position;
      varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

/**
 * 噪声扫描图的片元着色器：把高度切成 19 条水平信号带，每条带用伪随机决定是否撕裂、
 * 往哪个方向撕裂，带与带之间留有干净的间隙；带边界突变，模拟行同步丢失。
 * 上下两端各 8% 渐隐，再叠一层细密的正弦纹。
 * 输出写在 R 通道（0.5 为不位移），G 固定 0.5，供 feDisplacementMap 读取。
 */
const CRT_FRAGMENT_SHADER = `precision mediump float;
      varying vec2 uv;
      void main(){
        float y=uv.y;
        float envelope=smoothstep(0.,.08,y)*(1.-smoothstep(.92,1.,y));
        float row=floor(y*19.);
        float noise=fract(sin(row*127.1+19.7)*43758.5453);
        float tear=(noise-.5)*.72*step(.36,noise);
        float fine=sin(y*380.)*.025;
        gl_FragColor=vec4(.5+(tear+fine)*envelope,.5,0.,1.);
      }`;

/** 创建 SVG 元素并批量设置属性 */
function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

/** 与 GLSL 同款的 fract(sin(x)) 伪随机，返回 [0, 1) */
function crtHash(value: number): number {
  const product = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return product - Math.floor(product);
}

/** 用 WebGL 画一张 64×128 的噪声扫描图，导出为 data URL */
function renderCrtScanImage(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  resources: CrtGlResources,
): string {
  const compile = (type: number, source: string) => {
    // 上下文丢失时为 null，随后 shaderSource 抛错落入外层 catch，与原实现一致
    const shader = gl.createShader(type)!;
    resources.shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("CRT shader compile failed");
    return shader;
  };
  const program = gl.createProgram();
  resources.program = program;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, CRT_VERTEX_SHADER));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, CRT_FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("CRT shader link failed");
  gl.useProgram(program);
  resources.buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
  // 两个三角形铺满整个画布
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.viewport(0, 0, 64, 128);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  return canvas.toDataURL();
}

/**
 * 搭建滤镜链（feDisplacementMap 的位移量 = scale × (通道值 - 0.5)）：
 * 1. 中性底 rgb(128,128,0) 上叠噪声扫描图，得到位移场 field，对原图做水平撕裂（scale 逐帧改写）；
 * 2. 中性底上叠一条 5px 高、R=191 的亮线，得到 lineField，对撕裂结果再做一次固定的小幅错位。
 */
function buildCrtFilter(id: string, fullField: boolean, scanImage: string): CrtFilterParts {
  const svg = createSvgElement("svg", {
    class: "runway-crt-filter",
    "aria-hidden": "true",
    width: 0,
    height: 0,
  });
  const defs = createSvgElement("defs");
  const filter = createSvgElement("filter", {
    id,
    filterUnits: "userSpaceOnUse",
    x: -CRT_FILTER_MARGIN,
    y: -CRT_FILTER_MARGIN,
    "color-interpolation-filters": "sRGB",
  });
  const neutral = createSvgElement("feFlood", {
    "flood-color": "rgb(128,128,0)",
    result: "neutral",
  });
  const scan = createSvgElement("feImage", {
    href: scanImage,
    x: 0,
    y: -80,
    height: 80,
    preserveAspectRatio: "none",
    result: "scan",
  });
  const field = createSvgElement("feMerge", { result: "field" });
  field.append(
    createSvgElement("feMergeNode", { in: "neutral" }),
    createSvgElement("feMergeNode", { in: "scan" }),
  );
  const glitch = createSvgElement("feDisplacementMap", {
    in: "SourceGraphic",
    in2: "field",
    scale: 0,
    xChannelSelector: "R",
    yChannelSelector: "G",
  });
  glitch.setAttribute("result", "glitched");
  const line = createSvgElement("feFlood", {
    "flood-color": "rgb(191,128,0)",
    x: 0,
    y: -5,
    height: 5,
    result: "line",
  });
  const lineField = createSvgElement("feMerge", { result: "lineField" });
  lineField.append(
    createSvgElement("feMergeNode", { in: "neutral" }),
    createSvgElement("feMergeNode", { in: "line" }),
  );
  const lineGlitch = createSvgElement("feDisplacementMap", {
    in: "glitched",
    in2: "lineField",
    scale: fullField ? 0 : 16,
    xChannelSelector: "R",
    yChannelSelector: "G",
  });
  filter.append(neutral, scan, field, glitch, line, lineField, lineGlitch);
  defs.append(filter);
  svg.append(defs);
  return { svg, filter, scan, glitch, line };
}

/**
 * 挂载 CRT 撕裂滤镜：把滤镜 SVG 挂到 .track-runway-wrap 下，可见时以 30fps 改写滤镜参数，
 * 运行状态写在根元素的 data-crt-running 上供样式切换。
 * @returns 清理函数
 */
function mountCrtDisplacement(
  root: HTMLElement,
  reducedMotion: MediaQueryList,
  { id = "runway-crt-displace", fullField = false }: CrtOptions = {},
): () => void {
  // 非 Chromium 内核的 WebKit（即 Safari）直接跳过
  if (
    /AppleWebKit/.test(navigator.userAgent) &&
    !/(?:Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent)
  ) {
    return () => {};
  }
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return () => {};

  const wrap = root.parentElement!;
  const resources: CrtGlResources = { shaders: [], program: null, buffer: null };
  const controller = new AbortController();
  const { signal } = controller;
  let svg: SVGSVGElement | undefined;
  let intersectionObserver: IntersectionObserver | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let rafId = 0;
  let impactTimer: number | undefined;

  const teardown = () => {
    window.clearTimeout(impactTimer);
    cancelAnimationFrame(rafId);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    controller.abort();
    delete root.dataset.crtRunning;
    svg?.remove();
    if (resources.buffer) gl.deleteBuffer(resources.buffer);
    if (resources.program) gl.deleteProgram(resources.program);
    resources.shaders.forEach((shader) => gl.deleteShader(shader));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };

  try {
    const parts = buildCrtFilter(id, fullField, renderCrtScanImage(canvas, gl, resources));
    svg = parts.svg;
    wrap.append(parts.svg);

    /** 根元素高度，滤镜区域据此扩展 */
    let filterHeight = 0;
    let visible = false;
    let running = false;
    let lastTimestamp = 0;
    /** 只在运行时累计的动画时钟（毫秒） */
    let clock = 0;
    let lastRender = 0;
    /** 按键命中后的暂停期 */
    let impactHold = false;

    const frame = (now: number) => {
      if (!running) return;
      // 单帧最多推进 100ms，切回前台时不会跳变
      if (lastTimestamp) clock += Math.min(now - lastTimestamp, 100);
      lastTimestamp = now;
      // 滤镜属性限制在 30fps 更新
      if (now - lastRender >= 1000 / 30) {
        lastRender = now;
        // 噪声图每 7.2 秒扫过一遍（5.7 秒扫完，余下时间停在底部外），亮线每 6.2 秒扫过一遍
        const sweep = (clock % 7200) / 5700;
        parts.line.setAttribute("y", String(-5 + ((clock % 6200) / 6200) * (filterHeight + 10)));
        parts.scan.setAttribute("y", String(-96 + Math.min(sweep, 1) * (filterHeight + 192)));
        // 每 85ms 换一组随机数
        const step = Math.floor(clock / 85);
        const cycle = Math.floor(clock / 7200);
        const phase = clock % 7200;
        // 每个 7.2 秒周期里：必有一次 255ms 的撕裂；另有 45% 概率再来一次 170ms 的
        const burstAt = 1000 + crtHash(cycle + 71) * 900;
        const secondBurstAt = 3500 + crtHash(cycle + 97) * 700;
        const tearing =
          (phase >= burstAt && phase < burstAt + 255) ||
          (crtHash(cycle + 113) > 0.55 && phase >= secondBurstAt && phase < secondBurstAt + 170);
        const scale = tearing
          ? (crtHash(step + 5) > 0.5 ? 1 : -1) * (20 + crtHash(step + 17) * 20)
          : 0;
        parts.glitch.setAttribute("scale", String(scale));
        parts.scan.setAttribute(
          "height",
          String(tearing ? 44 + Math.floor(crtHash(step + 31) * 5) * 13 : 72),
        );
        if (fullField) {
          parts.scan.setAttribute("y", "0");
          parts.scan.setAttribute("height", String(filterHeight));
        }
        if (tearing && !fullField) {
          // 撕裂期间扫描图上下抖动
          const jitter = (crtHash(step + 43) - 0.5) * 22;
          parts.scan.setAttribute(
            "y",
            String(-96 + Math.min(sweep, 1) * (filterHeight + 192) + jitter),
          );
        }
      }
      rafId = requestAnimationFrame(frame);
    };

    /** 根据可见性、前台状态、减少动效与命中暂停决定是否运行 */
    const sync = () => {
      const active = visible && !document.hidden && !reducedMotion.matches;
      root.dataset.crtRunning = String(active);
      const next = active && !impactHold;
      if (next !== running) {
        running = next;
        lastTimestamp = 0;
        if (next) rafId = requestAnimationFrame(frame);
        else cancelAnimationFrame(rafId);
      }
    };

    // 节拍按键命中时暂停撕裂 900ms
    root.addEventListener(
      "runway-impact",
      () => {
        impactHold = true;
        window.clearTimeout(impactTimer);
        sync();
        impactTimer = window.setTimeout(() => {
          impactHold = false;
          sync();
        }, 900);
      },
      { signal },
    );
    resizeObserver = new ResizeObserver(() => {
      const rect = root.getBoundingClientRect();
      filterHeight = rect.height;
      parts.filter.setAttribute("width", String(rect.width + CRT_FILTER_MARGIN * 2));
      parts.filter.setAttribute("height", String(filterHeight + CRT_FILTER_MARGIN * 2));
      parts.scan.setAttribute("x", String(-CRT_FILTER_MARGIN));
      parts.scan.setAttribute("width", String(rect.width + CRT_FILTER_MARGIN * 2));
      parts.line.setAttribute("x", String(-CRT_FILTER_MARGIN));
      parts.line.setAttribute("width", String(rect.width + CRT_FILTER_MARGIN * 2));
    });
    resizeObserver.observe(root);
    intersectionObserver = new IntersectionObserver((entries) => {
      visible = entries[0]!.isIntersecting;
      sync();
    });
    intersectionObserver.observe(root);
    reducedMotion.addEventListener("change", sync, { signal });
    document.addEventListener("visibilitychange", sync, { signal });
  } catch (error) {
    // 原站在此上报埋点，移植时去掉
    teardown();
    console.warn("Runway CRT unavailable:", error);
    return () => {};
  }
  return teardown;
}

// ---------------------------------------------------------------------------
// 跑道布局与赛道手风琴（入口）
// ---------------------------------------------------------------------------

/** 切换赛道时，入口按钮上的扫描线先走这么久，详情卡片随后揭开（毫秒） */
const TRACK_SCAN_LEAD_MS = 440;
/** 详情卡片揭开、路牌入场的时长（毫秒） */
const TRACK_REVEAL_MS = 520;

/**
 * 透视跑道布局（SVG viewBox 为 0 0 1000 460）
 *
 * 跑道铺满整个视口宽度：底边五条车道各占 200 单位；顶边收窄到内容区宽度的 70% 并居中，
 * 五条车道在顶边等分。结果写入根元素与各面板的 CSS 变量，以及车道、虚线的 SVG 路径。
 */
function layoutRunway(
  root: HTMLElement,
  panels: HTMLElement[],
  toggles: HTMLElement[],
  styles: InlineStyleLedger,
): void {
  const viewportWidth = document.documentElement.clientWidth;
  const contentWidth = root.parentElement!.clientWidth;
  styles.set(root, "--runway-width", `${viewportWidth}px`);
  styles.set(root, "--runway-content-width", `${contentWidth}px`);
  // 顶边左端点与单条车道顶边宽度（viewBox 单位）
  const topLeft = ((viewportWidth - contentWidth * 0.7) / 2 / viewportWidth) * 1000;
  const laneTopWidth = (((contentWidth * 0.7) / viewportWidth) * 1000) / 5;
  styles.set(root, "--runway-top-left", `${topLeft / 10}%`);
  styles.set(root, "--runway-top-right", `${(1000 - topLeft) / 10}%`);
  panels.forEach((panel, index) => {
    const laneLeft = topLeft + index * laneTopWidth;
    const laneRight = laneLeft + laneTopWidth;
    const laneCenter = (laneLeft + laneRight) / 2;
    styles.set(panel, "--lane-top-left", `${laneLeft / 10}%`);
    styles.set(panel, "--lane-top-right", `${laneRight / 10}%`);
    const toggle = toggles[index]!;
    const toggleHeight = toggle.clientHeight;
    // 车道标签（入口按钮第一个 span）中心在车道中的深度比例：0 为顶边、1 为底边
    const label = toggle.querySelector<HTMLElement>("span:first-child")!;
    const labelDepth =
      1 -
      (Number.parseFloat(getComputedStyle(label).bottom) + label.clientHeight / 2) / toggleHeight;
    // 标签水平中心：在车道顶边中点与底边中点之间按深度插值
    styles.set(
      panel,
      "--lane-label-center",
      `${(laneCenter + (100 + index * 200 - laneCenter) * labelDepth) / 10}%`,
    );
    const lane = root.querySelector(`.runway-surface [data-lane="${index}"]`)!;
    lane
      .querySelector(".runway-lane")!
      .setAttribute(
        "d",
        `M${index * 200} 460 L${laneLeft} 0 H${laneRight} L${(index + 1) * 200} 460`,
      );
    lane
      .querySelector(".runway-dashes")!
      .setAttribute("d", buildDashPath(laneCenter, 100 + index * 200, toggle.clientHeight));
  });
}

/**
 * 挂载「按场景找组件」区块的全部交互与动效
 *
 * 地址带 ?track=<赛道名> 时初始展开对应赛道；页面上任意 [data-track-jump="<赛道名>"]
 * 元素被点击时，滚动到本区块并切换到该赛道。
 * @param root 赛道根元素 [data-track-accordion]（.track-runway），其父元素须为 .track-runway-wrap
 * @returns 清理函数：移除监听、观察器、帧循环、定时器、WebGL 上下文、插入的节点与内联样式
 */
export function mountTrackAccordion(root: HTMLElement): () => void {
  const wrap = root.parentElement!;
  const panels = [...root.querySelectorAll<HTMLElement>(".track-panel")];
  const toggles = panels.map((panel) => panel.querySelector<HTMLElement>(".track-toggle")!);
  const controller = new AbortController();
  const { signal } = controller;
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const styles = createInlineStyleLedger();

  const relayout = () => layoutRunway(root, panels, toggles, styles);
  relayout();
  const resizeObserver = new ResizeObserver(relayout);
  resizeObserver.observe(wrap);
  window.addEventListener("resize", relayout, { signal });
  const disposeCrt = mountCrtDisplacement(root, reducedMotion);
  const disposeRhythm = mountRhythmGame(root, reducedMotion);

  /** 当前切换过程中的动画 */
  let enteringAnimations: Animation[] = [];
  /** 切换令牌：新的切换开始后，旧切换的动画结束回调不再生效 */
  let activationToken = 0;
  /** 当前真正展开的面板序号，-1 表示尚未展开 */
  let expandedIndex = -1;
  const details = panels.map((panel) => panel.querySelector<HTMLElement>(".track-detail")!);
  const contents = details.map(
    (detail) => detail.querySelector<HTMLElement>(".track-detail-content")!,
  );
  // 每张详情卡片里插一条扫描线，揭开卡片时自下而上扫过
  const cardScans = contents.map((content) => {
    const scan = document.createElement("span");
    scan.className = "track-card-scan";
    scan.setAttribute("aria-hidden", "true");
    content.append(scan);
    return scan;
  });
  /** 被临时设为可聚焦的详情标题，卸载时移除 tabindex（移植补充） */
  const focusedTitles = new Set<HTMLElement>();

  /** 取消切换动画并清除入场标记 */
  function cancelEntering() {
    enteringAnimations.forEach((animation) => animation.cancel());
    enteringAnimations = [];
    panels.forEach((panel) => delete panel.dataset.entering);
  }

  /** 落定展开状态：同步 data-expanded、aria 属性与 inert */
  function applyExpanded(index: number) {
    expandedIndex = index;
    panels.forEach((panel, current) => {
      const expanded = current === index;
      const detail = details[current]!;
      panel.dataset.expanded = String(expanded);
      toggles[current]!.setAttribute("aria-expanded", String(expanded));
      detail.inert = !expanded;
      detail.setAttribute("aria-hidden", String(!expanded));
    });
  }

  /**
   * 切换到指定赛道
   * @param index 目标面板序号
   * @param immediate 为 true 时不播动画直接落定（也允许重复切换到当前项）
   * @returns 是否完成了切换（被新切换打断或已是当前项时为 false）
   */
  async function activate(index: number, immediate = false): Promise<boolean> {
    if (!immediate && Number(root.dataset.active) === index) return false;
    const token = ++activationToken;
    // 先快照当前展开项路牌的实时样式（可能正处于入场动画中途），再取消动画，退场从当前姿态接续
    const outgoing =
      expandedIndex < 0
        ? []
        : [
            ...details[expandedIndex]!.querySelectorAll<HTMLElement>(
              ".track-road-sign",
            ),
          ].map((sign) => {
            const style = getComputedStyle(sign);
            return { sign, transform: style.transform, opacity: style.opacity };
          });
    cancelEntering();
    root.dataset.active = String(index);
    if (immediate || index === expandedIndex || reducedMotion.matches || document.hidden) {
      applyExpanded(index);
      return true;
    }

    const toggle = toggles[index]!;
    const toggleScan = toggle.querySelector<HTMLElement>(".runway-scan")!;
    const toggleHeight = toggle.clientHeight;
    const content = contents[index]!;
    panels[index]!.dataset.entering = "true";
    enteringAnimations = [
      // 入口按钮上的扫描线沿车道向上冲出，冲到顶后继续淡出
      toggleScan.animate(
        [
          { transform: "translateY(0)", opacity: 0, offset: 0 },
          { transform: `translateY(${-toggleHeight * 0.12}px)`, opacity: 1, offset: 0.12 },
          {
            transform: `translateY(${-toggleHeight}px)`,
            opacity: 1,
            offset: TRACK_SCAN_LEAD_MS / 580,
          },
          { transform: `translateY(${-toggleHeight * 1.32}px)`, opacity: 0, offset: 1 },
        ],
        { duration: 580, easing: "linear", fill: "both" },
      ),
      // 扫描线抵达后，详情卡片自下而上揭开
      content.animate([{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)" }], {
        delay: TRACK_SCAN_LEAD_MS,
        duration: TRACK_REVEAL_MS,
        easing: "cubic-bezier(.2,.35,.3,1)",
        fill: "both",
      }),
      // 卡片内的扫描线跟着揭开的边沿上移
      cardScans[index]!.animate(
        [
          { transform: "translateY(0)", opacity: 0.85, offset: 0 },
          { opacity: 0.65, offset: 0.75 },
          { transform: `translateY(${-content.clientHeight}px)`, opacity: 0, offset: 1 },
        ],
        {
          delay: TRACK_SCAN_LEAD_MS,
          duration: TRACK_REVEAL_MS,
          easing: "cubic-bezier(.2,.35,.3,1)",
          fill: "both",
        },
      ),
    ];
    // 旧路牌退场：左右路牌向两侧倒下
    outgoing.forEach(({ sign, transform, opacity }) => {
      const isLeft = sign.classList.contains("track-road-sign--left");
      enteringAnimations.push(
        sign.animate(
          [
            { transform, opacity },
            {
              transform: `translateX(${isLeft ? -70 : 70}px) rotate(${isLeft ? -19 : 19}deg)`,
              opacity: 0,
            },
          ],
          { duration: 280, easing: "cubic-bezier(.4,0,.8,.3)", fill: "both" },
        ),
      );
    });
    // 新路牌从两侧立起，最终角度取样式里的 --sign-tilt
    details[index]!.querySelectorAll<HTMLElement>(".track-road-sign").forEach((sign) => {
      const isLeft = sign.classList.contains("track-road-sign--left");
      const tilt = getComputedStyle(sign).getPropertyValue("--sign-tilt").trim();
      enteringAnimations.push(
        sign.animate(
          [
            {
              transform: `translateX(${isLeft ? -70 : 70}px) rotate(${isLeft ? -19 : 19}deg)`,
              opacity: 0,
            },
            { transform: `translateX(0) rotate(${tilt})`, opacity: 1 },
          ],
          {
            delay: TRACK_SCAN_LEAD_MS,
            duration: TRACK_REVEAL_MS,
            easing: "cubic-bezier(.18,.75,.25,1)",
            fill: "both",
          },
        ),
      );
    });
    try {
      await Promise.all(enteringAnimations.map((animation) => animation.finished));
    } catch {
      // 动画被取消（被新的切换打断）
      return false;
    }
    if (token !== activationToken) return false;
    applyExpanded(index);
    cancelEntering();
    return true;
  }

  const requestedTrack = new URLSearchParams(location.search).get("track");
  const requestedIndex = panels.findIndex((panel) => panel.dataset.track === requestedTrack);
  activate(requestedIndex >= 0 ? requestedIndex : Number(root.dataset.active) || 0, true);

  /** 立即落定当前赛道（跳过进行中的动画） */
  const settle = () => activate(Number(root.dataset.active) || 0, true);
  reducedMotion.addEventListener("change", settle, { signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) settle();
    },
    { signal },
  );

  toggles.forEach((toggle, index) => {
    toggle.addEventListener("click", () => activate(index), { signal });
    // 方向键在赛道间循环切换，Home / End 跳到首尾
    toggle.addEventListener(
      "keydown",
      (event) => {
        let target = index;
        if (event.key === "ArrowRight") target = (index + 1) % toggles.length;
        else if (event.key === "ArrowLeft") target = (index + toggles.length - 1) % toggles.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = toggles.length - 1;
        else return;
        event.preventDefault();
        toggles[target]!.focus({ preventScroll: true });
        activate(target);
      },
      { signal },
    );
  });

  // [data-track-jump] 可能位于页面任意位置，用文档级事件委托代替原实现的逐个绑定
  document.addEventListener(
    "click",
    async (event) => {
      const trigger =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-track-jump]")
          : null;
      if (!trigger) return;
      const index = panels.findIndex((panel) => panel.dataset.track === trigger.dataset.trackJump);
      if (index < 0) return;
      const switching = activate(index);
      root.closest(".event-subsection")!.scrollIntoView({
        block: "start",
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
      await switching;
      if (signal.aborted) return;
      if (Number(root.dataset.active) !== index || panels[index]!.dataset.expanded !== "true")
        return;
      // 切换落定后把焦点移到详情标题，方便读屏用户接着阅读
      const title = panels[index]!.querySelector<HTMLElement>(".track-detail-title")!;
      if (!title.hasAttribute("tabindex")) focusedTitles.add(title);
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    },
    { signal },
  );

  return () => {
    disposeRhythm();
    resizeObserver.disconnect();
    disposeCrt();
    activationToken++;
    cancelEntering();
    cardScans.forEach((scan) => scan.remove());
    controller.abort();
    // 以下为移植补充：还原跑道布局写入的内联样式，移除临时 tabindex
    styles.restore();
    focusedTitles.forEach((title) => title.removeAttribute("tabindex"));
    focusedTitles.clear();
  };
}
