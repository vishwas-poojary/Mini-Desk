import { z } from 'zod';

export type FieldType = 'text' | 'number' | 'email' | 'select' | 'textarea';

export interface FormSelectOption {
  label: string;
  value: string | number;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: FormSelectOption[];
  defaultValue?: any;
  colSpan?: 1 | 2; // In 2-column grid
  disabled?: boolean;
}

export interface DynamicFormConfig<T extends z.ZodType<any, any>> {
  title?: string;
  description?: string;
  schema: T;
  fields: FormFieldConfig[];
  submitLabel?: string;
}
