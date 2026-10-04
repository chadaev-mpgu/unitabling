import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { academicCalendarRepository, scheduleProjectRepository } from '@/api/index.ts';
import type { AcademicCalendar } from '@/domain/academic-calendar.ts';
import { useScheduleProjectStore } from '@/stores/project/schedule-project.ts';

/** Ссылки на календарь, мешающие удалению (UC-1.3): проекты, выбравшие его. */
export interface AcademicCalendarReferences {
  projects: number;
  total: number;
}

/** Глобальные академические календари — общие для всех проектов. */
export const useAcademicCalendarStore = defineStore('academic-calendar', () => {
  const projectStore = useScheduleProjectStore();
  const calendars = ref<AcademicCalendar[]>(academicCalendarRepository.list());

  /**
   * Календарь текущего проекта (по его `calendarId`). Пока проект не выбран
   * или ссылка битая — первый календарь, чтобы расписание не оставалось пустым.
   */
  const currentCalendar = computed<AcademicCalendar>(() => {
    const calendar = calendars.value.find(
      ({ id }) => id === projectStore.currentProject?.calendarId,
    );
    const fallback = calendar ?? calendars.value[0];
    if (!fallback) {
      throw new Error('[api] академический календарь не найден: сид не выполнен');
    }
    return fallback;
  });

  function refresh(): void {
    calendars.value = academicCalendarRepository.list();
  }

  /** Считает проекты, выбравшие календарь; такой календарь удалить нельзя. */
  function calendarReferences(id: string): AcademicCalendarReferences {
    const projects = scheduleProjectRepository
      .list()
      .filter(({ calendarId }) => calendarId === id).length;
    return { projects, total: projects };
  }

  async function addCalendar(request: Omit<AcademicCalendar, 'id'>): Promise<AcademicCalendar> {
    const created = academicCalendarRepository.create(request);
    refresh();
    return created;
  }

  async function editCalendar(next: AcademicCalendar): Promise<void> {
    academicCalendarRepository.update(next);
    refresh();
  }

  /** Удаляет календарь, только если он не используется и не единственный. */
  async function removeCalendar(id: string): Promise<void> {
    if (calendarReferences(id).total > 0) {
      throw new Error('Нельзя удалить: календарь используется проектом');
    }
    if (calendars.value.length <= 1) {
      throw new Error('Нельзя удалить единственный календарь');
    }
    academicCalendarRepository.remove(id);
    refresh();
  }

  return {
    calendars,
    currentCalendar,
    calendarReferences,
    refresh,
    addCalendar,
    editCalendar,
    removeCalendar,
  };
});
