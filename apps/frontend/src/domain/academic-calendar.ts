import type { Weekday } from './week.ts';

/** Академический календарь — глобальная сущность (docs/data-model/global-entities.md). */
export interface AcademicCalendar {
  id: string;
  name: string;
  /** Первый день первой недели, "YYYY-MM-DD". */
  startDate: string;
  /** Число недель; номера недель — с 1. */
  weeks: number;
  defaultPatternId: string;
  overrides: WeekOverride[];
  /** Праздничные даты "YYYY-MM-DD": вхождений в эти дни не существует. */
  holidays: string[];
}

/** Замена шаблона недели на конкретную неделю календаря. */
export interface WeekOverride {
  weekIndex: number;
  patternId: string;
}

/** Неделя календаря: `start` — понедельник, `end` — воскресенье. */
export interface CalendarWeek {
  index: number;
  start: Date;
  end: Date;
}

/** Разбирает "YYYY-MM-DD" в локальную дату, не сдвигая её часовым поясом. */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

/** Форматирует локальную дату как "YYYY-MM-DD". */
export function toISODate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Корректная дата "YYYY-MM-DD"; пустое или битое значение — false. */
export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseISODate(value).getTime());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Число дней между двумя датами: разница локальных полуночей. */
export function daysBetween(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * Понедельник — первый день недели календаря: формула
 * `startDate + (k − 1) × 7 + (weekday − 1)` (docs/data-model/time-mechanics.md)
 * отсчитывает недели от понедельника.
 */
export function isWeekStart(date: Date): boolean {
  return date.getDay() === 1;
}

/** Период календаря; `AcademicCalendar` структурно ему соответствует. */
export interface CalendarPeriod {
  startDate: string;
  weeks: number;
}

/** Недели календаря по порядку — для выбора диапазона недель. */
export function calendarWeeks(period: CalendarPeriod): CalendarWeek[] {
  const start = parseISODate(period.startDate);
  return Array.from({ length: Math.max(0, Math.trunc(period.weeks)) }, (_, offset) => {
    const weekStart = addDays(start, offset * 7);
    return { index: offset + 1, start: weekStart, end: addDays(weekStart, 6) };
  });
}

/** Дата дня `weekday` недели `weekIndex`: startDate + (k − 1) × 7 + (weekday − 1). */
export function weekdayDate(calendar: AcademicCalendar, weekIndex: number, weekday: Weekday): Date {
  return addDays(parseISODate(calendar.startDate), (weekIndex - 1) * 7 + (weekday - 1));
}

/**
 * Номер недели календаря, содержащей дату; `null` — дата вне календаря.
 * Считается разницей локальных полуночей: у `CalendarWeek.end` — воскресенье
 * 00:00, поэтому сравнение с ним промахивается в воскресенье днём.
 */
export function weekIndexByDate(calendar: AcademicCalendar, date: Date): number | null {
  const start = parseISODate(calendar.startDate);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  if (offset < 0) return null;
  const index = Math.floor(offset / 7) + 1;
  return index <= calendar.weeks ? index : null;
}

export function isHoliday(calendar: AcademicCalendar, date: Date): boolean {
  return calendar.holidays.includes(toISODate(date));
}
