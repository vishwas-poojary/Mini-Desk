import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';
import type { DynamicFormConfig } from './types';

interface DynamicFormProps<T extends z.ZodType<any, any>> {
  config: DynamicFormConfig<T>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<z.infer<T>>;
}

export function DynamicForm<T extends z.ZodType<any, any>>({
  config,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
}: DynamicFormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<T>>({
    resolver: zodResolver(config.schema),
    defaultValues: defaultValues as any,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
      {config.title && (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{config.title}</h2>
          {config.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {config.description}
            </p>
          )}
        </div>
      )}

      {/* Grid of form fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {config.fields.map((field) => {
          const errorMessage = errors[field.name]?.message as string | undefined;
          const isFullWidth = field.colSpan === 2 || field.type === 'textarea';

          return (
            <div
              key={field.name}
              className="input-group"
              style={{
                gridColumn: isFullWidth ? 'span 2' : 'span 1',
                marginBottom: 0,
              }}
            >
              <label className="input-label" htmlFor={`field-${field.name}`}>
                {field.label}
              </label>

              {field.type === 'select' ? (
                <select
                  id={`field-${field.name}`}
                  className="input-field"
                  disabled={field.disabled || isLoading}
                  {...register(field.name as any)}
                >
                  <option value="">Select an option...</option>
                  {field.options?.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={`field-${field.name}`}
                  className="input-field"
                  rows={3}
                  placeholder={field.placeholder}
                  disabled={field.disabled || isLoading}
                  {...register(field.name as any)}
                />
              ) : (
                <input
                  id={`field-${field.name}`}
                  type={field.type}
                  className="input-field"
                  placeholder={field.placeholder}
                  disabled={field.disabled || isLoading}
                  {...register(field.name as any, {
                    valueAsNumber: field.type === 'number',
                  })}
                />
              )}

              {errorMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '4px' }}>
                  <AlertCircle size={12} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>{config.submitLabel || 'Save Record'}</span>
          )}
        </button>
      </div>
    </form>
  );
}
