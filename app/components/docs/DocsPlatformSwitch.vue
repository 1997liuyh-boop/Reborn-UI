<script setup lang="ts">
/**
 * DocsPlatformSwitch —— 顶栏的平台开关（Web / UniApp）
 *
 * 只切换 useDocsPlatform 的全局档位，不做路由跳转：
 * 侧栏与总览按档位筛选组件，组件页按档位决定是否展示 UniApp 预览。
 * 用站内自己的 RebornSwitch 实现：关 = Web、开 = UniApp，
 * inline-prompt 把当前档位名写在轨道内，auto-width 让两态文案宽度一致、切换时不抖动。
 */
import type { DocsPlatform } from "~/composables/useDocsPlatform";

interface Props {
  /** 紧凑模式：移动端抽屉里占满整行，左侧给出说明文案 */
  block?: boolean;
}

const { block = false } = defineProps<Props>();

const { platform, setPlatform } = useDocsPlatform();

/** RebornSwitch 的绑定值直接用档位字符串（activeValue / inactiveValue），写入前再收窄一次 */
const model = computed<DocsPlatform>({
  get: () => platform.value,
  set: (value) => {
    if (value === "web" || value === "uniapp") setPlatform(value);
  },
});
</script>

<template>
  <div
    class="flex items-center"
    :class="block ? 'w-full justify-between' : undefined"
  >
    <span v-if="block" class="text-muted text-sm">组件平台</span>
    <RebornSwitch
      v-model="model"
      active-value="uniapp"
      inactive-value="web"
      active-label="UniApp"
      inactive-label="Web"
      size="lg"
      color="primary"
      type="round"
      inline-prompt
      auto-width
      aria-label="切换组件平台"
    />
  </div>
</template>
