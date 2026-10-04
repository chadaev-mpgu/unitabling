import type { LessonType } from './lesson.ts';

export interface TeachingLoad {
  id: string;
  /** Проект, которому принадлежит строка (FK ScheduleProject). */
  projectId: string;
  disciplineId: string;
  teacherId?: string;
  groupIds: string[];
  lessonType: LessonType;
  hoursTotal: number;
}

/** Запрос на создание строки нагрузки: id присваивает «сервер». */
export type CreateTeachingLoadRequest = Omit<TeachingLoad, 'id'>;

/**
 * Поток — НЕ отдельная сущность, а строка нагрузки с несколькими группами,
 * создаваемая слиянием per-group строк (docs/use-cases/05-flows.md).
 */
export function isStream(load: TeachingLoad): boolean {
  return load.groupIds.length > 1;
}
