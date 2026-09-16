<script setup lang="ts">
import { ref } from 'vue'
import ReButton from '@/components/reborn-button/RebornButton.vue'
import RebornCard from '@/components/reborn-card/RebornCard.vue'
import RebornEmpty from '@/components/reborn-empty/RebornEmpty.vue'
import RebornInput from '@/components/reborn-input/RebornInput.vue'
import RebornPage from '@/components/reborn-page/RebornPage.vue'
import RebornSwitch from '@/components/reborn-switch/RebornSwitch.vue'

/**
 * 三张示例插画都放在 src/static/empty 下，尺寸各不相同：
 * 箱子是 48×48 的单色图标，文件堆是 120×88 的小插画，大场景是 320×253 的整幅插画。
 */
const ARTWORK = {
  box: '/static/empty/empty-box.svg',
  folder: '/static/empty/empty-folder.svg',
  scene: '/static/empty/empty-scene.svg',
}

/** 演练场的图片可选项，空串代表走内置默认插画 */
const IMAGE_OPTIONS = [
  { label: '内置', value: '' },
  { label: 'box', value: ARTWORK.box },
  { label: 'folder', value: ARTWORK.folder },
  { label: 'scene', value: ARTWORK.scene },
]

// ─── 演练场状态（默认值与 Web 端 Playground 一致） ───────────────

const currentImage = ref<string>(ARTWORK.folder)
const imageSize = ref(240)
const title = ref('暂无数据')
const description = ref('调整筛选条件后重新查询，或者先创建一条记录。')
const showImage = ref(true)
const showExtra = ref(true)

/** 操作区点击回显，让预览「有回应」 */
const lastAction = ref('')
function onAction(name: string) {
  lastAction.value = name
}
</script>

<template>
  <RebornPage
    title="空状态"
    description="列表、搜索、筛选没有结果时的占位块：图片、标题与描述、操作区三段纵向居中排布。"
    custom-class="flex flex-col gap-y-4"
  >
    <!-- 演练场 -->
    <RebornCard title="自定义" custom-class="space-y-4">
      <RebornEmpty
        :image="showImage ? currentImage : null" :image-size="imageSize"
        :title="title" :description="description"
      >
        <template v-if="showExtra" #extra>
          <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('重置筛选')">
            重置筛选
          </ReButton>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('新建记录')">
            新建记录
          </ReButton>
        </template>
      </RebornEmpty>

      <text class="text-24 text-gray-6">最近点击：{{ lastAction || '（无）' }}；组件不派发事件，回显来自插槽里按钮自己的 tap。</text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">图片地址 (image)</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="opt in IMAGE_OPTIONS" :key="opt.label">
            <ReButton
              size="xs" :variant="currentImage === opt.value ? 'filled' : 'outlined'"
              :color="currentImage === opt.value ? 'primary' : 'neutral'" @tap="currentImage = opt.value"
            >
              {{ opt.label }}
            </ReButton>
          </view>
        </view>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">图片宽度 (image-size)，单位 rpx</text>
        <view class="flex flex-wrap gap-2">
          <view v-for="s in [96, 160, 240, 400]" :key="s">
            <ReButton
              size="xs" :variant="imageSize === s ? 'filled' : 'outlined'"
              :color="imageSize === s ? 'primary' : 'neutral'" @tap="imageSize = s"
            >
              {{ s }}
            </ReButton>
          </view>
        </view>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">标题 (title)</text>
        <RebornInput v-model="title" placeholder="留空则不渲染标题" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6">描述 (description)</text>
        <RebornInput v-model="description" placeholder="留空则不渲染描述" />
      </view>

      <view class="grid grid-cols-2 gap-2">
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-6">图片区（关闭即 :image="null"）</text>
          <RebornSwitch v-model="showImage" active-label="渲染" inactive-label="不渲染" />
        </view>
        <view class="flex flex-col gap-2">
          <text class="text-24 text-gray-6">操作区（extra 插槽）</text>
          <RebornSwitch v-model="showExtra" active-label="渲染" inactive-label="不渲染" />
        </view>
      </view>
    </RebornCard>

    <!-- 内置插画与图片尺寸 -->
    <RebornCard title="内置插画与图片尺寸" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        不传 image 时用内置的 48×48 灰色空箱子，它以 base64 内联在配置文件里，复制组件到别的工程不用带资源。
        image-size 只设宽度，高度按原图比例自适应；数字按 rpx 处理，也可以直接写 '80px' 之类的 CSS 长度。
      </text>

      <view v-for="s in [96, 160, 240]" :key="s" class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">:image-size="{{ s }}"</text>
        <RebornEmpty :image-size="s" title="暂无数据" />
      </view>
    </RebornCard>

    <!-- 换一张插画 -->
    <RebornCard title="换一张插画" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        image 收任意图片地址：/static 路径、网络链接或 data URI 都行。下面三张是随组件附带的示例插画，放在 src/static/empty/。
        画幅越大越要显式给 image-size，否则宽度会停在默认的 96rpx。
      </text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">empty-box.svg</text>
        <RebornEmpty :image="ARTWORK.box" :image-size="96" title="暂无数据" description="列表里还没有任何记录。" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">empty-folder.svg</text>
        <RebornEmpty :image="ARTWORK.folder" :image-size="240" title="暂无文件" description="把文件传上来，或者点下方按钮上传。" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">empty-scene.svg</text>
        <RebornEmpty :image="ARTWORK.scene" :image-size="480" title="这里空空如也" description="整幅插画适合放在占满一屏的空页面里。" />
      </view>
    </RebornCard>

    <!-- 自定义图片与隐藏图片区 -->
    <RebornCard title="自定义图片与隐藏图片区" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        image 插槽接管整个图片区，里面可以放图标、动效或任意节点，此时 image / image-size 都不再生效。
        :image="null" 则把整段去掉，连同它下面的 48rpx 间距一起消失。
      </text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">#image</text>
        <RebornEmpty title="搜索无结果" description="换个关键词再试一次。">
          <template #image>
            <view class="flex size-[144rpx] items-center justify-center rounded-full bg-gray-2">
              <view class="i-lucide-search-x size-[64rpx] shrink-0 text-gray-5" />
            </view>
          </template>
        </RebornEmpty>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">#image（动效）</text>
        <RebornEmpty title="正在加载" description="数据还没回来，请稍候。">
          <template #image>
            <view class="i-svg-spinners-180-ring-with-bg size-[96rpx] text-primary" />
          </template>
        </RebornEmpty>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">:image="null"</text>
        <RebornEmpty :image="null" title="暂无评论" description="成为第一个留言的人。" />
      </view>
    </RebornCard>

    <!-- 标题与描述 -->
    <RebornCard title="标题与描述" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        title 固定 28rpx / 500 字重，description 固定 28rpx / 常规字重，两者相差的是字重与颜色而非字号，之间留 8rpx。
        两个 prop 都只收纯文本；要分行或混排别的节点，改用同名的 title / description 插槽，插槽存在时对应的 prop 不再渲染。
      </text>

      <RebornEmpty :image-size="160" title="没有匹配的订单">
        <template #description>
          <view class="flex flex-col gap-[8rpx]">
            <text class="text-28 text-gray-7 dark:text-gray-4">当前筛选：状态 = 已退款</text>
            <text class="text-28 text-primary">清空全部筛选条件</text>
          </view>
        </template>
      </RebornEmpty>

      <RebornEmpty :image-size="160" description="配额用完后新任务会排队等待下个周期。">
        <template #title>
          <view class="flex items-center justify-center gap-[16rpx]">
            <text class="text-28 font-medium leading-[1.5] text-gray-8 dark:text-gray-1">本月配额已用尽</text>
            <text class="text-28 text-warning">0 / 500</text>
          </view>
        </template>
      </RebornEmpty>
    </RebornCard>

    <!-- 操作区 -->
    <RebornCard title="操作区" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        extra 插槽是第三段，横向排列、超宽自动换行、按钮间距 24rpx。组件不派发任何事件，交互由放进插槽的元素自己承担。
        两个按钮时按「次要动作在左、主要动作在右」排：左侧 neutral + outlined，右侧 primary + filled，都用 size="md"。
      </text>

      <RebornEmpty :image="ARTWORK.folder" :image-size="240" title="还没有上传文件" description="支持 PDF、PNG、JPG，单个文件不超过 20 MB。">
        <template #extra>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('上传文件')">
            上传文件
          </ReButton>
        </template>
      </RebornEmpty>

      <RebornEmpty :image-size="160" title="没有符合条件的结果" description="三个筛选条件同时生效，可能过滤得太紧了。">
        <template #extra>
          <ReButton color="neutral" variant="text" size="md" @tap="onAction('查看全部')">
            查看全部
          </ReButton>
          <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('重置筛选')">
            重置筛选
          </ReButton>
          <ReButton color="primary" variant="filled" size="md" @tap="onAction('新建记录')">
            新建记录
          </ReButton>
        </template>
      </RebornEmpty>
    </RebornCard>

    <!-- 缺省段与间距 -->
    <RebornCard title="缺省段与间距" custom-class="space-y-6">
      <text class="text-24 text-gray-6">
        三段（图片 / 标题加描述 / 操作区）都按需渲染：某一段没内容就不进节点树，所以段间的 48rpx 间距不会因为空段变成 96rpx。
        标题与描述同属第二段，它俩之间固定 8rpx。
      </text>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">仅图片</text>
        <RebornEmpty :image-size="160" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">仅标题</text>
        <RebornEmpty :image="null" title="没有更多内容了" />
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-24 text-gray-6 font-mono">三段齐全</text>
        <RebornEmpty :image-size="160" title="暂无数据" description="换个条件再查。">
          <template #extra>
            <ReButton color="neutral" variant="outlined" size="md" @tap="onAction('刷新')">
              刷新
            </ReButton>
          </template>
        </RebornEmpty>
      </view>
    </RebornCard>
  </RebornPage>
</template>
