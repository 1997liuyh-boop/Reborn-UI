<script setup lang="ts">
import type {Component} from "vue";
/**
 * 在线演示 Playground —— /playground
 *
 * 左侧编辑 <template> + <script setup> 片段,右侧实时编译运行:
 * - 组件依赖全局注册的 Reborn 组件与注入的 Vue API,无需 import;
 * - 代码通过 #code=<base64url> 哈希进出,支持分享链接与 AI 助手一键运行;
 * - 编译错误在挂载前拦截,运行时错误由错误边界捕获,均显示在预览区底部。
 */
import {  defineComponent, onErrorCaptured } from "vue";

definePageMeta({
    layout: false,
    header: false,
    footer: false,
});

useSeoMeta({
    title: "Playground · Reborn UI",
    description: "在线编辑并实时运行 Reborn UI 组件演示代码",
    robots: "noindex",
});

// 注册组件 config 模块，让演示代码里的常量 import（如 radioColors）可被真实解析
installPlaygroundModules();

/** 默认示例:展示按钮的常见变体 */
const DEFAULT_CODE = `<template>
  <div class="flex flex-col items-start gap-4">
    <div class="flex items-center gap-3">
      <RebornButton @click="count++">点击 +1</RebornButton>
      <RebornButton variant="outlined">Outlined</RebornButton>
      <RebornButton variant="dashed">Dashed</RebornButton>
    </div>
    <p class="text-sm text-muted">已点击 {{ count }} 次</p>
  </div>
</template>

<script setup>
const count = ref(0)
<\/script>`;

const code = ref(DEFAULT_CODE);
const compiled = shallowRef<Component | null>(null);
const error = ref<string | null>(null);
const pending = ref(false);
const renderKey = ref(0);
const copied = ref(false);

/** 运行时错误边界:捕获子组件抛错并上报,避免整页崩溃 */
const PlaygroundErrorBoundary = defineComponent({
    name: "PlaygroundErrorBoundary",
    emits: ["error"],
    setup(_, { slots, emit }) {
        onErrorCaptured((err) => {
            emit("error", err);
            return false;
        });
        return () => slots.default?.();
    },
});

/** 编译并挂载当前代码 */
function run() {
    error.value = null;
    const result = compilePlaygroundComponent(code.value);
    if (result.error) {
        error.value = result.error;
        return;
    }
    compiled.value = result.component;
    renderKey.value++;
}

function onRuntimeError(err: unknown) {
    error.value = `运行时错误:${err instanceof Error ? err.message : String(err)}`;
}

/** 输入防抖自动运行 */
let timer: ReturnType<typeof setTimeout> | undefined;
watch(code, () => {
    pending.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
        pending.value = false;
        run();
    }, 500);
});

/** 一键格式化:复用全局 $prettier(worker 加载 prettier standalone,vue parser) */
const formatting = ref(false);
async function format() {
    if (formatting.value) return;
    formatting.value = true;
    try {
        const { $prettier } = useNuxtApp() as unknown as {
            $prettier: { format: (source: string, options?: Record<string, unknown>) => Promise<string> };
        };
        code.value = (await $prettier.format(code.value, { parser: "vue" })).trimEnd();
        error.value = null;
    } catch (err) {
        error.value = `格式化失败:${err instanceof Error ? err.message : String(err)}`;
    } finally {
        formatting.value = false;
    }
}

/** 从哈希载入代码(初次进入 + 站内再次点击 AI 链接触发 hashchange) */
function loadFromHash() {
    const fromHash = readPlaygroundCodeFromHash(window.location.hash);
    if (fromHash) {
        code.value = fromHash;
    }
    run();
}

/** 复制分享链接:把当前代码写回哈希 */
async function share() {
    const url = `${window.location.origin}${buildPlaygroundUrl(code.value)}`;
    window.history.replaceState(null, "", buildPlaygroundUrl(code.value));
    await navigator.clipboard.writeText(url);
    copied.value = true;
    setTimeout(() => {
        copied.value = false;
    }, 2000);
}

/** 重置为默认示例并清空哈希 */
function reset() {
    code.value = DEFAULT_CODE;
    window.history.replaceState(null, "", "/playground");
    run();
}

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        navigateTo("/components");
    }
}

onMounted(() => {
    loadFromHash();
    window.addEventListener("hashchange", loadFromHash);
});

onUnmounted(() => {
    window.removeEventListener("hashchange", loadFromHash);
    clearTimeout(timer);
});
</script>

<template>
  <div class="bg-default text-default flex h-screen flex-col overflow-hidden">
    <!-- 顶栏:与 /preview 同风格的极简工具条 -->
    <header
      class="border-default bg-default/80 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2 backdrop-blur"
    >
      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" size="sm" @click="goBack">
          返回文档
        </UButton>
        <span class="text-highlighted hidden font-semibold sm:inline">Playground</span>
        <span class="text-muted hidden text-xs sm:inline">在线编辑并实时运行 Reborn UI 演示代码</span>
      </div>
      <div class="flex items-center gap-1.5">
        <UButton icon="i-lucide-play" size="sm" variant="solid" @click="run">
          运行
        </UButton>
        <UButton
          icon="i-lucide-wand-sparkles" size="sm" variant="outline" color="neutral"
          :loading="formatting" title="Prettier 格式化(Ctrl+S)" @click="format"
        >
          格式化
        </UButton>
        <UButton
          :icon="copied ? 'i-lucide-check' : 'i-lucide-link'" size="sm" variant="outline"
          color="neutral" @click="share"
        >
          {{ copied ? '已复制' : '分享链接' }}
        </UButton>
        <UButton
          icon="i-lucide-rotate-ccw" size="sm" variant="ghost" color="neutral" title="重置为示例代码"
          @click="reset"
        />
        <ClientOnly>
          <UColorModeButton />
        </ClientOnly>
      </div>
    </header>

    <!-- 主体:左编辑器 / 右预览,窄屏纵向堆叠 -->
    <main class="grid min-h-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
      <!-- 编辑器 -->
      <section class="border-default flex min-h-0 flex-col border-b md:border-b-0 md:border-r">
        <div class="border-default text-muted flex items-center gap-2 border-b px-4 py-1.5 text-xs">
          <UIcon name="i-lucide-code-xml" class="size-3.5" />
          <span>demo.vue —— 组件已全局注册,无需 import;输入 &lt; 触发组件与属性提示</span>
        </div>
        <ClientOnly>
          <PlaygroundCodeEditor v-model="code" class="min-h-0 flex-1" @format="format" />
          <template #fallback>
            <pre
              class="text-muted min-h-0 w-full flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed"
            >{{ code }}</pre>
          </template>
        </ClientOnly>
      </section>

      <!-- 预览 -->
      <section class="relative flex min-h-0 flex-col">
        <div class="border-default text-muted flex items-center gap-2 border-b px-4 py-1.5 text-xs">
          <UIcon name="i-lucide-eye" class="size-3.5" />
          <span>实时预览</span>
          <span v-if="pending" class="text-primary flex items-center gap-1">
            <UIcon name="i-lucide-loader-circle" class="size-3 animate-spin" />编译中
          </span>
        </div>
        <div class="min-h-0 flex-1 overflow-auto p-6">
          <ClientOnly>
            <PlaygroundErrorBoundary v-if="compiled" :key="renderKey" @error="onRuntimeError">
              <component :is="compiled" />
            </PlaygroundErrorBoundary>
            <template #fallback>
              <div class="text-muted flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />正在初始化…
              </div>
            </template>
          </ClientOnly>
        </div>
        <!-- 错误提示条 -->
        <div
          v-if="error"
          class="border-error/30 bg-error/10 text-error absolute inset-x-0 bottom-0 max-h-40 overflow-auto border-t px-4 py-2 font-mono text-xs whitespace-pre-wrap"
        >
          {{ error }}
        </div>
      </section>
    </main>
  </div>
</template>
