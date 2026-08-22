<script setup lang="ts">
import { ref } from "vue";
import RebornCascader from "../../ui/reborn-cascader/RebornCascader.vue";

const selectedValue = ref<any[]>(["zhejiang", "ningbo", "jiangbei"]);

const options = [
  {
    label: "浙江省",
    value: "zhejiang",
    children: [
      {
        label: "杭州市",
        value: "hangzhou",
        children: [
          { label: "西湖区", value: "xihu" },
          { label: "余杭区", value: "yuhang" },
          { label: "滨江区", value: "binjiang" },
        ],
      },
      {
        label: "宁波市",
        value: "ningbo",
        children: [
          { label: "海曙区", value: "haishu" },
          { label: "江北区", value: "jiangbei" },
        ],
      },
      {
        label: "温州市",
        value: "wenzhou",
      },
    ],
  },
  {
    label: "江苏省",
    value: "jiangsu",
    children: [
      {
        label: "南京市",
        value: "nanjing",
        children: [
          { label: "玄武区", value: "xuanwu" },
          { label: "秦淮区", value: "qinhuai" },
        ],
      },
      {
        label: "苏州市",
        value: "suzhou",
        children: [
          { label: "姑苏区", value: "gusu" },
          { label: "吴中区", value: "wuzhong" },
        ],
      },
    ],
  },
  {
    label: "上海市",
    value: "shanghai",
    children: [
      { label: "黄浦区", value: "huangpu" },
      { label: "浦东新区", value: "pudong" },
      { label: "徐汇区", value: "xuhui" },
    ],
  },
];

function onChange(value: any[], selectedOptions: any[]) {
  console.log("选中的值:", value);
  console.log("选中的选项:", selectedOptions);
}
</script>

<template>
  <div class="min-h-screen bg-gray-1 p-8">
    <div class="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 class="mb-4 text-xl font-semibold text-gray-900">级联选择器 (Cascader)</h1>
        <p class="mb-6 text-base text-gray-600">
          鼠标悬停触发多级菜单，点击选中值，使用 RebornSelectTrigger 作为触发器。
        </p>
      </div>

      <div class="space-y-6">
        <!-- 基础用法 -->
        <div class="rounded-ui-lg border border-gray-2 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">基础用法</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm text-gray-700">选择地区：</label>
              <RebornCascader v-model="selectedValue" :options="options" placeholder="请选择地区" @change="onChange" />
            </div>
            <div class="text-sm text-gray-600">
              当前选中值：{{ selectedValue.length > 0 ? selectedValue : "未选择" }}
            </div>
          </div>
        </div>

        <!-- 不同尺寸 -->
        <div class="rounded-ui-lg border border-gray-2 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">不同尺寸</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm text-gray-700">小尺寸：</label>
              <RebornCascader :options="options" size="sm" placeholder="请选择地区" />
            </div>
            <div>
              <label class="mb-2 block text-sm text-gray-700">中等尺寸：</label>
              <RebornCascader :options="options" size="md" placeholder="请选择地区" />
            </div>
            <div>
              <label class="mb-2 block text-sm text-gray-700">大尺寸：</label>
              <RebornCascader :options="options" size="lg" placeholder="请选择地区" />
            </div>
          </div>
        </div>

        <!-- 禁用状态 -->
        <div class="rounded-ui-lg border border-gray-2 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">禁用状态</h2>
          <RebornCascader :options="options" disabled placeholder="禁用状态" />
        </div>

        <!-- 不可清空 -->
        <div class="rounded-ui-lg border border-gray-2 bg-white p-6">
          <h2 class="mb-4 text-lg font-semibold text-gray-900">不可清空</h2>
          <RebornCascader :options="options" :clearable="false" placeholder="不可清空" />
        </div>
      </div>
    </div>
  </div>
</template>
