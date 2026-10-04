import type { WeekParity, WeekParitySide } from '@/domain/week.ts';
import type { ScheduleDay, ScheduleSlot } from '@/pages/schedule/components/schedule-grid';

/** Контекст открытия диалога занятия: создание из дропа или правка урока. */
export type LessonDialogContext = CreateLessonContext | EditLessonContext;

/** Создание: клетка, в которую бросили карточку нагрузки. */
export interface CreateLessonContext {
  kind: 'create';
  day: ScheduleDay;
  slot: ScheduleSlot;
  /** id строки нагрузки: сама нагрузка резолвится из стора. */
  loadId: string;
  /** Половина клетки, в которую бросили нагрузку; не задана — пустая клетка. */
  parity?: WeekParitySide;
  /** Аудитория по умолчанию: подставляется в виде по аудитории. */
  roomId?: string;
}

/** Правка: урок, по карточке которого кликнули в сетке. */
export interface EditLessonContext {
  kind: 'edit';
  day: ScheduleDay;
  slot: ScheduleSlot;
  /** id урока: сам урок резолвится из стора. */
  lessonId: string;
}

/** Черновик формы диалога занятия. */
export interface LessonFormValues {
  roomId: string;
  teacherId: string;
  parity: WeekParity;
  /** Первая неделя диапазона; отсутствие диапазона = все недели. */
  weekFrom: number;
  /** Последняя неделя диапазона, включительно. */
  weekTo: number;
}
