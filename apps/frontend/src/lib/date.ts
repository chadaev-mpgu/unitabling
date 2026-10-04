/** Общие утилиты дат для календарных виджетов. */

const dayMonthFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
const dayMonthLongFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dayMonthYearLongFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const dayMonthNumericFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
});

/** Приводит Date | string к Date; null — значение пустое или некорректное. */
export function toDate(value: Date | string | undefined): Date | null {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Intl даёт название месяца в родительном падеже только в паре с числом. */
export function monthName(date: Date): string {
  return dayMonthFormat.formatToParts(date).find((part) => part.type === 'month')?.value ?? '';
}

/** Полное название месяца в родительном падеже: «октября». */
export function monthNameLong(date: Date): string {
  return dayMonthLongFormat.formatToParts(date).find((part) => part.type === 'month')?.value ?? '';
}

/** День и месяц: «15 ноября». */
export function dayMonthLong(date: Date): string {
  return dayMonthLongFormat.format(date);
}

/** Полная дата: «15 ноября 2026». */
export function formatDateLong(date: Date): string {
  return dayMonthYearLongFormat.format(date).replace(/\s*г\.$/, '');
}

/** Короткая числовая дата: «05.10». */
export function dayMonthNumeric(date: Date): string {
  return dayMonthNumericFormat.format(date);
}

/** Подпись периода недели: «7 – 14 Окт» или «28 Ноя – 5 Дек». */
export function weekRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${monthName(start)}`;

  const endYear = start.getFullYear() === end.getFullYear() ? '' : ` ${end.getFullYear()}`;
  return `${start.getDate()} ${monthName(start)} – ${end.getDate()} ${monthName(end)}${endYear}`;
}

/** Начало недели (00:00) для даты; weekStartsOn: 0 — воскресенье, 1 — понедельник. */
export function startOfWeek(date: Date, weekStartsOn: number): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
