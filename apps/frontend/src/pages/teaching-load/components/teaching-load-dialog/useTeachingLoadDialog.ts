import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import { LessonType } from '@/domain/lesson.ts';
import { findStudentGroup, groupName, disciplineName } from '@/domain/lookups.ts';
import type { StudentGroup } from '@/domain/student-group.ts';
import { useDisciplineStore } from '@/stores/global/discipline.ts';
import { useStudentGroupStore } from '@/stores/global/student-group.ts';
import { useTeacherStore } from '@/stores/global/teacher.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';
import { useTeachingLoadStore } from '@/stores/project/teaching-load.ts';

import type { TeachingLoadDialogContext, TeachingLoadFormValues } from './types.ts';

/** Sentinel «преподаватель не назначен»: Select не принимает пустую строку. */
export const UNASSIGNED_TEACHER = 'unassigned';

/**
 * Сессия диалога строки нагрузки: создание, правка преподавателя, удаление
 * и разбор потока. Дисциплина, группа, вид и часы неизменяемы (UC-3.3).
 */
function createTeachingLoadDialogSession() {
  const teachingLoadStore = useTeachingLoadStore();
  const projectStore = useScheduleProjectStore();
  const disciplineStore = useDisciplineStore();
  const teacherStore = useTeacherStore();
  const studentGroupStore = useStudentGroupStore();

  const isOpen = ref(false);
  const context = ref<TeachingLoadDialogContext | null>(null);
  const submitError = ref<string | null>(null);

  const isEdit = computed(() => context.value?.kind === 'edit');
  const isDelete = computed(() => context.value?.kind === 'delete');
  const isSplit = computed(() => context.value?.kind === 'split');

  /** Правимая/удаляемая строка резолвится из стора по id. */
  const load = computed(() => {
    const current = context.value;
    if (!current || current.kind === 'create') return null;
    return teachingLoadStore.loads.find(({ id }) => id === current.loadId) ?? null;
  });

  /** Группы выбранной строки — для состава потока. */
  const groups = computed<StudentGroup[]>(() =>
    (load.value?.groupIds ?? []).map(
      (id) => findStudentGroup(studentGroupStore.studentGroups, id) ?? { id, name: id, size: 0 },
    ),
  );

  /** Сколько занятий ссылается на строку: блокирует удаление и разбор. */
  const lessonCount = computed(() =>
    load.value ? teachingLoadStore.lessonCount(load.value.id) : 0,
  );
  const canRemove = computed(() => load.value !== null && lessonCount.value === 0);

  const loadLabel = computed(() => {
    const target = load.value;
    if (!target) return '';
    const groupNames = target.groupIds
      .map((id) => groupName(studentGroupStore.studentGroups, id))
      .join(', ');
    return `${disciplineName(disciplineStore.disciplines, target.disciplineId)} · ${groupNames}`;
  });

  const title = computed(() => {
    if (isDelete.value) return 'Удалить строку нагрузки?';
    if (isSplit.value) return 'Разобрать поток?';
    return isEdit.value ? 'Строка нагрузки' : 'Новая строка нагрузки';
  });

  const description = computed(() => {
    if (isDelete.value || isSplit.value) return loadLabel.value;
    return isEdit.value ? 'Измените преподавателя' : 'Заполните данные строки нагрузки';
  });

  const submitLabel = computed(() => (isEdit.value ? 'Сохранить' : 'Добавить'));

  const disciplines = computed(() =>
    [...disciplineStore.disciplines].sort((left, right) =>
      left.name.localeCompare(right.name, 'ru'),
    ),
  );

  const teachers = computed(() =>
    [...teacherStore.teachers].sort((left, right) =>
      left.fullName.localeCompare(right.fullName, 'ru'),
    ),
  );

  const studentGroups = computed(() =>
    [...studentGroupStore.studentGroups].sort((left, right) =>
      left.name.localeCompare(right.name, 'ru', { numeric: true }),
    ),
  );

  const defaultValues = computed<TeachingLoadFormValues>(() => {
    const target = load.value;
    if (target) {
      return {
        disciplineId: target.disciplineId,
        groupId: target.groupIds[0] ?? '',
        lessonType: target.lessonType,
        hoursTotal: target.hoursTotal,
        teacherId: target.teacherId ?? UNASSIGNED_TEACHER,
      };
    }
    return {
      disciplineId: '',
      groupId: '',
      lessonType: LessonType.Lecture,
      hoursTotal: 32,
      teacherId: UNASSIGNED_TEACHER,
    };
  });

  function open(payload: TeachingLoadDialogContext): void {
    submitError.value = null;
    if (
      payload.kind !== 'create' &&
      !teachingLoadStore.loads.some(({ id }) => id === payload.loadId)
    ) {
      return;
    }
    context.value = payload;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Создаёт строку или меняет преподавателя — единственное изменяемое поле. */
  async function submit(values: TeachingLoadFormValues): Promise<void> {
    const current = context.value;
    if (!current || current.kind === 'delete' || current.kind === 'split') return;

    const teacherId = values.teacherId === UNASSIGNED_TEACHER ? undefined : values.teacherId;
    submitError.value = null;

    try {
      if (current.kind === 'edit') {
        await teachingLoadStore.assignTeacher(current.loadId, teacherId);
      } else {
        // Строка принадлежит текущему проекту; без проекта сохранять некуда.
        const projectId = projectStore.currentProjectId;
        if (!projectId) return;
        await teachingLoadStore.addLoad({
          projectId,
          disciplineId: values.disciplineId,
          groupIds: [values.groupId],
          lessonType: values.lessonType,
          hoursTotal: values.hoursTotal,
          teacherId,
        });
      }
      close();
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Не удалось сохранить строку нагрузки';
    }
  }

  /** Удаляет строку; стор откажет, если на неё ссылаются занятия. */
  async function remove(): Promise<void> {
    const target = load.value;
    if (!target) return;

    submitError.value = null;
    try {
      await teachingLoadStore.removeLoad(target.id);
      close();
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Не удалось удалить строку нагрузки';
    }
  }

  /** Разбирает поток без занятий: часы возвращаются per-group строкам. */
  async function split(): Promise<void> {
    const target = load.value;
    if (!target) return;

    submitError.value = null;
    try {
      await teachingLoadStore.splitStream(target.id);
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось разобрать поток';
    }
  }

  return {
    isOpen,
    isEdit,
    isDelete,
    isSplit,
    load,
    groups,
    lessonCount,
    canRemove,
    title,
    description,
    submitLabel,
    disciplines,
    teachers,
    studentGroups,
    defaultValues,
    submitError,
    open,
    close,
    submit,
    remove,
    split,
  };
}

export type TeachingLoadDialogSession = ReturnType<typeof createTeachingLoadDialogSession>;

const teachingLoadDialogKey: InjectionKey<TeachingLoadDialogSession> =
  Symbol('teaching-load-dialog');

/** Создаёт сессию диалога и отдаёт её потомкам через provide. */
export function provideTeachingLoadDialog(): TeachingLoadDialogSession {
  const session = createTeachingLoadDialogSession();
  provide(teachingLoadDialogKey, session);
  return session;
}

export function useTeachingLoadDialog(): TeachingLoadDialogSession {
  const session = inject(teachingLoadDialogKey);
  if (!session) {
    throw new Error(
      '[teaching-load] useTeachingLoadDialog() вызван вне provideTeachingLoadDialog()',
    );
  }
  return session;
}
