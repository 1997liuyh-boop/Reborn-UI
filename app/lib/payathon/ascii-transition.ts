/**
 * 区块之间的 ASCII 字符过渡带，逐行移植自原站 AsciiSectionTransition 脚本。
 *
 * 一条横向的字符网格把上下两个区块缝合起来：随着过渡带滚入视口，分界线由下往上推进，
 * 分界线一侧是实色、另一侧是由点、横线、十字、井号等字符组成的渐变密度；
 * 快速滚动时会按滚动速度拉出蓝、橙两道滞后的「拖影」，并让字符列上下错位。
 *
 * 入口根元素是 [data-ascii-transition]（.ascii-section-transition），页面上的进场与出场
 * （带 --exit 修饰类，方向相反）两条过渡带各自挂载一次。
 */

/** 全屏三角形顶点着色器 */
const VERTEX_SHADER = `attribute vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}`;

/**
 * 片元着色器：
 * - glyph：按密度（0~1，满格为 9 号实心块）与逐格扰动从 10 格字符图集里取字；
 * - surface：以固定 16 CSS 像素为一格（不加纱窗噪点或扫描线抖动）计算遮罩。
 *   drift 让每列按各自比例上下错位，上下 32px 内逐渐收敛；分界线位置随 progress 推进，并带两道正弦起伏。
 *   正反两个方向都在分界线的白色一侧显示深色字符；字符的变换按格错开，相位只随实际滚动推进；
 * - main：遮罩外为目标色（正向为白，反向为深色 #10141b），
 *   两道滞后的拖影剪影（splitOffset.x / .y）直接在这里合成，避免使用 CSS 画布滤镜。
 */
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 resolution;
uniform vec2 cssSize;
uniform float progress;
uniform float reverse;
uniform float drift;
uniform float scrollPhase;
uniform vec2 splitOffset;
uniform vec4 forwardColour;
uniform vec4 backwardColour;
uniform sampler2D atlas;
float glyph(vec2 p,float density,float variation){
  float index=clamp(floor(density*9.)+variation,0.,8.);
  if(density>=.9)index=9.;
  return texture2D(atlas,vec2((index+p.x+.5)/10.,p.y+.5)).a*smoothstep(0.,.05,density);
}
float surface(vec2 uv){
  vec2 original=uv*cssSize;
  float column=floor(original.x/16.);
  float envelope=smoothstep(0.,32.,original.y)*(1.-smoothstep(cssSize.y-32.,cssSize.y,original.y));
  float offset=floor(drift*(.7+.3*sin(column*.47))*envelope+.5);
  vec2 pixel=vec2(floor(original.x)+.5,floor(original.y-offset)+.5);
  vec2 id=floor(pixel/16.);
  vec2 p=fract(pixel/16.)-.5;
  float row=(id.y+.5)*16./cssSize.y;
  float x=(id.x+.5)*16./cssSize.x;
  float edge=mix(.62,.4,progress)+.06*sin(x*9.)+.025*sin(x*23.);
  float density=smoothstep(edge-88./cssSize.y,edge+88./cssSize.y,row);
  float phase=floor(scrollPhase+mod(id.x*3.+id.y*5.,12.)/12.);
  float variation=mod(phase+id.x*7.+id.y*13.,5.)-2.;
  float ink=glyph(p,mix(1.-density,density,reverse),variation);
  float mask=mix(1.-ink,ink,reverse);
  if(original.y<16.)mask=0.;
  if(original.y>cssSize.y-16.)mask=1.;
  return mask;
}
void main(){
  vec2 uv=vec2(gl_FragCoord.x/resolution.x,1.-gl_FragCoord.y/resolution.y);
  float mask=surface(uv);
  vec3 dark=vec3(16.,20.,27.)/255.;
  vec3 target=mix(vec3(1.),dark,reverse);
  float front=surface(uv-vec2(0.,splitOffset.x/cssSize.y))*forwardColour.a;
  float back=surface(uv-vec2(0.,splitOffset.y/cssSize.y))*backwardColour.a;
  vec4 trails=vec4(forwardColour.rgb*front+backwardColour.rgb*back*(1.-front),front+back*(1.-front));
  gl_FragColor=vec4(target*mask,mask)+trails*(1.-mask);
}`;

/**
 * 字符图集：9 个 5×7 点阵字符（由稀到密：点、冒号、横线、等号、加号、星号、井号、百分号、@），
 * 每个点放大成 2×2 像素画进 16×16 的格子；第 10 格是实心块
 */
const GLYPH_BITMAPS = [
  ["00000", "00000", "00000", "00000", "00000", "00100", "00100"],
  ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
  ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
  ["01010", "01010", "11111", "01010", "11111", "01010", "01010"],
  ["11001", "11010", "00100", "00100", "01000", "10110", "00110"],
  ["01110", "10001", "10111", "10101", "10111", "10000", "01111"],
];

/** 着色器里用到的全部 uniform 名 */
const UNIFORM_NAMES = [
  "resolution",
  "cssSize",
  "progress",
  "reverse",
  "atlas",
  "drift",
  "scrollPhase",
  "splitOffset",
  "forwardColour",
  "backwardColour",
] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

/** 过渡带的 WebGL 渲染器 */
interface AsciiRenderer {
  /**
   * 绘制一帧
   * @param width 舞台 CSS 宽度
   * @param height 舞台 CSS 高度
   * @param progress 分界线推进进度 0~1
   * @param reverse 是否为出场方向
   * @param drift 字符列错位量（CSS 像素）
   * @param scrollPhase 随滚动推进的字符变换相位
   * @param forwardSplit 蓝色拖影的纵向偏移（CSS 像素）
   * @param backwardSplit 橙色拖影的纵向偏移（CSS 像素）
   */
  draw: (
    width: number,
    height: number,
    progress: number,
    reverse: boolean,
    drift?: number,
    scrollPhase?: number,
    forwardSplit?: number,
    backwardSplit?: number,
  ) => void;
  /** 释放 GPU 资源并丢弃上下文 */
  dispose: () => void;
}

/** 把属性写回原值；原本没有该属性则移除 */
function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * 在画布上创建过渡带渲染器；不支持 WebGL 或着色器编译失败时返回 null
 * @param canvas 舞台里的画布
 * @param onRestored 上下文丢失后恢复成功时回调，调用方据此强制重绘
 */
function createAsciiRenderer(canvas: HTMLCanvasElement, onRestored: () => void): AsciiRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const originalWidth = canvas.getAttribute("width");
  const originalHeight = canvas.getAttribute("height");

  // 借一个 1×1 的 2D 画布把 CSS 颜色解析成 0~1 的 RGBA；变量缺失或非法时用兜底色
  const colourProbe = document.createElement("canvas").getContext("2d")!;
  const canvasStyle = getComputedStyle(canvas);
  const readColour = (property: string, fallback: string): number[] => {
    colourProbe.clearRect(0, 0, 1, 1);
    colourProbe.fillStyle = fallback;
    colourProbe.fillStyle = canvasStyle.getPropertyValue(property).trim() || fallback;
    colourProbe.fillRect(0, 0, 1, 1);
    return [...colourProbe.getImageData(0, 0, 1, 1).data].map(channel => channel / 255);
  };
  const forwardColour = readColour("--payathon-split-forward-svg", "#21b8ffe6");
  const backwardColour = readColour("--payathon-split-backward-svg", "#ff8623e6");

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let atlas: WebGLTexture | null = null;
  let positionLocation = -1;
  let uniforms = {} as Record<UniformName, WebGLUniformLocation | null>;
  let lost = false;

  function release(): void {
    if (atlas) gl!.deleteTexture(atlas);
    atlas = null;
    if (buffer) gl!.deleteBuffer(buffer);
    if (program) gl!.deleteProgram(program);
    buffer = null;
    program = null;
  }

  /** 画出字符图集：160×16，10 格，白色像素，只用 alpha 通道 */
  function drawAtlas(): HTMLCanvasElement {
    const atlasCanvas = document.createElement("canvas");
    atlasCanvas.width = 160;
    atlasCanvas.height = 16;
    const context = atlasCanvas.getContext("2d")!;
    context.fillStyle = "#fff";
    GLYPH_BITMAPS.forEach((rows, glyphIndex) =>
      rows.forEach((row, rowIndex) =>
        [...row].forEach((bit, columnIndex) => {
          if (bit === "1") context.fillRect(glyphIndex * 16 + 3 + columnIndex * 2, 1 + rowIndex * 2, 2, 2);
        }),
      ),
    );
    context.fillRect(144, 0, 16, 16);
    return atlasCanvas;
  }

  /** 编译着色器、上传顶点与图集；失败时释放已建资源并返回 false */
  function build(): boolean {
    const context = gl!;
    const shaders: WebGLShader[] = [];
    try {
      for (const [type, source] of [
        [context.VERTEX_SHADER, VERTEX_SHADER],
        [context.FRAGMENT_SHADER, FRAGMENT_SHADER],
      ] as const) {
        const shader = context.createShader(type);
        if (!shader) throw new Error("ASCII shader unavailable");
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
      const atlasCanvas = drawAtlas();
      atlas = context.createTexture();
      context.bindTexture(context.TEXTURE_2D, atlas);
      context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, atlasCanvas);
      for (const parameter of [context.TEXTURE_MIN_FILTER, context.TEXTURE_MAG_FILTER])
        context.texParameteri(context.TEXTURE_2D, parameter, context.NEAREST);
      for (const parameter of [context.TEXTURE_WRAP_S, context.TEXTURE_WRAP_T])
        context.texParameteri(context.TEXTURE_2D, parameter, context.CLAMP_TO_EDGE);
      positionLocation = context.getAttribLocation(linked, "position");
      uniforms = Object.fromEntries(
        UNIFORM_NAMES.map(name => [name, context.getUniformLocation(linked, name)]),
      ) as Record<UniformName, WebGLUniformLocation | null>;
      return true;
    }
    catch (error) {
      release();
      console.warn("ASCII transition shader unavailable:", error);
      return false;
    }
    finally {
      shaders.forEach(shader => context.deleteShader(shader));
    }
  }

  if (!build()) {
    // 原实现在此直接放弃，上下文留给画布；这里顺手归还上下文
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    lost = true;
    delete canvas.dataset.ready;
  };
  const onContextRestored = (): void => {
    lost = !build();
    if (!lost) onRestored();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  return {
    draw(width, height, progress, reverse, drift = 0, scrollPhase = 0, forwardSplit = 0, backwardSplit = 0) {
      if (lost || !width || !height) return;
      // 像素比不超过 2，且画布不超过 4096×768、总像素不超过 200 万
      const ratio = Math.min(
        devicePixelRatio || 1,
        2,
        4096 / width,
        768 / height,
        Math.sqrt(2e6 / (width * height)),
      );
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(uniforms.atlas, 0);
      gl.uniform2f(uniforms.resolution, pixelWidth, pixelHeight);
      gl.uniform2f(uniforms.cssSize, width, height);
      gl.uniform2f(uniforms.splitOffset, forwardSplit, backwardSplit);
      gl.uniform4fv(uniforms.forwardColour, forwardColour);
      gl.uniform4fv(uniforms.backwardColour, backwardColour);
      gl.uniform1f(uniforms.scrollPhase, scrollPhase);
      gl.uniform1f(uniforms.drift, drift);
      gl.uniform1f(uniforms.progress, progress);
      gl.uniform1f(uniforms.reverse, reverse ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.dataset.ready = "";
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      release();
      delete canvas.dataset.ready;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      restoreAttribute(canvas, "width", originalWidth);
      restoreAttribute(canvas, "height", originalHeight);
    },
  };
}

/** 限制到 0~1 */
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * 挂载一条 ASCII 过渡带
 * @param root 过渡带根元素 [data-ascii-transition]
 * @returns 卸载函数：停止动画、移除监听并释放 WebGL
 */
export function mountAsciiTransition(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>(".ascii-stage")!;
  const canvas = root.querySelector("canvas")!;
  const reverse = root.classList.contains("ascii-section-transition--exit");
  const controller = new AbortController();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let visible = false;
  let renderer: AsciiRenderer | null = null;
  let attempted = false;
  let lastKey = "";

  let frameId = 0;
  // 滚动冲量与三路跟随它的弹簧：蓝色拖影、橙色拖影（反向）、字符列错位
  let impulse = 0;
  let forwardSplit = 0;
  let backwardSplit = 0;
  let drift = 0;
  let lastFrameTime = 0;
  let lastScrollY = scrollY;
  let lastScrollTime = performance.now();

  function resetMotion(): void {
    impulse = forwardSplit = backwardSplit = drift = lastFrameTime = 0;
  }

  function frame(now: number): void {
    frameId = 0;
    if (document.hidden || reducedMotion.matches || !visible) {
      resetMotion();
      return;
    }
    const dt = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1e3) : 1 / 60;
    lastFrameTime = now;
    impulse *= Math.exp(-dt / 0.08);
    forwardSplit += (impulse - forwardSplit) * (1 - Math.exp(-dt / 0.045));
    backwardSplit += (-impulse - backwardSplit) * (1 - Math.exp(-dt / 0.12));
    drift += (impulse * 0.55 - drift) * (1 - Math.exp(-dt / 0.07));
    const moving = Math.max(Math.abs(impulse), Math.abs(forwardSplit), Math.abs(backwardSplit), Math.abs(drift)) > 0.02;
    if (!moving) impulse = forwardSplit = backwardSplit = drift = 0;

    // 舞台顶边从视口 85% 处滚到 50% 处，进度从 0 走到 1
    const range = innerHeight * 0.35;
    const startLine = innerHeight * 0.85;
    const progress = clamp01((startLine - stage.getBoundingClientRect().top) / Math.max(1, range));
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    if (!attempted) {
      attempted = true;
      renderer = createAsciiRenderer(canvas, () => {
        lastKey = "";
        schedule();
      });
    }
    const phase = (((scrollY / 12) % 4096) + 4096) % 4096;
    const key = `${width}:${height}:${progress.toFixed(4)}:${devicePixelRatio}:${Math.round(drift)}:${phase.toFixed(3)}:${forwardSplit.toFixed(2)}:${backwardSplit.toFixed(2)}`;
    if (renderer && key !== lastKey) {
      renderer.draw(width, height, progress, reverse, Math.round(drift), phase, forwardSplit, backwardSplit);
      lastKey = key;
    }

    if (moving && visible && renderer) schedule();
    else lastFrameTime = 0;
  }

  function schedule(): void {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === stage) visible = entry.isIntersecting;
    }
    schedule();
  });
  observer.observe(stage);

  /** 滚动时按速度（像素/毫秒）注入冲量，上限 ±48 */
  function onScroll(): void {
    const now = performance.now();
    const delta = scrollY - lastScrollY;
    const interval = Math.max(8, Math.min(64, now - lastScrollTime));
    lastScrollY = scrollY;
    lastScrollTime = now;
    if (!document.hidden && !reducedMotion.matches && visible)
      impulse = Math.max(-48, Math.min(48, (delta / interval) * 18));
    schedule();
  }

  /** 页面可见性或减弱动效偏好变化时，清空运动状态重新开始 */
  function restart(): void {
    cancelAnimationFrame(frameId);
    frameId = 0;
    resetMotion();
    lastScrollY = scrollY;
    lastScrollTime = performance.now();
    schedule();
  }

  window.addEventListener("scroll", onScroll, { passive: true, signal: controller.signal });
  window.addEventListener("resize", schedule, { signal: controller.signal });
  document.addEventListener("visibilitychange", restart, { signal: controller.signal });
  reducedMotion.addEventListener("change", restart, { signal: controller.signal });

  return () => {
    cancelAnimationFrame(frameId);
    frameId = 0;
    resetMotion();
    observer.disconnect();
    controller.abort();
    renderer?.dispose();
  };
}
