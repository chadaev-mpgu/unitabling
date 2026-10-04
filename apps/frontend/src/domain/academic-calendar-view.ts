import { dayMonthLong, formatDateLong, monthNameLong } from '@/lib/date.ts';

import {
  addDays,
  calendarWeeks,
  daysBetween,
  isValidISODate,
  isWeekStart,
  parseISODate,
  toISODate,
  type AcademicCalendar,
  type WeekOverride,
} from './academic-calendar.ts';
import type { Color } from './color.ts';

/**
 * Чистая логика экрана академических календарей (UC-1.3, UC-1.4):
 * черновик календаря, недельная разметка, праздники и проверка инвариантов.
 */

/** Черновик календаря: id === null — ещё не сохранённый календарь. */
export interface CalendarDraft {
  id: string | null;
  name: string;
  startDate: string;
  weeks: number;
  defaultPatternId: string;
  overrides: WeekOverride[];
  holidays: string[];
}

/** Поля календаря, нужные статистике; календарь и черновик подходят оба. */
export type CalendarStatsInput = Pick<CalendarDraft, 'weeks' | 'overrides' | 'holidays'>;

export function toCalendarDraft(calendar: AcademicCalendar): CalendarDraft {
  return {
    id: calendar.id,
    name: calendar.name,
    startDate: calendar.startDate,
    weeks: calendar.weeks,
    defaultPatternId: calendar.defaultPatternId,
    overrides: calendar.overrides.map((override) => ({ ...override })),
    holidays: [...calendar.holidays],
  };
}

/** Совпадает ли черновик с сохранённым календарём (для кнопки «Сохранить»). */
export function calendarDraftEquals(draft: CalendarDraft, calendar: AcademicCalendar): boolean {
  if (draft.name.trim() !== calendar.name) return false;
  if (draft.startDate !== calendar.startDate) return false;
  if (draft.weeks !== calendar.weeks) return false;
  if (draft.defaultPatternId !== calendar.defaultPatternId) return false;

  const overridesEqual =
    draft.overrides.length === calendar.overrides.length &&
    draft.overrides.every((override) =>
      calendar.overrides.some(
        (saved) => saved.weekIndex === override.weekIndex && saved.patternId === override.patternId,
      ),
    );
  if (!overridesEqual) return false;

  return (
    draft.holidays.length === calendar.holidays.length &&
    draft.holidays.every((date) => calendar.holidays.includes(date))
  );
}

/** Понедельник первой недели календаря; `weeks` — только положительное. */
export function normalizeCalendarDraft(draft: CalendarDraft): Omit<CalendarDraft, 'id'> {
  const start = parseISODate(draft.startDate);
  const lastDay = addDays(start, Math.max(1, Math.trunc(draft.weeks)) * 7 - 1);

  const overrides = [...draft.overrides]
    .filter((override, position) => {
      if (override.weekIndex < 1 || override.weekIndex > Math.trunc(draft.weeks)) return false;
      return (
        draft.overrides.findIndex((other) => other.weekIndex === override.weekIndex) === position
      );
    })
    .sort((left, right) => left.weekIndex - right.weekIndex);

  const holidays = [...new Set(draft.holidays)]
    .filter((date) => {
      const parsed = parseISODate(date);
      return parsed >= start && parsed <= lastDay;
    })
    .sort();

  return {
    name: draft.name.trim(),
    startDate: draft.startDate,
    weeks: Math.trunc(draft.weeks),
    defaultPatternId: draft.defaultPatternId,
    overrides,
    holidays,
  };
}

/**
 * Проверяет инварианты UC-1.3: название, дата начала (понедельник — от него
 * отсчитываются недели), положительное число недель и шаблон по умолчанию.
 */
export function calendarIssues(draft: CalendarDraft): string[] {
  const issues: string[] = [];

  if (!draft.name.trim()) issues.push('Укажите название календаря');

  if (!draft.startDate) {
    issues.push('Укажите дату начала');
  } else if (!isWeekStart(parseISODate(draft.startDate))) {
    issues.push('Дата начала должна быть понедельником — с него отсчитываются недели');
  }

  if (!Number.isInteger(draft.weeks) || draft.weeks < 1) {
    issues.push('Число недель должно быть целым положительным числом');
  }

  if (!draft.defaultPatternId) issues.push('Выберите шаблон недели по умолчанию');

  return issues;
}

/** Шаблон недели, каким его видит карточка недели. */
export interface CalendarWeekPatternInfo {
  name: string;
  color: Color;
}

/** Неделя календаря для сетки: эффективный шаблон, замены и праздники. */
export interface CalendarWeekView {
  index: number;
  start: Date;
  /** Последний учебный день недели — суббота: воскресенья в модели нет. */
  end: Date;
  /** Эффективный шаблон: override недели или шаблон по умолчанию. */
  patternId: string;
  patternName: string;
  color: Color | null;
  /** На неделю назначена своя замена шаблона. */
  isOverride: boolean;
  /** Праздничные даты, попавшие в эту неделю. */
  holidays: string[];
}

/** Разворачивает недели черновика с эффективным шаблоном и праздниками. */
export function calendarWeekViews(
  draft: Pick<CalendarDraft, 'startDate' | 'weeks' | 'defaultPatternId' | 'overrides' | 'holidays'>,
  patternsById: Map<string, CalendarWeekPatternInfo>,
): CalendarWeekView[] {
  // Пока дата начала пустая или битая, разметку строить не из чего.
  if (!isValidISODate(draft.startDate)) return [];

  const overrideByWeek = new Map(draft.overrides.map((override) => [override.weekIndex, override]));
  const holidaysByWeek = new Map<number, string[]>();
  const start = parseISODate(draft.startDate);

  for (const date of draft.holidays) {
    const offset = daysBetween(start, parseISODate(date));
    if (offset < 0) continue;
    const weekIndex = Math.floor(offset / 7) + 1;
    if (weekIndex > draft.weeks) continue;
    const list = holidaysByWeek.get(weekIndex) ?? [];
    list.push(date);
    holidaysByWeek.set(weekIndex, list);
  }

  return calendarWeeks(draft).map((week) => {
    const override = overrideByWeek.get(week.index);
    const patternId = override?.patternId ?? draft.defaultPatternId;
    const pattern = patternsById.get(patternId);
    return {
      index: week.index,
      start: week.start,
      end: addDays(week.start, 5),
      patternId,
      patternName: pattern?.name ?? 'Шаблон недоступен',
      color: pattern?.color ?? null,
      isOverride: override !== undefined,
      holidays: holidaysByWeek.get(week.index) ?? [],
    };
  });
}

/** Подпись диапазона недели: «7 – 12 октября». */
export function weekRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${monthNameLong(start)}`;
  return `${dayMonthLong(start)} – ${dayMonthLong(end)}`;
}

/** Непрерывный отрезок праздничных дат. */
export interface HolidayRange {
  from: string;
  to: string;
  dates: string[];
}

/** Склеивает подряд идущие даты в отрезки: 11–18 октября — один отрезок. */
export function groupHolidayRanges(dates: string[]): HolidayRange[] {
  const sorted = [...new Set(dates)].sort();
  const ranges: HolidayRange[] = [];

  for (const date of sorted) {
    const previous = ranges[ranges.length - 1];
    if (previous && daysBetween(parseISODate(previous.to), parseISODate(date)) === 1) {
      previous.to = date;
      previous.dates.push(date);
      continue;
    }
    ranges.push({ from: date, to: date, dates: [date] });
  }

  return ranges;
}

/** Подпись отрезка праздников: «11 – 18 октября 2026» или «15 ноября 2026». */
export function holidayRangeLabel(range: HolidayRange): string {
  const from = parseISODate(range.from);
  const to = parseISODate(range.to);
  if (range.dates.length === 1) return formatDateLong(from);

  const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear();
  if (sameMonth) {
    return `${from.getDate()} – ${to.getDate()} ${monthNameLong(to)} ${to.getFullYear()}`;
  }
  return `${dayMonthLong(from)} – ${formatDateLong(to)}`;
}

/** Список праздничных дат между двумя датами включительно. */
export function expandHolidayRange(from: Date, to: Date): string[] {
  const [start, end] = daysBetween(from, to) >= 0 ? [from, to] : [to, from];
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, offset) =>
    toISODate(addDays(start, offset)),
  );
}

/** Праздники черновика, попавшие в диапазон календаря (UC-1.4). */
export function isDateInCalendar(
  draft: Pick<CalendarDraft, 'startDate' | 'weeks'>,
  date: Date,
): boolean {
  const offset = daysBetween(parseISODate(draft.startDate), date);
  return offset >= 0 && offset < draft.weeks * 7;
}

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Подпись сводки: «16 недель · 2 праздника · 2 замены». */
export function formatCalendarStats(input: CalendarStatsInput): string {
  const weeks = plural(input.weeks, 'неделя', 'недели', 'недель');
  const parts = [`${input.weeks} ${weeks}`];

  if (input.holidays.length > 0) {
    parts.push(
      `${input.holidays.length} ${plural(input.holidays.length, 'праздник', 'праздника', 'праздников')}`,
    );
  }
  if (input.overrides.length > 0) {
    parts.push(
      `${input.overrides.length} ${plural(input.overrides.length, 'замена', 'замены', 'замен')}`,
    );
  }

  return parts.join(' · ');
}
