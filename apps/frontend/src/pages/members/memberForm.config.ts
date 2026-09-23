import { z } from 'zod';
import type { DynamicFormConfig } from '../../components/forms/types';

export const memberFormSchema = z.object({
  name: z.string().min(2, 'Member name is required'),
  email: z.string().email('Valid email address required'),
  phone: z.string().min(5, 'Phone number required'),
  membershipNumber: z.string().min(4, 'Membership ID code required'),
  status: z.enum(['active', 'suspended', 'expired']),
});

export type MemberFormValues = z.infer<typeof memberFormSchema>;

export const memberFormConfig: DynamicFormConfig<typeof memberFormSchema> = {
  title: 'Enroll New Library Member',
  description: 'Issue a library card and register contact details.',
  schema: memberFormSchema,
  submitLabel: 'Register Member',
  fields: [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'e.g. Donna Noble',
      colSpan: 1,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'donna@library.org',
      colSpan: 1,
    },
    {
      name: 'phone',
      label: 'Contact Phone',
      type: 'text',
      placeholder: '+1 (555) 123-4567',
      colSpan: 1,
    },
    {
      name: 'membershipNumber',
      label: 'Membership Card #',
      type: 'text',
      placeholder: 'LIB-2026-009',
      colSpan: 1,
    },
    {
      name: 'status',
      label: 'Membership Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Expired', value: 'expired' },
      ],
      colSpan: 2,
    },
  ],
};
