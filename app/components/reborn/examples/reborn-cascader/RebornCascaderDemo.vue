<script setup lang="ts">
import { cascaderSizes } from "~/components/reborn/ui/reborn-cascader/reborn-cascader.config";

const selectedValue = ref<any[]>(["zhejiang", "ningbo", "jiangbei"]);

/** 最近一次 change 事件的回显 */
const lastChange = ref("");

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

function onChange(value: any[]) {
  lastChange.value = value.length ? value.join(" / ") : "未选择";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <DemoSection
      title="基础用法"
      description="鼠标悬停展开多级菜单，点击叶子节点选中；使用 RebornSelectTrigger 作为触发器。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          v-model="selectedValue"
          :options="options"
          placeholder="请选择地区"
          @change="onChange"
        />
        <DemoNote tone="dimmed">当前选中：{{ selectedValue.length ? selectedValue.join(" / ") : "未选择" }}{{ lastChange ? ` · 最近变化：${lastChange}` : "" }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="尺寸"
      description="与全站表单控件共用 sm / md / lg 三档。"
    >
      <DemoBlock layout="stack">
        <div
          v-for="s in cascaderSizes"
          :key="s"
          class="flex flex-col gap-1"
        >
          <span class="text-dimmed text-xs">{{ s }}</span>
          <RebornCascader
            :options="options"
            :size="s"
            placeholder="请选择地区"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="禁用与不可清空"
      description="disabled 锁定交互；clearable=false 隐藏清除按钮。"
    >
      <DemoBlock layout="stack">
        <RebornCascader
          :options="options"
          disabled
          placeholder="禁用状态"
        />
        <RebornCascader
          :options="options"
          :clearable="false"
          placeholder="不可清空"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
