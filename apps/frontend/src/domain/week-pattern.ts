import type { Color } from './color.ts';
import { Weekday } from './week.ts';

/** Шаблон недели — глобальная сущность (docs/data-model/global-entities.md). */
export interface WeekPattern {
  id: string;
  name: string;
  /** Ровно 6 дней: понедельник–суббота; воскресенья в модели нет. */
  days: WeekPatternDay[];
  color: Color;
}

/** День шаблона недели: `templateId` — шаблон дня, null — выходной. */
export interface WeekPatternDay {
  weekday: Weekday;
  templateId: string | null;
}

/** Дни шаблона недели в порядке показа: ПН–СБ (UC-1.2). */
export const WEEK_PATTERN_WEEKDAYS: readonly Weekday[] = [
  Weekday.Monday,
  Weekday.Tuesday,
  Weekday.Wednesday,
  Weekday.Thursday,
  Weekday.Friday,
  Weekday.Saturday,
];

/** Шесть дней шаблона недели, все — выходные. */
export function emptyWeekPatternDays(): WeekPatternDay[] {
  return WEEK_PATTERN_WEEKDAYS.map((weekday) => ({ weekday, templateId: null }));
}
