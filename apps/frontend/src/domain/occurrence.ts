import { isHoliday, weekdayDate, type AcademicCalendar } from './academic-calendar.ts';
import { findDayPatternItem } from './day-pattern.ts';
import { parityMatches, periodWeek, weekBounds, WeekParity } from './week.ts';

import type { Lesson } from './lesson.ts';
import type { WeekParitySide, Weekday, WeekRange } from './week.ts';

/** Правило занятия: достаточно полей урока или черновика. */
export interface OccurrenceRule {
  weekday: Weekday;
  slotIndex: number;
  parity: WeekParity;
  weekRange?: WeekRange;
}

/** Локальный момент "HH:MM" на дату — без сдвига часовым поясом. */
function dateTimeAt(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

/**
 * Момент окончания вхождения недели `weekIndex`; null — вхождения нет:
 * не совпала парность, в шаблоне дня недели нет такой пары или дата —
 * праздник (docs/data-model/time-mechanics.md).
 */
export function occurrenceEnd(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  weekIndex: number,
): Date | null {
  if (!parityMatches(rule.parity, weekIndex)) return null;
  const date = weekdayDate(calendar, weekIndex, rule.weekday);
  if (isHoliday(calendar, date)) return null;
  const slot = findDayPatternItem(rule.weekday, rule.slotIndex);
  if (!slot) return null;
  return dateTimeAt(date, slot.end);
}

/**
 * Недели календаря, в которых у правила есть вхождения: совпала парность,
 * в шаблоне дня недели есть пара и дата — не праздник.
 */
export function occurrenceWeeks(calendar: AcademicCalendar, rule: OccurrenceRule): number[] {
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  const weeks: number[] = [];
  for (let index = from; index <= to; index++) {
    if (occurrenceEnd(calendar, rule, index)) weeks.push(index);
  }
  return weeks;
}

/** Недели диапазона, вхождения которых уже прошли; `end == now` — ещё нет. */
export function pastWeeks(calendar: AcademicCalendar, rule: OccurrenceRule, now: Date): number[] {
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  const weeks: number[] = [];
  for (let index = from; index <= to; index++) {
    const end = occurrenceEnd(calendar, rule, index);
    if (end && end.getTime() < now.getTime()) weeks.push(index);
  }
  return weeks;
}

/** Последняя неделя с прошедшим вхождением; null — прошедших вхождений нет. */
export function lastPastWeek(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  now: Date,
): number | null {
  return pastWeeks(calendar, rule, now).at(-1) ?? null;
}

/** Есть ли у правила прошедшие вхождения — история, недоступная правке. */
export function hasPastOccurrences(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  now: Date,
): boolean {
  return pastWeeks(calendar, rule, now).length > 0;
}

/** Все существующие вхождения правила уже прошли: урок целиком история. */
export function isFullyPast(calendar: AcademicCalendar, rule: OccurrenceRule, now: Date): boolean {
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  let total = 0;
  let past = 0;
  for (let index = from; index <= to; index++) {
    const end = occurrenceEnd(calendar, rule, index);
    if (!end) continue;
    total++;
    if (end.getTime() < now.getTime()) past++;
  }
  return total > 0 && total === past;
}

/** Есть ли в диапазоне хотя бы одно существующее вхождение. */
export function hasOccurrencesInRange(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  range: WeekRange,
): boolean {
  for (let index = range.from; index <= range.to; index++) {
    if (occurrenceEnd(calendar, rule, index)) return true;
  }
  return false;
}

/**
 * Первая неделя, пара которой ещё не прошла по времени: началом диапазона
 * при создании/правке не может быть неделя, чьё вхождение уже состоялось.
 * Считается по datetime слота на дату недели (парность/праздник не важны:
 * прошедший день закрыт целиком). null — подходящих недель нет.
 */
export function firstFutureWeek(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  now: Date,
): number | null {
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  const slot = findDayPatternItem(rule.weekday, rule.slotIndex);
  if (!slot) return null;

  for (let index = from; index <= to; index++) {
    const end = dateTimeAt(weekdayDate(calendar, index, rule.weekday), slot.end);
    if (end.getTime() >= now.getTime()) return index;
  }
  return null;
}

/** Результат дробления частично прошедшего урока. */
export interface LessonSplit {
  /** Прошедшая часть: исходный id, диапазон до последней прошедшей недели. */
  fixed: Lesson;
  /** Будущая часть без id; null — в остатке нет вхождений. */
  remainder: Omit<Lesson, 'id'> | null;
}

/**
 * Дробит частично прошедший урок (docs/data-model/time-mechanics.md):
 * прошедшая часть фиксируется, будущая уходит в новый урок. Идемпотентно;
 * null — дробить нечего (K == to или прошедших вхождений нет).
 * Остаток создаётся только при наличии вхождений: правило без вхождений
 * занимало бы половины будущих периодов, не показывая карточку.
 */
export function splitLesson(
  lesson: Lesson,
  calendar: AcademicCalendar,
  now: Date,
): LessonSplit | null {
  const { from, to } = weekBounds(lesson.weekRange, calendar.weeks);
  const boundary = lastPastWeek(calendar, lesson, now);
  if (boundary === null || boundary >= to) return null;

  const fixed: Lesson = { ...lesson, weekRange: { from, to: boundary } };
  const remainderRange: WeekRange = { from: boundary + 1, to };
  if (!hasOccurrencesInRange(calendar, lesson, remainderRange)) return { fixed, remainder: null };

  return {
    fixed,
    remainder: {
      projectId: lesson.projectId,
      teachingLoadId: lesson.teachingLoadId,
      teacherId: lesson.teacherId,
      roomId: lesson.roomId,
      groupIds: lesson.groupIds,
      weekday: lesson.weekday,
      slotIndex: lesson.slotIndex,
      parity: lesson.parity,
      weekRange: remainderRange,
    },
  };
}

/**
 * Парности половин периода, даты которых уже прошли: верхняя половина —
 * неделя `period.from`, нижняя — `period.to`. Граница — datetime слота на
 * дату половины, поэтому прошедший праздничный день тоже закрыт: ставить
 * занятие в прошедшую дату нельзя, даже если вхождения там не было
 * (docs/use-cases/04-scheduling.md, UC-4.1). Прошедшая половина закрыта,
 * а половина будущей недели пары остаётся доступной.
 */
export function pastPeriodParities(
  calendar: AcademicCalendar,
  period: WeekRange,
  weekday: Weekday,
  slotIndex: number,
  now: Date,
): WeekParitySide[] {
  const slot = findDayPatternItem(weekday, slotIndex);
  if (!slot) return [];

  const past: WeekParitySide[] = [];
  for (const parity of [WeekParity.Above, WeekParity.Below] as WeekParitySide[]) {
    const date = weekdayDate(calendar, periodWeek(period, parity), weekday);
    const end = dateTimeAt(date, slot.end);
    if (end.getTime() < now.getTime()) past.push(parity);
  }
  return past;
}

/**
 * Фактическая парность урока в периоде: в каких неделях пары вхождения
 * реально существуют. `Both` — урок проходит в обеих неделях пары; null —
 * вхождений в периоде нет. Для отрисовки: в сетке занятие показывается
 * в половине недели, где оно действительно будет проходить.
 */
export function lessonPeriodParity(
  calendar: AcademicCalendar,
  rule: OccurrenceRule,
  period: WeekRange,
): WeekParity | null {
  const { from, to } = weekBounds(rule.weekRange, calendar.weeks);
  const occurs = (weekIndex: number) =>
    weekIndex >= from && weekIndex <= to && occurrenceEnd(calendar, rule, weekIndex) !== null;

  const above = occurs(period.from);
  const below = period.to !== period.from && occurs(period.to);
  if (above && below) return WeekParity.Both;
  if (above) return WeekParity.Above;
  if (below) return WeekParity.Below;
  return null;
}
