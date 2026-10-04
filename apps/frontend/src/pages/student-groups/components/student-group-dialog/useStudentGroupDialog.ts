import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import type { StudentGroup } from '@/domain/student-group.ts';
import {
  useStudentGroupStore,
  type StudentGroupReferences,
} from '@/stores/global/student-group.ts';

/** Что открыто: создание, правка или подтверждение удаления. */
export type StudentGroupDialogContext =
  { kind: 'create' } | { kind: 'edit'; groupId: string } | { kind: 'delete'; groupId: string };

/** Значения формы группы. */
export interface StudentGroupFormValues {
  name: string;
  size: number;
  courseYear?: number;
  admissionYear?: number;
}

/**
 * Сессия диалога группы: три режима — создание, правка и удаление.
 * Удаление разрешено, только если на группу не ссылаются нагрузка или занятие.
 */
function createStudentGroupDialogSession() {
  const studentGroupStore = useStudentGroupStore();

  const isOpen = ref(false);
  const context = ref<StudentGroupDialogContext | null>(null);

  /** Ошибка сохранения/удаления, пришедшая с «сервера». */
  const submitError = ref<string | null>(null);

  const isEdit = computed(() => context.value?.kind === 'edit');
  const isDelete = computed(() => context.value?.kind === 'delete');

  /** Правимая/удаляемая группа резолвится из стора по id. */
  const group = computed<StudentGroup | null>(() => {
    const current = context.value;
    if (!current || current.kind === 'create') return null;
    return studentGroupStore.studentGroups.find(({ id }) => id === current.groupId) ?? null;
  });

  /** Ссылки, мешающие удалению; считается только в режиме удаления. */
  const references = computed<StudentGroupReferences | null>(() =>
    isDelete.value && group.value ? studentGroupStore.studentGroupReferences(group.value.id) : null,
  );

  const canDelete = computed(() => references.value === null || references.value.total === 0);

  const title = computed(() => {
    if (isDelete.value) return 'Удалить группу?';
    return isEdit.value ? 'Группа' : 'Новая группа';
  });

  const description = computed(() => {
    if (isDelete.value) return group.value?.name ?? '';
    return isEdit.value ? 'Измените данные группы' : 'Заполните данные группы';
  });

  const submitLabel = computed(() => (isEdit.value ? 'Сохранить' : 'Добавить'));

  const defaultValues = computed<StudentGroupFormValues>(() => ({
    name: group.value?.name ?? '',
    size: group.value?.size ?? 25,
    courseYear: group.value?.courseYear,
    admissionYear: group.value?.admissionYear,
  }));

  function open(payload: StudentGroupDialogContext): void {
    submitError.value = null;
    if (
      payload.kind !== 'create' &&
      !studentGroupStore.studentGroups.some(({ id }) => id === payload.groupId)
    ) {
      return;
    }
    context.value = payload;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Сохраняет создание/правку; незаполненные курс и год набора не хранятся. */
  async function submit(values: StudentGroupFormValues): Promise<void> {
    const current = context.value;
    if (!current || current.kind === 'delete') return;

    submitError.value = null;
    const request = {
      name: values.name.trim(),
      size: values.size,
      courseYear: values.courseYear,
      admissionYear: values.admissionYear,
    };

    try {
      if (current.kind === 'edit' && group.value) {
        await studentGroupStore.editStudentGroup({ ...group.value, ...request });
      } else {
        await studentGroupStore.addStudentGroup(request);
      }
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось сохранить группу';
    }
  }

  /** Удаляет группу; стор откажет, если на неё ссылаются нагрузка или занятие. */
  async function remove(): Promise<void> {
    const target = group.value;
    if (!target) return;

    submitError.value = null;
    try {
      await studentGroupStore.removeStudentGroup(target.id);
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось удалить группу';
    }
  }

  return {
    isOpen,
    isEdit,
    isDelete,
    title,
    description,
    submitLabel,
    group,
    references,
    canDelete,
    defaultValues,
    submitError,
    open,
    close,
    submit,
    remove,
  };
}

export type StudentGroupDialogSession = ReturnType<typeof createStudentGroupDialogSession>;

const studentGroupDialogKey: InjectionKey<StudentGroupDialogSession> =
  Symbol('student-group-dialog');

/**
 * Создаёт сессию диалога и отдаёт её потомкам через provide.
 * Вызывается один раз на странице групп.
 */
export function provideStudentGroupDialog(): StudentGroupDialogSession {
  const session = createStudentGroupDialogSession();
  provide(studentGroupDialogKey, session);
  return session;
}

export function useStudentGroupDialog(): StudentGroupDialogSession {
  const session = inject(studentGroupDialogKey);
  if (!session) {
    throw new Error(
      '[student-groups] useStudentGroupDialog() вызван вне provideStudentGroupDialog()',
    );
  }
  return session;
}
