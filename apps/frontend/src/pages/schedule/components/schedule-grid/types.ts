import type { ScheduleLesson } from '@/domain/schedule-view.ts';
import type { Weekday, WeekParitySide } from '@/domain/week.ts';

/** День недели — колонка таблицы. */
export interface ScheduleDay {
  /** Ключ, по которому занятие привязывается к дню. */
  key: Weekday;
  /** Подпись в шапке, например «ПН». */
  label: string;
  /** Даты недель периода: above — нечётная неделя, below — чётная. */
  dates?: { above?: Date; below?: Date };
}

/** Пара — строка таблицы. */
export interface ScheduleSlot {
  /** Ключ, по которому занятие привязывается к строке. */
  id: string | number;
  /** Номер пары, который показывается крупно. */
  number: number;
  /**
   * Время проведения. Строк может быть несколько: например, первая пара в
   * субботу идёт по отдельному расписанию и показывается второй строкой.
   */
  times: string[];
}

/** Ключ ячейки «день × пара», по которому занятия раскладываются по сетке. */
export function scheduleCellKey(day: Weekday, slotId: string | number): string {
  return `${day}:${slotId}`;
}

/** MIME-тип payload drag-and-drop карточек нагрузки. */
export const SCHEDULE_LOAD_DND_TYPE = 'application/x-schedule-load';

/** True, если это drag нашего payload нагрузки (а не, например, файла). */
export function isScheduleLoadDrag(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes(SCHEDULE_LOAD_DND_TYPE) ?? false;
}

/**
 * Payload события переноса карточки нагрузки в ячейку «день × пара».
 * Передаём id, а не снимок: нагрузка резолвится из стора и остаётся реактивной.
 */
export interface ScheduleLoadDrop {
  day: ScheduleDay;
  slot: ScheduleSlot;
  loadId: string;
  /** Половина клетки; не задана — бросили в пустую клетку целиком. */
  parity?: WeekParitySide;
}

/** Клик по карточке занятия в клетке «день × пара». */
export interface ScheduleLessonClick {
  day: ScheduleDay;
  slot: ScheduleSlot;
  lesson: ScheduleLesson;
}

/** Клик по «+» в свободной позиции клетки. */
export interface ScheduleSlotClick {
  day: ScheduleDay;
  slot: ScheduleSlot;
  /** Половина клетки; не задана — свободна вся клетка. */
  parity?: WeekParitySide;
}

/**
 * Клетка, к которой ведёт переход из панели конфликтов: сетка
 * прокручивает её в зону видимости и подсвечивает на пару секунд.
 */
export interface ScheduleCellFocus {
  /** День недели — колонка клетки. */
  day: Weekday;
  /** Ключ пары (`ScheduleSlot.id`) — строка клетки. */
  slotId: string | number;
}
