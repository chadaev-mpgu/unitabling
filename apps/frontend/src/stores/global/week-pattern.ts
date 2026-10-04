import { defineStore } from 'pinia';
import { ref } from 'vue';

import { weekPatternRepository } from '@/api/index.ts';
import type { WeekPattern } from '@/domain/week-pattern.ts';
import { useAcademicCalendarStore } from '@/stores/global/academic-calendar.ts';

/**
 * Ссылки на шаблон недели, мешающие удалению (UC-1.2). Считаются по
 * академическому календарю: defaultPatternId и per-week overrides.
 */
export interface WeekPatternReferences {
  calendar: number;
  total: number;
}

/** Глобальный справочник шаблонов недели — общий для всех проектов. */
export const useWeekPatternStore = defineStore('week-pattern', () => {
  const calendarStore = useAcademicCalendarStore();
  const patterns = ref<WeekPattern[]>(weekPatternRepository.list());

  function refresh(): void {
    patterns.value = weekPatternRepository.list();
  }

  /** Считает ссылки на шаблон по всем академическим календарям. */
  function patternReferences(id: string): WeekPatternReferences {
    let count = 0;
    for (const calendar of calendarStore.calendars) {
      if (calendar.defaultPatternId === id) count += 1;
      count += calendar.overrides.filter((override) => override.patternId === id).length;
    }
    return { calendar: count, total: count };
  }

  async function addPattern(request: Omit<WeekPattern, 'id'>): Promise<WeekPattern> {
    const pattern = weekPatternRepository.create(request);
    refresh();
    return pattern;
  }

  async function editPattern(pattern: WeekPattern): Promise<void> {
    weekPatternRepository.update(pattern);
    refresh();
  }

  /** Удаляет шаблон, только если на него не ссылается академический календарь. */
  async function removePattern(id: string): Promise<void> {
    if (patternReferences(id).total > 0) {
      throw new Error('Нельзя удалить: шаблон используется в академическом календаре');
    }
    weekPatternRepository.remove(id);
    refresh();
  }

  return { patterns, patternReferences, addPattern, editPattern, removePattern };
});
