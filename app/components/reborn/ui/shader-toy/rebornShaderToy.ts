import { Camera, Geometry, Mesh, Program, Renderer, Transform } from "ogl";

export interface ShaderConfig {
  source: string;
}

export interface MouseState {
  x: number;
  y: number;
  clickX: number;
  clickY: number;
}

export interface HSVControls {
  hue: number; // 0-360
  saturation: number; // 0-1
  brightness: number; // 0-1
}

export type MouseMode = "click" | "hover";

export class rebornShaderToy {
  private renderer: Renderer;
  private camera: Camera;
  private scene: Transform;
  private geometry: Geometry;
  private program: Program | null = null;
  private mesh: Mesh | null = null;

  // 尺寸观察与逐帧循环的句柄：dispose 时必须释放，否则观察器与 rAF 回调会一直持有实例
  private resizeObserver: ResizeObserver | null = null;
  private rafId: number | null = null;

  // 计时
  private isPlaying: boolean = false;
  private firstDrawTime: number = 0;
  private prevDrawTime: number = 0;
  private targetFPS: number = 60;
  private frameInterval: number = 1000 / 60;
  private lastFrameTime: number = 0;

  // 每帧绘制前的回调
  private onDrawCallback?: () => void;

  // 着色器 uniform 对应的状态
  private iFrame: number = 0;
  private iMouse: MouseState = { x: 0, y: 0, clickX: 0, clickY: 0 };
  private hsv: HSVControls = { hue: 0, saturation: 1, brightness: 1 };
  private _mouseMode: MouseMode = "click";
  private _mouseSensitivity: number = 1.0; // 鼠标坐标灵敏度倍数
  private _mouseDamping: number = 0.9; // 鼠标移动阻尼系数（0-1）

  private _speed: number = 1; // 播放速度倍数

  // 用户传入的着色器源码
  private shaderSource: string = "";

  private readonly vertexShader = `#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif
    in vec2 position;
    void main() {
        gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  private readonly fragmentShaderHeader = `#version 300 es
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif

    uniform vec3      iResolution;     // viewport resolution (in pixels)
    uniform float     iTime;           // shader playback time (in seconds)
    uniform float     iTimeDelta;      // render time (in seconds)
    uniform float     iFrameRate;      // shader frame rate
    uniform int       iFrame;          // shader playback frame
    uniform vec4      iMouse;          // mouse pixel coords. xy: current, zw: click
    uniform vec4      iDate;           // (year, month, day, unixtime in seconds)
    uniform vec3      iHSV;            // HSV controls (hue, saturation, brightness)
    uniform float     iSpeed;          // speed multiplier

    out vec4 fragColor;

    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    // RGB to HSV conversion
    vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    // Apply HSV adjustments
    vec3 applyHSV(vec3 color, vec3 hsvAdjust) {
        vec3 hsv = rgb2hsv(color);
        hsv.x = fract(hsv.x + hsvAdjust.x / 360.0);
        hsv.y = clamp(hsv.y * hsvAdjust.y, 0.0, 1.0);
        hsv.z = clamp(hsv.z * hsvAdjust.z, 0.0, 1.0);
        return hsv2rgb(hsv);
    }

    void mainImage(out vec4 c, in vec2 f);

    void main() {
        vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
        mainImage(color, gl_FragCoord.xy);

        // Apply HSV adjustments if not default
        if (iHSV.x != 0.0 || iHSV.y != 1.0 || iHSV.z != 1.0) {
            color.rgb = applyHSV(color.rgb, iHSV);
        }

        fragColor = color;
    }
  `;

  constructor(
    private container: HTMLElement,
    mouseMode?: MouseMode,
    fps?: number,
  ) {
    if (mouseMode) {
      this._mouseMode = mouseMode;
    }
    if (fps) {
      this.setFrameRate(fps);
    }

    // 创建渲染器，要求 WebGL 2 上下文
    this.renderer = new Renderer({
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      dpr: window.devicePixelRatio,
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      powerPreference: "high-performance",
    });

    // 确认拿到的是 WebGL 2 上下文，旧浏览器或禁用 WebGL 时直接抛错，由调用方降级
    if (!this.renderer.gl || !(this.renderer.gl instanceof WebGL2RenderingContext)) {
      throw new Error("WebGL 2 not supported");
    }

    // 画布挂到容器里
    this.container.appendChild(this.renderer.gl.canvas);

    // 正交相机，用于全屏四边形
    this.camera = new Camera(this.renderer.gl);
    this.camera.position.z = 1;

    // 场景根节点
    this.scene = new Transform();

    // 全屏四边形几何体
    this.geometry = new Geometry(this.renderer.gl, {
      position: {
        size: 2,
        data: new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1, -1, 1, 1, -1]),
      },
    });

    this.setup();
  }

  private setup(): void {
    this.setupMouseEvents();
    this.setupResizeHandler();
  }

  private setupMouseEvents(): void {
    const canvas = this.renderer.gl.canvas;
    let isMouseDown = false;

    const getScaledMousePos = (event: MouseEvent | Touch) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio;

      // 指针相对画布的位置
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 按 DPR 换算为像素坐标、乘以灵敏度，并翻转 Y 轴
      return {
        x: x * dpr * this._mouseSensitivity,
        y: (canvas.height - y * dpr) * this._mouseSensitivity, // 翻转 Y 轴，与 GLSL 坐标系一致
      };
    };

    canvas.addEventListener("mousemove", (event: MouseEvent) => {
      const { x: newX, y: newY } = getScaledMousePos(event);

      // 按阻尼系数平滑鼠标移动
      this.iMouse.x = this.iMouse.x * this._mouseDamping + newX * (1 - this._mouseDamping);
      this.iMouse.y = this.iMouse.y * this._mouseDamping + newY * (1 - this._mouseDamping);

      // 按交互模式更新点击坐标
      if (this._mouseMode === "hover" && !isMouseDown) {
        this.iMouse.clickX = this.iMouse.x;
        this.iMouse.clickY = this.iMouse.y;
      } else if (isMouseDown) {
        this.iMouse.clickX = newX;
        this.iMouse.clickY = newY;
      }
    });

    canvas.addEventListener("mousedown", (event: MouseEvent) => {
      isMouseDown = true;
      const { x: clickX, y: clickY } = getScaledMousePos(event);

      if (this._mouseMode === "click") {
        this.iMouse.clickX = clickX;
        this.iMouse.clickY = clickY;
      }
    });

    canvas.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    // 移动端触摸事件
    canvas.addEventListener("touchmove", (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      const { x: newX, y: newY } = getScaledMousePos(touch);

      this.iMouse.x = newX;
      this.iMouse.y = newY;

      if (this._mouseMode === "hover") {
        this.iMouse.clickX = newX;
        this.iMouse.clickY = newY;
      }
    });

    canvas.addEventListener("touchstart", (event: TouchEvent) => {
      event.preventDefault();
      isMouseDown = true;
      const touch = event.touches[0];
      const { x: clickX, y: clickY } = getScaledMousePos(touch);

      if (this._mouseMode === "click") {
        this.iMouse.clickX = clickX;
        this.iMouse.clickY = clickY;
      }
    });

    canvas.addEventListener("touchend", () => {
      isMouseDown = false;
    });
  }

  private setupResizeHandler(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      // 同步渲染器尺寸
      this.renderer.setSize(width, height);

      // 同步视口
      this.renderer.gl.viewport(
        0,
        0,
        width * window.devicePixelRatio,
        height * window.devicePixelRatio,
      );

      // 已有着色器程序时同步分辨率 uniform
      if (this.program) {
        this.program.uniforms.iResolution.value = [
          width * window.devicePixelRatio,
          height * window.devicePixelRatio,
          window.devicePixelRatio,
        ];
      }
    });

    this.resizeObserver.observe(this.container);
  }

  private compileProgram(): boolean {
    if (!this.shaderSource) return false;

    const fullFragmentShader = this.fragmentShaderHeader + this.shaderSource;

    try {
      const program = new Program(this.renderer.gl, {
        vertex: this.vertexShader,
        fragment: fullFragmentShader,
        uniforms: {
          iResolution: {
            value: [
              this.container.clientWidth * window.devicePixelRatio,
              this.container.clientHeight * window.devicePixelRatio,
              window.devicePixelRatio,
            ],
          },
          iTime: { value: 0 },
          iTimeDelta: { value: 0 },
          iFrameRate: { value: this.targetFPS },
          iFrame: { value: 0 },
          iMouse: { value: [0, 0, 0, 0] },
          iDate: { value: [0, 0, 0, 0] },
          iHSV: { value: [this.hsv.hue, this.hsv.saturation, this.hsv.brightness] },
          iSpeed: { value: this._speed },
        },
      });

      // 新程序创建成功后再释放旧程序：反复切换着色器时 GPU 程序不会堆积，编译失败时保留旧画面
      this.program?.remove();
      this.program = program;
      this.mesh = new Mesh(this.renderer.gl, {
        geometry: this.geometry,
        program,
      });

      return true;
    } catch {
      return false;
    }
  }

  private draw(): void {
    if (!this.program || !this.mesh) {
      return;
    }

    const now = this.isPlaying ? Date.now() : this.prevDrawTime;

    // 帧率限制：未到帧间隔直接跳过，下一帧统一交给 animate 调度。
    // 这里若再请求一次 rAF，会与 animate 的请求叠加，回调数逐帧翻倍
    if (this.isPlaying && this.targetFPS < 60) {
      const elapsed = now - this.lastFrameTime;
      if (elapsed < this.frameInterval) {
        return;
      }
      this.lastFrameTime = now - (elapsed % this.frameInterval);
    }

    const date = new Date(now);

    if (this.firstDrawTime === 0) {
      this.firstDrawTime = now;
    }

    if (this.onDrawCallback) {
      this.onDrawCallback();
    }

    const iTimeDelta = (now - this.prevDrawTime) * 0.001 * this._speed;
    const iTime = (now - this.firstDrawTime) * 0.001 * this._speed;
    const iDate = [date.getFullYear(), date.getMonth(), date.getDate(), date.getTime() * 0.001];

    if (this.program && this.mesh) {
      // 更新 uniform
      this.program.uniforms.iResolution.value = [
        this.container.clientWidth * window.devicePixelRatio,
        this.container.clientHeight * window.devicePixelRatio,
        window.devicePixelRatio,
      ];
      this.program.uniforms.iTime.value = iTime;
      this.program.uniforms.iTimeDelta.value = iTimeDelta;
      this.program.uniforms.iFrameRate.value = this.targetFPS;
      this.program.uniforms.iFrame.value = this.iFrame;
      this.program.uniforms.iMouse.value = [
        this.iMouse.x,
        this.iMouse.y,
        this.iMouse.clickX,
        this.iMouse.clickY,
      ];
      this.program.uniforms.iDate.value = iDate;
      this.program.uniforms.iHSV.value = [this.hsv.hue, this.hsv.saturation, this.hsv.brightness];
      this.program.uniforms.iSpeed.value = this._speed;

      // 渲染
      this.renderer.render({ scene: this.mesh, camera: this.camera });
    }

    this.prevDrawTime = now;
    this.iFrame++;
  }

  private animate = (): void => {
    if (!this.isPlaying) {
      this.rafId = null;
      return;
    }
    this.draw();
    this.rafId = requestAnimationFrame(this.animate);
  };

  private cancelFrame(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // ─── 公开方法 ───

  public setShader(config: ShaderConfig): boolean {
    this.shaderSource = config.source;
    const success = this.compileProgram();

    // 播放中则立即重绘一帧
    if (success && this.isPlaying) {
      this.draw();
    }

    return success;
  }

  public setHSV(hsv: Partial<HSVControls>): void {
    if (hsv.hue !== undefined) this.hsv.hue = hsv.hue;
    if (hsv.saturation !== undefined) this.hsv.saturation = hsv.saturation;
    if (hsv.brightness !== undefined) this.hsv.brightness = hsv.brightness;

    // 暂停时立即重绘，让调整马上可见
    if (!this.isPlaying && this.program && this.mesh) {
      this.draw();
    }
  }

  public setHue(val: number) {
    this.hsv.hue = val;

    // 暂停时立即重绘，让调整马上可见
    if (!this.isPlaying && this.program && this.mesh) {
      this.draw();
    }
  }

  public setSaturation(val: number) {
    this.hsv.saturation = val;

    // 暂停时立即重绘，让调整马上可见
    if (!this.isPlaying && this.program && this.mesh) {
      this.draw();
    }
  }

  public setBrightness(val: number) {
    this.hsv.brightness = val;

    // 暂停时立即重绘，让调整马上可见
    if (!this.isPlaying && this.program && this.mesh) {
      this.draw();
    }
  }

  public getHSV(): HSVControls {
    return { ...this.hsv };
  }

  // 播放速度
  public setSpeed(val: number): void {
    this._speed = Math.max(0, val);

    // 暂停时立即重绘，让调整马上可见
    if (!this.isPlaying && this.program && this.mesh) {
      this.draw();
    }
  }

  public getSpeed(): number {
    return this._speed;
  }

  public setFrameRate(fps: number): void {
    this.targetFPS = Math.max(1, Math.min(60, fps));
    this.frameInterval = 1000 / this.targetFPS;
  }

  public getFrameRate(): number {
    return this.targetFPS;
  }

  public setOnDraw(callback: () => void): void {
    this.onDrawCallback = callback;
  }

  public time(): number {
    return (this.prevDrawTime - this.firstDrawTime) * 0.001 * this._speed;
  }

  public isPlayingState(): boolean {
    return this.isPlaying;
  }

  public reset(): void {
    const now = Date.now();
    this.firstDrawTime = now;
    this.prevDrawTime = now;
    this.lastFrameTime = now;
    this.iFrame = 0;
    this.draw();
  }

  public pause(): void {
    this.isPlaying = false;
    // 取消已排队的帧：否则同一帧内暂停后再播放，旧回调看到 isPlaying 为 true 会与新循环并行
    this.cancelFrame();
  }

  public play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      const now = Date.now();
      const elapsed = this.prevDrawTime - this.firstDrawTime;
      this.firstDrawTime = now - elapsed;
      this.prevDrawTime = now;
      this.lastFrameTime = now;
      this.animate();
    }
  }

  /**
   * 完整释放实例：停止循环、断开尺寸观察、删除 GPU 程序与几何体，并主动丢弃 WebGL 上下文。
   * 浏览器同时存活的 WebGL 上下文有数量上限（Chrome 约 16 个），只移除画布要等 GC 才回收，
   * 反复挂载会触发「Too many active WebGL contexts」，最早的上下文被强制丢失。
   * dispose 之后实例不可再用
   */
  public dispose(): void {
    this.pause();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.program?.remove();
    this.geometry.remove();
    this.mesh = null;
    this.program = null;
    this.renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    this.renderer.gl.canvas.remove();
  }

  // ─── 读写属性 ───

  public get mouseMode(): MouseMode {
    return this._mouseMode;
  }

  public set mouseMode(val: MouseMode) {
    this._mouseMode = val;
  }
  public get speed(): number {
    return this._speed;
  }

  public set speed(val: number) {
    this.setSpeed(val);
  }

  // 鼠标灵敏度
  public setMouseSensitivity(sensitivity: number): void {
    this._mouseSensitivity = Math.max(0.1, Math.min(5.0, sensitivity)); // 限制在 0.1 到 5.0 之间
  }

  public getMouseSensitivity(): number {
    return this._mouseSensitivity;
  }

  // 鼠标阻尼
  public setMouseDamping(damping: number): void {
    this._mouseDamping = Math.max(0, Math.min(0.99, damping)); // 限制在 0 到 0.99 之间
  }

  public getMouseDamping(): number {
    return this._mouseDamping;
  }
}
