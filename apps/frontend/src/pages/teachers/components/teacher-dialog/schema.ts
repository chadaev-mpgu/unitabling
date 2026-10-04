import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

/** Валидация формы преподавателя. */
export const teacherSchema = toTypedSchema(
  z.object({
    fullName: z.string().trim().min(1, 'Укажите Ф. И. О.'),
    position: z.string().trim(),
  }),
);
