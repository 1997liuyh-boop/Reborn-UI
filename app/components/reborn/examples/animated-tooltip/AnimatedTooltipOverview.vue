<script setup lang="ts">
/**
 * 总览卡片缩略：三人重叠头像组，中间一位上方弹出带姓名与职位的黑色提示
 *
 * 提示只在悬停时由组件内部状态渲染、没有强制显示的 prop，
 * 头像组直接挂载组件，提示气泡按组件里的样式用 DOM 静态模拟，并保留轻微的倾斜。
 */
const people = [
  {
    id: 1,
    name: '李明',
    designation: '产品经理',
    image:
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=200&q=60',
  },
  {
    id: 2,
    name: '王芳',
    designation: '数据分析师',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXZhdGFyfGVufDB8fDB8fHww&auto=format&fit=crop&w=200&q=60',
  },
  {
    id: 3,
    name: '陈静',
    designation: '交互设计师',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=200&q=60',
  },
]
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- 模拟悬停在中间头像时弹出的提示 -->
    <div class="relative mb-2 flex -rotate-3 flex-col items-center rounded-md bg-black px-3 py-1.5 whitespace-nowrap shadow-xl">
      <div class="absolute right-1/2 -bottom-px me-1 h-px w-2/5 translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
      <div class="absolute -bottom-px left-1/2 ms-1 h-px w-2/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
      <div class="text-sm font-bold text-white">
        {{ people[1]?.name }}
      </div>
      <div class="text-xs text-white">
        {{ people[1]?.designation }}
      </div>
    </div>
    <!-- 每个头像带 -mr-4，右侧补同等内边距让视觉中心落在中间头像上 -->
    <div class="flex pr-4">
      <AnimatedTooltip :items="people" />
    </div>
  </div>
</template>
