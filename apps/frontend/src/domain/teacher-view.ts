import type { Discipline } from './discipline.ts';
import { disciplineName } from './lookups.ts';
import type { Teacher } from './teacher.ts';
import type { TeachingLoad } from './teaching-load.ts';

/**
 * View-модель списка преподавателей: строка денормализует нагрузки
 * преподавателя в дисциплины и суммарные часы.
 */
export interface TeacherRow {
  teacher: Teacher;
  /** Дисциплины нагрузок преподавателя, без повторов (id и подписи). */
  disciplineIds: string[];
  disciplineNames: string[];
  /** Сумма часов нагрузки (hoursTotal) по всем нагрузкам преподавателя. */
  hours: number;
}

/** Фильтр списка: значение «все» — без ограничения. */
export interface TeacherFilter {
  disciplineId: string;
  position: string;
}

/** Sentinel «без ограничения» для селектов фильтра. */
export const TEACHER_FILTER_ALL = 'all';

/** Сводка по (отфильтрованным) строкам: всего, с нагрузкой и без. */
export interface TeacherStats {
  total: number;
  withLoad: number;
  withoutLoad: number;
}

/**
 * Собирает строки справочника, агрегируя нагрузки по `teacherId`.
 * Подписи дисциплин резолвятся через `lookups`.
 */
export function buildTeacherRows(
  teachers: Teacher[],
  loads: TeachingLoad[],
  disciplines: Discipline[],
): TeacherRow[] {
  return teachers.map((teacher) => {
    const own = loads.filter((load) => load.teacherId === teacher.id);
    const disciplineIds: string[] = [];
    for (const load of own) {
      if (!disciplineIds.includes(load.disciplineId)) disciplineIds.push(load.disciplineId);
    }
    return {
      teacher,
      disciplineIds,
      disciplineNames: disciplineIds.map((id) => disciplineName(disciplines, id)),
      hours: own.reduce((sum, load) => sum + load.hoursTotal, 0),
    };
  });
}

/** Отбор строк по дисциплине и должности; «все» пропускает без проверки. */
export function filterTeacherRows(rows: TeacherRow[], filter: TeacherFilter): TeacherRow[] {
  return rows.filter((row) => {
    if (
      filter.disciplineId !== TEACHER_FILTER_ALL &&
      !row.disciplineIds.includes(filter.disciplineId)
    ) {
      return false;
    }
    if (filter.position !== TEACHER_FILTER_ALL && row.teacher.position !== filter.position) {
      return false;
    }
    return true;
  });
}

/** Сводка считается по отфильтрованным строкам — как в макете. */
export function buildTeacherStats(rows: TeacherRow[]): TeacherStats {
  const withLoad = rows.filter((row) => row.disciplineIds.length > 0).length;
  return { total: rows.length, withLoad, withoutLoad: rows.length - withLoad };
}
