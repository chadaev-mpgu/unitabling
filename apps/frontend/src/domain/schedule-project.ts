/**
 * Проект — одно расписание за один период для всех групп подразделения
 * (docs/data-model/project-entities.md). Курс/семестр/год закодированы в имени.
 * Нагрузка и уроки ссылаются на проект через `projectId`, календарь — через
 * `calendarId`; копии глобальных данных проект не хранит.
 */
export interface ScheduleProject {
  id: string;
  name: string;
  /** Ссылка на академический календарь (глобальные данные), read-only. */
  calendarId: string;
}

/** Запрос на создание проекта: id присваивает «сервер». */
export type CreateScheduleProjectRequest = Omit<ScheduleProject, 'id'>;
