<template>
  <MDC
    class="mt-6"
    :value="commands"
  />
</template>

<script setup lang="ts">
interface Props {
  componentId: string;
}

const { componentId } = defineProps<Props>();

const commands = `
::code-group
\`\`\`bash [npm]
npx reborn-ui@latest add ${componentId}
\`\`\`

\`\`\`bash [pnpm]
pnpm dlx reborn-ui@latest add ${componentId}
\`\`\`

\`\`\`bash [bun]
bunx reborn-ui@latest add ${componentId}
\`\`\`

\`\`\`bash [yarn]
yarn dlx reborn-ui@latest add ${componentId}
\`\`\`
::
`;
</script>

<style scoped></style>
