import { LessonType } from '@/domain/lesson.ts';

/** Виды занятия в порядке показа; используется фильтром и формой. */
export const TEACHING_LOAD_TYPE_OPTIONS = [
  LessonType.Lecture,
  LessonType.Seminar,
  LessonType.Lab,
  LessonType.Credit,
  LessonType.Exam,
] as const;

/** Подписи видов занятия в таблице: «Лекция», «Лабораторная работа». */
export const TEACHING_LOAD_TYPE_LABELS: Record<LessonType, string> = {
  [LessonType.Lecture]: 'Лекция',
  [LessonType.Seminar]: 'Семинар',
  [LessonType.Lab]: 'Лабораторная работа',
  [LessonType.Credit]: 'Зачёт',
  [LessonType.Exam]: 'Экзамен',
};

/** Шаг часов нагрузки — 0,5 часа (UC-3.1). */
export const HOURS_STEP = 0.5;
