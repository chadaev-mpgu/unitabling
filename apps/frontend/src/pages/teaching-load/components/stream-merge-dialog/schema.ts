import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import { HOURS_STEP } from '@/pages/teaching-load/constants.ts';

/** Валидация часов потока: положительные, с шагом 0,5. */
export const streamMergeSchema = toTypedSchema(
  z.object({
    hours: z
      .number({ invalid_type_error: 'Укажите часы' })
      .positive('Часы должны быть больше нуля')
      .refine((value) => Number.isInteger(value / HOURS_STEP), {
        message: 'Шаг часов — 0,5',
      }),
  }),
);
