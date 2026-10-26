<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from "vue";

/**
 * 烟花 / 彩纸屑组件的配置属性
 */
export interface FireworksProps {
  /**
   * 单次发射的粒子数量
   * @defaultValue 160
   */
  burstCount?: number;
  /**
   * 是否将 canvas 传送到 body 下（解决在特定容器中 z-index 被遮挡的问题）
   * @defaultValue false
   */
  teleport?: boolean;
  /**
   * 发射的中心角度，270 度默认向上发射
   * @defaultValue 270
   */
  angleCenter?: number;
  /**
   * 发射角度的散射范围，130 度表示一个扇形区域
   * @defaultValue 130
   */
  angleSpread?: number;
  /**
   * 粒子的最小初速度
   * @defaultValue 8
   */
  speedMin?: number;
  /**
   * 粒子的最大初速度
   * @defaultValue 25
   */
  speedMax?: number;
  /**
   * 粒子尺寸的整体缩放比例（1 为默认大小，>1 变大，<1 变小）
   * @defaultValue 1
   */
  particleScale?: number;
}

/** 默认插槽与 overlay 插槽下发的作用域参数 */
export interface FireworksSlotProps {
  /** 发射烟花，参数同 expose 的 launch */
  launch: (elOrEvent?: HTMLElement | EventTarget | MouseEvent | null) => void;
  /** 是否处于刚发射后的 150ms 内，可用于触发插槽内元素的微交互 */
  launched: boolean;
  /** 累计发射次数 */
  launchCount: number;
}

// 多根节点（Teleport + 容器）：关闭自动继承，透传属性统一落在容器上
defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<FireworksProps>(), {
  burstCount: 160,
  teleport: false,
  angleCenter: 270,
  angleSpread: 130,
  speedMin: 8,
  speedMax: 25,
  particleScale: 1,
});

defineSlots<{
  /** 基础内容 */
  default?: (props: FireworksSlotProps) => any;
  /** 悬浮在内容上方的覆盖层，用于放置固定的交互按钮等 */
  overlay?: (props: FireworksSlotProps) => any;
}>();

// 容器和画布的引用；teleport 开关的两个分支互斥，共用同一个 canvasRef
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

// 状态记录
const launchCount = shallowRef(0); // 发射总次数
const launched = shallowRef(false); // 当前是否处于刚发射的状态（可用于触发其他动效）

// 预设的粒子颜色库
const COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF922B",
  "#CC5DE8", "#F06595", "#20C997", "#74C0FC", "#FFE066",
  "#FF4757", "#2ED573", "#1E90FF", "#FF6348", "#ECCC68",
  "#FF69B4", "#00CED1", "#FF8C00", "#9370DB", "#32CD32",
];

/** 单个粒子的物理与渲染属性 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  type: "rect" | "circle" | "ribbon";
  w: number;
  h: number;
  r: number;
  opacity: number;
  decay: number;
  gravity: number;
  drag: number;
  wobble: number;
  wobbleSpd: number;
  wobbleAmp: number;
}

// Canvas 全局变量与粒子池
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];
let animId: number | null = null;
let launchedTimer: ReturnType<typeof setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;

/**
 * 生成单个粒子的物理与渲染属性
 * @param cx - 粒子在画布上的初始 x 坐标
 * @param cy - 粒子在画布上的初始 y 坐标
 */
function makeParticle(cx: number, cy: number): Particle {
  // 随机计算发射角度与弧度
  const half = props.angleSpread / 2;
  const angleDeg = props.angleCenter - half + Math.random() * props.angleSpread;
  const angleRad = (angleDeg * Math.PI) / 180;

  // 随机初始速度
  const speed = props.speedMin + Math.random() * (props.speedMax - props.speedMin);

  // 随机确定粒子的形状：65%矩形，17.5%圆形，17.5%彩带
  const type = Math.random() < 0.65 ? "rect" : Math.random() < 0.5 ? "circle" : "ribbon";

  return {
    // 位置与速度
    x: cx,
    y: cy,
    vx: Math.cos(angleRad) * speed,
    vy: Math.sin(angleRad) * speed,

    // 旋转角度与自旋速度
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.38,

    // 随机分配颜色
    color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
    type,

    // 尺寸设定：稍微放大以确保在各种屏幕上都清晰可见，并乘以缩放系数
    w: (type === "ribbon" ? 4 + Math.random() * 4 : 7 + Math.random() * 10) * props.particleScale,
    h: (type === "ribbon" ? 14 + Math.random() * 16 : 4 + Math.random() * 5) * props.particleScale,
    r: (4 + Math.random() * 5) * props.particleScale, // 圆形半径

    // 透明度与衰减率（降低衰减率，延长在144Hz等高刷屏上的存活时间）
    opacity: 1,
    decay: 0.003 + Math.random() * 0.005,

    // 物理力学属性
    gravity: 0.2 + Math.random() * 0.2, // 下落重力
    drag: 0.984 + Math.random() * 0.012, // 空气阻力（速度衰减系数）

    // 摆动属性（模拟纸屑飘落的摇晃感）
    wobble: Math.random() * Math.PI * 2,
    wobbleSpd: 0.04 + Math.random() * 0.06,
    wobbleAmp: 0.3 + Math.random() * 0.5,
  };
}

/**
 * 将浏览器窗口坐标转换为画布内的相对坐标
 */
function toCanvasCoords(clientX: number, clientY: number) {
  // 如果启用了 teleport（全屏模式），窗口坐标即为画布坐标
  if (props.teleport || !containerRef.value) {
    return { cx: clientX, cy: clientY };
  }
  // 否则减去容器的相对偏移量
  const containerRect = containerRef.value.getBoundingClientRect();
  return {
    cx: clientX - containerRect.left,
    cy: clientY - containerRect.top,
  };
}

/**
 * 生成一批烟花粒子并加入到渲染池中
 */
function spawnBurst(cx: number, cy: number) {
  // 限制最大粒子数，防止由于连续点击造成性能卡顿
  if (particles.length > 900) particles.splice(0, 300);

  for (let i = 0; i < props.burstCount; i++) {
    particles.push(makeParticle(cx, cy));
  }
}

/**
 * 绘制并更新每一帧的画面
 */
function draw() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;

  // 清空上一帧的内容（恢复单位矩阵清理全屏，避免缩放影响清理区域）
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 应用高清屏的 DPI 缩放矩阵
  ctx.scale(dpr, dpr);

  const alive: Particle[] = []; // 用于保存下一帧还需要渲染的存活粒子

  for (const p of particles) {
    // 粒子完全透明后视为消亡，跳过绘制并剔除
    if (p.opacity <= 0) continue;

    // 计算物理状态更新
    p.wobble += p.wobbleSpd; // 增加摆动相位
    p.vx += Math.sin(p.wobble) * p.wobbleAmp * 0.1; // 施加横向摇晃位移
    p.vy += p.gravity; // 施加重力
    p.vx *= p.drag; // 施加空气阻力
    p.vy *= p.drag;

    // 更新坐标、旋转角与透明度
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.opacity -= p.decay;

    // 开始绘制当前粒子
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.fillStyle = p.color;

    // 移动画布原点并进行旋转
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    // 根据粒子类型绘制对应形状
    if (p.type === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }

    ctx.restore();

    // 将未消亡的粒子保留到下一帧
    alive.push(p);
  }

  // 更新粒子池
  particles = alive;
}

/**
 * 动画循环函数
 */
function animate() {
  draw();
  // 只要还有存活粒子，就继续请求下一帧
  if (particles.length > 0) {
    animId = requestAnimationFrame(animate);
  }
  else {
    // 所有粒子消亡，停止动画循环
    animId = null;
  }
}

/**
 * 外部触发发射烟花的方法
 * @param elOrEvent
 *   - 传入 HTMLElement：从该元素的中心点发射
 *   - 传入 MouseEvent：从鼠标点击的精确位置发射
 *   - 不传：默认从整个烟花容器的中心点发射
 */
function launch(elOrEvent?: HTMLElement | EventTarget | MouseEvent | null) {
  let clientX: number;
  let clientY: number;

  // 解析发射源的坐标
  if (elOrEvent instanceof MouseEvent) {
    clientX = elOrEvent.clientX;
    clientY = elOrEvent.clientY;
  }
  else {
    const source = elOrEvent instanceof HTMLElement ? elOrEvent : containerRef.value;
    if (!source) return;
    const rect = source.getBoundingClientRect();
    clientX = rect.left + rect.width / 2;
    clientY = rect.top + rect.height / 2;
  }

  // 转换为画布坐标并生成粒子群
  const { cx, cy } = toCanvasCoords(clientX, clientY);
  spawnBurst(cx, cy);

  // 更新发射状态
  launchCount.value++;
  launched.value = true;

  // 短暂延迟后重置发射状态，可供插槽内的元素执行微交互动画；连续发射时以最后一次为准
  if (launchedTimer) clearTimeout(launchedTimer);
  launchedTimer = setTimeout(() => {
    launchedTimer = null;
    launched.value = false;
  }, 150);

  // 如果动画循环未在进行中，则启动它
  if (!animId) animate();
}

/**
 * 调整画布尺寸以适配屏幕或容器，同时处理高清屏（Retina）的设备像素比
 */
function resize() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  if (props.teleport) {
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  }
  else if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  }
}

/**
 * 取当前分支的画布并初始化上下文、尺寸与容器尺寸监听。
 * 挂载时调用一次；切换 teleport 后旧画布已卸载，必须重新取，否则会继续画到脱离文档的旧画布上
 */
function setupCanvas() {
  resizeObserver?.disconnect();
  resizeObserver = null;

  canvas = canvasRef.value;
  ctx = canvas?.getContext("2d") ?? null;
  resize();

  // 监听容器尺寸变化（非 teleport 模式下）
  if (!props.teleport && containerRef.value) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(containerRef.value);
  }
}

onMounted(() => {
  setupCanvas();
  // 监听窗口尺寸变化
  window.addEventListener("resize", resize);
});

// flush: 'post' 保证新分支的 canvas 已挂载、canvasRef 已指向它
watch(() => props.teleport, setupCanvas, { flush: "post" });

onUnmounted(() => {
  // 组件销毁前清理动画帧、定时器和监听器
  if (animId) cancelAnimationFrame(animId);
  if (launchedTimer) clearTimeout(launchedTimer);
  window.removeEventListener("resize", resize);
  resizeObserver?.disconnect();
});

// 将核心发射方法暴露给父组件使用
defineExpose({
  launch,
});
</script>

<template>
  <!-- 当 teleport 开启时，画布会被传送到 body 节点，作为全屏蒙版使用 -->
  <Teleport v-if="teleport" to="body">
    <canvas ref="canvasRef" class="pointer-events-none fixed inset-0 z-[9999]" />
  </Teleport>

  <!-- 主容器，不写死 h-full w-full overflow-hidden，让插槽自然撑开容器；class、style 等透传属性落在这里 -->
  <div ref="containerRef" class="relative" v-bind="$attrs">
    <!-- 当 teleport 关闭时，画布留在容器内部，并且置于内容底层 -->
    <canvas v-if="!teleport" ref="canvasRef" class="pointer-events-none absolute inset-0 z-10 h-full w-full" />

    <!-- 基础内容插槽层，保持相对定位，允许作为常规流布局撑开外层 flex -->
    <div class="relative z-20">
      <slot :launch="launch" :launched="launched" :launch-count="launchCount" />
    </div>

    <!-- 覆盖层插槽，悬浮在上方，用于放置固定的交互按钮等 -->
    <div v-if="$slots.overlay" class="pointer-events-none absolute inset-0 z-30">
      <div class="pointer-events-auto">
        <slot name="overlay" :launch="launch" :launched="launched" :launch-count="launchCount" />
      </div>
    </div>
  </div>
</template>
