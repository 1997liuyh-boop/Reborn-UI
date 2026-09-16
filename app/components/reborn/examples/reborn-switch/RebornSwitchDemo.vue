<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { switchColors, switchSizes, switchTypes } from "~/components/reborn/ui/reborn-switch/reborn-switch.config";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";

const colorOptions = switchColors.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const sizeOptions = switchSizes.map(s => ({ label: s.toUpperCase(), value: s as typeof switchSizes[number] }));
const typeOptions = switchTypes.map(t => ({ label: t, value: t as typeof switchTypes[number] }));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  size: "md",
  color: "primary",
  type: "circle",
  activeLabel: "开启",
  inactiveLabel: "关闭",
  inlinePrompt: false,
  wave: false,
  disabled: false,
  loading: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场开关绑定值 */
const playValue = ref(true);

/** change 触发次数与最近载荷，让预览区的交互「有回应」 */
const changeCount = ref(0);
const lastChange = ref("—");
function onPlayChange(value: any) {
  changeCount.value++;
  lastChange.value = JSON.stringify(value);
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playValue.value = true;
  changeCount.value = 0;
  lastChange.value = "—";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "尺寸规格", key: "size", component: "select" as const, defaultValue: "md", props: { options: sizeOptions } },
      { label: "配色方案", key: "color", component: "select" as const, defaultValue: "primary", props: { options: colorOptions } },
      { label: "形态（type）", key: "type", component: "select" as const, defaultValue: "circle", props: { options: typeOptions } },
      { label: "开启文案", key: "activeLabel", component: "input" as const, defaultValue: "开启" },
      { label: "关闭文案", key: "inactiveLabel", component: "input" as const, defaultValue: "关闭" },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "文本显示在开关内（line 型不生效）", key: "inlinePrompt", component: "checkbox" as const, defaultValue: false },
      { label: "切换波纹", key: "wave", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "加载状态", key: "loading", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const switchCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    `v-model="value"`,
    `size="${s.size}"`,
    `color="${s.color}"`,
    `type="${s.type}"`,
    `active-label="${s.activeLabel}"`,
    `inactive-label="${s.inactiveLabel}"`,
    `:inline-prompt="${s.inlinePrompt}"`,
    `:wave="${s.wave}"`,
    `:disabled="${s.disabled}"`,
    `:loading="${s.loading}"`,
  ];
  return `<RebornSwitch\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 颜色矩阵演示 */
const colorValue = ref(true);
/** 形态演示 */
const typeValue = ref(true);
/** 自定义颜色演示 */
const customColorValue = ref(true);
/** 点内文本演示 */
const inlineValue = ref(true);
/** 切换波纹演示：三个开关共用一个值，点一下可同时对比三种波纹色 */
const waveValue = ref(false);
/** 尺寸演示 */
const sizeValue = ref(true);
/** 自定义取值演示：绑定 'yes' / 'no' 而非布尔 */
const customValue = ref("yes");
/** 拦截切换演示：Promise resolve(false) 时取消切换 */
const beforeChangeValue = ref(false);
/** 加载与插槽演示 */
const loadingValue = ref(true);
const iconValue = ref(true);
/** 样式定制演示 */
const styledValue = ref(true);

/** 模拟异步二次确认：500ms 后弹出 confirm，取消则回滚 */
function handleBeforeChange() {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      // demo 语境下用原生 confirm 模拟二次确认，业务中请换成对话框组件
      // eslint-disable-next-line no-alert
      resolve(window.confirm("确认切换状态吗？"));
    }, 500);
  });
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground v-model="state" :controls="controls" :code="switchCode" component-name="RebornSwitch" title="交互演练场"
      description="调节左侧参数，实时查看开关表现；点击开关观察 change 事件回显。">
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <RebornSwitch v-model="playValue" :size="state.size" :color="state.color" :type="state.type"
          :active-label="state.activeLabel" :inactive-label="state.inactiveLabel" :inline-prompt="state.inlinePrompt"
          :wave="state.wave" :disabled="state.disabled" :loading="state.loading" @change="onPlayChange" />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          value: {{ playValue }} · change × {{ changeCount }} · 最近载荷: {{ lastChange }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="颜色" description="开启态轨道取语义色，关闭态统一为中性灰；两侧文案跟随开关状态与语义色联动高亮。">
      <DemoBlock class="gap-6">
        <RebornSwitch v-for="c in switchColors" :key="c" v-model="colorValue" :color="c" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸">
      <template #description>
        三档圆形规格：<code>sm</code> 16×28 / 滑块 12px、<code>md</code> 24×44 / 滑块 20px、<code>lg</code> 32×60 / 滑块
        28px，滑块四周留白固定 2px。
      </template>
      <DemoBlock class="items-center gap-8">
        <RebornSwitch v-for="s in switchSizes" :key="s" v-model="sizeValue" :size="s" :active-label="s" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义颜色">
      <template #description>
        <code>ui.activeTrack</code> / <code>ui.inactiveTrack</code> 分别覆盖开、关状态的背景与 ring，
        <code>ui.track</code> 设置通用轨道样式，状态样式优先于通用样式。
      </template>
      <DemoBlock class="items-center gap-8">
        <RebornSwitch v-model="customColorValue"
          :ui="{ activeTrack: 'bg-[#13ce66] ring-[#0f9d4e]', inactiveTrack: 'bg-[#ff4949] ring-[#d9363e]' }" />
        <RebornSwitch v-model="customColorValue"
          :ui="{ track: 'ring-2', activeTrack: 'bg-primary ring-primary/40', inactiveTrack: 'bg-[#f5f7fa] ring-[#dcdfe6]' }" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="形态">
      <template #description>
        <code>type</code> 提供三种形态：<code>circle</code> 胶囊圆形（默认）、<code>round</code>
        圆角方形、<code>line</code> 细线轨道 + 悬浮滑块——轨道压成滑块直径一半的细线，滑块骑在线上居中滑动。
      </template>
      <DemoBlock class="items-center gap-8">
        <RebornSwitch v-model="typeValue" type="circle" active-label="circle" />
        <RebornSwitch v-model="typeValue" type="round" active-label="round" />
        <RebornSwitch v-model="typeValue" type="line" active-label="line" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="文字描述">
      <template #description>
        使用<code>inline-prompt</code>属性来控制文本是否显示在点内
        <p>
          使用 <code>active-label</code> / <code>inactive-label</code> 属性来设置开关的文字描述。
        </p>
      </template>
      <DemoBlock class="items-center gap-8">
        <RebornSwitch v-model="inlineValue" inline-prompt active-label="开" inactive-label="关" />
        <RebornSwitch v-model="inlineValue" inline-prompt type="round" size="lg" color="success" active-label="ON"
          inactive-label="OFF" />
      </DemoBlock>
      <DemoBlock class="items-center gap-8 mt-8">
        <RebornSwitch v-model="inlineValue" inline-prompt size="lg" active-label="超出省略" inactive-label="超出省略" />
        <RebornSwitch v-model="inlineValue" inline-prompt auto-width size="lg" active-label="完整展示多个内容"
          inactive-label="多个内容" />
      </DemoBlock>
      <DemoBlock class="items-center gap-8 mt-8">
        <RebornSwitch v-model="inlineValue" inline-prompt auto-width size="lg"
          :ui="{ activeTrack: 'bg-[#9f1422]', inactiveTrack: 'bg-[#006ba8]' }">
          <template #inactiveLabel>
            <div class="flex items-center gap-1 text-white">
              我很不开心
              <div class="bg-gray-1/40 p-1 rounded-full inline-flex">
                <Icon name="noto:enraged-face" />
              </div>
            </div>
          </template>
          <template #activeLabel>
            <div class="flex items-center gap-1 text-white">
              <div class="bg-gray-1/40 p-1 rounded-full inline-flex">
                <Icon name="noto:beaming-face-with-smiling-eyes" />
              </div>
              我很开心
            </div>
          </template>
          <template #active>
            <Icon name="noto:heart-suit" />
          </template>
          <template #inactive>
            <Icon name="noto:broken-heart" />
          </template>
        </RebornSwitch>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="切换波纹">
      <template #description>
        <code>wave</code> 在每次切换成功后从轨道边缘向外扩散一圈开态色并淡出（0.5s），给没有文案的开关补一个「这一下点到了」的反馈；波纹色取 <code>color</code> 语义色，不跟随
        <code>ui</code> 背景覆盖。默认关闭，开启后只是装饰，不影响取值与事件。
      </template>
      <DemoBlock class="items-center gap-8">
        <RebornSwitch v-model="waveValue" wave active-label="primary" />
        <RebornSwitch v-model="waveValue" wave color="success" active-label="success" />
        <RebornSwitch v-model="waveValue" wave type="round" color="secondary" active-label="secondary" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="取值与拦截">
      <template #description>
        <code>active-value</code> / <code>inactive-value</code> 可绑定任意类型；<code>before-change</code> 返回
        <code>false</code> 或 Promise 解析为 <code>false</code> 时取消本次切换。
      </template>
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            自定义取值 · 当前 <code class="text-primary font-mono">{{ customValue }}</code>
          </span>
          <RebornSwitch v-model="customValue" active-value="yes" inactive-value="no" active-label="Yes"
            inactive-label="No" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">拦截切换 · <code>before-change</code>（Promise + Confirm）</span>
          <RebornSwitch v-model="beforeChangeValue" :before-change="handleBeforeChange" active-label="需要确认" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="加载与插槽">
      <template #description>
        <code>loading</code> 期间锁定交互；<code>#thumb</code> 插槽（作用域 <code>{ checked, loading }</code>）可完全接管滑块内容。
      </template>
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">加载中 · <code>loading</code></span>
          <RebornSwitch v-model="loadingValue" active-label="加载中" loading />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">加载中 + 自定义加载图标</span>
          <RebornSwitch v-model="loadingValue" active-label="自定义 Loading 图标" loading>
            <template #thumb="{ loading }">
              <Icon v-if="loading" name="lucide:loader" class="text-primary size-full animate-spin p-0.5" />
            </template>
          </RebornSwitch>
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">状态图标 · <code>#active</code> / <code>#inactive</code> 插槽</span>
          <RebornSwitch v-model="iconValue" active-label="勾选 / 叉号" color="success">
            <template #active>
              <Icon name="lucide:check" class="size-3.5 text-success" />
            </template>
            <template #inactive>
              <Icon name="lucide:x" class="text-dimmed size-3.5" />
            </template>
          </RebornSwitch>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="样式定制">
      <template #description>
        <code>ui</code> 对象可覆写 <code>track</code> / <code>thumb</code>
        的原子类；选中位移按「右缘贴轨道右端收 2px」自动计算，自定义宽高无需改位移。
      </template>
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">方形轨道 · <code>ui.track</code> / <code>ui.thumb</code></span>
          <RebornSwitch v-model="styledValue" active-label="方形 UI"
            :ui="{ track: 'rounded-sm', thumb: 'rounded-sm' }" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">超大尺寸 · 设置滑块尺寸变量，位移自动适配</span>
          <RebornSwitch v-model="styledValue" active-label="自定义 XL"
            :ui="{ track: 'h-9 w-16', thumb: '[--re-switch-thumb-size:32px]' }" />
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
