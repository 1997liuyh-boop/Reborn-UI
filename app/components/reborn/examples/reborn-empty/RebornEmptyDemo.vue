<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import RebornEmpty from "~/components/reborn/ui/reborn-empty/RebornEmpty.vue"

/**
 * 三张示例插画都放在 public/images/empty 下，尺寸各不相同：
 * 箱子是 48×48 的单色图标，文件堆是 120×88 的小插画，大场景是 320×253 的整幅插画。
 */
const ARTWORK = {
  box: "/images/empty/empty-box.svg",
  folder: "/images/empty/empty-folder.svg",
  scene: "/images/empty/empty-scene.svg",
};

/** 演练场的图片下拉项，空串代表走内置默认插画 */
const imageOptions = [
  { label: "内置默认插画（48×48）", value: "" },
  { label: "empty-box.svg（48×48）", value: ARTWORK.box },
  { label: "empty-folder.svg（120×88）", value: ARTWORK.folder },
  { label: "empty-scene.svg（320×253）", value: ARTWORK.scene },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  image: ARTWORK.folder,
  imageSize: 120,
  title: "暂无数据",
  description: "调整筛选条件后重新查询，或者先创建一条记录。",
  showImage: true,
  showExtra: true,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 操作区点击回显，让预览区的交互「有回应」 */
const lastAction = ref("");
function onAction(name: string) {
  lastAction.value = name;
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  lastAction.value = "";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "图片地址",
        key: "image",
        component: "select" as const,
        defaultValue: ARTWORK.folder,
        props: { options: imageOptions },
      },
      {
        label: "图片宽度 image-size（px）",
        key: "imageSize",
        component: "slider" as const,
        defaultValue: 120,
        props: { min: 32, max: 320, step: 8 },
      },
      { label: "标题", key: "title", component: "input" as const, defaultValue: "暂无数据" },
      {
        label: "描述",
        key: "description",
        component: "input" as const,
        defaultValue: "调整筛选条件后重新查询，或者先创建一条记录。",
      },
    ],
  },
  {
    title: "结构",
    children: [
      {
        label: "渲染图片区（关闭等于 :image=\"null\"）",
        key: "showImage",
        component: "checkbox" as const,
        defaultValue: true,
        codeIgnore: true,
      },
      {
        label: "渲染操作区（extra 插槽）",
        key: "showExtra",
        component: "checkbox" as const,
        defaultValue: true,
        codeIgnore: true,
      },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数，插槽用 template 占位 */
const emptyCode = computed(() => {
  const s = state.value;
  const attrs = [
    s.showImage ? (s.image ? `image="${s.image}"` : "") : ":image=\"null\"",
    s.showImage ? `:image-size="${s.imageSize}"` : "",
    `title="${s.title}"`,
    `description="${s.description}"`,
  ].filter(Boolean).join("\n  ");
  if (!s.showExtra) return `<RebornEmpty\n  ${attrs}\n/>`;
  return [
    `<RebornEmpty`,
    `  ${attrs}`,
    `>`,
    `  <template #extra>`,
    `    <RebornButton color="neutral" variant="outlined" size="md">重置筛选</RebornButton>`,
    `    <RebornButton color="primary" variant="filled" size="md">新建记录</RebornButton>`,
    `  </template>`,
    `</RebornEmpty>`,
  ].join("\n");
});
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="emptyCode" component-name="RebornEmpty"
      title="交互演练场" description="调节左侧参数，观察图片、标题描述、操作区三段在不同插画与缺省组合下的排布。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-8">
        <RebornEmpty
          :image="state.showImage ? state.image : null" :image-size="state.imageSize"
          :title="state.title" :description="state.description"
        >
          <template v-if="state.showExtra" #extra>
            <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('重置筛选')">重置筛选</RebornButton>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('新建记录')">新建记录</RebornButton>
          </template>
        </RebornEmpty>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          最近点击：{{ lastAction || "（无）" }}；组件本身不派发事件，回显来自 extra 插槽里按钮自己的 click。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="内置插画与图片尺寸">
      <template #description>
        不传 <code>image</code> 时用内置的 48×48 灰色空箱子，它以 base64 内联在配置文件里，复制组件到别的工程不用带资源。
        <code>image-size</code> 只设宽度，高度按原图比例自适应；数字按 px 处理，也可以直接写 <code>'6rem'</code> 之类的 CSS 长度。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">默认（48px）</DemoNote>
          <RebornEmpty title="暂无数据" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">:image-size="80"</DemoNote>
          <RebornEmpty :image-size="80" title="暂无数据" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">image-size="8rem"</DemoNote>
          <RebornEmpty image-size="8rem" title="暂无数据" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="换一张插画">
      <template #description>
        <code>image</code> 收任意图片地址：站内路径、CDN 链接或 data URI 都行。
        下面三张是随组件附带的示例插画，放在 <code>public/images/empty/</code>，UniApp 端同名放在 <code>static/empty/</code>。
        画幅越大越要显式给 <code>image-size</code>，否则宽度会停在默认的 48px。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">empty-box.svg</DemoNote>
          <RebornEmpty :image="ARTWORK.box" :image-size="48" title="暂无数据" description="列表里还没有任何记录。" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">empty-folder.svg</DemoNote>
          <RebornEmpty :image="ARTWORK.folder" :image-size="120" title="暂无文件" description="把文件拖进来，或者点下方按钮上传。" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">empty-scene.svg</DemoNote>
          <RebornEmpty :image="ARTWORK.scene" :image-size="240" title="这里空空如也" description="整幅插画适合放在占满一屏的空页面里。" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义图片与隐藏图片区">
      <template #description>
        <code>image</code> 插槽接管整个图片区，里面可以放图标、动效或任意节点，此时 <code>image</code> / <code>image-size</code> 都不再生效。
        <code>:image="null"</code> 则把整段去掉，连同它下面的 24px 间距一起消失。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">#image</DemoNote>
          <RebornEmpty title="搜索无结果" description="换个关键词再试一次。">
            <template #image>
              <div class="flex size-18 items-center justify-center rounded-full bg-gray-2">
                <Icon name="lucide:search-x" class="size-8 shrink-0 text-gray-5" />
              </div>
            </template>
          </RebornEmpty>
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">#image（动效）</DemoNote>
          <RebornEmpty title="正在加载" description="数据还没回来，请稍候。">
            <template #image>
              <Icon name="lucide:loader-circle" class="text-primary size-12 animate-spin" />
            </template>
          </RebornEmpty>
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">:image="null"</DemoNote>
          <RebornEmpty :image="null" title="暂无评论" description="成为第一个留言的人。" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与描述">
      <template #description>
        <code>title</code> 固定 14px / 500 字重，<code>description</code> 固定 14px / 常规字重，两者相差的是字重与颜色而非字号，之间留 4px。
        两个 prop 都只收纯文本；要放链接、行内代码或多行排版，改用同名的 <code>title</code> / <code>description</code> 插槽，插槽存在时对应的 prop 不再渲染。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-2">
        <RebornEmpty :image-size="80" title="没有匹配的订单">
          <template #description>
            <span>当前筛选：<code class="text-default rounded-sm bg-gray-2 px-1 py-0.5 font-mono text-xs">状态=已退款</code></span>
            <br>
            <a href="#" class="text-primary underline underline-offset-2">清空全部筛选条件</a>
          </template>
        </RebornEmpty>

        <RebornEmpty :image-size="80" description="配额用完后新任务会排队等待下个周期。">
          <template #title>
            <span>本月配额已用尽</span>
            <span class="text-warning ml-2 align-middle font-normal">0 / 500</span>
          </template>
        </RebornEmpty>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="操作区">
      <template #description>
        <code>extra</code> 插槽是第三段，横向排列、超宽自动换行、按钮间距 12px。
        组件不派发任何事件，所有交互由放进插槽的元素自己承担。
        两个按钮时按「次要动作在左、主要动作在右」排：左侧 <code>neutral</code> + <code>outlined</code>，右侧 <code>primary</code> + <code>filled</code>，都用 <code>size="md"</code>。
      </template>
      <DemoBlock layout="stack" class="gap-10">
        <RebornEmpty :image="ARTWORK.folder" :image-size="120" title="还没有上传文件" description="支持 PDF、PNG、JPG，单个文件不超过 20 MB。">
          <template #extra>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('上传文件')">上传文件</RebornButton>
          </template>
        </RebornEmpty>

        <RebornEmpty :image-size="80" title="没有符合条件的结果" description="三个筛选条件同时生效，可能过滤得太紧了。">
          <template #extra>
            <RebornButton color="neutral" variant="text" size="md" @click="onAction('查看全部')">查看全部</RebornButton>
            <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('重置筛选')">重置筛选</RebornButton>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('新建记录')">新建记录</RebornButton>
          </template>
        </RebornEmpty>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="缺省段与间距">
      <template #description>
        三段（图片 / 标题加描述 / 操作区）都按需渲染：某一段没内容就不进 DOM，
        所以段间的 24px 间距不会因为空段变成 48px。标题与描述同属第二段，它俩之间固定 4px。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">仅图片</DemoNote>
          <RebornEmpty :image-size="80" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">仅标题</DemoNote>
          <RebornEmpty :image="null" title="没有更多内容了" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">三段齐全</DemoNote>
          <RebornEmpty :image-size="80" title="暂无数据" description="换个条件再查。">
            <template #extra>
              <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('刷新')">刷新</RebornButton>
            </template>
          </RebornEmpty>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
