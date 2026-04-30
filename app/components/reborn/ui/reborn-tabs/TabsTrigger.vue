<script setup lang="ts">
import { inject, computed, ref } from "vue";
import { cn } from "~/lib/utils";

const props = defineProps<{
    index?: number
    disabled?: boolean
    class?: any
}>();

const context = inject("TabsContext") as any;
const localIndex = ref<number>(context.registerTrigger(props.index));

const isActive = computed(() => context.activeIndex.value === localIndex.value);

function handleClick(event: MouseEvent) {
    if (props.disabled) return;

    if (context.scrollspy.value) {
        context.scrollToContent(localIndex.value);
        // 我们仍然设置激活索引，但滚动处理可能会触发交叉观察器
        // 从而再次设置激活索引。这没关系。
        context.setActiveIndex(localIndex.value);
    } else {
        context.setActiveIndex(localIndex.value);
    }
    context.onTabClick(localIndex.value, event);

    // 原生 scrollIntoView 会导致页面跳动，改在 TabsList 中处理
}

function handleKeydown(event: KeyboardEvent) {
    if (props.disabled) return

    // 通常可以在这里添加基础键盘支持（方向键），
    // 但通常需要管理整个列表的焦点。
    // 考虑到约束和用法，我们可能会依赖默认的浏览器行为 + 点击。
    // 为了与 Reka 保持一致，需要聚焦列表中的上一个/下一个引用。
    // 目前，如果我们管理焦点，将为“自动”模式实现基础焦点触发。
}
</script>

<template>
    <button type="button" role="tab" :aria-selected="isActive" :tabindex="isActive ? 0 : -1" :disabled="props.disabled"
        :data-state="isActive ? 'active' : 'inactive'" :data-orientation="context.orientation.value"
        :data-index="localIndex"
        :class="context.ui.value.trigger({ class: cn(props.class, context.uiOverrides.value?.trigger) })"
        @click="handleClick" @keydown="handleKeydown">
        <span v-if="$slots['leading-icon']"
            :class="context.ui.value.leadingIcon({ class: context.uiOverrides.value?.leadingIcon })">
            <slot name="leading-icon"></slot>
        </span>
        <span v-if="$slots['leading-avatar']"
            :class="context.ui.value.leadingAvatar({ class: context.uiOverrides.value?.leadingAvatar })">
            <span :class="context.ui.value.leadingAvatarSize({ class: context.uiOverrides.value?.leadingAvatarSize })">
                <slot name="leading-avatar"></slot>
            </span>
        </span>
        <span data-tab-label :class="context.ui.value.label({ class: context.uiOverrides.value?.label })">
            <slot name="label">
                <slot></slot>
            </slot>
        </span>
        <span v-if="$slots['trailing-badge']"
            :class="context.ui.value.trailingBadge({ class: context.uiOverrides.value?.trailingBadge })">
            <span :class="context.ui.value.trailingBadgeSize({ class: context.uiOverrides.value?.trailingBadgeSize })">
                <slot name="trailing-badge"></slot>
            </span>
        </span>
    </button>
</template>
