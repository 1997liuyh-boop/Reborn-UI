<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import { flameShader } from "./flameShader";

interface Props { paused?: boolean }
const props = defineProps<Props>();
const canvas = useTemplateRef<HTMLCanvasElement>("canvas");
const failed = ref(false);
let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let buffer: WebGLBuffer | null = null;
let resizeObserver: ResizeObserver | undefined;
let intersectionObserver: IntersectionObserver | undefined;
let frame = 0;
let visible = true;
let elapsed = 0;
let lastTime = 0;
let resolution: WebGLUniformLocation | null = null;
let time: WebGLUniformLocation | null = null;

function compile(type: number, source: string) {
  const shader = gl!.createShader(type)!;
  gl!.shaderSource(shader, source);
  gl!.compileShader(shader);
  if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
    gl!.deleteShader(shader);
    throw new Error("火焰着色器编译失败");
  }
  return shader;
}

function draw() {
  if (!gl || !program || failed.value) return;
  gl.uniform2f(resolution, gl.canvas.width, gl.canvas.height);
  gl.uniform1f(time, elapsed + 4);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function tick(now: number) {
  // 限制为每秒 30 帧，避免装饰动画占用过多资源。
  if (!lastTime) lastTime = now;
  if (now - lastTime >= 1000 / 30) {
    elapsed += Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    draw();
  }
  frame = requestAnimationFrame(tick);
}

function syncPlayback() {
  cancelAnimationFrame(frame);
  lastTime = 0;
  if (gl && !failed.value && !props.paused && visible && !document.hidden) frame = requestAnimationFrame(tick);
}

function resize() {
  if (!canvas.value || !gl) return;
  const box = canvas.value.getBoundingClientRect();
  // 装饰层以 CSS 像素绘制，不放大高像素密度屏幕的 GPU 开销。
  canvas.value.width = Math.max(1, Math.round(box.width));
  canvas.value.height = Math.max(1, Math.round(box.height));
  gl.viewport(0, 0, canvas.value.width, canvas.value.height);
  draw();
}

function contextLost(event: Event) {
  event.preventDefault();
  failed.value = true;
  cancelAnimationFrame(frame);
}

onMounted(() => {
  try {
    gl = canvas.value!.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: "low-power" });
    if (!gl) throw new Error("WebGL 不可用");
    program = gl.createProgram()!;
    const vertex = compile(gl.VERTEX_SHADER, "attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}");
    gl.attachShader(program, vertex);
    gl.deleteShader(vertex);
    const fragment = compile(gl.FRAGMENT_SHADER, flameShader);
    gl.attachShader(program, fragment);
    gl.deleteShader(fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("火焰程序链接失败");
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    resolution = gl.getUniformLocation(program, "iResolution");
    time = gl.getUniformLocation(program, "iTime");
    gl.uniform1f(gl.getUniformLocation(program, "uScale"), 6);
    gl.uniform1f(gl.getUniformLocation(program, "uSpeed"), 0.65);
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas.value!);
    intersectionObserver = new IntersectionObserver(([entry]) => { visible = entry?.isIntersecting ?? false; syncPlayback(); });
    intersectionObserver.observe(canvas.value!);
    document.addEventListener("visibilitychange", syncPlayback);
    syncPlayback();
  } catch {
    // 无 WebGL 或编译失败时，保留静态暖色光晕，不阻断首页内容。
    failed.value = true;
  }
});

watch(() => props.paused, syncPlayback);
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  document.removeEventListener("visibilitychange", syncPlayback);
  if (buffer) gl?.deleteBuffer(buffer);
  if (program) gl?.deleteProgram(program);
});
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none overflow-hidden">
    <div v-if="failed" class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#ff6a2080,transparent_65%)]" />
    <canvas ref="canvas" :class="{ invisible: failed }" class="block size-full" @webglcontextlost="contextLost" />
  </div>
</template>
