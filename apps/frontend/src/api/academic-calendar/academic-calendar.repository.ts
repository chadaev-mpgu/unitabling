import type { AcademicCalendar } from '@/domain/academic-calendar.ts';

import { createRepository } from '../repository.ts';

export const academicCalendarRepository = createRepository<AcademicCalendar>('calendars');

/**
 * Календарь по умолчанию — первый в списке. Используется как фолбэк, когда
 * проект не выбран или его `calendarId` битый (см. `getProjectCalendar`).
 */
export function getDefaultCalendar(): AcademicCalendar {
  const [calendar] = academicCalendarRepository.list();
  if (!calendar) {
    throw new Error('[api] академический календарь не найден: сид не выполнен');
  }
  return calendar;
}
