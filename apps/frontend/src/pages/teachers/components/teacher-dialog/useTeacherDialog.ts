import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import type { Teacher } from '@/domain/teacher.ts';
import { useTeacherStore, type TeacherReferences } from '@/stores/global/teacher.ts';

/** Что открыто: создание, правка или подтверждение удаления. */
export type TeacherDialogContext =
  { kind: 'create' } | { kind: 'edit'; teacherId: string } | { kind: 'delete'; teacherId: string };

/** Значения формы преподавателя. */
export interface TeacherFormValues {
  fullName: string;
  position: string;
}

/**
 * Сессия диалога преподавателя: три режима — создание, правка и удаление.
 * Удаление разрешено, только если на преподавателя никто не ссылается.
 */
function createTeacherDialogSession() {
  const teacherStore = useTeacherStore();

  const isOpen = ref(false);
  const context = ref<TeacherDialogContext | null>(null);

  /** Ошибка сохранения/удаления, пришедшая с «сервера». */
  const submitError = ref<string | null>(null);

  const isEdit = computed(() => context.value?.kind === 'edit');
  const isDelete = computed(() => context.value?.kind === 'delete');

  /** Правимый/удаляемый преподаватель резолвится из стора по id. */
  const teacher = computed<Teacher | null>(() => {
    const current = context.value;
    if (!current || current.kind === 'create') return null;
    return teacherStore.teachers.find(({ id }) => id === current.teacherId) ?? null;
  });

  /** Ссылки, мешающие удалению; считается только в режиме удаления. */
  const references = computed<TeacherReferences | null>(() =>
    isDelete.value && teacher.value ? teacherStore.teacherReferences(teacher.value.id) : null,
  );

  const canDelete = computed(() => references.value === null || references.value.total === 0);

  const title = computed(() => {
    if (isDelete.value) return 'Удалить преподавателя?';
    return isEdit.value ? 'Преподаватель' : 'Новый преподаватель';
  });

  const description = computed(() => {
    if (isDelete.value) return teacher.value?.fullName ?? '';
    return isEdit.value ? 'Измените данные преподавателя' : 'Заполните данные преподавателя';
  });

  const submitLabel = computed(() => (isEdit.value ? 'Сохранить' : 'Добавить'));

  const defaultValues = computed<TeacherFormValues>(() => ({
    fullName: teacher.value?.fullName ?? '',
    position: teacher.value?.position ?? '',
  }));

  function open(payload: TeacherDialogContext): void {
    submitError.value = null;
    if (
      payload.kind !== 'create' &&
      !teacherStore.teachers.some(({ id }) => id === payload.teacherId)
    ) {
      return;
    }
    context.value = payload;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Сохраняет создание/правку; пустая должность не сохраняется. */
  async function submit(values: TeacherFormValues): Promise<void> {
    const current = context.value;
    if (!current || current.kind === 'delete') return;

    submitError.value = null;
    const request = {
      fullName: values.fullName.trim(),
      position: values.position.trim() || undefined,
    };

    try {
      if (current.kind === 'edit' && teacher.value) {
        await teacherStore.editTeacher({ ...teacher.value, ...request });
      } else {
        await teacherStore.addTeacher(request);
      }
      close();
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Не удалось сохранить преподавателя';
    }
  }

  /** Удаляет преподавателя; стор откажет, если на него ссылаются. */
  async function remove(): Promise<void> {
    const target = teacher.value;
    if (!target) return;

    submitError.value = null;
    try {
      await teacherStore.removeTeacher(target.id);
      close();
    } catch (error) {
      submitError.value =
        error instanceof Error ? error.message : 'Не удалось удалить преподавателя';
    }
  }

  return {
    isOpen,
    isEdit,
    isDelete,
    title,
    description,
    submitLabel,
    teacher,
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

export type TeacherDialogSession = ReturnType<typeof createTeacherDialogSession>;

const teacherDialogKey: InjectionKey<TeacherDialogSession> = Symbol('teacher-dialog');

/**
 * Создаёт сессию диалога и отдаёт её потомкам через provide.
 * Вызывается один раз на странице преподавателей.
 */
export function provideTeacherDialog(): TeacherDialogSession {
  const session = createTeacherDialogSession();
  provide(teacherDialogKey, session);
  return session;
}

export function useTeacherDialog(): TeacherDialogSession {
  const session = inject(teacherDialogKey);
  if (!session) {
    throw new Error('[teachers] useTeacherDialog() вызван вне provideTeacherDialog()');
  }
  return session;
}
