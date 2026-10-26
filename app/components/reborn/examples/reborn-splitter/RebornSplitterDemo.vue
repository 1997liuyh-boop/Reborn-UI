<script setup lang="ts">
import { DemoBlock, DemoNote, DemoSection } from '#components';
import { shallowRef } from 'vue';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornSplitter from '~/components/reborn/ui/reborn-splitter/RebornSplitter.vue';
import RebornSplitterPanel from '~/components/reborn/ui/reborn-splitter/RebornSplitterPanel.vue';
const size1 = shallowRef(50);
const size2 = shallowRef(30);

// ─── 尺寸变化与边界通知 ─────────────────────────────────────────

/** 一条事件回显 */
interface EventLog {
  id: number;
  name: string;
  detail: string;
}

/** 事件日志，按时间倒序保留最近 6 条 */
const eventLogs = shallowRef<EventLog[]>([]);
let logSeq = 0;

/** resize 的派发次数：拖拽中逐帧累加，用来对照 change 只在提交时派发一次 */
const resizeCount = shallowRef(0);

/** 记录一条事件 */
function pushLog(name: string, detail: string) {
  eventLogs.value = [{ id: ++logSeq, name, detail }, ...eventLogs.value].slice(0, 6);
}

/** 尺寸数组保留一位小数，便于阅读 */
function formatSizes(sizes: number[]) {
  return `[${sizes.map(size => size.toFixed(1)).join(', ')}]`;
}

/** 布局提交：拖拽松手、折叠或展开之后 */
function onChange(sizes: number[], index: number) {
  pushLog('change', `${formatSizes(sizes)}，拖拽条 ${index}`);
}

/** 拖拽中某个面板进入 min / max 边界 */
function onLimit(index: number, boundary: 'min' | 'max', size: number) {
  pushLog('limit', `面板 ${index} 触及 ${boundary}，当前 ${size.toFixed(1)}%`);
}

/** 折叠或展开，collapsed 为操作之后的状态 */
function onCollapse(index: number, collapsed: boolean) {
  pushLog('collapse', `面板 ${index} ${collapsed ? '已折叠' : '已展开'}`);
}

/** 清空日志与 resize 计数 */
function clearLogs() {
  eventLogs.value = [];
  resizeCount.value = 0;
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="未传入默认尺寸时，面板自动平均分配。描边盒是分割容器的演示体，内部面板只靠文字区分。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 1</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 2</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="垂直布局"
      description="layout=vertical 时拖动手柄横向分割。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter layout="vertical">
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 1</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 2</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="可折叠"
      description="collapsible 提供快速收缩；min 防止折叠后再被拖开。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter>
            <RebornSplitterPanel
              collapsible
              :min="50"
            >
              <div class="text-muted flex h-full items-center justify-center text-sm">可折叠面板 1</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel
              collapsible
              :min="50"
            >
              <div class="text-muted flex h-full items-center justify-center text-sm">可折叠面板 2</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="禁用拖动"
      description="任一面板 resizable=false 时，整组拖拽被禁用。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter>
            <RebornSplitterPanel
              :resizable="false"
              :size="30"
            >
              <div class="text-muted flex h-full items-center justify-center text-sm">禁用拖动面板 1</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel :size="40">
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 2</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="面板大小"
      description="v-model:size 可以获取并回写面板占比。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter>
            <RebornSplitterPanel v-model:size="size1">
              <div class="text-muted flex h-full flex-col items-center justify-center text-sm">
                <span>面板 1</span>
                <span class="text-dimmed mt-1">大小：{{ size1 }}%</span>
              </div>
            </RebornSplitterPanel>
            <RebornSplitterPanel v-model:size="size2">
              <div class="text-muted flex h-full flex-col items-center justify-center text-sm">
                <span>面板 2</span>
                <span class="text-dimmed mt-1">大小：{{ size2 }}%</span>
              </div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="延迟"
      description="开启 lazy 后，面板大小只在拖动结束时更新，拖动过程中不实时回流。"
    >
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64">
          <RebornSplitter lazy>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 1（延迟更新）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 2（延迟更新）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel>
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3（延迟更新）</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="尺寸变化与边界通知">
      <template #description>
        拖到面板的 <code>min</code> / <code>max</code> 时派发一次 <code>limit</code>，停在边界上不重复派发；松手、折叠或展开后派发一次 <code>change</code>，载荷是全部面板的最新尺寸。
      </template>
      <DemoBlock
        layout="stack"
        tone="inset"
      >
        <div class="h-64 w-full">
          <RebornSplitter
            @resize="resizeCount++"
            @change="onChange"
            @limit="onLimit"
            @collapse="onCollapse"
          >
            <RebornSplitterPanel
              size="30%"
              :min="160"
              max="60%"
              collapsible
            >
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 1（min 160px，max 60%）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel min="15%">
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 2（min 15%）</div>
            </RebornSplitterPanel>
            <RebornSplitterPanel size="20%">
              <div class="text-muted flex h-full items-center justify-center text-sm">面板 3</div>
            </RebornSplitterPanel>
          </RebornSplitter>
        </div>
      </DemoBlock>
      <div class="mt-4 flex flex-col gap-2">
        <div class="flex items-center gap-3">
          <RebornButton
            size="sm"
            variant="soft"
            color="neutral"
            @click="clearLogs"
          >
            清空日志
          </RebornButton>
          <DemoNote tone="dimmed">resize 已派发 {{ resizeCount }} 次：它随拖拽逐帧派发，适合同步预览；保存布局请监听 change，一次拖拽只在松手时派发一次。</DemoNote>
        </div>
        <ul class="flex flex-col gap-1 font-mono text-xs">
          <li
            v-for="log in eventLogs"
            :key="log.id"
            class="text-muted break-all"
          >
            <span class="text-primary">{{ log.name }}</span>
            {{ log.detail }}
          </li>
          <li
            v-if="!eventLogs.length"
            class="text-dimmed"
          >
            拖动上面的拖拽条或点击折叠按钮，事件会按时间倒序出现在这里
          </li>
        </ul>
      </div>
    </DemoSection>
  </div>
</template>
