import type { DayPattern } from '@/domain/day-pattern.ts';

/**
 * Стартовые шаблоны дня (docs/use-cases/01-layout-and-calendar.md).
 * На оба шаблона ссылаются шаблоны недели (`buildWeekPatterns`), поэтому
 * удалить их нельзя, пока они там используются. Времена пар взяты из макета;
 * сетка расписания пока использует временный доменный хардкод
 * (см. `pages/schedule/constants.ts`) — до подключения WeekPattern.
 */
export function buildDayPatterns(): DayPattern[] {
  return [
    {
      id: 'standard',
      name: 'Стандартный',
      items: [
        { index: 1, start: '08:30', end: '10:00' },
        { index: 2, start: '10:15', end: '11:45' },
        { index: 3, start: '12:00', end: '13:30' },
        { index: 4, start: '14:15', end: '15:45' },
        { index: 5, start: '16:00', end: '17:30' },
        { index: 6, start: '17:45', end: '19:15' },
        { index: 7, start: '19:30', end: '21:00' },
      ],
    },
    {
      id: 'shortened',
      name: 'Сокращённый',
      items: [
        { index: 1, start: '09:00', end: '09:45' },
        { index: 2, start: '10:00', end: '10:45' },
        { index: 3, start: '11:00', end: '11:45' },
      ],
    },
  ];
}
