import { WeekParity, type Weekday, type WeekRange } from './week.ts';

export const enum LessonType {
  Lecture = 'lecture',
  Seminar = 'seminar',
  Lab = 'lab',
  Credit = 'credit',
  Exam = 'exam',
}

/** Занятие — правило: разворачивается во вхождения через академический календарь. */
export interface Lesson {
  id: string;
  /** Проект, которому принадлежит занятие (FK ScheduleProject). */
  projectId: string;
  teachingLoadId: string;
  teacherId: string;
  roomId: string;
  groupIds: string[];
  weekday: Weekday;
  slotIndex: number;
  parity: WeekParity;
  weekRange?: WeekRange;
}

/** Запрос на создание урока: id присваивает сервер. */
export type CreateLessonRequest = Omit<Lesson, 'id'>;

/**
 * Запрос на правку урока: меняются аудитория, преподаватель, парность
 * и диапазон недель; место в сетке и состав групп фиксированы.
 */
export type UpdateLessonRequest = Pick<
  Lesson,
  'id' | 'roomId' | 'teacherId' | 'parity' | 'weekRange'
>;
