<script setup lang="ts">
import type {LandingPageCustomization} from "~/lib/landing-pages/pageTypography";
import { applyPageCustomization  } from "~/lib/landing-pages/pageTypography";

// 移植自 ThreeUI 的 LandingPageFrame.tsx：整页文档在 iframe 中原样加载，
// 排版覆盖在加载完成后追加到 frame 自己的 head，文档文件本身不被改写。
// 仅保留 URL 加载这一路；srcDoc 派生变体与纯背景呈现在本项目中未使用。

interface LandingPageFrameProps {
  /** 页面文档地址，同源加载 */
  sourceUrl: string;
  /** iframe 的可访问标题 */
  title: string;
  /** 排版与颜色覆盖 */
  customization?: LandingPageCustomization;
}

const props = defineProps<LandingPageFrameProps>();

const emit = defineEmits<{
  /** 文档加载完成（含首屏水合前就已加载完成的情况），参数为 iframe 元素 */
  load: [frame: HTMLIFrameElement];
}>();

// 与原组件一致：同源 URL 加载需要 allow-same-origin，父页面才能访问 contentDocument
const FRAME_SANDBOX = "allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts";

const frame = useTemplateRef<HTMLIFrameElement>("frame");
const ready = shallowRef(false);

function handleLoad() {
  const element = frame.value;
  if (!element) return;
  applyPageCustomization(element, props.customization);
  ready.value = true;
  emit("load", element);
}

// 服务端渲染出的 iframe 可能在水合挂上 load 监听前就已加载完成，这里补一次
onMounted(() => {
  const element = frame.value;
  const href = element?.contentWindow?.location.href ?? "";
  if (element?.contentDocument?.readyState === "complete" && href.endsWith(props.sourceUrl)) handleLoad();
});

// 取值变化时重新追加；load 回调负责首屏
watch(() => props.customization, (customization) => {
  applyPageCustomization(frame.value, customization);
});
</script>

<template>
  <div class="threeui-background landing-page-frame" :data-state="ready ? 'ready' : 'loading'">
    <iframe
      ref="frame"
      :title="title"
      :src="sourceUrl"
      :sandbox="FRAME_SANDBOX"
      loading="eager"
      class="landing-page-frame__iframe"
      @load="handleLoad"
    />
  </div>
</template>

<style scoped>
/* 对应 threeui.css 中的 .threeui-background 基础规则与原组件的行内样式 */
.landing-page-frame {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #080808;
  pointer-events: auto;
}

.landing-page-frame__iframe {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #080808;
}
</style>
