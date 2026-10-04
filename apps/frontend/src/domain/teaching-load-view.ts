import type { AcademicCalendar } from './academic-calendar.ts';
import { Color } from './color.ts';
import type { Discipline } from './discipline.ts';
import { loadHours, type LoadHours } from './hours.ts';
import type { Lesson } from './lesson.ts';
import { disciplineName, findDiscipline, groupName, teacherName } from './lookups.ts';
import type { StudentGroup } from './student-group.ts';
import type { Teacher } from './teacher.ts';
import { isStream, type TeachingLoad } from './teaching-load.ts';

/** Sentinel «без ограничения» для селектов фильтра. */
export const TEACHING_LOAD_FILTER_ALL = 'all';

/**
 * View-модель строки нагрузки: денормализует ссылки на справочники и
 * считает часы по вхождениям (docs/use-cases/03-teaching-loads.md).
 */
export interface TeachingLoadRow {
  load: TeachingLoad;
  discipline: string;
  disciplineColor: Color;
  /** Преподаватель: null — не назначен. */
  teacher: string | null;
  groupNames: string[];
  /** Строка содержит несколько групп — поток (docs/use-cases/05-flows.md). */
  isStream: boolean;
  hours: LoadHours;
}

/** Совмещаемые фильтры таблицы нагрузки (UC-3.2). */
export interface TeachingLoadFilter {
  groupId: string;
  teacherId: string;
  disciplineId: string;
  lessonType: string;
}

/** Сводка по (отфильтрованным) строкам — как в макете. */
export interface TeachingLoadStats {
  rows: number;
  /** Сумма `hoursTotal` — весь объём нагрузки. */
  totalHours: number;
  /** Сумма `hoursScheduled` — часы расставленных занятий. */
  scheduledHours: number;
}

/** Источники данных, нужные для сборки строк. */
export interface TeachingLoadContext {
  disciplines: Discipline[];
  teachers: Teacher[];
  studentGroups: StudentGroup[];
  lessons: Lesson[];
  calendar: AcademicCalendar;
  now: Date;
}

/** Собирает строки таблицы, резолвя подписи и считая часы. */
export function buildTeachingLoadRows(
  loads: TeachingLoad[],
  context: TeachingLoadContext,
): TeachingLoadRow[] {
  return loads.map((load) => ({
    load,
    discipline: disciplineName(context.disciplines, load.disciplineId),
    disciplineColor: findDiscipline(context.disciplines, load.disciplineId)?.color ?? Color.Blue,
    teacher: load.teacherId ? teacherName(context.teachers, load.teacherId) : null,
    groupNames: load.groupIds.map((id) => groupName(context.studentGroups, id)),
    isStream: isStream(load),
    hours: loadHours(load, context.lessons, context.calendar, context.now),
  }));
}

/**
 * Отбор строк. Фильтр по группе пропускает и потоки, содержащие эту группу:
 * «вид по группе» суммирует её часы вместе с потоковыми (UC-3.2).
 */
export function filterTeachingLoadRows(
  rows: TeachingLoadRow[],
  filter: TeachingLoadFilter,
): TeachingLoadRow[] {
  return rows.filter((row) => {
    if (
      filter.groupId !== TEACHING_LOAD_FILTER_ALL &&
      !row.load.groupIds.includes(filter.groupId)
    ) {
      return false;
    }
    if (filter.teacherId !== TEACHING_LOAD_FILTER_ALL && row.load.teacherId !== filter.teacherId) {
      return false;
    }
    if (
      filter.disciplineId !== TEACHING_LOAD_FILTER_ALL &&
      row.load.disciplineId !== filter.disciplineId
    ) {
      return false;
    }
    if (
      filter.lessonType !== TEACHING_LOAD_FILTER_ALL &&
      row.load.lessonType !== filter.lessonType
    ) {
      return false;
    }
    return true;
  });
}

/** Сводка по строкам: количество, весь объём и расставленные часы. */
export function buildTeachingLoadStats(rows: TeachingLoadRow[]): TeachingLoadStats {
  return {
    rows: rows.length,
    totalHours: rows.reduce((sum, row) => sum + row.load.hoursTotal, 0),
    scheduledHours: rows.reduce((sum, row) => sum + row.hours.scheduled, 0),
  };
}

/**
 * Проверки объединения в поток (UC-5.1): одинаковые дисциплина и вид занятия;
 * преподаватели совпадают, либо один из них не назначен.
 * Возвращает текст ошибки или null, если объединение допустимо.
 */
export function streamMergeError(rows: TeachingLoadRow[]): string | null {
  if (rows.length < 2) return 'Выберите минимум две строки';
  const first = rows[0]!;
  for (const row of rows.slice(1)) {
    if (
      row.load.disciplineId !== first.load.disciplineId ||
      row.load.lessonType !== first.load.lessonType
    ) {
      return 'Строки должны совпадать по дисциплине и виду занятия';
    }
  }

  const teachers = new Set(rows.map((row) => row.load.teacherId).filter(Boolean));
  if (teachers.size > 1) return 'У выбранных строк разные преподаватели';
  return null;
}

/** Часы потока по умолчанию — минимум остатков выбранных строк (UC-5.1). */
export function defaultStreamHours(rows: TeachingLoadRow[]): number {
  return rows.length ? Math.min(...rows.map((row) => row.hours.remaining)) : 0;
}

/** Состав групп потока — объединение групп выбранных строк без повторов. */
export function streamGroupIds(rows: TeachingLoadRow[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    for (const id of row.load.groupIds) {
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** Ключ сортировки строк: дисциплина, затем первая группа. */
export function compareTeachingLoadRows(left: TeachingLoadRow, right: TeachingLoadRow): number {
  const byDiscipline = left.discipline.localeCompare(right.discipline, 'ru');
  if (byDiscipline !== 0) return byDiscipline;
  return (left.groupNames[0] ?? '').localeCompare(right.groupNames[0] ?? '', 'ru', {
    numeric: true,
  });
}
