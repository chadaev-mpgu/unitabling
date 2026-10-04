import { computed, inject, provide, ref, type InjectionKey } from 'vue';

import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';

/** Значения формы проекта. */
export interface ProjectFormValues {
  name: string;
  calendarId: string;
}

/**
 * Сессия диалога проекта: только создание (UC-0.1). Методист вводит имя и
 * выбирает календарь; после сохранения проект становится текущим.
 */
function createProjectDialogSession() {
  const projectStore = useScheduleProjectStore();
  const calendarStore = useAcademicCalendarStore();

  const isOpen = ref(false);
  /** Ошибка сохранения, пришедшая с «сервера». */
  const submitError = ref<string | null>(null);

  /** Варианты календаря для выбора. */
  const calendarOptions = computed(() => calendarStore.calendars);

  /** По умолчанию — календарь текущего проекта, иначе первый в списке. */
  const defaultValues = computed<ProjectFormValues>(() => ({
    name: '',
    calendarId: projectStore.currentProject?.calendarId ?? calendarStore.calendars[0]?.id ?? '',
  }));

  function open(): void {
    submitError.value = null;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  /** Создаёт проект; стор делает его текущим. */
  async function submit(values: ProjectFormValues): Promise<void> {
    submitError.value = null;
    try {
      await projectStore.addProject({
        name: values.name.trim(),
        calendarId: values.calendarId,
      });
      close();
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Не удалось создать проект';
    }
  }

  return { isOpen, submitError, calendarOptions, defaultValues, open, close, submit };
}

export type ProjectDialogSession = ReturnType<typeof createProjectDialogSession>;

const projectDialogKey: InjectionKey<ProjectDialogSession> = Symbol('project-dialog');

/** Создаёт сессию диалога и отдаёт её потомкам; вызывается один раз в Header. */
export function provideProjectDialog(): ProjectDialogSession {
  const session = createProjectDialogSession();
  provide(projectDialogKey, session);
  return session;
}

export function useProjectDialog(): ProjectDialogSession {
  const session = inject(projectDialogKey);
  if (!session) {
    throw new Error('[header] useProjectDialog() вызван вне provideProjectDialog()');
  }
  return session;
}
