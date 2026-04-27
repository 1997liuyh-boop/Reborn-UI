<script setup lang="ts">
import { ref } from 'vue'

const size1 = ref(50)
const size2 = ref(30)
</script>

<template>
  <div class="space-y-8">
    <!-- 基础用法 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">基础用法</h3>
      <p class="text-sm text-gray-600 mb-4">最基本的用法，如果未传入默认尺寸，将自动平均分配。</p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter>
          <RebornSplitterPanel>
            <div class="h-full bg-blue-50 p-4 flex items-center justify-center">
              面板 1
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-green-50 p-4 flex items-center justify-center">
              面板 2
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>

    <!-- 垂直布局 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">垂直布局</h3>
      <p class="text-sm text-gray-600 mb-4">使用垂直方向。</p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter layout="vertical">
          <RebornSplitterPanel>
            <div class="h-full bg-blue-50 p-4 flex items-center justify-center">
              面板 1
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-green-50 p-4 flex items-center justify-center">
              面板 2
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-yellow-50 p-4 flex items-center justify-center">
              面板 3
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>

    <!-- 可折叠 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">可折叠</h3>
      <p class="text-sm text-gray-600 mb-4">
        配置 collapsible 可提供快速收缩功能。可以使用 min 属性来防止折叠后通过拖拽进行扩展。
      </p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter>
          <RebornSplitterPanel collapsible :min="50">
            <div class="h-full bg-blue-50 p-4 flex items-center justify-center">
              可折叠面板 1
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel collapsible :min="50">
            <div class="h-full bg-green-50 p-4 flex items-center justify-center">
              可折叠面板 2
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-yellow-50 p-4 flex items-center justify-center">
              面板 3
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>

    <!-- 禁用拖动 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">禁用拖动</h3>
      <p class="text-sm text-gray-600 mb-4">
        当任一面板禁用 resizable 时，拖拽功能将被禁用。
      </p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter>
          <RebornSplitterPanel :resizable="false" :size="30">
            <div class="h-full bg-blue-50 p-4 flex items-center justify-center">
              禁用拖动面板 1
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel :size="40">
            <div class="h-full bg-green-50 p-4 flex items-center justify-center">
              面板 2
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-yellow-50 p-4 flex items-center justify-center">
              面板 3
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>

    <!-- 面板大小 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">面板大小</h3>
      <p class="text-sm text-gray-600 mb-4">
        v-model:size 可以获取面板的大小。
      </p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter>
          <RebornSplitterPanel v-model:size="size1">
            <div class="h-full bg-blue-50 p-4 flex flex-col items-center justify-center">
              <span>面板 1</span>
              <span class="text-sm text-gray-600 mt-2">大小: {{ size1 }}%</span>
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel v-model:size="size2">
            <div class="h-full bg-green-50 p-4 flex flex-col items-center justify-center">
              <span>面板 2</span>
              <span class="text-sm text-gray-600 mt-2">大小: {{ size2 }}%</span>
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-yellow-50 p-4 flex items-center justify-center">
              面板 3
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>

    <!-- 延迟 -->
    <div>
      <h3 class="text-lg font-semibold mb-4">延迟</h3>
      <p class="text-sm text-gray-600 mb-4">
        当启用 lazy 时，面板大小将不会在拖动时实时更新，只能在拖动结束后更新。
      </p>
      <div class="h-64 border border-gray-200 rounded-lg">
        <RebornSplitter lazy>
          <RebornSplitterPanel>
            <div class="h-full bg-blue-50 p-4 flex items-center justify-center">
              面板 1 (延迟更新)
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-green-50 p-4 flex items-center justify-center">
              面板 2 (延迟更新)
            </div>
          </RebornSplitterPanel>
          <RebornSplitterPanel>
            <div class="h-full bg-yellow-50 p-4 flex items-center justify-center">
              面板 3 (延迟更新)
            </div>
          </RebornSplitterPanel>
        </RebornSplitter>
      </div>
    </div>
  </div>
</template>