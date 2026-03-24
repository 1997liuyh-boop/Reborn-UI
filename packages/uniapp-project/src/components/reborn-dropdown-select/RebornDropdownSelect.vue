<script setup lang="ts">
import { ref, computed } from 'vue'
import RebornSelectTrigger from '@/components/reborn-select-trigger/RebornSelectTrigger.vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type dropdownSelectColors, type dropdownSelectSizes } from './reborn-dropdown-select.config'

defineOptions({
  name: 'RebornDropdownSelect',
})

interface Option {
  label: string
  value: any
}

interface Props {
  modelValue?: any
  options?: Option[]
  placeholder?: string
  disabled?: boolean
  size?: typeof dropdownSelectSizes[number]
  color?: typeof dropdownSelectColors[number]
  clearable?: boolean
  ui?: Partial<{
    wrapper?: string
    trigger?: string
    content?: string
    item?: string
    itemText?: string
    itemIcon?: string
    empty?: string
    mask?: string
  }>
  customClass?: any
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  size: 'md',
  color: 'primary',
  clearable: false,
  ui: () => ({}),
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue)
  return option ? option.label : ''
})

// ui 样式系统
const b = tv(theme)
const ui = computed(() => {
  const styles = b({
    color: props.color,
    size: props.size,
    disabled: props.disabled,
  })

  return {
    wrapper: (opts?: { class?: any }) => styles.wrapper({ class: cn(opts?.class, props.ui?.wrapper) }),
    trigger: (opts?: { class?: any }) => styles.trigger({ class: cn(opts?.class, props.ui?.trigger) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, props.ui?.content) }),
    item: (opts?: { class?: any; selected?: boolean }) => styles.item({ selected: opts?.selected, class: cn(opts?.class, props.ui?.item) }),
    itemText: (opts?: { class?: any; selected?: boolean }) => styles.itemText({ selected: opts?.selected, class: cn(opts?.class, props.ui?.itemText) }),
    itemIcon: (opts?: { class?: any }) => styles.itemIcon({ class: cn(opts?.class, props.ui?.itemIcon) }),
    empty: (opts?: { class?: any }) => styles.empty({ class: cn(opts?.class, props.ui?.empty) }),
    mask: (opts?: { class?: any }) => styles.mask({ class: cn(opts?.class, props.ui?.mask) }),
  }
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectOption(option: Option) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

function onClear() {
  emit('update:modelValue', null)
  emit('change', null)
}
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })">
    <RebornSelectTrigger :customClass="ui.trigger()" :text="selectedLabel" :placeholder="placeholder"
      :disabled="disabled" :size="size" :color="color" :focus="isOpen" :clearable="clearable" @open="toggleDropdown"
      @clear="onClear" />

    <!-- Mask to close dropdown -->
    <RebornTransition :show="isOpen" name="fade" :duration="200">
      <view :class="ui.mask()" @tap="closeDropdown" />
    </RebornTransition>

    <RebornTransition :show="isOpen" name="fade-down" :duration="200"
      custom-style="position: absolute; top: 100%; left: 0; right: 0; z-index: 999;">
      <view :class="ui.content()">
        <view v-for="(item, index) in options" :key="index" :class="ui.item({ selected: item.value === modelValue })"
          @tap.stop="selectOption(item)">
          <text :class="ui.itemText({ selected: item.value === modelValue })">{{ item.label }}</text>
          <text v-if="item.value === modelValue" class="i-lucide-check" :class="ui.itemIcon()" />
        </view>
        <view v-if="options.length === 0" :class="ui.empty()">
          无数据
        </view>
      </view>
    </RebornTransition>
  </view>
</template>
