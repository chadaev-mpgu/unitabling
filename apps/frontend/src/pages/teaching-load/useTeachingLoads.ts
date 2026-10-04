import { computed, onScopeDispose, ref } from 'vue';

import {
  buildTeachingLoadRows,
  buildTeachingLoadStats,
  compareTeachingLoadRows,
  filterTeachingLoadRows,
  TEACHING_LOAD_FILTER_ALL,
  type TeachingLoadFilter,
} from '@/domain/teaching-load-view.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

/**
 * Состояние экрана учебной нагрузки: фильтры, строки с часами и сводка.
 * Часы считаются по вхождениям занятий, поэтому `now` обновляется, как
 * в расписании — граница прошедшего не «застывает».
 */
export function useTeachingLoads() {
  const teachingLoadStore = useTeachingLoadStore();
  const lessonStore = useLessonStore();
  const disciplineStore = useDisciplineStore();
  const teacherStore = useTeacherStore();
  const studentGroupStore = useStudentGroupStore();
  const calendarStore = useAcademicCalendarStore();

  const filter = ref<TeachingLoadFilter>({
    groupId: TEACHING_LOAD_FILTER_ALL,
    teacherId: TEACHING_LOAD_FILTER_ALL,
    disciplineId: TEACHING_LOAD_FILTER_ALL,
    lessonType: TEACHING_LOAD_FILTER_ALL,
  });

  /** Текущее время — граница проведённых часов; обновляется раз в минуту. */
  const now = ref(new Date());
  const nowTimer = setInterval(() => {
    now.value = new Date();
  }, 60_000);
  onScopeDispose(() => clearInterval(nowTimer));

  const rows = computed(() =>
    buildTeachingLoadRows(teachingLoadStore.loads, {
      disciplines: disciplineStore.disciplines,
      teachers: teacherStore.teachers,
      studentGroups: studentGroupStore.studentGroups,
      lessons: lessonStore.lessons,
      calendar: calendarStore.currentCalendar,
      now: now.value,
    }).sort(compareTeachingLoadRows),
  );

  const filteredRows = computed(() => filterTeachingLoadRows(rows.value, filter.value));
  const stats = computed(() => buildTeachingLoadStats(filteredRows.value));

  /** id строк, на которые ссылаются занятия: удаление и разбор запрещены. */
  const referencedLoadIds = computed(() => {
    const ids = new Set<string>();
    for (const lesson of lessonStore.lessons) ids.add(lesson.teachingLoadId);
    return ids;
  });

  return { filter, rows, filteredRows, stats, referencedLoadIds };
}
