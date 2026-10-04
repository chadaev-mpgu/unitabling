import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { readValue, scheduleProjectRepository, writeValue } from '@/api/index.ts';
import type { CreateScheduleProjectRequest, ScheduleProject } from '@/domain/schedule-project.ts';

/** Ключ сохранённого выбора проекта (в общем хранилище api-слоя). */
const CURRENT_PROJECT_KEY = 'current-project';

/** Сохранённый выбор, если проект ещё существует; иначе — первый проект. */
function resolveInitialId(projects: ScheduleProject[]): string | null {
  const stored = readValue<string>(CURRENT_PROJECT_KEY);
  if (stored && projects.some(({ id }) => id === stored)) return stored;
  return projects[0]?.id ?? null;
}

/**
 * Проект — одно расписание за период; нагрузка, уроки и календарь привязаны
 * к текущему проекту. Выбор хранится между перезагрузками.
 */
export const useScheduleProjectStore = defineStore('schedule-project', () => {
  const projects = ref<ScheduleProject[]>(scheduleProjectRepository.list());
  const currentProjectId = ref<string | null>(resolveInitialId(projects.value));

  const currentProject = computed<ScheduleProject | null>(
    () => projects.value.find(({ id }) => id === currentProjectId.value) ?? null,
  );

  /** Перечитывает список; если текущий проект исчез — откатывается к первому. */
  function refresh(): void {
    projects.value = scheduleProjectRepository.list();
    if (!projects.value.some(({ id }) => id === currentProjectId.value)) {
      currentProjectId.value = projects.value[0]?.id ?? null;
    }
  }

  /** Выбирает проект и запоминает выбор между перезагрузками. */
  function setCurrentProject(id: string): void {
    if (!projects.value.some((project) => project.id === id)) return;
    currentProjectId.value = id;
    writeValue(CURRENT_PROJECT_KEY, id);
  }

  /** Создаёт проект и сразу делает его текущим. */
  async function addProject(request: CreateScheduleProjectRequest): Promise<ScheduleProject> {
    const created = scheduleProjectRepository.create(request);
    refresh();
    setCurrentProject(created.id);
    return created;
  }

  /** Сохраняет настройки проекта (имя, ссылку на календарь). */
  async function updateProject(next: ScheduleProject): Promise<void> {
    scheduleProjectRepository.update(next);
    refresh();
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    refresh,
    setCurrentProject,
    addProject,
    updateProject,
  };
});
