import { LessonType } from '@/domain/lesson.ts';
import { WeekParity } from '@/domain/week.ts';

/** Варианты парности в форме. */
export const PARITY_OPTIONS = [
  { value: WeekParity.Above, label: 'Над чертой', summary: 'нечётные недели' },
  { value: WeekParity.Below, label: 'Под чертой', summary: 'чётные недели' },
  { value: WeekParity.Both, label: 'Обе недели', summary: 'все недели' },
] as const;

export const LESSON_TYPE_LABELS: Record<LessonType, string> = {
  [LessonType.Lecture]: 'лекция',
  [LessonType.Seminar]: 'семинар',
  [LessonType.Lab]: 'лабораторная работа',
  [LessonType.Credit]: 'зачёт',
  [LessonType.Exam]: 'экзамен',
};

/** Формат даты в предпросмотре: «07 сент». */
export const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
