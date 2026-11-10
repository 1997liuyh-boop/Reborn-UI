import { observeActivity } from "./activity";

/**
 * 字形「色散」交互：指针靠近文字时，字形被推开并拆出两道错位的色层（类似 RGB 色差），
 * 快速划过时还会沿划动方向被「踢」一下；指针离开后弹回原位。
 *
 * 作用对象按容器区分：
 * - 首屏、页脚潮汐：.reveal-ink 与副标题里的文字逐字拆成 span，另含时间数字、标题上方的标志图、标题 SVG 字形；
 * - 英文小标题（.event-english-title）：SVG 字母，指针在整个窗口内移动都算数，靠近时字色向白色混合；
 * - 合作伙伴滚动条（.race-partners-window）：只作用于 logo 图片，位置按轨道内的偏移实时换算；
 * - 排行榜（[data-ranking-rows]）：作品名、赛道、名次、指标的文字，力度减为四分之一。
 */

interface GlyphTarget {
  node: HTMLElement | SVGGraphicsElement;
  /** SVG 字形：用克隆出的两层色层表现色散 */
  svg: boolean;
  /** 矢量元素（数字、图片）：用 drop-shadow 表现色散 */
  vector?: boolean;
  /** 图片：缩放比例按渲染宽度 / 布局宽度计算 */
  image?: boolean;
  /** 指针影响程度，0 到 1 */
  amount: number;
  /** 当前位移 */
  x: number;
  y: number;
  /** 划动「踢」出的附加位移 */
  kickX: number;
  kickY: number;
  /** 去掉自身位移后的中心点（视口坐标） */
  cx: number;
  cy: number;
  /** 节点在屏幕上的缩放，位移要除以它换算回本地坐标 */
  scale: number;
  /** 合作伙伴条：相对轨道的中心点 */
  localX?: number;
  localY?: number;
  /** 本帧是否画过色散，用于判断要不要清理样式 */
  painted?: boolean;
  /** SVG 字形的两层色层 */
  layers?: SVGGElement[];
}

interface Stroke {
  /** 上一个指针点 */
  ax: number;
  ay: number;
  /** 当前指针点 */
  x: number;
  y: number;
  /** 由划动速度换算的力度，0 到 1 */
  power: number;
}

interface PointerSample {
  x: number;
  y: number;
  time: number;
}

/** 影响半径（px）：指针在这个距离内才推动字形 */
const INFLUENCE_RADIUS = 85;
/** 两道色层的颜色，取首屏调色板写入的变量，没有时用原站默认的青色与橙色 */
const FORWARD_SVG = "var(--payathon-split-forward-svg, #21b8ffe6)";
const BACKWARD_SVG = "var(--payathon-split-backward-svg, #ff8623e6)";

/** 在一组容器上挂载字形交互，返回统一的清理函数 */
export function mountInteractiveGlyphsAll(containers: Iterable<Element>): () => void {
  const cleanups = [...containers].map((el) => mountInteractiveGlyphs(el as HTMLElement));
  return () => cleanups.forEach((fn) => fn());
}

/** 在单个容器上挂载字形交互 */
export function mountInteractiveGlyphs(container: HTMLElement): () => void {
  const isRanking = container.hasAttribute("data-ranking-rows");
  const isEnglishTitle = container.classList.contains("event-english-title");
  const isPartnerStrip = container.classList.contains("race-partners-window");
  // 英文小标题在整个窗口内响应指针，其余只在容器内
  const pointerTarget: Window | HTMLElement = isEnglishTitle ? window : container;
  const partnerTrack = isPartnerStrip ? container.querySelector<HTMLElement>(".race-partners-track") : null;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const targets: GlyphTarget[] = [];
  const splitSpans: HTMLSpanElement[] = [];

  const newTarget = (node: GlyphTarget["node"], extra: Partial<GlyphTarget> = {}): GlyphTarget => ({
    node,
    svg: false,
    amount: 0,
    x: 0,
    y: 0,
    kickX: 0,
    kickY: 0,
    cx: 0,
    cy: 0,
    scale: 1,
    ...extra,
  });

  // 把文字逐字拆成 span，倒计时内部的文字除外（它有自己的 SVG 数字）
  const textSelector = isRanking
    ? ".ranking-work strong, .ranking-work small, .ranking-track, .ranking-number > span, .ranking-metric > span"
    : ".reveal-ink, .payathon-subtitle-label";
  for (const host of container.querySelectorAll(textSelector)) {
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if (!current.parentElement?.closest("[data-countdown], [data-clock]")) textNodes.push(current);
    }
    for (const textNode of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const char of textNode.textContent ?? "") {
        if (/\s/.test(char)) {
          fragment.append(char);
          continue;
        }
        const span = document.createElement("span");
        span.className = "interactive-glyph";
        span.textContent = char;
        fragment.append(span);
        splitSpans.push(span);
        targets.push(newTarget(span));
      }
      textNode.replaceWith(fragment);
    }
  }
  for (const digit of container.querySelectorAll<HTMLElement>("[data-countdown-digit], [data-clock-digit]")) {
    targets.push(newTarget(digit, { vector: true }));
  }
  for (const logo of container.querySelectorAll<HTMLElement>(".payathon-aipay-logo")) {
    targets.push(newTarget(logo, { vector: true, image: true }));
  }
  for (const glyph of container.querySelectorAll<SVGGraphicsElement>(".payathon-name [data-title-char], [data-tide-logo] path, .english-heading use")) {
    targets.push(newTarget(glyph, { svg: true }));
  }
  if (isPartnerStrip) {
    for (const logo of container.querySelectorAll<HTMLElement>(".race-partners-list img")) {
      targets.push(newTarget(logo, { vector: true, image: true }));
    }
  }

  /** SVG 字形的两道色层：克隆字形放在原字形之前，去掉 id 与 data-* 避免重复 */
  const ensureLayers = (target: GlyphTarget): SVGGElement[] => {
    if (!target.layers) {
      target.layers = [FORWARD_SVG, BACKWARD_SVG].map((color) => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const clone = target.node.cloneNode(true) as SVGElement;
        for (const el of [clone, ...clone.querySelectorAll<SVGElement>("*")]) {
          for (const attr of [...el.attributes]) {
            if (attr.name === "id" || attr.name.startsWith("data-")) el.removeAttribute(attr.name);
          }
          el.style.removeProperty("transform");
          el.style.removeProperty("filter");
          el.style.opacity = "1";
          el.style.color = color;
          if (el.getAttribute("fill") !== "none") el.style.fill = color;
        }
        group.setAttribute("aria-hidden", "true");
        group.style.pointerEvents = "none";
        group.append(clone);
        target.node.before(group);
        return group;
      });
    }
    return target.layers;
  };

  let pointer: PointerSample | null = null;
  let frame = 0;
  let lastTime = 0;
  let needsMeasure = true;
  let active = false;
  let lastSample: PointerSample | null = null;
  const strokes: Stroke[] = [];
  let baseColor = "";
  let titleBounds: { left: number; right: number; top: number; bottom: number } | null = null;

  /** 测量各字形去掉自身位移后的中心点与缩放 */
  const measure = () => {
    if (isEnglishTitle) baseColor = getComputedStyle(container).color;
    for (const target of targets) {
      if (isPartnerStrip) {
        const parent = target.node.parentElement as HTMLElement;
        target.localX = parent.offsetLeft + parent.offsetWidth / 2;
        target.localY = parent.offsetTop + parent.offsetHeight / 2;
        target.scale = 1;
        continue;
      }
      const rect = target.node.getBoundingClientRect();
      target.cx = rect.x + rect.width / 2 - target.x;
      target.cy = rect.y + rect.height / 2 - target.y;
      if (target.svg) {
        const ctm = (target.node as SVGGraphicsElement).getScreenCTM();
        target.scale = Math.hypot(ctm?.a ?? 1, ctm?.b ?? 0);
      }
      else if (target.image) {
        target.scale = rect.width / ((target.node as HTMLElement).offsetWidth || rect.width || 1);
      }
      else {
        target.scale = 1;
      }
    }
    if (isEnglishTitle) {
      titleBounds = {
        left: Math.min(...targets.map((t) => t.cx)) - INFLUENCE_RADIUS,
        right: Math.max(...targets.map((t) => t.cx)) + INFLUENCE_RADIUS,
        top: Math.min(...targets.map((t) => t.cy)) - INFLUENCE_RADIUS,
        bottom: Math.max(...targets.map((t) => t.cy)) + INFLUENCE_RADIUS,
      };
    }
    needsMeasure = false;
  };

  /** 清掉一个字形上的位移与色散样式 */
  const clearTarget = (target: GlyphTarget) => {
    if (isPartnerStrip && !target.painted) return;
    target.painted = false;
    target.layers?.forEach((layer) => (layer.style.display = "none"));
    target.node.style.removeProperty("transform");
    target.node.style.removeProperty("text-shadow");
    target.node.style.removeProperty("filter");
    if (isEnglishTitle) target.node.style.removeProperty("color");
  };

  const partnerHasError = () => !!container.closest(".race-partners")?.hasAttribute("data-error");

  const tick = (now: number) => {
    frame = 0;
    if (!active || document.hidden || reducedMotion.matches) return;
    if (isPartnerStrip && partnerHasError()) {
      reset();
      return;
    }
    if (needsMeasure) measure();
    if (isPartnerStrip && partnerTrack) {
      // 滚动条在动，logo 中心每帧按轨道当前位置换算
      const trackRect = partnerTrack.getBoundingClientRect();
      for (const target of targets) {
        target.cx = trackRect.left + (target.localX ?? 0);
        target.cy = trackRect.top + (target.localY ?? 0);
      }
    }
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
    lastTime = now;
    let moving = false;
    const pendingStrokes = strokes.splice(0);
    // 首屏要等口号入场完毕才响应；其余容器始终响应
    const responsive = container.hasAttribute("data-text-entered") || container.hasAttribute("data-tide-footer") || isEnglishTitle || isPartnerStrip || isRanking;

    for (const target of targets) {
      const distance = pointer ? Math.hypot(target.cx - pointer.x, target.cy - pointer.y) : 1000;
      const goal = responsive ? Math.max(0, 1 - distance / INFLUENCE_RADIUS) ** 1.5 : 0;
      target.amount += (goal - target.amount) * (1 - Math.exp(-dt * 10));
      const kickDecay = Math.exp(-dt * (isPartnerStrip ? 8 : 4.5));
      target.kickX *= kickDecay;
      target.kickY *= kickDecay;

      if (responsive) {
        // 划动：取字形到划动线段的最近距离，越近、划得越快，踢得越狠
        for (const stroke of pendingStrokes) {
          const dx = stroke.x - stroke.ax;
          const dy = stroke.y - stroke.ay;
          const lengthSq = dx * dx + dy * dy;
          const along = lengthSq ? Math.max(0, Math.min(1, ((target.cx - stroke.ax) * dx + (target.cy - stroke.ay) * dy) / lengthSq)) : 0;
          const gap = Math.hypot(target.cx - stroke.ax - along * dx, target.cy - stroke.ay - along * dy);
          const force = Math.max(0, 1 - gap / INFLUENCE_RADIUS) ** 1.5 * stroke.power * 36 * (isRanking ? 0.25 : 1);
          if (force > Math.hypot(target.kickX, target.kickY)) {
            const length = Math.sqrt(lengthSq) || 1;
            target.kickX = (dx / length) * force;
            target.kickY = (dy / length) * force;
          }
        }
      }

      if (target.amount < 0.005 && !goal && Math.hypot(target.kickX, target.kickY) < 0.08 && (!isPartnerStrip || Math.hypot(target.x, target.y) < 0.025)) {
        target.amount = 0;
        target.x = target.y = target.kickX = target.kickY = 0;
        clearTarget(target);
        continue;
      }

      moving = true;
      target.painted = true;
      // 缓慢流动的扰动波，让被推开的字形带一点摇摆
      const wave = Math.sin(now * 0.003 - target.cx * 0.035 + target.cy * 0.012);
      const awayX = pointer ? target.cx - pointer.x : target.x;
      const awayY = pointer ? target.cy - pointer.y : target.y;
      const awayLength = Math.hypot(awayX, awayY);
      const dirX = awayLength > 0.5 ? awayX / awayLength : 1;
      const dirY = awayLength > 0.5 ? awayY / awayLength : 0;
      const strength = isRanking ? 0.25 : 1;
      const goalX = (dirX * 11 - dirY * wave * 3) * target.amount * strength + target.kickX;
      const goalY = (dirY * 11 + dirX * wave * 3) * target.amount * strength + target.kickY;
      const ease = 1 - Math.exp(-dt * 14);
      target.x += (goalX - target.x) * ease;
      target.y += (goalY - target.y) * ease;

      // 色散偏移取位移的 42%
      const splitX = target.x * 0.42;
      const splitY = target.y * 0.42;
      const scale = target.scale;

      if (isEnglishTitle) {
        const whiten = Math.min(1, Math.max(target.amount * 1.8, Math.hypot(target.kickX, target.kickY) / 12));
        target.node.style.color = `color-mix(in srgb, ${baseColor}, white ${whiten * 100}%)`;
      }
      target.node.style.transform = `translate(${target.x / scale}px,${target.y / scale}px) skewX(${wave * target.amount * 3}deg)`;

      if (target.svg) {
        ensureLayers(target).forEach((layer, index) => {
          const sign = index === 0 ? 1 : -1;
          layer.style.display = "";
          layer.style.transform = `translate(${(target.x + sign * splitX) / scale}px,${(target.y + sign * splitY) / scale}px) skewX(${wave * target.amount * 3}deg)`;
        });
      }
      else if (target.vector) {
        // 合作伙伴 logo 的色层随偏移量渐显，避免轻微抖动也出现彩边
        const reveal = isPartnerStrip ? Math.min(1, Math.hypot(splitX, splitY) / 2) : 1;
        const mix = reveal * reveal * (3 - 2 * reveal) * 100;
        const forward = isPartnerStrip ? `color-mix(in srgb, ${FORWARD_SVG} ${mix}%, transparent)` : FORWARD_SVG;
        const backward = isPartnerStrip ? `color-mix(in srgb, ${BACKWARD_SVG} ${mix}%, transparent)` : BACKWARD_SVG;
        target.node.style.filter = `drop-shadow(${splitX / scale}px ${splitY / scale}px 0px ${forward}) drop-shadow(${-splitX / scale}px ${-splitY / scale}px 0px ${backward})`;
      }
      else {
        target.node.style.textShadow = `${splitX}px ${splitY}px var(--payathon-split-forward-text, #21b8ffe6), ${-splitX}px ${-splitY}px var(--payathon-split-backward-text, #ff8623e6)${isRanking ? ", 0 1px 2px #000b" : ""}`;
      }
    }
    if (moving || (isPartnerStrip && pointer)) frame = requestAnimationFrame(tick);
  };

  const schedule = () => {
    if (!frame && active && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "touch" || !active || document.hidden || reducedMotion.matches || (isPartnerStrip && partnerHasError())) return;
    if (isEnglishTitle && needsMeasure) measure();
    const now = performance.now();
    const sample: PointerSample = { x: event.clientX, y: event.clientY, time: now };
    if (isEnglishTitle && titleBounds) {
      // 英文标题监听整个窗口：指针（或刚划过的线段）不在标题附近时忽略
      const bounds = titleBounds;
      const inside = sample.x >= bounds.left && sample.x <= bounds.right && sample.y >= bounds.top && sample.y <= bounds.bottom;
      const crossed = lastSample
        && now - lastSample.time < 200
        && Math.max(lastSample.x, sample.x) >= bounds.left
        && Math.min(lastSample.x, sample.x) <= bounds.right
        && Math.max(lastSample.y, sample.y) >= bounds.top
        && Math.min(lastSample.y, sample.y) <= bounds.bottom;
      if (!inside && !crossed) {
        const hadPointer = pointer !== null;
        pointer = null;
        lastSample = sample;
        if (hadPointer) schedule();
        return;
      }
    }
    if (lastSample) {
      const elapsed = (now - lastSample.time) / 1000;
      if (elapsed > 0 && elapsed < 0.2) {
        const speed = Math.hypot(sample.x - lastSample.x, sample.y - lastSample.y) / Math.max(0.004, elapsed);
        strokes.push({ ax: lastSample.x, ay: lastSample.y, x: sample.x, y: sample.y, power: Math.min(1, Math.max(0, (speed - 80) / 1800)) });
        if (strokes.length > 24) strokes.shift();
      }
    }
    lastSample = sample;
    pointer = sample;
    schedule();
  };

  const onPointerLeave = () => {
    pointer = null;
    lastSample = null;
    schedule();
  };

  const invalidate = () => {
    needsMeasure = true;
    schedule();
  };

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    pointer = null;
    lastSample = null;
    strokes.length = 0;
    for (const target of targets) {
      target.amount = 0;
      target.x = target.y = target.kickX = target.kickY = 0;
      clearTarget(target);
    }
  }

  const syncActivity = () => {
    if (document.hidden || reducedMotion.matches || !active) reset();
    else invalidate();
  };

  const stopActivity = observeActivity(container, (running) => {
    active = running;
    syncActivity();
  });
  const resizeObserver = new ResizeObserver(invalidate);
  resizeObserver.observe(container);
  if (partnerTrack) resizeObserver.observe(partnerTrack);

  container.addEventListener("pointerenter", invalidate);
  pointerTarget.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
  pointerTarget.addEventListener("pointerleave", onPointerLeave);
  container.addEventListener("animationend", invalidate);
  container.addEventListener("transitionend", invalidate);
  window.addEventListener("scroll", invalidate, { passive: true });
  document.addEventListener("visibilitychange", syncActivity);
  reducedMotion.addEventListener("change", syncActivity);

  return () => {
    reset();
    stopActivity();
    resizeObserver.disconnect();
    container.removeEventListener("pointerenter", invalidate);
    pointerTarget.removeEventListener("pointermove", onPointerMove as EventListener);
    pointerTarget.removeEventListener("pointerleave", onPointerLeave);
    container.removeEventListener("animationend", invalidate);
    container.removeEventListener("transitionend", invalidate);
    window.removeEventListener("scroll", invalidate);
    document.removeEventListener("visibilitychange", syncActivity);
    reducedMotion.removeEventListener("change", syncActivity);
    for (const target of targets) target.layers?.forEach((layer) => layer.remove());
    // 拆开的字还原成纯文本
    for (const span of splitSpans) span.replaceWith(span.textContent ?? "");
  };
}
