<script lang="ts" setup>
interface Props {
  componentId: string;
}

const { componentId } = defineProps<Props>();


const items = ref([
  {
    label: "pnpm",
    icon: "vscode-icons:file-type-pnpm",
    command: `pnpm dlx reborn-ui@latest add ${componentId}`,
  },
  {
    label: "npm",
    icon: "devicon:npm",
    command: `npx reborn-ui@latest add ${componentId}`,
  },
  {
    label: "yarn",
    icon: "vscode-icons:file-type-yarn",
    command: `yarn dlx reborn-ui@latest add ${componentId}`,
  },
  {
    label: "bun",
    icon: "devicon:bun",
    command: `bunx reborn-ui@latest add ${componentId}`,
  },
]);

const mdc = `
::code-group
${items.value?.map((pm) => `\`\`\`bash [${pm.label}]\n${pm.command}\n\`\`\`\n`).join("\n")}
::`;
</script>

<template>
  <MDC :value="mdc" />
</template>
