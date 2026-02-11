import { ref, inject, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue';

export type FormValidateError = {
  field: string;
  message: string;
};

export interface UseFieldGroupProps {
  modelValue?: any;
}

export function useFieldGroup() {

  // Data & Context
  const errors = ref(new Map<string, string>());
  const fields = ref(new Set<string>([]));
  const fieldInstances = ref<any[]>([]);

  // --- Field Management ---
  const addField = (field: any) => {
    fieldInstances.value.push(field);
    if (field.prop) {
      fields.value.add(field.prop);
    }
  };

  const removeField = (field: any) => {
    const index = fieldInstances.value.indexOf(field);
    if (index > -1) {
      fieldInstances.value.splice(index, 1);
    }
    if (field.prop) {
      fields.value.delete(field.prop);
    }
  };

  // --- Error Management ---
  const errorLock = ref(false);

  function setError(prop: string, error: string) {
    if (errorLock.value) return;
    if (prop !== "") errors.value.set(prop, error);
  }

  function removeError(prop: string) {
    if (prop !== "") errors.value.delete(prop);
  }

  function getError(prop: string): string {
    if (prop !== "") return errors.value.get(prop) ?? "";
    return "";
  }

  async function getErrors(): Promise<FormValidateError[]> {
    const errs = [] as FormValidateError[];
    errors.value.forEach((msg, field) => {
      errs.push({ field, message: msg });
    });
    return errs;
  }

  function clearValidate(fieldsToClear?: string | string[]) {
    if (fieldsToClear) {
      const propsArray = Array.isArray(fieldsToClear) ? fieldsToClear : [fieldsToClear];
      propsArray.forEach(prop => removeError(prop));
    } else {
      errors.value.clear();
    }
  }

  return {
    errors,
    fields,
    fieldInstances,
    addField,
    removeField,
    setError,
    removeError,
    getError, // Used by children
    getErrors, // Used by validate
    clearValidate
  };
}


export interface UseFieldGroupItemProps {
  prop?: string;
  label?: string;
  labelPosition?: string;
  labelWidth?: string | number;
  ui?: any;
}

export function useFieldGroupItem(props: UseFieldGroupItemProps) {
  const form = inject<any>('rebornForm', undefined);
  const instance = getCurrentInstance();


  const error = computed(() => {
    if (!form || !props.prop) return '';
    return form.getError ? form.getError(props.prop) : '';
  });

  const labelPosition = computed(() => {
    return props.labelPosition || form?.props?.labelPosition || 'left';
  });

  const labelWidth = computed(() => {
    if (labelPosition.value === 'top') return 'auto';
    return props.labelWidth || form?.props?.labelWidth || 'auto';
  });

  const size = computed(() => {
    const s = form?.props?.size;
    if (s && ['sm', 'md', 'lg'].includes(s)) {
      return s as "sm" | "md" | "lg";
    }
    return 'sm';
  });

  const getBoundingClientRect = (callback: (res: any) => void) => {
    uni.createSelectorQuery()
      .in(instance?.proxy)
      .select('.re-form-item')
      .boundingClientRect(callback)
      .exec();
  };

  // Watch for prop changes to update registration
  watch(() => props.prop, (newProp, oldProp) => {
    if (form) {
      if (oldProp) {
        form.removeField({ uid: instance?.uid, prop: oldProp });
      }
      if (newProp) {
        form.addField({ uid: instance?.uid, prop: newProp, getBoundingClientRect });
      }
    }
  });

  onMounted(() => {
    if (form && props.prop) {
      form.addField({ uid: instance?.uid, prop: props.prop, getBoundingClientRect });
    }
  });

  onUnmounted(() => {
    if (form && props.prop) {
      form.removeField({ uid: instance?.uid, prop: props.prop });
    }
  });

  return {
    form,
    error,
    labelPosition,
    labelWidth,
    size,
    getBoundingClientRect
  };
}

// Consumer for inner components (Input, Select, etc.)
export function useFormInject(props: any) {
  const form = inject<any>('rebornForm', null);
  const formItem = inject<any>('rebornFormItem', null);

  const size = computed(() => {
    return form?.props?.size || props.size;
  });

  const disabled = computed(() => {
    return form?.props?.disabled || props.disabled;
  });

  const orientation = computed(() => {
    return form?.props?.orientation || props.orientation;
  });

  const isError = computed(() => {
    return formItem?.isError?.value || false;
  });

  return {
    form,
    size,
    disabled,
    orientation,
    isError
  };
}
