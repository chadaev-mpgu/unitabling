import type { ScheduleProject } from '@/domain/schedule-project.ts';

/**
 * Стартовые проекты (docs/use-cases/00-projects.md): очная форма на семестровом
 * календаре и заочная — на коротком. id стабильны, чтобы выбор проекта и подсчёт
 * ссылок на календарь были детерминированы; календари — из `buildCalendars()`.
 */
export function buildProjects(): ScheduleProject[] {
  return [
    { id: 'test-project-ofo', name: 'ИФТИС-2-осень-2026', calendarId: 'test-calendar' },
    { id: 'test-project-zfo', name: 'ИФТИС-2-осень-2026 (ЗФО)', calendarId: 'test-calendar-zfo' },
  ];
}
