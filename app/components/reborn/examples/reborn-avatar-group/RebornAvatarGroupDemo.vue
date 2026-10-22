<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue';
import type { AvatarShape, AvatarSize } from '~/components/reborn/ui/reborn-avatar/reborn-avatar.config';
import type { Placement } from '~/lib/placement';
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components';
import { computed, ref } from 'vue';
import { avatarPeople } from '~/components/reborn/examples/reborn-avatar/avatar-demo.data';
import { avatarGroupEffects } from '~/components/reborn/ui/reborn-avatar-group/reborn-avatar-group.config';
import RebornAvatarGroup from '~/components/reborn/ui/reborn-avatar-group/RebornAvatarGroup.vue';
import { avatarShapes, avatarSizes } from '~/components/reborn/ui/reborn-avatar/reborn-avatar.config';
import RebornAvatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import { placements } from '~/lib/placement';

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 折叠默认关闭，开启后保留前两个成员并提供悬停查看。 */
const defaultState = {
  size: 'md' as AvatarSize,
  shape: 'circle' as AvatarShape,
  gap: 8,
  collapseAvatars: false,
  collapseAvatarsTooltip: true,
  maxCollapseAvatars: 2,
  effect: 'light',
  placement: 'top' as Placement,
  popperClass: '',
  collapseClass: '',
  customStyles: false,
};
const state = ref({ ...defaultState });
const inputProps = { ui: { input: 'w-0' } };
/** 恢复组参数。 */
function resetState() { state.value = { ...defaultState }; }
/** 数量与浮层各自独立控制，便于核对联动前提。 */
const controls: PlaygroundControlGroup[] = [
  { title: '基础属性', children: [
    { label: '组尺寸', key: 'size', component: 'select', defaultValue: 'md', props: { options: [...avatarSizes.map(value => ({ label: value, value })), { label: '自定义 · 48px', value: 48 }] } },
    { label: '组形状', key: 'shape', component: 'select', defaultValue: 'circle', props: { options: avatarShapes.map(value => ({ label: value === 'circle' ? '圆形' : '方形', value })) } },
    { label: '重叠距离（px）', key: 'gap', component: 'input-number', defaultValue: 8, props: { ...inputProps, min: 0, step: 1 } },
    { label: '折叠超出头像', key: 'collapseAvatars', component: 'checkbox', defaultValue: false },
    { label: '折叠头像浮层', key: 'collapseAvatarsTooltip', component: 'checkbox', defaultValue: true },
    { label: '保留头像数', key: 'maxCollapseAvatars', component: 'input-number', defaultValue: 2, props: { ...inputProps, min: 1, max: 5, step: 1 } },
  ] },
  { title: '浮层与样式', children: [
    { label: '浮层主题', key: 'effect', component: 'select', defaultValue: 'light', props: { options: avatarGroupEffects.map(value => ({ label: value === 'light' ? '浅色' : '深色', value })) } },
    { label: '浮层方位', key: 'placement', component: 'select', defaultValue: 'top', props: { options: placements.map(value => ({ label: value, value })) } },
    { label: '浮层类名', key: 'popperClass', component: 'input', defaultValue: '', props: inputProps },
    { label: '计数头像类名', key: 'collapseClass', component: 'input', defaultValue: '', props: inputProps },
    { label: '覆盖行内样式', key: 'customStyles', component: 'checkbox', defaultValue: false, codeIgnore: true },
  ] },
];
/** 完整显示当前组参数，辅助开关转换为实际样式。 */
const groupCode = computed(() => {
  const s = state.value;
  return `<RebornAvatarGroup\n  ${typeof s.size === 'number' ? ':size' : 'size'}="${s.size}"\n  shape="${s.shape}"\n  :gap="${s.gap}"\n  :collapse-avatars="${s.collapseAvatars}"\n  :collapse-avatars-tooltip="${s.collapseAvatarsTooltip}"\n  :max-collapse-avatars="${s.maxCollapseAvatars}"\n  effect="${s.effect}"\n  placement="${s.placement}"\n  popper-class="${s.popperClass}"\n  collapse-class="${s.collapseClass}"\n  :popper-style="${s.customStyles ? "{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }" : '{}'}"\n  :collapse-style="${s.customStyles ? "{ color: 'var(--color-primary)' }" : '{}'}"\n>\n  <RebornAvatar v-for="person in people" :key="person.name" :src="person.src" :alt="person.name" />\n</RebornAvatarGroup>`;
});
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="groupCode" component-name="RebornAvatarGroup" title="交互演练场" description="调节组尺寸、折叠数量和浮层主题，查看头像的继承与重叠。">
      <template #tag><RebornButton size="sm" variant="soft" color="neutral" @click="resetState"><Icon name="lucide:rotate-ccw" />重置配置</RebornButton></template>
      <div class="flex flex-col items-center gap-6 py-8">
        <RebornAvatarGroup
          :size="state.size" :shape="state.shape" :gap="state.gap" :collapse-avatars="state.collapseAvatars" :collapse-avatars-tooltip="state.collapseAvatarsTooltip" :max-collapse-avatars="state.maxCollapseAvatars"
          :effect="state.effect" :placement="state.placement" :popper-class="state.popperClass" :collapse-class="state.collapseClass"
          :popper-style="state.customStyles ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' } : undefined" :collapse-style="state.customStyles ? { color: 'var(--color-primary)' } : undefined" aria-label="项目成员"
        >
          <RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" />
        </RebornAvatarGroup>
        <DemoNote tone="dimmed">共 {{ avatarPeople.length }} 位成员；开启折叠后，计数头像表示未直接展示的人数。</DemoNote>
      </div>
    </Playground>
    <DemoSection title="基础头像组">
      <template #description>默认插槽放置 <code>RebornAvatar</code>，相邻头像重叠排列并使用描边区分边界。</template>
      <DemoBlock layout="row"><RebornAvatarGroup aria-label="团队成员"><RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" /></RebornAvatarGroup></DemoBlock>
    </DemoSection>
    <DemoSection title="尺寸与形状">
      <template #description>子头像继承组的 <code>size</code> 和 <code>shape</code>；子项显式传参时使用自己的值。</template>
      <DemoBlock layout="stack" class="gap-6">
        <div class="flex flex-wrap items-center gap-6">
          <RebornAvatarGroup v-for="size in avatarSizes" :key="size" :size="size"><RebornAvatar v-for="person in avatarPeople.slice(0, 3)" :key="person.name" :src="person.src" :alt="person.name" /></RebornAvatarGroup>
        </div>
        <RebornAvatarGroup shape="square" :size="48">
          <RebornAvatar v-for="person in avatarPeople.slice(0, 3)" :key="person.name" :src="person.src" :alt="person.name" />
          <RebornAvatar size="lg" shape="circle" :ui="{ root: 'bg-brand-1 text-primary' }" alt="单独覆盖形状">RE</RebornAvatar>
        </RebornAvatarGroup>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="重叠距离">
      <template #description><code>gap</code> 默认 8px，数值越大重叠越多；传入 <code>0</code> 时相邻头像不重叠。</template>
      <DemoBlock layout="stack" class="gap-6">
        <div v-for="gap in [0, 8, 12, 16]" :key="gap" class="flex items-center gap-6">
          <span class="w-12 shrink-0 text-sm text-gray-7">{{ gap }}px</span>
          <RebornAvatarGroup :gap="gap" size="lg" collapse-avatars :max-collapse-avatars="3">
            <RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" />
          </RebornAvatarGroup>
        </div>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="折叠头像">
      <template #description>开启 <code>collapseAvatars</code> 后，<code>maxCollapseAvatars</code> 控制直接展示的头像数，计数头像不占名额。</template>
      <DemoBlock layout="row" class="gap-8">
        <RebornAvatarGroup v-for="limit in [1, 2, 4]" :key="limit" collapse-avatars :max-collapse-avatars="limit" size="lg"><RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" /></RebornAvatarGroup>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="悬停查看">
      <template #description>同时开启 <code>collapseAvatarsTooltip</code> 与 <code>collapseAvatars</code>，悬停或键盘聚焦计数头像即可查看隐藏头像。</template>
      <DemoBlock layout="row" class="gap-10 py-6">
        <div v-for="effect in avatarGroupEffects" :key="effect" class="flex flex-col gap-3">
          <span class="text-sm text-gray-7">{{ effect === 'light' ? '浅色浮层' : '深色浮层' }}</span>
          <RebornAvatarGroup :effect="effect" collapse-avatars collapse-avatars-tooltip :max-collapse-avatars="2" size="lg" placement="top"><RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" /></RebornAvatarGroup>
        </div>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="自定义样式">
      <template #description><code>ui</code> 覆盖组结构；<code>collapseClass</code>、<code>collapseStyle</code> 作用于计数头像，<code>popperClass</code>、<code>popperStyle</code> 作用于浮层面板。</template>
      <DemoBlock layout="row" class="py-6">
        <RebornAvatarGroup
          size="lg" :gap="12" collapse-avatars collapse-avatars-tooltip :max-collapse-avatars="3"
          :ui="{ root: 'p-3 rounded-xl bg-primary/5', tooltip: 'border-primary/30' }"
          collapse-class="bg-brand-1 text-primary" :collapse-style="{ fontWeight: 700 }" popper-class="shadow-xl" popper-style="padding: 16px" placement="bottom"
        >
          <RebornAvatar v-for="person in avatarPeople" :key="person.name" :src="person.src" :alt="person.name" />
        </RebornAvatarGroup>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
