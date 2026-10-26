import { onScopeDispose, shallowRef } from 'vue';
import { writeClipboardText } from '~/utils/writeClipboardText';

/** 将复制结果显示在操作按钮旁，抽屉内也能看到反馈。 */
export function useClipboardFeedback() {
  const copied = shallowRef(false);
  const copyError = shallowRef(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string) {
    clearTimeout(timer);
    const success = await writeClipboardText(text);
    copied.value = success;
    copyError.value = !success;
    timer = setTimeout(() => {
      copied.value = false;
      copyError.value = false;
    }, 2000);
  }

  onScopeDispose(() => clearTimeout(timer));
  return { copy, copied, copyError };
}
