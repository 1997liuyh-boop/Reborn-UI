<script setup lang="ts">
const size1 = ref(50);
const size2 = ref(30);
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
  </div>
</template>
