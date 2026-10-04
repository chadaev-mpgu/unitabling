import { computed, toValue, type MaybeRefOrGetter } from 'vue';

import { detectProjectConflicts } from '@/domain/conflict.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useRoomStore } from '@/stores/global/room.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';

export interface ScheduleConflictsOptions {
  /** Текущее время — граница прошедшего; обновляется на странице. */
  now: MaybeRefOrGetter<Date>;
}

/**
 * Конфликты проекта для нижнего дока: считаются на лету по всем урокам,
 * включая скрытые текущим видом (docs/data-model/conflicts.md). Прошедшие
 * вхождения в конфликты не попадают — они история и правке недоступны.
 */
export function useScheduleConflicts({ now }: ScheduleConflictsOptions) {
  const lessonStore = useLessonStore();
  const calendarStore = useAcademicCalendarStore();
  const teacherStore = useTeacherStore();
  const roomStore = useRoomStore();
  const studentGroupStore = useStudentGroupStore();

  const conflicts = computed(() =>
    detectProjectConflicts({
      lessons: lessonStore.lessons,
      calendar: calendarStore.currentCalendar,
      teachers: teacherStore.teachers,
      rooms: roomStore.rooms,
      studentGroups: studentGroupStore.studentGroups,
      now: toValue(now),
    }),
  );

  /**
   * Уроки с `error`-конфликтами: только их карточки получают в сетке красную
   * обводку и значок. Warning (вместимость аудитории) виден лишь в доке.
   */
  const errorLessonIds = computed(
    () =>
      new Set(
        conflicts.value
          .filter(({ severity }) => severity === 'error')
          .flatMap(({ lessonIds }) => lessonIds),
      ),
  );

  return { conflicts, errorLessonIds };
}
