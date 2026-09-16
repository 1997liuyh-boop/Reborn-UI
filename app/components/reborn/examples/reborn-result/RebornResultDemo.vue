<script setup lang="ts">
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue"
import { resultIcons } from "~/components/reborn/ui/reborn-result/reborn-result.config"
import RebornResult from "~/components/reborn/ui/reborn-result/RebornResult.vue"

/** 七种状态的中英对照：前四种是语义反馈，后三种是 HTTP 状态码 */
const ICON_LABEL: Record<string, string> = {
  "info": "Info 提示",
  "success": "Success 成功",
  "warning": "Warning 警示",
  "error": "Error 失败",
  "403": "403 无权限",
  "404": "404 不存在",
  "500": "500 服务异常",
};

/** 七种状态各自的示例文案，用于状态矩阵一节 */
const ICON_SAMPLE: Record<string, { title: string; subTitle: string }> = {
  "info": { title: "等待审核", subTitle: "资料已提交，审核结果会通过站内信通知。" },
  "success": { title: "提交成功", subTitle: "订单已创建，24 小时内完成发货。" },
  "warning": { title: "部分成功", subTitle: "3 条记录导入成功，1 条因手机号重复被跳过。" },
  "error": { title: "提交失败", subTitle: "收货地址缺少街道信息，补全后重试。" },
  "403": { title: "无访问权限", subTitle: "当前账号不在该空间的成员名单内。" },
  "404": { title: "页面不存在", subTitle: "链接可能已过期，或资源被创建者删除。" },
  "500": { title: "服务异常", subTitle: "请求未能完成，稍后重试或联系管理员。" },
};

const iconOptions = resultIcons.map(i => ({ label: ICON_LABEL[i], value: i }));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  icon: "success",
  title: "提交成功",
  subTitle: "订单已创建，我们会在 24 小时内完成审核。",
  showIcon: true,
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
        label: "图标类型",
        key: "icon",
        component: "select" as const,
        defaultValue: "success",
        props: { options: iconOptions },
      },
      { label: "标题", key: "title", component: "input" as const, defaultValue: "提交成功" },
      {
        label: "描述",
        key: "subTitle",
        component: "input" as const,
        defaultValue: "订单已创建，我们会在 24 小时内完成审核。",
      },
    ],
  },
  {
    title: "结构",
    children: [
      {
        label: "渲染图标区（关闭等于 :icon=\"null\"）",
        key: "showIcon",
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
const resultCode = computed(() => {
  const s = state.value;
  const attrs = [
    s.showIcon ? `icon="${s.icon}"` : ":icon=\"null\"",
    `title="${s.title}"`,
    `sub-title="${s.subTitle}"`,
  ].join("\n  ");
  if (!s.showExtra) return `<RebornResult\n  ${attrs}\n/>`;
  return [
    `<RebornResult`,
    `  ${attrs}`,
    `>`,
    `  <template #extra>`,
    `    <RebornButton color="neutral" variant="outlined" size="md">返回首页</RebornButton>`,
    `    <RebornButton color="primary" variant="filled" size="md">查看订单</RebornButton>`,
    `  </template>`,
    `</RebornResult>`,
  ].join("\n");
});
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="resultCode" component-name="RebornResult"
      title="交互演练场" description="调节左侧参数，观察三段结构在不同状态与缺省组合下的排布。"
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
        <RebornResult
          :icon="state.showIcon ? state.icon : null" :title="state.title" :sub-title="state.subTitle"
        >
          <template v-if="state.showExtra" #extra>
            <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('返回首页')">返回首页</RebornButton>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('查看订单')">查看订单</RebornButton>
          </template>
        </RebornResult>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          最近点击：{{ lastAction || "（无）" }}；组件本身不派发事件，回显来自 extra 插槽里按钮自己的 click。
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="七种状态">
      <template #description>
        <code>icon</code> 决定默认字形与配色：<code>info</code> / <code>success</code> / <code>warning</code> /
        <code>error</code> 四种语义反馈，加 <code>403</code> / <code>404</code> / <code>500</code> 三种状态码。
        状态码复用语义配色——403 是权限拦截走警示色，404 只是资源不存在走信息色，500 是服务端故障走错误色。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="i in resultIcons" :key="i" class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">{{ ICON_LABEL[i] }}</DemoNote>
          <RebornResult :icon="i" :title="ICON_SAMPLE[i]!.title" :sub-title="ICON_SAMPLE[i]!.subTitle" />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="隐藏图标与自定义图标">
      <template #description>
        <code>:icon="null"</code> 整段去掉图标区，连同它上面的 24px 间距一起消失；
        <code>icon</code> 插槽只替换字形，72px 圆形底板与语义色淡底还在。
        两者一起用（<code>:icon="null"</code> 加 <code>icon</code> 插槽）时底板退化成无尺寸透明容器，插画自己决定大小。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">:icon="null"</DemoNote>
          <RebornResult :icon="null" title="已退出登录" sub-title="下次访问需要重新验证身份。" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">icon="success" + #icon</DemoNote>
          <RebornResult icon="success" title="打款完成" sub-title="底板与淡底保留，只换了字形。">
            <template #icon>
              <Icon name="lucide:wallet" class="size-8 shrink-0" />
            </template>
          </RebornResult>
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">:icon="null" + #icon</DemoNote>
          <RebornResult :icon="null" title="正在同步" sub-title="底板不再限制尺寸，插画可以放大。">
            <template #icon>
              <Icon name="lucide:loader-circle" class="text-primary size-24 animate-spin" />
            </template>
          </RebornResult>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="标题与描述">
      <template #description>
        <code>title</code> / <code>sub-title</code> 只收纯文本；要放链接、行内代码或多行排版，
        改用同名的 <code>title</code> / <code>sub-title</code> 插槽，插槽存在时对应的 prop 不再渲染。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-2">
        <RebornResult icon="error" title="部署失败">
          <template #sub-title>
            <span>构建在 <code class="text-default rounded-sm bg-gray-2 px-1 py-0.5 font-mono text-xs">pnpm build</code> 阶段退出，退出码 1。</span>
            <br>
            <a href="#" class="text-primary underline underline-offset-2">查看完整日志</a>
          </template>
        </RebornResult>

        <RebornResult icon="warning" sub-title="集群剩余容量不足以承接本次扩容。">
          <template #title>
            <span>配额告警</span>
            <span class="text-warning ml-2 align-middle text-base font-normal">已用 92%</span>
          </template>
        </RebornResult>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="操作区">
      <template #description>
        <code>extra</code> 插槽是第三段，横向排列、超宽自动换行、按钮间距 12px。
        组件不派发任何事件，所有交互由放进插槽的元素自己承担。
        两个按钮时按「次要动作在左、主要动作在右」排：左侧 <code>neutral</code> + <code>outlined</code>，右侧 <code>primary</code> + <code>filled</code>，都用 <code>size="md"</code>。
      </template>
      <DemoBlock layout="stack" class="gap-10">
        <RebornResult icon="success" title="账号已创建" sub-title="验证邮件已发送到 dev@example.com。">
          <template #extra>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('进入控制台')">进入控制台</RebornButton>
          </template>
        </RebornResult>

        <RebornResult icon="403" title="无访问权限" sub-title="当前账号不在该空间的成员名单内。">
          <template #extra>
            <RebornButton color="neutral" variant="text" size="md" @click="onAction('切换账号')">切换账号</RebornButton>
            <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('返回上一页')">返回上一页</RebornButton>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('申请加入')">申请加入</RebornButton>
          </template>
        </RebornResult>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="四个插槽一起用">
      <template #description>
        <code>icon</code> / <code>title</code> / <code>sub-title</code> / <code>extra</code> 四个具名插槽可以同时启用，
        此时三段的内容全部由调用方决定，<code>title</code> / <code>sub-title</code> 两个 prop 不再渲染。
        这里配合 <code>:icon="null"</code> 连底板一起接管，自己搭一个 72px 圆形底；外层节点的字号与颜色仍然生效，
        所以插槽里只写差异部分（标签、强调数字），不必重复写标题的 24px。
      </template>
      <DemoBlock layout="stack">
        <RebornResult :icon="null">
          <template #icon>
            <div class="bg-success/10 flex size-18 shrink-0 items-center justify-center rounded-full">
              <Icon name="lucide:badge-check" class="text-success size-8 shrink-0" />
            </div>
          </template>

          <template #title>
            <span>支付成功</span>
            <span class="bg-success/10 text-success rounded-sm ml-2 px-2 py-0.5 align-middle text-xs font-normal">已开票</span>
          </template>

          <template #sub-title>
            <span>实付 <span class="text-gray-10 font-medium">¥ 1,280.00</span>，订单号
              <code class="text-default rounded-sm bg-gray-2 px-1 py-0.5 font-mono text-xs">RB-20260915-0413</code>。</span>
            <br>
            <span>发票已发送至 finance@example.com。</span>
          </template>

          <template #extra>
            <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('查看发票')">查看发票</RebornButton>
            <RebornButton color="primary" variant="filled" size="md" @click="onAction('返回订单列表')">返回订单列表</RebornButton>
          </template>
        </RebornResult>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="缺省段与间距">
      <template #description>
        三段（图标 / 标题加描述 / 操作区）都按需渲染：某一段没内容就不进 DOM，
        所以段间的 24px 间距不会因为空段变成 48px。标题与描述同属第二段，它俩之间固定 8px。
      </template>
      <DemoBlock layout="grid" class="sm:grid-cols-3">
        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">仅标题</DemoNote>
          <RebornResult :icon="null" title="没有更多内容了" />
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">图标 + 操作区</DemoNote>
          <RebornResult icon="info">
            <template #extra>
              <RebornButton color="neutral" variant="outlined" size="md" @click="onAction('刷新')">刷新</RebornButton>
            </template>
          </RebornResult>
        </div>

        <div class="flex flex-col items-center gap-3">
          <DemoNote tone="dimmed" class="font-mono text-xs">三段齐全</DemoNote>
          <RebornResult icon="404" title="页面不存在" sub-title="链接可能已过期。">
            <template #extra>
              <RebornButton color="primary" variant="filled" size="md" @click="onAction('回到首页')">回到首页</RebornButton>
            </template>
          </RebornResult>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
