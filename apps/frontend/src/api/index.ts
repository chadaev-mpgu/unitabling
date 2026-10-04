/** Публичный вход мок-бэкенда: сиды и репозитории доменов. */
export {
  academicCalendarRepository,
  getDefaultCalendar,
} from './academic-calendar/academic-calendar.repository.ts';
export { dayPatternRepository } from './day-pattern/day-pattern.repository.ts';
export { disciplineRepository } from './discipline/discipline.repository.ts';
export {
  list as listLessons,
  remove as deleteLesson,
  save as saveLesson,
  update as updateLesson,
} from './lesson/lesson.repository.ts';
export { roomRepository } from './room/room.repository.ts';
export {
  getProjectCalendar,
  scheduleProjectRepository,
} from './schedule-project/schedule-project.repository.ts';
export { ensureSeedData } from './seed/index.ts';
export { readValue, writeValue } from './storage.ts';
export { studentGroupRepository } from './student-group/student-group.repository.ts';
export { teacherRepository } from './teacher/teacher.repository.ts';
export { teachingLoadRepository } from './teaching-load/teaching-load.repository.ts';
export { weekPatternRepository } from './week-pattern/week-pattern.repository.ts';
