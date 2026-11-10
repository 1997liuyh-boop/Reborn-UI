/**
 * 首页「DSH 插件」区块的横向滚动卡片，逐行移植自活动页模板的 PartnerBenefits 脚本。
 *
 * - 视口足够高时把卡片舞台吸顶（data-pinned），页面纵向滚动被换算成卡片的横向滚动，
 *   滚完全部卡片后才放行；横向滚轮与键盘聚焦也会反推页面滚动位置；
 * - 未吸顶时卡片列表首尾各有一组副本（data-benefit-loop-copy），横向滚到边缘就无缝跳回，形成无限循环；
 * - 每张卡片按离视口中心的距离写入 --benefit-depth（下沉）与 --benefit-turn（转角），形成弧形排布；
 * - 卡片舞台上叠一层 WebGL 绘制的「镜片」，两侧渐隐成白色，让卡片像在曲面上远去。
 *
 * 入口根元素是 [data-benefits-scroll]（.benefits-scroll-runway）。
 */

/** 镜片顶点着色器 */
const LENS_VERTEX_SHADER =
  "attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}";

/**
 * 镜片片元着色器：
 * - rim/fade：带弧度的白色边缘，让卡片区像是渐渐远去而不是被硬生生裁掉；
 * - bowl：中部上下缘极淡的灰色碗形阴影；
 * - 输出预乘颜色，与合成器的 alpha 模式一致：透明像素的 RGB 必须为 0。
 */
const LENS_FRAGMENT_SHADER = `precision mediump float;varying vec2 uv;
        void main(){
          vec2 p=uv*2.-1.;
          float rim=abs(p.x)+.085*p.y*p.y;
          float fade=smoothstep(.73,1.,rim);
          float bowl=.026*(1.-smoothstep(.2,.9,abs(p.x)))*smoothstep(.45,1.,abs(p.y));
          float a=max(fade,bowl);
          vec3 tint=mix(vec3(.72,.75,.79),vec3(1.),fade/max(a,.001));
          gl_FragColor=vec4(tint*a,a);
        }`;

/** 镜片层的控制句柄 */
interface BenefitsLens {
  /** 按卡片舞台的 CSS 尺寸重设画布并重绘 */
  resize: (width: number, height: number) => void;
  /** 释放 GPU 资源、丢弃上下文并移除画布 */
  dispose: () => void;
}

/**
 * 在卡片舞台里追加一张镜片画布；不支持 WebGL 或着色器编译失败时移除画布并返回 null
 * @param host 卡片舞台 .benefits-card-stage
 */
function createBenefitsLens(host: HTMLElement): BenefitsLens | null {
  const canvas = document.createElement("canvas");
  canvas.className = "benefits-lens";
  canvas.setAttribute("aria-hidden", "true");
  host.append(canvas);
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) {
    canvas.remove();
    return null;
  }

  let program: WebGLProgram | undefined;
  let buffer: WebGLBuffer | undefined;
  let lost = false;
  const shaders: WebGLShader[] = [];

  function release(): void {
    if (buffer) gl!.deleteBuffer(buffer);
    if (program) gl!.deleteProgram(program);
    shaders.splice(0).forEach(shader => gl!.deleteShader(shader));
  }

  /** 编译着色器并上传全屏三角形；失败时释放已建资源并返回 false */
  function build(): boolean {
    const context = gl!;
    try {
      for (const [type, source] of [
        [context.VERTEX_SHADER, LENS_VERTEX_SHADER],
        [context.FRAGMENT_SHADER, LENS_FRAGMENT_SHADER],
      ] as const) {
        const shader = context.createShader(type);
        if (!shader) throw new Error("Benefits lens shader unavailable");
        shaders.push(shader);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
          throw new Error(String(context.getShaderInfoLog(shader)));
      }
      const linked = context.createProgram();
      program = linked;
      shaders.forEach(shader => context.attachShader(linked, shader));
      context.linkProgram(linked);
      if (!context.getProgramParameter(linked, context.LINK_STATUS))
        throw new Error(String(context.getProgramInfoLog(linked)));
      buffer = context.createBuffer();
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), context.STATIC_DRAW);
      return true;
    }
    catch (error) {
      release();
      console.warn("Benefits lens unavailable:", error);
      return false;
    }
  }

  if (!build()) {
    // 原实现只移除画布；这里先归还上下文
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
    return null;
  }

  let lastWidth = 0;
  let lastHeight = 0;

  function resize(width: number, height: number): void {
    lastWidth = width;
    lastHeight = height;
    if (lost || !width || !height) return;
    // 像素比不超过 1.5，且画布不超过 1800×900
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 1800 / width, 900 / height);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const context = gl!;
    context.viewport(0, 0, canvas.width, canvas.height);
    context.useProgram(program!);
    context.bindBuffer(context.ARRAY_BUFFER, buffer!);
    const position = context.getAttribLocation(program!, "position");
    context.enableVertexAttribArray(position);
    context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    context.drawArrays(context.TRIANGLES, 0, 3);
  }

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    lost = true;
  };
  const onContextRestored = (): void => {
    shaders.length = 0;
    lost = !build();
    if (!lost) resize(lastWidth, lastHeight);
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  return {
    resize,
    dispose() {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      release();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    },
  };
}

/** 卡片中心点（相对滚动内容的横坐标），用于计算弧形排布 */
interface CardGeometry {
  card: HTMLElement;
  center: number;
}

/** 一次布局测量的结果 */
interface BenefitsLayout {
  /** 吸顶舞台的高度 */
  height: number;
  /** 吸顶时舞台距视口顶部的距离 */
  top: number;
  /** 第一张原始卡片居中时的 scrollLeft */
  start: number;
  /** 一整组原始卡片的横向周期宽度 */
  cycle: number;
  /** 从第一张滚到最后一张原始卡片需要的横向距离 */
  distance: number;
}

/**
 * 挂载「DSH 插件」横向滚动
 * @param root 滚动跑道根元素 [data-benefits-scroll]
 * @returns 卸载函数：停止动画、移除监听、移除镜片并还原改写过的样式
 */
export function mountPartnerBenefits(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>(".benefits-scroll-stage")!;
  const cardStage = root.querySelector<HTMLElement>(".benefits-card-stage")!;
  const viewport = root.querySelector<HTMLElement>(".benefits-scroll-viewport")!;
  const grid = root.querySelector<HTMLElement>(".partner-benefits-grid")!;
  const originals = [...root.querySelectorAll<HTMLElement>(".partner-benefit-card:not([data-benefit-loop-copy])")];
  const cards = [...root.querySelectorAll<HTMLElement>(".partner-benefit-card")];
  const controller = new AbortController();
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");

  let distance = 0;
  let top = 0;
  let start = 0;
  let cycle = 0;
  let initialized = false;
  let lens: BenefitsLens | null = null;
  let geometry: CardGeometry[] = [];
  let frameId = 0;
  let dirty = true;

  const isPinned = (): boolean => root.hasAttribute("data-pinned");

  /** 读取布局：只读不写，避免强制同步重排 */
  function measure(): BenefitsLayout {
    const height = stage.offsetHeight;
    // 顶栏高度变量由目录脚本写在页面根节点 #payathon-page 上（原站写在 <html> 上），吸顶时要避开顶栏
    const headerOffset
      = (Number.parseFloat(getComputedStyle(root.closest("#payathon-page") ?? document.documentElement).getPropertyValue("--event-header-height")) || 60)
        + 16;
    const cardCenter = cardStage.offsetTop + cardStage.offsetHeight / 2;
    const centredTop = innerHeight / 2 - cardCenter;
    const first = originals[0]!;
    const last = originals[originals.length - 1]!;
    const pitch = originals.length > 1 ? originals[1]!.offsetLeft - first.offsetLeft : first.offsetWidth;
    return {
      height,
      top: Math.max(headerOffset, Math.min(centredTop, innerHeight - height - 16)),
      start: first.offsetLeft - (viewport.clientWidth - first.offsetWidth) / 2,
      cycle: pitch * originals.length,
      distance: last.offsetLeft - first.offsetLeft,
    };
  }

  /** 应用布局：记录几何信息、按需创建镜片，并决定是否吸顶 */
  function applyLayout(layout: BenefitsLayout): void {
    distance = layout.distance;
    top = layout.top;
    start = layout.start;
    cycle = layout.cycle;
    if (!initialized) {
      viewport.scrollLeft = layout.start;
      initialized = true;
    }
    geometry = cards.map(card => ({ card, center: card.offsetLeft + card.offsetWidth / 2 }));
    if (!reducedMotion.matches && !lens) lens = createBenefitsLens(cardStage);
    lens?.resize(cardStage.clientWidth, cardStage.offsetHeight);
    const pinned = !reducedMotion.matches && layout.distance > 0 && layout.height + layout.top + 16 < innerHeight;
    root.toggleAttribute("data-pinned", pinned);
    stage.style.top = pinned ? `${layout.top}px` : "0px";
    root.style.height = pinned ? `${layout.height + layout.distance}px` : "";
  }

  function frame(): void {
    frameId = 0;
    if (document.hidden) return;
    if (dirty) {
      applyLayout(measure());
      dirty = false;
    }

    // 吸顶时：跑道顶边越过吸顶位置的纵向距离，即卡片的横向滚动量
    if (isPinned()) {
      const target = start + Math.max(0, Math.min(distance, top - root.getBoundingClientRect().top));
      if (Math.abs(viewport.scrollLeft - target) > 0.5) viewport.scrollLeft = target;
    }

    // 弧形排布：offset 为卡片中心离视口中心的归一化距离，限制在 ±1.4
    const halfWidth = viewport.clientWidth / 2;
    for (const { card, center } of geometry) {
      const offset = Math.max(-1.4, Math.min(1.4, (center - viewport.scrollLeft - halfWidth) / halfWidth));
      const depth = -64 * Math.max(0, 1 - offset * offset);
      card.style.setProperty("--benefit-depth", reducedMotion.matches ? "0px" : `${depth.toFixed(1)}px`);
      card.style.setProperty("--benefit-turn", reducedMotion.matches ? "0deg" : `${(-offset * 18).toFixed(2)}deg`);
    }
  }

  function schedule(): void {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  function invalidate(): void {
    dirty = true;
    schedule();
  }

  const resizeObserver = new ResizeObserver(invalidate);
  resizeObserver.observe(stage);
  resizeObserver.observe(viewport);
  resizeObserver.observe(grid);

  // 未吸顶时的无限循环：越过半张卡片的边界就整组跳回
  viewport.addEventListener(
    "scroll",
    () => {
      if (!isPinned() && cycle > 0) {
        const margin = cycle / originals.length / 2;
        if (viewport.scrollLeft < start - margin) viewport.scrollLeft += cycle;
        else if (viewport.scrollLeft >= start + cycle - margin) viewport.scrollLeft -= cycle;
      }
      schedule();
    },
    { passive: true, signal: controller.signal },
  );

  // 吸顶时把横向滚轮（或 Shift + 纵向滚轮）换算成页面纵向滚动
  viewport.addEventListener(
    "wheel",
    (event) => {
      if (!isPinned() || reducedMotion.matches || event.ctrlKey || event.defaultPrevented || !event.cancelable)
        return;
      const delta = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX;
      if (!delta || (!event.shiftKey && Math.abs(delta) <= Math.abs(event.deltaY))) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
      event.preventDefault();
      window.scrollBy({ top: delta * unit, behavior: "instant" });
    },
    { passive: false, signal: controller.signal },
  );

  window.addEventListener("scroll", schedule, { passive: true, signal: controller.signal });
  window.addEventListener("resize", invalidate, { signal: controller.signal });
  document.addEventListener("visibilitychange", invalidate, { signal: controller.signal });
  reducedMotion.addEventListener("change", invalidate, { signal: controller.signal });

  // 吸顶时键盘聚焦到某张卡片：把页面滚到让这张卡片居中的位置
  viewport.addEventListener(
    "focusin",
    (event) => {
      const card = (event.target as Element).closest<HTMLElement>(".partner-benefit-card");
      if (!card || !isPinned()) return;
      const scrollLeft = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
      const offset = Math.max(0, Math.min(distance, scrollLeft - start));
      window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - top + offset, behavior: "instant" });
    },
    { signal: controller.signal },
  );

  invalidate();

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    controller.abort();
    root.removeAttribute("data-pinned");
    root.style.height = "";
    stage.style.top = "";
    lens?.dispose();
    for (const card of cards) {
      card.style.removeProperty("--benefit-depth");
      card.style.removeProperty("--benefit-turn");
    }
  };
}
