<script setup lang="ts">
import type { ClassValue } from 'clsx';
import type theme from './reborn-date-picker-panel.config';
import type { ViewType } from './reborn-date-picker-panel.config';

interface HeaderPanel {
  year: number; month: number; pageStart: number;
  hidePrev: boolean; hideNext: boolean; disablePrev: boolean; disableNext: boolean;
  disablePrevYear: boolean; disableNextYear: boolean;
}

interface Props {
  panel: HeaderPanel;
  view: ViewType;
  ui: Record<keyof typeof theme.slots, (options?: { class?: ClassValue }) => string>;
}

defineProps<Props>();

const emit = defineEmits<{ navigate: [direction: -1 | 1, unit: 'page' | 'year']; switchView: [view: ViewType] }>();
</script>

<template>
  <div :class="ui.header()">
    <div :class="[ui.navGroup(), panel.hidePrev ? ui.navBtnHidden() : '']">
      <span
        :class="
          ui.navBtn({
            class: (view === 'date' ? panel.disablePrevYear : panel.disablePrev) ? ui.navBtnDisabled() : '',
          })
        "
        @click.stop="emit('navigate', -1, view === 'date' ? 'year' : 'page')"
      >
        <slot name="prev-year">
          <Icon :name="view === 'date' ? 'lucide:chevrons-left' : 'lucide:chevron-left'" :class="ui.icon()" />
        </slot>
      </span>
      <span
        v-if="view === 'date'"
        :class="ui.navBtn({ class: panel.disablePrev ? ui.navBtnDisabled() : '' })"
        @click.stop="emit('navigate', -1, 'page')"
      >
        <slot name="prev-month"><Icon name="lucide:chevron-left" :class="ui.icon()" /></slot>
      </span>
    </div>
    <div :class="ui.dateTimeHeader()">
      <span v-if="view === 'year'" :class="ui.title()">
        {{ panel.pageStart }} - {{ panel.pageStart + 9 }}
      </span>
      <template v-else>
        <span :class="ui.title()" @click.stop="emit('switchView', 'year')">{{ panel.year }}年</span>
        <span v-if="view === 'date'" :class="ui.title()" @click.stop="emit('switchView', 'month')">
          {{ panel.month + 1 }}月
        </span>
      </template>
    </div>
    <div :class="[ui.navGroup(), panel.hideNext ? ui.navBtnHidden() : '']">
      <span
        v-if="view === 'date'"
        :class="ui.navBtn({ class: panel.disableNext ? ui.navBtnDisabled() : '' })"
        @click.stop="emit('navigate', 1, 'page')"
      >
        <slot name="next-month"><Icon name="lucide:chevron-right" :class="ui.icon()" /></slot>
      </span>
      <span
        :class="
          ui.navBtn({
            class: (view === 'date' ? panel.disableNextYear : panel.disableNext) ? ui.navBtnDisabled() : '',
          })
        "
        @click.stop="emit('navigate', 1, view === 'date' ? 'year' : 'page')"
      >
        <slot name="next-year">
          <Icon
            :name="view === 'date' ? 'lucide:chevrons-right' : 'lucide:chevron-right'"
            :class="ui.icon()"
          />
        </slot>
      </span>
    </div>
  </div>
</template>
