import type { Color } from './color.ts';
import { Weekday, WEEKDAY_SHORT_LABELS } from './week.ts';
import { WEEK_PATTERN_WEEKDAYS, type WeekPattern, type WeekPatternDay } from './week-pattern.ts';

/**
 * Чистая логика экрана шаблонов недели (UC-1.2): сводки, проверка инвариантов
 * и работа с черновиком шаблона недели.
 */

/** Черновик шаблона недели: id === null — ещё не сохранённый шаблон. */
export interface WeekPatternDraft {
  id: string | null;
  name: string;
  color: Color;
  days: WeekPatternDay[];
}

export function toWeekPatternDraft(pattern: WeekPattern): WeekPatternDraft {
  return {
    id: pattern.id,
    name: pattern.name,
    color: pattern.color,
    days: pattern.days.map((day) => ({ ...day })),
  };
}

/** Совпадает ли черновик с сохранённым шаблоном (для кнопки «Сохранить»). */
export function weekPatternDraftEquals(draft: WeekPatternDraft, pattern: WeekPattern): boolean {
  if (draft.name.trim() !== pattern.name) return false;
  if (draft.color !== pattern.color) return false;
  if (draft.days.length !== pattern.days.length) return false;
  return draft.days.every((day, position) => {
    const other = pattern.days[position];
    return (
      other !== undefined && day.weekday === other.weekday && day.templateId === other.templateId
    );
  });
}

/**
 * Приводит дни к инварианту UC-1.2: ровно 6 дней ПН–СБ в порядке модели,
 * без дублей. Лишние дни отбрасываются, отсутствующие становятся выходными.
 */
export function normalizeWeekPatternDays(days: WeekPatternDay[]): WeekPatternDay[] {
  const templateByWeekday = new Map<Weekday, string | null>();
  for (const day of days) templateByWeekday.set(day.weekday, day.templateId);
  return WEEK_PATTERN_WEEKDAYS.map((weekday) => ({
    weekday,
    templateId: templateByWeekday.get(weekday) ?? null,
  }));
}

/** Ошибка черновика: конкретный день недели или null — общая. */
export interface WeekPatternIssue {
  weekday: Weekday | null;
  message: string;
}

/** Проверяет инварианты UC-1.2: 6 дней ПН–СБ, каждый ровно один раз. */
export function weekPatternIssues(days: WeekPatternDay[]): WeekPatternIssue[] {
  const issues: WeekPatternIssue[] = [];
  const seen = new Set<Weekday>();

  for (const day of days) {
    if (seen.has(day.weekday)) {
      issues.push({
        weekday: day.weekday,
        message: `День ${WEEKDAY_SHORT_LABELS[day.weekday]} указан дважды`,
      });
    }
    seen.add(day.weekday);
  }

  for (const weekday of WEEK_PATTERN_WEEKDAYS) {
    if (!seen.has(weekday)) {
      issues.push({
        weekday,
        message: `День ${WEEKDAY_SHORT_LABELS[weekday]} отсутствует`,
      });
    }
  }

  return issues;
}

/** Сводка шаблона: число учебных дней и число использований в календаре. */
export interface WeekPatternStats {
  days: number;
  usages: number;
}

/** Учебный день — день с назначенным шаблоном дня (не выходной). */
export function weekPatternStats(days: WeekPatternDay[], usages: number): WeekPatternStats {
  return { days: days.filter((day) => day.templateId !== null).length, usages };
}

/** Русское склонение существительного после числа. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Подпись сводки: «6 дней · 2 использования». */
export function formatWeekPatternStats(stats: WeekPatternStats): string {
  const days = plural(stats.days, 'день', 'дня', 'дней');
  const usages = plural(stats.usages, 'использование', 'использования', 'использований');
  return `${stats.days} ${days} · ${stats.usages} ${usages}`;
}
