<script setup lang="ts">
/**
 * 总览卡片缩略：被主色框高亮的目标按钮，下方是带箭头的引导气泡（标题、说明、步骤计数与上一步 / 下一步）
 *
 * 真实引导会 Teleport 到 body、铺全屏遮罩并按目标坐标定位，缩略图不挂载组件，只用主题样式静态渲染气泡：
 * 面板的 fixed 改成 relative 排在目标下方，默认 360px 宽与 16px 内边距收窄，箭头固定在顶边正中；
 * 遮罩挖空的高亮区用目标外圈的主色描边表示；面板与箭头补一圈 gray-3 描边，暗色卡片上没有遮罩衬底时也能看清边界。
 */
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import theme from '~/components/reborn/ui/reborn-guide/reborn-guide.config'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'

const styles = tv(theme)({ mode: 'popup' })

/** 箭头与组件定位结果一致：12px 方块旋转 45°，一半露出面板顶边（描边后外移 1px 盖住面板顶边线） */
const arrowStyle = { top: '-7px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="rounded-md ring-2 ring-primary ring-offset-2 ring-offset-gray-1">
      <RebornButton
        size="sm"
        variant="outlined"
      >
        新建项目
      </RebornButton>
    </div>
    <div :class="cn(styles.guideBox(), 'relative mt-3 w-[200px] gap-1 border border-gray-3 px-2.5 py-2')">
      <div
        :class="cn(styles.guideArrow(), 'border-t border-l border-gray-3')"
        :style="arrowStyle"
      />
      <div :class="styles.guideHeader()">
        <div :class="styles.guideTitle()">
          创建项目
        </div>
      </div>
      <div :class="cn(styles.guideBody(), 'text-sm')">
        在这里新建项目并邀请成员协作
      </div>
      <div :class="styles.guideFooter()">
        <span :class="cn(styles.counter(), 'text-sm')">2/3</span>
        <div :class="cn(styles.buttonGroup(), 'gap-1.5')">
          <RebornButton
            size="sm"
            color="neutral"
            variant="outlined"
            class="px-2"
          >
            上一步
          </RebornButton>
          <RebornButton
            size="sm"
            color="primary"
            class="px-2"
          >
            下一步
          </RebornButton>
        </div>
      </div>
    </div>
  </div>
</template>
