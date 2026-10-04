import type { LessonType } from '@/domain/lesson.ts';

/** Что открыто: создание, правка преподавателя, удаление или разбор потока. */
export type TeachingLoadDialogContext =
  | { kind: 'create' }
  | { kind: 'edit'; loadId: string }
  | { kind: 'delete'; loadId: string }
  | { kind: 'split'; loadId: string };

/** Значения формы строки нагрузки. */
export interface TeachingLoadFormValues {
  disciplineId: string;
  /** Группа создания; у потока в правке берётся первая. */
  groupId: string;
  lessonType: LessonType;
  hoursTotal: number;
  /** Преподаватель или sentinel «не назначен». */
  teacherId: string;
}
