<script setup lang="ts">
import { computed, nextTick, reactive, shallowRef, useTemplateRef, watch } from 'vue';
import { z } from 'zod';
import RebornButton from '~/components/reborn/ui/reborn-button/RebornButton.vue';
import RebornCheckbox from '~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue';
import RebornCheckboxGroup from '~/components/reborn/ui/reborn-checkbox/RebornCheckboxGroup.vue';
import RebornColorPicker from '~/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue';
import RebornDatePicker from '~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue';
import RebornForm from '~/components/reborn/ui/reborn-form/RebornForm.vue';
import RebornFormItem from '~/components/reborn/ui/reborn-form/RebornFormItem.vue';
import RebornInputNumber from '~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue';
import RebornInput from '~/components/reborn/ui/reborn-input/RebornInput.vue';
import RebornMention from '~/components/reborn/ui/reborn-mention/RebornMention.vue';
import RebornProgress from '~/components/reborn/ui/reborn-progress/RebornProgress.vue';
import RebornRadioGroup from '~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue';
import RebornRate from '~/components/reborn/ui/reborn-rate/RebornRate.vue';
import RebornSelect from '~/components/reborn/ui/reborn-select/RebornSelect.vue';
import RebornSlider from '~/components/reborn/ui/reborn-slider/RebornSlider.vue';
import RebornSwitch from '~/components/reborn/ui/reborn-switch/RebornSwitch.vue';
import RebornTextarea from '~/components/reborn/ui/reborn-textarea/RebornTextarea.vue';
import RebornTimePicker from '~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue';

/** 综合示例的数据独立于上方演练场，重置时互不影响。 */
const form = reactive({
  title: '',
  category: 'sharing',
  mode: 'online',
  capacity: 20,
  city: 'hangzhou',
  venue: null as string | null,
  meetingUrl: '',
  date: '',
  time: '',
  topics: [] as string[],
  notifications: false,
  email: '',
  rating: 0,
  description: '',
  collaborators: '',
  themeColor: '#1b6dfa',
  agreed: false,
});

/** 表单实例与提交回显；编辑后清除旧的提交快照，避免误认为新值已经提交。 */
const formRef = useTemplateRef<InstanceType<typeof RebornForm>>("formRef");
const result = shallowRef<'idle' | 'success' | 'error'>('idle');
const errorCount = shallowRef(0);
const submitted = shallowRef('');

/** 下拉、单选、复选与提及的候选项。 */
const categoryOptions = [
  { label: '主题分享', value: 'sharing' },
  { label: '动手工作坊', value: 'workshop' },
];
const modeOptions = [
  { label: '线上活动', value: 'online' },
  { label: '线下活动', value: 'offline' },
];
const cityOptions = [
  { label: '杭州', value: 'hangzhou' },
  { label: '上海', value: 'shanghai' },
];
const venues: Record<string, { label: string; value: string }[]> = {
  hangzhou: [{ label: '西湖交流空间', value: 'westlake' }, { label: '滨江创作室', value: 'binjiang' }],
  shanghai: [{ label: '徐汇交流空间', value: 'xuhui' }, { label: '浦东创作室', value: 'pudong' }],
};
const topicOptions = [
  { label: '组件设计', value: 'components' },
  { label: '交互体验', value: 'interaction' },
  { label: '无障碍', value: 'accessibility' },
];
const collaboratorOptions = [
  { label: '小林 · 主持人', value: '小林' },
  { label: '小周 · 设计师', value: '小周' },
  { label: '小陈 · 开发者', value: '小陈' },
];

/** 工作坊最多 20 人，线下分享最多 30 人，线上分享最多 100 人。 */
const capacityLimit = computed(() => form.category === 'workshop' ? 20 : form.mode === 'offline' ? 30 : 100);
/** 城市决定场地候选项，切换后不保留已经失效的场地。 */
const venueOptions = computed(() => venues[form.city] ?? []);

/** 禁用或隐藏字段同时放宽规则；必填星号和进度使用相同的业务条件。 */
const rules = computed(() => z.object({
  title: z.string().trim().min(2, '请填写至少 2 个字的活动名称'),
  category: z.enum(['sharing', 'workshop']),
  mode: z.enum(['online', 'offline']),
  capacity: z.number().int('人数须为整数').min(1, '至少需要 1 人').max(capacityLimit.value, `最多 ${capacityLimit.value} 人`),
  city: z.string(),
  venue: form.mode === 'offline'
    ? z.string({ invalid_type_error: '请选择活动场地' }).refine(value => venueOptions.value.some(item => item.value === value), '请选择当前城市的场地')
    : z.string().nullable(),
  meetingUrl: form.mode === 'online'
    ? z.string().url('请填写完整的会议链接').refine(value => /^https?:\/\//.test(value), '会议链接须以 http:// 或 https:// 开头')
    : z.string(),
  date: z.preprocess(value => value ?? '', z.string().min(1, '请选择活动日期')),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '请选择开始时间'),
  topics: z.array(z.string()).min(1, '请至少选择一个关注主题'),
  notifications: z.boolean(),
  email: form.notifications ? z.string().trim().email('请填写有效的通知邮箱') : z.string(),
  rating: z.number().min(1, '请选择期待程度').max(5),
  description: z.string().trim().min(10, '活动介绍至少需要 10 个字').max(200),
  collaborators: z.string(),
  themeColor: z.string(),
  agreed: z.boolean().refine(value => value, '请先确认活动信息'),
}));

/** 用同一份校验规则计算必填完成度，条件字段只在启用时计入。 */
const completion = computed(() => {
  const fields = ['title', 'category', 'mode', 'capacity', 'date', 'time', 'topics', 'rating', 'description', 'agreed',
    ...(form.mode === 'online' ? ['meetingUrl'] : ['city', 'venue']), ...(form.notifications ? ['email'] : [])];
  const parsed = rules.value.safeParse(form);
  const invalid = new Set(parsed.success ? [] : parsed.error.issues.map(issue => String(issue.path[0])));
  const completed = fields.filter(field => !invalid.has(field)).length;
  return { completed, total: fields.length, percent: Math.round(completed / fields.length * 100) };
});

/** 规格改变后收紧人数上限，输入框与滑块始终绑定同一个值。 */
watch(capacityLimit, limit => {
  form.capacity = Math.min(form.capacity, limit);
});
/** 清除不再适用的字段值和校验提示，隐藏字段不会阻止提交。 */
watch(() => form.mode, mode => {
  if (mode === 'online') form.venue = null;
  else form.meetingUrl = '';
  formRef.value?.clearValidate(['venue', 'meetingUrl']);
});
watch(() => form.city, () => {
  if (!venueOptions.value.some(item => item.value === form.venue)) form.venue = null;
  formRef.value?.clearValidate('venue');
});
watch(() => form.notifications, enabled => {
  if (!enabled) form.email = '';
  formRef.value?.clearValidate('email');
});
watch(form, () => {
  result.value = 'idle';
  submitted.value = '';
  errorCount.value = 0;
});

/** 时间、评分尚未自动接入字段校验，等模型写回后手动校验对应字段。 */
async function validateField(field: string) {
  await nextTick();
  await formRef.value?.validateField(field);
}

/** 填入可通过校验的数据，便于观察完整状态和再次编辑后的联动。 */
async function fillExample() {
  Object.assign(form, {
    title: '周末组件交流会', category: 'sharing', mode: 'online', capacity: 40,
    city: 'hangzhou', venue: null, meetingUrl: 'https://example.com/meeting',
    date: '2026-11-21', time: '14:00', topics: ['components', 'interaction'],
    notifications: true, email: 'organizer@example.com', rating: 4,
    description: '一起交流组件设计与表单交互，分享真实项目中的实践经验。',
    collaborators: '请 @小林 主持，邀请 @小周 分享设计经验。', themeColor: '#1b6dfa', agreed: true,
  });
  await nextTick();
  formRef.value?.clearValidate();
}

/** 仅做本地校验与数据回显，不向外部发送报名信息。 */
async function submit() {
  const valid = await formRef.value?.validate((_valid, errors) => {
    errorCount.value = errors.length;
  });
  result.value = valid ? 'success' : 'error';
  submitted.value = valid ? JSON.stringify(form, null, 2) : '';
}

/** 恢复挂载时的初始值，同时清除校验和提交回显。 */
async function reset() {
  formRef.value?.resetFields();
  await nextTick();
  formRef.value?.clearValidate();
  result.value = 'idle';
  errorCount.value = 0;
  submitted.value = '';
}
</script>

<template>
  <div class="w-full min-w-0 space-y-6" data-form-linkage>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-highlighted text-xl font-semibold">活动报名设置</h3>
        <p class="text-muted text-sm">切换举办方式、活动类型和通知开关，观察字段、人数上限与校验规则同步变化。</p>
      </div>
      <RebornButton variant="soft" size="sm" @click="fillExample">填入示例</RebornButton>
    </div>

    <div class="bg-elevated space-y-2 rounded-lg p-4">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span>必填完成度</span>
        <span aria-live="polite">{{ completion.completed }} / {{ completion.total }} 项 · {{ completion.percent }}%</span>
      </div>
      <RebornProgress :percent="completion.percent" :status="completion.percent === 100 ? 'success' : 'default'" :show-text="false" aria-label="必填完成度" />
    </div>

    <RebornForm ref="formRef" :model-value="form" :rules="rules" label-position="top" size="md" :trigger="['change', 'blur']">
      <div class="grid min-w-0 grid-cols-1 gap-x-6 md:grid-cols-2">
        <RebornFormItem prop="title" label="活动名称" required>
          <RebornInput v-model="form.title" placeholder="例如：周末组件交流会" clearable />
        </RebornFormItem>
        <RebornFormItem prop="category" label="活动类型" required>
          <RebornSelect v-model="form.category" :options="categoryOptions" :clearable="false" />
        </RebornFormItem>
        <RebornFormItem prop="mode" label="举办方式" required>
          <RebornRadioGroup v-model="form.mode" :options="modeOptions" />
        </RebornFormItem>
        <RebornFormItem prop="capacity" label="报名人数上限" required>
          <div class="w-full space-y-3">
            <RebornInputNumber v-model="form.capacity" :min="1" :max="capacityLimit" :value-on-clear="1" />
            <RebornSlider v-model="form.capacity" :min="1" :max="capacityLimit" />
            <p class="text-muted text-sm">两种输入同步；当前最多 {{ capacityLimit }} 人，切换活动类型或方式会自动收紧人数。</p>
          </div>
        </RebornFormItem>

        <RebornFormItem v-if="form.mode === 'online'" key="meetingUrl" prop="meetingUrl" label="线上会议链接" required class="md:col-span-2">
          <RebornInput v-model="form.meetingUrl" placeholder="https://example.com/meeting" />
        </RebornFormItem>
        <template v-else>
          <RebornFormItem key="city" prop="city" label="活动城市" required>
            <RebornSelect v-model="form.city" :options="cityOptions" :clearable="false" />
          </RebornFormItem>
          <RebornFormItem key="venue" prop="venue" label="活动场地" required>
            <RebornSelect v-model="form.venue" :options="venueOptions" placeholder="请先选择城市，再选择场地" clearable />
          </RebornFormItem>
        </template>

        <RebornFormItem prop="date" label="活动日期" required>
          <RebornDatePicker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="请选择活动日期" />
        </RebornFormItem>
        <RebornFormItem prop="time" label="开始时间" required>
          <RebornTimePicker v-model="form.time" format="HH:mm" placeholder="请选择开始时间" @change="validateField('time')" />
        </RebornFormItem>
        <RebornFormItem prop="topics" label="关注主题" required class="md:col-span-2">
          <RebornCheckboxGroup v-model="form.topics" :options="topicOptions" />
        </RebornFormItem>
        <RebornFormItem prop="notifications" label="报名通知">
          <div class="flex flex-wrap items-center gap-3">
            <RebornSwitch v-model="form.notifications" aria-label="启用报名通知" />
            <span class="text-muted text-sm">{{ form.notifications ? '已启用，通知邮箱为必填' : '关闭后禁用邮箱，并跳过邮箱校验' }}</span>
          </div>
        </RebornFormItem>
        <RebornFormItem prop="email" label="通知邮箱" :required="form.notifications">
          <RebornInput v-model="form.email" :disabled="!form.notifications" placeholder="organizer@example.com" />
        </RebornFormItem>
        <RebornFormItem prop="rating" label="期待程度" required>
          <RebornRate v-model="form.rating" clearable show-value @change="validateField('rating')" />
        </RebornFormItem>
        <RebornFormItem prop="themeColor" label="活动标识颜色">
          <div class="flex items-center gap-3">
            <RebornColorPicker v-model="form.themeColor" />
            <span class="text-muted font-mono text-sm">{{ form.themeColor }}</span>
          </div>
        </RebornFormItem>
        <RebornFormItem prop="description" label="活动介绍" required class="md:col-span-2">
          <RebornTextarea v-model="form.description" :rows="3" :maxlength="200" :ui="{ root: 'bg-gray-1' }" show-word-limit placeholder="介绍活动内容，至少 10 个字" />
        </RebornFormItem>
        <RebornFormItem prop="collaborators" label="邀请协作者（选填）" class="md:col-span-2">
          <RebornMention v-model="form.collaborators" :options="collaboratorOptions" placeholder="输入 @ 选择协作者，再补充邀请说明" />
        </RebornFormItem>
        <RebornFormItem prop="agreed" label="信息确认" required class="md:col-span-2">
          <RebornCheckbox v-model="form.agreed" label="我已确认活动时间、人数与联系方式" />
        </RebornFormItem>
      </div>

      <div class="border-default flex flex-wrap items-center gap-3 border-t pt-4">
        <RebornButton @click="submit">校验并提交</RebornButton>
        <RebornButton variant="outlined" color="neutral" @click="reset">重置联动表单</RebornButton>
        <p role="status" class="text-sm" :class="result === 'error' ? 'text-error' : 'text-muted'">
          {{ result === 'success' ? '校验通过，已生成本地提交快照。' : result === 'error' ? `还有 ${errorCount} 个字段需要检查。` : '提交会校验当前生效的字段，重置会恢复初始数据。' }}
        </p>
      </div>
    </RebornForm>

    <div class="bg-elevated space-y-2 rounded-lg p-4" :style="{ '--event-color': form.themeColor }">
      <div class="flex items-center gap-2">
        <span class="size-3 shrink-0 rounded-full bg-(--event-color)" />
        <span class="font-medium">{{ form.title || '未命名活动' }}</span>
      </div>
      <p class="text-muted text-sm">
        {{ form.mode === 'online' ? '线上活动' : '线下活动' }} · {{ form.capacity }} 人 · {{ form.topics.length }} 个主题 · 期待 {{ form.rating }} / 5
      </p>
      <p v-if="form.collaborators" class="text-muted break-words text-sm">{{ form.collaborators }}</p>
    </div>
    <details class="border-default rounded-lg border p-4">
      <summary class="cursor-pointer text-sm">查看{{ submitted ? '提交快照' : '实时表单数据' }}</summary>
      <pre class="text-muted mt-3 max-h-80 overflow-auto text-xs">{{ submitted || JSON.stringify(form, null, 2) }}</pre>
    </details>
  </div>
</template>
