<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue';
import type { AvatarFit, AvatarShape, AvatarSize } from '~/components/reborn/ui/reborn-avatar/reborn-avatar.config';
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from '#components';
import { computed, h, ref } from 'vue';
import { avatarFits, avatarShapes, avatarSizes } from '~/components/reborn/ui/reborn-avatar/reborn-avatar.config';
import RebornAvatar from '~/components/reborn/ui/reborn-avatar/RebornAvatar.vue';
import RebornBadge from '~/components/reborn/ui/reborn-badge/RebornBadge.vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import { avatarPeople } from './avatar-demo.data';

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 默认展示图片，清空图片后可核对图标与文字回退。 */
const defaultState = {
  size: 'md' as AvatarSize,
  shape: 'circle' as AvatarShape,
  fit: 'cover' as AvatarFit,
  src: avatarPeople[0]!.src,
  srcSet: '',
  alt: '林舟的头像',
  icon: '',
  text: '林',
};
const state = ref({ ...defaultState });
const lastEvent = ref('尚未发生图片错误');
const inputProps = { ui: { input: 'w-0' } };
/** 重置配置和错误回显。 */
function resetState() {
  state.value = { ...defaultState };
  lastEvent.value = '尚未发生图片错误';
}
/** 记录原生错误，不在处理器中无限重试。 */
function handleError() {
  lastEvent.value = '已触发 error，当前显示回退内容';
}
/** 尺寸既支持三档枚举，也支持数值。 */
const controls: PlaygroundControlGroup[] = [
  { title: '基础属性', children: [
    { label: '尺寸', key: 'size', component: 'select', defaultValue: 'md', props: { options: [...avatarSizes.map(value => ({ label: `${value} · ${{ sm: 24, md: 32, lg: 40 }[value]}px`, value })), { label: '自定义 · 56px', value: 56 }] } },
    { label: '形状', key: 'shape', component: 'select', defaultValue: 'circle', props: { options: avatarShapes.map(value => ({ label: value === 'circle' ? '圆形' : '方形', value })) } },
    { label: '图片适应', key: 'fit', component: 'select', defaultValue: 'cover', props: { options: avatarFits.map(value => ({ label: value, value })) } },
  ] },
  { title: '内容', children: [
    { label: '图片地址（可清空）', key: 'src', component: 'input', defaultValue: defaultState.src, props: inputProps },
    { label: '响应式图片候选', key: 'srcSet', component: 'input', defaultValue: '', props: inputProps },
    { label: '替代文字', key: 'alt', component: 'input', defaultValue: defaultState.alt, props: inputProps },
    { label: '回退图标名称', key: 'icon', component: 'input', defaultValue: '', props: { ...inputProps, placeholder: 'lucide:user-round' } },
    { label: '回退文字', key: 'text', component: 'input', defaultValue: '林', props: inputProps },
  ] },
];
/** 传参明细保留响应式图片候选和默认插槽。 */
const avatarCode = computed(() => {
  const s = state.value;
  return `<RebornAvatar\n  ${typeof s.size === 'number' ? ':size' : 'size'}="${s.size}"\n  shape="${s.shape}"\n  src="${s.src}"\n  src-set="${s.srcSet}"\n  alt="${s.alt}"\n  fit="${s.fit}"\n  icon="${s.icon}"\n  @error="handleError"\n>\n  ${s.text}\n</RebornAvatar>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 组件型图标示例，与字符串图标使用相同的样式入口。 */
const ProfileIcon = () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8 }, [
  h('circle', { cx: 12, cy: 8, r: 4 }),
  h('path', { d: 'M4 22v-2a8 8 0 0 1 16 0v2' }),
]);
const brokenImage = 'data:image/png;base64,broken';
const errorSource = ref(brokenImage);
const errorCount = ref(0);
const unreadCount = ref(8);
const isOnline = ref(true);
/** 徽标放在头像外层，避免被头像的圆形裁剪。 */
const countBadgeUi = {
  root: 'absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 cursor-default',
  base: 'ring-2 ring-gray-1',
};
/** 覆盖徽标预设高度，让空内容徽标保持 10px 圆点。 */
const statusBadgeUi = {
  root: 'absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 cursor-default',
  base: 'size-2.5! p-0 ring-2 ring-gray-1',
};
/** 切换有效图片和无效图片，可重复验证恢复与回退。 */
function toggleErrorImage() {
  errorSource.value = errorSource.value === brokenImage ? avatarPeople[0]!.src : brokenImage;
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="avatarCode" component-name="RebornAvatar" title="交互演练场" description="调节尺寸、形状和图片，查看图标与文字的回退顺序。">
      <template #tag><RebornButton size="sm" variant="soft" color="neutral" @click="resetState"><Icon name="lucide:rotate-ccw" />重置配置</RebornButton></template>
      <div class="flex flex-col items-center gap-6">
        <RebornAvatar :size="state.size" :shape="state.shape" :src="state.src" :src-set="state.srcSet" :alt="state.alt" :fit="state.fit" :icon="state.icon" @error="handleError">{{ state.text }}</RebornAvatar>
        <DemoNote tone="dimmed">{{ lastEvent }}</DemoNote>
      </div>
    </Playground>

    <DemoSection title="头像内容">
      <template #description>优先显示 <code>src</code> 或 <code>srcSet</code> 图片，图片不可用时依次显示 <code>icon</code>、默认插槽。</template>
      <DemoBlock layout="row" class="gap-6">
        <RebornAvatar :src="avatarPeople[0]!.src" alt="林舟" />
        <RebornAvatar icon="lucide:user-round" alt="个人账号" />
        <RebornAvatar :icon="ProfileIcon" alt="组件图标" />
        <RebornAvatar alt="林舟">林</RebornAvatar>
        <RebornAvatar :src-set="`${avatarPeople[1]!.src} 1x`" alt="响应式头像" />
      </DemoBlock>
    </DemoSection>
    <DemoSection title="尺寸">
      <template #description><code>size</code> 三档固定为 24、32、40px，数值表示自定义像素尺寸。</template>
      <DemoBlock layout="row" class="gap-6">
        <div v-for="size in avatarSizes" :key="size" class="flex flex-col items-center gap-2">
          <RebornAvatar :size="size" :src="avatarPeople[0]!.src" alt="林舟" /><span class="text-sm text-gray-7">{{ size }}</span>
        </div>
        <div class="flex flex-col items-center gap-2"><RebornAvatar :size="56" icon="lucide:user-round" /><span class="text-sm text-gray-7">56px</span></div>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="形状">
      <template #description><code>shape</code> 控制圆形与方形，图片和回退内容共用同一外框。</template>
      <DemoBlock layout="row" class="gap-6">
        <RebornAvatar v-for="shape in avatarShapes" :key="shape" :shape="shape" size="lg" :src="avatarPeople[1]!.src" alt="陈雨" />
        <RebornAvatar shape="square" size="lg" icon="lucide:building-2" alt="组织账号" />
      </DemoBlock>
    </DemoSection>
    <DemoSection title="图片适应">
      <template #description><code>fit</code> 直接控制图片的 <code>object-fit</code>；放大外框后可对比原图和裁剪范围。</template>
      <DemoBlock layout="row" class="gap-5">
        <div v-for="fit in avatarFits" :key="fit" class="flex flex-col items-center gap-2">
          <RebornAvatar :fit="fit" :size="72" shape="square" :src="avatarPeople[2]!.src" alt="周宁" :ui="{ root: 'w-[96px]' }" /><span class="text-sm text-gray-7">{{ fit }}</span>
        </div>
      </DemoBlock>
    </DemoSection>
    <DemoSection title="回退行为">
      <template #description>图片加载失败时先显示 <code>icon</code>，未设置图标则显示默认插槽；更换 <code>src</code> 后自动重试。</template>
      <DemoBlock layout="row" class="gap-6">
        <div class="flex flex-col items-center gap-2">
          <RebornAvatar :src="errorSource" size="lg" icon="lucide:user-round" alt="图标回退" />
          <span class="text-sm text-gray-7">图标回退</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <RebornAvatar :src="errorSource" size="lg" alt="林舟" @error="errorCount++">林</RebornAvatar>
          <span class="text-sm text-gray-7">姓名首字</span>
        </div>
        <div class="flex flex-col items-center gap-2">
          <RebornAvatar :src="errorSource" size="lg" alt="默认图片回退" :ui="{ fallback: 'size-full p-0' }">
            <img :src="avatarPeople[4]!.src" alt="" class="size-full object-cover">
          </RebornAvatar>
          <span class="text-sm text-gray-7">默认图片</span>
        </div>
      </DemoBlock>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <RebornButton size="sm" variant="soft" @click="toggleErrorImage">{{ errorSource === brokenImage ? '切换有效图片' : '切换失败图片' }}</RebornButton>
        <DemoNote tone="dimmed">姓名首字示例已触发 {{ errorCount }} 次 error</DemoNote>
      </div>
    </DemoSection>
    <DemoSection title="显示徽标">
      <template #description>与 <code>RebornBadge</code> 组合，在头像右上角显示未读数量或状态点；徽标定位到外层容器。</template>
      <DemoBlock layout="row" class="gap-8">
        <div class="flex flex-col items-center gap-3">
          <div class="relative inline-flex">
            <RebornAvatar size="lg" :src="avatarPeople[0]!.src" alt="林舟" />
            <RebornBadge :show="unreadCount > 0" :label="unreadCount" size="sm" color="error" round :ui="countBadgeUi" />
          </div>
          <span class="text-sm text-gray-7">未读消息</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="relative inline-flex">
            <RebornAvatar size="lg" shape="square" :src="avatarPeople[1]!.src" alt="陈雨" />
            <RebornBadge label="99+" size="sm" color="error" round :ui="countBadgeUi" />
          </div>
          <span class="text-sm text-gray-7">超过上限</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="relative inline-flex">
            <RebornAvatar size="lg" :src="avatarPeople[2]!.src" alt="周宁" />
            <RebornBadge :color="isOnline ? 'success' : 'neutral'" size="sm" round :ui="statusBadgeUi" />
          </div>
          <span class="text-sm text-gray-7">{{ isOnline ? '在线' : '离线' }}</span>
        </div>
      </DemoBlock>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <RebornButton size="sm" variant="soft" @click="unreadCount = unreadCount ? 0 : 8">{{ unreadCount ? '清空未读' : '恢复未读' }}</RebornButton>
        <RebornButton size="sm" variant="soft" color="neutral" @click="isOnline = !isOnline">{{ isOnline ? '切换为离线' : '切换为在线' }}</RebornButton>
      </div>
    </DemoSection>
    <DemoSection title="自定义样式">
      <template #description><code>ui</code> 按结构覆盖外框、图片、图标与回退内容，<code>class</code> 追加到外框。</template>
      <DemoBlock layout="row" class="gap-6">
        <RebornAvatar size="lg" :ui="{ root: 'bg-primary/10 text-primary ring-2 ring-primary/30', fallback: 'font-semibold' }">RE</RebornAvatar>
        <RebornAvatar size="lg" icon="lucide:leaf" :ui="{ root: 'bg-success/10 text-success', icon: 'size-5' }" />
        <RebornAvatar size="lg" :src="avatarPeople[3]!.src" alt="苏禾" :ui="{ root: 'rounded-xl ring-2 ring-warning/30', image: 'grayscale' }" />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
