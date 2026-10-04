import { defineStore } from 'pinia';
import { ref } from 'vue';

import { listLessons, studentGroupRepository, teachingLoadRepository } from '@/api/index.ts';
import type { StudentGroup } from '@/domain/student-group.ts';

/** Ссылки на группу: объекты, которые не дают её удалить (UC-2.3). */
export interface StudentGroupReferences {
  loads: number;
  lessons: number;
  total: number;
}

/** Глобальный справочник студенческих групп — общий для всех проектов. */
export const useStudentGroupStore = defineStore('student-group', () => {
  const studentGroups = ref<StudentGroup[]>(studentGroupRepository.list());

  function refresh(): void {
    studentGroups.value = studentGroupRepository.list();
  }

  /** Считает ссылки из нагрузок и занятий любого проекта. */
  function studentGroupReferences(id: string): StudentGroupReferences {
    const loads = teachingLoadRepository.list().filter((load) => load.groupIds.includes(id)).length;
    const lessons = listLessons().filter((lesson) => lesson.groupIds.includes(id)).length;
    return { loads, lessons, total: loads + lessons };
  }

  /** Создаёт группу; id присваивает «сервер». */
  async function addStudentGroup(request: Omit<StudentGroup, 'id'>): Promise<StudentGroup> {
    const group = studentGroupRepository.create(request);
    refresh();
    return group;
  }

  /** Сохраняет правки карточки группы. */
  async function editStudentGroup(group: StudentGroup): Promise<void> {
    studentGroupRepository.update(group);
    refresh();
  }

  /** Удаляет группу, только если на неё не ссылаются нагрузка или занятие. */
  async function removeStudentGroup(id: string): Promise<void> {
    const references = studentGroupReferences(id);
    if (references.total > 0) {
      throw new Error('Нельзя удалить: на группу ссылаются нагрузка или занятие');
    }
    studentGroupRepository.remove(id);
    refresh();
  }

  return {
    studentGroups,
    studentGroupReferences,
    addStudentGroup,
    editStudentGroup,
    removeStudentGroup,
  };
});
