/**
 * 页脚「潮汐」字符海面，逐行移植自原站 TideFooter 脚本。
 *
 * 页脚铺满 16×20 的字符网格（≈ ~ ·），两道带弯曲波前的浪由下往上扫过，被浪头照亮的字符变成主题色；
 * 指针划过时把附近字符推开并点亮，字符随后被弹簧拉回原位；中间的 REBORN UI 字标是障碍物，字符会被挤到字标四周。
 * 优先用 WebGL 点精灵绘制，浪的计算放在顶点着色器里；拿不到 WebGL 时退回 2D 画布逐字绘制。
 *
 * 入口根元素是 [data-tide-footer]（section.tide-footer）。
 */

/** 字符集：≈、~、·，在图集里依次占第 0~2 格 */
const TIDE_GLYPHS = ["≈", "~", "·"];

/** 网格的列宽与行高（CSS 像素） */
const CELL_WIDTH = 16;
const CELL_HEIGHT = 20;

/** 指针的排斥半径（CSS 像素） */
const POINTER_RADIUS = 60;

/** 默认主题色（#86eaff）的 0~1 分量，读到 --payathon-accent 前使用 */
const DEFAULT_ACCENT = [0.5255, 0.9176, 1];

/**
 * 顶点着色器：每个点精灵是一个字符。
 * - position.xy 为字符当前位置（已加上字形中心偏移），position.z 为原位纵坐标；
 * - effect.x 为字形序号、effect.y 为指针点亮的能量、effect.z 为原位横坐标；
 * - swell 计算一道浪：弯曲的波前由下往上扫过，浪头前窄后宽，后面拖着一段余波，
 *   首尾按进度淡入淡出，并按列做缓慢的强弱起伏；两道浪按不同周期叠加；
 * - edge/fade：顶部 40px 左右一条起伏的边界以上不显示；
 * - 未被照亮的字符为灰色 #77818f、不透明度 0.18，被浪或指针照亮时混向主题色。
 */
const TIDE_VERTEX_SHADER = `attribute vec4 position;attribute vec4 effect;
      uniform vec2 viewport;uniform float dpr;uniform float time;
      varying vec3 tint;varying float opacity;varying float glyph;
      uniform vec3 accent;
      float swell(float x,float y,float clock,float offset){
        float cycle=clock+offset;
        float progress=fract(cycle);
        float bend=.065*sin(x*.007+time*.38+offset*9.)+.028*sin(x*.019-time*.23);
        float front=1.24-1.6*progress+bend;
        float distance=y-front;
        float width=distance<0.?.035:.105;
        float crest=exp(-pow(distance/width,2.));
        float wake=.26*exp(-pow((distance-.14)/.13,2.));
        float envelope=smoothstep(0.,.12,progress)*(1.-smoothstep(.84,1.,progress));
        float strength=.72+.2*sin(floor(cycle)*2.39+offset*5.);
        float patches=.78+.22*sin(x*.011+time*.44+sin(x*.004-time*.2));
        return (crest+wake)*envelope*strength*patches;
      }
      void main(){
        gl_Position=vec4(position.x/viewport.x*2.-1.,1.-position.y/viewport.y*2.,0.,1.);
        gl_PointSize=32.*dpr;glyph=effect.x;
        float y=position.z/viewport.y;
        float wave=swell(effect.z,y,time*.13+.035*sin(time*.65),.16);
        wave+=.48*swell(effect.z,y,time*.157+.026*sin(time*.51),.63);
        wave=min(wave,.92);
        float edge=40.+22.*sin(effect.z*.009-time*.45)+12.*sin(effect.z*.017+time*.3);
        float fade=smoothstep(edge,edge+32.,position.z);
        float active=max(wave*.72,effect.y*.98)*fade;
        float base=.18*fade*(1.-active);opacity=active+base;
        tint=(vec3(.466667,.505882,.560784)*base+accent*active)/max(opacity,.00001);
      }`;

/** 片元着色器：从 4 格宽的字形图集里按 glyph 取字，乘上顶点算出的颜色与不透明度 */
const TIDE_FRAGMENT_SHADER = `precision mediump float;uniform sampler2D atlas;
      varying vec3 tint;varying float opacity;varying float glyph;
      void main(){float ink=texture2D(atlas,vec2((gl_PointCoord.x+glyph)/4.,gl_PointCoord.y)).a;gl_FragColor=vec4(tint,opacity*ink);}`;

/** 一个字符粒子 */
interface TideParticle {
  /** 原位（网格格点） */
  homeX: number;
  homeY: number;
  /** 当前位置 */
  x: number;
  y: number;
  /** 按列的弯曲系数（写入顶点数据，着色器当前未使用） */
  curve: number;
  vx: number;
  vy: number;
  /** 被指针点亮的能量，按 exp(-9t) 衰减 */
  energy: number;
  /** 是否可以再次被点亮：离开指针 0.25 秒后重新上膛 */
  armed: boolean;
  /** 离开指针影响范围后经过的时间（秒） */
  quiet: number;
  /** 字形序号 0~2 */
  glyph: number;
}

/** 字标路径的外扩包围盒（相对页脚左上角），字符不能进入 */
interface Obstacle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** WebGL 渲染器的控制句柄 */
interface TideRenderer {
  /** 粒子数量变化时重新分配顶点缓冲 */
  resize: (particles: TideParticle[]) => void;
  /** 绘制一帧 */
  draw: (
    particles: TideParticle[],
    width: number,
    height: number,
    dpr: number,
    time: number,
    accent: number[],
  ) => void;
  /** 释放 GPU 资源并丢弃上下文 */
  dispose: () => void;
}

/** 每个粒子在顶点缓冲里占 8 个浮点：position(4) + effect(4) */
const FLOATS_PER_PARTICLE = 8;

/**
 * 创建 WebGL 点精灵渲染器；拿不到 WebGL 上下文时返回 null
 * @param canvas 页脚画布
 * @param onRestored 上下文丢失后恢复时回调，调用方据此重新测量并重启动画
 */
function createTideRenderer(canvas: HTMLCanvasElement, onRestored: () => void): TideRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  let program!: WebGLProgram;
  let buffer!: WebGLBuffer;
  let atlas!: WebGLTexture;
  let locations!: {
    viewport: WebGLUniformLocation | null;
    dpr: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    accent: WebGLUniformLocation | null;
    atlas: WebGLUniformLocation | null;
    position: number;
    effect: number;
  };
  let lost = false;
  let vertices = new Float32Array(0);
  let count = 0;

  // 字形图集：256×64，每格 64px，白色 28px 字
  const atlasCanvas = document.createElement("canvas");
  atlasCanvas.width = 256;
  atlasCanvas.height = 64;
  const atlasContext = atlasCanvas.getContext("2d")!;
  atlasContext.font = "600 28px 'Courier New', monospace";
  atlasContext.textBaseline = "top";
  atlasContext.fillStyle = "#fff";
  TIDE_GLYPHS.forEach((glyph, index) => atlasContext.fillText(glyph, index * 64 + 16, 8));

  function compileShader(type: GLenum, source: string): WebGLShader {
    const shader = gl!.createShader(type);
    if (!shader) throw new Error("Tide shader unavailable");
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      const log = gl!.getShaderInfoLog(shader);
      gl!.deleteShader(shader);
      throw new Error(String(log));
    }
    return shader;
  }

  /** 编译着色器、上传图集并按当前粒子数分配顶点缓冲（失败时直接抛出，与原实现一致） */
  function build(): void {
    const context = gl!;
    const vertex = compileShader(context.VERTEX_SHADER, TIDE_VERTEX_SHADER);
    const fragment = compileShader(context.FRAGMENT_SHADER, TIDE_FRAGMENT_SHADER);
    program = context.createProgram();
    context.attachShader(program, vertex);
    context.attachShader(program, fragment);
    context.linkProgram(program);
    context.deleteShader(vertex);
    context.deleteShader(fragment);
    if (!context.getProgramParameter(program, context.LINK_STATUS))
      throw new Error(String(context.getProgramInfoLog(program)));
    buffer = context.createBuffer();
    atlas = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, atlas);
    context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, atlasCanvas);
    for (const parameter of [context.TEXTURE_MIN_FILTER, context.TEXTURE_MAG_FILTER])
      context.texParameteri(context.TEXTURE_2D, parameter, context.LINEAR);
    for (const parameter of [context.TEXTURE_WRAP_S, context.TEXTURE_WRAP_T])
      context.texParameteri(context.TEXTURE_2D, parameter, context.CLAMP_TO_EDGE);
    locations = {
      viewport: context.getUniformLocation(program, "viewport"),
      dpr: context.getUniformLocation(program, "dpr"),
      time: context.getUniformLocation(program, "time"),
      accent: context.getUniformLocation(program, "accent"),
      atlas: context.getUniformLocation(program, "atlas"),
      position: context.getAttribLocation(program, "position"),
      effect: context.getAttribLocation(program, "effect"),
    };
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(context.ARRAY_BUFFER, vertices.byteLength, context.DYNAMIC_DRAW);
    canvas.dataset.renderer = "webgl";
  }

  try {
    build();
  }
  catch (error) {
    // 原实现在此直接抛出；这里先归还上下文再抛出
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    lost = true;
  };
  const onContextRestored = (): void => {
    lost = false;
    build();
    onRestored();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  return {
    resize(particles) {
      count = particles.length;
      if (vertices.length !== count * FLOATS_PER_PARTICLE) {
        vertices = new Float32Array(count * FLOATS_PER_PARTICLE);
        if (!lost) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, vertices.byteLength, gl.DYNAMIC_DRAW);
        }
      }
    },
    draw(particles, width, height, dpr, time, accent) {
      if (lost || !width || !height) return;
      for (let index = 0; index < count; index++) {
        const particle = particles[index]!;
        const offset = index * FLOATS_PER_PARTICLE;
        // 字形中心相对格子左上角偏移 (8, 12)
        vertices[offset] = particle.x + 8;
        vertices[offset + 1] = particle.y + 12;
        vertices[offset + 2] = particle.homeY;
        vertices[offset + 3] = particle.curve;
        vertices[offset + 4] = particle.glyph;
        vertices[offset + 5] = particle.energy;
        vertices[offset + 6] = particle.homeX;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(20 / 255, 20 / 255, 20 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(locations.effect);
      gl.vertexAttribPointer(locations.effect, 4, gl.FLOAT, false, 32, 16);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, atlas);
      gl.uniform1i(locations.atlas, 0);
      gl.uniform2f(locations.viewport, width, height);
      gl.uniform1f(locations.dpr, dpr);
      gl.uniform1f(locations.time, time);
      gl.uniform3fv(locations.accent, accent);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(atlas);
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/** 三次平滑阶跃，与 GLSL 的 smoothstep 一致 */
function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 把属性写回原值；原本没有该属性则移除 */
function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/**
 * 挂载页脚潮汐
 * @param root 页脚根元素 [data-tide-footer]
 * @returns 卸载函数：停止动画、断开观察器、移除监听并释放 WebGL
 */
export function mountTideFooter(root: HTMLElement): () => void {
  const canvas = root.querySelector("canvas")!;
  const originalWidth = canvas.getAttribute("width");
  const originalHeight = canvas.getAttribute("height");
  const renderer = createTideRenderer(canvas, () => {
    measure();
    restart();
  });
  const context2d = renderer ? null : canvas.getContext("2d", { alpha: false });
  if (!renderer && !context2d) return () => {};
  if (context2d) canvas.dataset.renderer = "canvas2d";

  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  // 2D 回退用的字形精灵：64×48，上排灰色、下排主题色，每格 16×24
  const sprite = document.createElement("canvas");
  sprite.width = 64;
  sprite.height = 48;
  const spriteContext = sprite.getContext("2d")!;

  let frameId = 0;
  let lastTime = 0;
  let time = 0;
  let width = 0;
  let height = 0;
  let intersecting = false;
  let disposed = false;
  let pointer: { x: number; y: number } | null = null;
  let dpr = 1;
  let accent = DEFAULT_ACCENT;
  const particles: TideParticle[] = [];
  let obstacles: Obstacle[] = [];

  /** 测量字标每条路径的包围盒，左右外扩 14px、上下外扩 16px 作为障碍物 */
  function measureObstacles(): void {
    const rootRect = root.getBoundingClientRect();
    obstacles = [...root.querySelectorAll<SVGPathElement>("[data-tide-logo] path")].map((path) => {
      const box = path.getBBox();
      const svg = path.ownerSVGElement!;
      const svgRect = svg.getBoundingClientRect();
      const scaleX = svgRect.width / svg.viewBox.baseVal.width;
      const scaleY = svgRect.height / svg.viewBox.baseVal.height;
      return {
        left: svgRect.left - rootRect.left + box.x * scaleX - 14,
        right: svgRect.left - rootRect.left + (box.x + box.width) * scaleX + 14,
        top: svgRect.top - rootRect.top + box.y * scaleY - 16,
        bottom: svgRect.top - rootRect.top + (box.y + box.height) * scaleY + 16,
      };
    });
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const rect = root.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const onPointerLeave = (): void => {
    pointer = null;
  };

  /** 与顶点着色器里的 swell 完全一致，供 2D 回退使用 */
  function swell(x: number, y: number, clock: number, offset: number): number {
    const cycle = clock + offset;
    const progress = cycle - Math.floor(cycle);
    const bend = 0.065 * Math.sin(x * 0.007 + time * 0.38 + offset * 9) + 0.028 * Math.sin(x * 0.019 - time * 0.23);
    const distance = y - (1.24 - 1.6 * progress + bend);
    const crestWidth = distance < 0 ? 0.035 : 0.105;
    const crest = Math.exp(-((distance / crestWidth) ** 2));
    const wake = 0.26 * Math.exp(-(((distance - 0.14) / 0.13) ** 2));
    const envelope = smoothstep(0, 0.12, progress) * (1 - smoothstep(0.84, 1, progress));
    const strength = 0.72 + 0.2 * Math.sin(Math.floor(cycle) * 2.39 + offset * 5);
    const patches = 0.78 + 0.22 * Math.sin(x * 0.011 + time * 0.44 + Math.sin(x * 0.004 - time * 0.2));
    return (crest + wake) * envelope * strength * patches;
  }

  /**
   * 推进物理并绘制一帧
   * @param dt 时间步（秒）；为 0 时只绘制不推进
   */
  function render(dt = 0): void {
    if (context2d) {
      context2d.fillStyle = "#141414";
      context2d.fillRect(0, 0, width, height);
    }
    for (const particle of particles) {
      if (dt) {
        // 弹簧拉回原位并阻尼，点亮能量衰减
        particle.vx += (particle.homeX - particle.x) * 35 * dt;
        particle.vy += (particle.homeY - particle.y) * 35 * dt;
        particle.vx *= Math.exp(-dt * 8);
        particle.vy *= Math.exp(-dt * 8);
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.energy *= Math.exp(-dt * 9);
        if (pointer) {
          const dx = particle.x - pointer.x;
          const dy = particle.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < POINTER_RADIUS) {
            // 推到排斥圆外，并给一个外向速度；上膛状态下被推开超过 1px 才点亮
            const push = POINTER_RADIUS - distance;
            const nx = distance > 0.01 ? dx / distance : 1;
            const ny = distance > 0.01 ? dy / distance : 0;
            particle.x += nx * push;
            particle.y += ny * push;
            particle.vx += nx * push * 3;
            particle.vy += ny * push * 3;
            if (particle.armed && push > 1) {
              particle.energy = 1;
              particle.armed = false;
            }
            particle.quiet = 0;
          }
          else {
            particle.quiet += dt;
            if (particle.quiet > 0.25) particle.armed = true;
          }
        }
        else {
          particle.quiet += dt;
          if (particle.quiet > 0.25) particle.armed = true;
        }
      }

      // 字符中心落进字标包围盒时，沿最近的边推出去，并清掉朝内的速度
      for (const box of obstacles) {
        const centerX = particle.x + 8;
        const centerY = particle.y + 7;
        if (centerX <= box.left || centerX >= box.right || centerY <= box.top || centerY >= box.bottom) continue;
        const toLeft = centerX - box.left;
        const toRight = box.right - centerX;
        const toTop = centerY - box.top;
        const toBottom = box.bottom - centerY;
        const nearest = Math.min(toLeft, toRight, toTop, toBottom);
        if (nearest === toLeft) {
          particle.x -= toLeft;
          particle.vx = Math.min(0, particle.vx);
        }
        else if (nearest === toRight) {
          particle.x += toRight;
          particle.vx = Math.max(0, particle.vx);
        }
        else if (nearest === toTop) {
          particle.y -= toTop;
          particle.vy = Math.min(0, particle.vy);
        }
        else {
          particle.y += toBottom;
          particle.vy = Math.max(0, particle.vy);
        }
      }

      if (renderer || !context2d) continue;

      // 2D 回退：在 CPU 上算一遍与顶点着色器相同的浪与淡出边界
      const edge
        = 40 + 22 * Math.sin(particle.homeX * 0.009 - time * 0.45) + 12 * Math.sin(particle.homeX * 0.017 + time * 0.3);
      const fadeRatio = Math.max(0, Math.min(1, (particle.homeY - edge) / 32));
      const fade = fadeRatio * fadeRatio * (3 - 2 * fadeRatio);
      const wave = Math.min(
        0.92,
        swell(particle.homeX, particle.homeY / height, time * 0.13 + 0.035 * Math.sin(time * 0.65), 0.16)
        + 0.48 * swell(particle.homeX, particle.homeY / height, time * 0.157 + 0.026 * Math.sin(time * 0.51), 0.63),
      );
      const active = Math.max(wave * 0.72, particle.energy * 0.98);
      context2d.globalAlpha = 0.18 * fade;
      context2d.drawImage(sprite, particle.glyph * 16, 0, 16, 24, particle.x, particle.y, 16, 24);
      context2d.globalAlpha = active * fade;
      context2d.drawImage(sprite, particle.glyph * 16, 24, 16, 24, particle.x, particle.y, 16, 24);
    }
    if (renderer) renderer.draw(particles, width, height, dpr, time, accent);
    else context2d!.globalAlpha = 1;
  }

  /** 动画帧：单帧时长上限 0.05 秒 */
  function tick(now: number): void {
    frameId = 0;
    if (disposed || !intersecting || document.hidden || reducedMotion.matches) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1e3, 0.05) : 0;
    time += dt;
    lastTime = now;
    render(dt);
    frameId = requestAnimationFrame(tick);
  }

  /** 重启动画；不可见或减弱动效时把所有字符复位，减弱动效下只画一帧静态画面 */
  function restart(): void {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = 0;
    if (!intersecting || document.hidden || reducedMotion.matches) {
      pointer = null;
      for (const particle of particles) {
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.vx = particle.vy = particle.energy = particle.quiet = 0;
        particle.armed = true;
      }
    }
    if (!intersecting || document.hidden || disposed) return;
    if (reducedMotion.matches) render();
    else frameId = requestAnimationFrame(tick);
  }

  /** 按页脚尺寸重建网格、调整画布、测量障碍物，并重绘字形精灵与主题色 */
  function measure(): void {
    const rect = root.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!particles.length || canvas.dataset.grid !== `${width}:${height}`) {
      particles.length = 0;
      canvas.dataset.grid = `${width}:${height}`;
      for (let x = 0; x < width; x += CELL_WIDTH) {
        for (let y = 0; y < height; y += CELL_HEIGHT) {
          // 每 13 个对角格放一个 ·，每 4 个放一个 ~，其余为 ≈
          const diagonal = x / CELL_WIDTH + y / CELL_HEIGHT;
          particles.push({
            homeX: x,
            homeY: y,
            x,
            y,
            curve: Math.sin(x * 0.009) * 0.45 + Math.sin(x * 0.018) * 0.18,
            vx: 0,
            vy: 0,
            energy: 0,
            armed: true,
            quiet: 0,
            glyph: diagonal % 13 === 0 ? 2 : diagonal % 4 === 0 ? 1 : 0,
          });
        }
      }
    }
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context2d?.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderer?.resize(particles);
    measureObstacles();
    spriteContext.clearRect(0, 0, 64, 48);
    spriteContext.font = "600 14px 'Courier New', monospace";
    spriteContext.textBaseline = "top";
    spriteContext.fillStyle = "#77818f";
    TIDE_GLYPHS.forEach((glyph, index) => spriteContext.fillText(glyph, index * 16, 0));
    spriteContext.fillStyle = getComputedStyle(root).getPropertyValue("--payathon-accent").trim() || "#86eaff";
    TIDE_GLYPHS.forEach((glyph, index) => spriteContext.fillText(glyph, index * 16, 24));
    // fillStyle 读回来是规范化后的 #rrggbb，直接拆出三个分量
    const colour = spriteContext.fillStyle as string;
    accent = [1, 3, 5].map(index => Number.parseInt(colour.slice(index, index + 2), 16) / 255);
    render();
  }

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = !!entry?.isIntersecting;
    restart();
  });
  intersectionObserver.observe(root);
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(root);
  // 页面级观察：首屏按调色板改写强调色时会改页面根节点（原站是 body）的内联样式，需要重绘主题色
  const bodyObserver = new MutationObserver(measure);
  bodyObserver.observe(root.closest("#payathon-page") ?? document.body, { attributes: true, attributeFilter: ["style"] });
  document.addEventListener("visibilitychange", restart);
  reducedMotion.addEventListener("change", restart);
  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave);

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    renderer?.dispose();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    bodyObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", restart);
    reducedMotion.removeEventListener("change", restart);
    // 原实现卸载时未清理的部分：渲染器标记、网格尺寸标记与画布尺寸
    delete canvas.dataset.renderer;
    delete canvas.dataset.grid;
    restoreAttribute(canvas, "width", originalWidth);
    restoreAttribute(canvas, "height", originalHeight);
  };
}
