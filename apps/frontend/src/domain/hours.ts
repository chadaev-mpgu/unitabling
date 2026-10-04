import { findDayPatternItem, type DayPatternItem } from './day-pattern.ts';
import { occurrenceEnd, type OccurrenceRule } from './occurrence.ts';
import { weekBounds } from './week.ts';

import type { AcademicCalendar } from './academic-calendar.ts';
import type { Lesson } from './lesson.ts';
import type { TeachingLoad } from './teaching-load.ts';

/**
 * Расчёт часов по вхождениям (docs/data-model/time-mechanics.md):
 * длительность слота переводится в академические часы с округлением вверх,
 * сумма считается только по существующим вхождениям, проведённые — по
 * прошедшим (по timestamp).
 */

/** Академический час — 45 минут: обычная пара = 2 акад. часа, сокращённая = 1. */
const ACADEMIC_HOUR_MINUTES = 45;

const hoursFormat = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

/** Часы пары в академических часах: 90 мин → 2, 45 мин → 1, 50 мин → 2. */
export function slotHours(item: DayPatternItem): number {
  const [startHours, startMinutes] = item.start.split(':').map(Number);
  const [endHours, endMinutes] = item.end.split(':').map(Number);
  const minutes = endHours! * 60 + endMinutes! - (startHours! * 60 + startMinutes!);
  return Math.ceil(minutes / ACADEMIC_HOUR_MINUTES);
}

/** Суммы часов вхождений правила урока. */
export interface RuleHours {
  /** `hoursScheduled`: все существующие вхождения. */
  scheduled: number;
  /** `hoursConducted`: только прошедшие вхождения (окончание раньше `now`). */
  conducted: number;
}

/** Часы вхождений урока: существующие (расставленные) и прошедшие (проведённые). */
export function lessonHours(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  now: Date,
): RuleHours {
  const slot = findDayPatternItem(rule.weekday, rule.slotIndex);
  if (!slot) return { scheduled: 0, conducted: 0 };

  const hours = slotHours(slot);
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  const result: RuleHours = { scheduled: 0, conducted: 0 };
  for (let index = from; index <= to; index++) {
    const end = occurrenceEnd(calendar, rule, index);
    if (!end) continue;
    result.scheduled += hours;
    if (end.getTime() < now.getTime()) result.conducted += hours;
  }
  return result;
}

/** Часы строки нагрузки — производные величины (docs/use-cases/03-teaching-loads.md). */
export interface LoadHours extends RuleHours {
  /** Остаток: `hoursTotal − hoursScheduled`. */
  remaining: number;
}

/** Суммирует часы всех уроков нагрузки. */
export function loadHours(
  load: TeachingLoad,
  lessons: Lesson[],
  calendar: AcademicCalendar,
  now: Date,
): LoadHours {
  const result: LoadHours = { scheduled: 0, conducted: 0, remaining: load.hoursTotal };
  for (const lesson of lessons) {
    if (lesson.teachingLoadId !== load.id) continue;
    const hours = lessonHours(calendar, lesson, now);
    result.scheduled += hours.scheduled;
    result.conducted += hours.conducted;
  }
  result.remaining -= result.scheduled;
  return result;
}

/** Часы для UI: дробная часть — через запятую («13,5»). */
export function formatHours(value: number): string {
  return hoursFormat.format(value);
}

const hoursUnitFormat = new Intl.NumberFormat('ru-RU', {
  style: 'unit',
  unit: 'hour',
  unitDisplay: 'long',
});

/** Часы с подписью и склонением: 32 → «32 часа», 16 → «16 часов». */
export function formatHoursWithUnit(value: number): string {
  return hoursUnitFormat.format(value);
}
