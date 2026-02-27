<script setup lang="ts">
import { computed, inject, ref, useSlots } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  index?: number
  disabled?: boolean
  label?: string
  customClass?: any
}>()

const slots = useSlots()
const hasLabelSlot = computed(() => !!slots.label)

const context = inject('TabsContext') as any
const localIndex = ref<number>(context.registerTrigger(props.index))

// Generate unique ID for this trigger to be selected by TabsList
const triggerId = computed(() => `${context.rootId}-trigger-${localIndex.value}`)

const isActive = computed(() => context.activeIndex.value === localIndex.value)

function handleClick(event: any) {
  if (props.disabled) { return }
  // console.log('[TabsTrigger] Clicked:', localIndex.value, 'Current Active:', context.activeIndex.value);

  if (context.scrollspy.value) {
    context.scrollToContent(localIndex.value)
    // We still set active index, but scroll handling might trigger intersection observer
    // which sets active index again. That's fine.
    context.setActiveIndex(localIndex.value)
  }
  else {
    context.setActiveIndex(localIndex.value)
  }
  context.onTabClick(localIndex.value, event)
}
</script>

<template>
  <view
    :id="triggerId" role="tab" :aria-selected="isActive"
    :class="[context.ui.value.trigger({ class: cn(props.customClass, context.uiOverrides.value?.trigger) }), { active: isActive }]"
    :data-state="isActive ? 'active' : 'inactive'" :data-orientation="context.orientation.value"
    :data-disabled="props.disabled ? 'true' : 'false'" :data-index="localIndex" @tap="handleClick"
  >
    <view
      class="
        rb-tabs__trigger-inner inline-flex items-center justify-center gap-2
      "
    >
      <text
        v-if="$slots['leading-icon']"
        :class="context.ui.value.leadingIcon({ class: context.uiOverrides.value?.leadingIcon })"
      >
        <slot name="leading-icon" />
      </text>
      <text
        v-if="$slots['leading-avatar']"
        :class="context.ui.value.leadingAvatar({ class: context.uiOverrides.value?.leadingAvatar })"
      >
        <text
          :class="context.ui.value.leadingAvatarSize({ class: context.uiOverrides.value?.leadingAvatarSize })"
        >
          <slot name="leading-avatar" />
        </text>
      </text>
      <view
        data-tab-label :class="context.ui.value.label({ class: context.uiOverrides.value?.label })"
        class="relative inline-flex items-center justify-center"
      >
        <!-- Direct render for debugging MP click issues -->
        <text class="whitespace-pre">
          <slot name="label">
            {{ props.label }}
            <slot />
          </slot>
        </text>
      </view>
      <text
        v-if="$slots['trailing-badge']"
        :class="context.ui.value.trailingBadge({ class: context.uiOverrides.value?.trailingBadge })"
      >
        <text
          :class="context.ui.value.trailingBadgeSize({ class: context.uiOverrides.value?.trailingBadgeSize })"
        >
          <slot name="trailing-badge" />
        </text>
      </text>
    </view>
  </view>
</template>
