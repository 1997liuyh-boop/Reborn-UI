<script lang="ts" setup>
interface Props {
    paths: string | string[];
}

const props = defineProps<Props>();

const { mdcCode } = useComponentCode(() => ({
    paths: props.paths 
}));
</script>

<template>
    <div class="not-prose my-6">
        <MdcProse v-if="mdcCode" :value="mdcCode" />
    </div>
</template>
