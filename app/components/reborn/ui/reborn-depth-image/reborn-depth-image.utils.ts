/**
 * reborn-depth-image 的 WebGL 渲染器：按深度图对彩色图做视差位移，并在指定位置按表面朝向补光。
 *
 * 只依赖 WebGL 1，不引入 three：效果只需要一个全屏三角形和两张贴图，几十行着色器即可，
 * 换来的是组件可以单独复制进别的工程，且不额外拉取几百 KB 的依赖。
 */

/** 单帧渲染参数 */
export interface DepthRenderParams {
  /** 视差位移（uv 单位）：深度高于 focus 的像素朝这个方向移动 */
  shiftX: number;
  shiftY: number;
  /** 不随指针位移的深度层，0~1 */
  focus: number;
  /** 光源位置（uv 单位，原点在左下角） */
  lightX: number;
  lightY: number;
  /** 补光显现程度，0~1 */
  lit: number;
}

export interface DepthRenderer {
  /** 按显示尺寸（CSS px）调整画布，像素密度上限 2 */
  resize: (width: number, height: number) => void;
  /** 补光颜色，分量 0~1，第四项为强度 */
  setLightColor: (rgba: [number, number, number, number]) => void;
  render: (params: DepthRenderParams) => void;
  dispose: () => void;
}

const VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_color;
uniform sampler2D u_depth;
uniform vec2 u_shift;
uniform float u_focus;
uniform vec2 u_size;
uniform vec2 u_light;
uniform vec4 u_lightColor;
uniform float u_lit;
uniform vec2 u_depthTexel;
varying vec2 v_uv;

// 补光半径与光源离画面的高度（px）：光源越高，明暗过渡越平
const float REACH = 260.0;
const float HEIGHT = 120.0;
// 深度差换算成法线时的放大倍数：深度图做过模糊，原始差分太小，不放大看不出起伏
const float RELIEF = 6.0;

void main() {
  // 定点迭代：用位移后位置的深度修正位移量，近处物体的边缘才会盖住后面的物体，三次足够收敛
  vec2 uv = v_uv;
  float depth = texture2D(u_depth, uv).r;
  for (int i = 0; i < 3; i++) {
    uv = v_uv - u_shift * (depth - u_focus);
    depth = texture2D(u_depth, uv).r;
  }
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  vec4 color = texture2D(u_color, uv);
  if (color.a < 0.004) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // 由深度梯度求表面朝向，朝向光源的面更亮；近处额外提亮一点，突出前后层次
  float dx = texture2D(u_depth, uv + vec2(u_depthTexel.x, 0.0)).r - texture2D(u_depth, uv - vec2(u_depthTexel.x, 0.0)).r;
  float dy = texture2D(u_depth, uv + vec2(0.0, u_depthTexel.y)).r - texture2D(u_depth, uv - vec2(0.0, u_depthTexel.y)).r;
  vec3 normal = normalize(vec3(-dx * RELIEF, -dy * RELIEF, 1.0));
  vec2 toLight = (u_light - uv) * u_size;
  float diffuse = max(dot(normal, normalize(vec3(toLight, HEIGHT))), 0.0);
  float falloff = 1.0 - smoothstep(0.0, REACH, length(toLight));
  float amount = diffuse * falloff * u_lit * u_lightColor.a * (0.6 + 0.4 * depth);

  // 画布按预乘透明度合成，输出前乘上 alpha
  vec3 rgb = min(color.rgb + u_lightColor.rgb * amount, 1.0);
  gl_FragColor = vec4(rgb * color.a, color.a);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** 上传贴图：非 2 的幂尺寸在 WebGL 1 下只能用 CLAMP_TO_EDGE 且不生成 mipmap */
function upload(gl: WebGLRenderingContext, unit: number, image: HTMLImageElement) {
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  return texture;
}

/** 创建渲染器；浏览器不支持 WebGL 或着色器编译失败时返回 null，由调用方退回静态图 */
export function createDepthRenderer(
  canvas: HTMLCanvasElement,
  color: HTMLImageElement,
  depth: HTMLImageElement,
): DepthRenderer | null {
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // 一个盖住整个画布的三角形，比两个三角形拼的矩形少一次对角线插值
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  // 图片原点在左上、贴图原点在左下，上传时翻转；透明度保持未预乘，着色器里统一乘
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  const colorTexture = upload(gl, 0, color);
  const depthTexture = upload(gl, 1, depth);

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  gl.uniform1i(uniform("u_color"), 0);
  gl.uniform1i(uniform("u_depth"), 1);
  gl.uniform2f(uniform("u_depthTexel"), 1 / depth.naturalWidth, 1 / depth.naturalHeight);
  const locations = {
    shift: uniform("u_shift"),
    focus: uniform("u_focus"),
    size: uniform("u_size"),
    light: uniform("u_light"),
    lightColor: uniform("u_lightColor"),
    lit: uniform("u_lit"),
  };
  gl.uniform4f(locations.lightColor, 1, 1, 1, 0);
  gl.clearColor(0, 0, 0, 0);

  return {
    resize(width, height) {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(width * ratio));
      const pixelHeight = Math.max(1, Math.round(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      gl.viewport(0, 0, pixelWidth, pixelHeight);
      gl.uniform2f(locations.size, width, height);
    },
    setLightColor([r, g, b, a]) {
      gl.uniform4f(locations.lightColor, r, g, b, a);
    },
    render({ shiftX, shiftY, focus, lightX, lightY, lit }) {
      gl.uniform2f(locations.shift, shiftX, shiftY);
      gl.uniform1f(locations.focus, focus);
      gl.uniform2f(locations.light, lightX, lightY);
      gl.uniform1f(locations.lit, lit);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(colorTexture);
      gl.deleteTexture(depthTexture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // 主动释放上下文：浏览器对同时存在的 WebGL 上下文有数量上限，切页残留会挤掉别的画布
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
