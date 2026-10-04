import { Weekday } from './week.ts';

/** Шаблон дня — глобальная сущность (docs/data-model/global-entities.md). */
export interface DayPattern {
  id: string;
  name: string;
  items: DayPatternItem[];
}

/** Пара в шаблоне дня: номер с 1, начало/окончание — "HH:MM". */
export interface DayPatternItem {
  index: number;
  start: string;
  end: string;
}

const STANDARD_ITEMS: DayPatternItem[] = [
  { index: 1, start: '08:30', end: '10:00' },
  { index: 2, start: '10:10', end: '11:40' },
  { index: 3, start: '12:10', end: '13:40' },
  { index: 4, start: '12:10', end: '13:40' },
  { index: 5, start: '12:10', end: '13:40' },
  { index: 6, start: '14:00', end: '15:30' },
];

/**
 * Временная разметка дня: экран DayPattern и WeekPattern ещё не подключены
 * к сетке, времена совпадают с подписями `SCHEDULE_SLOTS`.
 * TODO: брать шаблон из WeekPattern и overrides календаря.
 */
export const STANDARD_DAY_PATTERN: DayPattern = {
  id: 'standard',
  name: 'Стандартный',
  items: STANDARD_ITEMS,
};

/** Суббота идёт по отдельному расписанию: первая пара короче. */
export const SATURDAY_DAY_PATTERN: DayPattern = {
  id: 'saturday',
  name: 'Суббота',
  items: [{ index: 1, start: '09:00', end: '09:45' }, ...STANDARD_ITEMS.slice(1)],
};

/** Шаблон дня недели; TODO: заменить расчётом по WeekPattern/календарю. */
export function dayPatternFor(weekday: Weekday): DayPattern {
  return weekday === Weekday.Saturday ? SATURDAY_DAY_PATTERN : STANDARD_DAY_PATTERN;
}

/** Пара с номером `slotIndex` в шаблоне дня недели; undefined — пары нет. */
export function findDayPatternItem(
  weekday: Weekday,
  slotIndex: number,
): DayPatternItem | undefined {
  return dayPatternFor(weekday).items.find(({ index }) => index === slotIndex);
}
