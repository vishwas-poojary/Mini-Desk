import { z } from 'zod';
import type { DynamicFormConfig } from '../../components/forms/types';

export const bookFormSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  author: z.string().min(2, 'Author name is required'),
  isbn: z.string().min(5, 'Valid ISBN required'),
  category: z.string().min(2, 'Category is required'),
  totalCopies: z.number().min(1, 'At least 1 copy required'),
  shelfLocation: z.string().min(2, 'Shelf location required (e.g. A-02-01)'),
  publishedYear: z.number().min(1500).max(new Date().getFullYear()),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

export const bookFormConfig: DynamicFormConfig<typeof bookFormSchema> = {
  title: 'Add New Catalog Volume',
  description: 'Enter book metadata and shelf coordinates to add to the inventory.',
  schema: bookFormSchema,
  submitLabel: 'Save Book to Catalog',
  fields: [
    {
      name: 'title',
      label: 'Book Title',
      type: 'text',
      placeholder: 'e.g. Clean Architecture',
      colSpan: 2,
    },
    {
      name: 'author',
      label: 'Author(s)',
      type: 'text',
      placeholder: 'e.g. Robert C. Martin',
      colSpan: 1,
    },
    {
      name: 'isbn',
      label: 'ISBN Number',
      type: 'text',
      placeholder: 'e.g. 978-0134494166',
      colSpan: 1,
    },
    {
      name: 'category',
      label: 'Category / Department',
      type: 'select',
      options: [
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'Software Engineering', value: 'Software Engineering' },
        { label: 'Classic Literature', value: 'Classic Literature' },
        { label: 'Sci-Fi / Humor', value: 'Sci-Fi / Humor' },
        { label: 'Philosophy / Fiction', value: 'Philosophy / Fiction' },
        { label: 'Mathematics', value: 'Mathematics' },
      ],
      colSpan: 1,
    },
    {
      name: 'totalCopies',
      label: 'Total Copies in Stock',
      type: 'number',
      defaultValue: 1,
      placeholder: '1',
      colSpan: 1,
    },
    {
      name: 'shelfLocation',
      label: 'Shelf Location Code',
      type: 'text',
      placeholder: 'e.g. CS-04-02',
      colSpan: 1,
    },
    {
      name: 'publishedYear',
      label: 'Publication Year',
      type: 'number',
      defaultValue: 2024,
      placeholder: '2024',
      colSpan: 1,
    },
  ],
};
