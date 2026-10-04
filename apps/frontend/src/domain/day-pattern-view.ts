import type { DayPattern, DayPatternItem } from './day-pattern.ts';

/**
 * Чистая логика экрана шаблонов дня (UC-1.1): разбор времени, сводки,
 * перерывы, проверка инвариантов и работа с черновиком шаблона.
 */

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** "HH:MM" → минуты от полуночи; null — строка не является временем. */
export function parseTime(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Минуты от полуночи → "HH:MM". */
export function formatTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Длительность в минутах: «1 ч 30 мин», «45 мин», «2 ч». */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Сводка шаблона для списка: число пар и суммарная длительность. */
export interface DayPatternStats {
  count: number;
  minutes: number;
}

/** Считает только корректные пары — черновик может быть невалидным. */
export function dayPatternStats(items: DayPatternItem[]): DayPatternStats {
  let minutes = 0;
  for (const item of items) {
    const start = parseTime(item.start);
    const end = parseTime(item.end);
    if (start !== null && end !== null && end > start) minutes += end - start;
  }
  return { count: items.length, minutes };
}

/** Подпись сводки: «7 пар · 10 ч 30 мин». */
export function formatDayPatternStats(stats: DayPatternStats): string {
  const pairs = plural(stats.count, 'пара', 'пары', 'пар');
  return `${stats.count} ${pairs} · ${formatDuration(stats.minutes)}`;
}

/**
 * Пауза между соседними парами в минутах; null — время некорректно,
 * ≤ 0 — пары вплотную или с перекрытием.
 */
export function breakMinutes(prev: DayPatternItem, next: DayPatternItem): number | null {
  const prevEnd = parseTime(prev.end);
  const nextStart = parseTime(next.start);
  if (prevEnd === null || nextStart === null) return null;
  return nextStart - prevEnd;
}

/** Ошибка черновика: номер пары (с 1) или null — общая. */
export interface DayPatternIssue {
  itemIndex: number | null;
  message: string;
}

/**
 * Проверяет инварианты UC-1.1: время в формате «HH:MM», окончание позже
 * начала, пары не пересекаются по времени.
 */
export function dayPatternIssues(items: DayPatternItem[]): DayPatternIssue[] {
  const issues: DayPatternIssue[] = [];
  const bounds: { index: number; start: number; end: number }[] = [];

  items.forEach((item, position) => {
    const index = position + 1;
    const start = parseTime(item.start);
    const end = parseTime(item.end);
    if (start === null) issues.push({ itemIndex: index, message: 'Некорректное время начала' });
    if (end === null) issues.push({ itemIndex: index, message: 'Некорректное время окончания' });
    if (start !== null && end !== null) {
      if (end <= start) {
        issues.push({ itemIndex: index, message: 'Окончание должно быть позже начала' });
      } else {
        bounds.push({ index, start, end });
      }
    }
  });

  const sorted = [...bounds].sort(
    (left, right) => left.start - right.start || left.end - right.end,
  );
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const next = sorted[i]!;
    if (next.start < prev.end) {
      issues.push({
        itemIndex: next.index,
        message: `Пары №${prev.index} и №${next.index} пересекаются`,
      });
    }
  }
  return issues;
}

/** Порядок пар по времени начала и последовательные номера — инвариант UC-1.1. */
export function sortDayPatternItems(items: DayPatternItem[]): DayPatternItem[] {
  return [...items]
    .sort(
      (left, right) =>
        (parseTime(left.start) ?? 0) - (parseTime(right.start) ?? 0) ||
        (parseTime(left.end) ?? 0) - (parseTime(right.end) ?? 0),
    )
    .map((item, position) => ({ ...item, index: position + 1 }));
}

/**
 * Приводит время к каноническому 24-часовому виду «ЧЧ:ММ», сортирует пары
 * и перенумеровывает их — перед сохранением.
 */
export function normalizeDayPatternItems(items: DayPatternItem[]): DayPatternItem[] {
  return sortDayPatternItems(items).map((item) => {
    const start = parseTime(item.start);
    const end = parseTime(item.end);
    return {
      ...item,
      start: start === null ? item.start : formatTime(start),
      end: end === null ? item.end : formatTime(end),
    };
  });
}

/** Последовательные номера без изменения порядка — после добавления/удаления. */
export function reindexDayPatternItems(items: DayPatternItem[]): DayPatternItem[] {
  return items.map((item, position) => ({ ...item, index: position + 1 }));
}

/** Новая пара после последней: перерыв 15 мин, длительность 90 мин. */
export function nextDayPatternItem(items: DayPatternItem[]): DayPatternItem {
  const lastEnd = items.length ? parseTime(items.at(-1)!.end) : null;
  const start = lastEnd !== null ? Math.min(lastEnd + 15, 23 * 60) : 8 * 60 + 30;
  const end = Math.min(start + 90, 23 * 60 + 59);
  return { index: items.length + 1, start: formatTime(start), end: formatTime(end) };
}

/** Черновик шаблона: id === null — ещё не сохранённый шаблон. */
export interface DayPatternDraft {
  id: string | null;
  name: string;
  items: DayPatternItem[];
}

export function toDayPatternDraft(pattern: DayPattern): DayPatternDraft {
  return { id: pattern.id, name: pattern.name, items: pattern.items.map((item) => ({ ...item })) };
}

/** Совпадает ли черновик с сохранённым шаблоном (для кнопки «Сохранить»). */
export function dayPatternDraftEquals(draft: DayPatternDraft, pattern: DayPattern): boolean {
  if (draft.name.trim() !== pattern.name) return false;
  if (draft.items.length !== pattern.items.length) return false;
  return draft.items.every((item, position) => {
    const other = pattern.items[position];
    return (
      other !== undefined &&
      item.index === other.index &&
      item.start === other.start &&
      item.end === other.end
    );
  });
}
