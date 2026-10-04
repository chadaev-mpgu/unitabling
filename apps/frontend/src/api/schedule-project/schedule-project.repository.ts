import type { AcademicCalendar } from '@/domain/academic-calendar.ts';
import type { ScheduleProject } from '@/domain/schedule-project.ts';

import {
  academicCalendarRepository,
  getDefaultCalendar,
} from '../academic-calendar/academic-calendar.repository.ts';
import { createRepository } from '../repository.ts';

export const scheduleProjectRepository = createRepository<ScheduleProject>('schedule-projects');

/**
 * Календарь проекта — через его `calendarId`. Если проект или календарь не
 * найдены (битая ссылка, сид не выполнен), возвращается календарь по умолчанию,
 * чтобы приложение не падало.
 */
export function getProjectCalendar(projectId?: string): AcademicCalendar {
  const project = projectId
    ? scheduleProjectRepository.list().find(({ id }) => id === projectId)
    : undefined;
  const calendar = project
    ? academicCalendarRepository.list().find(({ id }) => id === project.calendarId)
    : undefined;
  return calendar ?? getDefaultCalendar();
}
