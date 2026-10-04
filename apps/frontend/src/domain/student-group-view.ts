import type { Discipline } from './discipline.ts';
import { disciplineName } from './lookups.ts';
import type { StudentGroup } from './student-group.ts';
import type { TeachingLoad } from './teaching-load.ts';

/**
 * View-модель списка студенческих групп: строка денормализует нагрузки,
 * содержащие группу (включая потоки), в дисциплины и суммарные часы.
 */
export interface StudentGroupRow {
  group: StudentGroup;
  /** Дисциплины нагрузок группы, без повторов (id и подписи). */
  disciplineIds: string[];
  disciplineNames: string[];
  /** Сумма часов нагрузки (hoursTotal) по всем нагрузкам с этой группой. */
  hours: number;
}

/** Фильтр списка: значение «все» — без ограничения. */
export interface StudentGroupFilter {
  disciplineId: string;
  courseYear: string;
}

/** Sentinel «без ограничения» для селектов фильтра. */
export const STUDENT_GROUP_FILTER_ALL = 'all';

/** Сводка по (отфильтрованным) строкам: всего, студентов, с нагрузкой и без. */
export interface StudentGroupStats {
  total: number;
  students: number;
  withLoad: number;
  withoutLoad: number;
}

/**
 * Собирает строки справочника, агрегируя нагрузки, у которых группа входит
 * в `groupIds` (поток — тоже строка с несколькими группами).
 * Подписи дисциплин резолвятся через `lookups`.
 */
export function buildStudentGroupRows(
  groups: StudentGroup[],
  loads: TeachingLoad[],
  disciplines: Discipline[],
): StudentGroupRow[] {
  return groups.map((group) => {
    const own = loads.filter((load) => load.groupIds.includes(group.id));
    const disciplineIds: string[] = [];
    for (const load of own) {
      if (!disciplineIds.includes(load.disciplineId)) disciplineIds.push(load.disciplineId);
    }
    return {
      group,
      disciplineIds,
      disciplineNames: disciplineIds.map((id) => disciplineName(disciplines, id)),
      hours: own.reduce((sum, load) => sum + load.hoursTotal, 0),
    };
  });
}

/** Отбор строк по дисциплине и курсу; «все» пропускает без проверки. */
export function filterStudentGroupRows(
  rows: StudentGroupRow[],
  filter: StudentGroupFilter,
): StudentGroupRow[] {
  return rows.filter((row) => {
    if (
      filter.disciplineId !== STUDENT_GROUP_FILTER_ALL &&
      !row.disciplineIds.includes(filter.disciplineId)
    ) {
      return false;
    }
    if (
      filter.courseYear !== STUDENT_GROUP_FILTER_ALL &&
      String(row.group.courseYear) !== filter.courseYear
    ) {
      return false;
    }
    return true;
  });
}

/** Сводка считается по отфильтрованным строкам — как в макете. */
export function buildStudentGroupStats(rows: StudentGroupRow[]): StudentGroupStats {
  const withLoad = rows.filter((row) => row.disciplineIds.length > 0).length;
  return {
    total: rows.length,
    students: rows.reduce((sum, row) => sum + row.group.size, 0),
    withLoad,
    withoutLoad: rows.length - withLoad,
  };
}
