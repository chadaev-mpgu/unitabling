import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

/** Валидация формы группы; курс и год набора необязательны. */
export const studentGroupSchema = toTypedSchema(
  z.object({
    name: z.string().trim().min(1, 'Укажите название'),
    size: z
      .number({ invalid_type_error: 'Укажите численность' })
      .int('Численность — целое число')
      .positive('Численность должна быть больше нуля'),
    courseYear: z
      .number({ invalid_type_error: 'Курс — целое число' })
      .int('Курс — целое число')
      .positive('Курс должен быть больше нуля')
      .optional(),
    admissionYear: z
      .number({ invalid_type_error: 'Год набора — целое число' })
      .int('Год набора — целое число')
      .positive('Год набора должен быть больше нуля')
      .optional(),
  }),
);
