<script setup lang="ts">
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import type { SwitchProps } from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import { switchColors, switchSizes } from "~/components/reborn/ui/reborn-switch/reborn-switch.config";

const sizes = ref([...switchSizes]);
const colors = ref([...switchColors]);
const size = ref<SwitchProps["size"]>("md");
const color = ref<SwitchProps["color"]>("primary");

const onValue = ref(true);
const disabledValue = ref(true);

/** 自定义值示例：绑定值为 'yes' / 'no' 而非布尔 */
const customValue = ref("yes");

/** 拦截切换示例：返回 Promise<boolean>，resolve(false) 时回滚状态 */
const beforeChangeValue = ref(false);
const handleBeforeChange = () => {
  return new Promise<boolean>((resolve) => {
    // 模拟异步校验
    setTimeout(() => {
      const confirmed = window.confirm("确认切换状态吗？");
      resolve(confirmed);
    }, 500);
  });
};
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection title="全局配置" description="下方所有示例共享这组尺寸与配色参数。">
      <DemoBlock class="gap-6">
        <div class="flex items-center gap-2">
          <span class="text-muted text-xs font-medium">尺寸</span>
          <USelect v-model="size" :items="sizes" class="w-28" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted text-xs font-medium">配色</span>
          <USelect v-model="color" :items="colors" class="w-32" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="基础用法" description="activeLabel / inactiveLabel 分别渲染在开关两端；disabled 时不响应点击。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">双端标签 · <code>active-label</code> / <code>inactive-label</code></span>
          <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="开启" inactive-label="关闭" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">禁用状态 · <code>disabled</code></span>
          <RebornSwitch v-model="disabledValue" :size="size" :color="color" inactive-label="不可点击" disabled />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="取值与拦截" description="activeValue / inactiveValue 可绑定任意类型；beforeChange 返回 Promise 决定是否放行。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            自定义取值 · 当前 <code class="text-primary font-mono">{{ customValue }}</code>
          </span>
          <RebornSwitch v-model="customValue" :size="size" :color="color" active-value="yes" inactive-value="no"
            active-label="Yes" inactive-label="No" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">拦截切换 · <code>before-change</code>（Promise + Confirm）</span>
          <RebornSwitch v-model="beforeChangeValue" :size="size" :color="color" :before-change="handleBeforeChange"
            active-label="需要确认" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="加载与插槽" description="loading 期间锁定交互；#thumb 插槽可完全接管滑块内容。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">加载中 · <code>loading</code></span>
          <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="加载中" loading />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">加载中 + 自定义滑块图标</span>
          <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="自定义 Loading 图标" loading>
            <template #thumb="{ loading }">
              <Icon v-if="loading" name="lucide:loader" class="text-primary size-full animate-spin p-0.5" />
            </template>
          </RebornSwitch>
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">滑块图标 · <code>#thumb</code> 插槽</span>
          <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="勾选 / 叉号"
            :ui="{ track: 'bg-accented peer-checked:bg-success' }">
            <template #thumb="{ checked }">
              <Icon :name="checked ? 'lucide:check' : 'lucide:x'" class="size-3.5 transition-colors"
                :class="checked ? 'text-success' : 'text-dimmed'" />
            </template>
          </RebornSwitch>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="样式定制" description="ui 对象可直接覆写 track / thumb 的原子类，改写圆角与尺寸。">
      <DemoBlock layout="grid" align="start" class="lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">方形轨道 · <code>ui.track</code> / <code>ui.thumb</code></span>
          <RebornSwitch v-model="onValue" :size="size" :color="color" active-label="方形 UI"
            :ui="{ track: 'rounded-ui-2xs', thumb: 'rounded-ui-2xs' }" />
        </div>
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">超大尺寸 · 直接覆写宽高与位移</span>
          <RebornSwitch v-model="onValue" :color="color" active-label="自定义 XL"
            :ui="{ track: 'h-8 w-14 peer-checked:[&>span]:translate-x-6', thumb: 'size-7' }" />
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
