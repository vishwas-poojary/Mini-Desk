import { z } from 'zod';
import type { DynamicFormConfig } from '../../components/forms/types';

export const checkoutFormSchema = z.object({
  memberId: z.string().min(1, 'Select a member'),
  bookId: z.string().min(1, 'Select a book'),
  days: z.number().min(1).max(60),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const createCheckoutFormConfig = (
  members: Array<{ label: string; value: string }>,
  books: Array<{ label: string; value: string }>
): DynamicFormConfig<typeof checkoutFormSchema> => ({
  title: 'Issue Book Checkout',
  description: 'Select an active member and an in-stock book to create a loan.',
  schema: checkoutFormSchema,
  submitLabel: 'Confirm Checkout',
  fields: [
    {
      name: 'memberId',
      label: 'Borrower (Member)',
      type: 'select',
      options: members,
      colSpan: 2,
    },
    {
      name: 'bookId',
      label: 'Volume (Book)',
      type: 'select',
      options: books,
      colSpan: 2,
    },
    {
      name: 'days',
      label: 'Loan Duration (Days)',
      type: 'number',
      defaultValue: 14,
      colSpan: 2,
    },
  ],
});
