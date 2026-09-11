<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue';
import type { PopconfirmPlacement } from '~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue';
import { computed, ref } from 'vue';
import DemoBlock from '~/components/common/demo/DemoBlock.vue';
import DemoNote from '~/components/common/demo/DemoNote.vue';
import DemoSection from '~/components/common/demo/DemoSection.vue';
import Playground from '~/components/common/play-ground/Playground.vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornPopconfirm from '~/components/reborn/ui/reborn-popconfirm/RebornPopconfirm.vue';
import { placementAliases, placements } from '~/lib/placement';

/** 12 种基础方位，取值与 reborn-tooltip 的 placement 完全一致。 */
const placementOptions = placements.map(value => ({ label: value, value }));

/** 参考 Tooltip 的环绕布局，按钮简称与实际弹出方向一一对应。 */
const placementExamples = [
  { placement: 'top-start', label: 'TL', cell: 'col-start-2 row-start-1' },
  { placement: 'top', label: 'Top', cell: 'col-start-3 row-start-1' },
  { placement: 'top-end', label: 'TR', cell: 'col-start-4 row-start-1' },
  { placement: 'left-start', label: 'LT', cell: 'col-start-1 row-start-2' },
  { placement: 'right-start', label: 'RT', cell: 'col-start-5 row-start-2' },
  { placement: 'left', label: 'Left', cell: 'col-start-1 row-start-3' },
  { placement: 'right', label: 'Right', cell: 'col-start-5 row-start-3' },
  { placement: 'left-end', label: 'LB', cell: 'col-start-1 row-start-4' },
  { placement: 'right-end', label: 'RB', cell: 'col-start-5 row-start-4' },
  { placement: 'bottom-start', label: 'BL', cell: 'col-start-2 row-start-5' },
  { placement: 'bottom', label: 'Bottom', cell: 'col-start-3 row-start-5' },
  { placement: 'bottom-end', label: 'BR', cell: 'col-start-4 row-start-5' },
] as const;

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 主要属性轴的默认状态。 */
const defaultState = {
  title: '确定删除这条数据吗？',
  description: '删除后不可恢复，关联的引用也会一并失效。',
  confirmText: '确定',
  cancelText: '取消',
  placement: 'top' as PopconfirmPlacement,
  sideOffset: 8,
  arrow: true,
  hideCancel: false,
};
const state = ref({ ...defaultState });

/** 重置所有演练轴。 */
function resetState() {
  state.value = { ...defaultState };
}

/** 面板覆盖文案、定位与按钮配置。 */
const controls: PlaygroundControlGroup[] = [
  { title: '内容', children: [
    { label: '标题', key: 'title', component: 'input', defaultValue: defaultState.title },
    { label: '描述（留空隐藏）', key: 'description', component: 'input', defaultValue: defaultState.description },
    { label: '确认按钮文字', key: 'confirmText', component: 'input', defaultValue: '确定' },
    { label: '取消按钮文字', key: 'cancelText', component: 'input', defaultValue: '取消' },
  ] },
  { title: '定位与按钮', children: [
    { label: '气泡位置', key: 'placement', component: 'select', defaultValue: 'top', props: { options: placementOptions } },
    { label: '与触发器间距', key: 'sideOffset', component: 'slider', defaultValue: 8, props: { min: 0, max: 24, step: 1 } },
    { label: '显示箭头', key: 'arrow', component: 'checkbox', defaultValue: true },
    { label: '隐藏取消按钮', key: 'hideCancel', component: 'checkbox', defaultValue: false },
  ] },
];

/** 完整参数代码，可复制到真实页面。 */
const popconfirmCode = computed(() => {
  const s = state.value;
  return `<RebornPopconfirm\n  title="${s.title}"\n  description="${s.description}"\n  confirm-text="${s.confirmText}"\n  cancel-text="${s.cancelText}"\n  placement="${s.placement}"\n  :side-offset="${s.sideOffset}"\n  :arrow="${s.arrow}"\n  :hide-cancel="${s.hideCancel}"\n  @confirm="onConfirm"\n  @cancel="onCancel"\n>\n  <RebornButton size="sm" variant="outlined" color="neutral">删除</RebornButton>\n</RebornPopconfirm>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 记录最近一次操作，展示事件确实已触发。 */
const lastAction = ref('等待操作');

/** 异步确认：加载期间气泡保持打开，完成后手动关闭。 */
const asyncOpen = ref(false);
const asyncLoading = ref(false);
let asyncTimer: ReturnType<typeof setTimeout> | null = null;

function onAsyncConfirm() {
  if (asyncLoading.value) return;
  asyncLoading.value = true;
  lastAction.value = '异步删除中…';
  if (asyncTimer) clearTimeout(asyncTimer);
  asyncTimer = setTimeout(() => {
    asyncLoading.value = false;
    asyncOpen.value = false;
    lastAction.value = '异步删除完成';
  }, 1200);
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="popconfirmCode" component-name="RebornPopconfirm" title="交互演练场" description="调整文案、定位与按钮配置，点击触发按钮实时预览气泡确认框。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading><span class="icon-[lucide--rotate-ccw] size-[12px]" /></template>
          重置配置
        </RebornButton>
      </template>
      <div class="flex w-full min-w-0 flex-col items-center gap-6 py-16">
        <RebornPopconfirm
          :title="state.title" :description="state.description || undefined" :confirm-text="state.confirmText" :cancel-text="state.cancelText"
          :placement="state.placement" :side-offset="state.sideOffset" :arrow="state.arrow" :hide-cancel="state.hideCancel"
          @confirm="lastAction = '点击了确认'" @cancel="lastAction = '点击了取消'"
        >
          <RebornButton size="sm" variant="outlined" color="neutral">删除</RebornButton>
        </RebornPopconfirm>
        <DemoNote tone="dimmed" class="font-mono text-xs">{{ lastAction }}</DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法" description="默认插槽放触发器，点击后在上方弹出确认气泡；confirm / cancel 事件对应两个按钮，点击外部同样关闭。">
      <DemoBlock layout="row" class="gap-6 py-10">
        <RebornPopconfirm title="确定删除这条数据吗？" description="删除后不可恢复，关联的引用也会一并失效。" @confirm="lastAction = '基础用法：确认'" @cancel="lastAction = '基础用法：取消'">
          <RebornButton size="sm" variant="outlined" color="error">删除</RebornButton>
        </RebornPopconfirm>
        <RebornPopconfirm title="确认提交本次修改？" @confirm="lastAction = '仅标题：确认'">
          <RebornButton size="sm">仅标题</RebornButton>
        </RebornPopconfirm>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="弹出方位">
      <template #description>
        <code>placement</code> 取值与 <code>reborn-tooltip</code> 完全一致：四个方向各带 <code>-start</code> / <code>-end</code> 对齐，共 12 种；超出视口时自动翻转到对侧，<code>sideOffset</code> 调整与触发器的间距。
      </template>
      <DemoBlock layout="stack" align="center" class="py-14">
        <div class="grid w-full max-w-[528px] grid-cols-5 gap-2 sm:gap-3">
          <div v-for="item in placementExamples" :key="item.placement" :class="item.cell">
            <RebornPopconfirm title="确定执行该操作吗？" :placement="item.placement" class="w-full" :ui="{ popover: { trigger: 'w-full' } }">
              <RebornButton size="sm" class="w-full px-1" :aria-label="item.placement">{{ item.label }}</RebornButton>
            </RebornPopconfirm>
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="驼峰方位别名">
      <template #description>
        与 <code>reborn-tooltip</code> 一样接受 <code>topLeft</code> / <code>rightBottom</code> 这类驼峰写法，等价于对应的连字符取值。
      </template>
      <DemoBlock layout="row" class="gap-6 py-14">
        <RebornPopconfirm v-for="alias in placementAliases" :key="alias" title="确定执行该操作吗？" :placement="alias">
          <RebornButton size="sm" variant="outlined" color="neutral">{{ alias }}</RebornButton>
        </RebornPopconfirm>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="按钮定制" description="confirmColor / cancelColor 换语义色，confirmText / cancelText 换文案，hideCancel 只留确认按钮。">
      <DemoBlock layout="row" class="gap-6 py-10">
        <RebornPopconfirm title="确定移除该成员吗？" description="移除后对方将立即失去项目访问权限。" confirm-color="error" confirm-text="移除" cancel-text="再想想">
          <RebornButton size="sm" variant="outlined" color="error">危险操作</RebornButton>
        </RebornPopconfirm>
        <RebornPopconfirm title="已阅读并知晓以上提醒？" hide-cancel confirm-text="知道了">
          <RebornButton size="sm" variant="outlined" color="neutral">仅确认</RebornButton>
        </RebornPopconfirm>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="异步确认" description="loading 让确认按钮进入加载态且点击不再自动关闭，配合 v-model:open 在异步完成后手动收起。">
      <DemoBlock layout="row" class="gap-6 py-10">
        <RebornPopconfirm v-model:open="asyncOpen" title="确定删除所选的 3 项吗？" description="删除请求完成前请勿关闭页面。" :loading="asyncLoading" confirm-color="error" confirm-text="删除" @confirm="onAsyncConfirm" @cancel="lastAction = '异步删除已取消'">
          <RebornButton size="sm" variant="outlined" color="error">异步删除</RebornButton>
        </RebornPopconfirm>
        <DemoNote tone="dimmed">{{ lastAction }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义内容" description="title / description 插槽替换文字内容，footer 插槽接管按钮区并拿到 confirm / cancel 回调。">
      <DemoBlock layout="row" class="gap-6 py-10">
        <RebornPopconfirm description="发布后将对全部用户可见，可随时在后台下线。" @confirm="lastAction = '自定义标题：确认'">
          <template #title>
            <span class="inline-flex items-center gap-[4px]">
              <span class="icon-[lucide--rocket] size-[14px] text-primary" />
              确认发布新版本？
            </span>
          </template>
          <RebornButton size="sm">自定义标题</RebornButton>
        </RebornPopconfirm>
        <RebornPopconfirm title="对本次改动满意吗？">
          <template #footer="{ confirm, cancel }">
            <RebornButton size="sm" variant="text" color="neutral" @click="cancel">不满意</RebornButton>
            <RebornButton size="sm" variant="soft" color="success" @click="confirm">满意</RebornButton>
          </template>
          <RebornButton size="sm" variant="outlined" color="neutral">自定义按钮区</RebornButton>
        </RebornPopconfirm>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
