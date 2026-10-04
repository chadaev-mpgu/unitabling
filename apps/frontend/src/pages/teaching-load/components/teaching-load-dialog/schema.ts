import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';

import { LessonType } from '@/domain/lesson.ts';
import { HOURS_STEP } from '@/pages/teaching-load/constants.ts';

/** Валидация формы строки нагрузки. */
export const teachingLoadSchema = toTypedSchema(
  z.object({
    disciplineId: z.string().min(1, 'Выберите дисциплину'),
    groupId: z.string().min(1, 'Выберите группу'),
    lessonType: z.enum([
      LessonType.Lecture,
      LessonType.Seminar,
      LessonType.Lab,
      LessonType.Credit,
      LessonType.Exam,
    ]),
    hoursTotal: z
      .number({ invalid_type_error: 'Укажите часы' })
      .positive('Часы должны быть больше нуля')
      .refine((value) => Number.isInteger(value / HOURS_STEP), {
        message: 'Шаг часов — 0,5',
      }),
    teacherId: z.string(),
  }),
);
