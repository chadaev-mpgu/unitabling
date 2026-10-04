import { defineStore } from 'pinia';
import { ref } from 'vue';

import { disciplineRepository } from '@/api/index.ts';
import type { Discipline } from '@/domain/discipline.ts';

/** Глобальный справочник дисциплин — общий для всех проектов. */
export const useDisciplineStore = defineStore('discipline', () => {
  const disciplines = ref<Discipline[]>(disciplineRepository.list());

  return { disciplines };
});
