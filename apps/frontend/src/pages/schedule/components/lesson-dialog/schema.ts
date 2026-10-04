import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import { WeekParity } from '@/domain/week.ts';

/** Валидация формы «Новое занятие». */
export const lessonSchema = toTypedSchema(
  z
    .object({
      roomId: z.string().min(1, 'Выберите аудиторию'),
      teacherId: z.string().min(1, 'Выберите преподавателя'),
      parity: z.enum([WeekParity.Above, WeekParity.Below, WeekParity.Both]),
      weekFrom: z.number().int().min(1, 'Недели нумеруются с 1'),
      weekTo: z.number().int().min(1, 'Недели нумеруются с 1'),
    })
    .refine((values) => values.weekFrom <= values.weekTo, {
      message: 'Неделя «с» позже недели «по»',
      path: ['weekTo'],
    }),
);
