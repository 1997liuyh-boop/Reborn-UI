/**
 * 首页「技术栈」Logo 跑马灯的交互与动效，逐行移植自活动页模板的 RacePartners 脚本。
 *
 * 由两部分组成：
 * 1. Logo 跑马灯与调速飞轮：右上角的 range 滑块（-3~3 倍速）控制 Logo 轨道的滚动方向与速度，
 *    拖动时带光泽扫过与「吃力」抖动；拖过 ±5.25 倍速即触发「过载」，进入 6 倍速故障态，4 秒后自动恢复；
 * 2. 过载冒烟：故障期间在飞轮上用 WebGL2 半拉格朗日流体模拟一团从缝隙里漏出的烟，带电弧闪光，4 秒后淡出。
 *
 * 入口根元素是 .race-partners（即 section#race-partners）。
 */

// ---------------------------------------------------------------------------
// 冒烟流体着色器
// ---------------------------------------------------------------------------

/** 流体网格的边长（纹素），所有模拟纹理都是 200×200 */
const FIELD_SIZE = 200;

/** 烟雾画布的 CSS 边长，实际像素尺寸再乘上不超过 1.5 的设备像素比 */
const SMOKE_CANVAS_SIZE = 400;

/** 冒烟持续时长（秒）：超过即停止并清空画布 */
const SMOKE_DURATION = 4;

/** 每帧压力泊松方程的雅可比迭代次数 */
const PRESSURE_ITERATIONS = 14;

/** 全屏四边形顶点着色器：把 [-1,1] 的位置换算成 0~1 的 uv */
const VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

/**
 * 各个模拟步骤共用的片元着色器头部：
 * - a/b/c 是按纹理单元顺序绑定的输入场，texel 为单个纹素在 uv 下的尺寸；
 * - linearSample：在 NEAREST 采样的半精度浮点纹理上手动做双线性插值；
 * - wheelPoint：把 uv 映射到以飞轮缝隙为原点的 400×400 局部坐标（缝隙中心在 (200,130)）；
 * - seamDistance / outwardNormal：到 176×20 缝隙矩形的有符号距离与外法线；
 * - outletRandom：以每次过载随机的 seed 打散的伪随机；
 * - source：七个出烟口。每次过载重新播种，各口强度不一（其中一个占主导），
 *   避免出现一圈等距、等量的喷口。
 */
const FRAGMENT_COMMON = `#version 300 es
precision highp float;
in vec2 uv;
out vec4 result;
uniform sampler2D a;
uniform sampler2D b;
uniform sampler2D c;
uniform vec2 texel;
uniform float dt;
uniform float time;
uniform float seed;
vec4 linearSample(sampler2D field,vec2 p){
  vec2 cell=clamp(p,texel*.5,1.-texel*.5)/texel-.5;
  vec2 f=fract(cell),base=(floor(cell)+.5)*texel;
  return mix(mix(texture(field,base),texture(field,base+vec2(texel.x,0.)),f.x),
    mix(texture(field,base+vec2(0.,texel.y)),texture(field,base+texel),f.x),f.y);
}
vec2 wheelPoint(vec2 p){return p*vec2(400.,400.)-vec2(200.,130.);}
float seamDistance(vec2 p){
  vec2 q=abs(wheelPoint(p))-vec2(88.,10.);
  return length(max(q,0.))+min(max(q.x,q.y),0.);
}
vec2 outwardNormal(vec2 p){
  vec2 local=wheelPoint(p);
  vec2 outside=local-clamp(local,vec2(-88.,-10.),vec2(88.,10.));
  if(length(outside)>.01)return normalize(outside);
  vec2 gap=vec2(88.,10.)-abs(local);
  return gap.x<gap.y?vec2(sign(local.x),0.):vec2(0.,sign(local.y));
}
float outletRandom(float n){return fract(sin(n*127.1+seed*31.7)*43758.5453);}
float source(vec2 p){
  vec2 local=wheelPoint(p);
  float amount=0.;
  float dominant=floor(outletRandom(29.)*7.);
  for(int i=0;i<7;i++){
    float id=float(i);
    float r=outletRandom(id+1.),r2=outletRandom(id+11.);
    vec2 centre;
    if(i<3)centre=vec2(-76.+(id+r)*50.,10.);
    else if(i<5)centre=vec2(-64.+(id-3.+r)*68.,-10.);
    else centre=vec2(i==5?-88.:88.,(r-.5)*15.);
    float along=7.+r2*r2*22.;
    vec2 radius=i<5?vec2(along,3.+r*2.):vec2(3.+r*2.,along*.55);
    vec2 q=(local-centre)/radius;
    float delay=outletRandom(id+41.)*.55;
    float duration=2.05+outletRandom(id+51.)*1.4;
    float pulse=smoothstep(delay,delay+.35,time)
      *(1.-smoothstep(delay+duration,delay+duration+.65,time));
    float strength=id==dominant?1.15:.12+.48*r2*r2;
    amount+=exp(-dot(q,q)*1.3)*pulse*strength;
  }
  return amount;
}

`;

/**
 * 各模拟步骤的片元着色器主体（拼在 FRAGMENT_COMMON 之后编译）：
 * - advect：沿速度场 a 回溯采样场 b，并按 exp(-dt*.13) 衰减；
 * - curl：速度场的旋度；
 * - force：涡度约束 + 浮力 + 出烟口推力。缝隙下方的烟贴着机壳横流，
 *   越过两端拐角后改由浮力主导向上飘；
 * - divergence / pressure / project：散度、雅可比压力迭代与投影去散度。
 *   project 里先把底部缝隙旁的气流引导成贴缝横流、到两端再圆滑上卷，
 *   再去掉指向金属面的法向速度，让烟只能绕过飞轮而不是穿过去；
 * - emit：密度场的小幅邻域混合（按时间步缩放，让被平流的烟团逐渐变柔、变宽），
 *   再叠加出烟口的新烟，3.1~3.55 秒停止出烟；
 * - render：把密度场合成为最终画面。出口处烟色近乎煤黑，稀释扩散后的烟更能接住光；
 *   只在画布边界与效果结束时淡出，没有自下而上的揭开遮罩；缝隙所在的金属面保持清晰，
 *   烟只从四周漏出；电弧由烟的密度门控，浓烟会遮住弧芯、只透出辉光。
 */
const PASS_SHADERS = {
  advect: `
void main(){
  vec2 v=texture(a,uv).xy;
  vec2 p=uv-v*dt*texel;
  result=linearSample(b,p)*exp(-dt*.13);
}`,
  curl: `
void main(){
  float l=texture(a,uv-vec2(texel.x,0.)).y;
  float r=texture(a,uv+vec2(texel.x,0.)).y;
  float d=texture(a,uv-vec2(0.,texel.y)).x;
  float u=texture(a,uv+vec2(0.,texel.y)).x;
  result=vec4((r-l-u+d)*.5,0.,0.,1.);
}`,
  force: `
void main(){
  float l=abs(texture(b,uv-vec2(texel.x,0.)).r);
  float r=abs(texture(b,uv+vec2(texel.x,0.)).r);
  float d=abs(texture(b,uv-vec2(0.,texel.y)).r);
  float u=abs(texture(b,uv+vec2(0.,texel.y)).r);
  vec2 grad=vec2(r-l,u-d)*.5;
  grad/=length(grad)+.0001;
  float spin=texture(b,uv).r;
  vec2 confinement=vec2(grad.y,-grad.x)*spin*2.8;
  float density=texture(c,uv).r;
  vec2 v=texture(a,uv).xy;
  vec2 outward=outwardNormal(uv);
  vec2 tangent=vec2(-outward.y,outward.x);
  float distanceFromSeam=max(seamDistance(uv),0.);
  float burst=1.-smoothstep(15.,95.,distanceFromSeam);
  vec2 local=wheelPoint(uv);
  float side=local.x<0.?-1.:1.;
  float under=1.-smoothstep(-8.,2.,local.y);
  float turn=smoothstep(76.,104.,abs(local.x));
  vec2 lowerFlow=normalize(vec2(side*(1.-turn),turn+.001));
  vec2 upperFlow=normalize(vec2(outward.x*.65,max(outward.y,0.)+.8));
  vec2 direction=normalize(mix(upperFlow,lowerFlow,under));
  float lift=mix(70.,0.,under*(1.-turn));
  v+=dt*(confinement+density*(direction*burst*90.+vec2(0.,lift)));
  float emission=source(uv);
  float churn=sin(time*1.8+uv.x*17.+uv.y*11.+seed);
  v+=dt*emission*(direction*490.+tangent*churn*35.);
  v+=dt*density*tangent*10.*sin(time*1.2+uv.y*17.-uv.x*13.);
  if(uv.x<texel.x||uv.x>1.-texel.x)v.x=0.;
  if(uv.y<texel.y)v.y=max(v.y,0.);
  result=vec4(clamp(v,vec2(-140.),vec2(140.)),0.,1.);
}`,
  divergence: `
void main(){
  vec2 v=texture(a,uv).xy;
  float l=uv.x<texel.x?-v.x:texture(a,uv-vec2(texel.x,0.)).x;
  float r=uv.x>1.-texel.x?-v.x:texture(a,uv+vec2(texel.x,0.)).x;
  float d=uv.y<texel.y?-v.y:texture(a,uv-vec2(0.,texel.y)).y;
  float u=texture(a,uv+vec2(0.,texel.y)).y;
  result=vec4((r-l+u-d)*.5,0.,0.,1.);
}`,
  pressure: `
void main(){
  float l=texture(a,uv-vec2(texel.x,0.)).r;
  float r=texture(a,uv+vec2(texel.x,0.)).r;
  float d=texture(a,uv-vec2(0.,texel.y)).r;
  float u=texture(a,uv+vec2(0.,texel.y)).r;
  result=vec4((l+r+d+u-texture(b,uv).r)*.25,0.,0.,1.);
}`,
  project: `
void main(){
  float l=texture(b,uv-vec2(texel.x,0.)).r;
  float r=texture(b,uv+vec2(texel.x,0.)).r;
  float d=texture(b,uv-vec2(0.,texel.y)).r;
  float u=texture(b,uv+vec2(0.,texel.y)).r;
  vec2 v=texture(a,uv).xy-vec2(r-l,u-d)*.5;
  vec2 local=wheelPoint(uv);
  float side=local.x<0.?-1.:1.;
  float turn=smoothstep(76.,104.,abs(local.x));
  float underside=(1.-smoothstep(-8.,0.,local.y))
    *(1.-smoothstep(104.,124.,abs(local.x)))
    *exp(-pow((local.y+16.)/23.,2.));
  vec2 along=vec2(side*38.*(1.-turn),40.*turn
    +clamp((-16.-local.y)*1.2,-8.,8.)*(1.-turn));
  v=mix(v,along,underside*(1.-exp(-dt*9.)));
  float wall=1.-smoothstep(0.,4.,abs(seamDistance(uv)));
  vec2 normal=outwardNormal(uv);
  v-=normal*min(dot(v,normal),0.)*wall;
  result=vec4(v,0.,1.);
}`,
  emit: `
void main(){
  float density=texture(a,uv).r;
  float neighbours=(texture(a,uv-vec2(texel.x,0.)).r+texture(a,uv+vec2(texel.x,0.)).r
    +texture(a,uv-vec2(0.,texel.y)).r+texture(a,uv+vec2(0.,texel.y)).r)*.25;
  density=mix(density,neighbours,1.-exp(-dt*6.));
  float emission=source(uv)*(1.-smoothstep(3.1,3.55,time));
  result=vec4(min(3.,density+emission*dt*18.),0.,0.,1.);
}`,
  render: `
float segmentDistance(vec2 p,vec2 a0,vec2 b0){
  vec2 d=b0-a0;
  return length(p-a0-d*clamp(dot(p-a0,d)/dot(d,d),0.,1.));
}
vec2 smokeArcs(vec2 p){
  float core=0.,halo=0.;
  for(int j=0;j<2;j++){
    float id=float(j);
    float clock=time-id*.57-.35;
    float cycle=floor(clock/1.4);
    float phase=fract(clock/1.4)*1.4;
    float flash=(1.-smoothstep(.065,.16,phase))*step(0.,clock);
    float key=cycle*13.+id*7.;
    float r=outletRandom(key+81.);
    vec2 start=vec2((r-.5)*175.,12.+outletRandom(key+82.)*42.);
    float direction=r>.5?-1.:1.;
    vec2 previous=start;
    for(int k=1;k<=5;k++){
      float n=float(k);
      vec2 next=start+vec2(direction*n*6.+(outletRandom(key+90.+n)-.5)*16.,n*7.);
      float distance=segmentDistance(p,previous,next);
      core+=exp(-distance*distance/0.32)*flash;
      halo+=exp(-distance*distance/16.)*flash;
      previous=next;
    }
  }
  return vec2(core,halo);
}
void main(){
  float density=linearSample(a,uv).r;
  float above=linearSample(a,uv+vec2(-.009,.00975)).r;
  float below=linearSample(a,uv+vec2(.009,-.00975)).r;
  float distanceFromSeam=max(seamDistance(uv),0.);
  float spread=smoothstep(3.,72.,distanceFromSeam);
  float dilution=1.-smoothstep(.15,1.5,density);
  float tone=mix(.18,.40,spread)+dilution*spread*.11;
  float light=clamp(tone+(below-above)*mix(.045,.13,spread),.14,.54);
  float edge=smoothstep(0.,.10,uv.x)*(1.-smoothstep(.90,1.,uv.x))
    *smoothstep(0.,.078,uv.y)*(1.-smoothstep(.80,1.,uv.y));
  edge*=smoothstep(-5.,1.,seamDistance(uv));
  float opacityScale=mix(2.8,1.15,spread);
  float alpha=(1.-exp(-density*opacityScale))*mix(1.,.72,spread)
    *edge*(1.-smoothstep(3.65,4.,time));
  vec2 arcs=smokeArcs(wheelPoint(uv));
  float smokePresence=smoothstep(.045,.24,density)*edge
    *(1.-smoothstep(3.65,4.,time));
  float spark=clamp((arcs.x*.9+arcs.y*.08)*smokePresence*exp(-density*.45),0.,.85);
  vec3 electric=mix(vec3(.25,.55,.8),vec3(.82,.94,1.),clamp(arcs.x,0.,1.));
  result=vec4(vec3(light)*alpha*(1.-spark)+electric*spark,alpha+spark*(1.-alpha));
}`,
};

type PassName = keyof typeof PASS_SHADERS;

/** 着色器里用到的全部 uniform 名 */
const UNIFORM_NAMES = ["a", "b", "c", "texel", "dt", "time", "seed"] as const;

type UniformName = (typeof UNIFORM_NAMES)[number];

/** 第 n 个输入纹理对应的采样器名 */
const SAMPLER_NAMES = ["a", "b", "c"] as const;

/** 编译好的模拟步骤程序 */
interface PassProgram {
  program: WebGLProgram;
  uniforms: Record<UniformName, WebGLUniformLocation | null>;
}

/** 一张可渲染的浮点纹理及其帧缓冲 */
interface FluidTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/** 读写交替的一对纹理（乒乓缓冲） */
interface DoubleTarget {
  read: FluidTarget;
  write: FluidTarget;
  swap: () => void;
}

/** 流体模拟用到的全部场 */
interface FluidFields {
  velocity: DoubleTarget;
  density: DoubleTarget;
  pressure: DoubleTarget;
  curl: FluidTarget;
  divergence: FluidTarget;
}

/** 冒烟效果的控制句柄 */
interface SmokeEffect {
  /** 开始一次新的冒烟：按需初始化 WebGL，清空全部场并重新播种 */
  start: () => void;
  /** 切换动画循环；只有 start 成功初始化过才会真正运行 */
  setRunning: (running: boolean) => void;
  /** 停止循环并清空画布 */
  stop: () => void;
  /** 彻底销毁：释放 GPU 资源并丢弃上下文 */
  dispose: () => void;
}

/**
 * 在给定画布上创建过载冒烟效果
 *
 * WebGL2 上下文在第一次 start 时才创建；要求支持浮点渲染目标（EXT_color_buffer_float），
 * 不支持或编译失败时只打一条警告，之后不再尝试（直到上下文丢失后恢复）。
 */
function createSmokeEffect(canvas: HTMLCanvasElement): SmokeEffect {
  const originalWidth = canvas.getAttribute("width");
  const originalHeight = canvas.getAttribute("height");

  let gl: WebGL2RenderingContext | null = null;
  let quad: WebGLBuffer | null = null;
  let programs: Partial<Record<PassName, PassProgram>> | null = null;
  let fields: FluidFields | null = null;
  let targets: FluidTarget[] = [];
  let frameId = 0;
  let startTime = 0;
  let lastTime = 0;
  let seed = 0;
  let running = false;
  let disposed = false;
  let failed = false;

  /** 停止循环，并把画布清成透明 */
  function stop(): void {
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
    if (gl && !gl.isContextLost()) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  /** 删除全部纹理、帧缓冲、程序与顶点缓冲（上下文已丢失时只清空引用） */
  function release(): void {
    if (gl && !gl.isContextLost()) {
      for (const target of targets) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const pass of Object.values(programs || {})) gl.deleteProgram(pass.program);
      if (quad) gl.deleteBuffer(quad);
    }
    targets = [];
    programs = null;
    quad = null;
  }

  function compileShader(context: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = context.createShader(type);
    if (!shader) throw new Error("Smoke shader unavailable");
    context.shaderSource(shader, source);
    context.compileShader(shader);
    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      const log = context.getShaderInfoLog(shader);
      context.deleteShader(shader);
      throw new Error(String(log));
    }
    return shader;
  }

  /** 编译某一个模拟步骤的程序，顶点属性 position 固定绑定在 0 号位 */
  function createPassProgram(context: WebGL2RenderingContext, body: string): PassProgram {
    let vertex: WebGLShader | undefined;
    let fragment: WebGLShader | undefined;
    let program: WebGLProgram | undefined;
    try {
      vertex = compileShader(context, context.VERTEX_SHADER, VERTEX_SHADER);
      fragment = compileShader(context, context.FRAGMENT_SHADER, FRAGMENT_COMMON + body);
      program = context.createProgram();
      context.attachShader(program, vertex);
      context.attachShader(program, fragment);
      context.bindAttribLocation(program, 0, "position");
      context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS))
        throw new Error(String(context.getProgramInfoLog(program)));
      const linked = program;
      return {
        program: linked,
        uniforms: Object.fromEntries(
          UNIFORM_NAMES.map(name => [name, context.getUniformLocation(linked, name)]),
        ) as Record<UniformName, WebGLUniformLocation | null>,
      };
    }
    catch (error) {
      if (program) context.deleteProgram(program);
      throw error;
    }
    finally {
      if (vertex) context.deleteShader(vertex);
      if (fragment) context.deleteShader(fragment);
    }
  }

  /** 创建一张 200×200 的 RGBA16F 纹理并挂到新帧缓冲上 */
  function createTarget(context: WebGL2RenderingContext): FluidTarget {
    const texture = context.createTexture();
    const framebuffer = context.createFramebuffer();
    const target: FluidTarget = { texture, framebuffer };
    targets.push(target);
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texImage2D(
      context.TEXTURE_2D,
      0,
      context.RGBA16F,
      FIELD_SIZE,
      FIELD_SIZE,
      0,
      context.RGBA,
      context.HALF_FLOAT,
      null,
    );
    context.bindFramebuffer(context.FRAMEBUFFER, framebuffer);
    context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, texture, 0);
    if (context.checkFramebufferStatus(context.FRAMEBUFFER) !== context.FRAMEBUFFER_COMPLETE)
      throw new Error("Smoke fluid framebuffer unavailable");
    return target;
  }

  function createDoubleTarget(context: WebGL2RenderingContext): DoubleTarget {
    const pair: DoubleTarget = {
      read: createTarget(context),
      write: createTarget(context),
      swap() {
        [pair.read, pair.write] = [pair.write, pair.read];
      },
    };
    return pair;
  }

  /** 按需初始化 WebGL2 资源；已初始化返回 true，失败过或已销毁返回 false */
  function initialize(): boolean {
    if (programs) return true;
    if (failed || disposed) return false;
    try {
      gl = canvas.getContext("webgl2", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
      });
      if (!gl || !gl.getExtension("EXT_color_buffer_float"))
        throw new Error("Smoke fluid requires WebGL2 float render targets");
      const context = gl;
      programs = {};
      for (const name of Object.keys(PASS_SHADERS) as PassName[])
        programs[name] = createPassProgram(context, PASS_SHADERS[name]);
      quad = context.createBuffer();
      context.bindBuffer(context.ARRAY_BUFFER, quad);
      context.bufferData(
        context.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        context.STATIC_DRAW,
      );
      context.enableVertexAttribArray(0);
      context.vertexAttribPointer(0, 2, context.FLOAT, false, 0, 0);
      fields = {
        velocity: createDoubleTarget(context),
        density: createDoubleTarget(context),
        pressure: createDoubleTarget(context),
        curl: createTarget(context),
        divergence: createTarget(context),
      };
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(SMOKE_CANVAS_SIZE * ratio);
      canvas.height = Math.round(SMOKE_CANVAS_SIZE * ratio);
      return true;
    }
    catch (error) {
      console.warn("[Payathon smoke]", error);
      release();
      failed = true;
      return false;
    }
  }

  /**
   * 执行一个模拟步骤
   * @param pass 步骤名
   * @param target 输出目标；为 null 时直接画到画布
   * @param inputs 按顺序绑定到 a、b、c 采样器的输入场
   * @param dt 本步时长（秒）
   * @param time 冒烟开始后经过的时间（秒）
   */
  function runPass(pass: PassName, target: FluidTarget | null, inputs: FluidTarget[], dt: number, time: number): void {
    const context = gl!;
    const { program, uniforms } = programs![pass]!;
    context.useProgram(program);
    context.bindFramebuffer(context.FRAMEBUFFER, target?.framebuffer || null);
    context.viewport(0, 0, target ? FIELD_SIZE : canvas.width, target ? FIELD_SIZE : canvas.height);
    inputs.forEach((input, unit) => {
      context.activeTexture(context.TEXTURE0 + unit);
      context.bindTexture(context.TEXTURE_2D, input.texture);
      context.uniform1i(uniforms[SAMPLER_NAMES[unit]!], unit);
    });
    context.uniform2f(uniforms.texel, 1 / FIELD_SIZE, 1 / FIELD_SIZE);
    context.uniform1f(uniforms.dt, dt);
    context.uniform1f(uniforms.time, time);
    context.uniform1f(uniforms.seed, seed);
    context.drawArrays(context.TRIANGLES, 0, 6);
  }

  /** 推进一个模拟子步：平流 → 旋度 → 外力 → 散度 → 压力迭代 → 投影 → 密度平流 → 出烟 */
  function step(dt: number, time: number): void {
    const { velocity, density, pressure, curl, divergence } = fields!;
    runPass("advect", velocity.write, [velocity.read, velocity.read], dt, time);
    velocity.swap();
    runPass("curl", curl, [velocity.read], dt, time);
    runPass("force", velocity.write, [velocity.read, curl, density.read], dt, time);
    velocity.swap();
    runPass("divergence", divergence, [velocity.read], dt, time);
    for (let index = 0; index < PRESSURE_ITERATIONS; index++) {
      runPass("pressure", pressure.write, [pressure.read, divergence], dt, time);
      pressure.swap();
    }
    runPass("project", velocity.write, [velocity.read, pressure.read], dt, time);
    velocity.swap();
    runPass("advect", density.write, [velocity.read, density.read], dt, time);
    density.swap();
    runPass("emit", density.write, [density.read], dt, time);
    density.swap();
  }

  /** 动画帧：单帧时长上限 1/30 秒，并按 60Hz 切成若干子步，保证模拟稳定 */
  function frame(now: number): void {
    frameId = 0;
    if (!running || disposed || !programs) return;
    const elapsed = (now - startTime) / 1e3;
    if (elapsed >= SMOKE_DURATION) {
      stop();
      return;
    }
    const delta = Math.min((now - lastTime) / 1e3, 1 / 30);
    lastTime = now;
    const steps = Math.max(1, Math.ceil(delta * 60));
    for (let index = 0; index < steps; index++)
      step(delta / steps, elapsed - delta + ((index + 1) * delta) / steps);
    runPass("render", null, [fields!.density.read], delta, elapsed);
    frameId = requestAnimationFrame(frame);
  }

  const onContextLost = (event: Event): void => {
    event.preventDefault();
    stop();
    release();
  };
  const onContextRestored = (): void => {
    failed = false;
  };
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);

  return {
    start() {
      if (!initialize()) return;
      const context = gl!;
      stop();
      context.clearColor(0, 0, 0, 0);
      for (const target of targets) {
        context.bindFramebuffer(context.FRAMEBUFFER, target.framebuffer);
        context.clear(context.COLOR_BUFFER_BIT);
      }
      context.bindFramebuffer(context.FRAMEBUFFER, null);
      seed = Math.random() * 50;
      startTime = lastTime = performance.now();
    },
    setRunning(next) {
      if (!next) {
        if (running) stop();
        return;
      }
      if (!programs || disposed || running) return;
      running = true;
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    },
    stop,
    dispose() {
      stop();
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      release();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
      // 还原初始化时改写的画布尺寸属性
      restoreAttribute(canvas, "width", originalWidth);
      restoreAttribute(canvas, "height", originalHeight);
    },
  };
}

/** 把属性写回原值；原本没有该属性则移除 */
function restoreAttribute(element: Element, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

// ---------------------------------------------------------------------------
// Logo 跑马灯与调速飞轮
// ---------------------------------------------------------------------------

/**
 * 跑马灯 1 倍速下的滚动速度（像素/毫秒）。
 * 原站把一整份 Logo 列表滚完定为 110 秒，桌面端那份列表约 4737px 宽；
 * 这里改成按速度换算时长，列表里的 Logo 增减时滚动快慢保持不变
 */
const MARQUEE_SPEED = 4737 / 11e4;

/** 量不到列表宽度（例如区块被隐藏）时的兜底时长（毫秒） */
const MARQUEE_FALLBACK_DURATION = 11e4;

/** 拖动超过该倍速即触发过载 */
const OVERLOAD_THRESHOLD = 5.25;

/** 过载后自动恢复的延时（毫秒） */
const OVERLOAD_RECOVERY = 4e3;

/** 滑块的初始倍速，恢复时写回 */
const DEFAULT_SPEED = "-1.5";

/** 一次拖动的起点信息 */
interface DragState {
  id: number;
  x: number;
  speed: number;
  width: number;
  moved: boolean;
}

/**
 * 挂载「技术栈」Logo 跑马灯区块
 * @param root 区块根元素 .race-partners
 * @returns 卸载函数：停止动画、移除监听并还原改写过的属性
 */
export function mountRacePartners(root: HTMLElement): () => void {
  const speedControl = root.querySelector<HTMLElement>(".race-partners-speed")!;
  const input = speedControl.querySelector("input")!;
  const wheel = input.parentElement!;
  const track = root.querySelector<HTMLElement>(".race-partners-track")!;
  const glint = root.querySelector<HTMLElement>(".race-partners-wheel-glint")!;
  const errorLabel = root.querySelector<HTMLElement>(".race-partners-error")!;
  const smoke = createSmokeEffect(root.querySelector<HTMLCanvasElement>(".race-partners-smoke")!);
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)");
  const controller = new AbortController();
  const listenerOptions = { signal: controller.signal };
  const originalValueText = input.getAttribute("aria-valuetext");

  let intersecting = false;
  let speed = Number(input.value);
  let glintAnimation: Animation | undefined;
  let drag: DragState | undefined;
  let recoveryTimer = 0;

  root.setAttribute("data-ready", "");

  // 跑马灯滚完半程（一整份 Logo 列表）所需的时长：按 data-ready 之后的单行列表宽度换算
  const listWidth = track.querySelector<HTMLElement>(".race-partners-list")?.offsetWidth ?? 0;
  const marqueeDuration = listWidth > 0 ? listWidth / MARQUEE_SPEED : MARQUEE_FALLBACK_DURATION;

  // 轨道里放了两份 Logo 列表，平移 -50% 恰好无缝衔接；倍速通过播放速率控制
  const marquee = track.animate([{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }], {
    duration: marqueeDuration,
    iterations: Infinity,
    easing: "linear",
  });
  marquee.pause();
  marquee.currentTime = marqueeDuration;

  /** 根据可见性、减弱动效偏好与当前倍速，同步跑马灯、冒烟与光泽的运行状态 */
  function sync(): void {
    const running = intersecting && !document.hidden && !reducedMotion.matches && speed !== 0;
    root.toggleAttribute("data-running", running);
    smoke.setRunning(running && root.hasAttribute("data-error"));
    speedControl.hidden = reducedMotion.matches;
    if (speed !== 0) marquee.updatePlaybackRate(-speed);
    if (running) {
      // 向右滚是倒放，播到起点会结束，需要先拨回终点
      if (speed > 0 && Number(marquee.currentTime) <= 0) marquee.currentTime = marqueeDuration;
      marquee.play();
    }
    else {
      marquee.pause();
    }
    if (reducedMotion.matches || document.hidden || !intersecting) glintAnimation?.cancel();
  }

  marquee.onfinish = () => {
    if (speed > 0) {
      marquee.currentTime = marqueeDuration;
      sync();
    }
  };

  /**
   * 读取滑块倍速，更新读屏文案与飞轮位置
   * @returns 相对上一次的变化方向：变大或不变为 1，变小为 -1
   */
  function readSpeed(): 1 | -1 {
    const previous = speed;
    speed = Number(input.value);
    input.setAttribute(
      "aria-valuetext",
      speed === 0 ? "停止" : `向${speed < 0 ? "左" : "右"} ${Math.abs(speed).toFixed(1)} 倍速`,
    );
    speedControl.style.setProperty("--wheel-position", `${((speed + 3) / 6) * 100}%`);
    speedControl.style.setProperty("--wheel-offset", `${(speed + 1) * 64}px`);
    sync();
    return speed >= previous ? 1 : -1;
  }

  /** 结束拖动：清掉拖动与吃力态，并释放指针捕获 */
  function endDrag(): void {
    const id = drag?.id;
    drag = undefined;
    if (id !== undefined) input.blur();
    wheel.removeAttribute("data-dragging");
    speedControl.removeAttribute("data-straining");
    speedControl.style.removeProperty("--wheel-shake");
    speedControl.style.removeProperty("--wheel-tilt");
    if (id !== undefined && !recoveryTimer) readSpeed();
    if (id !== undefined && input.hasPointerCapture(id)) input.releasePointerCapture(id);
  }

  /** 从过载中恢复：倍速回到默认值 */
  function recover(): void {
    clearTimeout(recoveryTimer);
    recoveryTimer = 0;
    root.removeAttribute("data-error");
    errorLabel.textContent = "";
    input.disabled = false;
    input.value = DEFAULT_SPEED;
    readSpeed();
  }

  /**
   * 进入过载：锁定滑块，按拖动方向以 6 倍速狂转并冒烟，4 秒后恢复
   * @param direction 拖动方向，-1 向左、1 向右
   */
  function overload(direction: number): void {
    endDrag();
    glintAnimation?.cancel();
    root.setAttribute("data-error", "");
    smoke.start();
    input.disabled = true;
    speed = direction * 6;
    errorLabel.textContent = "ERROR";
    input.setAttribute("aria-valuetext", `故障，向${direction < 0 ? "左" : "右"} 6 倍速，4 秒后恢复`);
    sync();
    recoveryTimer = window.setTimeout(recover, OVERLOAD_RECOVERY);
  }

  /** 滑块数值变化：更新倍速，并让飞轮上的光泽顺着变化方向扫过一次 */
  function onInput(): void {
    if (recoveryTimer) return;
    const direction = readSpeed();
    glintAnimation?.cancel();
    if (intersecting && !reducedMotion.matches && !document.hidden) {
      glintAnimation = glint.animate(
        [
          { opacity: 0, transform: `translateX(${-12 * direction}px)` },
          { opacity: 0.85, offset: 0.18, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${20 * direction}px)` },
        ],
        { duration: 420, easing: "ease-out" },
      );
    }
  }

  /** 按下即开始自定义拖动（不走原生滑块的跳点行为） */
  function onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0 || recoveryTimer) return;
    event.preventDefault();
    wheel.setAttribute("data-dragging", "");
    input.focus({ preventScroll: true });
    drag = {
      id: event.pointerId,
      x: event.clientX,
      speed: Number(input.value),
      width: input.getBoundingClientRect().width,
      moved: false,
    };
    input.setPointerCapture(event.pointerId);
  }

  /**
   * 拖动：滑块全宽对应 6 倍速。超出 ±3 的部分不再改变倍速，而是让飞轮「吃力」抖动、倾斜，
   * 位置按 3 + v/(1+v) 渐近逼近；超过 ±5.25 直接过载
   */
  function onPointerMove(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.id || recoveryTimer) return;
    const deltaX = event.clientX - drag.x;
    if (!drag.moved && Math.abs(deltaX) < 3) return;
    drag.moved = true;
    const target = drag.speed + (deltaX / Math.max(1, drag.width)) * 6;
    if (Math.abs(target) >= OVERLOAD_THRESHOLD) {
      overload(Math.sign(target));
      return;
    }
    const snapped = Math.round(Math.max(-3, Math.min(3, target)) * 10) / 10;
    if (snapped !== Number(input.value)) {
      input.value = String(snapped);
      onInput();
    }
    const excess = Math.max(0, Math.abs(target) - 3);
    const strain = Math.min(1, excess / 2.25);
    const visual = excess > 0 ? Math.sign(target) * (3 + excess / (1 + excess)) : target;
    speedControl.toggleAttribute("data-straining", excess > 0);
    speedControl.style.setProperty("--wheel-shake", `${4 * strain * strain}px`);
    speedControl.style.setProperty("--wheel-tilt", `${9 * strain * strain}deg`);
    speedControl.style.setProperty("--wheel-position", `${((visual + 3) / 6) * 100}%`);
    speedControl.style.setProperty("--wheel-offset", `${(visual + 1) * 64}px`);
  }

  input.addEventListener("input", onInput, listenerOptions);
  input.addEventListener("pointerdown", onPointerDown, listenerOptions);
  input.addEventListener("pointermove", onPointerMove, listenerOptions);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    input.addEventListener(type, endDrag, listenerOptions);
  window.addEventListener("blur", endDrag, listenerOptions);
  input.addEventListener("click", event => event.preventDefault(), listenerOptions);
  document.addEventListener("visibilitychange", sync, listenerOptions);
  reducedMotion.addEventListener(
    "change",
    () => {
      if (reducedMotion.matches && recoveryTimer) recover();
      else sync();
    },
    listenerOptions,
  );

  const observer = new IntersectionObserver((entries) => {
    intersecting = !!entries[0]?.isIntersecting;
    sync();
  });
  observer.observe(root);
  readSpeed();

  return () => {
    endDrag();
    clearTimeout(recoveryTimer);
    marquee.onfinish = null;
    marquee.cancel();
    glintAnimation?.cancel();
    smoke.dispose();
    observer.disconnect();
    controller.abort();
    root.removeAttribute("data-running");
    root.removeAttribute("data-ready");
    root.removeAttribute("data-error");
    errorLabel.textContent = "";
    input.disabled = false;
    input.value = DEFAULT_SPEED;
    speedControl.hidden = true;
    // 原实现卸载时未清理的部分：飞轮位置变量与读屏文案
    speedControl.style.removeProperty("--wheel-position");
    speedControl.style.removeProperty("--wheel-offset");
    restoreAttribute(input, "aria-valuetext", originalValueText);
  };
}
