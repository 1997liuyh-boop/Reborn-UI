<script setup lang="ts">
/**
 * 总览卡片缩略：已选 14:30:00 的触发框，下方是时 / 分 / 秒三列滚轮，中间一行为选中项
 *
 * 真实下拉面板传送到 body 且只能点击展开；面板每列是 3 组循环选项（时 72 项、分秒各 180 项）的滚动列表，
 * 滚出可视区的选项会被计入卡片的溢出测量。缩略图用时间面板的主题样式静态画出每列三行，外框沿用下拉浮层样式。
 */
import { shallowRef } from "vue";
import theme from '~/components/reborn/ui/reborn-time-picker/reborn-time-panel.config'
import RebornTimePicker from '~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const time = shallowRef('14:30:00')

const styles = tv(theme)({ variant: 'filled', color: 'primary' })

/** 每列只画选中项与上下相邻各一项 */
const columns = [
  ['13', '14', '15'],
  ['29', '30', '31'],
  ['59', '00', '01'],
]
</script>

<template>
  <div class="flex w-[176px] flex-col gap-1">
    <RebornTimePicker
      v-model="time"
      size="sm"
    />
    <div class="w-full overflow-hidden rounded-lg border border-gray-3 bg-gray-1 shadow-lg">
      <div :class="cn(styles.wrapper(), styles.body(), 'py-1')">
        <div :class="styles.columns()">
          <div
            v-for="(column, index) in columns"
            :key="index"
            :class="styles.column()"
          >
            <div class="relative">
              <div :class="styles.indicator()" />
              <div class="relative flex flex-col">
                <div
                  v-for="(item, row) in column"
                  :key="item"
                  :class="styles.item({ class: row === 1 ? styles.itemActive() : styles.itemIdle() })"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
