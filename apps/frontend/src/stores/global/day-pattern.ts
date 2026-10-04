import { defineStore } from 'pinia';
import { ref } from 'vue';

import { dayPatternRepository } from '@/api/index.ts';
import type { DayPattern } from '@/domain/day-pattern.ts';
import { useWeekPatternStore } from '@/stores/global/week-pattern.ts';

/**
 * Ссылки на шаблон дня, мешающие удалению (UC-1.1). Считаются по шаблонам
 * недели: каждый день недели ссылается на шаблон дня через `templateId`.
 */
export interface DayPatternReferences {
  weeks: number;
  total: number;
}

/** Глобальный справочник шаблонов дня — общий для всех проектов. */
export const useDayPatternStore = defineStore('day-pattern', () => {
  const weekPatternStore = useWeekPatternStore();
  const patterns = ref<DayPattern[]>(dayPatternRepository.list());

  function refresh(): void {
    patterns.value = dayPatternRepository.list();
  }

  /** Считает шаблоны недели, использующие шаблон дня хотя бы в один день. */
  function patternReferences(id: string): DayPatternReferences {
    const count = weekPatternStore.patterns.filter((pattern) =>
      pattern.days.some((day) => day.templateId === id),
    ).length;
    return { weeks: count, total: count };
  }

  async function addPattern(request: Omit<DayPattern, 'id'>): Promise<DayPattern> {
    const pattern = dayPatternRepository.create(request);
    refresh();
    return pattern;
  }

  async function editPattern(pattern: DayPattern): Promise<void> {
    dayPatternRepository.update(pattern);
    refresh();
  }

  /** Удаляет шаблон, только если на него не ссылается ни один шаблон недели. */
  async function removePattern(id: string): Promise<void> {
    if (patternReferences(id).total > 0) {
      throw new Error('Нельзя удалить: шаблон используется в шаблонах недели');
    }
    dayPatternRepository.remove(id);
    refresh();
  }

  return { patterns, patternReferences, addPattern, editPattern, removePattern };
});
