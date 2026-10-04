import { Color } from '@/domain/color.ts';
import { Weekday } from '@/domain/week.ts';
import {
  emptyWeekPatternDays,
  type WeekPattern,
  type WeekPatternDay,
} from '@/domain/week-pattern.ts';

/** Дни шаблона недели: учебные дни — из карты, остальные — выходные. */
function buildDays(templateByWeekday: Partial<Record<Weekday, string>>): WeekPatternDay[] {
  return emptyWeekPatternDays().map((day) => ({
    ...day,
    templateId: templateByWeekday[day.weekday] ?? null,
  }));
}

/**
 * Стартовые шаблоны недели (docs/use-cases/01-layout-and-calendar.md).
 * Ссылаются на шаблоны дня `standard` и `shortened`; id `standard-week`
 * совпадает с `defaultPatternId` академического календаря, поэтому
 * «Стандартную» нельзя удалить.
 */
export function buildWeekPatterns(): WeekPattern[] {
  return [
    {
      id: 'standard-week',
      name: 'Стандартная',
      color: Color.Green,
      days: buildDays({
        [Weekday.Monday]: 'standard',
        [Weekday.Tuesday]: 'standard',
        [Weekday.Wednesday]: 'standard',
        [Weekday.Thursday]: 'standard',
        [Weekday.Friday]: 'standard',
        [Weekday.Saturday]: 'shortened',
      }),
    },
    {
      id: 'shortened-week',
      name: 'Сокращённая',
      color: Color.Violet,
      days: buildDays({
        [Weekday.Monday]: 'standard',
        [Weekday.Tuesday]: 'standard',
        [Weekday.Wednesday]: 'standard',
      }),
    },
  ];
}
