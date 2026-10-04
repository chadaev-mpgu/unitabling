import {
  findDayPatternItem,
  STANDARD_DAY_PATTERN,
  type DayPatternItem,
} from '@/domain/day-pattern.ts';
import { WEEKDAY_SHORT_LABELS, Weekday } from '@/domain/week.ts';

import type { ScheduleDay, ScheduleSlot } from './components/schedule-grid';

/**
 * Пока разметка дня и недели (UC-1.1/UC-1.2) не реализована, сетка
 * использует общий хардкод: шесть дней и один шаблон дня для всех дней.
 * Времена пар берутся из временного `STANDARD_DAY_PATTERN` (domain),
 * подписи форматируются здесь. После появления WeekPattern/DayPattern
 * эти константы заменятся расчётом из академического календаря.
 */

export const SCHEDULE_DAYS: ScheduleDay[] = [
  { key: Weekday.Monday, label: WEEKDAY_SHORT_LABELS[Weekday.Monday] },
  { key: Weekday.Tuesday, label: WEEKDAY_SHORT_LABELS[Weekday.Tuesday] },
  { key: Weekday.Wednesday, label: WEEKDAY_SHORT_LABELS[Weekday.Wednesday] },
  { key: Weekday.Thursday, label: WEEKDAY_SHORT_LABELS[Weekday.Thursday] },
  { key: Weekday.Friday, label: WEEKDAY_SHORT_LABELS[Weekday.Friday] },
  { key: Weekday.Saturday, label: WEEKDAY_SHORT_LABELS[Weekday.Saturday] },
];

/** Подпись времени пары: «08:30–10:00». */
function slotTimeLabel(item: DayPatternItem): string {
  return `${item.start}–${item.end}`;
}

export const SCHEDULE_SLOTS: ScheduleSlot[] = STANDARD_DAY_PATTERN.items.map((item) => {
  const times = [slotTimeLabel(item)];
  // Суббота идёт по отдельному расписанию — показываем отдельной строкой.
  const saturday = findDayPatternItem(Weekday.Saturday, item.index);
  if (saturday && slotTimeLabel(saturday) !== times[0]) times.push(`СБ ${slotTimeLabel(saturday)}`);
  return { id: item.index, number: item.index, times };
});
