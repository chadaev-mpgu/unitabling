import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

/** Валидация формы аудитории. */
export const roomSchema = toTypedSchema(
  z.object({
    name: z.string().trim().min(1, 'Укажите название'),
    kind: z.enum(['lecture', 'lab', 'computer', 'gym', 'other']),
    capacity: z
      .number({ invalid_type_error: 'Укажите вместимость' })
      .int('Вместимость — целое число')
      .positive('Вместимость должна быть больше нуля'),
  }),
);
