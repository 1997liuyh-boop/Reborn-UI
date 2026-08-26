<script setup lang="ts">
import RebornDropdown from "~/components/reborn/ui/reborn-dropdown/RebornDropdown.vue";
import RebornDropdownItem from "~/components/reborn/ui/reborn-dropdown/RebornDropdownItem.vue";
import { dropdownColors, dropdownSizes } from "~/components/reborn/ui/reborn-dropdown/reborn-dropdown.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  trigger: "hover",
  splitButton: false,
  hideOnClick: true,
  size: "md",
  color: "primary",
  disabled: false,
  placement: "bottom-start",
});

/** 最近一次触发的 command，用于回显事件 */
const lastCommand = ref("");

function handleCommand(key: string) {
  lastCommand.value = key;
}

const triggerOptions = [
  { label: "Hover 悬浮", value: "hover" },
  { label: "Click 点击", value: "click" },
];

const placementOptions = [
  { label: "左下 (bottom-start)", value: "bottom-start" },
  { label: "底部居中 (bottom)", value: "bottom" },
  { label: "右下 (bottom-end)", value: "bottom-end" },
  { label: "左上 (top-start)", value: "top-start" },
  { label: "顶部居中 (top)", value: "top" },
  { label: "右上 (top-end)", value: "top-end" },
];

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "触发方式",
        key: "trigger",
        component: "select" as const,
        defaultValue: "hover",
        props: { options: triggerOptions },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: dropdownSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: dropdownColors.map((c) => ({
            label: c.charAt(0).toUpperCase() + c.slice(1),
            value: c,
          })),
        },
      },
      {
        label: "弹出位置",
        key: "placement",
        component: "select" as const,
        defaultValue: "bottom-start",
        props: { options: placementOptions },
      },
    ],
  },
  {
    title: "行为控制",
    children: [
      { label: "按钮组模式", key: "splitButton", component: "checkbox" as const, defaultValue: false },
      { label: "点击后隐藏菜单", key: "hideOnClick", component: "checkbox" as const, defaultValue: true },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const dropdownCode = computed(() => {
  const s = state.value;
  const props: string[] = [];

  if (s.trigger !== "hover") props.push(`trigger="${s.trigger}"`);
  if (s.splitButton) props.push("split-button");
  if (!s.hideOnClick) props.push(':hide-on-click="false"');
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.disabled) props.push("disabled");
  if (s.placement !== "bottom-start") props.push(`placement="${s.placement}"`);

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") : "";
  return `<RebornDropdown${propsStr}\n  @command="handleCommand"\n>\n  <RebornButton label="下拉菜单" />\n  <template #dropdown>\n    <RebornDropdownItem command="new">新建文件</RebornDropdownItem>\n    <RebornDropdownItem command="edit">编辑内容</RebornDropdownItem>\n  </template>\n</RebornDropdown>`;
});
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="dropdownCode"
      component-name="RebornDropdown"
      title="交互演练场"
      description="调节触发方式、弹出位置与配色，实时预览下拉菜单的展开表现。"
    >
      <div class="flex flex-col items-center gap-4">
        <RebornDropdown
          :trigger="state.trigger"
          :split-button="state.splitButton"
          :hide-on-click="state.hideOnClick"
          :size="state.size"
          :color="state.color"
          :disabled="state.disabled"
          :placement="state.placement"
          @command="handleCommand"
        >
          <RebornButton
            :size="state.size"
            :color="state.color"
            :disabled="state.disabled"
            :label="state.splitButton ? '提交操作' : '下拉菜单'"
          />
          <template #dropdown>
            <RebornDropdownItem command="new">
              <template #icon>
                <Icon
                  name="lucide:plus"
                  class="size-4"
                />
              </template>
              新建文件
            </RebornDropdownItem>
            <RebornDropdownItem command="edit">
              <template #icon>
                <Icon
                  name="lucide:pencil"
                  class="size-4"
                />
              </template>
              编辑内容
            </RebornDropdownItem>
            <RebornDropdownItem
              command="share"
              divided
            >
              <template #icon>
                <Icon
                  name="lucide:share-2"
                  class="size-4"
                />
              </template>
              分享链接
            </RebornDropdownItem>
            <RebornDropdownItem command="download">
              <template #icon>
                <Icon
                  name="lucide:download"
                  class="size-4"
                />
              </template>
              下载文件
            </RebornDropdownItem>
            <RebornDropdownItem
              command="delete"
              divided
              disabled
            >
              <template #icon>
                <Icon
                  name="lucide:trash-2"
                  class="size-4"
                />
              </template>
              删除（禁用）
            </RebornDropdownItem>
          </template>
        </RebornDropdown>
        <DemoNote
          v-if="lastCommand"
          tone="dimmed"
        >
          最后触发：<code>@command="{{ lastCommand }}"</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="配色方案"
      description="color 决定触发器与菜单项高亮态的语义色，与全站色板保持一致。"
    >
      <DemoBlock
        layout="grid"
        align="center"
      >
        <div
          v-for="c in dropdownColors"
          :key="c"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ c }}</span>
          <RebornDropdown
            :color="c"
            size="sm"
            @command="handleCommand"
          >
            <RebornButton
              :color="c"
              size="sm"
              label="操作"
            />
            <template #dropdown>
              <RebornDropdownItem command="edit">编辑</RebornDropdownItem>
              <RebornDropdownItem command="delete">删除</RebornDropdownItem>
            </template>
          </RebornDropdown>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="尺寸规范"
      description="size 同时作用于触发按钮与菜单项的行高、字号和内边距。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <div
          v-for="s in dropdownSizes"
          :key="s"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ s.toUpperCase() }}</span>
          <RebornDropdown
            :size="s"
            color="info"
            @command="handleCommand"
          >
            <RebornButton
              :size="s"
              color="info"
              :label="s.toUpperCase()"
            />
            <template #dropdown>
              <RebornDropdownItem command="a">选项 A</RebornDropdownItem>
              <RebornDropdownItem command="b">选项 B</RebornDropdownItem>
            </template>
          </RebornDropdown>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="进阶场景"
      description="按钮组、点击触发、任意触发元素与悬停菜单，覆盖常见的业务组合方式。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">按钮组 · <code>split-button</code></span>
          <RebornDropdown
            split-button
            color="warning"
            @command="handleCommand"
          >
            更多操作
            <template #dropdown>
              <RebornDropdownItem command="export">
                <template #icon>
                  <Icon
                    name="lucide:file-output"
                    class="size-4"
                  />
                </template>
                导出数据
              </RebornDropdownItem>
              <RebornDropdownItem command="import">
                <template #icon>
                  <Icon
                    name="lucide:file-input"
                    class="size-4"
                  />
                </template>
                导入数据
              </RebornDropdownItem>
              <RebornDropdownItem
                command="settings"
                divided
              >
                <template #icon>
                  <Icon
                    name="lucide:settings"
                    class="size-4"
                  />
                </template>
                设置
              </RebornDropdownItem>
            </template>
          </RebornDropdown>
          <DemoNote tone="dimmed">左侧为功能按钮，右侧箭头单独触发下拉。</DemoNote>
        </div>

        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">点击触发 · <code>divided</code></span>
          <RebornDropdown
            trigger="click"
            color="secondary"
            :hide-on-click="false"
            @command="handleCommand"
          >
            <RebornButton
              color="secondary"
              variant="outline"
              label="个人中心"
            >
              <template #trailing>
                <Icon
                  name="lucide:chevron-down"
                  class="size-4"
                />
              </template>
            </RebornButton>
            <template #dropdown>
              <RebornDropdownItem command="profile">个人资料</RebornDropdownItem>
              <RebornDropdownItem command="billing">账单管理</RebornDropdownItem>
              <RebornDropdownItem
                command="security"
                divided
              >安全设置</RebornDropdownItem>
              <RebornDropdownItem command="api">API 密钥</RebornDropdownItem>
              <RebornDropdownItem
                command="logout"
                divided
              >
                <template #icon>
                  <Icon
                    name="lucide:log-out"
                    class="size-4"
                  />
                </template>
                退出登录
              </RebornDropdownItem>
            </template>
          </RebornDropdown>
          <DemoNote tone="dimmed">divided 在项目间插入分隔线，用于区分操作层级。</DemoNote>
        </div>

        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">任意触发元素 · 默认插槽</span>
          <RebornDropdown
            trigger="click"
            @command="handleCommand"
          >
            <span
              class="border-primary text-primary hover:border-primary/70 cursor-pointer border-b-2 border-dashed font-medium transition-colors"
            >
              点击这段文字
            </span>
            <template #dropdown>
              <RebornDropdownItem command="view">查看详情</RebornDropdownItem>
              <RebornDropdownItem command="copy">复制链接</RebornDropdownItem>
            </template>
          </RebornDropdown>
          <DemoNote tone="dimmed">触发器不限于按钮，任意元素均可作为默认插槽内容。</DemoNote>
        </div>

        <div class="flex flex-col items-center gap-4">
          <span class="text-dimmed text-xs font-medium">悬停菜单 · 默认 <code>trigger="hover"</code></span>
          <RebornDropdown
            color="error"
            @command="handleCommand"
          >
            <RebornButton
              color="error"
              variant="soft"
              label="危险操作"
            >
              <template #trailing>
                <Icon
                  name="lucide:alert-triangle"
                  class="size-4"
                />
              </template>
            </RebornButton>
            <template #dropdown>
              <RebornDropdownItem command="archive">归档项目</RebornDropdownItem>
              <RebornDropdownItem command="transfer">转移所有权</RebornDropdownItem>
              <RebornDropdownItem
                command="delete"
                divided
                disabled
              >
                <template #icon>
                  <Icon
                    name="lucide:trash-2"
                    class="size-4"
                  />
                </template>
                永久删除
              </RebornDropdownItem>
            </template>
          </RebornDropdown>
          <DemoNote tone="dimmed">鼠标移入即展开，移出 120ms 后自动关闭。</DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
