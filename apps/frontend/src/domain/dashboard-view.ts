import { detectProjectConflicts, type ProjectConflict } from './conflict.ts';
import { loadHours } from './hours.ts';
import { isStream, type TeachingLoad } from './teaching-load.ts';

import type { AcademicCalendar } from './academic-calendar.ts';
import type { Lesson } from './lesson.ts';
import type { Room } from './room.ts';
import type { StudentGroup } from './student-group.ts';
import type { Teacher } from './teacher.ts';

/**
 * Сводка панели управления: показатели текущего проекта считаются на лету
 * (docs/data-model/README.md — расчётные поля не хранятся). Конфликты — те же,
 * что показывает сетка расписания, включая прошедшие вхождения не учитываются.
 */
export interface DashboardContext {
  calendar: AcademicCalendar;
  loads: TeachingLoad[];
  lessons: Lesson[];
  teachers: Teacher[];
  rooms: Room[];
  studentGroups: StudentGroup[];
  /** Текущее время: граница прошедшего для часов и конфликтов. */
  now: Date;
}

export interface DashboardSummary {
  /** Строки учебной нагрузки проекта. */
  loads: number;
  /** Из них потоки — строки с несколькими группами. */
  streams: number;
  /** Занятия (правила) проекта. */
  lessons: number;
  /** Группы, задействованные хотя бы в одной строке нагрузки. */
  groupsInLoads: number;
  hoursTotal: number;
  hoursScheduled: number;
  hoursRemaining: number;
  errors: number;
  warnings: number;
  conflicts: ProjectConflict[];
}

/** Собирает показатели текущего проекта для панели управления. */
export function buildDashboardSummary(context: DashboardContext): DashboardSummary {
  const { calendar, loads, lessons, now } = context;

  const groupIds = new Set<string>();
  let hoursTotal = 0;
  let hoursScheduled = 0;
  for (const load of loads) {
    for (const id of load.groupIds) groupIds.add(id);
    hoursTotal += load.hoursTotal;
    hoursScheduled += loadHours(load, lessons, calendar, now).scheduled;
  }

  const conflicts = detectProjectConflicts({
    lessons,
    calendar,
    teachers: context.teachers,
    rooms: context.rooms,
    studentGroups: context.studentGroups,
    now,
  });

  return {
    loads: loads.length,
    streams: loads.filter(isStream).length,
    lessons: lessons.length,
    groupsInLoads: groupIds.size,
    hoursTotal,
    hoursScheduled,
    hoursRemaining: hoursTotal - hoursScheduled,
    errors: conflicts.filter(({ severity }) => severity === 'error').length,
    warnings: conflicts.filter(({ severity }) => severity === 'warning').length,
    conflicts,
  };
}
