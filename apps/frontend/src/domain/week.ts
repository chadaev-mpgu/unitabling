export const enum Weekday {
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export const enum WeekParity {
  Above = 'above',
  Below = 'below',
  Both = 'both',
}

/** Половина клетки сетки: Above — верхняя, Below — нижняя. */
export type WeekParitySide = WeekParity.Above | WeekParity.Below;

/** Короткие подписи дней недели: шапка сетки и сообщения о конфликтах. */
export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  [Weekday.Monday]: 'ПН',
  [Weekday.Tuesday]: 'ВТ',
  [Weekday.Wednesday]: 'СР',
  [Weekday.Thursday]: 'ЧТ',
  [Weekday.Friday]: 'ПТ',
  [Weekday.Saturday]: 'СБ',
};

/** Полные подписи дней недели: подсказки и aria-подписи. */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  [Weekday.Monday]: 'Понедельник',
  [Weekday.Tuesday]: 'Вторник',
  [Weekday.Wednesday]: 'Среда',
  [Weekday.Thursday]: 'Четверг',
  [Weekday.Friday]: 'Пятница',
  [Weekday.Saturday]: 'Суббота',
};

export interface WeekRange {
  from: number;
  to: number;
}

/** Above — нечётные недели, Below — чётные, Both — все. */
export function parityMatches(parity: WeekParity, weekIndex: number): boolean {
  if (parity === WeekParity.Above) return weekIndex % 2 === 1;
  if (parity === WeekParity.Below) return weekIndex % 2 === 0;
  return true;
}

/** Границы диапазона недель: отсутствие диапазона — все недели календаря. */
export function weekBounds(
  range: WeekRange | undefined,
  weekCount: number,
): { from: number; to: number } {
  return {
    from: Math.max(1, range?.from ?? 1),
    to: Math.min(range?.to ?? weekCount, weekCount),
  };
}

/**
 * Пара недель, содержащая неделю: 1–2, 3–4, … Нечётная неделя — верхняя
 * половина клетки. Последняя пара при нечётном числе недель — одна неделя.
 */
export function periodOfWeek(weekIndex: number, weekCount: number): WeekRange {
  const index = Math.min(Math.max(1, weekIndex), Math.max(1, weekCount));
  const from = index - ((index - 1) % 2);
  return { from, to: Math.min(from + 1, weekCount) };
}

/** Неделя половины периода: Above — нечётная (`from`), Below — чётная (`to`). */
export function periodWeek(period: WeekRange, parity: WeekParitySide): number {
  return parity === WeekParity.Above ? period.from : period.to;
}

/** Парности половин клетки, которые встречаются в неделях периода. */
export function periodParities(period: WeekRange): WeekParitySide[] {
  const parities: WeekParitySide[] = [];
  for (let index = period.from; index <= period.to; index++) {
    const parity = index % 2 === 1 ? WeekParity.Above : WeekParity.Below;
    if (!parities.includes(parity)) parities.push(parity);
  }
  return parities;
}
