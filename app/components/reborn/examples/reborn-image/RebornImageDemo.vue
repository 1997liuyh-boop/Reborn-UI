<script setup lang="ts">
import { DemoBlock, DemoItem, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { imageMode, previewToolbarTokens } from "~/components/reborn/ui/reborn-image/reborn-image.config";
import RebornImage from "~/components/reborn/ui/reborn-image/RebornImage.vue";

/**
 * 演示素材，都取站内图片，不依赖外部图床：
 * - 横图 2400×1600、不透明，原图够大，放大镜和 1:1 预览才看得出细节，圆角也看得见；
 * - 竖图 720×840、透明底、主体是人物，裁剪模式里的拉伸变形与裁切一眼能看出来；
 * - 失败示例指向站内一个不存在的路径，404 立即返回，不用等外部域名超时。
 */
const LANDSCAPE = "/images/lithos/strata.webp";
const LANDSCAPE_ALT = "/images/lithos/living-strata.webp";
const PORTRAIT = "/images/depth-image/soldier.webp";
/** 200×200 的二维码：四角定位块明显，用来看方位类 mode 露出的是原图哪一块 */
const QR_CODE = "https://cms-image.leyifan.cn/img_reborn/ques-4.jpg";
const BROKEN = "/images/reborn-image/not-found.webp";

/**
 * 给裁剪模式的示例画出容器范围。竖图是透明底，不画框就看不出 aspectFit 留空了多少、aspectFill 裁掉了哪里；
 * 这只是演示辅助，不是组件默认样式，所以不写进演练场的传参明细。
 */
const BOX_OUTLINE = { root: "border border-dashed border-gray-4" };

/** 多图预览列表 */
const previewList = [LANDSCAPE, LANDSCAPE_ALT, PORTRAIT];

/** 方位类 mode 不缩放原图，取两个对角加居中做对照 */
const positionModes = ["top left", "center", "bottom right"] as const;

const modeOptions = imageMode.map((m) => ({ label: m, value: m }));
const roundedOptions = [
  { label: "无圆角（默认）", value: "" },
  { label: "rounded-lg", value: "rounded-lg" },
  { label: "rounded-xl", value: "rounded-xl" },
  { label: "rounded-full", value: "rounded-full" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/**
 * 演练场默认状态。尺寸取 320 × 200 的扁框而不是组件默认的 120 × 120：
 * 竖图放进扁框，切换 mode 时拉伸、留空、裁切的差别最明显；preview 默认打开，单击图片就能看预览。
 */
const defaultState: Record<string, any> = {
  mode: "aspectFill",
  width: 320,
  height: 200,
  rounded: "",
  showLoading: true,
  preview: true,
  multiple: false,
  previewNavbar: false,
  previewToolbar: "fullscreen, rotateRight, rotateLeft, zoomIn, zoomOut, oneToOne",
  magnifier: false,
  magnifierZoom: 2,
  magnifierSize: 100,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场实例的事件回显 */
const lastEvent = ref("等待加载");

/** load 事件回显原图尺寸：mode 的效果取决于原图与容器的宽高比 */
function onPlaygroundLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  lastEvent.value = `load：原图 ${img.naturalWidth} × ${img.naturalHeight}`;
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "裁剪模式（mode）", key: "mode", component: "select" as const, defaultValue: "aspectFill", props: { options: modeOptions } },
      { label: "宽度（px）", key: "width", component: "slider" as const, defaultValue: 320, props: { min: 80, max: 400, step: 20 } },
      { label: "高度（px）", key: "height", component: "slider" as const, defaultValue: 200, props: { min: 80, max: 400, step: 20 } },
      { label: "圆角（custom-class）", key: "rounded", component: "select" as const, defaultValue: "", props: { options: roundedOptions } },
      { label: "显示加载占位", key: "showLoading", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "预览",
    children: [
      { label: "单击预览", key: "preview", component: "checkbox" as const, defaultValue: true },
      {
        label: "多图预览（传 preview-list）",
        key: "multiple",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => !s.preview,
      },
      {
        label: "缩略图列表（多图时生效）",
        key: "previewNavbar",
        component: "checkbox" as const,
        defaultValue: false,
        hide: (_: boolean, s: Record<string, any>) => !s.preview || !s.multiple,
      },
      {
        label: "菜单按钮（逗号分隔，留空不显示菜单）",
        key: "previewToolbar",
        component: "input" as const,
        defaultValue: defaultState.previewToolbar,
        hide: (_: string, s: Record<string, any>) => !s.preview,
      },
    ],
  },
  {
    title: "放大镜",
    children: [
      { label: "悬停放大（视口 ≥ 1024px 生效）", key: "magnifier", component: "checkbox" as const, defaultValue: false },
      {
        label: "放大倍率",
        key: "magnifierZoom",
        component: "slider" as const,
        defaultValue: 2,
        props: { min: 1.5, max: 5, step: 0.5 },
        hide: (_: number, s: Record<string, any>) => !s.magnifier,
      },
      {
        label: "透镜尺寸（px）",
        key: "magnifierSize",
        component: "slider" as const,
        defaultValue: 100,
        props: { min: 40, max: 160, step: 10 },
        hide: (_: number, s: Record<string, any>) => !s.magnifier,
      },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前全部参数（含默认值） */
const imageCode = computed(() => {
  const s = state.value;
  const lines = [
    `src="${PORTRAIT}"`,
    `mode="${s.mode}"`,
    `:width="${s.width}"`,
    `:height="${s.height}"`,
  ];
  if (s.rounded) lines.push(`custom-class="${s.rounded}"`);
  lines.push(`:show-loading="${s.showLoading}"`, `:preview="${s.preview}"`);
  if (s.preview) {
    if (s.multiple) lines.push(":preview-list=\"previewList\"", `:preview-navbar="${s.previewNavbar}"`);
    lines.push(`preview-toolbar="${s.previewToolbar}"`);
  }
  lines.push(`:magnifier="${s.magnifier}"`);
  if (s.magnifier) lines.push(`:magnifier-zoom="${s.magnifierZoom}"`, `:magnifier-size="${s.magnifierSize}"`);
  return `<RebornImage\n  ${lines.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 「加载与失败」里失败实例的 error 事件回显 */
const errorEcho = ref("等待加载");

/** 「懒加载」的图片，以及各自是否已触发 load */
const lazyImages = [LANDSCAPE, PORTRAIT, LANDSCAPE_ALT, QR_CODE];
const lazyLoaded = ref<boolean[]>(lazyImages.map(() => false));
const lazyLoadedCount = computed(() => lazyLoaded.value.filter(Boolean).length);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state" :controls="controls" :code="imageCode" component-name="RebornImage"
      title="交互演练场" description="调节左侧参数，查看裁剪模式、尺寸与圆角的效果；单击图片打开预览，开启放大镜后悬停查看局部。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-6">
        <RebornImage
          :src="PORTRAIT" :mode="state.mode" :width="state.width" :height="state.height"
          :custom-class="state.rounded" :show-loading="state.showLoading" :preview="state.preview"
          :preview-list="state.multiple ? previewList : undefined" :preview-navbar="state.previewNavbar"
          :preview-toolbar="state.previewToolbar" :magnifier="state.magnifier" :magnifier-zoom="state.magnifierZoom"
          :magnifier-size="state.magnifierSize" :ui="BOX_OUTLINE" @load="onPlaygroundLoad"
          @error="lastEvent = 'error：图片加载失败'"
        />

        <DemoNote tone="dimmed" class="text-center text-xs">
          <span class="font-mono">{{ lastEvent }}</span>；虚线框是容器范围，只为对比 mode 而加，不在传参明细里
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <template #description>
        <code>width</code> / <code>height</code> 传数字按 px 处理，传字符串原样透传，可写 rem、%、vw 等任意 CSS 长度；不传时为 120 × 120。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <DemoItem label="默认 120 × 120">
          <RebornImage :src="LANDSCAPE" />
        </DemoItem>
        <DemoItem label=":width=&quot;200&quot; :height=&quot;160&quot;" mono>
          <RebornImage :src="LANDSCAPE" :width="200" :height="160" />
        </DemoItem>
        <DemoItem label="width=&quot;12rem&quot; height=&quot;8rem&quot;" mono>
          <RebornImage :src="LANDSCAPE" width="12rem" height="8rem" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="裁剪模式">
      <template #description>
        <code>mode</code> 决定原图怎样放进容器，默认 <code>aspectFill</code>。下面把 720 × 840 的竖图放进扁的横框，宽高比差得越多，几种取值的区别越明显；虚线框是容器范围。
      </template>
      <DemoBlock layout="stack" class="gap-10">
        <DemoBlock layout="grid" :columns="3">
          <DemoItem label="scaleToFill" mono note="拉伸铺满，不保持宽高比，人物被压扁">
            <RebornImage :src="PORTRAIT" mode="scaleToFill" :width="200" :height="120" :ui="BOX_OUTLINE" />
          </DemoItem>
          <DemoItem label="aspectFit" mono note="完整显示原图，容器多出来的部分留空">
            <RebornImage :src="PORTRAIT" mode="aspectFit" :width="200" :height="120" :ui="BOX_OUTLINE" />
          </DemoItem>
          <DemoItem label="aspectFill（默认）" mono note="铺满容器，超出的部分裁掉，取中间">
            <RebornImage :src="PORTRAIT" mode="aspectFill" :width="200" :height="120" :ui="BOX_OUTLINE" />
          </DemoItem>
        </DemoBlock>

        <div class="flex flex-col gap-4">
          <DemoBlock layout="row" align="start" class="gap-8">
            <DemoItem label="widthFix + height=&quot;auto&quot;" mono note="宽度固定 120，高度按原图比例算出">
              <RebornImage :src="PORTRAIT" mode="widthFix" :width="120" height="auto" :ui="BOX_OUTLINE" />
            </DemoItem>
            <DemoItem label="heightFix + width=&quot;auto&quot;" mono note="高度固定 120，宽度按原图比例算出">
              <RebornImage :src="PORTRAIT" mode="heightFix" width="auto" :height="120" :ui="BOX_OUTLINE" />
            </DemoItem>
          </DemoBlock>
          <DemoNote tone="dimmed">
            widthFix / heightFix 要把另一边设为 <code>auto</code>：组件给根节点写了固定宽高，不放开的话根节点不会随原图比例伸缩，效果和 aspectFit / aspectFill 没有区别。
          </DemoNote>
        </div>

        <div class="flex flex-col gap-4">
          <DemoBlock layout="grid" :columns="3">
            <DemoItem v-for="m in positionModes" :key="m" :label="m" mono>
              <RebornImage :src="QR_CODE" :mode="m" :width="120" :height="120" />
            </DemoItem>
          </DemoBlock>
          <DemoNote tone="dimmed">
            方位类取值（top、bottom left 等 9 个）不缩放原图，只决定露出原图的哪一块：上面把 200 × 200 的二维码放进 120 × 120 的容器，三个实例露出的定位角各不相同。原图远大于容器时只能看到一小块，这类取值适合原图与容器尺寸接近的场景。
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="圆角">
      <template #description>
        组件默认不带圆角，与 uniapp 端一致；需要时用 <code>custom-class</code> 或 <code>ui.root</code> 加。根节点自带 <code>overflow-hidden</code>，加载与失败占位也跟着一起变圆。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <DemoItem label="默认" mono>
          <RebornImage :src="LANDSCAPE" />
        </DemoItem>
        <DemoItem label="rounded-lg" mono>
          <RebornImage :src="LANDSCAPE" custom-class="rounded-lg" />
        </DemoItem>
        <DemoItem label="rounded-xl" mono>
          <RebornImage :src="LANDSCAPE" custom-class="rounded-xl" />
        </DemoItem>
        <DemoItem label="rounded-full" mono>
          <RebornImage :src="LANDSCAPE" custom-class="rounded-full" />
        </DemoItem>
        <DemoItem label="失败占位 + rounded-xl" mono>
          <RebornImage :src="BROKEN" custom-class="rounded-xl" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="加载与失败">
      <template #description>
        图片加载期间显示灰底转圈占位；加载失败先自动重试 2 次，仍失败才显示失败占位并触发 <code>error</code>。<code>show-loading</code> 为 <code>false</code> 时加载期间不渲染占位。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <DemoItem label="加载中（src 为空）" note="空地址不算失败，会一直停在加载占位；懒加载尚未触发时就是这个状态">
          <RebornImage src="" :width="160" :height="160" />
        </DemoItem>
        <DemoItem label="加载失败" :note="errorEcho">
          <RebornImage :src="BROKEN" :width="160" :height="160" @error="errorEcho = 'error 已触发：重试 2 次后仍失败'" />
        </DemoItem>
        <DemoItem label=":show-loading=&quot;false&quot;" mono note="加载期间不渲染占位；虚线框只是为了标出图片区域">
          <RebornImage src="" :width="160" :height="160" :show-loading="false" :ui="BOX_OUTLINE" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义占位">
      <template #description>
        <code>loading</code> / <code>error</code> 插槽替换占位里的内容，灰底容器仍在；只想改图标大小、颜色时用 <code>ui.loadingIcon</code> / <code>ui.errorIcon</code>，填了插槽这两个键就不再生效。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <DemoItem label="#loading 插槽">
          <RebornImage src="" :width="160" :height="160">
            <template #loading>
              <Icon name="svg-spinners:3-dots-fade" class="text-primary size-8" />
              <span class="text-dimmed mt-2 text-xs">图片加载中</span>
            </template>
          </RebornImage>
        </DemoItem>
        <DemoItem label="#error 插槽">
          <RebornImage :src="BROKEN" :width="160" :height="160">
            <template #error>
              <Icon name="lucide:image-off" class="text-gray-5 size-8" />
              <span class="text-dimmed mt-2 text-xs">图片已失效</span>
            </template>
          </RebornImage>
        </DemoItem>
        <DemoItem label="ui.errorIcon" mono>
          <RebornImage :src="BROKEN" :width="160" :height="160" :ui="{ errorIcon: 'size-12 text-error' }" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="叠加内容">
      <template #description>
        默认插槽渲染在图片之上，适合角标、标题条这类叠加层。根节点是 <code>relative</code>，插槽内容用绝对定位贴边即可。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <RebornImage :src="LANDSCAPE" :width="240" :height="160" custom-class="rounded-lg">
          <span class="bg-error absolute top-2 left-2 rounded px-1.5 py-0.5 text-xs font-medium text-white">新品</span>
        </RebornImage>
        <RebornImage :src="PORTRAIT" :width="160" :height="160" custom-class="rounded-lg">
          <div class="absolute inset-x-0 bottom-0 bg-black/50 px-3 py-1.5 text-xs text-white">装甲士兵 · 720 × 840</div>
        </RebornImage>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="懒加载">
      <template #description>
        开启 <code>lazy-load</code> 后，图片进入视口前 200px 才开始请求，此前停在加载占位。在下面的框里向下滚动，图片会逐张开始加载。
      </template>
      <DemoBlock layout="stack" tone="inset">
        <div class="h-64 w-full overflow-y-auto">
          <div class="text-dimmed flex h-72 items-center justify-center text-xs">↓ 向下滚动</div>
          <div class="flex flex-wrap gap-4 pb-4">
            <RebornImage
              v-for="(src, i) in lazyImages" :key="src" :src="src" :width="140" :height="140" lazy-load
              custom-class="rounded-lg" @load="lazyLoaded[i] = true"
            />
          </div>
        </div>
        <DemoNote tone="dimmed">
          已加载 {{ lazyLoadedCount }} / {{ lazyImages.length }} 张。放在内部滚动容器里时，200px 的提前量只对窗口生效，图片要真正露出滚动容器才会开始请求。
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="预览">
      <template #description>
        <code>preview</code> 开启单击预览；传了 <code>preview-list</code> 时可在多图间切换：遮罩两侧有切换箭头，键盘左右键也可以切换。当前图不在列表里时会排到第一张。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <DemoItem label="单图">
          <RebornImage :src="LANDSCAPE" preview custom-class="rounded-lg" />
        </DemoItem>
        <DemoItem label="多图（3 张）">
          <RebornImage :src="LANDSCAPE" preview :preview-list="previewList" custom-class="rounded-lg" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="预览菜单">
      <template #description>
        <code>preview-toolbar</code> 按书写顺序决定菜单里出现哪些按钮，写法同分页的 <code>layout</code>，不认识的写法会被忽略；传空字符串不显示菜单，滚轮缩放、拖拽与键盘操作仍然可用。
      </template>
      <DemoBlock layout="grid" :columns="3">
        <DemoItem label="只留缩放" note="zoomIn, zoomOut, oneToOne">
          <RebornImage :src="LANDSCAPE" preview preview-toolbar="zoomIn, zoomOut, oneToOne" custom-class="rounded-lg" />
        </DemoItem>
        <DemoItem label="全部 11 个按钮" note="含 reset、prev / next 与两个翻转">
          <RebornImage
            :src="LANDSCAPE" preview :preview-list="previewList" :preview-toolbar="previewToolbarTokens.join(', ')"
            custom-class="rounded-lg"
          />
        </DemoItem>
        <DemoItem label="不显示菜单" note="preview-toolbar=&quot;&quot;">
          <RebornImage :src="LANDSCAPE" preview preview-toolbar="" custom-class="rounded-lg" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="缩略图列表">
      <template #description>
        <code>preview-navbar</code> 控制多图预览时底部是否显示缩略图列表，默认不显示；点缩略图可直接跳到对应图片。单图时开了也不显示。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <DemoItem label="默认（不显示）">
          <RebornImage :src="LANDSCAPE" preview :preview-list="previewList" custom-class="rounded-lg" />
        </DemoItem>
        <DemoItem label="preview-navbar" mono>
          <RebornImage :src="LANDSCAPE" preview :preview-list="previewList" preview-navbar custom-class="rounded-lg" />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="放大镜">
      <template #description>
        <code>magnifier</code> 开启悬停放大，商品详情页常用：透镜在原图上跟随指针，放大后的局部显示在原图右侧。视口窄于 1024px 时不启用，单击改为打开预览。
      </template>
      <DemoBlock layout="row" align="start" class="gap-8">
        <DemoItem label="默认" note="透镜 100px、2 倍">
          <RebornImage :src="LANDSCAPE" magnifier :width="200" :height="200" />
        </DemoItem>
        <DemoItem label="小透镜高倍率" note=":magnifier-size=&quot;40&quot; :magnifier-zoom=&quot;5&quot;">
          <RebornImage :src="LANDSCAPE" magnifier :magnifier-size="40" :magnifier-zoom="5" :width="200" :height="200" />
        </DemoItem>
        <DemoItem label="自定义预览窗" note="150 × 300，不传时与原图同大">
          <RebornImage
            :src="LANDSCAPE" magnifier :magnifier-size="60" :magnifier-zoom="1.5" :magnifier-width="150"
            :magnifier-height="300" :width="200" :height="200"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
