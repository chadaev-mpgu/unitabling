import type { AcademicCalendar } from '@/domain/academic-calendar.ts';

/**
 * Стартовые академические календари (docs/use-cases/01-layout-and-calendar.md):
 * семестр очной формы и короткая сессия заочной. Учебная нагрузка и расписание
 * читают первый календарь (календарь по умолчанию), заочный — демонстрация
 * второй разметки. `defaultPatternId` и overrides ссылаются на шаблоны недели,
 * а не дня.
 */
export function buildCalendars(): AcademicCalendar[] {
  return [
    {
      id: 'test-calendar',
      name: '2026/2027-осень-ОФО',
      startDate: '2026-09-07',
      weeks: 16,
      defaultPatternId: 'standard-week',
      overrides: [
        // Недели 8–12 — сокращённые, с 13-й снова стандартные.
        { weekIndex: 8, patternId: 'shortened-week' },
        { weekIndex: 13, patternId: 'standard-week' },
      ],
      // 28.09.2026 — понедельник (неделя 4), 04.11.2026 — среда (неделя 9).
      holidays: ['2026-09-28', '2026-11-04'],
    },
    {
      id: 'test-calendar-zfo',
      name: '2026/2027-осень-ЗФО',
      startDate: '2026-09-07',
      weeks: 4,
      defaultPatternId: 'shortened-week',
      overrides: [],
      holidays: [],
    },
  ];
}
