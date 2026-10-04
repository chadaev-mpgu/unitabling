import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

/** Валидация формы проекта: имя и выбранный календарь. */
export const projectSchema = toTypedSchema(
  z.object({
    name: z.string().trim().min(1, 'Укажите название'),
    calendarId: z.string().min(1, 'Выберите календарь'),
  }),
);
