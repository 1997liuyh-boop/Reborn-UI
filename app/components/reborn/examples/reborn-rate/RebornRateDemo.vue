<script setup lang="ts">
import {
  rateColors,
  rateSizes,
  rateTriggers,
} from "~/components/reborn/ui/reborn-rate/reborn-rate.config";
import RebornRate from "~/components/reborn/ui/reborn-rate/RebornRate.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场绑定值 */
const state = ref({
  size: "md",
  color: "warning",
  count: 5,
  trigger: "click",
  allowHalf: false,
  clearable: false,
  showValue: true,
  disabled: false,
  readonly: false,
});

const val1 = ref(3);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: rateSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "warning",
        props: { options: rateColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "数量",
        key: "count",
        component: "slider" as const,
        defaultValue: 5,
        props: { min: 1, max: 10, step: 1 },
      },
    ],
  },
  {
    title: "行为",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "click",
        props: { options: rateTriggers.map((t) => ({ label: t, value: t })) },
      },
      { label: "半星", key: "allowHalf", component: "checkbox" as const, defaultValue: false },
      { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: false },
      { label: "显示分数", key: "showValue", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "只读", key: "readonly", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 触发方式：click 悬停仅预览、点击提交；hover 悬停即改分 */
const clickScore = ref(3);
const hoverScore = ref(3);

/** 可清空：默认再点同一分值不变，clearable 才清零 */
const keepScore = ref(3);
const clearScore = ref(3);

/** 自定义文案：format-text 按当前分值返回要显示的文字，未评分时也能给出提示 */
const textScore = ref(3);
const slotScore = ref(4);
const levelTexts = ["很差", "较差", "还行", "推荐", "力荐"];
const formatText = (value: number) => levelTexts[Math.ceil(value) - 1] ?? "未评分";

/** 分段颜色：数组三段 / 对象自定义分段 */
const colorArrayScore = ref(2);
const colorMapScore = ref(4);
const segmentColors = ["#E47BF9", "#32EC95", "#1150D0"];
const segmentColorMap = { 2: "#99a9bf", 4: { value: "#f7ba2a", excluded: true }, 5: "#ff9900" };

/** 未选中颜色 */
const voidScore = ref(3);

/** 分段图标：按分值切换图标，高分段换成图片 */
const iconMapScore = ref(2);
const LOGO_URL = "https://mall.letaofun.com/static/h5/landingPage/logo.png?v=1";
const segmentIcons = {
  3: { type: "icon" as const, url: "lucide:frown" },
  6: { type: "icon" as const, url: "lucide:meh", excluded: true },
  8: { type: "image" as const, url: LOGO_URL },
};

/** 实例方法：非受控用法下 reset 会退回 modelValue */
const rateRef = ref<InstanceType<typeof RebornRate>>();
const lastChange = ref<number | null>(null);

/** 自定义图标：实心爱心走 icon / activeIcon 直接传图标名，火焰与点赞走 #icon 插槽 */
const heartScore = ref(4);
const flameScore = ref(3);
const thumbScore = ref(5);

/** 图片图标：未选中层由组件固定为 30% 不透明度，这里再按 active 加一层灰度拉开对比 */
const logoScore = ref(4);
const logoHalf = ref(2.5);

/** 横版图片：208×52 的品牌横标按 4:1 覆盖成 20×80，避免被默认的 20px 正方形图标层压扁 */
const BRAND_URL = "https://mall.letaofun.com/static/h5/site/MERCARI.png";
const brandScore = ref(3);
const brandHalf = ref(3.5);
const wideUi = { icon: "h-5 w-20", iconActive: "h-5 w-20" };
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornRate"
      title="交互演练场"
      description="调节尺寸、颜色与颗数，右侧评分实时响应；半星、可清空、禁用、只读可叠加。"
    >
      <RebornRate
        v-model="val1"
        :size="state.size"
        :color="state.color"
        :count="state.count"
        :trigger="state.trigger"
        :allow-half="state.allowHalf"
        :clearable="state.clearable"
        :show-value="state.showValue"
        :disabled="state.disabled"
        :readonly="state.readonly"
      />
    </Playground>

    <DemoSection title="触发方式">
      <template #description>
        默认 <code>click</code>：悬停只做预览，点击才提交；<code>trigger="hover"</code>
        让指针滑到哪颗就改到哪颗，适合快速打分。触控端没有悬停，该值等同 <code>click</code>。
      </template>
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">click</span>
          <RebornRate
            v-model="clickScore"
            show-value
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">hover</span>
          <RebornRate
            v-model="hoverScore"
            trigger="hover"
            allow-half
            show-value
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="可清空"
      description="默认再次点击当前分值不会有变化；开启 clearable 后再点同一分值即清零。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">默认</span>
          <RebornRate
            v-model="keepScore"
            show-value
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">clearable</span>
          <RebornRate
            v-model="clearScore"
            clearable
            show-value
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义文案"
      description="format-text 接收当前分值、返回要显示的文案，传入后无需 show-value；需要更复杂的内容可用 value 插槽自行渲染（会替换默认的文本节点）。不传时分数区域没有默认文案。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-20 text-xs">format-text</span>
          <RebornRate
            v-model="textScore"
            :format-text="formatText"
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-20 text-xs">#value 插槽</span>
          <RebornRate
            v-model="slotScore"
            allow-half
          >
            <template #value="{ value }">
              <span class="text-muted ml-3 text-sm">{{ value }} 分 · {{ formatText(value) }}</span>
            </template>
          </RebornRate>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="分段颜色">
      <template #description>
        <code>colors</code> 传数组时按 <code>low-threshold</code>（默认 2，含）与
        <code>high-threshold</code>（默认
        4，不含）分低、中、高三段；传对象时键为分段上界、值为颜色，写成
        <code>{ value, excluded: true }</code>
        表示不含上界本身。所有点亮的星统一取当前分值命中的颜色。
      </template>
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">数组</span>
          <RebornRate
            v-model="colorArrayScore"
            :colors="segmentColors"
            show-value
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">对象</span>
          <RebornRate
            v-model="colorMapScore"
            :colors="segmentColorMap"
            allow-half
            show-value
          />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        对象示例：<code>{ 2: '#99a9bf', 4: { value: '#f7ba2a', excluded: true }, 5: '#ff9900' }</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="未选中颜色"
      description="void-color 指定未选中图标的实色；不传时未选中图标取文字色的 30% 不透明度。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">实色</span>
          <RebornRate
            v-model="voidScore"
            void-color="#FF383F"
            show-value
          />
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">配分段色</span>
          <RebornRate
            v-model="voidScore"
            void-color="#000000"
            :colors="segmentColors"
            show-value
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="分段图标">
      <template #description>
        <code>icons</code> 的分段规则与 <code>colors</code> 相同，值为 <code>{ type, url }</code>：
        <code>type</code> 为 <code>icon</code> 时 <code>url</code> 是 Nuxt Icon 名，为
        <code>image</code> 时是图片地址。未选中图标仍由 <code>icon</code> 决定。
      </template>
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">对象</span>
          <RebornRate
            v-model="iconMapScore"
            :icons="segmentIcons"
            show-value
            :count="10"
          />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        低分段哭脸、中分段平脸、5 分换成图片：<code>{ 2: { type: 'icon', url: 'lucide:frown' }, 4: { type: 'icon', url: 'lucide:meh',
          excluded: true }, 5: { type: 'image', url: '.../logo.png' } }</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="实例方法"
      description="setCurrentValue 直接写入分数（按 count 夹取、按 allowHalf 取整，并触发 update:modelValue 与 change）；resetCurrentValue 清除悬停预览并把内部值同步回 modelValue。这里用非受控写法，重置后会退回传入的 3 分。"
    >
      <DemoBlock layout="stack">
        <RebornRate
          ref="rateRef"
          :model-value="3"
          allow-half
          show-value
          @change="lastChange = $event"
        />
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="border-default hover:border-inverted text-muted w-fit cursor-pointer rounded-xl border px-3 py-1 text-xs transition-colors"
            @click="rateRef?.setCurrentValue(4.5)"
          >
            setCurrentValue(4.5)
          </button>
          <button
            type="button"
            class="border-default hover:border-inverted text-muted w-fit cursor-pointer rounded-xl border px-3 py-1 text-xs transition-colors"
            @click="rateRef?.resetCurrentValue()"
          >
            resetCurrentValue()
          </button>
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        最近一次 change：<code>{{ lastChange ?? "尚未触发" }}</code>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义图标"
      description="icon 与 activeIcon 接受任意 Nuxt Icon 名，整套换图标时最省事；#icon 插槽拿到 index 与 active，可放任意内容。选中色都由 color 决定。"
    >
      <DemoBlock layout="stack">
        <!-- 直接传图标名：换成 prime 图标集的实心爱心 -->
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">实心爱心</span>
          <RebornRate
            v-model="heartScore"
            icon="prime:heart-fill"
            active-icon="prime:heart-fill"
            color="error"
            allow-half
            show-value
          />
        </div>
        <!-- 插槽写法：插槽内容同时用于未选中层与选中层 -->
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">火焰</span>
          <RebornRate
            v-model="flameScore"
            color="warning"
          >
            <template #icon>
              <Icon
                name="lucide:flame"
                class="size-full"
              />
            </template>
          </RebornRate>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">点赞</span>
          <RebornRate
            v-model="thumbScore"
            color="primary"
          >
            <template #icon>
              <Icon
                name="lucide:thumbs-up"
                class="size-full"
              />
            </template>
          </RebornRate>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        实心爱心取自 <code>prime</code> 图标集（<code>prime:heart-fill</code>）；icon 与 activeIcon
        通常传同一个名字，仅靠颜色区分选中态。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="图片图标"
      description="#icon 插槽同时渲染未选中层与选中层，用 active 区分：未选中的图片压成灰度，叠加组件自带的 30% 不透明度拉开对比；半星同样按 clip-path 只露出左半边。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">整星</span>
          <RebornRate
            v-model="logoScore"
            show-value
          >
            <template #icon="{ active }">
              <img
                :src="LOGO_URL"
                alt=""
                draggable="false"
                class="size-full object-contain"
                :class="{ grayscale: !active }"
              >
            </template>
          </RebornRate>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">半星</span>
          <RebornRate
            v-model="logoHalf"
            allow-half
            show-value
          >
            <template #icon="{ active }">
              <img
                :src="LOGO_URL"
                alt=""
                draggable="false"
                class="size-full object-contain"
                :class="{ grayscale: !active }"
              >
            </template>
          </RebornRate>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="横版图片"
      description="图标层默认是 20px 正方形，横版图片会被压扁；用 ui 的 icon 与 iconActive 按原图比例覆盖尺寸即可，星距与分数间距不受影响。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">整星</span>
          <RebornRate
            v-model="brandScore"
            :ui="wideUi"
            show-value
          >
            <template #icon="{ active }">
              <img
                :src="BRAND_URL"
                alt=""
                draggable="false"
                class="size-full object-contain"
                :class="{ grayscale: !active }"
              >
            </template>
          </RebornRate>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-16 text-xs">半星</span>
          <RebornRate
            v-model="brandHalf"
            :ui="wideUi"
            allow-half
            show-value
          >
            <template #icon="{ active }">
              <img
                :src="BRAND_URL"
                alt=""
                draggable="false"
                class="size-full object-contain"
                :class="{ grayscale: !active }"
              >
            </template>
          </RebornRate>
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        示例图原尺寸 208×52，按 4:1 覆盖成 <code>h-5 w-20</code>（20×80）。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="颜色"
      description="与全站语义色板对齐。"
    >
      <DemoBlock layout="stack">
        <RebornRate
          v-for="c in rateColors"
          :key="c"
          :model-value="3"
          :color="c"
          :size="state.size"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
