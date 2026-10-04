import { academicCalendarRepository } from '../academic-calendar/academic-calendar.repository.ts';
import { dayPatternRepository } from '../day-pattern/day-pattern.repository.ts';
import { disciplineRepository } from '../discipline/discipline.repository.ts';
import { lessonRepository } from '../lesson/lesson.repository.ts';
import { roomRepository } from '../room/room.repository.ts';
import { scheduleProjectRepository } from '../schedule-project/schedule-project.repository.ts';
import { studentGroupRepository } from '../student-group/student-group.repository.ts';
import { teacherRepository } from '../teacher/teacher.repository.ts';
import { teachingLoadRepository } from '../teaching-load/teaching-load.repository.ts';
import { weekPatternRepository } from '../week-pattern/week-pattern.repository.ts';

import { buildCalendars } from './data/calendars.ts';
import { buildDayPatterns } from './data/day-patterns.ts';
import { buildDisciplines } from './data/disciplines.ts';
import { buildLessons } from './data/lessons.ts';
import { buildProjects } from './data/projects.ts';
import { buildRooms } from './data/rooms.ts';
import { buildStudentGroups } from './data/student-groups.ts';
import { buildTeachers } from './data/teachers.ts';
import { buildTeachingLoads } from './data/teaching-loads.ts';
import { buildWeekPatterns } from './data/week-patterns.ts';

/**
 * Наполняет пустые коллекции мок-бэкенда тестовыми данными.
 * Идемпотентно: заполненные коллекции не трогаются.
 */
export function ensureSeedData(): void {
  if (disciplineRepository.isEmpty()) disciplineRepository.replaceAll(buildDisciplines());
  if (teacherRepository.isEmpty()) teacherRepository.replaceAll(buildTeachers());
  if (roomRepository.isEmpty()) roomRepository.replaceAll(buildRooms());
  if (studentGroupRepository.isEmpty()) studentGroupRepository.replaceAll(buildStudentGroups());
  // Разметка — по возрастанию уровня: неделя ссылается на шаблоны дня,
  // календарь — на шаблон недели.
  if (dayPatternRepository.isEmpty()) dayPatternRepository.replaceAll(buildDayPatterns());
  if (weekPatternRepository.isEmpty()) weekPatternRepository.replaceAll(buildWeekPatterns());
  if (academicCalendarRepository.isEmpty()) {
    academicCalendarRepository.replaceAll(buildCalendars());
  }

  // Проекты ссылаются на уже персистентные id календарей.
  if (scheduleProjectRepository.isEmpty()) {
    scheduleProjectRepository.replaceAll(buildProjects());
  }
  const projects = scheduleProjectRepository.list();

  // Нагрузки ссылаются на уже персистентные id справочников и на проект.
  if (teachingLoadRepository.isEmpty()) {
    const disciplineIds = disciplineRepository.list().map(({ id }) => id);
    const teacherIds = teacherRepository.list().map(({ id }) => id);
    const studentGroupIds = studentGroupRepository.list().map(({ id }) => id);
    teachingLoadRepository.replaceAll(
      projects.flatMap((project) =>
        buildTeachingLoads(10, {
          projectId: project.id,
          disciplineIds,
          teacherIds,
          studentGroupIds,
        }),
      ),
    );
  }

  // Демо-занятия ссылаются на персистентные id нагрузок и аудиторий:
  // показывают конфликты в нижнем доке расписания — по набору на проект.
  if (lessonRepository.isEmpty()) {
    const allLoads = teachingLoadRepository.list();
    const rooms = roomRepository.list();
    const studentGroups = studentGroupRepository.list();
    lessonRepository.replaceAll(
      projects.flatMap((project) =>
        buildLessons({
          loads: allLoads.filter((load) => load.projectId === project.id),
          rooms,
          studentGroups,
        }),
      ),
    );
  }
}
