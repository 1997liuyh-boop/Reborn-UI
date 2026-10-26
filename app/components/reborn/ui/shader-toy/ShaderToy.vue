<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { MouseMode } from "./rebornShaderToy";
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from "vue";
import { rebornShaderToy } from "./rebornShaderToy";

interface Props {
  mouseMode?: MouseMode;
  class?: HTMLAttributes["class"];
  shaderCode: string;
  hue?: number;
  saturation?: number;
  brightness?: number;
  speed?: number;
  mouseSensitivity?: number;
  damping?: number;
}

const props = withDefaults(defineProps<Props>(), {
  mouseMode: "click",
  hue: 0,
  saturation: 1,
  brightness: 1,
  speed: 1,
  mouseSensitivity: 1,
  damping: 0,
});

const emit = defineEmits<{
  /** 当前环境不支持 WebGL 2、无法创建渲染器时触发，载荷为构造时抛出的错误 */
  error: [error: unknown];
}>();

const containerRef = useTemplateRef<HTMLElement>("containerRef");
let shader: rebornShaderToy | undefined;
/** 渲染器创建失败（不支持 WebGL 2）时为 true，模板改为渲染 fallback 插槽 */
const unsupported = shallowRef(false);

/** 编译并切换着色器，成功后开始播放（已在播放时 play 不重复启动循环） */
function applyShader(source: string) {
  if (!shader) return;
  if (shader.setShader({ source })) shader.play();
}

onMounted(() => {
  if (!containerRef.value) return;

  try {
    shader = new rebornShaderToy(containerRef.value, props.mouseMode);
  } catch (error) {
    // 旧浏览器或禁用 WebGL 时构造函数会抛错，在这里降级，不让错误冒泡到应用的错误处理
    unsupported.value = true;
    emit("error", error);
    return;
  }

  // 参数先写入实例，编译着色器时会一并带上
  shader.setHSV({
    hue: props.hue,
    saturation: props.saturation,
    brightness: props.brightness,
  });

  shader.setSpeed(props.speed);

  shader.setMouseSensitivity(props.mouseSensitivity);
  shader.setMouseDamping(props.damping);

  applyShader(props.shaderCode);
});

onUnmounted(() => {
  shader?.dispose();
  shader = undefined;
});

// shaderCode 与 mouseMode 挂载后同样响应变更，切换着色器不需要重挂组件（重挂会多建一个 WebGL 上下文）
watch(
  () => props.shaderCode,
  (source) => {
    applyShader(source);
  },
);

watch(
  () => props.mouseMode,
  (mode) => {
    if (shader) shader.mouseMode = mode;
  },
);

watch(
  () => props.hue,
  (v) => {
    if (v !== undefined && shader) {
      shader.setHue(v);
    }
  },
);

watch(
  () => props.saturation,
  (v) => {
    if (v !== undefined && shader) {
      shader.setSaturation(v);
    }
  },
);

watch(
  () => props.brightness,
  (v) => {
    if (v !== undefined && shader) {
      shader.setBrightness(v);
    }
  },
);

watch(
  () => props.speed,
  (v) => {
    if (v !== undefined && shader) {
      shader.setSpeed(v);
    }
  },
);

watch(
  () => props.mouseSensitivity,
  (v) => {
    if (v !== undefined && shader) {
      shader.setMouseSensitivity(v);
    }
  },
);

watch(
  () => props.damping,
  (v) => {
    if (v !== undefined && shader) {
      shader.setMouseDamping(v);
    }
  },
);
</script>

<template>
  <div ref="containerRef" class="shadertoy-container" :class="[props.class]">
    <!-- 不支持 WebGL 2 时的降级内容 -->
    <slot v-if="unsupported" name="fallback" />
  </div>
</template>

<style scoped>
.shadertoy-container {
  display: block;
  position: relative;
  height: 100%;
  width: 100%;
}

.shadertoy-container canvas {
  display: block;
  max-width: 100%;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
