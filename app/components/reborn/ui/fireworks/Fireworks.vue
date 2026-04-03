<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps({
    burstCount: {
        type: Number,
        default: 160,
    },
    teleport: {
        type: Boolean,
        default: false,
    },
    angleCenter: {
        type: Number,
        default: 270,
    },
    angleSpread: {
        type: Number,
        default: 130,
    },
    speedMin: {
        type: Number,
        default: 8,
    },
    speedMax: {
        type: Number,
        default: 25,
    },
});

const containerRef = ref(null);
const canvasRef = ref(null);
const launchCount = ref(0);
const launched = ref(false);

const COLORS = [
    "#FF6B6B",
    "#FFD93D",
    "#6BCB77",
    "#4D96FF",
    "#FF922B",
    "#CC5DE8",
    "#F06595",
    "#20C997",
    "#74C0FC",
    "#FFE066",
    "#FF4757",
    "#2ED573",
    "#1E90FF",
    "#FF6348",
    "#ECCC68",
    "#FF69B4",
    "#00CED1",
    "#FF8C00",
    "#9370DB",
    "#32CD32",
];

let canvas, ctx;
let particles = [];
let animId = null;

function makeParticle(cx, cy) {
    const half = props.angleSpread / 2;
    const angleDeg = props.angleCenter - half + Math.random() * props.angleSpread;
    const angleRad = (angleDeg * Math.PI) / 180;
    const speed = props.speedMin + Math.random() * (props.speedMax - props.speedMin);
    const type = Math.random() < 0.65 ? "rect" : Math.random() < 0.5 ? "circle" : "ribbon";
    return {
        x: cx,
        y: cy,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.38,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        type,

        w: type === "ribbon" ? 2.5 + Math.random() * 3 : 5 + Math.random() * 9,
        h: type === "ribbon" ? 10 + Math.random() * 14 : 2.5 + Math.random() * 4,

        r: 3 + Math.random() * 4,
        opacity: 1,
        decay: 0.005 + Math.random() * 0.007,
        gravity: 0.2 + Math.random() * 0.2,
        drag: 0.984 + Math.random() * 0.012,

        wobble: Math.random() * Math.PI * 2,
        wobbleSpd: 0.04 + Math.random() * 0.06,
        wobbleAmp: 0.3 + Math.random() * 0.5,
    };
}

function toCanvasCoords(clientX, clientY) {
    if (props.teleport) {
        return { cx: clientX, cy: clientY };
    }
    const containerRect = containerRef.value.getBoundingClientRect();
    return {
        cx: clientX - containerRect.left,
        cy: clientY - containerRect.top,
    };
}

function spawnBurst(cx, cy) {
    if (particles.length > 900) particles.splice(0, 300);
    for (let i = 0; i < props.burstCount; i++) {
        particles.push(makeParticle(cx, cy));
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alive = [];
    for (const p of particles) {
        if (p.opacity <= 0) continue;

        p.wobble += p.wobbleSpd;
        p.vx += Math.sin(p.wobble) * p.wobbleAmp * 0.1;
        p.vy += p.gravity;
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, p.r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        ctx.restore();
        alive.push(p);
    }

    particles = alive;
}

function animate() {
    draw();
    if (particles.length > 0) {
        animId = requestAnimationFrame(animate);
    } else {
        animId = null;
    }
}

/**
 * @param {HTMLElement | EventTarget | MouseEvent | null} elOrEvent
 *   - 传入 HTMLElement：从元素中心发射
 *   - 传入 MouseEvent：从鼠标点击位置发射
 *   - 不传：从容器中心发射
 */
function launch(elOrEvent) {
    let clientX, clientY;
    if (elOrEvent instanceof MouseEvent) {
        clientX = elOrEvent.clientX;
        clientY = elOrEvent.clientY;
    } else if (elOrEvent instanceof HTMLElement) {
        const rect = elOrEvent.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
    } else {
        const rect = containerRef.value.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
    }

    const { cx, cy } = toCanvasCoords(clientX, clientY);
    spawnBurst(cx, cy);
    launchCount.value++;
    launched.value = true;
    setTimeout(() => {
        launched.value = false;
    }, 150);

    if (!animId) animate();
}

function resize() {
    if (props.teleport) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = containerRef.value.clientWidth;
        canvas.height = containerRef.value.clientHeight;
    }
}

let resizeObserver = null;

onMounted(() => {
    canvas = canvasRef.value;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    if (!props.teleport && containerRef.value) {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(containerRef.value);
    }
});

onUnmounted(() => {
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener("resize", resize);
    resizeObserver?.disconnect();
});

defineExpose({
    launch,
});
</script>

<template>
    <Teleport v-if="teleport" to="body">
        <canvas ref="canvasRef" class="pointer-events-none fixed inset-0 z-99" />
    </Teleport>
    <div ref="containerRef" class="relative h-full w-full overflow-hidden">
        <canvas v-if="!teleport" ref="canvasRef" class="pointer-events-none absolute inset-0 z-10" />
        <div class="absolute inset-0 overflow-x-hidden overflow-y-auto">
            <div class="relative min-h-full">
                <slot :launch="launch" :launched="launched" :launchCount="launchCount" />
            </div>
        </div>
        <div class="pointer-events-none absolute inset-0 z-20">
            <div class="pointer-events-auto">
                <slot name="overlay" :launch="launch" :launched="launched" :launchCount="launchCount" />
            </div>
        </div>
    </div>
</template>
