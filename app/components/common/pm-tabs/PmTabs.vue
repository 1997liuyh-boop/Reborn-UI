<script lang="ts" setup>
import ProsePre from "~/components/content/ProsePre.vue";

interface Props {
  isDev?: boolean;
  packageName?: string | string[];
}

const { isDev = false, packageName = "" } = defineProps<Props>();

const allPackageName = computed(
  () => `${Array.isArray(packageName) ? packageName.join(" ") : packageName}`,
);

const items = ref([
  {
    label: "pnpm",
    icon: "vscode-icons:file-type-pnpm",
    command: `pnpm add ${isDev ? "-D " : ""}${allPackageName.value}`,
  },
  {
    label: "npm",
    icon: "devicon:npm",
    command: `npm install ${isDev ? "-D " : ""}${allPackageName.value}`,
  },
  {
    label: "yarn",
    icon: "vscode-icons:file-type-yarn",
    command: `yarn add ${isDev ? "-D " : ""}${allPackageName.value}`,
  },
  {
    label: "bun",
    icon: "devicon:bun",
    command: `bun add ${isDev ? "-d " : ""}${allPackageName.value}`,
  },
]);

const mdc = computed(
  () =>
    `::code-group\n${items.value
      ?.map((pm) => `\`\`\`bash [${pm.label}]\n${pm.command}\n\`\`\`\n`)
      .join("\n")}::`,
);

// 与 <MDC> 同源的运行时解析，但直接喂给 MDCRenderer 并注入 pre → ProsePre 组件对象：
// 独立 MDC 场景下标签映射缺失 pre → ProsePre，按字符串名全局解析本地覆盖组件会触发
// "Failed to resolve component: ProsePre" 警告；这里通过 components prop 注入组件引用，
// 让 findMappedTag 直接命中组件对象，彻底绕开运行时组件名解析。
const { data } = await useAsyncData(
  `pm-tabs-${allPackageName.value}-${isDev ? "dev" : "prod"}`,
  async () => {
    const { parseMarkdown } = await import("@nuxtjs/mdc/runtime");
    return parseMarkdown(mdc.value);
  },
);
</script>

<template>
  <MDCRenderer
    v-if="data"
    :body="data.body"
    :data="data.data"
    :components="{ pre: ProsePre }"
  />
</template>