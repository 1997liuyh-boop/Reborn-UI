<script setup lang="ts">
import type { PlaygroundControlGroup } from '~/components/common/play-ground/Playground.vue'
import type { DrawerDirection } from '~/components/reborn/ui/reborn-drawer'
import { computed, ref } from 'vue'
import DemoNote from '~/components/common/demo/DemoNote.vue'
import DemoSection from '~/components/common/demo/DemoSection.vue'
import Playground from '~/components/common/play-ground/Playground.vue'
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue'
import RebornCheckbox from '~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue'
import RebornDrawer from '~/components/reborn/ui/reborn-drawer/RebornDrawer.vue'
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue'

const defaults = {
  direction: 'right' as DrawerDirection, size: '30%', title: '任务详情', withHeader: false,
  modal: true, modalPenetrable: false, lockScroll: true, closeOnClickModal: true,
  closeOnPressEscape: true, openDelay: 0, closeDelay: 0, destroyOnClose: false, resizable: false,
}
const state = ref({ ...defaults })
const playgroundOpen = ref(false)
const lastEvent = ref('尚未打开')
const directions: { label: string, value: DrawerDirection }[] = [
  { label: '右侧', value: 'right' }, { label: '左侧', value: 'left' },
  { label: '顶部', value: 'top' }, { label: '底部', value: 'bottom' },
]
const controls: PlaygroundControlGroup[] = [
  { title: '面板', children: [
    { label: '滑入方向', key: 'direction', component: 'select', props: { options: directions } },
    { label: '尺寸（百分比或像素）', key: 'size', component: 'input' },
    { label: '标题', key: 'title', component: 'input' },
    ...['withHeader', 'resizable', 'destroyOnClose'].map((key, i) => ({ label: ['显示头部', '允许调整尺寸', '关闭后销毁'][i]!, key, component: 'checkbox' as const })),
  ] },
  { title: '遮罩与关闭', children: [
    ...['modal', 'modalPenetrable', 'lockScroll', 'closeOnClickModal', 'closeOnPressEscape'].map((key, i) => ({ label: ['显示遮罩', '无遮罩时穿透', '锁定页面滚动', '点击遮罩关闭', 'ESC 关闭'][i]!, key, component: 'checkbox' as const })),
    { label: '打开延迟（毫秒）', key: 'openDelay', component: 'input-number', props: { min: 0, step: 100 } },
    { label: '关闭延迟（毫秒）', key: 'closeDelay', component: 'input-number', props: { min: 0, step: 100 } },
  ] },
]
const code = computed(() => `<RebornDrawer v-model="open"\n${Object.entries(state.value).map(([key, value]) => `  ${typeof value === 'string' ? '' : ':'}${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}="${value}"`).join('\n')}\n>\n  抽屉内容\n</RebornDrawer>`)
const directionOpen = ref(false)
const direction = ref<DrawerDirection>('right')
function openDirection(value: DrawerDirection) { direction.value = value; directionOpen.value = true }
const slotsOpen = ref(false)
const fullHeader = ref(false)
const guardOpen = ref(false)
const confirmation = ref(false)
let pendingClose: ((cancel?: boolean) => void) | undefined
/** 保留关闭回调，由抽屉内的确认操作决定是否继续。 */
function beforeClose(done: (cancel?: boolean) => void) { pendingClose = done; confirmation.value = true }
function decideClose(cancel: boolean) { pendingClose?.(cancel); pendingClose = undefined; confirmation.value = false }
const delayOpen = ref(false)
const destroy = ref(false)
const delayEvent = ref('等待操作')
const maskOpen = ref(false)
const penetrate = ref(false)
const outsideClicks = ref(0)
const localOpen = ref(false)
const localTarget = ref<HTMLElement>()
const resizeOpen = ref(false)
const resizeInfo = ref('拖动左边缘，或聚焦分隔条后按方向键')
const parentOpen = ref(false)
const childOpen = ref(false)
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground v-model="state" :controls="controls" :code="code" component-name="RebornDrawer" title="交互演练场" description="调节参数后打开抽屉，查看方向、头部、遮罩和延迟关闭的实际效果。">
      <template #tag><RebornButton size="sm" variant="text" @click="state = { ...defaults }">重置配置</RebornButton></template>
      <div class="flex flex-col items-center gap-4">
        <RebornButton @click="playgroundOpen = true">打开抽屉</RebornButton>
        <DemoNote>{{ lastEvent }}</DemoNote>
      </div>
      <RebornDrawer v-model="playgroundOpen" v-bind="state" @open="lastEvent = 'open：开始打开'" @opened="lastEvent = 'opened：打开完成'" @close="lastEvent = 'close：开始关闭'" @closed="lastEvent = 'closed：关闭完成'">
        <p class="mb-4">保留当前页面，在抽屉内录入任务信息。</p>
        <RebornInput placeholder="请输入任务名称" aria-label="任务名称" />
        <template #footer="{ close }"><RebornButton class="w-full" @click="close">完成并关闭</RebornButton></template>
      </RebornDrawer>
    </Playground>

    <DemoSection title="方向与尺寸">
      <template #description><code>direction</code> 决定滑入边缘；<code>size</code> 在左右方向表示宽度，在上下方向表示高度。</template>
      <div class="flex flex-wrap gap-3"><RebornButton v-for="item in directions" :key="item.value" variant="outlined" @click="openDirection(item.value)">{{ item.label }}</RebornButton></div>
      <RebornDrawer v-model="directionOpen" :direction="direction" size="40%" title="方向与尺寸" with-header><p>当前方向：{{ direction }}，尺寸为父容器的 40%。</p></RebornDrawer>
    </DemoSection>

    <DemoSection title="头部与页脚插槽">
      <template #description><code>with-header</code> 开启后可独立替换 <code>title</code>、<code>close</code>、<code>extra</code>；<code>header</code> 覆盖三者。</template>
      <div class="flex flex-wrap items-center gap-4"><RebornCheckbox v-model="fullHeader" label="覆盖整个头部" /><RebornButton variant="outlined" @click="slotsOpen = true">查看插槽</RebornButton></div>
      <RebornDrawer v-model="slotsOpen" with-header size="420">
        <template v-if="fullHeader" #header="{ close }"><strong>自定义完整头部</strong><RebornButton size="sm" variant="text" @click="close">返回任务</RebornButton></template>
        <template #title>编辑任务</template>
        <template #close="{ close }"><button type="button" class="size-5 text-gray-9" aria-label="返回" @click="close"><Icon name="lucide:arrow-left" class="size-5" /></button></template>
        <template #extra><span class="text-sm text-gray-6">草稿</span></template>
        <RebornInput placeholder="任务标题" aria-label="任务标题" />
        <template #footer="{ close }"><div class="flex justify-end gap-3"><RebornButton variant="text" @click="close">取消</RebornButton><RebornButton @click="close">确定</RebornButton></div></template>
      </RebornDrawer>
    </DemoSection>

    <DemoSection title="关闭前确认">
      <template #description><code>before-close</code> 暂停关闭：<code>done(false)</code> 放行，<code>done()</code> 或 <code>done(true)</code> 取消。</template>
      <RebornButton variant="outlined" @click="guardOpen = true">编辑未保存任务</RebornButton>
      <RebornDrawer v-model="guardOpen" with-header title="未保存任务" :before-close="beforeClose" @closed="confirmation = false">
        <p>点击关闭图标、遮罩、页脚按钮或按 ESC，均先在本面板确认。</p>
        <div v-if="confirmation" role="alert" class="mt-6 flex flex-col gap-4 rounded-lg bg-gray-2 p-4">
          <p>放弃本次编辑吗？</p><div class="flex gap-3"><RebornButton variant="text" @click="decideClose(true)">继续编辑</RebornButton><RebornButton @click="decideClose(false)">放弃并关闭</RebornButton></div>
        </div>
        <template #footer="{ close }"><RebornButton @click="close">请求关闭</RebornButton></template>
      </RebornDrawer>
    </DemoSection>

    <DemoSection title="延迟与内容保留">
      <template #description><code>open-delay</code> 与 <code>close-delay</code> 均为 500ms；<code>destroy-on-close</code> 控制退场完成后是否销毁输入框。</template>
      <div class="flex flex-wrap items-center gap-4"><RebornCheckbox v-model="destroy" label="关闭后销毁内容" /><RebornButton variant="outlined" @click="delayOpen = true">延迟打开</RebornButton><RebornButton variant="text" @click="delayOpen = false">取消待打开</RebornButton></div>
      <DemoNote class="mt-3">{{ delayEvent }}</DemoNote>
      <RebornDrawer v-model="delayOpen" with-header title="内容保留" :open-delay="500" :close-delay="500" :destroy-on-close="destroy" @open="delayEvent = '开始打开'" @opened="delayEvent = '打开完成'" @close="delayEvent = '开始关闭'" @closed="delayEvent = '关闭完成'">
        <label class="flex flex-col gap-3">输入后关闭再打开，检查是否保留<input aria-label="保留内容测试" class="rounded-md border border-gray-4 px-3 py-2 outline-primary" placeholder="未绑定父级状态的输入框"></label>
      </RebornDrawer>
    </DemoSection>

    <DemoSection title="遮罩与穿透">
      <template #description>关闭 <code>modal</code> 只去掉遮罩颜色；还需 <code>modal-penetrable</code> 才能操作下层页面，此例同时关闭滚动锁。</template>
      <div class="flex flex-wrap items-center gap-4"><RebornCheckbox v-model="penetrate" label="允许穿透" /><RebornButton variant="outlined" @click="maskOpen = true">打开无遮罩抽屉</RebornButton><RebornButton variant="text" @click="outsideClicks++">下层按钮：{{ outsideClicks }}</RebornButton></div>
      <RebornDrawer v-model="maskOpen" with-header title="无遮罩抽屉" :modal="false" :modal-penetrable="penetrate" :lock-scroll="false" :close-on-click-modal="false"><p>允许穿透时可点击左侧页面按钮；否则透明遮罩仍会拦截。</p></RebornDrawer>
    </DemoSection>

    <DemoSection title="父容器内挂载">
      <template #description><code>append-to</code> 指定已存在的定位容器，并优先于 <code>append-to-body</code>。</template>
      <div ref="localTarget" class="relative isolate h-72 overflow-hidden rounded-lg border border-gray-3 p-6">
        <RebornButton variant="outlined" @click="localOpen = true">在此容器打开</RebornButton>
        <RebornDrawer v-model="localOpen" :append-to="localTarget" :lock-scroll="false" with-header title="局部任务" size="65%"><p>面板、遮罩和百分比尺寸都受本容器约束。</p></RebornDrawer>
      </div>
    </DemoSection>

    <DemoSection title="调整尺寸">
      <template #description><code>resizable</code> 开启边缘拖动与方向键调整，三个 <code>resize</code> 事件回传像素尺寸。</template>
      <RebornButton variant="outlined" @click="resizeOpen = true">打开可调整抽屉</RebornButton><DemoNote class="mt-3">{{ resizeInfo }}</DemoNote>
      <RebornDrawer v-model="resizeOpen" with-header title="调整尺寸" resizable :size="400" @resize-start="size => resizeInfo = `开始：${size}px`" @resize="size => resizeInfo = `调整中：${size}px`" @resize-end="size => resizeInfo = `结束：${size}px`"><p>{{ resizeInfo }}</p></RebornDrawer>
    </DemoSection>

    <DemoSection title="嵌套抽屉">
      <template #description>后打开的抽屉自动提高层级；ESC 只关闭最上层，滚动锁在最后一个抽屉关闭后释放。</template>
      <RebornButton variant="outlined" @click="parentOpen = true">打开父抽屉</RebornButton>
      <RebornDrawer v-model="parentOpen" with-header title="父任务" size="60%">
        <RebornButton @click="childOpen = true">打开子任务</RebornButton>
        <RebornDrawer v-model="childOpen" with-header title="子任务" size="35%"><p>关闭后焦点回到父任务内的打开按钮。</p></RebornDrawer>
      </RebornDrawer>
    </DemoSection>
  </div>
</template>
