import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import {
  buildTeachingLoadRows,
  defaultStreamHours,
  streamMergeError,
  type TeachingLoadRow,
} from '@/domain/teaching-load-view.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useLessonStore } from '@/stores/project/lesson.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

/**
 * Сессия диалога объединения строк в поток (UC-5.1). Часы по умолчанию —
 * минимум остатков; превысить его нельзя: иначе остаток строки уйдёт в минус.
 */
function createStreamMergeDialogSession() {
  const teachingLoadStore = useTeachingLoadStore();
  const lessonStore = useLessonStore();
  const disciplineStore = useDisciplineStore();
  const teacherStore = useTeacherStore();
  const studentGroupStore = useStudentGroupStore();
  const calendarStore = useAcademicCalendarStore();

  const isOpen = ref(false);
  const selectedIds = ref<string[]>([]);
  /** Время открытия — граница проведённых часов на момент слияния. */
  const openedAt = ref(new Date());
  const submitError = ref<string | null>(null);

  /** Выбранные строки с подписями и остатками. */
  const rows = computed<TeachingLoadRow[]>(() =>
    buildTeachingLoadRows(
      teachingLoadStore.loads.filter((load) => selectedIds.value.includes(load.id)),
      {
        disciplines: disciplineStore.disciplines,
        teachers: teacherStore.teachers,
        studentGroups: studentGroupStore.studentGroups,
        lessons: lessonStore.lessons,
        calendar: calendarStore.currentCalendar,
        now: openedAt.value,
      },
    ),
  );

  /** Причина запрета объединения или null, если всё допустимо. */
  const error = computed(() => streamMergeError(rows.value));

  /** Максимум часов потока — минимальный остаток выбранных строк. */
  const maxHours = computed(() => defaultStreamHours(rows.value));

  function open(loadIds: string[]): void {
    submitError.value = null;
    selectedIds.value = [...loadIds];
    openedAt.value = new Date();
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  async function submit(hours: number): Promise<void> {
    if (error.value) {
      submitError.value = error.value;
      return;
    }
    if (hours > maxHours.value) {
      submitError.value = `Часы потока не могут превышать минимальный остаток (${maxHours.value})`;
      return;
    }

    submitError.value = null;
    try {
      await teachingLoadStore.mergeIntoStream(selectedIds.value, hours);
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось объединить в поток';
    }
  }

  return { isOpen, rows, error, maxHours, submitError, open, close, submit };
}

export type StreamMergeDialogSession = ReturnType<typeof createStreamMergeDialogSession>;

const streamMergeDialogKey: InjectionKey<StreamMergeDialogSession> = Symbol('stream-merge-dialog');

/** Создаёт сессию диалога и отдаёт её потомкам через provide. */
export function provideStreamMergeDialog(): StreamMergeDialogSession {
  const session = createStreamMergeDialogSession();
  provide(streamMergeDialogKey, session);
  return session;
}

export function useStreamMergeDialog(): StreamMergeDialogSession {
  const session = inject(streamMergeDialogKey);
  if (!session) {
    throw new Error('[teaching-load] useStreamMergeDialog() вызван вне provideStreamMergeDialog()');
  }
  return session;
}
