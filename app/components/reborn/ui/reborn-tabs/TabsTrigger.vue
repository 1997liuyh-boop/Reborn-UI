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

    context.setActiveIndex(localIndex.value);
    context.onTabClick(localIndex.value, event);

    const target = event.target as HTMLElement;
    // Ensure we are scrolling the button itself
    const button = target.closest("button");
    if (button) {
        button.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
        });
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (props.disabled) return

    // Basic keyboard support could normally go here (Arrow keys), 
    // but typically requires managing focus across the list.
    // Given the constraints and usage, we might rely on default browser behavior + click.
    // For Reka parity, focusing next/prev ref in list would be needed.
    // For now, implementing basic focus triggering for 'automatic' mode if we were managing focus.
}
</script>

<template>
    <button
        type="button"
        role="tab"
        :aria-selected="isActive"
        :tabindex="isActive ? 0 : -1"
        :disabled="props.disabled"
        :data-state="isActive ? 'active' : 'inactive'"
        :data-orientation="context.orientation.value"
        :data-index="localIndex"
        :class="context.ui.value.trigger({ class: cn(props.class, context.uiOverrides.value?.trigger) })"
        @click="handleClick"
        @keydown="handleKeydown"
    >
        <span
            v-if="$slots['leading-icon']"
            :class="context.ui.value.leadingIcon({ class: context.uiOverrides.value?.leadingIcon })"
        >
            <slot name="leading-icon"></slot>
        </span>
        <span
            v-if="$slots['leading-avatar']"
            :class="context.ui.value.leadingAvatar({ class: context.uiOverrides.value?.leadingAvatar })"
        >
            <span :class="context.ui.value.leadingAvatarSize({ class: context.uiOverrides.value?.leadingAvatarSize })">
                <slot name="leading-avatar"></slot>
            </span>
        </span>
        <span
            data-tab-label
            :class="context.ui.value.label({ class: context.uiOverrides.value?.label })"
        >
            <slot name="label">
                <slot></slot>
            </slot>
        </span>
        <span
            v-if="$slots['trailing-badge']"
            :class="context.ui.value.trailingBadge({ class: context.uiOverrides.value?.trailingBadge })"
        >
            <span :class="context.ui.value.trailingBadgeSize({ class: context.uiOverrides.value?.trailingBadgeSize })">
                <slot name="trailing-badge"></slot>
            </span>
        </span>
    </button>
</template>
