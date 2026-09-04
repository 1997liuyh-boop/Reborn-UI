<script lang="ts" setup>
import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornPagination from "~/components/reborn/ui/reborn-pagination/RebornPagination.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";

type ShowcaseKey = "button" | "input" | "select" | "switch" | "badge" | "pagination";

/** 左侧组件列表 */
const items: { key: ShowcaseKey; label: string; icon: string }[] = [
  { key: "button", label: "Button 按钮", icon: "lucide:mouse-pointer-click" },
  { key: "input", label: "Input 输入框", icon: "lucide:text-cursor-input" },
  { key: "select", label: "Select 选择器", icon: "lucide:chevrons-up-down" },
  { key: "switch", label: "Switch 开关", icon: "lucide:toggle-left" },
  { key: "badge", label: "Badge 徽章", icon: "lucide:tag" },
  { key: "pagination", label: "Pagination 分页", icon: "lucide:chevrons-right" },
];

const active = ref<ShowcaseKey>("button");
const activeItem = computed(() => items.find(item => item.key === active.value) ?? items[0]);

/** 代码面板：Web 与 uniapp 端模板完全一致，只有引入路径不同 */
type CodeTab = "vue" | "uniapp";
const codeTab = ref<CodeTab>("vue");

const templates: Record<ShowcaseKey, string> = {
  button: `<RebornButton color="primary" size="lg">
  Primary Button
</RebornButton>`,
  input: `<RebornInput
  v-model="value"
  placeholder="请输入内容"
  clearable
/>`,
  select: `<RebornSelect
  v-model="value"
  :options="options"
  placeholder="请选择"
/>`,
  switch: `<RebornSwitch
  v-model="checked"
  active-label="开启"
  inactive-label="关闭"
/>`,
  badge: `<RebornBadge label="NEW" color="primary" />
<RebornBadge label="Beta" color="warning" variant="soft" />`,
  pagination: `<RebornPagination
  v-model="page"
  :total="200"
  :pager-count="5"
  background
/>`,
};

const importPaths: Record<ShowcaseKey, { web: string; uniapp: string }> = {
  button: { web: "~/components/reborn/ui/reborn-button", uniapp: "@/components/reborn-button/RebornButton.vue" },
  input: { web: "~/components/reborn/ui/reborn-input", uniapp: "@/components/reborn-input/RebornInput.vue" },
  select: { web: "~/components/reborn/ui/reborn-select", uniapp: "@/components/reborn-select/RebornSelect.vue" },
  switch: { web: "~/components/reborn/ui/reborn-switch", uniapp: "@/components/reborn-switch/RebornSwitch.vue" },
  badge: { web: "~/components/reborn/ui/reborn-badge", uniapp: "@/components/reborn-badge/RebornBadge.vue" },
  pagination: { web: "~/components/reborn/ui/reborn-pagination", uniapp: "@/components/reborn-pagination/RebornPagination.vue" },
};

const componentName = computed(() => `Reborn${active.value.charAt(0).toUpperCase()}${active.value.slice(1)}`);

function indent(source: string) {
  return source.split("\n").map(line => `  ${line}`).join("\n");
}

const code = computed(() => {
  const paths = importPaths[active.value];
  const importLine = codeTab.value === "vue"
    ? `import { ${componentName.value} } from "${paths.web}";`
    : `import ${componentName.value} from "${paths.uniapp}";`;
  return `<script setup lang="ts">\n${importLine}\n<\/script>\n\n<template>\n${indent(templates[active.value])}\n</template>`;
});

const toast = useToast();
async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value);
    toast.add({ title: "代码已复制" });
  } catch {
    toast.add({ title: "复制失败，请手动复制", color: "error" });
  }
}

// ─── 演示状态 ───────────────────────────────────────────────────

const inputValue = ref("");
const selectValue = ref<string | null>(null);
const selectOptions = [
  { label: "Vue 3", value: "vue" },
  { label: "Nuxt 4", value: "nuxt" },
  { label: "uniapp", value: "uniapp" },
];
const switchValue = ref(true);
const page = ref(3);

const buttonColors = ["primary", "secondary", "success", "warning", "error", "info"] as const;
const buttonSizes = ["lg", "md", "sm"] as const;
const buttonVariants = ["filled", "outlined", "soft", "subtle", "text"] as const;
</script>

<template>
  <section class="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
    <div class="mb-10 flex flex-col items-center gap-3 text-center">
      <h2 class="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
        丰富的组件
      </h2>
      <p class="text-base text-zinc-600 dark:text-white/60">
        精心设计的组件，开箱即用，灵活组合
      </p>
      <span class="mt-1 h-1 w-12 rounded-full bg-gradient-to-r from-[#1B6DFA] to-[#8b5cf6]" />
    </div>

    <div class="grid overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 backdrop-blur-xl lg:grid-cols-[13rem_1fr_22rem] dark:border-white/10 dark:bg-white/[0.03]">
      <!-- 左侧：组件列表 -->
      <nav class="flex flex-row gap-1 overflow-x-auto border-b border-zinc-200/80 p-3 lg:flex-col lg:border-r lg:border-b-0 dark:border-white/10">
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
          :class="item.key === active
            ? 'bg-gradient-to-r from-[#1B6DFA]/15 to-[#8b5cf6]/15 font-medium text-[#6d5cf6] dark:text-[#c4b5fd]'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-white/60 dark:hover:bg-white/[0.06]'"
          @click="active = item.key"
        >
          <Icon :name="item.icon" class="size-4 shrink-0" />
          {{ item.label }}
        </button>
        <NuxtLink
          to="/components"
          class="mt-auto flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-[#6d5cf6] dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-[#c4b5fd]"
        >
          <Icon name="lucide:layout-grid" class="size-4 shrink-0" />
          更多组件
          <Icon name="lucide:arrow-up-right" class="ml-auto size-3.5" />
        </NuxtLink>
      </nav>

      <!-- 中间：实时演示 -->
      <div class="flex min-h-[22rem] flex-col gap-8 p-6 lg:p-8">
        <h3 class="text-xl font-semibold text-zinc-900 dark:text-white">
          {{ activeItem.label }}
        </h3>

        <template v-if="active === 'button'">
          <div class="flex flex-col gap-3">
            <span class="text-sm text-zinc-500 dark:text-white/50">按钮类型</span>
            <div class="flex flex-wrap gap-3">
              <RebornButton v-for="color in buttonColors" :key="color" :color="color" :label="color.charAt(0).toUpperCase() + color.slice(1)" />
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm text-zinc-500 dark:text-white/50">按钮尺寸</span>
            <div class="flex flex-wrap items-center gap-3">
              <RebornButton v-for="size in buttonSizes" :key="size" :size="size" color="primary" variant="soft" :label="size.toUpperCase()" />
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <span class="text-sm text-zinc-500 dark:text-white/50">视觉变体</span>
            <div class="flex flex-wrap gap-3">
              <RebornButton v-for="variant in buttonVariants" :key="variant" :variant="variant" color="primary" :label="variant" />
              <RebornButton label="Disabled" color="primary" disabled />
            </div>
          </div>
        </template>

        <template v-else-if="active === 'input'">
          <div class="flex max-w-sm flex-col gap-4">
            <RebornInput v-model="inputValue" placeholder="请输入内容" clearable />
            <RebornInput v-model="inputValue" placeholder="禁用状态" disabled />
            <span class="text-sm text-zinc-500 dark:text-white/50">当前值：{{ inputValue || "（空）" }}</span>
          </div>
        </template>

        <template v-else-if="active === 'select'">
          <div class="flex max-w-sm flex-col gap-4">
            <RebornSelect v-model="selectValue" :options="selectOptions" placeholder="请选择技术栈" />
            <span class="text-sm text-zinc-500 dark:text-white/50">已选：{{ selectValue ?? "（未选择）" }}</span>
          </div>
        </template>

        <template v-else-if="active === 'switch'">
          <div class="flex flex-col gap-4">
            <RebornSwitch v-model="switchValue" active-label="开启" inactive-label="关闭" />
            <RebornSwitch v-model="switchValue" color="success" size="lg" />
            <span class="text-sm text-zinc-500 dark:text-white/50">状态：{{ switchValue ? "开启" : "关闭" }}</span>
          </div>
        </template>

        <template v-else-if="active === 'badge'">
          <div class="flex flex-wrap items-center gap-3">
            <RebornBadge label="NEW" color="primary" />
            <RebornBadge label="Beta" color="warning" variant="soft" />
            <RebornBadge label="Stable" color="success" variant="outlined" />
            <RebornBadge label="Deprecated" color="error" variant="subtle" />
            <RebornBadge label="Web" color="info" size="sm" />
          </div>
        </template>

        <template v-else-if="active === 'pagination'">
          <div class="flex flex-col gap-4">
            <RebornPagination v-model="page" :total="200" :pager-count="5" background />
            <RebornPagination v-model="page" :total="200" simple />
            <span class="text-sm text-zinc-500 dark:text-white/50">当前第 {{ page }} 页</span>
          </div>
        </template>
      </div>

      <!-- 右侧：代码面板 -->
      <div class="flex flex-col border-t border-zinc-200/80 lg:border-t-0 lg:border-l dark:border-white/10">
        <div class="flex items-center justify-between border-b border-zinc-200/80 px-4 dark:border-white/10">
          <div class="flex">
            <button
              v-for="tab in ([['vue', 'Vue'], ['uniapp', 'UniApp']] as [CodeTab, string][])"
              :key="tab[0]"
              type="button"
              class="border-b-2 px-3 py-3 text-sm transition-colors"
              :class="codeTab === tab[0]
                ? 'border-[#8b5cf6] text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-white/50 dark:hover:text-white/80'"
              @click="codeTab = tab[0]"
            >
              {{ tab[1] }}
            </button>
          </div>
          <button type="button" class="rounded-md p-1.5 text-zinc-400 transition-colors hover:text-[#8b5cf6] dark:text-white/40" aria-label="复制代码" @click="copyCode">
            <Icon name="lucide:copy" class="size-4" />
          </button>
        </div>
        <pre class="flex-1 overflow-auto p-4 font-mono text-xs leading-6 break-all whitespace-pre-wrap text-zinc-700 dark:text-white/80"><code>{{ code }}</code></pre>
        <div class="border-t border-zinc-200/80 p-3 dark:border-white/10">
          <NuxtLink
            to="/playground"
            class="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:border-[#8b5cf6]/50 hover:text-[#6d5cf6] dark:border-white/10 dark:text-white/80 dark:hover:text-[#c4b5fd]"
          >
            在 Playground 中打开
            <Icon name="lucide:external-link" class="size-4" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
