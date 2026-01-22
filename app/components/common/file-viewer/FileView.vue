<script lang="ts" setup>
interface Props {
    paths: string | string[];
}

const props = defineProps<Props>();

const { mdcCode, loadFilesByPath } = useComponentCode({ 
    paths: props.paths 
});

watch(() => props.paths, (newPaths) => {
    loadFilesByPath(newPaths);
}, { deep: true });
</script>

<template>
    <div class="not-prose my-6">
        <MDC v-if="mdcCode" :value="mdcCode" />
    </div>
</template>
