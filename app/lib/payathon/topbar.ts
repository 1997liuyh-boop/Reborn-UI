/**
 * 顶栏的几处细节，原站打包在站点公共顶栏脚本里：
 * - 「Agent 友好」徽章底下的 WebGL 材质：一块带细颗粒、机加工边沿的深色圆角板，随主题反转明暗；
 * - 标志反色：采样标志正下方的页面背景亮度，滚到浅色区块时标志换成深色版本（data-logo-tone）；
 * - 子菜单列的滑动高亮块：指针在资源链接之间移动时，一块底色从上一个链接滑到下一个；
 * - 子菜单里产品图标的弹簧缩放：悬停时图标先缩一下再弹回，同时剪影淡出、彩色细节淡入；
 *   Agent 产品图标的三瓣会朝悬停的子项方向移动。
 * 原站这些脚本作用于整页，这里都限定在传入的顶栏元素内。
 */

/* ── 徽章材质 ─────────────────────────────────────────────────────── */

/** 徽章材质片元着色器：斜切的圆角矩形，左暗右亮的渐变、细颗粒、内侧细缝与外沿高光 */
const BADGE_FRAGMENT = `
precision highp float;
uniform vec2 size;
uniform float theme;
varying vec2 uv;
float roundBox(vec2 p, vec2 b, float r) {
  vec2 q=abs(p)-b+r;
  return length(max(q,0.))+min(max(q.x,q.y),0.)-r;
}
void main(){
  vec2 p=(uv-.5)*size;
  p.x-=.1337*p.y;
  float d=roundBox(p,vec2(size.x*.5-3.,size.y*.5-1.),4.);
  float mask=1.-smoothstep(-.65,.65,d);
  float top=uv.y;
  float ramp=mix(uv.x,1.-uv.x,theme);
  vec3 base=vec3(mix(.045,.20,ramp)+theme*.04);
  float grain=fract(sin(dot(floor(uv*size*2.),vec2(12.9898,78.233)))*43758.5453);
  base+=(grain-.5)*.009;
  float rim=exp(-abs(d+1.1)*2.3);
  float seam=exp(-abs(d+2.4)*2.8);
  base+=rim*mix(.035,.10,top)-seam*.018;
  vec3 color=base;
  gl_FragColor=vec4(color*mask,mask);
}`;
// 着色器说明：p.x 的错切与吉祥物的倾斜一致，但不让徽章上的文字跟着斜；
// ramp 抵消外层的主题反转，两种主题下都是左暗右亮；外沿是细的机加工高光，内侧压一道暗缝而不是大面积发光。

const BADGE_VERTEX = "attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}";

/** 在徽章里画材质画布；徽章尚未布局（宽高为 0）时等它有尺寸再画 */
export function mountAgentBadgeMaterial(badge: HTMLElement): () => void {
  let release: (() => void) | undefined;
  let disposed = false;
  const waiter = new ResizeObserver((entries) => {
    if (!disposed && !release && entries.some((entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0)) {
      release = paintBadgeMaterial(badge);
      waiter.disconnect();
    }
  });
  if (badge.offsetWidth > 0 && badge.offsetHeight > 0) release = paintBadgeMaterial(badge);
  else waiter.observe(badge);
  return () => {
    if (disposed) return;
    disposed = true;
    waiter.disconnect();
    release?.();
  };
}

function paintBadgeMaterial(badge: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "siteMenuAgentMaterial";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) return () => {};
  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(gl.VERTEX_SHADER, BADGE_VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, BADGE_FRAGMENT);
  const program = gl.createProgram();
  const fail = () => {
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return () => {};
  };
  if (!vertex || !fragment || !program) return fail();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fail();
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const sizeLocation = gl.getUniformLocation(program, "size");
  const themeLocation = gl.getUniformLocation(program, "theme");
  const controller = new AbortController();
  let frame = 0;
  let visible = false;
  let disposed = false;
  let contextLost = false;
  let lastTheme = -1;
  let dirty = true;
  badge.prepend(canvas);

  /** 只有主题反转程度变了（或尺寸变了）才重画 */
  const draw = () => {
    frame = 0;
    if (disposed || contextLost || !visible || document.hidden) return;
    const theme = Number.parseFloat(getComputedStyle(badge).getPropertyValue("--agent-badge-invert")) || 0;
    if (!dirty && theme === lastTheme) return;
    lastTheme = theme;
    dirty = false;
    gl.uniform1f(themeLocation, lastTheme);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (!badge.hasAttribute("data-agent-material")) badge.setAttribute("data-agent-material", "");
  };
  const schedule = () => {
    if (!frame && !disposed && !contextLost && visible && !document.hidden) frame = requestAnimationFrame(draw);
  };
  /** 画布比徽章宽 8px、高 2px，留出外沿高光的位置 */
  const resize = () => {
    if (disposed || contextLost) return;
    const width = badge.offsetWidth + 8;
    const height = badge.offsetHeight + 2;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(sizeLocation, width, height);
    dirty = true;
    schedule();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(badge);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible) {
      dirty = true;
      schedule();
    }
    else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  intersection.observe(badge);
  // 主题与顶栏底色切换会改写页面根节点的样式或属性，此时重读反转程度
  const themeObserver = new MutationObserver(schedule);
  const page = badge.closest("#payathon-page") ?? document.body;
  themeObserver.observe(page, { attributes: true, attributeFilter: ["style", "data-bento-nav-dark", "data-developer-nav"] });
  themeObserver.observe(badge, { attributes: true, attributeFilter: ["data-summary-background-dark"] });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    else {
      dirty = true;
      schedule();
    }
  }, { signal: controller.signal });
  canvas.addEventListener("webglcontextlost", () => {
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    badge.removeAttribute("data-agent-material");
  }, { signal: controller.signal });
  document.fonts.ready.then(() => {
    if (!disposed) resize();
  });
  resize();

  return () => {
    if (disposed) return;
    disposed = true;
    controller.abort();
    resizeObserver.disconnect();
    intersection.disconnect();
    themeObserver.disconnect();
    cancelAnimationFrame(frame);
    badge.removeAttribute("data-agent-material");
    canvas.remove();
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}

/* ── 标志反色 ─────────────────────────────────────────────────────── */

/**
 * 每次滚动后取标志中心点下方的元素栈，跳过顶栏自身，找到第一个不透明背景，
 * 按相对亮度（大于 0.45 视为浅色）给顶栏写 data-logo-tone=light / dark
 */
export function mountLogoTone(header: HTMLElement): () => void {
  const logo = header.querySelector<HTMLElement>(".brandLogo");
  if (!logo) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;

  const sample = () => {
    frame = 0;
    if (document.hidden) return;
    const rect = logo.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    let tone = "dark";
    for (const el of document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)) {
      if (header.contains(el)) continue;
      const rgba = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if (!rgba || rgba.length < 3 || (rgba[3] ?? 1) < 0.5) continue;
      // sRGB 转线性后算相对亮度
      const [r, g, b] = rgba.slice(0, 3).map((channel) => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      }) as [number, number, number];
      tone = r * 0.2126 + g * 0.7152 + b * 0.0722 > 0.45 ? "light" : "dark";
      break;
    }
    if (header.dataset.logoTone !== tone) header.dataset.logoTone = tone;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(sample);
  };
  window.addEventListener("scroll", schedule, { passive: true, signal });
  window.addEventListener("resize", schedule, { passive: true, signal });
  document.addEventListener("visibilitychange", schedule, { signal });
  window.addEventListener("aipay:theme-change", schedule, { signal });
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(document.body);
  resizeObserver.observe(logo);
  const readyObserver = new MutationObserver(schedule);
  readyObserver.observe(header, { attributes: true, attributeFilter: ["data-ready"] });
  schedule();

  return () => {
    controller.abort();
    resizeObserver.disconnect();
    readyObserver.disconnect();
    cancelAnimationFrame(frame);
    header.removeAttribute("data-logo-tone");
  };
}

/* ── 子菜单列的滑动高亮 ─────────────────────────────────────────────── */

/** 每列前面插一块高亮底，指针或焦点在资源链接上时滑到该链接下方 */
export function mountMegaHighlights(header: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const cleanups: Array<() => void> = [];
  header.querySelectorAll<HTMLElement>(".siteMenuContent .megaCol").forEach((column) => {
    const highlight = document.createElement("div");
    highlight.className = "megaColumnHighlight";
    highlight.setAttribute("aria-hidden", "true");
    column.prepend(highlight);
    column.dataset.movingHighlight = "";
    let current: HTMLElement | null = null;
    let hovered: HTMLElement | null = null;
    let focused: HTMLElement | null = null;
    const resourceOf = (target: EventTarget | null) => {
      const link = target instanceof Element ? target.closest<HTMLElement>("a.megaResource") : null;
      return link && column.contains(link) ? link : null;
    };
    const place = () => {
      if (!current) return;
      const columnRect = column.getBoundingClientRect();
      const rect = current.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        highlight.style.opacity = "0";
        return;
      }
      highlight.style.transform = `translate3d(${rect.left - columnRect.left}px,${rect.top - columnRect.top}px,0)`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.opacity = "1";
    };
    const sync = () => {
      const next = hovered || focused;
      if (next === current) return;
      // 从无到有时直接出现在目标处，不从左上角滑过来
      const appearing = !current;
      current = next;
      if (!next) {
        highlight.style.opacity = "0";
        return;
      }
      if (appearing) highlight.style.transition = "none";
      place();
      if (appearing) {
        void highlight.offsetWidth;
        highlight.style.removeProperty("transition");
      }
    };
    column.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      const link = resourceOf(event.target);
      if (link) {
        hovered = link;
        sync();
      }
    }, { signal });
    column.addEventListener("pointerleave", () => {
      hovered = null;
      sync();
    }, { signal });
    column.addEventListener("focusin", (event) => {
      focused = resourceOf(event.target);
      sync();
    }, { signal });
    column.addEventListener("focusout", (event) => {
      focused = resourceOf(event.relatedTarget);
      sync();
    }, { signal });
    const resizeObserver = new ResizeObserver(place);
    resizeObserver.observe(column);
    column.querySelectorAll("a.megaResource").forEach((link) => resizeObserver.observe(link));
    cleanups.push(() => {
      resizeObserver.disconnect();
      highlight.remove();
      delete column.dataset.movingHighlight;
    });
  });
  return () => {
    controller.abort();
    cleanups.forEach((fn) => fn());
  };
}

/* ── 子菜单产品图标 ─────────────────────────────────────────────── */

/** Agent 产品图标三瓣的静止位置（图标 SVG 坐标） */
const AGENT_LOBE_ORIGINS: Record<string, { x: number; y: number }> = {
  "office-agent-pay": { x: 363.237, y: 174 },
  "mobile-agent-pay": { x: 187.467, y: 478.441 },
  "device-agent-pay": { x: 539.008, y: 478.445 },
};

/** 产品图标的弹簧缩放与细节渐显，以及 Agent 图标三瓣朝悬停子项移动 */
export function mountMegaLogoMotion(header: HTMLElement): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  const cleanups: Array<() => void> = [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  header.querySelectorAll<HTMLElement>(".siteMenuContent .megaResourceLogo").forEach((logo) => {
    const resource = logo.closest<HTMLElement>(".megaResource");
    if (!resource) return;
    const detail = logo.querySelector<SVGElement | HTMLElement>(".navProductDetail");
    const silhouette = logo.querySelector<SVGElement | HTMLElement>(".navProductSilhouette");
    const lobes = [...logo.querySelectorAll<SVGElement>("[data-agent-lobe]")];
    let hovered = false;
    let focused = false;
    let engaged = false;
    let frame = 0;
    let lastNow = 0;
    /** 按下阶段持续到这个时间点，之后弹回 */
    let pressUntil = 0;
    let scale = 1;
    let velocity = 0;
    let reveal = 0;
    let revealFrom = 0;
    let minScale = 1;
    let rebound = 0;
    let settling = false;

    /** 细节与剪影的交叉淡入淡出，三瓣从灰变白 */
    const setReveal = (value: number) => {
      reveal = value;
      if (detail) {
        detail.style.transition = "none";
        detail.style.opacity = String(value);
      }
      if (silhouette) {
        silhouette.style.transition = "none";
        silhouette.style.opacity = String(1 - value);
      }
      const gray = Math.round(170 + 85 * value);
      lobes.forEach((lobe) => {
        lobe.style.transition = "transform 420ms cubic-bezier(.22,1,.36,1)";
        lobe.style.fill = `rgb(${gray} ${gray} ${gray})`;
      });
    };
    setReveal(0);

    const settle = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      scale = 1;
      velocity = 0;
      logo.style.removeProperty("scale");
      setReveal(engaged ? 1 : 0);
    };

    /** 弹簧积分：按下阶段目标缩到 0.86（离开时 0.953），之后回到 1；回弹过程中按进度推进细节渐显 */
    const step = (now: number) => {
      const dt = Math.min((now - lastNow) / 1000, 0.032) * 0.72;
      lastNow = now;
      const target = now < pressUntil ? 1 - 0.14 * (engaged ? 1 : 1 / 3) : 1;
      const substeps = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / substeps;
      for (let i = 0; i < substeps; i++) {
        if (rebound >= 1 && velocity <= 0) settling = true;
        velocity += ((target - scale) * 720 - velocity * (settling ? 12 : 20)) * h;
        scale += velocity * h;
      }
      logo.style.scale = String(scale);
      minScale = Math.min(minScale, scale);
      if (now >= pressUntil && velocity > 0) {
        rebound = Math.max(rebound, Math.min(1, Math.max(0, (scale - minScale) / Math.max(0.01, 1 - minScale))));
        setReveal(revealFrom + ((engaged ? 1 : 0) - revealFrom) * rebound);
      }
      if (now >= pressUntil && Math.abs(scale - 1) < 0.001 && Math.abs(velocity) < 0.01) {
        settle();
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const sync = () => {
      const next = hovered || focused;
      if (next === engaged) return;
      engaged = next;
      revealFrom = reveal;
      minScale = scale;
      rebound = 0;
      settling = false;
      if (reducedMotion.matches || document.hidden) {
        settle();
        return;
      }
      pressUntil = performance.now() + 85 / 0.72;
      if (!frame) {
        lastNow = performance.now();
        frame = requestAnimationFrame(step);
      }
    };

    resource.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      hovered = true;
      sync();
    }, { signal });
    resource.addEventListener("pointerleave", () => {
      hovered = false;
      sync();
    }, { signal });
    resource.addEventListener("focus", () => {
      focused = resource.matches(":focus-visible");
      sync();
    }, { signal });
    resource.addEventListener("blur", () => {
      focused = false;
      sync();
    }, { signal });
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) settle();
    }, { signal });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) settle();
    }, { signal });
    cleanups.push(() => {
      settle();
      for (const el of [detail, silhouette]) {
        el?.style.removeProperty("opacity");
        el?.style.removeProperty("transition");
      }
      lobes.forEach((lobe) => {
        lobe.style.removeProperty("fill");
        lobe.style.removeProperty("transition");
      });
    });
  });

  header.querySelectorAll<SVGGraphicsElement>(".navAgentLogo").forEach((logo) => {
    const column = logo.closest<HTMLElement>(".megaCol");
    if (!column) return;
    const lobes = [...logo.querySelectorAll<SVGPathElement>("[data-agent-lobe]")];
    // 原位留一个灰色占位，三瓣移走后图标不缺块
    const placeholders = new Map(lobes.map((lobe) => {
      const placeholder = document.createElementNS("http://www.w3.org/2000/svg", "path");
      placeholder.setAttribute("d", lobe.getAttribute("d") ?? "");
      placeholder.setAttribute("fill", "#888");
      placeholder.classList.add("navAgentLobePlaceholder");
      logo.insertBefore(placeholder, lobes[0] ?? null);
      return [lobe, placeholder] as const;
    }));
    let hovered: HTMLElement | null = null;
    let focused: HTMLElement | null = null;
    let current: HTMLElement | null = null;
    const childOf = (target: EventTarget | null) => {
      const child = target instanceof Element ? target.closest<HTMLElement>("[data-agent-child]") : null;
      return child && column.contains(child) ? child : null;
    };
    /** 对应的那一瓣移到子项标题左侧 24px 处，其余归位 */
    const moveLobes = (child: HTMLElement | null) => {
      const ctm = logo.getScreenCTM();
      for (const lobe of lobes) {
        const origin = AGENT_LOBE_ORIGINS[lobe.dataset.agentLobe ?? ""];
        if (!child || lobe.dataset.agentLobe !== child.dataset.agentChild || !ctm || !origin) {
          lobe.style.transform = "translate(0px,0px)";
          continue;
        }
        const title = child.querySelector(".megaResourceTitle")?.getBoundingClientRect();
        if (!title) continue;
        const point = new DOMPoint(title.left - 24, title.top + title.height / 2).matrixTransform(ctm.inverse());
        lobe.style.transform = `translate(${point.x - origin.x}px,${point.y - origin.y}px)`;
      }
    };
    const sync = () => {
      const next = hovered || focused;
      if (next === current) return;
      current = next;
      moveLobes(next);
    };
    column.addEventListener("pointerover", (event) => {
      if (event.pointerType === "touch") return;
      hovered = childOf(event.target);
      sync();
    }, { signal });
    column.addEventListener("pointerleave", () => {
      hovered = null;
      sync();
    }, { signal });
    column.addEventListener("focusin", (event) => {
      focused = childOf(event.target);
      sync();
    }, { signal });
    column.addEventListener("focusout", (event) => {
      focused = childOf(event.relatedTarget);
      sync();
    }, { signal });
    window.addEventListener("resize", () => moveLobes(current), { signal });
    cleanups.push(() => lobes.forEach((lobe) => {
      lobe.style.removeProperty("transform");
      placeholders.get(lobe)?.remove();
    }));
  });

  return () => {
    controller.abort();
    cleanups.forEach((fn) => fn());
  };
}

/* ── 网站助手气泡 ─────────────────────────────────────────────── */

/** 气泡未缩放时的高度（CSS 里 .bubbleGuideBody 固定 36px），停靠时按徽章高度等比缩小 */
const BUBBLE_REST_HEIGHT = 36;
/** 气泡左缘与徽章右缘的间距，按未缩放尺寸计；实测原站停靠后两者相距约 1.89px（缩放 0.611） */
const BUBBLE_DOCK_GAP = 3.094;

/**
 * 网站助手气泡停靠在「Agent 友好」徽章右侧时的样子。
 *
 * 原站的气泡是全站共用的吉祥物：首屏后从屏幕一角飞入、停靠到顶栏，点开是依赖支付宝后端的助手菜单。
 * 这里只还原停靠之后的状态：位置跟随徽章，眼睛每隔 0.9~3 秒随机眨一次。
 * 顶栏开场完成前带着 data-header-pending（样式里是 visibility: hidden），与顶栏一起出现。
 * @param guide 气泡根元素 .bubbleGuide，放在顶栏之外，避免顶栏开场的位移把 fixed 定位带偏
 * @param header 顶栏根元素 [data-payathon-header]
 * @returns 卸载函数
 */
export function mountBubbleGuide(guide: HTMLElement, header: HTMLElement): () => void {
  const badge = header.querySelector<HTMLElement>(".siteMenuAgentBadge");
  const eyes = guide.querySelector<SVGElement>(".bubbleGuideEyes");
  if (!badge) return () => {};
  const controller = new AbortController();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let blinkTimer = 0;
  let settleTimer = 0;

  /** 按徽章当前位置停靠；顶栏仍在开场位移中时读到的坐标会偏 12px，所以只在就绪且过渡结束后调用 */
  function place(): void {
    const height = badge!.offsetHeight;
    if (height <= 0) return;
    const rect = badge!.getBoundingClientRect();
    const scale = height / BUBBLE_REST_HEIGHT;
    guide.style.setProperty("--dock-scale", String(scale));
    guide.style.setProperty("--guide-x", `${rect.right + BUBBLE_DOCK_GAP * scale}px`);
    guide.style.setProperty("--guide-y", `${rect.top}px`);
  }

  /** 顶栏就绪后等它的 0.36s 淡入位移走完再停靠、显形 */
  function syncReady(): void {
    const ready = header.hasAttribute("data-ready");
    clearTimeout(settleTimer);
    if (!ready) {
      guide.setAttribute("data-header-pending", "");
      return;
    }
    settleTimer = window.setTimeout(() => {
      place();
      guide.removeAttribute("data-header-pending");
    }, 400);
  }

  // 顶栏淡入位移结束、或字标换字体后宽度变化时，徽章位置会变，重新停靠一次
  const onHeaderTransitionEnd = (event: TransitionEvent) => {
    if (event.target === header && header.hasAttribute("data-ready")) place();
  };
  header.addEventListener("transitionend", onHeaderTransitionEnd, { signal: controller.signal });
  const brandObserver = new ResizeObserver(() => {
    if (!guide.hasAttribute("data-header-pending")) place();
  });
  brandObserver.observe(badge.parentElement ?? badge);

  function stopBlink(): void {
    clearTimeout(blinkTimer);
    blinkTimer = 0;
    eyes?.classList.remove("isBlinking");
  }

  /** 随机间隔眨眼：先移除类名并强制回流，再加回去以重播 0.15s 的眨眼动画 */
  function scheduleBlink(): void {
    if (blinkTimer || !eyes || document.hidden || reducedMotion.matches) return;
    blinkTimer = window.setTimeout(() => {
      blinkTimer = 0;
      eyes.classList.remove("isBlinking");
      void eyes.getBoundingClientRect();
      eyes.classList.add("isBlinking");
      scheduleBlink();
    }, 900 + Math.random() * 2100);
  }

  const observer = new MutationObserver(syncReady);
  observer.observe(header, { attributes: true, attributeFilter: ["data-ready"] });
  syncReady();
  scheduleBlink();

  window.addEventListener("resize", place, { signal: controller.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) stopBlink();
      else scheduleBlink();
    },
    { signal: controller.signal },
  );
  reducedMotion.addEventListener(
    "change",
    () => {
      if (reducedMotion.matches) stopBlink();
      else scheduleBlink();
    },
    { signal: controller.signal },
  );

  return () => {
    controller.abort();
    observer.disconnect();
    brandObserver.disconnect();
    clearTimeout(settleTimer);
    stopBlink();
  };
}
